# CI per act auf dem Hostinger-VPS

Betreiberentscheidung vom 17.11.2026: Die GitHub-Runner starten wegen einer
Kontosperre (Abrechnung) keine Jobs. Die CI-Workflows laufen deshalb per
[`act`](https://github.com/nektos/act) in Docker auf dem Produktions-VPS.

## Risiko (bewusst akzeptiert)
- Der Benutzer `wg-ci` ist in der Gruppe `docker` und hat damit faktisch
  root-Rechte. Nur eigene, geprüfte Commits laufen lassen, keine fremden PRs.
- Die Jobs laufen im eigenen Bridge-Netz `wg-ci-net` (keine Ports von Website
  oder Panel belegt) und ohne Docker-Socket.
- Läuft auf demselben Server wie Website und Panel: möglichst außerhalb der
  Geschäftszeiten starten.

## Einmalig einrichten (root, Webkonsole)
```bash
curl -fsSLO https://raw.githubusercontent.com/White-Gloss/glanz-buchung-meister/<COMMIT>/scripts/ci-vps/setup.sh
bash setup.sh
```
`setup.sh` installiert act v0.2.97 nur nach Prüfsummenvergleich.

## Einen Commit prüfen
```bash
sudo -u wg-ci -H bash -c 'curl -fsSLO https://raw.githubusercontent.com/White-Gloss/glanz-buchung-meister/<COMMIT>/scripts/ci-vps/run-ci.sh && bash run-ci.sh <COMMIT>'
```
Geprüft werden `verify`, `studio` und `cross-browser`. `schema`
(Datenbankmigrationen) läuft unter act nicht zuverlässig und ist nicht enthalten.

## Zurück zu GitHub
Sobald die Kontosperre aufgehoben ist, wieder die GitHub-CI nutzen. Die
Ausnahme in `AGENTS.md` und `scripts/hosting-policy.mjs` kann dann entfernt werden.
