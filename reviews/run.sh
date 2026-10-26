#!/bin/bash
# usage: run.sh agy|grok promptfile name
export PATH="$HOME/.local/bin:$HOME/.grok/bin:$PATH"; export DBUS_SESSION_BUS_ADDRESS=$(cat /workspace/dbus.addr)
cd /workspace/grokbot; echo "START $1-$3 $(date '+%T')" >> reviews/progress.txt
if [ $1 = agy ]; then timeout 2400 agy --dangerously-skip-permissions -p "$(cat $2)" 2>&1 | tee reviews/agy-$3.log
else timeout 1500 grok -p "$(cat $2)" --always-approve --max-turns 60 2>&1 | tee reviews/grok-$3.log; fi
echo "END $1-$3 exit=${PIPESTATUS[0]} $(date '+%T')" >> reviews/progress.txt
