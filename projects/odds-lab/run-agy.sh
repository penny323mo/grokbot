#!/bin/bash
# usage: run-agy.sh <promptfile> <logname>
export PATH="$HOME/.local/bin:$HOME/.grok/bin:$PATH"; export DBUS_SESSION_BUS_ADDRESS=$(cat /workspace/dbus.addr)
cd /workspace/nightly/2026-10-25-odds-lab
S=$(date +%s); echo "START $2 $(date '+%F %T')" >> reviews/progress.txt
timeout ${3:-3000} agy --dangerously-skip-permissions -p "$(cat $1)" > reviews/$2.log 2>&1
echo "END $2 exit=$? secs=$(( $(date +%s)-S )) $(date '+%F %T')" >> reviews/progress.txt
