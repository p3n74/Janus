FROM oven/bun:1.4.2

WORKDIR /app

COPY . .
RUN chmod +x /app/docker/start.sh

# The Expo app is not in this image. Skip its workspace and optional Expo
# peer deps so install stays a few hundred packages instead of the full native tree.
ENV CI=1
RUN bun install --frozen-lockfile --ignore-scripts --omit=peer \
  && varlock codegen --path ./apps/web/ \
  && varlock codegen --path ./apps/server/ \
  && varlock codegen --path ./packages/db/

ARG VITE_SERVER_URL=https://janus.citadel-codex.com
ARG NODE_ENV=production
ENV VITE_SERVER_URL=$VITE_SERVER_URL
ENV NODE_ENV=$NODE_ENV

RUN bun run --filter web build

ENV PORT=3000
EXPOSE 3000

CMD ["/app/docker/start.sh"]
