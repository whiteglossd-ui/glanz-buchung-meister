#!/usr/bin/env bash
# One-time scoped online registration for the already installed White-Gloss website runner.
set +x
set -Eeuo pipefail
umask 077
fail() { printf 'STOPP: %s\n' "$*" >&2; exit 1; }
[[ $EUID == 0 && $(hostname -s) == srv2077393 ]] || fail 'In der Hostinger-Konsole auf srv2077393 als root ausführen.'
exec 9>/run/lock/wg-forgejo-ci.lock
flock -n 9 || fail 'Eine Runner-Einrichtung läuft bereits.'
user=wg-website-ci
unit=$user.service
state=/var/lib/$user/state
work=/var/lib/$user/registration-repair-v1
config=/etc/wg-forgejo-ci/$user.yml
bin=/opt/wg-forgejo-ci/forgejo-runner-11.3.1
site=https://forgejo-h9qr.srv2077393.hstgr.cloud
repo=White-Gloss/glanz-buchung-meister-import
label=ubuntu-latest:docker://node:24-bookworm
uid=$(id -u "$user")
as_runner() { runuser -u "$user" -- "$@"; }
[[ $(systemctl show -p User --value "$unit") == "$user" &&
   $(systemctl show -p WorkingDirectory --value "$unit") == "$state" ]] ||
   fail 'Der Website-Dienst entspricht nicht der bestehenden Installation.'
printf '%s  %s\n' 362e8055c1353e6cbce77a22d6ee6d7a32852e2a4f54bc7cb3e742143d0b0c04 "$bin" | sha256sum --check --status ||
  fail 'Unerwartetes Runner-Programm.'
[[ $(stat -c %u "$config") == 0 && ! -L "$config" ]] || fail 'Unerwartete Runner-Konfiguration.'
grep -Eq '^[[:space:]]*file: \.runner[[:space:]]*$' "$config" || fail 'Unerwarteter Registrierungsdateipfad.'
grep -Fq -- "$label" "$config" || fail 'Das Website-Label fehlt.'
old=$state/.runner
candidate=$work/.runner
backup=$work/original.runner
socket=/run/user/$uid/podman/podman.sock
registration_id() {
  as_runner python3 -c '
import json, sys
with open(sys.argv[1]) as f:
    r=json.load(f)
if r.get("name")!=sys.argv[2] or r.get("address","").rstrip("/")!=sys.argv[3] or not r.get("uuid") or not r.get("token"):
    sys.exit(1)
print(int(r["id"]))
' "$1" "$user" "$site"
}
declared() {
  local invocation
  invocation=$(systemctl show "$unit" -p InvocationID --value)
  [[ $invocation =~ ^[a-f0-9]{32}$ ]] && systemctl is-active --quiet "$unit" &&
    journalctl "_SYSTEMD_INVOCATION_ID=$invocation" --no-pager -o cat |
    grep -F 'declared successfully' >/dev/null
}
wait_declared() {
  for _ in {1..30}; do
    if declared; then return 0; fi
    sleep 1
  done
  return 1
}
id_before=$(registration_id "$old") || fail 'Die vorhandene Website-Registrierung konnte nicht geprüft werden.'
if (( id_before > 0 )); then
  systemctl start "$unit"
  wait_declared || fail 'Online-Registrierung besteht bereits. Der Dienst meldet sich noch nicht bei Forgejo.'
  printf 'Website-Runner bereits online registriert und bei Forgejo angemeldet (ID %s).\n' "$id_before"
  exit 0
fi
[[ $id_before == 0 ]] || fail 'Unbekannte Registrierungsart.'
as_runner mkdir -p -m 0700 "$work"
as_runner chmod 0700 "$work"
ensure_idle() {
  local ids id display=()
  ids=$(as_runner env XDG_RUNTIME_DIR="/run/user/$uid" timeout 15 \
    podman --remote --url "unix://$socket" ps --quiet --no-trunc) ||
    fail 'Podman konnte die laufenden Container des Website-Runners nicht abfragen.'
  [[ -n $ids ]] || return 0
  while IFS= read -r id; do
    [[ $id =~ ^[[:xdigit:]]{64}$ ]] || fail 'Podman lieferte eine unerwartete Container-ID.'
    display+=("${id:0:12}")
  done <<< "$ids"
  fail "Podman meldet laufende Container beim Website-Runner: ${display[*]}."
}
ensure_idle
if ! as_runner test -s "$candidate"; then
  container=$(docker ps --filter label=com.docker.compose.project=forgejo-h9qr --format '{{.ID}} {{.Image}}' |
    awk '$2 ~ /(^|\/)forgejo([:@]|$)/ {print $1}')
  [[ $container =~ ^[0-9a-f]+$ ]] || fail 'Der Forgejo-Container ist nicht eindeutig.'
  ini=$(docker exec --user git "$container" sh -ec '
    for path in "${FORGEJO_APP_INI:-}" "${GITEA_APP_INI:-}" /data/gitea/conf/app.ini /etc/gitea/app.ini /etc/forgejo/app.ini /var/lib/gitea/custom/conf/app.ini; do
      if [ -n "$path" ] && [ -s "$path" ] && [ -r "$path" ]; then printf "%s\n" "$path"; exit 0; fi
    done
    exit 1') || fail 'Forgejo-Konfiguration nicht gefunden.'
  # Validate before forwarding. No credential is passed as a command argument or printed to the terminal.
  docker exec --user git "$container" forgejo --config "$ini" actions generate-runner-token --scope "$repo" |
    python3 -c '
import re,sys
token=sys.stdin.buffer.read().strip()
if not re.fullmatch(rb"[A-Za-z0-9]{40}",token): sys.exit(1)
sys.stdout.buffer.write(b"\n".join([sys.argv[1].encode(),token,sys.argv[2].encode(),sys.argv[3].encode()])+b"\n")
' "$site" "$user" "$label" |
    as_runner timeout 60 sh -c 'cd "$1" && umask 077 && exec "$2" -c "$3" register' sh "$work" "$bin" "$config" >/dev/null 2>&1 ||
      fail 'Forgejo konnte die Website-Registrierung nicht bestätigen. Der bisherige Dienst bleibt erhalten.'
fi
id_after=$(registration_id "$candidate") || fail 'Die neue Online-Registrierung ist ungültig.'
(( id_after > 0 )) || fail 'Forgejo hat keine gültige Runner-ID vergeben.'
as_runner chmod 0600 "$candidate"
ensure_idle
was_active=0
if systemctl is-active --quiet "$unit"; then was_active=1; fi
restore=0
finish() {
  local rc=$?
  trap - EXIT HUP INT TERM
  if (( restore )); then
    systemctl stop "$unit" || true
    if as_runner cp --preserve=mode -- "$backup" "$state/.runner.rollback" &&
       as_runner mv -fT -- "$state/.runner.rollback" "$old"; then
      if (( was_active )); then systemctl start "$unit" || true; fi
      printf 'Bisherige Registrierung wieder eingesetzt.\n' >&2
    else
      printf 'Wiederherstellung fehlgeschlagen. Private Sicherung: %s\n' "$backup" >&2
    fi
  fi
  exit "$rc"
}
trap finish EXIT
trap 'exit 130' HUP INT TERM
as_runner cp --preserve=mode -- "$old" "$backup"
as_runner chmod 0600 "$backup"
restore=1
systemctl stop "$unit"
as_runner install -m 0600 -- "$candidate" "$state/.runner.next"
as_runner mv -fT -- "$state/.runner.next" "$old"
systemctl start "$unit"
wait_declared || fail 'Der neue Runner hat seine Verbindung nicht bestätigt.'
restore=0
as_runner rm -f -- "$candidate"
printf 'Website-Runner online registriert und bei Forgejo angemeldet (ID %s).\n' "$id_after"
