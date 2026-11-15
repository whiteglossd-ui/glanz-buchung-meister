import assert from "node:assert/strict";
import { test } from "node:test";
import { rundumInquirySchema } from "./rundum-schema.ts";
const valid = {
  idempotencyKey: "d8543d34-e506-4b19-880d-7cfd59c3a618",
  name: "Testkunde",
  email: "test@example.invalid",
  vehicleMake: "Test",
  vehicleModel: "Modell",
  services: ["Dellenentfernung", "Beratung / noch unsicher"],
  text: "Eine Delle an der Tür",
  pickupRequested: true,
  privacy: true,
};
test("Rundum request needs only relevant details and no photos, phone, address or date", () => {
  const value = rundumInquirySchema.parse(valid);
  assert.equal(value.phone, "");
  assert.deepEqual(value.services, valid.services);
  for (const override of [
    { services: [] },
    { services: ["Erfundene Leistung"] },
    { services: ["Smart Repair", "Smart Repair"] },
    { email: "invalid" },
    { text: "" },
    { vehicleModel: "" },
    { date: "2020-01-01" },
  ])
    assert.equal(rundumInquirySchema.safeParse({ ...valid, ...override }).success, false);
});
