---
name: verify-macau
description: Verify 行澳門 shared location, every civic module, provenance, and the 390px layout.
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
- Default ends are 議事亭前地 and 東望洋燈塔, and they stay the same on 行程、就近、天氣、雨勢、潮候、地勢、泊車.
- 行路 shows 較平 and 較短 (or an honest single path), a profile, and stair copy.
- 巴士 shows a dated route, no invented ETA, and pedestrian access times only when the router returns them.
- 就近 does not print the snapshot's identical strings as both a content cutoff and a download time. It says the file does not separate the clocks, keeps the 2026-11-11 audit cutoff as unverified from the JSON, and says the AED count is not an official register.
- 天氣 says the 2026-11-19 SMG probe was HTTP 200 without CORS, links the warning XML files, and labels any temperature as Open-Meteo.
- 雨勢 uses a RainViewer raster source whose maxzoom is 7.
- 潮候 splits Macau mean-sea-level model data from Hong Kong chart-datum extremes, and does not call the Hong Kong list the current Macau water level or a safety judgement.
- 地勢 can tilt when canvas WebGL exists, does not call `maplibregl.supported()`, and says DEM tiles lacked CORS on the 2026-11-19 probe. Heights stay OSM or DEM, or 高度不詳.
- 泊車 shows the 2026-11-18 extract time, no vacancy, and unnamed parks stay unnamed.
- Source anchors stay real links. The back button does not cover the module or mode buttons.
- `?fail=1` shows the labelled failure demo and no invented minutes.
- `document.documentElement.scrollWidth` is not greater than the viewport.
- Console and network failures are recorded. A DSAT CORS failure is an expected unavailable state, not a live arrival.
- Say that the browser is desktop Chrome at 390×844, not iPhone Safari.

## 4. Evidence

Write screenshots and a short note under `projects/macau/review/` and copy the screenshots used in the write-up to the run artifacts directory.
