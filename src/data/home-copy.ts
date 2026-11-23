export const homeCopy = {
  title: "Gib uns den Schlüssel – wir kümmern uns um den Rest.",
  lead: "Ob Daily Driver, Liebhaberwagen oder Leasingrückgabe: Wir prüfen dein Fahrzeug persönlich und stimmen Detailing, Lackpflege, Preis und Termin direkt mit dir ab.",
  body: "Ich bin Lars. Von der Abholung bis zur Rückgabe hast du einen Ansprechpartner. Ich prüfe Lack, Leder und Felgen und bespreche Pflege, Preis und Termin persönlich mit dir.",
};

const previousDefaults = {
  title: [
    "Gib mir den\nSchlüssel.",
    "Gib uns den Schlüssel –\nwir kümmern uns um den Rest.",
    "Ihr Auto.\nNicht nur sauber.\nWieder besonders.",
    "Dein Auto.\nNicht nur sauber.\nWieder besonders.",
  ],
  lead: [
    "Alltagsauto, Liebhaberwagen oder Leasingrückgabe? Ich hole dein Auto ab, bereite es auf und bringe es dir zurück.",
    "Fahrzeugaufbereitung, Lackkorrektur und Keramikschutz in Horb – persönlich geprüft, stressfrei abgeholt und digital übergeben.",
  ],
  body: [
    "Für den täglichen Weg zur Arbeit, Ihren Liebhaberwagen oder die Leasingrückgabe: Wir prüfen Ihr Fahrzeug persönlich und stimmen Pflege, Preis und Termin mit Ihnen ab.",
    "Für den täglichen Weg zur Arbeit, deinen Liebhaberwagen oder die Leasingrückgabe: Wir prüfen dein Fahrzeug persönlich und stimmen Pflege, Preis und Termin mit dir ab.",
  ],
};

// Previously published, unedited starter copy follows the new design. Each
// independently authored Studio field continues to take precedence.
export function homeText(field: keyof typeof homeCopy, saved = homeCopy[field]) {
  const normalized = saved.trim().replace(/\r\n/g, "\n");
  return previousDefaults[field].includes(normalized) ? homeCopy[field] : saved;
}
