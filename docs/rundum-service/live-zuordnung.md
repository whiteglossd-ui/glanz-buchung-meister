# Aktuelle Live-Zuordnung — geprüft am 15.11.2026 (UTC)

## Aktuelle bestätigte Zuordnung — Prüfung 15.11.2026, 06:49 UTC

| System | Frisch bestätigter main | Nachgewiesener Produktionsstand und Beleg |
|---|---|---|
| `https://white-gloss.de` | `ca4fbc77fb9aeda96bc4a6abe9d9d8208ff8c365` | gleicher Commit; [Deploylauf 43686103851](https://github.com/White-Gloss/glanz-buchung-meister/actions/runs/43686103851), Job **132726873016**, Aktivierung 06:35:58–06:36:04 UTC, erfolgreicher Live-Smoke 06:36:04–17 UTC, aktive Release-ID 06:36:17 UTC bestätigt |
| `https://panel.white-gloss.de` | `14262776e669132a465dd90ec8d74ecd046fc713` | gleicher Commit; [Panel checks 43675781902](https://github.com/White-Gloss/white-gloss-panel/actions/runs/43675781902), Job **132696010875**, Veröffentlichung und HTTPS-Prüfung 04:15:51.892 UTC bestätigt |

Die ursprünglichen Website- und Panelumfänge sind damit inzwischen extern live gegangen. Der zusätzliche Website-Abschluss-PR #349 bleibt offen/Draft/ohne Auto-Merge bei `d625654…`, konfliktfrei, aber mit fehlgeschlagener eigener CI. Seine Korrekturen sind vom ca4-Produktionsbeleg nicht umfasst. Die folgenden früheren Momentaufnahmen bleiben als zeitgebundene Verlaufsevidenz erhalten. Konkrete Urheber werden aus dem Account `White-Gloss` allein nicht abgeleitet. Der fachliche Website→Panel-Liveablauf, Produktionsschlüssel und echte Zustellung sind durch die Releasebelege allein weiterhin nicht geprüft.

## Ergebnis zu Auftragsbeginn

Die zu Auftragsbeginn frisch gelesenen GitHub-Release-Belege ordnen die beiden genannten Repositories den jeweiligen Live-Systemen zu den unten genannten Zeitpunkten zu. Historische Gesprächsangaben wurden nicht als Beleg verwendet. Neuere Hauptbranch-Commits werden getrennt aufgeführt und nicht als neue Veröffentlichungsbelege gewertet.

| System | Zu Auftragsbeginn geprüfter GitHub-Defaultbranch | Nachgewiesener Produktionsstand | Nachweis |
|---|---|---|---|
| `https://white-gloss.de` | `main`, `38996d2ba9adfd54bde1dd22949b60c7afb9d0fd` | gleicher Commit; Veröffentlichung 14.11.2026, 15:14 UTC | [Deploy to Hostinger VPS, Run 43609006923](https://github.com/White-Gloss/glanz-buchung-meister/actions/runs/43609006923), Job `deploy` 132489744220 |
| `https://panel.white-gloss.de` | `main`, `372864f4eeaae8dba3da34580a0b9f40e5e27888` | gleicher Commit; Veröffentlichung 15.11.2026, 01:17 UTC | [Panel checks, Run 43662172057](https://github.com/White-Gloss/white-gloss-panel/actions/runs/43662172057), Job `Hostinger panel release` 132654212659 |

Die Repository-Metadaten und `branches/main` wurden über die verbundene GitHub-App frisch gelesen. Beide Defaultbranches sind `main`. Zu Beginn lagen lokal ältere Commits vor (`3047db0` Website, `c428041` Panel); diese waren kein geeigneter Ausgangspunkt für die Implementierung. Der Hauptagent hat beide Arbeitszweige auf die oben genannten aktuellen Stände aktualisiert.

## Tatsächlich geprüfte Release-Belege

### Website

Der erfolgreiche Deployment-Run wurde nicht nur als grüner Gesamtstatus bewertet. Die Jobantwort bestätigt folgende tatsächlich ausgeführte, erfolgreiche Schritte:

- Produktions-Build reproduzieren;
- Release übertragen und privilegierten Helfer verifizieren;
- Freigabe unmittelbar vor Aktivierung erneut prüfen;
- Release atomar aktivieren;
- Live-Smoke-Test;
- Aktive Release-ID bestätigen.

Rollback wurde übersprungen. Die frisch gelesene aktuelle Workflowdatei prüft im letzten Schritt per SSH die aktive Release-ID unter `/srv/white-gloss-current` auf Gleichheit mit dem freigegebenen Commit. Die Joblogs bestätigen den ausgecheckten Stand `38996d2` und die Freigabe dieses Commits. GitHub maskiert einen Teil der vollständigen SHA in den Website-Logs; die vollständige SHA stammt aus der aktuellen Branch- und Runantwort.

Zusätzlich ist [Production Smoke, Run 43648944733](https://github.com/White-Gloss/glanz-buchung-meister/actions/runs/43648944733) am 14.11.2026 um 22:36 UTC erfolgreich. Das ist ein zusätzlicher Erreichbarkeits-/Smoke-Nachweis, kein neuer Deploymentbeleg.

### Panel

Der Job `Hostinger panel release` enthält einen tatsächlich erfolgreichen Schritt `Publish panel on Hostinger VPS and verify HTTPS`.

Exakter Logbeleg, 15.11.2026, 01:17:36.427 UTC:

> Hostinger-Panel veröffentlicht und über HTTPS geprüft: 372864f4eeaae8dba3da34580a0b9f40e5e27888

Das aktuelle `scripts/deploy-hostinger.sh` gibt diese Zeile erst nach Prüfung des aktiven Servercommits, HTTPS-`/healthz`, des Headers `x-panel-commit`, der Anmeldung und der öffentlichen Paneldateien gegen das Releasepaket aus. Der Header wurde durch diesen Releasejob geprüft; ein eigener aktueller Headerabruf aus der Arbeitsumgebung gelang nicht.

## Eigene öffentliche Abrufe und Grenzen

- Die öffentliche Startseite `https://white-gloss.de/` konnte am 15.11.2026 mit dem verbundenen Webwerkzeug gelesen werden. Der Abruf zeigte die aktuelle Fahrzeugaufbereitungsseite mit den Paketen Classic/Signature/Ceramic, dem vorhandenen Hol-/Bringservice und dem Anfrageabschnitt. Ein Textabruf ersetzt keine visuelle Browserprüfung und bestätigt keinen Formularversand.
- Direkte HTTPS-Abrufe aus dieser Arbeitsumgebung scheitern für beide Domains am Netzwerkproxy (`Tunnel connection failed: 403 Forbidden`). Das ist kein nachgewiesener Fehler der Live-Systeme.
- Die Panelstartseite und `/healthz` waren auch über das Webwerkzeug nicht erreichbar. Deshalb wird kein eigener aktueller Panel-Browser-/Headernachweis behauptet.
- Der zu Turnbeginn erfolgreiche `panel_profile`-Abruf bestätigt ausschließlich die read-only-Verbindung und Betreiberrolle. Er beweist weder eine Buchung noch einen Kundenlogin.
- Die Releasebelege gelten für die genannten Zeitpunkte. Eine seitdem manuell am Server vorgenommene, nicht in GitHub sichtbare Änderung lässt sich ohne aktuellen Serverzugang nicht ausschließen.

## Veröffentlichungsvorgabe

Der aktuelle Auftrag erlaubt Implementierung, Tests und Vorbereitung, aber keine produktive Veröffentlichung. Deshalb keine Main-Merges oder Release-Dispatches aus diesem Auftrag. Diese aktuelle Vorgabe hat Vorrang vor älteren Projektfreigaben.

## Spätere Repository-Aktualisierung während dieses Auftrags

Der Website-Hauptbranch wurde zunächst durch PR #346 auf `333487b4f12a01727ace6ec2f36d22c849551b00` und anschließend durch [PR #348](https://github.com/White-Gloss/glanz-buchung-meister/pull/348) auf `3123a86562c2a4b8a4842075bca5d865b1a7091f` fortgeführt. Beide fremden Hauptbranch-Stände sind in den Entwurf integriert; die lokale Git-Abstammungsprüfung für `3123a865` war erfolgreich.

Rein lesende erneute GitHub-Abfrage am 15.11.2026 um 03:26 UTC:

| Quelle | Bestätigter Repositoryzustand |
|---|---|
| [Website `branches/main`](https://api.github.com/repos/White-Gloss/glanz-buchung-meister/branches/main) | `3123a86562c2a4b8a4842075bca5d865b1a7091f` |
| [PR #348](https://github.com/White-Gloss/glanz-buchung-meister/pull/348) | `merged=true`, Merge am 15.11.2026 um 02:02:22 UTC, `merge_commit_sha=3123a86562c2a4b8a4842075bca5d865b1a7091f` |
| [Panel `branches/main`](https://api.github.com/repos/White-Gloss/white-gloss-panel/branches/main) | unverändert `372864f4eeaae8dba3da34580a0b9f40e5e27888` |

Diese Abfrage bestätigt Repositoryzustand und Integration. Sie enthält keinen erneuten Deployment-, Server- oder Live-Funktionsnachweis. Die oben genannten Produktionsbelege bleiben ihrem jeweiligen Zeitpunkt und Commit zugeordnet; aus dem neuen Hauptbranch allein wird kein neuer Live-Stand behauptet. Es wurde keine Veröffentlichung ausgelöst.

## Nachträglich festgestellter Panel-Release — 15.11.2026, Prüfung 05:19 UTC

Die frühere Momentaufnahme von 03:26 UTC bleibt oben erhalten. Die erneute rein lesende Prüfung bestätigt inzwischen Panel-main `14262776e669132a465dd90ec8d74ecd046fc713` und den gemergten [Panel-PR #100](https://github.com/White-Gloss/white-gloss-panel/pull/100).

Tatsächlicher neuer Produktionsbeleg: [Push-Lauf `43675781902`](https://github.com/White-Gloss/white-gloss-panel/actions/runs/43675781902), Job **Hostinger panel release**, ID **132696010875**. Dessen erfolgreicher Veröffentlichungsschritt protokolliert am **15.11.2026 um 04:15:51.892 UTC**:

> Hostinger-Panel veröffentlicht und über HTTPS geprüft: 14262776e669132a465dd90ec8d74ecd046fc713

Der vorherige aktive Panelstand war `372864f4eeaae8dba3da34580a0b9f40e5e27888`. Das Release prüfte aktiven Servercommit, HTTPS, Commitheader und öffentliche Dateien. Ein eigener späterer HTTPS-Abruf aus der Arbeitsumgebung bleibt durch den Netzwerkproxy blockiert. Deshalb ist der konkrete Releasejob der zeitgebundene Livebeleg.

Der veröffentlichte Commit `14262776…` und der geprüfte PR-Head `10972fce488c960662e1d7fcd6e88bdbe57b8c96` besitzen exakt denselben vollständigen Git-Tree `1e13bf9f5858aecbb30cff08aa0b8e1e388e39e1`; der Dateivergleich ist leer.

Website-main ist weiterhin `3123a86562c2a4b8a4842075bca5d865b1a7091f`. [Website-PR #347](https://github.com/White-Gloss/glanz-buchung-meister/pull/347) ist bei der Abfrage offen und ungemergt, inzwischen `draft=false`, `auto_merge=null`. Für diese Websiteänderungen wird kein neuer Livebeleg behauptet.

Die Ready-/Merge-Events melden den GitHub-Account `White-Gloss` und auf Eventebene `performed_via_github_app=null`. Das identifiziert keinen konkreten Menschen oder Client. Ein aktiver Auto-merge-Workflow und sein erfolgreicher Lauf sind belegt; dessen protokollierter Merge-CLI-Schritt beginnt jedoch erst nach dem früher datierten Mergeevent. Die konkrete Verursachung der Statusänderungen bleibt damit unaufgelöst. Der Auftrag enthielt keine Veröffentlichungsfreigabe; aus dem Befund wird keine nachträgliche Erlaubnis abgeleitet. Vollständige Zeitlinie, Actor-Grenzen und Nachweise: [Nachträgliche Veröffentlichung](externe-veroeffentlichung.md).

## Weitere Website-Statusänderung — 15.11.2026, Prüfung 06:33 UTC

Die frühere Website-PR-Momentaufnahme von 05:19 UTC ist überholt: [Website #347](https://github.com/White-Gloss/glanz-buchung-meister/pull/347) wurde laut PR und Timeline am **06:24:39 UTC** unter dem GitHub-Account `White-Gloss` gemergt und geschlossen. Die Commit-Committerzeit ist 06:24:38 UTC. Neuer Website-main ist `ca4fbc77fb9aeda96bc4a6abe9d9d8208ff8c365`. Der konkrete Mensch oder Client hinter dem Merge wird durch `actor=White-Gloss` und Event-App `null` nicht identifiziert; die Attribution bleibt ungeklärt.

Der letzte PR-Head `774f91385996b5ebdfe7818cbe13f00efab620ac` und das Squash-Ergebnis `ca4fbc77…` haben denselben vollständigen Git-Tree `e6cd5f6688e6f442e8250592c4fc1fcbddc580ea`; der Dateivergleich ist leer.

Für ca4 wurde bei der Abschlussabfrage um **06:33:48 UTC** kein Deploymentlauf gefunden. Die Push-CI [43685306512](https://github.com/White-Gloss/glanz-buchung-meister/actions/runs/43685306512) ist erfolgreich; sie beweist keine Veröffentlichung. Der am exakten ca4-Commit frisch gelesene Website-Releaseworkflow reagiert ausschließlich auf manuellen Dispatch. Ein Main-Merge oder eine grüne CI aktiviert diesen Weg nicht automatisch. Produktionsaktivierung, Live-Smoke und produktive Anwendung von `0026_panel_intake.sql` sind für ca4 bislang nicht nachgewiesen. Der erfolgreiche isolierte CI-Schemaaufbau ist kein Produktions-Migrationsbeleg.

Der neueste in dieser Untersuchung tatsächlich geprüfte Website-Releasebeleg betrifft **3123a86562c2a4b8a4842075bca5d865b1a7091f**: [Deploylauf 43666908559](https://github.com/White-Gloss/glanz-buchung-meister/actions/runs/43666908559), Job **132668271603**, am 15.11.2026 mit erfolgreicher Aktivierung um 02:16:24–28 UTC, Live-Smoke um 02:16:28–43 UTC und Bestätigung der aktiven Release-ID um 02:16:43–44 UTC. Das ist ein zeitgebundener Beleg für 3123a865, kein ca4-Live-Nachweis. Eigene HTTPS-Abrufe aus der Arbeitsumgebung bleiben proxybedingt blockiert; eine manuelle Änderung außerhalb der gelesenen Läufe lässt sich nicht ausschließen.

Der danach erstellte [Abschluss-PR #349](https://github.com/White-Gloss/glanz-buchung-meister/pull/349) war bei der Abfrage offen und Draft mit `auto_merge=null`, Head `abf018a2…` und Mergekonflikt. Dynamische Security-/PR-Läufe waren vorhanden, ein regulärer CI-Lauf für diesen Head nicht. Dieser Prüfauftrag hat keine externen Zustände verändert oder Veröffentlichungen ausgelöst. Details und exakte Grenzen: [Nachträgliche Statusänderungen](externe-veroeffentlichung.md).

## Website ca4 tatsächlich veröffentlicht — erneute Prüfung 06:49 UTC

Nach der vorherigen Abfrage um 06:33:48 UTC entstand der manuelle [Deploylauf **43686103851**](https://github.com/White-Gloss/glanz-buchung-meister/actions/runs/43686103851), gestartet am **15.11.2026 um 06:35:04 UTC**, Account `White-Gloss`. Die konkrete Person oder der ausführende Client sind damit nicht identifiziert. Deployjob **132726873016** hat ca4 erfolgreich aktiviert (06:35:58–06:36:04 UTC), den öffentlichen Live-Smoke bestanden (06:36:04–17 UTC) und die aktive Release-ID um **06:36:17 UTC** auf `ca4fbc77fb9aeda96bc4a6abe9d9d8208ff8c365` geprüft. Der vorherige Stand war 3123a865. Der ursprüngliche Rundum-Websiteumfang aus #347 ist damit nun tatsächlich live geprüft; die alte Aussage „kein ca4-Deploybeleg“ gilt ausschließlich für ihre frühere Abfragezeit.

Nachfolgend bestanden auch [Production Smoke 43686205150](https://github.com/White-Gloss/glanz-buchung-meister/actions/runs/43686205150) und [Live Visual Check 43686205167](https://github.com/White-Gloss/glanz-buchung-meister/actions/runs/43686205167). Das sind HTTPS-/Darstellungsprüfungen ohne fachlichen Anfrageversand. Panel-main bleibt nach frischer Abfrage `14262776…`; der dortige Releasebeleg von 04:15:51 UTC bleibt gültig für seinen Zeitpunkt.

Für `0026_panel_intake.sql` ist in Deploy-/Smoke-Logs kein gesonderter Produktions-DDL-Lauf sichtbar. Das erforderliche Manifest und das lesende `_migrations`-Bereitschaftsgate des veröffentlichten Codes liefern zusammen mit erfolgreicher Aktivierung/HTTP 200 einen indirekten Bereitschaftsbeleg. Ein eigenständiges Migrationsausführungsprotokoll oder eine produktive Datenfluss-/Schlüsselinspektion liegt hier weiterhin nicht vor.

Der Website-Abschluss-PR #349 ist bei der neuen Abfrage offen, Draft, `auto_merge=null`, Head `d6256548348f8df7adde62ad97c74d613bdb0362`, konfliktfrei (`mergeable=true`), aber `mergeable_state=unstable`. d625654 und abf018a2 haben denselben Tree `9ed41ef18c66afb809960abd300cb6b11f254d76`. Die eigene CI [43685920916](https://github.com/White-Gloss/glanz-buchung-meister/actions/runs/43685920916) scheiterte im Verify-Job an `GET /api/availability` / `net::ERR_ABORTED` bei 390×844; dessen Consent-/Lighthouseprüfungen wurden nicht abgeschlossen. Die zusätzlichen Abschlusskorrekturen bleiben separat Draft und sind nicht durch den ursprünglichen ca4-Release als veröffentlicht belegt.

Die erfolgreiche ca4-Push-CI [43685306512](https://github.com/White-Gloss/glanz-buchung-meister/actions/runs/43685306512), Verifyjob **132724442552**, hat isoliert Consent-Startup bestanden und Lighthouse mobil **98/98/98**, Desktop **100/100/100** gemessen; übrige Kategorien jeweils 100. Diese Werte gehören exakt zu ca4 und ersetzen keine fehlgeschlagene #349-Prüfung. Vollständige Einzelwerte, Zeiten und Grenzen stehen im [Ereignisbericht](externe-veroeffentlichung.md).

## Abschließender Korrekturstand — nach dem CI-Abschluss am 15.11.2026 um 06:59 UTC

Der zusätzliche Website-Entwurf #349 liegt inzwischen auf `9ff2e377408f8de9554ada976eeb4ebd01ed1ea4`. Die tatsächliche eigene CI [43687237283](https://github.com/White-Gloss/glanz-buchung-meister/actions/runs/43687237283) ist um 06:59 UTC vollständig erfolgreich abgeschlossen: alle vier Jobs grün, 919 Haupttests, SEO 9/9, native Consent-/Browser-/Lighthouse-/Hero-Suiten bestanden. Gegenüber d625 änderten sich ausschließlich sieben QA-Zeilen zum Abschluss laufender Leseanfragen vor Testnavigationen. Der Produktcode blieb identisch. Mobil-Lighthouse 98/98/98, Desktop 100/100/100 sind jetzt eigene Werte dieses Abschlussstands; [vollständiger Nachweis](website-ci-review.md). Dieser Entwurf wurde nicht produktiv veröffentlicht. Die externen ca4-/142-Releasebelege oben bleiben davon getrennt. Nachfolgende Abschlussdokumentation ändert keinen Laufzeitcode.
