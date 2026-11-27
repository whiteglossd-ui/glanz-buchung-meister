import { useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { createPublicPhotoInquiry } from "@/lib/bookings.functions";
import { photoInquiryErrors } from "@/lib/public-form-validation";
import { usePublicFormErrors } from "./public-form-feedback";
import { InquiryConfirmation, type InquiryReceipt } from "./inquiry-confirmation";
import { createBookingRequestIdStore } from "@/lib/booking-request-id";
import { Button, Field, inputLine } from "./ui";
import { useBookingDraft, clearBookingDraft } from "./booking-draft";

export function PhotoInquiry({
  title,
  hint,
  contact = false,
}: {
  title: string;
  hint: string;
  contact?: boolean;
}) {
  const draft = contact ? "contact." : "photo.";
  const [text, setText] = useBookingDraft(draft + "text", "");
  const [name, setName] = useBookingDraft(draft + "name", "");
  const [phone, setPhone] = useBookingDraft(draft + "phone", "");
  const [email, setEmail] = useBookingDraft(draft + "email", "");
  const [reviewEmailConsent, setReviewEmailConsent] = useBookingDraft(
    draft + "reviewEmailConsent",
    false,
  );
  const [privacy, setPrivacy] = useBookingDraft(draft + "privacy", false);
  const [website, setWebsite] = useState("");
  const [requestIds] = useState(() =>
    createBookingRequestIdStore(
      () => (typeof window === "undefined" ? null : window.sessionStorage),
      () => crypto.randomUUID(),
      `white-gloss.description-request.${title}`,
    ),
  );
  const submitting = useRef(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<InquiryReceipt | null>(null);
  const [pending, setPending] = useState(false);
  const { fieldProps, fieldError, showErrors } = usePublicFormErrors();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting.current) return;
    const errors = photoInquiryErrors({ name, phone, email, privacy, text });
    showErrors(errors, e.currentTarget);
    if (Object.keys(errors).length) {
      setError("Bitte prüfe die markierten Felder.");
      return;
    }
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      const result = await createPublicPhotoInquiry({
        data: {
          title,
          requestId: requestIds.get(),
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          reviewEmailConsent,
          text,
          privacy: true as const,
          website,
        },
      });
      setSent(result);
      clearBookingDraft(draft);
      requestIds.clear();
    } catch {
      setError(
        "Wir konnten den Eingang deiner Anfrage nicht bestätigen. Du kannst dieselbe Anfrage erneut senden oder uns telefonisch bzw. per WhatsApp kontaktieren.",
      );
      submitting.current = false;
      setPending(false);
    }
  }

  if (sent) return <InquiryConfirmation {...sent} />;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      data-hide-whatsapp
      aria-label={title}
      className="relative space-y-4 rounded-card border border-line bg-surface p-5 sm:p-7"
    >
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="text-sm text-muted">{hint}</p>
      {!contact && (
        <p className="text-xs text-subtle">
          Die Anfrage ist unverbindlich. Den Preis und einen Termin stimmen wir nach der
          Begutachtung mit dir ab.
        </p>
      )}
      <p className="text-sm text-muted">
        {contact
          ? "Nach deiner Anfrage erhältst du per E-Mail Zugang zu deinem Kundenbereich."
          : "Fotos kannst du nach deiner Anfrage in deinem Kundenbereich ergänzen."}
      </p>
      <Field tone="public" id="desc" label={contact ? "Nachricht" : "Beschreibung"}>
        <textarea
          id="desc"
          name="message"
          required
          {...fieldProps("text")}
          maxLength={2000}
          className={`${inputLine} min-h-28 py-2`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {fieldError("text")}
      </Field>
      <div className="grid items-start gap-4 sm:grid-cols-2">
        <Field tone="public" id="iname" label="Name">
          <input
            id="iname"
            className={inputLine}
            autoComplete="name"
            name="name"
            minLength={2}
            maxLength={120}
            {...fieldProps("name")}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {fieldError("name")}
        </Field>
        <Field tone="public" id="iphone" label="Telefon (optional)">
          <input
            id="iphone"
            className={inputLine}
            autoComplete="tel"
            inputMode="tel"
            type="tel"
            name="tel"
            minLength={6}
            maxLength={40}
            {...fieldProps("phone")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          {fieldError("phone")}
        </Field>
      </div>
      <Field tone="public" id="iemail" label="E-Mail für das Kundenkonto">
        <input
          id="iemail"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputLine}
          maxLength={160}
          value={email}
          {...fieldProps("email")}
          onChange={(e) => setEmail(e.target.value)}
        />
        {fieldError("email")}
      </Field>
      {!contact && (
        <label className="flex min-h-11 items-start gap-2 text-sm text-muted">
          <input
            type="checkbox"
            className="mt-1"
            checked={reviewEmailConsent}
            onChange={(e) => setReviewEmailConsent(e.target.checked)}
          />
          <span>
            Ich möchte sieben Tage nach dem abgeschlossenen Auftrag einmalig per E-Mail um ehrliches
            Feedback und eine Google-Bewertung gebeten werden. Freiwillig und jederzeit widerrufbar.
          </span>
        </label>
      )}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="iwebsite">Website</label>
        <input
          id="iwebsite"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
      <label htmlFor="iprivacy" className="flex min-h-11 items-start gap-2 text-sm text-muted">
        <input
          id="iprivacy"
          {...fieldProps("privacy")}
          type="checkbox"
          className="mt-1"
          checked={privacy}
          onChange={(e) => setPrivacy(e.target.checked)}
          required
        />
        <span className="min-w-0">
          Name, Kontaktdaten und Beschreibung werden zur Bearbeitung deiner Anfrage geschützt
          übermittelt. Siehe{" "}
          <Link to="/datenschutz" className="underline hover:text-fg">
            Datenschutzerklärung
          </Link>
          .
        </span>
      </label>
      {fieldError("privacy")}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <Button tone="public" type="submit" disabled={pending} aria-busy={pending}>
        {pending ? "Wird gesendet …" : "Anfrage senden"}
      </Button>
    </form>
  );
}
