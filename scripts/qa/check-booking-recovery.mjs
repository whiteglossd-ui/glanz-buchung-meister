// Real form recovery, confined to the existing isolated Linux GitHub runner.
import { assertIsolatedGithubCi } from "../hosting-policy.mjs";
assertIsolatedGithubCi();
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";
import { qaBase, controlBase } from "./ports.mjs";
import { qaClientHeaders } from "./client-identity.mjs";
import { prepareBrowserFixture } from "./browser-fixture.mjs";

const output = ".qa-output/booking-recovery";
await mkdir(output, { recursive: true });
const identity = await fetch(controlBase + "/identity", { signal: AbortSignal.timeout(5000) });
assert.equal(identity.headers.get("x-qa-run-id"), process.env.QA_RUN_ID);
assert.ok(process.env.QA_RUN_ID);
assert.deepEqual(await identity.json(), { isolated: true, database: "in-memory-pglite", externalFetch: "blocked" });
await prepareBrowserFixture({ scenario: "booking-recovery" });
const ids = {};
for (const file of await readdir(".output/server/_ssr")) {
  if (!/^bookings\.functions-/.test(file)) continue;
  const source = await readFile(".output/server/_ssr/" + file, "utf8");
  for (const match of source.matchAll(/id: "([a-f0-9]+)",\s*name: "(\w+)"/g)) ids[match[2]] = match[1];
}
assert.ok(ids.createPublicBooking);
const createPath = "/_serverFn/" + ids.createPublicBooking;
const results = [];
async function evidence() {
  const response = await fetch(controlBase + "/evidence", { signal: AbortSignal.timeout(5000) });
  assert.equal(response.status, 200);
  const state = await response.json();
  assert.equal(state.blocked.length, 0);
  return state;
}
async function settled(email) {
  for (const deadline = Date.now() + 10000; Date.now() < deadline;) {
    const state = await evidence();
    const booking = state.tables.bookings.find((row) => row.email === email);
    const queue = booking ? state.tables.outbound_queue.filter((row) => String(row.booking_id) === String(booking.id)) : [];
    if (booking && queue.every((row) => !["queued", "processing"].includes(row.status))) return state;
    await delay(100);
  }
  throw Error("Synthetic request did not settle");
}
const browser = await chromium.launch({ headless: true });
async function scenario({ name, loseResponse }) {
  const email = `recovery-${randomUUID()}@example.invalid`;
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    serviceWorkers: "block", extraHTTPHeaders: qaClientHeaders("booking-ui", `recovery:${name}`) });
  const requests = { create: 0, photos: 0 }, errors = [], externalReads = new Set();
  let responseLost = false;
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("crash", () => errors.push("page crash"));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const location = message.location().url;
    if (/^Failed to load resource\b/.test(message.text()) &&
      (externalReads.has(location) || (loseResponse && location === qaBase + createPath))) return;
    errors.push(message.text());
  });
  await context.route("**/*", async (route) => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin !== qaBase) {
      if (["GET", "HEAD"].includes(request.method())) externalReads.add(request.url());
      else errors.push("Unexpected external write");
      return route.abort();
    }
    if (["GET", "HEAD"].includes(request.method())) return route.continue();
    if (request.method() !== "POST" || url.pathname !== createPath) {
      requests.photos++;
      errors.push("Unexpected public write " + url.pathname);
      return route.abort();
    }
    requests.create++;
    if (loseResponse && !responseLost) {
      // Commit through the actual built RPC, then simulate a lost response.
      const response = await route.fetch();
      assert.equal(response.status(), 200);
      responseLost = true;
      return route.abort("connectionreset");
    }
    return route.continue();
  });
  const fill = async () => {
    await page.goto(qaBase + "/#buchung", { waitUntil: "networkidle" });
    const reject = page.getByRole("button", { name: "Ablehnen", exact: true });
    if (await reject.isVisible().catch(() => false)) await reject.click();
    await page.locator("form.booking-flow").waitFor();
    assert.equal(await page.locator('form.booking-flow input[type="file"]').count(), 0);
    await page.locator(".booking-steps button").nth(2).click();
    for (const [id, value] of Object.entries({ name: "Synthetic recovery customer", phone: "+490000000099", email,
      street: "Musterweg 1", postalCode: "72160", town: "Horb am Neckar" })) await page.locator("#" + id).fill(value);
    await page.locator("#privacy").check();
  };
  const submitTwice = () => page.locator('form.booking-flow button[type="submit"]').evaluate((button) => { button.click(); button.click(); });
  try {
    const before = await evidence();
    await fill();
    await submitTwice();
    if (loseResponse) {
      await page.locator('form.booking-flow [role="alert"]').waitFor({ state: "visible" });
      assert.equal(requests.create, 1, "Synchronous submit lock rejects the doubleclick");
      const requestId = await page.evaluate(() => sessionStorage.getItem("white-gloss.booking-request.v1"));
      assert.ok(requestId, "The request ID remains after an unconfirmed response");
      await page.reload({ waitUntil: "networkidle" });
      assert.equal(await page.evaluate(() => sessionStorage.getItem("white-gloss.booking-request.v1")), requestId);
      await fill();
      await submitTwice();
    }
    await page.waitForURL((url) => url.pathname === "/danke" && !!url.searchParams.get("vorgang"));
    assert.equal(await page.locator('input[type="file"]').count(), 0, "The public thank-you page contains no upload");
    const state = await settled(email), rows = state.tables.bookings.filter((row) => row.email === email);
    assert.equal(rows.length, 1);
    const row = rows[0];
    assert.equal(state.tables.booking_events.filter((event) => String(event.booking_id) === String(row.id)).length, 1);
    assert.equal(state.panelIntakes.filter((item) => item.inquiry.email === email).length, 1, "Website retries reuse one panel handoff");
    assert.equal(state.tables.outbound_queue.filter((item) => item.to_addr === email).length, 0, "Only the panel owns the combined customer receipt");
    assert.equal(requests.create, loseResponse ? 2 : 1);
    assert.equal(requests.photos, 0);
    assert.equal(state.uploads.length, before.uploads.length);
    assert.equal(state.tables.booking_photos.length, before.tables.booking_photos.length);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `${output}/${name}-thanks-390.png`, fullPage: true });
    results.push({ scenario: name, passed: true, createRequests: requests.create, panelIntakes: 1, publicUploads: 0,
      evidenceScope: "Actual website RPC and synthetic panel sink; real panel auth/email are covered by panel integration tests" });
  } finally { await context.close(); }
}
try {
  await scenario({ name: "doubleclick-no-photos", loseResponse: false });
  await scenario({ name: "lost-response-reload-replay", loseResponse: true });
} finally {
  await browser.close();
  await writeFile(`${output}/results.json`, JSON.stringify({ results }, null, 2));
}
console.log(JSON.stringify({ passed: results.length, results }, null, 2));
