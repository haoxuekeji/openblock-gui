#!/bin/sh
set -eu

link_local_dep() {
  pkg_name="$1"
  src="$2"
  dest="/app/node_modules/$pkg_name"

  if [ ! -d "$src" ]; then
    echo "[entrypoint] skip $pkg_name: $src not found"
    return 0
  fi

  rm -rf "$dest"
  ln -sfn "$src" "$dest"
  echo "[entrypoint] linked $pkg_name -> $src"
}

MARKER="/app/node_modules/.openblock-gui-deps-ok"
LOCK_HASH_FILE="/app/node_modules/.openblock-gui-lockhash"
LOCK_HASH="$(checksum() { cksum package-lock.json 2>/dev/null | awk '{print $1}'; }; checksum)"

need_install=0
if [ ! -x /app/node_modules/.bin/webpack ]; then
  need_install=1
elif [ ! -f "$MARKER" ]; then
  need_install=1
elif [ ! -f "$LOCK_HASH_FILE" ] || [ "$(cat "$LOCK_HASH_FILE")" != "$LOCK_HASH" ]; then
  need_install=1
fi

if [ "$need_install" = "1" ]; then
  echo "[entrypoint] installing npm dependencies..."
  npm install --legacy-peer-deps
  echo "$LOCK_HASH" > "$LOCK_HASH_FILE"
  touch "$MARKER"
else
  echo "[entrypoint] dependencies already present, skip npm install"
fi

# 本地联调：安装完成后再链，避免 npm rename 挂载点
link_local_dep "openblock-vm" "/deps/openblock-vm"
link_local_dep "hxblock-blocks" "/deps/hxblock-blocks"
link_local_dep "hxblock-l10n" "/deps/hxblock-l10n"

# 确保本地 PATH 能找到 gui 自己的 bin（mkdirp / webpack）
export PATH="/app/node_modules/.bin:$PATH"

echo "[entrypoint] starting: $*"
exec "$@"
