import { BOOKING_JUMP } from "@/lib/booking-anchor-focus";
import { createFileRoute, Link } from "@tanstack/react-router";
import { IconArrowRight } from "@/components/icons";
import { PageHero } from "@/components/page-hero";
import { ctaPrimary } from "@/components/ui";
import { cities, cityPickupPriceText, pickupTierSummary, pickupKeramikNote, site } from "@/data/site";
import { pageHead } from "@/lib/seo";
import { pickupServiceJsonLd } from "@/lib/page-schema";
import { serializeJsonLd } from "@/lib/json-ld";
import { cityDistanceLine, citySeoCopy } from "@/lib/city-copy";

export const Route = createFileRoute("/abholservice/")({
  component: AbholIndex,
  head: () =>
    pageHead({
      title: `Autoaufbereitung mit Hol- und Bringservice | ${site.name}`,
      description: `Wir holen dein Fahrzeug in ${cities.length} Orten ab und bringen es nach der Aufbereitung in Horb zurück. Abholorte, Kosten und Terminablauf im Überblick.`,
      path: "/abholservice",
      preloadShot: "atelier",
    }),
});

function AbholIndex() {
  return (
    <main id="main-content" tabIndex={-1}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pickupServiceJsonLd()) }}
      />
      <PageHero
        shot="atelier"
        alt={`Werkstatt von White-Gloss Detailing in ${site.city}`}
        kicker={`${cities.length} Abholorte`}
        title="Hol- und Bringservice."
        lead="Spar dir die Fahrt zur Werkstatt: Wir stimmen Abholung und Rückgabe mit dir ab und bereiten dein Fahrzeug in Horb am Neckar auf."
        crumbs={[{ label: "Startseite", to: "/" }, { label: "Hol- und Bringservice" }]}
        actions={
          <Link to="/" hash="buchung" hashScrollIntoView={BOOKING_JUMP} className={ctaPrimary}>
            Termin anfragen
          </Link>
        }
      />
      <section className="section mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="heading-2">Abholorte und Kosten</h2>
        <p className="mt-5 mb-8 max-w-2xl text-muted">
          {pickupTierSummary()}. Alle Beträge {site.vatNote} {pickupKeramikNote()}. Entfernungen und
          Fahrzeiten sind Richtwerte ab Horb. Den genauen Abholort, Preis und die Übergabezeiten
          bestätigen wir persönlich.
        </p>
        <ul className="grid gap-x-10 md:grid-cols-2">
          {cities.map((c) => (
            <li key={c.slug} className="border-t border-line">
              <Link
                to="/abholservice/$city"
                params={{ city: c.slug }}
                aria-label={`${citySeoCopy(c).linkLabel}, ${cityDistanceLine(c)}, Abholung ${cityPickupPriceText(c)}`}
                className="group flex h-full min-h-20 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-5"
              >
                <span>
                  <span className="block font-display text-2xl tracking-tight">
                    {citySeoCopy(c).linkLabel}
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    {cityDistanceLine(c)}
                  </span>
                </span>
                <span className="inline-flex items-center gap-3 text-sm text-fg">{cityPickupPriceText(c)} <IconArrowRight className="link-arrow size-4" aria-hidden="true" /></span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
