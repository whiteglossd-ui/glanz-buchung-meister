import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { kickBookingDelivery } from "@/lib/booking-delivery";
import { saveBookingRequest } from "@/lib/booking-workflow";
import { reportOpenAiLead } from "@/lib/openai-conversions.server";
import { assertPublicPostLimit } from "@/lib/rate-limit";
import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import { publicBookingSchema } from "@/lib/booking-schema";
import { createRequestUploadCapability } from "@/lib/booking-upload-capability";
import { setBookingUploadCookie } from "@/lib/booking-upload-cookie.server";
import { deliverPanelIntake } from "@/lib/panel-intake";
import { panelOnlyEnabled } from "@/lib/booking-backend";
import { rundumInquirySchema, publicInquirySchema } from "@/lib/rundum-schema";
import { saveRundumInquiry, saveTextInquiry } from "@/lib/rundum-workflow";

export { publicBookingSchema };
export type { PublicBookingInput } from "@/lib/booking-schema";

export const createPublicBooking = createServerFn({ method: "POST" })
  .validator((input: unknown) => publicBookingSchema.parse(input))
  .handler(async ({ data }) => {
    assertSameSiteRequest();
    assertPublicPostLimit("booking");
    const sql = await getSql();
    const capability = createRequestUploadCapability(data.idempotencyKey);
    const { openAiMeasurement, ...bookingData } = data;
    const result = await saveBookingRequest(sql, bookingData, capability);
    const expires = result.booking.upload_token_expires_at;
    if (expires) capability.expiresAt = new Date(expires).toISOString();
    setBookingUploadCookie(result.booking.id, capability);
    // Provider failures never roll back the committed request or its durable outbox.
    if (!result.replayed) {
      const measurementStatus = await reportOpenAiLead(data.idempotencyKey, openAiMeasurement);
      if (measurementStatus === "failed") console.warn("OpenAI conversion delivery failed");
    }
    const handoff = panelOnlyEnabled()
      ? await deliverPanelIntake(sql, result.booking.id)
      : { panelSaved: false };
    kickBookingDelivery(sql);
    return {
      ...handoff,
      id: result.booking.id,
      reference: "reference" in handoff ? handoff.reference : `WG-${result.booking.id}`,
      total: result.booking.total_cents / 100,
      pickupOnRequest: result.quote.pickupOnRequest,
      confirmed: false,
    };
  });

export const createPublicRundumInquiry = createServerFn({ method: "POST" })
  .validator((input: unknown) => rundumInquirySchema.parse(input))
  .handler(async ({ data }) => {
    assertSameSiteRequest();
    assertPublicPostLimit("rundum-inquiry", 6);
    const sql = await getSql();
    const { booking } = await saveRundumInquiry(sql, data);
    const handoff = await deliverPanelIntake(sql, Number(booking.id));
    kickBookingDelivery(sql);
    return handoff;
  });

export const createPublicPhotoInquiry = createServerFn({ method: "POST" })
  .validator((input: unknown) => publicInquirySchema.parse(input))
  .handler(async ({ data }) => {
    assertSameSiteRequest();
    assertPublicPostLimit("service-inquiry", 6);
    const sql = await getSql();
    const { booking } = await saveTextInquiry(sql, data);
    const handoff = await deliverPanelIntake(sql, Number(booking.id));
    kickBookingDelivery(sql);
    return { ok: true as const, ...handoff };
  });

/** Historical files stay intact; customer uploads now require the panel session. */
export const attachBookingPhotos = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ vorgang: z.string(), files: z.array(z.unknown()).max(8) }).parse(input),
  )
  .handler(async (): Promise<{ count: number }> => {
    throw new Error("Fotos kannst du nach deiner Anfrage in deinem Kundenbereich ergänzen.");
  });
