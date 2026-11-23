#!/usr/bin/python3 -I
import base64
import hashlib
import importlib.util
import io
import os
from pathlib import Path
import stat
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("gateway", Path(__file__).resolve().with_name("gitlab-release-gateway.py"))
gw = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gw)
RELEASE = "a" * 40
PREVIOUS = "b" * 40
DATA = b"artifact" * 20000
DIGEST = hashlib.sha256(DATA).hexdigest()


class GatewayTests(unittest.TestCase):
    def setUp(self):
        area = tempfile.TemporaryDirectory()
        self.addCleanup(area.cleanup)
        self.base = Path(area.name)
        self.incoming = self.base / "incoming"
        self.incoming.mkdir(mode=0o750)
        self.archive = self.incoming / (RELEASE + ".tgz")
        for name, value in (("INCOMING", self.incoming), ("RELEASES", self.base / "releases"),
                            ("CURRENT", self.base / "current")):
            patch = mock.patch.object(gw, name, value)
            patch.start()
            self.addCleanup(patch.stop)

    def call(self, command, data=b""):
        return gw.dispatch(command, io.BytesIO(data))

    def test_upload_verify_retry_and_discard(self):
        upload = f"upload {RELEASE} {DIGEST}"
        self.assertEqual(self.call(upload, DATA), DIGEST)
        self.assertEqual(self.archive.read_bytes(), DATA)
        self.assertEqual(stat.S_IMODE(self.archive.stat().st_mode), 0o600)
        inode = self.archive.stat().st_ino
        self.assertEqual(self.call(upload, DATA), DIGEST)
        self.assertEqual(self.archive.stat().st_ino, inode)
        self.assertEqual(self.call("archive-sha " + RELEASE), DIGEST)
        with self.assertRaises(gw.Refused):
            self.call(f"discard {RELEASE} " + "f" * 64)
        self.assertEqual(self.call("archive-sha " + RELEASE), DIGEST)
        self.call(f"discard {RELEASE} {DIGEST}")
        self.call(f"discard {RELEASE} {DIGEST}")
        self.assertEqual(list(self.incoming.iterdir()), [])

    def test_bounded_transfer_preserves_existing_archive_and_recovers_stale_slot(self):
        (self.incoming / gw.PARTIAL).write_bytes(b"interrupted")
        with self.assertRaises(gw.Refused):
            self.call(f"upload {RELEASE} {DIGEST}", b"truncated")
        self.assertEqual(list(self.incoming.iterdir()), [])
        for limit in ("MAX_ARCHIVE", "MAX_PENDING"):
            with self.subTest(limit), mock.patch.object(gw, limit, 20), self.assertRaises(gw.Refused):
                self.call(f"upload {RELEASE} {DIGEST}", DATA)
            self.assertEqual(list(self.incoming.iterdir()), [])
        self.archive.write_bytes(b"prior content")
        with self.assertRaises(gw.Refused):
            self.call(f"upload {RELEASE} {DIGEST}", DATA)
        self.assertEqual(self.archive.read_bytes(), b"prior content")
        with mock.patch.object(gw, "MAX_PENDING_FILES", 1), self.assertRaises(gw.Refused):
            self.call(f"upload {PREVIOUS} {DIGEST}", DATA)

    def test_symlink_and_fifo_are_never_opened_for_writing(self):
        outside = self.base / "outside"
        outside.write_bytes(b"unchanged")
        self.archive.symlink_to(outside)
        for command in (f"upload {RELEASE} {DIGEST}", f"discard {RELEASE} {DIGEST}", f"archive-sha {RELEASE}"):
            with self.subTest(command), self.assertRaises((gw.Refused, OSError)):
                self.call(command, DATA)
        self.assertEqual(outside.read_bytes(), b"unchanged")
        self.archive.unlink()
        os.mkfifo(self.archive)
        with self.assertRaises(gw.Refused):
            self.call(f"upload {RELEASE} {DIGEST}", DATA)

    def test_only_exact_command_grammar_reaches_helper(self):
        with mock.patch.object(gw.subprocess, "run") as run:
            for command in ("", "sh", "internal-sftp", "scp -t incoming", "active\n", "active extra",
                            "status /etc/passwd", f"upload ../{RELEASE} {DIGEST}", f"upload {RELEASE} {DIGEST.upper()}",
                            f"activate {RELEASE} {DIGEST}", f"activate {RELEASE} {RELEASE} {DIGEST}",
                            f"activate {RELEASE} {PREVIOUS} {DIGEST};", f"rollback {PREVIOUS}",
                            f"rollback {PREVIOUS}\t{RELEASE}", "--rollback-status"):
                with self.subTest(command), self.assertRaises(gw.Refused):
                    self.call(command)
            run.assert_not_called()
            self.call(f"activate {RELEASE} {PREVIOUS} {DIGEST}")
            self.assertEqual(run.call_args.args[0], ["/usr/bin/sudo", "-n", "--", gw.HELPER, "activate",
                             RELEASE, str(self.archive), PREVIOUS, DIGEST])
            self.call(f"rollback {PREVIOUS} {RELEASE}")
            self.assertEqual(run.call_args.args[0], ["/usr/bin/sudo", "-n", "--", gw.HELPER,
                             "rollback", PREVIOUS, RELEASE])

    def test_active_pointer_and_exact_rollback_contract(self):
        target = gw.RELEASES / PREVIOUS
        (target / ".output/server").mkdir(parents=True)
        (target / ".output/server/index.mjs").write_bytes(b"//entry")
        contract = target / ".output/booking-workflow.contract"
        contract.write_bytes(gw.CONTRACT)
        gw.CURRENT.symlink_to(target)
        self.assertEqual(self.call("active"), PREVIOUS)
        self.assertEqual(gw.rollback_status(), PREVIOUS)
        with mock.patch.object(gw.subprocess, "run") as run:
            run.return_value.stdout = (PREVIOUS + "\n").encode()
            self.call("can-rollback " + PREVIOUS)
            self.assertEqual(run.call_args.args[0], ["/usr/bin/sudo", "-n", "-u", "deploy", "--",
                                                      gw.GATEWAY, "--rollback-status"])
            with self.assertRaises(gw.Refused):
                self.call("can-rollback " + RELEASE)
        contract.write_bytes(gw.CONTRACT + b"wrong")
        with self.assertRaises(gw.Refused):
            gw.rollback_status()
        gw.CURRENT.unlink()
        gw.CURRENT.symlink_to(self.base / PREVIOUS)
        with self.assertRaises(gw.Refused):
            self.call("active")


class InstallTests(unittest.TestCase):
    def test_dedicated_key_restrictions_and_existing_authorizations(self):
        spec = importlib.util.spec_from_file_location("installer", Path(__file__).resolve().with_name(
            "install-gitlab-release-gateway.py"))
        installer = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(installer)
        wire = bytes.fromhex("0000000b") + b"ssh-ed25519" + bytes.fromhex("00000020") + b"x" * 32
        blob = base64.b64encode(wire)
        public = b"ssh-ed25519 " + blob
        self.assertEqual(installer.public_blob(public + b" dummy public fixture\n"), blob)
        with self.assertRaises(ValueError):
            installer.public_blob(public + b"\n" + public)
        with tempfile.TemporaryDirectory() as tmp:
            directory = os.open(tmp, installer.DIRECTORY)
            self.addCleanup(os.close, directory)
            keys = Path(tmp) / "authorized_keys"
            prior = b"# existing account"
            keys.write_bytes(prior)
            keys.chmod(0o600)
            installer.authorize(directory, os.getuid(), blob)
            expected = prior + b'\nrestrict,command="/usr/local/libexec/white-gloss-gitlab-release" ' + public
            expected += b" gitlab-website-release\n"
            self.assertEqual(keys.read_bytes(), expected)
            installer.authorize(directory, os.getuid(), blob)
            self.assertEqual(keys.read_bytes(), expected)
            for options in (b"", b'command="other command" '):
                keys.write_bytes(options + public + b"\n")
                with self.assertRaises(ValueError):
                    installer.authorize(directory, os.getuid(), blob)
                self.assertEqual(keys.read_bytes(), options + public + b"\n")


def fixture_cli(name):
    """Use the actual gateway protocol with a scratch server pointer and no network."""
    root = Path(os.environ["FIXTURE"])
    gw.INCOMING, gw.CURRENT, gw.RELEASES = root / "incoming", root / "current", root / "releases"
    gw.HELPER, gw.UNIT = "scripts/deploy-ionos-release.sh", "ops/white-gloss.service"
    if name == "git":
        assert sys.argv[1:] == ["rev-parse", "HEAD"]
        print(RELEASE)
        return
    if name == "node":
        with (root / "steps").open("a") as log:
            print(sys.argv[1], file=log)
        if sys.argv[1] == "scripts/deployment-approval-gitlab.mjs":
            return
        assert sys.argv[1] == "scripts/smoke-production.mjs"
        assert os.environ["SMOKE_BASE_URL"] == "https://white-gloss.de"
        if os.environ["SCENARIO"] == "smoke-failure" and gw.active() == RELEASE:
            sys.exit(1)
        return
    args = sys.argv[1:]
    assert name == "ssh" and args[0] == "-F" and Path(args[1]).is_file()
    if args[2:] in (["-MNf", "production"], ["-O", "exit", "production"]):
        return
    assert len(args) == 4 and args[2] == "production"

    def helper(action, *arguments):
        release = arguments[0]
        if action == "activate":
            assert arguments == (RELEASE, str(gw.INCOMING / (RELEASE + ".tgz")), gw.active(), DIGEST)
            assert (gw.INCOMING / (RELEASE + ".tgz")).read_bytes() == DATA
            print(gw.active())
        else:
            assert action == "rollback" and arguments == (PREVIOUS, gw.active())
        gw.CURRENT.unlink()
        gw.CURRENT.symlink_to(gw.RELEASES / release)

    with mock.patch.object(gw, "checked_helper", helper), mock.patch.object(gw.subprocess, "run") as rollback:
        rollback.return_value.stdout = (gw.active() + "\n").encode()
        result = gw.dispatch(args[3], sys.stdin.buffer)
        if result is not None:
            print(result)


class DeployClientTests(unittest.TestCase):
    def test_verified_client_transfer_and_conditional_rollback(self):
        repo = Path(__file__).resolve().parent.parent
        for scenario in ("success", "smoke-failure", "stale"):
            with self.subTest(scenario), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                os.symlink(repo / "scripts", root / "scripts")
                os.symlink(repo / "ops", root / "ops")
                (root / "bin").mkdir()
                (root / "incoming").mkdir()
                original = "c" * 40 if scenario == "stale" else PREVIOUS
                (root / "current").symlink_to(root / "releases" / original)
                for name in ("ssh", "git", "node"):
                    (root / "bin" / name).symlink_to(Path(__file__).resolve())
                (root / "dummy-key").write_text("test-only")
                (root / "dummy-pins").write_text("test-only")
                (root / "website-release.tgz").write_bytes(DATA)
                (root / "website-release.tgz.sha256").write_text(DIGEST + "  website-release.tgz\n")
                env = {"PATH": str(root / "bin") + ":" + os.defpath, "FIXTURE": tmp, "TMPDIR": tmp,
                       "SCENARIO": scenario, "HOSTINGER_SSH_HOST": "fixture.invalid",
                       "HOSTINGER_SSH_USER": "white-gloss-ci", "HOSTINGER_GOOGLE_OAUTH_SOURCE": "runtime",
                       "HOSTINGER_SSH_PRIVATE_KEY": str(root / "dummy-key"), "PYTHONDONTWRITEBYTECODE": "1",
                       "HOSTINGER_SSH_KNOWN_HOSTS": str(root / "dummy-pins")}
                result = subprocess.run(["bash", "scripts/deploy-gitlab-hostinger.sh", RELEASE, PREVIOUS],
                                        cwd=root, env=env, capture_output=True, text=True)
                self.assertEqual(result.returncode == 0, scenario == "success", result.stderr)
                self.assertEqual((root / "current").readlink().name, RELEASE if scenario == "success" else original)
                self.assertEqual(list((root / "incoming").iterdir()), [])
                steps = (root / "steps").read_text().splitlines()
                self.assertEqual(steps.count("scripts/deployment-approval-gitlab.mjs"),
                                 1 if scenario == "stale" else 2)


if __name__ == "__main__":
    if Path(sys.argv[0]).name in ("ssh", "git", "node"):
        fixture_cli(Path(sys.argv[0]).name)
    else:
        unittest.main()
