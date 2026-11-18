export type StatusLinkState = "ready" | "incomplete" | "missing";

const vorgangPattern = /^WG-\d{1,10}$/;

export function statusLinkState(vorgang: string, token: string): StatusLinkState {
  const hasVorgang = vorgangPattern.test(vorgang);
  const hasToken = token.trim().length > 0;
  if (hasVorgang && hasToken) return "ready";
  if (hasVorgang || hasToken) return "incomplete";
  return "missing";
}

export function statusPageHeading(vorgang: string) {
  return vorgangPattern.test(vorgang) ? `Auftrag ${vorgang}` : "Ihr Auftragsstatus";
}

export function formatStatusMoney(cents: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export const statusLinkCopy = {
  missing: {
    title: "Persönlicher Link nötig",
    body: "Den Auftragsstatus sehen Sie nur über den Link in Ihrer Eingangsbestätigung. Der Link enthält die Vorgangsnummer und einen Zugriffscode.",
    steps: [
      ["Eingangsbestätigung öffnen", "Die E-Mail enthält den persönlichen Statuslink."],
      ["Link vollständig verwenden", "Vorgangsnummer und Zugriffscode müssen beide in der Adresse stehen."],
      ["Stand hier ablesen", "Preis und Termin gelten erst, wenn sie ausdrücklich bestätigt sind."],
    ],
  },
  incomplete: {
    title: "Link unvollständig",
    body: "In dieser Adresse fehlt die Vorgangsnummer oder der Zugriffscode. Öffnen Sie den vollständigen Link aus Ihrer Eingangsbestätigung erneut.",
    steps: [
      ["Adresse prüfen", "Ein Teil des persönlichen Links fehlt oder wurde abgeschnitten."],
      ["Link aus der E-Mail erneut öffnen", "Übernehmen Sie die ganze Adresse, nicht nur die Vorgangsnummer."],
      ["Bei einer fehlenden E-Mail melden", "Telefon und E-Mail erreichen die Werkstatt direkt. Senden Sie den Zugriffscode nicht weiter."],
    ],
  },
} as const;
