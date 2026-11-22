import { pathToFileURL } from "node:url";

const server = "https://forgejo-h9qr.srv2077393.hstgr.cloud";
const repository = "White-Gloss/glanz-buchung-meister-import";
const workflow = "website-ci.yml";
const requiredJobs = ["verify", "schema", "flows", "studio", "cross-browser"];
const shaPattern = /^[a-f0-9]{40}$/;

async function listPages(request, path, select) {
  const entries = [];
  const limit = 50;
  for (let page = 1; page <= 40; page += 1) {
    const batch = select(await request(`${path}?limit=${limit}&page=${page}`));
    if (!Array.isArray(batch) || batch.length > limit) {
      throw new Error("Forgejo hat unvollständige Prüfdaten geliefert.");
    }
    entries.push(...batch);
    if (batch.length < limit) return entries;
  }
  throw new Error("Forgejo-Prüfdaten lassen sich nicht vollständig bestätigen.");
}

function latestById(entries) {
  if (entries.some(entry => !Number.isSafeInteger(entry.id) || entry.id < 1)) {
    throw new Error("Ungültige Forgejo-Prüfdaten.");
  }
  return [...entries].sort((left, right) => right.id - left.id)[0];
}

export async function verifyForgejoDeploymentApproval(env, request) {
  const release = env.RELEASE_ID;
  const expectedCurrent = env.EXPECTED_CURRENT_RELEASE;
  if (env.FORGEJO_ACTIONS !== "true" || env.FORGEJO_SERVER_URL !== server ||
      env.FORGEJO_REPOSITORY !== repository || env.FORGEJO_EVENT_NAME !== "workflow_dispatch" ||
      env.FORGEJO_REF !== "refs/heads/main") {
    throw new Error("Produktion erfordert einen manuellen Forgejo-Lauf auf main.");
  }
  if (!shaPattern.test(release ?? "") || !shaPattern.test(expectedCurrent ?? "") ||
      release === expectedCurrent || release !== env.FORGEJO_SHA) {
    throw new Error("Freigabe erfordert den ausgewählten main-Commit und den vorherigen Produktionscommit.");
  }

  const prefix = `repos/${repository}`;
  const main = await request(`${prefix}/branches/main`);
  if (main.commit?.id !== release) throw new Error("main hat sich seit der Freigabe geändert.");
  const runs = await listPages(request, `${prefix}/actions/runs`,
    value => Array.isArray(value) ? value : value.workflow_runs);
  const run = latestById(runs.filter(candidate =>
    candidate.workflow_id === workflow && candidate.prettyref === "main" &&
    candidate.event === "push" && candidate.commit_sha === release,
  ));
  if (!run || run.status !== "success" || !Number.isSafeInteger(run.index_in_repo) || run.index_in_repo < 1) {
    throw new Error("Der jüngste CI-Lauf für den freigegebenen Commit fehlt oder war nicht erfolgreich.");
  }

  const statuses = await listPages(request, `${prefix}/commits/${release}/statuses`, value => value);
  const jobPath = `/${repository}/actions/runs/${run.index_in_repo}/jobs/`;
  for (const job of requiredJobs) {
    const latest = latestById(statuses.filter(status => status.context === `Website-Checks / ${job} (push)`));
    const target = new URL(latest?.target_url || "/", server);
    const targetJob = target.pathname.startsWith(jobPath) && /^\d+$/.test(target.pathname.slice(jobPath.length));
    if (latest?.status !== "success" || target.origin !== server || !targetJob) {
      throw new Error(`Der erforderliche Forgejo-Job ${job} ist für diesen Lauf nicht erfolgreich nachgewiesen.`);
    }
  }
  return { release, expectedCurrent, ciRun: run.index_in_repo };
}

async function forgejoRequest(path) {
  if (!process.env.FORGEJO_TOKEN || process.env.FORGEJO_API_URL !== `${server}/api/v1`) {
    throw new Error("Der Forgejo-Zugang für die Releaseprüfung fehlt.");
  }
  const response = await fetch(`${server}/api/v1/${path}`, {
    headers: { Authorization: `token ${process.env.FORGEJO_TOKEN}`, Accept: "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Die Forgejo-Releaseprüfung ist fehlgeschlagen (HTTP ${response.status}).`);
  return response.json();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const approved = await verifyForgejoDeploymentApproval(process.env, forgejoRequest);
    console.log(`Freigegebener Commit ${approved.release}, Forgejo-Lauf ${approved.ciRun}.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
