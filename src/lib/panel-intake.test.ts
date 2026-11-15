import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile, readdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "./db.ts";
import { saveRundumInquiry, saveTextInquiry } from "./rundum-workflow.ts";
import { deliverPanelIntake, runPanelIntake } from "./panel-intake.ts";
import { handleHubInquiries } from "./hub-inquiries.ts";

function wrap(pg: Pick<PGlite, "query">, transaction?: Sql["transaction"]): Sql {
  const sql = (async (strings: TemplateStringsArray, ...args: unknown[]) =>
    (
      await pg.query(
        strings.reduce((s, p, i) => s + (i ? `$${i}` : "") + p, ""),
        args,
      )
    ).rows) as Sql;
  sql.query = async <T>(text: string, args: unknown[] = []) => (await pg.query<T>(text, args)).rows;
  sql.transaction = transaction ?? ((fn) => fn(sql));
  return sql;
}
async function fixture(t: { after: (fn: () => Promise<void>) => void }) {
  const pg = new PGlite({ parsers: { 1082: (v) => v, 20: Number } });
  for (const name of (await readdir("migrations")).filter((n) => n.endsWith(".sql")).sort())
    await pg.exec(await readFile(`migrations/${name}`, "utf8"));
  t.after(() => pg.close());
  return wrap(pg, (fn) => pg.transaction((tx) => fn(wrap(tx))));
}
const input = () => ({
  idempotencyKey: randomUUID(),
  name: "Test Kunde",
  email: "test@example.invalid",
  phone: "",
  vehicleMake: "Testmarke",
  vehicleModel: "Testmodell",
  services: ["Fahrzeugaufbereitung", "Felgenreparatur"],
  text: "Beschreibung " + "x".repeat(1980),
  pickupRequested: true,
  date: "2999-05-14",
  privacy: true as const,
});

test("no-photo Rundum persists complete data and one outbox through parallel/reload retries", async (t) => {
  const sql = await fixture(t),
    data = input();
  const results = await Promise.all([saveRundumInquiry(sql, data), saveRundumInquiry(sql, data)]);
  assert.equal(results[0].booking.id, results[1].booking.id);
  assert.equal((await sql`select * from bookings`).length, 1);
  assert.equal((await sql`select * from panel_intake_queue`).length, 1);
  assert.equal((await sql`select * from booking_photos`).length, 0);
  const [job] = await sql<{ payload: string }>`select payload from panel_intake_queue`;
  const inquiry = JSON.parse(job.payload);
  assert.equal(inquiry.note, data.text);
  assert.equal(inquiry.pickup_requested, true);
  assert.deepEqual(inquiry.requested_services, data.services);
  assert.equal(inquiry.vehicle_make, data.vehicleMake);
  assert.equal(inquiry.vehicle_model, data.vehicleModel);
  assert.equal(inquiry.intake_version, 1);
  assert.equal(inquiry.preferred_date, data.date);
  assert.equal(inquiry.total_cents, 0);
  await assert.rejects(
    saveRundumInquiry(sql, { ...data, text: "Andere Anfrage" }),
    /bereits verwendet/,
  );
  const generic = await saveTextInquiry(sql, {
    requestId: randomUUID(),
    title: "Dellen-Beratung",
    name: data.name,
    email: data.email,
    phone: "",
    text: "Ohne Fotos",
    privacy: true,
  });
  assert.equal(generic.booking.package_id, "service-inquiry");
});

test("handoff failure keeps saved request and replay sends one immutable payload without exposing credentials", async (t) => {
  const sql = await fixture(t);
  const data = input(),
    { booking } = await saveRundumInquiry(sql, data),
    id = Number(booking.id);
  const previous = process.env.HUB_SYNC_TOKEN;
  process.env.HUB_SYNC_TOKEN = "synthetic-shared-server-token-00000000";
  t.after(async () => {
    if (previous === undefined) delete process.env.HUB_SYNC_TOKEN;
    else process.env.HUB_SYNC_TOKEN = previous;
  });
  const bodies: string[] = [];
  let fail = true;
  t.mock.method(globalThis, "fetch", async (url: unknown, options: RequestInit) => {
    assert.equal(url, "https://panel.white-gloss.de/api/website/intake");
    assert.equal(
      new Headers(options.headers).get("authorization"),
      `Bearer ${process.env.HUB_SYNC_TOKEN}`,
    );
    bodies.push(String(options.body));
    if (fail) throw Error("network");
    return Response.json({ saved: true, reference: "WG-000123", emailStatus: "accepted" });
  });
  assert.equal((await deliverPanelIntake(sql, id)).panelSaved, false);
  assert.equal((await sql`select * from bookings`).length, 1);
  fail = false;
  assert.deepEqual(await deliverPanelIntake(sql, id), {
    panelSaved: true,
    reference: "WG-000123",
    emailStatus: "accepted",
  });
  assert.equal(bodies[0], bodies[1]);
  await deliverPanelIntake(sql, id);
  assert.equal(bodies.length, 2);
  assert.deepEqual(await runPanelIntake(sql), { saved: 0, checked: 0 });
  assert.equal((await sql`select * from panel_intake_queue`)[0].last_error_code, null);
});

test("Hub recovery pages past forty and retains all request descriptions", async (t) => {
  const sql = await fixture(t),
    previous = process.env.HUB_SYNC_TOKEN;
  process.env.HUB_SYNC_TOKEN = "synthetic-shared-server-token-00000000";
  t.after(async () => {
    if (previous === undefined) delete process.env.HUB_SYNC_TOKEN;
    else process.env.HUB_SYNC_TOKEN = previous;
  });
  await sql`insert into bookings(customer_name,phone,email,package_id,class_id,request_kind,requested_services,pickup_requested,intake_version,note) select 'Testkunde','','test@example.invalid','rundum-service','kompakt','rundum-service','["Smart Repair"]',true,1,repeat('x',2000) from generate_series(1,45)`;
  const page = async (afterId: number) => {
    const response = await handleHubInquiries(
      new Request("https://site.example.invalid/api/hub", {
        method: "POST",
        headers: { authorization: `Bearer ${process.env.HUB_SYNC_TOKEN}` },
        body: JSON.stringify({ action: "list", afterId }),
      }),
      async () => sql,
    );
    assert.equal(response.status, 200);
    return response.json();
  };
  const first = await page(0);
  assert.equal(first.inquiries.length, 40);
  assert.equal(first.nextAfterId, 40);
  const second = await page(first.nextAfterId);
  assert.equal(second.inquiries.length, 5);
  assert.equal(second.nextAfterId, null);
  assert.equal(first.inquiries[0].note.length, 2000);
  assert.equal(second.inquiries[4].id, 45);
});
