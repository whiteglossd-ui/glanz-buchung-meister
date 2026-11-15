import { randomUUID } from "node:crypto";
import type { Sql } from "./db.ts";
import { toHubInquiry, type HubInquiry, type Row } from "./hub-inquiries.ts";

const ENDPOINT = "https://panel.white-gloss.de/api/website/intake";
const EMAIL_STATES = new Set(["queued", "accepted", "unknown", "failed", "not_configured"]);
export type PanelHandoff = { panelSaved: boolean; reference: string; emailStatus?: string };

/** Called inside the request transaction: a lost response cannot lose the handoff. */
export async function queuePanelIntake(sql: Sql, booking: Row) {
  const inquiry = toHubInquiry(booking);
  if (!inquiry) throw new Error("Anfrage konnte nicht zur Übergabe vorbereitet werden.");
  await sql`insert into panel_intake_queue(booking_id,payload) values(${inquiry.id},${JSON.stringify(inquiry)}) on conflict(booking_id) do nothing`;
}

export async function deliverPanelIntake(sql: Sql, id: number): Promise<PanelHandoff> {
  const pending = { panelSaved: false, reference: `WG-${id}` };
  const token = process.env.HUB_SYNC_TOKEN?.trim();
  if (!token || token.length < 32) return pending;
  const lease = randomUUID();
  const [job] = await sql<{ payload: string; attempts: number }>`
    update panel_intake_queue set state='processing',lease_token=${lease},lease_until=now()+interval '40 seconds',attempts=attempts+1,updated_at=now()
    where booking_id=${id} and (state in ('queued','failed') or (state='processing' and lease_until<now()))
    returning payload,attempts`;
  if (!job) {
    const [saved] = await sql<{
      state: string;
      panel_reference: string;
      email_status: string;
    }>`select state,panel_reference,email_status from panel_intake_queue where booking_id=${id}`;
    return saved?.state === "saved"
      ? { panelSaved: true, reference: saved.panel_reference, emailStatus: saved.email_status }
      : pending;
  }
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ inquiry: JSON.parse(job.payload) as HubInquiry }),
    });
    if (!response.ok) throw new Error(`http_${response.status}`);
    const result = (await response.json()) as {
      saved?: boolean;
      reference?: unknown;
      emailStatus?: unknown;
    };
    if (
      result.saved !== true ||
      typeof result.reference !== "string" ||
      !/^WG-\d{1,12}$/.test(result.reference) ||
      !EMAIL_STATES.has(String(result.emailStatus))
    )
      throw new Error("invalid_response");
    await sql`update panel_intake_queue set state='saved',panel_reference=${result.reference},email_status=${String(result.emailStatus)},lease_token=null,lease_until=null,last_error_code=null,updated_at=now() where booking_id=${id} and lease_token=${lease}`;
    return {
      panelSaved: true,
      reference: result.reference,
      emailStatus: String(result.emailStatus),
    };
  } catch {
    // Only a fixed error code: never customer data, bearer, provider payload or URL.
    const seconds = Math.min(3600, 30 * 2 ** Math.min(job.attempts, 7));
    await sql`update panel_intake_queue set state='failed',lease_token=null,lease_until=null,last_error_code='panel_handoff_unconfirmed',next_attempt_at=now()+${seconds}*interval '1 second',updated_at=now() where booking_id=${id} and lease_token=${lease}`;
    return pending;
  }
}

export async function runPanelIntake(sql: Sql) {
  const due = await sql<{
    booking_id: number;
  }>`select booking_id from panel_intake_queue where (state in ('queued','failed') and next_attempt_at<=now()) or (state='processing' and lease_until<now()) order by booking_id limit 40`;
  let saved = 0;
  for (const job of due) if ((await deliverPanelIntake(sql, job.booking_id)).panelSaved) saved++;
  return { saved, checked: due.length };
}
