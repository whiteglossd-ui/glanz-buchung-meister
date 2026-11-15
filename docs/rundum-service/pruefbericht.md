# Prüfbericht: Rundum-Service und Kundenkonto

Die ursprünglichen Implementierungen sind in [Website-PR #347](https://github.com/White-Gloss/glanz-buchung-meister/pull/347) und [Panel-PR #100](https://github.com/White-Gloss/white-gloss-panel/pull/100) reviewbar. Beide PRs wurden während der Arbeit außerhalb der hier ausgeführten Aktionen zusammengeführt und produktiv veröffentlicht: Website `ca4fbc77`, Panel `14262776`. Die zusätzlichen Website-Korrekturen liegen im separaten [Entwurfs-PR #349](https://github.com/White-Gloss/glanz-buchung-meister/pull/349); die ergänzenden Panel-Nachweise in [Entwurfs-PR #102](https://github.com/White-Gloss/white-gloss-panel/pull/102). In dieser Sitzung wurden keine Pull Requests nach main zusammengeführt, keine Entwürfe als bereit markiert und keine Produktionsworkflows ausgelöst. [Genaue Ereignis-/Releasebelege und Grenzen der Zuordnung](externe-veroeffentlichung.md).

Die verbindliche Anforderungsliste wurde vor der Implementierung erstellt: [Anforderungen](anforderungen.md). [Ablauf](ablauf.md), [aktuelle Live-Zuordnung mit Grenzen](live-zuordnung.md) und [Konfiguration, Migration, Reihenfolge und Rückfall](veroeffentlichung.md) sind separat dokumentiert. Externe Hauptbranch-Änderungen aus #346 und #348 sind erhalten.

## A – Code und Datenfluss

Die echten Website-Speicher-/Übergabefunktionen und Panel-Routen wurden gegen isolierte PGlite-/SQLite-Datenbanken geprüft. Der aktuelle repositoryübergreifende Test bestand **16 Prüfgruppen**: acht Website-Anfragen ergaben acht Panelanfragen, sechs Kunden, keine Websitefotos und ein privates, korrekt zugeordnetes Panel-Foto. Alle sieben Leistungswünsche, Fahrzeugangaben, vollständige Beschreibung, optionaler Kontakt, Abholwunsch und Wunschtermin kamen an. [Ergebnisse](cross-repo-results.md), [HTTP-Status ohne Zugangstokens](cross-repo-results.json), [Wiederholungsanleitung](cross-repo-test.md).

Neue Anfragen werden vor der Übertragung gespeichert; die unveränderliche Übergabe bleibt bei Fehlern erhalten. Dieselbe Website-ID erzeugt keine zweite Panelanfrage. Gleichartige Leistungs-/Extraauswahlen funktionieren auch nach anderer Klickreihenfolge. Vorhandene unsortierte Fingerprints, Datensätze und Warteschlangen werden beim Wiederholen nicht umgeschrieben; andere Angaben müssen weiterhin exakt übereinstimmen.

Nachgewiesene Tests: Website **919/919** ohne Fehler oder Skips im erfolgreichen echten GitHub-CI [43687237283](https://github.com/White-Gloss/glanz-buchung-meister/actions/runs/43687237283), zusätzlich SEO **9/9**; Panel **966/966** im unten gepinnten Lauf. Der geprüfte Website-Head ist `9ff2e377408f8de9554ada976eeb4ebd01ed1ea4`; spätere Abschlussdokumentation ändert keinen Laufzeitcode. Anwendungs-/Edge-Typen, Builds, Inhalts-/SEO- und Schema-/Zugriffsprüfungen bestehen. Lint: keine Fehler, zwei bereits vorhandene Fast-Refresh-Warnungen auf der Website. Die lokale Edge-Typprüfung war durch einen jsr.io-Download blockiert; dieselbe Prüfung bestand anschließend im echten GitHub-CI.

Die unabhängigen [Standards-](review-standards.md) und [Spec-Reviews](review-spec.md) fanden nach den Korrekturen keine wesentlichen Umsetzungslücken oder Sicherheitsblocker. Die [zusätzliche Wiederholungsprüfung](review-idempotency-sets.md) bestätigt den unveränderten Bestandsdaten-/Fingerprintschutz.

## B – Funktion und Zugriffsschutz

Der geprüfte Panel-Quellstand `10972fce488c960662e1d7fcd6e88bdbe57b8c96` besteht [Run 43667921311](https://github.com/White-Gloss/white-gloss-panel/actions/runs/43667921311): Prüfjob 132671348009 **966/966**, Browserjob 132671348250 **136/136**, Hostinger-Veröffentlichung in diesem Prüf-Lauf übersprungen. Der später extern veröffentlichte `14262776` hat exakt denselben vollständigen Tree; die Veröffentlichung ist gesondert belegt.

Kontrollierte synthetische Konten prüfen: neue Rundum-Anfrage ohne Fotos, normale Buchung und allgemeine Anfrage ohne Fotos, vollständiger Eingang, kombinierte E-Mail mit richtigem Zugang, gewähltes Passwort und Anmeldung, Bestandskonten mit/ohne Passwort, abgelaufene und bereits verwendete Links, ausdrücklich neu angeforderter Link, Passwort vergessen, Logout und erneute Anmeldung. Vorhandene Passwörter werden weder beim Anfrageeingang noch durch Link-Erneuerung zurückgesetzt.

Die Browserfälle prüfen Chromium, Firefox und WebKit bei 390 und 1440 px über **native isolierte HTTPS-Anfragen**: tatsächliches gültiges Cookie, Passwortspeicherung und eigene Anfrage. `Secure`, `HttpOnly` und `SameSite=Strict` bleiben erhalten. Ein zuvor beobachteter WebKit-Fehler stammte aus unvollständigen Headern der abgefangenen Testanfrage. Er wurde durch einen echten HTTPS-Prüfadapter im freigegebenen GitHub-CI aufgelöst; kein Cookie wurde aus dem Speicher in eine Anfrage injiziert. [Unabhängige Prüfung](review-ci-tls.md).

Private Foto-Uploads funktionieren bei der richtigen Anfrage. Fremde und anonyme Zugriffe, ungültige Dateiinhalte und zu große Dateien werden abgewiesen. Vorhandene Galerie-/Chat-Grenzen bleiben bestehen. Die Tests umfassen einen Upload vor Angebot/Annahme und die vollständige Portalbedienung bei 320, 768, 1024 und 1440 px.

Wiederholungen, Doppelklick, verlorene Antwort nach Panel-Speicherung und E-Mail-Ausfall wurden geprüft. Ein deterministisch angehaltener Anbieteraufruf zeigt: Der parallele Aufruf darf ehrlich „Versand noch unbestätigt“ melden; nach Abschluss ist derselbe dauerhafte Mailjob angenommen. Es bleiben genau eine Anfrage und ein Mailjob. Der Versand verwendet denselben Inhalt und Anbieter-Schlüssel innerhalb der sicheren Frist; unbekannte Versände werden außerhalb dieser Frist nicht blind wiederholt.

## C – Oberfläche und finaler Änderungsstand

**Der finale echte Website-Gesamtlauf ist erfolgreich:** [43687237283](https://github.com/White-Gloss/glanz-buchung-meister/actions/runs/43687237283), Verify-Job `132730156109`, Quellstand `9ff2e377408f8de9554ada976eeb4ebd01ed1ea4`, Abschluss 15.11.2026 um 06:59 UTC. Schema, Studio und Firefox/WebKit-Crossbrowser bestehen ebenfalls. SSR, Flows, Sitemap, SEO, vollständige Responsive-Prüfung, Booking-UI, Recovery, Consent-Startup, Lighthouse und Hero sind erfolgreich.

Die Consent-Startup-Suite enthält einen zwingend ausgeführten echten Browserkontext mit `javaScriptEnabled:false`. Der unveränderte Suitefehlerpfad ist fatal; der tatsächliche Prozess bestand. Damit sind NoJS-Rückfall, noncegebundener Initialbanner-Style und nativer Anfrageanker innerhalb dieser Suite geprüft. Die einzelnen Geometriesnapshots aus dem Artefakt wurden hier nicht separat heruntergeladen; daraus werden keine ungelesenen Einzelmesswerte behauptet. Tracking bleibt an die bestehende Einwilligung gebunden. [Quell- und Evidenzreview](review-final-integration.md).

Lighthouse misst im finalen isolierten Lauf bei unverändertem Cache-/Throttling-/HTTP2- und Mindestscorevertrag:

| Probe | Mobil 1 | Mobil 2 | Mobil 3 | Desktop 1–3 |
|---|---|---|---|---|
| Leistung | 98 | 98 | 98 | jeweils 100 |
| LCP (ms) | 2270,575 | 2260,033 | 2259,431 | Gate bestanden |
| TBT (ms) | 3,5 | 3,5 | 1 | Gate bestanden |
| CLS | 0 | 0 | 0 | 0 |

Die übrigen Lighthouse-Kategorien bestehen mit 100. [Direkt aus dem tatsächlichen Jobprotokoll extrahierte Ergebnisse](website-ci-results.json) enthalten die zehn Suite-Abschlusszeiten und alle sechs Messungen. Das native Icon-Gate unterscheidet in allen sechs Proben eine vollständige PNG-Übertragung und eine belegte HTTP-304-Revalidierung; es behauptet weder nur einen HTTP-Request noch zwei vollständige Bilddownloads. Die erweiterten nativen Asset-Gates bestehen; unklassifizierte Übertragungen bleiben fatal.

Der frühere Lauf `43685920916` scheiterte an einem abgebrochenen Kalender-GET bei Testnavigation. Der nachfolgende QA-Fix wartet vor zwei destruktiven Navigationen begrenzt auf bereits gestartete Reads; keine `ERR_ABORTED`-Ausnahme wurde eingeführt. Die **17/17** vorhandenen Read-/Diagnostiktests und der neue tatsächliche Browser-Gesamtlauf bestehen. Der frühere Einzelrequest lässt sich nachträglich nicht zweifelsfrei einer Phase zuordnen. [Unabhängiger Review](review-navigation-reads.md).

Website- und Panelbilder sind in den jeweiligen Repositoryordnern `docs/rundum-service/screenshots/` einschließlich SHA256, Quellcommit, Job und Artefakt verlinkt. [Websiteansichten](https://github.com/White-Gloss/glanz-buchung-meister/tree/codex/rundum-service-abschluss-20261115/docs/rundum-service/screenshots), [Panelansichten](https://github.com/White-Gloss/white-gloss-panel/tree/codex/rundum-service-nachweise-20261115/docs/rundum-service/screenshots).
Die bereits tatsächlich geöffneten Desktop-/Mobilbilder zeigen lesbare Texte, passende Typografie, beide Buttons und vollständig bedienbare Felder. Geometrische Prüfungen erfassen Header-/Cookie-Freiraum, Fokus, Überläufe und Zielgrößen von 44 px. Der Rundum-Einstieg ist im ersten Hero sichtbar; der kompakte Abschnitt und der Anfragebereich verwenden die vorhandene Designsprache. Pakete, Buchungswege, Navigation, redaktionelle Bilder und SEO bleiben erhalten.

Der Formularcode wird erst bei Annäherung oder dem direkten Anfrageanker geladen. Die SSR-Überschrift und der Anker bleiben vorhanden. Netzwerk-, Hash-, Tastatur- und Entwurfstests belegen das Laden, die Mehrfachauswahl und den Erhalt eingegebener Werte bei Navigation. Die zwei Kanäle bleiben eindeutig: WhatsApp ist manuelle Kontaktaufnahme und erzeugt keine automatische Panelanfrage.

## Anforderung → Umsetzung → Nachweis

| ID | Umgesetzt | Konkreter Nachweis |
|---|---|---|
| R1 | Tatsächliche Repos/Live-Systeme geprüft | `live-zuordnung.md`, echte Hostinger-Releasejobs; Profil nur Verbindung |
| R2 | Kompakter Rundum-Abschnitt und sofort sichtbarer Einstieg | `rundum-service.tsx`, Hero, Inhaltsgate; Desktop-/Mobilbilder |
| R3 | Exakte Buttons, direkter Anker, vorhandene WhatsApp-Nummer und -Text | `rundum-ui.mjs`, Link-/Hit-Tests; WhatsApp bleibt separater Kanal |
| R4 | Sieben Optionen, minimale Kontaktdaten, Fahrzeug, Anliegen, Abholung, Datum optional | Schema-/Validierungs-/UI-Tests, Cross-Repo-Gruppen 1–2 |
| R5 | Unverbindlich, individuelle Partnerabstimmung, Freigabe vor Arbeiten | Formular-, Portal- und Mailtexte; keine Reparatur-Festpreise |
| R6 | Alle Angaben eindeutig im Panel/Kundenbereich | Cross-Repo-Gruppen 2 und 6, Intake-/Portaltests, persistierter `source` |
| R7 | Öffentliche Kunden-Uploads/Fotopflichten entfernt | Alle öffentlichen Formulare ohne Datei-Controls; alter Upload-RPC weist ab; Studio bleibt |
| R8 | Geschützter Upload mit Zuordnung/Datei-/Berechtigungsprüfung | Cross-Repo-Gruppen 7 und 8, 136 Browserfälle und vorhandene Foto-/Galerietests |
| R9 | Genau eine kombinierte Bestätigung nach Panel-Speicherung | Dauerhafter Receipt-Job; neue/alte Konten; keine Eingangs-PDFs |
| R10 | Dauerhaftes Passwortkonto, befristete Einmallinks und sichere Erneuerung/Sitzungen | Auth-/Renewal-/Native-HTTPS-Tests; Cross-Repo-Gruppen 5, 6, 13, 15 und 16 |
| R11 | Bestandskonten/Passwörter/Dateien erhalten, kein fremder Zugriff | Auth-/Onboarding-/Dateiregressionen, additive Schemas, unveränderte alte Fingerprints |
| R12 | Keine technischen Anfrage-/Mailduplikate | Parallel-/Reload-/Lost-Reply-/Ausfall-/Auswahlreihenfolge-Tests, dauerhafte Outbox |
| R13 | Gespeichert, vorgemerkt, Anbieterannahme und Zustellung getrennt | Response-Snapshots, Mailledger, sichere Wiederholung, Anbieterstatus-Lesetest |
| R14 | Getrennte A/B/C-Prüfung und unabhängige Reviews | Erfolgreicher Website-Gesamtlauf 43687237283, Panel 43667921311, 16 Cross-Repo-Gruppen, dieser Bericht und gezielte Reviews |
| R15 | Reviewbare Repos/PRs, Bilder, Konfiguration, Migration, Rückfall | Original-Code-PRs #347/#100, Website-Abschlussentwurf #349 und [Panel-Nachweisentwurf #102](https://github.com/White-Gloss/white-gloss-panel/pull/102); verifizierte `screenshots/`, Konfigurations-/Migrationsgrenzen und Rückfall in `veroeffentlichung.md` |

## Budget des erweiterten Responsive-Laufs

Im echten CI-Lauf `43675310763` wurde der Responsive-Prozess nach 180,054 Sekunden beendet, nachdem 36 von 40 neuen Header-/Hero-Reaktivierungen über Maus und Enter bestanden waren. Alle abgeschlossenen Resets benötigten einen tatsächlichen Wheelversuch; kein einzelner 10-Sekunden-Wheelfehler wurde gemeldet. Zum unveränderten Crawl von 37 URLs bei drei Breiten kommen die neuen vier Reaktivierungen bei zehn Breiten-/Bewegungskombinationen. Deren Geometrie-/Wheel-Stabilisierung benötigt allein mindestens 13,5 Sekunden zusätzlich. Deshalb erhält ausschließlich dieser erweiterte Gesamtprozess 240 statt 180 Sekunden. Alle URLs, Breiten, Bewegungsmodi, 40 Reaktivierungen, Fokus-/Boundsprüfungen und individuellen 10-Sekunden-Deadlines bleiben erhalten. Das Prozessbudget ist keine gemessene UI-Reaktionszeit. Der spätere echte Lauf `43682296272` schloss die erweiterte Responsive-Prüfung einschließlich aller 40 Reaktivierungen in 190,305 Sekunden ab; auch `43685920916` besteht diese Stufe. Der abschließende erfolgreiche Lauf `43687237283` benötigt dafür 187,632 Sekunden. Das mobile Performance-Gate blieb dabei unverändert.

## Grenzen und Veröffentlichung

Es wurden keine echten Kundenmails, Buchungen oder Uploads in Produktionssystemen ausgelöst. Der E-Mail-Anbieter ist in den Tests abgefangen: korrekter Inhalt, Link und Annahmeantwort sind geprüft, tatsächliche Zustellung/Spam- oder Posteingangsplatzierung nicht. Browseransichten sind Viewport-Emulationen, keine echten Gerätetests. Es wurde kein lokaler Website-Server gestartet; native HTTPS-Browserprüfungen liefen ausschließlich im erlaubten echten GitHub-CI.

Produktive Schlüsselübereinstimmung und Absenderfreigabe sind fachlich noch nicht über einen geschützten Laufzeitzugang nachgewiesen. Die erfolgreichen externen Release-/Smoke-Checks belegen Website `ca4fbc77` und Panel `14262776`; der Website-Smoke enthält den lesenden Migrationsbereitschaftscheck, aber kein eigenständiges DDL-Ausführungsprotokoll. Vor einem weiteren ausdrücklich freigegebenen Release Konfiguration und aktuellen Migrationsstand erneut über den vorhandenen Betriebsweg prüfen. Beide zusätzlichen PRs bleiben Entwürfe. Keine Daten-/Dateirückmigration oder Löschung im Rückfall.
