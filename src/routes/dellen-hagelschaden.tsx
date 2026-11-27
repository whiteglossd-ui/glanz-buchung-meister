import { BOOKING_JUMP } from "@/lib/booking-anchor-focus";
import { EditorialLayout } from "@/components/editorial-layout";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PhotoInquiry } from "@/components/photo-inquiry";
import { PageHero } from "@/components/page-hero";
import { WhatsAppPhotoCta } from "@/components/whatsapp-photo-cta";
import { ctaGhost, ctaPrimary } from "@/components/ui";
import { site } from "@/data/site";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/dellen-hagelschaden")({
  component: DellenPage,
  head: () =>
    pageHead({
      title: `Dellen & Hagelschaden: Foto-Begutachtung | ${site.name}`,
      description:
        "Dellenziehen, Hagelschaden und Lackierarbeiten mit Meister-Partnern. Erste Einschätzung per Foto, verbindlicher Preis nach Prüfung.",
      path: "/dellen-hagelschaden",
      preloadShot: "dellen",
    }),
});

function DellenPage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <PageHero
        shot="dellen"
        alt="Parkdelle unter Streiflicht vor der Begutachtung"
        kicker="Smart Repair"
        title="Dellen und Hagelschäden prüfen lassen."
        lead="Wir koordinieren Dellenziehen und Lackierarbeiten mit Meister-Partnern. Lackfreies Ausbeulen ist möglich, wenn Schaden und Lackzustand es zulassen."
        crumbs={[
          { label: "Startseite", to: "/" },
          { label: "Leistungen", to: "/leistungen" },
          { label: "Dellen" },
        ]}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link to="/dellen-hagelschaden" hash="buchung" hashScrollIntoView={BOOKING_JUMP} className={ctaPrimary}>
              Begutachtung anfragen
            </Link>
            <a href={site.whatsapp} className={ctaGhost} target="_blank" rel="noopener noreferrer">
              Lieber per WhatsApp
            </a>
          </div>
        }
      />
      <EditorialLayout links={[
        { id: "schaden", label: "Schäden und Verfahren" },
        { id: "fotos", label: "Fotos zur Einschätzung" },
        { id: "buchung", label: "Begutachtung anfragen" },
      ]}>
        <h2 id="schaden" className="mb-5 font-display text-2xl">Schäden und Verfahren</h2>
        <p className="text-sm text-muted leading-relaxed">
          Bei kleinen Stellen reicht oft ein Foto für eine erste Einschätzung. Wir besprechen mit
          dir, welcher Meisterbetrieb die Arbeit ausführt und ob lackfreies Ausbeulen reicht oder
          Lackierarbeiten nötig sind. Du erfährst Umfang und Preis, bevor du zusagst.
        </p>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
          {[
            ["Parkdellen", "Dellen durch Türen und enge Parkplätze"],
            ["Karosseriedellen", "Kleinere Verformungen an zugänglichen Bauteilen"],
            ["Hagelschäden", "Einzelne oder zahlreiche Hageldellen"],
            ["Lackierarbeiten", "Bei beschädigtem Lack prüft ein Meister-Partner die passende Reparatur"],
            ["Foto-Begutachtung", "Bei kleinen Schäden häufig ohne ersten Vor-Ort-Termin möglich"],
          ].map(([t, d]) => (
            <li key={t} className="border-t border-line pt-4 pb-3">
              <p className="font-display text-xl tracking-tight">{t}</p>
              <p className="mt-2 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ul>
        <div id="fotos" className="mt-12">
          <WhatsAppPhotoCta />
        </div>
        <div id="buchung" className="mt-12">
          <PhotoInquiry
            title="Begutachtung anfragen"
            hint="Beschreib kurz den Schaden. Fotos ergänzt du nach der Anfrage in deinem Kundenbereich."
          />
        </div>
      </EditorialLayout>
    </main>
  );
}
