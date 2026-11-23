import type { ManifestCssLink, RouterManagedTag } from "@tanstack/router-core";

/** Hydration starts at the latest this long after the bootstrap ran. */
export const DEFERRED_BOOTSTRAP_FALLBACK_MS = 3000;

export function isHomepageRoute(pathname: string) {
  return pathname === "/" || pathname === "/freudenstadt-lossburg";
}

/** A shared media chunk can precede the hero stylesheet in the route manifest.
 * Prepare only the unique stylesheet containing the hero, never a guessed
 * filename or unrelated first chunk. All route styles still render inline. */
export function selectHomepageCssPreload(
  assets: readonly ManifestCssLink[] | undefined,
  styles: Record<string, string> | undefined,
) {
  const candidates = (assets ?? [])
    .map((asset) => typeof asset === "string" ? { href: asset, crossOrigin: undefined } : asset)
    .filter((asset) => styles?.[asset.href]?.includes(".scroll-film{"));
  return candidates.length === 1 ? candidates[0] : undefined;
}

/** Discover responsive hero images before fonts compete for the first connection. */
export function prioritizeImagePreloads(tags: RouterManagedTag[]): RouterManagedTag[] {
  const firstFont = tags.findIndex((tag) =>
    tag.tag === "link" && tag.attrs?.rel === "preload" && tag.attrs?.as === "font");
  if (firstFont < 0) return tags;
  const images = tags.slice(firstFont).filter((tag) =>
    tag.tag === "link" && tag.attrs?.rel === "preload" && tag.attrs?.as === "image");
  if (!images.length) return tags;
  const promoted = new Set(images);
  return tags.flatMap((tag, index) =>
    index === firstFont ? [...images, tag] : promoted.has(tag) ? [] : [tag]);
}

function serialize(value: readonly string[]) {
  // The lists are embedded in an inline script: never allow a closing tag.
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/**
 * Inline script that starts the client bundle after the first viewport has
 * painted. It waits for the document to be parsed and for every eager
 * `fetchpriority="high"` image to load and decode, lets two frames pass, and
 * waits for the browser's first-contentful-paint entry when supported. Frame
 * callbacks alone can run before the compositor presents the first viewport.
 * It then inserts the module preloads and entries exactly as Start would have
 * rendered them. A timer guarantees hydration
 * when frames are paused, e.g. in a background tab. Pointer, keyboard or focus
 * intent starts loading immediately instead of waiting for image decoding.
 * Events are neither cancelled nor replayed, so native links remain native.
 */
export function deferredBootstrapSource(entries: readonly string[], preloads: readonly string[]) {
  return (
    '(function(d,w,e,p){var s=0,o,x=["pointerdown","keydown","focusin"];' +
    'function g(){if(s)return;s=1;if(o)o.disconnect();d.removeEventListener("DOMContentLoaded",r);' +
    "x.forEach(function(n){d.removeEventListener(n,g,true)});" +
    'p.forEach(function(h){var l=d.createElement("link");l.rel="modulepreload";l.href=h;d.head.appendChild(l)});' +
    'e.forEach(function(h){var t=d.createElement("script");t.type="module";t.setAttribute("async","");t.src=h;d.head.appendChild(t)})}' +
    'function h(a){return a.some(function(v){return v.name==="first-contentful-paint"})}' +
    'function c(){if(s)return;var P=w.PerformanceObserver;if(!P||!P.supportedEntryTypes||P.supportedEntryTypes.indexOf("paint")<0){g();return}' +
    'try{if(w.performance&&h(w.performance.getEntriesByType("paint"))){g();return}' +
    'o=new P(function(l){if(h(l.getEntries()))g()});o.observe({type:"paint",buffered:true})}catch{g()}}' +
    "function f(){w.requestAnimationFrame(function(){w.requestAnimationFrame(c)})}" +
    "function r(){var a=[];" +
    'd.querySelectorAll(\'img[fetchpriority="high"]:not([loading="lazy"])\').forEach(function(i){' +
    "a.push(new Promise(function(o){if(i.complete)o();else{" +
    'i.addEventListener("load",o,{once:true});i.addEventListener("error",o,{once:true})}})' +
    ".then(function(){return i.decode&&i.decode()}).catch(function(){}))});" +
    "Promise.all(a).then(f)}" +
    "x.forEach(function(n){d.addEventListener(n,g,{capture:true,passive:true})});" +
    `w.setTimeout(g,${DEFERRED_BOOTSTRAP_FALLBACK_MS});` +
    'd.readyState==="loading"?d.addEventListener("DOMContentLoaded",r,{once:true}):r()' +
    `})(document,window,${serialize(entries)},${serialize(preloads)})`
  );
}

export function isModuleEntry(tag: RouterManagedTag) {
  return (
    tag.tag === "script" &&
    tag.attrs?.type === "module" &&
    typeof tag.attrs?.src === "string" &&
    !tag.children
  );
}

export function isModulePreload(tag: RouterManagedTag) {
  return (
    tag.tag === "link" &&
    typeof tag.attrs?.rel === "string" &&
    tag.attrs.rel.split(/\s+/).includes("modulepreload") &&
    typeof tag.attrs?.href === "string"
  );
}

