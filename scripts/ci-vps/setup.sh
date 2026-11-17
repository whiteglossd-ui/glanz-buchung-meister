#!/usr/bin/env bash
# Einmalige Einrichtung von `act` auf dem Hostinger-VPS (als root ausführen).
# Betreiberentscheidung vom 17.11.2026: Die CI läuft per act in Docker auf dem
# Produktions-VPS, weil die GitHub-Runner wegen einer Kontosperre nicht starten.
# Dieses Skript ändert keine Website-, Panel- oder Datenbankdateien.
set -Eeuo pipefail

ACT_VERSION="v0.2.97"
ACT_SHA256="67b4976a56f33ea7870b798912e738ec44eef38e7578ae7b532f2def1c73a5ad"
CI_USER="wg-ci"
CI_NETWORK="wg-ci-net"

[[ "${EUID}" -eq 0 ]] || { echo "Bitte als root ausführen." >&2; exit 1; }
command -v docker >/dev/null || { echo "Docker fehlt auf diesem Server." >&2; exit 1; }
docker info >/dev/null || { echo "Docker-Dienst antwortet nicht." >&2; exit 1; }

tmp="$(mktemp -d)"
trap 'rm -rf -- "$tmp"' EXIT
curl -fsSLo "$tmp/act.tgz" \
  "https://github.com/nektos/act/releases/download/${ACT_VERSION}/act_Linux_x86_64.tar.gz"
echo "${ACT_SHA256}  $tmp/act.tgz" | sha256sum -c -
tar -xzf "$tmp/act.tgz" -C "$tmp" act
install -o root -g root -m 0755 "$tmp/act" /usr/local/bin/act
/usr/local/bin/act --version

# Eigener Benutzer ohne sudo. Achtung: Mitglied der Gruppe docker hat faktisch
# root-Rechte auf diesem Server. Nur eigene, freigegebene Commits prüfen.
id "$CI_USER" >/dev/null 2>&1 || useradd --create-home --shell /bin/bash "$CI_USER"
usermod -aG docker "$CI_USER"
install -d -o "$CI_USER" -g "$CI_USER" -m 0750 "/home/$CI_USER/runs"

# Eigenes Bridge-Netz: Testserver belegen keine Ports von Website oder Panel.
docker network inspect "$CI_NETWORK" >/dev/null 2>&1 || docker network create "$CI_NETWORK" >/dev/null
echo "Einrichtung abgeschlossen: act ${ACT_VERSION}, Benutzer ${CI_USER}, Netz ${CI_NETWORK}."
