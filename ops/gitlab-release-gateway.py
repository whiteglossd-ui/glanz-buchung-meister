#!/usr/bin/python3 -I
"""OpenSSH forced command for the dedicated GitLab website deployment key."""

import contextlib
import fcntl
import hashlib
import os
from pathlib import Path
import pwd
import re
import signal
import stat
import subprocess
import sys

GATEWAY = "/usr/local/libexec/white-gloss-gitlab-release"
HELPER = "/usr/local/sbin/white-gloss-deploy"
UNIT = "/etc/systemd/system/white-gloss.service"
CURRENT = Path("/srv/white-gloss-current")
RELEASES = Path("/srv/white-gloss-releases")
INCOMING = Path("/home/white-gloss-ci/incoming")
CONTRACT = b"white-gloss-booking-workflow=1\n"
COMMIT = r"[0-9a-f]{40}"
DIGEST = r"[0-9a-f]{64}"
CHUNK = 128 * 1024
MAX_ARCHIVE = 256 * 1024 * 1024
MAX_PENDING = 512 * 1024 * 1024
MAX_PENDING_FILES = 16
PARTIAL = ".gitlab-website-upload.partial"
CLEAN_ENV = {"PATH": "/usr/sbin:/usr/bin:/sbin:/bin", "LANG": "C"}


class Refused(Exception):
    pass


def active():
    linked = CURRENT.parent / os.readlink(CURRENT)
    if linked.parent != RELEASES or not re.fullmatch(COMMIT, linked.name):
        raise Refused("invalid active release link")
    return linked.name


def rollback_status():
    release = active()
    base = RELEASES / release
    entry = base / ".output/server/index.mjs"
    contract = base / ".output/booking-workflow.contract"
    if base.is_symlink() or not entry.is_file() or entry.stat().st_size == 0 or contract.is_symlink():
        raise Refused("release is not rollback-ready")
    with contract.open("rb") as source:
        if source.read(len(CONTRACT) + 1) != CONTRACT:
            raise Refused("release is not rollback-ready")
    if active() != release:
        raise Refused("active release changed")
    return release


@contextlib.contextmanager
def incoming():
    fd = os.open(INCOMING, os.O_DIRECTORY | os.O_NOFOLLOW | os.O_RDONLY)
    try:
        info = os.fstat(fd)
        if info.st_uid != os.geteuid() or info.st_mode & 0o022:
            raise Refused("unsafe incoming directory")
        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        yield fd
    finally:
        os.close(fd)


def account_file(fd, name):
    handle = os.open(name, os.O_NOFOLLOW | os.O_NONBLOCK | os.O_RDONLY, dir_fd=fd)
    file = os.fdopen(handle, "rb")
    info = os.fstat(handle)
    if not stat.S_ISREG(info.st_mode) or info.st_uid != os.geteuid() or info.st_mode & 0o022:
        file.close()
        raise Refused("unsafe incoming file")
    return file


def archive_digest(fd, name):
    with account_file(fd, name) as source:
        if not 0 < os.fstat(source.fileno()).st_size <= MAX_ARCHIVE:
            raise Refused("archive size out of bounds")
        return hashlib.file_digest(source, "sha256").hexdigest()


def copy_verified(source, limit, expected, destination=None):
    digest = hashlib.sha256()
    total = 0
    while data := source.read(min(CHUNK, limit - total + 1)):
        total += len(data)
        if total > limit:
            raise Refused("archive exceeds transfer limit")
        digest.update(data)
        if destination is not None:
            destination.write(data)
    if total == 0 or digest.hexdigest() != expected:
        raise Refused("archive checksum differs")


def upload(fd, name, expected, source):
    # A single locked slot bounds simultaneous uploads. Recover the slot after a
    # disconnect or reboot. Existing finalized archives are never overwritten.
    try:
        with account_file(fd, PARTIAL):
            os.unlink(PARTIAL, dir_fd=fd)
    except FileNotFoundError:
        pass
    try:
        existing = archive_digest(fd, name)
    except FileNotFoundError:
        existing = None
    if existing is not None:
        if existing != expected:
            raise Refused("another archive already exists for this release")
        copy_verified(source, MAX_ARCHIVE, expected)
        return expected
    staged = [p for p in os.listdir(fd) if re.fullmatch(COMMIT + r"\.tgz", p)]
    pending = sum(os.stat(p, dir_fd=fd, follow_symlinks=False).st_size for p in staged)
    limit = min(MAX_ARCHIVE, MAX_PENDING - pending)
    if limit <= 0 or len(staged) >= MAX_PENDING_FILES:
        raise Refused("incoming quota reached")
    staging = os.open(PARTIAL, os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW | os.O_WRONLY, 0o600, dir_fd=fd)
    try:
        with os.fdopen(staging, "wb") as file:
            copy_verified(source, limit, expected, file)
            file.flush()
            os.fsync(file.fileno())
        os.link(PARTIAL, name, src_dir_fd=fd, dst_dir_fd=fd, follow_symlinks=False)
        os.fsync(fd)
        return expected
    finally:
        os.unlink(PARTIAL, dir_fd=fd)


def checked_helper(*args):
    subprocess.run(["/usr/bin/sudo", "-n", "--", HELPER, *args], stdin=subprocess.DEVNULL,
                   env=CLEAN_ENV, check=True)


def dispatch(command, source):
    # Parse the original command as a strict protocol. Never pass it to a shell.
    if not command or len(command) > 240:
        raise Refused("unknown release command")
    if command == "active":
        return active()
    if command in ("helper-sha", "unit-sha"):
        with open(HELPER if command == "helper-sha" else UNIT, "rb") as file:
            return hashlib.file_digest(file, "sha256").hexdigest()
    if match := re.fullmatch(f"can-rollback ({COMMIT})", command):
        status = subprocess.run(["/usr/bin/sudo", "-n", "-u", "deploy", "--", GATEWAY, "--rollback-status"],
                                env=CLEAN_ENV, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, check=True)
        if status.stdout != (match[1] + "\n").encode("ascii"):
            raise Refused("unexpected rollback target")
        return None
    if match := re.fullmatch(f"(upload|discard) ({COMMIT}) ({DIGEST})", command):
        action, release, digest = match.groups()
        name = release + ".tgz"
        with incoming() as fd:
            if action == "upload":
                return upload(fd, name, digest, source)
            try:
                if archive_digest(fd, name) != digest:
                    raise Refused("refusing to remove another archive")
                os.unlink(name, dir_fd=fd)
            except FileNotFoundError:
                pass
        return None
    if match := re.fullmatch(f"archive-sha ({COMMIT})", command):
        with incoming() as fd:
            return archive_digest(fd, match[1] + ".tgz")
    if match := re.fullmatch(f"activate ({COMMIT}) ({COMMIT}) ({DIGEST})", command):
        release, previous, digest = match.groups()
        if release == previous:
            raise Refused("release and predecessor must differ")
        checked_helper("activate", release, str(INCOMING / (release + ".tgz")), previous, digest)
        return None
    if match := re.fullmatch(f"rollback ({COMMIT}) ({COMMIT})", command):
        previous, failed = match.groups()
        if previous == failed:
            raise Refused("release and predecessor must differ")
        checked_helper("rollback", previous, failed)
        return None
    raise Refused("unknown release command")


def timeout(_sig, _frame):
    raise Refused("transfer timed out")


def main():
    os.umask(0o077)
    if sys.argv[1:] == ["--rollback-status"] and os.geteuid() == pwd.getpwnam("deploy").pw_uid:
        print(rollback_status())
    elif len(sys.argv) == 1 and os.geteuid() == pwd.getpwnam("white-gloss-ci").pw_uid:
        command = os.environ.get("SSH_ORIGINAL_COMMAND", "")
        if command.startswith("upload "):
            signal.signal(signal.SIGALRM, timeout)
            signal.alarm(300)
        result = dispatch(command, sys.stdin.buffer)
        if result is not None:
            print(result)
    else:
        raise Refused("wrong release account or invocation")


if __name__ == "__main__":
    try:
        main()
    except (Refused, OSError, ValueError, KeyError, subprocess.CalledProcessError) as error:
        sys.exit(f"GitLab release gateway: {error}")
