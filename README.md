# Things

Full-stack Bun app with a React + Tailwind + shadcn/ui frontend and a Hono API + Better Auth + Drizzle/Postgres backend.

**Tech Stack**
- Bun
- React 19
- Tailwind CSS
- shadcn/ui + Radix UI
- Hono
- Better Auth
- Drizzle ORM + Postgres

**Requirements**
- Bun installed
- Postgres database

**Quick Start**
1. Install dependencies.
```bash
bun install
```
2. Create a `.env` file and set required variables.
```bash
# required
DATABASE_URL=postgres://user:pass@localhost:5432/dbname
BETTER_AUTH_SECRET=replace-me
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=replace-me
GOOGLE_CLIENT_SECRET=replace-me

# optional (only if enabled in your auth setup)
JWT_AUTH_SECRET=replace-me
GITHUB_CLIENT_ID=replace-me
GITHUB_CLIENT_SECRET=replace-me

# optional (enables Redis-backed random feeds for poems/stories/series)
REDIS_URL=redis://localhost:6379
```
3. Start the dev server.
```bash
bun dev
```

**Commands**
- `bun dev` runs the Bun server with HMR using `index.ts`.
- `bun run build.ts` builds static assets to `dist/`.
- `bun run build:split` builds split frontend outputs for Pages.
- `bun run deploy:things_web` deploys things_web Pages build.
- `bun run deploy:admin` deploys admin Pages build.
- `bun run deploy:chat_app` deploys chat_app Pages build.
- `bun run deploy:api` deploys API worker using `wrangler.api.jsonc`.
- `bun run setup:prod` creates production Pages projects (hardcoded names).
- `bun run deploy:prod` deploys all 3 Pages apps + API worker in one run.
- `bun start` starts the production server (uses `NODE_ENV=production`).
- `bun run seed.ts` seeds initial database data.

**App Routes**
- `things_web`: `/`
- `admin`: `/admin`
- `chat_app`: `/chat_app`

**Project Layout**
- `src/things_web/` main web app entry (`index.html`, `index.tsx`)
- `src/admin/` admin app entry (`index.html`, `index.tsx`)
- `src/chat_app/` chat app entry (`index.html`, `index.tsx`)
- `src/server/` API server and routes
- `src/db/` Drizzle schema and database setup
- `src/` UI, features, and shared code

**API**
- Base path: `/api/v1`
- Routes: `/categories`, `/stories`, `/series`, `/episodes`, `/profile`

**Notes**
- `better-auth` requires the database and secrets above to be configured.
- If you change the server entrypoint, update the `start` script in `package.json`.
- For split deployment (3 Pages + 1 Worker), see `DEPLOY_SPLIT.md`.
