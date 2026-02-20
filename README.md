# Things

`Things` က Bun + React + Hono ကိုပေါင်းထားတဲ့ full-stack platform တစ်ခုဖြစ်ပြီး content publishing + chat + admin moderation ကို app 3 ခုခွဲပြီး တည်ဆောက်ထားပါတယ်။

- Main web app: `things_web` (`/`)
- Admin app: `admin` (`/admin`)
- Chat app: `chat_app` (`/chat_app`)
- API: Hono (`/api/*`)

## Preview

<img src="./src/assets/things-web-logo.svg" alt="Things Web Logo" width="220" />

Preview Links:
- [things_web screenshot](./src/assets/web-preview.png)
- [admin screenshot](./src/assets/admin-preview.png)
- [chat_app screenshot](./src/assets/chat-app-preview.png)

### things_web

<a href="./src/assets/web-preview.png">
  <img src="./src/assets/web-preview.png" alt="things_web screenshot" width="960" />
</a>

### admin

<a href="./src/assets/admin-preview.png">
  <img src="./src/assets/admin-preview.png" alt="admin screenshot" width="960" />
</a>

### chat_app

<a href="./src/assets/chat-app-preview.png">
  <img src="./src/assets/chat-app-preview.png" alt="chat_app screenshot" width="960" />
</a>

## Project Overview

ဒီ project မှာ အဓိကအားဖြင့် အောက်ပါ feature တွေပါဝင်ပါတယ်။

- Stories / Poems / Series / Episodes CRUD
- Better Auth နဲ့ login/signup + Google social login
- Public profile, follow, presence
- Public chat + direct messages (WebSocket)
- Admin-only moderation, users management, settings
- Redis ရှိရင် realtime event broadcast, မရှိရင် DB/local fallback mode

## Tech Stack

- Runtime: Bun
- Frontend: React 19, React Router, Tailwind CSS, shadcn/ui, Radix UI
- Backend: Hono
- Auth: Better Auth
- Database: PostgreSQL + Drizzle ORM
- Realtime: WebSocket + Cloudflare Durable Object + (optional) Redis/Valkey
- Deployment: Cloudflare Pages + Workers (split) သို့မဟုတ် single Worker

## Architecture (High Level)

1. Browser က `/`, `/admin`, `/chat_app` ကို SPA အဖြစ် load လုပ်တယ်။
2. API request တွေက `/api/v1/*` ကိုသွားပြီး Hono route modules မှာ handle လုပ်တယ်။
3. Auth က Better Auth နဲ့ Postgres table တွေမှာ session/account/user သိမ်းတယ်။
4. Chat realtime က WebSocket (`/api/v1/chat/ws`) + Durable Object + Redis bridge ကိုအသုံးပြုတယ်။

## Prerequisites

- Bun (latest stable)
- PostgreSQL database (local Postgres သို့မဟုတ် Neon)
- Optional: Redis/Valkey (realtime fan-out တိုးချဲ့ဖို့)
- Optional: Cloudflare account (production deploy အတွက်)

## Environment Variables

အလွယ်ဆုံးနည်းက `.env.example` ကို copy လုပ်ပြီး `.env` ပြောင်းသုံးပါ။

```bash
cp .env.example .env
```

ပြီးမှ variable values တွေကို environment အလိုက် ပြင်ပါ။

```bash
# Core (required)
DATABASE_URL=postgresql://user:pass@localhost:5432/things
BETTER_AUTH_SECRET=replace-with-strong-secret
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=replace-me
GOOGLE_CLIENT_SECRET=replace-me

# Admin controls (recommended)
ADMIN_EMAIL=admin@example.com
# ADMIN_EMAILS=admin1@example.com,admin2@example.com

# CORS (recommended in multi-domain environments)
# CORS_ORIGINS=http://localhost:3000,https://example.com

# Optional legacy/extra auth values
# JWT_AUTH_SECRET=replace-me
# GITHUB_CLIENT_ID=replace-me
# GITHUB_CLIENT_SECRET=replace-me

# Optional realtime scaling
# REDIS_URL=redis://localhost:6379
# VALKEY_URL=redis://localhost:6379
```

### Variable Usage Notes

- `DATABASE_URL` မရှိရင် server boot မတက်ပါ။
- `REDIS_URL`/`VALKEY_URL` မရှိလည်း app run နိုင်ပြီး realtime ကို fallback mode သုံးပါမယ်။
- `ADMIN_EMAIL` / `ADMIN_EMAILS` သတ်မှတ်ထားမှ admin-only page/ops ကို email allowlist နဲ့ဝင်နိုင်မယ်။
- `BETTER_AUTH_URL` + `CORS_ORIGINS` ကို production domain နဲ့တူအောင်ထားဖို့လိုပါတယ်။

## Local Setup

1. Install dependencies

```bash
bun install
```

2. Database schema apply

```bash
# Migration files အပေါ်မူတည်ပြီး apply
bunx drizzle-kit migrate

# (သို့) အသစ်စက်စက် database ကို schema တိုက်ရိုက် push
# bunx drizzle-kit push
```

3. Seed initial data (categories)

```bash
bun run seed.ts
```

4. Start development server

```bash
bun dev
```

5. Open in browser

- `http://localhost:3000/`
- `http://localhost:3000/admin`
- `http://localhost:3000/chat_app`
- Health check: `http://localhost:3000/api/healthz`

## Scripts / Commands

- `bun dev` - local development (HMR)
- `bun start` - production mode server run
- `bun run build` - all apps build to `dist/`
- `bun run build:things_web` - only `things_web` build
- `bun run build:admin` - only `admin` build
- `bun run build:chat_app` - only `chat_app` build
- `bun run build:split` - 3 apps ကို `dist/apps/*` သို့ standalone build
- `bun run deploy:things_web` - Cloudflare Pages deploy (`things-web`)
- `bun run deploy:admin` - Cloudflare Pages deploy (`things-admin`)
- `bun run deploy:chat_app` - Cloudflare Pages deploy (`things-chat`)
- `bun run deploy:api` - API worker deploy (`wrangler.api.jsonc`)
- `bun run setup:prod` - Pages projects 3 ခုကို one-time create
- `bun run deploy:prod` - split production deploy all-in-one

## Testing

Project ထဲမှာ route-level test file တွေရှိပါတယ် (Bun test)။

```bash
bun test
```

Example test files:

- `src/server/modules/episodes/episodes.route.test.ts`
- `src/server/modules/poems/poems.route.test.ts`

## API Overview

- Base API path: `/api/v1`
- Main resource routes:
  - `/categories`
  - `/stories`
  - `/series`
  - `/episodes`
  - `/poems`
  - `/profile`
  - `/settings`
  - `/follows`
  - `/presence`
  - `/chat`
  - `/live`
- Auth handler: `/api/auth/*`
- WebSocket endpoint: `/api/v1/chat/ws`

## Repository Structure

```text
src/
  things_web/      # public frontend app
  admin/           # admin frontend app
  chat_app/        # chat-focused frontend app
  server/          # Hono API, modules, websocket, middleware
  db/              # Drizzle schema, migrations, DB helpers
  queries/         # frontend data hooks (TanStack Query)
  interface/       # shared UI components/forms/themes
scripts/
  setup-production.sh
  deploy-production.sh
```

## Deployment

### Option A: Split Deploy (recommended in this repo)

အသုံးပြုတဲ့ service 4 ခု

1. `things-web` (Pages)
2. `things-admin` (Pages)
3. `things-chat` (Pages)
4. `things-api` (Worker)

Runbook:

1. One-time setup

```bash
bun run setup:prod
```

2. Deploy all

```bash
bun run deploy:prod
```

အသေးစိတ်ကို `DEPLOY_SPLIT.md` မှာကြည့်နိုင်ပါတယ်။

### Option B: Mono Worker + Assets

```bash
bun run build
bunx wrangler deploy --config wrangler.mono.jsonc
```

## Troubleshooting

- `DATABASE_URL is not set`
  - `.env` ထဲမှာ `DATABASE_URL` မရှိသေးပါ။ တန်ဖိုးဖြည့်ပြီး server restart လုပ်ပါ။
- CORS error on frontend
  - `CORS_ORIGINS` (သို့) `BETTER_AUTH_URL` ကို လက်ရှိ domain များထည့်ထားကြောင်းစစ်ပါ။
- `Admin access required`
  - login account email ကို `ADMIN_EMAIL` သို့ `ADMIN_EMAILS` ထဲထည့်ပါ။
- Redis warnings in console
  - Redis မရလို့ fallback mode ဝင်တာပါ။ app ပျက်တာမဟုတ်ပါ။

## Security Notes (Important)

- `wrangler*.jsonc` ထဲကို production secret value တွေ hardcode မထားသင့်ပါ။
- Cloudflare production မှာ secret တွေကို `wrangler secret put ...` နဲ့ထားပါ။
- Repo ထဲကို `.env` မတင်ပါနှင့် (`.gitignore` ရှိပြီးသားဖြစ်ရမယ်)။
