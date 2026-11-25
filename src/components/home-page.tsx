import { serializeJsonLd } from "@/lib/json-ld";
import { Link } from "@tanstack/react-router";
import { IconArrowRight } from "@/components/icons";
import { LazyGoogleReviews } from "@/components/lazy-google-reviews";
import { HomeBooking } from "@/components/home-booking";
import {
  cities,
  pickupKeramikNote,
  cityPickupPriceText,
  pickupTierSummary,
  services,
  site,
} from "@/data/site";
import { cityDistanceLine, pickupDistanceLabel, pickupStatus } from "@/lib/city-copy";
import { localBusinessJsonLd } from "@/lib/seo";
import { homeCopy, homeText } from "@/data/home-copy";
import { ScrollFilmHero } from "@/components/scroll-film-hero";
import { HomePolish } from "@/components/home-polish";
import { HomeProgressNav } from "@/components/home-progress-nav";
import { MobileInquiryDock } from "@/components/mobile-inquiry-dock";
import { PackageShowcase } from "@/components/package-showcase";
import { ResultsTeaser } from "@/components/results-teaser";
import { HomeProcess } from "@/components/home-process";
import { RevealLines } from "@/components/reveal-lines";
import { WebsiteStudioContent } from "@/components/website-studio-content";
import { studioHero, type PublishedStudioDocument } from "@/lib/studio-public";
import type { PackageId } from "@/data/site";
import { lossburgHome } from "@/data/home-location";
import "@/styles/home-intro.css";

export function HomePage({
  location = "horb",
  document,
  aboutPublished = false,
  initialPackage,
  initialCity,
}: {
  location?: "horb" | "lossburg";
  document?: PublishedStudioDocument | null;
  aboutPublished?: boolean;
  initialPackage?: PackageId;
  initialCity?: string;
}) {
  const regional = location === "lossburg";
  const serviceArea = regional
    ? "Loßburg, Freudenstadt und Nordschwarzwald"
    : "Horb am Neckar und Umgebung";
  const jsonLd = localBusinessJsonLd();

  return (
    <main id="main-content" tabIndex={-1} data-home="polish">
      <HomePolish key={location} />
      <HomeProgressNav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <ScrollFilmHero
        title={
          regional ? homeCopy.title : homeText("title", document?.content.title.trim() || undefined)
        }
        lead={
          regional
            ? lossburgHome.lead
            : homeText("lead", document?.content.lead.trim() || undefined)
        }
        locationLabel={regional ? lossburgHome.locationLabel : "Horb am Neckar"}
        heroImage={studioHero(document)}
      />

      <nav id="nach-dem-film" className="home-location-switch" aria-label="Standort wählen">
        <span>Dein Standort</span>
        <Link to="/" aria-current={location === "horb" ? "page" : undefined}>
          Horb am Neckar
        </Link>
        <Link to="/freudenstadt-lossburg" aria-current={regional ? "page" : undefined}>
          Loßburg / Freudenstadt <small>Werkstatt in Vorbereitung</small>
        </Link>
      </nav>

      {document &&
        (Boolean(
          document.content.body.trim() && homeText("body", document.content.body) !== homeCopy.body,
        ) ||
          document.content.sections.length > 0 ||
          document.content.faqs.length > 0 ||
          document.content.images.some(
            (image) => image.assetId !== document.content.heroAssetId,
          )) && (
          <section
            className="section mx-auto max-w-7xl px-4 sm:px-6"
            aria-label="Aus unserer Werkstatt"
          >
            <WebsiteStudioContent
              content={document.content}
              assets={document.assets}
              headingLevel={1}
              showIntro={false}
              showHero={false}
              showBody={
                document.content.body.trim() !== homeCopy.body &&
                homeText("body", document.content.body) !== homeCopy.body
              }
            />
          </section>
        )}
      <PackageShowcase />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <ResultsTeaser />
        <LazyGoogleReviews id="bewertungen" compact />
      </div>

      <HomeProcess serviceArea={serviceArea} />

      <section
        className="home-directory mx-auto max-w-7xl px-4 sm:px-6"
        aria-labelledby="fahrzeugaufbereitung-heading"
      >
        <header>
          <span className="home-ambient-type" aria-hidden="true" data-parallax-type>
            Detailing
          </span>
          <h2 id="fahrzeugaufbereitung-heading" className="heading-2 mt-4" data-scroll-title>
            {regional
              ? "Fahrzeugaufbereitung für Loßburg und Freudenstadt"
              : `Fahrzeugaufbereitung in ${site.city}`}
          </h2>
          <p>
            Autopflege passend zu deinem Fahrzeug: von der Innenraumreinigung über Lackaufbereitung
            und Keramikversiegelung bis zur Dellenentfernung mit unserem Partnerbetrieb. Vor jeder
            Politur prüfen wir den Lack mit einer Lackdickenmessung.
          </p>
        </header>
        <nav aria-label="Leistungen">
          <ul className="home-directory-links">
            {services.map((s) => (
              <li key={s.slug}>
                <Link to="/leistungen/$slug" params={{ slug: s.slug }}>
                  {s.nav}
                  <IconArrowRight aria-hidden />
                </Link>
              </li>
            ))}
            <li>
              <Link to="/dellen-hagelschaden">
                Dellen- und Hagelschäden <IconArrowRight aria-hidden />
              </Link>
            </li>
            <li>
              <Link to="/luxusfahrzeuge">
                Luxusfahrzeuge <IconArrowRight aria-hidden />
              </Link>
            </li>
            <li>
              <Link to="/b2b">
                Firmen, Flotten und Autohäuser <IconArrowRight aria-hidden />
              </Link>
            </li>
            <li>
              <Link to="/ratgeber">
                Ratgeber
                <IconArrowRight aria-hidden />
              </Link>
            </li>
          </ul>
        </nav>
      </section>
      <section id="standorte" className="home-location" aria-labelledby="standort-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div>
            <h2 id="standort-heading" className="heading-2 mt-4" data-lines>
              <RevealLines lines={[regional ? "Dein Weg zu uns." : `Werkstatt in ${site.city}`]} />
            </h2>
            <p>
              {site.street}, {site.postalCode} {site.city}
              <br />
              {site.hoursLabel}
            </p>
            <Link to="/kontakt" className="atelier-text-link">
              Kontakt &amp; Anfahrt <IconArrowRight aria-hidden />
            </Link>
            <h3>Neue Werkstatt in Loßburg bei Freudenstadt</h3>
            <p>
              Die Werkstatt in Loßburg ist in Vorbereitung. Bis zur Eröffnung bereiten wir dein Auto
              in Horb am Neckar auf. Unser Hol- und Bringservice verbindet dich schon jetzt mit uns
              – in Loßburg, Freudenstadt und im Landkreis Freudenstadt / Nordschwarzwald. Abholort
              und Konditionen stimmen wir vor deinem Termin mit dir ab.
            </p>
            <nav className="workshop-links" aria-label="Werkstatt und Einzugsgebiet">
              <Link to={regional ? "/" : "/freudenstadt-lossburg"} className="atelier-text-link">
                {regional ? "Standort Horb am Neckar" : "Standort Loßburg / Freudenstadt"}{" "}
                <IconArrowRight aria-hidden />
              </Link>
              {aboutPublished && (
                <Link to="/ueber-uns" className="atelier-text-link">
                  Über White-Gloss
                </Link>
              )}
              <Link
                to="/abholservice/$city"
                params={{ city: "lossburg" }}
                className="atelier-text-link"
              >
                Loßburg <IconArrowRight aria-hidden />
              </Link>
              <Link
                to="/abholservice/$city"
                params={{ city: "freudenstadt" }}
                className="atelier-text-link"
              >
                Freudenstadt <IconArrowRight aria-hidden />
              </Link>
            </nav>
          </div>
          <div>
            <h3>Was kostet die Abholung bei dir?</h3>
            <p>
              {pickupTierSummary()}. {pickupKeramikNote()}. Alle Beträge {site.vatNote}
            </p>
            {/* Chips: Name, Entfernung, Abholpreis. Der zugängliche Name beginnt mit dem
                sichtbaren Ortsnamen (WCAG 2.5.3) und nennt die Plaketten ausgeschrieben. */}
            <ul className="home-city-links city-chips" aria-label="Abholorte">
              {cities.map((c) => (
                <li key={c.slug}>
                  <Link
                    to="/abholservice/$city"
                    params={{ city: c.slug }}
                    className="city-chip"
                    aria-label={
                      c.km === 0
                        ? `${c.name}, Werkstattstandort, direkte Fahrzeugabgabe möglich, Abholung ${cityPickupPriceText(c)}`
                        : `${c.name}, ${cityDistanceLine(c)}, Abholung ${cityPickupPriceText(c)}`
                    }
                  >
                    <span className="city-chip-name">{c.name}</span>
                    <span className="city-chip-meta" aria-hidden="true">
                      <span>{pickupDistanceLabel(c)}</span>
                      <span className="city-chip-status" data-status={pickupStatus(c.km)}>
                        {cityPickupPriceText(c)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="/abholservice" className="atelier-text-link">
              Abholorte & Konditionen <IconArrowRight aria-hidden />
            </Link>
          </div>
        </div>
      </section>
      <HomeBooking
        initialPackage={initialPackage}
        initialCity={initialCity ?? (regional ? "lossburg" : undefined)}
        serviceArea={serviceArea}
      />
      <MobileInquiryDock />
    </main>
  );
}
