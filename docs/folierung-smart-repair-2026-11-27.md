# Partnerleistungen: Folierung, Dellen, Lack, Smart Repair (27.11.2026)

Auftrag des Betreibers: eigene Unterseite für Folierung (Farbwechsel, auch
Luxuskarosserien), Dellen drücken, Lackierarbeiten und Smart Repair. Alle vier
gleich stark hervorgehoben. Ausführung durch externe Partnerbetriebe, teils
Meisterbetriebe, teils langjährige Fachbetriebe.

## Umsetzung

- Route `/folierung-smart-repair` (`src/routes/folierung-smart-repair.tsx`),
  Styles in `src/styles/partner-services.css`, Dark-Edition-Look (`.wgt-page`).
- Keine Preise, keine Partnernamen, keine Zertifikate. Preis nach Begutachtung.
- Anfrage über das bestehende `PhotoInquiry`-Formular (Titel kennzeichnet die
  Anfrage im Panel). `Folierung` ergänzt die Auswahl im Rundum-Formular.
- Verlinkt: Menü (Detailing), Fußzeile (Leistungen), Startseite (Leistungsliste
  und Full-Service), Leistungsübersicht, Sitemap, llms.txt, SEO-Intent.

## Fotos nachtragen

Jede der vier Leistungen hat einen Fotoplatz (`photo` im Array
`partnerServices`). Leer zeigt die Seite eine neutrale Kachel mit Symbol.
Foto unter `public/media/partner/` ablegen und `src`, `alt`, `width`,
`height` eintragen. Nur freigegebene Fotos ohne sichtbares Kennzeichen.
