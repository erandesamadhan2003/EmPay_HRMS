FROM oven/bun:alpine AS deps

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install \
    --production \
    --frozen-lockfile

FROM oven/bun:alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY --from=deps \
    /app/node_modules \
    ./node_modules

COPY . .

RUN addgroup -S app && \
    adduser -S app -G app

RUN chown -R app:app /app

USER app

EXPOSE 3000

CMD ["bun","run","start"]