import assert from "node:assert/strict";
import { test } from "node:test";
import { packages, site } from "../data/site.ts";
import { pricesPageJsonLd } from "./prices-schema.ts";

type Node = Record<string, unknown> & { "@type": string };

function graph(): Node[] {
  return pricesPageJsonLd()["@graph"] as unknown as Node[];
}

test("jedes Paket erscheint mit genau dem sichtbaren Mindestpreis", () => {
  const catalog = graph().find((n) => n["@type"] === "OfferCatalog");
  assert.ok(catalog, "OfferCatalog fehlt");
  const offers = catalog["itemListElement"] as Array<{
    name: string;
    priceSpecification: { minPrice: number; priceCurrency: string; valueAddedTaxIncluded: boolean };
  }>;
  assert.equal(offers.length, packages.length);
  for (const p of packages) {
    const offer = offers.find((o) => o.name === p.name);
    assert.ok(offer, `Angebot für ${p.name} fehlt`);
    assert.equal(offer.priceSpecification.minPrice, p.price);
    assert.equal(offer.priceSpecification.priceCurrency, "EUR");
    assert.equal(offer.priceSpecification.valueAddedTaxIncluded, true);
  }
});

test("Breadcrumb und Seiten-URL zeigen auf /preise unter der Produktionsdomain", () => {
  const nodes = graph();
  const page = nodes.find((n) => n["@type"] === "WebPage");
  assert.equal(page?.["url"], `${site.origin}/preise`);
  const crumbs = nodes.find((n) => n["@type"] === "BreadcrumbList");
  const items = crumbs?.["itemListElement"] as Array<{ position: number; item: string }>;
  assert.deepEqual(
    items.map((i) => [i.position, i.item]),
    [
      [1, site.origin],
      [2, `${site.origin}/preise`],
    ],
  );
});

test("Verweise auf Betrieb und Website nutzen die bestehenden Entitäten", () => {
  const page = graph().find((n) => n["@type"] === "WebPage");
  assert.deepEqual(page?.["about"], { "@id": `${site.origin}/#betrieb` });
  assert.deepEqual(page?.["isPartOf"], { "@id": `${site.origin}/#website` });
});
