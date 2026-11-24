import { useEffect, useRef } from "react";
import { DESKTOP_MOTION, useScrollMotion } from "@/lib/scroll-motion";
import { setupParallax } from "@/lib/studio-motion";
import "@/styles/concierge-editorial.css";
import "@/styles/media-rail.css";
import "@/styles/home-cinematic.css";

/**
 * Homepage-only "Polished reveal" scroll motion.
 * Slow, confident, clearcoat-like — no palette changes, no copy changes.
 */
export function HomePolish() {
  const progressRef = useRef<HTMLDivElement>(null);

  useScrollMotion(
    DESKTOP_MOTION,
    (tools) => {
      const { gsap, ScrollTrigger } = tools;
      const main = document.querySelector<HTMLElement>('[data-home="polish"]');
      if (!main) return;
      // Only explicitly marked frames get parallax; package chapters own their stage.
      setupParallax(tools, main);
      // Desktop engines without CSS view timelines use the existing scroll module.
      if (!CSS.supports("animation-timeline", "view()")) {
        for (const title of main.querySelectorAll<HTMLElement>(
          "h2[data-lines], h2[data-scroll-title], [data-parallax-type]",
        )) {
          tools.gsap.fromTo(
            title,
            { y: "0.24em" },
            {
              y: "-0.06em",
              ease: "none",
              scrollTrigger: {
                trigger: title,
                start: "top bottom",
                end: "bottom 35%",
                scrub: true,
              },
            },
          );
        }
      }

      // Only the three service photos after the hero become a pinned story.
      const concierge = main.querySelector<HTMLElement>(".concierge-service");
      const conciergeHeader = concierge?.querySelector<HTMLElement>("header");
      const conciergeSteps = concierge
        ? [...concierge.querySelectorAll<HTMLElement>("ol > li")]
        : [];
      const frames = concierge
        ? [...concierge.querySelectorAll<HTMLElement>(".concierge-frame")]
        : [];
      let destroyStory: (() => void) | undefined;
      let rebuildFrame = 0;

      const fits = () =>
        Boolean(
          conciergeHeader &&
            window.innerHeight >= 760 &&
            conciergeHeader.getBoundingClientRect().height <= window.innerHeight - 144,
        );

      const installStory = () => {
        if (!concierge || !conciergeHeader || frames.length !== 3 || conciergeSteps.length !== 4)
          return undefined;

        // The existing sticky header keeps its exact grid and typography.
        concierge.dataset.conciergeMotion = "scroll";
        concierge.dataset.conciergeCinema = "true";
        concierge.dataset.conciergeActive = "0";
        const sheens = frames.map((frame) => {
          const sheen = document.createElement("span");
          sheen.className = "concierge-sheen";
          sheen.setAttribute("aria-hidden", "true");
          frame.append(sheen);
          return sheen;
        });

        gsap.set(frames, {
          opacity: 0,
          clipPath: "inset(0 0 100% 0 round 12px)",
          scale: 1.08,
          rotateY: 0,
          z: 0,
          filter: "blur(0px) brightness(1)",
        });
        frames.forEach((frame, index) => gsap.set(frame, { zIndex: index + 1 }));
        gsap.set(frames[0], {
          opacity: 1,
          clipPath: "inset(0 0 0% 0 round 0px)",
          scale: 1,
        });
        gsap.set(sheens, { xPercent: -130, opacity: 0 });

        const syncActive = () => {
          let active = 0;
          conciergeSteps.forEach((step, index) => {
            if (step.getBoundingClientRect().top <= window.innerHeight * 0.55) active = index;
          });
          concierge.dataset.conciergeActive = String(Math.min(active, frames.length - 1));
        };
        const activeTrigger = ScrollTrigger.create({
          trigger: concierge,
          start: "top bottom",
          end: "bottom top",
          onUpdate: syncActive,
          onRefresh: syncActive,
        });
        syncActive();

        const transitions = frames.slice(1).map((frame, offset) => {
          const previous = frames[offset];
          const sheen = sheens[offset + 1];
          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: conciergeSteps[offset + 1],
              start: "top 55%",
              end: "top 52%",
              scrub: 0.7,
              invalidateOnRefresh: true,
            },
          });

          timeline.to(previous, {
            scale: 1.025,
            yPercent: -1,
            rotateY: -2,
            z: -24,
            filter: "blur(6px) brightness(0.7)",
            opacity: 0.6,
            duration: 0.75,
            ease: "none",
          }, 0);
          timeline.fromTo(
            frame,
            {
              opacity: 1,
              clipPath: "inset(0 0 100% 0 round 12px)",
              scale: 1.08,
              yPercent: 2,
              rotateY: 2,
              z: 12,
            },
            {
              opacity: 1,
              clipPath: "inset(0 0 0% 0 round 0px)",
              scale: 1,
              yPercent: 0,
              rotateY: 0,
              z: 0,
              duration: 1,
              ease: "none",
              immediateRender: false,
            },
            0,
          );
          timeline.fromTo(
            sheen,
            { xPercent: -130, opacity: 0 },
            { xPercent: 160, opacity: 0.2, duration: 0.7, ease: "none" },
            0.1,
          );
          timeline.to(previous, { opacity: 0, duration: 0.25, ease: "none" }, 0.75);
          timeline.to(sheen, { opacity: 0, duration: 0.2, ease: "none" }, 0.8);
          return timeline;
        });

        return () => {
          transitions.forEach((timeline) => {
            timeline.scrollTrigger?.kill(true);
            timeline.kill();
          });
          activeTrigger.kill(true);
          delete concierge.dataset.conciergeCinema;
          delete concierge.dataset.conciergeMotion;
          concierge.dataset.conciergeActive = "0";
          gsap.set(frames, { clearProps: "opacity,clipPath,transform,filter,zIndex" });
          sheens.forEach((sheen) => sheen.remove());
        };
      };

      const canRun = () =>
        fits() && frames.length === 3 && conciergeSteps.length === 4;
      const reconcileStory = () => {
        if (canRun() === Boolean(destroyStory)) return;
        destroyStory?.();
        destroyStory = canRun() ? installStory() : undefined;
        if (!destroyStory && concierge) concierge.dataset.conciergeActive = "0";
        ScrollTrigger.refresh();
      };
      if (concierge) concierge.dataset.conciergeActive = "0";
      if (canRun()) destroyStory = installStory();

      const onConciergeResize = () => {
        window.cancelAnimationFrame(rebuildFrame);
        rebuildFrame = window.requestAnimationFrame(reconcileStory);
      };
      const conciergeResize = conciergeHeader
        ? new ResizeObserver(onConciergeResize)
        : undefined;
      if (conciergeHeader) conciergeResize?.observe(conciergeHeader);
      window.addEventListener("resize", onConciergeResize, { passive: true });
      const cleanupConcierge = () => {
        window.cancelAnimationFrame(rebuildFrame);
        conciergeResize?.disconnect();
        window.removeEventListener("resize", onConciergeResize);
        destroyStory?.();
        if (concierge) delete concierge.dataset.conciergeActive;
      };

      // Lazy sections (reviews, booking) change the page height after load.
      let timer = 0;
      const resize = new ResizeObserver(() => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => ScrollTrigger.refresh(), 200);
      });
      resize.observe(main);
      return () => {
        resize.disconnect();
        window.clearTimeout(timer);
        cleanupConcierge();
      };
    },
    undefined,
    // Defer desktop motion until the package story approaches the viewport.
    "#pakete",
  );

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const main = document.querySelector<HTMLElement>('[data-home="polish"]');
    if (!main) return;

    const cleanups: Array<() => void> = [];

    /* ---- Hero entrance (once on load) ---- */
    const hero = main.querySelector<HTMLElement>("[data-hero-enter]");
    const markHero = () => hero?.classList.add("is-in");
    if (reduce) {
      markHero();
    } else {
      const id = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(markHero);
      });
      cleanups.push(() => window.cancelAnimationFrame(id));
    }

    /* ---- Shared once-in-view observer ---- */
    const onceIn = (
      nodes: HTMLElement[],
      onIn: (el: HTMLElement) => void,
      opts?: IntersectionObserverInit,
    ) => {
      if (!nodes.length) return;
      if (reduce) {
        nodes.forEach(onIn);
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            onIn(entry.target as HTMLElement);
            io.unobserve(entry.target);
          }
        },
        opts ?? { threshold: 0.12, rootMargin: "10% 0px -8% 0px" },
      );
      nodes.forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
    };

    onceIn([...main.querySelectorAll<HTMLElement>("[data-reveal]")], (el) =>
      el.classList.add("is-in"),
    );

    // These markers animate decorative highlights only. Content stays readable
    // before hydration, without observers and with reduced motion enabled.
    onceIn(
      [...main.querySelectorAll<HTMLElement>(
        ".wg-collection-head, .home-directory > header, .home-booking-promise",
      )],
      (el) => el.classList.add("home-cinema-in"),
    );

    const entranceAnimations: Animation[] = [];
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const revealItem = (item: HTMLElement, index = 0) => {
      if (motionPreference.matches || typeof item.animate !== "function") return;
      entranceAnimations.push(
        item.animate(
          [
            { opacity: 0, transform: "translateY(12px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          {
            duration: 650,
            delay: Math.min(index * 75, 225),
            easing: "cubic-bezier(.2,.7,.2,1)",
            fill: "backwards",
          },
        ),
      );
    };
    onceIn([...main.querySelectorAll<HTMLElement>("[data-stagger]")], (el) => {
      el.classList.add("is-in");
      const items = [...el.querySelectorAll<HTMLElement>("[data-stagger-item]")];
      // Tall process steps enter independently; horizontal cards reveal as a group.
      if (el.closest(".concierge-service")) onceIn(items, (item) => revealItem(item));
      else items.forEach(revealItem);
    });
    const stopEntrances = () => {
      if (motionPreference.matches) entranceAnimations.forEach((animation) => animation.cancel());
    };
    motionPreference.addEventListener("change", stopEntrances);
    cleanups.push(() => {
      motionPreference.removeEventListener("change", stopEntrances);
      entranceAnimations.forEach((animation) => animation.cancel());
    });

    onceIn(
      [...main.querySelectorAll<HTMLElement>("[data-polish-ba]")],
      (el) => el.classList.add("is-in"),
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
    );

    // Prices and factual statistics remain stable while scrolling.

    /* ---- Masked line reveals for section headlines (studio.css §6) ---- */
    // Headlines already on screen are marked first, so nothing that the
    // visitor has seen is hidden again; only those below the fold rise in.
    const lines = [...main.querySelectorAll<HTMLElement>("[data-lines]")];
    if (lines.length && !reduce) {
      const root = document.documentElement;
      const fold = window.innerHeight;
      const positions = lines.map((el) => ({ el, visible: el.getBoundingClientRect().top < fold }));
      const pending = positions.flatMap(({ el, visible }) => {
        if (visible) el.classList.add("is-in");
        return visible ? [] : [el];
      });
      root.dataset.lines = "armed";
      onceIn(pending, (el) => el.classList.add("is-in"), {
        threshold: 0,
        rootMargin: "0px 0px -12% 0px",
      });
      cleanups.push(() => {
        delete root.dataset.lines;
      });
    }

    /* ---- Page scroll progress ---- */
    let frame = 0;
    let pageP = 0;
    const progressEl = progressRef.current;

    const paint = () => {
      const scrollY = window.scrollY;
      // At the top, progress is known without forcing layout of the full page.
      const targetPage = scrollY <= 0
        ? 0
        : Math.min(1, scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight));
      pageP += (targetPage - pageP) * 0.18;
      if (Math.abs(targetPage - pageP) < 0.0005) pageP = targetPage;
      if (progressEl) progressEl.style.transform = `scaleX(${pageP})`;

      if (pageP !== targetPage) {
        frame = window.requestAnimationFrame(paint);
      } else {
        frame = 0;
      }
    };

    const onScroll = () => {
      if (reduce) return;
      if (frame) return;
      frame = window.requestAnimationFrame(paint);
    };

    if (!reduce) {
      paint();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      cleanups.push(() => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        if (frame) window.cancelAnimationFrame(frame);
      });
    } else {
      if (progressEl) progressEl.style.transform = "scaleX(0)";
    }

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return (
    <div ref={progressRef} className="home-scroll-progress" data-scroll-progress aria-hidden />
  );
}
