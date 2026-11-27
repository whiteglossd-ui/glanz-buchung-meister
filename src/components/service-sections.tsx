import { ChevronDown } from "lucide-react";
import { faqs, processSteps, type ServicePage } from "@/data/site";

export function ServiceSteps({ service }: { service: ServicePage }) {
  if (service.pendingApproval) return null;
  const steps = service.steps ?? (service.slug === "smart-repair" ? [
    { title: "Schaden begutachten", text: "Bei kleinen Stellen reicht oft ein Foto zur ersten Einschätzung." },
    { title: "Verfahren und Angebot abstimmen", text: "Wir besprechen mit dir, welcher Meisterbetrieb die Arbeit ausführt und ob lackfreies Ausbeulen reicht oder Lackierarbeiten nötig sind." },
    { title: "Reparatur beauftragen", text: "Du erfährst Umfang und Preis, bevor du zusagst." },
  ] : processSteps);
  return (
    <section id="ablauf" className="mt-12" aria-labelledby="ablauf-heading">
      <h2 id="ablauf-heading" className="font-display text-2xl">Ablauf</h2>
      <ol className="mt-5 divide-y divide-line">
        {steps.map((step, i) => (
          <li key={step.title} className="grid grid-cols-[2.2rem_minmax(0,1fr)] gap-3 py-5">
            <span aria-hidden="true" className="font-display text-xl text-subtle">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h3 className="font-display text-xl">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ServiceQuestions({ service }: { service: ServicePage }) {
  if (service.pendingApproval) return null;
  const matching = faqs.filter((faq) => faq.group === service.seoNav);
  const questions = [...matching, ...faqs.filter((faq) => faq.group === "Abholservice")].slice(0, 3);
  return (
    <section id="fragen" className="editorial-faq mt-12" aria-labelledby="fragen-heading">
      <h2 id="fragen-heading" className="font-display text-2xl">Häufige Fragen</h2>
      <div className="mt-5">
        {questions.map(({ q, a }) => (
          <details key={q}>
            <summary>{q}<ChevronDown className="size-4 shrink-0" aria-hidden="true" /></summary>
            <p className="leading-relaxed text-muted">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
