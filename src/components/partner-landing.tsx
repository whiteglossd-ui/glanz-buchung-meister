import { Link } from "@tanstack/react-router";
import { useState, type KeyboardEvent } from "react";
import type { LucideIcon } from "lucide-react";
import { PageCrumbs } from "@/components/page-hero";
import { PhotoInquiry } from "@/components/photo-inquiry";
import { WhatsAppPhotoCta } from "@/components/whatsapp-photo-cta";
import { cities, site } from "@/data/site";
import { serializeJsonLd } from "@/lib/json-ld";
import { absUrl } from "@/lib/seo";
import "@/components/dark/home-partner.css";
import "@/styles/partner-services.css";
import "@/styles/partner-landing.css";

/**
 * Premium landing page for the partner services (Folierung, Lackierarbeiten,
 * Dellen drücken, Smart Repair). Same visual language as the homepage:
 * full-bleed hero, chrome headlines, large numbered steps.
 * Content must stay factual: no prices, durations, partner names or certificates.
 */
export type SlotPhoto = { src: string; srcSet?: string; alt: string; width: number; height: number };

export type LandingOption = {
  id: string;
  label: string;
  title: string;
  text: string;
  points: string[];
  icon: LucideIcon;
  /** Fill in once the owner supplies a released photo (public/media/partner/). */
  photo?: SlotPhoto;
};

export type PartnerPageId = "folierung" | "lackierarbeiten" | "dellen-druecken" | "smart-repair";

export type PartnerLandingConfig = {
  id: PartnerPageId;
  path: `/${string}`;
  serviceName: string;
  alternateNames: string[];
  description: string;
  crumb: string;
  /** Atmosphere image under /media/dark/gen/ (needs -800 and -1600 webp). */
  heroImage: string;
  kicker: string;
  title: string;
  lead: string;
  primaryCta: string;
  introLabel: string;
  introTitle: string;
  intro: string;
  options: LandingOption[];
  steps: readonly (readonly [string, string])[];
  faqs: { q: string; a: string }[];
  inquiryTitle: string;
  inquiryHint: string;
  articles?: { slug: string; label: string }[];
  /** Caption under the option images. Defaults to "Symbolbilder." */
  photoNote?: string;
  /** Explanatory knowledge blocks between the options and the steps. */
  guides?: LandingGuide[];
};

export type LandingGuide = {
  id: string;
  label: string;
  title: string;
  intro?: string;
  items: { title: string; text: string }[];
  /** Plain-text note under the cards, e.g. where a figure comes from. */
  note?: string;
};

/** Cross-links between the four partner pages. */
const partnerPages: { id: PartnerPageId; to: string; label: string; teaser: string }[] = [
  {
    id: "folierung",
    to: "/folierung",
    label: "Autofolierung",
    teaser: "Farbwechsel, Voll- und Teilfolierung bis zur Luxuskarosserie.",
  },
  {
    id: "lackierarbeiten",
    to: "/lackierarbeiten",
    label: "Lackierarbeiten",
    teaser: "Kratzer, Steinschläge und Bauteile vom Lackierbetrieb.",
  },
  {
    id: "dellen-druecken",
    to: "/dellen-druecken",
    label: "Dellen drücken",
    teaser: "Parkdellen und Hagel ohne Lackieren, wenn Lack und Blech es zulassen.",
  },
  {
    id: "smart-repair",
    to: "/smart-repair",
    label: "Smart Repair",
    teaser: "Kleine Schäden an Lack, Felgen und Innenraum gezielt reparieren.",
  },
];

const facts = [
  ["Ein Ansprechpartner", "White-Gloss koordiniert alles, von der Anfrage bis zur Übergabe."],
  ["Preis vor Zusage", "Umfang und Preis erfährst du nach der Begutachtung, bevor du zusagst."],
  ["Erfahrene Partner", "Spezialisierte Fachbetriebe, teils Meisterbetriebe."],
  ["Hol- und Bringservice", "Auf Wunsch holen wir dein Auto ab und bringen es zurück."],
] as const;

const lossburg = cities.find((city) => city.slug === "lossburg");

/** Questions shown open; the rest sit behind one "more" toggle so the page stays calm. */
const FAQ_VISIBLE = 6;

function FaqItem({ faq }: { faq: { q: string; a: string } }) {
  return (
    <details>
      <summary>
        <span>{faq.q}</span>
        <span className="pl-faq__plus" aria-hidden="true">+</span>
      </summary>
      <p className="muted">{faq.a}</p>
    </details>
  );
}

/**
 * Knowledge blocks as tabs: one topic visible at a time keeps the page calm.
 * All panels stay in the HTML (only `hidden`), so search engines and readers
 * without JavaScript still get every text.
 */
function GuideTabs({ guides }: { guides: LandingGuide[] }) {
  const [active, setActive] = useState(0);
  const single = guides.length === 1;
  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + guides.length) % guides.length;
    setActive(next);
    document.getElementById(`wissen-tab-${guides[next].id}`)?.focus();
  };
  return (
    <section className="psvc-sec" aria-labelledby="wissen">
      <div className="wrap">
        <p className="label label--rule">Wissen</p>
        <h2 className="h2 chrome" id="wissen">
          {single ? guides[0].title : "Gut zu wissen."}
        </h2>
        {single ? null : (
          <div className="pl-tabs" role="tablist" aria-label="Themen">
            {guides.map((guide, index) => (
              <button
                key={guide.id}
                type="button"
                role="tab"
                id={`wissen-tab-${guide.id}`}
                aria-selected={index === active}
                aria-controls={`wissen-panel-${guide.id}`}
                tabIndex={index === active ? 0 : -1}
                className="pl-tabs__tab"
                onClick={() => setActive(index)}
                onKeyDown={(event) => move(event, index)}
              >
                {guide.label}
              </button>
            ))}
          </div>
        )}
        {guides.map((guide, index) => (
          <div
            key={guide.id}
            id={single ? undefined : `wissen-panel-${guide.id}`}
            role={single ? undefined : "tabpanel"}
            aria-labelledby={single ? undefined : `wissen-tab-${guide.id}`}
            hidden={index !== active}
            className="pl-tabs__panel"
          >
            {single ? null : <h3 className="h3 pl-tabs__title">{guide.title}</h3>}
            {guide.intro ? <p className="muted pl-split__text">{guide.intro}</p> : null}
            <ul className="pl-guide">
              {guide.items.map((item) => (
                <li key={item.title}>
                  <h3 className="h3">{item.title}</h3>
                  <p className="muted">{item.text}</p>
                </li>
              ))}
            </ul>
            {guide.note ? <p className="muted pl-guide__note">{guide.note}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function OptionFigure({ option }: { option: LandingOption }) {
  const Icon = option.icon;
  if (option.photo) {
    return (
      <figure className="psvc__media">
        <img
          src={option.photo.src}
          srcSet={option.photo.srcSet}
          sizes="(min-width: 1100px) 45vw, (min-width: 760px) 50vw, 100vw"
          alt={option.photo.alt}
          width={option.photo.width}
          height={option.photo.height}
          loading="lazy"
          decoding="async"
        />
      </figure>
    );
  }
  return (
    <div className="psvc__media psvc__media--slot" aria-hidden="true">
      <Icon size={40} strokeWidth={1.1} />
      <span>{option.label}</span>
    </div>
  );
}

export function PartnerLanding({ config }: { config: PartnerLandingConfig }) {
  const url = absUrl(config.path);
  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: config.serviceName,
    alternateName: config.alternateNames,
    serviceType: config.serviceName,
    description: config.description,
    url,
    areaServed: cities.map((city) => ({ "@type": "City", name: city.name })),
    provider: {
      "@type": "AutomotiveBusiness",
      name: site.legalName,
      telephone: site.phoneHref.replace("tel:", ""),
      url: site.origin,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: config.serviceName,
      itemListElement: config.options.map((option) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: option.title },
      })),
    },
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: config.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Startseite", item: site.origin },
      { "@type": "ListItem", position: 2, name: "Leistungen", item: absUrl("/leistungen") },
      { "@type": "ListItem", position: 3, name: config.crumb, item: url },
    ],
  };
  const others = partnerPages.filter((page) => page.id !== config.id);
  const visibleFaqs = config.faqs.slice(0, FAQ_VISIBLE);
  const moreFaqs = config.faqs.slice(FAQ_VISIBLE);
  const hasPhotos = config.options.some((option) => option.photo);
  const img = `/media/dark/gen/${config.heroImage}`;

  return (
    <main id="main-content" tabIndex={-1} className="pl">
      {[serviceLd, faqLd, breadcrumbLd].map((ld) => (
        <script
          key={ld["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(ld) }}
        />
      ))}

      <section className="pl-hero" aria-labelledby="pl-title">
        <div className="pl-hero__bg" aria-hidden="true">
          <img
            src={`${img}-1600.webp`}
            srcSet={`${img}-800.webp 800w, ${img}-1600.webp 1600w`}
            sizes="100vw"
            alt=""
            fetchPriority="high"
            decoding="async"
          />
        </div>
        <div className="wrap pl-hero__in">
          <PageCrumbs
            items={[
              { label: "Startseite", to: "/" },
              { label: "Leistungen", to: "/leistungen" },
              { label: config.crumb },
            ]}
          />
          <p className="label label--rule">{config.kicker}</p>
          <h1 className="pl-hero__title chrome" id="pl-title">
            {config.title}
          </h1>
          <p className="pl-hero__lead">{config.lead}</p>
          <div className="pl-hero__actions">
            <a href="#anfrage" className="btn btn--solid">
              {config.primaryCta} <span className="arr" aria-hidden="true">→</span>
            </a>
            <a href={site.whatsapp} className="btn btn--line" target="_blank" rel="noopener noreferrer">
              Fotos per WhatsApp
            </a>
          </div>
          <ul className="psvc-chips" aria-label="Auf dieser Seite">
            {config.options.map((option) => (
              <li key={option.id}>
                <a href={`#${option.id}`}>{option.label}</a>
              </li>
            ))}
            {config.guides?.length ? (
              <li>
                <a href="#wissen">Wissen</a>
              </li>
            ) : null}
            <li>
              <a href="#fragen">Häufige Fragen</a>
            </li>
          </ul>
        </div>
      </section>

      <section className="pl-facts" aria-label="Darauf kannst du dich verlassen">
        <ul className="wrap pl-facts__grid">
          {facts.map(([title, text]) => (
            <li key={title}>
              <p className="pl-facts__t">{title}</p>
              <p className="muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="psvc-sec" aria-labelledby="pl-intro">
        <div className="wrap">
          <div className="pl-split">
            <div>
              <p className="label label--rule">{config.introLabel}</p>
              <h2 className="h2 chrome" id="pl-intro">
                {config.introTitle}
              </h2>
            </div>
            <p className="muted pl-split__text">{config.intro}</p>
          </div>
          <ol className="psvc-grid">
            {config.options.map((option, index) => (
              <li key={option.id} id={option.id} className="psvc">
                <OptionFigure option={option} />
                <div className="psvc__body">
                  <p className="psvc__num" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="h3">{option.title}</h3>
                  <p className="muted">{option.text}</p>
                  <ul className="psvc__points">
                    {option.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
          {hasPhotos ? <p className="muted pl-photo-note">{config.photoNote ?? "Symbolbilder."}</p> : null}
        </div>
      </section>

      {config.guides?.length ? <GuideTabs guides={config.guides} /> : null}

      <section className="psvc-sec" aria-labelledby="ablauf">
        <div className="wrap">
          <p className="label label--rule">Ablauf</p>
          <h2 className="h2 chrome" id="ablauf">
            In vier Schritten zum Ergebnis.
          </h2>
          <ol className="pl-steps">
            {config.steps.map(([title, text], index) => (
              <li key={title}>
                <p className="pl-steps__n" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="h3">{title}</h3>
                <p className="muted">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="psvc-sec" aria-labelledby="region">
        <div className="wrap pl-split">
          <div>
            <p className="label label--rule">Region</p>
            <h2 className="h2 chrome" id="region">
              Horb, Dornhan, Loßburg und Freudenstadt.
            </h2>
          </div>
          <div>
            <p className="muted pl-split__text">
              Unsere Werkstatt ist in {site.city}.
              {lossburg ? " In Loßburg entsteht unser neuer Standort." : ""} Auf Wunsch holen wir
              dein Auto ab, auch aus diesen Orten:
            </p>
            <ul className="pl-towns">
              {cities.map((city) => (
                <li key={city.slug}>
                  <Link to="/abholservice/$city" params={{ city: city.slug }}>
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="psvc-sec" aria-labelledby="fragen">
        <div className="wrap pl-split">
          <div>
            <p className="label label--rule">Fragen</p>
            <h2 className="h2 chrome" id="fragen">
              Häufige Fragen.
            </h2>
          </div>
          <div className="pl-faq">
            {visibleFaqs.map((faq) => (
              <FaqItem key={faq.q} faq={faq} />
            ))}
            {moreFaqs.length ? (
              <details className="pl-faq__more">
                <summary>
                  <span>Weitere {moreFaqs.length} Fragen anzeigen</span>
                  <span className="pl-faq__plus" aria-hidden="true">+</span>
                </summary>
                {moreFaqs.map((faq) => (
                  <FaqItem key={faq.q} faq={faq} />
                ))}
              </details>
            ) : null}
          </div>
        </div>
      </section>

      <section className="psvc-sec" aria-labelledby="mehr">
        <div className="wrap">
          <p className="label label--rule">Mit Partnerbetrieben</p>
          <h2 className="h2 chrome" id="mehr">
            Mehr rund um Karosserie und Lack.
          </h2>
          <ul className="hpart__grid pl-more">
            {others.map((page, index) => (
              <li key={page.id}>
                <Link to={page.to as never} className="hpart__card">
                  <span className="hpart__num" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="hpart__name">{page.label}</span>
                  <span className="muted">{page.teaser}</span>
                </Link>
              </li>
            ))}
          </ul>
          {config.articles?.length ? (
            <p className="muted pl-articles">
              Mehr im Ratgeber:{" "}
              {config.articles.map((article, index) => (
                <span key={article.slug}>
                  {index > 0 ? " · " : null}
                  <Link to="/ratgeber/$slug" params={{ slug: article.slug }}>
                    {article.label}
                  </Link>
                </span>
              ))}
            </p>
          ) : null}
        </div>
      </section>

      <section className="psvc-sec pl-inquiry" aria-labelledby="pl-inquiry-h">
        <div className="wrap pl-inquiry__in">
          <p className="label label--rule">Anfrage</p>
          <h2 className="h2 chrome" id="pl-inquiry-h">
            Schreib uns. Wir melden uns.
          </h2>
          <div className="pl-inquiry__wa">
            <WhatsAppPhotoCta />
          </div>
          <div id="anfrage" className="pl-inquiry__form">
            <PhotoInquiry title={config.inquiryTitle} hint={config.inquiryHint} />
          </div>
          <p className="muted pl-inquiry__phone">
            Lieber direkt sprechen? <a href={site.phoneHref}>{site.phoneDisplay}</a>
          </p>
        </div>
      </section>
    </main>
  );
}
