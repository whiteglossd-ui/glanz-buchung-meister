import { cities, services } from "../data/site.ts";
import { articleNavigation } from "./article-navigation.ts";
import { citySeoCopy } from "./city-copy.ts";

export type SearchIntent = {
  cluster: string;
  intent: "local" | "commercial" | "informational" | "navigational";
  purpose: string;
};

/** Optional reviewed overrides for articles published via the existing CMS. */
export const cmsSeoIntents: Record<string, SearchIntent> = {};

export function resolveSeoIntent(
  path: string,
  publishedPage?: { title: string; description: string },
): SearchIntent | undefined {
  if (seoIntents[path]) return seoIntents[path];
  if (!/^\/ratgeber\/[^/]+$/.test(path)) return undefined;
  if (cmsSeoIntents[path]) return cmsSeoIntents[path];
  // The editor's published title provides a provisional informational intent.
  // This is not a demand/ranking assertion; editorial semantic review remains required.
  const subject = publishedPage?.title.replace(/\s*\|\s*White(?:-|\s)?Gloss(?: Detailing)?\s*$/i, "").trim();
  if (!subject || !publishedPage?.description.trim()) return undefined;
  return {
    cluster: subject.toLowerCase(),
    intent: "informational",
    purpose: publishedPage.description,
  };
}

/** One primary intent per indexable URL. This is editorial mapping, not a ranking claim. */
export const seoIntents: Record<string, SearchIntent> = {
  "/": {
    cluster: "fahrzeugaufbereitung horb",
    intent: "local",
    purpose: "Betrieb in Horb finden und Termin anfragen",
  },
  "/freudenstadt-lossburg": {
    cluster: "werkstatt lossburg freudenstadt",
    intent: "local",
    purpose: "Geplanten Standort Loßburg kennenlernen und Abholung im Raum Freudenstadt anfragen",
  },
  "/leistungen": {
    cluster: "autopflege leistungen übersicht",
    intent: "commercial",
    purpose: "Einzelleistungen vergleichen und auswählen",
  },
  "/preise": {
    cluster: "autoaufbereitung preise pakete",
    intent: "commercial",
    purpose: "Paketumfang, Einstiegspreise und Kalkulation vergleichen",
  },
  "/abholservice": {
    cluster: "autoaufbereitung hol und bringservice",
    intent: "commercial",
    purpose: "Abholgebiete und Entfernungsstaffeln vergleichen",
  },
  "/luxusfahrzeuge": {
    cluster: "luxusfahrzeug aufbereitung",
    intent: "commercial",
    purpose: "Pflege hochwertiger Fahrzeuge abklären",
  },
  "/qualitaet": {
    cluster: "white gloss arbeitsweise",
    intent: "navigational",
    purpose: "Arbeitsabläufe und Qualitätskontrolle prüfen",
  },
  "/faq": {
    cluster: "white gloss häufige fragen",
    intent: "navigational",
    purpose: "Übergreifende Fragen vor der Buchung beantworten",
  },
  "/kontakt": {
    cluster: "white gloss kontakt anfahrt",
    intent: "navigational",
    purpose: "Betrieb kontaktieren und Werkstatt erreichen",
  },
  "/galerie": {
    cluster: "white gloss aufbereitung ergebnisse",
    intent: "navigational",
    purpose: "Echte Arbeitsbeispiele ansehen",
  },
  "/dellen-hagelschaden": {
    cluster: "hagelschaden foto begutachtung",
    intent: "commercial",
    purpose: "Konkreten Schaden zur Prüfung einreichen",
  },
  "/folierung": {
    cluster: "autofolierung farbwechsel horb",
    intent: "commercial",
    purpose: "Autofolierung, Farbwechsel oder Teilfolierung anfragen",
  },
  "/folierung-smart-repair": {
    cluster: "dellen lackierarbeiten smart repair partner horb",
    intent: "commercial",
    purpose: "Folierung, Dellen drücken, Lackierarbeiten oder Smart Repair anfragen",
  },
  "/fahrzeug-zustand": {
    cluster: "autoaufbereitung zustand einschätzung",
    intent: "commercial",
    purpose: "Individuelle Foto-Ersteinschätzung anfragen",
  },
  "/b2b": {
    cluster: "fahrzeugaufbereitung gewerbekunden horb",
    intent: "commercial",
    purpose: "Aufbereitung für Gewerbekunden abstimmen",
  },
  "/ratgeber": {
    cluster: "autopflege ratgeber",
    intent: "informational",
    purpose: "Antworten nach Pflegethema auswählen",
  },
  "/ratgeber/fahrzeugaufbereitung-kosten": {
    cluster: "fahrzeugaufbereitung kostenfaktoren",
    intent: "informational",
    purpose: "Verstehen, wie Zustand, Fahrzeuggröße und Arbeitsaufwand den Preis beeinflussen",
  },
  "/ratgeber/hundehaare-aus-dem-auto-entfernen": {
    cluster: "hundehaare auto entfernen",
    intent: "informational",
    purpose: "Hundehaare passend zu Polster und Teppich aus dem Auto entfernen",
  },
  "/ratgeber/auto-vor-dem-verkauf-aufbereiten": {
    cluster: "autoaufbereitung vor privatverkauf",
    intent: "informational",
    purpose: "Sinnvolle Pflegearbeiten vor Verkauf, Fotos und Besichtigung auswählen",
  },
  "/ratgeber/auto-im-winter-waschen": {
    cluster: "autowäsche im winter streusalz",
    intent: "informational",
    purpose: "Streusalz bei winterlichen Temperaturen möglichst schonend vom Fahrzeug entfernen",
  },
  "/ratgeber/auto-folieren-lassen": {
    cluster: "auto folieren lassen ablauf",
    intent: "informational",
    purpose: "Ablauf, Folienarten und Lackprüfung vor einer Autofolierung verstehen",
  },
  "/ratgeber/folieren-oder-lackieren": {
    cluster: "auto folieren oder lackieren",
    intent: "informational",
    purpose: "Zwischen Folierung, Lackierarbeiten und Dellen drücken entscheiden",
  },
  ...Object.fromEntries(
    services
      .filter((s) => !s.pendingApproval)
      .map((s) => [
        `/leistungen/${s.slug}`,
        {
          cluster:
            s.slug === "fahrzeugaufbereitung"
              ? "autoaufbereitung leistungsumfang"
              : `${s.seoNav.toLowerCase()} horb`,
          intent: "commercial" as const,
          purpose: `${s.nav}: Umfang, Grenzen und passende Anfrage`,
        },
      ]),
  ),
  ...Object.fromEntries(
    cities.map((c) => [
      `/abholservice/${c.slug}`,
      {
        cluster: citySeoCopy(c).cluster,
        intent: "local" as const,
        purpose: `Fahrzeugaufbereitung für ${c.name}: Leistungen, Preise, Abholung und Übergabe; Werkstatt ausschließlich Horb`,
      },
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(articleNavigation).map(([slug, guide]) => [
      `/ratgeber/${slug}`,
      {
        cluster: guide.question.toLowerCase(),
        intent: "informational" as const,
        purpose: guide.question,
      },
    ]),
  ),
};
