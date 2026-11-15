import { createHash } from "node:crypto";
import type { Sql } from "./db.ts";
import { ensureBookingOperationsSchema } from "./booking-operations.ts";
import { queuePanelIntake } from "./panel-intake.ts";
import {
  rundumInquirySchema,
  publicInquirySchema,
  type RundumInquiryInput,
  type TextInquiryInput,
} from "./rundum-schema.ts";
import type { Row } from "./hub-inquiries.ts";
import { RUNDUM_SERVICES } from "./rundum-service.ts";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export async function saveRundumInquiry(sql: Sql, raw: RundumInquiryInput) {
  const data = rundumInquirySchema.parse(raw);
  const services = RUNDUM_SERVICES.filter((service) => data.services.includes(service));
  return save(sql, data.idempotencyKey, "rundum-service", { ...data, services }, services);
}
export async function saveTextInquiry(sql: Sql, raw: TextInquiryInput) {
  const data = publicInquirySchema.parse(raw);
  return save(sql, data.requestId, "service-inquiry", data, []);
}
async function save(
  sql: Sql,
  requestId: string,
  kind: string,
  data: RundumInquiryInput | TextInquiryInput,
  services: string[],
) {
  if (data.website?.trim()) throw new Error("Anfrage abgelehnt.");
  await ensureBookingOperationsSchema(sql);
  const key = hash(`${kind}:${requestId}`);
  const fingerprint = hash(JSON.stringify({ ...data, website: undefined }));
  return sql.transaction(async (tx) => {
    await tx`update booking_workflow_locks set revision=revision+1 where shop_id='white-gloss'`;
    const [existing] = await tx<
      Row & { request_fingerprint: string }
    >`select * from bookings where shop_id='white-gloss' and request_key_hash=${key}`;
    if (existing) {
      let matches = existing.request_fingerprint === fingerprint;
      if (!matches && "services" in data) {
        let original: unknown;
        try {
          original =
            typeof existing.requested_services === "string"
              ? JSON.parse(existing.requested_services)
              : existing.requested_services;
        } catch {
          original = null;
        }
        // Old requests retain their original array order, fingerprint and outbox.
        // Only order may differ; every other field must still match its old hash.
        if (
          Array.isArray(original) &&
          original.length === services.length &&
          new Set(original).size === services.length &&
          original.every((service) => typeof service === "string" && services.includes(service))
        ) {
          matches =
            existing.request_fingerprint ===
            hash(
              JSON.stringify({
                ...data,
                services: original,
                website: undefined,
              }),
            );
        }
      }
      if (!matches)
        throw new Error(
          "Diese Anfragekennung wurde bereits verwendet. Bitte eine neue Anfrage beginnen.",
        );
      return { booking: existing, replayed: true };
    }
    const isRundum = "services" in data;
    const note = isRundum ? data.text : `${data.title}\n${data.text}`;
    const [row] =
      await tx<Row>`insert into bookings(shop_id,status,customer_name,phone,email,package_id,class_id,extra_ids,total_cents,pickup_cents,note,preferred_date,vehicle_make,vehicle_model,request_key_hash,request_fingerprint,request_kind,requested_services,pickup_requested,intake_version,review_email_consent)
      values('white-gloss','neu',${data.name},${data.phone},${data.email},${isRundum ? "rundum-service" : "service-inquiry"},'kompakt','[]',0,0,${note},${isRundum ? data.date || null : null},${isRundum ? data.vehicleMake : null},${isRundum ? data.vehicleModel : null},${key},${fingerprint},${kind},${JSON.stringify(services)},${isRundum && data.pickupRequested},1,${!isRundum && data.reviewEmailConsent === true}) returning *`;
    await tx`insert into inbox_messages(shop_id,channel,sender,subject,body,booking_id) values('white-gloss','form',${data.name},${isRundum ? "Neue Rundum-Service-Anfrage" : data.title},${note},${row.id})`;
    await queuePanelIntake(tx, row);
    return { booking: row, replayed: false };
  });
}
