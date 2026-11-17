#!/usr/bin/env bash
# CI eines Commits per act auf dem VPS prüfen (als Benutzer wg-ci ausführen).
# Aufruf: bash run-ci.sh <40-stellige Commit-ID>
# Läuft: verify (Lint, Typen, Tests, Inhaltsschutz, Build, isolierte Browserabläufe),
# studio und cross-browser. Nicht enthalten: schema (Datenbankmigrationen).
set -Eeuo pipefail

SHA="${1:-}"
[[ "$SHA" =~ ^[0-9a-f]{40}$ ]] || { echo "Bitte eine 40-stellige Commit-ID angeben." >&2; exit 2; }
[[ "$(id -un)" == "wg-ci" ]] || { echo "Bitte als Benutzer wg-ci ausführen." >&2; exit 2; }

RUN_DIR="$HOME/runs/$SHA"
IMAGE="catthehacker/ubuntu:act-24.04-20261111"
rm -rf -- "$RUN_DIR"
git clone --quiet --filter=blob:none https://github.com/White-Gloss/glanz-buchung-meister "$RUN_DIR"
cd "$RUN_DIR"
git checkout --quiet -B ci-run "$SHA"

status=0
for job in verify studio cross-browser; do
  echo "== Job $job"
  if act push \
      -W .github/workflows/ci.yml \
      -j "$job" \
      -P "ubuntu-latest=$IMAGE" \
      --network wg-ci-net \
      --container-daemon-socket - \
      --env WG_CI_RUNNER=white-gloss-vps-act \
      --artifact-server-path "$RUN_DIR/.act-artifacts" \
      --rm; then
    echo "== $job: BESTANDEN"
  else
    echo "== $job: FEHLGESCHLAGEN"
    status=1
  fi
done
if [[ "$status" -eq 0 ]]; then echo "== ERGEBNIS: alle Jobs bestanden ($SHA)"; else echo "== ERGEBNIS: mindestens ein Job fehlgeschlagen ($SHA)"; fi
exit "$status"
