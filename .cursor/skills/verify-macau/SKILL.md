---
name: verify-macau
description: Verify 行澳門 shared trip state, walk and bus modes, provenance, and the 390px layout.
---

# verify-macau

Run from the repo root. This checks the unified app in `projects/macau/`. It does not treat a headless browser as iPhone Safari, and it does not treat a green test as a deployment.

## 1. Doctor

```bash
node -v
test -f projects/macau/index.html && echo "app present"
test -f projects/macau/data/source-check.json && echo "source note present"
```

## 2. Unit tests

```bash
npm test --prefix projects/macau
node tests/check_manifest.mjs
```

`check_manifest.mjs` needs `projects/macau/cover/thumb.webp`.

## 3. Browser

Serve the repo root, not only `projects/macau/`, so `../ce-lou/` and `../dim-heoi/` resolve.

```bash
python3 -m http.server 8765 --directory /workspace
```

Open `http://127.0.0.1:8765/projects/macau/` at 390×844.

Confirm:

- Map is the large top surface; 放大地圖 collapses the sheet.
- Default ends are 議事亭前地 and 東望洋燈塔.
- 行路 shows 較平 and 較短 (or an honest single path), a profile, and stair copy.
- 巴士 shows a dated route and says the road path is not drawn.
- Source anchors for OpenStreetMap, Valhalla, DSAT and SMG stay real links.
- `?fail=1` shows the labelled failure demo and no invented minutes.
- `document.documentElement.scrollWidth` is not greater than the viewport.
- Console and network failures are recorded. A DSAT 403 or CORS failure is an expected unavailable state, not a live arrival.

## 4. Evidence

Write screenshots and a short note under `projects/macau/review/` and copy the screenshots used in the write-up to the run artifacts directory.
