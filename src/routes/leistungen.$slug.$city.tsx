import { BOOKING_JUMP } from "@/lib/booking-anchor-focus";
import { EditorialLayout } from "@/components/editorial-layout";
import { ServiceQuestions, ServiceSteps } from "@/components/service-sections";
import { serializeJsonLd } from "@/lib/json-ld";
import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { ctaPrimary } from "@/components/ui";
import { cities, packages, cityPickupFee, cityPickupPriceText, pickupKeramikNote, services, site } from "@/data/site";
import { serviceBookingSelection } from "@/lib/booking-selection";
import { serviceCityHeading, serviceCityTitle } from "@/lib/city-seo";
import { pageHead } from "@/lib/seo";
import { eur } from "@/lib/utils";
import { ServicePriceNote } from "@/components/service-price-note";
import { isConsolidatedService, localSeoEvidence, serviceCitySeo } from "@/lib/seo-policy";

export const Route = createFileRoute("/leistungen/$slug/$city")({
  loader: ({ params }) => {
    const service = services.find((s) => s.slug === params.slug);
    const city = cities.find((c) => c.slug === params.city);
    if (!service || !city) throw notFound();
    const seo = serviceCitySeo(service.slug, city.slug);
    if (seo.status === "redirect") throw redirect({ href: seo.target, statusCode: 301 });
    return { service, city };
  },
  head: ({ loaderData }) => {
    const service = loaderData?.service;
    const city = loaderData?.city;
    if (!service || !city) return {};
    return pageHead({
      title: serviceCityTitle(service.seoNav, city),
      description: service.pendingApproval ? service.description : `${service.seoNav} mit Hol- und Bringservice aus ${city.name}. Ausführung in der Werkstatt in Horb am Neckar. ${cityPickupPriceText(city)}.`,
      path: `/leistungen/${service.slug}/${city.slug}`,
    });
  },
  component: ServiceCityPage,
});

function ServiceCityPage() {
  const { service, city } = Route.useLoaderData();
  const request = serviceBookingSelection(service.slug, city.slug);
  const otherServices = services.filter((s) => s.slug !== service.slug && !s.pendingApproval && !isConsolidatedService(s.slug));
  const evidence = localSeoEvidence[`${service.slug}/${city.slug}`];
  const pickup = cityPickupPriceText(city);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": service.pendingApproval ? "WebPage" : "Service",
        "@id": `${site.origin}/leistungen/${service.slug}/${city.slug}#service`,
        name: `${service.seoNav} ${city.name}`,
        url: `${site.origin}/leistungen/${service.slug}/${city.slug}`,
        ...(!service.pendingApproval ? { provider: {
          "@type": "AutoRepair",
          "@id": `${site.origin}/#betrieb`,
          name: site.legalName,
          address: {
            "@type": "PostalAddress",
            streetAddress: site.street,
            postalCode: site.postalCode,
            addressLocality: site.city,
            addressCountry: "DE",
          },
        },
        areaServed: { "@type": "City", name: city.name } } : {}),
        description: service.description,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Startseite", item: site.origin },
          {
            "@type": "ListItem",
            position: 2,
            name: "Leistungen",
            item: `${site.origin}/leistungen`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: service.seoNav,
            item: `${site.origin}/leistungen/${service.slug}`,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: city.name,
            item: `${site.origin}/leistungen/${service.slug}/${city.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <main id="main-content" tabIndex={-1}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <PageHero
        src={service.image}
        alt={service.imageAlt}
        kicker={`${city.name} · ${city.km === null ? "Abholung nach Vereinbarung" : `${city.km} km`}`}
        title={serviceCityHeading(service.seoNav, city)}
        lead={service.teaser}
        crumbs={[
          { label: "Startseite", to: "/" },
          { label: "Leistungen", to: "/leistungen" },
          { label: service.nav, to: `/leistungen/${service.slug}` },
          { label: city.name },
        ]}
        actions={service.pendingApproval ? <Link to="/kontakt" className={ctaPrimary}>Rückfrage zur Zulässigkeit</Link> :
          <Link
            to={request.leistung ? "/fahrzeug-zustand" : "/"}
            hash="buchung" hashScrollIntoView={BOOKING_JUMP}
            search={request}
            className={ctaPrimary}
          >
            Abholung anfragen
          </Link>
        }
      />
      <EditorialLayout links={[
        ...(!service.pendingApproval ? [{ id: "abholung", label: "Anfahrt und Abholung" }] : []),
        { id: "umfang", label: "Leistungsumfang" },
        ...(!service.pendingApproval ? [{ id: "ablauf", label: "Ablauf" }, { id: "fragen", label: "Häufige Fragen" }] : []),
        { id: "leistungen", label: "Weitere Leistungen" },
      ]}>
        {service.pendingApproval ? (
          <p className="mb-8 rounded-card border border-line bg-surface p-4 text-sm">
            Diese Leistung bieten wir derzeit nicht an, auch nicht mit Hol- und Bringservice aus {city.name}. Für Fragen nutze bitte das Kontaktformular.
          </p>
        ) : (
          <>
        <section id="abholung" aria-label={`Anfahrt und Abholung aus ${city.name}`} className="mb-8 space-y-4">
          <h2 className="font-display text-2xl">{city.slug === "horb-am-neckar" ? "Direkt zur Werkstatt in Horb" : `Abholung aus ${city.name} planen`}</h2>
          <p className="text-muted">{city.pickupNote ?? `${city.blurb} Entfernungen und Fahrzeiten sind Richtwerte; die genaue Übergabeadresse stimmen wir vorab ab.`}</p>
          <p className="text-sm text-muted">{city.slug === "horb-am-neckar"
            ? `Du kannst das Fahrzeug nach Terminvereinbarung direkt zu ${site.street} bringen. Die Uhrzeit der Anfrage bezeichnet die Fahrzeugabgabe.`
            : cityPickupFee(city, "basis") === null
              ? `Für ${city.name} ist die Abholung bei White-Gloss Classic und White-Gloss Signature nur nach individueller Preisabsprache möglich. Der Rechner zeigt diese Zusatzkosten ausdrücklich als offen an.`
              : `Bei White-Gloss Classic und White-Gloss Signature beträgt der Hol- und Bringservice aus ${city.name} ${cityPickupPriceText(city)}. Für White-Gloss Ceramic ist die Abholung bis 60 km enthalten.`}</p>
          <p className="text-sm text-muted">Abholort, Übergabezeit und Rückgabe werden persönlich bestätigt. Aktuell bereite ich dein Fahrzeug in {site.city} auf.</p>
          <Link to="/abholservice/$city" params={{ city: city.slug }} className="inline-flex min-h-11 items-center text-sm underline">Abholbedingungen für {city.name}</Link>
          {evidence && serviceCitySeo(service.slug, city.slug).status === "index" ? <div className="space-y-3">
            {evidence.facts.map((fact) => <p key={fact.text} className="text-muted">{fact.text}</p>)}
            <a href={evidence.proof.url} className="underline">{evidence.proof.label}</a>
          </div> : null}
        </section>
        <p className="rounded-card border border-line bg-surface p-4 text-sm">
          Hol- und Bringservice aus {city.name}: {pickup}. {pickupKeramikNote()}. Die Aufbereitung
          erfolgt in unserer Werkstatt: {site.street}, {site.postalCode} {site.city}.
        </p>
          </>
        )}
        <h2 id="umfang" className="mt-10 font-display text-2xl">Leistungsumfang</h2>
        <ul className="mt-5 space-y-3">
          {service.bullets.map((b) => (
            <li key={b} className="border-l border-line pl-4 text-sm text-fg">
              {b}
            </li>
          ))}
        </ul>
        <div className="mt-8 space-y-4 leading-relaxed text-muted">
          {service.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
          {service.pendingApproval ? null : (
            <p>
              {city.minutes === null ? "Fahrzeit und Übergabetermin stimmen wir anhand deiner Adresse ab." : `Aus ${city.name} beträgt die Fahrt rund ${city.minutes} Minuten.`} Du übergibst das
              Fahrzeug an der vereinbarten Adresse; die Rückgabe erfolgt nach der Kontrolle unter
              Werkstattlicht.
            </p>
          )}
        </div>
        {service.honestNote ? <p className="mt-6 border border-line p-4 text-sm">{service.honestNote}</p> : null}
        <ServicePriceNote service={service} />
        <ServiceSteps service={service} />
        <ServiceQuestions service={service} />
        {service.slug === "keramikversiegelung" ? (
          <p className="mt-8 text-sm">
            Paket White-Gloss Ceramic ab {eur(packages[2].price)} {site.vatNote} {pickupKeramikNote()}.
          </p>
        ) : null}
        {service.pendingApproval ? null : <Link
          to={request.leistung ? "/fahrzeug-zustand" : "/"}
          search={request}
          hash="buchung" hashScrollIntoView={BOOKING_JUMP}
          className={`${ctaPrimary} mt-10`}
        >
          Abholung aus {city.name} anfragen
        </Link>}
        <h2 id="leistungen" className="mt-16 font-display text-2xl">Weitere Leistungen für {city.name}</h2>
        <ul className="mt-4 grid grid-cols-2 gap-2 text-sm text-muted">
          {otherServices.map((s) => (
            <li key={s.slug}>
              <Link
                to="/leistungen/$slug"
                params={{ slug: s.slug }}
                search={{ ort: city.slug }}
                className="inline-flex min-h-11 items-center hover:text-fg"
              >
                {s.nav}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-12 text-sm text-muted"><Link to="/abholservice" className="underline">Abholgebiete und Entfernungsstaffeln</Link> · <Link to="/preise" className="underline">Pakete und Preise</Link></p>
      </EditorialLayout>
    </main>
  );
}
