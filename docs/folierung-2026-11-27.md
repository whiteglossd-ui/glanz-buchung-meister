# Partnerleistungen: vier Premium-Seiten, Startseiten-Block, Ratgeber (27.11.2026)

## Seiten
Alle vier nutzen die gemeinsame Vorlage `src/components/partner-landing.tsx`
(Stil `src/styles/partner-landing.css`): Vollbild-Hero, Chrom-Titel, Faktenleiste,
4 Leistungskarten mit Foto-Slots, Ablauf, Region (Horb, Loßburg, Abholorte), FAQ,
Querverweise, Anfrageformular. JSON-LD: `Service`, `FAQPage`, `BreadcrumbList`.

| Route | Datei | Hero-Bild |
| --- | --- | --- |
| `/folierung` | `src/routes/folierung.tsx` | profile-wide |
| `/lackierarbeiten` | `src/routes/lackierarbeiten.tsx` | hood-wide |
| `/dellen-druecken` | `src/routes/dellen-druecken.tsx` | inspection |
| `/smart-repair` | `src/routes/smart-repair.tsx` | wheel-wide |

`/folierung-smart-repair` bleibt als Übersicht und verlinkt jede Karte auf ihre Seite.

## Loßburg
Jede Seite nennt Horb am Neckar und Loßburg in Title, Beschreibung, Lead und FAQ.
Wortlaut wie in `site.ts`: Werkstatt in Horb, in Loßburg entsteht der neue Standort.

## Startseite, Menü, Footer
- Block „Folieren, Lackieren, Dellen drücken, Smart Repair." (`dark-home.tsx`, Stil `src/components/dark/home-partner.css`).
- Menü und Footer: Autofolierung, Lackierarbeiten, Dellen drücken, Smart Repair.

## Ratgeber
`/ratgeber/auto-folieren-lassen`, `/ratgeber/folieren-oder-lackieren` in `src/data/editorial-guides.json`.

## Keine erfundenen Angaben
Keine Preise, Dauer, Garantien, Partnernamen oder Zertifikate.

## Fotos ergänzen
In der jeweiligen Route im Array `options` bei der passenden Karte `photo` ausfüllen:
`{ src: "/media/partner/<datei>.webp", alt: "…", width: …, height: … }`. Datei unter `public/media/partner/` ablegen.

## Dellen-Seiten zusammengelegt (Inhaberentscheidung 27.11.2026)
- Hauptseite: `/dellen-druecken` (Dellen drücken und Hagelschäden, Foto-Begutachtung).
- 301-Weiterleitungen auf `/dellen-druecken`:
  - `/dellen-hagelschaden` (`src/routes/dellen-hagelschaden.tsx`)
  - `/leistungen/smart-repair` und alle `/leistungen/smart-repair/<stadt>`
- Steuerung zentral in `src/lib/seo-policy.ts`: `consolidatedPaths`, `consolidatedServices`.
- Der Katalogeintrag `smart-repair` in `site.ts` bleibt für Buchung, Panel und Ratgeber bestehen. Er wird in Menü, Footer und Listen nicht mehr verlinkt.
- Aus Sitemap und `seo-intents.ts` entfernt.
