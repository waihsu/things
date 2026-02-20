#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

THINGS_WEB_PROJECT="things-web"
ADMIN_PROJECT="things-admin"
CHAT_PROJECT="things-chat"
PRODUCTION_BRANCH="main"
MAX_RETRIES=5

project_exists() {
  local project_name="$1"

  local list_output
  list_output="$(bunx wrangler pages project list --json 2>/dev/null || true)"
  if echo "$list_output" | rg -q "\"Project Name\"\\s*:\\s*\"${project_name}\""; then
    return 0
  fi

  return 1
}

create_pages_project_if_missing() {
  local project_name="$1"
  echo "==> Ensuring Pages project exists: ${project_name}"

  if project_exists "${project_name}"; then
    echo "    Project already exists: ${project_name}"
    return
  fi

  local attempt=1
  while [ "$attempt" -le "$MAX_RETRIES" ]; do
    echo "    Create attempt ${attempt}/${MAX_RETRIES}..."

    if bunx wrangler pages project create "${project_name}" --production-branch "${PRODUCTION_BRANCH}"; then
      echo "    Project created: ${project_name}"
      return
    fi

    if project_exists "${project_name}"; then
      echo "    Project now exists after failed response, continuing: ${project_name}"
      return
    fi

    if [ "$attempt" -lt "$MAX_RETRIES" ]; then
      local wait_seconds=$((attempt * 4))
      echo "    Cloudflare API temporary failure. Retrying in ${wait_seconds}s..."
      sleep "${wait_seconds}"
    fi

    attempt=$((attempt + 1))
  done

  echo "ERROR: Could not create project '${project_name}' after ${MAX_RETRIES} attempts."
  echo "Try running manually after 1-2 minutes:"
  echo "  bunx wrangler pages project create ${project_name} --production-branch ${PRODUCTION_BRANCH}"
  exit 1
}

echo "==> Cloudflare production setup (hardcoded)"
echo "    things_web: ${THINGS_WEB_PROJECT}"
echo "    admin:      ${ADMIN_PROJECT}"
echo "    chat_app:   ${CHAT_PROJECT}"
echo

create_pages_project_if_missing "${THINGS_WEB_PROJECT}"
sleep 2
create_pages_project_if_missing "${ADMIN_PROJECT}"
sleep 2
create_pages_project_if_missing "${CHAT_PROJECT}"

echo
echo "==> One-time dashboard checks (manual)"
echo "1) Pages Custom Domains"
echo "   - ${THINGS_WEB_PROJECT} -> things.hsuwai.space"
echo "   - ${ADMIN_PROJECT} -> admin.hsuwai.space"
echo "   - ${CHAT_PROJECT} -> chat.hsuwai.space"
echo "2) API Worker Secrets (wrangler.api.jsonc config)"
echo "   - DATABASE_URL"
echo "   - BETTER_AUTH_SECRET"
echo "   - JWT_AUTH_SECRET"
echo "   - GOOGLE_CLIENT_SECRET"
echo "   - GITHUB_CLIENT_SECRET"
echo "   - REDIS_URL"
echo
echo "Setup complete."
