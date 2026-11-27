import { createFileRoute, Link } from "@tanstack/react-router";
import { LazyConfigurator } from "@/components/lazy-configurator";
import { WhatsAppPhotoCta } from "@/components/whatsapp-photo-cta";
import { PageHero } from "@/components/page-hero";
import {
  extras,
  packageAnchor,
  packages,
  pickupKeramikNote,
  pickupTierSummary,
  vehicleClasses,
  site,
} from "@/data/site";
import { pageHead } from "@/lib/seo";
import { pricePageJsonLd } from "@/lib/page-schema";
import { serializeJsonLd } from "@/lib/json-ld";
import { eur, money } from "@/lib/utils";
import { BOOKING_JUMP } from "@/lib/booking-anchor-focus";
import { ctaPrimary, PriceLine } from "@/components/ui";

const packagePhotos = {
  basis: ["foam-sq", "Reinigungsschaum auf schwarzem Fahrzeuglack"],
  premium: ["polish-sq", "Poliermaschine bei der Bearbeitung des Lacks"],
  keramik: ["beads-sq", "Wassertropfen auf einer versiegelten Lackoberfläche"],
} as const;

const packageImageSizes = "auto, (max-width: 820px) 90vw, (max-width: 1100px) 42vw, 380px";

export const Route = createFileRoute("/preise")({
  component: PreisePage,
  head: () =>
    pageHead({
      title: `Preise für Fahrzeugaufbereitung in Horb | ${site.name}`,
      description:
        `Fahrzeugaufbereitung in Horb: ${packages.map((p) => `${p.name} ab ${money(p.price)}\u00a0€`).join(", ")} inkl. MwSt. für die Kompaktklasse.`,
      path: "/preise",
      preloadShot: "keramik",
    }),
});

function PreisePage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pricePageJsonLd()) }}
      />
      <PageHero
        shot="keramik"
        alt="Spiegelnde Motorhaube eines Kundenfahrzeugs nach der Aufbereitung"
        kicker="Pakete & Preise"
        title="Preise für die Aufbereitung."
        lead="Vergleiche unsere drei Pakete. Der Preisrechner berücksichtigt Fahrzeugklasse und Zusatzleistungen."
        crumbs={[
          { label: "Startseite", to: "/" },
          { label: "Preise & Pakete" },
        ]}
        actions={
          <Link to="/" hash="buchung" hashScrollIntoView={BOOKING_JUMP} className={ctaPrimary}>
            Termin anfragen
          </Link>
        }
      />
      <div className="wrap section">
        <ol id="paketkatalog" className="packs list-none p-0" aria-label="Aufbereitungspakete">
          {packages.map((p) => {
            const [image, alt] = packagePhotos[p.id];
            const photo = `/media/dark/gen/${image}`;
            return (
              <li key={p.id} id={packageAnchor(p.id)} className="pack">
                <picture className="pack__img">
                  <source
                    type="image/avif"
                    srcSet={`/media/pricing/${image}-320.avif 320w, /media/pricing/${image}-800.avif 800w`}
                    sizes={packageImageSizes}
                    width={320}
                    height={240}
                  />
                  <img
                    src={`${photo}-320.webp`}
                    srcSet={`${photo}-320.webp 320w, ${photo}-800.webp 800w`}
                    sizes={packageImageSizes}
                    width={320}
                    height={320}
                    loading="lazy"
                    decoding="async"
                    alt={alt}
                  />
                </picture>
                <div className="pack__body gap-3">
                  <p className="label">{p.kicker}</p>
                  <h2 className="h3">{p.name}</h2>
                  <p className="pack__price"><small>ab</small> {eur(p.price)}</p>
                  <p className="text-sm text-muted">{site.vatNote} · {p.duration}</p>
                  <Link
                    to="/"
                    search={{ paket: p.id }}
                    hash="buchung"
                    hashScrollIntoView={BOOKING_JUMP}
                    aria-label={`Termin anfragen für ${p.name}`}
                    className={ctaPrimary}
                  >
                    Termin anfragen
                  </Link>
                  <details className="pack__det">
                    <summary className="min-h-11 items-center">
                      Leistungsumfang <span aria-hidden="true">›</span>
                    </summary>
                    <p className="mt-4 text-sm leading-relaxed text-muted">{p.body}</p>
                    <ul>
                      {p.items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </details>
                </div>
              </li>
            );
          })}
        </ol>
        <aside className="my-8 max-w-3xl border-l border-line-strong pl-5">
          <p className="font-display text-xl">Preise nach Absprache – nach Besichtigung und Abstimmung.</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Die angegebenen Einstiegspreise gelten für die Kompaktklasse und enthalten
            die Mehrwertsteuer. Fahrzeugklasse und Zusatzleistungen bestimmen den
            berechneten Preis. Entsteht durch Verschmutzung oder Lackzustand
            zusätzlicher Aufwand, stimmen wir diesen vor Beginn mit dir ab.
          </p>
        </aside>
        <h2 className="heading-2 mt-20">Fahrzeuggröße</h2>
        <div className="facts mt-8 grid gap-4 md:grid-cols-3">
          {vehicleClasses.map((c) => (
            <div key={c.id} className="border border-line p-6">
              <h3 className="font-display text-2xl tracking-wide">{c.label}</h3>
              <p className="mt-2 text-sm text-muted">{c.hint}</p>
              <p className="mt-5 text-xs uppercase tracking-[0.16em] text-subtle">
                {c.factor === 1 ? "Basispreis" : `Faktor ${c.factor.toString().replace(".", ",")}`}
              </p>
            </div>
          ))}
        </div>
        <h2 className="heading-2 mt-20">Zusatzleistungen</h2>
        <p className="mt-4 max-w-2xl text-sm text-muted">
          Alle Einstiegspreise gelten für die Kompaktklasse und verstehen sich {site.vatNote}
          {" "}Der Fahrzeuggrößenfaktor gilt für Paket und Zusatzleistungen, nicht für die Abholung.
          Vor einer Reparatur prüfen wir, ob das Material geeignet ist.
        </p>
        {(["pflege", "reparatur"] as const).map((group) => (
          <div key={group}>
            <h3 className="mt-12 text-xs uppercase tracking-[0.2em] text-subtle">
              {group === "pflege" ? "Pflege & Aufbereitung" : "Reparatur"}
            </h3>
            <ul className="mt-2 divide-y divide-line border-y border-line">
              {extras
                .filter((e) => e.group === group && e.requestable !== false)
                .map((e) => (
                  <PriceLine
                    key={e.id}
                    name={e.name}
                    hint={e.hint}
                    price={e.price}
                    note={e.inspect ? "nach Prüfung am Fahrzeug" : undefined}
                  />
                ))}
            </ul>
          </div>
        ))}
        <p className="mt-6 text-sm text-subtle">
          Hol- und Bringservice: {pickupTierSummary()}. {pickupKeramikNote()}.
          Wenn Verschmutzung oder Lackzustand
          mehr Aufwand bedeuten, stimmen wir das mit dir ab, bevor wir anfangen.
        </p>
        <div id="buchung" className="mt-16">
          <h2 id="buchung-heading" className="mb-8 font-display text-3xl">
            Preis berechnen
          </h2>
          <WhatsAppPhotoCta className="mb-10" headingLevel={3} />
          <LazyConfigurator />
        </div>
        <p className="mt-10 text-sm">
          <Link to="/faq" className="hover:underline">
            Häufige Fragen zu Kosten und Dauer
          </Link>
        </p>
      </div>
    </main>
  );
}
