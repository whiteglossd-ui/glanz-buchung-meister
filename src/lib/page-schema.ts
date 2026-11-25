import {
  cities,
  packageAnchor,
  packageServiceSlug,
  packages,
  services,
  site,
} from "../data/site.ts";

/** Relative imports only: this module runs under node:test in CI. */
export const businessId = `${site.origin}/#betrieb`;
export const websiteId = `${site.origin}/#website`;
export const packageCatalogId = `${site.origin}/preise#paketkatalog`;

const catalogServices = [
  "innenraumreinigung",
  "lackkorrektur",
  "keramikversiegelung",
  "lederpflege",
  "lederreparatur",
  "geruchsneutralisation",
];

function breadcrumb(
  entries: Array<{ name: string; path?: string }>,
  idPath: string,
): {
  "@type": "BreadcrumbList";
  "@id": string;
  itemListElement: Array<{ "@type": "ListItem"; position: number; name: string; item: string }>;
} {
  const path = idPath.startsWith("/") ? idPath : `/${idPath}`;
  return {
    "@type": "BreadcrumbList",
    "@id": `${site.origin}${path}#breadcrumb`,
    itemListElement: entries.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: entry.path === undefined || entry.path === path ? `${site.origin}${path}` : `${site.origin}${entry.path}`,
    })),
  };
}

/**
 * Ein Paketkatalog als eigene Entität: definiert auf /preise, referenziert
 * vom Betriebsprofil auf der Startseite. Stabile @ids wie im bekannten
 * Betriebselement (`/#betrieb`) verbinden beide Seiten zu einem Graphen.
 */
export function packagesOfferCatalog() {
  return {
    "@type": "OfferCatalog",
    "@id": packageCatalogId,
    name: "Fahrzeugaufbereitung",
    itemListElement: [
      ...packages.map((p) => ({
        "@type": "Offer",
        name: `${p.searchLabel} ${p.name}`,
        itemOffered: {
          "@type": "Service",
          name: p.seoName,
          alternateName: [p.name, p.searchLabel],
          description: p.body,
          url: `${site.origin}/leistungen/${packageServiceSlug[p.id]}`,
          areaServed: site.city,
          provider: { "@id": businessId },
        },
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: String(p.price),
          priceCurrency: "EUR",
          valueAddedTaxIncluded: true,
        },
        url: `${site.origin}/preise#${packageAnchor(p.id)}`,
      })),
      ...catalogServices
        .filter((slug) => !Object.values(packageServiceSlug).includes(slug))
        .map((slug) => {
          const svc = services.find((s) => s.slug === slug);
          return {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: svc?.nav ?? slug,
              url: `${site.origin}/leistungen/${slug}`,
            },
            url: `${site.origin}/leistungen/${slug}`,
          };
        }),
    ],
  };
}

export function pricePageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [packagesOfferCatalog(), breadcrumb(
      [
        { name: "Startseite", path: "/" },
        { name: "Preise & Pakete" },
      ],
      "/preise",
    )],
  };
}

export function pickupServiceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${site.origin}/abholservice#service`,
        name: "Hol- und Bringservice",
        serviceType: "Abholung und Rückgabe zur Fahrzeugaufbereitung",
        url: `${site.origin}/abholservice`,
        description:
          "Abholung deines Fahrzeugs am vereinbarten Ort, Aufbereitung in der Werkstatt in Horb am Neckar und Rückgabe nach Absprache.",
        provider: {
          "@type": ["AutoRepair", "AutomotiveBusiness"],
          "@id": businessId,
          name: site.legalName,
          url: site.origin,
        },
        areaServed: cities.map((city) => ({ "@type": "City", name: city.name })),
      },
      breadcrumb(
        [
          { name: "Startseite", path: "/" },
          { name: "Hol- und Bringservice" },
        ],
        "/abholservice",
      ),
    ],
  };
}

export function contactPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        "@id": `${site.origin}/kontakt#webpage`,
        url: `${site.origin}/kontakt`,
        name: "Kontakt & Anfahrt",
        inLanguage: "de-DE",
        isPartOf: { "@id": websiteId },
        about: { "@id": businessId },
      },
      breadcrumb(
        [
          { name: "Startseite", path: "/" },
          { name: "Kontakt" },
        ],
        "/kontakt",
      ),
    ],
  };
}
