# Prüfbericht – Rundum-Service und Kundenzugang

Stand: 15.11.2026, Vorbereitung ohne Veröffentlichung. Tatsächliche Live-Zuordnung siehe `live-zuordnung.md`; Anforderungen und Abnahmekriterien siehe `anforderungen.md`.

## A – Code und Datenfluss
Website→Panel wurde mit den echten Speicher-, Übergabe- und Panelrouten im Prozess gegen isolierte PostgreSQL-/SQLite-Datenbanken geprüft. Alle Website-Migrationen wurden eingespielt. Anbieter und HTTP-Transport wurden gezielt abgefangen; keinerlei echte Kundenmail. Acht Website-Anfragen ergaben acht Panelanfragen, sechs Kunden, null Websitefotos und ein privates Panel-Foto. Alle sieben Leistungswünsche, vollständige Beschreibung, Marke/Modell, optionaler Telefonkontakt, Abholwunsch und Wunschtermin kamen unverändert an.

Die erste Gesamtprüfung fand veraltete Erwartungen an die40er-Grenze, Feldliste und Website-Kundenmail. Die passenden Regressionen wurden an den neuen Vertrag angepasst; Bestands-/Legacy-Prüfungen bleiben separat erhalten. Ein unabhängiges Standards-Review fand eine Empfängeränderung zwischen Datenbanklesen und Versand; diese wurde mit synchroner aktueller Empfängerprüfung und reproduzierbarem Interleavingtest behoben. Das getrennte Spec-Review fand fehlende Kundenansichtsfelder, den erst spät erreichbaren Service, falsche Einordnung einer HTTP200-Antwort ohne Versand-ID und verbliebene Foto-Aufforderungen. Alle vier wurden gezielt korrigiert.

Website:904 Tests bestanden,1 bestehender Test übersprungen; Build, Typen und Inhaltsgate bestanden. Lint:0 Fehler,2 bereits vorhandene Warnungen. Der nachträglich eingegangene Website-Hauptbranch333487b (#346) wurde mit seinen Preis-/Katalogänderungen erhalten; die kombinierte Gesamtprüfung ist bestanden. Panel:965 Tests des finalen Gesamtstands bestanden; zusätzliche gezielte Tests der Link-Erneuerung und des Empfängerschutzes bestanden. Build, Lint, Typ- und Laufzeitsyntaxprüfung bestanden. Die Edge-Function-Typprüfung konnte aus dieser Arbeitsumgebung `jsr.io/@supabase/functions-js` nicht herunterladen; das ist ein konkret protokollierter Netzwerkblocker, kein bestandener Check. Der unveränderte Edge-Code muss zusätzlich im regulären CI geprüft werden.

## B – Funktion und Zugriffsschutz
Der portable Test `white-gloss-panel/scripts/test-website-panel-journey.mjs` bestand16 Prüfgruppen. Einzelne HTTP-Status und die verwendete Methode stehen in `cross-repo-results.json`; die vollständige lesbare Zuordnung in `cross-repo-results.md`.

Zusätzliche Integrationstests prüfen dieselbe Anfrage bei konkurrierender Übermittlung, Wiederanlauf nach Panel-Commit mit verlorener Antwort, Änderung der Empfängeradresse, unbekannte Anbieterantwort ohne ID, Fehler vor/nach Mailannahme, stabile Anbieter-Idempotenz innerhalb23 Stunden und Sendesperre außerhalb des Fensters. Einrichtung bleibt auf die gewählte E-Mail beschränkt, Linkeinlösung erzeugt noch keine Kundensitzung. Erst Passwortvergabe und Anmeldung erlauben eigene Daten. Abgelaufene und verwendete Links werden abgewiesen; unter „Neuen Einrichtungslink anfordern“ kann ausdrücklich ein neuer einmaliger24h-Link angefordert werden, ohne bestehende Passwörter zurückzusetzen.  Bestandskonten mit/ohne Passwort werden wiederverwendet, vorhandene Passwörter nicht zurückgesetzt. Logout, erneute Anmeldung und ausdrücklich angeforderte Wiederherstellung sind geprüft.

Fotos werden erst im geschützten Kundenbereich angenommen: richtige Anfrage-/Kundenzuordnung, Zugriff auf fremde Anfragen, anonymer Abruf, ungültiger Inhalt und Dateigröße wurden geprüft. Bestehende Größen-/Mengenregeln wurden erhalten. Keine Kundenfotos, Dokumente oder Konten gelöscht.

## C – Oberfläche und Abschlussreview
Neue Screenshots und Browsernachweise werden ausschließlich im bestehenden echten Linux-GitHub-CI erzeugt. Vorliegen und visuelle Prüfung werden hier erst nach erfolgreichem Lauf ergänzt. Geplant sind Chromium, Firefox und WebKit sowie Desktop/Mobil-Emulation; kein echter Gerätetest. Die unveränderten Pakete, Navigation, SEO und übrigen Inhalte bleiben durch die bestehende Inhaltsprüfung geschützt; die ausdrücklich beauftragten Änderungen sind als exakte semantische Deltas dokumentiert, nicht pauschal ausgenommen.

## Anforderung → Umsetzung → Nachweis
| ID | Umsetzung | konkreter Nachweis / verbleibende Grenze |
|---|---|---|
| R1 | aktuelle Repos/Live-Commits bestätigt | `live-zuordnung.md`, tatsächliche Hostinger-Releasejobs |
| R2 | kompakter Abschnitt, zusätzlicher Einstieg im vorhandenen Hero; bestehende Pakete erhalten | `rundum-service.tsx`, `scroll-film-hero.tsx`; Inhaltsgate; visuelle CI-Prüfung noch offen |
| R3 | Anfrageanker und WhatsApp mit hinterlegter Nummer+exaktem Text | `rundum-service.tsx`, `scripts/qa/rundum-ui.mjs`; kein WhatsApp→Panel-Automatismus |
| R4 | sieben Optionen und kurze Datenaufnahme, keine Adress-/Foto-Pflicht | `rundum-schema.test.ts`, `public-form-validation.test.ts`, Cross-Repo Gruppen1–2 |
| R5 | individuelle Abstimmung, unverbindlicher Datumwunsch, keine Reparatur-Festpreise | Formular/Portal/Receipt-Texte, `rundum-request-ui.test.mjs`, `portal-ui.test.mjs` |
| R6 | additive Metadaten, vollständige Übergabe, sichere Portalprojektion | `panel-intake.test.ts`, `website-intake-http.test.mjs`, Cross-Repo2/6 |
| R7 | öffentliche Dateiauswahl entfernt, historischer Upload-RPC weist ab | Quellsuche nur redaktioneller Studio-Upload, CI-Flowtest, keine Speicherlöschung |
| R8 | vorhandener auftragsbezogener Panel-Upload weitergenutzt | `customer-setup-link.test.mjs`, vorhandene Galerie-/Chat-Sicherheitstests, Cross-Repo7/8 |
| R9 | ein dauerhafter Receipt-Job nach Panel-Speicherung, Setup- oder Login-Link | `website-intake-http.test.mjs`, `customer-setup-link.test.mjs`, Cross-Repo3/9/13 |
| R10 | dauerhaftes Passwortkonto, einmalige24h-Einrichtung, sichere Sitzungen/Reset | Auth-Tests, Cross-Repo5/6/13/15/16; neue Browserdurchgänge offen |
| R11 | keine Bestandsmigration/Massenmail/Passwortrücksetzung | bestehende Auth-/Onboardingtests, Cross-Repo9/13, additive Schema-Diffs |
| R12 | persistente IDs, unveränderliche Nutzlast, Queue/Lease/Provider-Key | `panel-intake.test.ts`, `website-intake-http.test.mjs`, Cross-Repo1/4/12/14 |
| R13 | gespeichert/queued/accepted/unknown/failed und Anbieterzustellung getrennt | Mailledger, `mail-delivery-status.mjs`+Tests; tatsächliche Inbox-Zustellung ungeprüft |
| R14 | getrennte A/B/C-Prüfung und unabhängige zwei Reviewachsen | dieser Bericht; finale Browser-/Commit-Prüfung offen |
| R15 | reviewbare Branches, Konfiguration und Rückfall dokumentiert | `veroeffentlichung.md`; PR-/Artefaktlinks werden nach Erstellung ergänzt |

## Ehrliche Grenzen
Kein produktiver Release/Merge und keine echte Kundenaktion. Kein echter Gerätetest. Anbieter-Stubs beweisen weder tatsächliche Zustellung noch Spam-/Posteingangsplatzierung. Die neue Verbindung muss nach einer späteren Freigabe mit den vorhandenen geschützten Produktionszugängen geprüft werden; bestehende Schlüssel wurden nicht ausgegeben oder verändert. Noch fehlende CI-Ergebnisse sind kein bestandener Test.
