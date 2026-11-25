import assert from "node:assert/strict";
import { test } from "node:test";
import { site } from "../data/site.ts";
import {
  businessId,
  contactPageJsonLd,
  packageCatalogId,
  packagesOfferCatalog,
  pickupServiceJsonLd,
  pricePageJsonLd,
} from "./page-schema.ts";

type JsonLdNode = {
  "@type"?: string;
  "@id"?: string;
  itemListElement?: Array<{
    url?: string;
    name?: string;
    item?: string;
    itemOffered?: { url?: string; provider?: { "@id": string } };
    priceSpecification?: {
      price?: string;
      priceCurrency?: string;
      valueAddedTaxIncluded?: boolean;
    };
  }>;
  provider?: { "@id": string };
  isPartOf?: { "@id": string };
  about?: { "@id": string };
  areaServed?: Array<{ "@type": string }>;
};

type GraphPage = { "@graph": Array<JsonLdNode> };

test("Der Preis-Katalog bleibt eine stabile Entität mit verankerten Paketpreisen", () => {
  const catalog: JsonLdNode = packagesOfferCatalog();
  assert.equal(catalog["@id"], `${site.origin}/preise#paketkatalog`);
  assert.equal(packageCatalogId, `${site.origin}/preise#paketkatalog`);
  const offers = catalog.itemListElement ?? [];
  assert.ok(offers.length > 3);
  const serviceUrls = offers
    .map((offer) => offer.itemOffered?.url)
    .filter((url): url is string => Boolean(url));
  assert.equal(new Set(serviceUrls).size, serviceUrls.length);
  for (const offer of offers) {
    const spec = offer.priceSpecification;
    if (!spec) continue;
    assert.equal(spec.priceCurrency, "EUR");
    assert.equal(spec.valueAddedTaxIncluded, true);
    assert.ok(Number(spec.price) > 0);
    assert.equal(offer.itemOffered?.provider?.["@id"], businessId);
    assert.ok(offer.url?.startsWith(`${site.origin}/preise#paket-`));
  }
});

test("Die Preisseite liefert Katalog und sichtbare Brotkrumen als Schema", () => {
  const [catalog, breadcrumb] = (pricePageJsonLd() as GraphPage)["@graph"];
  assert.equal(catalog["@id"], `${site.origin}/preise#paketkatalog`);
  assert.equal(breadcrumb["@id"], `${site.origin}/preise#breadcrumb`);
  assert.deepEqual(
    (breadcrumb.itemListElement ?? []).map((entry) => entry.name ?? ""),
    ["Startseite", "Preise & Pakete"],
  );
  assert.equal((breadcrumb.itemListElement ?? []).at(-1)?.item, `${site.origin}/preise`);
});

test("Der Abholhub beschreibt den Hol- und Bringservice als Leistung des Horber Betriebs", () => {
  const graph = (pickupServiceJsonLd() as GraphPage)["@graph"];
  const [service, breadcrumb] = graph;
  assert.equal(service["@type"], "Service");
  assert.equal(service["@id"], `${site.origin}/abholservice#service`);
  assert.equal(service.provider?.["@id"], businessId);
  assert.ok(Array.isArray(service.areaServed));
  assert.ok((service.areaServed ?? []).every((city) => city["@type"] === "City"));
  assert.equal(breadcrumb["@id"], `${site.origin}/abholservice#breadcrumb`);
});

test("Die Kontaktseite hängt sich als ContactPage an das Betriebsprofil", () => {
  const graph = (contactPageJsonLd() as GraphPage)["@graph"];
  const [page, breadcrumb] = graph;
  assert.equal(page["@type"], "ContactPage");
  assert.equal(page["@id"], `${site.origin}/kontakt#webpage`);
  assert.equal(page.isPartOf?.["@id"], `${site.origin}/#website`);
  assert.equal(page.about?.["@id"], businessId);
  assert.equal(breadcrumb["@id"], `${site.origin}/kontakt#breadcrumb`);
});
