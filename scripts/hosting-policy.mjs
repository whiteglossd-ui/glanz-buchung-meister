import { realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const HOSTING_BLOCK_MESSAGE =
  "WG_LOCAL_HOSTING_BLOCKED: Lokales Hosting ist vom Betreiber gesperrt. " +
  "White-Gloss ausschließlich über den freigegebenen IONOS-Weg betreiben. " +
  "Build, Lint und Typprüfung starten keinen Webserver und bleiben erlaubt.";

export function blockLocalHosting() {
  throw new Error(HOSTING_BLOCK_MESSAGE);
}

// No local override switch. CI=true and a production NODE_ENV do not authorize hosting.
// The provider-specific checks below identify the operator-approved isolated jobs.
export function isIsolatedGithubCi({
  platform = process.platform,
  env = process.env,
  cwd = process.cwd(),
  realpath = realpathSync,
} = {}) {
  const workspace = env.GITHUB_WORKSPACE;
  if (platform !== "linux" || env.GITHUB_ACTIONS !== "true" ||
      env.GITHUB_REPOSITORY !== "White-Gloss/glanz-buchung-meister" ||
      env.GITHUB_WORKFLOW !== "CI" || !/^\d+$/.test(env.GITHUB_RUN_ID || "") ||
      !["github-hosted", "self-hosted"].includes(env.RUNNER_ENVIRONMENT || "") ||
      !workspace) return false;
  try {
    return realpath(cwd) === realpath(workspace);
  } catch {
    return false;
  }
}

export function assertIsolatedGithubCi() {
  if (!isIsolatedGithubCi() && !isIsolatedForgejoCi() && !isIsolatedGitlabCi()) blockLocalHosting();
}

export function isIsolatedForgejoCi({
  platform = process.platform,
  env = process.env,
  cwd = process.cwd(),
  realpath = realpathSync,
} = {}) {
  const workspace = env.FORGEJO_WORKSPACE;
  if (platform !== "linux" || env.FORGEJO_ACTIONS !== "true" ||
      env.FORGEJO_SERVER_URL !== "https://forgejo-h9qr.srv2077393.hstgr.cloud" ||
      env.FORGEJO_REPOSITORY !== "White-Gloss/glanz-buchung-meister-import" ||
      env.WEBSITE_ISOLATED_FLOWTESTS_ENABLED !== "true" ||
      !["flows", "studio", "cross-browser"].includes(env.FORGEJO_JOB || "") ||
      !/^\d+$/.test(env.FORGEJO_RUN_NUMBER || "") || !workspace) return false;
  try {
    return realpath(cwd) === realpath(workspace);
  } catch {
    return false;
  }
}

export function isIsolatedGitlabCi({
  platform = process.platform,
  env = process.env,
  cwd = process.cwd(),
  realpath = realpathSync,
} = {}) {
  const workspace = env.CI_PROJECT_DIR;
  if (platform !== "linux" || env.GITLAB_CI !== "true" || env.CI_SERVER_URL !== "https://gitlab-p1va.srv2077393.hstgr.cloud" ||
      env.CI_DISPOSABLE_ENVIRONMENT !== "true" || env.CI_BUILDS_DIR !== "/builds" ||
      !/^[1-9]\d*$/.test(env.CI_PROJECT_ID || "") || env.CI_PROJECT_ID !== env.WHITE_GLOSS_GITLAB_PROJECT_ID ||
      env.WEBSITE_ISOLATED_FLOWTESTS_ENABLED !== "true" ||
      !["flows", "studio", "cross-browser"].includes(env.CI_JOB_NAME || "") ||
      !/^[1-9]\d*$/.test(env.CI_JOB_ID || "") || !/^[1-9]\d*$/.test(env.CI_PIPELINE_ID || "") ||
      !/^[1-9]\d*$/.test(env.CI_RUNNER_ID || "") || env.CI_RUNNER_ID !== env.WHITE_GLOSS_GITLAB_RUNNER_ID ||
      !env.CI_PROJECT_PATH || !workspace) return false;

  if (env.CI_PIPELINE_SOURCE === "merge_request_event" &&
      (env.CI_MERGE_REQUEST_SOURCE_PROJECT_ID !== env.CI_PROJECT_ID ||
       env.CI_MERGE_REQUEST_TARGET_PROJECT_ID !== env.CI_PROJECT_ID)) return false;
  if (!["merge_request_event", "push", "web", "api"].includes(env.CI_PIPELINE_SOURCE || "")) return false;

  try {
    const tags = JSON.parse(env.CI_RUNNER_TAGS || "null");
    const checkout = realpath(workspace);
    // Docker executors may add runner/concurrency directories before the namespace.
    return Array.isArray(tags) && tags.includes("white-gloss-website") &&
      checkout.startsWith(realpath(env.CI_BUILDS_DIR) + "/") &&
      checkout.endsWith("/" + env.CI_PROJECT_PATH) && realpath(cwd) === checkout;
  } catch {
    return false;
  }
}

// The temporary Studio database and media storage are enabled only inside these CI flows.
export function isIsolatedStudioCi() {
  return isIsolatedGithubCi() || isIsolatedGitlabCi();
}

/** @param {string | URL} entryUrl */
export function isActiveIonosRelease(entryUrl, {
  platform = process.platform,
  cwd = process.cwd(),
  realpath = realpathSync,
} = {}) {
  if (platform !== "linux") return false;
  try {
    const server = realpath(dirname(fileURLToPath(entryUrl)));
    const active = realpath("/srv/white-gloss-current");
    return /^\/srv\/white-gloss-releases\/[0-9a-f]{40}$/.test(active) &&
      realpath(cwd) === active && server === resolve(active, ".output/server");
  } catch {
    return false;
  }
}

/** @param {string | URL} entryUrl */
export function assertProductionHosting(entryUrl) {
  if (!isIsolatedGithubCi() && !isIsolatedForgejoCi() && !isIsolatedGitlabCi() && !isActiveIonosRelease(entryUrl)) blockLocalHosting();
}

