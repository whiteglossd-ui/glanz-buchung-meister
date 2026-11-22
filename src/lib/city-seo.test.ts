import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { CityLanding } from "@/components/city-landing";
import { cities, site } from "@/data/site";
import { cityJsonLd, serviceCityHeading, serviceCityTitle, whatsappForCity } from "./city-seo.ts";

describe("city landing SEO", () => {
  it("offers personal advice over WhatsApp without asking for public photos", () => {
    const url = new URL(whatsappForCity("Nagold"));
    const configured = new URL(site.whatsappHref);
    assert.equal(url.origin, configured.origin);
    assert.equal(url.pathname, configured.pathname);
    assert.equal(url.searchParams.get("phone"), configured.searchParams.get("phone"));
    assert.equal(url.searchParams.get("text"), "Hallo White-Gloss Detailing, ich interessiere mich für eine Fahrzeugaufbereitung in Nagold und wünsche eine persönliche Beratung zu meinem Anliegen und dem voraussichtlichen Aufwand.");
    assert.doesNotMatch(url.searchParams.get("text")!, /foto|hochlad|upload/i);
  });
  const horb = cities.find((city) => city.slug === "horb-am-neckar");
  const nagold = cities.find((city) => city.slug === "nagold");

  it("keeps the Horb service-city title distinct from the homepage", () => {
    assert.ok(horb);
    assert.equal(
      serviceCityTitle("Fahrzeugaufbereitung", horb),
      "Fahrzeugaufbereitung mit Abholung in Horb | White-Gloss Detailing",
    );
    assert.equal(
      serviceCityTitle("Innenraumreinigung", nagold!),
      "Innenraumreinigung Nagold | White-Gloss Detailing",
    );
    assert.equal(
      serviceCityHeading("Fahrzeugaufbereitung", horb),
      "Fahrzeugaufbereitung mit Abholung in Horb am Neckar",
    );
    assert.equal(serviceCityHeading("Innenraumreinigung", nagold!), "Innenraumreinigung für Fahrzeuge aus Nagold");
  });

  it("describes the city page as a service from the real Horb business", () => {
    assert.ok(nagold);
    const schema = cityJsonLd(nagold);
    const service = schema["@graph"][0];

    assert.equal(service["@type"], "Service");
    assert.equal(service["@id"], `${site.origin}/abholservice/nagold#service`);
    assert.equal(service.provider["@id"], `${site.origin}/#betrieb`);
    assert.equal(service.provider.address.addressLocality, site.city);
    assert.deepEqual(service.areaServed, { "@type": "City", name: "Nagold" });
  });

  it("renders both local entrances with pickup, package booking and the planned Loßburg workshop", async () => {
    for (const slug of ["lossburg", "freudenstadt"]) {
      const city = cities.find((entry) => entry.slug === slug)!;
      const path = `/abholservice/${slug}`;
      const root = createRootRoute();
      const route = createRoute({
        getParentRoute: () => root,
        path: "/abholservice/$city",
        component: () => createElement(CityLanding, { city }),
      });
      const router = createRouter({
        routeTree: root.addChildren([route]),
        history: createMemoryHistory({ initialEntries: [path] }),
      });
      await router.load();
      const html = renderToStaticMarkup(createElement(RouterProvider, { router }));
      assert.match(html, /Lars Hägele/);
      assert.match(html, /Loßburg/);
      assert.match(html, /(?:Eröffnung|geplanten Werkstatt)/);
      assert.ok(html.includes(`href="/?ort=${slug}#buchung"`));
      assert.ok(html.includes(`href="/?paket=keramik&amp;ort=${slug}#buchung"`));
      assert.ok(html.includes(`href="/abholservice/${slug === "lossburg" ? "freudenstadt" : "lossburg"}"`));
      assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1);
    }
  });

  it("keeps every city canonical and service area attached to the operating Horb workshop", () => {
    assert.ok(cities.some((city) => city.slug === "lossburg"));
    for (const city of cities) {
      const schema = cityJsonLd(city)["@graph"][0];
      assert.equal(schema.url, `${site.origin}/abholservice/${city.slug}`, city.slug);
      assert.equal(schema.provider["@id"], `${site.origin}/#betrieb`, city.slug);
      assert.equal(schema.provider.address.addressLocality, site.city, city.slug);
      assert.deepEqual(schema.areaServed, { "@type": "City", name: city.name }, city.slug);
    }
  });
});

