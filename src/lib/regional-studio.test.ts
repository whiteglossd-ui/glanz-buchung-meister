import assert from "node:assert/strict";
import { test } from "node:test";
import { cities, cityPickupPriceText, packages, quoteTotal, services, site } from "../data/site.ts";
import { cityJourneyText, citySeoCopy } from "./city-copy.ts";
import { cityPlanningText, cityLogisticsFaq } from "./city-logistics.ts";
import { isConsolidatedService, publicSeo, serviceCitySeo } from "./seo-policy.ts";
import { studioMetadata } from "./studio-public.ts";

const confirmed: Record<string, [number | null, number | null, string]> = {
  "horb-am-neckar": [0, 10, "ohne Anfahrt"],
  "sulz-am-neckar": [12, 13, "nach Reichweite"],
  empfingen: [10, 12, "nach Reichweite"],
  voehringen: [17, 19, "nach Reichweite"],
  dornhan: [20, 23, "nach Reichweite"],
  dornstetten: [19, 19, "nach Reichweite"],
  schopfloch: [11, 11, "nach Reichweite"],
  nagold: [20, 25, "nach Reichweite"],
  "rottenburg-am-neckar": [25, 30, "nach Reichweite"],
  freudenstadt: [30, 35, "nach Reichweite"],
  lossburg: [null, null, "auf Anfrage"],
  "oberndorf-am-neckar": [30, 35, "nach Reichweite"],
  herrenberg: [35, 40, "nach Reichweite"],
  tuebingen: [35, 40, "nach Reichweite"],
  calw: [40, 45, "nach Reichweite"],
  balingen: [45, 50, "nach Reichweite"],
  rottweil: [45, 50, "nach Reichweite"],
  boeblingen: [50, 55, "nach Reichweite"],
  reutlingen: [50, 55, "nach Reichweite"],
  sindelfingen: [52, 60, "auf Anfrage"],
};

test("all pickup hubs retain distinct metadata, index policy and their confirmed logistics", () => {
  assert.deepEqual(cities.map((city) => city.slug).sort(), Object.keys(confirmed).sort());
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const city of cities) {
    const copy = citySeoCopy(city);
    const metadata = studioMetadata(null, copy);
    titles.add(metadata.title);
    descriptions.add(metadata.description);
    assert.ok(metadata.title.includes(city.name.replace(" am Neckar", "")), city.slug);
    if (city.slug !== "horb-am-neckar") assert.ok(metadata.description.includes(cityPickupPriceText(city)), city.slug);
    assert.deepEqual(
      [city.km, city.minutes, cityPickupPriceText(city).replace(/\u00a0/g, " ")],
      confirmed[city.slug],
      city.slug,
    );
    if (city.minutes !== null) assert.ok(cityJourneyText(city).includes(String(city.minutes)), city.slug);
    else assert.equal(cityJourneyText(city), "Entfernung und Fahrzeit nach Abholadresse");
    assert.equal(publicSeo(`/abholservice/${city.slug}`).status, "index", city.slug);
    for (const service of services) {
      assert.equal(
        serviceCitySeo(service.slug, city.slug).status,
        service.pendingApproval || isConsolidatedService(service.slug) ? "redirect" : "noindex",
        `${service.slug}/${city.slug}`,
      );
    }
  }
  assert.equal(titles.size, cities.length);
  assert.equal(descriptions.size, cities.length);
});

test("all pickup plans add useful information without repeating the introduction or losing local handover notes", () => {
  const plans = cities.map((city) => cityPlanningText(city));
  assert.equal(new Set(plans).size, cities.length);
  for (const city of cities) {
    const plan = cityPlanningText(city);
    assert.ok(plan.length > 100, city.slug);
    assert.ok(!plan.includes(city.blurb), `${city.slug}: do not repeat the hero introduction`);
    if (city.pickupNote) assert.equal(plan, city.pickupNote, city.slug);
    else if (city.slug !== "horb-am-neckar") assert.ok(plan.includes(cityPickupPriceText(city)), city.slug);
  }
  assert.equal(cities.filter((city) => city.pickupNote).length, 6);
  const nagold = cities.find((city) => city.slug === "nagold")!;
  const changedLogistics = { ...nagold, km: 25, minutes: 32 };
  const changedPlan = cityPlanningText(changedLogistics);
  assert.ok(changedPlan.includes(`${changedLogistics.km} km`));
  assert.ok(changedPlan.includes(`${changedLogistics.minutes} Minuten`));
  assert.ok(changedPlan.includes(cityPickupPriceText(changedLogistics)));
});

test("planning paragraphs and logistics FAQs for every city have no doubled sentence punctuation", () => {
  for (const city of cities) {
    const faq = cityLogisticsFaq(city);
    for (const text of [cityPlanningText(city), faq?.question, faq?.answer]) {
      if (text) assert.doesNotMatch(text, /\.\s*\./, city.slug);
    }
    if (city.minutes !== null) assert.match(cityJourneyText(city), /Min\.$/, "Compact distance labels retain their abbreviation");
  }
});

test("specific logistics FAQs explain free pickup and radius boundaries without changing package prices", () => {
  const faqSlugs = cities.filter((city) => cityLogisticsFaq(city)).map((city) => city.slug).sort();
  assert.deepEqual(faqSlugs, ["boeblingen", "empfingen", "horb-am-neckar", "reutlingen", "sindelfingen"]);
  for (const slug of faqSlugs) {
    const city = cities.find((entry) => entry.slug === slug)!;
    const faq = cityLogisticsFaq(city)!;
    assert.ok(faq.question.endsWith("?"), slug);
    if (slug !== "horb-am-neckar") assert.ok(faq.answer.includes(cityPickupPriceText(city)), slug);
    if (["boeblingen", "reutlingen", "sindelfingen"].includes(slug)) {
      assert.doesNotMatch(faq.answer, /€|inklusive|enthalten/, slug);
      assert.ok(faq.answer.includes(`${city.km} km`), slug);
    }
  }
  const horb = cities.find((city) => city.slug === "horb-am-neckar")!;
  assert.ok(cityLogisticsFaq(horb)!.answer.includes(site.street));
  const empfingen = cities.find((city) => city.slug === "empfingen")!;
  assert.match(cityLogisticsFaq(empfingen)!.answer, /Wiesenstetten.*Dommelsberg/);
});

test("Loßburg remains a pickup request with no quoted fee before the workshop opens", () => {
  const city = cities.find((entry) => entry.slug === "lossburg")!;
  assert.match(city.blurb, /Bis zur Eröffnung.*Horb/);
  for (const { id: packageId } of packages) {
    const quote = quoteTotal({ packageId, classId: "kompakt", citySlug: city.slug, extraIds: [] });
    assert.equal(quote.pickup, null);
    assert.equal(quote.pickupOnRequest, true);
  }
});
