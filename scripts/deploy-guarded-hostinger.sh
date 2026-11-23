#!/usr/bin/env bash
set -Eeuo pipefail
set +x
umask 077

die() { printf '%s\n' "$*" >&2; exit 1; }
[[ $# == 1 ]] || die 'CI-Anbieter fehlt.'
case "$1" in
  gitlab)
    readonly RELEASE_ID="${CI_COMMIT_SHA:?GitLab-Commit fehlt}"
    readonly PROJECT_DIR="${CI_PROJECT_DIR:?GitLab-Arbeitsverzeichnis fehlt}"
    verify_approval() { node scripts/deployment-approval-gitlab.mjs; }
    ;;
  github)
    readonly RELEASE_ID="${RELEASE_ID:?GitHub-Commit fehlt}"
    readonly PROJECT_DIR="${GITHUB_WORKSPACE:?GitHub-Arbeitsverzeichnis fehlt}"
    [[ ${GITHUB_EVENT_NAME:-} == workflow_run ]] || die 'Ein abgeschlossener CI-Lauf wird benötigt.'
    verify_approval() { node scripts/deployment-approval.mjs; }
    ;;
  *) die 'Unbekannter CI-Anbieter.' ;;
esac
verify_approval
[[ $(git -c safe.directory="$PROJECT_DIR" rev-parse HEAD) == "$RELEASE_ID" ]] || die 'Unerwarteter ausgecheckter Commit.'
[[ ${HOSTINGER_SSH_USER:-} == white-gloss-ci && ${HOSTINGER_SSH_HOST:-} =~ ^[a-zA-Z0-9][a-zA-Z0-9.:-]*$ ]] ||
  die 'Hostinger-Host oder Website-Deploykonto fehlt.'
port=${HOSTINGER_SSH_PORT:-22}
[[ $port =~ ^[0-9]{1,5}$ ]] && (( 10#$port > 0 && 10#$port <= 65535 )) || die 'Ungültiger SSH-Port.'
for file in "${HOSTINGER_SSH_PRIVATE_KEY:-}" "${HOSTINGER_SSH_KNOWN_HOSTS:-}"; do
  [[ -f "$file" && ! -L "$file" && -s "$file" && -O "$file" ]] ||
    die 'SSH-Schlüssel und known_hosts werden als geschützte Dateien benötigt.'
  chmod 600 -- "$file"
done
private=$(mktemp -d)
build=''
uploaded=false
connected=false
archive_sha=""
previous=''
activation_pending=false
cleanup() {
  local status=$?
  trap - EXIT
  if $activation_pending; then
    status=1
    recover || printf '%s\n' 'Wiederherstellung konnte nicht bestätigt werden.' >&2
  fi
  if $uploaded; then remote "discard $RELEASE_ID $archive_sha" || true; fi
  if $connected; then ssh -F "$private/config" -O exit production >/dev/null 2>&1 || true; fi
  rm -rf -- "$private"
  if [[ -n $build ]]; then rm -rf -- "$build"; fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
install -m 600 "$HOSTINGER_SSH_PRIVATE_KEY" "$private/key"
install -m 600 "$HOSTINGER_SSH_KNOWN_HOSTS" "$private/known_hosts"
cat >"$private/config" <<SSH
Host production
  HostName $HOSTINGER_SSH_HOST
  User white-gloss-ci
  Port $port
  IdentityFile $private/key
  IdentitiesOnly yes
  BatchMode yes
  StrictHostKeyChecking yes
  UserKnownHostsFile $private/known_hosts
  GlobalKnownHostsFile /dev/null
  ConnectTimeout 15
  ServerAliveInterval 15
  ServerAliveCountMax 4
  ControlMaster auto
  ControlPath $private/socket
  ControlPersist 10m
SSH
remote() { ssh -F "$private/config" production "$@"; }
ssh -F "$private/config" -MNf production
connected=true
active_release() {
  local current
  current=$(remote active) || return 1
  [[ $current =~ ^[0-9a-f]{40}$ ]] || { printf '%s\n' 'Hostinger meldet keine gültige aktive Version.' >&2; return 1; }
  printf '%s\n' "$current"
}
smoke() {
  SMOKE_BASE_URL=https://white-gloss.de SMOKE_PUBLIC_ORIGIN=https://white-gloss.de SMOKE_TIMEOUT_MS=15000 \
    node scripts/smoke-production.mjs
}
recover() {
  local current
  current=$(active_release) || return 1
  if [[ $current == "$RELEASE_ID" ]]; then
    remote "rollback $previous $RELEASE_ID" || return 1
    current=$(active_release) || return 1
    [[ $current == "$previous" ]] || return 1
    smoke || return 1
    printf 'Vorgänger %s wiederhergestellt und live geprüft.\n' "$previous" >&2
  else
    printf 'Aktiver Hostinger-Stand nach fehlgeschlagener Aktivierung: %s\n' "$current" >&2
  fi
}
match_file() {
  local expected actual
  expected=$(sha256sum "$1")
  actual=$(remote "$2")
  [[ ${expected%% *} == "$actual" ]] || die "Prüfsumme für $1 stimmt nicht."
}
match_file scripts/deploy-ionos-release.sh helper-sha
match_file ops/white-gloss.service unit-sha
previous=$(active_release)
remote "can-rollback $previous"
if [[ $previous == "$RELEASE_ID" ]]; then
  verify_approval
  smoke
  [[ $(active_release) == "$RELEASE_ID" ]] || die 'Der aktive Stand hat sich während der Liveprüfung geändert.'
  printf 'Website-Release %s war bereits aktiv und ist live geprüft.\n' "$RELEASE_ID"
  exit 0
fi

archive="$private/release.tgz"
if [[ -n ${GOOGLE_CLIENT_ID:-} || -n ${GOOGLE_CLIENT_SECRET:-} ]]; then
  [[ -n ${GOOGLE_CLIENT_ID:-} && -n ${GOOGLE_CLIENT_SECRET:-} ]] || die 'Unvollständige Google-OAuth-Konfiguration.'
  # Match the legacy production build without exposing SSH/API credentials to npm.
  # The root-only checkout, private file variables and transfer directory are outside the build tree.
  [[ $EUID == 0 ]] || die 'Der geschützte Build benötigt den Standardbenutzer des Node-Containers.'
  chmod go-rwx -- "$PROJECT_DIR"
  build=$(mktemp -d)
  chown node:node "$build"
  git -c safe.directory="$PROJECT_DIR" archive --format=tar HEAD | runuser -u node -- tar -xf - -C "$build"
  (
    cd /
    printf '%s\0%s\0' "$GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_SECRET" |
      env -i PATH=/usr/local/bin:/usr/sbin:/usr/bin:/bin HOME="$build" runuser -u node --preserve-environment -- bash -eu -c '
        cd "$1"
        IFS= read -r -d "" GOOGLE_CLIENT_ID
        IFS= read -r -d "" GOOGLE_CLIENT_SECRET
        npm ci --ignore-scripts
        export GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET
        npm run build
        test -s .output/server/index.mjs
        printf "white-gloss-booking-workflow=1\n" | cmp - .output/booking-workflow.contract
      ' bash "$build"
    runuser -u node -- tar -czf - -C "$build" .output >"$archive"
  )
else
  # Reuse the verified artifact only for an explicitly selected credential source.
  # "disabled" permits no embedded pair; it never changes the server environment
  # or disables a provider configured there. Partial CI pairs still fail above.
  case ${HOSTINGER_GOOGLE_OAUTH_SOURCE:-} in
    runtime|disabled) ;;
    *) die 'Geschütztes OAuth-Buildpaar fehlt. Für bestätigte Laufzeitvariablen HOSTINGER_GOOGLE_OAUTH_SOURCE=runtime setzen; ohne benötigtes eingebettetes Google-OAuth-Paar ausdrücklich disabled wählen.' ;;
  esac
  sha256sum -c website-release.tgz.sha256
  cp -- website-release.tgz "$archive"
fi

archive_sha=$(sha256sum "$archive")
archive_sha=${archive_sha%% *}
uploaded=true
received=$(remote "upload $RELEASE_ID $archive_sha" <"$archive")
[[ $received == "$archive_sha" ]] || die 'Der Server hat den Upload nicht bestätigt.'
match_file "$archive" "archive-sha $RELEASE_ID"
verify_approval
# This compare-and-swap and its rollback are checked under the server release lock.
# If SSH drops after the switch, cleanup re-reads the pointer before attempting recovery.
activation_pending=true
receipt=$(remote "activate $RELEASE_ID $previous $archive_sha")
[[ $receipt == "$previous" ]] || die 'Hostinger hat den erwarteten Vorgänger nicht bestätigt.'
smoke
[[ $(active_release) == "$RELEASE_ID" ]] || die 'Der aktive Stand hat sich während der Liveprüfung geändert.'
activation_pending=false
printf 'Website-Release %s live geprüft.\n' "$RELEASE_ID"
