import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { verifyForgejoDeploymentApproval } from "./deployment-approval-forgejo.mjs";

const repository = "White-Gloss/glanz-buchung-meister-import";
const release = "a".repeat(40);
const previous = "b".repeat(40);
const env = {
  FORGEJO_ACTIONS: "true",
  FORGEJO_SERVER_URL: "https://forgejo-h9qr.srv2077393.hstgr.cloud",
  FORGEJO_REPOSITORY: repository,
  FORGEJO_EVENT_NAME: "workflow_dispatch",
  FORGEJO_REF: "refs/heads/main",
  FORGEJO_SHA: release,
  RELEASE_ID: release,
  EXPECTED_CURRENT_RELEASE: previous,
};
const run = {
  id: 60, index_in_repo: 8, workflow_id: "website-ci.yml",
  prettyref: "main", event: "push", commit_sha: release, status: "success",
};
const statuses = ["verify", "schema", "flows", "studio", "cross-browser"].map((job, index) => ({
  id: index + 80, context: `Website-Checks / ${job} (push)`, status: "success",
  target_url: `/${repository}/actions/runs/${run.index_in_repo}/jobs/${index}`,
}));

function api({ current = release, runs = [run], checks = statuses } = {}) {
  return async path => {
    if (path.endsWith("/branches/main")) return { commit: { id: current } };
    if (path.includes("/actions/runs?")) return { workflow_runs: runs };
    if (path.includes(`/commits/${release}/statuses?`)) return checks;
    throw new Error(`Unexpected API request: ${path}`);
  };
}

test("Forgejo approves only the selected main commit with CI evidence from one successful push", async () => {
  assert.deepEqual(await verifyForgejoDeploymentApproval(env, api()), {
    release, expectedCurrent: previous, ciRun: run.index_in_repo,
  });
  await assert.rejects(verifyForgejoDeploymentApproval(env, api({ current: previous })), /main/);
  await assert.rejects(verifyForgejoDeploymentApproval({ ...env, FORGEJO_EVENT_NAME: "push" }, api()), /manuellen/);
});

test("a newer pending run, skipped job, or status from another run blocks production", async () => {
  await assert.rejects(verifyForgejoDeploymentApproval(env, api({
    runs: [run, { ...run, id: 61, index_in_repo: 9, status: "running" }],
  })), /jüngste CI-Lauf/);
  await assert.rejects(verifyForgejoDeploymentApproval(env, api({ checks: statuses.slice(0, -1) })), /cross-browser/);
  await assert.rejects(verifyForgejoDeploymentApproval(env, api({
    checks: [...statuses, {
      ...statuses[0], id: 90, target_url: `/${repository}/actions/runs/7/jobs/0`,
    }],
  })), /verify/);
});

test("Forgejo publication has no automatic trigger and rechecks CI before activation", async () => {
  const source = await readFile(new URL("../.forgejo/workflows/deploy-hostinger.yml", import.meta.url), "utf8");
  assert.doesNotMatch(source, /^  (?:push|pull_request|schedule|workflow_run):/m);
  assert.match(source, /vars\.HOSTINGER_DEPLOY_ENABLED == 'true'/);
  assert.match(source, /vars\.WEBSITE_ISOLATED_FLOWTESTS_ENABLED == 'true'/);
  assert.equal(source.match(/run: node scripts\/deployment-approval-forgejo\.mjs/g)?.length, 2);
  assert.match(source, /ssh hostinger-production.*\n\s+"sudo -n \/usr\/local\/sbin\/white-gloss-deploy rollback/);
});
