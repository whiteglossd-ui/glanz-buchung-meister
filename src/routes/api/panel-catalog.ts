import { createFileRoute } from "@tanstack/react-router";
import {
  readPanelCatalogStatus,
  receivePanelCatalog,
  storePanelCatalog,
} from "@/lib/panel-catalog.server";

async function receive({ request }: { request: Request }) {
  // Never load the embedded database fallback for a production reception claim.
  const sql = async () => (await import("@/lib/db")).getSql();
  return receivePanelCatalog(
    request,
    {
      enabled: process.env.PANEL_CATALOG_ENABLED === "1",
      secret: (process.env.HUB_SYNC_TOKEN ?? "").trim(),
      persistent: Boolean(process.env.DATABASE_URL?.trim()),
    },
    {
      read: async () => readPanelCatalogStatus(await sql()),
      store: async (raw) => storePanelCatalog(await sql(), raw),
    },
  );
}

// Receipt/archive only: the existing public pages do not read this table.
export const Route = createFileRoute("/api/panel-catalog")({
  server: { handlers: { GET: receive, POST: receive, ANY: receive } },
});
