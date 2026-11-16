# Gezielter Standards-Review: Leseanfragen vor QA-Navigation

Basis: `d6256548348f8df7adde62ad97c74d613bdb0362`; geprüft der eingefrorene Arbeitsbaum-Diff ausschließlich in `scripts/qa/rundum-ui.mjs` (+7 Zeilen). Keine Quellen-, Ref-, Status- oder Veröffentlichungsaktion; keine lokale Browser-/Serverausführung.

**Kein belegter Blocker; keine Absenkung der Fehlergates.** Die zwei zusätzlichen `reads.complete(..., { timeoutMs: 5000 })` stehen vor dem clientseitigen Wechsel nach `/preise` und vor der anschließenden direkten Hash-Navigation (`rundum-ui.mjs:250–251,257–258`). Sie warten auf bereits begonnene echte Leseanfragen, bevor der Test deren Komponenten bzw. Dokument verlässt. Beide Wartevorgänge sind begrenzt, haben keinen Catch und können den Test weiterhin fehlschlagen lassen. Keine Request-Interception, zusätzliche Antwortsimulation oder pauschale `ERR_ABORTED`-Ausnahme wurde eingeführt.

Der unveränderte Tracker (`scripts/qa/read-completion.mjs:19–30,33–69`) verlangt für beobachtete Anfragen HTTP200 und den abgeschlossenen Response; Timeout, fehlende Antwort und Übertragungsfehler propagieren. Ein zuvor fehlgeschlagener Request wird durch diese Ergänzung nicht nachträglich erfolgreich. Die unabhängige Browserdiagnostik erfasst weiterhin echte `requestfailed`-Ereignisse und HTTP-Fehler (`scripts/browser-diagnostics.mjs:57–66`); `scripts/qa/check-booking-ui.mjs:471` prüft sie abschließend fatal. Vorhandene UI-Fristen, Bounds und Assertions bleiben unverändert.

Die neuen Phasenlogs geben ausschließlich Label, Pfad ohne Query, Status, Abschluss und Anzahl ausstehender Reads aus; keine Formularwerte, Zugangsdaten oder Tokens. Sie ermöglichen den zeitlichen Nachweis, der im früheren Fehlerrun fehlte.

Bestätigter Codezusammenhang: Configurator startet den Verfügbarkeits-GET und ruft beim Unmount `controller.abort()` auf (`src/components/configurator.tsx:134,159–165`). Dass genau dieser Lebenszyklus den beobachteten `GET /api/availability ERR_ABORTED` im Run43685920916 verursachte, bleibt bis zum neuen CI-Lauf eine begründete Hypothese. Der Fix verhindert keine später neu gestartete Anfrage; deren etwaiger Fehler bleibt sichtbar und fatal.

Die gemeldeten17/17 Offline-Helper-/Diagnostiktests wurden im Rahmen dieses Reviews nicht erneut ausgeführt. Der tatsächliche Navigationserfolg ist noch nativ zu belegen.

## Nativer Abnahmenachtrag vom 15.11.2026 (UTC)

Der geprüfte Fix ist im finalen Head `9ff2e377408f8de9554ada976eeb4ebd01ed1ea4` enthalten. Der unabhängig gelesene [Verify-Job132730156109 in CI43687237283](https://github.com/White-Gloss/glanz-buchung-meister/actions/runs/43687237283/job/132730156109) meldet `QA: booking-ui passed` um06:56:53UTC und den gesamten isolierten Ablauf um06:58:52UTC als bestanden. `verifyRundumIntentLoading()` wird in diesem Prüflauf ausgeführt, und die unveränderte abschließende Browserdiagnostik bleibt fatal. Die Navigationen sind damit im neuen nativen Lauf erfolgreich geprüft. Die konkreten `RUNDUM-NAV-READS`-Snapshots liegen nur im Artefakt; wegen Download403 wurden sie hier nicht gelesen. Insbesondere wird nicht behauptet, welche einzelne Anfrage in welchem Wartepunkt abgeschlossen wurde. Die genaue Ursache des historischen Abbruchs bleibt eine Hypothese; der neue Lauf meldet ihn nicht erneut.
