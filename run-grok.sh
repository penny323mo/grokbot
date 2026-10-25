#!/bin/bash
# usage: run-grok.sh <promptfile> <name> [timeout]
export PATH="$HOME/.local/bin:$HOME/.grok/bin:$PATH"; export DBUS_SESSION_BUS_ADDRESS=$(cat /workspace/dbus.addr)
cd /workspace/nightly/2026-10-26-prompt-studio
S=$(date +%s); echo "START grok-$2 $(date '+%F %T')" >> reviews/progress.txt
timeout ${3:-1800} grok -p "$(cat $1)" --always-approve --max-turns 80 2>&1 | tee reviews/grok-$2.log
echo "END grok-$2 exit=${PIPESTATUS[0]} secs=$(( $(date +%s)-S )) $(date '+%F %T')" >> reviews/progress.txt
