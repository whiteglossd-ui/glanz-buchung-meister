#!/usr/bin/env python3
"""Provision the dedicated website runner on its VPS with local OAuth consent."""
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import socket
import stat
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

HOST = "https://gitlab-p1va.srv2077393.hstgr.cloud"
PROJECT = "white-gloss/glanz-buchung-meister"
TAG = "white-gloss-website"
CLIENT = "485264dd1182da48fc9801896053d8f99a933fc8ca10b0b4d08157cafae85375"
SCOPES = "api create_runner manage_runner"
LOCAL = Path("/var/lib/white-gloss-gitlab-bootstrap")
INSTALL_SHA = "79a1d7755de3a3fb3fdae2dec870eca0f54250639ca5ae248b405733168959d7"


class Stop(RuntimeError):
    pass


class Http(Stop):
    def __init__(self, method, path, status, reason):
        self.status, self.reason = status, reason
        super().__init__(f"GitLab meldet HTTP {status} bei {method} {path.split('?')[0]}.")


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def request(method, path, data=None, access=None, form=False):
    headers = {"Accept": "application/json"}
    body = None
    if data is not None:
        headers["Content-Type"] = "application/x-www-form-urlencoded" if form else "application/json"
        body = urllib.parse.urlencode(data).encode() if form else json.dumps(data).encode()
    if access:
        headers["Authorization"] = "Bearer " + access
    req = urllib.request.Request(HOST + path, data=body, headers=headers, method=method)
    try:
        with urllib.request.build_opener(NoRedirect()).open(req, timeout=25) as response:
            raw = response.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as err:
        try:
            reason = json.loads(err.read()).get("error")
        except (ValueError, AttributeError):
            reason = None
        raise Http(method, path, err.code, reason) from None


def login():
    offer = request("POST", "/oauth/authorize_device", {"client_id": CLIENT, "scope": SCOPES}, form=True)
    if (offer.get("verification_uri") != HOST + "/oauth/device" or
            not re.fullmatch(r"[A-Za-z0-9-]{4,20}", offer.get("user_code", ""))):
        raise Stop("Die Device-Freigabe passt nicht zur eigenen GitLab-Instanz.")
    print(f"Einmal in Opera öffnen: {HOST}/oauth/device\nCode: {offer['user_code']}", flush=True)
    deadline = time.monotonic() + int(offer["expires_in"])
    interval = max(1, int(offer.get("interval", 5)))
    while time.monotonic() + interval < deadline:
        time.sleep(interval)
        try:
            grant = request("POST", "/oauth/token", {
                "client_id": CLIENT, "device_code": offer["device_code"],
                "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
            }, form=True)
            return grant["access_token"]
        except Http as e:
            if e.reason == "slow_down":
                interval += 5
            elif e.reason != "authorization_pending":
                raise
    raise Stop("Der einmalige Code ist abgelaufen.")


def save_pending(path, data):
    with tempfile.NamedTemporaryFile(mode="w", dir=path.parent, delete=False) as f:
        temp = Path(f.name)
        try:
            json.dump(data, f)
            f.flush()
            os.fsync(f.fileno())
            temp.replace(path)
        finally:
            temp.unlink(missing_ok=True)


def read_pending(path):
    try:
        fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    except FileNotFoundError:
        return None
    with os.fdopen(fd) as f:
        meta = os.fstat(f.fileno())
        if not (stat.S_ISREG(meta.st_mode) and meta.st_uid == 0 and stat.S_IMODE(meta.st_mode) == 0o600):
            raise Stop("Die lokale Runner-Datei muss root gehören und Modus 0600 haben.")
        data = json.load(f)
    if not isinstance(data, dict) or type(data.get("id")) is not int or data["id"] < 1:
        raise Stop("Ungültige lokale Runner-ID.")
    if data == {"id": data["id"], "local_installed": True} and data.get("local_installed") is True:
        return data
    if not (set(data) == {"id", "token"} and isinstance(data["token"], str)
            and re.fullmatch(r"glrt-[A-Za-z0-9_.~-]+", data["token"])):
        raise Stop("Die lokale Runner-Registrierung ist unvollständig.")
    return data


def install_manager(installer, rid, pending):
    token = pending.get("token", "") if pending else ""
    subprocess.run(["bash", str(installer), str(rid), "--token-stdin"], input=token + "\n", text=True, check=True)


def resume_local(installer, project_id, rid):
    path = LOCAL / f"project-{project_id}.json"
    pending = read_pending(path)
    if not pending or pending["id"] != rid:
        raise Stop("Keine passende lokale Registrierung für diese Projekt- und Runner-ID.")
    install_manager(installer, rid, pending)
    # The manager now holds the rotating token. A credential-free receipt permits retries.
    save_pending(path, {"id": rid, "local_installed": True})
    print(f"Website-Projekt #{project_id}: Runner #{rid} ist lokal geprüft und gestartet. "
          "Projektvariablen und Freigabe in GitLab prüfen.")


def setup(access, installer):
    api = "/api/v4"
    project = request("GET", f"{api}/projects/{urllib.parse.quote(PROJECT, safe='')}", access=access)
    project_id = project["id"]
    if not (type(project_id) is int and project_id > 0 and project["path_with_namespace"] == PROJECT
            and project["visibility"] == "private" and not project.get("archived")):
        raise Stop("Ziel muss das private, aktive Website-Projekt sein.")
    repo = f"{api}/projects/{project_id}"
    runners = request("GET", f"{repo}/runners?type=project_type&tag_list={TAG}&per_page=2", access=access)
    if len(runners) > 1:
        raise Stop("Mehrere passende Projekt-Runner. Vorhandene Zuordnung zuerst klären.")
    pending_path = LOCAL / f"project-{project_id}.json"
    pending = read_pending(pending_path)
    if runners:
        rid = runners[0]["id"]
        if pending and pending["id"] != rid:
            raise Stop("Die lokale ausstehende Registrierung gehört zu einer anderen Runner-ID.")
    else:
        if pending:
            raise Stop("Der vorgemerkte Projekt-Runner fehlt im GitLab. Keine zweite Registrierung angelegt.")
        created = request("POST", api + "/user/runners", {
            "runner_type": "project_type", "project_id": project_id, "description": TAG,
            "tag_list": TAG, "run_untagged": False, "locked": True, "paused": True,
            "access_level": "not_protected",
        }, access)
        rid = created["id"]
        pending = {"id": rid, "token": created["token"]}
        save_pending(pending_path, pending)
    detail = request("GET", f"{api}/runners/{rid}", access=access)
    if not (detail.get("description") == TAG and detail.get("runner_type") == "project_type"
            and {p["id"] for p in detail.get("projects", [])} == {project_id}
            and detail.get("locked") and detail.get("run_untagged") is False
            and detail.get("access_level") == "not_protected" and detail.get("tag_list") == [TAG]):
        raise Stop(f"Runner #{rid}: Rechte oder Projektbindung weichen ab.")
    if not pending and detail.get("paused"):
        raise Stop(f"Runner #{rid} ist bereits vorhanden und manuell pausiert.")
    if not pending and not Path("/var/lib/wg-gitlab-web/manager/config.toml").is_file():
        raise Stop(f"Runner #{rid} existiert schon. Dessen glrt lokal mit dem Installer verwenden.")
    install_manager(installer, rid, pending)
    for key, value in (("WHITE_GLOSS_GITLAB_PROJECT_ID", str(project_id)),
                       ("WHITE_GLOSS_GITLAB_RUNNER_ID", str(rid)),
                       ("WEBSITE_ISOLATED_FLOWTESTS_ENABLED", "true")):
        endpoint = repo + "/variables/" + key + "?filter%5Benvironment_scope%5D=%2A"
        try:
            var = request("GET", endpoint, access=access)
        except Http as e:
            if e.status != 404:
                raise
            request("POST", repo + "/variables", {
                "key": key, "value": value, "variable_type": "env_var", "environment_scope": "*",
                "protected": False, "masked": False, "raw": True,
            }, access)
            var = request("GET", endpoint, access=access)
        if (var.get("value") != value or var.get("environment_scope") != "*"
                or var.get("variable_type") != "env_var" or var.get("protected") is not False):
            raise Stop(f"Vorhandene Projektvariable {key} ist abweichend. Keine Überschreibung.")
    if pending and detail.get("paused"):
        result = request("PUT", f"{api}/runners/{rid}", {"paused": False}, access)
        if result.get("paused") is not False:
            raise Stop(f"GitLab hat Runner #{rid} noch nicht freigegeben.")
    pending_path.unlink(missing_ok=True)
    print(f"Website-Projekt #{project_id}: Runner #{rid} registriert und freigegeben. CI-Variablen geprüft.")


def main():
    args = sys.argv[1:]
    if args and not (len(args) == 3 and args[0] == "--resume-local"
                     and all(re.fullmatch(r"[1-9][0-9]{0,18}", arg) for arg in args[1:])):
        raise Stop("Aufruf: bootstrap-gitlab-website-runner.py [--resume-local PROJEKT_ID RUNNER_ID]")
    if os.geteuid() != 0 or socket.gethostname().split(".")[0] != "srv2077393":
        raise Stop("Im Rootterminal von srv2077393 ausführen.")
    os.umask(0o077)
    installer = Path(__file__).resolve().with_name("install-gitlab-website-runner.sh")
    if hashlib.sha256(installer.read_bytes()).hexdigest() != INSTALL_SHA:
        raise Stop("Die Prüfsumme des Website-Installers stimmt nicht.")
    LOCAL.mkdir(mode=0o700, exist_ok=True)
    meta = LOCAL.lstat()
    if not stat.S_ISDIR(meta.st_mode) or meta.st_uid != 0 or stat.S_IMODE(meta.st_mode) != 0o700:
        raise Stop("Das private Verzeichnis für die Einrichtungsdaten ist unsicher.")
    with (LOCAL / "setup.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        if args:
            resume_local(installer, int(args[1]), int(args[2]))
            return
        token = login()
        try:
            setup(token, installer)
        finally:
            try:
                request("POST", "/oauth/revoke", {"client_id": CLIENT, "token": token}, form=True)
            except (Stop, OSError, ValueError):
                print("Die einmalige OAuth-Freigabe gegebenenfalls in GitLab unter Applications widerrufen.", file=sys.stderr)


if __name__ == "__main__":
    try:
        main()
    except (Stop, OSError, ValueError, KeyError, subprocess.CalledProcessError) as exc:
        if isinstance(exc, Stop):
            print(str(exc), file=sys.stderr)
        else:
            print(f"Einrichtung angehalten ({type(exc).__name__}); Details im vorherigen Schritt prüfen.", file=sys.stderr)
        sys.exit(1)
