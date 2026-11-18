/** A status label alone does not prove a signature or a payment. */
export function roappCustomerStep(status: string, fixed: boolean) {
  if (/abgelehnt|storniert/i.test(status))
    return {
      text: "Diese Anfrage wird nicht weiterbearbeitet. Für Änderungen oder einen neuen Termin kontaktiere uns bitte.",
      linkLabel: null,
    };
  if (!fixed)
    return {
      text: "Wir prüfen deine Angaben und Fahrzeugfotos. Preis und Termin sind noch nicht verbindlich bestätigt. Bei Rückfragen melden wir uns bei dir.",
      linkLabel: null,
    };
  if (status === "Fixpreis bestätigt")
    return {
      text: "Unsere Preisprüfung ist abgeschlossen. Prüfe jetzt die Leistungen, den Fixpreis und den Termin im Auftrag. Dort kannst du den Auftrag annehmen und selbst unterschreiben.",
      linkLabel: "Auftrag prüfen und unterschreiben",
    };
  if (status === "Akzeptiert")
    return {
      text: "Dein Auftrag ist als angenommen vermerkt. Wir prüfen die Kundenunterschrift und tragen anschließend deinen Termin verbindlich ein. Bei Änderungswünschen kontaktiere uns bitte.",
      linkLabel: "Auftrag ansehen",
    };
  if (status === "Termin verbindlich")
    return {
      text: "Wir haben deinen Termin nach Prüfung der Kundenannahme und Unterschrift verbindlich eingetragen. Abholung oder eigene Anlieferung stimmen wir mit dir ab.",
      linkLabel: "Auftrag ansehen",
    };
  if (status === "In Arbeit")
    return {
      text: "Dein Fahrzeug wird bearbeitet. Wir informieren dich, sobald die vereinbarten Arbeiten abgeschlossen sind.",
      linkLabel: "Auftrag ansehen",
    };
  if (
    [
      "Erledigt",
      "Warten auf Abholung",
      "Lieferung",
      "Geschlossen",
      "Archiviert",
      "In Rechnung gestellt",
    ].includes(status)
  )
    return {
      text: "Den aktuellen Stand siehst du im Auftrag. Abholung oder Rückgabe stimmen wir mit dir ab. Die Rechnung versenden wir separat nach erbrachter Leistung; dieser Status ist kein Zahlungsnachweis.",
      linkLabel: "Auftrag ansehen",
    };
  return {
    text: "Den aktuellen Bearbeitungsstand und die vereinbarten Angaben findest du im Auftrag. Bei Rückfragen kontaktiere uns bitte.",
    linkLabel: "Auftrag ansehen",
  };
}
