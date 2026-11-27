import { Link } from "@tanstack/react-router";
import { CarFront, ClipboardCheck, KeyRound } from "lucide-react";
import { BOOKING_JUMP, focusBookingHeading } from "@/lib/booking-anchor-focus";

const steps = [
  {
    icon: ClipboardCheck,
    title: "Besichtigung & Abstimmung",
    text: "Wir schauen uns den Zustand deines Autos an und besprechen mit dir, welche Arbeiten du dir wünschst.",
  },
  {
    icon: KeyRound,
    title: "Abholung & Reparatur",
    text: "Du übergibst uns den Schlüssel. Wir holen dein Auto ab und stimmen die vereinbarten Arbeiten mit unseren Partnerbetrieben ab.",
  },
  {
    icon: CarFront,
    title: "Rückgabe & Übergabe",
    text: "Wir bringen dir dein Fahrzeug frisch aufbereitet zurück. Gemeinsam schauen wir uns das Ergebnis an – für das Gefühl, wieder in ein neues Auto zu steigen.",
  },
];

export function FullService() {
  return (
    <section className="sec" id="full-service" aria-labelledby="full-service-heading">
      <div className="wrap">
        <div className="grid items-end gap-x-16 gap-y-4 lg:grid-cols-[1.2fr_1fr]" data-reveal>
          <div>
            <p className="label label--rule">Hol- &amp; Bringservice</p>
            <h2 className="h2 chrome" id="full-service-heading">Full-Service für dein Fahrzeug.</h2>
          </div>
          <p className="muted max-w-prose pb-5">
            Eine Delle in der Tür, ein Kratzer im Lack? Für Lackschäden, Dellen und Smart Repair
            arbeiten wir mit spezialisierten Partnerbetrieben zusammen. Dein Ansprechpartner bleibt White-Gloss.
          </p>
        </div>
        <ol className="steps2" aria-label="So läuft der Full-Service ab">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <li key={title} data-reveal>
              <div className="mb-5 flex items-center gap-3 text-[var(--ink-3)]" aria-hidden="true">
                <Icon size={22} strokeWidth={1.4} />
                <span className="text-xs tabular-nums">0{index + 1}</span>
              </div>
              <h3 className="h3">{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link to="/" hash="rundum-anfrage" hashScrollIntoView={BOOKING_JUMP} onClick={focusBookingHeading} className="btn btn--solid">
            Angebot anfragen <span aria-hidden="true">→</span>
          </Link>
          <p className="muted small max-w-prose">
            Preise nach Absprache, nach Besichtigung und Abstimmung mit den Partnerbetrieben.
          </p>
        </div>
      </div>
    </section>
  );
}
