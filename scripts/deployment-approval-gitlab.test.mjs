import assert from "node:assert/strict";
import test from "node:test";
import { verifyGitLabDeploymentApproval } from "./deployment-approval-gitlab.mjs";

const release = "a".repeat(40);
const env = {
  CI_SERVER_URL: "https://gitlab-p1va.srv2077393.hstgr.cloud", GITLAB_CI: "true",
  CI_PROJECT_ID: "42", WHITE_GLOSS_GITLAB_PROJECT_ID: "42", CI_RUNNER_ID: "3", WHITE_GLOSS_GITLAB_RUNNER_ID: "3",
  CI_PIPELINE_ID: "7", CI_PIPELINE_SOURCE: "push", CI_COMMIT_BRANCH: "main", CI_DEFAULT_BRANCH: "main",
  CI_COMMIT_REF_PROTECTED: "true", CI_ENVIRONMENT_NAME: "production", CI_JOB_MANUAL: "true",
  HOSTINGER_DEPLOY_ENABLED: "true", WEBSITE_ISOLATED_FLOWTESTS_ENABLED: "true", RELEASE_ID: release,
  CI_COMMIT_SHA: release, EXPECTED_CURRENT_RELEASE: "b".repeat(40),
};
function check(overrides = {}, change = () => {}) {
  const branch = [{ name: "main", protected: true, commit: { id: release } }];
  const pipeline = [{ id: 7, project_id: 42, sha: release, source: "push", ref: "main" }];
  const jobs = ["schema", "verify", "flows", "studio", "cross-browser"].map(name => ({
    name, status: "success", commit: { id: release }, allow_failure: false, pipeline: { id: 7 },
  }));
  change({ branch, pipeline, jobs });
  return verifyGitLabDeploymentApproval({ ...env, ...overrides }, async path => {
    if (path.startsWith("projects/42/repository/branches?regex=")) return branch;
    if (path.startsWith("projects/42/pipelines?ref=main&source=push&sha=")) return pipeline;
    assert.equal(path, "projects/42/pipelines/7/jobs?per_page=100&include_retried=false");
    return jobs;
  });
}
test("only a manually released, protected website main with five successful tests passes", () => check());
test("foreign runner, project, source, branch, nonmanual job and stale release fail", async () => {
  for (const [key, value] of Object.entries({
    CI_RUNNER_ID: "5", CI_SERVER_URL: "https://gitlab.com", CI_PROJECT_ID: "222", CI_JOB_MANUAL: "false",
    CI_PIPELINE_SOURCE: "merge_request_event", CI_COMMIT_BRANCH: "feature", CI_COMMIT_REF_PROTECTED: "false",
    RELEASE_ID: "hello", EXPECTED_CURRENT_RELEASE: release, CI_COMMIT_SHA: "c".repeat(40),
    HOSTINGER_DEPLOY_ENABLED: "false", WEBSITE_ISOLATED_FLOWTESTS_ENABLED: "false",
  })) await assert.rejects(check({ [key]: value }));
});
test("job evidence cannot be stale, skipped, incomplete, ambiguous or allowed to fail", async () => {
  for (const change of [
    ({ branch }) => { branch[0].protected = false; },
    ({ branch }) => { branch[0].commit.id = "c".repeat(40); },
    ({ pipeline }) => { pipeline[0].id = 8; },
    ({ jobs }) => { jobs[0].status = "skipped"; },
    ({ jobs }) => { jobs[0].allow_failure = true; },
    ({ jobs }) => { jobs.pop(); },
    ({ jobs }) => { jobs.push(jobs[0]); },
    ({ jobs }) => { jobs[0].commit.id = "c".repeat(40); },
    ({ jobs }) => { jobs[0].pipeline.id = 9; },
  ]) await assert.rejects(check({}, change));
});
