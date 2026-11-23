import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { test } from "node:test";
import { cities, services } from "../src/data/site.ts";
import { serviceCitySeo } from "../src/lib/seo-policy.ts";

// Run against the production preview, never submit forms or modify data.
const base = process.env.FRONTEND_BASE_URL || "http://127.0.0.1:8081";
async function get(path, headers = {}) {
  const response = await fetch(new URL(path, base), {
    headers,
    redirect: "manual",
    signal: AbortSignal.timeout(15000),
  });
  return { response, html: await response.text() };
}
function canonicalLinks(html) {
  return [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/g)].map(
    ([tag]) => tag.match(/href="([^"]+)"/)?.[1],
  );
}

function executableInlineScripts(html) {
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
    .filter(([, attributes, source]) => {
      if (/\bsrc\s*=/i.test(attributes) || !source.trim()) return false;
      const type = attributes.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1].toLowerCase();
      return !type || ["module", "text/javascript", "application/javascript"].includes(type);
    });
}

test("production SSR nonces match streamed scripts on successful and 404 documents", async () => {
  const nonces = new Set();
  for (const path of ["/", "/", "/freudenstadt-lossburg", "/preise", "/leistungen/nicht-vorhanden"]) {
    const { response, html } = await get(path, { "x-forwarded-host": "white-gloss.de" });
    assert.equal(response.status, path.includes("nicht-vorhanden") ? 404 : 200);
    assert.equal(response.headers.get("cross-origin-opener-policy"), "same-origin");
    assert.equal(response.headers.get("strict-transport-security"), "max-age=31536000; includeSubDomains; preload");
    const csp = response.headers.get("content-security-policy");
    const scriptSrc = csp?.split(";").find((part) => part.trim().startsWith("script-src"));
    assert.ok(scriptSrc && !scriptSrc.includes("'unsafe-inline'"));
    const nonce = scriptSrc.match(/'nonce-([A-Za-z0-9+/]{43}=)'/)?.[1];
    assert.ok(nonce, "SSR needs a fresh request nonce");
    assert.ok(!nonces.has(nonce), "Separate responses must never reuse a nonce");
    nonces.add(nonce);
    const scripts = executableInlineScripts(html);
    assert.ok(scripts.length > 0, "The real streaming bootstrap must be present");
    for (const [, attributes] of scripts) {
      assert.equal(attributes.match(/\bnonce="([^"]+)"/)?.[1], nonce, path);
    }
    const nonceMeta = [...html.matchAll(/<meta\b[^>]*>/g)]
      .map(([tag]) => tag)
      .find((tag) => /\bproperty="csp-nonce"/.test(tag));
    assert.equal(nonceMeta?.match(/\bcontent="([^"]+)"/)?.[1], nonce, "Hydration must restore the same nonce");
    assert.doesNotMatch(html, /grok-app-builder\/extensions\.js/, "Customer documents omit the preview extension");
  }
});

test("production installer authorizes its unchanged static classifier with a hash", async () => {
  const { response, html } = await get("/?install=1&platform=ios", { "x-forwarded-host": "white-gloss.de" });
  assert.equal(response.status, 200);
  const csp = response.headers.get("content-security-policy");
  const scriptSrc = csp?.split(";").find((part) => part.trim().startsWith("script-src"));
  assert.ok(scriptSrc && !scriptSrc.includes("'unsafe-inline'"));
  const scripts = executableInlineScripts(html);
  assert.ok(scripts.length > 0);
  for (const [, , source] of scripts) {
    const digest = createHash("sha256").update(source.replace(/\r\n?/g, "\n"), "utf8").digest("base64");
    assert.ok(scriptSrc.includes(`'sha256-${digest}'`));
  }
  assert.equal(response.headers.get("cross-origin-opener-policy"), "same-origin");
});

test("service index and city routes render distinct content with one canonical", async () => {
  for (const [path, heading] of [
    [
      "/leistungen/keramikversiegelung",
      "Keramikversiegelung &amp; Langzeitschutz in Horb",
    ],
    ["/leistungen/keramikversiegelung/nagold", "Keramikversiegelung für Fahrzeuge aus Nagold"],
    [
      "/leistungen/keramikversiegelung/horb-am-neckar",
      "Keramikversiegelung mit Abholung in Horb am Neckar",
    ],
  ]) {
    const { response, html } = await get(path);
    assert.equal(response.status, 200, path);
    const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]*>/g, "");
    assert.equal(h1, heading, `${path} must render its own heading`);
    assert.deepEqual(canonicalLinks(html), [`https://white-gloss.de${path}`], path);
    assert.match(html, /<html[^>]*lang="de"/);
    assert.ok(html.includes(`property="og:url" content="https://white-gloss.de${path}"`));
  }
});

test("all published service/city combinations render their own route", async () => {
  assert.ok(services.length > 0 && cities.length > 0);
  for (const service of services) {
    for (const city of cities) {
      const path = `/leistungen/${service.slug}/${city.slug}`;
      const { response, html } = await get(path);
      const seo = serviceCitySeo(service.slug, city.slug);
      if (seo.status === "redirect") {
        assert.equal(response.status, 301, path);
        assert.equal(new URL(response.headers.get("location"), base).pathname, seo.target);
        continue;
      }
      assert.equal(response.status, 200, path);
      const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]*>/g, "");
      const expectedHeading =
        city.slug === "horb-am-neckar"
          ? `${service.seoNav} mit Abholung in ${city.name}`
          : `${service.seoNav} für Fahrzeuge aus ${city.name}`;
      assert.equal(h1, expectedHeading, path);
      assert.deepEqual(canonicalLinks(html), [`https://white-gloss.de${path}`], path);
    }
  }
});

test("unknown services and cities preserve real 404 responses", async () => {
  for (const path of [
    "/leistungen/nicht-vorhanden",
    "/leistungen/keramikversiegelung/nicht-vorhanden",
  ]) {
    const { response } = await get(path);
    assert.equal(response.status, 404, path);
  }
});

test("city context survives consolidated details and both booking destinations", async () => {
  const { html: city } = await get("/abholservice/nagold");
  assert.match(city, /href="\/leistungen\/keramikversiegelung\?ort=nagold"/);
  for (const [slug, destination] of [
    ["keramikversiegelung", "/"],
    ["lederreparatur", "/fahrzeug-zustand"],
  ]) {
    const { response, html } = await get(`/leistungen/${slug}?ort=nagold`);
    assert.equal(response.status, 200);
    assert.deepEqual(canonicalLinks(html), [`https://white-gloss.de/leistungen/${slug}`]);
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] || "";
    const links = [...main.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
    const cta = links.find(([, , text]) => text.includes("Termin anfragen"));
    assert.ok(cta, slug);
    const target = new URL(cta[1].replaceAll("&amp;", "&"), base);
    assert.equal(target.pathname, destination);
    assert.equal(target.searchParams.get("ort"), "nagold");
    assert.equal(target.hash, "#buchung");
  }
  const { html } = await get("/leistungen/keramikversiegelung?ort=unknown-city");
  assert.doesNotMatch(html, /href="[^"]*ort=unknown-city/);
});

test("selected service survives the indexable pickup hub before booking", async () => {
  for (const [slug, destination, key, value] of [
    ["keramikversiegelung", "/", "paket", "keramik"],
    ["lederreparatur", "/fahrzeug-zustand", "leistung", "lederreparatur"],
  ]) {
    const { html: service } = await get(`/leistungen/${slug}`);
    assert.ok(service.includes(`/abholservice/nagold?leistung=${slug}`));
    const { response, html } = await get(`/abholservice/nagold?leistung=${slug}`);
    assert.equal(response.status, 200);
    assert.deepEqual(canonicalLinks(html), ["https://white-gloss.de/abholservice/nagold"]);
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] || "";
    const cta = [...main.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].find(
      ([, , text]) => text.includes("Termin anfragen"),
    );
    assert.ok(cta, slug);
    const target = new URL(cta[1].replaceAll("&amp;", "&"), base);
    assert.equal(target.pathname, destination);
    assert.equal(target.searchParams.get("ort"), "nagold");
    assert.equal(target.searchParams.get(key), value);
  }
});

test("public route metadata survives the PWA injector", async () => {
  const { html } = await get("/preise");
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  assert.ok(title);
  assert.ok(html.includes(`property="og:title" content="${title}"`));
  assert.match(html, /property="og:description" content="[^"]+"/);
  assert.match(html, /property="og:type" content="website"/);
  assert.match(html, /rel="manifest"/);
  const { html: login } = await get("/login");
  assert.match(login, /name="robots" content="noindex/);
});

test("Node serves compressed build assets and revalidates mutable media", async () => {
  const assetDirectory = new URL("../.output/public/assets/", import.meta.url);
  const stylesheets = await Promise.all(
    (await readdir(assetDirectory))
      .filter((name) => name.endsWith(".css"))
      .map(async (name) => ({
        name,
        source: await readFile(new URL(name, assetDirectory), "utf8"),
      })),
  );
  const globals = stylesheets.filter(({ source }) =>
    source.includes("--color-bg:") && source.includes("@font-face"),
  );
  assert.equal(globals.length, 1, "the build must contain one complete global stylesheet");
  const desktopStyles = stylesheets.filter(({ name }) => /^forge-desktop-[\w-]+\.css$/.test(name));
  assert.equal(desktopStyles.length, 1, "the desktop composition must have one fingerprinted stylesheet");
  const manifestDirectory = new URL("../.output/server/", import.meta.url);
  const manifestNames = (await readdir(manifestDirectory))
    .filter((name) => name.startsWith("_tanstack-start-manifest_") && name.endsWith(".mjs"));
  assert.equal(manifestNames.length, 1);
  const manifestModule = await import(new URL(manifestNames[0], manifestDirectory).href);
  // The server bundler may expose the virtual module through a minified
  // namespace export; its original named factory remains the module contract.
  const manifestFactories = [...new Set([manifestModule, ...Object.values(manifestModule)]
    .filter((value) => value && typeof value.tsrStartManifest === "function")
    .map((value) => value.tsrStartManifest))];
  assert.equal(manifestFactories.length, 1);
  const manifest = manifestFactories[0]();
  const homePaths = ["/", "/freudenstadt-lossburg"];
  const routeStyles = Object.fromEntries(homePaths.map((path) => {
    const css = manifest.routes[path]?.css;
    assert.ok(css?.length, `${path} must retain its complete route stylesheet inventory`);
    const hrefs = css.map((asset) => typeof asset === "string" ? asset : asset.href);
    assert.equal(hrefs.length, new Set(hrefs).size, `${path} cannot apply duplicate route styles`);
    return [path, hrefs.map((href) => {
      const source = manifest.inlineCss.styles[href];
      assert.ok(source, `${path}: ${href} must be available for no-JavaScript rendering`);
      const file = stylesheets.find(({ name }) => href === `/assets/${name}`);
      assert.ok(file, `${path}: ${href} must identify a real built stylesheet`);
      assert.equal(source.trim(), file.source.trim(), `${path}: the inline source must contain the complete built stylesheet`);
      return { href, source };
    })];
  }));
  assert.deepEqual(routeStyles[homePaths[0]], routeStyles[homePaths[1]],
    "Both home variants must share the same complete CSS in the same cascade order");
  const heroStyles = routeStyles["/"].filter(({ source }) => source.includes(".scroll-film{"));
  const railStyles = routeStyles["/"].filter(({ source }) => source.includes(".wg-media-rail{"));
  assert.equal(heroStyles.length, 1, "The shared hero must have one identifiable stylesheet");
  assert.equal(railStyles.length, 1, "The shared swipe rail must have one identifiable stylesheet");
  const homeCssHref = heroStyles[0].href;
  for (const path of [
    "/",
    "/freudenstadt-lossburg",
    "/preise",
    "/leistungen/keramikversiegelung",
    "/leistungen/keramikversiegelung/nagold",
    "/fahrzeug-zustand",
    "/galerie",
    "/qualitaet",
    "/kontakt",
    "/impressum",
    "/datenschutz",
  ]) {
    const { response, html } = await get(path);
    assert.equal(response.status, 200, path);
    const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/)?.[1] || "";
    const inlineCss = [...head.matchAll(/<style\b(?=[^>]*data-tsr-inline-css)[^>]*>([\s\S]*?)<\/style>/g)]
      .map(([, css]) => css)
      .join("");
    assert.ok(
      inlineCss.includes(globals[0].source.trim()),
      `${path} must inline the complete generated global CSS before the body, also without JavaScript`,
    );
    const cssLinks = [...head.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)].map(([tag]) => tag);
    assert.equal(cssLinks.length, 1, `${path} permits only the desktop composition outside the inline CSS`);
    assert.equal(cssLinks[0].match(/href="([^"]+)"/)?.[1], `/assets/${desktopStyles[0].name}`);
    assert.equal(cssLinks[0].match(/media="([^"]+)"/)?.[1], "(min-width: 960px)",
      `${path} must not block a phone's first paint on desktop-only styles`);
    assert.ok(head.indexOf(cssLinks[0]) > head.lastIndexOf("</style>"),
      `${path} must preserve the desktop overrides after the complete inline cascade`);
    assert.ok(!inlineCss.includes(desktopStyles[0].source.trim()),
      `${path} must not duplicate the external desktop stylesheet inline`);
    const earlyStylePreloads = [...head.matchAll(/<link\b(?=[^>]*rel="preload")(?=[^>]*as="style")[^>]*>/g)]
      .map(([tag]) => tag);
    const home = homePaths.includes(path);
    assert.equal(earlyStylePreloads.length, home ? 1 : 0,
      `${path} prepares only the hero CSS without another applied stylesheet`);
    if (home) {
      let previous = inlineCss.indexOf(globals[0].source.trim());
      for (const { href, source } of routeStyles[path]) {
        const position = inlineCss.indexOf(source);
        assert.ok(position >= 0, `${path}: the exact complete ${href} remains inline`);
        assert.ok(position > previous,
          `${path}: every route stylesheet follows global CSS in manifest cascade order`);
        previous = position;
      }
      assert.equal(earlyStylePreloads[0].match(/href="([^"]+)"/)?.[1], homeCssHref);
      assert.equal(earlyStylePreloads[0].match(/fetchpriority="([^"]+)"/i)?.[1], "high");
      assert.equal(earlyStylePreloads[0].match(/crossorigin="([^"]+)"/i)?.[1], "anonymous",
        "The style hint matches Vite's existing anonymous client stylesheet fetch");
      const nonce = response.headers.get("content-security-policy")?.match(/'nonce-([A-Za-z0-9+/]{43}=)'/)?.[1];
      assert.ok(nonce);
      assert.equal(earlyStylePreloads[0].match(/nonce="([^"]+)"/)?.[1], nonce);
    }
    const earlyModulePreloads = [...head.matchAll(/<link\b[^>]*rel="modulepreload"[^>]*>/g)]
      .map(([tag]) => tag);
    assert.equal(earlyModulePreloads.length, home ? 1 : 0,
      `${path} prepares only the small homepage route before first paint`);
    const routeHint = earlyModulePreloads.find((tag) => /fetchpriority="high"/i.test(tag));
    const earlyRoutePreload = routeHint?.match(/href="([^"]+)"/)?.[1];
    if (home) {
      assert.ok(earlyRoutePreload, "The small homepage route remains prepared");
      assert.match(earlyRoutePreload, /^\/assets\/[\w.-]+\.js$/);
      assert.equal(earlyRoutePreload, manifest.routes[path].preloads[0],
        `${path} prepares its own route module, not the other location's route`);
    }
    assert.doesNotMatch(
      html,
      /<script\b[^>]*\bsrc="\/assets\//,
      `${path} must not execute the client entry before the first viewport has painted`,
    );
    const bootstraps = executableInlineScripts(html).filter(([, , source]) =>
      source.includes('t.type="module"'),
    );
    assert.equal(bootstraps.length, 1, `${path} must start hydration through one deferred bootstrap`);
    const [, , bootstrap] = bootstraps[0];
    const lists = bootstrap.match(/\}\)\(document,window,(\[[^\]]*\]),(\[[^\]]*\])\)$/);
    assert.ok(lists, `${path} bootstrap must end with its entry and preload lists`);
    const [entries, preloads] = [JSON.parse(lists[1]), JSON.parse(lists[2])];
    assert.ok(entries.length > 0 && preloads.length > 0, `${path} must retain Start's hydration assets`);
    if (earlyRoutePreload) {
      assert.ok(!entries.includes(earlyRoutePreload), "The route hint stays separate from the bulk entry");
      assert.ok(!preloads.includes(earlyRoutePreload), "The route hint must not be inserted twice");
      assert.equal(entries.length, 1, "Exactly one client entry remains available to the first intent or paint");
      assert.ok(!earlyModulePreloads.some((tag) => tag.includes(entries[0])), "The bulk client entry must not compete with the initial font downloads");
      assert.ok(!preloads.includes(entries[0]), "The client script fetch must not be duplicated");
    }
    for (const asset of [...entries, ...preloads, ...(earlyRoutePreload ? [earlyRoutePreload] : [])]) {
      assert.match(asset, /^\/assets\/[\w.-]+\.js$/, `${path} hydration asset ${asset}`);
      const response = await fetch(new URL(asset, base), { signal: AbortSignal.timeout(15000) });
      assert.equal(response.status, 200, `${path} hydration asset ${asset}`);
      await response.arrayBuffer();
    }
  }
  const css = `/assets/${globals[0].name}`;
  const { response, html: stylesheet } = await get(css, { "accept-encoding": "gzip" });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-encoding"), "gzip");
  assert.match(response.headers.get("cache-control") || "", /immutable/);
  assert.ok(stylesheet.length > 1000, "the compressed stylesheet must decode successfully");
  const desktopCssPath = `/assets/${desktopStyles[0].name}`;
  const { response: desktopResponse, html: desktopCss } = await get(desktopCssPath, { "accept-encoding": "gzip" });
  assert.equal(desktopResponse.status, 200, desktopCssPath);
  assert.equal(desktopResponse.headers.get("content-encoding"), "gzip");
  assert.match(desktopResponse.headers.get("content-type") || "", /text\/css/);
  assert.match(desktopResponse.headers.get("cache-control") || "", /immutable/);
  assert.equal(desktopCss, desktopStyles[0].source, "the desktop stylesheet must decode to the built source");
  for (const path of ["/media/lack-1200.avif", "/fonts/barlow-300.woff2"]) {
    const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(15000) });
    assert.equal(response.status, 200, path);
    assert.doesNotMatch(response.headers.get("cache-control") || "", /immutable/, path);
    assert.match(response.headers.get("cache-control") || "", /max-age=604800/, path);
    await response.arrayBuffer();
  }
  {
    const path = "/__grok/manifest.webmanifest";
    const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(15000) });
    assert.equal(response.status, 200, path);
    assert.doesNotMatch(response.headers.get("cache-control") || "", /immutable/, path);
    assert.match(response.headers.get("cache-control") || "", /(?:must-revalidate|no-cache)/, path);
    await response.arrayBuffer();
  }
});
