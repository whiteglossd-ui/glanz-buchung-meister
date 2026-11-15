import { z } from "zod";
import { RUNDUM_SERVICES } from "./rundum-service.ts";
import { berlinCalendarDate, isCalendarDate } from "./calendar-date.ts";
import { isEmailAddress } from "./utils.ts";
const email = z
  .string()
  .trim()
  .max(160)
  .refine(isEmailAddress, "Bitte eine gültige E-Mail-Adresse angeben.");
export const inquiryContact = {
  name: z.string().trim().min(2).max(120),
  email,
  phone: z
    .string()
    .trim()
    .max(40)
    .refine(
      (v) => !v || /^\+?[\d ()/.-]{6,40}$/.test(v),
      "Bitte eine gültige Telefonnummer angeben.",
    )
    .default(""),
  text: z.string().trim().min(1, "Bitte das Anliegen kurz beschreiben.").max(2000),
  privacy: z.literal(true),
  website: z.string().max(120).optional(),
};
export const rundumInquirySchema = z.object({
  ...inquiryContact,
  idempotencyKey: z.string().uuid(),
  vehicleMake: z.string().trim().min(1).max(80),
  vehicleModel: z.string().trim().min(1).max(80),
  services: z
    .array(z.string().refine((v) => (RUNDUM_SERVICES as readonly string[]).includes(v)))
    .min(1)
    .max(7)
    .refine((v) => new Set(v).size === v.length),
  pickupRequested: z.boolean().default(false),
  date: z
    .string()
    .max(10)
    .optional()
    .refine(
      (v) => !v || (isCalendarDate(v) && v >= berlinCalendarDate()),
      "Bitte einen gültigen Wunschtermin ab heute wählen.",
    ),
});
export const publicInquirySchema = z.object({
  ...inquiryContact,
  title: z.string().trim().min(2).max(160),
  requestId: z.string().uuid(),
  reviewEmailConsent: z.boolean().optional(),
});
export type RundumInquiryInput = z.infer<typeof rundumInquirySchema>;
export type TextInquiryInput = z.infer<typeof publicInquirySchema>;
