import { useEffect, useRef, useState } from "react";
import { getBookingStatus } from "@/lib/booking-status.functions";
import { formatStatusMoney } from "@/lib/booking-status-view";
import { ctaGhost, ctaPrimary } from "@/components/ui";
import { site } from "@/data/site";

const berlin = { timeZone: "Europe/Berlin" } as const;

function appointmentLabel(iso: string) {
  return new Date(iso).toLocaleString("de-DE", {
    ...berlin,
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function updatedLabel(iso: string) {
  return new Date(iso).toLocaleString("de-DE", berlin);
}

export function BookingStatus({ id, token }: { id: number; token?: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof getBookingStatus>>>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState<"idle" | "done" | "unavailable">("idle");
  const [announced, setAnnounced] = useState("");
  const previousAnnouncement = useRef("");

  useEffect(() => {
    let active = true;
    const refresh = () =>
      getBookingStatus({ data: { id, token } })
        .then((value) => {
          if (!active) return;
          setData(value);
          setFailed(!value);
        })
        .catch(() => {
          if (active) setFailed(true);
        });
    void refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      void refresh();
    }, 15000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [id, token]);

  const message = !data
    ? failed
      ? "Der Status ist hier nicht verfügbar. Öffnen Sie den persönlichen Link aus Ihrer Eingangsbestätigung."
      : "Status wird geladen."
    : failed
      ? "Die Aktualisierung ist gerade nicht möglich. Angezeigt wird der zuletzt geladene Stand."
      : data.status;

  useEffect(() => {
    if (previousAnnouncement.current === message) return;
    previousAnnouncement.current = message;
    setAnnounced(message);
  }, [message]);

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied("done");
    } catch {
      setCopied("unavailable");
    }
  }

  return (
    <section
      aria-labelledby="booking-status-heading"
      aria-busy={!data && !failed}
      className="my-8 border border-line bg-surface"
    >
      <p className="sr-only" role="status">
        {announced}
      </p>
      <header className="border-b border-line px-5 py-5 sm:px-6">
        <p className="text-xs uppercase tracking-[0.18em] text-subtle">Aktueller Stand</p>
        <h2 id="booking-status-heading" className="mt-2 font-display text-2xl tracking-tight">
          {!data ? (failed ? "Status nicht verfügbar" : "Status wird geladen") : data.status}
        </h2>
        {!data && !failed ? (
          <p className="mt-3 text-sm text-muted">Wir fragen den aktuellen Stand ab.</p>
        ) : null}
        {!data && failed ? (
          <div className="mt-3 max-w-xl space-y-3 text-sm leading-relaxed text-muted">
            <p>{message}</p>
            <p>
              <a href={site.phoneHref} className="text-fg hover:text-accent">
                {site.phoneDisplay}
              </a>
              {" · "}
              <a href={`mailto:${site.bookingEmail}`} className="text-fg hover:text-accent">
                {site.bookingEmail}
              </a>
            </p>
          </div>
        ) : null}
      </header>

      {!data && !failed ? (
        <div className="space-y-3 px-5 py-5 sm:px-6" aria-hidden="true">
          <div className="h-3 w-2/3 animate-pulse rounded-sm bg-line motion-reduce:animate-none" />
          <div className="h-3 w-1/2 animate-pulse rounded-sm bg-line motion-reduce:animate-none" />
          <div className="h-3 w-5/12 animate-pulse rounded-sm bg-line motion-reduce:animate-none" />
        </div>
      ) : null}

      {data ? (
        <>
          <dl className="divide-y divide-line">
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[14rem_1fr] sm:items-baseline sm:px-6">
              <dt className="text-xs uppercase tracking-[0.18em] text-subtle">
                {data.fixed ? "Bestätigter Fixpreis" : "Ab-Preis laut Anfrage"}
              </dt>
              <dd className="font-display text-3xl tabular-nums tracking-tight">
                {!data.fixed && data.amount === 0 ? "Preis wird ermittelt" : formatStatusMoney(data.amount)}
              </dd>
            </div>
            {data.scheduledFor ? (
              <div className="grid gap-1 px-5 py-4 sm:grid-cols-[14rem_1fr] sm:px-6">
                <dt className="text-xs uppercase tracking-[0.18em] text-subtle">
                  {data.fixed ? "Termin im geprüften Angebot" : "Wunschtermin (noch unbestätigt)"}
                </dt>
                <dd>
                  <time dateTime={data.scheduledFor}>{appointmentLabel(data.scheduledFor)}</time>
                </dd>
              </div>
            ) : null}
            {data.updatedAt ? (
              <div className="grid gap-1 px-5 py-4 sm:grid-cols-[14rem_1fr] sm:px-6">
                <dt className="text-xs uppercase tracking-[0.18em] text-subtle">Zuletzt abgeglichen</dt>
                <dd>
                  <time dateTime={data.updatedAt}>{updatedLabel(data.updatedAt)}</time>
                </dd>
              </div>
            ) : null}
          </dl>
          {data.customerStep ? (
            <p className="border-t border-line px-5 py-5 text-sm leading-relaxed text-muted sm:px-6">
              {data.customerStep.text}
            </p>
          ) : null}
          {failed ? (
            <p className="border-t border-line px-5 py-4 text-sm text-muted sm:px-6">{message}</p>
          ) : null}
          <div className="flex flex-wrap gap-3 border-t border-line px-5 py-5 sm:px-6">
            {data.publicUrl && data.customerStep?.linkLabel ? (
              <a className={ctaPrimary} href={data.publicUrl} target="_blank" rel="noopener noreferrer">
                {data.customerStep.linkLabel}
                <span className="sr-only">, öffnet in neuem Tab</span>
              </a>
            ) : null}
            <a className={data.publicUrl && data.customerStep?.linkLabel ? ctaGhost : ctaPrimary} href={data.statusUrl}>
              Persönlichen Statuslink öffnen
            </a>
            <button type="button" className={ctaGhost} onClick={() => void copyLink(data.statusUrl)}>
              {copied === "done" ? "Link kopiert" : "Link kopieren"}
            </button>
          </div>
          {copied === "unavailable" ? (
            <p className="border-t border-line px-5 py-4 text-sm text-muted sm:px-6">
              Kopieren ist in diesem Browser nicht möglich. Öffnen Sie den persönlichen Statuslink und speichern Sie die Adresse.
            </p>
          ) : null}
          {copied === "done" ? (
            <p className="sr-only" role="status">
              Link kopiert.
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
