import { serializeJsonLd } from "@/lib/json-ld";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { ctaGhost, ctaPrimary } from "@/components/ui";
import { faqs, site } from "@/data/site";
import editorial from "@/data/editorial-guides.json";
import { listPublishedCms } from "@/lib/cms.functions";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/faq")({
  loader: async () => {
    try {
      return { extra: await listPublishedCms({ data: { kind: "faq" } }) };
    } catch {
      return { extra: [] as Awaited<ReturnType<typeof listPublishedCms>> };
    }
  },
  component: FaqPage,
  head: () =>
    pageHead({
      title: editorial.faq.title,
      description: editorial.faq.description,
      path: "/faq",
      preloadShot: "atelier",
    }),
});

function FaqPage() {
  const { extra } = Route.useLoaderData();
  const extraFaqs = extra.map((row) => {
    let group = "Aktuell";
    try {
      group = (JSON.parse(row.extra) as { note?: string }).note || group;
    } catch {
      /* ignore */
    }
    return { group, q: row.title, a: row.body };
  });
  type Question = { q: string; a: string; link?: { path: string; label: string } };
  const seen = new Set<string>();
  const dedupe = (items: Question[]) =>
    items.filter(({ q }) => {
      const key = q
        .toLocaleLowerCase("de-DE")
        .normalize("NFKC")
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[?.!]+$/, "");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  const base = [...faqs, ...extraFaqs];
  const groups = [
    ...editorial.faq.groups.map((group) => ({ ...group, items: dedupe(group.items) })),
    ...[...new Set(base.map((f) => f.group))].map((title, i) => ({
      id: title === "Dauer" ? "faq-dauer" : `faq-basis-${i}`,
      title,
      items: dedupe(base.filter((f) => f.group === title)),
    })),
  ].filter((group) => group.items.length > 0);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: groups
      .flatMap((group) => group.items)
      .map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
  };

  return (
    <main id="main-content" tabIndex={-1}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <PageHero
        shot="atelier"
        alt="Werkstatt von White-Gloss Detailing in Horb am Neckar"
        kicker="Antworten vorab"
        title="Häufige Fragen zur Fahrzeugaufbereitung"
        lead={editorial.faq.lead}
        crumbs={[{ label: "Startseite", to: "/" }, { label: "Häufige Fragen" }]}
        actions={
          <>
            <Link to="/" hash="buchung" className={ctaPrimary}>
              Termin anfragen
            </Link>
            <a href={site.phoneHref} className={ctaGhost}>
              {site.phoneDisplay}
            </a>
          </>
        }
      />
      <div className="wrap">
        <div className="grid items-start gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.3fr)] lg:gap-16 lg:py-20">
          <nav aria-label="FAQ-Themen" className="border-t border-line pt-5">
            <p className="kicker">Direkt zur Antwort</p>
            <ul className="mt-3 grid grid-cols-2 gap-x-5 border-b border-line pb-3 lg:grid-cols-1">
              {groups.map((group) => (
                <li key={group.id}>
                  <a
                    className="inline-flex min-h-11 items-center py-1.5 text-sm text-muted hover:text-fg hover:underline underline-offset-4"
                    href={`#${group.id}`}
                  >
                    {group.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="min-w-0">
            {groups.map((g) => (
              <section key={g.id} id={g.id} className="mb-12 scroll-mt-28">
                <h2 className="font-display text-3xl sm:text-4xl">{g.title}</h2>
                <div className="mt-5 divide-y divide-line border-y border-line">
                  {g.items.map((f) => (
                    <details key={f.q} className="group py-2">
                      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 text-left font-display text-xl tracking-tight">
                        {f.q}
                        <span
                          className="shrink-0 text-subtle motion-safe:transition-transform motion-safe:duration-200 group-open:rotate-45"
                          aria-hidden
                        >
                          +
                        </span>
                      </summary>
                      <p className="mb-4 mt-2 max-w-[65ch] leading-relaxed text-muted">{f.a}</p>
                      {f.link ? (
                        <Link
                          to={f.link.path as never}
                          className="mt-1 inline-flex min-h-11 items-center text-sm underline underline-offset-4"
                        >
                          {f.link.label}
                        </Link>
                      ) : null}
                    </details>
                  ))}
                </div>
              </section>
            ))}
            <p className="mt-12 text-sm text-muted">
              Du möchtest genauer nachlesen? Im{" "}
              <Link to="/ratgeber" className="underline underline-offset-4 hover:text-fg">
                Blog &amp; Ratgeber
              </Link>{" "}
              erklären wir, was du selbst machen kannst und wann sich Aufbereitung lohnt.
            </p>
            <p className="mt-12 text-sm text-muted">
              Deine Frage war nicht dabei? Persönlich:{" "}
              <a href={site.phoneHref} className="underline hover:text-fg">
                {site.phoneDisplay}
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
