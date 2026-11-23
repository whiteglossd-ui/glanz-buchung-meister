import { randomBytes } from "node:crypto";
import { isMainModule } from "./with-app-env.mjs";

// This immutable release predates the status endpoint. Its compiled provider and
// live service configuration were both verified disabled on the VPS on 2026-11-23.
const auditedPredecessor = "0a56e9c0698117178794935142f3c0cc01b57560";

export async function checkDisabledGoogle(phase, release, request = fetch) {
  if (!["before", "active"].includes(phase) || !/^[a-f0-9]{40}$/.test(release ?? "")) {
    throw new Error("Ungültiger Release für die Google-Prüfung.");
  }
  if (phase === "before" && release === auditedPredecessor) return;

  const challenge = randomBytes(16).toString("hex");
  const url = new URL("https://white-gloss.de/api/auth/google-release-status");
  url.searchParams.set("release", release);
  url.searchParams.set("challenge", challenge);
  const response = await request(url, {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
  if (response.status !== 200 ||
      response.headers.get("content-type")?.split(";")[0] !== "text/plain" ||
      await response.text() !== challenge) {
    throw new Error("Der laufende Website-Release bestätigt keinen deaktivierten Google-Login.");
  }
}

if (isMainModule(import.meta.url)) {
  await checkDisabledGoogle(process.argv[2], process.argv[3]);
}
