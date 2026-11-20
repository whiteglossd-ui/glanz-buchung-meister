import { packageAnchor, packageServiceSlug, packages, site } from "../data/site.ts";

/**
 * Strukturierte Daten für /preise. Alle Preise stammen aus `packages`, also aus
 * derselben Quelle wie die sichtbare Preisliste und die Meta-Beschreibung. So
 * weichen Schema und Seite nicht voneinander ab. Die Preise gelten "ab" für die
 * Kompaktklasse, deshalb werden sie als `minPrice` ausgewiesen, nicht als Fixpreis.
 */
export function pricesPageJsonLd() {
  const pageUrl = `${site.origin}/preise`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: `Preise für Fahrzeugaufbereitung in Horb | ${site.name}`,
        inLanguage: "de-DE",
        isPartOf: { "@id": `${site.origin}/#website` },
        about: { "@id": `${site.origin}/#betrieb` },
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
      },
      {
        "@type": "OfferCatalog",
        "@id": `${pageUrl}#preise`,
        name: "Pakete und Preise der Fahrzeugaufbereitung",
        itemListElement: packages.map((p) => ({
          "@type": "Offer",
          name: p.name,
          url: `${pageUrl}#${packageAnchor(p.id)}`,
          priceSpecification: {
            "@type": "PriceSpecification",
            minPrice: p.price,
            priceCurrency: "EUR",
            valueAddedTaxIncluded: true,
          },
          itemOffered: {
            "@type": "Service",
            name: p.seoName,
            description: p.body,
            url: `${site.origin}/leistungen/${packageServiceSlug[p.id]}`,
            areaServed: site.city,
            provider: { "@id": `${site.origin}/#betrieb` },
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Startseite", item: site.origin },
          { "@type": "ListItem", position: 2, name: "Preise & Pakete", item: pageUrl },
        ],
      },
    ],
  };
}
