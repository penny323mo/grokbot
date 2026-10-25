#!/bin/bash
# usage: run-agy.sh <promptfile> <logname> [timeout]
export PATH="$HOME/.local/bin:$HOME/.grok/bin:$PATH"; export DBUS_SESSION_BUS_ADDRESS=$(cat /workspace/dbus.addr)
cd /workspace/nightly/2026-10-26-prompt-studio
S=$(date +%s); echo "START agy-$2 $(date '+%F %T')" >> reviews/progress.txt
timeout ${3:-3000} agy --dangerously-skip-permissions -p "$(cat $1)" 2>&1 | tee reviews/agy-$2.log
echo "END agy-$2 exit=${PIPESTATUS[0]} secs=$(( $(date +%s)-S )) $(date '+%F %T')" >> reviews/progress.txt
