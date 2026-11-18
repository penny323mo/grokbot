# 行澳門 verification · 2026-11-19 01:01 Asia/Macau

Desktop Chrome at 390×844. Not iPhone Safari. Not a deployment. https://penny323mo.github.io/grokbot/projects/macau/ was HTTP 404 at 00:55 and is not claimed live.

## Tests

`npm test --prefix projects/macau`: 30 passed, 0 failed.
`node tests/check_manifest.mjs`: OK, 21 projects.

## Browser

Shared ends stayed 議事亭前地 → 東望洋燈塔. `scrollWidth` was 390. Map height about 456px. The back button did not overlap the module, mode, or filter controls. No page errors. The only expected console error on the trip load is DSAT live-position CORS.

- 就近: the file's two timestamp fields are the same string `2026-11-10T09:08:00Z`, so the UI does not call them a verified content cutoff and download time. The 2026-11-11 audit cutoff 2026-11-10 05:22 is shown as not re-verified from this JSON. AED count in the extract is 3, labelled not an official register.
- 天氣: SMG actual weather probed 2026-11-19 01:01 Macau, HTTP 200, SysPubdate 2026-11-19 00:50, Last-Modified 2026-11-18 16:54:09 GMT, no CORS. Warning XML links stay as links. Open-Meteo was about 19 degrees at model time 2026-11-19T01:00.
- 潮候: Hong Kong Observatory Tai O high and low tides on chart datum, explicitly not Macau water and not the current level. Open-Meteo about 0.99 m above mean sea level at 2026-11-19T01:00.
- 地勢: 傾斜睇 switches to 放平. Canvas WebGL is present. DEM tiles were HTTP 200 without CORS, so the page does not claim a loaded relief model. Heights stay OSM or DEM, or 高度不詳.

## Probes at 2026-11-18T17:01:01Z

- DSAT route list and live bus: HTTP 403, no CORS.
- Official parking gateway: not a usable no-key vacancy feed.
- data.gov.mo homepage reflects the GitHub Pages origin, but the paths tried returned HTML, not a documented weather JSON.
- HKO HLT/HHOT with the documented station, year, month, and day parameters: HTTP 200, CORS `*`.
