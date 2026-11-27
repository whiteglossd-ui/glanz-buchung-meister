import { Link } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";
import { createPublicRundumInquiry } from "@/lib/bookings.functions";
import { createBookingRequestIdStore } from "@/lib/booking-request-id";
import { berlinCalendarDate } from "@/lib/calendar-date";
import { rundumInquiryErrors, type PublicFormErrors } from "@/lib/public-form-validation";
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
const contactFields = [
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
] as const;
const vehicleFields = [
  { key: "vehicleMake", label: "Fahrzeugmarke", maxLength: 80 },
  { key: "vehicleModel", label: "Modell", maxLength: 80 },
] as const;

export function RundumServiceForm() {
  const [values, setValues] = useBookingDraft("rundum.values", initial);
  const [services, setServices] = useBookingDraft<string[]>("rundum.services", []);
  const [pickupRequested, setPickupRequested] = useBookingDraft("rundum.pickup", false);
  const [privacy, setPrivacy] = useBookingDraft("rundum.privacy", false);
  const [step, setStep] = useBookingDraft<1 | 2>("rundum.step", 1);
  const heading = useRef<HTMLHeadingElement>(null);
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

  function changeStep(next: 1 | 2) {
    setStep(next);
    setError("");
    window.requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: "start", behavior: "instant" });
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const errors = rundumInquiryErrors({ ...values, services, privacy }, berlinCalendarDate());
    if (event.currentTarget.querySelector<HTMLInputElement>("#rundum-date")?.validity.badInput)
      errors.date = "Bitte gib ein vollständiges Datum an oder lasse das Feld leer.";
    const serviceErrors: PublicFormErrors = {};
    for (const key of ["services", "vehicleMake", "vehicleModel", "text", "date"] as const) {
      if (errors[key]) serviceErrors[key] = errors[key];
    }
    if (Object.keys(serviceErrors).length) {
      setStep(1);
      showErrors(serviceErrors, event.currentTarget);
      setError("Bitte prüfe die markierten Felder.");
      return;
    }
    if (step === 1) {
      showErrors({}, event.currentTarget);
      changeStep(2);
      return;
    }
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

  function renderField(field: (typeof contactFields | typeof vehicleFields)[number]) {
    return (
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
    );
  }

  return result ? (
    <InquiryConfirmation {...result} />
  ) : (
    <form
      onSubmit={submit}
      noValidate
      data-hide-whatsapp
      aria-label="Rundum-Service anfragen"
      className="space-y-4"
    >
      <header>
        <p id="rundum-progress" className="text-xs text-muted">
          Schritt {step} von 2
        </p>
        <h3
          ref={heading}
          tabIndex={-1}
          aria-describedby="rundum-progress"
          className="mt-1 scroll-mt-24 font-display text-2xl"
        >
          {step === 1 ? "Fahrzeug & Anliegen" : "Kontakt & Anfrage"}
        </h3>
      </header>
      <div hidden={step !== 1} className="space-y-4">
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
        <div className="grid gap-3 sm:grid-cols-2">{vehicleFields.map(renderField)}</div>
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
      </div>
      <div hidden={step !== 2} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">{contactFields.map(renderField)}</div>
        <p className="text-sm leading-relaxed text-muted">
          Du erhältst nach Begutachtung und Abstimmung mit unseren Partnerbetrieben ein
          individuelles Angebot. Erst nach deiner Freigabe werden die vereinbarten Arbeiten
          ausgeführt.
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
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        {step === 2 && (
          <Button
            tone="public"
            variant="ghost"
            type="button"
            disabled={pending}
            onClick={() => changeStep(1)}
          >
            Zurück
          </Button>
        )}
        <Button tone="public" type="submit" disabled={pending} aria-busy={pending}>
          {step === 1
            ? "Weiter zu Kontakt & Anfrage"
            : pending
              ? "Wird gespeichert …"
              : "Rundum-Service unverbindlich anfragen"}
        </Button>
      </div>
    </form>
  );
}
