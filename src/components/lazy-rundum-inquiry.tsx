import { useRouterState } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { site } from "@/data/site";

const RundumServiceForm = lazy(() =>
  import("./rundum-service-form").then((module) => ({ default: module.RundumServiceForm })),
);

function Skeleton() {
  return (
    <div
      className="min-h-[64rem] border-t border-line py-6"
      role="status"
      aria-label="Anfrageformular wird geladen"
    >
      <p className="text-sm text-muted">Anfrageformular wird geladen …</p>
    </div>
  );
}

/** Keep below-fold form code out of initial hydration; its request anchor is always rendered. */
export function LazyRundumInquiry() {
  const hash = useRouterState({ select: (state) => state.location.hash });
  const ref = useRef<HTMLDivElement>(null);
  // Fragments are unavailable during SSR; the first client render must match it.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (hash === "rundum-anfrage") setReady(true);
  }, [hash]);

  useEffect(() => {
    if (ready) return;
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ready]);

  return (
    <div ref={ref}>
      <noscript>
        <style>{".lazy-rundum-js { display: none; }"}</style>
        <p className="mb-6 text-sm text-muted">
          Für deine Anfrage erreichst du uns telefonisch unter{" "}
          <a href={site.phoneHref} className="underline underline-offset-4">
            {site.phoneDisplay}
          </a>
          .
        </p>
      </noscript>
      <div className="lazy-rundum-js">
        {ready ? (
          <Suspense fallback={<Skeleton />}>
            <RundumServiceForm />
          </Suspense>
        ) : (
          <Skeleton />
        )}
      </div>
    </div>
  );
}
