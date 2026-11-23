#!/usr/bin/env bash
set -Eeuo pipefail
set +x
umask 077

die() { printf '%s\n' "$*" >&2; exit 1; }
[[ $# == 2 ]] || die 'Release und erwarteter aktueller Stand fehlen.'
export RELEASE_ID="$1" EXPECTED_CURRENT_RELEASE="$2"
verify_approval() { node scripts/deployment-approval-gitlab.mjs; }
verify_approval
[[ $(git rev-parse HEAD) == "$RELEASE_ID" ]] || die 'Unerwarteter ausgecheckter Commit.'
[[ ${HOSTINGER_SSH_USER:-} == white-gloss-ci && ${HOSTINGER_SSH_HOST:-} =~ ^[a-zA-Z0-9][a-zA-Z0-9.:-]*$ ]] ||
  die 'Hostinger-Host oder Website-Deploykonto fehlt.'
port=${HOSTINGER_SSH_PORT:-22}
[[ $port =~ ^[0-9]{1,5}$ ]] && (( 10#$port > 0 && 10#$port <= 65535 )) || die 'Ungültiger SSH-Port.'
for file in "${HOSTINGER_SSH_PRIVATE_KEY:-}" "${HOSTINGER_SSH_KNOWN_HOSTS:-}"; do
  [[ -f "$file" && ! -L "$file" && -s "$file" && -O "$file" ]] ||
    die 'SSH-Schlüssel und known_hosts werden als geschützte GitLab-Dateivariablen benötigt.'
  chmod 600 -- "$file"
done
private=$(mktemp -d)
build=''
uploaded=false
connected=false
remote_archive="/home/white-gloss-ci/incoming/$RELEASE_ID.tgz"
cleanup() {
  if $uploaded; then remote "rm -f '$remote_archive'" || true; fi
  if $connected; then ssh -F "$private/config" -O exit production >/dev/null 2>&1 || true; fi
  rm -rf -- "$private"
  if [[ -n $build ]]; then rm -rf -- "$build"; fi
}
trap cleanup EXIT
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
archive="$private/release.tgz"
if [[ -n ${GOOGLE_CLIENT_ID:-} || -n ${GOOGLE_CLIENT_SECRET:-} ]]; then
  [[ -n ${GOOGLE_CLIENT_ID:-} && -n ${GOOGLE_CLIENT_SECRET:-} ]] || die 'Unvollständige Google-OAuth-Konfiguration.'
  # Match the legacy production build without exposing SSH/API credentials to npm.
  # The root-only checkout, private file variables and transfer directory are outside the build tree.
  [[ $EUID == 0 ]] || die 'Der geschützte Build benötigt den Standardbenutzer des Node-Containers.'
  chmod go-rwx -- "$CI_PROJECT_DIR"
  build=$(mktemp -d)
  chown node:node "$build"
  git archive --format=tar HEAD | runuser -u node -- tar -xf - -C "$build"
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
  # Existing production may rely on the embedded server-side secret. The operator can
  # explicitly select a previously verified runtime configuration in that case.
  [[ ${HOSTINGER_GOOGLE_OAUTH_SOURCE:-} == runtime ]] ||
    die 'Geschütztes OAuth-Buildpaar fehlt. Für bestätigte Laufzeitvariablen HOSTINGER_GOOGLE_OAUTH_SOURCE=runtime setzen.'
  sha256sum -c website-release.tgz.sha256
  cp -- website-release.tgz "$archive"
fi

ssh -F "$private/config" -MNf production
connected=true
active_release() { remote 'basename "$(readlink -f /srv/white-gloss-current)"'; }
match_file() {
  local expected actual
  expected=$(sha256sum "$1")
  actual=$(remote "sha256sum '$2'")
  [[ ${expected%% *} == "${actual%% *}" ]] || die "Prüfsumme für $2 stimmt nicht."
}
match_file scripts/deploy-ionos-release.sh /usr/local/sbin/white-gloss-deploy
match_file ops/white-gloss.service /etc/systemd/system/white-gloss.service
[[ $(active_release) == "$EXPECTED_CURRENT_RELEASE" ]] || die 'Der aktive Produktionsstand hat sich geändert.'
remote 'test -s /srv/white-gloss-current/.output/server/index.mjs && printf "white-gloss-booking-workflow=1\n" | cmp - /srv/white-gloss-current/.output/booking-workflow.contract'
uploaded=true
scp -F "$private/config" "$archive" "production:$remote_archive"
match_file "$archive" "$remote_archive"
archive_sha=$(sha256sum "$archive")
verify_approval
smoke() {
  SMOKE_BASE_URL=https://white-gloss.de SMOKE_PUBLIC_ORIGIN=https://white-gloss.de SMOKE_TIMEOUT_MS=15000 \
    node scripts/smoke-production.mjs
}
# The server enforces the predecessor and digest under its release lock. If the
# transport drops after activation, re-read the live pointer before recovery.
previous=''
if previous=$(remote "sudo -n /usr/local/sbin/white-gloss-deploy activate $RELEASE_ID $remote_archive $EXPECTED_CURRENT_RELEASE ${archive_sha%% *}") &&
    [[ $previous == "$EXPECTED_CURRENT_RELEASE" ]] && smoke && [[ $(active_release) == "$RELEASE_ID" ]]; then
  printf 'Website-Release %s live geprüft.\n' "$RELEASE_ID"
  exit 0
fi
if [[ $(active_release) == "$RELEASE_ID" ]]; then
  remote "sudo -n /usr/local/sbin/white-gloss-deploy rollback $EXPECTED_CURRENT_RELEASE $RELEASE_ID"
  smoke
  die 'Die Liveprüfung schlug fehl. Der freigegebene Vorgänger wurde wieder aktiviert.'
fi
die 'Aktivierung fehlgeschlagen. Aktiven Stand vor einem erneuten Versuch prüfen.'
