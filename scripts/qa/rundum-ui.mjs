import assert from "node:assert/strict";
import { RUNDUM_SERVICES } from "../../src/lib/rundum-service.ts";
import { site } from "../../src/data/site.ts";

// Read-only controls and layout checks. The CI runner supplies the browser;
// these actions never submit a request, upload a file or open WhatsApp.
export async function verifyInitialRundumHero(page, { label, screenshot }) {
  const link = page.locator(".scroll-film-rundum").getByRole("link", { name: "Rundum-Service anfragen", exact: true });
  await link.waitFor({ state: "visible" });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  const target = new URL(await link.getAttribute("href"), page.url());
  assert.equal(target.pathname, "/");
  assert.equal(target.hash, "#rundum-anfrage");
  const measure = () => link.evaluate((element) => {
    const rect = element.getBoundingClientRect(), header = document.querySelector(".site-header")?.getBoundingClientRect(), consent = document.querySelector(".consent-banner")?.getBoundingClientRect();
    const atCenter = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, height: rect.height,
      headerBottom: Math.max(0, header?.bottom ?? 0), availableBottom: consent && consent.height > 0 ? consent.top : innerHeight,
      width: innerWidth, heightOfViewport: innerHeight, unobscured: element.contains(atCenter), scrollY };
  });
  const verify = async (state) => {
    const geometry = await measure();
    assert.ok(geometry.scrollY <= 1 && geometry.top >= geometry.headerBottom && geometry.bottom <= geometry.availableBottom + 1
      && geometry.left >= 0 && geometry.right <= geometry.width && geometry.height >= 44 && geometry.unobscured,
      `${label} ${state}: initial Rundum CTA visible, usable and clear of header/consent: ${JSON.stringify(geometry)}`);
    await screenshot(`${label}-rundum-initial-${state}.png`);
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
  await form.waitFor({ state: "visible" });
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
  await screenshot(`${label}-rundum-form.png`, section);
  return `${label}: compact prominent service, exact WhatsApp channel, request anchor, seven multiple choices, optional phone/date, no public upload, usable controls and layout`;
}
