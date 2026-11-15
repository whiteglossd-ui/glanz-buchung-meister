import assert from "node:assert/strict";
import { describe, it, type TestContext } from "node:test";
import Lenis from "lenis";
import { focusBookingHeading } from "./booking-anchor-focus.ts";
import {
  connectScrollTrigger,
  controlSmoothScroll,
  type SmoothScrollEnv,
} from "./smooth-scroll.ts";

const settle = () => new Promise((resolve) => setImmediate(resolve));

function harness({ matches = true, locked = false, fail = false } = {}) {
  const media = Object.assign(new EventTarget(), { matches });
  const calls: string[] = [];
  const subscriptions: Array<() => void> = [];
  let lock = locked;
  let onLock = () => {};
  let created = 0;
  const env: SmoothScrollEnv = {
    media: media as unknown as SmoothScrollEnv["media"],
    create: () => {
      created++;
      if (fail) return Promise.reject(new Error("offline"));
      return Promise.resolve({
        start: () => calls.push("start"),
        stop: () => calls.push("stop"),
        destroy: () => calls.push("destroy"),
        on: (_event: "scroll", callback: () => void) => {
          subscriptions.push(callback);
          return () => calls.push("unsubscribe");
        },
      } as never);
    },
    isLocked: () => lock,
    observeLock: (callback) => {
      onLock = callback;
      return () => calls.push("unobserve");
    },
  };
  return {
    env,
    calls,
    subscriptions,
    created: () => created,
    setMedia(value: boolean) {
      media.matches = value;
      media.dispatchEvent(new Event("change"));
    },
    setLock(value: boolean) {
      lock = value;
      onLock();
    },
  };
}

describe("Lenis-Steuerung", () => {
  it("lädt Lenis nicht für Touch-Geräte oder reduzierte Bewegung", async () => {
    const h = harness({ matches: false });
    const dispose = controlSmoothScroll(h.env);
    await settle();
    assert.equal(h.created(), 0);
    dispose();
    assert.deepEqual(h.calls, ["unobserve"]);
  });

  it("hält Lenis an, solange Menü oder Lightbox den Body sperren", async () => {
    const h = harness();
    const dispose = controlSmoothScroll(h.env);
    await settle();
    assert.deepEqual(h.calls, ["start"]);
    h.setLock(true);
    h.setLock(false);
    assert.deepEqual(h.calls, ["start", "stop", "start"]);
    dispose();
  });

  it("übernimmt eine Sperre, die schon beim Laden besteht", async () => {
    const h = harness({ locked: true });
    const dispose = controlSmoothScroll(h.env);
    await settle();
    assert.deepEqual(h.calls, ["stop"]);
    dispose();
  });

  it("baut Lenis ab, wenn reduzierte Bewegung während des Ladens aktiviert wird", async () => {
    const h = harness();
    const dispose = controlSmoothScroll(h.env);
    h.setMedia(false);
    await settle();
    assert.deepEqual(h.calls, ["destroy"]);
    dispose();
  });

  it("verbindet ScrollTrigger unabhängig von der Ladereihenfolge", async () => {
    const h = harness();
    const dispose = controlSmoothScroll(h.env);
    await settle();
    let updates = 0;
    connectScrollTrigger(() => updates++);
    assert.equal(h.subscriptions.length, 1);
    h.subscriptions[0]();
    assert.equal(updates, 1);
    dispose();
    assert.ok(h.calls.includes("unsubscribe"));
    assert.ok(h.calls.includes("destroy"));
  });

  it("bleibt bei einem Ladefehler beim nativen Scrollen", async () => {
    const h = harness({ fail: true });
    const dispose = controlSmoothScroll(h.env);
    await settle();
    h.setLock(true);
    assert.deepEqual(h.calls, []);
    dispose();
  });
});

// Real installed Lenis, without a browser or website server. Geometry and native
// scroll-event delivery are controlled so the browser's coalesced scroll after
// a completed animation can be reproduced deterministically.
async function nativeAnchorHarness(t: TestContext, { enabled = true } = {}) {
  class ClassListDouble extends Set<string> {
    remove(name: string) {
      this.delete(name);
    }
  }
  class ElementDouble extends EventTarget {
    classList = new ClassListDouble();
    nodeName = "P";
    scrollHeight = 128;
    clientHeight = 128;
    scrollWidth = 390;
    clientWidth = 390;
    hasAttribute() {
      return false;
    }
  }
  class WindowDouble extends EventTarget {
    scrollY = 12312;
    scrollX = 0;
    innerWidth = 390;
    innerHeight = 844;
    location = { href: "https://site.example.invalid/#buchung", hash: "#buchung" };
    matchMedia() {
      return { matches: false };
    }
    getComputedStyle() {
      return {
        overflowX: "visible",
        overflowY: "visible",
        overscrollBehaviorX: "auto",
        overscrollBehaviorY: "auto",
      };
    }
    scrollTo({ top }: { top: number }) {
      this.scrollY = top;
    }
  }
  const root = new ElementDouble(),
    body = new ElementDouble(),
    paragraph = new ElementDouble();
  const viewport = new WindowDouble();
  root.scrollHeight = 23508;
  root.clientHeight = viewport.innerHeight;
  const nativeCalls: unknown[] = [],
    focusCalls: unknown[] = [];
  const section = Object.assign(new ElementDouble(), {
    nodeName: "SECTION",
    scrollIntoView(options: unknown) {
      nativeCalls.push(options);
      viewport.scrollTo({ top: 12312 });
    },
  });
  const heading = {
    focus(options: unknown) {
      focusCalls.push(options);
    },
  };
  const frames = new Map<number, FrameRequestCallback>();
  let frameId = 0,
    clock = 0,
    dispose = () => {};
  const globals = {
    window: viewport,
    document: {
      documentElement: root,
      body,
      getElementById: (id: string) =>
        id === "buchung" ? section : id === "buchung-heading" ? heading : null,
    },
    navigator: { userAgent: "Synthetic desktop" },
    Window: WindowDouble,
    Element: ElementDouble,
    HTMLElement: ElementDouble,
    HTMLAnchorElement: ElementDouble,
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      frames.set(++frameId, callback);
      return frameId;
    },
    cancelAnimationFrame: (id: number) => frames.delete(id),
  };
  const original = new Map(
    Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );
  for (const [key, value] of Object.entries(globals))
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  t.after(() => {
    dispose();
    for (const [key, descriptor] of original) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  });
  const lenis = new Lenis({
    autoResize: false,
    allowNestedScroll: true,
    stopInertiaOnNavigate: true,
  });
  if (enabled) {
    const media = Object.assign(new EventTarget(), { matches: true });
    dispose = controlSmoothScroll({
      media: media as unknown as SmoothScrollEnv["media"],
      create: async () => lenis,
      isLocked: () => false,
      observeLock: () => () => {},
    });
    await settle();
  } else dispose = () => lenis.destroy();
  const wheel = () => {
    const event = Object.assign(new Event("wheel", { cancelable: true }), {
      deltaX: 0,
      deltaY: -12312,
      deltaMode: 0,
      composedPath: () => [paragraph, section, body, root, viewport],
    });
    viewport.dispatchEvent(event);
    return event;
  };
  const animate = () => {
    for (let frame = 0; lenis.isScrolling === "smooth" && frame < 20; frame++) {
      lenis.raf((clock += 1000));
      if (lenis.isScrolling === "smooth") viewport.dispatchEvent(new Event("scroll"));
    }
  };
  const click = () => {
    let prevented = false;
    focusBookingHeading({
      currentTarget: { href: viewport.location.href, target: "", hasAttribute: () => false },
      button: 0,
      defaultPrevented: false,
      preventDefault() {
        prevented = true;
      },
    } as unknown as Parameters<typeof focusBookingHeading>[0]);
    // A native anchor jump may be coalesced with Lenis's final scroll event.
    viewport.dispatchEvent(new Event("scroll"));
    const pending = [...frames.values()];
    frames.clear();
    for (const callback of pending) callback(clock);
    return prevented;
  };
  return { lenis, viewport, nativeCalls, focusCalls, wheel, animate, click };
}

it("keeps root wheel scrolling after a same-hash anchor consumes the final native Lenis scroll", async (t) => {
  const h = await nativeAnchorHarness(t);
  h.wheel();
  h.animate();
  assert.equal(h.viewport.scrollY, 0);
  assert.equal(h.lenis.targetScroll, 0);
  assert.equal(h.click(), true);
  assert.equal(h.viewport.scrollY, 12312);
  const samples = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    const wheel = h.wheel();
    h.animate();
    samples.push({
      prevented: wheel.defaultPrevented,
      actual: h.viewport.scrollY,
      target: h.lenis.targetScroll,
    });
  }
  assert.equal(h.viewport.scrollY, 0, JSON.stringify(samples));
  assert.equal(h.lenis.isStopped, false);
  assert.deepEqual(h.nativeCalls, [{ block: "start", behavior: "instant" }]);
  assert.deepEqual(h.focusCalls, [{ preventScroll: true }]);
});

it("cancels stale Lenis inertia when the native booking jump happens mid-animation", async (t) => {
  const h = await nativeAnchorHarness(t);
  h.wheel();
  assert.equal(h.lenis.isScrolling, "smooth");
  h.click();
  h.animate();
  assert.equal(
    h.viewport.scrollY,
    12312,
    "The previous tween must not pull the native anchor back",
  );
  assert.equal(h.lenis.targetScroll, 12312);
  h.wheel();
  h.animate();
  assert.equal(h.viewport.scrollY, 0);
});

it("preserves an existing Lenis lock and resumes from the native anchor only after unlock", async (t) => {
  const h = await nativeAnchorHarness(t);
  h.lenis.stop();
  h.viewport.scrollY = 0;
  h.click();
  assert.equal(h.lenis.isStopped, true);
  assert.equal(h.viewport.scrollY, 12312);
  h.lenis.start();
  h.wheel();
  h.animate();
  assert.equal(h.viewport.scrollY, 0);
});

it("keeps native booking focus and scroll available when smooth scrolling is inactive", async (t) => {
  const h = await nativeAnchorHarness(t, { enabled: false });
  h.viewport.scrollY = 0;
  assert.equal(h.click(), true);
  assert.equal(h.viewport.scrollY, 12312);
  assert.deepEqual(h.focusCalls, [{ preventScroll: true }]);
  assert.deepEqual(h.nativeCalls, [{ block: "start", behavior: "instant" }]);
});
