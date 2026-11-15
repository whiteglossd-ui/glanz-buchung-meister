# Repositoryübergreifenden Test wiederholen

Das ausführbare Skript liegt im Panel-Repository unter `scripts/test-website-panel-journey.mjs`. Es verwendet die echten aktuellen Quelldateien beider Repositories. Es startet keinen Server, verwendet keine Live-Daten und fängt sämtliche Anbieteraufrufe ab. Alle Testadressen enden auf `.invalid`.

Voraussetzungen: Node.js 24 und beide Repositories nebeneinander. Abhängigkeiten vor dem ersten Lauf installieren:

```sh
cd glanz-buchung-meister
npm ci --ignore-scripts
cd ../white-gloss-panel
npm ci --ignore-scripts
node --experimental-strip-types scripts/test-website-panel-journey.mjs
```

Die Standardausgabe nennt das neue temporäre Nachweisverzeichnis. Ein abweichender Website-Pfad kann über `WHITE_GLOSS_WEBSITE_DIR` gesetzt werden. Diese Variable enthält ausschließlich einen lokalen Repositorypfad, keine Zugangsdaten.

Um die reviewbaren Nachweise im Panel-Repository gezielt neu zu erzeugen:

```sh
WHITE_GLOSS_JOURNEY_OUTPUT_DIR=docs/rundum-service node --experimental-strip-types scripts/test-website-panel-journey.mjs
```

`WHITE_GLOSS_JOURNEY_OUTPUT_DIR` wählt den Ausgabeordner für `cross-repo-results.md` und `cross-repo-results.json`. Ohne diese Variable verändert ein Testlauf keine Repositorydateien. Bei einem Fehler wird kein neuer Erfolgsbericht geschrieben. Bereits vorhandene Berichte sind deshalb immer anhand ihres Zeitstempels zu bewerten.

Der Test ist bewusst kein Bestandteil der normalen Einzelrepository-Testbefehle: Er benötigt beide passenden Änderungsstände. Die normalen Tests bleiben unabhängig davon ausführbar. Die statischen Ergebnisdateien in beiden Repositories dokumentieren denselben tatsächlich ausgeführten Lauf.

Die E-Mail-Annahmeantworten sind synthetisch. Eine tatsächliche Zustellung und Browserdarstellung werden durch diesen Test nicht nachgewiesen.
