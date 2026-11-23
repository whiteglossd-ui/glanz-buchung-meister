#!/usr/bin/env python3
"""Repair Ubuntu 26.04 bug 2174446 on the White-Gloss runner host."""
import fcntl
import os
from pathlib import Path
import platform
import pwd
import re
import socket
import stat
import subprocess
import tempfile

PROFILE = Path("/etc/apparmor.d/usr.bin.pasta")
MODES = Path("/sys/kernel/security/apparmor/profiles")
RULE = "  signal (receive) set=(term) peer=podman,\n"
PARSER = "/usr/sbin/apparmor_parser"


def run(*args, check=True):
    process = subprocess.run(args, capture_output=True, text=True, timeout=60)
    if check and process.returncode:
        detail = process.stderr.strip()[-500:]
        raise ValueError(f"{args[0]} (Status {process.returncode}): {detail}")
    return process


def denied():
    journal = run("journalctl", "-b", "-o", "cat", "--no-pager", "-g", "profile=.pasta.",
                  "_TRANSPORT=kernel", "+", "_TRANSPORT=audit", check=False)
    fields = {"apparmor": "DENIED", "operation": "signal", "profile": "pasta",
              "denied_mask": "receive", "signal": "term", "peer": "podman"}
    for line in journal.stdout.splitlines():
        if fields.items() <= dict(re.findall(r'\b(\w+)="?([\w-]+)"?(?=\s|$)', line)).items():
            return True
    # Upstream's exact reproduction, as the website CI user, when the audit is unavailable.
    user = pwd.getpwnam("wg-gitlab-web")
    runtime = f"/run/user/{user.pw_uid}"
    probe = run("runuser", "-u", user.pw_name, "--", "env", "-i", "PATH=/usr/bin:/bin",
                "HOME=" + user.pw_dir, "XDG_RUNTIME_DIR=" + runtime,
                "DBUS_SESSION_BUS_ADDRESS=unix:path=" + runtime + "/bus",
                "/usr/bin/podman", "unshare", "--rootless-netns", "/usr/bin/true", check=False)
    return probe.returncode == 126 and "rootless netns: kill network process: permission denied" in probe.stderr


def safe_file(path):
    meta = path.lstat()
    if not stat.S_ISREG(meta.st_mode) or meta.st_uid != 0 or meta.st_mode & 0o022:
        raise ValueError(f"Unsichere Dateirechte oder Dateityp: {path}")
    return stat.S_IMODE(meta.st_mode)


def write(path, data, mode):
    with tempfile.NamedTemporaryFile(prefix=".wg-pasta-", dir=path.parent, delete=False) as f:
        temp = Path(f.name)
        try:
            f.write(data)
            f.flush()
            os.fchmod(f.fileno(), mode)
            os.fsync(f.fileno())
            temp.replace(path)
        finally:
            temp.unlink(missing_ok=True)


def repair():
    safe_file(PROFILE)
    if run("dpkg-query", "-S", str(PROFILE)).stdout.strip() != f"passt: {PROFILE}":
        raise ValueError("Profil gehört nicht zum Ubuntu-Paket passt.")
    if "pasta (enforce)" not in MODES.read_text().splitlines():
        raise ValueError("Das pasta-Profil muss vor der Reparatur im Modus enforce geladen sein.")
    original = PROFILE.read_text()
    header = r"(?m)^profile pasta /usr/bin/pasta\{,\.avx2\} flags=\(attach_disconnected\) \{[ \t]*$"
    if (not re.search(header, original) or len(re.findall(r"(?m)^\s*}\s*$", original)) != 1
            or not original.rstrip().endswith("}") or run(PARSER, "-N", str(PROFILE)).stdout.split() != ["pasta"]):
        raise ValueError("Profilstruktur weicht ab. Vor einer Anpassung das Paketprofil prüfen.")
    expanded = run(PARSER, "-p", str(PROFILE)).stdout
    for line in expanded.splitlines():
        rule = line.split("#", 1)[0]
        if (re.match(r'^\s*(?:allow\s+)?signal\s+', rule) and re.search(r'\breceive\b', rule)
                and re.search(r'\bterm\b', rule) and re.search(r'\bpeer\s*=\s*"?podman"?\s*,', rule)):
            print("Das pasta-Profil erlaubt SIGTERM von Podman bereits.")
            return
    if not denied():
        raise ValueError("Kein passender Audit-Eintrag oder reproduzierter Fehler. "
                         "Nach einem betroffenen Job das Kerneljournal auf profile=pasta und peer=podman prüfen.")
    target = PROFILE
    include = r'(?m)^[ \t]*#?include\s+(?:if\s+exists\s+)?[<"]local/usr\.bin\.pasta[>"]\s*(?:#.*)?$'
    if re.search(include, original[re.search(header, original).end():]):
        target = PROFILE.parent / "local" / PROFILE.name
    directory = target.parent.lstat()
    if not stat.S_ISDIR(directory.st_mode) or directory.st_uid != 0 or directory.st_mode & 0o022:
        raise ValueError(f"Unsicheres AppArmor-Verzeichnis: {target.parent}")
    try:
        mode = safe_file(target)
        old = target.read_bytes()
    except FileNotFoundError:
        mode, old = 0o644, None
    if target == PROFILE:
        prefix, last = original.rsplit("}", 1)
        new = (prefix + RULE + "}" + last).encode()
    else:
        new = (old or b"").rstrip(b"\n") + b"\n" + RULE.encode()
    write(target, new, mode)
    reloading = False
    try:
        run(PARSER, "-Q", "-K", str(PROFILE))
        reloading = True
        run(PARSER, "-r", "-T", "-W", str(PROFILE))
        if "pasta (enforce)" not in MODES.read_text().splitlines():
            raise ValueError("Erzwingungsmodus konnte nach dem Laden nicht bestätigt werden.")
    except BaseException:
        if old is None:
            target.unlink()
        else:
            write(target, old, mode)
        if reloading:
            run(PARSER, "-r", "-T", "-W", str(PROFILE))
        raise
    print(f"{target}: SIGTERM-Empfang von Podman erlaubt. Nur das pasta-Profil neu geladen (enforce).")


if __name__ == "__main__":
    import sys
    os.environ["PATH"] = "/usr/sbin:/usr/bin:/sbin:/bin"
    release = platform.freedesktop_os_release()
    if (len(sys.argv) != 1 or os.geteuid() != 0 or socket.gethostname().split(".")[0] != "srv2077393"
            or release.get("ID") != "ubuntu" or release.get("VERSION_ID") != "26.04"):
        sys.exit("Ohne Argumente als root auf srv2077393 unter Ubuntu 26.04 ausführen.")
    os.chdir("/")
    try:
        with open("/run/lock/white-gloss-pasta-apparmor.lock", "a") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            repair()
    except (OSError, ValueError, KeyError, subprocess.SubprocessError) as err:
        sys.exit(f"Reparatur angehalten: {err}")
