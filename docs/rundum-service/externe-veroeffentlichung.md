# Nachträglich festgestellte PR-Statusänderungen und Veröffentlichungsbelege

Stand: 15.11.2026, 06:49 UTC; ältere Momentaufnahmen von 05:19 und 06:33 UTC bleiben zeitlich zugeordnet erhalten. Ausschließlich lesende Untersuchung; alle Zeiten UTC. Dieser Bericht ist keine Veröffentlichungsfreigabe.

## Aktueller belegter Stand — Prüfung 06:49 UTC

| System | Aktueller main und nachgewiesener Produktionsstand | Konkreter Releasebeleg |
|---|---|---|
| Website `white-gloss.de` | `ca4fbc77fb9aeda96bc4a6abe9d9d8208ff8c365` | [Deploylauf 43686103851](https://github.com/White-Gloss/glanz-buchung-meister/actions/runs/43686103851), Job `132726873016`, Aktivierung und Live-Smoke erfolgreich; aktive Release-ID am 15.11.2026 um 06:36:17 UTC bestätigt |
| Panel `panel.white-gloss.de` | `14262776e669132a465dd90ec8d74ecd046fc713` | [Panel checks 43675781902](https://github.com/White-Gloss/white-gloss-panel/actions/runs/43675781902), Job `132696010875`, Veröffentlichung und HTTPS-Prüfung am 15.11.2026 um 04:15:51.892 UTC bestätigt |

Damit ist inzwischen auch der ursprüngliche Websiteumfang aus PR #347 extern live gegangen. Der zusätzliche Abschluss-PR #349 bleibt davon getrennt: offen, Draft, ohne Auto-Merge, bei der Abfrage mit Head `d6256548348f8df7adde62ad97c74d613bdb0362`, konfliktfrei, aber fehlgeschlagener eigener CI. Seine zusätzlichen Korrekturen sind durch den ca4-Release nicht als veröffentlicht oder abschließend bestanden belegt. Konkrete Ready-/Merge-/Dispatch-Verursacher lassen sich aus dem gemeldeten Account `White-Gloss` allein weiterhin nicht bestimmen. Die fachliche Liveprüfung von Website → Panel, Produktionsschlüsseln, echter E-Mail-Zustellung und Kundenanmeldung folgt daraus ebenfalls nicht.

## Bestätigter Zustand bei der Abfrage um 05:19 UTC

- [Panel-PR #100](https://github.com/White-Gloss/white-gloss-panel/pull/100) ist geschlossen und gemergt. Panel-main ist `14262776e669132a465dd90ec8d74ecd046fc713`.
- Der bestehende Hostinger-Releasejob hat diesen Commit tatsächlich veröffentlicht und über HTTPS geprüft. Das ist durch die spezifische Erfolgszeile im Releasejob belegt, nicht nur durch den grünen Workflowstatus.
- [Website-PR #347](https://github.com/White-Gloss/glanz-buchung-meister/pull/347) ist offen, `draft=false`, `merged=false`, `auto_merge=null`. Sein bei der letzten Abfrage gelesener Head ist `5d1f9e9cb44a7740b4bf94cef1f343535b38f1a4`. Website-main bleibt `3123a86562c2a4b8a4842075bca5d865b1a7091f`.
- Der Auftrag hatte keine Veröffentlichung freigegeben. Die vorliegenden GitHub-Daten identifizieren den konkreten Menschen, Client oder Prozess hinter den Ready-/Merge-Aktionen nicht eindeutig.

## Zeitlinie und nachweisbare Akteure

Quelle sind die frisch gelesenen GitHub-PR-Antworten und vollständigen aktuellen Zeitlinien: [Panel #100](https://api.github.com/repos/White-Gloss/white-gloss-panel/issues/100/timeline?per_page=100), [Website #347](https://api.github.com/repos/White-Gloss/glanz-buchung-meister/issues/347/timeline?per_page=100).

| Zeitpunkt | Nachgewiesenes Ereignis | Zuordnung laut GitHub |
|---|---|---|
| 04:12:58 | Panel #100: `ready_for_review`, Event `36169795576` | `actor.login=White-Gloss`, `actor.id=307770905`, `performed_via_github_app=null` |
| 04:13:01 | Panel: Lauf `43675774639`, „Auto-merge validated PRs“, angelegt | `event=pull_request_target`, Head `10972fc…`, `actor=White-Gloss`, `triggering_actor=White-Gloss` |
| 04:13:04 | Panel #100: `merged`, Event `36169799358` | `actor=White-Gloss`, `performed_via_github_app=null`, Commit `14262776…`; PR-Antwort zusätzlich `merged_by.login=White-Gloss` |
| 04:13:05 | Panel #100: `closed`, Event `36169799426` | `actor=White-Gloss`, `performed_via_github_app=null` |
| 04:13:05.091 | Auto-merge-Job beginnt den protokollierten Schritt `gh pr merge "$PR_URL" --auto --squash --delete-branch` | GitHub-Actions-Job `132695484475`, PR_URL ist Panel #100; Schritt erfolgreich |
| 04:13:07 | Panel: Push-Prüflauf `43675781902` für `14262776…` angelegt | `event=push`, `actor=White-Gloss`, `triggering_actor=White-Gloss` |
| 04:15:51.892 | Hostinger-Panel für `14262776…` veröffentlicht und über HTTPS geprüft | Releasejob `132696010875` im Push-Prüflauf |
| 04:23:03 | Website #347: `ready_for_review`, Event `36170148240` | `actor=White-Gloss`, `actor.id=307770905`, `performed_via_github_app=null` |

`White-Gloss` ist ein GitHub-Account, keine eindeutige Identifikation eines Menschen oder eines ausführenden Tools. Aus diesem Accountnamen und dem Wert `null` folgt weder eine menschliche Handlung noch der Ausschluss einer Automation.

Die Eventobjekte enthalten teilweise zusätzlich ein eingebettetes `issue`-Objekt mit `issue.performed_via_github_app=chatgpt-codex-connector`. Diese Metadaten gehören zum Issueobjekt. Sie dürfen nicht mit dem separaten `performed_via_github_app` des Ready-/Merge-Events verwechselt oder als Beweis für dessen Verursachung verwendet werden.

## Automatischer Mergeweg: vorhanden, konkrete Mergeursache ungeklärt

Die [Workflowdatei am veröffentlichten Commit](https://github.com/White-Gloss/white-gloss-panel/blob/14262776e669132a465dd90ec8d74ecd046fc713/.github/workflows/auto-merge.yml) wurde frisch gelesen. Sie reagiert auf `pull_request_target` mit `opened`, `synchronize`, `reopened` und `ready_for_review`. Für PRs aus demselben Repository mit Ziel `main` und `draft=false` führt sie aus:

```sh
gh pr merge "$PR_URL" --auto --squash --delete-branch
```

Der passende [Lauf `43675774639`](https://github.com/White-Gloss/white-gloss-panel/actions/runs/43675774639), Job `enable-auto-merge` / `132695484475`, ist erfolgreich. Sein Log enthält für Panel #100 den obigen Befehl und dessen Beginn um **04:13:05.091 UTC**. Das GitHub-Mergeevent ist bereits mit **04:13:04 UTC** datiert. Der CLI-Schritt gibt keinen erläuternden Ergebnistext aus.

Damit ist der aktive automatische Mergeweg bestätigt. Die protokollierte Zeitfolge liefert jedoch keinen belastbaren Nachweis, dass genau dieser Lauf den bereits vorher datierten Merge verursacht hat. Zeitauflösung und unterschiedliche Uhren sind ebenfalls kein Beleg für eine bestimmte andere Ursache. Eine konkrete Person, eine andere Sitzung, ein zusätzlicher Client oder eine weitere Automation wird daher nicht als Verursacher behauptet. Die frühere PR-Textaussage „Entwurf ohne Auto-Merge“ beschreibt den jetzigen tatsächlichen Status nicht mehr.

Nach dem Sitzungsprotokoll des implementierenden Hauptagenten wurden hier keine Mark-ready-, Merge- oder Deploymentwerkzeuge aufgerufen; am Panel-PR wurden Titel und Beschreibung geändert. Das aktuell entdeckte Schema von `github_update_pull_request` enthält keinen Draft-Parameter. Diese Angaben ersetzen keine GitHub-Auditspur des ursprünglichen Ready-/Merge-Requests und schließen einen bislang unbelegten Connector-/Clientseiteneffekt nicht technisch aus. Die vorliegenden lesenden Werkzeuge liefern diese Auditspur nicht.

## Tatsächlicher Hostinger-Releasebeleg

[Panel checks, Run `43675781902`](https://github.com/White-Gloss/white-gloss-panel/actions/runs/43675781902) wurde durch den Push von `14262776e669132a465dd90ec8d74ecd046fc713` ausgelöst. Codeprüfungen und Browserjob waren erfolgreich. Der Job **Hostinger panel release**, ID **132696010875**, enthält einen tatsächlich erfolgreichen Schritt **Publish panel on Hostinger VPS and verify HTTPS**.

Aus dessen frisch gelesenem Log:

```text
2026-11-15T04:15:34.2665469Z Aktiver Panel-Commit vor Veröffentlichung: 372864f4eeaae8dba3da34580a0b9f40e5e27888
2026-11-15T04:15:51.8925799Z Hostinger-Panel veröffentlicht und über HTTPS geprüft: 14262776e669132a465dd90ec8d74ecd046fc713
```

Das zugehörige `scripts/deploy-hostinger.sh` gibt diese Erfolgszeile erst nach Vergleich des aktiven Servercommits, öffentlicher HTTPS-Gesundheitsprüfung, passendem `x-panel-commit`, erreichbarer Anmeldeseite und Vergleich der ausgewählten öffentlichen Paneldateien mit dem Releasepaket aus. Damit ist der Commit um **04:15:51 UTC nachweislich live geprüft**. Der Release erfolgte über den vorhandenen Push-Releaseweg.

Ein zusätzlicher eigener Abruf von `/healthz?release=14262776e669132a465dd90ec8d74ecd046fc713` aus der Arbeitsumgebung scheiterte um 05:18 UTC weiterhin am Netzwerkproxy mit `Tunnel connection failed: 403 Forbidden`. Das ist kein Nachweis eines Livefehlers. Der Releasejob ist der tatsächliche Livebeleg; eine spätere manuelle Serveränderung kann ohne erneuten Serverzugang nicht ausgeschlossen werden. Es wurden keine echten Kundenanfragen, E-Mails oder Uploads ausgelöst.

## Inhalt des veröffentlichten Commits

Die Git-Commitobjekte wurden zusätzlich über GitHub frisch gelesen; der lokale Vergleich bestätigt das Ergebnis:

| Commit | Git-Tree |
|---|---|
| PR-Head `10972fce488c960662e1d7fcd6e88bdbe57b8c96` | `1e13bf9f5858aecbb30cff08aa0b8e1e388e39e1` |
| veröffentlichter Commit `14262776e669132a465dd90ec8d74ecd046fc713` | `1e13bf9f5858aecbb30cff08aa0b8e1e388e39e1` |

`14262776…` besitzt als einzigen Parent den vorherigen main `372864f4eeaae8dba3da34580a0b9f40e5e27888`. Der vollständige Repositoryinhalt ist identisch zum geprüften PR-Head `10972fc…`; `git diff --stat` zwischen beiden ist leer. Der veröffentlichte Stand enthält damit keinen zusätzlichen Dateiunterschied gegenüber diesem PR-Head. Unterschiedliche Commit-IDs allein bedeuten hier keine unterschiedliche Implementation.

## Grenzen und Umgang mit dem Befund

Die tatsächliche Panel-Veröffentlichung ist belegt. Die ursprüngliche Mark-ready-/Merge-Verursachung bleibt mit den verfügbaren Daten unaufgelöst. Der Bericht ordnet keine nachträgliche Erlaubnis zu und behauptet keine ausdrückliche Freigabe. Website #347 war bei der damaligen Abfrage um 05:19 UTC offen und ungemergt. Diese Statusangabe wird durch die folgende Aktualisierung überholt; ein Merge allein ist weiterhin kein Livebeleg.

Dieser Prüfauftrag hat ausschließlich lesende GitHub- und HTTPS-Abfragen sowie das Schreiben dieses lokalen Berichts ausgeführt. Es wurden keine PR-Zustände, Mainzweige, Workflows oder Produktionsdienste verändert, keine Veröffentlichung zurückgerollt und keine weitere Veröffentlichung ausgelöst.

## Weitere Statusänderung: Website #347 gemergt — Prüfung 06:33 UTC

Die frisch gelesenen Antworten für [Website-PR #347](https://github.com/White-Gloss/glanz-buchung-meister/pull/347), dessen [Zeitlinie](https://api.github.com/repos/White-Gloss/glanz-buchung-meister/issues/347/timeline?per_page=100) und [Website-main](https://api.github.com/repos/White-Gloss/glanz-buchung-meister/branches/main) bestätigen inzwischen:

- `state=closed`, `merged=true`, `draft=false`, `merged_by.login=White-Gloss`;
- main / `merge_commit_sha=ca4fbc77fb9aeda96bc4a6abe9d9d8208ff8c365`;
- letzter PR-Head `774f91385996b5ebdfe7818cbe13f00efab620ac`;
- `ready_for_review` weiterhin vom 15.11.2026 um 04:23:03 UTC, Event `36170148240`;
- `merged` am 15.11.2026 um **06:24:39 UTC**, Event `36174491613`; `closed` ebenfalls 06:24:39 UTC; `head_ref_deleted` um 06:24:42 UTC.

Die Commit-Committerzeit von `ca4fbc77…` ist **06:24:38 UTC**. Die um eine Sekunde spätere PR-/Timelinezeit **06:24:39 UTC** wird nicht mit ihr gleichgesetzt. Auf den Ready-/Merge-/Closed-/Branchlösch-Events steht `actor.login=White-Gloss`, jeweils `performed_via_github_app=null`. Dies identifiziert erneut weder den konkreten Menschen noch den ausführenden Client oder Prozess. Aus dem Accountnamen wird keine Auslöserattribution abgeleitet. Dieser Prüfauftrag hat keine dieser Mutationen ausgeführt.

### Squash- und Inhaltsvergleich

Die Git-Commitobjekte wurden frisch über GitHub gelesen; der lokale `git diff --stat` ist leer:

| Commit | Git-Tree |
|---|---|
| letzter PR-Head `774f91385996b5ebdfe7818cbe13f00efab620ac` | `e6cd5f6688e6f442e8250592c4fc1fcbddc580ea` |
| neuer main `ca4fbc77fb9aeda96bc4a6abe9d9d8208ff8c365` | `e6cd5f6688e6f442e8250592c4fc1fcbddc580ea` |

`ca4fbc77…` hat als einzigen Parent den vorherigen main `3123a86562c2a4b8a4842075bca5d865b1a7091f`. Das Squash-Ergebnis enthält somit exakt denselben vollständigen Repositoryinhalt wie der genannte PR-Head.

### Deployment, Aktivierung und Smoke für ca4: derzeit nicht belegt

Die [auf `ca4fbc77…` gefilterte Workflow-Run-Abfrage](https://api.github.com/repos/White-Gloss/glanz-buchung-meister/actions/runs?head_sha=ca4fbc77fb9aeda96bc4a6abe9d9d8208ff8c365&per_page=30) lieferte bei der Abschlussabfrage am **15.11.2026 um 06:33:48 UTC** vier Läufe: Push-CI `43685306512` erfolgreich, Lighthouse `43685306374` erfolgreich, dynamischer „Push on main“ erfolgreich sowie einen laufenden Codespaces-Lauf. Ein Deploymentlauf für diesen Commit war nicht enthalten. Die ergänzend gelesene Sammlung der manuellen Dispatch-Läufe enthielt ebenfalls keinen neuen ca4-Release.

Die [Deploydatei am exakten ca4-Commit](https://github.com/White-Gloss/glanz-buchung-meister/blob/ca4fbc77fb9aeda96bc4a6abe9d9d8208ff8c365/.github/workflows/deploy-hostinger.yml) wurde frisch remote gelesen. Sie hat ausschließlich `workflow_dispatch` und verlangt konkrete `release_sha` und `expected_current_release`. Ein Main-Merge oder eine erfolgreiche CI startet diesen Releaseweg nicht automatisch.

**Für ca4 sind deshalb weder Produktionsaktivierung, aktiver Servercommit noch Live-Smoke nachgewiesen.** Daraus folgt nicht der Beweis, dass niemand außerhalb dieses beobachtbaren Releasewegs manuell veröffentlicht hat. Ein eigener HTTPS-Abruf der Website scheiterte um 06:33 UTC weiterhin am Netzwerkproxy (`Tunnel connection failed: 403 Forbidden`).

Der neueste in dieser Untersuchung tatsächlich geprüfte Website-Releasebeleg betrifft weiterhin den älteren Commit **3123a86562c2a4b8a4842075bca5d865b1a7091f**: [Deploy to Hostinger VPS, Run `43666908559`](https://github.com/White-Gloss/glanz-buchung-meister/actions/runs/43666908559), Deployjob **132668271603**, vom 15.11.2026. Die frisch gelesenen Jobantworten und Logs bestätigen:

| Tatsächlicher Produktionsschritt für 3123a865 | Zeit und Ergebnis |
|---|---|
| Release atomar aktivieren | 02:16:24–02:16:28 UTC, erfolgreich |
| Live-Smoke-Test | 02:16:28–02:16:43 UTC, erfolgreich |
| Aktive Release-ID bestätigen | 02:16:43–02:16:44 UTC, erfolgreich |

Dieser ältere Beleg wird nicht als ca4-Deployment umgedeutet. Eine seitdem außerhalb der gelesenen Läufe vorgenommene Serveränderung bleibt ohne Serverzugang ungeprüft.

### Migration 0026: Tests bestätigt, Produktionsausführung ungeprüft

Der ca4-Push-CI-Lauf `43685306512`, Schemajob **132724442812**, hat den Schritt „Datenbank aus den Migrationen aufbauen“ erfolgreich ausgeführt. Das bestätigt den isolierten CI-Schemaaufbau. Es ist kein Nachweis einer Migration der produktiven Website-Datenbank.

`0026_panel_intake.sql` ist im Release-Migrationsmanifest des exakten ca4-Commits enthalten. Das Middleware-Gate `server/middleware/00-release-readiness.ts` prüft den erforderlichen Schemazustand lesend und führt keine Migration/DDL aus. Im gelesenen Deploymentworkflow und in den vorliegenden Produktionslogs ist keine tatsächliche produktive Anwendung von `0026_panel_intake.sql` für diesen neuen Stand belegt. Ebenso fehlen ein entsprechender Produktions-Inspektionsbericht oder eine aktuelle bestätigte `_migrations`-Abfrage. **Die produktive Migration bleibt ungeprüft; sie wird nicht als erledigt markiert.**

### Nachfolgender Abschluss-Entwurf #349

[Website-PR #349](https://github.com/White-Gloss/glanz-buchung-meister/pull/349) wurde am 15.11.2026 um **06:24:55 UTC** erstellt. Die Abfrage um 06:31 UTC bestätigt `draft=true`, `state=open`, `merged=false`, `auto_merge=null`, Head `abf018a2aff88273071561f96e861d0d872d52e9`, inzwischen Base `ca4fbc77…`, `mergeable=false` und `mergeable_state=dirty`.

Für diesen Head bestanden zwei dynamische PR-/Security-Workflowläufe und drei erfolgreiche Security-Check-Runs; ein regulärer Repository-CI-Lauf wurde nicht gefunden. „Kein Actionslauf“ wäre deshalb zu weit gefasst. Diese Angaben sind eine zeitgebundene Momentaufnahme vor der separat durch den Hauptagenten bearbeiteten Konfliktauflösung. Dieser lesende Prüfauftrag hat weder PR-Status noch Branch-/Main-Refs, Workflowkonfiguration oder Produktion verändert.

## Website ca4 nun tatsächlich veröffentlicht — Aktualisierung 06:49 UTC

Die vorherige Momentaufnahme „kein ca4-Deployment um 06:33:48 UTC“ war für ihren Zeitpunkt korrekt. Danach wurde der [manuelle Deploymentlauf `43686103851`](https://github.com/White-Gloss/glanz-buchung-meister/actions/runs/43686103851) am **15.11.2026 um 06:35:04 UTC** gestartet. Die frisch gelesene Runantwort bestätigt `event=workflow_dispatch`, `head_sha=ca4fbc77fb9aeda96bc4a6abe9d9d8208ff8c365`, `actor.login=White-Gloss`, `triggering_actor.login=White-Gloss` und `conclusion=success`. Daraus wird keine konkrete Person oder ausführende Sitzung abgeleitet. Der Name des erfolgreichen `approval`-Jobs beweist die Annahme der technischen Workflowvoraussetzungen, keine hier zusätzlich erteilte Nutzerfreigabe.

### Tatsächliche Produktionsaktivierung und HTTPS-Prüfung

Der Deployjob **132726873016** wurde vollständig gelesen, einschließlich seiner Logs. Tatsächlich erfolgreich ausgeführt:

| Produktionsschritt für ca4 | UTC-Zeit am 15.11.2026 | Ergebnis |
|---|---|---|
| Freigabe unmittelbar vor Aktivierung erneut prüfen | 06:35:57–06:35:58 | bestätigt ca4, CI `43685306512`, erwarteten bisherigen Produktionsstand `3123a865…` |
| Release atomar aktivieren | 06:35:58–06:36:04 | erfolgreich |
| Live-Smoke-Test | 06:36:04–06:36:17 | erfolgreich |
| Aktive Release-ID bestätigen | 06:36:17 | erfolgreich, aktiver Serverpfad entspricht ca4 |
| Rollback bei fehlgeschlagenem Smoke | 06:36:17 | übersprungen, weil Smoke erfolgreich |

Exakter Ergebnistext im Deployjob:

```text
2026-11-15T06:36:17.0271885Z Production-Smoke-Test erfolgreich für https://white-gloss.de
```

Zusätzlich sind die nachfolgenden [Production Smoke `43686205150`](https://github.com/White-Gloss/glanz-buchung-meister/actions/runs/43686205150), Job **132727098176**, und [Live Visual Check `43686205167`](https://github.com/White-Gloss/glanz-buchung-meister/actions/runs/43686205167), Job **132727098113**, erfolgreich. Das separate Smoke-Log bestätigt um **06:36:56.643 UTC** erneut den erfolgreichen Produktions-Smoke. Der visuelle Job führte „Veröffentlichte Website lesend prüfen“ um **06:37:02–06:38:05 UTC** erfolgreich aus und sicherte Nachweise. Diese Prüfungen sind kein erfolgreicher fachlicher Anfrageversand oder echter Kundenlogin.

Der einmalige Verbindungsfehler zum internen Port während des Neustarts um 06:36:03 UTC ist im Aktivierungslog sichtbar; der Aktivierungsschritt selbst und die danach erfolgten HTTPS-Smokes sowie die aktive Commitprüfung bestanden. Er wird daher nicht als fehlgeschlagener Gesamt-Release ausgegeben.

### Migration 0026: genauer nachweisbarer Umfang

Die Deploy-/Smoke-Logs enthalten **keinen expliziten DDL-Lauf und keine Zeile „applied 0026_panel_intake.sql“**. Sie melden lediglich beim Build um 06:35:37 UTC „20 erforderliche Migrationen im Build vermerkt“.

Im veröffentlichten ca4-Quellstand ist `0026_panel_intake.sql` Teil des erforderlichen Release-Migrationsmanifests. Das vor den Routen liegende Middleware-Gate liest mit `checkReleaseSchema` unter anderem die Namen aus `_migrations` und würde bei fehlendem erforderlichem Eintrag nicht bereit melden. Die erfolgreiche Aktivierung mit anschließenden HTTP-200-Antworten ist damit ein **indirekter Bereitschaftsbeleg anhand des veröffentlichten Gates**. Sie liefert kein separates Produktions-DDL-Protokoll, keinen Ausführungszeitpunkt und keinen identifizierten Ausführenden der Migration. Eine eigenständige produktive Schema-/Datenflussinspektion wurde hier nicht durchgeführt. Der fachliche Website→Panel-Liveablauf und seine Produktionsschlüssel bleiben durch diese Deploymentbelege allein ungeprüft.

### Leistungs- und Consent-Nachweise genau des ca4-Verify-Jobs

Quelle ist der erfolgreiche **Verify-Job 132724442552** aus [Push-CI `43685306512`](https://github.com/White-Gloss/glanz-buchung-meister/actions/runs/43685306512) für ca4, **nicht** der separate Lighthouse-Liveworkflow und **nicht** der Abschluss-PR #349. Die Messungen stammen aus der isolierten Linux-GitHub-Prüfung mit Lighthouse 12.6.1, drei mobilen und drei Desktopläufen.

| Profil / Lauf | Performance | Accessibility | Best Practices | SEO | FCP ms | LCP ms | TBT ms | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Mobil 1 | 98 | 100 | 100 | 100 | 1180.896 | 2338.896 | 51.5 | 0 |
| Mobil 2 | 98 | 100 | 100 | 100 | 1188.179 | 2335.179 | 50 | 0 |
| Mobil 3 | 98 | 100 | 100 | 100 | 1285.547 | 2338.547 | 5.5 | 0 |
| Desktop 1 | 100 | 100 | 100 | 100 | 339.099 | 530.099 | 0 | 0 |
| Desktop 2 | 100 | 100 | 100 | 100 | 353.614 | 526.614 | 0 | 0 |
| Desktop 3 | 100 | 100 | 100 | 100 | 348.14 | 530.14 | 0 | 0 |

Der tatsächliche Digest lautet um **06:32:49.897 UTC** `Lighthouse digest: status=passed target100=false`. Ein bestandenes Gate darf hier nicht als „überall 100 Punkte“ beschrieben werden. Die protokollierten Consent-Startup-Zeilen dieses Verify-Jobs sind:

```text
2026-11-15T06:31:39.1333488Z QA: consent-startup
2026-11-15T06:31:41.8483896Z QA: consent-startup passed
```

Diese beiden Statuszeilen enthalten keine zusätzlichen numerischen Consent-Startup-Messwerte. Solche Werte werden hier nicht ergänzt oder aus anderen Läufen übernommen.

### Zusätzlicher Abschluss-PR #349 bleibt separat und noch nicht erfolgreich abgenommen

Die Abfrage um **06:48 UTC** bestätigt [PR #349](https://github.com/White-Gloss/glanz-buchung-meister/pull/349) als `state=open`, `draft=true`, `merged=false`, `auto_merge=null`, `mergeable=true`, `mergeable_state=unstable`, Head **d6256548348f8df7adde62ad97c74d613bdb0362**, Base ca4. Die frisch gelesenen Commitobjekte bestätigen für d625654 und den vorherigen Head **abf018a2aff88273071561f96e861d0d872d52e9** denselben Tree **9ed41ef18c66afb809960abd300cb6b11f254d76**. Der lokale Panel-Nachweiszweig `codex/rundum-service-nachweise-20261115` steht weiterhin auf dem bereits veröffentlichten Panel-main `14262776…`.

Der zu d625654 gehörige [CI-Lauf `43685920916`](https://github.com/White-Gloss/glanz-buchung-meister/actions/runs/43685920916) ist fehlgeschlagen: `studio`, `schema` und `cross-browser` erfolgreich; `verify`, Job **132726257214**, fehlgeschlagen. Das Log zeigt am **06:40:57 UTC** einen `requestfailed` für `GET /api/availability`, Profil `390x844`, Fehlermeldung `net::ERR_ABORTED`; danach `QA: booking-ui failed (1)`. Die Prüfkette brach dort ab. Für diesen Abschlusslauf werden daher keine bestandenen Consent-Startup-/Lighthousewerte behauptet und die ca4-Werte nicht als Ersatz verwendet.

Die aktuelle belegte Zuordnung lautet somit: ursprünglicher Websiteumfang ca4 und Panelumfang 142 extern veröffentlicht; zusätzliche Abschlusskorrekturen aus #349 weiterhin Draft und gesondert zu prüfen. Diese lesende Untersuchung hat keine Veröffentlichung oder Statusänderung ausgelöst und keine nachträgliche Erlaubnis erteilt.
