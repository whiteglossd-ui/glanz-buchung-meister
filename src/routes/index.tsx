import { serializeJsonLd } from "@/lib/json-ld";
import { createFileRoute, Link } from "@tanstack/react-router";
import { IconArrowRight } from "@/components/icons";
import { LazyGoogleReviews } from "@/components/lazy-google-reviews";
import { HomeBooking } from "@/components/home-booking";
import { Shot } from "@/components/media";
import {
  cities,
  pickupKeramikNote,
  cityPickupPriceText,
  pickupTierSummary,
  services,
  site,
} from "@/data/site";
import { cityDistanceLine, pickupDistanceLabel, pickupStatus } from "@/lib/city-copy";
import { localBusinessJsonLd, pageHead } from "@/lib/seo";
import { parseBookingSelection } from "@/lib/booking-selection";
import { scrollFilmPreloads } from "@/data/scroll-film";
import { homeText } from "@/data/home-copy";
import { ScrollFilmHero } from "@/components/scroll-film-hero";
import { HomePolish } from "@/components/home-polish";
import { PackageShowcase } from "@/components/package-showcase";
import { ResultsTeaser } from "@/components/results-teaser";
import { HomeProcess } from "@/components/home-process";
import { RevealLines } from "@/components/reveal-lines";
import { WebsiteStudioContent } from "@/components/website-studio-content";
import { loadPublicStudioDocument } from "@/lib/studio-public.functions";
import { studioHero, studioMetadata } from "@/lib/studio-public";
import "@/styles/home-intro.css";

export const Route = createFileRoute("/")({
  validateSearch: parseBookingSelection,
  component: Home,
  loader: async () => {
    const [document, about] = await Promise.all([
      loadPublicStudioDocument("home"),
      loadPublicStudioDocument("about"),
    ]);
    return { document, aboutPublished: Boolean(about) };
  },
  head: ({ loaderData }) => {
    const hero = studioHero(loaderData?.document);
    const head = pageHead({
      ...studioMetadata(loaderData?.document, {
        title: `Fahrzeugaufbereitung in ${site.city} | ${site.legalName}`,
        description: `Fahrzeugaufbereitung in Horb am Neckar: Innenraumreinigung, Lackkorrektur und Keramikversiegelung. Hol- und Bringservice für ${cities.length} Abholorte.`,
      }),
      path: "/",
      ...(hero ? { preloadImage: hero.src, image: hero.src } : {}),
    });
    return { ...head, links: [...head.links, ...(hero ? [] : scrollFilmPreloads)] };
  },
});

function Home() {
  const jsonLd = localBusinessJsonLd();
  const { paket, ort } = Route.useSearch();
  const { document, aboutPublished } = Route.useLoaderData();

  return (
    <main id="main-content" tabIndex={-1} data-home="polish">
      <HomePolish />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <ScrollFilmHero
        title={homeText("title", document?.content.title.trim() || undefined)}
        lead={homeText("lead", document?.content.lead.trim() || undefined)}
        heroImage={studioHero(document)}
      />

      <section
        id="nach-dem-film"
        className="film-chapter workshop-personal"
        aria-labelledby="workshop-title"
      >
        <div className="film-chapter-media" data-parallax-frame>
          <Shot
            name="atelier"
            alt="Aufbereitetes Kundenfahrzeug vor der Werkstatt von White-Gloss Detailing in Horb am Neckar"
            className="size-full"
            sizes="100vw"
            framed={false}
          />
        </div>
        <div className="film-chapter-veil" />
        <div className="film-chapter-copy" data-reveal>
          <p className="kicker">{site.owner} · Inhaber</p>
          <h2 id="workshop-title" className="heading-2 mt-5" data-lines>
            <RevealLines lines={["Dein Fahrzeug", "in guten Händen."]} />
          </h2>
          <p className="mt-6 max-w-xl whitespace-pre-line text-base leading-relaxed text-muted sm:text-lg">
            {homeText("body", document?.content.body.trim() || undefined)}
          </p>
          <p className="mt-4 max-w-xl leading-relaxed text-muted">
            Dich stört eine Delle, eine zerkratzte Felge oder ein Brandloch im Sitz? Ich stimme die
            Reparatur mit meinem Partnerbetrieb für dich ab.
          </p>
          <div className="workshop-links">
            <a href="#rundum-anfrage" className="atelier-text-link">
              Aufbereitung mit Reparatur <IconArrowRight aria-hidden />
            </a>
            <a
              href={`${site.whatsappHref}&text=${encodeURIComponent("Hallo Lars, ich habe eine Frage zur Aufbereitung meines Autos.")}`}
              className="atelier-text-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Lars auf WhatsApp schreiben <IconArrowRight aria-hidden />
            </a>
            {aboutPublished && (
              <Link to="/ueber-uns" className="atelier-text-link">
                Über White-Gloss
              </Link>
            )}
          </div>
        </div>
      </section>

      {document &&
        (document.content.sections.length > 0 ||
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
              showBody={false}
            />
          </section>
        )}
      <PackageShowcase />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <ResultsTeaser />
        <LazyGoogleReviews id="bewertungen" compact />
      </div>

      <HomeProcess />

      <HomeBooking initialPackage={paket} initialCity={ort} />

      <section
        className="home-directory mx-auto max-w-7xl px-4 sm:px-6"
        aria-labelledby="fahrzeugaufbereitung-heading"
      >
        <header>
          <h2 id="fahrzeugaufbereitung-heading" className="heading-2 mt-4" data-scroll-title>
            Fahrzeugaufbereitung in {site.city}
          </h2>
          <p>
            Vor der Politur prüfe ich den Lack mit einer Lackdickenmessung. Hier findest du die
            passende Pflege für Lack, Innenraum und Felgen.
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
      <section className="home-location" aria-labelledby="standort-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div>
            <h2 id="standort-heading" className="heading-2 mt-4" data-lines>
              <RevealLines lines={[`Werkstatt in ${site.city}`]} />
            </h2>
            <p>
              {site.street}, {site.postalCode} {site.city}
              <br />
              {site.hoursLabel}
            </p>
            <Link to="/kontakt" className="atelier-text-link">
              Kontakt &amp; Anfahrt <IconArrowRight aria-hidden />
            </Link>
            <h3>Demnächst in Loßburg</h3>
            <p>
              Bis zur Eröffnung meiner neuen Werkstatt in Loßburg bereite ich dein Auto in Horb auf.
            </p>
            <nav className="workshop-links" aria-label="Loßburg und Freudenstadt">
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
    </main>
  );
}
