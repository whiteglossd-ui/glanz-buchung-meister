import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import * as siteData from "../src/data/site.ts";
import * as mediaData from "../src/data/media-src.ts";
import * as googleData from "../src/data/google-profile.ts";
import * as seoPolicy from "../src/lib/seo-policy.ts";
import * as bookingSelection from "../src/lib/booking-selection.ts";
import * as cityCopy from "../src/lib/city-copy.ts";
import * as homeCopy from "../src/data/home-copy.ts";
import * as homeLocation from "../src/data/home-location.ts";
import * as scrollFilm from "../src/data/scroll-film.ts";
import * as studioPublic from "../src/lib/studio-public.ts";
import * as jsonLd from "../src/lib/json-ld.ts";

// Render production sections without a website server or customer actions.
// The form boundary reports the props it receives; its actual submission flow
// remains covered by the existing booking and rundum tests.
function loadSection(file, { hash = "", hydrated = false } = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(
    readFileSync(new URL(`../src/components/${file}.tsx`, import.meta.url), "utf8"),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  ).outputText;
  runInNewContext(code, {
    exports: module.exports,
    window: { location: { hash } },
    require(name) {
      if (name === "react") return {
        ...React,
        useSyncExternalStore: (_subscribe, getSnapshot, getServerSnapshot) =>
          hydrated ? getSnapshot() : getServerSnapshot(),
      };
      if (name === "react/jsx-runtime") return jsxRuntime;
      if (name === "@tanstack/react-router") return {
        useRouter: () => ({ history: { subscribe: () => () => {} } }),
        Link: ({ to, children, ...props }) => React.createElement("a", { ...props, href: to }, children),
      };
      if (name === "@/data/atmosphere-media") return { conciergeAtmosphere: [] };
      if (name === "./reveal-lines") return {
        RevealLines: ({ lines }) => React.createElement(React.Fragment, null, lines.join(" ")),
      };
      if (name === "./icons") return { IconArrowRight: () => React.createElement("svg") };
      if (name === "./lazy-configurator") return {
        LazyConfigurator: ({ initialPackage, initialCity, eager }) => React.createElement("form", {
          "data-test-form": "package",
          "data-package": initialPackage,
          "data-city": initialCity,
          "data-eager": String(eager),
        }),
      };
      if (name === "./lazy-rundum-inquiry") return {
        LazyRundumInquiry: () => React.createElement("form", { "data-test-form": "rundum" }),
      };
      if (name.endsWith(".css")) return {};
      throw new Error(`Unexpected section dependency: ${name}`);
    },
  });
  return module.exports;
}

const render = (component, props = {}) => renderToStaticMarkup(React.createElement(component, props));
const text = (html) => html.replace(/<[^>]*>/g, "").replaceAll("&amp;", "&");

test("the shared process has four distinct steps and retains its existing anchor", () => {
  const { HomeProcess } = loadSection("home-process");
  const html = render(HomeProcess, { serviceArea: "Loßburg, Freudenstadt und Nordschwarzwald" });
  assert.match(html, /id="ablauf"/);
  assert.match(html, /id="craft-heading"/);
  assert.equal((html.match(/<li(?:\s|>)/g) ?? []).length, 4);
  assert.match(text(html), /Persönliche Beratung & Festpreis/);
  assert.match(text(html), /Hol- & Bringservice/);
  assert.match(text(html), /Ein fester Ansprechpartner für alles/);
  assert.match(text(html), /Übergabe mit Wow-Effekt/);
  assert.match(text(html), /Loßburg, Freudenstadt und Nordschwarzwald/);
  assert.doesNotMatch(text(html), /\b(?:Sie|Ihr|Ihnen)\b/);
});

test("all former conversion anchors resolve inside one booking section", () => {
  const { HomeBooking } = loadSection("home-booking");
  const html = render(HomeBooking);
  assert.equal((html.match(/<section(?:\s|>)/g) ?? []).length, 1);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, new Set(ids).size, "Shared conversion anchors must be unique.");
  for (const anchor of ["buchung", "termin", "service", "rundum-service", "rundum-anfrage"]) {
    assert.ok(ids.includes(anchor), `Missing legacy conversion anchor #${anchor}`);
  }
  for (const match of html.matchAll(/aria-controls="([^"]+)"/g)) {
    assert.ok(ids.includes(match[1]), `Unresolved form control ${match[1]}`);
  }
  assert.match(html, /id="paket-formular">/);
  assert.match(html, /id="rundum-formular"[^>]*hidden=""/);
  assert.doesNotMatch(text(html), /\b(?:Sie|Ihr|Ihnen)\b/);
});

for (const hash of ["#buchung", "#termin", "#service", "#rundum-service", "#rundum-anfrage"]) {
  test(`${hash} selects the matching form without losing package or city selection`, () => {
    const { HomeBooking } = loadSection("home-booking", { hash, hydrated: true });
    const html = render(HomeBooking, {
      initialPackage: "keramik",
      initialCity: "lossburg",
      serviceArea: "Loßburg und Freudenstadt",
    });
    const rundum = ["#service", "#rundum-service", "#rundum-anfrage"].includes(hash);
    const packageTag = /<div id="paket-formular"[^>]*>/.exec(html)?.[0];
    const rundumTag = /<div id="rundum-formular"[^>]*>/.exec(html)?.[0];
    assert.equal(packageTag?.includes('hidden=""'), rundum);
    assert.equal(rundumTag?.includes('hidden=""'), !rundum);
    assert.match(html, /data-package="keramik" data-city="lossburg" data-eager="true"/);
    assert.match(text(html), /Loßburg und Freudenstadt/);
  });
}

function evaluate(relativePath, dependencies, globals = {}) {
  const module = { exports: {} };
  runInNewContext(ts.transpileModule(
    readFileSync(new URL(`../src/${relativePath}`, import.meta.url), "utf8"),
    { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
  ).outputText, {
    ...(Object.keys(globals).length ? { window: globals } : {}),
    exports: module.exports,
    require(name) {
      if (name in dependencies) return dependencies[name];
      if (name === "react") return React;
      if (name === "react/jsx-runtime") return jsxRuntime;
      if (name.endsWith(".css")) return {};
      throw new Error(`Unexpected homepage dependency: ${name}`);
    },
  });
  return module.exports;
}

const seo = evaluate("lib/seo.ts", {
  "@/data/site": siteData,
  "@/data/media-src": mediaData,
  "@/data/google-profile": googleData,
  "@/lib/seo-policy": seoPolicy,
});

test("the planned Loßburg route has its own canonical and truthful local metadata", () => {
  const { Route } = evaluate("routes/freudenstadt-lossburg.tsx", {
    "@tanstack/react-router": { createFileRoute: (path) => (options) => ({ path, ...options }) },
    "@/components/home-page": { HomePage: () => null },
    "@/data/home-location": homeLocation,
    "@/data/scroll-film": scrollFilm,
    "@/lib/booking-selection": bookingSelection,
    "@/lib/seo": seo,
  });
  assert.equal(Route.path, "/freudenstadt-lossburg");
  const head = Route.head();
  assert.equal(head.links.find((link) => link.rel === "canonical")?.href,
    "https://white-gloss.de/freudenstadt-lossburg");
  assert.match(head.meta.find((tag) => tag.title)?.title, /Loßburg.*Freudenstadt/);
  const description = head.meta.find((tag) => tag.name === "description")?.content;
  assert.match(description, /Nordschwarzwald/);
  assert.match(description, /in Vorbereitung/);
  assert.match(description, /aktuell in Horb/);
  assert.equal(head.meta.some((tag) => ["geo.position", "ICBM"].includes(tag.name)), false);
  assert.deepEqual(Route.validateSearch({ ort: "lossburg" }), { ort: "lossburg" });
});

function loadDarkHome({ hash = "", hydrated = false } = {}) {
  const router = {
    useRouter: () => ({ history: { subscribe: () => () => {} } }),
    Link: ({ to, params: _params, search: _search, hash: _hash, activeProps: _a, activeOptions: _o, children, ...props }) =>
      React.createElement("a", { ...props, href: to }, children),
  };
  return evaluate("components/dark/dark-home.tsx", {
    react: {
      ...React,
      useSyncExternalStore: (_subscribe, getSnapshot, getServerSnapshot) =>
        hydrated ? getSnapshot() : getServerSnapshot(),
    },
    "@tanstack/react-router": router,
    "@/data/site": siteData,
    "@/data/home-copy": homeCopy,
    "@/lib/city-copy": cityCopy,
    "@/lib/booking-anchor-focus": { focusBookingHeading: () => {} },
    "@/lib/dark-motion": { darkFrameSrc: (s, i) => `/media/dark/seq/${s}/${i + 1}.webp`, initDarkHome: () => () => {}, tweenNumber: () => {} },
    "@/components/lazy-configurator": {
      LazyConfigurator: ({ initialPackage, initialCity, eager }) => React.createElement("form", {
        "data-test-form": "package",
        "data-package": initialPackage,
        "data-city": initialCity,
        "data-eager": String(eager),
      }),
    },
    "@/components/lazy-google-reviews": {
      LazyGoogleReviews: () => React.createElement("aside", { "data-test-reviews": "google" }),
    },
    "@/components/lazy-rundum-inquiry": {
      LazyRundumInquiry: () => React.createElement("form", { "data-test-form": "rundum" }),
    },
  }, { location: { hash } });
}

test("the dark home keeps every conversion anchor in one booking section", () => {
  for (const hash of ["", "#buchung", "#termin", "#service", "#rundum-service", "#rundum-anfrage"]) {
    const { DarkHome } = loadDarkHome({ hash, hydrated: Boolean(hash) });
    const html = render(DarkHome, { initialPackage: "keramik", initialCity: "lossburg" });
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(ids.length, new Set(ids).size, "Anchors must be unique.");
    for (const anchor of ["buchung", "termin", "service", "rundum-service", "rundum-anfrage", "buchung-heading"]) {
      assert.ok(ids.includes(anchor), `Missing conversion anchor #${anchor}`);
    }
    for (const match of html.matchAll(/aria-controls="([^"]+)"/g)) {
      assert.ok(ids.includes(match[1]), `Unresolved form control ${match[1]}`);
    }
    const rundum = ["#service", "#rundum-service", "#rundum-anfrage"].includes(hash);
    assert.equal(/<div id="paket-formular"[^>]*>/.exec(html)?.[0].includes('hidden=""'), rundum);
    assert.equal(/<div id="rundum-formular"[^>]*>/.exec(html)?.[0].includes('hidden=""'), !rundum);
    assert.match(html, /data-package="keramik" data-city="lossburg" data-eager="true"/);
    assert.doesNotMatch(text(html), /\b(?:Sie|Ihr|Ihnen)\b/);
  }
});

test("both home variants render one conversion flow and an accessible location choice", () => {
  const { DarkHome } = loadDarkHome();
  const { HomePage } = evaluate("components/home-page.tsx", {
    "@/lib/json-ld": jsonLd,
    "@/lib/seo": seo,
    "@/data/home-copy": homeCopy,
    "@/components/dark/dark-home": { DarkHome },
    "@/components/website-studio-content": { WebsiteStudioContent: () => null },
    "@/data/home-location": homeLocation,
  });
  for (const location of ["horb", "lossburg"]) {
    const html = render(HomePage, { location });
    assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1);
    assert.equal((html.match(/id="buchung"/g) ?? []).length, 1);
    assert.equal((html.match(/id="ablauf"/g) ?? []).length, 1);
    const switcher = /<nav[^>]*aria-label="Standort wählen"[^>]*>([\s\S]*?)<\/nav>/.exec(html)?.[1];
    assert.ok(switcher);
    assert.match(switcher, /href="\/"/);
    assert.match(switcher, /href="\/freudenstadt-lossburg"/);
    assert.match(switcher, /Werkstatt in Vorbereitung/);
    const current = /<a[^>]*aria-current="page"[^>]*>([\s\S]*?)<\/a>/.exec(switcher)?.[1];
    assert.match(text(current), location === "horb" ? /Horb am Neckar/ : /Loßburg \/ Freudenstadt/);
    if (location === "lossburg") assert.match(html, /data-city="lossburg"/);
    const business = JSON.parse(/<script type="application\/ld\+json">([^<]+)<\/script>/.exec(html)?.[1]);
    const locations = business["@graph"].filter((item) => item["@type"] === "AutomotiveBusiness");
    assert.equal(locations.length, 1);
    assert.equal(locations[0].address.addressLocality, "Horb am Neckar");
  }
});
