import { createFileRoute, Link } from "@tanstack/react-router";
import { Layers, Paintbrush, ScanSearch, Wrench, type LucideIcon } from "lucide-react";
import { EditorialLayout } from "@/components/editorial-layout";
import { PageHero } from "@/components/page-hero";
import { PhotoInquiry } from "@/components/photo-inquiry";
import { WhatsAppPhotoCta } from "@/components/whatsapp-photo-cta";
import { ctaGhost, ctaPrimary } from "@/components/ui";
import { site } from "@/data/site";
import { serializeJsonLd } from "@/lib/json-ld";
import { absUrl, pageHead } from "@/lib/seo";
import "@/styles/partner-services.css";

const PATH = "/folierung-smart-repair";
const DESCRIPTION =
  "Folierung und Farbwechsel bis zur Luxuskarosserie, Dellen drücken ohne Lackieren, Lackierarbeiten und Smart Repair mit erfahrenen Partnerbetrieben. Preis nach Begutachtung.";

/**
 * Photo slots for the four partner services. Leave `photo` empty until the
 * owner supplies a released picture; the slot then shows a neutral tile.
 * To add one, place the file under public/media/partner/ and fill in
 * src, alt and the intrinsic width and height of the file.
 */
type SlotPhoto = { src: string; alt: string; width: number; height: number };
type PartnerService = {
  id: string;
  label: string;
  title: string;
  text: string;
  points: string[];
  icon: LucideIcon;
  /** Dedicated landing page for this service. */
  page: "/folierung" | "/dellen-druecken" | "/lackierarbeiten" | "/smart-repair";
  photo?: SlotPhoto;
};

const partnerServices: PartnerService[] = [
  {
    id: "folierung",
    label: "Folierung",
    title: "Folierung und Farbwechsel",
    text:
      "Neue Farbe ohne Neulackierung: Vom Alltagsauto bis zur Luxuskarosserie folieren unsere Partner dein Fahrzeug ganz oder in Teilen. Ob Grün, Mattschwarz oder Satin, Farbton und Finish suchst du gemeinsam mit dem Folierer aus.",
    points: [
      "Vollfolierung und kompletter Farbwechsel",
      "Teilfolierung, zum Beispiel Dach, Spiegel oder Zierleisten",
      "Glanz, Matt, Satin und Effektfolien",
      "Auch für Luxus-, Sport- und Sammlerfahrzeuge",
    ],
    icon: Layers,
    page: "/folierung",
  },
  {
    id: "dellen",
    label: "Dellen drücken",
    title: "Dellen drücken ohne Lackieren",
    text:
      "Parkdellen, Türkantendellen oder Hagelschäden drückt der Partner von innen heraus. Das klappt, wenn Lack und Blech es zulassen. Sonst sagen wir dir vorher ehrlich, welche Reparatur nötig ist.",
    points: [
      "Parkdellen und Türkantendellen",
      "Kleinere Karosseriedellen an zugänglichen Bauteilen",
      "Einzelne oder zahlreiche Hageldellen",
      "Erste Einschätzung oft schon per Foto",
    ],
    icon: ScanSearch,
    page: "/dellen-druecken",
  },
  {
    id: "lackierarbeiten",
    label: "Lackierarbeiten",
    title: "Lackierarbeiten",
    text:
      "Bei Kratzern bis auf die Grundierung, Steinschlägen oder beschädigten Bauteilen prüft der Lackierbetrieb, ob eine kleine Ausbesserung reicht oder ein Bauteil neu lackiert wird.",
    points: [
      "Kratzer, Schrammen und Steinschläge",
      "Teil- und Bauteillackierung",
      "Stoßfänger, Spiegel und Anbauteile",
      "Anschließend auf Wunsch Politur und Versiegelung bei uns",
    ],
    icon: Paintbrush,
    page: "/lackierarbeiten",
  },
  {
    id: "smart-repair",
    label: "Smart Repair",
    title: "Smart Repair",
    text:
      "Kleine Schäden gezielt an der betroffenen Stelle reparieren statt ganze Teile zu tauschen. Das gilt außen am Lack und an den Felgen genauso wie im Innenraum.",
    points: [
      "Kleine Lackschäden und Kratzer",
      "Felgen mit Bordsteinschäden",
      "Leder, Kunststoff und Brandlöcher im Innenraum",
      "Was möglich ist, klären wir vorab am Fahrzeug",
    ],
    icon: Wrench,
    page: "/smart-repair",
  },
];

const steps = [
  [
    "Anfragen",
    "Schreib uns kurz, worum es geht. Fotos vom Schaden oder vom Fahrzeug helfen für eine erste Einschätzung.",
  ],
  [
    "Begutachten und abstimmen",
    "Wir schauen uns das Fahrzeug an und stimmen die Arbeit mit dem passenden Partnerbetrieb ab. Umfang und Preis erfährst du, bevor du zusagst.",
  ],
  [
    "Umsetzen",
    "Der Partner führt die Arbeit in seinem Fachbetrieb aus. Auf Wunsch holen wir dein Auto ab und bringen es dir zurück.",
  ],
  [
    "Übergeben",
    "Wir schauen uns das Ergebnis gemeinsam an. Wenn du möchtest, bekommt dein Auto danach noch Aufbereitung oder Versiegelung bei uns.",
  ],
] as const;

export const Route = createFileRoute("/folierung-smart-repair")({
  component: PartnerServicesPage,
  head: () =>
    pageHead({
      title: `Folierung, Dellen, Lack & Smart Repair | ${site.name}`,
      description: DESCRIPTION,
      path: PATH,
      preloadShot: "keramik",
    }),
});

function SlotFigure({ service }: { service: PartnerService }) {
  const Icon = service.icon;
  if (service.photo) {
    return (
      <figure className="psvc__media">
        <img
          src={service.photo.src}
          alt={service.photo.alt}
          width={service.photo.width}
          height={service.photo.height}
          loading="lazy"
          decoding="async"
        />
      </figure>
    );
  }
  return (
    <div className="psvc__media psvc__media--slot" aria-hidden="true">
      <Icon size={40} strokeWidth={1.1} />
      <span>{service.label}</span>
    </div>
  );
}

function PartnerServicesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Folierung, Dellen drücken, Lackierarbeiten und Smart Repair",
    description: DESCRIPTION,
    url: absUrl(PATH),
    areaServed: "Baden-Württemberg",
    provider: {
      "@type": "AutomotiveBusiness",
      name: site.legalName,
      telephone: site.phoneHref.replace("tel:", ""),
      url: site.origin,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Partnerleistungen",
      itemListElement: partnerServices.map((service) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: service.title },
      })),
    },
  };

  return (
    <main id="main-content" tabIndex={-1}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <PageHero
        shot="keramik"
        alt="Spiegelung auf dunklem Fahrzeuglack"
        kicker="Partnerleistungen"
        title="Folierung, Lack und Smart Repair."
        lead="Farbwechsel bis zur Luxuskarosserie, Dellen drücken ohne Lackieren, Lackierarbeiten und Smart Repair. Dafür arbeiten wir mit erfahrenen Partnerbetrieben zusammen. Dein Ansprechpartner bleibt White-Gloss."
        crumbs={[
          { label: "Startseite", to: "/" },
          { label: "Leistungen", to: "/leistungen" },
          { label: "Folierung & Smart Repair" },
        ]}
        actions={
          <div className="flex flex-wrap gap-3">
            <a href="#anfrage" className={ctaPrimary}>
              Anfrage stellen
            </a>
            <a href={site.whatsapp} className={ctaGhost} target="_blank" rel="noopener noreferrer">
              Fotos per WhatsApp
            </a>
          </div>
        }
      >
        <ul className="psvc-chips" aria-label="Die vier Leistungen">
          {partnerServices.map((service) => (
            <li key={service.id}>
              <a href={`#${service.id}`}>{service.label}</a>
            </li>
          ))}
        </ul>
      </PageHero>

      <section className="psvc-sec" aria-labelledby="psvc-overview">
        <div className="wrap">
          <p className="label label--rule">Vier Gewerke · ein Ansprechpartner</p>
          <h2 className="h2 chrome" id="psvc-overview">
            Alles rund um Karosserie und Optik.
          </h2>
          <p className="muted psvc-intro">
            Jede dieser Arbeiten übernimmt ein Partner, der genau darauf spezialisiert ist. Teils
            sind es Meisterbetriebe, teils Fachbetriebe mit langjähriger Erfahrung. Alle sind
            absolute Profis in ihrem Bereich. Wir koordinieren für dich und behalten den Überblick.
          </p>
          <ol className="psvc-grid">
            {partnerServices.map((service, index) => (
              <li key={service.id} id={service.id} className="psvc">
                <SlotFigure service={service} />
                <div className="psvc__body">
                  <p className="psvc__num" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="h3">{service.title}</h3>
                  <p className="muted">{service.text}</p>
                  <ul className="psvc__points">
                    {service.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                  <Link to={service.page} className="golink">
                    Mehr zu {service.label} <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <EditorialLayout
        links={[
          { id: "ablauf", label: "So läuft es ab" },
          { id: "partner", label: "Unsere Partnerbetriebe" },
          { id: "anfrage", label: "Anfrage stellen" },
        ]}
      >
        <h2 id="ablauf" className="mb-5 font-display text-2xl">So läuft es ab</h2>
        <ol className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {steps.map(([title, text], index) => (
            <li key={title} className="border-t border-line pt-8">
              <p aria-hidden="true" className="font-display text-2xl text-subtle">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 font-display text-2xl tracking-tight">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ol>

        <h2 id="partner" className="mt-14 font-display text-2xl">Unsere Partnerbetriebe</h2>
        <ul className="mt-5 list-disc space-y-3 pl-5 leading-relaxed text-muted">
          <li>Externe Partner, jeder spezialisiert auf sein Gewerk</li>
          <li>Teils Meisterbetriebe, teils langjährige Fachbetriebe</li>
          <li>Du hast einen festen Ansprechpartner bei White-Gloss, von der Anfrage bis zur Übergabe</li>
          <li>Preis nach Begutachtung, abgestimmt mit dem Partnerbetrieb, bevor du zusagst</li>
          <li>Auf Wunsch Hol- und Bringservice über White-Gloss</li>
        </ul>

        <div className="mt-12">
          <WhatsAppPhotoCta />
        </div>
        <div id="anfrage" className="mt-12">
          <PhotoInquiry
            title="Folierung, Dellen, Lack oder Smart Repair anfragen"
            hint="Schreib kurz, um welche Arbeit es geht, zum Beispiel Wunschfarbe für die Folierung oder wo der Schaden sitzt. Fotos ergänzt du nach der Anfrage in deinem Kundenbereich."
          />
        </div>
        <p className="mt-8 text-sm text-muted">
          Lieber direkt sprechen?{" "}
          <a href={site.phoneHref} className="underline underline-offset-4 hover:text-fg">
            {site.phoneDisplay}
          </a>
        </p>
      </EditorialLayout>
    </main>
  );
}
