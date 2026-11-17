#!/usr/bin/env bash
# CI eines Commits per act auf dem VPS prüfen (als Benutzer wg-ci ausführen).
# Aufruf: bash run-ci.sh <40-stellige Commit-ID> [verify studio cross-browser]
# Läuft: verify (Lint, Typen, Tests, Inhaltsschutz, Build, isolierte Browserabläufe),
# studio und cross-browser. Nicht enthalten: schema (Datenbankmigrationen).
set -Eeuo pipefail

SHA="${1:-}"
[[ "$SHA" =~ ^[0-9a-f]{40}$ ]] || { echo "Bitte eine 40-stellige Commit-ID angeben." >&2; exit 2; }
shift
JOBS=("$@")
[[ "${#JOBS[@]}" -gt 0 ]] || JOBS=(verify studio cross-browser)
for job in "${JOBS[@]}"; do
  [[ "$job" =~ ^(verify|studio|cross-browser)$ ]] || { echo "Unbekannter Job: $job" >&2; exit 2; }
done
[[ "$(id -un)" == "wg-ci" ]] || { echo "Bitte als Benutzer wg-ci ausführen." >&2; exit 2; }

RUN_DIR="$HOME/runs/$SHA-$(date +%Y%m%d-%H%M%S)"
IMAGE="catthehacker/ubuntu:act-24.04-20261111"
rm -rf -- "$RUN_DIR"
git clone --quiet --filter=blob:none https://github.com/White-Gloss/glanz-buchung-meister "$RUN_DIR"
cd "$RUN_DIR"
git checkout --quiet -B ci-run "$SHA"

# act liest `container: ${{ fromJSON(...) }}` als Abbildnamen (pkg/model/workflow.go)
# und bricht mit "invalid reference format" ab. Nur in dieser Wegwerf-Kopie wird
# der Ausdruck in die gleichwertige direkte Angabe umgeschrieben; für ein
# push-Ereignis ohne CI_RUNS_ON wählt GitHub genau dieses Abbild mit diesen Optionen.
sed -E -i 's#^(    )container: \$\{\{ fromJSON\(.*"image":"([^"]+)","options":"([^"]+)".*$#\1container:\n\1  image: \2\n\1  options: \3#' .github/workflows/ci.yml
if grep -q 'container: \${{ fromJSON' .github/workflows/ci.yml; then
  echo "Container-Ausdruck konnte nicht umgeschrieben werden." >&2; exit 1
fi
# Ohne Docker-Socket verbietet act `--ipc=host` (würde den IPC-Bereich des
# Produktionsservers teilen). Chromium braucht nur genug /dev/shm: gleichwertig
# und isoliert über --shm-size, ebenfalls nur in dieser Kopie.
sed -i 's#^\( *\)options: --ipc=host$#\1options: --shm-size=2g#' .github/workflows/ci.yml
if grep -q -- '--ipc=host' .github/workflows/ci.yml; then
  echo "--ipc=host konnte nicht ersetzt werden." >&2; exit 1
fi

status=0
for job in "${JOBS[@]}"; do
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
