# Production Deploy Runbook (Hardcoded)

This repository is deployed as 4 services with fixed names:

1. `things-web` (Pages) -> `https://things.hsuwai.space`
2. `things-admin` (Pages) -> `https://admin.hsuwai.space`
3. `things-chat` (Pages) -> `https://chat.hsuwai.space`
4. `things-api` (Worker) -> `/api/*` on all 3 domains

`wrangler.api.jsonc` already hardcodes the worker routes:

- `things.hsuwai.space/api/*`
- `admin.hsuwai.space/api/*`
- `chat.hsuwai.space/api/*`

## 1) One-time setup

Create the 3 Pages projects:

```bash
bun run setup:prod
```

Set Worker secrets:

```bash
bunx wrangler secret put DATABASE_URL --config wrangler.api.jsonc
bunx wrangler secret put BETTER_AUTH_SECRET --config wrangler.api.jsonc
bunx wrangler secret put JWT_AUTH_SECRET --config wrangler.api.jsonc
bunx wrangler secret put GOOGLE_CLIENT_SECRET --config wrangler.api.jsonc
bunx wrangler secret put GITHUB_CLIENT_SECRET --config wrangler.api.jsonc
bunx wrangler secret put REDIS_URL --config wrangler.api.jsonc
```

In Cloudflare Pages dashboard, attach custom domains:

- `things-web` -> `things.hsuwai.space`
- `things-admin` -> `admin.hsuwai.space`
- `things-chat` -> `chat.hsuwai.space`

## 2) Deploy all (single command)

```bash
bun run deploy:prod
```

This command will:

1. Build all frontends into `dist/apps/*`
2. Deploy all 3 Pages projects
3. Deploy the API worker with `wrangler.api.jsonc`

You can also deploy each Pages app manually:

```bash
bunx wrangler pages deploy dist/apps/things_web --project-name things-web
bunx wrangler pages deploy dist/apps/admin --project-name things-admin
bunx wrangler pages deploy dist/apps/chat_app --project-name things-chat
```

## 3) Smoke tests

- `https://things.hsuwai.space/`
- `https://admin.hsuwai.space/`
- `https://chat.hsuwai.space/chat`
- `https://chat.hsuwai.space/chat/dm`
- `https://things.hsuwai.space/api/v1/health` (or any existing API endpoint)
