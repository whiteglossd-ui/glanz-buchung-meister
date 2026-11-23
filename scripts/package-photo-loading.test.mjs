import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const source = readFileSync(new URL("../src/components/deferred-package-photo.tsx", import.meta.url), "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const photo = { src: "/package-900.webp", srcSet: "/package-480.webp 480w, /package-900.webp 900w", width: 900, height: 1200, alt: "Glänzender Lack" };

function harness({ ready = false, observerSupported = true } = {}) {
  const module = { exports: {} };
  const frame = {};
  const stateUpdates = [];
  let effect, observer;
  runInNewContext(code, {
    exports: module.exports,
    require(name) {
      if (name === "react") return {
        useRef: () => ({ current: frame }),
        useState: () => [ready, (value) => stateUpdates.push(value)],
        useEffect: (callback) => { effect = callback; },
      };
      if (name === "react/jsx-runtime") return jsxRuntime;
      throw new Error(`Unexpected dependency: ${name}`);
    },
    IntersectionObserver: observerSupported ? class {
      constructor(callback, options) {
        observer = this;
        this.callback = callback;
        this.options = options;
        this.disconnects = 0;
      }
      observe(element) { this.element = element; }
      disconnect() { this.disconnects++; }
    } : undefined,
  });
  const html = renderToStaticMarkup(React.createElement(module.exports.DeferredPackagePhoto, { photo, position: "50% 58%" }));
  return { html, frame, stateUpdates, mount: () => effect(), observer: () => observer };
}

test("offscreen package photos reserve a frame and keep real no-JavaScript previews without an active image request", () => {
  const { html } = harness();
  assert.match(html, /class="wg-rail-frame"/);
  assert.match(html, /<noscript><img[^>]*src="\/package-900.webp"/);
  assert.match(html, /width="900" height="1200" alt="Glänzender Lack"/);
  assert.doesNotMatch(html.replace(/<noscript>[\s\S]*?<\/noscript>/g, ""), /<img|<link[^>]+preload/);
});

test("a real viewport approach enables the photo once and disconnects the observer", () => {
  const h = harness();
  const cleanup = h.mount();
  const observer = h.observer();
  assert.equal(observer.element, h.frame);
  assert.equal(observer.options.rootMargin, "240px 0px");
  observer.callback([{ isIntersecting: false }]);
  assert.deepEqual(h.stateUpdates, []);
  observer.callback([{ isIntersecting: true }]);
  assert.deepEqual(h.stateUpdates, [true]);
  assert.equal(observer.disconnects, 1);
  cleanup();
  assert.equal(observer.disconnects, 2);
  const active = harness({ ready: true }).html.replace(/<noscript>[\s\S]*?<\/noscript>/g, "");
  assert.match(active, /<img[^>]+src="\/package-900.webp"/);
  assert.match(active, /srcSet="\/package-480.webp 480w, \/package-900.webp 900w"/);
});

test("browsers without IntersectionObserver still receive the real package image", () => {
  const h = harness({ observerSupported: false });
  h.mount();
  assert.deepEqual(h.stateUpdates, [true]);
});
