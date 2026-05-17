FROM oven/bun:latest

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY backend/package.json backend/bun.lock ./

RUN bun install --production --frozen-lockfile

COPY backend/ ./

EXPOSE 3000

CMD ["bun", "run", "start"]
