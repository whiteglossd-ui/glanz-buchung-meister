import { pathToFileURL } from "node:url";

const server = "https://gitlab-p1va.srv2077393.hstgr.cloud";
const jobs = ["schema", "verify", "flows", "studio", "cross-browser"];
const fullSha = /^[a-f0-9]{40}$/;

export async function verifyGitLabDeploymentApproval(env, read) {
  const project = env.WHITE_GLOSS_GITLAB_PROJECT_ID;
  const release = env.RELEASE_ID;
  const pipeline = env.CI_PIPELINE_ID;
  if (env.CI_SERVER_URL !== server || env.GITLAB_CI !== "true" ||
      !/^[1-9][0-9]*$/.test(project ?? "") || project !== env.CI_PROJECT_ID ||
      !/^[1-9][0-9]*$/.test(env.WHITE_GLOSS_GITLAB_RUNNER_ID ?? "") ||
      env.WHITE_GLOSS_GITLAB_RUNNER_ID !== env.CI_RUNNER_ID ||
      !/^[1-9][0-9]*$/.test(pipeline ?? "") || env.CI_PIPELINE_SOURCE !== "push" ||
      env.CI_COMMIT_BRANCH !== "main" || env.CI_DEFAULT_BRANCH !== "main" ||
      env.CI_COMMIT_REF_PROTECTED !== "true" || env.CI_ENVIRONMENT_NAME !== "production" ||
      env.CI_JOB_MANUAL !== "true" || env.HOSTINGER_DEPLOY_ENABLED !== "true" ||
      env.WEBSITE_ISOLATED_FLOWTESTS_ENABLED !== "true") {
    throw new Error("Die manuelle Freigabe benötigt den geschützten main des Website-Projekts.");
  }
  if (!fullSha.test(release ?? "") || release !== env.CI_COMMIT_SHA ||
      !fullSha.test(env.EXPECTED_CURRENT_RELEASE ?? "") || env.EXPECTED_CURRENT_RELEASE === release) {
    throw new Error("Freigegebener und aktiver Produktionscommit müssen vollständig und verschieden sein.");
  }
  const prefix = `projects/${project}`;
  const [branch, latest] = await Promise.all([
    read(`${prefix}/repository/branches?regex=%5Emain%24`),
    read(`${prefix}/pipelines?ref=main&source=push&sha=${release}&order_by=id&sort=desc&per_page=1`),
  ]);
  if (!Array.isArray(branch) || !branch.some(b =>
    b.name === "main" && b.protected === true && b.commit?.id === release)) {
    throw new Error("Der geschützte main hat sich seit der Freigabe geändert.");
  }
  if (!Array.isArray(latest) || latest.length !== 1 || String(latest[0].id) !== pipeline ||
      String(latest[0].project_id) !== project || latest[0].ref !== "main" ||
      latest[0].sha !== release || latest[0].source !== "push") {
    throw new Error("Ein neuerer Prüflauf liegt vor oder der freigegebene Lauf ist nicht belegt.");
  }
  // Only six jobs exist. A full page means the evidence may be incomplete.
  // GitLab omits superseded retry attempts by default.
  const results = await read(`${prefix}/pipelines/${pipeline}/jobs?per_page=100&include_retried=false`);
  if (!Array.isArray(results) || results.length >= 100) throw new Error("Unvollständige GitLab-Jobliste.");
  for (const name of jobs) {
    const matches = results.filter(job => job.name === name);
    if (matches.length !== 1 || matches[0].status !== "success" || matches[0].allow_failure !== false ||
        matches[0].commit?.id !== release || String(matches[0].pipeline?.id) !== pipeline) {
      throw new Error(`Der erforderliche Job ${name} ist für diesen Commit nicht erfolgreich nachgewiesen.`);
    }
  }
}

async function gitLabRead(path) {
  // Default job tokens do not have pipeline/job-list permissions. Prefer an explicitly
  // authorized job token, or use the protected production-scoped read_api credential.
  const token = process.env.GITLAB_RELEASE_READ_TOKEN;
  const headers = token ? { "PRIVATE-TOKEN": token } : { "JOB-TOKEN": process.env.CI_JOB_TOKEN };
  const response = await fetch(`${server}/api/v4/${path}`, {
    headers, redirect: "error", signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`GitLab-Freigabedaten nicht lesbar (HTTP ${response.status}).`);
  return response.json();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await verifyGitLabDeploymentApproval(process.env, gitLabRead);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
