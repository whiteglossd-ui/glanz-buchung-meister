# Unterseiten und Full-Service

Ausgangsstand ist `262b74a1d06648e69231422c4a82f6feb52929c8` vom 27. November 2026. Das [Seiteninventar](seiteninventar-2026-11-27.csv) führt die konkreten öffentlichen Seiten, Buchungsanker, Ortskombinationen, Weiterleitungen, Betriebsansichten und Schnittstellen auf. Die 60 Einträge der veröffentlichten XML-Sitemap sind eine Teilmenge. Die 180 erreichbaren Leistungs-/Ort-Kombinationen sind bewusst auf `noindex` gesetzt. Die 20 Varianten für die nicht freigegebene Scheinwerferaufbereitung leiten auf die Erklärseite weiter. Über uns folgt dem Freigabestatus im Studio.

## Gestaltung und Angebotswege

Die öffentliche Startseite liefert Farben, Abstände, Schrift und Bedienelemente. React und TanStack Start rendern HTML auf dem Server. Tailwind und die vorhandenen Dark-Edition-Styles liefern Barlow, die schmale Displayschrift, die anthrazitfarbene Fläche, die warme Schriftfarbe und die Haarlinien. Abholorte, Angebote und Paketpreise werden aus dem bisherigen Katalog gelesen.

| Seiten | Umsetzung |
|---|---|
| Startseite | Der Abschnitt Hol- & Bringservice erklärt Besichtigung, Abholung mit Partnerarbeit und Rückgabe. Der CTA öffnet den Rundum-Modus. Er nutzt nur die vorhandene Einblendung und sitzt im vorhandenen Inhaltsslot unmittelbar nach dem Hero. |
| Preise und Buchung | Drei Paketkarten mit Leistungsumfang, Einstiegspreisen, Fahrzeugklassen und direkter Paketwahl. Die Paketbuchung hat drei Schritte, die Rundum-Anfrage zwei. Bestätigungen folgen den bestehenden Übermittlungszuständen. |
| Ergebnisse | Freigegebene Werkstattfotos, Filter, Lackvergleich und bedienbare Großansicht. Der Vergleich beschreibt die verschiedenen Lichtbedingungen. Die Videovorschauen verwenden responsive WebP-Varianten. |
| Leistungen und Standorte | Responsive Standbilder mit passenden Bildbeschreibungen, Leistungsumfang, Ablauf und FAQ. Abholkosten, regionale Hinweise und die in Vorbereitung befindliche Werkstatt sind an ihren vorhandenen Datenquellen angebunden. |
| B2B, Luxusfahrzeuge, Dellen, Qualität und Ratgeber | Verlinkte Themen und Abschnitte, Lesespalten sowie Bilder mit reserviertem Platz. Die Qualitätsseite zeigt die vorgesehenen Werkstattfotos. |
| Kontakt, individuelles Angebot, Status | Die Kontaktseite verwendet den bestehenden validierten Textanfrageweg, ergänzt um direkte Kontaktmöglichkeiten, Öffnungszeiten und die vorhandene Karte. Der Canonical der Statusseite enthält keine Kundendaten. |
| Über uns und FAQ | Die Studiovorlage nutzt veröffentlichte Inhalte und belegbare Betriebsangaben. Gruppe und Einzelantwort sind in den FAQ erreichbar. |
| Rechtsseiten und 404 | Gemeinsame Dokumentansicht mit eigener Navigation. Die Rechtsinhalte behalten Texte und Linkziele. Die Fehlerseite führt zu Startseite, Preisen, Buchung und Kontakt. |
| Navigation, Kontaktkarte, Betriebszugang | Ergänzte Fußnavigation, Unternehmensfarben und lokale Webfonts auf der digitalen Visitenkarte, konsistente Anmeldung und Titel der Betriebsseiten. Redaktionelle und private Funktionen behalten ihre Zugangskontrollen. |

## Schutz des Startseitenverhaltens

Der Scrollfilm einschließlich Kapitel, Pins und Zeitsteuerung steht in `src/components/dark/dark-home.tsx`, `dark-hero.css` und `src/lib/dark-motion.ts`. Relevant sind außerdem `src/components/scroll-film-hero.tsx` und das gleichnamige Stylesheet, `src/data/scroll-film.ts`, `src/components/scroll-choreography.tsx`, `src/components/smooth-scroll.tsx`, `src/lib/smooth-scroll.ts`, `src/components/site-chrome.tsx`, `src/styles.css` und die Dark-Edition- und Dark-Template-Stylesheets. Die neue Sektion wird eine Ebene höher über `home-page.tsx` eingesetzt. Das Markup des Scrollfilms selbst bleibt bytegleich.

`dark-chrome.tsx` enthält Header und Footer in einer Datei. Die Ergänzung betrifft ausschließlich die Linkliste in `DarkFooter`. `DarkHeader` einschließlich Logo, Sticky-/Scrollzustand, Menü-Dialog und Overflow-Sperre bleibt bytegleich. `__root.tsx` ergänzt Titel und Beschreibung für 404-Antworten. Font-Preloads, Script-Einbindung und der Komponentenbaum des Layouts bleiben identisch.

Die neuen Inhalte verlängern die Startseite und verschieben spätere Abschnitte nach unten. Die Go-live-Prüfung vergleicht deshalb dieselben Positionen relativ zum Hero, den Übergang aus dem Pin, das Logo, beide Scrollrichtungen und das Öffnen und Schließen des Menüs. Responsive Prüfpunkte sind 360, 768, 1280 und 1920 Pixel.

## Prüfverfahren

Quellkontrolle, Lint, beide Typprüfungen, Unit-Tests und Produktionsbuild laufen ohne Website-Server. GitHub prüft anschließend Datenbankabläufe, Buchung, Studio und Browser. Lesende Browser- und Lighthouse-Messungen verwenden die tatsächliche Hostinger-Domain. Der Vorher/Nachher-Bericht enthält die gemessenen Werte und den zugehörigen Veröffentlichungsstand. Lighthouse liefert Labordaten für LCP und CLS. Interaktionszeiten aus reproduzierten Eingaben sind gesondert von INP-Felddaten aus echten Besuchen auszuweisen.
