#!/bin/bash
set -euo pipefail
P="$(cd "$(dirname "$0")/.." && pwd)"
GB="${GROKBOT_DIR:-/workspace/orchestrator/work/grokbot}"
cp "$P/assets/art/cover.webp" "$GB/projects/harbour-casebook/cover/cover.webp"
cp "$P/assets/art/thumb.webp" "$GB/projects/harbour-casebook/cover/thumb.webp" 2>/dev/null || true
cd "$GB"
git add projects/harbour-casebook/cover/
git commit -qm "harbour-casebook: restore key-art cover (avoid blank publish shot)" || true
git push -q origin main
echo restored
