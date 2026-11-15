import { useEffect, useRef } from "react";

export type InquiryReceipt = {
  reference: string;
  panelSaved: boolean;
  emailStatus?: string;
};

/** These are provider acceptance states, never evidence of delivery to an inbox. */
function inquiryMailText(status?: string) {
  if (status === "accepted")
    return "Die Eingangs-E-Mail wurde zum Versand angenommen. Die Zustellung ist noch nicht bestätigt.";
  if (status === "queued") return "Die Eingangs-E-Mail ist zum Versand vorgemerkt.";
  if (status === "unknown")
    return "Der E-Mail-Versand ist noch nicht bestätigt. Die Anfrage bleibt gespeichert.";
  return "Die Eingangs-E-Mail konnte noch nicht versendet werden. Die Anfrage bleibt gespeichert.";
}

export function InquiryConfirmation({ reference, panelSaved, emailStatus }: InquiryReceipt) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      className="space-y-4 border border-line bg-surface p-5 sm:p-6"
    >
      <p className="font-display text-2xl">Anfrage gespeichert</p>
      <p className="text-sm text-muted">
        Vorgang {reference}. Die Anfrage ist unverbindlich; ein Wunschtermin ist noch kein
        bestätigter Termin.
      </p>
      <p className="text-sm text-muted">
        {panelSaved
          ? inquiryMailText(emailStatus)
          : "Die Anfrage ist auf der Website gespeichert. Die Übergabe an den Kundenbereich steht noch aus. Bitte nicht erneut anfragen."}
      </p>
      <p className="text-sm text-muted">
        Fotos kannst du nach deiner Anfrage in deinem Kundenbereich ergänzen.
      </p>
      <p className="text-sm text-muted">
        Neue Kunden erhalten mit der Eingangs-E-Mail einen Link zur Passwortvergabe. Ein bestehendes
        Passwort bleibt erhalten.
      </p>
      <a href="https://panel.white-gloss.de/auth/customer" className="atelier-text-link">
        Zum Kundenbereich
      </a>
    </div>
  );
}
