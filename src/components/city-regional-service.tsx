import { Link } from "@tanstack/react-router";
import { Shot } from "@/components/media";
import { ctaGhost, ctaPrimary } from "@/components/ui";
import { packages, pickupKeramikNote, services, site, type City } from "@/data/site";
import { cityPlanningText } from "@/lib/city-logistics";
import { PartnerCityLinks } from "@/components/partner-city-links";
import { isConsolidatedService, serviceAreaLink } from "@/lib/seo-policy";
import type { CityLocalProof } from "@/data/local-proof";
import { eur } from "@/lib/utils";

export function CityRegionalService({
  city,
  body,
  faqs,
}: {
  city: City;
  body?: string;
  faqs?: CityLocalProof["faqs"];
}) {
  const inLossburg = city.slug === "lossburg";
  return (
    <>
      <section className="border-y border-line" aria-labelledby="region-handover">
        <div className="section mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="kicker">{site.owner} · dein Ansprechpartner</p>
            <h2 id="region-handover" className="heading-2 mt-4">
              {inLossburg
                ? "Deine Abholung in Loßburg"
                : "Von Freudenstadt in die Werkstatt und zurück"}
            </h2>
            <p className="mt-5 max-w-xl whitespace-pre-line leading-relaxed text-muted">
              {body || cityPlanningText(city)}
            </p>
            <Link
              to="/abholservice/$city"
              params={{ city: inLossburg ? "freudenstadt" : "lossburg" }}
              className="atelier-text-link mt-6"
            >
              {inLossburg ? "Abholung in Freudenstadt" : "Zur geplanten Werkstatt in Loßburg"}
            </Link>
          </div>
          <Shot
            name="lack"
            alt="Glanz im schwarzen Lack und saubere Felge nach der Aufbereitung"
            className="aspect-[3/2]"
            sizes="(min-width: 1024px) 45vw, 100vw"
          />
        </div>
      </section>

      <section className="section mx-auto max-w-7xl px-4 sm:px-6" aria-labelledby="region-packages">
        <h2 id="region-packages" className="heading-2">
          Welche Pflege passt zu deinem Auto?
        </h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted">
          Die Einstiegspreise gelten für die Kompaktklasse {site.vatNote} {pickupKeramikNote()}.
        </p>
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {packages.map((item) => (
            <li key={item.id}>
              <Link
                to="/"
                search={{ paket: item.id, ort: city.slug }}
                hash="buchung"
                className="group grid gap-2 py-5 md:grid-cols-[1fr_2fr_auto] md:items-center md:gap-6"
              >
                <h3 className="font-display text-xl group-hover:underline">{item.name}</h3>
                <p className="text-sm text-muted">{item.kicker}</p>
                <span className="font-display text-lg">ab {eur(item.price)}</span>
                <span className="sr-only">Paket mit Abholung in {city.name} anfragen</span>
              </Link>
            </li>
          ))}
        </ul>
        <details className="mt-6">
          <summary className="cursor-pointer py-3 font-display">
            Einzelne Leistungen ansehen
          </summary>
          <ul className="grid gap-x-6 sm:grid-cols-2">
            {services
              .filter((service) => !service.pendingApproval && !isConsolidatedService(service.slug))
              .map((service) => (
                <li key={service.slug}>
                  <Link
                    {...serviceAreaLink(service.slug, city.slug)}
                    className="inline-flex min-h-11 items-center text-muted hover:text-fg hover:underline"
                  >
                    {service.nav}
                  </Link>
                </li>
              ))}
          </ul>
        </details>
        <PartnerCityLinks city={city} />
      </section>
      {faqs?.length ? (
        <section className="section mx-auto max-w-7xl px-4 sm:px-6" aria-labelledby="region-faq">
          <h2 id="region-faq" className="heading-2">
            Deine Fragen zur Abholung
          </h2>
          <dl className="mt-8 max-w-2xl space-y-6">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <dt className="heading-3">{faq.question}</dt>
                <dd className="mt-2 text-muted">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <section className="border-t border-line bg-surface">
        <div className="section mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="heading-2">
            {inLossburg ? "Wann passt dir die Übergabe?" : "Wann brauchst du dein Auto zurück?"}
          </h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted">
            {inLossburg
              ? "Deine Anfrage geht direkt an mich. Möchtest du dein Fahrzeug selbst bringen, vereinbaren wir die Übergabe in Horb."
              : "Sag mir bei der Anfrage, ob die Rückgabe vor dem nächsten Arbeitstag oder vor einem Leasingtermin liegen soll. Ich melde mich mit einem passenden Angebot."}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/" search={{ ort: city.slug }} hash="buchung" className={ctaPrimary}>
              Termin anfragen
            </Link>
            <Link to="/galerie" className={ctaGhost}>
              Ergebnisse ansehen
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
