# 行澳門 verification · 2026-11-18

Desktop Chrome at 390×844. Not iPhone Safari. Not a deployment.

## Tests

`npm test --prefix projects/macau`: 27 passed, 0 failed.

## Browser

Shared ends stayed 議事亭前地 → 東望洋燈塔 across 行程、就近、天氣、雨勢、潮候、地勢、泊車.
`scrollWidth` was 390. Map height about 456px. The back button did not overlap the module, mode, or route buttons.

- 行程: 較平 23 分鐘 / 爬升 109 米 / 1.6 公里 / 2 處樓梯, and 較短 22 分鐘 / 111 米 / 1.4 公里.
- 就近: OSM extract content and download time 2026-11-10. Straight-line metres labelled as not a walking time. No vacancy.
- 天氣: SMG XML HTTP 200 without CORS. Open-Meteo about 25.2 degrees at model time 2026-11-18T14:30.
- 雨勢: RainViewer 14:30, no nowcast, not official. Raster maxzoom is 7.
- 潮候: 0.51 m above mean sea level, not chart datum. Official tide unavailable. No safety judgement.
- 地勢: OSM or DEM heights, or 高度不詳.
- 泊車: extract 2026-11-18T00:51. Unnamed parks stay unnamed. One pedestrian leg about 14 minutes. No vacancy.

Console: the expected DSAT live-position CORS error only.
