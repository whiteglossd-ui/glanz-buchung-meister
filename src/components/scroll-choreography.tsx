import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Dark Edition: Scroll-Choreografie für alle öffentlichen Seiten
 * (Gestaltung: src/styles/dark-edition.css).
 *
 * - Kopfzeile: blendet beim Herunterscrollen aus, beim Hochscrollen wieder ein.
 * - Fortschrittslinie oben am Bildschirmrand.
 * - Abschnitts-Überschriften steigen aus einer Maske auf, der folgende Absatz
 *   blendet nach. Bilder öffnen sich wie ein Vorhang.
 *
 * Sicherheitsregeln:
 * - Nur data-Attribute, keine Klassen und keine Textknoten werden verändert.
 *   React überschreibt beim Rendern className, aber keine fremden
 *   data-Attribute; Texte (z. B. Städtenamen) bleiben vollständig in React.
 * - Was beim Start bereits sichtbar ist, wird nie versteckt (kein Aufblitzen).
 * - Ohne JavaScript, bei reduzierter Bewegung und beim Drucken bleibt alles
 *   sofort sichtbar. Die Startseiten-Hero (Scrollfilm) bleibt unberührt.
 */

const HEADING_SELECTOR = "main h2";
const FOLLOW_SELECTOR = "main h2 + p";
const IMAGE_SELECTOR = "main img";

/** Bereiche mit eigener Bewegung oder eigener Bildlogik bleiben unangetastet. */
const EXCLUDED = [
  ".scroll-film",
  "[data-lines]",
  ".concierge-service",
  "[data-parallax-type]",
  "dialog",
  "[role='dialog']",
  "form",
  ".site-header",
  "[data-wg-static]",
  // Startseiten-Vorlage (.wgt-root) hat eigene Bewegung (src/lib/dark-motion.ts).
  ".wgt-root",
].join(",");

const HIDE_AFTER_PX = 700;
const DIRECTION_TOLERANCE_PX = 4;

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isBelowFold(el: Element) {
  return el.getBoundingClientRect().top > window.innerHeight * 0.92;
}

function isPublicShell() {
  return Boolean(document.querySelector('[data-shell="public"]'));
}

function useHeaderAndProgress(pathname: string) {
  useEffect(() => {
    if (!isPublicShell()) return;
    const root = document.documentElement;
    const progress = document.createElement("div");
    progress.className = "wg-progress";
    progress.setAttribute("aria-hidden", "true");
    document.body.appendChild(progress);

    let lastY = window.scrollY;
    let frame = 0;
    const read = () => {
      frame = 0;
      const y = window.scrollY;
      const max = root.scrollHeight - window.innerHeight;
      progress.style.setProperty("--wg-sp", max > 0 ? (y / max).toFixed(4) : "0");

      const header = document.querySelector<HTMLElement>('[data-shell="public"] .site-header');
      if (header) {
        const menuOpen = document.body.dataset.nav === "open";
        // Reduzierte Bewegung: Kopfzeile bleibt stehen.
        if (reducedMotion() || menuOpen || y < HIDE_AFTER_PX || y < lastY - DIRECTION_TOLERANCE_PX) {
          header.removeAttribute("data-wg-hide");
        } else if (y > lastY + DIRECTION_TOLERANCE_PX) {
          header.setAttribute("data-wg-hide", "true");
        }
      }
      if (Math.abs(y - lastY) > DIRECTION_TOLERANCE_PX) lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      progress.remove();
      document
        .querySelector('[data-shell="public"] .site-header')
        ?.removeAttribute("data-wg-hide");
    };
  }, [pathname]);
}

function useReveals(pathname: string) {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || reducedMotion() || !isPublicShell()) return;
    const root = document.documentElement;
    root.dataset.wgMotion = "on";

    const timers = new Set<number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          observer.unobserve(el);
          for (const attr of ["data-wg-rise", "data-wg-fade", "data-wg-curtain"]) {
            if (el.getAttribute(attr) !== "wait") continue;
            el.setAttribute(attr, "in");
            // Nach der Bewegung alle Stile entfernen: keine abgeschnittenen
            // Unterlängen oder Fokusrahmen, keine dauerhafte clip-path-Ebene.
            const t = window.setTimeout(() => {
              timers.delete(t);
              el.removeAttribute(attr);
            }, 1800);
            timers.add(t);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    const mark = (el: HTMLElement, attr: string) => {
      if (el.hasAttribute(attr) || el.closest(EXCLUDED) || !isBelowFold(el)) return;
      el.setAttribute(attr, "wait");
      observer.observe(el);
    };

    const scan = () => {
      document.querySelectorAll<HTMLElement>(HEADING_SELECTOR).forEach((el) => mark(el, "data-wg-rise"));
      document.querySelectorAll<HTMLElement>(FOLLOW_SELECTOR).forEach((el) => mark(el, "data-wg-fade"));
      document.querySelectorAll<HTMLImageElement>(IMAGE_SELECTOR).forEach((img) => {
        // Kleine Bilder (Logos, Icons) und Bilder mit eigener Maske
        // (Vorher/Nachher-Regler) bleiben unverändert.
        if (img.getBoundingClientRect().width < 200) return;
        if (getComputedStyle(img).clipPath !== "none") return;
        mark(img, "data-wg-curtain");
      });
    };

    // Nach dem Seitenwechsel einen Frame warten, bis die neue Seite steht.
    const start = window.requestAnimationFrame(() => window.requestAnimationFrame(scan));

    // Drucken und Fallback: alles sofort zeigen.
    const revealAll = () => {
      document
        .querySelectorAll("[data-wg-rise],[data-wg-fade],[data-wg-curtain]")
        .forEach((el) => {
          el.removeAttribute("data-wg-rise");
          el.removeAttribute("data-wg-fade");
          el.removeAttribute("data-wg-curtain");
        });
    };
    window.addEventListener("beforeprint", revealAll);

    return () => {
      window.cancelAnimationFrame(start);
      window.removeEventListener("beforeprint", revealAll);
      observer.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      revealAll();
    };
  }, [pathname]);
}

export function ScrollChoreography() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useHeaderAndProgress(pathname);
  useReveals(pathname);
  return null;
}
