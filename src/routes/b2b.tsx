import { EditorialLayout } from "@/components/editorial-layout";
import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { ctaGhost, ctaPrimary } from "@/components/ui";
import { site } from "@/data/site";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/b2b")({
  component: B2bPage,
  head: () =>
    pageHead({
      title: `B2B Fahrzeugaufbereitung Flotten | ${site.name}`,
      description:
        "Leasingrückläufer, Fuhrpark, Autohäuser: individuelle Kalkulation statt Pauschalpreis. White-Gloss Detailing in Horb am Neckar.",
      path: "/b2b",
      preloadShot: "atelier",
    }),
});

const segments = [
          ["Leasingrückläufer", "Vor der Leasingrückgabe behandeln wir relevante Gebrauchsspuren im vereinbarten Umfang.", "leasingruecklaeufer"],
          ["Flotten- & Fuhrparkreinigung", "Einmal oder in einem Rhythmus, der zu deinem Betrieb passt.", "fuhrpark"],
          ["Autohäuser & Fahrzeughandel", "Aufbereitung für Verkauf, Standfläche und Auslieferung.", "autohaeuser"],
          ["Firmen- & Poolfahrzeuge", "Reinigung und Pflege von Innenraum und Außenflächen für den täglichen Einsatz.", "firmenfahrzeuge"],
        ];

function B2bPage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <PageHero
        shot="atelier"
        alt="Werkstatt mit LED-Licht"
        kicker="Geschäftskunden"
        title="Firmenkunden, Flotten, Autohäuser."
        lead="Aufbereitung für Flotten und Leasingrückläufer mit einem Angebot passend zu deinem Bedarf."
        crumbs={[
          { label: "Startseite", to: "/" },
          { label: "Geschäftskunden" },
        ]}
        actions={
          <>
            <a href={site.phoneHref} className={ctaPrimary}>
              {site.phoneDisplay}
            </a>
            <a href={site.whatsapp} className={ctaGhost} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          </>
        }
      />
      <EditorialLayout links={[
        ...segments.map(([label, , id]) => ({ label, id })),
        { id: "b2b-anfrage", label: "Anfrage für Geschäftskunden" },
      ]}>
      <p className="text-lg text-muted">
        Wie viele Fahrzeuge, in welchem Zustand, in welchem Rhythmus und mit
        welcher Logistik – das bestimmt den Preis. Am schnellsten klären wir das
        am Telefon oder per WhatsApp.
      </p>
      <div className="mt-8 grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {segments.map(([t, d, id]) => (
          <section key={t} id={id} className="scroll-mt-28 border-t border-line pt-5 pb-3" aria-labelledby={`${id}-heading`}>
            <h2 id={`${id}-heading`} className="font-display text-2xl tracking-tight">{t}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
          </section>
        ))}
      </div>
      <section id="b2b-anfrage" className="mt-12 rounded-card border border-line bg-surface p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.16em] text-muted font-medium">Anfrage für Geschäftskunden</p>
        <h2 className="heading-3 mt-2 text-xl sm:text-2xl">Fuhrparkliste oder Ausschreibung senden</h2>
        <p className="mt-3 text-sm text-muted leading-relaxed">
          Sende uns deine Fahrzeugliste, den gewünschten Leistungsumfang und deine Terminvorgaben per E-Mail. Wir kalkulieren nach Anzahl und Zustand der Fahrzeuge und stimmen Abholung und Rückgabe mit dir ab.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={`mailto:${site.email}?subject=B2B-Anfrage%20Fahrzeugaufbereitung`} className={ctaPrimary}>
            E-Mail mit Fuhrparkliste senden
          </a>
          <a href={site.phoneHref} className={ctaGhost}>
            Direkter Ansprechpartner: {site.phoneDisplay}
          </a>
        </div>
      </section>
      </EditorialLayout>
    </main>
  );
}
