# Aktuelle Live-Zuordnung — geprüft am 15.11.2026 (UTC)

## Ergebnis

Die beiden genannten Repositories versorgen nach aktuellem GitHub-Release-Nachweis die jeweiligen Live-Systeme. Historische Gesprächsangaben wurden nicht als Beleg verwendet.

| System | Aktueller GitHub-Defaultbranch | Nachgewiesener Produktionsstand | Nachweis |
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
