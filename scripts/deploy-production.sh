#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

THINGS_WEB_PROJECT="things-web"
ADMIN_PROJECT="things-admin"
CHAT_PROJECT="things-chat"
API_CONFIG="wrangler.api.jsonc"
THINGS_WEB_DIR="dist/apps/things_web"
ADMIN_DIR="dist/apps/admin"
CHAT_DIR="dist/apps/chat_app"

echo "==> Production deploy (hardcoded targets)"
echo "    things_web -> ${THINGS_WEB_PROJECT} (things.hsuwai.space)"
echo "    admin      -> ${ADMIN_PROJECT} (admin.hsuwai.space)"
echo "    chat_app   -> ${CHAT_PROJECT} (chat.hsuwai.space)"
echo "    api worker -> things-api"
echo

echo "==> Building all frontends"
bun run build:split

echo
echo "==> Deploying Pages apps"
bunx wrangler pages deploy "${THINGS_WEB_DIR}" --project-name "${THINGS_WEB_PROJECT}"
bunx wrangler pages deploy "${ADMIN_DIR}" --project-name "${ADMIN_PROJECT}"
bunx wrangler pages deploy "${CHAT_DIR}" --project-name "${CHAT_PROJECT}"

echo
echo "==> Deploying API Worker"
bunx wrangler deploy --config "${API_CONFIG}"

echo
echo "==> Done. Smoke test URLs:"
echo "    https://things.hsuwai.space/"
echo "    https://admin.hsuwai.space/"
echo "    https://chat.hsuwai.space/chat"
echo "    https://chat.hsuwai.space/chat/dm"
