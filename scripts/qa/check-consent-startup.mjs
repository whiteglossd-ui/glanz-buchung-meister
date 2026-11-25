// Consent initialization is tested only against the owned isolated CI server.
import { assertIsolatedGithubCi } from "../hosting-policy.mjs";
assertIsolatedGithubCi();
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { qaBase } from "./ports.mjs";
import { qaClientHeaders } from "./client-identity.mjs";

const browser = await chromium.launch({ headless: true });
const results = [];
const output = ".qa-output/consent-startup";
await mkdir(output, { recursive: true });
try {
  for (const scenario of ["fresh-reject", "fresh-accept", "rejected", "accepted", "blocked"]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
      extraHTTPHeaders: qaClientHeaders("consent-startup", scenario),
    });
    let releaseModules;
    const moduleGate = new Promise((resolve) => { releaseModules = resolve; });
    const external = [];
    const pageErrors = [];
    try {
      await context.addInitScript((choice) => {
        if (choice === "blocked") {
          Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Blocked", "SecurityError"); } });
        } else if (!sessionStorage.getItem("__qaConsentSeeded")) {
          sessionStorage.setItem("__qaConsentSeeded", "true");
          if (choice === "accepted" || choice === "rejected") localStorage.setItem("wg-consent", choice);
        }
      }, scenario);
      const earlyIntent = { "fresh-reject": "pointerdown", "fresh-accept": "keydown", rejected: "focusin" }[scenario];
      if (earlyIntent) {
        // Exercise the actual SSR link and inline bootstrap before DOMContentLoaded.
        // External module responses remain gated, so React cannot handle this input.
        await context.addInitScript((intent) => {
          document.addEventListener("readystatechange", () => {
            if (document.readyState !== "interactive") return;
            const link = document.querySelector("[data-hero-cta=booking]");
            if (!link) return;
            const selector = 'head script[type="module"][src]';
            const before = document.querySelectorAll(selector).length;
            let event;
            if (intent === "focusin") {
              link.focus({ preventScroll: true });
            } else {
              event = intent === "keydown"
                ? new KeyboardEvent(intent, { key: "Enter", bubbles: true, cancelable: true })
                : new PointerEvent(intent, { bubbles: true, cancelable: true });
              link.dispatchEvent(event);
            }
            window.__qaEarlyBookingIntent = {
              before, after: document.querySelectorAll(selector).length,
              hash: new URL(link.href).hash, prevented: !!event?.defaultPrevented,
            };
          });
        }, earlyIntent);
      }
      await context.route("**/*", async (route) => {
        const request = route.request(), url = new URL(request.url());
        if (url.origin !== qaBase) {
          external.push(url.hostname + url.pathname);
          return route.abort();
        }
        if (!["GET", "HEAD"].includes(request.method())) return route.abort();
        if (url.pathname.startsWith("/assets/") && url.pathname.endsWith(".js")) await moduleGate;
        return route.continue();
      });
      const page = await context.newPage();
      page.setDefaultTimeout(10_000);
      page.on("pageerror", (error) => pageErrors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error" && /hydration|hydrated|Minified React error|server rendered HTML/i.test(message.text()))
          pageErrors.push(message.text());
      });
      await page.goto(qaBase, { waitUntil: "domcontentloaded" });
      if (earlyIntent) {
        assert.deepEqual(await page.evaluate(() => window.__qaEarlyBookingIntent),
          { before: 0, after: 1, hash: "#buchung", prevented: false },
          `${earlyIntent}: the real booking link requests its client synchronously and retains native navigation`);
      }
      // The real inline startup script and CSS run; only the client JS waits.
      // This checks first paint independently of hydration speed.
      const initial = page.locator('.consent-banner[data-consent-initial="true"]');
      assert.equal(await initial.count(), 1, scenario + ": consent is server-rendered");
      const returning = ["accepted", "rejected"].includes(scenario);
      assert.equal(await initial.isVisible(), !returning, scenario + ": returning choice suppresses the initial dialog");
      assert.equal(await initial.locator("button:disabled").count(), 2, scenario + ": controls wait for their handlers");
      assert.equal(external.length, 0, scenario + ": startup hint never loads a third party");
      if (!returning) {
        const geometry = await page.locator("[data-hero-cta=booking]").evaluate((element) => ({
          link: element.getBoundingClientRect().toJSON(),
          banner: document.querySelector(".consent-banner").getBoundingClientRect().toJSON(),
        }));
        assert.ok(geometry.link.bottom <= geometry.banner.top + 1, "The initial consent dialog must not cover the hero request link");
      }
      await page.screenshot({ path: output + "/" + scenario + "-before-hydration.png" });
      releaseModules();

      const dialog = page.getByRole("dialog", { name: "Cookie-Einstellungen", exact: true });
      if (returning) {
        await initial.waitFor({ state: "detached" });
        assert.equal(await dialog.count(), 0);
        if (scenario === "accepted") {
          await page.waitForFunction(() => !!document.querySelector('script[src^="https://www.googletagmanager.com/gtag/js"]'));
        } else {
          assert.equal(external.length, 0, "A stored rejection never starts tracking");
        }
      } else {
        await page.locator('.consent-banner:not([data-consent-initial])').waitFor({ state: "visible" });
        assert.equal(await dialog.locator("button:disabled").count(), 0);
        assert.equal(external.length, 0, scenario + ": hydration never implies consent");
        await dialog.getByRole("button", {
          name: scenario === "fresh-accept" ? "Akzeptieren" : "Ablehnen", exact: true,
        }).click();
        await dialog.waitFor({ state: "hidden" });
        if (scenario !== "blocked") {
          assert.equal(await page.evaluate(() => localStorage.getItem("wg-consent")), scenario === "fresh-accept" ? "accepted" : "rejected");
        }
      }
      // Reopening must ignore the saved-choice first-paint marker.
      const settings = page.getByRole("button", { name: "Cookie-Einstellungen", exact: true });
      await settings.click();
      await dialog.waitFor({ state: "visible" });
      assert.equal(await dialog.locator("button:disabled").count(), 0);
      const accepted = ["accepted", "fresh-accept"].includes(scenario);
      assert.equal(await dialog.getByRole("button", { name: accepted ? "Einwilligung widerrufen" : "Ablehnen", exact: true }).count(), 1);
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      assert.equal(await settings.evaluate((element) => element === document.activeElement), true, "Closing settings restores the user's focus");
      assert.equal(await page.locator('body[data-consent-banner="open"]').count(), 0);
      if (!accepted) assert.equal(external.length, 0, "Rejection and unavailable storage keep tracking off");
      else {
        await page.waitForFunction(() => !!document.querySelector('script[src^="https://www.googletagmanager.com/gtag/js"]'));
        assert.ok(external.every((url) => url.startsWith("www.googletagmanager.com/gtag/js")));
      }
      assert.deepEqual(pageErrors, [], scenario + ": no hydration or runtime errors");
      await page.screenshot({ path: output + "/" + scenario + "-after-reopen.png" });
      results.push({ scenario, initialVisible: !returning, reopened: true, pageErrors, blockedExternalAttempts: external.length });
    } finally {
      releaseModules();
      await context.close();
    }
  }
  await writeFile(output + "/results.json", JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ status: "passed", scenarios: results }));
} finally {
  await browser.close();
}
