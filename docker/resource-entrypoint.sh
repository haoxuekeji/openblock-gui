#!/bin/sh
# openblock-resource 开发容器入口：安装依赖后启动扩展资源服务
set -eu

cd /app

LOCK_HASH_FILE="/app/node_modules/.openblock-resource-lockhash"
LOCK_HASH="$(cksum package-lock.json 2>/dev/null | awk '{print $1}')"

if [ ! -d /app/node_modules/express ] || [ ! -f "$LOCK_HASH_FILE" ] || \
   [ "$(cat "$LOCK_HASH_FILE" 2>/dev/null)" != "$LOCK_HASH" ]; then
  echo "[resource-entrypoint] installing npm dependencies..."
  npm install --legacy-peer-deps
  echo "$LOCK_HASH" > "$LOCK_HASH_FILE"
else
  echo "[resource-entrypoint] dependencies already present, skip npm install"
fi

echo "[resource-entrypoint] serving external resources from: ${OPENBLOCK_EXTERNAL_RESOURCES:-builtin}"
echo "[resource-entrypoint] starting: $*"
exec "$@"
