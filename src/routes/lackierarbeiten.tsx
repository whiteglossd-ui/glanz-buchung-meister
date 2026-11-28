import { createFileRoute } from "@tanstack/react-router";
import { Paintbrush, ShieldCheck, Sparkles, SprayCan } from "lucide-react";
import { PartnerLanding, type PartnerLandingConfig } from "@/components/partner-landing";
import { atmosphere } from "@/data/partner-photos";
import { site } from "@/data/site";
import { pageHead } from "@/lib/seo";

/** Option images are illustrative atmosphere (caption "Symbolbilder"); swap in released partner photos via `photo`. */
const config: PartnerLandingConfig = {
  id: "lackierarbeiten",
  path: "/lackierarbeiten",
  serviceName: "Lackierarbeiten",
  alternateNames: ["Autolackierung", "Auto lackieren", "Teillackierung", "Lackschaden reparieren"],
  description:
    "Lackierarbeiten in Horb am Neckar, Dornhan und Loßburg: Kratzer, Steinschläge, Teil- und Bauteillackierung mit erfahrenem Lackierbetrieb. Preis nach Begutachtung.",
  crumb: "Lackierarbeiten",
  heroImage: "hood-wide",
  kicker: "Lackierarbeiten · Partner-Lackierbetrieb",
  title: "Lackierarbeiten vom Fachbetrieb.",
  lead:
    "Kratzer bis auf die Grundierung, Steinschläge oder ein beschädigtes Bauteil: Wir koordinieren die Reparatur mit einem erfahrenen Lackierbetrieb. Für Horb am Neckar, Dornhan, Loßburg und die Region. Dein Ansprechpartner bleibt White-Gloss.",
  primaryCta: "Lackschaden anfragen",
  introLabel: "Auto lackieren lassen",
  introTitle: "Erst prüfen. Dann lackieren.",
  intro:
    "Nicht jeder Kratzer braucht neuen Lack. Feine Waschkratzer behandeln wir oft schon mit einer Politur bei uns. Geht der Schaden tiefer, prüft der Lackierbetrieb, ob eine kleine Ausbesserung reicht oder ein Bauteil neu lackiert wird. So bekommst du die Reparatur, die zum Schaden passt.",
  options: [
    {
      id: "kratzer",
      label: "Kratzer",
      title: "Kratzer und Schrammen",
      text:
        "Kratzer, die durch den Klarlack bis in Farbe oder Grundierung gehen, lassen sich mit Politur nicht mehr schließen. Dann ist der Lackierer gefragt.",
      points: [
        "Kratzer bis auf die Grundierung",
        "Schrammen an Türen, Kotflügeln und Stoßfängern",
        "Prüfung, ob Politur noch reicht",
        "Ehrliche Einschätzung vorab",
      ],
      icon: Paintbrush,
      photo: atmosphere("inspection", 1024, 1536),
    },
    {
      id: "steinschlag",
      label: "Steinschläge",
      title: "Steinschläge ausbessern",
      text:
        "Steinschläge an Front, Motorhaube und Spiegeln sehen nicht nur unschön aus. An offenen Stellen kann Feuchtigkeit an das Blech kommen. Der Lackierbetrieb bessert sie passend zum Schaden aus.",
      points: [
        "Front, Motorhaube und Spiegel",
        "Ausbesserung einzelner Stellen",
        "Lackierung ganzer Bauteile, wenn nötig",
        "Auf Wunsch danach Versiegelung bei uns",
      ],
      icon: ShieldCheck,
      photo: atmosphere("headlight-wide"),
    },
    {
      id: "bauteil",
      label: "Bauteillackierung",
      title: "Teil- und Bauteillackierung",
      text:
        "Ist ein Bauteil stärker beschädigt, wird es neu lackiert. Der Lackierbetrieb stimmt den Farbton auf dein Fahrzeug ab, damit der Übergang zum restlichen Lack passt.",
      points: [
        "Stoßfänger, Türen, Kotflügel und Hauben",
        "Spiegel und Anbauteile",
        "Farbton passend zum Fahrzeug",
        "Umfang und Preis vor der Zusage",
      ],
      icon: SprayCan,
      photo: atmosphere("chrome-curves"),
    },
    {
      id: "finish",
      label: "Finish",
      title: "Politur und Versiegelung danach",
      text:
        "Nach der Lackierung kann dein Auto zu uns. Mit Aufbereitung, Politur oder Versiegelung wirkt das ganze Fahrzeug wieder einheitlich.",
      points: [
        "Fahrzeugaufbereitung bei White-Gloss",
        "Politur für einheitlichen Glanz",
        "Versiegelung und Keramik auf Wunsch",
        "Alles mit einem Ansprechpartner",
      ],
      icon: Sparkles,
      photo: atmosphere("polish-sq", 1254, 1254),
    },
  ],
  guides: [
    {
      id: "lackaufbau",
      label: "Wissen",
      title: "Wie tief geht der Schaden?",
      intro:
        "Autolack besteht aus mehreren Schichten. Ob eine Politur reicht oder lackiert werden muss, hängt davon ab, welche Schicht beschädigt ist.",
      items: [
        {
          title: "Klarlack",
          text: "Die oberste, durchsichtige Schicht schützt die Farbe und sorgt für den Glanz. Feine Kratzer, die nur hier sitzen, lassen sich oft polieren.",
        },
        {
          title: "Basislack",
          text: "Darunter liegt die Farbschicht. Ist sie verletzt, siehst du oft einen helleren Strich. Dann hilft Politur allein nicht mehr.",
        },
        {
          title: "Grundierung und Blech",
          text: "Sieht man die Grundierung oder sogar Blech, sollte die Stelle bald repariert werden. Sonst kann Feuchtigkeit an das Blech kommen.",
        },
        {
          title: "Faustregel Fingernagel",
          text: "Fahr vorsichtig mit dem Fingernagel quer über den Kratzer. Bleibt er hängen, geht der Kratzer meist tiefer als der Klarlack. Sicher sagen können wir es erst am Fahrzeug.",
        },
        {
          title: "Farbton abstimmen",
          text: "Lack verändert sich mit den Jahren durch Sonne und Wetter. Deshalb stimmt der Lackierbetrieb den Farbton auf dein Auto ab, nicht nur auf den Farbcode.",
        },
        {
          title: "Nach der Lackierung",
          text: "Frischer Lack braucht Zeit zum Aushärten. Wann du wieder polieren oder versiegeln kannst, sagt dir der Lackierbetrieb. Danach übernehmen wir das gern.",
        },
      ],
    },
  ],
  steps: [
    ["Anfragen", "Schreib uns, wo der Schaden sitzt. Fotos vom ganzen Bauteil und aus der Nähe helfen für eine erste Einschätzung."],
    ["Begutachten", "Wir schauen uns den Schaden an und stimmen die Reparatur mit dem Lackierbetrieb ab. Den Preis erfährst du, bevor du zusagst."],
    ["Lackieren", "Der Partner lackiert in seinem Fachbetrieb. Auf Wunsch holen wir dein Auto ab und bringen es zurück."],
    ["Übergeben", "Wir schauen uns das Ergebnis gemeinsam an. Auf Wunsch bekommt dein Auto danach noch Aufbereitung oder Versiegelung bei uns."],
  ],
  faqs: [
    {
      q: "Was kostet eine Lackierung?",
      a: "Das hängt vom Schaden, vom Bauteil und vom Farbton ab. Eine kleine Ausbesserung kostet weniger als ein neu lackiertes Bauteil. Deshalb gibt es keinen Pauschalpreis. Den Preis erfährst du nach der Begutachtung, bevor du zusagst.",
    },
    {
      q: "Reicht bei meinem Kratzer eine Politur?",
      a: "Feine Kratzer im Klarlack lassen sich oft polieren. Geht der Kratzer bis in die Farbe oder Grundierung, hilft Politur nicht mehr. Wir prüfen das am Fahrzeug und sagen dir ehrlich, was sinnvoll ist.",
    },
    {
      q: "Passt der neue Lack zum Rest des Autos?",
      a: "Der Lackierbetrieb stimmt den Farbton auf dein Fahrzeug ab. Wie der Übergang gelöst wird, bespricht er vorher mit dir.",
    },
    {
      q: "Woher weiß ich, wie tief ein Kratzer ist?",
      a: "Eine Faustregel: Fahr vorsichtig mit dem Fingernagel quer über den Kratzer. Bleibt er hängen, geht der Kratzer meist tiefer als der Klarlack, und eine Politur reicht oft nicht. Sicher sagen können wir es erst, wenn wir die Stelle gesehen haben.",
    },
    {
      q: "Wann kann ich nach der Lackierung wieder versiegeln?",
      a: "Frischer Lack braucht Zeit zum Aushärten. Den richtigen Zeitpunkt nennt dir der Lackierbetrieb. Danach übernehmen wir Politur und Versiegelung gern bei uns.",
    },
    {
      q: "Wer lackiert mein Auto?",
      a: "Die Lackierung übernimmt ein erfahrener Lackierbetrieb aus unserem Partnernetz. Dein Ansprechpartner bleibt White-Gloss, von der Anfrage bis zur Übergabe.",
    },
    {
      q: "Wie lange dauert eine Lackierung?",
      a: "Das hängt vom Umfang ab. Den Termin und die Dauer stimmen wir mit dem Lackierbetrieb ab und sagen sie dir vorher.",
    },
    {
      q: "Gibt es Lackierarbeiten auch in Dornhan, Loßburg und Freudenstadt?",
      a: `Ja. Unsere Werkstatt ist in ${site.city}. Aus Dornhan sind es rund 20 Kilometer, in Loßburg entsteht unser neuer Standort. Auf Wunsch holen wir dein Auto in Dornhan, Loßburg, Freudenstadt, Sulz, Nagold und weiteren Orten ab und bringen es zurück. Den Abholpreis bestätigen wir vorher anhand deiner Adresse.`,
    },
  ],
  inquiryTitle: "Lackierarbeiten anfragen",
  inquiryHint:
    "Schreib kurz, wo der Schaden sitzt und wie er entstanden ist. Fotos ergänzt du nach der Anfrage in deinem Kundenbereich.",
  articles: [
    { slug: "folieren-oder-lackieren", label: "Folieren oder Lackieren" },
    { slug: "smart-repair-oder-lackkorrektur", label: "Dellenentfernung oder Lackkorrektur" },
  ],
};

export const Route = createFileRoute("/lackierarbeiten")({
  component: () => <PartnerLanding config={config} />,
  head: () =>
    pageHead({
      title: `Lackierarbeiten Horb, Dornhan & Loßburg: Kratzer | ${site.name}`,
      description: config.description,
      path: config.path,
    }),
});
