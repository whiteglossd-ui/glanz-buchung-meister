import { createFileRoute } from "@tanstack/react-router";
import { Armchair, CircleDot, PaintRoller, Search } from "lucide-react";
import { PartnerLanding, type PartnerLandingConfig } from "@/components/partner-landing";
import { site } from "@/data/site";
import { pageHead } from "@/lib/seo";

/** Photos: fill `photo` on an option (files under public/media/partner/). */
const config: PartnerLandingConfig = {
  id: "smart-repair",
  path: "/smart-repair",
  serviceName: "Smart Repair",
  alternateNames: ["Spot Repair", "Kleinschadenreparatur", "Felgenreparatur", "Innenraumreparatur"],
  description:
    "Smart Repair in Horb am Neckar und Loßburg: kleine Lackschäden, Felgen mit Bordsteinschäden, Leder, Kunststoff und Brandlöcher gezielt reparieren. Mit erfahrenen Partnerbetrieben.",
  crumb: "Smart Repair",
  heroImage: "wheel-wide",
  kicker: "Smart Repair · Kleine Schäden",
  title: "Smart Repair für kleine Schäden.",
  lead:
    "Kleine Schäden gezielt an der betroffenen Stelle reparieren, statt ganze Teile zu tauschen. Außen am Lack und an den Felgen genauso wie im Innenraum. Für Horb am Neckar, Loßburg und die Region. Dein Ansprechpartner bleibt White-Gloss.",
  primaryCta: "Schaden anfragen",
  introLabel: "Smart Repair",
  introTitle: "Klein reparieren statt groß tauschen.",
  intro:
    "Smart Repair heißt: Nur die beschädigte Stelle wird repariert. Das spart oft das Lackieren ganzer Bauteile oder den Tausch teurer Teile. Was bei deinem Schaden möglich ist, klären wir vorab am Fahrzeug und mit dem passenden Partnerbetrieb.",
  options: [
    {
      id: "lack",
      label: "Lackschäden",
      title: "Kleine Lackschäden",
      text:
        "Einzelne Kratzer, Macken oder kleine Steinschläge werden punktuell ausgebessert, wenn die Stelle klein genug ist. Größere Schäden übernimmt der Lackierbetrieb.",
      points: [
        "Kleine Kratzer und Macken",
        "Einzelne Steinschläge",
        "Punktuelle Ausbesserung",
        "Größere Schäden über Lackierarbeiten",
      ],
      icon: PaintRoller,
    },
    {
      id: "felgen",
      label: "Felgen",
      title: "Felgen mit Bordsteinschäden",
      text:
        "Kratzer und Schrammen vom Bordstein lassen Felgen schnell ungepflegt wirken. Je nach Felge und Schaden kann der Partner die Stelle ausbessern.",
      points: [
        "Bordsteinschäden und Schrammen",
        "Kratzer am Felgenrand",
        "Prüfung, ob die Felge reparierbar ist",
        "Felgenreinigung bei uns auf Wunsch",
      ],
      icon: CircleDot,
    },
    {
      id: "innenraum",
      label: "Innenraum",
      title: "Leder, Kunststoff und Brandlöcher",
      text:
        "Abgenutzte Stellen am Leder, Kratzer im Kunststoff oder ein Brandloch im Sitz: Viele Schäden im Innenraum lassen sich gezielt reparieren, ohne das ganze Teil zu tauschen.",
      points: [
        "Leder an Sitzen und Lenkrad",
        "Kratzer an Kunststoffteilen",
        "Brandlöcher in Polstern",
        "Lederpflege bei uns auf Wunsch",
      ],
      icon: Armchair,
    },
    {
      id: "pruefung",
      label: "Prüfung",
      title: "Ehrliche Prüfung vorab",
      text:
        "Nicht jeder Schaden eignet sich für Smart Repair. Wir schauen uns die Stelle an und sagen dir vorher, ob eine punktuelle Reparatur sinnvoll ist oder eine andere Lösung besser passt.",
      points: [
        "Klare Aussage, was möglich ist",
        "Alternativ Lackierarbeiten oder Dellen drücken",
        "Preis vor der Zusage",
        "Ein Ansprechpartner für alles",
      ],
      icon: Search,
    },
  ],
  guides: [
    {
      id: "eignung",
      label: "Wissen",
      title: "Wann Smart Repair passt und wann nicht.",
      intro:
        "Smart Repair lohnt sich bei kleinen, klar begrenzten Schäden. Hier siehst du, was gut geht, wo die Grenzen sind und worauf wir achten.",
      items: [
        {
          title: "Gut geeignet",
          text: "Einzelne Kratzer und Macken, kleine Steinschläge, Bordsteinschrammen an Felgen und abgenutzte Stellen an Leder und Kunststoff.",
        },
        {
          title: "Eher nicht",
          text: "Großflächige Schäden, viele Schäden auf einem Bauteil oder Schäden tief im Material. Dann ist eine Lackierung oder ein Teiletausch meist die bessere Lösung.",
        },
        {
          title: "Felgen: Sicherheit zuerst",
          text: "Smart Repair an Felgen ist eine optische Reparatur. Ist eine Felge gerissen oder verbogen, gehört sie in die Fachwerkstatt und nicht in die Smart-Repair-Ausbesserung.",
        },
        {
          title: "Leder und Kunststoff",
          text: "Abgenutzte Stellen werden gereinigt, ausgebessert und farblich angeglichen. Wie nah das Ergebnis am Original ist, hängt vom Material ab.",
        },
        {
          title: "Brandlöcher",
          text: "Kleine Brandlöcher in Polstern lassen sich oft füllen und angleichen. Bei größeren Löchern sagen wir dir vorher, was realistisch ist.",
        },
        {
          title: "Aufbereitung danach",
          text: "Nach der Reparatur kann dein Auto bei uns gereinigt und gepflegt werden, innen wie außen. So wirkt das ganze Fahrzeug wieder stimmig.",
        },
      ],
    },
  ],
  steps: [
    ["Anfragen", "Schreib uns, wo der Schaden sitzt. Fotos vom Schaden und von der Umgebung helfen für eine erste Einschätzung."],
    ["Begutachten", "Wir schauen uns die Stelle an und stimmen die Reparatur mit dem passenden Partner ab. Den Preis erfährst du, bevor du zusagst."],
    ["Reparieren", "Der Partner repariert die Stelle gezielt. Auf Wunsch holen wir dein Auto ab und bringen es zurück."],
    ["Übergeben", "Wir schauen uns das Ergebnis gemeinsam an. Auf Wunsch bekommt dein Auto danach noch Aufbereitung bei uns."],
  ],
  faqs: [
    {
      q: "Was ist Smart Repair?",
      a: "Smart Repair ist die gezielte Reparatur kleiner Schäden an der betroffenen Stelle. Statt ein ganzes Bauteil zu lackieren oder zu tauschen, wird nur der Schaden ausgebessert.",
    },
    {
      q: "Was kostet Smart Repair?",
      a: "Das hängt von Art, Größe und Lage des Schadens ab. Deshalb gibt es keinen Pauschalpreis. Den Preis erfährst du nach der Begutachtung, bevor du zusagst.",
    },
    {
      q: "Welche Schäden eignen sich?",
      a: "Vor allem kleine Schäden: einzelne Kratzer und Macken im Lack, Bordsteinschäden an Felgen sowie Schäden an Leder, Kunststoff und Polstern im Innenraum. Größere Schäden brauchen oft Lackierarbeiten oder einen Teiletausch.",
    },
    {
      q: "Sieht man die Reparatur danach noch?",
      a: "Das hängt vom Schaden und vom Material ab. Wir sagen dir vorher ehrlich, welches Ergebnis realistisch ist.",
    },
    {
      q: "Kann man eine gerissene Felge mit Smart Repair reparieren?",
      a: "Nein. Smart Repair an Felgen ist eine optische Reparatur für Kratzer und Bordsteinschäden. Ist eine Felge gerissen oder verbogen, ist das eine Frage der Sicherheit und gehört in die Fachwerkstatt.",
    },
    {
      q: "Wer macht die Reparatur?",
      a: "Die Arbeit übernimmt ein erfahrener Partnerbetrieb, der auf die jeweilige Reparatur spezialisiert ist. Dein Ansprechpartner bleibt White-Gloss.",
    },
    {
      q: "Gibt es Smart Repair auch in Loßburg und Freudenstadt?",
      a: `Ja. Unsere Werkstatt ist in ${site.city}, in Loßburg entsteht unser neuer Standort. Auf Wunsch holen wir dein Auto in Loßburg, Freudenstadt, Nagold, Rottenburg und weiteren Orten ab und bringen es zurück.`,
    },
  ],
  inquiryTitle: "Smart Repair anfragen",
  inquiryHint:
    "Schreib kurz, um welchen Schaden es geht und wo er sitzt. Fotos ergänzt du nach der Anfrage in deinem Kundenbereich.",
  articles: [{ slug: "smart-repair-oder-lackkorrektur", label: "Dellenentfernung oder Lackkorrektur" }],
};

export const Route = createFileRoute("/smart-repair")({
  component: () => <PartnerLanding config={config} />,
  head: () =>
    pageHead({
      title: `Smart Repair Horb & Loßburg: Lack, Felgen, Leder | ${site.name}`,
      description: config.description,
      path: config.path,
    }),
});
