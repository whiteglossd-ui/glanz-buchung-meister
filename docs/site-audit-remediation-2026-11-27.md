# Websiteprüfung und Korrekturen vom 27. November 2026

## Auftrag und Befunde

Der Betreiber hat nach dem Site-Audit die Prüfung aller öffentlichen Seiten und
die selbständige Behebung bestätigter Fehler beauftragt. Der Live-Crawl umfasste
alle 60 Sitemap-URLs und sieben zusätzlich intern verlinkte HTML-Seiten. Alle
67 antworteten mit HTTP 200. Titel, Beschreibungen, Canonicals, Robots-Tags,
H1, interne Links und JSON-LD-Syntax waren vollständig beziehungsweise gültig.
Die PDF-Gesamtwertung 84/100 wurde wegen widersprüchlicher Teilnoten nicht als
Messwert übernommen. Die vollständigen Rohberichte liegen außerhalb dieses
Repositories unter `/workspace/site_review_2026-11-27/`.

## Änderungen in diesem Release

- Der Standortpunkt für Arnistal 27 verwendet die über OpenStreetMap/Nominatim
  geprüfte Gebäudeposition statt der zuvor rund sechs Kilometer entfernten
  Koordinaten. Schema, Geo-Meta und Kartenlink verwenden dieselbe Quelle.
- `/freudenstadt-lossburg` erhält einen eigenen regionalen Einstieg mit den
  bestehenden, überprüfbaren Angaben zu Abholung, Werkstatt und Preisen.
  Wiederholte Startseitenabschnitte entfallen auf dieser Route.
- Die Standard-Abholseiten stellen die bereits vorhandenen Orts- und
  Übergabedaten in den Vordergrund; mehrfach wiederholte allgemeine Abschnitte
  entfallen. URLs, Sitemap und Angebotskonditionen bleiben erhalten.
- Der Bewertungsbereich beschreibt seinen Zustand ohne freigeschaltete
  Google-Business-Profile-API wahrheitsgemäß und führt zu den Originalen bei
  Google. Es werden weder Sterne noch Rezensionstexte erfunden.
- Die Buchungskarten haben zugängliche Namen mit ihrem sichtbaren Text. Doppelt
  geladene Schriftdateien und ein hoch priorisierter Favicon-Preload entfallen;
  kleinere Paketbilder erhalten eine passende `srcSet`-Auswahl.

## Getrennte Betreiber- und Plattformaufgaben

`whitegloss.de` zeigt im autoritativen DNS noch auf `217.154.124.239`. Der
aktuelle VPS `187.126.4.225` hat bereits ein gültiges Zertifikat und gibt für
die Zweitdomain eine 301-Weiterleitung auf `white-gloss.de` zurück. Im
Hostinger-DNS muss daher nur der bestehende A-Record `@` der Zweitdomain auf
`187.126.4.225` geändert werden. Der `www`-CNAME und alle E-Mail- und
Verifizierungsrecords bleiben unverändert. Diese DNS-Änderung ist kein Teil des
Website-Releases.

Die Search Console meldete `/freudenstadt-lossburg` als „Gefunden – zurzeit
nicht indexiert“, ohne letztes Crawling. Die Seite war schon vorher erreichbar,
indexierbar, selbstkanonisch, in der Sitemap und intern verlinkt. Weder eine
Kopie der Startseite noch ein technischer Crawl-Fehler ist als Ursache belegt.
Ein Google-Crawl oder die Aufnahme in den Index lässt sich durch den Release
nicht erzwingen. Die Indexierung ist nach Veröffentlichung erneut zu beobachten.

Für echte Bewertungstexte auf der eigenen Seite fehlen weiterhin ein
freigegebenes Google-Business-Profile-API-Projekt, autorisiertes OAuth und
geschützte Laufzeitwerte. Details stehen in
`docs/google-reviews-status-2026-11-27.md`.

## Prüfweg

Die Inhaltsfreigabe in `scripts/check-design-content.mjs` wird ausschließlich
für die in diesem Auftrag geprüften öffentlichen Quelldateien auf neue exakte
Git-Blobs aktualisiert. Die übrigen Inhalts- und SEO-Sperren bleiben aktiv.
Danach folgen Lint, Typprüfung, Unit-Tests, Build und die vollständigen
GitHub-Pflichtjobs. Die Browserprüfung erfolgt gemäß Betreiberregel erst auf
der veröffentlichten Hostinger-Website, ohne lokale Website-Instanz.
