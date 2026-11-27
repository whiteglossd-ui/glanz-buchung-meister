// Sandbox-Vorschau: speichert die serverseitig gerenderten Seiten des PR-Stands
// samt CSS, Schriften und Medien als statische Dateien (.qa-output/preview/).
// Läuft ausschließlich im isolierten Linux-GitHub-CI-Job (verify) gegen den
// isolierten Server mit In-Memory-Datenbank; keine echten Anfragen oder Uploads.
import { assertIsolatedGithubCi } from "../hosting-policy.mjs";
assertIsolatedGithubCi();
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { qaBase } from "./ports.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
process.chdir(projectRoot);
const out = resolve(".qa-output/preview");
const MAX_FILE = 14 * 1024 * 1024;
const MAX_TOTAL = 60 * 1024 * 1024;

const pages = [
  "/", "/leistungen", "/preise", "/kontakt", "/galerie", "/abholservice",
  "/ratgeber", "/faq", "/ueber-uns", "/qualitaet", "/luxusfahrzeuge", "/b2b",
  "/dellen-hagelschaden", "/folierung-smart-repair",
];

const server = spawn(process.execPath, ["scripts/qa/isolated-server.mjs"], {
  stdio: ["ignore", "inherit", "inherit"],
  env: process.env,
});
const stop = () => { if (server.exitCode === null) server.kill("SIGTERM"); };
process.once("exit", stop);

async function ready() {
  for (let i = 0; i < 300; i++) {
    if (server.exitCode !== null) throw new Error("Isolierter Server beendet.");
    try {
      const res = await fetch(qaBase, { signal: AbortSignal.timeout(2000) });
      if (res.ok && (await res.text()).includes("<main")) return;
    } catch { /* noch nicht bereit */ }
    await delay(200);
  }
  throw new Error("Isolierter Server nicht bereit.");
}

const assets = new Set();
let total = 0;
const refs = (text) => {
  const found = [];
  for (const m of text.matchAll(/(?:src|href|poster|content|data-src)="(\/[^"#?]+)/g)) found.push(m[1]);
  for (const m of text.matchAll(/srcset="([^"]+)"/g))
    for (const part of m[1].split(",")) { const u = part.trim().split(/\s+/)[0]; if (u?.startsWith("/")) found.push(u.split("?")[0]); }
  for (const m of text.matchAll(/url\(["']?(\/[^"')?#]+)/g)) found.push(m[1]);
  for (const m of text.matchAll(/["'](\/(?:media|fonts)\/[^"'?#\s]+)["']/g)) found.push(m[1]);
  return found.filter((u) => !u.startsWith("//") && /\.[a-z0-9]{2,5}$/i.test(u) && !/\.(m?js|map)$/i.test(u));
};

async function save(path, body) {
  const file = resolve(out, "." + path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, body);
}

async function fetchAsset(path) {
  if (assets.has(path)) return;
  assets.add(path);
  const res = await fetch(qaBase + path, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) { console.log(`skip ${res.status} ${path}`); return; }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_FILE || total + buf.length > MAX_TOTAL) { console.log(`skip size ${buf.length} ${path}`); return; }
  total += buf.length;
  await save(path, buf);
  if (path.endsWith(".css")) for (const r of refs(buf.toString("utf8"))) await fetchAsset(r);
}

try {
  await ready();
  const extra = [];
  for (const page of pages) {
    const res = await fetch(qaBase + page, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) { console.log(`skip page ${res.status} ${page}`); continue; }
    const html = await res.text();
    await save(page === "/" ? "/index.html" : page + ".html", html);
    if (page === "/leistungen" || page === "/abholservice" || page === "/ratgeber") {
      const m = html.match(new RegExp(`href="(${page}/[a-z0-9-]+)"`));
      if (m) extra.push(m[1]);
    }
    for (const r of refs(html)) await fetchAsset(r);
  }
  // Dark-Edition-Hero: Bildfolge und Bildvorschau werden per Skript geladen.
  for (const set of ["d", "m"])
    for (let i = 1; i <= 96; i++) await fetchAsset(`/media/dark/seq/${set}/${String(i).padStart(3, "0")}.webp`);
  for (const name of ["beads-sq", "hood-wide", "inspection", "stitching", "leather-wide", "cockpit-wide", "towels", "key", "headlight-wide", "profile-wide", "foamwash", "glove-towel", "foam-sq", "taillight"])
    await fetchAsset(`/media/dark/gen/${name}-800.webp`);
  for (const page of extra) {
    const res = await fetch(qaBase + page, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) continue;
    const html = await res.text();
    await save(page + ".html", html);
    for (const r of refs(html)) await fetchAsset(r);
  }
  console.log(`Vorschau exportiert: ${pages.length + extra.length} Seiten, ${assets.size} Dateien, ${(total / 1048576).toFixed(1)} MB`);
} finally {
  stop();
}
