# Veröffentlichung und Rückfall

Dieser Auftrag gibt **keine produktive Veröffentlichung** frei. Beide PRs müssen Entwürfe bleiben. Nicht auf main mergen, kein Auto-Merge aktivieren, keinen Produktionsworkflow auslösen. Im Panel würde ein Merge auf main automatisch veröffentlichen; der Auto-Merge-Workflow überspringt Entwurfs-PRs.

## Konfiguration
- Vorhandene Website-Variable `HUB_SYNC_TOKEN` und der im Panel verschlüsselt gespeicherte `hubKey` müssen übereinstimmen und mindestens32 Zeichen lang sein. Der Schlüssel bleibt ausschließlich serverseitig; keine Browservariable, kein neuer Schlüssel in Git.
- Das feste Ziel der serverseitigen Übergabe lautet `https://panel.white-gloss.de/api/website/intake`; HTTPS aus der Website-Laufzeit muss erreichbar sein. Panel nimmt weder Browser-Origin noch Browser-Fetch-Metadaten an.
- Vorhandene Panel-Konfiguration `PANEL_ORIGIN`, `CONFIG_KEY`, geprüfter Resend-Zugang/Absender, `emailVerified`, `sendApproved` und `numberAudit` weiterverwenden. Keine ungeschützten Produktionsdaten oder Geheimnisse in Testumgebungen kopieren.
- Website `BOOKING_OPERATIONS=panel` beibehalten. Bestehenden Automation-Cron für `runCrmSync` weiterführen; im Panel-Modus arbeitet er nun die dauerhafte Übergabewarteschlange ab. Panel-Wartung bearbeitet die kombinierte Eingangsbestätigung.
- Tatsächliche Produktionskonfiguration wurde in diesem Auftrag nicht verändert. Vor Veröffentlichung geschützten Verbindungstest und Absenderfreigabe in der vorhandenen Laufzeit prüfen.

## Additive Migrationen
Website: `migrations/0026_panel_intake.sql` ergänzt Anfragemetadaten und `panel_intake_queue`. Keine Bestandsdaten oder Dateien werden gelöscht. Die Tabelle hat aktivierte RLS ohne öffentliche Freigabe. `scripts/inspect-production.mjs` kennt den neuen erwarteten Migrationsstand.

Panel: `customerAuthSchema` ergänzt `auth_customer_setup_links`; `websiteReceiptSchema` ergänzt `website_intakes` und `website_receipts` beim normalen Start. Bestehende Passworttabelle, Kunden, Aufträge und private Dateien bleiben erhalten. Kein Bestandskunde erhält allein durch den Start eine E-Mail: Nur neue Anfragen mit `intake_version:1` erhalten eine kombinierte Bestätigung.

## Reihenfolge nach ausdrücklicher Freigabe
1. Genaue freigegebene Commit-SHAs und grüne zugehörige Prüfungen festhalten. Bestehende Datenbank-/Datei-Backups nach dem aktuellen Betriebsweg erstellen und Wiederherstellbarkeit prüfen.
2. Panel zuerst über den bestehenden separaten Hostinger-Panelweg veröffentlichen. Alten Website-Import weiter erlauben. `/healthz`, aktive Commit-ID und vorhandene Kundenanmeldung prüfen; keine Kundennachricht zu Testzwecken senden.
3. Website-Migration mit dem bestehenden geprüften Migrationswerkzeug planen und gezielt einspielen. Bei erwartetem bisherigem Stand: `node scripts/migrate.mjs --expect-pending=0026_panel_intake.sql --only=0026_panel_intake.sql` (vorher tatsächlichen ausstehenden Stand prüfen; keine Freigabe anderer Migrationen ableiten).
4. Website über den bestehenden Hostinger-Weg veröffentlichen. Die neue Oberfläche erst nach Panel und Migration aktivieren.
5. Im geschützten vorgesehenen Testzugang die tatsächliche Verbindung, Warteschlangen und Absenderannahme prüfen. Öffentlich nur lesend Desktop/Mobil prüfen. Live-Commit und Release-Job als getrennten Nachweis dokumentieren.

## Fehlerbetrieb
Eine gespeicherte Website-Anfrage bleibt mit unveränderlicher Übergabenutzlast in `panel_intake_queue`. Technische Wiederholung nutzt dieselbe numerische Website-ID. Eine verlorene Antwort nach Panel-Speicherung erzeugt keinen zweiten Panelauftrag. Der alte Pull-Import kann markierte Anfragen seitenweise nachholen; dessen historischer Startstand verhindert weiterhin ungefragte Bestandsimporte.

Das Panel führt genau einen Mailjob pro Anfrage. Anbieterannahme (`accepted`, intern `sent`) bedeutet keine Zustellung. `queued`, `unknown`, `failed` und fehlende Konfiguration bleiben unterscheidbar. Unter System→E-Mail ist der Status samt sicherem Neuversuch sichtbar. Derselbe Inhalt/Anbieter-Schlüssel darf nur innerhalb23 Stunden wiederholt werden; danach klären, statt einen möglichen Doppelversand auszulösen. Ein abgelaufener Passwortlink kann unter `/auth/customer?step=renew` ausdrücklich neu angefordert werden; die Antwort ist neutral, das bestehende Passwort bleibt geschützt. Die Code-Einrichtung und Passwortwiederherstellung bleiben als sichere kompatible Wege erhalten. Dadurch kann der Zugang ersetzt werden, ohne Anfrage oder Konto neu anzulegen.

## Rückfall
Bei einem Fehler Website zuerst auf das unmittelbar vorherige freigegebene Release zurückführen; dadurch werden neue Formulare deaktiviert. Neue Tabellen/Spalten und gespeicherte Anfragen **nicht** zurückmigrieren oder löschen. Panel-Warteschlangen und Anbieterstatus erhalten; unbekannte Sends niemals durch neue Mailjob-IDs wiederholen. Panel nur bei eigenem Fehler auf das vorherige separate Release zurückführen. Die bestehenden Passworttabellen sind kompatibel, neu gespeicherte Passwörter bleiben erhalten. Neue Einrichtungslinks brauchen die neue Panelversion; im Rückfall bleibt die bestehende sichere Code-Einrichtung verfügbar. Nach Korrektur gezieltes neues Release, keine Datenbankkopie über aktuelle Kundendaten schreiben.

## Prüfumgebung und Grenzen
Browserprüfungen ausschließlich im erlaubten echten Linux-GitHub-CI-Job, mit flüchtigen Datenbanken und abgefangenen externen Anbietern. Lokal wurden keine Website-Server gestartet. Screenshots von Mobilgrößen sind Emulationen, keine echten Gerätetests. Anbieter-Stubs prüfen korrekte Links, Einmaligkeit und Fehlersituationen; sie belegen keine tatsächliche E-Mail-Zustellung.
