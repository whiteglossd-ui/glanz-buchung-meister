// Runs only against the owned synthetic server in the existing Linux CI job.
import { assertIsolatedGithubCi } from "../hosting-policy.mjs";
assertIsolatedGithubCi();
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { qaBase, controlBase } from "./ports.mjs";
import { qaClientHeaders } from "./client-identity.mjs";
import { createBrowserDiagnostics } from "../browser-diagnostics.mjs";
import { createHeroPhaseTracker, heroEvidenceUrl, redactHeroEvidence } from "./hero-diagnostics.mjs";

const runId = process.env.QA_RUN_ID;
assert.ok(runId, "The parent QA runner must supply its run identity.");
const identityResponse = await fetch(`${controlBase}/identity`, {
  redirect: "error",
  signal: AbortSignal.timeout(5000),
});
assert.equal(identityResponse.status, 200);
assert.equal(identityResponse.headers.get("x-qa-run-id"), runId, "Refuse another QA server.");
assert.deepEqual(await identityResponse.json(), {
  isolated: true,
  database: "in-memory-pglite",
  externalFetch: "blocked",
});

const { chromium } = await import("playwright");
const output = ".qa-output/hero-stability";
await mkdir(output, { recursive: true });
const report = { runId, base: qaBase, results: [], failures: [], blockedRequests: [], pageErrors: [] };
const browser = await chromium.launch({ headless: true });
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "narrow-mobile", width: 320, height: 740 },
  { name: "landscape", width: 844, height: 390 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "compact-desktop", width: 1280, height: 720 },
];

function cls(shifts) {
  let maximum = 0;
  let sum = 0;
  let first = 0;
  let previous = 0;
  for (const shift of shifts.filter((entry) => !entry.hadRecentInput)) {
    if (!sum || shift.startTime - previous > 1000 || shift.startTime - first > 5000) {
      sum = 0;
      first = shift.startTime;
    }
    sum += shift.value;
    previous = shift.startTime;
    maximum = Math.max(maximum, sum);
  }
  return maximum;
}

// eslint-disable-next-line no-unused-vars
function overlap(a, b) {
  if (!a || !b) return null;
  const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return { width, height, area: width * height };
}

// Dark Edition (Inhaberauftrag 25.11.2026): the hero is a scroll-driven image
// sequence on a canvas with three chapters. These checks keep the reviewed
// invariants of the former film hero: no layout shift, both actions visible
// below the header and above the consent dialog, inert hidden chapters, and a
// static, fully reachable hero for reduced motion and short screens.
async function geometry(page) {
  return page.evaluate(() => {
    const rect = (element) => element?.getBoundingClientRect().toJSON() ?? null;
    const header = document.querySelector("[data-site-header]");
    const banner = document.querySelector(".consent-banner");
    const bannerVisible = banner && getComputedStyle(banner).display !== "none" && banner.getBoundingClientRect().height > 0;
    const reel = document.querySelector(".reel");
    const poster = document.querySelector(".reel__poster");
    const actions = [...document.querySelectorAll("[data-hero-actions] a[href]")];
    let storedConsent = null;
    try { storedConsent = localStorage.getItem("wg-consent"); } catch { storedConsent = "unavailable"; }
    return {
      scrollY, viewport: { width: innerWidth, height: innerHeight },
      storedConsent,
      header: rect(header),
      banner: bannerVisible ? rect(banner) : null,
      headingText: document.querySelector(".reel h1")?.textContent?.replace(/\s+/g, " ").trim() ?? "",
      headingCount: document.querySelectorAll("h1").length,
      actionCount: actions.length,
      actionTargets: actions.map((link) => new URL(link.href).pathname + new URL(link.href).hash).sort(),
      actions: actions.map((link) => ({ ...rect(link), inert: Boolean(link.closest("[inert]")) || link.inert,
        unobscured: link.contains(document.elementFromPoint(rect(link).left + rect(link).width / 2, rect(link).top + rect(link).height / 2)) })),
      poster: poster ? { complete: poster.complete, width: poster.naturalWidth } : null,
      live: reel?.classList.contains("is-live") ?? false,
      chapter: reel?.dataset.ch ?? "0",
      reelHeight: reel?.getBoundingClientRect().height ?? 0,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
}

function actionsReachable(snapshot, label) {
  const headerBottom = Math.max(0, snapshot.header?.bottom ?? 0);
  const limit = snapshot.banner ? snapshot.banner.top : snapshot.viewport.height;
  for (const action of snapshot.actions) {
    assert.ok(action.top >= headerBottom - 1 && action.bottom <= limit + 1 && action.left >= 0
      && action.right <= snapshot.viewport.width + 1 && action.height >= 44 - 0.01 && !action.inert && action.unobscured,
    `${label}: hero action must be visible below the header and above the consent dialog: ${JSON.stringify({ action, headerBottom, limit })}`);
  }
}

try {
  for (const viewport of viewports) {
    const result = { viewport, blockedRequests: [], pageErrors: [] };
    const phase = createHeroPhaseTracker(result);
    const browserDiagnostics = createBrowserDiagnostics({ origin: qaBase, label: `hero-${viewport.name}` });
    report.results.push(result);
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: "no-preference",
      locale: "de-DE",
      extraHTTPHeaders: { "x-forwarded-host": "white-gloss.de", ...qaClientHeaders("hero-stability", viewport.name) },
    });
    try {
      await context.route("**/*", (route) => {
        const request = route.request();
        browserDiagnostics.allowRequest(request);
        if (new URL(request.url()).origin !== qaBase || !["GET", "HEAD"].includes(request.method())) {
          result.blockedRequests.push(`${request.method()} ${heroEvidenceUrl(request.url())}`);
          return route.abort();
        }
        return route.continue();
      });
      await context.addInitScript(() => {
        const shifts = [];
        const supported = PerformanceObserver.supportedEntryTypes.includes("layout-shift");
        const record = (entries) => {
          for (const entry of entries) shifts.push({ startTime: entry.startTime, value: entry.value, hadRecentInput: entry.hadRecentInput,
            sources: (entry.sources || []).map((source) => ({ node: source.node?.nodeName ?? null, currentRect: source.currentRect.toJSON() })) });
        };
        const observer = supported ? new PerformanceObserver((list) => record(list.getEntries())) : null;
        observer?.observe({ type: "layout-shift", buffered: true });
        window.__heroStability = { supported, finish() { if (observer) { record(observer.takeRecords()); observer.disconnect(); } return shifts; } };
      });
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      browserDiagnostics.attach(page);
      page.on("pageerror", (error) => result.pageErrors.push(redactHeroEvidence(error.message)));
      await phase.run("navigation", () => page.goto(`${qaBase}/`, { waitUntil: "networkidle", timeout: 30000 }));
      const consent = page.getByRole("dialog", { name: "Cookie-Einstellungen", exact: true });
      await phase.run("consent-visible", () => consent.waitFor({ state: "visible" }));
      await page.waitForTimeout(1200);
      await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
      result.initial = await phase.run("first-visit-geometry", () => geometry(page));
      result.observerSupported = await page.evaluate(() => window.__heroStability.supported);
      result.layoutShifts = await page.evaluate(() => window.__heroStability.finish());
      result.cls = cls(result.layoutShifts);
      await page.screenshot({ path: `${output}/${viewport.name}-first-visit.png` });

      assert.equal(result.initial.storedConsent, null, "First-visit measurement must have no saved decision.");
      assert.equal(result.observerSupported, true, "Layout-shift observation must be supported.");
      assert.ok(result.initial.banner && result.initial.banner.height > 0, "The consent dialog must be visible on the first visit.");
      assert.ok(result.cls <= 0.1, `${viewport.name}: hero CLS ${result.cls} must stay within 0.1.`);
      assert.equal(result.initial.headingCount, 1, "The homepage has exactly one H1.");
      assert.ok(result.initial.headingText.length > 10, "The hero H1 carries the homepage title.");
      assert.equal(result.initial.actionCount, 2, "The hero has exactly two primary actions.");
      assert.deepEqual(result.initial.actionTargets, ["/#ablauf", "/#buchung"], "Hero actions lead to pickup process and request.");
      assert.ok(result.initial.poster?.complete && result.initial.poster.width > 0, "The first hero frame is decoded.");
      assert.ok(result.initial.overflow <= 2, "The hero must not introduce horizontal overflow.");
      actionsReachable(result.initial, `${viewport.name} first visit`);

      await phase.run("reject-consent", async () => {
        await consent.getByRole("button", { name: "Ablehnen", exact: true }).click();
        await consent.waitFor({ state: "hidden" });
      });
      result.afterRejection = await geometry(page);
      assert.equal(result.afterRejection.storedConsent, "rejected", "Rejecting must preserve the real consent decision.");
      actionsReachable(result.afterRejection, `${viewport.name} after rejection`);

      const shortScreen = viewport.height <= 560;
      if (!shortScreen) {
        // The image sequence becomes live and later chapters replace the introduction.
        await phase.run("sequence-live", () => page.waitForFunction(() => document.querySelector(".reel")?.classList.contains("is-live")));
        const distance = await page.evaluate(() => document.querySelector(".reel").offsetHeight - innerHeight);
        assert.ok(distance > innerHeight, "Enabled motion must have a usable scrolling stage.");
        await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), Math.round(distance * 0.45));
        await phase.run("chapter-two", () => page.waitForFunction(() => document.querySelector(".reel")?.dataset.ch === "1"));
        result.midway = await geometry(page);
        assert.ok(result.midway.actions.every((action) => action.inert), "Hidden introduction links must leave the keyboard sequence.");
        assert.equal(await page.locator(".reel h1").count(), 1, "Keep the H1 in the document while later chapters show.");
        await page.screenshot({ path: `${output}/${viewport.name}-chapter-2.png` });
        await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), Math.round(distance * 0.9));
        await phase.run("chapter-three", () => page.waitForFunction(() => document.querySelector(".reel")?.dataset.ch === "2"));
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        await phase.run("chapter-one-restored", () => page.waitForFunction(() => document.querySelector(".reel")?.dataset.ch === "0"));
        await page.waitForTimeout(1000);
        result.restored = await geometry(page);
        actionsReachable(result.restored, `${viewport.name} restored`);
      } else {
        // Landscape phones: a static hero whose content is never clipped.
        assert.ok(result.afterRejection.reelHeight >= viewport.height, "The static hero fills at least the screen.");
        await page.evaluate(() => window.scrollTo({ top: 600, behavior: "instant" }));
        await page.waitForTimeout(300);
        assert.equal(await page.evaluate(() => document.querySelector(".reel")?.dataset.ch ?? "0"), "0",
          "Short screens keep the introduction active while scrolling.");
      }

      // Reduced motion: static introduction, no later chapters, actions reachable.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(600);
      result.reduced = await geometry(page);
      actionsReachable(result.reduced, `${viewport.name} reduced motion`);
      assert.equal(await page.locator(".reel__ch--1").isVisible(), false, "Reduced motion hides the later chapters.");
      await page.screenshot({ path: `${output}/${viewport.name}-reduced.png` });
      if (result.pageErrors.length) report.failures.push(`${viewport.name}: ${result.pageErrors.join("; ")}`);
    } catch (error) {
      result.error = redactHeroEvidence(error.message);
      result.errorDetails = redactHeroEvidence({ name: error.name, message: error.message, stack: error.stack });
      report.failures.push(`${viewport.name} [${result.phase ?? "setup"}]: ${result.error}`);
      const page = context.pages()[0];
      if (page) {
        result.failureGeometry = await geometry(page).catch((snapshotError) => ({ error: redactHeroEvidence(snapshotError.message) }));
        await page.screenshot({ path: `${output}/${viewport.name}-failure.png` }).catch(() => {});
      }
      console.error("HERO_FAILURE:" + JSON.stringify(redactHeroEvidence({ viewport, phase: result.phase, error: result.errorDetails, phases: result.phases, geometry: result.failureGeometry, browser: browserDiagnostics.snapshot() })));
    } finally {
      result.browserDiagnostics = redactHeroEvidence(browserDiagnostics.snapshot());
      report.blockedRequests.push(...result.blockedRequests);
      report.pageErrors.push(...result.pageErrors);
      await context.close();
    }
  }
} finally {
  await writeFile(`${output}/results.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
assert.equal(report.failures.length, 0, report.failures.join("\n"));
console.log(`${viewports.length} hero checks passed: layout stability, reachable actions with and without consent dialog, chapter switching with inert links, reduced motion and short screens; nothing submitted.`);
