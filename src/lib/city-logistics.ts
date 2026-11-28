import { cityPickupPriceText, site, type City } from "../data/site.ts";
import { cityJourneyText } from "./city-copy.ts";

/** Existing handover instructions take precedence; other hubs get planning help,
 * not another copy of their introduction. All figures use the booking data. */
export function cityPlanningText(city: City) {
  if (city.pickupNote) return city.pickupNote;
  const price = cityPickupPriceText(city);
  const journey = cityJourneyText(city).replace(/Min\.$/, "Minuten");
  const plans: Record<string, string> = {
    "horb-am-neckar": `In Horb kannst du zwischen eigener Fahrzeugabgabe nach Terminvereinbarung und Abholung wählen. Den Hol- und Bringservice bieten wir nach Absprache an. Nenne bei der Anfrage deine gewünschte Übergabeart und was am Fahrzeug gemacht werden soll; den Umfang klären wir anhand des Zustands.`,
    nagold: `Für die Abholung aus Nagold rechnen wir mit ${journey}. Der Hol- und Bringservice kostet ${price}. Wenn du Reinigung oder Lackpflege planst, beschreib die betroffenen Bereiche oder sende Fotos mit. So lassen sich Leistung und Übergabe gemeinsam abstimmen.`,
    "rottenburg-am-neckar": `Für die Strecke aus Rottenburg am Neckar gelten ${journey} als Richtwert. Der Hol- und Bringservice kostet ${price}. Gib die vollständige Abholadresse und den Fahrzeugzustand an. Ob Innenraumreinigung, Politur oder Keramikschutz zu deinem Anliegen passt, klären wir vor der Terminvereinbarung.`,
    freudenstadt: `Von Freudenstadt nach Horb sind es rund ${city.km} km, etwa ${city.minutes} Minuten Fahrt. Mit Classic oder Signature kostet der Hol- und Bringservice ${price}. Wenn du den Schlüssel persönlich übergeben möchtest, vereinbaren wir dafür eine Uhrzeit.`,
    lossburg: `Die Abholung in Loßburg ist ${price} möglich. Nenn mir deine Adresse und was du am Auto machen lassen möchtest. Du bekommst von mir ein Angebot mit Preis, Abholtermin und Rückgabe.`,
    "oberndorf-am-neckar": `Für die Abholung aus Oberndorf am Neckar rechnen wir mit ${journey}. Der Hol- und Bringservice kostet ${price}. Teile uns mit, wann du das Fahrzeug wieder benötigst. Den Arbeitsumfang klären wir anhand des Fahrzeugzustands; Abholung und Rückgabe stimmen wir persönlich mit dir ab.`,
    herrenberg: `Mit ${journey} als Richtwert lohnt sich eine gemeinsame Planung von Fahrzeugübergabe und Rückgabe. Der Hol- und Bringservice aus Herrenberg kostet ${price}. Nenne bei der Anfrage auch, wann du das Auto wieder brauchst, damit wir die Aufbereitung und beide Übergaben abstimmen können.`,
    tuebingen: `Der Hol- und Bringservice aus Tübingen kostet ${price}; der Richtwert für die Strecke ist ${journey}. Beschreib vorab, ob es um Innenraum, Lack oder langfristigen Schutz geht. Fotos helfen bei der ersten Einschätzung; die Arbeiten selbst finden unter Werkstattbedingungen in Horb statt.`,
    calw: `Für die Strecke aus Calw gelten ${journey} als Richtwert. Der Hol- und Bringservice kostet ${price}. Alternativ kannst du das Fahrzeug nach Terminvereinbarung selbst nach Horb bringen. Nenne bei der Anfrage deine gewünschte Übergabeart; Zustand, Leistungsumfang und Rückgabe klären wir anschließend mit dir.`,
    balingen: `Wenn du eine Aufbereitung vor Verkauf oder Leasingrückgabe planst, nenne uns den gewünschten Fertigstellungstermin und zeig die betroffenen Stellen. Für die Abholung aus Balingen rechnen wir mit ${journey}; der Hol- und Bringservice kostet ${price}. Welche Gebrauchsspuren sich behandeln lassen, klären wir anhand deines Fahrzeugs.`,
    rottweil: `Für Fahrzeuge aus Rottweil beträgt der Richtwert ${journey}; der Hol- und Bringservice kostet ${price}. Beschreib bei der Anfrage, ob eine Reinigung genügt oder ob du auch Lackkorrektur wünschst. Das vereinbarte Ergebnis und der Fahrzeugzustand bestimmen den Umfang, nicht die Entfernung zur Werkstatt.`,
    boeblingen: `Böblingen liegt mit ca. ${city.km} km am Rand unseres Abholgebiets. Der Hol- und Bringservice kostet ${price}; den Betrag nennen wir mit dem Terminangebot. Bitte nenne die genaue Übergabeadresse, damit wir die Konditionen vor dem Termin bestätigen können.`,
    reutlingen: `Für die Abholung aus Reutlingen rechnen wir mit ${journey}. Der Hol- und Bringservice kostet ${price}; den Betrag nennen wir mit dem Terminangebot. Beschreib die Verschmutzung im Innenraum oder die betroffenen Lackstellen, damit wir die gewünschte Leistung und Rückgabe abstimmen können.`,
    sindelfingen: `Sindelfingen liegt mit ca. ${city.km} km außerhalb unseres festen Abholradius: Hier erfolgt der Hol- und Bringservice ${price}. Nenne deshalb bei der Anfrage deine Übergabeadresse und das gewünschte Paket; den Preis nennen wir mit dem Terminangebot.`,
  };
  return plans[city.slug] ?? `Für ${city.name} beträgt der Richtwert ${journey}. Hol- und Bringservice: ${price}. Bitte nenne die vollständige Übergabeadresse und beschreib den Fahrzeugzustand. Leistungsumfang, Preis und Rückgabe stimmen wir vor dem Termin ab.`;
}

/** Clarify existing boundary conditions, without inventing local customer questions. */
export function cityLogisticsFaq(city: City): { question: string; answer: string } | undefined {
  const price = cityPickupPriceText(city);
  switch (city.slug) {
    case "horb-am-neckar":
      return {
        question: "Kann ich mein Fahrzeug in Horb selbst abgeben?",
        answer: `Ja, nach Terminvereinbarung an unserer Werkstatt: ${site.street}, ${site.postalCode} ${site.city}. Alternativ holen wir dein Fahrzeug nach Absprache ab und bringen es zurück. Gib deine gewünschte Übergabeart bereits bei der Anfrage an.`,
      };
    case "empfingen":
      return {
        question: "Wie läuft die Abholung aus Empfingen ab?",
        answer: `Für Empfingen ist bei ca. ${city.km} km der Hol- und Bringservice ${price}. Der Richtwert bezieht sich auf die Ortsmitte. Für eine Adresse in Wiesenstetten oder Dommelsberg nenne bitte den Ortsteil dazu; den Abholpreis bestätigen wir anhand der vollständigen Adresse vor dem Termin.`,
      };
    case "boeblingen":
      return {
        question: "Welche Abholkonditionen gelten für Böblingen am Rand des Abholradius?",
        answer: `Böblingen liegt ca. ${city.km} km von unserer Werkstatt in Horb entfernt. Der Hol- und Bringservice kostet ${price}; den Betrag nennen wir mit dem Terminangebot. Maßgeblich für die Abstimmung ist deine tatsächliche Übergabeadresse.`,
      };
    case "reutlingen":
      return {
        question: "Wie wird die Abholung aus Reutlingen berechnet?",
        answer: `Die Strecke von Reutlingen nach Horb beträgt als Richtwert ca. ${city.km} km. Der Hol- und Bringservice kostet ${price}; den Betrag nennen wir mit dem Terminangebot. Gib die genaue Adresse an, damit wir die Konditionen bestätigen können.`,
      };
    case "sindelfingen":
      return {
        question: "Warum steht für Sindelfingen „auf Anfrage“?",
        answer: `Der Richtwert für Sindelfingen beträgt ca. ${city.km} km. Die Abholung erfolgt ${price}. Die tatsächliche Übergabeadresse und den Preis klären wir mit dem Terminangebot.`,
      };
    default:
      return undefined;
  }
}

