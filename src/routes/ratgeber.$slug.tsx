import { BOOKING_JUMP } from "@/lib/booking-anchor-focus";
import { EditorialLayout } from "@/components/editorial-layout";
import { serializeJsonLd } from "@/lib/json-ld";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { ctaPrimary } from "@/components/ui";
import type { Article } from "@/data/ratgeber";
import { listPublishedCms } from "@/lib/cms.functions";
import { cmsPublishedDate } from "@/lib/cms-date";
import { logoJsonLdHref } from "@/data/media-src";
import { services, site } from "@/data/site";
import { pageHead } from "@/lib/seo";
import { consolidatedServices } from "@/lib/seo-policy";
import { articleBookingSelection, articleNavigation } from "@/lib/article-navigation";

const pickupGuideSlugs = new Set([
  "fahrzeugaufbereitung-horb-am-neckar",
  "hol-und-bringservice",
  "keramikversiegelung-kosten",
  "keramikversiegelung-langzeitschutz",
  "leasingrueckgabe-aufbereitung-vermeiden-mehrkosten",
]);

type PublishedArticle = Omit<Article, "date"> & { date?: string };

async function loadCmsArticle(slug: string): Promise<PublishedArticle> {
  const rows = await listPublishedCms({ data: { kind: "blog" } });
  const row = rows.find((r) => r.slug === slug);
  if (!row) throw notFound();
  let excerpt = row.body.slice(0, 160);
  try {
    excerpt = (JSON.parse(row.extra) as { note?: string }).note || excerpt;
  } catch {
    /* ignore */
  }
  return {
    slug: row.slug ?? slug,
    title: row.title,
    excerpt,
    date: cmsPublishedDate(row.created_at),
    image: "/media/hero.webp",
    minutes: 4,
    sections: [{ heading: row.title, paragraphs: [row.body] }],
  };
}

export const Route = createFileRoute("/ratgeber/$slug")({
  loader: async ({ params }) => {
    const { articles, getArticle } = await import("@/data/ratgeber");
    const article = getArticle(params.slug) ?? await loadCmsArticle(params.slug);
    const related = article.related ?? articleNavigation[article.slug]?.related;
    const matches = related
      ? related.flatMap((slug) => articles.filter((entry) => entry.slug === slug))
      : articles.filter((entry) => entry.slug !== article.slug).slice(0, 3);
    return { ...article, others: matches.map(({ title, slug }) => ({ title, slug })) };
  },
  head: ({ loaderData }) =>
    pageHead({
      title: loaderData?.seoTitle ?? articleNavigation[loaderData?.slug ?? ""]?.title ?? `${loaderData?.title ?? "Ratgeber"} | ${site.name}`,
      description: (loaderData?.seoTitle ? loaderData.seoExcerpt : loaderData?.excerpt) ?? "",
      path: `/ratgeber/${loaderData?.slug ?? ""}`,
      image: loaderData?.image,
    }),
  component: ArticlePage,
});

function ArticlePage() {
  const a = Route.useLoaderData();
  const guide = articleNavigation[a.slug];
  const request = articleBookingSelection(a.slug);
  const service = services.find((s) => s.slug === guide?.service);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${site.origin}/ratgeber/${a.slug}#article`,
        mainEntityOfPage: `${site.origin}/ratgeber/${a.slug}`,
        inLanguage: "de-DE",
        headline: a.title,
        datePublished: a.date,
        author: { "@id": `${site.origin}/#betrieb` },
        publisher: { "@id": `${site.origin}/#betrieb` },
        image: `${site.origin}${a.image}`,
        description: a.excerpt,
        ...(a.category ? { articleSection: a.category } : {}),
        ...(a.sources?.length ? { citation: a.sources.map((source) => source.url) } : {}),
      },
      {
        "@type": "Organization",
        "@id": `${site.origin}/#betrieb`,
        name: site.legalName,
        url: site.origin,
        logo: { "@type": "ImageObject", url: `${site.origin}${logoJsonLdHref}` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Startseite", item: site.origin },
          { "@type": "ListItem", position: 2, name: "Ratgeber", item: `${site.origin}/ratgeber` },
          { "@type": "ListItem", position: 3, name: a.title, item: `${site.origin}/ratgeber/${a.slug}` },
        ],
      },
    ],
  };

  return (
    <main id="main-content" tabIndex={-1}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <PageHero
        src={a.image}
        alt={a.imageAlt ?? a.title}
        kicker={a.category ? `Ratgeber · ${a.category}` : "Ratgeber"}
        title={a.title}
        lead={a.excerpt}
        crumbs={[
          { label: "Startseite", to: "/" },
          { label: "Ratgeber", to: "/ratgeber" },
          { label: a.title },
        ]}
        actions={
          <Link to={request.leistung ? "/fahrzeug-zustand" : "/"} search={request} hash="buchung" hashScrollIntoView={BOOKING_JUMP} className={ctaPrimary}>
            Termin anfragen
          </Link>
        }
      />
      <EditorialLayout links={[
        ...a.sections.map((section, i) => ({ id: `abschnitt-${i + 1}`, label: section.heading })),
        { id: "weitere-beitraege", label: "Weitere Beiträge" },
      ]}>
        <article>
        {guide ? <p className="mb-6 text-lg text-fg">{guide.question}</p> : null}
        {a.category && a.date ? (
          <p className="kicker">
            White-Gloss Detailing · <time dateTime={a.date}>{new Date(a.date).toLocaleDateString("de-DE", { dateStyle: "long", timeZone: "UTC" })}</time> · {a.minutes} Min.
          </p>
        ) : (
          <p className="text-sm text-muted">Alle genannten Einstiegspreise gelten für die Kompaktklasse und verstehen sich {site.vatNote} Fahrzeuggröße und Zustand bestimmen den Aufwand; den verbindlichen Preis stimmen wir vor Beginn mit dir ab.</p>
        )}
        {a.sections.map((s, i) => (
          <section id={`abschnitt-${i + 1}`} key={i} className="mt-9 border-t border-line pt-7">
            <h2 className="font-display text-2xl">{s.heading}</h2>
            {s.paragraphs.map((p) => (
              <p key={p} className="mt-3 leading-relaxed text-muted">
                {p}
              </p>
            ))}
          </section>
        ))}
        {a.sources?.length ? (
          <aside aria-label="Weiterführende Quellen" className="mt-8 border-l border-line pl-4 text-sm text-muted">
            {a.sources.map((source) => <a key={source.url} className="inline-flex min-h-11 items-center underline underline-offset-4" href={source.url}>{source.label}</a>)}
          </aside>
        ) : null}
        {a.link ? (
          <p className="mt-8 flex flex-wrap gap-x-6 text-sm">
            <Link to={a.link.path as never} className="inline-flex min-h-11 items-center underline underline-offset-4">{a.link.label}</Link>
            <Link to="/faq" className="inline-flex min-h-11 items-center underline underline-offset-4">Häufige Fragen</Link>
            <Link to="/ratgeber" className="inline-flex min-h-11 items-center underline underline-offset-4">Alle Beiträge</Link>
          </p>
        ) : null}
        {service ? <p className="mt-8 leading-relaxed text-muted">
          Leistungsumfang und Grenzen findest du unter {Object.hasOwn(consolidatedServices, service.slug)
            ? <Link to={consolidatedServices[service.slug] as never} className="underline underline-offset-4">{service.nav}</Link>
            : <Link to="/leistungen/$slug" params={{ slug: service.slug }} className="underline underline-offset-4">{service.nav}</Link>}.
          {" "}{request.paket || request.leistung ? "Die Anfrage übernimmt das zugehörige Paket oder dein Interesse an dieser individuellen Leistung." : "Wähle in der Anfrage das passende Paket und deinen Abholort aus."}
          {pickupGuideSlugs.has(a.slug) ? (
            <>
              {" "}Abholorte und Preise stehen in der{" "}
              <Link to="/abholservice" className="underline underline-offset-4">
                Abholübersicht
              </Link>
              .
            </>
          ) : null}
        </p> : null}
        <Link
          to={request.leistung ? "/fahrzeug-zustand" : "/"}
          search={request}
          hash="buchung" hashScrollIntoView={BOOKING_JUMP}
          className={`${ctaPrimary} mt-12`}
        >
          Termin anfragen
        </Link>
        <h2 id="weitere-beitraege" className="mt-16 font-display text-2xl">Weitere Beiträge</h2>
        <ul className="mt-4 space-y-2">
          {a.others.map((o) => (
            <li key={o.slug}>
              <Link
                to="/ratgeber/$slug"
                params={{ slug: o.slug }}
                className="inline-flex min-h-11 items-center text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
              >
                {o.title}
              </Link>
            </li>
          ))}
        </ul>
        </article>
      </EditorialLayout>
    </main>
  );
}
