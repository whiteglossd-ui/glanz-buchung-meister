import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, Crown, Layers, Palette, type LucideIcon } from "lucide-react";
import { EditorialLayout } from "@/components/editorial-layout";
import { PageHero } from "@/components/page-hero";
import { PhotoInquiry } from "@/components/photo-inquiry";
import { WhatsAppPhotoCta } from "@/components/whatsapp-photo-cta";
import { ctaGhost, ctaPrimary } from "@/components/ui";
import { cities, site } from "@/data/site";
import { serializeJsonLd } from "@/lib/json-ld";
import { absUrl, pageHead } from "@/lib/seo";
import "@/styles/partner-services.css";

const PATH = "/folierung";
const DESCRIPTION =
  "Autofolierung und Car Wrapping in Horb am Neckar: Farbwechsel, Voll- und Teilfolierung bis zur Luxuskarosserie mit erfahrenem Partner-Folierer. Preis nach Begutachtung.";

/**
 * Photo slots for the wrapping page. Leave `photo` empty until the owner
 * supplies a released picture; the slot then shows a neutral tile.
 * Files go under public/media/partner/ (see docs/folierung-2026-11-27.md).
 */
type SlotPhoto = { src: string; alt: string; width: number; height: number };
type WrapOption = {
  id: string;
  label: string;
  title: string;
  text: string;
  points: string[];
  icon: LucideIcon;
  photo?: SlotPhoto;
};

const wrapOptions: WrapOption[] = [
  {
    id: "vollfolierung",
    label: "Vollfolierung",
    title: "Vollfolierung und Farbwechsel",
    text:
      "Dein Auto bekommt eine komplett neue Farbe, ohne dass neu lackiert wird. Der Folierer bezieht alle sichtbaren Außenflächen mit Folie. Den Farbton und das Finish suchst du vorher gemeinsam mit ihm aus.",
    points: [
      "Kompletter Farbwechsel ohne Neulackierung",
      "Große Auswahl an Farbtönen",
      "Originallack liegt geschützt unter der Folie",
      "Folie lässt sich in der Regel wieder entfernen",
    ],
    icon: Palette,
  },
  {
    id: "teilfolierung",
    label: "Teilfolierung",
    title: "Teilfolierung und Akzente",
    text:
      "Oft reichen einzelne Bauteile für einen neuen Look. Typisch sind ein schwarzes Dach, Spiegelkappen in Kontrastfarbe oder Chromleisten, die in Schwarz verschwinden.",
    points: [
      "Dach, Spiegelkappen und Motorhaube",
      "Chromleisten schwarz folieren (Chrome Delete)",
      "Zierleisten, Akzente und Streifen",
      "Kombinierbar mit Aufbereitung bei uns",
    ],
    icon: Layers,
  },
  {
    id: "finish",
    label: "Folienarten",
    title: "Glanz, Matt, Satin und Effekt",
    text:
      "Die Folie bestimmt die Wirkung. Glanzfolie wirkt wie frischer Lack, Mattfolie und Satinfolie wirken ruhig und edel. Effektfolien wechseln je nach Licht die Farbe.",
    points: [
      "Glanzfolie für den Look von Lack",
      "Matt und Satin für eine seidige Optik",
      "Effekt- und Farbwechselfolien",
      "Beratung zu Farbe und Finish am Muster",
    ],
    icon: Car,
  },
  {
    id: "luxus",
    label: "Luxusfahrzeuge",
    title: "Folierung für Luxus- und Sportwagen",
    text:
      "Bei hochwertigen Fahrzeugen zählt jedes Detail. Kanten, Spaltmaße und Anbauteile brauchen besondere Sorgfalt. Deshalb arbeiten wir hier mit einem Folierer, der solche Fahrzeuge kennt.",
    points: [
      "Luxus-, Sport- und Sammlerfahrzeuge",
      "Sorgfältige Arbeit an Kanten und Übergängen",
      "Lackprüfung vor der Folierung",
      "Auf Wunsch Hol- und Bringservice",
    ],
    icon: Crown,
  },
];

const steps = [
  [
    "Anfragen",
    "Schreib uns dein Fahrzeug und deine Wunschfarbe. Fotos vom Auto helfen für eine erste Einschätzung.",
  ],
  [
    "Beraten und prüfen",
    "Wir schauen uns den Lack an, auch mit Lackdickenmessung. Farbe, Folie und Umfang stimmst du mit dem Folierer ab. Den Preis erfährst du, bevor du zusagst.",
  ],
  [
    "Folieren",
    "Der Partner foliert dein Auto in seinem Fachbetrieb. Auf Wunsch holen wir das Fahrzeug bei dir ab und bringen es zurück.",
  ],
  [
    "Übergeben",
    "Wir schauen uns das Ergebnis gemeinsam an. Du bekommst die Pflegehinweise für deine Folie.",
  ],
] as const;

const faqs = [
  {
    q: "Was kostet eine Autofolierung?",
    a: "Das hängt von Fahrzeuggröße, Folie, Umfang und Zustand des Lacks ab. Eine Vollfolierung ist deutlich aufwendiger als eine Teilfolierung. Deshalb gibt es keinen Pauschalpreis. Du bekommst den Preis nach der Begutachtung, bevor du zusagst.",
  },
  {
    q: "Wie lange dauert eine Folierung?",
    a: "Die Dauer hängt vom Fahrzeug und vom Umfang ab. Eine Teilfolierung geht schneller als ein kompletter Farbwechsel. Den Termin und die Dauer stimmen wir mit dem Folierer ab und sagen sie dir vorher.",
  },
  {
    q: "Schadet die Folie dem Lack?",
    a: "Auf intaktem Originallack lässt sich eine hochwertige Folie in der Regel wieder ablösen. Bei nachlackierten oder beschädigten Stellen kann beim Entfernen Lack mitgehen. Deshalb prüfen wir den Lack vorher, auch mit Lackdickenmessung.",
  },
  {
    q: "Was ist Car Wrapping?",
    a: "Car Wrapping ist der englische Begriff für Autofolierung. Gemeint ist das Bekleben des Fahrzeugs mit Folie, ganz oder in Teilen, zum Beispiel für einen Farbwechsel.",
  },
  {
    q: "Wie pflege ich ein foliertes Auto?",
    a: "Am schonendsten ist eine Handwäsche. Matte und satinierte Folien werden nicht poliert, weil sie sonst glänzende Stellen bekommen. Die genauen Pflegehinweise für deine Folie bekommst du bei der Übergabe.",
  },
  {
    q: "Foliert ihr auch Luxus- und Sportwagen?",
    a: "Ja. Wir folieren vom Alltagsauto bis zur Luxuskarosserie. Gerade bei hochwertigen Fahrzeugen prüfen wir den Lack vorher besonders genau.",
  },
  {
    q: "Wer foliert mein Auto?",
    a: "Die Folierung übernimmt ein erfahrener Partnerbetrieb, der auf Fahrzeugfolierung spezialisiert ist. Dein Ansprechpartner bleibt White-Gloss, von der Anfrage bis zur Übergabe.",
  },
  {
    q: "Holt ihr mein Auto ab?",
    a: `Ja, auf Wunsch holen wir dein Fahrzeug ab und bringen es zurück. Wir sind in ${site.city} und kommen auch aus der Umgebung, zum Beispiel aus Nagold, Freudenstadt oder Rottenburg.`,
  },
];

export const Route = createFileRoute("/folierung")({
  component: FolierungPage,
  head: () =>
    pageHead({
      title: `Autofolierung Horb: Farbwechsel & Car Wrapping | ${site.name}`,
      description: DESCRIPTION,
      path: PATH,
      preloadShot: "lack",
    }),
});

function SlotFigure({ option }: { option: WrapOption }) {
  const Icon = option.icon;
  if (option.photo) {
    return (
      <figure className="psvc__media">
        <img
          src={option.photo.src}
          alt={option.photo.alt}
          width={option.photo.width}
          height={option.photo.height}
          loading="lazy"
          decoding="async"
        />
      </figure>
    );
  }
  return (
    <div className="psvc__media psvc__media--slot" aria-hidden="true">
      <Icon size={40} strokeWidth={1.1} />
      <span>{option.label}</span>
    </div>
  );
}

function FolierungPage() {
  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Autofolierung und Farbwechsel",
    alternateName: ["Car Wrapping", "Fahrzeugfolierung", "Auto folieren"],
    serviceType: "Autofolierung",
    description: DESCRIPTION,
    url: absUrl(PATH),
    areaServed: cities.map((city) => ({ "@type": "City", name: city.name })),
    provider: {
      "@type": "AutomotiveBusiness",
      name: site.legalName,
      telephone: site.phoneHref.replace("tel:", ""),
      url: site.origin,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Folierung",
      itemListElement: wrapOptions.map((option) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: option.title },
      })),
    },
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <main id="main-content" tabIndex={-1}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(serviceLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqLd) }}
      />
      <PageHero
        shot="lack"
        alt="Glänzende Frontpartie eines dunklen Fahrzeugs"
        kicker="Autofolierung · Car Wrapping"
        title="Autofolierung und Farbwechsel in Horb."
        lead="Neue Farbe ohne Neulackierung: Wir folieren dein Auto ganz oder in Teilen, vom Alltagsauto bis zur Luxuskarosserie. Die Folierung übernimmt ein erfahrener Partner-Folierer. Dein Ansprechpartner bleibt White-Gloss."
        crumbs={[
          { label: "Startseite", to: "/" },
          { label: "Leistungen", to: "/leistungen" },
          { label: "Autofolierung" },
        ]}
        actions={
          <div className="flex flex-wrap gap-3">
            <a href="#anfrage" className={ctaPrimary}>
              Folierung anfragen
            </a>
            <a href={site.whatsapp} className={ctaGhost} target="_blank" rel="noopener noreferrer">
              Fotos per WhatsApp
            </a>
          </div>
        }
      >
        <ul className="psvc-chips" aria-label="Folierung im Überblick">
          {wrapOptions.map((option) => (
            <li key={option.id}>
              <a href={`#${option.id}`}>{option.label}</a>
            </li>
          ))}
          <li>
            <a href="#fragen">Häufige Fragen</a>
          </li>
        </ul>
      </PageHero>

      <section className="psvc-sec" aria-labelledby="folierung-overview">
        <div className="wrap">
          <p className="label label--rule">Auto folieren lassen</p>
          <h2 className="h2 chrome" id="folierung-overview">
            Neue Farbe. Originallack bleibt.
          </h2>
          <p className="muted psvc-intro">
            Eine Autofolierung verändert die Optik deines Fahrzeugs, ohne dass neu lackiert wird.
            Ob kompletter Farbwechsel in Grün, Mattschwarz oder Satin, oder nur ein schwarzes Dach
            und dunkle Zierleisten: Der Folierer setzt es um, wir koordinieren alles für dich. Vor
            der Folierung prüfen wir den Lack. So weißt du vorher, ob er für die Folie geeignet ist.
          </p>
          <ol className="psvc-grid">
            {wrapOptions.map((option, index) => (
              <li key={option.id} id={option.id} className="psvc">
                <SlotFigure option={option} />
                <div className="psvc__body">
                  <p className="psvc__num" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="h3">{option.title}</h3>
                  <p className="muted">{option.text}</p>
                  <ul className="psvc__points">
                    {option.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <EditorialLayout
        links={[
          { id: "ablauf", label: "So läuft die Folierung ab" },
          { id: "region", label: "Folierung in der Region" },
          { id: "fragen", label: "Häufige Fragen" },
          { id: "anfrage", label: "Folierung anfragen" },
        ]}
      >
        <h2 id="ablauf" className="mb-5 font-display text-2xl">So läuft die Folierung ab</h2>
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

        <h2 id="region" className="mt-14 font-display text-2xl">Folierung in Horb und der Region</h2>
        <p className="mt-5 leading-relaxed text-muted">
          White-Gloss sitzt in {site.city}. Für die Folierung holen wir dein Auto auf Wunsch ab,
          auch aus diesen Orten:
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
          {cities.map((city) => (
            <li key={city.slug}>{city.name}</li>
          ))}
        </ul>

        <h2 id="fragen" className="mt-14 font-display text-2xl">Häufige Fragen zur Autofolierung</h2>
        <div className="mt-5 divide-y divide-line border-y border-line">
          {faqs.map((faq) => (
            <details key={faq.q} className="group py-4">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {faq.q}
                <span aria-hidden="true" className="text-subtle transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{faq.a}</p>
            </details>
          ))}
        </div>

        <p className="mt-10 leading-relaxed text-muted">
          Du brauchst eher eine Reparatur als eine neue Farbe?{" "}
          <Link to="/folierung-smart-repair" className="underline underline-offset-4 hover:text-fg">
            Dellen drücken, Lackierarbeiten und Smart Repair
          </Link>{" "}
          koordinieren wir ebenfalls mit Partnerbetrieben. Mehr zu Parkdellen und Hagel findest du
          unter{" "}
          <Link to="/dellen-hagelschaden" className="underline underline-offset-4 hover:text-fg">
            Dellen und Hagelschäden
          </Link>
          .
        </p>
        <p className="mt-4 leading-relaxed text-muted">
          Mehr im Ratgeber:{" "}
          <Link
            to="/ratgeber/$slug"
            params={{ slug: "auto-folieren-lassen" }}
            className="underline underline-offset-4 hover:text-fg"
          >
            Auto folieren lassen
          </Link>{" "}
          und{" "}
          <Link
            to="/ratgeber/$slug"
            params={{ slug: "folieren-oder-lackieren" }}
            className="underline underline-offset-4 hover:text-fg"
          >
            Folieren oder Lackieren
          </Link>
          .
        </p>

        <div className="mt-12">
          <WhatsAppPhotoCta />
        </div>
        <div id="anfrage" className="mt-12">
          <PhotoInquiry
            title="Autofolierung anfragen"
            hint="Schreib kurz dein Fahrzeug, die Wunschfarbe und ob es eine Voll- oder Teilfolierung sein soll. Fotos ergänzt du nach der Anfrage in deinem Kundenbereich."
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
