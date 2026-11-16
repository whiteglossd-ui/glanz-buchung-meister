# Rundum-Service und dauerhafter Kundenzugang

Stand: 15.11.2026. Auftrag autorisiert Umsetzung, isolierte Tests und Entwurfs-PRs; keine Veröffentlichung, kein Merge auf main.

## Bestätigte Ausgangslage
Zu Auftragsbeginn geprüft: Website main `38996d2ba9adfd54bde1dd22949b60c7afb9d0fd`, Panel main `372864f4eeaae8dba3da34580a0b9f40e5e27888`. Die damals frisch gelesenen erfolgreichen Hostinger-Deployments belegen die Zuordnung für die dort genannten Zeitpunkte; kein Buchungsnachweis daraus. Panel-App erfolgreich verbunden, scope panel:read. Website speichert PostgreSQL-Anfragen, Panel liest /api/hub und speichert SQLite orders.website_id eindeutig. Kunden-Passwortkonten, scrypt, sichere serverseitige Sitzungen, Passwort-Code-Wiederherstellung und zugeordnete private Chat-Uploads existieren. Keine automatische Übernahme bestehender Kunden erforderlich; additive technische Schemas stehen im Betriebsplan.

## Anforderungen und Abnahme
| ID | Anforderung | Nachweis vor Abschluss |
|---|---|---|
| R1 | Live-Zuordnung aktuell prüfen | Deployment-Jobs, Commits und Grenzen im Prüfbericht |
| R2 | Kompakter prominenter Rundum-Service, bestehende Sprache/Schriften, Pakete, Navigation und SEO erhalten | Diff + Desktop/Mobil-Screenshots |
| R3 | Beide exakten Buttons; Anfrageanker und hinterlegte WhatsApp-Nummer mit vorgegebenem Text | Link-/Browserprüfung; WhatsApp ist eigener Kontaktkanal |
| R4 | Eigener unverbindlicher Abschnitt mit sieben Mehrfachoptionen, Name/E-Mail, optional Telefon, Marke/Modell, Beschreibung, Abholwunsch, optional Datum | Validierung + Formular-/Datentest |
| R5 | Individuelles Angebot nach Begutachtung/Partnerabstimmung; Arbeiten erst nach Freigabe, Datum unverbindlich, keine erfundenen Preise | Texte + gespeicherte Kennzeichnung |
| R6 | Alle Angaben vollständig und nachvollziehbar im Panel, Rundum-Service erkennbar | Website→Panel-Vertragstest, gespeicherter source |
| R7 | Keine öffentlichen Kunden-Uploads oder Foto-Pflichten; vorhandene Dateien bleiben | Quellsuche + normale Buchungs-/Anfragetests ohne Fotos |
| R8 | Fotos nur im geschützten Panel, richtiger Kunde/Anfrage, Dateiprüfung/Grenzen/Fehler | Upload- und Fremdzugriffstests |
| R9 | Nach Panel-Speicherung genau eine Eingangs-E-Mail, neuer Kunde mit Passwortlink, bestehendes Passwort mit Login-Link | Anbieter-Stub + Empfangsstatus |
| R10 | Einmaliger befristeter Link, sicher neu anforderbar, Konto dauerhaft; Passwort/Logout/Reset/angemeldet bleiben | Auth-Integration einschließlich Ablauf/Wiederverwendung |
| R11 | Bestandskonten/Passwörter/Anfragen/Fotos erhalten; bekannte E-Mail erlaubt keinen Zugriff | Regressionen + Berechtigungstests |
| R12 | Doppelklick/Reload/Wiederholung ohne Duplikate; E-Mail-Ausfall verliert keine Anfrage; sichere Wiederholung | Parallel-/Replay-/Ausfalltests |
| R13 | Speicherung, Anbieterannahme und Zustellung getrennt; keine Eingangs-PDFs/Zusatzmails/Massenmails | API-Ergebnisse, Mailjobs, Mailtexte |
| R14 | Durchgänge A Code/Datenfluss, B Funktion/Zugriff, C Oberfläche/Review mit ehrlichen Grenzen | Prüfbericht, Screenshots, Review |
| R15 | Reviewbare Änderungen in beiden Repos, PR-Texte, Konfiguration, Reihenfolge/Rückfallplan | Entwurfs-PRs und Betriebsdokument |

## User Stories
1. As a visitor, I want to understand the Rundum-Service near the top of the existing homepage, so that I can request coordinated care and repairs.
2. As a visitor, I want either the request form or WhatsApp, so that I can choose my contact channel.
3. As a customer, I want to select multiple services and describe my vehicle without photos, so that I can request an individual offer easily.
4. As a customer, I want optional collection and a desired date, so that my wishes can be discussed without a binding appointment.
5. As a customer, I want all my submitted details saved with my request, so that nothing is lost between the website and panel.
6. As a new customer, I want one receipt with a secure password setup link after storage, so that I can access my request and add photos.
7. As a customer with a password, I want the normal login link, so that my existing access remains intact.
8. As a customer without a password, I want safe setup, so that my existing requests become accessible only after email proof.
9. As a customer, I want expired or used links explained and a safe new setup path, so that access can be recovered.
10. As a customer, I want password reset, logout and secure remembered sessions, so that my account remains usable across visits.
11. As a customer, I want my private uploads associated with the selected request, so that only authorized people can read them.
12. As an operator, I want retries to reuse one request and mail job, so that technical failures do not duplicate work.
13. As an operator, I want separate saved/accepted/delivered statuses and safe resend, so that failures can be handled accurately.
14. As an existing customer, I want my credentials, requests and files preserved, so that this change does not disrupt my history.
15. As an operator, I want verified changes and deployment instructions before release, so that I can approve a concrete result.

## Implementation decisions / shared contract
- Keep existing databases and request IDs. Additive website columns: request_kind (default booking), requested_services JSON text (default []), pickup_requested boolean (default false). No deletion or rewrite of historical customer data.
- Website HubInquiry adds request_kind, requested_services, pickup_requested, vehicle_make, vehicle_model. Note limit raised to preserve 2000-character descriptions; no photos in new forms. Rundum package_id=rundum-service, total/pickup zero mean unquoted request, never a free offer.
- Server-to-server POST https://panel.white-gloss.de/api/website/intake using existing server-only HUB_SYNC_TOKEN / panel encrypted hubKey, TLS, timing-safe bearer check, bounded JSON. Request body { inquiry: HubInquiry }. Response { saved:true, reference:string, emailStatus:queued|accepted|unknown|failed|not_configured }; never auth tokens/customer session. Optional future provider delivery proof is separate.
- Panel orders.website_id is the deduplication key. Content fingerprint detects conflicting replay; same replay returns same reference. Existing import remains recovery path and receives same source fields. Durable receipt queued only for new-version marked requests, preventing bulk emails to historical requests. Panel intake marks source for one combined receipt; fallback import must use same idempotent receipt path.
- Website saves first, attempts panel handoff; uncertain/offline handoff remains stored and replayable. Tell user accurately when panel handoff remains pending; no new request needed. Existing pull remains recovery path; retain complete pending requests rather than hiding older rows behind a 40-row window.
- Panel receipt owns password onboarding, using existing scrypt and credential table. Add single-use 24h setup links, hashed lookup, encrypted queued payload, limited setup grant, no GET-triggered account/session changes. Existing passwords are never reset by an intake. Expired links can explicitly be renewed with a neutral, rate-limited setup-link request; code setup/reset remains compatible. Password save grants access only after proof.
- Provider idempotency key fixed per durable mail job; persist queued/sending/accepted/unknown/failed states and safe retry within provider idempotency window; never blindly resend unknown sends beyond that window. Existing mail-status lookup used for actual provider status.
- UI reuses existing tokens, typography and form controls. Adjust existing repeated concierge message to avoid duplicates; no whole-home redesign.

## Verification decisions
A: full unit/integration tests, types, lint/build in both repos; test direct application with memory SQLite/PGLite and provider stubs; no real customer messages. B: cross-repository contract and controlled synthetic accounts cover required paths, permissions, bad files, concurrent/repeated requests and mail failure. C: existing Linux GitHub CI browser runners only, screenshots on desktop/mobile emulation and supported engines; no local website hosting. Screenshots and provider stubs are not real devices or actual email inbox delivery.

## Out of scope
Production deployment/merge, mass migration or mail, deletion of files/accounts, new hosting/provider, guaranteed repairs, fixed repair prices, automatic WhatsApp intake, invoices/PDFs on receipt, unrelated redesign.

## Während der Umsetzung eingegangener Hauptbranch

Nach Auftragsbeginn wurden die fremden Hauptbranch-Änderungen aus PR #346 (`333487b4f12a01727ace6ec2f36d22c849551b00`) und anschließend [PR #348](https://github.com/White-Gloss/glanz-buchung-meister/pull/348) (`3123a86562c2a4b8a4842075bca5d865b1a7091f`) in den Website-Entwurf integriert. Die Katalog-/Ab-Preisänderungen aus #346 sowie die Entfernung des Scheinwerferhinweises samt Link auf der Preisseite aus #348 bleiben erhalten. Aktueller Vergleichsstand für die taskbezogene Inhaltsprüfung ist `3123a86562c2a4b8a4842075bca5d865b1a7091f`.

Die rein lesende GitHub-Abfrage am 15.11.2026 um 03:26 UTC bestätigt diesen Website-main und den unveränderten Panel-main `372864f4eeaae8dba3da34580a0b9f40e5e27888`. Ein übernommener Hauptbranch ist kein erneuter Live-Nachweis. Die Produktionsbelege bleiben ihren ursprünglichen Commits und Zeitpunkten zugeordnet; dieser Auftrag hat nichts veröffentlicht. Einzelheiten stehen in [Live-Zuordnung](live-zuordnung.md).

## Späterer Panelzustand

Am 15.11.2026 wurde Panel-PR #100 in GitHub zusammengeführt; der Releasejob bestätigt um 04:15:51 UTC `14262776e669132a465dd90ec8d74ecd046fc713` als aktiv. Sein Tree ist exakt der bereits geprüfte `10972fc`-Tree. Der frühere Basisstand bleibt oben zeitgebunden dokumentiert. Zum Zeitpunkt dieser ersten Panel-Aktualisierung war Website-PR #347 noch ungemergt. Die konkrete Ready-/Merge-Verursachung ist aus den Ereignissen nicht sicher zuzuordnen; in dieser Sitzung wurden keine entsprechenden Status-/Veröffentlichungswerkzeuge aufgerufen. [Details](externe-veroeffentlichung.md).

## Abschließende externe Zustandsänderung

Website-PR #347 wurde am 15.11.2026 um 06:24 UTC als `ca4fbc77` zusammengeführt und anschließend außerhalb der hier ausgeführten Veröffentlichungsaktionen über Run `43686103851` produktiv veröffentlicht. Das vorherige `3123a865` ist daher ein historischer Live-Nachweis. Der ergänzende Website-PR #349 bleibt Entwurf; die zusätzliche Panel-Dokumentation liegt im [Entwurfs-PR #102](https://github.com/White-Gloss/white-gloss-panel/pull/102). Die präzisen, zeitgebundenen Belege stehen in [Live-Zuordnung](live-zuordnung.md) und [externen Ereignissen](externe-veroeffentlichung.md). Diese Änderungen erweitern die ursprüngliche Veröffentlichungserlaubnis nicht.
