import { site } from "@/data/site";
import { ctaGhost, ctaPrimary } from "./ui";
import { LazyRundumInquiry } from "./lazy-rundum-inquiry";
import "@/styles/rundum-service.css";

export function RundumServiceIntro() {
  const whatsapp = `${site.whatsappHref}&text=${encodeURIComponent("Hallo, ich interessiere mich für euren Rundum-Service für mein Auto.")}`;
  return (
    <section
      className="rundum-service-intro mx-auto max-w-7xl px-4 sm:px-6"
      aria-labelledby="rundum-heading"
    >
      <header>
        <p className="kicker">Rundum-Service für dein Auto</p>
        <h2 id="rundum-heading" className="font-display">
          Du gibst uns den Schlüssel.
          <br />
          Wir kümmern uns um den Rest.
        </h2>
      </header>
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-muted sm:text-base">
          Wir holen dein Auto ab, bereiten es auf und bringen es zurück. Auch Dellen, Lackschäden,
          zerkratzte Felgen oder Brandlöcher? Wir kümmern uns mit unseren Partnerbetrieben darum.
          Was gemacht wird und was es kostet, besprechen wir vorher mit dir.
        </p>
        <p className="font-display text-xl">Ein Ansprechpartner. Eine Rechnung. Kein Stress.</p>
        <div className="rundum-service-actions">
          <a href="#rundum-anfrage" className={ctaPrimary}>
            Rundum-Service anfragen
          </a>
          <a href={whatsapp} className={ctaGhost} target="_blank" rel="noopener noreferrer">
            Lieber per WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

export function RundumServiceInquiry() {
  return (
    <section
      id="rundum-anfrage"
      className="rundum-request section mx-auto max-w-7xl px-4 sm:px-6"
      aria-labelledby="rundum-anfrage-heading"
    >
      <header className="max-w-2xl">
        <p className="kicker">Unverbindlich anfragen</p>
        <h2 id="rundum-anfrage-heading" className="heading-2 mt-3" tabIndex={-1}>
          Dein Rundum-Service.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Sag uns kurz, was dein Auto braucht. Alles Weitere stimmen wir persönlich mit dir ab.
        </p>
      </header>
      <div className="mt-8 max-w-3xl">
        <LazyRundumInquiry />
      </div>
    </section>
  );
}
