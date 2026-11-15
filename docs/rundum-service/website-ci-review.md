# Website: abschließender echter CI- und Bildnachweis

Geprüfter Head: `9ff2e377408f8de9554ada976eeb4ebd01ed1ea4`, Draft-PR [349](https://github.com/White-Gloss/glanz-buchung-meister/pull/349).
Run: https://github.com/White-Gloss/glanz-buchung-meister/actions/runs/43687237283 (#984).
Verify: `132730156109`, erfolgreich abgeschlossen am 15.11.2026 um 06:58:59 UTC. Alle vier CI-Jobs erfolgreich.

## Tatsächlich bestanden

- 919/919 Unit-/Integrationstests, keine Fehler oder Skips; separates SEO-Gate 9/9; Inhaltsguard, Anwendungs-/Edge-Typen, Lint, Produktionsabhängigkeitsprüfung und Produktionsbuild.
- Schema `132730156146`, Studio `132730155936`, Firefox/WebKit-Crossbrowser `132730156156` erfolgreich.
- Isolierte SSR-, Flow-, Sitemap-, SEO-, Responsive-, Booking-UI-, Recovery-, Consent-Startup-, Lighthouse- und Hero-Suite erfolgreich.
- Responsive-Suite in 187,632 s. Der geprüfte Quellstand enthält alle 40 wiederholten Header-/Hero-Aktivierungen über acht reduzierte Breiten und die zwei zusätzlichen Bewegungsfälle; individuelle 10-s-Fristen, echte Wheel-/Fokus-/Boundschecks, gleicher Hash und Entwurfsschutz unverändert.
- Booking-UI passiert nun auch die finale harte Browserdiagnostik. Der vorherige Kalender-Abbruch trat in diesem neuen Lauf nicht als Fehler auf. Der einzige Sourceunterschied gegenüber `d625654` sind zwei begrenzte ReadCompletion-Waits vor tatsächlichen Seitenwechseln; keine Laufzeitänderung und keine Ausnahme für Netzwerk-/HTTP-/Abortfehler.

## Native Lighthousewerte

Lighthouse 12.6.1, drei gültige Mobil- und drei Desktopproben, echter isolierter HTTP/2-Transport. Unverändertes Mindestgate: mobil Median ≥98, Desktop ≥99,5. Ergebnis mobil 98/98/98, Desktop 100/100/100. Accessibility, Best Practices und SEO in allen sechs Proben 100.

| Probe | Performance | FCP ms | LCP ms | TBT ms | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Mobil 1 | 98 | 1275,575 | 2270,575 | 3,5 | 0 |
| Mobil 2 | 98 | 1280,033 | 2260,033 | 3,5 | 0 |
| Mobil 3 | 98 | 1268,431 | 2259,431 | 1 | 0 |
| Desktop 1 | 100 | 348,299 | 529,299 | 0 | 0 |
| Desktop 2 | 100 | 343,888 | 523,888 | 0 | 0 |
| Desktop 3 | 100 | 347,758 | 524,758 | 0 | 0 |

Die direkt gelesenen nativen Icon-/CDP-Zeilen belegen in allen sechs Proben RawWireCount 2: genau einen vollen PNG-Payload und eine echte 304-Revalidierung mit passenden Validatoren und null Bodybytes; keine unklassifizierten Exchanges. Der Iconinhalt bleibt 14984 Bytes, SHA256 `73ec795e41e36843ecebba7edb10b69f303c139ddd27571fa2e3bd07ff69d42a`. Frühe Parserentdeckung ist belegt. Ein einziger Request oder Nulltransfer wird ausdrücklich nicht behauptet.

Sicherer tatsächlicher Score-/CDP-/Lantern- und Phasenlog:
`/workspace/website-9ff2e37-performance.log`.

## Detailnachweise und genaue Lesbarkeitsgrenze

Die tatsächlich bestandene Consent-Startup-Suite führt ihren NoJS-Fall immer aus. Der geprüfte Quellstand verwendet einen echten Kontext mit `javaScriptEnabled:false` und harten Assertions für passenden CSP-Nonce, vorhandenen aber verborgenen initialen SSR-Banner, nicht ausgeführtes Inline-JavaScript, nativen `#rundum-anfrage`-Anker, sichtbaren Telefonfallback unter dem Header, unsichtbaren Ladeplatzhalter und keine externen Abrufversuche. Das ist durch gelesenen Testcode plus erfolgreichen echten Prozess belegt.

Die Rohzeilen aus `consent-startup/results.json`, `booking-ui.log` (einschließlich `RUNDUM-NAV-READS`) und die STYLE-/ROUTE-/LOGO-Captures schreibt der Runner nur ins hochgeladene Artefakt. Sie werden im erfolgreichen Jobstdout nicht weitergeleitet. Der ZIP-Download scheitert hier weiterhin mit Tunnel-403. Deshalb werden keine angeblich direkt gelesenen NoJS-/Navigation-/Asset-Snapshots erfunden. Der tatsächliche Suiteerfolg mit unveränderten fatalen Assertions ist bestätigt; konkrete Rohdaten sind für Reviewer im Artefakt verfügbar.

## Bildbelege

Zwölf tatsächliche JPEGs aus genau diesem Lauf vollständig dekodiert und SHA256-geprüft:
`/workspace/screenshots/website-9ff2e37/manifest.json`.

Zehn Bilder sind byteidentisch zu bereits tatsächlich geöffneten d625-Voransichten. Die beiden abweichenden Formansichten 1024/1440 px wurden erneut geöffnet; zusätzlich wurden die aktuelle 320-px-Form und der 390-px-Hero mit Consent erneut geöffnet. Kicker, vollständige Überschrift, alle Felder und Hinweise bis zum Absenden sind lesbar; kein fixer Navigationsrand im Formclip, kein Textclipping oder horizontaler Überlauf. Der Rundum-Herolink bleibt oberhalb des Consentbanners frei.

Belegt sind Hero 390/1440 mit/ohne Consent und Intro/Formular 320/768/1024/1440. Die 320-px-Formularvorschau ist wegen der kompakten Ausgabe 234×1500 px; originale PNGs sind unverkleinert im tatsächlich bestätigten Upload:

https://github.com/White-Gloss/glanz-buchung-meister/actions/runs/43687237283/artifacts/14151505256

Artefakt `14151505256`, `isolated-qa-results`, 36287270 Bytes. Es enthält auch vollständige LHRs, JSONs, Detail- und Browserlogs. Kompakte Bilder wurden aus den tatsächlichen Exportlogs rekonstruiert.

## Grenzen und externe Zustände

Nur Linux-GitHub-Browseremulation, keine echten Geräte und kein lokaler Website-Server. Keine produktiven Kundenanfragen, Nachrichten oder Uploads. Website-Sink synthetisch; gemeinsamer Intakevertrag und Panelsicherheit separat geprüft. Der eigenständige Lighthouse-Audit misst die Live-Website und ersetzt das isolierte PR-Gate nicht. Der separate Main-Lauf ist kein Nachweis für diesen PR; die oben genannten sechs Proben stammen tatsächlich aus dessen eigenem CI.

Website-PR347 wurde extern als `ca4fbc77fb9aeda96bc4a6abe9d9d8208ff8c365` auf Main zusammengeführt (GitHub-Commitzeit 2026-11-15 06:24:38 UTC, Actor White-Gloss). Panel-PR100 wurde ebenfalls extern zusammengeführt. Die jeweiligen Release-/Live-Fakten prüft der zuständige Provenance-Agent gesondert; ein Merge allein beweist keinen Livezustand. Dieser Monitoringagent hat keine PR-Status-, Merge-, Ref-, Dispatch- oder Releaseaktion vorgenommen. Für den geprüften Stand sind keine fehlgeschlagenen CI-Gates mehr offen; dies ist keine Veröffentlichungsfreigabe.
