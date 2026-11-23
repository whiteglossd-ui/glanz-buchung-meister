import assert from "node:assert/strict";
import { RUNDUM_SERVICES } from "../../src/lib/rundum-service.ts";
import { site } from "../../src/data/site.ts";
import { observePageReads } from "./read-completion.mjs";

export const iconPreloadObservations = [];
export const rundumArrivalObservations = [];

async function assertStableRundumArrival(page, label, reads) {
  await reads.complete(label, { timeoutMs: 5000 });
  await page.evaluate(() => {
    window.__qaRundumArrival = { y: scrollY, height: document.documentElement.scrollHeight, since: performance.now(), samples: [] };
  });
  await page.waitForFunction(() => {
    const probe = window.__qaRundumArrival, now = performance.now(), height = document.documentElement.scrollHeight;
    const marker = document.querySelector('[data-inquiry-start="booking"]')?.getBoundingClientRect();
    const near = !!marker && marker.width > 0 && marker.bottom >= -240 && marker.top <= innerHeight + 240;
    const ready = !!document.querySelector("#buchung .booking-flow");
    if (Math.abs(scrollY - probe.y) > 0.5 || probe.height !== height || (near && !ready)) {
      probe.y = scrollY; probe.height = height; probe.since = now;
      probe.samples.push({ at: Math.round(now), y: scrollY, documentHeight: height, bookingReady: ready, markerNear: near });
      if (probe.samples.length > 16) probe.samples.shift();
    }
    return now - probe.since >= 150;
  }, undefined, { timeout: 5000 });
  const state = await page.locator("#buchung-heading").evaluate((element) => {
    const heading = element.getBoundingClientRect(), header = document.querySelector(".site-header")?.getBoundingClientRect();
    const hit = document.elementFromPoint(heading.left + heading.width / 2, heading.top + heading.height / 2);
    return { path: location.pathname + location.hash, scrollY, documentHeight: document.documentElement.scrollHeight,
      activeElement: document.activeElement?.id || document.activeElement?.tagName,
      heading: heading.toJSON(), headerBottom: Math.max(0, header?.bottom ?? 0), viewport: { width: innerWidth, height: innerHeight },
      headingUnobscured: element.contains(hit), bookingReady: !!document.querySelector("#buchung .booking-flow"),
      formChunks: performance.getEntriesByType("resource").filter((entry) => /^\/assets\/(?:rundum-service-form|configurator)-[^/]+\.js$/.test(new URL(entry.name).pathname))
        .map((entry) => ({ path: new URL(entry.name).pathname, start: entry.startTime, end: entry.responseEnd })),
      samples: window.__qaRundumArrival.samples };
  });
  assert.ok(state.path === "/#rundum-anfrage" && state.heading.width > 0 && state.heading.height > 0
    && state.heading.top >= state.headerBottom - 1 && state.heading.bottom <= state.viewport.height
    && state.heading.left >= 0 && state.heading.right <= state.viewport.width && state.headingUnobscured,
  `${label}: real Rundum anchor must remain fully visible below the header after natural neighboring loads: ${JSON.stringify(state)}`);
  rundumArrivalObservations.push({ label, ...state });
}

export function verifyOriginalIconHead(documentHtml, label) {
  assert.equal(typeof documentHtml, "string", `${label}: the original navigation response is required`);
  const head = /<head(?:\s[^>]*)?>([\s\S]*?)<\/head>/i.exec(documentHtml);
  assert.ok(head, `${label}: original response contains an actual head`);
  // Ignore commented/script strings: hydration data containing a link is not a
  // parser-visible head hint. Preserve positions for the recorded evidence.
  const markup = head[1].replace(/<script\b[\s\S]*?<\/script\s*>|<!--[\s\S]*?-->/gi, (value) => " ".repeat(value.length));
  const hints = [...markup.matchAll(/<link\b[^>]*>/gi)].filter((match) => /\brel=["']preload["']/i.test(match[0])
    && /\bhref=["']\/favicon-192\.png["']/i.test(match[0]));
  assert.equal(hints.length, 1, `${label}: exactly one actual icon preload occurs in the original head`);
  for (const attribute of [/\bas=["']image["']/i, /\btype=["']image\/png["']/i, /\bfetchpriority=["']high["']/i])
    assert.match(hints[0][0], attribute, `${label}: original icon hint preserves type and the reviewed high priority`);
  const body = documentHtml.search(/<body(?:\s|>)/i), bootstrap = documentHtml.indexOf("(function(d,w,e,p)");
  const headEnd = head.index + head[0].length;
  assert.ok(body >= headEnd && bootstrap > body, `${label}: the actual head precedes the body and deferred module bootstrap`);
  return { iconHeadOffset: head.index + head[0].indexOf(head[1]) + hints[0].index, headEnd, bodyOffset: body, bootstrapOffset: bootstrap };
}

// Read-only controls and layout checks. The CI runner supplies the browser;
// these actions never submit a request, upload a file or open WhatsApp.
export async function verifyInitialRundumHero(page, { label, screenshot, documentHtml }) {
  const link = page.locator(".scroll-film-cta");
  const secondary = page.locator(".scroll-film-prices");
  assert.equal(await page.locator(".film-actions a").count(), 2, `${label}: the hero has exactly two actions`);
  assert.equal(await page.locator(".scroll-film-rundum").count(), 0, `${label}: the hero keeps one primary and one secondary action`);
  await link.waitFor({ state: "visible" });
  await page.evaluate(() => document.fonts.ready);
  const originalHead = verifyOriginalIconHead(documentHtml, label);
  const icon = await page.evaluate(() => {
    const hint = document.querySelector('link[rel="preload"][href="/favicon-192.png"]');
    const resources = performance.getEntriesByType("resource");
    const entry = resources.find((item) => new URL(item.name).pathname === "/favicon-192.png" && item.initiatorType === "link");
    const main = resources.find((item) => /^\/assets\/index-[^/]+\.js$/.test(new URL(item.name).pathname));
    const navigation = performance.getEntriesByType("navigation")[0];
    return { hint: hint && { as: hint.getAttribute("as"), type: hint.getAttribute("type"), priority: hint.getAttribute("fetchpriority") },
      icon: entry && { path: new URL(entry.name).pathname, initiatorType: entry.initiatorType, start: entry.startTime, end: entry.responseEnd, encodedBytes: entry.encodedBodySize, transfer: entry.transferSize },
      main: main && { start: main.startTime, end: main.responseEnd },
      basis: main ? "main-module-response-end" : "original-ssr-head-before-body-bootstrap",
      ...(main ? { earlyDeadline: main.responseEnd } : {}),
      navigationDcl: navigation?.domContentLoadedEventStart };
  });
  assert.deepEqual(icon.hint, { as: "image", type: "image/png", priority: "high" }, `${label}: the existing icon is preloaded at the reviewed high priority`);
  assert.ok(icon.icon && icon.icon.encodedBytes === 14984, `${label}: actual link preload fetches the unchanged icon size: ${JSON.stringify(icon)}`);
  if (page.context().browser().browserType().name() === "chromium")
    assert.ok(icon.main, `${label}: Chromium must expose its native main-module timing`);
  if (icon.main) assert.ok(Number.isFinite(icon.earlyDeadline) && icon.earlyDeadline > 0 && icon.icon.start <= icon.earlyDeadline,
    `${label}: actual icon preload starts before the native main-module response finishes: ${JSON.stringify(icon)}`);
  iconPreloadObservations.push({ label, ...icon, originalHead });
  const initialFormRequests = await page.evaluate(() => performance.getEntriesByType("resource")
    .map((entry) => new URL(entry.name).pathname).filter((path) => /^\/assets\/rundum-service-form-[^/]+\.js$/.test(path)));
  assert.deepEqual(initialFormRequests, [], `${label}: initial view does not fetch the below-fold form chunk`);
  assert.equal(await page.getByRole("form", { name: "Rundum-Service anfragen", exact: true }).count(), 0,
    `${label}: initial view keeps the interactive form deferred`);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  const target = new URL(await link.getAttribute("href"), page.url());
  assert.equal(target.pathname, "/");
  assert.equal(target.hash, "#buchung");
  const serviceTarget = new URL(await secondary.getAttribute("href"), page.url());
  assert.equal(serviceTarget.pathname, "/");
  assert.equal(serviceTarget.hash, "#ablauf");
  assert.equal((await secondary.textContent()).trim(), "Hol- & Bringservice entdecken");
  assert.equal((await page.locator(".scroll-film-trust p").textContent()).trim(), "Dein Fahrzeug in guten Händen");
  const measure = (action) => action.evaluate((element) => {
    const rect = element.getBoundingClientRect(), header = document.querySelector(".site-header")?.getBoundingClientRect(), consent = document.querySelector(".consent-banner")?.getBoundingClientRect();
    const atCenter = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, height: rect.height, layoutHeight: element.offsetHeight,
      headerBottom: Math.max(0, header?.bottom ?? 0), availableBottom: consent && consent.height > 0 ? consent.top : innerHeight,
      width: innerWidth, heightOfViewport: innerHeight, unobscured: element.contains(atCenter), scrollY };
  });
  const verify = async (state) => {
    const geometry = await measure(link), secondaryGeometry = await measure(secondary);
    // WebKit can return 43.999969px for a transformed 44px target. Keep the
    // layout minimum exact and allow only this subpixel bounding-box rounding.
    assert.ok(geometry.scrollY <= 1 && geometry.top >= geometry.headerBottom && geometry.bottom <= geometry.availableBottom + 1
      && geometry.left >= 0 && geometry.right <= geometry.width && geometry.layoutHeight >= 44 && geometry.height >= 44 - 0.01 && geometry.unobscured,
      `${label} ${state}: initial Rundum CTA visible, usable and clear of header/consent: ${JSON.stringify(geometry)}`);
    assert.ok(secondaryGeometry.top >= secondaryGeometry.headerBottom && secondaryGeometry.bottom <= secondaryGeometry.availableBottom + 1
      && secondaryGeometry.left >= 0 && secondaryGeometry.right <= secondaryGeometry.width
      && secondaryGeometry.layoutHeight >= 44 && secondaryGeometry.unobscured,
      `${label} ${state}: secondary service CTA is equally reachable: ${JSON.stringify(secondaryGeometry)}`);
    assert.ok(Math.abs(geometry.layoutHeight - secondaryGeometry.layoutHeight) <= 1,
      `${label} ${state}: both hero actions have the same height`);
    await screenshot(`${label}-rundum-initial-${state}.png`);
  };
  await verify("first-visit");
  const reject = page.getByRole("button", { name: "Ablehnen", exact: true });
  if (await reject.isVisible().catch(() => false)) {
    await reject.click();
    await page.locator(".consent-banner").waitFor({ state: "hidden" });
  }
  await verify("consent-dismissed");
  return `${label}: initial hero offers one primary booking action, clear of header and cookie bar`;
}

export async function verifyRundumUi(page, { label, screenshot }) {
  const reads = observePageReads(page, page.url());
  const section = page.locator("#buchung"), intro = section.locator(".home-booking-promise");
  const formPanel = section.locator(".home-booking-form");
  await page.locator(".scroll-film-cta").click();
  await page.waitForFunction(() => location.hash === "#buchung");
  await intro.waitFor({ state: "visible" });
  await page.evaluate(() => document.fonts.ready);
  const position = await page.evaluate(() => {
    const section = document.querySelector("#buchung"), process = document.querySelector("#ablauf"), packages = document.querySelector("#pakete");
    const promise = section.querySelector(".home-booking-promise").getBoundingClientRect();
    const form = section.querySelector(".home-booking-form").getBoundingClientRect();
    return { afterPackages: !!(packages.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING),
      afterProcess: !!(process.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING),
      split: matchMedia("(min-width: 1080px)").matches, promise: promise.toJSON(), form: form.toJSON() };
  });
  assert.ok(position.afterPackages && position.afterProcess, `${label}: the combined service and request section closes the package/process flow`);
  assert.ok(position.split ? position.promise.right <= position.form.left && Math.abs(position.promise.top - position.form.top) <= 1
    : position.promise.bottom <= position.form.top,
    `${label}: service promise and form use the intended responsive split/stack: ${JSON.stringify(position)}`);
  assert.match(await intro.textContent(), /Pflege und Reparatur aus einer Hand/);
  assert.match(await intro.textContent(), /Du kennst Leistungen und Festpreis, bevor du zusagst\./);
  const request = section.getByRole("navigation", { name: "Art der Anfrage" }).getByRole("link", { name: "Rundum-Service", exact: true });
  assert.equal(await request.getAttribute("href"), "#rundum-anfrage");
  const whatsapp = page.locator("[data-wa-float]");
  const target = new URL(await whatsapp.getAttribute("href")), configured = new URL(site.whatsapp);
  assert.equal(target.origin, configured.origin);
  assert.equal(target.pathname, configured.pathname);
  assert.equal(target.searchParams.get("phone"), configured.searchParams.get("phone"));
  assert.equal(target.searchParams.get("text"), configured.searchParams.get("text"));
  await intro.scrollIntoViewIfNeeded();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
  await screenshot(`${label}-rundum-intro.png`, intro);
  await request.click();
  await page.waitForFunction(() => location.hash === "#rundum-anfrage");
  const form = page.getByRole("form", { name: "Rundum-Service anfragen", exact: true });
  await form.waitFor({ state: "visible", timeout: 5000 });
  await assertStableRundumArrival(page, `${label}: combined section mode link`, reads);
  assert.deepEqual(await form.locator('input[name="services"]').evaluateAll((inputs) => inputs.map((input) => input.value)), [...RUNDUM_SERVICES]);
  for (const [id, required] of [["name", true], ["email", true], ["phone", false], ["vehicleMake", true], ["vehicleModel", true], ["text", true], ["date", false]]) {
    const input = form.locator("#rundum-" + id);
    assert.equal(await input.count(), 1, `${label}: ${id} exists`);
    assert.equal(await input.evaluate((element) => element.required), required, `${label}: ${id} required flag`);
    const bounds = await input.boundingBox();
    assert.ok(bounds.width > 0 && bounds.height >= 40, `${label}: ${id} is a usable touch target`);
  }
  assert.equal(await page.locator('main input[type="file"]').count(), 0, `${label}: no public customer upload`);
  assert.match(await form.textContent(), /Fotos kannst du nach deiner Anfrage in deinem Kundenbereich ergänzen\./);
  assert.match(await form.textContent(), /Erst nach deiner Freigabe werden die vereinbarten Arbeiten ausgeführt\./);
  const options = form.locator('input[name="services"]');
  await options.nth(0).check();
  await options.nth(4).check();
  assert.equal(await form.locator('input[name="services"]:checked').count(), 2, `${label}: service selection is multiple`);
  await form.locator("#rundum-name").focus();
  assert.equal(await page.evaluate(() => document.activeElement?.id), "rundum-name");
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(() => document.activeElement?.id), "rundum-email");
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `${label}: form has no horizontal overflow`);
  const clipped = await form.locator("input,textarea,button").evaluateAll((elements) => elements.filter((element) => {
    const box = element.getBoundingClientRect();
    return element.type !== "hidden" && element.tabIndex >= 0 && box.width > 0 && (box.left < -1 || box.right > innerWidth + 1);
  }).map((element) => element.id || element.name));
  assert.deepEqual(clipped, [], `${label}: no clipped controls`);
  // The promise is a separate stacked block on mobile. Its arrival and image
  // were checked above; now verify the form title and controls in their panel.
  const measureFrame = () => formPanel.evaluate((element) => {
    const heading = element.querySelector("#anfrage-heading").getBoundingClientRect();
    const first = element.querySelector('#rundum-formular input:not([type="hidden"])').getBoundingClientRect();
    return { headingTop: heading.top, headingBottom: heading.bottom,
      firstControlTop: first.top, firstControlBottom: first.bottom,
      headerBottom: Math.max(0, document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 0), viewportHeight: innerHeight };
  });
  const contentClear = (frame) => frame.headingTop >= frame.headerBottom && frame.headingBottom <= frame.viewportHeight
    && frame.firstControlTop >= frame.headerBottom && frame.firstControlBottom <= frame.viewportHeight;
  const framingDeadline = Date.now() + 2000;
  let frame;
  for (let attempt = 0; attempt < 3 && Date.now() < framingDeadline; attempt++) {
    await formPanel.evaluate((element) => {
      const headerBottom = Math.max(0, document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 0);
      window.scrollTo({ top: scrollY + element.querySelector("#anfrage-heading").getBoundingClientRect().top - headerBottom - 16, behavior: "instant" });
      window.__qaRundumFrame = { top: element.querySelector("#anfrage-heading").getBoundingClientRect().top, since: performance.now() };
    });
    await page.waitForFunction(() => {
      const top = document.querySelector("#anfrage-heading").getBoundingClientRect().top;
      const probe = window.__qaRundumFrame;
      if (Math.abs(top - probe.top) > 0.5) { probe.top = top; probe.since = performance.now(); }
      return performance.now() - probe.since >= 200;
    }, undefined, { timeout: Math.max(1, framingDeadline - Date.now()) });
    frame = await measureFrame();
    if (contentClear(frame)) break;
  }
  assert.ok(frame && contentClear(frame),
    `${label}: final form capture frames its complete heading and first controls below the sticky header: ${JSON.stringify(frame)}`);
  const clip = await formPanel.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const headerBottom = Math.max(0, document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 0);
    const top = Math.max(box.top + scrollY, scrollY + headerBottom), bottom = box.bottom + scrollY;
    const content = ["#anfrage-heading", "#rundum-formular form"].map((selector) => element.querySelector(selector).getBoundingClientRect());
    if (content.some((bounds) => bounds.top + scrollY < top || bounds.bottom + scrollY > bottom))
      throw new Error("The header-free form clip must retain the complete heading and form");
    return { x: box.x + scrollX, y: top, width: box.width, height: bottom - top };
  });
  // Locator screenshots perform another automatic scroll after our geometric
  // check. Capture the measured document clip without moving the section again.
  await screenshot(`${label}-rundum-form.png`, formPanel, { fullPage: true, clip });
  return `${label}: combined service/form split and mobile stack, exact global WhatsApp channel, request anchor, seven multiple choices, optional phone/date, no public upload, usable controls and layout`;
}

// Exercise real same-origin anchors and client routing without submitting data.
export async function verifyRundumIntentLoading(page, { label, base }) {
  const reads = observePageReads(page, base);
  const form = page.getByRole("form", { name: "Rundum-Service anfragen", exact: true });
  await page.locator(".scroll-film-cta").click();
  await page.waitForFunction(() => location.hash === "#buchung");
  await page.getByRole("navigation", { name: "Art der Anfrage" }).getByRole("link", { name: "Rundum-Service", exact: true }).click();
  await form.waitFor({ state: "visible", timeout: 5000 });
  await assertStableRundumArrival(page, `${label}: hero and shared request mode`, reads);
  assert.ok(await page.evaluate(() => performance.getEntriesByType("resource").some((entry) =>
    /^\/assets\/rundum-service-form-[^/]+\.js$/.test(new URL(entry.name).pathname))), `${label}: the anchor loads the actual form chunk`);
  const draft = "QA ungesendeter Formularentwurf";
  const modes = page.getByRole("navigation", { name: "Art der Anfrage" });
  const packageLink = modes.getByRole("link", { name: "Paket wählen", exact: true });
  const rundumLink = modes.getByRole("link", { name: "Rundum-Service", exact: true });
  const booking = page.locator("#paket-formular .booking-flow");
  await form.locator("#rundum-name").fill(draft);
  await packageLink.focus();
  await packageLink.press("Enter");
  await booking.waitFor({ state: "visible" });
  // Wait for the newly mounted form to consume availability before exercising
  // history and leaving the page. A disabled slot also catches a genuine API failure.
  await booking.locator("#slot:enabled").waitFor({ state: "attached" });
  assert.equal(new URL(page.url()).hash, "#buchung");
  assert.equal(await packageLink.getAttribute("aria-current"), "location");
  assert.equal(await form.isVisible(), false);
  await booking.locator('input[name="klasse"][value="suv"]').check();
  await page.goBack();
  await form.waitFor({ state: "visible" });
  assert.equal(await rundumLink.getAttribute("aria-current"), "location");
  assert.equal(await form.locator("#rundum-name").inputValue(), draft);
  await page.goForward();
  await booking.waitFor({ state: "visible" });
  assert.equal(await booking.locator('input[name="klasse"][value="suv"]').isChecked(), true);
  await rundumLink.click();
  await form.waitFor({ state: "visible" });
  assert.equal(await booking.isVisible(), false);
  await page.locator(".scroll-film-prices").click();
  await page.waitForURL((url) => url.pathname === "/" && url.hash === "#ablauf");
  await page.locator("#ablauf").getByRole("heading", { name: "Ein Ansprechpartner. Alles für dein Auto.", exact: true }).waitFor();
  await page.goBack();
  await form.waitFor({ state: "visible" });
  assert.equal(await form.locator("#rundum-name").inputValue(), draft, `${label}: service anchor and back keep unsent input`);
  await reads.complete(`${label}: leave booking for prices`);
  await page.getByRole("contentinfo").getByRole("link", { name: "Preise", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/preise");
  await page.goBack({ waitUntil: "networkidle" });
  await form.waitFor({ state: "visible", timeout: 5000 });
  assert.equal(await form.locator("#rundum-name").inputValue(), draft, `${label}: client route and back keep unsent input`);
  await reads.complete(`${label}: reload the returned booking page`);
  await page.goto(`${base}/#rundum-anfrage`, { waitUntil: "networkidle" });
  await form.waitFor({ state: "visible", timeout: 5000 });
  await assertStableRundumArrival(page, `${label}: direct hash`, reads);
  assert.equal(await page.locator('main input[type="file"]').count(), 0);
  return `${label}: deferred form loads within five seconds through the hero/shared request controls and a direct URL; service/hash/client-route changes preserve an unsent draft`;
}
