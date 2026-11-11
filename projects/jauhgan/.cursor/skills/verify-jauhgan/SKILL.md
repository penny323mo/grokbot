---
name: verify-jauhgan
description: Project-local verification skill for 就近 (Just Around) mobile civic wayfinding utility, covering local server launch, environment doctor, headless test driving, and evidence collection.
---

# verify-jauhgan · Verification Skill

This skill defines the canonical verification lifecycle for `jauhgan` (就近), with special emphasis on headless browser verification, geolocation flow, truthfulness, and evidence preservation.

## 1. Doctor (Environment Check)
Check system dependencies, Node test runner, and headless browser binaries:
```bash
node -v
python3 -c "import playwright; print('Playwright Python:', playwright.__file__)"
test -f /home/box/.cache/ms-playwright/chromium-1248/chrome-linux/chrome && echo "Chromium present"
```

## 2. Launch (Local Development Server)
Serve the static web application locally using Python HTTP server or Node static server:
```bash
# Launch background server on port 8080 (or ephemeral port)
python3 -m http.server 8080 --directory /workspace/nightly/2026-11-11-jauhgan &
SERVER_PID=$!
```

## 3. Drive (Automated Test Execution)
Run the Node unit/integration test suite and headless browser location tests:
```bash
# 1. Node test runner (fast deterministic unit/integration suite)
npm test

# 2. Headless browser location suite (driving Chromium with simulated geolocation & permissions)
python3 tests/test_location_browser.py
```

## 4. Evidence (Collection & Storage)
Evidence must survive cleanup and be written to `review/fix-location-2026-11-11/`:
- `tests-unit.txt`: stdout and exit code from `npm test`
- `tests-location.txt`: stdout and exit code from headless browser test suite
- `screenshot-*.png`: headless browser rendering under 390×844 mobile viewport
- `FINDINGS.md`: root cause analysis, test matrix, and unverified edge cases

## 5. Cleanup
Terminate background server processes while strictly preserving all generated evidence:
```bash
if [ -n "$SERVER_PID" ]; then
  kill $SERVER_PID 2>/dev/null || true
fi
```

## 6. Feature Maps
- [Location Flow Feature Map](file:///workspace/nightly/2026-11-11-jauhgan/.cursor/skills/verify-jauhgan/features/location-flow.md)
