#!/usr/bin/env node
/**
 * Produktionsabhängigkeiten prüfen: wie `npm audit --omit=dev --audit-level=moderate`,
 * aber mit einer eng begrenzten, befristeten Ausnahmeliste.
 *
 * Betreiberentscheidung vom 18.11.2026: GHSA-fc5q-39xc-vjpf (picomatch <=4.0.7,
 * ReDoS) hat noch keine reparierte Version. picomatch steckt nur in Bau- und
 * Testwerkzeugen (Vite, TanStack-Plugin, Vitest), nicht im Server-Paket
 * (.output/server ohne Treffer). Jede andere Warnung ab "moderate" schlägt weiter an.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const LEVELS = ["info", "low", "moderate", "high", "critical"];
export const ACCEPTED_ADVISORIES = Object.freeze([
  Object.freeze({
    url: "https://github.com/advisories/GHSA-fc5q-39xc-vjpf",
    package: "picomatch",
    range: "<=4.0.7",
    reviewBy: "2026-12-31",
    reason: "Keine reparierte Version; nur Bau-/Testwerkzeug, nicht im Server-Paket.",
  }),
]);

/** @returns {{ blocking: object[], accepted: object[], expired: object[] }} */
export function evaluateAudit(report, { today = new Date().toISOString().slice(0, 10), accepted = ACCEPTED_ADVISORIES, minLevel = "moderate" } = {}) {
  if (!report || typeof report !== "object" || !report.vulnerabilities) {
    throw new Error("npm audit lieferte kein auswertbares Ergebnis.");
  }
  const threshold = LEVELS.indexOf(minLevel);
  const found = new Map();
  for (const entry of Object.values(report.vulnerabilities)) {
    for (const via of entry.via ?? []) {
      if (typeof via !== "object" || via === null) continue; // abgeleitete Kette, Ursache steht separat
      if (LEVELS.indexOf(via.severity) < threshold) continue;
      found.set(`${via.url}|${via.name}|${via.range}`, { url: via.url, package: via.name, range: via.range, severity: via.severity, title: via.title });
    }
  }
  const result = { blocking: [], accepted: [], expired: [] };
  for (const advisory of found.values()) {
    const rule = accepted.find((item) => item.url === advisory.url && item.package === advisory.package && item.range === advisory.range);
    if (!rule) result.blocking.push(advisory);
    else if (today > rule.reviewBy) result.expired.push({ ...advisory, reviewBy: rule.reviewBy });
    else result.accepted.push({ ...advisory, reviewBy: rule.reviewBy });
  }
  return result;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const run = spawnSync("npm", ["audit", "--omit=dev", "--json"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  let report;
  try { report = JSON.parse(run.stdout); } catch { report = null; }
  if (!report?.vulnerabilities) {
    console.error(run.stderr || run.stdout || "npm audit konnte nicht ausgeführt werden.");
    process.exit(1);
  }
  const { blocking, accepted, expired } = evaluateAudit(report);
  for (const a of accepted) console.log(`Toleriert bis ${a.reviewBy}: ${a.package} ${a.range} – ${a.url}`);
  for (const a of expired) console.error(`Ausnahme abgelaufen (${a.reviewBy}), bitte neu prüfen: ${a.package} ${a.range} – ${a.url}`);
  for (const a of blocking) console.error(`Sicherheitswarnung (${a.severity}): ${a.package} ${a.range} – ${a.title} – ${a.url}`);
  if (blocking.length || expired.length) process.exit(1);
  console.log("Produktionsabhängigkeiten: keine blockierenden Warnungen.");
}
