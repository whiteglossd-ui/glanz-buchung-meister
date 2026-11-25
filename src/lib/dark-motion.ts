/**
 * Bewegung der Dark-Edition-Startseite (aus der Vorlage vom 25.11.2026).
 * Cockpit-Bildfolge im Hero, Kapitelwechsel, Parallaxe, Bildbühne,
 * horizontale Galerie, Einblendungen. Alles wird beim Verlassen der Seite
 * wieder abgebaut (Listener, Observer, Animation Frames).
 */
const FRAMES = 96;

export function darkFrameSrc(set: "d" | "m", index: number) {
  return `/media/dark/seq/${set}/${String(index + 1).padStart(3, "0")}.webp`;
}

/** Markiert einen .wgt-Bereich als bereit für Einblendungen (CSS .js/.is-ready). */
export function markDarkReady(root: HTMLElement) {
  root.classList.add("js");
  let frame = requestAnimationFrame(() => {
    frame = requestAnimationFrame(() => root.classList.add("is-ready"));
  });
  return () => cancelAnimationFrame(frame);
}

export function initDarkHome(root: HTMLElement): () => void {
  const ac = new AbortController();
  const on = { passive: true, signal: ac.signal } as const;
  const $ = <T extends Element = HTMLElement>(s: string, c: ParentNode = root) => c.querySelector<T>(s);
  const $$ = <T extends Element = HTMLElement>(s: string, c: ParentNode = root) => [...c.querySelectorAll<T>(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const frames = new Set<number>();
  const raf = (fn: FrameRequestCallback) => {
    const id = requestAnimationFrame((t) => {
      frames.delete(id);
      fn(t);
    });
    frames.add(id);
    return id;
  };
  const observers: IntersectionObserver[] = [];
  const unready = markDarkReady(root);
  // Fortschrittslinie und Bildvorschau liegen außerhalb des React-Baums.
  const layer = document.createElement("div");
  layer.className = "wgt wgt-layer";
  document.body.appendChild(layer);

  /* ---------- Hero: Bildfolge auf Canvas ---------- */
  const reelEl = $(".reel");
  const canvas = $<HTMLCanvasElement>(".reel__canvas");
  const ctx = canvas?.getContext("2d") ?? null;
  const poster = $<HTMLImageElement>(".reel__poster");
  const fill = $(".reel__fill");
  const nEl = $(".reel__n");
  const chs = $$(".reel__ch");
  const mobile = matchMedia("(max-width: 767px)");
  let set: "" | "d" | "m" = "";
  let images: (HTMLImageElement | undefined)[] = [];
  let cur = -1;
  let want = 0;
  let smooth = 0;
  let rafOn = false;
  let chIdx = 0;

  const draw = (force: boolean) => {
    if (!canvas || !ctx) return;
    let i = -1;
    const target = Math.round(smooth);
    for (let d = 0; d < FRAMES; d++) {
      if (images[target - d]) { i = target - d; break; }
      if (images[target + d]) { i = target + d; break; }
    }
    if (i < 0 || (i === cur && !force)) return;
    cur = i;
    const img = images[i]!;
    const cw = canvas.width;
    const ch = canvas.height;
    const sc = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * sc;
    const h = img.naturalHeight * sc;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  };
  const loadSet = () => {
    if (!reelEl || !poster || reduce) return;
    const s = mobile.matches ? "m" : "d";
    if (s === set) return;
    set = s;
    images = new Array(FRAMES);
    cur = -1;
    poster.src = darkFrameSrc(s, 0);
    // Grob nach fein laden, damit das Scrubben früh funktioniert.
    const order: number[] = [];
    const seen = new Set<number>();
    for (const step of [16, 8, 4, 2, 1])
      for (let i = 0; i < FRAMES; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
    let k = 0;
    const next = () => {
      if (ac.signal.aborted || set !== s || k >= order.length) return;
      const i = order[k++];
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        if (ac.signal.aborted || set !== s) return;
        images[i] = img;
        if (i === 0) { reelEl.classList.add("is-live"); draw(true); }
        next();
      };
      img.onerror = next;
      img.src = darkFrameSrc(s, i);
    };
    for (let c = 0; c < 4; c++) next();
  };
  const size = () => {
    if (!canvas) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    draw(true);
  };
  const tick = () => {
    smooth += (want - smooth) * 0.18;
    if (Math.abs(want - smooth) < 0.05) smooth = want;
    draw(false);
    if (smooth !== want) raf(tick);
    else rafOn = false;
  };
  // Flache Fenster (Handy quer): Hero steht still wie bei reduzierter Bewegung,
  // damit Überschrift und Buttons vollständig erreichbar bleiben.
  const short = matchMedia("(max-height: 560px)");
  const reduceMq = matchMedia("(prefers-reduced-motion: reduce)");
  const reel = () => {
    if (!reelEl) return;
    // Reduzierte Bewegung (auch nachträglich eingeschaltet) und flache Fenster:
    // statische Einleitung, ihre Links müssen bedienbar sein.
    if (reduceMq.matches || short.matches) {
      if (chIdx !== 0) {
        chIdx = 0;
        reelEl.dataset.ch = "0";
        chs.forEach((c, j) => {
          c.classList.toggle("is-on", j === 0);
          c.setAttribute("aria-hidden", String(j !== 0));
          for (const a of c.querySelectorAll<HTMLElement>("a,button")) a.inert = j !== 0;
        });
      }
      return;
    }
    const r = reelEl.getBoundingClientRect();
    const total = r.height - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / (total || 1)));
    want = p * (FRAMES - 1);
    if (!rafOn) { rafOn = true; raf(tick); }
    if (fill) fill.style.transform = `scaleX(${p})`;
    const idx = p < 0.24 ? 0 : p < 0.6 ? 1 : 2;
    if (idx !== chIdx) {
      chIdx = idx;
      reelEl.dataset.ch = String(idx);
      if (nEl) nEl.textContent = `0${idx + 1}`;
      chs.forEach((c, j) => {
        c.classList.toggle("is-on", j === idx);
        c.setAttribute("aria-hidden", String(j !== idx));
        for (const a of c.querySelectorAll<HTMLElement>("a,button")) a.inert = j !== idx;
      });
    }
    const local = idx === 0 ? p / 0.24 : idx === 1 ? (p - 0.24) / 0.36 : (p - 0.6) / 0.4;
    chs[idx]?.style.setProperty("--d", String(Math.round(idx === 0 ? -local * 50 : (0.5 - local) * 40)));
  };
  if (reelEl) {
    loadSet();
    size();
    addEventListener("resize", () => { loadSet(); size(); reel(); }, on);
    reduceMq.addEventListener("change", reel, { signal: ac.signal });
    short.addEventListener("change", reel, { signal: ac.signal });
  }

  /* ---------- Scroll-Choreografie ---------- */
  let frameJob: (() => void) | null = null;
  // Bildaufdecker immer beobachten: wird reduzierte Bewegung später abgeschaltet,
  // greift die verdeckende clip-path-Regel wieder und braucht ihr .is-in.
  const cio = new IntersectionObserver(
    (es) => es.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); cio.unobserve(en.target); }
    }),
    { rootMargin: "0px 0px -10% 0px" },
  );
  observers.push(cio);
  $$(".clip").forEach((el) => cio.observe(el));
  if (!reduce) {

    const prog = document.createElement("div");
    prog.className = "progress";
    prog.setAttribute("aria-hidden", "true");
    layer.appendChild(prog);

    const auto = $$<HTMLElement>(".loc__img img, .process__img img");
    auto.forEach((i) => i.setAttribute("data-par", "-0.06"));
    const allPar = $$<HTMLElement>("[data-par]");
    allPar.forEach((i) => { i.style.transition = "none"; i.style.willChange = "transform"; });
    const pins = $$(".pin");

    const hg = $(".hg");
    const hgT = hg ? $(".hg__track", hg) : null;
    const wide = () => innerWidth > 820;
    let hgMax = 0;
    const hgSize = () => {
      if (!hg || !hgT) return;
      if (!wide()) { hg.style.removeProperty("--hgh"); return; }
      hgMax = Math.max(0, hgT.scrollWidth - innerWidth);
      hg.style.setProperty("--hgh", `${hgMax + innerHeight}px`);
    };
    if (hg) {
      hgSize();
      addEventListener("resize", hgSize, on);
      addEventListener("load", hgSize, on);
      $$<HTMLImageElement>("img", hg).forEach((img) => img.addEventListener("load", hgSize, on));
    }
    const hgFrame = () => {
      if (!hg || !wide()) return;
      const r = hg.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const t = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
      hg.style.setProperty("--hx", (t * hgMax).toFixed(1));
      hg.style.setProperty("--hp", t.toFixed(4));
      $$(".hg__f", hg).forEach((f) => {
        const b = f.getBoundingClientRect();
        const c = (b.left + b.width / 2 - innerWidth / 2) / innerWidth;
        f.style.setProperty("--ix", (-c * 60 - b.width * 0.07).toFixed(1));
      });
    };

    // Bildvorschau an Leistungslinks (nur Maus, breite Fenster)
    const PEEK: [string, string][] = [
      ["keramik", "beads-sq"], ["lackkorrektur", "hood-wide"], ["smart-repair", "inspection"],
      ["dellen", "inspection"], ["lederrep", "stitching"], ["lederpflege", "leather-wide"],
      ["innenraum", "cockpit-wide"], ["geruch", "towels"], ["leasing", "key"],
      ["scheinwerfer", "headlight-wide"], ["luxus", "profile-wide"], ["b2b", "foamwash"],
      ["ratgeber", "glove-towel"], ["fahrzeugaufbereitung", "foam-sq"], ["abholservice", "taillight"],
    ];
    if (matchMedia("(hover:hover) and (min-width:821px)").matches) {
      const peek = document.createElement("div");
      peek.className = "peek";
      peek.setAttribute("aria-hidden", "true");
      const pimg = document.createElement("img");
      pimg.alt = "";
      peek.appendChild(pimg);
      layer.appendChild(peek);
      $$<HTMLAnchorElement>(".svc a").forEach((a) => {
        const h = a.getAttribute("href") ?? "";
        const m = PEEK.find(([k]) => h.includes(k));
        if (!m) return;
        a.addEventListener("mouseenter", () => { pimg.src = `/media/dark/gen/${m[1]}-800.webp`; peek.classList.add("is-on"); }, on);
        a.addEventListener("mouseleave", () => peek.classList.remove("is-on"), on);
        a.addEventListener("mousemove", (e) => {
          peek.style.setProperty("--px", `${e.clientX + 28}px`);
          peek.style.setProperty("--py", `${e.clientY - 110}px`);
        }, on);
      });
    }

    frameJob = () => {
      const vh = innerHeight;
      const y = scrollY;
      const H = document.documentElement.scrollHeight - vh;
      prog.style.setProperty("--sp", H > 0 ? (y / H).toFixed(4) : "0");
      allPar.forEach((el) => {
        const parent = el.parentElement;
        if (!parent) return;
        const r = parent.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        const sp = Number(el.getAttribute("data-par"));
        const off = (r.top + r.height / 2 - vh / 2) * sp;
        el.style.transform = `translate3d(0,${off.toFixed(1)}px,0) scale(${sp > 0.1 ? 1.18 : 1.1})`;
      });
      hgFrame();
      pins.forEach((p) => {
        const r = p.getBoundingClientRect();
        const t = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)));
        const e = Math.min(1, Math.max(0, (t + 0.15) / 0.75));
        const k = 1 - e * e * (3 - 2 * e);
        p.style.setProperty("--pc", k.toFixed(4));
        p.style.setProperty("--rx", (t * 38).toFixed(2));
      });
    };
  }

  /* ---------- Einblendungen ---------- */
  const rio = new IntersectionObserver(
    (es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target as HTMLElement;
      const sibs = [...(el.parentElement?.children ?? [])].filter((c) => c.hasAttribute("data-reveal"));
      el.style.transitionDelay = `${Math.min(sibs.indexOf(el), 4) * 0.09}s`;
      el.classList.add("is-in");
      rio.unobserve(el);
    }),
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  observers.push(rio);
  $$("[data-reveal]").forEach((el) => rio.observe(el));
  // React kann Teilbäume nach dem Start neu erzeugen (Suspense, Client-Rendering
  // nach der Hydration). Ohne Nachbeobachtung blieben sie unsichtbar.
  const mo = new MutationObserver((records) => {
    for (const r of records)
      r.addedNodes.forEach((n) => {
        if (!(n instanceof HTMLElement)) return;
        const found = n.matches("[data-reveal]") ? [n] : [];
        found.push(...n.querySelectorAll<HTMLElement>("[data-reveal]"));
        found.forEach((el) => { if (!el.classList.contains("is-in")) rio.observe(el); });
      });
  });
  mo.observe(root, { childList: true, subtree: true });

  /* ---------- Vorher/Nachher ---------- */
  const cmp = $(".compare");
  const range = cmp ? $<HTMLInputElement>(".compare__range", cmp) : null;
  range?.addEventListener("input", () => cmp!.style.setProperty("--pos", `${range.value}%`), { signal: ac.signal });

  /* ---------- Scroll-Schleife ---------- */
  let ticking = false;
  const onFrame = () => {
    ticking = false;
    reel();
    frameJob?.();
  };
  const req = () => {
    if (!ticking) { ticking = true; raf(onFrame); }
  };
  addEventListener("scroll", req, on);
  addEventListener("resize", req, on);
  onFrame();

  return () => {
    ac.abort();
    observers.forEach((o) => o.disconnect());
    mo.disconnect();
    frames.forEach((id) => cancelAnimationFrame(id));
    unready();
    layer.remove();
  };
}

/** Zahl weich hochzählen (Paketpreise beim Wechsel der Fahrzeugklasse). */
export function tweenNumber(el: HTMLElement, to: number) {
  // Endwert exakt mit Cent (z. B. 186,25), Zwischenstände ganzzahlig.
  const exact = (n: number) => {
    const cents = Math.round(n * 100) / 100;
    const whole = Number.isInteger(cents);
    return new Intl.NumberFormat("de-DE", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 }).format(cents);
  };
  const fmt = (n: number) => (n === to ? exact(n) : exact(Math.round(n)));
  const from = Number(el.dataset.v) || Number(el.dataset.base) || 0;
  el.dataset.v = String(to);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || from === to) {
    el.textContent = fmt(to);
    return;
  }
  const t0 = performance.now();
  const step = (t: number) => {
    const k = Math.min(1, (t - t0) / 700);
    const e = 1 - Math.pow(1 - k, 4);
    el.textContent = k < 1 ? fmt(from + (to - from) * e) : exact(to);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
