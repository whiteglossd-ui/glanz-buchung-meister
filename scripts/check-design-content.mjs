#!/usr/bin/env node
/**
 * Read-only source guard for a visual-only redesign. No server or build needed.
 *
 * It compares the working tree with a Git commit, not with snapshots silently
 * updated by the build. Source checks complement (and do not replace) rendered
 * CI checks: CSS visibility, live CMS content and runtime layout need a browser.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import rundumContentApproval from "./rundum-content-approval.json" with { type: "json" };

export const DESIGN_BASE = "db305e3c190cf53a0213c90ea3e788625ece091d";
// PR #327 was approved and merged after the visual redesign. Its immutable
// source snapshot replaces the copy baseline for exactly these two files;
// it is not an exemption from comparing their new content and metadata.
const approvedBookingBaseline = Object.freeze({
  commit: "6daf3fc01834e94720ef4834f36e0534dfc93aaa",
  pullRequest: 327,
  pullRequestUrl: "https://github.com/White-Gloss/glanz-buchung-meister/pull/327",
});
export const APPROVED_SOURCE_BASELINES = Object.freeze({
  "src/components/configurator.tsx": approvedBookingBaseline,
  "src/routes/danke.tsx": approvedBookingBaseline,
});
// Explicitly approved CTA wording; these replace one literal each, not the
// file's source baseline. Other occurrences and all SEO/link checks remain.
export const APPROVED_CTA_LABELS = Object.freeze({
  "src/components/site-chrome.tsx": Object.freeze({
    className: "header-film-booking", before: "Termin anfragen", after: "Jetzt Termin anfragen",
  }),
  "src/components/scroll-film-hero.tsx": Object.freeze({
    className: "scroll-film-cta", before: "Fahrzeug verwandeln lassen", after: "Jetzt Termin anfragen",
  }),
});
// These exact Git blobs cover the November 14 SEO update. All other sources
// keep their original design or booking baselines. Hash the file locally so
// the check also works with a shallow GitHub checkout and squash merges.
export const APPROVED_SEO_BLOBS = Object.freeze({
  // November 18: public du address, one hero action, package numbering,
  // Horb distance copy and the external name White-Gloss Detailing.
  // Files also listed in the Rundum approval keep that semantic delta;
  // these pins cover every other reviewed public and SEO source.
  "src/components/booking-status.tsx": "3ea2dede5d2a7e56bf3f42e3e1f5d5e34d064e93",
  "src/components/city-landing.tsx": "8ea2ae42b5764bb0a9aaadff8125353ff5186fb0",
  "src/components/compare-slider.tsx": "c412455434d8330d4c86e40ee4f595ed653e98ee",
  "src/components/configurator.tsx": "e7793430f41caf5fa9813841b96a8ab5e0da6601",
  "src/components/consent-banner.tsx": "b955cd31f63130fb4cff7d5722e179920be24c2e",
  "src/components/customer-video-gallery.tsx": "cff3e9c9ca3d4414bc8655ae4e119d72256eb291",
  // November 26: owner-requested Google customer stories, with official share links.
  "src/components/google-reviews.tsx": "9a9d378e93ae53f4cc726aa1fe61e46ffdfccece",
  "src/components/lazy-google-reviews.tsx": "4985026e22a5c7bf81e5b9e196c0beed4b43cb06",
  "src/components/lazy-configurator.tsx": "cd9f22ef8f391c6ff116c17d1d342d47941a2b8d",
  "src/components/not-found.tsx": "aace3720e8a41a7ac61f6ae598cb26d2470243c5",
  "src/components/package-showcase.tsx": "570509fd2ee371cd498e838c4873b5b52bc82377",
  "src/components/photo-inquiry.tsx": "8c36e2c61c06a7c460f410f2aee5ae25c2b245c3",
  "src/components/scroll-film-hero.tsx": "087ed97dc1498b675e67b5cf406c48e54eb6654d",
  "src/components/site-chrome.tsx": "c9128bb53eb7ea6021e6af722d1083aa26a71c8e",
  "src/components/website-studio.tsx": "59c0b604d6f7b38c97208f9c36afe56cf0a69544",
  "src/components/whatsapp-photo-cta.tsx": "94655d4dfcb8e6db7b60611b73fa3ece7bc0c9f5",
  "src/components/workshop-map.tsx": "a6d39f7b40dedf89e2a9e557d4042458b8e5ee9c",
  // November 26: explicitly requested FAQ and editorial additions.
  "src/data/editorial-guides.json": "30f61f784fd85fe265cd16beea701a7a222ea55f",
  "src/data/review-links.json": "07399789ba5aac7f36e52ae45293fb83f7bfe2e7",
  "src/data/ratgeber.ts": "8980c307cc8d0792cc72732c815a53f66b9a4739",
  "src/data/site.ts": "41d7b3adb10ed87d80af37bd9d9456707df3c6f5",
  "src/lib/article-navigation.ts": "fdce84a10deab3ca061662ae973905cf7b76d802",
  "src/lib/city-copy.ts": "7ab598c838722794401309656ea80bcc62898aae",
  "src/lib/city-logistics.ts": "aedcbd32e741f8a835cc4870e731826ff50f6809",
  "src/lib/seo-intents.ts": "f401b26afa1c3a21728429a8a3091ec69201febd",
  "src/lib/seo.ts": "8a6ddf2fef64340e44582c204c95d7f31d45d68b",
  "src/routes/abholservice.index.tsx": "0462d3e7bfce1efdbf0e76047edd54b185d91ada",
  "src/routes/agb.tsx": "bc262cad82a4b9fcb0e34e8b529313f51682cf90",
  "src/routes/auftragsstatus.tsx": "46547b111173ab04dc974a66a0c91efcb21a54f5",
  // Navigation targets and section labels only; wording and pageHead unchanged.
  "src/routes/b2b.tsx": "8ede9874eb4d01ad04f479faad865f7533884f17",
  "src/routes/barrierefreiheit.tsx": "730949864ab50a20eab5c8ba82b76495d3e51898",
  "src/routes/danke.tsx": "4c9357017fed3ded9576661cca066e3816fbe29e",
  "src/routes/datenloeschung.tsx": "42a6a8ed8c5fe3fa81c8c4c687d30f7f33d482b3",
  "src/routes/datenschutz.tsx": "f5358b7fc8dccc6fcbe1846b2651395127c49341",
  "src/routes/dellen-hagelschaden.tsx": "f20c2020b35a78290de753c0e4356cf0b2041659",
  "src/routes/fahrzeug-zustand.tsx": "cbc29dfb619210f8c0d7ff27fe384bf3ee084bee",
  "src/routes/faq.tsx": "58da9f3e2849b7f0d10b790a3c31fc7090b0b7dd",
  "src/routes/galerie.tsx": "1b67b8ba645ed55b3f3af380c947fa0235678cbc",
  "src/routes/impressum.tsx": "e4a69b268521caadf36475145f6aeb065fa0c0cc",
  "src/routes/index.tsx": "ad6cecf8fd54ec042b3c61b2085a7067f51671b7",
  "src/routes/kontakt.tsx": "fdc5136f44afe99e9d8b9c8b5959f8457a85d63f",
  "src/routes/leistungen.$slug.$city.tsx": "67cc4fffa47538ee6c44cdda76b63d2d65a8f1cd",
  "src/routes/leistungen.$slug.index.tsx": "76595e6f0f61385bc0589f30ebc065a48a25a5fa",
  "src/routes/leistungen.index.tsx": "0ab40acbff1cb13b2f1ea08c6448686ff717eab8",
  "src/routes/luxusfahrzeuge.tsx": "439e1687974e595e050c1a320dde5cbb771f1b5e",
  "src/routes/preise.tsx": "8785dea1674ddfa3d34503e7d9323a48da7d8102",
  "src/routes/qualitaet.tsx": "01553fc27ec1fc42cf046ada585d290a394ac9d5",
  "src/routes/ratgeber.$slug.tsx": "ab0b578498d59e1de75e20c02ad835f96acceaf9",
  "src/routes/ratgeber.index.tsx": "437d528a6b58028e9ebc85c15362cf4633eb16c8",
  "src/routes/ueber-uns.tsx": "40f39f636a0b89f47ef66b140ad30f322f76d91f",
  "src/routes/widerruf.tsx": "58c36a01a2b121baebe7ef0bc72885e2d883a92b",
});

// Reviewed public sources for the November 22 homepage, regional entry and
// shared booking change; updated for the explicit November 23 owner request
// (docs/homepage-ux-2026-11-23.md). Exact bytes protect new files that were absent
// at the original redesign baseline. No additional Git history is needed.
const APPROVED_HOME_BLOBS = Object.freeze({
  "src/components/deferred-package-photo.tsx": "d82763c73e2a8a4eaaa46687cb631cfcfbf0a571",
  "src/components/city-landing.tsx": "c18b3632e2f7979b78865a208766ae2094aee87f",
  "src/components/city-regional-service.tsx": "d944527eeb322fa0ad9181960876d1007cf98c34",
  "src/components/customer-video-gallery.tsx": "c351ec962b27e4fe2a3e18504c4c2fff99d959bb",
  "src/components/home-booking.tsx": "32e0a0d8591c554dbd6bfd315b288ab91e0ee9f3",
  "src/components/home-process.tsx": "ef2d188275880831c56d7cf9fa925ff103653cbf",
  "src/components/lazy-rundum-inquiry.tsx": "5d59095e9e985a6e1de6a2164e3c17c477f2bce1",
  "src/components/media-rail.tsx": "eea74893c74a9e60c4704df77d6eec2ee1ca0b3e",
  "src/components/package-showcase.tsx": "53b5f78114e8de746613fad8cfa1151ffb276384",
  "src/components/results-teaser.tsx": "9cfc89347decf120486ca49e69f854a7563b6850",
  "src/components/review-showcase.tsx": "c68462140835c252be85af4948c821aec2d5f391",
  // November 24 owner request: improve the second scroll-film chapter.
  // See docs/homepage-cinematic-2026-11-24.md; all other content pins remain.
  "src/components/scroll-film-hero.tsx": "22dd7d41339d72c84788cc437e381a6bb6890665",
  // November 25 owner request: Dark-Edition template header, menu and footer;
  // phase 2 the same day wraps subpages in the template root (.wgt-page);
  // the wrapper element stays stable across routes so pages never remount.
  // See docs/homepage-dark-edition-2026-11-25.md.
  "src/components/site-chrome.tsx": "7952699100e8d1ee6b8eaef1efdc273dd42ff2d8",
  "src/components/website-studio.tsx": "33cc6b97e51f52e72ff891778811febf2d591dde",
  "src/data/home-copy.ts": "f829b684e32560fbde054e7e4405568036b5ca82",
  "src/data/site.ts": "04f74c3cf2d482bcdc2e4b55e018243362fb2579",
  "src/data/sitemap-static.xml": "1bccc405c21b6dcc79a9e5639a7ba1f33bf8ff97",
  "src/lib/city-copy.ts": "98f164cc518d27ce7cfdfff66eef96d62e842369",
  "src/lib/city-logistics.ts": "9f964c2dfb0d0822b583c761fce7550556219e0c",
  "src/routes/index.tsx": "7b87df2a86c7dac7b0f432e210d57f12ec64e3c2",
  "src/routes/leistungen.$slug.$city.tsx": "bb360ecb62e387d7fa8569e1259ece1ab9c19872",
  "src/lib/seo-intents.ts": "a61bd78880457eb49e9a57001386d3035021efd1",
  // November 25 owner request: homepage rebuilt on the Dark-Edition template.
  "src/components/home-page.tsx": "d37d849ef4ab0ca90afdf2ab8bf558a3473b853e",
  "src/data/home-location.ts": "22916b03c538e31757ef9dd4e42be8119b6ea982",
  "src/components/lazy-configurator.tsx": "2e1849b66392f02c2d985a1637d4f28dc26e8dfd",
});

function sourceBlobId(source) {
  const bytes = Buffer.from(source.replace(/\r\n/g, "\n"), "utf8");
  return createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
}

const printer = ts.createPrinter({ removeComments: true, newLine: ts.NewLineKind.LineFeed });
const normalize = (value) => value.replace(/\s+/gu, " ").trim();
const protectedProps = new Set([
  "aria-label", "aria-description", "label", "title", "lead", "kicker", "description",
  "placeholder", "hint", "note", "message", "emptyMessage", "caption", "lines", "crumbs",
]);
const linkProps = new Set(["to", "href", "hash", "params", "search", "id", "htmlFor"]);
const cosmeticProps = /^(className|style|ref|key|src|srcSet|sizes|width|height|loading|decoding|poster|shot|image|photo|icon|on[A-Z]|data-)/;
const cosmeticComponents = /^(Fragment|RevealLines|Icon[A-Z]|[A-Z].*Icon$)/;

export const protectedFiles = [
  "src/data/site.ts", "src/data/ratgeber.ts", "src/data/editorial-guides.json", "src/data/local-proof.ts",
  "src/data/google-profile.ts", "src/data/review-links.json", "src/data/search-watchlist.ts", "src/data/sitemap-static.xml",
  "src/lib/seo.ts", "src/lib/seo-policy.ts", "src/lib/seo-intents.ts", "src/lib/city-seo.ts",
  "src/lib/city-copy.ts", "src/lib/city-logistics.ts", "src/lib/article-navigation.ts",
  "src/lib/sitemap.ts", "src/lib/sitemap.server.ts", "src/lib/local-proof.ts",
  "src/lib/studio-public.ts", "src/lib/studio-public.functions.ts", "src/lib/json-ld.ts",
  "src/routes/sitemap[.]xml.ts", "public/robots.txt", "public/llms.txt",
];

const bag = () => new Map();
function add(target, value) {
  const normalized = normalize(value);
  if (normalized) target.set(normalized, (target.get(normalized) ?? 0) + 1);
}
function missing(before, after) {
  return [...before].flatMap(([value, count]) => {
    const difference = count - (after.get(value) ?? 0);
    return difference > 0 ? [{ value, count: difference }] : [];
  });
}

export function extractContent(source, filename = "fixture.tsx") {
  const file = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const result = { text: bag(), headings: bag(), links: bag(), seo: bag(), components: bag(), copy: bag(), expressions: bag() };
  const declarations = new Map();
  const referencedCopy = new Set();
  const printed = (node) => normalize(printer.printNode(ts.EmitHint.Unspecified, node, file));
  const nameOf = (node) => node?.getText(file) ?? "";
  function index(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const existing = declarations.get(node.name.text) ?? [];
      existing.push(node.initializer);
      declarations.set(node.name.text, existing);
    }
    ts.forEachChild(node, index);
  }
  index(file);

  // Follow local constant data referenced by rendered expressions, including
  // package goals and the hero's default headline. Imported copy is protected
  // by the unchanged data/SEO files below.
  function collectCopy(identifier, seen = new Set()) {
    if (seen.has(identifier)) return;
    seen.add(identifier);
    for (const initializer of declarations.get(identifier) ?? []) {
      function walk(node) {
        if (ts.isStringLiteralLike(node) && /\p{L}/u.test(node.text) && /\s/u.test(node.text)) {
          referencedCopy.add(normalize(node.text));
        }
        if (ts.isIdentifier(node) && !ts.isPropertyAccessExpression(node.parent)) {
          collectCopy(node.text, seen);
        }
        ts.forEachChild(node, walk);
      }
      walk(initializer);
    }
  }
  function expressionText(node, target, follow = true) {
    if (ts.isJsxText(node)) add(target, node.text);
    else if (ts.isStringLiteralLike(node)) add(target, node.text);
    else if (ts.isTemplateExpression(node)) {
      add(target, node.head.text);
      for (const span of node.templateSpans) add(target, span.literal.text);
    }
    if (follow && ts.isIdentifier(node)) collectCopy(node.text);
    // JSX children are visited by the main walker, so do not double-count.
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) return;
    ts.forEachChild(node, (child) => expressionText(child, target, follow));
  }
  function headingContent(node) {
    const values = [];
    function walk(child) {
      if (ts.isJsxText(child)) values.push(normalize(child.text));
      else if (ts.isJsxExpression(child) && child.expression) {
        // Wrappers are layout; dynamic heading expressions remain semantic.
        if (ts.isJsxElement(child.expression) || ts.isJsxFragment(child.expression)) walk(child.expression);
        else values.push(printed(child.expression));
        return;
      } else if (ts.isJsxAttribute(child)) {
        if (protectedProps.has(nameOf(child.name)) && child.initializer) values.push(printed(child.initializer));
        return;
      }
      ts.forEachChild(child, walk);
    }
    for (const child of node.children) walk(child);
    return normalize(values.filter(Boolean).join(" "));
  }
  function containsJsx(node) {
    if (ts.isJsxElement(node) || ts.isJsxFragment(node) || ts.isJsxSelfClosingElement(node)) return true;
    return ts.forEachChild(node, containsJsx) ?? false;
  }
  function visit(node) {
    if (ts.isJsxText(node)) add(result.text, node.text);
    if (ts.isJsxExpression(node) && node.expression && !ts.isJsxAttribute(node.parent)) {
      expressionText(node.expression, result.text);
      if (!containsJsx(node.expression) && !ts.isStringLiteralLike(node.expression)) {
        add(result.expressions, printed(node.expression));
      }
    }
    if (ts.isJsxAttribute(node)) {
      const name = nameOf(node.name);
      if (linkProps.has(name) && node.initializer) add(result.links, `${name}=${printed(node.initializer)}`);
      if (protectedProps.has(name) && node.initializer) {
        expressionText(node.initializer, result.text);
        if (ts.isJsxExpression(node.initializer) && node.initializer.expression && !containsJsx(node.initializer.expression)) {
          add(result.expressions, `${name}=${printed(node.initializer.expression)}`);
        }
      }
      // Source image descriptions may legitimately change with new media;
      // meaningful alt text remains a rendered accessibility CI requirement.
      if (cosmeticProps.test(name) || name === "alt") return;
    }
    if (ts.isJsxElement(node)) {
      const name = nameOf(node.openingElement.tagName);
      if (/^h[1-6]$/.test(name)) add(result.headings, `${name}: ${headingContent(node)}`);
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const name = nameOf(node.tagName);
      if (/^[A-Z]/.test(name) && !cosmeticComponents.test(name)) add(result.components, name);
    }
    if (ts.isCallExpression(node)) {
      const name = nameOf(node.expression);
      // Request errors are rendered through state rather than JSX literals.
      // Preserve their literal/template copy as well as the visible controls.
      if (name === "setError")
        for (const argument of node.arguments) expressionText(argument, result.text, false);
      if (/^(pageHead|serializeJsonLd|localBusinessJsonLd|redirect|createFileRoute)$/.test(name)) {
        add(result.seo, `${name}(${node.arguments.map(printed).join(", ")})`);
      }
    }
    if (ts.isPropertyAssignment(node) && nameOf(node.name) === "meta") {
      add(result.seo, `meta:${printed(node.initializer)}`);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  for (const value of referencedCopy) add(result.copy, value);
  return result;
}

function ctaTextNode(source, filename, className) {
  const file = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const matches = [];
  const literalAttribute = (node, name) => {
    const opening = ts.isJsxElement(node) ? node.openingElement : node;
    const attribute = opening.attributes.properties.find((property) =>
      ts.isJsxAttribute(property) && property.name.getText(file) === name,
    );
    return attribute?.initializer && ts.isStringLiteral(attribute.initializer) ? attribute.initializer.text : undefined;
  };
  function visit(node) {
    if ((ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node))
      && literalAttribute(node, "className")?.split(/\s+/u).includes(className)) matches.push(node);
    ts.forEachChild(node, visit);
  }
  visit(file);
  if (matches.length !== 1) return null;
  const target = matches[0];
  if (!ts.isJsxElement(target) || target.openingElement.tagName.getText(file) !== "Link"
    || literalAttribute(target, "to") !== "/" || literalAttribute(target, "hash") !== "buchung") return null;
  // Both approved controls use direct JSX text and an optional decorative arrow.
  // Extra nested copy cannot turn an otherwise valid label into another CTA.
  if (target.children.some((child) => !ts.isJsxText(child)
    && !(ts.isJsxSelfClosingElement(child) && child.tagName.getText(file) === "IconArrowRight"))) return null;
  const text = target.children.filter((child) => ts.isJsxText(child) && normalize(child.text));
  return text.length === 1 ? text[0] : null;
}

export function compareSource(before, after, filename, { approvedCtaLabels = false } = {}) {
  let expected = before;
  const failures = [];
  const approved = approvedCtaLabels ? APPROVED_CTA_LABELS[filename] : undefined;
  if (approved) {
    const originalLabel = ctaTextNode(before, filename, approved.className);
    const currentLabel = ctaTextNode(after, filename, approved.className);
    if (!originalLabel || normalize(originalLabel.text) !== approved.before) {
      failures.push({ file: filename, kind: "approved-cta", value: `Unique original ${approved.className} label: ${approved.before}`, count: 1 });
    } else {
      expected = before.slice(0, originalLabel.pos) + ` ${approved.after} ` + before.slice(originalLabel.end);
    }
    if (!currentLabel || normalize(currentLabel.text) !== approved.after) {
      failures.push({ file: filename, kind: "approved-cta", value: `Unique approved ${approved.className} label: ${approved.after}`, count: 1 });
    }
  }
  const original = extractContent(expected, filename);
  const changed = extractContent(after, filename);
  return failures.concat(Object.keys(original).flatMap((kind) =>
    missing(original[kind], changed[kind]).map((entry) => ({ file: filename, kind, ...entry })),
  ));
}

/**
 * Explicit semantic deltas authorized by the 15 November Rundum-Service task.
 * Each entry records the immutable current source and exact removed/required
 * added inventory, rather than exempting a form or route from the guard.
 * Unrelated copy, headings, links, package expressions and SEO still compare.
 */
export const APPROVED_RUNDUM_CONTENT = rundumContentApproval;
export function compareApprovedRundumContent(before, after, filename, approval) {
  if (!approval || sourceBlobId(before) !== approval.beforeBlob)
    return [{ file: filename, kind: "rundum-baseline", value: "Immutable approved source baseline differs", count: 1 }];
  const original = extractContent(before, filename), changed = extractContent(after, filename), failures = [];
  for (const kind of Object.keys(original)) {
    const expected = new Map(original[kind]);
    for (const { value, count } of approval.removed[kind] ?? []) {
      if (!Number.isSafeInteger(count) || count < 1 || (expected.get(value) ?? 0) < count) {
        failures.push({ file: filename, kind: "rundum-approval", value: "Invalid removal: " + value, count: 1 });
        continue;
      }
      expected.set(value, expected.get(value) - count);
    }
    for (const { value, count } of approval.added[kind] ?? []) {
      if (!Number.isSafeInteger(count) || count < 1) {
        failures.push({ file: filename, kind: "rundum-approval", value: "Invalid addition: " + value, count: 1 });
        continue;
      }
      expected.set(value, (expected.get(value) ?? 0) + count);
    }
    failures.push(...missing(expected, changed[kind]).map((entry) => ({ file: filename, kind, ...entry })));
  }
  return failures;
}

/** Allow one approved literal replacement; every other protected byte stays pinned. */
export function compareApprovedProtectedReplacement(before, after, filename, approval) {
  const failure = (kind, value) => [{ file: filename, kind, value, count: 1 }];
  if (!approval || sourceBlobId(before) !== approval.beforeBlob)
    return failure("rundum-baseline", "Immutable protected source baseline differs");
  if (!Array.isArray(approval.replacements) || approval.replacements.length !== 1)
    return failure("rundum-approval", "Exactly one protected copy replacement is approved");
  const { before: original, after: replacement } = approval.replacements[0];
  if (typeof original !== "string" || !original || typeof replacement !== "string" || !replacement
    || before.split(original).length !== 2)
    return failure("rundum-approval", "Approved protected literal must occur exactly once");
  const expected = before.replace(original, replacement);
  return after === expected ? [] : failure("protected-source", "Protected source differs beyond the exact approved contact-copy replacement");
}

export function inspectDesignContent({
  base = DESIGN_BASE,
  cwd = process.cwd(),
  sourceBaselines,
  approvedSeoBlobs,
  approvedRundumContent,
  approvedHomeBlobs,
} = {}) {
  const git = (args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 16 * 1024 * 1024 });
  // Resolve once to reject unknown revisions before inspecting any content.
  const commit = git(["rev-parse", "--verify", `${base}^{commit}`]).trim();
  const names = git(["ls-tree", "-r", "--name-only", commit]).split("\n").filter(Boolean);
  const sources = names.filter((name) =>
    /^(src\/components\/.*|src\/routes\/(?!admin(?:\.|\/)|api\.|login\.).*)\.tsx$/.test(name)
    && !/\.test\./.test(name),
  );
  // Custom fixture/repository bases remain self-contained. Only the actual
  // redesign base selects the repository's explicit approved source pins.
  const overrides = sourceBaselines === undefined
    ? (commit === DESIGN_BASE ? APPROVED_SOURCE_BASELINES : {})
    : sourceBaselines;
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides))
    throw new Error("sourceBaselines must be a map of public source files to immutable commits.");
  const actualSourceBaselines = Object.fromEntries(sources.map((name) => [name, { commit }]));
  for (const [name, baseline] of Object.entries(overrides)) {
    if (!sources.includes(name) || protectedFiles.includes(name))
      throw new Error(`Source baseline must name an unprotected public TSX source: ${name}`);
    if (!baseline || !/^[a-f0-9]{40}$/.test(baseline.commit))
      throw new Error(`Source baseline must use an immutable full commit SHA: ${name}`);
    let resolved;
    try { resolved = git(["rev-parse", "--verify", `${baseline.commit}^{commit}`]).trim(); }
    catch { throw new Error(`Source baseline unavailable for ${name}: ${baseline.commit}. Fetch this exact commit before running the guard.`); }
    actualSourceBaselines[name] = {
      commit: resolved,
      ...(baseline.pullRequest === undefined ? {} : { pullRequest: baseline.pullRequest }),
      ...(baseline.pullRequestUrl === undefined ? {} : { pullRequestUrl: baseline.pullRequestUrl }),
    };
  }
  const protectedPresent = protectedFiles.filter((name) => names.includes(name)
    || (commit === DESIGN_BASE && ["src/data/editorial-guides.json", "src/data/review-links.json"].includes(name)));
  const seoBlobs = approvedSeoBlobs ?? (commit === DESIGN_BASE ? APPROVED_SEO_BLOBS : {});
  for (const [name, blobId] of Object.entries(seoBlobs)) {
    if ((!sources.includes(name) && !protectedPresent.includes(name)) || !/^[a-f0-9]{40}$/.test(blobId)) {
      throw new Error(`Invalid approved SEO Git blob for ${name}`);
    }
  }
  const rundum = approvedRundumContent ?? (commit === DESIGN_BASE ? APPROVED_RUNDUM_CONTENT : { files: {} });
  for (const name of Object.keys(rundum.files ?? {})) {
    if (!sources.includes(name) || !/^[a-f0-9]{40}$/.test(rundum.commit ?? ""))
      throw new Error(`Invalid approved Rundum content source: ${name}`);
  }
  for (const name of Object.keys(rundum.protectedFiles ?? {})) {
    if (!protectedPresent.includes(name) || !/^[a-f0-9]{40}$/.test(rundum.commit ?? ""))
      throw new Error(`Invalid approved protected Rundum source: ${name}`);
  }
  const homeBlobs = approvedHomeBlobs ?? (commit === DESIGN_BASE ? APPROVED_HOME_BLOBS : {});
  const failures = [];
  for (const [name, blobId] of Object.entries(homeBlobs)) {
    const publicContent = /^(?:src\/components\/[\w-]+\.tsx|src\/data\/[\w-]+\.ts)$/.test(name);
    if ((!sources.includes(name) && !protectedPresent.includes(name) && !publicContent)
      || rundum.files?.[name]?.deleted || !/^[a-f0-9]{40}$/.test(blobId))
      throw new Error(`Invalid approved homepage source: ${name}`);
    let current;
    try { current = readFileSync(resolve(cwd, name), "utf8"); } catch { current = null; }
    if (current === null || sourceBlobId(current) !== blobId)
      failures.push({ file: name, kind: "home-source", value: "Source differs from the reviewed homepage and regional update", count: 1 });
  }
  const verifySeoBlob = (name, source) => {
    if (source && sourceBlobId(source) === seoBlobs[name]) return;
    failures.push({ file: name, kind: "seo-source", value: "Source differs from the approved SEO update", count: 1 });
  };
  let textEntries = 0;
  let headingEntries = 0;
  let linkEntries = 0;
  let seoEntries = 0;
  for (const name of sources) {
    const taskApproval = rundum.files?.[name];
    const sourceCommit = taskApproval ? rundum.commit : actualSourceBaselines[name].commit;
    let before;
    try { before = git(["show", `${sourceCommit}:${name}`]); }
    catch { throw new Error(`Source baseline file unavailable: ${sourceCommit}:${name}`); }
    let after;
    try {
      after = readFileSync(resolve(cwd, name), "utf8");
      if (taskApproval?.deleted) failures.push({ file: name, kind: "rundum-file", value: "Approved obsolete public upload component must remain removed", count: 1 });
    }
    catch {
      if (taskApproval?.deleted) after = "";
      else { failures.push({ file: name, kind: "file", value: "Existing source file removed", count: 1 }); continue; }
    }
    const inventory = extractContent(before, name);
    const total = (kind) => [...inventory[kind].values()].reduce((sum, count) => sum + count, 0);
    textEntries += total("text") + total("copy");
    headingEntries += total("headings");
    linkEntries += total("links");
    seoEntries += total("seo");
    if (Object.hasOwn(homeBlobs, name)) continue; // Already compared byte for byte.
    if (taskApproval) failures.push(...compareApprovedRundumContent(before, after, name, taskApproval));
    else if (Object.hasOwn(seoBlobs, name)) verifySeoBlob(name, after);
    else failures.push(...compareSource(before, after, name, { approvedCtaLabels: commit === DESIGN_BASE }));
  }
  for (const name of protectedPresent) {
    if (Object.hasOwn(homeBlobs, name)) continue;
    let current;
    try { current = readFileSync(resolve(cwd, name), "utf8"); } catch { current = null; }
    const approvedReplacement = rundum.protectedFiles?.[name];
    if (approvedReplacement) {
      const before = git(["show", `${rundum.commit}:${name}`]);
      failures.push(...compareApprovedProtectedReplacement(before, current, name, approvedReplacement));
    } else if (Object.hasOwn(seoBlobs, name)) verifySeoBlob(name, current);
    else if (current !== git(["show", `${commit}:${name}`])) {
      failures.push({ file: name, kind: "protected-source", value: "Content/SEO source differs from baseline", count: 1 });
    }
  }
  const priorPins = (entries) => Object.fromEntries(Object.entries(entries).filter(([name]) => !Object.hasOwn(homeBlobs, name)));
  return { base: commit, sourceBaselines: actualSourceBaselines, protectedBase: commit, approvedSeoBlobs: priorPins(seoBlobs),
    approvedCtaLabels: commit === DESIGN_BASE ? priorPins(APPROVED_CTA_LABELS) : {},
    approvedRundumContent: rundum, approvedHomeBlobs: homeBlobs,
    sourceFiles: sources.length, protectedFiles: protectedPresent.length,
    textEntries, headingEntries, linkEntries, seoEntries, failures, passed: failures.length === 0 };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const baseIndex = args.indexOf("--base");
  const base = baseIndex < 0 ? DESIGN_BASE : args[baseIndex + 1];
  if (!base || args.some((arg, index) => arg !== "--base" && !(baseIndex >= 0 && index === baseIndex + 1) && arg !== "--json")) {
    console.error("Usage: node scripts/check-design-content.mjs [--base COMMIT] [--json]");
    process.exitCode = 2;
  } else {
    try {
      const result = inspectDesignContent({ base });
      if (args.includes("--json")) console.log(JSON.stringify(result, null, 2));
      else {
        console.log(`Design content guard: ${result.passed ? "PASS" : "FAIL"} against ${result.base}`);
        for (const [file, baseline] of Object.entries(result.sourceBaselines)) {
          if (baseline.commit === result.base && baseline.pullRequest === undefined) continue;
          console.log(`Source baseline: ${file} -> ${baseline.commit}${baseline.pullRequest === undefined ? "" : ` (approved PR #${baseline.pullRequest}: ${baseline.pullRequestUrl})`}`);
        }
        console.log(`Protected data/SEO baseline: ${result.protectedBase}`);
        for (const [file, blobId] of Object.entries(result.approvedSeoBlobs))
          console.log(`Approved SEO source: ${file} -> ${blobId}`);
        for (const [file, blobId] of Object.entries(result.approvedHomeBlobs))
          console.log(`Reviewed homepage source: ${file} -> ${blobId}`);
        for (const [file, label] of Object.entries(result.approvedCtaLabels)) {
          console.log(`Approved CTA label: ${file} .${label.className}: ${JSON.stringify(label.before)} -> ${JSON.stringify(label.after)} (exactly one)`);
        }
        console.log(`${result.sourceFiles} source files, ${result.protectedFiles} protected data/SEO files; ${result.textEntries} text entries, ${result.headingEntries} headings, ${result.linkEntries} links/anchors, ${result.seoEntries} SEO definitions.`);
        for (const failure of result.failures) console.error(`${failure.file} [${failure.kind}] missing ${failure.count} × ${failure.value}`);
      }
      process.exitCode = result.passed ? 0 : 1;
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 2;
    }
  }
}
