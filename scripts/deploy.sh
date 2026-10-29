#!/usr/bin/env bash
set -euo pipefail

# Passwords are entered only at the SSH prompt; never save credentials here.
project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
deploy_host="${BLESSING_DEPLOY_HOST:-root@119.45.123.248}"
release_id="$(date -u +%Y%m%dT%H%M%SZ)"
release_path="/var/www/blessing-hub/releases/${release_id}"
ssh_options=(-o ConnectTimeout=15 -o ServerAliveInterval=15 -o ServerAliveCountMax=3)
if [[ -n "${BLESSING_SSH_CONTROL_PATH:-}" ]]; then
  ssh_options+=(-S "$BLESSING_SSH_CONTROL_PATH")
fi

cd "$project_dir"
npm run build
ssh "${ssh_options[@]}" "$deploy_host" "mkdir -p '$release_path' /var/www/blessing-hub/backups"
COPYFILE_DISABLE=1 tar --format=ustar -C dist -czf - . | ssh "${ssh_options[@]}" "$deploy_host" "tar -xzf - -C '$release_path'"
ssh "${ssh_options[@]}" "$deploy_host" "cat > /var/www/blessing-hub/nginx.candidate" < deploy/nginx.conf

ssh "${ssh_options[@]}" "$deploy_host" bash -s -- "$release_id" <<'REMOTE'
set -euo pipefail
release_id="$1"
deploy_root=/var/www/blessing-hub
config_path=/etc/nginx/conf.d/blessing-hub.conf
backup_path="$deploy_root/backups/nginx-$release_id.conf"
previous_target="$(readlink "$deploy_root/current" || true)"
had_config=false
if [[ -f "$config_path" ]]; then
  cp -p "$config_path" "$backup_path"
  had_config=true
fi

rollback() {
  if $had_config; then
    cp -p "$backup_path" "$config_path"
  else
    rm -f "$config_path"
  fi
  if [[ -n "$previous_target" ]]; then
    ln -sfn "$previous_target" "$deploy_root/rollback-link"
    mv -Tf "$deploy_root/rollback-link" "$deploy_root/current"
  else
    rm -f "$deploy_root/current"
  fi
  nginx -t && systemctl reload nginx || true
}
trap 'printf "Deployment failed at line %s; rolling back.\n" "$LINENO"; rollback' ERR

chmod -R a+rX "$deploy_root/releases/$release_id"
ln -sfn "$deploy_root/releases/$release_id" "$deploy_root/current.next"
mv -Tf "$deploy_root/current.next" "$deploy_root/current"
install -m 0644 "$deploy_root/nginx.candidate" "$config_path"
nginx -t
systemctl reload nginx

# Nginx reload signals the master asynchronously; wait for new workers to serve.
origin_ready=false
for attempt in {1..10}; do
  if curl --connect-timeout 5 --max-time 15 -fsS -H 'Host: blessingshs.cc.cd' http://127.0.0.1/ | grep -F '<title>Blessing Hub' > /dev/null; then
    origin_ready=true
    break
  fi
  sleep 0.3
done
$origin_ready
curl --connect-timeout 5 --max-time 15 -fsS -H 'Host: blessingshs.cc.cd' http://127.0.0.1/resources/learning-checklist/ | grep -F '学习整理清单' > /dev/null
curl --connect-timeout 5 --max-time 15 -fsS -H 'Host: blessingshs.cc.cd' http://127.0.0.1/downloads/learning-checklist.md | grep -F '我的学习整理清单' > /dev/null
curl --connect-timeout 5 --max-time 15 -fsS -H 'Host: blessingshs.cc.cd' http://127.0.0.1/feed.xml | grep -F '<rss' > /dev/null
curl --connect-timeout 5 --max-time 15 -fsS -H 'Host: api.blessingshs.cc.cd' http://127.0.0.1/ -o /dev/null
trap - ERR
if [[ -n "$previous_target" ]]; then printf '%s\n' "$previous_target" > "$deploy_root/previous-release"; fi
printf 'Deployed release: %s\n' "$release_id"
printf 'Origin checks passed for Hub, article, download, RSS and existing API.\n'
REMOTE
