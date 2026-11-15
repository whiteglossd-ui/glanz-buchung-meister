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
    const near = !!marker && marker.bottom >= -240 && marker.top <= innerHeight + 240;
    const ready = !!document.querySelector("#buchung .booking-flow");
    if (Math.abs(scrollY - probe.y) > 0.5 || probe.height !== height || (near && !ready)) {
      probe.y = scrollY; probe.height = height; probe.since = now;
      probe.samples.push({ at: Math.round(now), y: scrollY, documentHeight: height, bookingReady: ready, markerNear: near });
      if (probe.samples.length > 16) probe.samples.shift();
    }
    return now - probe.since >= 150;
  }, undefined, { timeout: 5000 });
  const state = await page.locator("#rundum-anfrage-heading").evaluate((element) => {
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
  const link = page.locator(".scroll-film-rundum").getByRole("link", { name: "Rundum-Service anfragen", exact: true });
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
  assert.equal(target.hash, "#rundum-anfrage");
  const measure = () => link.evaluate((element) => {
    const rect = element.getBoundingClientRect(), header = document.querySelector(".site-header")?.getBoundingClientRect(), consent = document.querySelector(".consent-banner")?.getBoundingClientRect();
    const atCenter = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    const signpost = element.closest(".scroll-film-rundum").getBoundingClientRect(), paragraph = element.closest(".scroll-film-rundum").querySelector("p").getBoundingClientRect(), copy = element.closest(".scroll-film-copy-inner").getBoundingClientRect();
    const center = (box) => (box.left + box.right) / 2;
    return { copyCenter: center(copy), signpostCenter: center(signpost), paragraphCenter: center(paragraph), top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, height: rect.height,
      minHeight: Number.parseFloat(getComputedStyle(element).minHeight), layoutHeight: element.offsetHeight,
      headerBottom: Math.max(0, header?.bottom ?? 0), availableBottom: consent && consent.height > 0 ? consent.top : innerHeight,
      width: innerWidth, heightOfViewport: innerHeight, unobscured: element.contains(atCenter),
      coveringElement: atCenter?.outerHTML.slice(0, 300), copy: copy.toJSON(),
      filmControls: document.querySelector(".scroll-film-bottom")?.getBoundingClientRect().toJSON(), scrollY };
  });
  const verify = async (state) => {
    const geometry = await measure();
    await screenshot(`${label}-rundum-initial-${state}.png`);
    assert.ok(Math.abs(geometry.signpostCenter - geometry.copyCenter) <= 2 && Math.abs(geometry.paragraphCenter - geometry.copyCenter) <= 2,
      `${label} ${state}: Rundum signpost and its paragraph align with the hero copy center within two pixels: ${JSON.stringify(geometry)}`);
    // WebKit can lose about 3e-5px in the translated rectangle. Keep both
    // untransformed 44px guarantees and tolerate only that float rounding.
    assert.ok(geometry.scrollY <= 1 && geometry.top >= geometry.headerBottom && geometry.bottom <= geometry.availableBottom + 1
      && geometry.left >= 0 && geometry.right <= geometry.width && geometry.minHeight >= 44 && geometry.layoutHeight >= 44
      && geometry.height + 1e-3 >= 44 && geometry.unobscured,
      `${label} ${state}: initial Rundum CTA visible, usable and clear of header/consent: ${JSON.stringify(geometry)}`);
  };
  await verify("first-visit");
  const reject = page.getByRole("button", { name: "Ablehnen", exact: true });
  if (await reject.isVisible().catch(() => false)) {
    await reject.click();
    await page.locator(".consent-banner").waitFor({ state: "hidden" });
  }
  await verify("consent-dismissed");
  return `${label}: initial hero visibly offers Rundum-Service before scrolling, with exact request anchor and no header/cookie overlap`;
}

export async function verifyRundumUi(page, { label, screenshot }) {
  const reads = observePageReads(page, page.url());
  const intro = page.locator(".rundum-service-intro");
  await intro.waitFor({ state: "visible" });
  await page.evaluate(() => document.fonts.ready);
  const position = await page.evaluate(() => {
    const intro = document.querySelector(".rundum-service-intro"), stats = document.querySelector(".hero-follow"), packages = document.querySelector("#pakete");
    return { afterStats: !!(stats.compareDocumentPosition(intro) & Node.DOCUMENT_POSITION_FOLLOWING), beforePackages: !!(intro.compareDocumentPosition(packages) & Node.DOCUMENT_POSITION_FOLLOWING) };
  });
  assert.ok(position.afterStats && position.beforePackages, `${label}: prominent service sits above existing packages`);
  assert.match(await intro.textContent(), /Ein Ansprechpartner\. Eine Rechnung\. Kein Stress\./);
  const request = intro.getByRole("link", { name: "Rundum-Service anfragen", exact: true });
  assert.equal(await request.getAttribute("href"), "#rundum-anfrage");
  const whatsapp = intro.getByRole("link", { name: "Lieber per WhatsApp", exact: true });
  const target = new URL(await whatsapp.getAttribute("href")), configured = new URL(site.whatsappHref);
  assert.equal(target.origin, configured.origin);
  assert.equal(target.pathname, configured.pathname);
  assert.equal(target.searchParams.get("phone"), configured.searchParams.get("phone"));
  assert.equal(target.searchParams.get("text"), "Hallo, ich interessiere mich für euren Rundum-Service für mein Auto.");
  await intro.scrollIntoViewIfNeeded();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
  await screenshot(`${label}-rundum-intro.png`, intro);
  await request.click();
  await page.waitForFunction(() => location.hash === "#rundum-anfrage");
  const section = page.locator("#rundum-anfrage"), form = page.getByRole("form", { name: "Rundum-Service anfragen", exact: true });
  await form.waitFor({ state: "visible", timeout: 5000 });
  await assertStableRundumArrival(page, `${label}: intro anchor`, reads);
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
  // The keyboard check scrolls to email. Reframe the complete section before
  // recording it, including its heading below the real sticky navigation.
  const measureFrame = () => section.evaluate((element) => {
    const kicker = element.querySelector(".kicker").getBoundingClientRect();
    const heading = element.querySelector("#rundum-anfrage-heading").getBoundingClientRect();
    const first = element.querySelector('input:not([type="hidden"])').getBoundingClientRect();
    return { kickerTop: kicker.top, kickerBottom: kicker.bottom, headingTop: heading.top, headingBottom: heading.bottom,
      firstControlTop: first.top, firstControlBottom: first.bottom,
      headerBottom: Math.max(0, document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 0), viewportHeight: innerHeight };
  });
  const contentClear = (frame) => frame.kickerTop >= frame.headerBottom && frame.kickerBottom <= frame.viewportHeight
    && frame.headingTop >= frame.headerBottom && frame.headingBottom <= frame.viewportHeight
    && frame.firstControlTop >= frame.headerBottom && frame.firstControlBottom <= frame.viewportHeight;
  const framingDeadline = Date.now() + 2000;
  let frame;
  for (let attempt = 0; attempt < 3 && Date.now() < framingDeadline; attempt++) {
    await section.evaluate((element) => {
      const headerBottom = Math.max(0, document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 0);
      window.scrollTo({ top: scrollY + element.querySelector(".kicker").getBoundingClientRect().top - headerBottom - 16, behavior: "instant" });
      window.__qaRundumFrame = { top: element.querySelector(".kicker").getBoundingClientRect().top, since: performance.now() };
    });
    await page.waitForFunction(() => {
      const top = document.querySelector("#rundum-anfrage .kicker").getBoundingClientRect().top;
      const probe = window.__qaRundumFrame;
      if (Math.abs(top - probe.top) > 0.5) { probe.top = top; probe.since = performance.now(); }
      return performance.now() - probe.since >= 200;
    }, undefined, { timeout: Math.max(1, framingDeadline - Date.now()) });
    frame = await measureFrame();
    if (contentClear(frame)) break;
  }
  assert.ok(frame && contentClear(frame),
    `${label}: final form capture frames the complete kicker, heading and first controls below the sticky header: ${JSON.stringify(frame)}`);
  const clip = await section.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const headerBottom = Math.max(0, document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 0);
    const top = Math.max(box.top + scrollY, scrollY + headerBottom), bottom = box.bottom + scrollY;
    const content = [".kicker", "#rundum-anfrage-heading", "form"].map((selector) => element.querySelector(selector).getBoundingClientRect());
    if (content.some((bounds) => bounds.top + scrollY < top || bounds.bottom + scrollY > bottom))
      throw new Error("The header-free form clip must retain the complete kicker, heading and form");
    return { x: box.x + scrollX, y: top, width: box.width, height: bottom - top };
  });
  // Locator screenshots perform another automatic scroll after our geometric
  // check. Capture the measured document clip without moving the section again.
  await screenshot(`${label}-rundum-form.png`, section, { fullPage: true, clip });
  return `${label}: compact prominent service, exact WhatsApp channel, request anchor, seven multiple choices, optional phone/date, no public upload, usable controls and layout`;
}

// Exercise real same-origin anchors and client routing without submitting data.
export async function verifyRundumIntentLoading(page, { label, base }) {
  const reads = observePageReads(page, base);
  const form = page.getByRole("form", { name: "Rundum-Service anfragen", exact: true });
  await page.locator(".scroll-film-rundum").getByRole("link", { name: "Rundum-Service anfragen", exact: true }).click();
  await page.waitForFunction(() => location.hash === "#rundum-anfrage");
  await form.waitFor({ state: "visible", timeout: 5000 });
  await assertStableRundumArrival(page, `${label}: hero anchor`, reads);
  assert.ok(await page.evaluate(() => performance.getEntriesByType("resource").some((entry) =>
    /^\/assets\/rundum-service-form-[^/]+\.js$/.test(new URL(entry.name).pathname))), `${label}: real anchor loads the actual form chunk`);
  const draft = "QA ungesendeter Formularentwurf";
  await form.locator("#rundum-name").fill(draft);
  await page.locator('.home-jump-links a[href="#buchung"]').click();
  await page.waitForFunction(() => location.hash === "#buchung");
  assert.equal(await form.locator("#rundum-name").inputValue(), draft, `${label}: a hash change keeps unsent input`);
  await page.locator(".scroll-film-rundum").getByRole("link", { name: "Rundum-Service anfragen", exact: true }).click();
  await page.waitForFunction(() => location.hash === "#rundum-anfrage");
  // The preceding #buchung visit starts the real calendar read. Leaving Home
  // unmounts Configurator and deliberately aborts it; finish begun reads first
  // so that this harness navigation cannot manufacture a requestfailed error.
  const beforePrices = await reads.complete(`${label}: before client route to prices`, { timeoutMs: 5000 });
  console.log(`RUNDUM-NAV-READS:${JSON.stringify(beforePrices)}`);
  await page.locator(".scroll-film-prices").click();
  await page.waitForURL((url) => url.pathname === "/preise");
  await page.goBack({ waitUntil: "networkidle" });
  await form.waitFor({ state: "visible", timeout: 5000 });
  assert.equal(await form.locator("#rundum-name").inputValue(), draft, `${label}: client route and back keep unsent input`);
  const beforeReload = await reads.complete(`${label}: before direct hash navigation`, { timeoutMs: 5000 });
  console.log(`RUNDUM-NAV-READS:${JSON.stringify(beforeReload)}`);
  await page.goto(`${base}/#rundum-anfrage`, { waitUntil: "networkidle" });
  await form.waitFor({ state: "visible", timeout: 5000 });
  await assertStableRundumArrival(page, `${label}: direct hash`, reads);
  assert.equal(await page.locator('main input[type="file"]').count(), 0);
  return `${label}: deferred form loads within five seconds through hero/intro anchors and a direct URL; hash/client-route changes preserve an unsent draft`;
}
