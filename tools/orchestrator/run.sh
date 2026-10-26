#!/usr/bin/env bash
# Usage: run.sh <project_dir> [--rounds N] [--foreground]
# Without --foreground it re-launches itself in detached tmux session orch-<slug> and returns.
set -uo pipefail
source "$(dirname "$(readlink -f "$0")")/lib.sh"
P=""; ROUNDS=""; FG=0
while [ $# -gt 0 ]; do case "$1" in --rounds) ROUNDS="$2"; shift 2;; --foreground) FG=1; shift;; *) P="$1"; shift;; esac; done
[ -d "$P" ] || { echo "usage: run.sh <project_dir> [--rounds N]"; exit 1; }
P="$(readlink -f "$P")"; SLUG="$(basename "$P" | tr -c 'a-zA-Z0-9-\n' '-')"; ORCH="$P/.orch"; mkdir -p "$ORCH" "$P/prompts" "$P/reviews"
VARS="AGY_PANE GROK_PANE AGY_LAUNCH GROK_LAUNCH PHASE_TIMEOUT MAX_ATTEMPTS POLL LAUNCH_WAIT GROKBOT_DIR DRY_PUBLISH LIVE_URL_OVERRIDE LIVE_TRIES STUB_DELAY"
if [ $FG -eq 0 ]; then
  # persist caller's orchestrator overrides (tmux does not inherit env); never secrets
  : > "$ORCH/config.env"; for v in $VARS; do [ -n "${!v:-}" ] && printf 'export %s=%q\n' "$v" "${!v}" >> "$ORCH/config.env"; done
  if [ -f "$ORCH/pid" ] && kill -0 "$(cat "$ORCH/pid")" 2>/dev/null; then echo "already running (pid $(cat "$ORCH/pid")): tmux attach -t orch-$SLUG"; exit 0; fi
  tmux kill-session -t "orch-$SLUG" 2>/dev/null || true
  tmux new-session -d -s "orch-$SLUG" -c "$P" "$(readlink -f "$0") '$P' ${ROUNDS:+--rounds $ROUNDS} --foreground; echo '[orchestrator exited]'; sleep 86400"
  echo "launched: tmux session orch-$SLUG  (status: $ORCH_HOME/status.sh $P)"; exit 0
fi
[ -f "$ORCH/config.env" ] && source "$ORCH/config.env"
# ---- config (env overridable; stub-friendly) ----
AGY_PANE="${AGY_PANE:-agy-pane}"; GROK_PANE="${GROK_PANE:-grok-pane}"
AGY_LAUNCH="${AGY_LAUNCH:-agy --dangerously-skip-permissions -c}"
GROK_LAUNCH="${GROK_LAUNCH:-grok --always-approve -c}"
PHASE_TIMEOUT="${PHASE_TIMEOUT:-2700}"; MAX_ATTEMPTS="${MAX_ATTEMPTS:-2}"; POLL="${POLL:-10}"
GROKBOT_DIR="${GROKBOT_DIR:-/workspace/orchestrator/work/grokbot}"; DRY_PUBLISH="${DRY_PUBLISH:-0}"
if [ ! -f "$ORCH/state.json" ]; then
  echo "{\"phase\":\"build\",\"round\":0,\"rounds\":${ROUNDS:-2},\"started\":\"$(date -Iseconds)\",\"attempts\":{},\"history\":[]}" > "$ORCH/state.json"
elif [ -n "$ROUNDS" ]; then st_set rounds "$ROUNDS"; fi
ROUNDS=$(st_get rounds); echo $$ > "$ORCH/pid"; log "=== orchestrator start pid=$$ phase=$(st_get phase) rounds=$ROUNDS"

ensure_pane() { # name launchcmd
  if ! tmux has-session -t "$1" 2>/dev/null; then
    log "creating tmux session $1 and launching: $2"
    tmux new-session -d -s "$1" -c "$P" -x 200 -y 50; tmux send-keys -t "$1" "cd '$P' && export PATH=\"\$HOME/.local/bin:\$HOME/.grok/bin:\$PATH\" && export DBUS_SESSION_BUS_ADDRESS=\$(cat /workspace/dbus.addr 2>/dev/null) && $2" Enter; sleep "${LAUNCH_WAIT:-12}"
  fi
  local cmd; cmd=$(tmux display -p -t "$1" '#{pane_current_command}')
  if [ "$cmd" = bash ] || [ "$cmd" = sh ]; then case "$2" in *stub*) :;; *) log "$1 at shell prompt; relaunching CLI"; tmux send-keys -t "$1" "cd '$P' && $2" Enter; sleep "${LAUNCH_WAIT:-12}";; esac; fi
}
label() { tmux set -t "$1" status on >/dev/null; tmux set -t "$1" status-left-length 80 >/dev/null; tmux set -t "$1" status-left "#[bg=yellow,fg=black,bold] $2 #[default] " >/dev/null; tmux rename-window -t "$1" "$2" 2>/dev/null; }

write_prompt() { # phase role round -> prompt path (keeps caller-provided prompt if present)
  local f="$P/prompts/orch-$1.txt" s="$ORCH/$1.done"; [ -s "$f" ] && { echo "$f"; return; }
  local spec; spec=$(ls "$P"/SPEC.md "$P"/PLAN.md "$P"/UPGRADE_PLAN.md 2>/dev/null | head -1)
  case "$2:$1" in
    agy:build) echo "You are the coder. cd $P. Read ${spec:-the project brief files} and build the project completely (static, mobile-first, iPhone 390px, relative paths). Add tests under tests/ (node). Do not git commit." > "$f";;
    grok:*) echo "You are a strict senior code reviewer. cd $P. Read ${spec:-the brief} and review the code (round $3). Do NOT modify project files. Run node tests if present; do not launch browsers. Write a numbered review ordered CRITICAL/MAJOR/MINOR with file:line and concrete fix, with a first line 'VERDICT: SHIP' or 'VERDICT: NOT READY', to $P/reviews/orch-r$3-grok.md. Keep to ~15 minutes." > "$f";;
    agy:*) echo "You are the coder. cd $P. Read $P/reviews/orch-r$3-grok.md and fix every CRITICAL and MAJOR issue (MINOR where sensible). Keep matching ${spec:-the brief}. Do not edit reviews/ or prompts/. Run the tests. Append '## Round $3 fixes' to CHANGELOG.md. Do not git commit." > "$f";;
  esac
  printf '\nWHEN COMPLETELY FINISHED, as your very last action, create the file %s containing the word DONE.\nORCH_SENTINEL=%s\n' "$s" "$s" >> "$f"; echo "$f"
}

run_agent() { # phase role round
  local pane launch sentinel f att t0
  [ "$2" = agy ] && { pane=$AGY_PANE; launch=$AGY_LAUNCH; } || { pane=$GROK_PANE; launch=$GROK_LAUNCH; }
  sentinel="$ORCH/$1.done"; [ -f "$sentinel" ] && { log "$1 sentinel already present"; return 0; }
  f=$(write_prompt "$1" "$2" "$3")
  while :; do
    att=$(jq -r ".attempts[\"$1\"] // 0" "$ORCH/state.json")
    # resume: if this attempt's prompt was already sent, keep waiting on it instead of re-sending
    if [ "$(st_get sent_phase)" != "$1#$att" ] || [ "${resumed_once:-}" = "$1#$att" ]; then att=$((att+1)); st_set "attempts[\"$1\"]" "$att"; fi; resumed_once="$1#$att"
    if [ "$att" -gt "$MAX_ATTEMPTS" ]; then log "$1 gave up after $MAX_ATTEMPTS attempts"; echo TIMEOUT > "$sentinel.timeout"; return 1; fi
    ensure_pane "$pane" "$launch"; label "$pane" "ROUND $3 · $2 · $1 (try $att)"
    # if we are resuming an attempt already sent (state.sent_at matches), just keep waiting
    if [ "$(st_get sent_phase)" = "$1#$att" ]; then t0=$(st_get sent_epoch); log "$1 resume waiting (attempt $att)"; else
      [ "$att" -gt 1 ] && msg="The previous attempt timed out. Continue where you left off. Read and follow $f" || msg="Read and follow $f"
      w=0; while tmux capture-pane -p -t "$pane" | tail -3 | grep -qiE "esc to cancel|esc to interrupt"; do [ $w = 0 ] && log "$pane busy; waiting before sending $1"; w=1; date -Iseconds > "$ORCH/heartbeat"; sleep "$POLL"; done
      tmux send-keys -t "$pane" -l "$msg"; sleep 1; tmux send-keys -t "$pane" Enter
      t0=$(date +%s); st_set sent_phase "\"$1#$att\""; st_set sent_epoch "$t0"; log "$1 sent to $pane (attempt $att): $f"; fi
    while [ $(( $(date +%s) - t0 )) -lt "$PHASE_TIMEOUT" ]; do
      [ -f "$sentinel" ] && { log "$1 done in $(( $(date +%s) - t0 ))s"; return 0; }
      scr=$(tmux capture-pane -p -t "$pane" 2>/dev/null | tail -20)
      if echo "$scr" | grep -qE "Allow (Edit|Write) to $P/(reviews|\.orch)/"; then tmux send-keys -t "$pane" 3; sleep .3; tmux send-keys -t "$pane" Enter; log "$1 auto-approved edit under reviews/.orch"; fi
      date -Iseconds > "$ORCH/heartbeat"; sleep "$POLL"
    done
    log "$1 attempt $att timed out after ${PHASE_TIMEOUT}s"
  done
}

run_tests() {
  local out="$ORCH/tests-$1.txt" rc=0; : > "$out"
  if [ -f "$P/package.json" ] && jq -e .scripts.test "$P/package.json" >/dev/null; then (cd "$P" && timeout 600 npm test) >> "$out" 2>&1 || rc=1
  else for t in "$P"/tests/*.test.js "$P"/tests/*.test.mjs "$P"/tests/*.test.cjs "$P"/tests/test_*.py; do [ -f "$t" ] || continue
    case "$t" in *.py) (cd "$P" && timeout 300 python3 "$t") >> "$out" 2>&1 || rc=1;; *) (cd "$P" && timeout 300 node "$t") >> "$out" 2>&1 || rc=1;; esac; done; fi
  [ -s "$out" ] && log "tests after $1: $([ $rc = 0 ] && echo PASS || echo FAIL) ($out)"; return 0
}
commit() {
  [ -d "$P/.git" ] || { git -C "$P" init -q -b main && log "git init"; }
  printf '.orch/pid\n.orch/heartbeat\n' > "$P/.git/info/exclude"
  git -C "$P" config user.email >/dev/null || { git -C "$P" config user.name "penny323mo"; git -C "$P" config user.email "penny323mo@users.noreply.github.com"; }
  git -C "$P" add -A && git -C "$P" commit -qm "orch: $1" >/dev/null 2>&1 && log "committed: $1"
  git -C "$P" remote get-url origin >/dev/null 2>&1 && { git -C "$P" push -q origin HEAD 2>&1 | redact | tail -2 >> "$ORCH/log.txt" || true; }
}
advance() { st_set history "(.history + [{\"phase\":\"$(st_get phase)\",\"at\":\"$(date -Iseconds)\"}])"; st_set phase "\"$1\""; st_set round "$2"; }

while :; do
  ph=$(st_get phase); r=$(st_get round)
  case "$ph" in
    build) run_agent build agy 0; run_tests build; commit "build"; advance review-1 1;;
    review-*) run_agent "$ph" grok "$r"; commit "$ph"; advance "fix-$r" "$r";;
    fix-*) run_agent "$ph" agy "$r"; run_tests "$ph"; commit "$ph"
           if [ "$r" -lt "$ROUNDS" ]; then advance "review-$((r+1))" $((r+1)); else advance publish "$r"; fi;;
    publish) "$ORCH_HOME/publish.sh" "$P" >> "$ORCH/log.txt" 2>&1; rc=$?
             if [ $rc -ne 0 ]; then log "publish failed rc=$rc; will retry on next run"; st_set error "\"publish rc=$rc\""; exit 1; fi
             commit publish; advance report "$r";;
    report) "$ORCH_HOME/report.sh" "$P"; commit report; advance done "$r";;
    done) date -Iseconds > "$ORCH/DONE"; log "=== DONE"; label "$AGY_PANE" "ORCH DONE"; label "$GROK_PANE" "ORCH DONE"; rm -f "$ORCH/pid"; exit 0;;
    *) log "unknown phase $ph"; exit 2;;
  esac
done
