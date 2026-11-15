import { isEmailAddress } from "./utils.ts";
import { isCalendarDate } from "./calendar-date.ts";
import { RUNDUM_SERVICES } from "./rundum-service.ts";

export type PublicFormField =
  | "name"
  | "phone"
  | "email"
  | "street"
  | "postalCode"
  | "town"
  | "date"
  | "note"
  | "privacy"
  | "services"
  | "vehicleMake"
  | "vehicleModel"
  | "text";
export type PublicFormErrors = Partial<Record<PublicFormField, string>>;

type ContactFields = { name: string; phone: string; privacy: boolean };

function contactErrors(
  { name, phone, privacy }: ContactFields,
  phoneRequired = true,
): PublicFormErrors {
  const errors: PublicFormErrors = {};
  // Match the existing public booking/photo-inquiry server validators.
  if (name.trim().length < 2 || name.trim().length > 120) {
    errors.name = "Bitte geben Sie Ihren Namen mit 2 bis 120 Zeichen an.";
  }
  if (
    (phoneRequired || phone.trim()) &&
    (phone.trim().length < 6 || phone.trim().length > 40 || !/^\+?[\d ()/.-]+$/.test(phone.trim()))
  ) {
    errors.phone = "Bitte geben Sie Ihre Telefonnummer mit 6 bis 40 Zeichen an.";
  }
  if (!privacy)
    errors.privacy =
      "Bitte bestätigen Sie, dass Sie die Datenschutzerklärung zur Kenntnis genommen haben.";
  return errors;
}

export function bookingFormErrors(
  values: ContactFields & {
    email: string;
    street: string;
    postalCode: string;
    town: string;
    date: string;
    note: string;
  },
  today: string,
): PublicFormErrors {
  const errors = contactErrors(values);
  // Required for the confirmation, documents and invoices; mirrors publicBookingSchema.
  if (values.email.trim().length > 160 || !isEmailAddress(values.email)) {
    errors.email = "Bitte geben Sie eine gültige E-Mail-Adresse an.";
  }
  if (values.street.trim().length < 3 || values.street.trim().length > 120) {
    errors.street = "Bitte geben Sie Straße und Hausnummer an.";
  }
  if (!/^\d{5}$/.test(values.postalCode.trim())) {
    errors.postalCode = "Bitte geben Sie eine fünfstellige Postleitzahl an.";
  }
  if (values.town.trim().length < 2 || values.town.trim().length > 80) {
    errors.town = "Bitte geben Sie den Ort an.";
  }
  if (values.date && (!isCalendarDate(values.date) || values.date < today)) {
    errors.date = "Bitte wählen Sie heute oder ein späteres Datum.";
  }
  if (values.note.length > 2000)
    errors.note = "Bitte kürzen Sie Ihre Nachricht auf höchstens 2.000 Zeichen.";
  return errors;
}

export function photoInquiryErrors(
  values: ContactFields & { email: string; text: string },
): PublicFormErrors {
  const errors = contactErrors(values, false);
  if (!isEmailAddress(values.email) || values.email.trim().length > 160)
    errors.email = "Bitte geben Sie eine gültige E-Mail-Adresse an.";
  if (!values.text.trim()) errors.text = "Bitte beschreiben Sie Ihr Anliegen.";
  if (values.text.length > 2000)
    errors.text = "Bitte kürzen Sie die Beschreibung auf höchstens 2.000 Zeichen.";
  return errors;
}

export function rundumInquiryErrors(
  values: ContactFields & {
    email: string;
    text: string;
    services: readonly string[];
    vehicleMake: string;
    vehicleModel: string;
    date: string;
  },
  today: string,
): PublicFormErrors {
  const errors = photoInquiryErrors(values);
  if (
    !values.services.length ||
    values.services.some((value) => !RUNDUM_SERVICES.some((service) => service === value))
  )
    errors.services = "Bitte wähle mindestens eine Leistung oder Beratung aus.";
  for (const field of ["vehicleMake", "vehicleModel"] as const) {
    if (!values[field].trim() || values[field].trim().length > 80)
      errors[field] =
        field === "vehicleMake"
          ? "Bitte gib die Fahrzeugmarke an."
          : "Bitte gib das Fahrzeugmodell an.";
  }
  if (values.date && (!isCalendarDate(values.date) || values.date < today))
    errors.date = "Bitte wähle heute oder ein späteres Datum.";
  return errors;
}
