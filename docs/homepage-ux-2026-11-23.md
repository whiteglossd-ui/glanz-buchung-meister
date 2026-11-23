# Startseite und Standortvariante, 23. November 2026

Der Betreiber hat den Umbau von Hero, Texten, horizontalen Karten, Serviceablauf,
Anfrageabschluss und einer zusätzlichen Standortseite ausdrücklich beauftragt.
Die bisherige Vorgabe eines ausschließlich visuellen Umbaus gilt damit für diese
beauftragten Inhalte nicht mehr. Die exakten Inhaltspins in
`scripts/check-design-content.mjs` bilden diesen neuen Stand ab; die Prüfung
anderer Inhalte und bestehender Schutzregeln bleibt erhalten.

- `/` und `/freudenstadt-lossburg` verwenden `HomePage` und dieselben Komponenten.
- Loßburg ist laut ausdrücklicher Rückmeldung des Betreibers **noch in Vorbereitung**.
  Horb bleibt die aktuelle Werkstatt und einzige hinterlegte Geschäftsadresse.
  Die neue Seite nennt keine erfundene Loßburger Adresse oder Koordinaten.
- `#ablauf` führt zum gemeinsamen vierstufigen Hol- und Bringservice.
- `#buchung` und `#termin` führen zum abschließenden Anfragebereich;
  `#service`, `#rundum-service` und `#rundum-anfrage` öffnen dort die Rundum-Anfrage.
  `#craft-heading` und `#nach-dem-film` bleiben als bisherige Sprungziele erreichbar.
- Karten und Videos teilen ihre Geometrie und Navigation. Die Vergleichssteuerung
  bleibt unabhängig von der Tastatursteuerung der horizontalen Liste.
- Bewegungen respektieren reduzierte Bewegung; hohe Hero-Inhalte bleiben statisch
  lesbar. Inhalte bleiben auch ohne Animation sichtbar.

## Prüfung

`npm test` enthält jetzt auch `scripts/home-flow.test.mjs` für reale gerenderte
Abschnitte, Anker, Formularauswahl und regionale Metadaten (mit dokumentierten
Test-Doubles an Router-, Medien- und Formulargrenzen). Zusätzlich werden die
bestehenden Hero-, SEO-, Typ-, Lint-, Build- und Inhaltsprüfungen verwendet.
Die Prüfungen starten keinen Website-Server. Eine tatsächliche Desktop-/Mobil-
Browserprüfung bleibt dem freigegebenen CI-/Veröffentlichungsweg vorbehalten.
