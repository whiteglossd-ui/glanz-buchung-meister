import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { ctaGhost, ctaPrimary } from "@/components/ui";
import { site } from "@/data/site";
import { pageHead } from "@/lib/seo";
import { InquiryConfirmation } from "@/components/inquiry-confirmation";

type ThanksSearch = {
  vorgang?: string;
  uebergabe?: "panel" | "ausstehend";
  mail?: string;
};

function asVorgang(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const ref = value.replace(/['"]/g, "").trim();
  return /^WG-\d+$/.test(ref) ? ref : undefined;
}

export const Route = createFileRoute("/danke")({
  validateSearch: (search: Record<string, unknown>): ThanksSearch => ({
    vorgang: asVorgang(search.vorgang),
    uebergabe:
      search.uebergabe === "panel" || search.uebergabe === "ausstehend"
        ? search.uebergabe
        : undefined,
    mail: ["queued", "accepted", "unknown", "failed", "not_configured"].includes(
      String(search.mail),
    )
      ? String(search.mail)
      : undefined,
  }),
  component: ThanksPage,
  head: () =>
    pageHead({
      title: `Anfrage erhalten | ${site.name}`,
      description: "Ihre Terminanfrage ist eingegangen.",
      path: "/danke",
      robots: "noindex,nofollow",
    }),
});

function ThanksPage() {
  const { vorgang, uebergabe, mail } = Route.useSearch();

  const steps = [
    [
      "01",
      "Anfrage eingegangen",
      "Nach dem Eingang prüfen wir Ihre Angaben. Preis und Wunschtermin sind noch nicht verbindlich bestätigt.",
    ],
    [
      "02",
      "Angaben, Preis und Termin prüfen",
      "Wir klären die Leistungen, den vollständigen Endpreis und den Termin. Fotos können Sie im geschützten Kundenbereich ergänzen. Bei Rückfragen melden wir uns bei Ihnen.",
    ],
    [
      "03",
      "Angebot und Termin bestätigen",
      "Sie erhalten Ihr persönliches Angebot mit Leistungen, Preis und Termin. Mit Ihrer Unterschrift bestätigen Sie das Angebot und den darin genannten Termin gemeinsam.",
    ],
    [
      "04",
      "Aufbereitung und Rechnung",
      "Wir führen die vereinbarten Arbeiten aus. Die Rechnung erhalten Sie nach erbrachter Leistung; dann wird die Zahlung fällig.",
    ],
  ];

  return (
    <main id="main-content" tabIndex={-1}>
      <PageHero
        shot="atelier"
        alt="Werkstatt von White Gloss in Horb am Neckar"
        kicker="Anfrage eingegangen"
        title="Danke. Anfrage erhalten."
        lead="Vielen Dank für Ihre Anfrage. Wir prüfen Ihre Angaben und stimmen Angebot, Preis und Termin persönlich mit Ihnen ab. Die Anfrage ist unverbindlich."
        crumbs={[{ label: "Startseite", to: "/" }, { label: "Danke" }]}
        actions={
          <>
            <Link to="/" className={ctaPrimary}>
              Zur Startseite
            </Link>
            <a href={site.whatsapp} className={ctaGhost} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          </>
        }
      />

      <section className="section mx-auto max-w-3xl px-4 sm:px-6">
        {vorgang && uebergabe ? (
          <InquiryConfirmation
            reference={vorgang}
            panelSaved={uebergabe === "panel"}
            emailStatus={mail}
          />
        ) : (
          <p className="border border-line bg-surface px-5 py-4 text-sm text-muted">
            Fotos kannst du nach deiner Anfrage in deinem Kundenbereich ergänzen.{" "}
            <a
              href="https://panel.white-gloss.de/auth/customer"
              className="underline hover:text-fg"
            >
              Zum Kundenbereich
            </a>
          </p>
        )}

        <ol className="mt-12 divide-y divide-line border-y border-line">
          {steps.map(([n, title, text]) => (
            <li key={n} className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 py-6">
              <span className="font-display text-2xl tabular-nums text-subtle">{n}</span>
              <p className="font-display text-xl tracking-tight">{title}</p>
              <p className="col-start-2 text-sm leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ol>

        <dl className="mt-12 grid gap-6 sm:grid-cols-2">
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

        <p className="mt-14 border-t border-line pt-8 text-sm text-muted">
          Hinweise zu Ihrem Widerrufsrecht finden Sie in der{" "}
          <Link to="/widerruf" className="underline hover:text-fg">
            Widerrufsbelehrung
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
