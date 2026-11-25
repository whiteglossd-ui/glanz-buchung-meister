# Startseite und Rahmen: Dark Edition, 25. November 2026

Der Betreiber hat am 25.11.2026 die Vorlage „White-Gloss Detailing – Dark
Edition“ geliefert, per Video gezeigt („genau so umsetzen mit hero usw“) und
auf einer Entscheidungskarte „Umbauen, Hero wie im Video“ gewählt. Zuerst als
Sandbox: Der Pull Request wird erst nach seiner ausdrücklichen Freigabe
gemergt, weil ein Merge auf `main` automatisch auf Hostinger veröffentlicht.

## Umfang (Phase 1)

- Startseite Horb und Loßburg (`HomePage` → `DarkHome`): Aufbau, Schrift,
  Bilder und Bewegung der Vorlage. Hero mit Cockpit-Bildfolge (96 Bilder,
  Desktop und Handy getrennt) und drei Kapiteln statt des bisherigen Films.
- Kopfzeile, Vollbild-Menü und Fußzeile der Vorlage auf allen öffentlichen
  Seiten (`Shell` → `DarkHeader`/`DarkFooter`). Admin und Login unverändert.
- Unterseiten behalten vorerst ihren Inhalt und Aufbau (Phase 2).

## Was bleibt

- Echtes Buchungsformular (`LazyConfigurator`, `LazyRundumInquiry`) statt des
  mailto-Formulars der Vorlage. Anker `#buchung`, `#termin`, `#rundum-anfrage`.
- Studio-Texte für Titel und Einleitung, Studio-Zusatzinhalte, JSON-LD.
- Preise, Fahrzeugklassen, Abholorte und Abholpreise kommen aus `src/data/site.ts`.
- Cookie-Einstellungen, WhatsApp-Knopf, Lenis, Routenfokus.

## Technik

- `src/styles/dark-template.css`: Stylesheet der Vorlage, automatisch unter
  `.wgt` begrenzt. Nur Bereiche mit `.wgt` (Startseite, Kopf, Menü, Fuß)
  erhalten die Vorlagen-Optik.
- `src/lib/dark-motion.ts`: Bewegung der Vorlage (Bildfolge, Kapitel,
  Parallaxe, Bildbühne, Galerie, Einblendungen), mit vollständigem Abbau.
- Reduzierte Bewegung: statisches erstes Bild, keine Kapitel 2 und 3.
- Medien: `public/media/dark/` (Herkunft siehe `HERKUNFT.md` dort).

Die exakten Inhaltspins für `home-page.tsx` und `site-chrome.tsx` folgen
diesem beauftragten Umbau. Lokales Hosting bleibt ausgeschaltet.
