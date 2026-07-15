FROM oven/bun:1-slim

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY src ./src
COPY assets ./assets

ENV PORT=8080
EXPOSE 8080
USER bun

CMD ["bun", "run", "src/server.ts"]
