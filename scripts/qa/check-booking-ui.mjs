// Browser execution is restricted to the existing isolated Linux GitHub CI job.
// Exercises the booking selection, price summary, gallery viewer and responsive
// layout. Only same-origin GET requests are allowed; nothing is submitted.
import { assertIsolatedGithubCi } from "../hosting-policy.mjs";
assertIsolatedGithubCi();
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { extras } from "../../src/data/site.ts";
import { qaBase } from "./ports.mjs";
import { qaClientHeaders } from "./client-identity.mjs";
import { prepareBrowserFixture } from "./browser-fixture.mjs";
import { assertBrowserDiagnostics, createBrowserDiagnostics } from "../browser-diagnostics.mjs";
import { verifyInitialRundumHero, verifyRundumUi, verifyRundumIntentLoading, iconPreloadObservations, rundumArrivalObservations } from "./rundum-ui.mjs";
import { completeSuccessfulRead, observeReadDuringAction } from "./read-completion.mjs";

const output = ".qa-output/booking-ui";
await mkdir(output, { recursive: true });
const results = [];
const diagnostics = [];
const requestable = extras.filter((extra) => extra.requestable !== false);
assert.equal(requestable.length, 11, "Eleven bookable extras remain after retiring ceramic layers");

const browser = await chromium.launch({ headless: true });

async function openContext(options) {
  const context = await browser.newContext({ ...options, serviceWorkers: "block", extraHTTPHeaders: qaClientHeaders("booking-ui", `context-${diagnostics.length}`) });
  const diagnostic = createBrowserDiagnostics({ origin: qaBase, label: `${options.viewport.width}x${options.viewport.height}` });
  const closeContext = context.close.bind(context);
  context.close = async (...args) => {
    diagnostic.beginTeardown();
    return closeContext(...args);
  };
  diagnostics.push(diagnostic);
  const assets = [];
  await context.route("**/*", (route) => {
    const request = route.request();
    if (!diagnostic.allowRequest(request)) return route.abort();
    assets.push(new URL(request.url()).pathname);
    return route.continue();
  });
  const page = await context.newPage();
  diagnostic.attach(page);
  return { context, page, assets };
}

async function dismissConsent(page) {
  const reject = page.getByRole("button", { name: "Ablehnen" });
  if (await reject.isVisible().catch(() => false)) await reject.click();
}

async function openBooking(page, path = "/") {
  await page.goto(`${qaBase}${path}#buchung`, { waitUntil: "networkidle" });
  await dismissConsent(page);
  await page.locator("form.booking-flow").waitFor();
  // The lazy configurator mounts after document navigation and starts a real
  // availability read. Its time-slot selector is enabled only after the body is parsed.
  await page.locator("form.booking-flow #slot:enabled").waitFor({ state: "attached" });
  await placeBelowHeader(page, "form.booking-flow");
}

const flat = (value) => (value ?? "").replace(/\s+/g, " ").trim();

async function expectText(page, selector, expected, label) {
  await page
    .waitForFunction(
      ([sel, value]) =>
        (document.querySelector(sel)?.textContent ?? "").replace(/\s+/g, " ").includes(value),
      [selector, expected],
      { timeout: 5000 },
    )
    .catch(async () => {
      const actual = flat(await page.locator(selector).first().textContent());
      throw new Error(`${label}: expected "${expected}" in ${selector}, got "${actual}"`);
    });
  results.push(`${label}: ${expected}`);
}

async function overflow(page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

async function placeBelowHeader(page, selector) {
  const target = page.locator(selector).first();
  await target.waitFor({ state: "visible" });
  await page.evaluate(() => document.fonts.ready);
  let geometry;
  for (let attempt = 0; attempt < 3; attempt++) {
    await target.evaluate((element) => {
      const headerBottom = document.querySelector("[data-site-header]")?.getBoundingClientRect().bottom ?? 0;
      window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top - headerBottom - 16, behavior: "instant" });
      window.__qaBookingViewport = { top: element.getBoundingClientRect().top, headerBottom, since: performance.now() };
    });
    // Lazy content and fonts can change the position after the URL fragment was
    // resolved. Confirm the real viewport position, not just display:visible.
    await page.waitForFunction((target) => {
      const element = document.querySelector(target);
      if (!element) return false;
      const top = element.getBoundingClientRect().top;
      const headerBottom = document.querySelector("[data-site-header]")?.getBoundingClientRect().bottom ?? 0;
      const probe = window.__qaBookingViewport;
      if (Math.abs(top - probe.top) > 0.5 || Math.abs(headerBottom - probe.headerBottom) > 0.5) {
        probe.top = top;
        probe.headerBottom = headerBottom;
        probe.since = performance.now();
      }
      return performance.now() - probe.since >= 200;
    }, selector, { timeout: 5000 });
    geometry = await target.evaluate((element) => ({
      top: element.getBoundingClientRect().top,
      headerBottom: document.querySelector("[data-site-header]")?.getBoundingClientRect().bottom ?? 0,
      viewportHeight: innerHeight,
    }));
    if (Math.abs(geometry.top - geometry.headerBottom - 16) <= 2 && geometry.top < geometry.viewportHeight) return;
  }
  assert.fail(`${selector}: could not establish a stable position below the header: ${JSON.stringify(geometry)}`);
}

async function captureBookingStep(page, filename, { includeSteps = false } = {}) {
  await placeBelowHeader(page, includeSteps ? "form.booking-flow" : ".booking-step-title");
  const state = await page.locator("form.booking-flow").evaluate((form) => {
    const title = form.querySelector(".booking-step-title");
    const panel = form.querySelector(".booking-step-panel:not([hidden])");
    const current = form.querySelector('.booking-steps button[aria-current="step"]');
    const titleBox = title.getBoundingClientRect();
    return {
      title: title.textContent.replace(/\s+/g, " ").trim(),
      current: current.textContent.replace(/^\s*\d+\.\s*/, "").replace(/\s+/g, " ").trim(),
      titleVisible: titleBox.top >= (document.querySelector("[data-site-header]")?.getBoundingClientRect().bottom ?? 0) && titleBox.bottom < innerHeight,
      panelVisible: panel.getBoundingClientRect().top < innerHeight,
    };
  });
  assert.equal(state.title, state.current, "The screenshot must show the current booking step");
  assert.ok(state.titleVisible && state.panelVisible,
    `The current step heading and its form content must be in the screenshot: ${JSON.stringify(state)}`);
  await page.screenshot({ path: `${output}/${filename}` });
}

async function bookingLayout(page, { desktop, embedded }) {
  const geometry = await page.locator("form.booking-flow").evaluate((form) => {
    const rect = (element) => element.getBoundingClientRect().toJSON();
    const price = form.querySelector(".booking-price");
    const panel = form.querySelector(".booking-step-panel:not([hidden])");
    const title = form.querySelector(".booking-step-title");
    const home = form.closest("#buchung");
    const homeForm = home?.querySelector("[data-booking-form]");
    const homeStyle = homeForm ? getComputedStyle(homeForm) : null;
    return {
      embedded: Boolean(home),
      form: rect(form),
      steps: rect(form.querySelector(".booking-steps")),
      price: rect(price),
      panel: rect(panel),
      title: rect(title),
      actions: rect(form.querySelector(".booking-actions")),
      columns: getComputedStyle(form).gridTemplateColumns.split(/\s+/).length,
      pricePosition: getComputedStyle(price).position,
      excess: form.scrollWidth - form.clientWidth,
      home: home ? {
        promise: rect(home.querySelector("[data-booking-promise]")),
        card: rect(homeForm),
        contentWidth: homeForm.clientWidth - parseFloat(homeStyle.paddingLeft) - parseFloat(homeStyle.paddingRight),
        split: matchMedia("(min-width: 1080px)").matches,
      } : null,
    };
  });
  assert.equal(geometry.embedded, embedded, "The requested booking layout is actually mounted");
  assert.ok(geometry.excess <= 2, "The configurator itself has no horizontal overflow");
  if (embedded) {
    assert.equal(geometry.columns, 1, "The homepage form has one real column, with no implicit price column");
    assert.equal(geometry.pricePosition, "static", "The homepage price stays in normal document flow");
    assert.ok(Math.abs(geometry.form.width - geometry.home.contentWidth) <= 2,
      "The homepage configurator uses the full available width inside its card");
    for (const child of ["steps", "price", "title", "panel", "actions"]) {
      assert.ok(Math.abs(geometry[child].left - geometry.form.left) <= 2 &&
        Math.abs(geometry[child].width - geometry.form.width) <= 2,
      `Homepage ${child} uses the full form column: ${JSON.stringify(geometry)}`);
    }
    assert.ok(geometry.steps.bottom <= geometry.price.top + 2 &&
      geometry.price.bottom <= geometry.title.top + 2 &&
      geometry.title.bottom <= geometry.panel.top + 2 &&
      geometry.panel.bottom <= geometry.actions.top + 2,
    "Homepage steps, price, title, active panel and actions follow each other without overlap");
    if (geometry.home.split) {
      assert.ok(geometry.home.promise.right <= geometry.home.card.left,
        "The desktop homepage promise and form occupy separate side-by-side columns");
    } else {
      assert.ok(geometry.home.promise.bottom <= geometry.home.card.top,
        "The narrower homepage stacks its promise above the full-width form card");
    }
  } else if (desktop) {
    assert.equal(geometry.columns, 2, "The standalone desktop calculator retains two columns");
    assert.equal(geometry.pricePosition, "sticky", "The standalone desktop price remains sticky in its side column");
    assert.ok(geometry.price.left >= geometry.panel.right,
      "The standalone desktop price summary must not cover the active form step");
  } else {
    assert.equal(geometry.columns, 1, "The standalone mobile calculator uses one column");
    assert.notEqual(geometry.pricePosition, "fixed", "The mobile price must not cover form controls");
    assert.ok(geometry.price.bottom <= geometry.title.top + 1,
      "The compact mobile price stays above the active step heading");
  }
  results.push(`${embedded ? "Homepage" : "Standalone"} ${desktop ? "desktop" : "mobile"} booking layout: usable form width and non-overlapping price`);
}

// Dark Edition (Inhaberauftrag 25.11.2026): packages as rows with vehicle-class
// tabs, results as a grid of one comparison and three inline customer videos.
async function checkMediaCollections(page, width) {
  const packages = page.locator("#preise");
  assert.equal(await page.locator("#pakete").count(), 1, "The package anchor remains available");
  assert.equal(await packages.locator(".prow").count(), 3, "All three packages remain available");
  for (const image of await packages.locator(".prow__img img").all()) {
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(async (element) => {
      await element.decode();
      if (!element.currentSrc || !element.naturalWidth) throw new Error("Package image must decode from a real source");
    });
  }
  const firstPrice = packages.locator(".prow__price .num").first();
  await packages.getByRole("radio", { name: "SUV / Limousine", exact: true }).click();
  await page.waitForFunction(() => document.querySelector("#preise .prow__price .num")?.textContent?.trim() === "186,25");
  await packages.getByRole("radio", { name: "Kompaktklasse", exact: true }).click();
  await page.waitForFunction(() => document.querySelector("#preise .prow__price .num")?.textContent?.trim() === "149");
  assert.equal(flat(await firstPrice.textContent()), "149");

  const resultSection = page.locator("#ergebnisse");
  assert.equal(await resultSection.locator(".work").count(), 4, "One comparison and three video cards");
  const triggers = resultSection.getByRole("button", { name: /^Video abspielen: / });
  assert.equal(await triggers.count(), 3, "The comparison card is not counted as a video");
  const comparison = resultSection.getByRole("slider", { name: "Vorher-Nachher-Vergleich verschieben", exact: true });
  await comparison.scrollIntoViewIfNeeded();
  for (const image of await resultSection.locator(".compare img").all()) {
    await image.evaluate(async (element) => {
      await element.decode();
      if (!element.naturalWidth) throw new Error("Comparison image must decode");
    });
  }
  await comparison.focus();
  const before = Number(await comparison.inputValue());
  const scrollBefore = await page.evaluate(() => scrollY);
  await page.keyboard.press("ArrowRight");
  assert.equal(Number(await comparison.inputValue()), Math.min(100, before + 1), "The comparison reacts to the keyboard");
  assert.ok(Math.abs(await page.evaluate(() => scrollY) - scrollBefore) <= 1, "Comparison keyboard input must not scroll the page");

  const videoResponse = await observeReadDuringAction(page, (response) => {
    const url = new URL(response.url());
    return response.request().method() === "GET" && response.request().resourceType() === "media" &&
      url.origin === new URL(qaBase).origin && /^\/media\/customer-beading\.(webm|mp4)$/.test(url.pathname);
  }, async () => {
    await resultSection.getByRole("button", { name: "Video abspielen: Hydrophober Lackschutz", exact: true }).click();
    await resultSection.locator('video[src="/media/customer-beading.mp4"]').waitFor({ state: "visible" });
  });
  if (videoResponse.status() === 206) {
    const range = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(await videoResponse.headerValue("content-range") ?? "");
    assert.ok(range && Number(range[1]) <= Number(range[2]) && Number(range[2]) < Number(range[3]),
      "Partial video responses must declare a valid byte range");
  }
  const player = resultSection.locator('video[src="/media/customer-beading.mp4"]');
  assert.equal(await player.evaluate((video) => video.controls && video === document.activeElement), true,
    "The started video has controls and keyboard focus");
  await page.waitForFunction(() => {
    const video = document.querySelector('#ergebnisse video[src="/media/customer-beading.mp4"]');
    if (video?.error) throw new Error(`Customer video decoding failed: ${video.error.message}`);
    return video && video.readyState >= 3 && video.videoWidth > 0 && !video.paused && video.currentTime > 0;
  }, null, { timeout: 15000 });
  await completeSuccessfulRead(videoResponse, { expectedStatuses: [200, 206] });
  await player.evaluate((video) => video.pause());
  results.push(`Packages, comparison and videos @${width}: images, exact class prices, keyboard comparison and inline video`);
}

try {
  await prepareBrowserFixture({ scenario: "booking-ui" });
  for (const width of [390, 1440]) {
    const { context, page } = await openContext({ viewport: { width, height: width < 700 ? 844 : 1000 }, reducedMotion: "reduce" });
    try {
      const response = await page.goto(`${qaBase}/`, { waitUntil: "networkidle" });
      results.push(await verifyInitialRundumHero(page, {
        label: `chromium-${width}`,
        documentHtml: await response.text(),
        screenshot: (name) => page.screenshot({ path: `${output}/${name}` }),
      }));
      results.push(await verifyRundumIntentLoading(page, { label: `chromium-${width}`, base: qaBase }));
    } finally { await context.close(); }
  }
  // Test the real API limit, then give each unrelated browser scenario its own
  // stable client. Never reset the limiter or hide a 429 in browser diagnostics.
  const availability = `${qaBase}/api/availability?from=2040-01-01&to=2040-02-01`;
  const burstHeaders = qaClientHeaders("rate-limit-proof", "burst");
  for (let request = 1; request <= 8; request++) {
    const response = await fetch(availability, { headers: burstHeaders });
    assert.equal(response.status, 200, `Availability request ${request} stays within the production limit`);
    assert.equal((await response.json()).ok, true);
  }
  const ninth = await fetch(availability, { headers: burstHeaders });
  assert.equal(ninth.status, 429, "The same client is still limited after eight requests");
  assert.equal((await ninth.json()).error, "rate_limited");
  const independent = await fetch(availability, { headers: qaClientHeaders("rate-limit-proof", "independent") });
  assert.equal(independent.status, 200, "An independent client retains its own quota");
  results.push("Real availability limiter: eight allowed, ninth blocked, independent client unaffected");
  /* ---- Desktop: existing three-step form, prices, package/vehicle changes, pickup ---- */
  {
    const { context, page, assets } = await openContext({ viewport: { width: 1280, height: 900 } });
    await openBooking(page);
    await bookingLayout(page, { desktop: true, embedded: true });
    const ids = await page
      .locator('input[type=checkbox][id^="extra-"]')
      .evaluateAll((inputs) => inputs.map((input) => input.id));
    assert.deepEqual(
      ids.sort(),
      requestable.map((extra) => `extra-${extra.id}`).sort(),
      "Every bookable extra must be selectable with its production ID",
    );
    assert.equal(await page.locator("#extra-keramik-ultra").count(), 0, "Retired ceramic layers must not be offered");
    results.push("All 11 bookable extras render with their production IDs");

    const total = ".booking-price strong";
    const step = async (number) => {
      await page
        .locator(".booking-steps button")
        .nth(number - 1)
        .click();
      if (number === 2) {
        const extrasBox = page.locator("details.booking-extras");
        if (!(await extrasBox.evaluate((details) => details.open)))
          await extrasBox.locator("summary").click();
      }
    };
    await page.locator('input[name="klasse"][value="kompakt"]').check();
    await page.locator('input[name="paket"][value="premium"]').check();
    await step(2);
    await page.selectOption("#city", "horb-am-neckar");
    await page.locator("#extra-felgen").check();
    await expectText(page, total, "468 €", "Kompakt · White-Gloss Signature + Felgen");
    await step(1);
    await page.locator('input[name="klasse"][value="suv"]').check();
    await expectText(page, total, "585 €", "SUV · White-Gloss Signature + Felgen");
    await captureBookingStep(page, "desktop-1280-auswahl.png", { includeSteps: true });

    await step(2);
    await page.locator("#extra-leder").check();
    await expectText(page, total, "771,25 €", "SUV · Politur + Felgen + Lederpflege");
    await step(1);
    await page.locator('input[name="paket"][value="keramik"]').check();
    await step(2);
    for (const id of ["leder", "glas"]) {
      assert.ok(await page.locator(`#extra-${id}`).isChecked(), `${id} shown as included`);
      assert.ok(await page.locator(`#extra-${id}`).isDisabled(), `${id} not selectable twice`);
    }
    await expectText(page, total, "1.272,50 €", "SUV · White-Gloss Ceramic + Felgen, Leder inklusive");
    await step(1);
    await page.locator('input[name="paket"][value="premium"]').check();
    await step(2);
    assert.equal(await page.locator("#extra-leder").isChecked(), false, "Included extra dropped");
    await expectText(page, total, "585 €", "Back to White-Gloss Signature without leftover extras");

    await step(1);
    await page.locator('input[name="klasse"][value="kompakt"]').check();
    await step(2);
    await page.selectOption("#city", "nagold");
    await expectText(page, total, "518 €", "Kompakt · Politur + Felgen · Abholung Nagold 50 €");
    await page.selectOption("#city", "sindelfingen");
    await expectText(page, total, "468 €", "Pickup beyond 50 km is not priced");
    await expectText(page, ".booking-price", "zzgl. Abholung nach Absprache", "Pickup on request");
    await step(1);
    await page.locator('input[name="paket"][value="keramik"]').check();
    await expectText(page, total, "1.018 €", "White-Gloss Ceramic includes pickup up to 60 km");

    await step(3);
    await page.locator("#name").waitFor({ state: "visible" });
    assert.ok(await page.locator('form.booking-flow button[type="submit"]').isVisible());
    await captureBookingStep(page, "desktop-1280-kontakt.png");
    await step(2);
    assert.equal(await page.locator("#extra-felgen").isChecked(), true, "Selection is kept");
    results.push("Contact step reachable and reversible without losing the selection");

    await page.goto(`${qaBase}/`, { waitUntil: "networkidle" });

    const pickupLinks = page.getByRole("list", { name: "Abholorte", exact: true });
    for (const [slug, name, expected] of [
      ["sulz-am-neckar", "Sulz am Neckar", "30 €"],
      ["voehringen", "Vöhringen", "30 €"],
      ["schopfloch", "Schopfloch", "30 €"],
      ["empfingen", "Empfingen", "kostenlos"],
      ["dornhan", "Dornhan", "50 €"],
      ["sindelfingen", "Sindelfingen", "auf Anfrage"],
    ]) {
      const chip = pickupLinks.locator(`a[href="/abholservice/${slug}"]`);
      assert.equal(await chip.count(), 1, `${name}: one pickup link`);
      assert.ok(
        flat(await chip.getAttribute("aria-label")).endsWith(`Abholung ${expected}`),
        `${name}: accessible pickup price is ${expected}`,
      );
      await chip.scrollIntoViewIfNeeded();
      const price = chip.locator(".city-chip-status");
      assert.ok(await price.isVisible(), `${name}: pickup price is visible`);
      assert.equal(flat(await price.innerText()), expected, `${name}: visible pickup price`);
    }
    results.push("Homepage pickup prices: city overrides, free pickup, tier and on-request agree visually and accessibly");
    await page.locator("#pakete").scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    assert.ok(
      assets.some((path) => /\/assets\/gsap-/.test(path)),
      "Desktop motion loads GSAP on demand",
    );
    results.push("Desktop loads the scroll-motion chunk on demand");
    await checkMediaCollections(page, 1280);
    await context.close();
  }

  /* ---- Mobile: form without overflow, no desktop motion download ---- */
  {
    const { context, page, assets } = await openContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await openBooking(page);
    await bookingLayout(page, { desktop: false, embedded: true });
    await captureBookingStep(page, "mobile-390-auswahl.png", { includeSteps: true });
    await page.locator(".booking-steps button").nth(1).click();
    const extrasBox = page.locator("details.booking-extras");
    if (!(await extrasBox.evaluate((details) => details.open)))
      await extrasBox.locator("summary").click();
    await page.locator("#extra-ozon").check();
    await page.locator("#extra-leder").check();
    await expectText(page, ".booking-price strong", "597 €", "Mobile total");
    assert.ok((await overflow(page)) <= 2, "No horizontal overflow in the extras step");
    await placeBelowHeader(page, "form.booking-flow");
    await page.waitForFunction(
      () => document.querySelector("[data-wa-float]")?.getAttribute("aria-hidden") === "true",
      undefined,
      { timeout: 5000 },
    );
    results.push("WhatsApp button hides over the lazily loaded booking form");
    await captureBookingStep(page, "mobile-390-extras.png");
    await page.locator(".booking-steps button").nth(2).click();
    await page.locator("#name").waitFor({ state: "visible" });
    assert.ok((await overflow(page)) <= 2, "No horizontal overflow in the contact step");
    await captureBookingStep(page, "mobile-390-kontakt.png");
    assert.ok(
      !assets.some((path) => /\/assets\/(gsap|ScrollTrigger)-/.test(path)),
      "Phones never download the desktop motion chunk",
    );
    results.push("Phones: booking without overflow, no GSAP download");
    await context.close();
  }

  /* ---- Standalone calculator: its own desktop sidebar must remain intact. ---- */
  for (const width of [390, 1280]) {
    const { context, page } = await openContext({
      viewport: { width, height: width < 700 ? 844 : 900 },
      reducedMotion: "reduce",
    });
    try {
      await openBooking(page, "/preise");
      await bookingLayout(page, { desktop: width >= 960, embedded: false });
      await captureBookingStep(page, `standalone-preise-${width}.png`, { includeSteps: true });
    } finally { await context.close(); }
  }

  /* ---- Gallery: curated selection, all photos, uncropped viewer, keyboard ---- */
  {
    const { context, page } = await openContext({ viewport: { width: 1280, height: 900 } });
    await page.goto(`${qaBase}/galerie`, { waitUntil: "networkidle" });
    await dismissConsent(page);
    assert.equal(await page.locator(".customer-photo-grid > li").count(), 6);
    const dialog = page.locator("dialog.customer-photo-dialog");
    const curatedTitles = await page.locator(".customer-photo-grid h3").allTextContents();
    await page.locator(".customer-photo-trigger").first().click();
    await dialog.waitFor({ state: "visible" });
    await expectText(page, "dialog.customer-photo-dialog .kicker", "Bild 1 von 6", "Curated start");
    await page.keyboard.press("ArrowRight");
    await expectText(page, "dialog.customer-photo-dialog h2", curatedTitles[1], "Curated next");
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    await page.locator(".customer-photo-all").click();
    assert.equal(await page.locator(".customer-photo-grid > li").count(), 25);
    const trigger = page.locator(".customer-photo-trigger").first();
    await trigger.click();
    await dialog.waitFor({ state: "visible" });
    assert.equal(
      await dialog
        .locator(".customer-photo-viewer > img")
        .evaluate((img) => getComputedStyle(img).objectFit),
      "contain",
    );
    await expectText(page, "dialog.customer-photo-dialog .kicker", "Bild 1 von 25", "Viewer start");
    await page.keyboard.press("ArrowRight");
    await expectText(page, "dialog.customer-photo-dialog .kicker", "Bild 2 von 25", "ArrowRight");
    await page.screenshot({ path: `${output}/desktop-1280-galerie-viewer.png` });
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert.equal(await trigger.evaluate((element) => element === document.activeElement), true);
    results.push(
      "Gallery: 6 curated, all 25 photos, uncropped viewer, arrows, Escape, focus return",
    );
    assert.equal(
      (await page.locator("#kundenbeispiele video, #kundenbeispiele .wg-video-card").count()) > 0,
      true,
    );
    await context.close();
  }

  /* ---- Responsive widths required for the release ---- */
  for (const width of [320, 375, 768, 1024, 1280, 1440, 1536]) {
    const { context, page } = await openContext({
      viewport: { width, height: width < 700 ? 844 : 900 },
      reducedMotion: "reduce",
    });
    // 320 and 375 px are crawled page by page in check-responsive.mjs.
    const paths = width < 700 ? ["/", "/galerie"] : ["/", "/galerie", "/preise", "/impressum"];
    for (const path of paths) {
      await page.goto(qaBase + path, { waitUntil: "networkidle" });
      await dismissConsent(page);
      if (width >= 700) {
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < height; y += 700) {
          await page.evaluate((top) => window.scrollTo(0, top), y);
          const excess = await overflow(page);
          assert.ok(excess <= 2, `${path} @${width}, scroll ${y}: horizontal overflow ${excess}`);
        }
        await page.evaluate(() => window.scrollTo(0, 0));
      } else {
        assert.ok((await overflow(page)) <= 2, `${path} @${width}: horizontal overflow`);
      }
      if (path === "/" || path === "/galerie")
        await page.screenshot({
          path: `${output}/${path === "/" ? "home" : "galerie"}-${width}.png`,
        });
      if (path === "/") {
        if ([320, 768, 1024, 1440].includes(width)) results.push(await verifyRundumUi(page, {
          label: `chromium-${width}`,
          screenshot: async (name, target, options) => options
            ? page.screenshot({ path: `${output}/${name}`, ...options })
            : target.screenshot({ path: `${output}/${name}` }),
        }));
        await checkMediaCollections(page, width);
        if (width === 1280) {
          await placeBelowHeader(page, "#pakete");
          await page.screenshot({ path: `${output}/desktop-packages-reduced-motion.png` });
        }
      }
    }
    await openBooking(page);
    await bookingLayout(page, { desktop: width >= 960, embedded: true });
    await captureBookingStep(page, `buchung-${width}.png`, { includeSteps: true });
    results.push(`No horizontal overflow at ${width}px on ${paths.join(", ")}`);
    await context.close();
  }

  const impressum = await (await fetch(`${qaBase}/impressum`)).text();
  assert.match(impressum, /DE465024196/, "VAT ID stays in the imprint");
  assert.doesNotMatch(impressum, /42161-24623|Steuernummer/, "Private tax number stays removed");
  results.push("Imprint keeps the VAT ID and omits the private tax number");

  assertBrowserDiagnostics(diagnostics);
} finally {
  const evidence = diagnostics.map((item) => item.snapshot());
  await writeFile(
    `${output}/results.json`,
    JSON.stringify({
      passed: results.length,
      results,
      iconPreloadObservations,
      rundumArrivalObservations,
      errors: evidence.flatMap((item) => item.errors),
      blocked: evidence.flatMap((item) => item.blocked),
      ignored: evidence.flatMap((item) => item.ignored),
      warnings: evidence.flatMap((item) => item.warnings),
    }, null, 2),
  );
  await browser.close();
}
console.log(JSON.stringify({ passed: results.length, results }, null, 2));

