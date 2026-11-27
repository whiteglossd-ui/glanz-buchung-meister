import { createFileRoute, Link } from "@tanstack/react-router";
import { PhotoInquiry } from "@/components/photo-inquiry";
import { PageHero } from "@/components/page-hero";
import { ctaGhost, ctaPrimary } from "@/components/ui";
import { parseBookingSelection } from "@/lib/booking-selection";
import { cities, services, site } from "@/data/site";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/fahrzeug-zustand")({
  validateSearch: parseBookingSelection,
  component: ZustandPage,
  head: () =>
    pageHead({
      title: `Fahrzeugzustand prüfen lassen | ${site.name}`,
      description:
        "Fahrzeugzustand beschreiben und ehrlich erfahren, welche Aufbereitung sinnvoll ist. Kostenlos und unverbindlich. Horb am Neckar.",
      path: "/fahrzeug-zustand",
      preloadShot: "atelier",
    }),
});

function ZustandPage() {
  const { leistung, ort } = Route.useSearch();
  const service = services.find((s) => s.slug === leistung);
  const city = cities.find((c) => c.slug === ort);
  const context = [service?.nav, city ? `Abholung aus ${city.name}` : undefined]
    .filter(Boolean)
    .join(" · ");
  return (
    <main id="main-content" tabIndex={-1}>
      <PageHero
        shot="atelier"
        alt="Werkstatt von White-Gloss Detailing in Horb am Neckar"
        kicker="Ersteinschätzung"
        title="Fahrzeugzustand prüfen lassen"
        lead="Wir geben dir eine kostenlose, unverbindliche Ersteinschätzung. Beschreib uns dein Fahrzeug. Fotos kannst du anschließend im geschützten Kundenbereich ergänzen."
        crumbs={[{ label: "Startseite", to: "/" }, { label: "Zustand prüfen" }]}
        actions={
          <>
            <a href="#buchung" className={ctaPrimary}>
              Zustand beschreiben
            </a>
            <Link to="/" hash="buchung" className={ctaGhost}>
              Termin anfragen
            </Link>
          </>
        }
      />
      <div className="wrap">
        <div className="grid items-start gap-9 py-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-14 md:py-20">
          <aside className="border-t border-line pt-5" aria-labelledby="foto-heading">
            <h2 id="foto-heading" className="font-display text-3xl">
              Fotos für die Begutachtung
            </h2>
            <p className="mt-4 text-muted">
              Für spätere Fotos im Kundenbereich sind diese Ansichten hilfreich:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-muted">
              <li>Das ganze Fahrzeug von schräg vorn und schräg hinten</li>
              <li>Nahaufnahmen von Kratzern, matten Stellen oder Flecken</li>
              <li>Innenraum: Sitze, Fußräume, Armaturenbrett</li>
              <li>Am besten bei Tageslicht</li>
            </ul>
          </aside>
          <div id="buchung" className="min-w-0 scroll-mt-28">
            <PhotoInquiry
              title={context ? `${context} anfragen` : "Ersteinschätzung anfragen"}
              hint="Beschreib kurz den Zustand deines Fahrzeugs. Fotos ergänzt du später im Kundenbereich."
            />
          </div>
        </div>
      </div>
    </main>
  );
}
