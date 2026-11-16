# Repositoryübergreifender Funktionsnachweis

Stand: 2026-11-15T06:39:28.432Z

16 Prüfgruppen bestanden. Ausgeführt mit Node v24.19.0 ohne Website-Server. Die echten Website-Speicher-/Übergabefunktionen laufen gegen sämtliche PGlite-Migrationen; tatsächliche Panel-Routen laufen über `createApplication.fetch` gegen SQLite im Speicher. Nur der Transport zur Panel-Anwendung und der Resend-Anbieter sind im Prozess abgefangen. Keine externe Anfrage und keine echte E-Mail.

1. Website: Rundum ohne Fotos; gleichzeitiger Doppelklick speichert genau eine Anfrage
2. Website → tatsächliche Panel-Anwendung: alle Felder vollständig; Wunschtermin bleibt unverbindlich
3. Eine kombinierte deutsche Eingangsbestätigung mit einem Einrichtungslink; kein PDF; nur Anbieterannahme
4. Wiederholtes Absenden und Übertragen erzeugt weder Panel-Duplikat noch weitere E-Mail
5. Öffnen verbraucht den Link nicht; einmalige Einrichtungssitzung erlaubt noch keinen Kundendatenzugriff
6. Selbst gewähltes Passwort → sichere gemerkte Sitzung → /kunde → eigene vollständige Rundum-Anfrage
7. Panel-Foto hoch- und heruntergeladen, exakt zugeordnet; unangemeldeter Zugriff sowie falsche und zu große Dateien abgewiesen
8. Fremde Anfrage im Kundenbereich ausgeblendet und per direkter ID gesperrt; Betreiber-API gesperrt
9. Bestehender Kunde mit Passwort wiederverwendet; normaler Login-Link; Passwort unverändert
10. Bestehende normale Paketbuchung ohne Fotos vollständig ins Panel übertragen
11. Allgemeine öffentliche Leistungsanfrage ohne Fotos ins Panel übertragen
12. Verlorene Übergabeantwort nach Panel-Speicherung: Wiederholung erkennt dieselbe Anfrage ohne weitere E-Mail
13. Bestehender Kunde ohne Passwort wiederverwendet; abgelaufener Link gesperrt; neue sichere Einrichtung zeigt beide eigenen Anfragen
14. E-Mail-Ausfall erhält gespeicherte Anfrage; erneuter Versand mit identischem Inhalt und Schlüssel; kein Duplikat
15. Abmelden widerruft die Sitzung; erneute Anmeldung mit Passwort funktioniert
16. Passwort vergessen prüft E-Mail-Besitz, ändert das Passwort und erhält genau ein Konto

Ergebnis: 8 Website-Anfragen, 8 Panel-Anfragen, 6 Kunden; Website-Kundenfotos 0, privates Panel-Foto 1.

## Grenzen

- Integration direkt im Prozess, ohne lauschenden Server und ohne Browser.
- Echte Website-Speicher-/Übergabefunktionen und Migrationen; echte Panel-Routen und SQLite.
- E-Mail-Anbieter abgefangen: Annahmeantwort synthetisch; tatsächliche Zustellung ungeprüft.
- Alle Kundendaten liegen ausschließlich in isoliertem Speicher; Adressen enden auf .invalid.
- Die /kunde-HTML-Antwort verwendet einen synthetischen Adapter für statische Dateien; keine visuelle Renderprüfung.

Reproduzierbar mit `node --experimental-strip-types scripts/test-website-panel-journey.mjs`. Die Repositories müssen nebeneinander liegen; alternativ `WHITE_GLOSS_WEBSITE_DIR` setzen. Node.js 24 und zuvor `npm ci --ignore-scripts` in beiden Repositories verwenden. Standardmäßig werden die Nachweise in einem neuen temporären Verzeichnis gespeichert; `WHITE_GLOSS_JOURNEY_OUTPUT_DIR` wählt einen anderen Ausgabeordner. Detaillierte HTTP-Status ohne Zugangstokens stehen in `cross-repo-results.json`.
