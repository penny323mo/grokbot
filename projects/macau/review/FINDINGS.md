# 行澳門 verification · 2026-11-17

Desktop Chrome at a 390×844 viewport. This is not iPhone Safari.

## Unit

`npm test --prefix projects/macau`: 20 passed, 0 failed.
`node tests/check_manifest.mjs`: OK 20 projects.

## Browser

Default 議事亭前地 → 東望洋燈塔, after Valhalla returned:

- 較平 · 23 分鐘 · 爬升 109 米 · 1.6 公里 · 導航指示有 2 處樓梯 · 估算時速約 4.3 公里
- 較短 · 22 分鐘 · 爬升 111 米 · 1.4 公里
- 巴士路線 7、8、2 from the 2026-11-16 DSAT snapshot. No in-vehicle minutes. Map marks stops only.
- `documentElement.scrollWidth` was 390. No element crossed the viewport.
- Source anchors stayed on OpenStreetMap, Valhalla, DSAT, SMG XML, and Open-Meteo.
- `?fail=1` shows 未能計 / 讀唔到 and the labelled demo banner.
- Locate with permission denied: 「你未允許定位，起點保持議事亭前地」.
- Locate with a Macau geolocation: origin becomes 「我而家嘅位置」, destination stays 東望洋燈塔.

## Console

One expected error: the browser blocks `bis.dsat.gov.mo` live positions (no CORS). The sheet says the position could not be read and is not an official empty arrival. Map tiles loaded.

## Not claimed

GitHub Pages is not deployed by this check. Official SMG weather is linked and not shown, because the XML has no CORS and this app does not proxy it.
