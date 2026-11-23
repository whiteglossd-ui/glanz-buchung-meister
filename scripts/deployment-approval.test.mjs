import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { verifyDeploymentApproval } from "./deployment-approval.mjs";

const sha = "b".repeat(40);
const previous = "a".repeat(40);
const repository = "White-Gloss/glanz-buchung-meister";
const environment = {
  GITHUB_EVENT_NAME: "workflow_dispatch",
  GITHUB_REF: "refs/heads/main",
  GITHUB_SHA: sha,
  GITHUB_REPOSITORY: repository,
  RELEASE_ID: sha,
  EXPECTED_CURRENT_RELEASE: previous,
};
const run = {
  id: 123,
  run_attempt: 2,
  head_sha: sha,
  head_branch: "main",
  head_repository: { full_name: repository },
  event: "push",
  path: ".github/workflows/ci.yml",
  status: "completed",
  conclusion: "success",
};
const jobs = ["verify", "unit", "schema", "studio", "cross-browser"].map((name) => ({
  name,
  head_sha: sha,
  status: "completed",
  conclusion: "success",
}));

function github({ main = sha, runs = [run], runJobs = jobs } = {}) {
  const requests = [];
  return {
    requests,
    async request(path) {
      requests.push(path);
      if (path.endsWith("/git/ref/heads/main")) return { object: { sha: main } };
      if (path.includes("/actions/workflows/ci.yml/runs?")) {
        assert.match(path, new RegExp(`head_sha=${sha}`));
        return { workflow_runs: runs };
      }
      if (path.endsWith("/actions/runs/123/attempts/2/jobs?per_page=100&page=1")) {
        return { total_count: runJobs.length, jobs: runJobs };
      }
      throw new Error(`Unexpected read: ${path}`);
    },
  };
}

test("only an explicit main release with green CI for its exact latest attempt is approved", async () => {
  const api = github();
  assert.deepEqual(await verifyDeploymentApproval(environment, api.request), {
    release: sha,
    expectedCurrent: previous,
    ciRun: 123,
    ciAttempt: 2,
  });
  assert.equal(api.requests.length, 3);
});

test("unconfigured triggers, branch dispatches, mismatched or unsafe IDs stop before API or host access", async () => {
  for (const change of [
    { GITHUB_EVENT_NAME: "workflow_run" },
    { GITHUB_REF: "refs/heads/feature" },
    { GITHUB_SHA: previous },
    { RELEASE_ID: "main" },
    { RELEASE_ID: `${sha}; touch /tmp/not-allowed` },
    { EXPECTED_CURRENT_RELEASE: "" },
    { EXPECTED_CURRENT_RELEASE: "abc1234" },
    { EXPECTED_CURRENT_RELEASE: sha },
  ]) {
    const api = github();
    await assert.rejects(verifyDeploymentApproval({ ...environment, ...change }, api.request));
    assert.equal(api.requests.length, 0);
  }
});

test("moving main invalidates a queued or already built release", async () => {
  const api = github({ main: previous });
  await assert.rejects(verifyDeploymentApproval(environment, api.request), /main/);
  assert.equal(api.requests.length, 1);
});

test("missing, foreign or incomplete CI evidence fails closed", async () => {
  const cases = [
    [],
    [{ ...run, head_sha: previous }],
    [{ ...run, event: "pull_request" }],
    [{ ...run, head_branch: "feature" }],
    [{ ...run, head_repository: { full_name: "other/repository" } }],
    [{ ...run, path: ".github/workflows/other.yml" }],
    [{ ...run, run_attempt: undefined }],
    [{ ...run, status: "in_progress", conclusion: null }],
    [{ ...run, conclusion: "failure" }],
  ];
  for (const runs of cases) {
    await assert.rejects(verifyDeploymentApproval(environment, github({ runs }).request), /CI/);
  }
});

test("a newer queued, failed or cancelled run cannot be hidden by an old successful run", async () => {
  for (const state of [
    { status: "queued", conclusion: null },
    { status: "completed", conclusion: "failure" },
    { status: "completed", conclusion: "cancelled" },
  ]) {
    const runs = [run, { ...run, id: 124, ...state }];
    await assert.rejects(verifyDeploymentApproval(environment, github({ runs }).request), /CI/);
  }
});

test("every required job must have one completed successful result for the release commit", async () => {
  for (const required of jobs) {
    for (const runJobs of [
      jobs.filter((job) => job.name !== required.name),
      [...jobs, required],
      ...["skipped", "failure", "cancelled"].map((conclusion) =>
        jobs.map((job) => job.name === required.name ? { ...job, conclusion } : job)),
      jobs.map((job) => job.name === required.name ? { ...job, head_sha: previous } : job),
      jobs.map((job) => job.name === required.name ? { ...job, status: "in_progress", conclusion: null } : job),
    ]) {
      await assert.rejects(verifyDeploymentApproval(environment, github({ runJobs }).request),
        new RegExp(`Required CI job is missing or unsuccessful: ${required.name}\\.`));
    }
  }
});

test("API errors propagate without approving a release", async () => {
  await assert.rejects(verifyDeploymentApproval(environment, async () => {
    throw new Error("GitHub unavailable");
  }), /unavailable/);
});

test("production workflow requires manual input and rechecks evidence before activation", async () => {
  const workflow = await readFile(new URL("../.github/workflows/deploy-hostinger.yml", import.meta.url), "utf8");
  assert.doesNotMatch(workflow, /^  (?:workflow_run|push|pull_request|schedule):/m);
  assert.match(workflow, /release_sha:\n[\s\S]*?required: true/);
  assert.match(workflow, /expected_current_release:\n[\s\S]*?required: true/);
  const approval = workflow.slice(workflow.indexOf("  approval:\n"), workflow.indexOf("  deploy:\n"));
  assert.doesNotMatch(approval, /secrets\.|\n    environment:/);
  assert.match(workflow, /  deploy:\n    needs: approval/);
  assert.equal(workflow.match(/run: node scripts\/deployment-approval\.mjs/g)?.length, 2);
  assert.match(workflow, /\[\[ "\$expected_release" == "\$EXPECTED_CURRENT_RELEASE" \]\]/);
  assert.match(workflow, /if: always\(\) && steps\.ssh\.outcome == 'success'/);
});

test("workflow input validation explains stale or invalid approvals and fails closed", async () => {
  const workflow = await readFile(new URL("../.github/workflows/deploy-hostinger.yml", import.meta.url), "utf8");
  const match = workflow.match(/- name: Eindeutige Releasefreigabe validieren\n\s+shell: bash\n\s+run: \|\n((?: {10}.+\n)+)/);
  assert.ok(match, "approval validation step must exist");
  const script = match[1].replace(/^ {10}/gm, "");
  const validate = (change) => spawnSync("bash", ["-c", script], {
    env: { ...process.env, ...environment, ...change },
    encoding: "utf8",
  });
  assert.equal(validate({}).status, 0);
  for (const [change, message] of [
    [{ RELEASE_ID: previous }, /release_sha stimmt nicht/],
    [{ RELEASE_ID: "main" }, /40-stellige Commit-IDs/],
    [{ EXPECTED_CURRENT_RELEASE: "" }, /40-stellige Commit-IDs/],
    [{ EXPECTED_CURRENT_RELEASE: sha }, /müssen verschieden sein/],
  ]) {
    const result = validate(change);
    assert.equal(result.status, 1);
    assert.match(result.stdout, message);
  }
});

test("automatic publication binds the target repository and the successful push attempt", async () => {
  const automatic = {
    ...environment,
    GITHUB_EVENT_NAME: "workflow_run", EXPECTED_CURRENT_RELEASE: undefined,
    HOSTINGER_DEPLOY_ENABLED: "true", GITHUB_REPOSITORY_ID: "610",
    HOSTINGER_AUTO_DEPLOY_REPOSITORY_ID: "610", TRIGGER_RUN_ID: "123", TRIGGER_RUN_ATTEMPT: "2",
  };
  const accepted = await verifyDeploymentApproval(automatic, github().request);
  assert.equal(accepted.ciRun, 123);
  for (const change of [
    { HOSTINGER_DEPLOY_ENABLED: "false" }, { HOSTINGER_AUTO_DEPLOY_REPOSITORY_ID: "" },
    { GITHUB_REPOSITORY_ID: "611" }, { GITHUB_EVENT_NAME: "pull_request" },
    { GITHUB_REF: "refs/heads/other" }, { RELEASE_ID: previous },
    { TRIGGER_RUN_ID: "999" }, { TRIGGER_RUN_ATTEMPT: "1" },
  ]) {
    await assert.rejects(verifyDeploymentApproval({ ...automatic, ...change }, github().request));
  }
  await assert.rejects(verifyDeploymentApproval(automatic, github({ main: previous }).request));
  await assert.rejects(verifyDeploymentApproval(automatic, github({ runs: [{ ...run, event: "pull_request" }] }).request));
  await assert.rejects(verifyDeploymentApproval(automatic, github({ runJobs: jobs.slice(1) }).request));
});

test("only the successful same-repository main push can reach the automatic guarded transport", async () => {
  const workflow = await readFile(new URL("../.github/workflows/auto-deploy-hostinger.yml", import.meta.url), "utf8");
  const ci = await readFile(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
  assert.match(workflow, /workflow_run:\n    workflows: \[CI\]\n    types: \[completed\]\n    branches: \[main\]/);
  assert.match(workflow, /head_repository.full_name == github.repository/);
  assert.match(workflow, /head_sha == github.sha/);
  assert.match(workflow, /workflow_run.event == 'push'/);
  assert.match(workflow, /workflow_run.conclusion == 'success'/);
  assert.match(workflow, /needs: approval/);
  assert.match(workflow, /run-id: \$\{\{ github.event.workflow_run.id \}\}/);
  assert.match(workflow, /bash scripts\/deploy-guarded-hostinger.sh github/);
  for (const source of [ci, workflow]) {
    assert.match(source, /name: hostinger-website-\$\{\{ github.sha \}\}/);
    assert.match(source, /vars.HOSTINGER_AUTO_DEPLOY_REPOSITORY_ID == github.repository_id/);
  }
});
