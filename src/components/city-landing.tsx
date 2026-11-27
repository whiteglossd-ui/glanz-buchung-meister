import { serializeJsonLd } from "@/lib/json-ld";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { PageHero } from "@/components/page-hero";
import { ctaGhost, ctaPrimary } from "@/components/ui";
import { cityJsonLd, whatsappForCity } from "@/lib/city-seo";
import {
  packages,
  packageServiceSlug,
  pickupKeramikNote,
  cityPickupPriceText,
  services,
  site,
  type City,
} from "@/data/site";
import { money } from "@/lib/utils";
import { IconMessage } from "@/components/icons";
import { serviceAreaLink } from "@/lib/seo-policy";
import { cityJourneyText, citySeoCopy } from "@/lib/city-copy";
import { cityPlanningText, cityLogisticsFaq } from "@/lib/city-logistics";
import { serviceBookingSelection } from "@/lib/booking-selection";
import { localProofFor } from "@/lib/local-proof";
import { CityRegionalService } from "@/components/city-regional-service";
import { CityLocalProofSection } from "@/components/city-local-proof";
import { WebsiteStudioContent } from "@/components/website-studio-content";
import { studioHero, type PublishedStudioDocument } from "@/lib/studio-public";

export function CityLanding({ city, serviceSlug, editorial }: { city: City; serviceSlug?: string; editorial?: PublishedStudioDocument | null }) {
  const regional = city.slug === "lossburg" || city.slug === "freudenstadt";
  const jsonLd = cityJsonLd(city);
  const wa = whatsappForCity(city.name);
  const pickup = cityPickupPriceText(city);
  const copy = citySeoCopy(city);
  const logisticsFaq = cityLogisticsFaq(city);
  const request = serviceBookingSelection(serviceSlug || "fahrzeugaufbereitung", city.slug);
  const selectedService = services.find((s) => s.slug === serviceSlug && !s.pendingApproval);
  const proof = localProofFor(city.slug);
  const hero = studioHero(editorial);

  useEffect(() => {
    document.body.dataset.cityWa = "1";
    return () => {
      delete document.body.dataset.cityWa;
    };
  }, []);

  return (
    <main id="main-content" className="pb-28 lg:pb-0" tabIndex={-1}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <PageHero
        shot="hero"
        alt={hero?.alt ?? `Werkstattfahrzeug von White-Gloss Detailing – Fahrzeugaufbereitung für Kunden aus ${city.name}`}
        media={hero ? <img src={hero.src} alt={hero.alt} width={hero.width} height={hero.height} loading="eager" fetchPriority="high" decoding="async" className="size-full object-cover" /> : undefined}
        crumbs={[
          { label: "Startseite", to: "/" },
          { label: "Hol- und Bringservice", to: "/abholservice" },
          { label: city.name },
        ]}
        kicker="Mit Hol- und Bringservice"
        title={editorial?.content.title.trim() || copy.heading}
        lead={`${editorial?.content.lead.trim() || city.blurb}${regional ? "" : ` Innenraumreinigung, Lackpflege oder Keramikversiegelung machen wir in unserer Werkstatt in ${site.city}. Hol- und Bringservice: ${pickup}.`}`}
        actions={<>
          <Link to={request.leistung ? "/fahrzeug-zustand" : "/"} hash="buchung" search={request} className={ctaPrimary}>
            Termin anfragen
          </Link>
          <a href={wa} className={ctaGhost} target="_blank" rel="noopener noreferrer">
            <IconMessage className="size-4" aria-hidden />
            Beratung per WhatsApp
          </a>
        </>}
      >
        {selectedService && (
          <p className="mt-4 text-sm text-muted">
            Deine Auswahl: {selectedService.nav}. Die Leistung ist für deine Anfrage vorgemerkt.
          </p>
        )}
        {!regional && <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-5 text-sm text-muted">
          <li>Preise inkl. MwSt.</li>
          <li>Hol- und Bringservice {pickup}</li>
          <li>Werkstatt {site.city}</li>
        </ul>}
      </PageHero>

      {editorial && (editorial.content.sections.length > 0 || editorial.content.faqs.length > 0 || editorial.content.images.some((image) => image.assetId !== editorial.content.heroAssetId)) && (
        <section className="section mx-auto max-w-7xl px-4 sm:px-6" aria-label={`Weitere Informationen für ${city.name}`}>
          <WebsiteStudioContent content={editorial.content} assets={editorial.assets} headingLevel={1} showIntro={false} showHero={false} showBody={false} />
        </section>
      )}

      {proof ? <CityLocalProofSection city={city} proof={proof} /> : null}

      {regional ? <CityRegionalService city={city} body={editorial?.content.body.trim()} faqs={proof?.faqs} /> : <>
      <section className="cv-auto border-t border-line bg-surface">
        <div className="section mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="heading-2">Pakete für {city.name}</h2>
          <p className="mt-4 max-w-xl text-muted">
            {city.slug === "horb-am-neckar"
              ? "Unsere drei Aufbereitungspakete am Standort Horb."
              : "Dieselben drei Pakete wie in Horb."}{" "}
            Abholung {pickup}. {pickupKeramikNote()}
          </p>
          <ol className="mt-12 divide-y divide-line border-y border-line">
            {packages.map((p, i) => (
              <li key={p.id} className="gd-pack py-8">
                <p className="ga-num font-display text-3xl text-subtle tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <div className="ga-pack-copy">
                  <h3 className="heading-3 mt-2">{p.name}</h3>
                  <p className="mt-2 max-w-lg text-sm text-muted">{p.kicker}</p>
                </div>
                <p className="ga-price flex flex-col items-end gap-2">
                  <span className="font-display text-3xl tabular-nums">
                    ab {money(p.price)}&nbsp;€
                  </span>
                  <span className="block text-xs text-subtle">{site.vatNote}</span>
                  <Link
                    {...serviceAreaLink(packageServiceSlug[p.id], city.slug)}
                    className="mt-3 inline-flex min-h-11 items-center text-sm text-fg hover:underline"
                  >
                    Paketdetails für {city.name}
                  </Link>
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="cv-auto border-t border-line">
        <div className="section mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="heading-2">
            {city.km === 0 ? "Direkt am Standort Horb" : `Abholung in ${city.name}: Strecke und Übergabe`}
          </h2>
          <p className="mt-5 max-w-2xl text-muted leading-relaxed">
            {editorial?.content.body.trim() || cityPlanningText(city)}
          </p>
          <p className="mt-4 max-w-2xl text-muted">
            Unser einziger Werkstattstandort ist {site.street}, {site.postalCode} {site.city}.{" "}
            {city.slug === "horb-am-neckar"
              ? "Die direkte Fahrzeugabgabe ist nach Terminvereinbarung möglich."
              : `${city.name} ist ein Abholgebiet, keine weitere Niederlassung.`}
          </p>
          <p className="mt-5 max-w-2xl text-muted leading-relaxed">
            {city.km === 0
              ? "Am Standort entfällt die Anfahrt."
              : `${cityJourneyText(city).replace(/Min\.$/, "Minuten")}.`}{" "}
            Entfernungen und Fahrzeiten sind Richtwerte.
            Für Politur und Keramik nutzen wir gleichmäßiges Licht und sauberes Wasser in der Werkstatt.
            {city.pickupFlat !== undefined
              ? ` Mit White-Gloss Classic oder White-Gloss Signature gilt in ${city.name} ein Festpreis von ${pickup}.`
              : null}{" "}
            <Link to="/abholservice" className="underline">
              Abholorte und Konditionen im Überblick
            </Link>
            .
          </p>
          <dl className="mt-10 grid gap-4 sm:grid-cols-3">
            {city.km === 0 ? (
              <div className="border border-line p-5">
                <dt className="text-xs uppercase tracking-[0.16em] text-subtle">Standort</dt>
                <dd className="mt-2 font-display text-3xl">Horb am Neckar</dd>
              </div>
            ) : (
              <>
                <div className="border border-line p-5">
                  <dt className="text-xs uppercase tracking-[0.16em] text-subtle">Entfernung</dt>
                  <dd className="mt-2 font-display text-3xl">{city.km === null ? "Nach Adresse" : `ca. ${city.km} km`}</dd>
                </div>
                <div className="border border-line p-5">
                  <dt className="text-xs uppercase tracking-[0.16em] text-subtle">Fahrzeit</dt>
                  <dd className="mt-2 font-display text-3xl">{city.minutes === null ? "Nach Absprache" : `ca. ${city.minutes} Min.`}</dd>
                </div>
              </>
            )}
            {city.km === 0 ? (
              <div className="border border-line p-5">
                <dt className="text-xs uppercase tracking-[0.16em] text-subtle">Abgabe</dt>
                <dd className="mt-2 font-display text-3xl">Direkt vor Ort</dd>
              </div>
            ) : null}
            <div className="border border-line p-5">
              <dt className="text-xs uppercase tracking-[0.16em] text-subtle">Abholung</dt>
              <dd className="mt-2 font-display text-3xl">{pickup}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="cv-auto border-t border-line">
        <div className="section mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="heading-2">Leistungen mit Abholung in {city.name}</h2>
          <ul className="mt-8 columns-1 gap-x-10 sm:columns-2">
            {services
              .filter((s) => !s.pendingApproval)
              .map((s) => (
                <li key={s.slug} className="break-inside-avoid">
                  <Link
                    {...serviceAreaLink(s.slug, city.slug)}
                    className="flex min-h-11 items-center text-sm text-muted hover:text-fg"
                  >
                    {s.nav} – Leistungsumfang
                  </Link>
                </li>
              ))}
          </ul>
          <div className="mt-12 flex flex-wrap gap-3">
            <Link
              to={request.leistung ? "/fahrzeug-zustand" : "/"}
              hash="buchung"
              search={request}
              className={ctaPrimary}
            >
              Termin anfragen
            </Link>
            <Link to="/abholservice" className={ctaGhost}>
              Alle Abholorte
            </Link>
            <Link to="/galerie" className={ctaGhost}>
              Ergebnisse ansehen
            </Link>
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
            Nenne bei der Anfrage deine Übergabeadresse in {city.name}, den Fahrzeugzustand und
            deinen Wunschtermin. Abholung, Preis und Rückgabezeit stimmen wir vor dem Termin mit dir ab.
          </p>
        </div>
      </section>

      {(logisticsFaq || proof?.faqs?.length) && (
        <section className="cv-auto border-t border-line bg-surface">
          <div className="section mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="heading-2">Fragen zur Abholung in {city.name}</h2>
            <dl className="mt-8 max-w-3xl space-y-8">
              {logisticsFaq ? (
                <div>
                  <dt className="heading-3">{logisticsFaq.question}</dt>
                  <dd className="mt-3 text-muted">{logisticsFaq.answer}</dd>
                </div>
              ) : null}
              {proof?.faqs?.map((faq) => (
                <div key={faq.question}>
                  <dt className="heading-3">{faq.question}</dt>
                  <dd className="mt-3 text-muted">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}
      </>}

      <a
        href={wa}
        className="city-wa-bar fixed inset-x-3 bottom-[max(0.65rem,env(safe-area-inset-bottom))] z-40 flex min-h-14 items-center justify-between gap-3 rounded-full border border-white/15 bg-elevated px-5 text-left shadow-[0_16px_40px_rgb(0_0_0_/_0.45)] lg:hidden"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span>
          <span className="block text-sm font-medium text-fg">Preisschätzung per WhatsApp</span>
          <span className="block text-xs text-subtle">Anliegen kurz beschreiben</span>
        </span>
        <IconMessage className="size-5 shrink-0" aria-hidden />
      </a>
    </main>
  );
}

