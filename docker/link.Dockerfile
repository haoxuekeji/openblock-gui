# openblock-link 开发镜像
# - trixie: openblock-tools 的 Python 需要 glibc>=2.38
# - udev: serialport 在 Linux 上枚举串口依赖 udevadm
FROM node:22-trixie

RUN apt-get update \
    && apt-get install -y --no-install-recommends udev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
