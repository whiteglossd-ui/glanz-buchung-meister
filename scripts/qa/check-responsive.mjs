// Browser execution is restricted to the existing isolated Linux GitHub CI job.
import { assertIsolatedGithubCi } from "../hosting-policy.mjs";
assertIsolatedGithubCi();
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { qaBase } from "./ports.mjs";
import { qaClientHeaders } from "./client-identity.mjs";
import { scrollHeroWithWheel } from "./hero-diagnostics.mjs";
import { cities, services } from "../../src/data/site.ts";

const responsiveStarted = Date.now();
const browser = await chromium.launch({ headless: true });
const results = [];
const failures = [];
let progress = { stage: "starting", completed: 0, updatedAt: new Date().toISOString() };
let contextSequence = 0;
async function scrollAndRender(page, top) {
  await page.evaluate((position) => window.scrollTo(0, position), top);
  // The runner clock also works when headless Chromium suspends frame/timer
  // promises. The subsequent geometry reads still force the actual layout.
  await new Promise((done) => setTimeout(done, 32));
}
async function openPage(viewport, reducedMotion = "reduce") {
  const context = await browser.newContext({ reducedMotion, viewport, extraHTTPHeaders: qaClientHeaders("responsive", `context-${contextSequence++}`) });
  try {
    // No third-party analytics and no genuine submissions/uploads during QA.
    await context.route("**/*", async (route) => {
      const request = route.request();
      if (new URL(request.url()).origin !== qaBase || !["GET", "HEAD"].includes(request.method()))
        return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15_000);
    page.setDefaultNavigationTimeout(15_000);
    page.on("pageerror", (error) => failures.push(`${page.url()}: ${error.message}`));
    await page.bringToFront();
    return { context, page };
  } catch (error) {
    await context.close();
    throw error;
  }
}
const bookingCtaName = "Jetzt Termin anfragen";
async function bookingGeometry(page) {
  return page.evaluate(() => {
    const booking = document.querySelector("#buchung")?.getBoundingClientRect();
    return { path: location.pathname + location.hash, scrollY, documentHeight: document.documentElement.scrollHeight,
      bookingDocumentTop: booking ? booking.top + scrollY : null,
      activeElement: document.activeElement?.id || document.activeElement?.tagName,
      htmlClasses: document.documentElement.className, bodyOverflow: getComputedStyle(document.body).overflow,
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      bookingFormMounted: !!document.querySelector("#buchung .booking-flow"),
      formChunks: performance.getEntriesByType("resource").filter((entry) => /^\/assets\/rundum-service-form-[^/]+\.js$/.test(new URL(entry.name).pathname))
        .map((entry) => ({ path: new URL(entry.name).pathname, start: entry.startTime, end: entry.responseEnd })) };
  });
}
async function settleBookingGeometry(page, timeout, evidence) {
  await page.evaluate(() => {
    window.__qaBookingGeometry = { y: scrollY, height: document.documentElement.scrollHeight, since: performance.now(), lastSample: -Infinity, samples: [] };
  });
  try {
    await page.waitForFunction(() => {
      const probe = window.__qaBookingGeometry, now = performance.now(), height = document.documentElement.scrollHeight;
      const formMounted = !!document.querySelector("#buchung .booking-flow");
      if (Math.abs(scrollY - probe.y) > 0.5 || height !== probe.height || !formMounted) {
        probe.y = scrollY; probe.height = height; probe.since = now;
      }
      if (now - probe.lastSample >= 150) {
        probe.lastSample = now;
        probe.samples.push({ at: Math.round(now), scrollY, documentHeight: height, bookingFormMounted: formMounted,
          activeElement: document.activeElement?.id || document.activeElement?.tagName });
        if (probe.samples.length > 16) probe.samples.shift();
      }
      return now - probe.since >= 150;
    }, undefined, { timeout });
  } finally {
    evidence.samples.push(...await page.evaluate(() => window.__qaBookingGeometry.samples));
    evidence.state = await bookingGeometry(page);
  }
}
async function returnToHero(page, evidence) {
  const resetStarted = Date.now();
  const deadline = resetStarted + 10000;
  const remaining = () => {
    const timeout = deadline - Date.now();
    assert.ok(timeout > 0, "Wheel receipt and settling share the existing ten-second reset deadline");
    return timeout;
  };
  evidence.before = await bookingGeometry(page);
  evidence.wheelHits = [];
  await page.evaluate(() => {
    const inspect = (element) => {
      const style = getComputedStyle(element);
      return { tag: element.tagName, id: element.id, type: element.getAttribute("type"),
        overflowY: style.overflowY, overscrollY: style.overscrollBehaviorY,
        scrollTop: element.scrollTop, clientHeight: element.clientHeight, scrollHeight: element.scrollHeight,
        nativeControl: ["INPUT", "TEXTAREA", "SELECT", "OPTION"].includes(element.tagName),
        nestedScroller: !["HTML", "BODY"].includes(element.tagName) && /^(?:auto|scroll)$/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 1,
        wheelPrevent: ["data-lenis-prevent", "data-lenis-prevent-wheel", "data-lenis-prevent-vertical"].some((name) => element.hasAttribute(name)) };
    };
    const probe = { inspect, count: 0, events: [] };
    probe.listener = (event) => {
      probe.count++;
      probe.events.push({ event, trusted: event.isTrusted, deltaY: event.deltaY, x: event.clientX, y: event.clientY,
        path: event.composedPath().filter((node) => node instanceof HTMLElement).map(inspect) });
    };
    window.__qaReturnWheel = probe;
    window.addEventListener("wheel", probe.listener, { capture: true, passive: true });
  });
  try {
    const result = await scrollHeroWithWheel({
      readY: () => page.evaluate(() => scrollY),
      wheel: async (deltaY) => {
        const hit = await page.evaluate(() => {
          const probe = window.__qaReturnWheel;
          const measure = (x, y) => {
            const element = document.elementFromPoint(x, y), path = [];
            for (let node = element; node instanceof HTMLElement; node = node.parentElement) path.push(probe.inspect(node));
            return { x, y, path, rootSurface: !!element && ["MAIN", "SECTION", "BODY", "HTML"].includes(element.tagName) };
          };
          const blocked = (point) => point.path.some((node) => node.nativeControl || node.nestedScroller || node.wheelPrevent);
          const center = measure(innerWidth / 2, innerHeight / 2);
          // A real native form scroller may legitimately own wheel input. Use
          // a measured empty page gutter only when that interception is proven.
          const gutter = blocked(center) ? [measure(8, innerHeight / 2), measure(innerWidth - 8, innerHeight / 2)]
            .find((point) => point.rootSurface && !blocked(point)) : undefined;
          return { center, selected: gutter ?? center, reason: gutter ? "measured-control-or-nested-scroller" : "original-page-center", beforeCount: probe.count };
        });
        evidence.wheelHits.push(hit);
        await page.mouse.move(hit.selected.x, hit.selected.y);
        await page.mouse.wheel(0, deltaY);
        // Playwright's wheel promise does not await delivery or scrolling.
        // Observe the actual trusted event before checking settled geometry.
        await page.waitForFunction(({ count, direction }) => {
          const probe = window.__qaReturnWheel;
          return probe.count > count && probe.events.slice(count).some((record) => record.trusted && Math.sign(record.deltaY) === direction);
        }, { count: hit.beforeCount, direction: Math.sign(deltaY) }, { timeout: remaining() });
      },
      settle: (timeout) => settleBookingGeometry(page, Math.min(timeout, remaining()), evidence),
    }, 0, { timeoutMs: remaining(), onAttempt: (attempt) => evidence.attempts.push(attempt) });
    assert.ok(result.actual <= 1, "A real wheel return must reach the top before reactivating the same hash");
    return result;
  } catch (error) {
    evidence.wheelEvents = await page.evaluate(() => window.__qaReturnWheel.events.map(({ event, ...record }) => ({
      ...record, defaultPrevented: event.defaultPrevented, lenisStopPropagation: event.lenisStopPropagation === true,
    })));
    console.error("RESPONSIVE_RETURN_FAILURE:" + JSON.stringify({ ...progress, evidence }));
    throw new Error(`Return to hero failed: ${JSON.stringify({ ...progress, evidence })}`, { cause: error });
  } finally {
    evidence.durationMs = Date.now() - resetStarted;
    evidence.wheelEvents = await page.evaluate(() => {
      const probe = window.__qaReturnWheel;
      window.removeEventListener("wheel", probe.listener, true);
      return probe.events.map(({ event, ...record }) => ({ ...record,
        defaultPrevented: event.defaultPrevented, lenisStopPropagation: event.lenisStopPropagation === true }));
    });
  }
}
async function assertBookingArrival(page, label) {
  try {
    await page.waitForFunction(() => {
      const heading = document.getElementById("buchung-heading");
      const box = heading?.getBoundingClientRect();
      const header = document.querySelector("[data-site-header]")?.getBoundingClientRect();
      const hit = box && document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return location.pathname === "/" && location.hash === "#buchung" &&
        heading?.tabIndex === -1 && document.activeElement === heading &&
        box && header && box.width > 0 && box.height > 0 &&
        box.top >= header.bottom - 1 && box.bottom <= innerHeight &&
        box.left >= 0 && box.right <= innerWidth && heading.contains(hit);
    }, undefined, { timeout: 10_000 });
  } catch (error) {
    const state = await page.evaluate(() => {
      const heading = document.getElementById("buchung-heading");
      return {
        url: location.pathname + location.hash,
        activeElement: document.activeElement?.id || document.activeElement?.tagName,
        tabIndex: heading?.tabIndex,
        heading: heading?.getBoundingClientRect().toJSON(),
        header: document.querySelector("[data-site-header]")?.getBoundingClientRect().toJSON(),
        viewport: { width: innerWidth, height: innerHeight },
      };
    });
    throw new Error(`${label}: booking heading must receive focus and remain fully visible below the header: ${JSON.stringify(state)}`, { cause: error });
  }
}
async function verifyBookingActivation(page, width, reducedMotion) {
  const headerCta = page.locator("[data-site-header] [data-header-cta]");
  const heroCta = page.locator("[data-hero-cta=booking]");
  await headerCta.click();
  await assertBookingArrival(page, `${width}px ${reducedMotion}, first header click`);
  const form = page.locator("#buchung .booking-flow");
  await form.waitFor({ state: "visible" });
  const bookingLayout = { samples: [] };
  // The active form must finish loading and settle before measuring focus and scroll.
  try { await settleBookingGeometry(page, 5000, bookingLayout); }
  catch (error) {
    console.error("RESPONSIVE_LAYOUT_FAILURE:" + JSON.stringify({ width, reducedMotion, bookingLayout }));
    throw error;
  }
  await assertBookingArrival(page, `${width}px ${reducedMotion}, stable first header arrival`);
  const scrollResets = [];
  // Exercise existing client-side inputs only. The context still blocks every
  // write request, and no submit button, consent or file picker is activated.
  await form.locator('input[name="paket"][value="keramik"]').check();
  await form.locator('input[name="klasse"][value="suv"]').check();
  await form.locator(".booking-steps button").nth(1).click();
  await form.locator("#city").selectOption("nagold");
  await form.locator(".booking-steps button").nth(2).click();
  // changeStep focuses/scrolls in requestAnimationFrame. Observe that actual
  // production effect before filling and before the later return-to-hero test.
  await page.waitForFunction(() => {
    const title = document.querySelector(".booking-step-title");
    return title === document.activeElement && title?.textContent?.trim() === "Kontakt & Anfrage";
  });
  await form.locator("#note").fill("Synthetische CI-Notiz: nur Navigation prüfen, keine Anfrage senden.");
  const readDraft = () => form.evaluate((element) => ({
    package: element.querySelector('input[name="paket"]:checked')?.value,
    vehicleClass: element.querySelector('input[name="klasse"]:checked')?.value,
    city: element.querySelector("#city")?.value,
    note: element.querySelector("#note")?.value,
    step: element.querySelector('.booking-steps [aria-current="step"]')?.textContent,
  }));
  const draft = await readDraft();
  for (const [source, link] of [["header", headerCta], ["hero", heroCta]]) {
    for (const activation of ["mouse", "Enter"]) {
      progress = { stage: "booking-cta", path: "/", width, reducedMotion, source, activation, completed: results.length, updatedAt: new Date().toISOString() };
      console.log("RESPONSIVE_RESET_START:" + JSON.stringify({ width, reducedMotion, source, activation, elapsedMs: Date.now() - responsiveStarted }));
      // Keep #buchung in the URL while leaving the destination. This catches
      // handlers that only react to a changed hash or retain the old focus.
      const reset = { source, activation, attempts: [], samples: [] };
      scrollResets.push(reset);
      await returnToHero(page, reset);
      if (source === "hero") {
        // With motion enabled, the real film eases its copy back in after
        // scrollY reaches zero. Wait for that visible, interactive state before
        // moving keyboard focus; do not disable the production inert behavior.
        await page.waitForFunction(() => {
          const link = document.querySelector("[data-hero-cta=booking]");
          const copy = link?.closest(".reel__ch");
          return link && !link.closest("[inert]") && copy &&
            Number(getComputedStyle(copy).opacity) >= 0.99;
        }, undefined, { timeout: 5_000 });
      }
      await link.focus();
      assert.equal(await link.evaluate((element) => element === document.activeElement), true,
        `${width}px ${source}: move focus away from the booking heading before reactivation.`);
      assert.equal(new URL(page.url()).hash, "#buchung", "Exercise repeated activation of the same hash.");
      if (activation === "mouse") await link.click();
      else await link.press("Enter");
      await assertBookingArrival(page, `${width}px ${reducedMotion}, ${source} ${activation}`);
      assert.deepEqual(await readDraft(), draft,
        `${width}px ${reducedMotion}, ${source} ${activation}: preserve entered fields, selection and current form step.`);
      assert.equal(await page.evaluate(() => document.querySelectorAll("#buchung").length), 1,
        "CTA navigation must retain the single existing request flow.");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(overflow <= 2, `${width}px ${source}: booking destination overflows by ${overflow}px.`);
    }
  }
  if (reducedMotion === "reduce" && [390, 1440].includes(width)) {
    await page.screenshot({ path: `.qa-output/review-booking-target-${width}.png`, fullPage: false });
  }
  console.log("RESPONSIVE_BOOKING_PROOF:" + JSON.stringify({ width, reducedMotion,
    booking: bookingLayout.state, resets: scrollResets.map((reset) => ({ source: reset.source, activation: reset.activation,
      beforeY: reset.before.scrollY, afterY: reset.state.scrollY, documentHeight: reset.state.documentHeight,
      bookingFormMounted: reset.state.bookingFormMounted, durationMs: reset.durationMs, attempts: reset.attempts })) }));
  return { sameHashActivations: 4, bookingHeadingFocusedAndVisible: true, draftPreserved: true, bookingLayout, scrollResets };
}
const paths = [
  ...new Set([
    "/",
    "/freudenstadt-lossburg",
    "/preise",
    "/leistungen",
    "/leistungen/keramikversiegelung",
    "/leistungen/keramikversiegelung/nagold",
    "/abholservice",
    "/abholservice/nagold",
    "/abholservice/sindelfingen",
    "/ratgeber/keramikversiegelung-langzeitschutz",
    "/kontakt",
    "/fahrzeug-zustand",
    "/dellen-hagelschaden",
    ...cities.map((city) => `/abholservice/${city.slug}`),
    ...services
      .filter((service) => !service.pendingApproval)
      .map((service) => `/leistungen/${service.slug}`),
  ]),
];
try {
  for (const width of [320, 375, 390]) {
    const { context, page } = await openPage({ width, height: 844 });
    try {
      for (const path of paths) {
        // Each page/width is an independent crawl case, not one customer making
        // hundreds of booking-calendar requests in a minute.
        await context.setExtraHTTPHeaders(qaClientHeaders("responsive", `${width}:${path}`));
        progress = { stage: "navigation", path, width, completed: results.length, updatedAt: new Date().toISOString() };
        await page.goto(qaBase + path, { waitUntil: "networkidle" });
        // content-visibility:auto defers layout below the fold. Exercise the real
        // scroll path before judging overflow; do not disable production styles.
        for (
          let y = 0;
          y < (await page.evaluate(() => document.documentElement.scrollHeight));
          y += 650
        ) {
          progress = { stage: "scroll", path, width, top: y, completed: results.length, updatedAt: new Date().toISOString() };
          await scrollAndRender(page, y);
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          if (overflow > 2) {
            failures.push(`${path} @${width}, scroll ${y}: horizontal overflow ${overflow}`);
            break;
          }
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        const state = await page.evaluate(() => {
          const viewport = document.documentElement.clientWidth;
          const scroll = document.documentElement.scrollWidth;
          // Detailed failure diagnostics must not force layout of every
          // content-visibility descendant after each successful crawl. The
          // real scroll path above still checks overflow at every 650px step.
          const horizontalOffenders = scroll > viewport + 2 ? [...document.querySelectorAll("main *")]
            .filter((e) => {
              const box = e.getBoundingClientRect();
              return (
                box.width > 0 &&
                (box.right > viewport + 2 || box.left < -2) &&
                getComputedStyle(e).position !== "absolute"
              );
            })
            .slice(0, 8)
            .map((e) => ({ tag: e.tagName, class: e.className })) : [];
          return {
            viewport,
            scroll,
            h1: [...document.querySelectorAll("h1")].map((e) => e.textContent),
            duplicateMinutePeriod: /\bMin\.\./.test(document.querySelector("main")?.textContent ?? ""),
            horizontalOffenders,
          };
        });
        results.push({ path, width, ...state });
        if (["/", "/abholservice/nagold", "/leistungen/keramikversiegelung/nagold"].includes(path)) {
          await page.screenshot({
            path: `.qa-output/mobile-${width}-${path.replace(/\W+/g, "-") || "home"}.png`,
            fullPage: false,
          });
        }
        if (state.h1.length !== 1) failures.push(`${path} @${width}: one H1 required`);
        if (path.startsWith("/abholservice/") && state.duplicateMinutePeriod)
          failures.push(`${path} @${width}: journey text has a duplicate sentence-ending period`);
        if (state.scroll > state.viewport + 2)
          failures.push(`${path} @${width}: horizontal overflow ${JSON.stringify(state)}`);
      }
    } finally {
      await context.close();
    }
  }
  console.log("RESPONSIVE_CRAWL_DONE:" + JSON.stringify({ cases: results.length, elapsedMs: Date.now() - responsiveStarted }));
  // This independent first visit keeps the crawl cases and their consent state
  // unchanged, while exercising the real dismiss/reopen controls on a city hub.
  {
    const { context, page } = await openPage({ width: 390, height: 844 });
    try {
      progress = { stage: "city-consent-overlay", path: "/abholservice/nagold", width: 390, completed: results.length, updatedAt: new Date().toISOString() };
      await page.goto(qaBase + "/abholservice/nagold", { waitUntil: "networkidle" });
      const consent = page.getByRole("dialog", { name: "Cookie-Einstellungen", exact: true });
      const cityCta = page.locator(".city-wa-bar");
      await consent.waitFor({ state: "visible" });
      await page.locator('body[data-consent-banner="open"]').waitFor({ state: "attached" });
      assert.equal(await cityCta.count(), 1, "The city CTA exists before testing its consent-dependent visibility.");
      assert.equal(await page.evaluate(() => localStorage.getItem("wg-consent")), null, "Use a genuine first visit.");
      await cityCta.waitFor({ state: "hidden" });
      await scrollAndRender(page, 0);
      const heading = await page.locator("main h1").boundingBox();
      const banner = await consent.boundingBox();
      assert.ok(heading && banner && heading.y + heading.height <= banner.y,
        `Nagold's full heading remains above consent: ${JSON.stringify({ heading, banner })}`);
      await page.screenshot({ path: ".qa-output/mobile-390--abholservice-nagold.png", fullPage: false });

      await consent.getByRole("button", { name: "Ablehnen", exact: true }).click();
      await consent.waitFor({ state: "hidden" });
      await cityCta.waitFor({ state: "visible" });
      assert.equal(await page.evaluate(() => localStorage.getItem("wg-consent")), "rejected");

      // The footer button is rendered by CookieSettingsButton with this name.
      await page.getByRole("button", { name: "Cookie-Einstellungen", exact: true }).click();
      await consent.waitFor({ state: "visible" });
      await cityCta.waitFor({ state: "hidden" });
      assert.equal(await page.evaluate(() => localStorage.getItem("wg-consent")), "rejected",
        "Reopening settings must not change the stored decision.");
      results.push({ path: "/abholservice/nagold", width: 390, firstVisit: true, cityCtaHiddenDuringConsent: true, cityCtaVisibleAfterRejection: true, cityCtaHiddenAfterReopen: true });
    } finally {
      await context.close();
    }
  }
  // The homepage has one booking CTA in its header. Its desktop navigation
  // also links to the pickup service at the 959/960px navigation boundary.
  const headerCases = [320, 390, 768, 900, 959, 960, 1024, 1440]
    .map((width) => ({ width, reducedMotion: "reduce" }));
  headerCases.push(...[390, 1440].map((width) => ({ width, reducedMotion: "no-preference" })));
  for (const { width, reducedMotion } of headerCases) {
    const caseStarted = Date.now();
    console.log("RESPONSIVE_CASE_START:" + JSON.stringify({ width, reducedMotion, elapsedMs: caseStarted - responsiveStarted }));
    const { context, page } = await openPage({ width, height: width <= 390 ? 844 : 1000 }, reducedMotion);
    try {
      progress = { stage: "header-navigation", path: "/", width, completed: results.length, updatedAt: new Date().toISOString() };
      await page.goto(qaBase + "/", { waitUntil: "networkidle" });
      const consent = page.getByRole("dialog", { name: "Cookie-Einstellungen", exact: true });
      if (await consent.isVisible()) {
        await consent.getByRole("button", { name: "Ablehnen", exact: true }).click();
        await consent.waitFor({ state: "hidden" });
      }
      const header = page.locator("[data-site-header]");
      const booking = header.locator("[data-header-cta]");
      assert.equal(await booking.count(), 1, `${width}px: retain the primary header CTA.`);
      assert.equal(await header.getByRole("link", { name: bookingCtaName, exact: true }).count(), 1,
        `${width}px: the primary header CTA has the exact accessible name.`);
      assert.equal(await booking.isVisible(), true, `${width}px: keep the primary header CTA visible.`);
      assert.equal(await booking.getAttribute("href"), "/#buchung");
      assert.equal(await header.locator('a[href="/#buchung"]').count(), 1);
      // Dark Edition (25.11.2026): the desktop links follow the template breakpoint
      // (>1100px) and lead to the pickup page; the phone menu offers the same page.
      const pickupLink = header.locator('.hdr__links a[href="/abholservice"]');
      assert.equal(await pickupLink.count(), 1);
      assert.equal((await pickupLink.textContent()).trim(), "Abholservice");
      assert.equal(await pickupLink.isVisible(), width > 1100,
        `${width}px: pickup navigation follows the desktop breakpoint.`);
      if (width > 1100) {
        const navBounds = await pickupLink.boundingBox();
        assert.ok(navBounds && navBounds.height >= 44,
          `${width}px: the pickup navigation touch target must remain accessible.`);
      }
      const heroBooking = page.locator("[data-hero-cta=booking]");
      assert.equal(await page.locator(".reel").getByRole("link", { name: bookingCtaName, exact: true }).count(), 1,
        `${width}px: the hero booking link has its visible accessible name.`);
      assert.equal(await heroBooking.getAttribute("href"), "#buchung");
      assert.equal(await page.locator('[data-hero-actions] a[href="#ablauf"]').count(), 1,
        `${width}px: the secondary hero action links to the combined pickup process.`);
      assert.equal(await page.locator("[data-hero-actions] a[href]").count(), 2,
        `${width}px: keep exactly two hero actions.`);
      assert.equal(await heroBooking.isVisible(), true, `${width}px: the hero CTA remains visible.`);
      const bounds = await booking.boundingBox();
      assert.ok(bounds && bounds.height >= 44 && bounds.width >= 44 && bounds.x >= 0 && bounds.x + bounds.width <= width,
        `${width}px: the booking link must retain its visible touch target.`);
      const heroBounds = await heroBooking.boundingBox();
      assert.ok(heroBounds && heroBounds.height >= 44 && heroBounds.width >= 44 && heroBounds.x >= 0 && heroBounds.x + heroBounds.width <= width,
        `${width}px: the hero CTA must retain its visible touch target.`);
      const toggle = header.getByRole("button", { name: "Menü öffnen", exact: true });
      const logoBounds = await header.locator("[data-site-logo]").boundingBox();
      assert.ok(logoBounds && Math.abs(logoBounds.x + logoBounds.width / 2 - width / 2) <= 2,
        `${width}px: the White-Gloss logo stays centered.`);
      const controls = await header.locator("[data-site-logo], [data-menu-toggle], [data-header-cta], .hdr__links a").evaluateAll((elements) => elements
        .map((element) => ({ name: element.getAttribute("aria-label") || element.textContent.trim(), ...element.getBoundingClientRect().toJSON() }))
        .filter((box) => box.width > 0 && box.height > 0));
      const headerBounds = await header.boundingBox();
      const disjoint = (a, b) => a.right <= b.left + 1 || b.right <= a.left + 1 || a.bottom <= b.top + 1 || b.bottom <= a.top + 1;
      for (const [index, control] of controls.entries()) {
        assert.ok(headerBounds && control.left >= 0 && control.right <= width && control.top >= headerBounds.y - 1 && control.bottom <= headerBounds.y + headerBounds.height + 1,
          `${width}px: header control stays inside the viewport/header: ${JSON.stringify(control)}`);
        for (const other of controls.slice(index + 1)) {
          assert.ok(disjoint(control, other), `${width}px: header controls overlap: ${JSON.stringify({ control, other })}`);
        }
      }
      assert.equal(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches), reducedMotion === "reduce");
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 2),
        `${width}px: the header and hero must not introduce horizontal overflow.`);
      await toggle.focus();
      await toggle.press("Enter");
      const menu = page.getByRole("dialog", { name: "Hauptnavigation", exact: true });
      await menu.waitFor({ state: "visible" });
      assert.equal(await menu.getByRole("link", { name: "Hol- und Bringservice", exact: true }).getAttribute("href"), "/abholservice");
      assert.equal(await menu.locator('a[href="/#buchung"]').count(), 1, "The menu offers a single booking action.");
      // CSS can expose the portal before React's showModal/focus effect runs.
      // Await the required native-modal/focus result; never inject focus here.
      await page.waitForFunction(() => {
        const dialog = document.getElementById("wgt-menu");
        return dialog instanceof HTMLDialogElement && dialog.open && dialog.matches(":modal")
          && dialog.contains(document.activeElement);
      }, undefined, { timeout: 2000 });
      assert.equal(await menu.evaluate((element) => element.contains(document.activeElement)), true,
        `${width}px: keyboard focus enters the open menu.`);
      await page.keyboard.press("Escape");
      await menu.waitFor({ state: "hidden" });
      assert.equal(await toggle.evaluate((element) => element === document.activeElement), true,
        `${width}px: closing the menu restores focus to its trigger.`);
      if (reducedMotion === "reduce") await header.screenshot({ path: `.qa-output/review-header-${width}.png` });
      const activation = await verifyBookingActivation(page, width, reducedMotion);
      results.push({ path: "/", width, reducedMotion, primaryHeaderBookingLinks: 1, desktopPickupVisible: width >= 960, menuKeyboardFocusReturned: true, ...activation });
      console.log("RESPONSIVE_CASE_DONE:" + JSON.stringify({ width, reducedMotion, elapsedMs: Date.now() - responsiveStarted, durationMs: Date.now() - caseStarted }));
    } finally {
      await context.close();
    }
  }
  // Review the changed request path at phone and desktop sizes. These images
  // are produced by the existing isolated Linux CI job, never a local server.
  for (const { width, path } of [390, 1440].flatMap((width) => ["/", "/freudenstadt-lossburg"].map((path) => ({ width, path })))) {
    const routeLabel = path === "/" ? "home" : "lossburg";
    console.log("RESPONSIVE_REVIEW_START:" + JSON.stringify({ width, path, elapsedMs: Date.now() - responsiveStarted }));
    const { context, page } = await openPage({ width, height: width === 390 ? 844 : 1000 });
    try {
      progress = { stage: "review-navigation", path, width, completed: results.length, updatedAt: new Date().toISOString() };
      await page.goto(qaBase + path, { waitUntil: "networkidle" });
      const consent = page.getByRole("dialog", { name: "Cookie-Einstellungen", exact: true });
      if (await consent.isVisible()) {
        await consent.getByRole("button", { name: "Ablehnen", exact: true }).click();
        await consent.waitFor({ state: "hidden" });
      }
      const order = await page.evaluate(() => {
        // Dark Edition order: hero (with its location choice), packages, results, process, request.
        const selectors = [".reel", "#pakete", "#ergebnisse", "#ablauf", "#buchung"];
        const sections = selectors.map((selector) => document.querySelector(selector));
        return {
          sectionsPresent: sections.every(Boolean),
          locationChoiceInHero: Boolean(document.querySelector('.reel nav[aria-label="Standort wählen"]')),
          editorialOrder: sections.every((section, index) => Boolean(section) && (index === 0 || Boolean(
            sections[index - 1]?.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING,
          ))),
          bookingCount: document.querySelectorAll("#buchung").length,
          processSteps: document.querySelectorAll("#ablauf ol.steps > li").length,
          bookingAliases: ["termin", "service", "rundum-service", "rundum-anfrage"].map((id) => ({
            id,
            count: document.querySelectorAll(`#${id}`).length,
            insideBooking: Boolean(document.getElementById(id)?.closest("#buchung")),
          })),
        };
      });
      assert.equal(order.sectionsPresent, true, "Retain the location choice, packages, results, pickup process and booking.");
      assert.equal(order.locationChoiceInHero, true, "Offer both locations in the introduction.");
      assert.equal(order.editorialOrder, true, "Keep the approved editorial sequence before the request.");
      assert.equal(order.bookingCount, 1, "Keep one request flow and stable incoming anchor links.");
      assert.equal(order.processSteps, 4, "The combined service section has four clear steps.");
      assert.ok(order.bookingAliases.every((alias) => alias.count === 1 && alias.insideBooking),
        "Every supported incoming request anchor resolves once inside the combined booking section.");
      const locationChoice = page.getByRole("navigation", { name: "Standort wählen", exact: true });
      assert.equal(await locationChoice.locator(`a[aria-current="page"][href="${path}"]`).count(), 1,
        "Mark the current location and keep both location choices available.");
      assert.equal(await locationChoice.locator("a[href]").count(), 2);
      await page.locator('[data-hero-actions] a[href="#ablauf"]').click();
      assert.equal(new URL(page.url()).pathname, path, "The service action stays on the chosen location page.");
      assert.equal(new URL(page.url()).hash, "#ablauf");
      await page.waitForFunction(() => {
        const section = document.getElementById("ablauf")?.getBoundingClientRect();
        const header = document.querySelector("[data-site-header]")?.getBoundingClientRect();
        return section && header && section.top >= header.bottom - 1 && section.top < innerHeight;
      }, undefined, { timeout: 5000 });
      await page.locator("[data-hero-cta=booking]").click();
      await page.locator("#buchung .booking-flow").waitFor({ state: "visible", timeout: 15_000 });
      assert.equal(new URL(page.url()).hash, "#buchung", "The existing jump link still targets the booking anchor.");
      assert.equal(new URL(page.url()).pathname, path, "The booking action retains the chosen location.");
      await page.waitForFunction(() => {
        const heading = document.getElementById("buchung-heading")?.getBoundingClientRect();
        const header = document.querySelector("[data-site-header]")?.getBoundingClientRect();
        return heading && header && heading.top >= header.bottom - 1 && heading.top < innerHeight;
      }, undefined, { timeout: 5000 });
      await page.locator("#buchung").screenshot({ path: `.qa-output/review-request-${path === "/" ? "" : "lossburg-"}${width}.png` });
      await page.locator("#ergebnisse").scrollIntoViewIfNeeded();
      // Customer videos play inline; the started player receives keyboard focus.
      const video = page.getByRole("button", { name: "Video abspielen: Hydrophober Lackschutz", exact: true });
      await video.focus();
      await video.press("Enter");
      const player = page.locator('#ergebnisse video[src="/media/customer-beading.mp4"]');
      await player.waitFor({ state: "visible" });
      assert.equal(await player.evaluate((element) => element === document.activeElement && element.controls), true,
        "Move keyboard focus to the started video with its controls.");
      await page.locator("#ergebnisse").screenshot({ path: `.qa-output/review-results-${path === "/" ? "" : "lossburg-"}${width}.png` });
      for (let y = 0; y < await page.evaluate(() => document.documentElement.scrollHeight); y += 650) {
        progress = { stage: "review-scroll", path, width, top: y, completed: results.length, updatedAt: new Date().toISOString() };
        await scrollAndRender(page, y);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `.qa-output/review-${routeLabel}-${width}.png`, fullPage: true });
      results.push({ path, width, review: true, ...order, videoKeyboardFocusMoved: true });
    } finally {
      await context.close();
    }
  }
  const noJavaScriptContext = await browser.newContext({
    javaScriptEnabled: false,
    reducedMotion: "reduce",
    viewport: { width: 390, height: 844 },
  });
  try {
    await noJavaScriptContext.route("**/*", async (route) => {
      const request = route.request();
      if (new URL(request.url()).origin !== qaBase || !["GET", "HEAD"].includes(request.method()))
        return route.abort();
      return route.continue();
    });
    const noJavaScriptPage = await noJavaScriptContext.newPage();
    await noJavaScriptPage.goto(qaBase + "/", { waitUntil: "networkidle" });
    const booking = noJavaScriptPage.locator("#buchung");
    await booking.scrollIntoViewIfNeeded();
    const phoneFallback = booking.locator('a[href="tel:+4915233540284"]');
    assert.equal(await phoneFallback.isVisible(), true, "Show the telephone request fallback without JavaScript.");
    const loading = booking.getByRole("status", { name: "Buchungsformular wird geladen", exact: true });
    assert.equal(await loading.isVisible(), false, "Do not leave a permanent loading placeholder without JavaScript.");
    await booking.screenshot({ path: ".qa-output/review-request-no-javascript.png" });
    results.push({
      path: "/",
      width: 390,
      javaScriptEnabled: false,
      phoneFallbackVisible: true,
      loadingPlaceholderVisible: false,
    });
  } finally {
    await noJavaScriptContext.close();
  }
} catch (error) {
  failures.push(error.message);
  throw error;
} finally {
  await writeFile(".qa-output/responsive-progress.json", JSON.stringify(progress, null, 2));
  await writeFile(".qa-output/responsive-results.json", JSON.stringify(results, null, 2));
  await writeFile(".qa-output/responsive-failures.json", JSON.stringify(failures, null, 2));
  await browser.close();
}
assert.equal(failures.length, 0, failures.join("\n"));
console.log(`${results.length} responsive checks passed; no form or upload submitted.`);

