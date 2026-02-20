# syntax=docker/dockerfile:1

FROM oven/bun:1.1.42 AS deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install

FROM deps AS build
COPY . .
RUN bun run build.ts

FROM oven/bun:1.1.42 AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json bun.lock* ./
RUN bun install --production

COPY --from=build /app/index.ts ./index.ts
COPY --from=build /app/apps ./apps
COPY --from=build /app/server ./server
COPY --from=build /app/src ./src
COPY --from=build /app/dist ./dist
COPY --from=build /app/bunfig.toml ./bunfig.toml
COPY --from=build /app/tsconfig.json ./tsconfig.json

EXPOSE 3000
CMD ["bun", "index.ts"]
