import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { Sql } from "./db.ts";
import {
  PANEL_CATALOG_MAX_BYTES,
  PANEL_CATALOG_PROTOCOL,
  parsePanelCatalogSnapshot,
} from "./panel-catalog.model.ts";

export type PanelCatalogMetadata = { revision: number; hash: string; publishedAt: string };
export type PanelCatalogStoreResult =
  { status: 200 | 201; metadata: PanelCatalogMetadata } | { status: 409 };
type StoredRow = { revision: number | string; body: string; checksum: string };
type CatalogStorage = {
  read(): Promise<PanelCatalogMetadata | null>;
  store(raw: string): Promise<PanelCatalogStoreResult>;
};

const digest = (value: string | Uint8Array) => createHash("sha256").update(value).digest();
const hash = (value: string | Uint8Array) => digest(value).toString("hex");

function verifiedMetadata(row: StoredRow): PanelCatalogMetadata {
  if (hash(row.body) !== row.checksum) throw Error("catalog_archive_integrity");
  const snapshot = parsePanelCatalogSnapshot(Buffer.from(row.body, "utf8"));
  if (snapshot.revision !== Number(row.revision)) throw Error("catalog_archive_revision");
  return { revision: snapshot.revision, hash: row.checksum, publishedAt: snapshot.publishedAt };
}

/** Reports the latest receipt only. A corrupt latest version is never disguised as an older success. */
export async function readPanelCatalogStatus(sql: Sql): Promise<PanelCatalogMetadata | null> {
  const [row] = await sql.query<StoredRow>(
    "select revision,body,checksum from panel_catalog_snapshots order by revision desc limit 1",
  );
  return row ? verifiedMetadata(row) : null;
}

/** An append-only receipt. It never changes CMS, prices, bookings or the public renderer. */
export async function storePanelCatalog(sql: Sql, raw: string): Promise<PanelCatalogStoreResult> {
  const snapshot = parsePanelCatalogSnapshot(Buffer.from(raw, "utf8"));
  const metadata = {
    revision: snapshot.revision,
    hash: hash(raw),
    publishedAt: snapshot.publishedAt,
  };
  return sql.transaction(async (tx) => {
    // Serialize comparison and append, including two concurrent first receipts.
    await tx.query("lock table panel_catalog_snapshots in share row exclusive mode");
    const [latest] = await tx.query<StoredRow>(
      "select revision,body,checksum from panel_catalog_snapshots order by revision desc limit 1",
    );
    if (latest) {
      const previous = verifiedMetadata(latest);
      if (previous.revision >= metadata.revision) {
        return previous.revision === metadata.revision && latest.body === raw
          ? { status: 200, metadata: previous }
          : { status: 409 };
      }
    }
    await tx.query(
      "insert into panel_catalog_snapshots(revision,body,checksum) values ($1,$2,$3)",
      [metadata.revision, raw, metadata.hash],
    );
    return { status: 201, metadata };
  });
}

class CatalogReadError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

async function readBody(request: Request, timeoutMs: number): Promise<Uint8Array> {
  const length = request.headers.get("content-length");
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > PANEL_CATALOG_MAX_BYTES)) {
    throw new CatalogReadError(413, "payload_too_large");
  }
  if (!request.body) throw new CatalogReadError(400, "body_missing");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new CatalogReadError(408, "body_timeout")), timeoutMs);
  });
  try {
    while (true) {
      const chunk = await Promise.race([reader.read(), expired]);
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > PANEL_CATALOG_MAX_BYTES) throw new CatalogReadError(413, "payload_too_large");
      chunks.push(chunk.value);
    }
  } catch (error) {
    if (error instanceof CatalogReadError) throw error;
    throw new CatalogReadError(400, "body_unreadable");
  } finally {
    clearTimeout(timer);
    void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  if (!bytes) throw new CatalogReadError(400, "body_missing");
  if (length !== null && Number(length) !== bytes)
    throw new CatalogReadError(400, "body_length_mismatch");
  return Buffer.concat(chunks, bytes);
}

function response(status: number, body: Record<string, unknown>, allow = false) {
  return Response.json(
    { protocol: PANEL_CATALOG_PROTOCOL, active: false, ...body },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
        "X-Content-Type-Options": "nosniff",
        ...(allow ? { Allow: "GET, POST" } : {}),
      },
    },
  );
}

function accepted(metadata: PanelCatalogMetadata | null, status: 200 | 201 = 200) {
  return response(status, {
    ok: true,
    ready: true,
    status: "ready",
    revision: metadata?.revision ?? null,
    hash: metadata?.hash ?? null,
    publishedAt: metadata?.publishedAt ?? null,
  });
}

/** Server-to-server boundary, deliberately independent of browser sessions and CMS activation. */
export async function receivePanelCatalog(
  request: Request,
  config: { enabled: boolean; secret: string; persistent?: boolean; bodyTimeoutMs?: number },
  storage: CatalogStorage,
): Promise<Response> {
  if (
    request.headers.has("origin") ||
    // Node's native fetch adds only `Sec-Fetch-Mode: cors`, including server
    // requests. Real browser context (site/destination/user) remains forbidden.
    [...request.headers.keys()].some(
      (name) =>
        name.startsWith("sec-fetch-") &&
        (name !== "sec-fetch-mode" || request.headers.get(name) !== "cors"),
    )
  ) {
    return response(403, {
      ok: false,
      ready: false,
      status: "forbidden",
      error: "server_request_required",
    });
  }
  if (!["GET", "POST"].includes(request.method)) {
    return response(405, { ok: false, ready: false, status: "method_not_allowed" }, true);
  }
  if (config.secret.length < 32) {
    return response(503, {
      ok: false,
      ready: false,
      status: "unconfigured",
      error: "receiver_not_configured",
    });
  }
  if (
    !timingSafeEqual(
      digest(request.headers.get("authorization") ?? ""),
      digest(`Bearer ${config.secret}`),
    )
  ) {
    return response(401, { ok: false, ready: false, status: "unauthorized" });
  }
  if (!config.enabled) {
    return response(503, {
      ok: false,
      ready: false,
      status: "disabled",
      error: "receiver_disabled",
    });
  }
  if (config.persistent === false) {
    return response(503, {
      ok: false,
      ready: false,
      status: "unconfigured",
      error: "storage_not_configured",
    });
  }
  if (request.method === "GET") {
    try {
      return accepted(await storage.read());
    } catch {
      return response(503, {
        ok: false,
        ready: false,
        status: "unavailable",
        error: "storage_unavailable",
      });
    }
  }
  const signature = request.headers.get("x-white-gloss-snapshot") ?? "";
  if (!/^[a-f0-9]{64}$/.test(signature)) {
    return response(401, { ok: false, ready: false, status: "unauthorized" });
  }
  const contentType = request.headers.get("content-type") ?? "";
  if (
    !/^application\/json(?:\s*;\s*charset=utf-8)?\s*$/i.test(contentType) ||
    request.headers.has("content-encoding")
  ) {
    return response(415, { ok: false, ready: true, status: "invalid", error: "json_required" });
  }
  let raw: Uint8Array;
  try {
    raw = await readBody(request, config.bodyTimeoutMs ?? 15000);
  } catch (error) {
    const failure =
      error instanceof CatalogReadError ? error : new CatalogReadError(400, "body_unreadable");
    return response(failure.status, {
      ok: false,
      ready: true,
      status: "invalid",
      error: failure.code,
    });
  }
  if (
    !timingSafeEqual(
      createHmac("sha256", config.secret).update(raw).digest(),
      Buffer.from(signature, "hex"),
    )
  ) {
    return response(401, { ok: false, ready: false, status: "unauthorized" });
  }
  try {
    parsePanelCatalogSnapshot(raw);
  } catch {
    return response(422, { ok: false, ready: true, status: "invalid", error: "snapshot_invalid" });
  }
  try {
    const result = await storage.store(Buffer.from(raw).toString("utf8"));
    return result.status === 409
      ? response(409, { ok: false, ready: true, status: "conflict", error: "revision_conflict" })
      : accepted(result.metadata, result.status);
  } catch {
    return response(503, {
      ok: false,
      ready: false,
      status: "unavailable",
      error: "storage_unavailable",
    });
  }
}
