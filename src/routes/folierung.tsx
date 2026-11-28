import { createFileRoute } from "@tanstack/react-router";
import { Car, Crown, Layers, Palette } from "lucide-react";
import { PartnerLanding, type PartnerLandingConfig } from "@/components/partner-landing";
import { atmosphere } from "@/data/partner-photos";
import { site } from "@/data/site";
import { pageHead } from "@/lib/seo";

/** Option images are illustrative atmosphere (caption "Symbolbilder"); swap in released partner photos via `photo`. */
const config: PartnerLandingConfig = {
  id: "folierung",
  path: "/folierung",
  serviceName: "Autofolierung und Farbwechsel",
  alternateNames: ["Car Wrapping", "Fahrzeugfolierung", "Auto folieren"],
  description:
    "Autofolierung und Car Wrapping in Horb am Neckar, Dornhan und Loßburg: Farbwechsel, Voll- und Teilfolierung bis zur Luxuskarosserie mit erfahrenem Partner-Folierer.",
  crumb: "Autofolierung",
  heroImage: "profile-wide",
  kicker: "Autofolierung · Car Wrapping",
  title: "Autofolierung und Farbwechsel.",
  lead:
    "Neue Farbe ohne Neulackierung: Dein Auto wird ganz oder in Teilen foliert, vom Alltagsauto bis zur Luxuskarosserie. Für Horb am Neckar, Dornhan, Loßburg und die Region. Die Folierung übernimmt ein erfahrener Partner-Folierer, dein Ansprechpartner bleibt White-Gloss.",
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
      photo: atmosphere("studio-wide"),
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
      photo: atmosphere("chrome-curves"),
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
      photo: atmosphere("hood-wide", 1600, 800),
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
      photo: atmosphere("taillight", 1600, 800),
    },
  ],
  guides: [
    {
      id: "folienarten",
      label: "Folienarten",
      title: "Welche Folie passt zu deinem Auto?",
      intro:
        "Folie ist nicht gleich Folie. Material, Oberfläche und Farbe entscheiden, wie das Ergebnis aussieht und wie lange es hält. Hier die wichtigsten Unterschiede, einfach erklärt.",
      items: [
        {
          title: "Gegossene Folie",
          text: "Für Vollfolierungen nutzt man in der Regel gegossene Hochleistungsfolie. Sie ist dünn und dehnbar und legt sich auch an Rundungen, Sicken und Kanten sauber an.",
        },
        {
          title: "Kalandrierte Folie",
          text: "Kalandrierte Folie ist weniger dehnbar. Sie passt eher zu flachen Flächen, Beschriftungen und einfachen Teilfolierungen als zu stark geformten Bauteilen.",
        },
        {
          title: "Glanzfolie",
          text: "Glanzfolie wirkt wie frischer Lack. Sie ist die richtige Wahl, wenn dein Auto nach dem Farbwechsel aussehen soll wie ab Werk lackiert.",
        },
        {
          title: "Matt und Satin",
          text: "Matte Folie schluckt das Licht, Satin hat einen seidigen Schimmer. Beide wirken ruhig und edel und brauchen etwas andere Pflege als Glanzfolie.",
        },
        {
          title: "Effekt- und Strukturfolien",
          text: "Effektfolien wechseln je nach Licht und Blickwinkel die Farbe. Strukturfolien bringen eine fühlbare Oberfläche, zum Beispiel in Carbon-Optik.",
        },
        {
          title: "Chrom und Spiegeleffekt",
          text: "Großflächige Chrom- oder Spiegelfolie ist im Straßenverkehr nicht erlaubt, weil sie andere blenden kann. Für kleine Akzente wird sie meist toleriert.",
        },
      ],
    },
    {
      id: "haltbarkeit",
      label: "Haltbarkeit",
      title: "Wie lange eine Folierung hält.",
      intro:
        "Eine gute Folierung hält mehrere Jahre. Wie viele genau, hängt von drei Dingen ab: der Folie, der Fläche und der Pflege.",
      items: [
        {
          title: "Folie und Verarbeitung",
          text: "Gegossene Hochleistungsfolien halten deutlich länger als einfache Folien. Genauso wichtig ist die Verarbeitung: Sauber umgelegte Kanten lösen sich nicht so schnell.",
        },
        {
          title: "Senkrecht und waagerecht",
          text: "Dach, Motorhaube und Kofferraumdeckel bekommen am meisten Sonne und Wetter ab. Deshalb geben Hersteller für waagerechte Flächen kürzere Zeiten an als für Türen und Seitenteile.",
        },
        {
          title: "Standort und Pflege",
          text: "Garage oder Carport, eine schonende Wäsche und schnell entfernte Verschmutzungen wie Vogelkot verlängern die Lebensdauer deiner Folie.",
        },
      ],
      note:
        "Beispiel einer Herstellerangabe: 3M nennt für die Wrap-Film-Serie 2080 eine Garantie von bis zu 7 Jahren an senkrechten und 2 Jahren an waagerechten Flächen. Welche Folie bei deinem Auto verwendet wird und was dafür gilt, erfährst du vor der Zusage.",
    },
    {
      id: "pflege",
      label: "Pflege",
      title: "So pflegst du ein foliertes Auto.",
      intro:
        "Mit der richtigen Pflege bleibt die Folie lange schön. Die wichtigsten Regeln passen auf einen Blick. Die genauen Hinweise für deine Folie bekommst du bei der Übergabe.",
      items: [
        {
          title: "Handwäsche",
          text: "Am schonendsten ist die Handwäsche mit mildem Autoshampoo und weichem Mikrofaser-Handschuh. Danach mit einem weichen Tuch trocknen.",
        },
        {
          title: "Waschanlage",
          text: "Wenn Waschanlage, dann mit Textilbürsten und ohne Heißwachs. Ob das für deine Folie passt, sagen wir dir bei der Übergabe.",
        },
        {
          title: "Hochdruckreiniger",
          text: "Halte mindestens 50 Zentimeter Abstand und richte den Strahl nicht direkt auf Kanten und Folienränder. Sonst kann sich die Folie dort lösen.",
        },
        {
          title: "Matte Folien",
          text: "Matte und satinierte Folien nicht polieren und nicht wachsen. Sonst entstehen glänzende Stellen, die sich nicht mehr entfernen lassen.",
        },
        {
          title: "Die ersten Tage",
          text: "Der Kleber braucht nach der Folierung etwas Zeit. Kleine Bläschen in den ersten Tagen können normal sein. Bleiben sie, melde dich bei uns.",
        },
        {
          title: "Flecken schnell entfernen",
          text: "Vogelkot, Baumharz und Insekten am besten bald mit Wasser und weichem Tuch abnehmen. Nicht kratzen und nicht scheuern.",
        },
      ],
    },
    {
      id: "erlaubt",
      label: "Erlaubt",
      title: "Was beim Folieren erlaubt ist.",
      intro:
        "Fast jede Farbe ist möglich. Ein paar Regeln aus der Straßenverkehrs-Zulassungs-Ordnung gelten trotzdem. Darauf achten wir schon bei der Beratung.",
      items: [
        {
          title: "Kennzeichen und Leuchten",
          text: "Kennzeichen, Scheinwerfer und Rückleuchten dürfen nicht foliert werden. Sie müssen frei und gut erkennbar bleiben.",
        },
        {
          title: "Spiegelnde und leuchtende Folien",
          text: "Großflächige Chrom- und Spiegelfolien sind nicht erlaubt, ebenso reflektierende Warn- und Signalfarben. Kleine Chrom-Akzente sind meist kein Problem.",
        },
        {
          title: "Schriftzüge und Motive",
          text: "Geschützte Begriffe wie „Polizei“ und Hoheitszeichen sind tabu. Bei eigenen Motiven und Schriftzügen sprechen wir das vorher mit dir durch.",
        },
      ],
      note:
        "Quelle: ADAC-Ratgeber „Auto folieren“. Ob du einen Farbwechsel deiner Zulassungsstelle oder Versicherung melden solltest, klärst du am besten vorher kurz direkt dort.",
    },
  ],
  steps: [
    ["Anfragen", "Schreib uns dein Fahrzeug und deine Wunschfarbe. Fotos vom Auto helfen für eine erste Einschätzung."],
    [
      "Beraten und prüfen",
      "Wir schauen uns den Lack an, auch mit Lackdickenmessung. Farbe, Folie und Umfang stimmst du mit dem Folierer ab. Den Preis erfährst du, bevor du zusagst.",
    ],
    [
      "Folieren",
      "Der Partner reinigt und entfettet den Lack, baut je nach Fahrzeug Anbauteile wie Türgriffe oder Embleme ab und legt die Folie an den Kanten sauber um. Auf Wunsch holen wir das Fahrzeug bei dir ab und bringen es zurück.",
    ],
    ["Übergeben", "Wir schauen uns das Ergebnis gemeinsam an, auch Kanten und Übergänge. Du bekommst die Pflegehinweise für deine Folie."],
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
      q: "Wie lange hält eine Autofolierung?",
      a: "Eine gute Folierung hält mehrere Jahre. Wie lange genau, hängt von der Folie, der Fläche und der Pflege ab. Waagerechte Flächen wie Dach und Motorhaube altern schneller als Türen und Seitenteile. Welche Folie bei deinem Auto verwendet wird und was dafür gilt, erfährst du vor der Zusage.",
    },
    {
      q: "Was ist der Unterschied zwischen gegossener und kalandrierter Folie?",
      a: "Gegossene Folie ist dünn und sehr dehnbar. Sie legt sich auch an Rundungen und Kanten sauber an und wird deshalb in der Regel für Vollfolierungen genutzt. Kalandrierte Folie ist weniger dehnbar und passt eher zu flachen Flächen und Beschriftungen.",
    },
    {
      q: "Darf ich mit einem folierten Auto in die Waschanlage?",
      a: "Am schonendsten ist die Handwäsche. Wenn du in die Waschanlage fährst, dann mit Textilbürsten und ohne Heißwachs. Beim Hochdruckreiniger mindestens 50 Zentimeter Abstand halten und nicht direkt auf die Folienkanten zielen.",
    },
    {
      q: "Ist Chromfolie erlaubt?",
      a: "Großflächige Chrom- oder Spiegelfolie ist im Straßenverkehr nicht erlaubt, weil sie andere Verkehrsteilnehmer blenden kann. Kleine Akzente, etwa an Spiegelkappen oder Zierleisten, werden meist toleriert. Kennzeichen, Scheinwerfer und Leuchten dürfen grundsätzlich nicht foliert werden.",
    },
    {
      q: "Muss ich einen Farbwechsel melden?",
      a: "Kläre das am besten vor der Folierung kurz mit deiner Zulassungsstelle und deiner Versicherung. Dann bist du auf der sicheren Seite.",
    },
    {
      q: "Kann ich nur das Dach oder die Spiegel folieren lassen?",
      a: "Ja. Eine Teilfolierung ist oft der einfachste Weg zu einem neuen Look. Typisch sind ein schwarzes Dach, Spiegelkappen in Kontrastfarbe oder schwarze statt verchromte Zierleisten.",
    },
    {
      q: "Wie pflege ich ein foliertes Auto?",
      a: "Am schonendsten ist eine Handwäsche. Matte und satinierte Folien werden nicht poliert, weil sie sonst glänzende Stellen bekommen. Die genauen Pflegehinweise für deine Folie bekommst du bei der Übergabe.",
    },
    {
      q: "Foliert ihr auch Luxus- und Sportwagen?",
      a: "Ja, vom Alltagsauto bis zur Luxuskarosserie. Gerade bei hochwertigen Fahrzeugen prüfen wir den Lack vorher besonders genau.",
    },
    {
      q: "Wer foliert mein Auto?",
      a: "Die Folierung übernimmt ein erfahrener Partnerbetrieb, der auf Fahrzeugfolierung spezialisiert ist. Dein Ansprechpartner bleibt White-Gloss, von der Anfrage bis zur Übergabe.",
    },
    {
      q: "Gibt es die Folierung auch in Dornhan, Loßburg und Freudenstadt?",
      a: `Ja. Unsere Werkstatt ist in ${site.city}. Aus Dornhan sind es rund 20 Kilometer, in Loßburg entsteht unser neuer Standort. Auf Wunsch holen wir dein Auto in Dornhan, Loßburg, Freudenstadt, Sulz, Nagold und weiteren Orten ab und bringen es zurück. Den Abholpreis bestätigen wir vorher anhand deiner Adresse.`,
    },
  ],
  inquiryTitle: "Autofolierung anfragen",
  inquiryHint:
    "Schreib kurz dein Fahrzeug, die Wunschfarbe und ob es eine Voll- oder Teilfolierung sein soll. Fotos ergänzt du nach der Anfrage in deinem Kundenbereich.",
  articles: [
    { slug: "auto-folieren-lassen", label: "Auto folieren lassen" },
    { slug: "folieren-oder-lackieren", label: "Folieren oder Lackieren" },
    { slug: "autofolie-pflegen", label: "Autofolie pflegen" },
  ],
};

export const Route = createFileRoute("/folierung")({
  component: () => <PartnerLanding config={config} />,
  head: () =>
    pageHead({
      title: `Autofolierung Horb, Dornhan & Loßburg: Car Wrapping | ${site.name}`,
      description: config.description,
      path: config.path,
    }),
});
