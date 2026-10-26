#!/usr/bin/env bash
# publish.sh <project_dir> : copy project into grokbot projects/<id>/, update manifest + cover, push, verify live, screenshot.
# Needs <project_dir>/orch.json: {"id","title","subtitle","category","description","accent","added"(YYYY-MM-DD),"src"(optional subdir)}
set -euo pipefail
source "$(dirname "$(readlink -f "$0")")/lib.sh"
P="$(readlink -f "$1")"; ORCH="$P/.orch"; M="$P/orch.json"
[ -f "$M" ] || { log "publish: missing orch.json"; exit 3; }
ID=$(jq -r .id "$M"); SRC="$P/$(jq -r '.src // "."' "$M")"; ADDED=$(jq -r ".added // \"$(date +%F)\"" "$M")
GB="${GROKBOT_DIR:-/workspace/orchestrator/work/grokbot}"
if [ -d "$GB/.git" ]; then git -C "$GB" fetch -q origin && git -C "$GB" reset -q --hard origin/main; else mkdir -p "$(dirname "$GB")"; gh repo clone penny323mo/grokbot "$GB" -- -q 2>&1 | redact; fi
D="$GB/projects/$ID"; rm -rf "$D"; mkdir -p "$D"
tar -C "$SRC" --exclude=.git --exclude=.orch --exclude=prompts --exclude=reviews --exclude=node_modules --exclude=screenshots --exclude=orch.json -cf - . | tar -C "$D" -xf -
mkdir -p "$D/cover"; CH="google-chrome --headless=new --no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=2 --virtual-time-budget=4000"
$CH --window-size=390,520 --screenshot="$ORCH/cover.png" "file://$D/index.html" >/dev/null 2>&1
python3 -c "from PIL import Image;Image.open('$ORCH/cover.png').convert('RGB').resize((780,1040)).save('$D/cover/cover.webp','WEBP',quality=82)"
python3 - "$GB/projects/manifest.json" "$M" "$ADDED" <<'PY'
import json,sys
mf,meta,added=sys.argv[1:]; m=json.load(open(mf)); o=json.load(open(meta)); i=o['id']
e={k:o[k] for k in ('id','title','subtitle','category','description','accent') if k in o}
e.update(path=f"projects/{i}/",added=added,cover=f"projects/{i}/cover/cover.webp")
m['projects']=[e]+[p for p in m['projects'] if p['id']!=i]
m['projects'].sort(key=lambda p:p.get('added',''),reverse=True)
json.dump(m,open(mf,'w'),ensure_ascii=False,indent=2); open(mf,'a').write('\n')
PY
(cd "$GB" && node tests/check_manifest.mjs) || { log "publish: manifest check failed"; exit 4; }
URL="${LIVE_URL_OVERRIDE:-https://penny323mo.github.io/grokbot/projects/$ID/}"
if [ "${DRY_PUBLISH:-0}" = 1 ]; then log "publish: DRY_PUBLISH=1, not pushing (staged in $GB)"; git -C "$GB" status --short | head -5 >> "$ORCH/log.txt"
else git -C "$GB" add -A; git -C "$GB" commit -qm "Add/update $ID via orchestrator" || true; git -C "$GB" push -q origin main 2>&1 | redact; log "publish: pushed grokbot"; fi
code=000; for i in $(seq 1 ${LIVE_TRIES:-40}); do code=$(curl -s -o /dev/null -w '%{http_code}' "$URL?v=$(date +%s)"); [ "$code" = 200 ] && break; sleep 15; done
echo "{\"url\":\"$URL\",\"http\":\"$code\",\"at\":\"$(date -Iseconds)\"}" > "$ORCH/live.json"; log "publish: $URL -> $code"
[ "$code" = 200 ] || exit 5
mkdir -p "$P/screenshots/orch"
$CH --window-size=390,844 --screenshot="$P/screenshots/orch/live-390.png" "$URL" >/dev/null 2>&1
$CH --window-size=390,2200 --screenshot="$P/screenshots/orch/live-390-full.png" "$URL" >/dev/null 2>&1
log "publish: screenshots in screenshots/orch/"
