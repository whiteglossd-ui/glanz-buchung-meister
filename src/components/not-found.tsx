import { BOOKING_JUMP } from "@/lib/booking-anchor-focus";
import { Link } from "@tanstack/react-router";
import { ctaGhost, ctaPrimary } from "@/components/ui";
import { site } from "@/data/site";

export function NotFoundComponent() {
  return (
    <main
      id="main-content"
      className="page-doc mx-auto min-h-[70vh] max-w-5xl px-5 pb-20 sm:px-8"
      tabIndex={-1}
    >
      {/* React hoists this into <head>, including when a failed loader skips its route head. */}
      <meta name="robots" content="noindex,nofollow" />
      <div className="grid items-center gap-8 border-y border-line py-9 md:grid-cols-[1fr_2fr] md:gap-12 md:py-16">
        <p
          className="chrome font-display text-7xl leading-none sm:text-9xl"
          aria-label="Fehler 404"
        >
          404
        </p>
        <div>
          <h1 className="heading-2 chrome">Seite nicht gefunden</h1>
          <p className="mt-5 max-w-xl text-muted leading-relaxed">
            Unter dieser Adresse wurde keine Seite gefunden. Prüfe die Adresse oder nutze die Links
            zur Startseite, zu den Preisen und zum Kontakt.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/" className={ctaPrimary}>
              Startseite
            </Link>
            <Link to="/preise" className={ctaGhost}>
              Preise
            </Link>
            <Link to="/" hash="buchung" hashScrollIntoView={BOOKING_JUMP} className={ctaGhost}>
              Termin anfragen
            </Link>
            <Link to="/kontakt" className={ctaGhost}>
              Kontakt
            </Link>
            <a href={site.whatsapp} className={ctaGhost} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
