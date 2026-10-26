#!/usr/bin/env bash
# Shared helpers for the orchestrator. Never echo secrets.
export PATH="$HOME/.local/bin:$HOME/.grok/bin:$PATH"
[ -f /workspace/dbus.addr ] && export DBUS_SESSION_BUS_ADDRESS=$(cat /workspace/dbus.addr)
ORCH_HOME="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
redact() { sed -E 's/(gh[pousr]_[A-Za-z0-9_]{10,}|github_pat_[A-Za-z0-9_]+)/***/g; s#(https://)[^@/ ]+@#\1***@#g' | { if [ -n "${ODDS_API_KEY:-}" ]; then sed "s/${ODDS_API_KEY}/***/g"; else cat; fi; } | { if [ -n "${GH_TOKEN:-}" ]; then sed "s/${GH_TOKEN}/***/g"; else cat; fi; }; }
log() { echo "[$(date '+%F %T')] $*" | redact >> "$ORCH/log.txt"; }
st_get() { jq -r ".$1 // empty" "$ORCH/state.json" 2>/dev/null; }
st_set() { # st_set key json-value
  local tmp; tmp=$(mktemp); jq ".$1 = $2 | .updated = \"$(date -Iseconds)\"" "$ORCH/state.json" > "$tmp" && mv "$tmp" "$ORCH/state.json"; }
