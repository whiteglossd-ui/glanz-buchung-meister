# Autofolierung-Seite und Startseiten-Block (27.11.2026)

## Was neu ist
- **Seite `/folierung`** (`src/routes/folierung.tsx`): eigene SEO-Seite für Autofolierung, Car Wrapping und Farbwechsel.
  - Title: „Autofolierung Horb: Farbwechsel & Car Wrapping | White-Gloss Detailing"
  - Inhalte: Vollfolierung/Farbwechsel, Teilfolierung (Chrome Delete), Folienarten, Luxusfahrzeuge, Ablauf, Abholorte, 8 FAQ, Anfrageformular.
  - Strukturierte Daten: `Service` (mit `areaServed` aus den Abholorten) und `FAQPage`.
- **Startseite**: Block „Folieren, Dellen drücken, Lackieren." im Bereich Leistungen (`dark-home.tsx`, Stil `src/components/dark/home-partner.css`), plus Link „Autofolierung und Farbwechsel" in der Leistungsliste.
- **Menü und Footer**: Link „Autofolierung".
- `/folierung-smart-repair`: Folierungs-Karte verlinkt auf `/folierung`. SEO-Cluster dort jetzt auf Dellen, Lack und Smart Repair, damit sich beide Seiten nicht gegenseitig Konkurrenz machen.
- **Ratgeber**: zwei Beiträge in `src/data/editorial-guides.json`: `/ratgeber/auto-folieren-lassen` und `/ratgeber/folieren-oder-lackieren`, verlinkt mit `/folierung` und `/folierung-smart-repair`.
- Registriert in Sitemap, `seo-intents.ts`, `llms.txt`, Responsive-Check, Preview-Export und Live-Smoke-Test.

## Keine erfundenen Angaben
Keine Preise, Dauer, Garantien, Partnernamen oder Zertifikate. Preis und Dauer nach Begutachtung.

## Fotos ergänzen
In `src/routes/folierung.tsx` im Array `wrapOptions` bei der passenden Karte `photo` ausfüllen:
`{ src: "/media/partner/<datei>.webp", alt: "…", width: …, height: … }`. Datei unter `public/media/partner/` ablegen.
