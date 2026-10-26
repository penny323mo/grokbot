#!/usr/bin/env bash
# status.sh <project_dir>
P="$(readlink -f "${1:?usage: status.sh <project_dir>}")"; O="$P/.orch"; S=$(basename "$P" | tr -c 'a-zA-Z0-9-\n' '-')
[ -f "$O/state.json" ] || { echo "no orchestrator state in $P"; exit 1; }
jq -r '"phase=\(.phase) round=\(.round)/\(.rounds) attempts=\(.attempts|tostring) updated=\(.updated // .started)"' "$O/state.json"
if [ -f "$O/DONE" ]; then echo "DONE at $(cat "$O/DONE")"; elif [ -f "$O/pid" ] && kill -0 "$(cat "$O/pid")" 2>/dev/null; then echo "RUNNING pid $(cat "$O/pid") (tmux orch-$S); heartbeat $(cat "$O/heartbeat" 2>/dev/null)"; else echo "NOT RUNNING — resume: $(dirname "$(readlink -f "$0")")/run.sh $P"; fi
echo "--- log tail"; tail -6 "$O/log.txt"
