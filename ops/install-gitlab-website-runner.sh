#!/usr/bin/env bash
# Dedicated unprivileged Docker-executor manager for the White-Gloss GitLab project.
set +x
set -Eeuo pipefail
umask 077
export PATH=/usr/sbin:/usr/bin:/sbin:/bin
cd /
die() { printf 'Abbruch: %s\n' "$*" >&2; exit 1; }

[[ $EUID == 0 && $(hostname -s) == srv2077393 && $(uname -m) == x86_64 ]] ||
  die 'Als root auf dem Website-VPS srv2077393 (amd64) ausführen.'
[[ $# -ge 1 && $# -le 2 && $1 =~ ^[1-9][0-9]*$ && ${2:-} =~ ^(--token-stdin)?$ ]] ||
  die 'Aufruf: install-gitlab-website-runner.sh RUNNER_ID [--token-stdin]'
expected_id=$1
mode=${2:-}
account=wg-gitlab-web
runner_home=/var/lib/$account
url=https://gitlab-p1va.srv2077393.hstgr.cloud
service=white-gloss-gitlab-runner.service
directory=/opt/white-gloss-gitlab-runner
version=19.6.0
checksum=295f0d264b540286e1d1ede2bd572f890269e2a4977c7a656a3f71280845bc2f
bin=$directory/gitlab-runner-$version
config=$runner_home/manager/config.toml
exec 9>/run/lock/white-gloss-gitlab-runner.lock
flock -n 9 || die 'Ein zweiter Einrichtungsprozess ist aktiv.'
for command in podman loginctl runuser curl python3 sha256sum dpkg dpkg-query apt-get; do
  command -v "$command" >/dev/null || die "Benötigtes Systemprogramm fehlt: $command"
done
dpkg --compare-versions "$(podman version --format '{{.Client.Version}}')" ge 4.2 ||
  die 'Podman 4.2 oder neuer wird für den GitLab-Docker-Executor benötigt.'
[[ -e /sys/fs/cgroup/cgroup.controllers ]] || die 'Rootless-Ressourcenlimits benötigen cgroup v2.'
printf 'VPS vor Einrichtung: %s; %s GiB auf /var/lib frei.\n' \
  "$(awk '/^MemAvailable:/ {printf "%.1f GiB RAM verfügbar", $2/1048576}' /proc/meminfo)" \
  "$(df -BG --output=avail /var/lib | awk 'NR==2 {gsub("G",""); print $1}')"
work=$(mktemp -d)
trap 'rm -rf -- "$work"' EXIT
# Ubuntu splits Podman's rootless network helper and DNS server into optional packages.
missing=()
for package in passt aardvark-dns; do
  if [[ $(dpkg-query -W -f='${db:Status-Status}' "$package" 2>/dev/null || true) != installed ]]; then
    missing+=("$package")
  fi
done
if (( ${#missing[@]} )); then
  apt_flags=(-q --no-install-recommends --no-upgrade --no-remove -o DPkg::Lock::Timeout=60)
  for attempt in 1 2; do
    if (( attempt == 2 )); then
      apt-get -q -o APT::Update::Error-Mode=any update || die 'Ubuntu-Paketlisten konnten nicht aktualisiert werden.'
    fi
    if plan=$(LC_ALL=C apt-get -s "${apt_flags[@]}" install "${missing[@]}"); then
      if grep -Eq '^(Remv |Inst [^ ]+ \[)' <<<"$plan"; then
        die 'Die Netzwerkpakete würden vorhandene Pakete ändern. Installation angehalten.'
      fi
      if apt-get -y --download-only "${apt_flags[@]}" install "${missing[@]}"; then break; fi
    fi
    (( attempt < 2 )) || die 'Die Ubuntu-Netzwerkpakete sind nicht verfügbar.'
  done
  DEBIAN_FRONTEND=noninteractive NEEDRESTART_SUSPEND=1 apt-get -y --no-download \
    "${apt_flags[@]}" install "${missing[@]}" || die 'Installation der Podman-Netzwerkpakete fehlgeschlagen.'
fi
install -d -m 0755 -o root -g root "$directory"
if [[ ! -f $bin ]] || ! printf '%s  %s\n' "$checksum" "$bin" | sha256sum --check --status; then
  curl -fsSL --proto '=https' --proto-redir '=https' --retry 3 --max-time 300 \
    "https://s3.dualstack.us-east-1.amazonaws.com/gitlab-runner-downloads/v$version/binaries/gitlab-runner-linux-amd64" \
    -o "$work/runner"
  printf '%s  %s\n' "$checksum" "$work/runner" | sha256sum --check --status || die 'Runner-Prüfsumme stimmt nicht.'
  install -o root -g root -m 0755 "$work/runner" "$bin"
fi

if ! id "$account" >/dev/null 2>&1; then
  useradd --user-group --create-home --home-dir "$runner_home" --shell /usr/sbin/nologin "$account"
fi
[[ $(getent passwd "$account" | cut -d: -f6-7) == "$runner_home:/usr/sbin/nologin" &&
   $(id -nG "$account") == "$account" && ! -L $runner_home &&
   $(stat -c %U "$runner_home") == "$account" ]] || die 'Das Runner-Konto entspricht nicht dem dedizierten Dienstkonto.'
for mappings in /etc/subuid /etc/subgid; do
  awk -F: -v u="$account" '$1==u && $3>=65536 {ok=1} END{exit !ok}' "$mappings" ||
    die "Untergeordnete IDs für $account fehlen in $mappings."
done
uid=$(id -u "$account")
runtime=/run/user/$uid
socket=$runtime/podman/podman.sock
as_runner() {
  runuser -u "$account" -- env HOME="$runner_home" XDG_RUNTIME_DIR="$runtime" \
    DBUS_SESSION_BUS_ADDRESS="unix:path=$runtime/bus" "$@"
}
as_runner chmod 0700 "$runner_home"
as_runner mkdir -p -m 0700 "$runner_home/manager" "$runner_home/.config/containers"
as_runner sh -ec '
  p="$HOME/.config/containers/registries.conf"
  if ! test -e "$p"; then
    printf "%s\n" "unqualified-search-registries = [\"docker.io\"]" >"$p"
  fi'
loginctl enable-linger "$account"
systemctl start "user@$uid.service"
as_runner systemctl --user enable --now podman.socket
as_runner curl --noproxy '*' -fsS --max-time 10 --unix-socket "$socket" http://localhost/_ping >/dev/null ||
  die 'Der dedizierte Podman-Socket antwortet nicht.'

# Run a real alias lookup using only this service user's private network/storage.
to_verify=$config
if ! as_runner test -s "$config"; then
  to_verify=$config.pending
  as_runner rm -f -- "$to_verify"
  as_runner bash -ec '
    net=wg-gitlab-preflight-$$
    container=wg-gitlab-probe-$$
    podman network create "$net" >/dev/null
    cleanup() { podman rm -f "$container" >/dev/null 2>&1 || true; podman network rm "$net" >/dev/null 2>&1 || true; }
    trap cleanup EXIT
    image=docker.io/library/alpine:3.23
    podman run --detach --name "$container" --network "$net" --network-alias wg-service "$image" sleep 120 >/dev/null
    podman run --rm --network "$net" "$image" getent hosts wg-service >/dev/null' ||
      die 'Der isolierte Dienstnetzwerk-Test mit Podman und Container-DNS ist fehlgeschlagen.'
  if [[ $mode == --token-stdin ]]; then
    IFS= read -r runner_token || [[ -n ${runner_token:-} ]] || die 'Runner-Token fehlt auf stdin.'
  else
    IFS= read -rs -p 'Einmaligen glrt-Token des Website-Runners eingeben: ' runner_token </dev/tty
    printf '\n' >/dev/tty
  fi
  [[ $runner_token =~ ^glrt-[[:alnum:]_.~-]+$ ]] || die 'Ein Runner-Authentifizierungstoken mit Präfix glrt- ist erforderlich.'
  # The manager owns its lifecycle credentials. No token in argv, git, stdout or a job container.
  printf '%s\n' "$runner_token" | as_runner sh -ec '
    IFS= read -r CI_SERVER_TOKEN
    export CI_SERVER_TOKEN
    exec "$@"' sh "$bin" register --non-interactive --config "$to_verify" --url "$url" \
      --name white-gloss-website --executor docker --limit 1 --docker-host "unix://$socket" \
      --docker-image node:24-bookworm --docker-disable-cache --docker-pull-policy always \
      --docker-allowed-pull-policies always --docker-services-limit 1 \
      --docker-shm-size 536870912 --docker-memory 4g --docker-cpus 2 \
      --docker-service-memory 768m --docker-service-cpus 1 \
      --docker-allowed-images node:24-bookworm \
      --docker-allowed-images 'mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e' \
      --docker-allowed-services postgres:16 --env FF_NETWORK_PER_BUILD=1 >/dev/null 2>&1 ||
        die 'GitLab hat die Registrierung abgelehnt. URL, Runner-ID und frischen Projekt-Token prüfen.'
  unset runner_token
fi

# Both an initial install and a rerun must match the exact per-project runner.
as_runner python3 -I - "$to_verify" "$url" "$socket" "$expected_id" <<'PY'
import sys, tomllib
with open(sys.argv[1], "rb") as handle:
    conf = tomllib.load(handle)
runners = conf.get("runners", [])
if len(runners) != 1:
    raise SystemExit("Erwartet wurde genau ein Website-Runner.")
r = runners[0]
d = r.get("docker", {})
if not (r.get("id") == int(sys.argv[4]) and r.get("url", "").rstrip("/") == sys.argv[2]
        and r.get("executor") == "docker" and r.get("limit") == 1
        and d.get("host") == "unix://" + sys.argv[3] and not d.get("privileged")
        and not d.get("services_privileged") and not d.get("volumes") and not d.get("devices")
        and d.get("disable_cache") and d.get("allowed_services") == ["postgres:16"]
        and d.get("allowed_images") == ["node:24-bookworm", "mcr.microsoft.com/playwright:v1.62.1-noble@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e"]):
    raise SystemExit("Vorhandene Runner-Zuordnung oder Docker-Isolierung abweichend. Dienst wurde nicht gestartet.")
PY
as_runner chmod 0600 "$to_verify"
as_runner "$bin" verify --config "$to_verify" >/dev/null 2>&1 || die 'Registrierung ist bei GitLab nicht gültig.'
if [[ $to_verify != "$config" ]]; then
  as_runner mv -fT -- "$to_verify" "$config"
fi
cat >"$work/unit" <<UNIT
[Unit]
Description=White-Gloss GitLab Website Runner
After=network-online.target user@$uid.service
Wants=network-online.target
Requires=user@$uid.service

[Service]
User=$account
Group=$account
WorkingDirectory=$runner_home/manager
Environment=HOME=$runner_home
Environment=XDG_RUNTIME_DIR=$runtime
ExecStart=$bin run --config $config --working-directory $runner_home/manager
Restart=on-failure
RestartSec=5
KillSignal=SIGQUIT
TimeoutStopSec=1h
UMask=0077
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
UNIT
dest=/etc/systemd/system/$service
if [[ -e $dest ]]; then
  cmp -s "$work/unit" "$dest" || die 'Die bestehende GitLab-Runner-Unit weicht vom Installer ab.'
else
  install -o root -g root -m 0644 "$work/unit" "$dest"
fi
systemctl daemon-reload
systemctl enable --now "$service"
systemctl is-active --quiet "$service" || die 'Der Website-Runner-Dienst läuft nicht.'
printf 'GitLab bestätigt die Registrierung. Website-Runner #%s gestartet. Den ersten Website-Job in GitLab prüfen.\n' "$expected_id"
