import { EditorialLayout } from "@/components/editorial-layout";
import { serializeJsonLd } from "@/lib/json-ld";
import { createFileRoute } from "@tanstack/react-router";
import { PhotoNote } from "@/components/media";
import { customerPhotos } from "@/data/customer-photos";
import { PageHero } from "@/components/page-hero";
import { ctaGhost, ctaPrimary } from "@/components/ui";
import { site } from "@/data/site";
import { absUrl, pageHead, pageHeroSizes } from "@/lib/seo";

/** Mercedes S-Klasse Coupé (Inhaberfotos 24.11.2026, freigegeben). */
const luxuryPhotos = ["sclass-01", "sclass-02", "sclass-04"].map(
  (id) => customerPhotos.find((photo) => photo.id === id)!,
);

const DESCRIPTION =
  "Aufbereitung für Luxus-, Sport- und Sammlerfahrzeuge ab ca. 80.000 € in Horb am Neckar. Erst anrufen, dann anschauen – nicht über den Online-Konfigurator.";

export const Route = createFileRoute("/luxusfahrzeuge")({
  component: LuxuryPage,
  head: () =>
    pageHead({
      title: `Aufbereitung für Luxus- und Sammlerfahrzeuge | ${site.name}`,
      description: DESCRIPTION,
      path: "/luxusfahrzeuge",
      preloadHero: true, preloadSizes: pageHeroSizes,
    }),
});

function LuxuryPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Individuelle Aufbereitung für Luxusfahrzeuge",
    description: DESCRIPTION,
    url: absUrl("/luxusfahrzeuge"),
    areaServed: "Baden-Württemberg",
    image: absUrl("/media/hero-1080.webp"),
    provider: {
      "@type": "AutomotiveBusiness",
      name: site.legalName,
      telephone: site.phoneHref.replace("tel:", ""),
      url: site.origin,
      sameAs: [site.instagram],
    },
  };

  return (
    <main id="main-content" tabIndex={-1}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <PageHero
        shot="hero"
        alt="Schwarzer Klassiker im White-Gloss Detailing Atelier in Horb am Neckar"
        kicker="Luxusfahrzeuge"
        title="Aufbereitung für Luxus- und Sammlerfahrzeuge"
        lead="Wir besprechen deine Wünsche am Telefon und erstellen nach der Begutachtung ein individuelles Angebot für Fahrzeuge ab etwa 80.000 €."
        crumbs={[
          { label: "Startseite", to: "/" },
          { label: "Luxusfahrzeuge" },
        ]}
        actions={
          <div className="flex flex-wrap gap-3">
            <a href={site.phoneHref} className={ctaPrimary}>
              Persönlich anrufen
            </a>
            <a href={site.whatsapp} className={ctaGhost} target="_blank" rel="noopener noreferrer">
              Vertraulich per WhatsApp
            </a>
          </div>
        }
      />
      <EditorialLayout links={[
        { id: "beratung", label: "Beratung und Ablauf" },
        { id: "diskretion", label: "Persönliche Abstimmung" },
        { id: "motive", label: "Aus der Werkstatt" },
      ]}>
        <h2 id="beratung" className="mb-5 font-display text-2xl">Beratung und Ablauf</h2>
        <ol className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {[
            [
              "Anrufen oder schreiben",
              "Am Telefon oder per WhatsApp besprechen wir dein Fahrzeug, seine Nutzung und deine Wünsche. Die Aufbereitung von Luxus- und Sammlerfahrzeugen erfolgt ausschließlich nach persönlicher Abstimmung.",
            ],
            [
              "Fahrzeug begutachten",
              "Lack, Karosserie, Leder und die empfindlichen Stellen schauen wir uns gemeinsam in der Werkstatt in Horb an. Erst dann ist klar, was wirklich nötig ist.",
            ],
            [
              "Umfang festlegen",
              "Nach der Begutachtung besprechen wir die geeigneten Verfahren, den Schutz und den Zeitrahmen. Du erhältst ein individuelles Angebot mit dem vereinbarten Leistungsumfang.",
            ],
            [
              "Umsetzen",
              "Jede Maßnahme richtet sich nach Material und Werterhalt. Premium-Wachse wie Swissvax nehmen wir nur, wenn sie wirklich zum Lack passen.",
            ],
          ].map(([t, d], i) => (
            <li key={t} className="border-t border-line pt-8">
              <p aria-hidden="true" className="font-display text-2xl text-subtle">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 font-display text-2xl tracking-tight">{t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{d}</p>
            </li>
          ))}
        </ol>
        <h2 id="diskretion" className="mt-14 font-display text-2xl">Persönliche Abstimmung</h2>
        <ul className="mt-5 list-disc space-y-3 pl-5 leading-relaxed text-muted">
          <li>Erstgespräch persönlich am Telefon oder vertraulich via WhatsApp</li>
          <li>Begutachtung des Fahrzeugs in unserer Werkstatt in Horb oder vor Ort</li>
          <li>Hol- und Bringservice nach persönlicher Abstimmung</li>
          <li>Absolute Diskretion – Veröffentlichung nur mit ausdrücklicher Zustimmung und ohne sichtbares Kennzeichen</li>
          <li>Leistungsumfang und Festpreis-Angebot erst nach individueller Begutachtung</li>
          <li>Keine anonyme Online-Buchung, kein Standardpaket</li>
        </ul>
        <p className="mt-8 text-xs text-subtle">
          Swissvax nennen wir als mögliche Produktwahl, nicht als Partnerschaft.
        </p>
        <a href={site.phoneHref} className={`${ctaPrimary} mt-10`}>
          Persönlich anrufen · {site.phoneDisplay}
        </a>
      </EditorialLayout>

      <section id="motive" className="border-t border-line">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <p className="kicker">Aus der Werkstatt</p>
          <h2 className="mt-4 max-w-2xl font-display text-4xl tracking-tight sm:text-5xl">
            So sieht die Arbeit aus.
          </h2>
          <p className="mt-5 max-w-xl text-muted">
            Das gezeigte Kundenfahrzeug veröffentlichen wir mit ausdrücklicher Freigabe.
            Das Kennzeichen ist in den verwendeten Motiven nicht sichtbar.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {luxuryPhotos.map((photo, index) => (
              <figure key={photo.id} className={index === 0 ? "col-span-2 sm:col-span-1" : undefined}>
                <img
                  src={photo.src}
                  srcSet={photo.srcSet}
                  sizes="(min-width: 640px) 33vw, 50vw"
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  loading="lazy"
                  decoding="async"
                  className={`${index === 0 ? "aspect-[4/3] sm:aspect-[3/4]" : "aspect-[3/4]"} w-full object-cover outline outline-1 -outline-offset-1 outline-white/10`}
                  style={{ objectPosition: photo.position }}
                />
                <figcaption className="mt-2 text-xs text-muted">{photo.title}</figcaption>
              </figure>
            ))}
          </div>
          <PhotoNote className="mt-4" />
          <a href={site.phoneHref} className={`${ctaPrimary} mt-8`}>
            Persönliche Beratung · {site.phoneDisplay}
          </a>
        </div>
      </section>
    </main>
  );
}
