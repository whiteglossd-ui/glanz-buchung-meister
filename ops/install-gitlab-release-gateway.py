#!/usr/bin/python3 -I
"""Bind a dedicated GitLab public key to the existing Hostinger release account."""

import base64
import fcntl
import os
import pwd
import re
import secrets
import socket
import stat
import subprocess
import sys
import tempfile
from pathlib import Path


ACCOUNT = "white-gloss-ci"
GATEWAY = Path("/usr/local/libexec/white-gloss-gitlab-release")
SUDOERS = Path("/etc/sudoers.d/white-gloss-gitlab-status")
KEY_OPTIONS = b'restrict,command="' + bytes(GATEWAY) + b'"'
SUDO_RULE = f"{ACCOUNT} ALL=(deploy) NOPASSWD: {GATEWAY} --rollback-status\n".encode()
DIRECTORY = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW
KEY_LIMIT = 1024 * 1024


def check(condition, reason):
    if not condition:
        raise ValueError(reason)


def trusted_directory(directory):
    for part in (*reversed(directory.parents), directory):
        status = part.lstat()
        sticky_tmp = part == Path("/tmp") and status.st_mode & stat.S_ISVTX
        check(stat.S_ISDIR(status.st_mode) and status.st_uid == 0 and
              (not status.st_mode & 0o022 or sticky_tmp), f"Unsicheres Verzeichnis: {part}")


def read_asset(path, limit):
    check(path.is_absolute() and ".." not in path.parts, "Ungültiger Dateipfad.")
    trusted_directory(path.parent)
    fd = os.open(path, os.O_RDONLY | os.O_NONBLOCK | os.O_NOFOLLOW)
    with os.fdopen(fd, "rb") as source:
        status = os.fstat(fd)
        check(stat.S_ISREG(status.st_mode) and status.st_uid == 0 and not status.st_mode & 0o022,
              f"Unsichere Quelldatei: {path}")
        data = source.read(limit + 1)
    check(0 < len(data) <= limit, "Ungültige Quelldateigröße.")
    return data


def public_blob(data):
    found = re.fullmatch(rb"ssh-ed25519[ \t]+([A-Za-z0-9+/]+)(?:[ \t]+[^\x00-\x1f\x7f]*)?\n?", data)
    check(found is not None, "Genau ein öffentlicher Ed25519-Schlüssel ist erforderlich.")
    blob = found[1]
    wire = base64.b64decode(blob, validate=True)
    prefix = b"\0\0\0\x0bssh-ed25519\0\0\0\x20"
    check(wire.startswith(prefix) and len(wire) == len(prefix) + 32 and base64.b64encode(wire) == blob,
          "Ungültiger Ed25519-Schlüssel.")
    subprocess.run(["/usr/bin/ssh-keygen", "-lf", "/dev/stdin"], input=b"ssh-ed25519 " + blob + b"\n",
                   stdout=subprocess.DEVNULL, check=True)
    return blob


def install_root_file(path, contents, mode, validate=False):
    trusted_directory(path.parent)
    try:
        existing = path.lstat()
    except FileNotFoundError:
        existing = None
    if existing is not None:
        check(stat.S_ISREG(existing.st_mode) and existing.st_uid == existing.st_gid == 0 and
              stat.S_IMODE(existing.st_mode) == mode and path.read_bytes() == contents,
              f"Vorhandene Installation weicht ab: {path}")
        if validate:
            subprocess.run(["/usr/sbin/visudo", "-cf", str(path)], check=True)
        return

    with tempfile.NamedTemporaryFile(dir=path.parent, prefix=".white-gloss-") as tmp:
        tmp.write(contents)
        tmp.flush()
        os.fchown(tmp.fileno(), 0, 0)
        os.fchmod(tmp.fileno(), mode)
        os.fsync(tmp.fileno())
        if validate:
            subprocess.run(["/usr/sbin/visudo", "-cf", tmp.name], check=True)
        os.link(tmp.name, path)


def checked_directory(directory, uid, strict=False):
    status = os.fstat(directory)
    check(status.st_uid == uid and not status.st_mode & (0o077 if strict else 0o022),
          "Rechte des CI-Verzeichnisses sind unerwartet.")


def existing_keys(directory, uid):
    try:
        fd = os.open("authorized_keys", os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=directory)
    except FileNotFoundError:
        return b"", None
    with os.fdopen(fd, "rb") as source:
        status = os.fstat(fd)
        check(stat.S_ISREG(status.st_mode) and status.st_uid == uid and status.st_nlink == 1 and
              stat.S_IMODE(status.st_mode) == 0o600, "Unsichere authorized_keys.")
        data = source.read(KEY_LIMIT + 1)
        check(len(data) <= KEY_LIMIT, "authorized_keys unerwartet groß.")
        return data, (status.st_dev, status.st_ino, status.st_ctime_ns)


def authorize(directory, uid, blob):
    fcntl.flock(directory, fcntl.LOCK_EX)
    previous, revision = existing_keys(directory, uid)
    # Match OpenSSH's option field, including quoted values with embedded spaces.
    option = rb'(?:[^ \t"\\]|"(?:[^"\\]|\\.)*")+'
    key = re.compile(rb"^[ \t]*(?:(" + option + rb")[ \t]+)?ssh-ed25519[ \t]+([^ \t]+)(?:[ \t]|$)")
    present = False
    for line in previous.splitlines():
        if line.lstrip().startswith(b"#"):
            continue
        entry = key.match(line)
        if entry and entry[2].rstrip(b"=") == blob:
            check(entry[1] == KEY_OPTIONS, "Schlüssel bereits mit anderen Berechtigungen hinterlegt.")
            present = True
    if present:
        return

    new_line = KEY_OPTIONS + b" ssh-ed25519 " + blob + b" gitlab-website-release\n"
    updated = previous + (b"\n" if previous and not previous.endswith(b"\n") else b"") + new_line
    check(len(updated) <= KEY_LIMIT, "authorized_keys würde das Größenlimit überschreiten.")
    name = ".gitlab-release-" + secrets.token_hex(12)
    fd = os.open(name, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600, dir_fd=directory)
    try:
        with os.fdopen(fd, "wb") as target:
            target.write(updated)
            target.flush()
            os.fsync(target.fileno())
        check(existing_keys(directory, uid)[1] == revision, "authorized_keys wurde parallel bearbeitet.")
        os.replace(name, "authorized_keys", src_dir_fd=directory, dst_dir_fd=directory)
        os.fsync(directory)
    finally:
        try:
            os.unlink(name, dir_fd=directory)
        except FileNotFoundError:
            pass


def main():
    check(len(sys.argv) == 2, "Aufruf: install-gitlab-release-gateway.py PFAD_ZUM_ÖFFENTLICHEN_SCHLÜSSEL")
    check(os.geteuid() == 0 and socket.gethostname().split(".")[0] == "srv2077393",
          "Als root auf dem Website-VPS ausführen.")
    account = pwd.getpwnam(ACCOUNT)
    check(account.pw_dir == "/home/white-gloss-ci" and account.pw_uid > 0 and account.pw_gid > 0,
          "Unerwartetes CI-Konto.")
    check(pwd.getpwnam("deploy").pw_uid not in (0, account.pw_uid), "Unerwartetes Website-Laufzeitkonto.")
    blob = public_blob(read_asset(Path(sys.argv[1]).absolute(), 8192))
    gateway = read_asset(Path(__file__).absolute().with_name("gitlab-release-gateway.py"), 128 * 1024)
    os.umask(0o022)
    trusted_directory(GATEWAY.parent.parent)
    GATEWAY.parent.mkdir(mode=0o755, exist_ok=True)
    os.umask(0o077)
    install_root_file(GATEWAY, gateway, 0o755)
    install_root_file(SUDOERS, SUDO_RULE, 0o440, validate=True)

    # From this point, all access to user-controlled paths happens as the account itself.
    os.chdir("/")
    os.setgroups([])
    os.setgid(account.pw_gid)
    os.setuid(account.pw_uid)
    check(os.access(GATEWAY, os.X_OK), "CI-Konto kann den Gateway nicht ausführen.")
    home = os.open(account.pw_dir, DIRECTORY)
    try:
        checked_directory(home, account.pw_uid)
        incoming = os.open("incoming", DIRECTORY, dir_fd=home)
        try:
            checked_directory(incoming, account.pw_uid)
            check(os.access(".", os.W_OK | os.X_OK, dir_fd=incoming), "Uploadverzeichnis nicht beschreibbar.")
        finally:
            os.close(incoming)
        # The existing Hostinger installer provisions .ssh with mode 0700.
        directory = os.open(".ssh", DIRECTORY, dir_fd=home)
        try:
            checked_directory(directory, account.pw_uid, strict=True)
            authorize(directory, account.pw_uid, blob)
        finally:
            os.close(directory)
    finally:
        os.close(home)
    print("Dedizierter GitLab-Schlüssel mit festem Website-Befehl eingerichtet.")


if __name__ == "__main__":
    try:
        main()
    except (ValueError, KeyError, OSError, subprocess.CalledProcessError) as error:
        sys.exit(str(error))
