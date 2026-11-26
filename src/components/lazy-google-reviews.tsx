import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ReviewShowcase } from "./review-showcase";

const GoogleReviews = lazy(() =>
  import("@/components/google-reviews").then((m) => ({ default: m.GoogleReviews })),
);

function CompactSkeleton() {
  return <ReviewShowcase />;
}

/**
 * Defers the reviews chunk (and @tanstack/react-query) until near viewport.
 * Keeps the homepage main bundle free of unused review UI JS.
 */
export function LazyGoogleReviews({
  compact = false,
  id,
}: {
  compact?: boolean;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || ready) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setReady(true);
          io.disconnect();
        }
      },
      { rootMargin: "320px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ready]);

  return (
    <div id={id} ref={ref} className={id ? "scroll-mt-24" : undefined}>
      {ready ? (
        <Suspense fallback={compact ? <CompactSkeleton /> : null}>
          <GoogleReviews compact={compact} />
        </Suspense>
      ) : compact ? (
        <CompactSkeleton />
      ) : (
        <div className="section mx-auto max-w-7xl px-4 sm:px-6" aria-hidden />
      )}
    </div>
  );
}
