#!/usr/bin/python3 -I
import base64
import hashlib
import importlib.util
import io
import itertools
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
OTHER = "c" * 40
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
    scenario = os.environ["SCENARIO"]
    steps = root / "steps"

    def log(step):
        with steps.open("a") as file:
            print(step, file=file)

    def move_active(sha):
        gw.CURRENT.unlink()
        gw.CURRENT.symlink_to(gw.RELEASES / sha)

    if name == "git":
        assert sys.argv[1:] == ["-c", f"safe.directory={root}", "rev-parse", "HEAD"]
        print(RELEASE)
        return
    if name == "node":
        log(sys.argv[1])
        if sys.argv[1] in ("scripts/deployment-approval-gitlab.mjs", "scripts/deployment-approval.mjs"):
            if scenario == "main-advanced" and steps.read_text().count(sys.argv[1]) == 2:
                sys.exit(1)
            return
        assert sys.argv[1] == "scripts/smoke-production.mjs"
        assert os.environ["SMOKE_BASE_URL"] == "https://white-gloss.de"
        if scenario == "superseded":
            move_active(OTHER)
            sys.exit(1)
        if scenario in ("smoke-failure", "active-unhealthy") and gw.active() == RELEASE:
            sys.exit(1)
        return
    args = sys.argv[1:]
    assert name == "ssh" and args[0] == "-F" and Path(args[1]).is_file()
    if args[2:] in (["-MNf", "production"], ["-O", "exit", "production"]):
        return
    assert len(args) == 4 and args[2] == "production"

    command = args[3]
    log(command)
    if command == "active" and scenario == "invalid-pointer":
        print("invalid")
        return
    if command.startswith("activate ") and scenario == "stale-predecessor":
        move_active(OTHER)

    def helper(action, *arguments):
        release = arguments[0]
        if action == "activate":
            if arguments[2] != gw.active():
                raise gw.Refused("active predecessor changed")
            assert arguments == (RELEASE, str(gw.INCOMING / (RELEASE + ".tgz")), PREVIOUS, DIGEST)
            assert (gw.INCOMING / (RELEASE + ".tgz")).read_bytes() == DATA
            print(OTHER if scenario == "wrong-receipt" else gw.active())
        else:
            assert action == "rollback" and arguments == (PREVIOUS, gw.active())
        move_active(release)
        if action == "activate" and scenario == "lost-receipt":
            sys.exit(255)

    with mock.patch.object(gw, "checked_helper", helper), mock.patch.object(gw.subprocess, "run") as rollback:
        rollback.return_value.stdout = (gw.active() + "\n").encode()
        result = gw.dispatch(command, sys.stdin.buffer)
        if result is not None:
            print(result)


class DeployClientTests(unittest.TestCase):
    def test_explicit_oauth_modes_preserve_artifact_and_partial_secret_guards(self):
        repo = Path(__file__).resolve().parent.parent
        # The "disabled" source selects a secret-free CI artifact. It must not
        # relax partial-secret, artifact-integrity or explicit-mode requirements.
        cases = [
            ("disabled", "", "", False, True),
            ("", "", "", False, False),
            ("unknown", "", "", False, False),
            ("disabled", "", "", True, False),
        ]
        for mode in ("runtime", "disabled"):
            cases.extend([
                (mode, "fixture-client-only", "", False, False),
                (mode, "", "fixture-secret-only", False, False),
            ])
        for provider, (mode, client_id, client_secret, corrupt, succeeds) in itertools.product(
                ("gitlab", "github"), cases):
            with self.subTest(provider=provider, mode=mode, partial=bool(client_id or client_secret),
                              corrupt=corrupt), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                os.symlink(repo / "scripts", root / "scripts")
                os.symlink(repo / "ops", root / "ops")
                (root / "bin").mkdir()
                (root / "incoming").mkdir()
                (root / "current").symlink_to(root / "releases" / PREVIOUS)
                for name in ("ssh", "git", "node"):
                    (root / "bin" / name).symlink_to(Path(__file__).resolve())
                (root / "dummy-key").write_text("test-only")
                (root / "dummy-pins").write_text("test-only")
                (root / "website-release.tgz").write_bytes(DATA + (b"corrupt" if corrupt else b""))
                (root / "website-release.tgz.sha256").write_text(DIGEST + "  website-release.tgz\n")
                env = {
                    "CI_COMMIT_SHA": RELEASE, "CI_PROJECT_DIR": tmp,
                    "PATH": str(root / "bin") + ":" + os.defpath, "FIXTURE": tmp, "TMPDIR": tmp,
                    "SCENARIO": "success", "HOSTINGER_SSH_HOST": "fixture.invalid",
                    "HOSTINGER_SSH_USER": "white-gloss-ci", "HOSTINGER_GOOGLE_OAUTH_SOURCE": mode,
                    "HOSTINGER_SSH_PRIVATE_KEY": str(root / "dummy-key"), "PYTHONDONTWRITEBYTECODE": "1",
                    "HOSTINGER_SSH_KNOWN_HOSTS": str(root / "dummy-pins"),
                    "GOOGLE_CLIENT_ID": client_id, "GOOGLE_CLIENT_SECRET": client_secret,
                }
                if provider == "github":
                    env.update(GITHUB_WORKSPACE=tmp, GITHUB_EVENT_NAME="workflow_run", RELEASE_ID=RELEASE)
                    script = ["bash", "scripts/deploy-guarded-hostinger.sh", "github"]
                else:
                    script = ["bash", "scripts/deploy-gitlab-hostinger.sh"]
                result = subprocess.run(script, cwd=root, env=env, capture_output=True, text=True)
                self.assertEqual(result.returncode == 0, succeeds, result.stderr)
                self.assertEqual((root / "current").readlink().name, RELEASE if succeeds else PREVIOUS)
                self.assertEqual(list((root / "incoming").iterdir()), [])
                steps = (root / "steps").read_text().splitlines()
                if succeeds:
                    self.assertIn(f"upload {RELEASE} {DIGEST}", steps)
                    self.assertIn(f"activate {RELEASE} {PREVIOUS} {DIGEST}", steps)
                    self.assertIn("scripts/smoke-production.mjs", steps)
                else:
                    self.assertFalse(any(step.startswith(("upload ", "activate ")) for step in steps))
                    self.assertNotIn("scripts/smoke-production.mjs", steps)
                for credential in (client_id, client_secret):
                    if credential:
                        self.assertNotIn(credential, result.stdout + result.stderr)
                if client_id or client_secret:
                    self.assertIn("Unvollständige Google-OAuth-Konfiguration", result.stderr)

    def test_verified_client_transfer_and_conditional_rollback(self):
        repo = Path(__file__).resolve().parent.parent
        # Expected live pointer, public smoke calls and conditional recovery calls.
        scenarios = {
            "success": (RELEASE, 1, 0),
            "smoke-failure": (PREVIOUS, 2, 1),
            "lost-receipt": (PREVIOUS, 1, 1),
            "wrong-receipt": (PREVIOUS, 1, 1),
            "stale-predecessor": (OTHER, 0, 0),
            "superseded": (OTHER, 1, 0),
            "main-advanced": (PREVIOUS, 0, 0),
            "invalid-pointer": (PREVIOUS, 0, 0),
            "already-active": (RELEASE, 1, 0),
            "active-unhealthy": (RELEASE, 1, 0),
        }
        for provider, scenario in itertools.product(("gitlab", "github"), scenarios):
            final, smokes, rollbacks = scenarios[scenario]
            with self.subTest(provider=provider, scenario=scenario), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                os.symlink(repo / "scripts", root / "scripts")
                os.symlink(repo / "ops", root / "ops")
                (root / "bin").mkdir()
                (root / "incoming").mkdir()
                original = RELEASE if scenario in ("already-active", "active-unhealthy") else PREVIOUS
                (root / "current").symlink_to(root / "releases" / original)
                for name in ("ssh", "git", "node"):
                    (root / "bin" / name).symlink_to(Path(__file__).resolve())
                (root / "dummy-key").write_text("test-only")
                (root / "dummy-pins").write_text("test-only")
                (root / "website-release.tgz").write_bytes(DATA)
                (root / "website-release.tgz.sha256").write_text(DIGEST + "  website-release.tgz\n")
                env = {"CI_COMMIT_SHA": RELEASE, "CI_PROJECT_DIR": tmp,
                       "PATH": str(root / "bin") + ":" + os.defpath, "FIXTURE": tmp, "TMPDIR": tmp,
                       "SCENARIO": scenario, "HOSTINGER_SSH_HOST": "fixture.invalid",
                       "HOSTINGER_SSH_USER": "white-gloss-ci", "HOSTINGER_GOOGLE_OAUTH_SOURCE": "runtime",
                       "HOSTINGER_SSH_PRIVATE_KEY": str(root / "dummy-key"), "PYTHONDONTWRITEBYTECODE": "1",
                       "HOSTINGER_SSH_KNOWN_HOSTS": str(root / "dummy-pins")}
                if provider == "github":
                    env.update(GITHUB_WORKSPACE=tmp, GITHUB_EVENT_NAME="workflow_run", RELEASE_ID=RELEASE)
                    script = ["bash", "scripts/deploy-guarded-hostinger.sh", "github"]
                    approval = "scripts/deployment-approval.mjs"
                else:
                    script = ["bash", "scripts/deploy-gitlab-hostinger.sh"]
                    approval = "scripts/deployment-approval-gitlab.mjs"
                result = subprocess.run(script,
                                        cwd=root, env=env, capture_output=True, text=True)
                self.assertEqual(result.returncode == 0, scenario in ("success", "already-active"), result.stderr)
                self.assertEqual((root / "current").readlink().name, final)
                self.assertEqual(list((root / "incoming").iterdir()), [])
                steps = (root / "steps").read_text().splitlines()
                self.assertEqual(steps.count(approval),
                                 1 if scenario == "invalid-pointer" else 2)
                self.assertEqual(steps.count("scripts/smoke-production.mjs"), smokes)
                self.assertEqual(steps.count(f"rollback {PREVIOUS} {RELEASE}"), rollbacks)
                if original == RELEASE or scenario == "invalid-pointer":
                    self.assertFalse(any(s.startswith(("upload ", "activate ")) for s in steps))


if __name__ == "__main__":
    if Path(sys.argv[0]).name in ("ssh", "git", "node"):
        fixture_cli(Path(sys.argv[0]).name)
    else:
        unittest.main()
