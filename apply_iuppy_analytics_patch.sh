#!/usr/bin/env bash
set -euo pipefail

# Usage: bash apply_iuppy_analytics_patch.sh
# Assumes you run from the monorepo root and that:
# - backend file lives at backend/src/v2/analytics/analytics.service.ts
# - frontend file lives at frontend/src/analytics/views/ContentsOverviewPage.tsx

if [ ! -f backend.patch ] || [ ! -f frontend.patch ]; then
  echo "Please place backend.patch and frontend.patch in the repo root before running this script."
  exit 1
fi

echo "Applying backend.patch into backend/src/v2 ..."
patch -p0 -d backend/src/v2 < backend.patch

echo "Applying frontend.patch into frontend/src ..."
patch -p0 -d frontend/src < frontend.patch

echo "Done. If you saw 'Hunk FAILED', see .rej files for manual merge."
