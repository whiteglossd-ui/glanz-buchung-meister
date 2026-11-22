#!/usr/bin/env bash
# Installiert die beiden White-Gloss-CI-Runner auf srv2077393.
set +x
set -Eeuo pipefail
umask 077
fail() { printf 'ABBRUCH – %s\n' "$*" >&2; exit 1; }
trap 'printf "FEHLER – Zeile %s. Die Meldung darüber zeigt die Ursache.\n" "$LINENO" >&2' ERR

[[ $EUID == 0 ]] || fail 'Bitte in der Hostinger-Webkonsole als root ausführen.'
[[ "$(hostname -s)" == srv2077393 && "$(uname -m)" == x86_64 ]] ||
  fail 'Dieser Block ist für srv2077393 (x86_64) vorgesehen.'
exec 9>/run/lock/wg-forgejo-ci.lock
flock -n 9 || fail 'Die Einrichtung läuft bereits.'

origin=https://forgejo-h9qr.srv2077393.hstgr.cloud
config_dir=/etc/wg-forgejo-ci
binary=/usr/local/libexec/wg-forgejo-runner-11.3.1
sha=362e8055c1353e6cbce77a22d6ee6d7a32852e2a4f54bc7cb3e742143d0b0c04
label=ubuntu-latest:docker://node:24-bookworm

containers=$(docker ps --filter label=com.docker.compose.project=forgejo-h9qr \
  --format '{{.ID}} {{.Image}}' | awk '$2 ~ /(^|\/)forgejo([:@]|$)/ {print $1}')
if [[ -z "$containers" ]]; then
  containers=$(docker ps --format '{{.ID}} {{.Image}}' |
    awk '$2 ~ /(^|\/)forgejo([:@]|$)/ {print $1}')
fi
[[ "$containers" =~ ^[a-f0-9]+$ ]] || fail 'Forgejo-Container nicht eindeutig gefunden.'
ini=$(docker exec --user git "$containers" sh -ec '
  for f in "${FORGEJO_APP_INI:-}" "${GITEA_APP_INI:-}" /data/gitea/conf/app.ini \
    /etc/gitea/app.ini /etc/forgejo/app.ini /var/lib/gitea/custom/conf/app.ini; do
    if [ -n "$f" ] && [ -s "$f" ] && [ -r "$f" ]; then printf "%s\n" "$f"; exit 0; fi
  done
  exit 1
') || fail 'Forgejo-Konfiguration ist für den Container-Benutzer git nicht lesbar.'
forgejo=(docker exec -i --user git "$containers" forgejo --config "$ini")
"${forgejo[@]}" forgejo-cli actions register --help >/dev/null

printf '%s\n' 'Installiere Pakete für Rootless Podman.'
packages=(podman uidmap slirp4netns fuse-overlayfs dbus-user-session curl openssl)
export DEBIAN_FRONTEND=noninteractive NEEDRESTART_SUSPEND=1
apt-get update -q
package_plan=$(apt-get -s --no-install-recommends --no-upgrade --no-remove install "${packages[@]}")
if grep -qE '^Inst [^ ]+ \[' <<<"$package_plan"; then
  fail 'APT würde bestehende Pakete aktualisieren. Installation gestoppt.'
fi
apt-get install -y --no-install-recommends --no-upgrade --no-remove "${packages[@]}"

if ! printf '%s  %s\n' "$sha" "$binary" | sha256sum --check --status 2>/dev/null; then
  work=$(mktemp -d)
  trap 'rm -rf -- "$work"' EXIT
  curl -fsSL --retry 3 --connect-timeout 10 --max-time 180 -o "$work/runner" \
    https://code.forgejo.org/forgejo/runner/releases/download/v11.3.1/forgejo-runner-11.3.1-linux-amd64
  printf '%s  %s\n' "$sha" "$work/runner" | sha256sum -c -
  install -D -o root -g root -m 0755 "$work/runner" "$binary"
fi
install -d -o root -g root -m 0755 "$config_dir"
install -d -o root -g root -m 0700 "$config_dir/registration"

setup_runner() {
  local user=$1 repo=$2
  local runner_home="/var/lib/$user" cfg="$config_dir/$user.yml"
  local pending="$config_dir/registration/$user.key"
  local uid runtime socket secret file
  if ! id "$user" >/dev/null 2>&1; then
    useradd --user-group --create-home --home-dir "$runner_home" --shell /usr/sbin/nologin "$user"
  fi
  uid=$(id -u "$user")
  [[ "$uid" != 0 && "$(id -nG "$user")" == "$user" ]] ||
    fail "Unerwartete Gruppen für $user."
  [[ "$(getent passwd "$user" | cut -d: -f6)" == "$runner_home" ]] ||
    fail "Unerwartetes Home-Verzeichnis für $user."
  for file in /etc/subuid /etc/subgid; do
    awk -F: -v user="$user" '$1==user && $3>=65536 {ok=1} END {exit !ok}' "$file" ||
      fail "Für $user fehlen die nötigen IDs in $file."
  done
  runuser -u "$user" -- chmod 0700 "$runner_home"
  runuser -u "$user" -- mkdir -p -m 0700 "$runner_home/.config/containers" "$runner_home/state"
  runuser -u "$user" -- tee "$runner_home/.config/containers/containers.conf" >/dev/null <<'PODMAN'
[network]
default_rootless_network_cmd = "slirp4netns"
PODMAN
  runuser -u "$user" -- tee "$runner_home/.config/containers/registries.conf" >/dev/null <<'REGISTRIES'
unqualified-search-registries = ["docker.io"]
short-name-mode = "permissive"
REGISTRIES

  runtime=/run/user/$uid
  socket=$runtime/podman/podman.sock
  loginctl enable-linger "$user"
  systemctl start "user@$uid.service"
  runuser -u "$user" -- env XDG_RUNTIME_DIR="$runtime" \
    DBUS_SESSION_BUS_ADDRESS="unix:path=$runtime/bus" \
    systemctl --user enable --now podman.socket
  runuser -u "$user" -- curl -fsS --max-time 30 --unix-socket "$socket" \
    http://localhost/_ping >/dev/null

  cat >"$cfg" <<CONFIG
runner:
  file: .runner
  capacity: 1
  timeout: 35m
  labels:
    - "$label"
cache:
  enabled: false
container:
  privileged: false
  valid_volumes: []
  docker_host: "-"
CONFIG
  chmod 0644 "$cfg"

  if [[ ! -s "$runner_home/state/.runner" ]]; then
    if [[ ! -s "$pending" ]]; then
      openssl rand -hex 20 >"$pending"
    fi
    secret=$(<"$pending")
    [[ "$secret" =~ ^[0-9a-f]{40}$ ]] || fail "Ungültiges Registrierungsformat für $user."
    printf '%s' "$secret" | "${forgejo[@]}" forgejo-cli actions register \
      --name "$user" --scope "White-Gloss/$repo" --labels ubuntu-latest \
      --secret-file /dev/stdin >/dev/null
    runuser -u "$user" -- mkdir -p -m 0700 "$runner_home/register"
    (
      cd "$runner_home/register"
      runuser -u "$user" -- rm -f -- .runner
      runuser -u "$user" -- "$binary" -c "$cfg" create-runner-file \
        --name "$user" --instance "$origin" --connect --secret "$secret" >/dev/null
      runuser -u "$user" -- chmod 0600 .runner
      runuser -u "$user" -- mv -f -- .runner "$runner_home/state/.runner"
    )
  fi
  rm -f -- "$pending"

  cat >"/etc/systemd/system/$user.service" <<UNIT
[Unit]
Description=White-Gloss Forgejo CI – $repo
Wants=network-online.target
Requires=user@$uid.service
After=network-online.target user@$uid.service

[Service]
User=$user
WorkingDirectory=$runner_home/state
Environment=HOME=$runner_home
Environment=XDG_RUNTIME_DIR=$runtime
Environment=DOCKER_HOST=unix://$socket
ExecStart=$binary -c $cfg daemon
Restart=always
RestartSec=5
UMask=0077

[Install]
WantedBy=multi-user.target
UNIT
  chmod 0644 "/etc/systemd/system/$user.service"
  systemctl daemon-reload
  systemctl enable --now "$user.service"
  systemctl is-active --quiet "$user.service"
  printf 'AKTIV – %s (%s)\n' "$user" "$repo"
}

setup_runner wg-website-ci glanz-buchung-meister-import
setup_runner wg-panel-ci white-gloss-panel
printf '%s\n' 'FERTIG – Beide Dienste sind aktiv. Öffne in Forgejo den Tab Actions.'
