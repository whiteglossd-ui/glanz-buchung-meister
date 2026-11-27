import { createFileRoute, Link } from "@tanstack/react-router";
import { PhotoInquiry } from "@/components/photo-inquiry";
import { IconMessage, IconPhone } from "@/components/icons";
import { PageHero } from "@/components/page-hero";
import { WhatsAppPhotoCta } from "@/components/whatsapp-photo-cta";
import { WorkshopMap } from "@/components/workshop-map";
import { ctaGhost, ctaPrimary } from "@/components/ui";
import { openingHours, site } from "@/data/site";
import { pageHead } from "@/lib/seo";
import { contactPageJsonLd } from "@/lib/page-schema";
import { serializeJsonLd } from "@/lib/json-ld";

export const Route = createFileRoute("/kontakt")({
  component: KontaktPage,
  head: () =>
    pageHead({
      title: `Kontakt & Anfahrt in Horb am Neckar | ${site.name}`,
      description: `White-Gloss Detailing in ${site.city}: Telefon, WhatsApp, E-Mail und Anschrift. Werkstatt ${site.street}.`,
      path: "/kontakt",
      preloadShot: "atelier",
    }),
});

function KontaktPage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(contactPageJsonLd()) }}
      />
      <PageHero
        shot="atelier"
        alt={`Werkstatt von White-Gloss Detailing in ${site.city}`}
        kicker={`Werkstatt ${site.city}`}
        title="Kontakt & Anfahrt nach Horb am Neckar"
        lead="Du erreichst uns telefonisch, per E-Mail oder WhatsApp und in unserer Werkstatt in Horb am Neckar."
        crumbs={[{ label: "Startseite", to: "/" }, { label: "Kontakt" }]}
        actions={
          <>
            <a href="#nachricht" className={ctaPrimary}>
              Nachricht schreiben
            </a>
            <Link to="/" hash="buchung" className={ctaGhost}>
              Termin anfragen
            </Link>
          </>
        }
      />
      <section aria-label="Kontakt zur Werkstatt" className="wrap">
        <div className="grid items-start gap-9 py-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-14 md:py-20">
          <dl className="divide-y divide-line border-y border-line">
            <div className="py-5">
              <dt className="kicker">Telefon</dt>
              <dd className="mt-4">
                <a
                  href={site.phoneHref}
                  className="inline-flex min-h-11 max-w-full items-center break-all font-display text-2xl tracking-tight hover:underline sm:text-3xl"
                >
                  {site.phoneDisplay}
                </a>
                <p className="mt-2 text-sm text-muted">{site.hoursLabel}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={site.whatsapp}
                    className={ctaGhost}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconMessage className="size-4" />
                    WhatsApp
                  </a>
                  <a href={site.phoneHref} className={ctaGhost}>
                    <IconPhone className="size-4" />
                    Anrufen
                  </a>
                </div>
              </dd>
            </div>
            <div className="py-5">
              <dt className="kicker">E-Mail</dt>
              <dd className="mt-4">
                <a
                  href={`mailto:${site.email}`}
                  className="inline-flex min-h-11 max-w-full items-center break-all font-display text-2xl tracking-tight hover:underline sm:text-3xl"
                >
                  {site.email}
                </a>
                <p className="mt-2 text-sm text-muted">Antwort in der Regel am selben Werktag.</p>
              </dd>
            </div>
            <div className="py-5">
              <dt className="kicker">Anschrift</dt>
              <dd className="mt-4 font-display text-3xl tracking-tight">
                {site.street}
                <span className="mt-1 block text-lg text-muted">
                  {site.postalCode} {site.city}
                </span>
              </dd>
            </div>
            <div className="py-5">
              <dt className="kicker">Öffnungszeiten</dt>
              <dd className="mt-3 text-muted">
                Geöffnet {openingHours.daysLabel}, {openingHours.opens}–{openingHours.closes} Uhr.
                Samstag und Sonntag geschlossen.
              </dd>
            </div>
          </dl>
          <div id="nachricht" className="min-w-0 scroll-mt-28">
            <PhotoInquiry
              contact
              title="Nachricht an die Werkstatt"
              hint="Was möchtest du zur Aufbereitung deines Fahrzeugs wissen?"
            />
          </div>
        </div>
        <WhatsAppPhotoCta className="mt-12" />
        <WorkshopMap className="mt-12 mb-16" />
      </section>
    </main>
  );
}
