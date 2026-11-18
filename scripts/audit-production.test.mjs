import test from "node:test";
import assert from "node:assert/strict";
import { evaluateAudit } from "./audit-production.mjs";

const picomatch = { source: 1247710, name: "picomatch", url: "https://github.com/advisories/GHSA-fc5q-39xc-vjpf", severity: "high", range: "<=4.0.7", title: "ReDoS" };
const report = (extra = []) => ({ vulnerabilities: {
  picomatch: { via: [picomatch] },
  tinyglobby: { via: ["fdir", "picomatch"] },
  ...Object.fromEntries(extra.map((via) => [via.name, { via: [via] }])),
} });

test("only the exact, unexpired picomatch advisory is tolerated", () => {
  const result = evaluateAudit(report(), { today: "2026-11-18" });
  assert.deepEqual(result.blocking, []);
  assert.equal(result.accepted.length, 1);
});

test("any other advisory at moderate or above still blocks", () => {
  const other = { name: "left-pad", url: "https://github.com/advisories/GHSA-xxxx", severity: "moderate", range: "<1.0.0", title: "x" };
  assert.equal(evaluateAudit(report([other]), { today: "2026-11-18" }).blocking.length, 1);
  const low = { ...other, severity: "low" };
  assert.equal(evaluateAudit(report([low]), { today: "2026-11-18" }).blocking.length, 0);
});

test("a widened range or an expired review date is not tolerated", () => {
  const wider = { vulnerabilities: { picomatch: { via: [{ ...picomatch, range: "<=4.0.9" }] } } };
  assert.equal(evaluateAudit(wider, { today: "2026-11-18" }).blocking.length, 1);
  assert.equal(evaluateAudit(report(), { today: "2027-01-01" }).expired.length, 1);
});

test("an unreadable audit result fails closed", () => {
  assert.throws(() => evaluateAudit(null));
  assert.throws(() => evaluateAudit({ error: "network" }));
});
