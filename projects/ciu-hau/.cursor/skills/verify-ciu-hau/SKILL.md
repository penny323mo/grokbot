---
name: verify-ciu-hau
description: Project-local verification skill for 潮候 (Ciu Hau) tide and marine briefing utility, covering local development server launch, environment doctor, headless browser testing, and evidence collection.
---

# verify-ciu-hau · Verification Skill

This skill defines the canonical verification lifecycle for `ciu-hau` (潮候), with special emphasis on mobile-first responsive rendering (390px, 375px, 430px), real-time tide data parsers (HKO Chart Datum & Open-Meteo MSL), SVG curve scrubbing, and evidence preservation.

## 1. Doctor (Environment Check)
Verify node test runner, Python Playwright, and Chromium binary availability:
```bash
node -v
python3 -c "import playwright; print('Playwright Python:', playwright.__file__)"
test -f /home/box/.cache/ms-playwright/chromium-1248/chrome-linux/chrome && echo "Chromium present"
```

## 2. Launch (Local Development Server)
Serve the static web application locally using Python HTTP server:
```bash
python3 -m http.server 8080 --directory /workspace/nightly/2026-11-12-ciu-hau &
SERVER_PID=$!
```

## 3. Drive (Automated Test Execution)
Run the Node unit/integration test suite and headless browser location/scrubbing tests:
```bash
# 1. Node test runner (deterministic unit/integration suite)
npm test

# 2. Headless browser verification suite (driving Chromium with simulated geolocation & finger scrubbing)
python3 tests/test_browser.py
```

## 4. Evidence (Collection & Storage)
Evidence must survive cleanup and be written to `review/build-2026-11-12/`:
- `tests-unit.txt`: stdout and exit code from `npm test`
- `tests-browser.txt`: stdout and exit code from headless browser test suite
- `screenshot-*.png`: headless browser rendering under 390×844 mobile viewport
- `FINDINGS.md`: architecture summary, test matrix, and unverified edge cases

## 5. Cleanup
Terminate background server processes while strictly preserving all generated evidence:
```bash
if [ -n "$SERVER_PID" ]; then
  kill $SERVER_PID 2>/dev/null || true
fi
```
