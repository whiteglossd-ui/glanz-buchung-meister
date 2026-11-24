import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import type { Sql } from "./db.ts";
import { isCatalogReference, normalizeCatalogReference } from "./catalog-reference.mjs";
import {
  PANEL_CATALOG_MAX_BYTES,
  PANEL_CATALOG_PROTOCOL,
  parsePanelCatalogSnapshot,
} from "./panel-catalog.model.ts";
import {
  readPanelCatalogStatus,
  receivePanelCatalog,
  storePanelCatalog,
  type PanelCatalogMetadata,
} from "./panel-catalog.server.ts";

const secret = "synthetic-panel-catalog-contract-secret-0001";
const url = "https://example.invalid/api/panel-catalog";
const at = "2026-11-23T22:00:00.000Z";
const config = { enabled: true, secret, persistent: true };
const sampleService = {
  id: "svc:basis",
  catalogId: "basis",
  slug: "classic",
  name: "Classic",
  kind: "package",
  status: "active",
  priceCents: 14900,
  description: "Gründliche Pflege",
  summary: "Innen und außen",
  seoTitle: "Classic",
  metaDescription: "Beschreibung",
  landingSlug: "politur",
  sortOrder: 10,
  updatedAt: at,
};
const samplePage = {
  id: "page:politur",
  serviceId: "svc:basis",
  slug: "politur",
  status: "active",
  title: "Politur",
  lead: "Einleitung",
  body: "Text",
  seoTitle: "Politur",
  metaDescription: "Beschreibung",
  updatedAt: at,
};
function sample(revision = 1) {
  return {
    source: "panel",
    preview: false,
    revision,
    publishedAt: at,
    services: [{ ...sampleService }],
    pages: [{ ...samplePage }],
    settings: { name: "Testbetrieb", legalName: "Testbetrieb" },
    redirects: [{ source: "/leistungen/alt", target: "/leistungen/politur" }],
  };
}
const raw = JSON.stringify(sample());
const checksum = (body: string | Uint8Array) => createHash("sha256").update(body).digest("hex");
const signature = (body: string | Uint8Array) =>
  createHmac("sha256", secret).update(body).digest("hex");
function request(body: string | Uint8Array = raw, headers: Record<string, string> = {}) {
  return new Request(url, {
    method: "POST",
    body: body as BodyInit,
    headers: {
      authorization: `Bearer ${secret}`,
      "content-type": "application/json",
      "x-white-gloss-snapshot": signature(body),
      ...headers,
    },
  });
}
const get = (headers: Record<string, string> = {}) =>
  new Request(url, { headers: { authorization: `Bearer ${secret}`, ...headers } });
function fakeStorage() {
  let reads = 0,
    writes = 0;
  let metadata: PanelCatalogMetadata | null = null;
  return {
    get reads() {
      return reads;
    },
    get writes() {
      return writes;
    },
    async read() {
      reads++;
      return metadata;
    },
    async store(body: string) {
      writes++;
      const value = parsePanelCatalogSnapshot(Buffer.from(body));
      metadata = { revision: value.revision, hash: checksum(body), publishedAt: value.publishedAt };
      return { status: 201 as const, metadata };
    },
  };
}

test("signed receipt and authenticated GET acknowledge exact bytes while remaining inactive", async () => {
  const storage = fakeStorage();
  const response = await receivePanelCatalog(request(), config, storage);
  assert.equal(response.status, 201);
  const expected = {
    protocol: PANEL_CATALOG_PROTOCOL,
    active: false,
    ok: true,
    ready: true,
    status: "ready",
    revision: 1,
    hash: checksum(raw),
    publishedAt: at,
  };
  assert.deepEqual(await response.json(), expected);
  const status = await receivePanelCatalog(get(), config, storage);
  assert.equal(status.status, 200);
  assert.deepEqual(await status.json(), expected);
  for (const result of [response, status]) {
    assert.equal(result.headers.get("cache-control"), "private, no-store");
    assert.equal(result.headers.get("access-control-allow-origin"), null);
    assert.match(result.headers.get("x-robots-tag")!, /noindex/);
  }
  assert.equal(storage.writes, 1);
});

test("native server fetch transport headers are accepted without accepting a browser context", async () => {
  const storage = fakeStorage();
  async function onWire(init: RequestInit) {
    const captured: { request?: Request } = {};
    // Native fetch adds its actual wire headers before calling this dispatcher.
    // The dispatcher terminates in-process: no network or listening socket.
    const dispatcher = {
      dispatch(
        options: { method: string; headers: Record<string, string> },
        handler: {
          onConnect(abort: () => void): void;
          onHeaders(
            status: number,
            headers: string[],
            resume: () => void,
            statusText: string,
          ): void;
          onData(chunk: Uint8Array): void;
          onComplete(headers: string[]): void;
        },
      ) {
        captured.request = new Request(url, {
          ...init,
          method: options.method,
          headers: options.headers,
        });
        handler.onConnect(() => undefined);
        handler.onHeaders(200, ["content-type", "application/json"], () => undefined, "OK");
        handler.onData(Buffer.from("{}"));
        handler.onComplete([]);
        return true;
      },
    };
    const transport = { ...init, dispatcher };
    const response = await fetch(url, transport);
    await response.arrayBuffer();
    assert.ok(captured.request);
    assert.equal(captured.request.headers.get("sec-fetch-mode"), "cors");
    assert.deepEqual(
      [...captured.request.headers.keys()].filter((name) => name.startsWith("sec-fetch-")),
      ["sec-fetch-mode"],
    );
    return captured.request;
  }
  const post = await onWire({
    method: "POST",
    headers: request().headers,
    body: raw,
  });
  assert.equal((await receivePanelCatalog(post, config, storage)).status, 201);
  const read = await onWire({ headers: get().headers });
  assert.equal((await receivePanelCatalog(read, config, storage)).status, 200);
  const unauthorized = await onWire({ headers: { authorization: "Bearer wrong" } });
  assert.equal((await receivePanelCatalog(unauthorized, config, storage)).status, 401);
  assert.equal(storage.writes, 1);
  assert.equal(storage.reads, 1);
});

test("empty, disabled and unconfigured receiver states are explicit and do not claim publication", async () => {
  const storage = fakeStorage();
  assert.deepEqual(await (await receivePanelCatalog(get(), config, storage)).json(), {
    protocol: PANEL_CATALOG_PROTOCOL,
    active: false,
    ok: true,
    ready: true,
    status: "ready",
    revision: null,
    hash: null,
    publishedAt: null,
  });
  for (const [change, state] of [
    [{ enabled: false }, "disabled"],
    [{ secret: "short" }, "unconfigured"],
    [{ persistent: false }, "unconfigured"],
  ] as const) {
    for (const operation of [get(), request()]) {
      const result = await receivePanelCatalog(operation, { ...config, ...change }, storage);
      assert.equal(result.status, 503);
      const body = await result.json();
      assert.equal(body.status, state);
      assert.equal(body.ready, false);
      assert.equal(body.active, false);
      assert.equal(JSON.stringify(body).includes(secret), false);
    }
  }
  assert.equal(storage.reads, 1);
  assert.equal(storage.writes, 0);
});

test("missing credentials, malformed signatures and changed signed bytes never reach storage", async () => {
  const storage = fakeStorage();
  for (const bad of [
    request(raw, { authorization: "" }),
    request(raw, { authorization: "Bearer wrong" }),
    request(raw, { "x-white-gloss-snapshot": "" }),
    request(raw, { "x-white-gloss-snapshot": "f".repeat(63) }),
    request(raw, { "x-white-gloss-snapshot": "g".repeat(64) }),
    request(raw, { "x-white-gloss-snapshot": "f".repeat(64) }),
    request(raw + " ", { "x-white-gloss-snapshot": signature(raw) }),
    get({ authorization: "" }),
  ])
    assert.equal((await receivePanelCatalog(bad, config, storage)).status, 401);
  assert.equal(storage.reads, 0);
  assert.equal(storage.writes, 0);
});

test("browser requests and unsupported methods are rejected without CORS or database access", async () => {
  const storage = fakeStorage();
  const browserHeaders: Record<string, string>[] = [
    { origin: "https://panel.white-gloss.de" },
    { origin: "null" },
    { "sec-fetch-site": "none" },
    { "sec-fetch-mode": "navigate" },
    { "sec-fetch-mode": "same-origin" },
    { "sec-fetch-mode": "cors", "sec-fetch-site": "same-origin" },
    { "sec-fetch-mode": "cors", "sec-fetch-site": "cross-site" },
    { "sec-fetch-mode": "cors", "sec-fetch-dest": "empty" },
    { "sec-fetch-mode": "cors", "sec-fetch-user": "?1" },
    { "sec-fetch-mode": "cors", "sec-fetch-other": "unknown" },
  ];
  for (const headers of browserHeaders) {
    assert.equal((await receivePanelCatalog(request(raw, headers), config, storage)).status, 403);
    assert.equal((await receivePanelCatalog(get(headers), config, storage)).status, 403);
  }
  const result = await receivePanelCatalog(
    new Request(url, { method: "OPTIONS" }),
    config,
    storage,
  );
  assert.equal(result.status, 405);
  assert.equal(result.headers.get("allow"), "GET, POST");
  assert.equal(result.headers.get("access-control-allow-origin"), null);
  assert.equal(storage.writes + storage.reads, 0);
});

test("body format, byte limits and UTF-8 are checked before an archive write", async () => {
  const storage = fakeStorage();
  for (const [bad, expected] of [
    [request(raw, { "content-type": "text/plain" }), 415],
    [request(raw, { "content-encoding": "gzip" }), 415],
    [request(raw, { "content-type": "application/json; charset=iso-8859-1" }), 415],
    [request(""), 400],
    [request("{broken"), 422],
    [request(Uint8Array.of(0xff, 0xfe)), 422],
    [request(raw, { "content-length": String(PANEL_CATALOG_MAX_BYTES + 1) }), 413],
    [request(raw, { "content-length": "1" }), 400],
    [request("x".repeat(PANEL_CATALOG_MAX_BYTES + 1)), 413],
  ] as const)
    assert.equal((await receivePanelCatalog(bad, config, storage)).status, expected);
  assert.equal(storage.writes, 0);
  assert.equal(
    (
      await receivePanelCatalog(
        request(raw, { "content-type": "application/json; charset=utf-8" }),
        config,
        storage,
      )
    ).status,
    201,
  );
});

test("streaming limits and a bounded read deadline cancel unfinished bodies", async () => {
  const storage = fakeStorage();
  const streamRequest = (body: ReadableStream<Uint8Array>) =>
    new Request(url, {
      method: "POST",
      body,
      duplex: "half",
      headers: {
        authorization: `Bearer ${secret}`,
        "content-type": "application/json",
        "x-white-gloss-snapshot": signature(raw),
      },
    } as RequestInit);
  let cancelled = false;
  const stalled = streamRequest(
    new ReadableStream({
      cancel() {
        cancelled = true;
      },
    }),
  );
  assert.equal(
    (await receivePanelCatalog(stalled, { ...config, bodyTimeoutMs: 10 }, storage)).status,
    408,
  );
  assert.equal(cancelled, true);
  let chunks = 0;
  const oversized = streamRequest(
    new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(PANEL_CATALOG_MAX_BYTES / 2));
        if (++chunks === 3) controller.close();
      },
    }),
  );
  assert.equal((await receivePanelCatalog(oversized, config, storage)).status, 413);
  assert.equal(storage.writes, 0);
});

test("drafts, private/unknown fields, invalid values and oversized collections are rejected", () => {
  for (const change of [
    { preview: true },
    { source: "website" },
    { revision: 0 },
    { revision: Number.MAX_SAFE_INTEGER + 1 },
    { publishedAt: "2026-02-30T12:00:00.000Z" },
    { settings: null },
    { privateKey: secret },
    { services: [{ ...sampleService, internalPriceCents: 100 }] },
    { services: [{ ...sampleService, priceCents: -1 }] },
    { services: [{ ...sampleService, priceCents: 100.5 }] },
    { services: [{ ...sampleService, status: "inactive" }] },
    { services: [{ ...sampleService, description: "<script>bad</script>" }] },
    { services: Array.from({ length: 501 }, () => sampleService) },
    { settings: { name: "Test", legalName: "Test", secret: "hidden" } },
  ])
    assert.throws(() =>
      parsePanelCatalogSnapshot(Buffer.from(JSON.stringify({ ...sample(), ...change }))),
    );
  for (const key of ["__proto__", "constructor", "prototype"]) {
    assert.throws(() =>
      parsePanelCatalogSnapshot(
        Buffer.from(raw.replace('"settings":{', `"settings":{"${key}":{},`)),
      ),
    );
  }
  assert.equal(parsePanelCatalogSnapshot(Buffer.from(raw)).revision, 1);
});

test("duplicate identities and ambiguous, external or cyclic redirects are rejected", () => {
  for (const change of [
    { services: [sampleService, { ...sampleService, id: "svc:other", slug: "other" }] },
    { pages: [samplePage, { ...samplePage, slug: "other" }] },
    { redirects: [{ source: "/leistungen/alt", target: "https://example.invalid" }] },
    { redirects: [{ source: "/leistungen/alt", target: "/leistungen/missing" }] },
    { redirects: [{ source: "/leistungen/alt", target: "/leistungen/alt" }] },
    {
      redirects: [
        { source: "/leistungen/alt", target: "/leistungen/other" },
        { source: "/leistungen/other", target: "/leistungen/alt" },
      ],
    },
    { redirects: [{ source: "/leistungen/politur", target: "/leistungen/classic" }] },
    { redirects: [sample().redirects[0], sample().redirects[0]] },
  ])
    assert.throws(() =>
      parsePanelCatalogSnapshot(Buffer.from(JSON.stringify({ ...sample(), ...change }))),
    );
  const chain = {
    ...sample(),
    redirects: [{ source: "/leistungen/old", target: "/leistungen/alt" }, ...sample().redirects],
  };
  assert.equal(parsePanelCatalogSnapshot(Buffer.from(JSON.stringify(chain))).redirects.length, 2);
});

test("media and nested content use bounded public fields only", () => {
  for (const src of [
    "javascript:alert(1)",
    "http://example.invalid/a.jpg",
    "//example.invalid/a.jpg",
    "/../secret",
    "/%2e%2e/secret",
    "https://user:password@example.invalid/a.jpg",
  ]) {
    const value = { ...sample(), pages: [{ ...samplePage, images: [{ src, alt: "Bild" }] }] };
    assert.throws(() => parsePanelCatalogSnapshot(Buffer.from(JSON.stringify(value))));
  }
  const value = {
    ...sample(),
    services: [{ ...sampleService, gallery: [{ src: "/media/image.webp", alt: "Bild" }] }],
    pages: [
      {
        ...samplePage,
        faqs: [{ question: "Frage?", answer: "Antwort" }],
        images: [{ src: "https://example.invalid/image.jpg", alt: "Bild" }],
      },
    ],
  };
  assert.equal(
    parsePanelCatalogSnapshot(Buffer.from(JSON.stringify(value))).pages[0].images?.length,
    1,
  );
});

test("catalog references normalize ordinary path spaces and retain escaped query values", () => {
  for (const [value, expected] of [
    ["", ""],
    [" /images/BMW M3.jpg ", "/images/BMW%20M3.jpg"],
    ["/images/BMW%20M3.jpg", "/images/BMW%20M3.jpg"],
    ["/images/Öl.jpg", "/images/%C3%96l.jpg"],
    ["https://example.invalid/BMW M3.jpg", "https://example.invalid/BMW%20M3.jpg"],
    [
      "https://example.invalid/image.jpg?next=https%3A%2F%2Fexample.invalid%2Fa&label=BMW M3",
      "https://example.invalid/image.jpg?next=https%3A%2F%2Fexample.invalid%2Fa&label=BMW%20M3",
    ],
    ["/image.jpg?folder=BMW%2fM3&literal=%25", "/image.jpg?folder=BMW%2fM3&literal=%25"],
  ]) {
    assert.equal(isCatalogReference(value), true, value);
    assert.equal(normalizeCatalogReference(value), expected, value);
    assert.equal(normalizeCatalogReference(expected), expected, "normalization is idempotent");
  }
  const image = "/images/BMW M3.jpg";
  const link = "/kontakt?next=https%3A%2F%2Fexample.invalid%2Fa";
  const value = {
    ...sample(),
    services: [
      { ...sampleService, previewImage: image, socialImage: image, internalLinks: [link] },
    ],
    pages: [
      {
        ...samplePage,
        images: [{ src: image, alt: "BMW M3" }],
        beforeAfter: [{ before: image, after: "/images/BMW M3 after.jpg", alt: "Vergleich" }],
        links: [link],
      },
    ],
    settings: { ...sample().settings, website: link, logo: image, socialImage: image },
  };
  const snapshot = parsePanelCatalogSnapshot(Buffer.from(JSON.stringify(value)));
  assert.equal(
    snapshot.services[0].previewImage,
    image,
    "receipt validation preserves signed bytes",
  );
  assert.equal(snapshot.pages[0].links?.[0], link);
});

test("catalog reference validation rejects unsafe paths, credentials, controls and oversized normalization", () => {
  for (const value of [
    null,
    42,
    {},
    "images/file.jpg",
    "javascript:alert(1)",
    "http://example.invalid/image.jpg",
    "//example.invalid/image.jpg",
    "https:///example.invalid/image.jpg",
    "https://user:pass@example.invalid/image.jpg",
    "https://@example.invalid/image.jpg",
    "/images/../private",
    "https://example.invalid/images/../private",
    "/images/%2e%2e/private",
    "/images/%252e%252e/private",
    "/images/%2fprivate.jpg",
    "/images/%252fprivate.jpg",
    "/images/..%3fprivate",
    "/images/a\\b.jpg",
    "/images/a%5cb.jpg",
    "/images/a\u0000b.jpg",
    "/images/a\nb.jpg",
    "/images/a\tb.jpg",
    "/images/a\rb.jpg",
    "/images/a\u007fb.jpg",
    "/image.jpg?label=%00",
    "/image.jpg?label=%0A",
    "/image.jpg?label=%250D",
    "/image.jpg?label=%5C",
    "/image.jpg?label=<script>",
    "/image%ZZ.jpg",
    "/" + "a".repeat(500),
    "/" + "a ".repeat(165) + "z",
  ]) {
    assert.equal(isCatalogReference(value), false, String(value));
    assert.throws(() => normalizeCatalogReference(value), Error, String(value));
  }
  for (const images of [
    [{ src: " ", alt: "Bild" }],
    [
      { src: "/images/BMW M3.jpg", alt: "Bild" },
      { src: "/images/BMW%20M3.jpg", alt: "Doppeltes Bild" },
    ],
  ]) {
    assert.throws(() =>
      parsePanelCatalogSnapshot(
        Buffer.from(JSON.stringify({ ...sample(), pages: [{ ...samplePage, images }] })),
      ),
    );
  }
});

function adapter(connection: Pick<PGlite, "query">, transaction?: Sql["transaction"]): Sql {
  const sql = (async (parts: TemplateStringsArray, ...args: unknown[]) =>
    (
      await connection.query(
        parts.reduce((query, part, index) => query + (index ? `$${index}` : "") + part, ""),
        args,
      )
    ).rows) as Sql;
  sql.query = async <T>(query: string, args: unknown[] = []) =>
    (await connection.query<T>(query, args)).rows;
  sql.transaction = transaction ?? ((work) => work(sql));
  return sql;
}
async function database(t: { after: (work: () => Promise<void>) => void }) {
  const db = new PGlite({ parsers: { 20: Number } });
  t.after(() => db.close());
  await db.exec(
    await readFile(new URL("../../migrations/0027_panel_catalog.sql", import.meta.url), "utf8"),
  );
  const sql = adapter(db, (work) => db.transaction((tx) => work(adapter(tx))));
  return { db, sql };
}

test("PostgreSQL reception is monotonic, byte-idempotent and leaves business/CMS data untouched", async (t) => {
  const { db, sql } = await database(t);
  await db.exec(
    "create table bookings(id int, value text); insert into bookings values(1,'Bestand'); create table cms_items(body text); insert into cms_items values('Bestehender Inhalt')",
  );
  assert.equal(await readPanelCatalogStatus(sql), null);
  assert.equal((await storePanelCatalog(sql, raw)).status, 201);
  assert.equal((await storePanelCatalog(sql, raw)).status, 200);
  assert.equal((await storePanelCatalog(sql, raw + " ")).status, 409);
  const newer = JSON.stringify(sample(3));
  assert.equal((await storePanelCatalog(sql, newer)).status, 201);
  assert.equal((await storePanelCatalog(sql, JSON.stringify(sample(2)))).status, 409);
  assert.deepEqual(await readPanelCatalogStatus(sql), {
    revision: 3,
    hash: checksum(newer),
    publishedAt: at,
  });
  assert.equal(
    (await db.query<{ n: number }>("select count(*)::int as n from panel_catalog_snapshots"))
      .rows[0].n,
    2,
  );
  assert.deepEqual((await db.query("select * from bookings")).rows, [{ id: 1, value: "Bestand" }]);
  assert.deepEqual((await db.query("select * from cms_items")).rows, [
    { body: "Bestehender Inhalt" },
  ]);
});

test("simultaneous first receipts and newer revisions cannot overwrite each other", async (t) => {
  const { db, sql } = await database(t);
  const initial = await Promise.all([storePanelCatalog(sql, raw), storePanelCatalog(sql, raw)]);
  assert.deepEqual(initial.map((result) => result.status).sort(), [200, 201]);
  await Promise.all(
    [4, 3].map((revision) => storePanelCatalog(sql, JSON.stringify(sample(revision)))),
  );
  assert.equal((await readPanelCatalogStatus(sql))?.revision, 4);
  const rows = (
    await db.query<{ revision: number }>(
      "select revision from panel_catalog_snapshots order by revision",
    )
  ).rows;
  assert.equal(new Set(rows.map((row) => row.revision)).size, rows.length);
});

test("invalid payload and failed transaction preserve the last receipt", async (t) => {
  const { db, sql } = await database(t);
  await storePanelCatalog(sql, raw);
  await assert.rejects(storePanelCatalog(sql, JSON.stringify({ ...sample(2), preview: true })));
  const failing = adapter(db, (work) =>
    db.transaction(async (connection) => {
      await work(adapter(connection));
      throw new Error("synthetic transaction failure");
    }),
  );
  await assert.rejects(storePanelCatalog(failing, JSON.stringify(sample(2))));
  assert.equal((await readPanelCatalogStatus(sql))?.revision, 1);
  assert.equal(
    (await db.query<{ n: number }>("select count(*)::int as n from panel_catalog_snapshots"))
      .rows[0].n,
    1,
  );
});

test("archive corruption fails closed rather than acknowledging an older revision", async (t) => {
  const { db, sql } = await database(t);
  await storePanelCatalog(sql, raw);
  await storePanelCatalog(sql, JSON.stringify(sample(2)));
  await db.query("update panel_catalog_snapshots set body=$1 where revision=2", [raw]);
  await assert.rejects(readPanelCatalogStatus(sql));
  await assert.rejects(storePanelCatalog(sql, JSON.stringify(sample(3))));
  const storage = {
    read: () => readPanelCatalogStatus(sql),
    store: (body: string) => storePanelCatalog(sql, body),
  };
  for (const operation of [get(), request(JSON.stringify(sample(3)))]) {
    const response = await receivePanelCatalog(operation, config, storage);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).ready, false);
  }
});

test("database constraints and RLS protect the additive reception archive", async (t) => {
  const { db } = await database(t);
  const [row] = (
    await db.query<{ relrowsecurity: boolean }>(
      "select relrowsecurity from pg_class where relname='panel_catalog_snapshots'",
    )
  ).rows;
  assert.equal(row.relrowsecurity, true);
  for (const [revision, body, hash] of [
    [0, raw, checksum(raw)],
    [Number.MAX_SAFE_INTEGER + 1, raw, checksum(raw)],
    [1, "", checksum("")],
    [1, raw, "invalid"],
  ]) {
    await assert.rejects(
      db.query("insert into panel_catalog_snapshots(revision,body,checksum) values($1,$2,$3)", [
        revision,
        body,
        hash,
      ]),
    );
  }
});

test("storage errors reveal no credentials, SQL, provider payloads or false acknowledgements", async () => {
  const broken = async () => {
    throw new Error(`postgres://private:${secret}@host/database`);
  };
  const storage = { read: broken, store: broken };
  for (const operation of [get(), request()]) {
    const result = await receivePanelCatalog(operation, config, storage);
    assert.equal(result.status, 503);
    const body = await result.text();
    assert.equal(body.includes(secret), false);
    assert.equal(body.includes("postgres"), false);
    assert.equal(JSON.parse(body).ok, false);
    assert.equal(JSON.parse(body).active, false);
  }
});
