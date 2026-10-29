#!/usr/bin/env bash
# Restore studio cover/thumb after publish overwrites with title screenshot.
set -euo pipefail
P="$(cd "$(dirname "$0")/.." && pwd)"
GB="${GROKBOT_DIR:-/workspace/orchestrator/work/grokbot}"
ID=$(jq -r .id "$P/orch.json")
D="$GB/projects/$ID/cover"
mkdir -p "$D"
cp -f "$P/assets/art/cover.webp" "$D/cover.webp"
cp -f "$P/assets/art/thumb.webp" "$D/thumb.webp"
echo "restored cover+thumb → $D"
# If already pushed blank, amend push
if [ "${PUSH:-0}" = 1 ]; then
  git -C "$GB" add "projects/$ID/cover/cover.webp" "projects/$ID/cover/thumb.webp"
  git -C "$GB" commit -qm "Restore $ID studio cover" || true
  git -C "$GB" push -q origin main
fi
