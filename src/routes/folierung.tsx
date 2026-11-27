import { createFileRoute } from "@tanstack/react-router";
import { Car, Crown, Layers, Palette } from "lucide-react";
import { PartnerLanding, type PartnerLandingConfig } from "@/components/partner-landing";
import { site } from "@/data/site";
import { pageHead } from "@/lib/seo";

/** Photos: fill `photo` on an option (see docs/folierung-2026-11-27.md). */
const config: PartnerLandingConfig = {
  id: "folierung",
  path: "/folierung",
  serviceName: "Autofolierung und Farbwechsel",
  alternateNames: ["Car Wrapping", "Fahrzeugfolierung", "Auto folieren"],
  description:
    "Autofolierung und Car Wrapping in Horb am Neckar und Loßburg: Farbwechsel, Voll- und Teilfolierung bis zur Luxuskarosserie mit erfahrenem Partner-Folierer.",
  crumb: "Autofolierung",
  heroImage: "profile-wide",
  kicker: "Autofolierung · Car Wrapping",
  title: "Autofolierung und Farbwechsel.",
  lead:
    "Neue Farbe ohne Neulackierung: Wir folieren dein Auto ganz oder in Teilen, vom Alltagsauto bis zur Luxuskarosserie. Für Horb am Neckar, Loßburg und die Region. Die Folierung übernimmt ein erfahrener Partner-Folierer, dein Ansprechpartner bleibt White-Gloss.",
  primaryCta: "Folierung anfragen",
  introLabel: "Auto folieren lassen",
  introTitle: "Neue Farbe. Originallack bleibt.",
  intro:
    "Eine Autofolierung verändert die Optik deines Fahrzeugs, ohne dass neu lackiert wird. Ob kompletter Farbwechsel in Grün, Mattschwarz oder Satin, oder nur ein schwarzes Dach und dunkle Zierleisten: Der Folierer setzt es um, wir koordinieren alles für dich. Vor der Folierung prüfen wir den Lack, auch mit Lackdickenmessung.",
  options: [
    {
      id: "vollfolierung",
      label: "Vollfolierung",
      title: "Vollfolierung und Farbwechsel",
      text:
        "Dein Auto bekommt eine komplett neue Farbe, ohne dass neu lackiert wird. Der Folierer bezieht alle sichtbaren Außenflächen mit Folie. Den Farbton und das Finish suchst du vorher gemeinsam mit ihm aus.",
      points: [
        "Kompletter Farbwechsel ohne Neulackierung",
        "Große Auswahl an Farbtönen",
        "Originallack liegt geschützt unter der Folie",
        "Folie lässt sich in der Regel wieder entfernen",
      ],
      icon: Palette,
    },
    {
      id: "teilfolierung",
      label: "Teilfolierung",
      title: "Teilfolierung und Akzente",
      text:
        "Oft reichen einzelne Bauteile für einen neuen Look. Typisch sind ein schwarzes Dach, Spiegelkappen in Kontrastfarbe oder Chromleisten, die in Schwarz verschwinden.",
      points: [
        "Dach, Spiegelkappen und Motorhaube",
        "Chromleisten schwarz folieren (Chrome Delete)",
        "Zierleisten, Akzente und Streifen",
        "Kombinierbar mit Aufbereitung bei uns",
      ],
      icon: Layers,
    },
    {
      id: "finish",
      label: "Folienarten",
      title: "Glanz, Matt, Satin und Effekt",
      text:
        "Die Folie bestimmt die Wirkung. Glanzfolie wirkt wie frischer Lack, Mattfolie und Satinfolie wirken ruhig und edel. Effektfolien wechseln je nach Licht die Farbe.",
      points: [
        "Glanzfolie für den Look von Lack",
        "Matt und Satin für eine seidige Optik",
        "Effekt- und Farbwechselfolien",
        "Beratung zu Farbe und Finish am Muster",
      ],
      icon: Car,
    },
    {
      id: "luxus",
      label: "Luxusfahrzeuge",
      title: "Folierung für Luxus- und Sportwagen",
      text:
        "Bei hochwertigen Fahrzeugen zählt jedes Detail. Kanten, Spaltmaße und Anbauteile brauchen besondere Sorgfalt. Deshalb arbeiten wir hier mit einem Folierer, der solche Fahrzeuge kennt.",
      points: [
        "Luxus-, Sport- und Sammlerfahrzeuge",
        "Sorgfältige Arbeit an Kanten und Übergängen",
        "Lackprüfung vor der Folierung",
        "Auf Wunsch Hol- und Bringservice",
      ],
      icon: Crown,
    },
  ],
  steps: [
    ["Anfragen", "Schreib uns dein Fahrzeug und deine Wunschfarbe. Fotos vom Auto helfen für eine erste Einschätzung."],
    [
      "Beraten und prüfen",
      "Wir schauen uns den Lack an, auch mit Lackdickenmessung. Farbe, Folie und Umfang stimmst du mit dem Folierer ab. Den Preis erfährst du, bevor du zusagst.",
    ],
    ["Folieren", "Der Partner foliert dein Auto in seinem Fachbetrieb. Auf Wunsch holen wir das Fahrzeug bei dir ab und bringen es zurück."],
    ["Übergeben", "Wir schauen uns das Ergebnis gemeinsam an. Du bekommst die Pflegehinweise für deine Folie."],
  ],
  faqs: [
    {
      q: "Was kostet eine Autofolierung?",
      a: "Das hängt von Fahrzeuggröße, Folie, Umfang und Zustand des Lacks ab. Eine Vollfolierung ist deutlich aufwendiger als eine Teilfolierung. Deshalb gibt es keinen Pauschalpreis. Du bekommst den Preis nach der Begutachtung, bevor du zusagst.",
    },
    {
      q: "Wie lange dauert eine Folierung?",
      a: "Die Dauer hängt vom Fahrzeug und vom Umfang ab. Eine Teilfolierung geht schneller als ein kompletter Farbwechsel. Den Termin und die Dauer stimmen wir mit dem Folierer ab und sagen sie dir vorher.",
    },
    {
      q: "Schadet die Folie dem Lack?",
      a: "Auf intaktem Originallack lässt sich eine hochwertige Folie in der Regel wieder ablösen. Bei nachlackierten oder beschädigten Stellen kann beim Entfernen Lack mitgehen. Deshalb prüfen wir den Lack vorher, auch mit Lackdickenmessung.",
    },
    {
      q: "Was ist Car Wrapping?",
      a: "Car Wrapping ist der englische Begriff für Autofolierung. Gemeint ist das Bekleben des Fahrzeugs mit Folie, ganz oder in Teilen, zum Beispiel für einen Farbwechsel.",
    },
    {
      q: "Wie pflege ich ein foliertes Auto?",
      a: "Am schonendsten ist eine Handwäsche. Matte und satinierte Folien werden nicht poliert, weil sie sonst glänzende Stellen bekommen. Die genauen Pflegehinweise für deine Folie bekommst du bei der Übergabe.",
    },
    {
      q: "Foliert ihr auch Luxus- und Sportwagen?",
      a: "Ja. Wir folieren vom Alltagsauto bis zur Luxuskarosserie. Gerade bei hochwertigen Fahrzeugen prüfen wir den Lack vorher besonders genau.",
    },
    {
      q: "Wer foliert mein Auto?",
      a: "Die Folierung übernimmt ein erfahrener Partnerbetrieb, der auf Fahrzeugfolierung spezialisiert ist. Dein Ansprechpartner bleibt White-Gloss, von der Anfrage bis zur Übergabe.",
    },
    {
      q: "Gibt es die Folierung auch in Loßburg und Freudenstadt?",
      a: `Ja. Unsere Werkstatt ist in ${site.city}, in Loßburg entsteht unser neuer Standort. Auf Wunsch holen wir dein Auto in Loßburg, Freudenstadt, Nagold, Rottenburg und weiteren Orten ab und bringen es zurück.`,
    },
  ],
  inquiryTitle: "Autofolierung anfragen",
  inquiryHint:
    "Schreib kurz dein Fahrzeug, die Wunschfarbe und ob es eine Voll- oder Teilfolierung sein soll. Fotos ergänzt du nach der Anfrage in deinem Kundenbereich.",
  articles: [
    { slug: "auto-folieren-lassen", label: "Auto folieren lassen" },
    { slug: "folieren-oder-lackieren", label: "Folieren oder Lackieren" },
  ],
};

export const Route = createFileRoute("/folierung")({
  component: () => <PartnerLanding config={config} />,
  head: () =>
    pageHead({
      title: `Autofolierung Horb & Loßburg: Car Wrapping | ${site.name}`,
      description: config.description,
      path: config.path,
    }),
});
