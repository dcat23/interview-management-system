#!/bin/sh
# Vercel "Ignored Build Step": exit 0 skips the build, exit 1 runs it.
# Builds only when $NX_APP (or anything it depends on) is affected since the last deploy.
[ -n "$NX_APP" ] || { echo "NX_APP is not set, building"; exit 1; }

BASE="${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}"
git cat-file -e "$BASE^{commit}" 2>/dev/null || BASE="HEAD^"

pnpm install --frozen-lockfile --ignore-scripts > /dev/null 2>&1 || { echo "Install failed, building"; exit 1; }

if NX_DAEMON=false npx nx show projects --affected --base="$BASE" --head=HEAD | grep -qx "$NX_APP"; then
  echo "$NX_APP is affected since $BASE, building"
  exit 1
fi
echo "$NX_APP is not affected since $BASE, skipping"
exit 0
