#!/usr/bin/env bash
# Fake interactive agent: reads "Read and follow <file>" lines, sleeps STUB_DELAY, writes requested files + sentinel.
echo "stub agent ($1) ready"
while IFS= read -r line; do f=$(echo "$line" | grep -o '/[^ ]*\.txt' | tail -1); [ -f "$f" ] || continue
  echo "working on $f"; sleep "${STUB_DELAY:-20}"
  rv=$(grep -o '/[^ ]*reviews/orch-r[0-9]*-grok\.md' "$f" | head -1); grep -q 'strict senior code reviewer' "$f" && [ -n "$rv" ] && printf 'VERDICT: SHIP\n1. MINOR stub finding\n' > "$rv"
  grep -q '^You are the coder' "$f" && { d=$(grep -o 'cd [^ .]*' "$f" | head -1 | cut -c4-); echo "<!doctype html><title>t</title><h1>Orch test $(date +%T)</h1>" > "$d/index.html"; echo "## stub $(date +%T)" >> "$d/CHANGELOG.md"; }
  s=$(grep -o 'ORCH_SENTINEL=.*' "$f" | cut -d= -f2); echo DONE > "$s"; echo "wrote $s"; done
