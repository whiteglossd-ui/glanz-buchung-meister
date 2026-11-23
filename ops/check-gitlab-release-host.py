#!/usr/bin/python3 -I
"""Report public SSH pins, the live release and OAuth configuration presence locally."""
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import socket
import stat
import subprocess
import sys

GATEWAY = "/usr/local/libexec/white-gloss-gitlab-release"
SERVICE = "white-gloss.service"
ENV = {"PATH": "/usr/sbin:/usr/bin:/sbin:/bin", "LANG": "C"}


def command(*args, env=ENV):
    return subprocess.check_output(args, stdin=subprocess.DEVNULL, env=env, text=True).strip()


def require(valid, message):
    if not valid:
        raise ValueError(message)


def service_pid():
    props = command("/usr/bin/systemctl", "show", SERVICE, "-p", "MainPID", "-p", "ActiveState", "-p", "User")
    fields = dict(line.split("=", 1) for line in props.splitlines())
    require(fields["ActiveState"] == "active" and fields["User"] == "deploy" and
            re.fullmatch(r"[1-9][0-9]*", fields["MainPID"]), "Website-Dienst nicht eindeutig aktiv.")
    return fields["MainPID"]


def oauth_pair(source):
    # /proc exposes one NUL-separated stream. Retain only short names and
    # whether a selected variable has any non-whitespace bytes, never its value.
    wanted = {b"GOOGLE_CLIENT_ID", b"VITE_GOOGLE_CLIENT_ID", b"GOOGLE_CLIENT_SECRET"}
    present = set()
    name = bytearray()
    in_name = True
    selected = None
    while chunk := source.read(4096):
        for byte in chunk:
            if byte == 0:
                in_name, selected = True, None
                name.clear()
            elif in_name:
                if byte == 61:
                    in_name = False
                    candidate = bytes(name)
                    selected = candidate if candidate in wanted else None
                elif len(name) < 32:
                    name.append(byte)
            elif selected and byte not in b" \t\r\n\v\f":
                present.add(selected)
                selected = None
    return bool(present & {b"GOOGLE_CLIENT_ID", b"VITE_GOOGLE_CLIENT_ID"}) and b"GOOGLE_CLIENT_SECRET" in present


def ssh_public_configuration():
    # OpenSSH -G parses the actual sshd configuration without loading host private keys.
    config = [line.split(" ", 1) for line in command("/usr/sbin/sshd", "-G").splitlines() if " " in line]
    require(any(k == "hostkeyalgorithms" and "ssh-ed25519" in v.split(",") for k, v in config),
            "Ed25519 ist in sshd nicht aktiv.")
    ports = {value.rsplit(":", 1)[-1] for key, value in config if key == "listenaddress"}
    if not ports:
        ports = {value for key, value in config if key == "port"}
    require(len(ports) == 1, "Die sshd-Konfiguration enthält keinen eindeutigen Port.")
    port = ports.pop()
    require(port.isdecimal() and 0 < int(port) <= 65535, "Ungültiger SSH-Port.")
    keys = set()
    for key, path in config:
        if key != "hostkey" or not os.path.isabs(path):
            continue
        public = Path(path + ".pub")
        try:
            metadata = public.lstat()
        except FileNotFoundError:
            continue
        require(stat.S_ISREG(metadata.st_mode) and metadata.st_uid == 0 and
                not metadata.st_mode & 0o022 and metadata.st_size <= 8192, "Unsichere öffentliche Hostkey-Datei.")
        parts = public.read_bytes().split()
        if parts[:1] != [b"ssh-ed25519"]:
            continue
        require(len(parts) >= 2, "Öffentlicher Ed25519-Hostkey unvollständig.")
        blob = base64.b64decode(parts[1], validate=True)
        prefix = b"\0\0\0\x0bssh-ed25519\0\0\0\x20"
        require(blob.startswith(prefix) and len(blob) == len(prefix) + 32 and
                base64.b64encode(blob) == parts[1], "Ungültiger öffentlicher Ed25519-Hostkey.")
        keys.add(blob)
    require(len(keys) == 1, "Kein eindeutiger öffentlicher Ed25519-Hostkey konfiguriert.")
    blob = keys.pop()
    return int(port), "ssh-ed25519 " + base64.b64encode(blob).decode(), "SHA256:" + base64.b64encode(
        hashlib.sha256(blob).digest()).decode().rstrip("=")


def probe(name):
    return command("/usr/sbin/runuser", "-u", "white-gloss-ci", "--", GATEWAY,
                   env={**ENV, "SSH_ORIGINAL_COMMAND": name})


def main():
    require(os.geteuid() == 0 and socket.gethostname().split(".")[0] == "srv2077393",
            "Auf dem Website-VPS als root ausführen.")
    require(len(sys.argv) == 3 and all(re.fullmatch(r"[0-9a-f]{64}", arg) for arg in sys.argv[1:]),
            "Zwei geprüfte SHA-256-Werte für Release-Helfer und Website-Unit erforderlich.")
    active = probe("active")
    require(re.fullmatch(r"[0-9a-f]{40}", active), "Aktiver Website-Commit nicht eindeutig.")
    helper_sha = probe("helper-sha")
    unit_sha = probe("unit-sha")
    require([helper_sha, unit_sha] == sys.argv[1:], "Installierter Helfer oder Unit weicht vom Commit ab.")
    require(probe("can-rollback " + active) == "", "Rückfallprüfung unerwartet.")
    port, public, fingerprint = ssh_public_configuration()
    pid = service_pid()
    with open(f"/proc/{pid}/environ", "rb") as env:
        configured = oauth_pair(env)
    require(service_pid() == pid and probe("active") == active, "Website-Stand hat sich während der Prüfung geändert.")
    print(json.dumps(dict(release=active, release_helper_sha256=helper_sha, unit_sha256=unit_sha,
                          ssh_port=port, ssh_host_public_key=public, ssh_host_fingerprint=fingerprint,
                          google_oauth_runtime_pair=configured), separators=(",", ":")))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, KeyError, OSError, subprocess.CalledProcessError) as error:
        sys.exit(str(error))
