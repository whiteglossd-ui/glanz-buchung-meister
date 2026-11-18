import { createFileRoute, Link } from "@tanstack/react-router";
import { BookingStatus } from "@/components/booking-status";
import { site } from "@/data/site";
import { statusLinkCopy, statusLinkState, statusPageHeading } from "@/lib/booking-status-view";

export const Route = createFileRoute("/auftragsstatus")({
  validateSearch: (search: Record<string, unknown>) => ({
    vorgang:
      typeof search.vorgang === "string" && /^WG-\d{1,10}$/.test(search.vorgang)
        ? search.vorgang
        : "",
    token: typeof search.token === "string" ? search.token.slice(0, 100) : "",
  }),
  head: () => ({
    meta: [
      { title: "Ihr Auftragsstatus | White Gloss" },
      { name: "robots", content: "noindex,nofollow" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: StatusPage,
});

function StatusPage() {
  const { vorgang, token } = Route.useSearch();
  const state = statusLinkState(vorgang, token);
  const lead =
    state === "ready"
      ? "Preis, Termin und der nächste Schritt. Dieser Link ist persönlich."
      : state === "incomplete"
        ? "Dieser Link reicht nicht aus, um den Auftrag zu öffnen."
        : "Ohne den persönlichen Link aus der Eingangsbestätigung bleibt der Status geschlossen.";

  return (
    <main id="main-content" className="page-doc mx-auto max-w-3xl px-4 pb-24 sm:px-6" tabIndex={-1}>
      <p className="kicker">Auftrag</p>
      <h1 className="heading-2 mt-4">{statusPageHeading(vorgang)}</h1>
      <p className="mt-5 max-w-2xl leading-relaxed text-muted">{lead}</p>
      {state === "ready" ? (
        <BookingStatus id={Number(vorgang.slice(3))} token={token} />
      ) : (
        <StatusGate state={state} />
      )}
    </main>
  );
}
function StatusGate({ state }: { state: "missing" | "incomplete" }) {
  const copy = statusLinkCopy[state];
  return (
    <section aria-labelledby="status-gate-title" className="mt-10 border border-line bg-surface">
      <div className="border-b border-line px-5 py-5 sm:px-6">
        <h2 id="status-gate-title" className="font-display text-2xl tracking-tight">
          {copy.title}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{copy.body}</p>
      </div>
      <ol className="divide-y divide-line">
        {copy.steps.map(([title, text], index) => (
          <li key={title} className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 px-5 py-5 sm:px-6">
            <span className="font-display text-2xl tabular-nums text-subtle">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="font-display text-xl tracking-tight">{title}</p>
            <p className="col-start-2 text-sm leading-relaxed text-muted">{text}</p>
          </li>
        ))}
      </ol>
      <dl className="grid gap-6 border-t border-line px-5 py-5 sm:grid-cols-2 sm:px-6">
        <div>
          <dt className="text-xs uppercase tracking-[0.18em] text-subtle">Telefon</dt>
          <dd className="mt-2">
            <a href={site.phoneHref} className="text-fg hover:text-accent">
              {site.phoneDisplay}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.18em] text-subtle">E-Mail</dt>
          <dd className="mt-2">
            <a href={`mailto:${site.bookingEmail}`} className="text-fg hover:text-accent">
              {site.bookingEmail}
            </a>
          </dd>
        </div>
      </dl>
      <p className="border-t border-line px-5 py-4 text-sm text-muted sm:px-6">
        <Link to="/kontakt" className="underline hover:text-fg">
          Kontakt und Anfahrt
        </Link>
      </p>
    </section>
  );
}
