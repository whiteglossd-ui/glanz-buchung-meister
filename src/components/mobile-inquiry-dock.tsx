import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { site } from "@/data/site";
import { ctaPrimary } from "@/components/ui";

export function MobileInquiryDock() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const switchEl = document.getElementById("nach-dem-film");
    const bookingEl = document.getElementById("buchung");
    if (!switchEl) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const pastFilm = switchEl.getBoundingClientRect().top < window.innerHeight * 0.25;
      const bookingVisible =
        Boolean(bookingEl) &&
        (() => {
          const rect = bookingEl!.getBoundingClientRect();
          return rect.top < window.innerHeight - 40 && rect.bottom > 40;
        })();
      setVisible(pastFilm && !bookingVisible);
    };
    const request = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden={!visible}
      inert={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 lg:hidden ${
        visible ? "opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      } transition-opacity duration-200 motion-reduce:transition-none`}
    >
      <div className="mx-3 mb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-2 rounded-sm border border-line-strong bg-[rgba(13,14,17,0.94)] p-2 pl-4 backdrop-blur-sm">
        <span className="flex-1 text-xs text-muted">Termin anfragen</span>
        <Link
          to="/"
          hash="buchung"
          className={`${ctaPrimary} min-h-11 px-4 text-sm`}
        >
          Anfragen
        </Link>
        <a
          href={site.phoneHref}
          aria-label={`Anrufen ${site.phoneDisplay}`}
          className="inline-flex min-h-11 items-center rounded-sm border border-line px-3 text-sm text-fg"
        >
          Anruf
        </a>
      </div>
    </div>
  );
}
