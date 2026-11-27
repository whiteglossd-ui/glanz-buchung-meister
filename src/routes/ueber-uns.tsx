import { BOOKING_JUMP } from "@/lib/booking-anchor-focus";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { WebsiteStudioContent } from "@/components/website-studio-content";
import { ctaGhost, ctaPrimary } from "@/components/ui";
import { googleProfile } from "@/data/google-profile";
import { site } from "@/data/site";
import { serializeJsonLd } from "@/lib/json-ld";
import { pageHead } from "@/lib/seo";
import { loadPublicStudioDocument } from "@/lib/studio-public.functions";
import { studioHero, studioMetadata } from "@/lib/studio-public";

export const Route = createFileRoute("/ueber-uns")({
  loader: async () => {
    const document = await loadPublicStudioDocument("about");
    if (!document) throw notFound();
    return document;
  },
  head: ({ loaderData }) => {
    const hero = studioHero(loaderData);
    return pageHead({
      ...studioMetadata(loaderData, {
        title: `${loaderData?.content.title || "Über uns"} | ${site.name}`,
        description:
          loaderData?.content.lead || `${site.owner} · Fahrzeugaufbereitung in ${site.city}.`,
      }),
      path: "/ueber-uns",
      ...(!loaderData ? { robots: "noindex,nofollow" } : {}),
      ...(hero ? { preloadImage: hero.src, image: hero.src } : { preloadShot: "atelier" as const }),
    });
  },
  component: AboutPage,
});

function AboutPage() {
  const document = Route.useLoaderData();
  const hero = studioHero(document);
  return (
    <main id="main-content" tabIndex={-1}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "@id": `${site.origin}/ueber-uns#webpage`,
            url: `${site.origin}/ueber-uns`,
            name: document.content.title,
            about: { "@id": `${site.origin}/#betrieb` },
          }),
        }}
      />
      <PageHero
        title={document.content.title}
        lead={document.content.lead}
        kicker="White-Gloss Detailing"
        shot={hero ? undefined : "atelier"}
        alt={
          hero?.alt ??
          "Aufbereitetes Kundenfahrzeug vor der Werkstatt von White-Gloss Detailing in Horb am Neckar"
        }
        media={
          hero ? (
            <img
              src={hero.src}
              alt={hero.alt}
              width={hero.width}
              height={hero.height}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="size-full object-cover"
            />
          ) : undefined
        }
        crumbs={[{ label: "Startseite", to: "/" }, { label: "Über uns" }]}
        actions={
          <>
            <Link to="/" hash="buchung" hashScrollIntoView={BOOKING_JUMP} className={ctaPrimary}>
              Termin anfragen
            </Link>
            <Link to="/kontakt" className={ctaGhost}>
              Kontakt aufnehmen
            </Link>
          </>
        }
      />
      <section className="wrap" aria-label="Über White-Gloss">
        <div className="grid items-start gap-10 py-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-16 lg:py-20">
          <WebsiteStudioContent
            content={document.content}
            assets={document.assets}
            headingLevel={1}
            showIntro={false}
            showHero={false}
          />
          <aside className="min-w-0 border-y border-line py-6" aria-labelledby="betrieb-heading">
            <p className="kicker">Inhaber</p>
            <h2 id="betrieb-heading" className="mt-3 font-display text-3xl">
              {site.owner}
            </h2>
            <p className="mt-3 text-muted">
              {site.legalName}
              <br />
              {site.street}
              <br />
              {site.postalCode} {site.city}
            </p>
            <a
              href={site.phoneHref}
              className="mt-2 inline-flex min-h-11 items-center underline underline-offset-4"
            >
              {site.phoneDisplay}
            </a>
            <h3 className="mt-6 border-t border-line pt-6 font-display text-2xl">
              Unsere Arbeitsweise
            </h3>
            <p className="mt-3 text-muted">So viel wie nötig. So schonend wie möglich.</p>
            <Link
              to="/qualitaet"
              className="inline-flex min-h-11 items-center underline underline-offset-4"
            >
              Ablauf der Aufbereitung
            </Link>
            <h3 className="mt-6 border-t border-line pt-6 font-display text-2xl">
              Partnerbetriebe
            </h3>
            <p className="mt-3 text-muted">
              Für Dellenziehen, Hagelschäden und Lackierarbeiten arbeiten wir mit Meisterbetrieben
              zusammen.
            </p>
            <Link
              to="/dellen-druecken"
              className="inline-flex min-h-11 items-center underline underline-offset-4"
            >
              Dellen drücken und Hagelschäden
            </Link>
            <h3 className="mt-6 border-t border-line pt-6 font-display text-2xl">Kundenstimmen</h3>
            <a
              href={googleProfile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center underline underline-offset-4"
            >
              Bewertungen auf Google lesen
            </a>
          </aside>
        </div>
      </section>
    </main>
  );
}
