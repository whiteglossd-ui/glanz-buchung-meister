import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";

/** Put keyboard and screen-reader focus into the newly rendered page. */
export function RouteFocus() {
  const router = useRouter();
  useEffect(() => {
    let frame = 0;
    const unsubscribe = router.subscribe("onRendered", (event) => {
      if (!event.fromLocation || !event.pathChanged) return;
      const { hash } = event.toLocation;
      const bookingArrival = hash === "buchung" &&
        !["/", "/freudenstadt-lossburg"].includes(event.fromLocation.pathname);
      if (hash && !bookingArrival) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const target = bookingArrival
          ? document.getElementById("buchung-heading") ?? document.querySelector<HTMLElement>("#buchung h2")
          : document.getElementById("main-content");
        if (!target) return;
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      });
    });
    return () => {
      unsubscribe();
      cancelAnimationFrame(frame);
    };
  }, [router]);
  return null;
}
