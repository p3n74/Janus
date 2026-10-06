FROM oven/bun:1.4.2

WORKDIR /app

COPY . .
RUN chmod +x /app/docker/start.sh

RUN bun install --frozen-lockfile

ARG VITE_SERVER_URL=https://janus.citadel-codex.com
ARG NODE_ENV=production
ENV VITE_SERVER_URL=$VITE_SERVER_URL
ENV NODE_ENV=$NODE_ENV

RUN bun run --filter web build

ENV PORT=3000
EXPOSE 3000

CMD ["/app/docker/start.sh"]
