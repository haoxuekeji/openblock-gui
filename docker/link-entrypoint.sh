#!/bin/sh
# openblock-link 开发容器入口：安装依赖 + 准备 Linux 工具链后启动服务
set -eu

cd /app

LOCK_HASH_FILE="/app/node_modules/.openblock-link-lockhash"
LOCK_HASH="$(cksum package-lock.json 2>/dev/null | awk '{print $1}')"

if [ ! -d /app/node_modules/serialport ] || [ ! -f "$LOCK_HASH_FILE" ] || \
   [ "$(cat "$LOCK_HASH_FILE" 2>/dev/null)" != "$LOCK_HASH" ]; then
  echo "[link-entrypoint] installing npm dependencies..."
  npm install --legacy-peer-deps
  echo "$LOCK_HASH" > "$LOCK_HASH_FILE"
else
  echo "[link-entrypoint] dependencies already present, skip npm install"
fi

# tools 卷内需要 Linux 版工具链（宿主仓库自带的是 macOS 二进制，已被卷遮蔽）。
# 判定标准：arduino-cli 存在且为 ELF 格式。
need_tools=1
CLI=/app/tools/Arduino/arduino-cli
if [ -x "$CLI" ] && [ "$(head -c 4 "$CLI" | od -An -tx1 | tr -d ' \n')" = "7f454c46" ]; then
  need_tools=0
fi

if [ "$need_tools" = "1" ]; then
  if [ "${OPENBLOCK_SKIP_TOOLS_DOWNLOAD:-0}" = "1" ]; then
    echo "[link-entrypoint] WARN: Linux 工具链缺失，已跳过下载(OPENBLOCK_SKIP_TOOLS_DOWNLOAD=1)，编译/烧录不可用"
  else
    echo "[link-entrypoint] downloading Linux toolchain (openblock-tools, 首次较慢)..."
    # download-tools.js 依赖 progress 模块，但未声明在 package.json 中，做兜底安装
    node -e "require('progress')" 2>/dev/null || npm install progress --no-save
    # npm 卷内的 7za 可能丢失可执行位，导致解压 EACCES
    chmod +x /app/node_modules/7zip-bin/linux/*/7za 2>/dev/null || true
    rm -rf /app/tools/* 2>/dev/null || true
    node script/download-tools.js || {
      echo "[link-entrypoint] ERROR: 工具链下载失败，串口连接仍可用，编译/烧录不可用"
    }
    # 7z 解压不保证还原 unix 可执行位，补齐关键工具的执行权限
    chmod +x /app/tools/Arduino/arduino-cli 2>/dev/null || true
    chmod -R +x /app/tools/Python/bin /app/tools/Python/python3* 2>/dev/null || true
    if [ -x /app/tools/Arduino/arduino-cli ]; then
      # 工具链就绪后再清理下载缓存
      rm -rf /app/tmp 2>/dev/null || true
      echo "[link-entrypoint] Linux toolchain ready"
    else
      echo "[link-entrypoint] WARN: 工具链仍不完整，保留 tmp 缓存以便下次重试"
    fi
  fi
else
  echo "[link-entrypoint] Linux toolchain already present"
fi

echo "[link-entrypoint] starting: $*"
exec "$@"
