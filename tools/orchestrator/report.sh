#!/usr/bin/env bash
# report.sh <project_dir> : write REPORT.md from state, reviews, tests, live check.
source "$(dirname "$(readlink -f "$0")")/lib.sh"
P="$(readlink -f "$1")"; ORCH="$P/.orch"; R="$P/REPORT.md"
{ echo "# $(jq -r '.title // .id' "$P/orch.json" 2>/dev/null || basename "$P") — orchestrator report"
  echo; echo "- Generated: $(date '+%F %H:%M') (Macau, UTC+8)"
  echo "- Live: $(jq -r .url "$ORCH/live.json" 2>/dev/null) (HTTP $(jq -r .http "$ORCH/live.json" 2>/dev/null))"
  echo "- Rounds: $(jq -r .rounds "$ORCH/state.json")  ·  Started: $(jq -r .started "$ORCH/state.json")"
  echo; echo "## Phases"; jq -r '.history[] | "- \(.phase) finished \(.at)"' "$ORCH/state.json"
  ls "$ORCH"/*.timeout >/dev/null 2>&1 && { echo; echo "## Timeouts"; for f in "$ORCH"/*.timeout; do echo "- $(basename "$f" .done.timeout) gave up (agent never wrote sentinel)"; done; }
  echo; echo "## Reviews"; for f in "$P"/reviews/orch-r*-grok.md; do [ -f "$f" ] && echo "- $(basename "$f"): $(grep -m1 -i 'verdict' "$f" || echo 'no verdict line')"; done
  echo; echo "## Tests"; for f in "$ORCH"/tests-*.txt; do [ -s "$f" ] && { echo "### $(basename "$f" .txt)"; echo '```'; tail -8 "$f"; echo '```'; }; done
  echo; echo "## Screenshots"; ls "$P"/screenshots/orch/*.png 2>/dev/null | sed "s#$P/#- #"
  [ -f "$P/CHANGELOG.md" ] && { echo; echo "## Changelog (tail)"; tail -25 "$P/CHANGELOG.md"; }
} | redact > "$R"; log "report written: $R"
