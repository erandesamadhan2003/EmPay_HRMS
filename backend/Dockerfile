FROM oven/bun:latest

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./

RUN bun install --production --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["bun", "run", "start"]