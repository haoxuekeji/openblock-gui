# OpenBlock Docker 开发环境

一条命令拉起 Web 版全套开发环境（GUI + 硬件服务 + 扩展资源服务）：

```bash
cd openblock-gui
docker compose up -d
```

| 服务 | 容器 | 地址 | 说明 |
|---|---|---|---|
| gui | openblock-gui-dev | http://127.0.0.1:8601/scratch3/ | webpack-dev-server，publicPath 为 `/scratch3/` |
| link | openblock-link-dev | ws://127.0.0.1:20111 | 串口扫描 / arduino-cli 编译 / 烧录 |
| resource | openblock-resource-dev | http://127.0.0.1:20112 | 设备与扩展库索引、静态资源 |

浏览器中的 GUI 固定连接 `127.0.0.1:20111/20112`，因此三个端口都必须映射到宿主机。

## 各服务要点

### gui
- 本地联调仓库通过 `/deps` 挂载后软链：`openblock-vm`、`hxblock-blocks`(openblock-blocks)、`hxblock-l10n`(openblock-l10n)，改动即时生效（轮询监听）。
- 生产构建并部署到 kids-code-platform：`docker compose --profile build run --rm build-kids`。

### link
- 镜像基于 `node:22-trixie`（openblock-tools 内置 Python 需要 glibc>=2.38）+ `udev`（serialport 枚举串口依赖 udevadm）。
- 首次启动自动从 GitHub 下载 Linux 版 openblock-tools（约 1.5GB，含 arduino-cli、Python、esptool/obmpy/kflash），存放在 `link_tools` 卷中，不污染宿主仓库（宿主 `tools/` 是 macOS 二进制）。
- 跳过下载：环境变量 `OPENBLOCK_SKIP_TOOLS_DOWNLOAD=1`（仅串口连接可用，无法编译烧录）。
- 串口热插拔：容器以 privileged 模式绑定宿主 `/dev`。

### resource
- 服务 `external-resources-v3` 仓库内容（当前 openblock-resource 代码只认 v3 的**单层目录**扩展布局；旧 `external-resources` 仓库的 `extensions/arduino/...` 嵌套布局会导致索引 500，只有桌面版锁定的旧版 resource(ee5f171) 才支持）。
- 修改扩展后重启容器刷新索引：`docker compose restart resource`。

## 常用命令

```bash
docker compose logs -f gui          # 看编译输出
docker compose restart resource     # 扩展改动后刷新索引
docker compose down                 # 停止（保留依赖/工具卷）
docker compose down -v              # 停止并清空所有卷（重装依赖+重新下载工具链）
```

## 桌面版说明

Electron 桌面版（openblock-desktop / openblock-link-desktop）需要显示环境，不放入容器，直接在宿主机 `npm start` 开发；容器环境只覆盖 Web 版三件套。
