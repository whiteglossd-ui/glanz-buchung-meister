import { createFileRoute } from "@tanstack/react-router";
import { CloudHail, DoorOpen, ScanSearch, Search } from "lucide-react";
import { PartnerLanding, type PartnerLandingConfig } from "@/components/partner-landing";
import { site } from "@/data/site";
import { pageHead } from "@/lib/seo";

/** Photos: fill `photo` on an option (files under public/media/partner/). */
const config: PartnerLandingConfig = {
  id: "dellen-druecken",
  path: "/dellen-druecken",
  serviceName: "Dellen drücken und Hagelschaden-Reparatur",
  alternateNames: [
    "Ausbeulen ohne Lackieren",
    "Dellenentfernung",
    "Hagelschaden reparieren",
    "Ausbeultechnik",
    "Dellen entfernen",
  ],
  description:
    "Dellen drücken und Hagelschaden in Horb am Neckar und Loßburg: Parkdellen und Hagel ohne Lackieren entfernen, mit erfahrenem Partnerbetrieb. Erste Einschätzung per Foto.",
  crumb: "Dellen drücken",
  heroImage: "inspection",
  kicker: "Dellen drücken · Hagelschaden · Ausbeulen ohne Lackieren",
  title: "Dellen und Hagelschäden ohne Lackieren.",
  lead:
    "Parkdellen, Türkantendellen oder Hagel: Der Partner drückt die Delle von innen heraus, ohne neu zu lackieren, wenn Lack und Blech es zulassen. Eine erste Einschätzung bekommst du oft schon per Foto. Für Horb am Neckar, Loßburg und die Region. Dein Ansprechpartner bleibt White-Gloss.",
  primaryCta: "Foto-Begutachtung anfragen",
  introLabel: "Ausbeulen ohne Lackieren",
  introTitle: "Blech zurück in Form. Lack bleibt original.",
  intro:
    "Beim Dellen drücken wird das Blech mit Spezialwerkzeug von innen langsam zurück in seine Form gebracht. Der Originallack bleibt erhalten. Das klappt, wenn die Stelle erreichbar ist und der Lack nicht gerissen ist. Ob das bei deinem Auto möglich ist, sagen wir dir vorher ehrlich.",
  options: [
    {
      id: "parkdellen",
      label: "Parkdellen",
      title: "Parkdellen und Türkantendellen",
      text:
        "Die typische Delle vom Parkplatz: eine Tür, ein Einkaufswagen, ein Stoß. Solche Dellen lassen sich oft ohne Lackieren herausdrücken.",
      points: [
        "Dellen von Türen und Einkaufswagen",
        "Türkantendellen",
        "Einzelne Dellen an Türen und Kotflügeln",
        "Erste Einschätzung oft per Foto",
      ],
      icon: DoorOpen,
    },
    {
      id: "hagel",
      label: "Hagelschaden",
      title: "Hagelschäden",
      text:
        "Nach einem Hagelschauer sind oft Dach, Motorhaube und Kofferraumdeckel voller kleiner Dellen. Der Partner arbeitet sie einzeln heraus, wenn der Lack unbeschädigt ist.",
      points: [
        "Einzelne oder zahlreiche Hageldellen",
        "Dach, Motorhaube und Heckklappe",
        "Begutachtung vor der Reparatur",
        "Lackprüfung vor der Arbeit",
      ],
      icon: CloudHail,
    },
    {
      id: "karosserie",
      label: "Karosseriedellen",
      title: "Kleinere Karosseriedellen",
      text:
        "Auch andere kleinere Dellen an zugänglichen Bauteilen lassen sich oft drücken. Entscheidend sind Größe, Lage und ob der Lack noch intakt ist.",
      points: [
        "Dellen an zugänglichen Bauteilen",
        "Lack muss unbeschädigt sein",
        "Kanten und Sicken prüfen wir genau",
        "Sonst Hinweis auf die passende Reparatur",
      ],
      icon: ScanSearch,
    },
    {
      id: "pruefung",
      label: "Prüfung",
      title: "Ehrliche Prüfung vorab",
      text:
        "Nicht jede Delle lässt sich drücken. Ist der Lack gerissen oder die Stelle nicht erreichbar, sagen wir dir das vorher und zeigen dir, welche Reparatur stattdessen sinnvoll ist.",
      points: [
        "Prüfung unter Streiflicht",
        "Klare Aussage, was möglich ist",
        "Alternativ Lackierarbeiten über Partner",
        "Preis vor der Zusage",
      ],
      icon: Search,
    },
  ],
  steps: [
    ["Anfragen", "Schick uns ein Foto der Delle, am besten schräg mit Licht von der Seite. So können wir eine erste Einschätzung geben."],
    ["Begutachten", "Wir schauen uns die Delle an und stimmen die Reparatur mit dem Partner ab. Den Preis erfährst du, bevor du zusagst."],
    ["Drücken", "Der Partner arbeitet die Delle heraus. Auf Wunsch holen wir dein Auto ab und bringen es zurück."],
    ["Übergeben", "Wir schauen uns das Ergebnis gemeinsam an. Auf Wunsch bekommt dein Auto danach noch Aufbereitung bei uns."],
  ],
  faqs: [
    {
      q: "Was kostet Dellen drücken?",
      a: "Das hängt von Anzahl, Größe und Lage der Dellen ab. Deshalb gibt es keinen Pauschalpreis. Den Preis erfährst du nach der Begutachtung, bevor du zusagst.",
    },
    {
      q: "Geht das bei jeder Delle?",
      a: "Nein. Die Stelle muss von innen erreichbar sein und der Lack darf nicht gerissen sein. Bei scharfen Knicken, an Kanten oder bei beschädigtem Lack ist oft eine andere Reparatur nötig. Das sagen wir dir vorher.",
    },
    {
      q: "Was mache ich nach einem Hagelschaden?",
      a: "Fotografiere die betroffenen Flächen, am besten mit Licht von der Seite, und schick uns die Bilder. Wir geben dir eine erste Einschätzung und schauen uns das Auto dann vor Ort an. Den Preis erfährst du, bevor du zusagst.",
    },
    {
      q: "Reicht ein Foto für die Einschätzung?",
      a: "Für eine erste Einschätzung oft ja. Fotografiere die Delle schräg mit Licht von der Seite. Verbindlich wird es erst, wenn wir das Fahrzeug gesehen haben.",
    },
    {
      q: "Muss danach lackiert werden?",
      a: "Wenn die Delle gedrückt werden kann, nein. Der Originallack bleibt erhalten. Ist der Lack beschädigt, koordinieren wir die Lackierarbeiten mit unserem Partner-Lackierbetrieb.",
    },
    {
      q: "Wer drückt die Dellen?",
      a: "Die Arbeit übernimmt ein erfahrener Partnerbetrieb, der auf Ausbeulen ohne Lackieren spezialisiert ist. Dein Ansprechpartner bleibt White-Gloss.",
    },
    {
      q: "Gibt es das auch in Loßburg und Freudenstadt?",
      a: `Ja. Unsere Werkstatt ist in ${site.city}, in Loßburg entsteht unser neuer Standort. Auf Wunsch holen wir dein Auto in Loßburg, Freudenstadt, Nagold, Rottenburg und weiteren Orten ab und bringen es zurück.`,
    },
  ],
  inquiryTitle: "Delle oder Hagelschaden prüfen lassen",
  inquiryHint:
    "Schreib kurz, wo die Delle sitzt und wie groß sie ungefähr ist. Fotos ergänzt du nach der Anfrage in deinem Kundenbereich.",
  articles: [{ slug: "smart-repair-oder-lackkorrektur", label: "Dellenentfernung oder Lackkorrektur" }],
};

export const Route = createFileRoute("/dellen-druecken")({
  component: () => <PartnerLanding config={config} />,
  head: () =>
    pageHead({
      title: `Dellen & Hagelschaden Horb, Loßburg: ohne Lackieren | ${site.name}`,
      description: config.description,
      path: config.path,
    }),
});
