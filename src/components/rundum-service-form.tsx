import { Link } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";
import { createPublicRundumInquiry } from "@/lib/bookings.functions";
import { createBookingRequestIdStore } from "@/lib/booking-request-id";
import { berlinCalendarDate } from "@/lib/calendar-date";
import { rundumInquiryErrors } from "@/lib/public-form-validation";
import { RUNDUM_SERVICES } from "@/lib/rundum-service";
import { useBookingDraft, clearBookingDraft } from "./booking-draft";
import { InquiryConfirmation, type InquiryReceipt } from "./inquiry-confirmation";
import { usePublicFormErrors } from "./public-form-feedback";
import { Button, Field, inputLine } from "./ui";

const initial = {
  name: "",
  email: "",
  phone: "",
  vehicleMake: "",
  vehicleModel: "",
  text: "",
  date: "",
};
const fields = [
  { key: "name", label: "Name", autoComplete: "name", maxLength: 120 },
  { key: "email", label: "E-Mail", autoComplete: "email", maxLength: 160, type: "email" },
  {
    key: "phone",
    label: "Telefon (optional)",
    autoComplete: "tel",
    maxLength: 40,
    type: "tel",
    optional: true,
  },
  { key: "vehicleMake", label: "Fahrzeugmarke", maxLength: 80 },
  { key: "vehicleModel", label: "Modell", maxLength: 80 },
] as const;

export function RundumServiceForm() {
  const [values, setValues] = useBookingDraft("rundum.values", initial);
  const [services, setServices] = useBookingDraft<string[]>("rundum.services", []);
  const [pickupRequested, setPickupRequested] = useBookingDraft("rundum.pickup", false);
  const [privacy, setPrivacy] = useBookingDraft("rundum.privacy", false);
  const [website, setWebsite] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<InquiryReceipt | null>(null);
  const submitting = useRef(false);
  const [requestIds] = useState(() =>
    createBookingRequestIdStore(
      () => (typeof window === "undefined" ? null : window.sessionStorage),
      () => crypto.randomUUID(),
      "white-gloss.rundum-request.v1",
    ),
  );
  const { fieldProps, fieldError, showErrors } = usePublicFormErrors();
  const update = (key: keyof typeof initial, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const errors = rundumInquiryErrors({ ...values, services, privacy }, berlinCalendarDate());
    if (event.currentTarget.querySelector<HTMLInputElement>("#rundum-date")?.validity.badInput)
      errors.date = "Bitte gib ein vollständiges Datum an oder lasse das Feld leer.";
    showErrors(errors, event.currentTarget);
    if (Object.keys(errors).length) {
      setError("Bitte prüfe die markierten Felder.");
      return;
    }
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      const saved = await createPublicRundumInquiry({
        data: {
          ...values,
          services,
          pickupRequested,
          privacy: true,
          website,
          idempotencyKey: requestIds.get(),
        },
      });
      setResult(saved);
      clearBookingDraft("rundum.");
      requestIds.clear();
    } catch {
      setError(
        "Der Eingang konnte noch nicht bestätigt werden. Du kannst dieselbe Anfrage erneut senden oder uns per WhatsApp kontaktieren.",
      );
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return result ? (
    <InquiryConfirmation {...result} />
  ) : (
    <form
      onSubmit={submit}
      noValidate
      data-hide-whatsapp
      aria-label="Rundum-Service anfragen"
      className="space-y-6"
    >
      <fieldset {...fieldProps("services")} tabIndex={-1} className="rundum-services">
        <legend className="mb-3 text-sm font-medium text-muted">
          Wobei können wir helfen? Mehrfachauswahl möglich.
        </legend>
        <div className="grid gap-x-6 sm:grid-cols-2">
          {RUNDUM_SERVICES.map((service) => (
            <label key={service} className="flex min-h-11 items-center gap-3 py-2 text-sm">
              <input
                type="checkbox"
                name="services"
                value={service}
                checked={services.includes(service)}
                disabled={pending}
                onChange={(event) =>
                  setServices((current) =>
                    event.target.checked
                      ? [...current, service]
                      : current.filter((value) => value !== service),
                  )
                }
              />
              <span>{service}</span>
            </label>
          ))}
        </div>
        {fieldError("services")}
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => (
          <Field key={field.key} tone="public" id={`rundum-${field.key}`} label={field.label}>
            <input
              id={`rundum-${field.key}`}
              name={field.key}
              {...fieldProps(field.key)}
              className={inputLine}
              type={"type" in field ? field.type : "text"}
              autoComplete={"autoComplete" in field ? field.autoComplete : undefined}
              maxLength={field.maxLength}
              required={!("optional" in field && field.optional)}
              disabled={pending}
              value={values[field.key]}
              onChange={(event) => update(field.key, event.target.value)}
            />
            {fieldError(field.key)}
          </Field>
        ))}
      </div>
      <Field tone="public" id="rundum-text" label="Dein Anliegen">
        <textarea
          id="rundum-text"
          name="text"
          {...fieldProps("text")}
          className={`${inputLine} min-h-24 py-2`}
          maxLength={2000}
          required
          disabled={pending}
          value={values.text}
          onChange={(event) => update("text", event.target.value)}
        />
        {fieldError("text")}
      </Field>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="pickupRequested"
          checked={pickupRequested}
          disabled={pending}
          onChange={(event) => setPickupRequested(event.target.checked)}
        />
        <span>Ich wünsche Hol- und Bringservice. Konditionen nach Absprache.</span>
      </label>
      <Field tone="public" id="rundum-date" label="Wunschtermin (optional)">
        <input
          id="rundum-date"
          name="date"
          type="date"
          {...fieldProps("date")}
          className={inputLine}
          min={berlinCalendarDate()}
          disabled={pending}
          value={values.date}
          onChange={(event) => update("date", event.target.value)}
        />
        {fieldError("date")}
        <p className="text-xs text-muted">Dein Wunschtermin ist noch kein bestätigter Termin.</p>
      </Field>
      <p className="text-sm leading-relaxed text-muted">
        Du erhältst nach Begutachtung und Abstimmung mit unseren Partnerbetrieben ein individuelles
        Angebot. Erst nach deiner Freigabe werden die vereinbarten Arbeiten ausgeführt.
      </p>
      <p className="text-sm text-muted">
        Fotos kannst du nach deiner Anfrage in deinem Kundenbereich ergänzen.
      </p>
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="rundum-website">Website</label>
        <input
          id="rundum-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>
      <label className="flex min-h-11 items-start gap-3 text-sm text-muted">
        <input
          id="rundum-privacy"
          name="privacy"
          {...fieldProps("privacy")}
          type="checkbox"
          className="mt-1"
          required
          disabled={pending}
          checked={privacy}
          onChange={(event) => setPrivacy(event.target.checked)}
        />
        <span>
          Ich habe die{" "}
          <Link to="/datenschutz" className="underline hover:text-fg">
            Datenschutzerklärung
          </Link>{" "}
          zur Kenntnis genommen. Die Anfrage ist unverbindlich.
        </span>
      </label>
      {fieldError("privacy")}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button tone="public" type="submit" disabled={pending} aria-busy={pending}>
        {pending ? "Wird gespeichert …" : "Rundum-Service unverbindlich anfragen"}
      </Button>
    </form>
  );
}
