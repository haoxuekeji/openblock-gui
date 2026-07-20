# openblock-gui 开发镜像（Webpack 4 / React 16 适配 Node 16）
FROM node:16-bookworm

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends git python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

COPY . .

EXPOSE 8601

ENV CHOKIDAR_USEPOLLING=true \
    WATCHPACK_POLLING=true \
    PORT=8601 \
    NODE_ENV=development

# 不使用 npm start（带 --open，容器内无浏览器）
CMD ["npx", "webpack-dev-server", "--host", "0.0.0.0", "--port", "8601"]
