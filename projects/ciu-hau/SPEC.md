# 潮候 · Ciu Hau — SPEC

Nightly 2026-11-12 (Asia/Macau). A practical, everyday tide-and-sea tool — not a game, and not a facilities map. Portrait iPhone-first (390×844, also 375×667 and 430×932), iPhone Safari first. Static web (HTML/CSS/JS, relative paths, no required build step to run). Deploys under grokbot `projects/ciu-hau/`. All user-facing text in natural spoken Cantonese (Traditional Chinese). No English UI copy except unavoidable proper nouns, official station names, and datum abbreviations explained in Cantonese.

Visual quality is the #1 priority: it must feel like a commercial editorial marine briefing, not a dashboard of metric cards or a student chart demo.

## Variety proof (vs last 5 nightlies)

| | Tonight: 潮候 | 就近 (11-11) | 霜門守望 (11-04) | 鋦瓷記 (11-03) | 十號風球 (11-01) | 季風帆影 (10-31) |
|---|---|---|---|---|---|---|
| Type | live tide + marine briefing (real open data) | live map utility (POI) | real-time tower defence | craft puzzle + story | historical forecasting sim | trade sim |
| Subject | tide height, next high/low, waves, sea temp, wind | nearby toilets, car parks, water, pharmacies, AED, clinics | fantasy glacier siege | porcelain mending | typhoon signal decisions | monsoon trade voyages |
| Setting | present-day Macau and nearby HK waters | present-day Macau / HK streets | invented glacier kingdom | 1957 Yau Ma Tei | 1962 Royal Observatory | 1600 Macau |
| Style | cool daylight typographic chart, Swiss grid, editorial figures | light civic wayfinding, warm bone paper | matte low-poly clay diorama | oil painting | period charts / paper | painted nanban screen |
| Interaction | scrub a 48-hour tide curve; switch stations; read next extreme | locate, filter, tap a place, walk-time, directions | build / upgrade / aim, pan + pinch | slow staged craft taps | read + decide | choose routes |
| Palette | cool field #F4F6F8, prussian ink #161C24, slate-blue #3D6B9A | bone paper, dry ink, persimmon, olive | glacier teal, indigo, saffron | cobalt, amber, teak | slate, signal red | ochre, indigo, gold |

No old Hong Kong / Macau nostalgia, no 1950s–70s street-life setting, no painterly oil look, no slow craft-and-story format. 就近 already covered nearby facilities on a 2D map — tonight is a time-series briefing, not another POI map. 十號風球 was a historical typhoon *game*; tonight is not a warning sim and has no story, signals or period charts. Weather appears only as live wind, and as sunrise/sunset, to read the sea.

## Premise

You are in Macau (or nearby Hong Kong waters) and need to know: how high is the water *now*, is it still rising or already falling, and when is the next high or low? Open 潮候, see a calm typographic tide curve for the next two days, plus wave height, sea temperature and wind. If location is denied or unavailable, start at **澳門內港** (Porto Interior, **22.1937, 113.5310**) and say so plainly: 「而家用澳門內港做起點（未開定位）」.

Tone: serious, precise, useful. Like a well-designed harbour briefing, not a surf-bro app and not a toy gauge.

Always show, in Cantonese, that **this is not for navigation**: 「資料唔適用於航行，亦唔可以代替官方潮汐表。」

## Data sources (real, no keys, no invented numbers)

Cite source name, licence and a visible update/forecast time in the UI. If a fetch fails, show an honest empty/error state in Cantonese — never a made-up height, time or wave.

### 1. Hong Kong official astronomical tides — Hong Kong Observatory Open Data API

- High/low times and heights (HLT): `https://data.weather.gov.hk/weatherAPI/opendata/opendata.php?dataType=HLT&rformat=json&station={CODE}&year={YYYY}&month={M}&day={D}`
- Hourly heights (HHOT): same host, `dataType=HHOT`, same station/year/month/day parameters.
- Verified live on 2026-11-12, CORS `Access-Control-Allow-Origin: *`, no API key.
- Docs: `https://data.weather.gov.hk/weatherAPI/doc/HKO_Open_Data_API_Documentation.pdf`
- Licence: [HKSARG Open Data Licence](https://data.gov.hk/en/terms) — free use with attribution. Credit 「香港天文台」in the UI.
- Heights are in **metres above Chart Datum** (海圖基準面). Label this every time an HKO height is shown.
- HHOT fields `01`…`24` are hour-ending clock hours; `24` is 24:00 (midnight at the end of that date). HLT times are `HHMM` strings (e.g. `"0541"`).
- Confirmed 2026-11-12 Tai O (TAO) HLT shape: `{"fields":["Month","Date","Time","Height(m)",…],"data":[["11","12","0541","0.49","1250","1.68","1621","1.46","2230","2.68"]]}`.
- Stations to ship (code, Cantonese name, WGS84):
  - `TAO` 大澳 22.2547, 113.8635
  - `SPW` 石壁 22.2197, 113.8947
  - `CLK` 赤鱲角 22.3040, 113.9430
  - `CCH` 長洲 22.2080, 114.0280
  - `QUB` 鰂魚涌 22.2910, 114.2130
  - `WAG` 橫瀾島 22.1820, 114.3030

Use HLT for official extreme times/heights, HHOT for the smooth official curve. Interpolate the “now” height from HHOT (piecewise linear between adjacent hours). Do not invent extremes the HLT row did not contain.

### 2. Macau and model marine / sea level — Open-Meteo Marine API (no key)

- Endpoint: `https://marine-api.open-meteo.com/v1/marine`
- Verified live on 2026-11-12 for Macau waters (CORS `*`).
- Request `timezone=Asia/Macau`, `cell_selection=sea`, `forecast_days=3`.
- Current + hourly: `sea_level_height_msl`, `sea_surface_temperature`, `wave_height`, `wave_direction`, `wave_period`, `wind_wave_height`, `swell_wave_height`.
- Licence: [CC-BY 4.0](https://open-meteo.com/en/license). Credit 「Open-Meteo」and the marine model in the UI.
- `sea_level_height_msl` is **metres above global mean sea level**, includes a modelled tide, coastal accuracy is limited, **not a local chart datum**. Open-Meteo itself warns this is not suitable for coastal navigation.
- Derive high/low from local maxima/minima of the hourly series (a peak is 高潮, a trough is 低潮). Times are only as fine as the hourly step — say 「約 HH:MM」, never pretend they are official almanac times.
- Macau points (model only; no official machine-readable tide API is used):
  - 澳門內港 22.1937, 113.5310 (default)
  - 媽閣 22.1848, 113.5316
  - 黑沙 22.1190, 113.5690
  - 竹灣 22.1210, 113.5510
  - 外港碼頭 22.1986, 113.5588

Macau’s official tables are published by 海事及水務局 (DSAMA) and live observations appear on [地球物理氣象局實時潮汐](https://www.smg.gov.mo/zh/subpage/73/tide) and [DSAMA 潮汐查詢](https://www.marine.gov.mo/tide_search.aspx). There is no free no-key JSON API for those official Macau tables, so **do not scrape them**. For every Macau point, label the curve as 「Open-Meteo 模式預測（非官方潮汐表）」and offer a text link to the two official pages above.

### 3. Wind, air temperature, sunrise, sunset — Open-Meteo Weather API (no key)

- Endpoint: `https://api.open-meteo.com/v1/forecast`
- `current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code`
- `daily=sunrise,sunset`
- `timezone=Asia/Macau` (or `Asia/Hong_Kong` for HK stations).
- Same CC-BY 4.0 credit. Do not invent a temperature or a sunrise.

### Datum rule (hard)

HKO Chart Datum heights and Open-Meteo MSL heights are **different vertical datums**. Never plot them on one unlabelled axis as if they were comparable. Never convert between them with a guessed offset. A station uses one source for its tide curve. The marine strip (waves, SST) may still come from Open-Meteo under an HKO tide station — that is weather, not a second tide series.

## Art direction

Name three real commercial references and stay close to them. Do not invent a fourth “AI SaaS” look.

1. **Josef Müller-Brockmann** typographic concert posters — a Swiss grid, one confident curve as a composed graphic, generous field, hierarchy by type size not by boxes.
2. **WillyWeather** tide view — the 24–48h graph is the stage; next high/low are instantly readable; chrome is almost absent.
3. **yr.no** — numbers as typography, source and time told honestly, light surfaces, no decoration for its own sake.

Forbidden: dark glass, neon, gradient meshes, generic stacked white cards with drop shadows, Inter/Roboto “startup” look, emoji-as-icons, playful mascots, skeuomorphic paper, nautical clip-art (wheels, anchors, ropes), navy-on-navy “ocean theme”, warm bone-paper civic UI (that was 就近), glacier teal / saffron (霜門), oil-paint cobalt/amber, period telegram charts, gold nanban screens.

### Palette

- Field: `#F4F6F8` (cool daylight, not warm bone paper)
- Ink: `#161C24`
- Stone / rules / quiet UI: `#C8D0D6` and `#6B7380`
- Accent (the now-marker, the selected station, rising emphasis): `#3D6B9A`
- Falling tide may simply use ink; do not invent a second loud accent.

### Type

- Wordmark and display: **Noto Serif TC** (self-hosted).
- UI labels: **Noto Sans TC** (self-hosted).
- Tide heights and times: a Latin face with tabular lining figures, e.g. **Source Serif 4** or **Newsreader** (self-hosted), used only for numbers and Latin abbreviations.
- Body ≥ 15px, contrast ≥ 4.5:1, no grey-on-grey.

### Chart

The tide curve is drawn as a deliberate typographic graphic (SVG or canvas): a single weight line, a filled area up to “now” or to the waterline, a vertical now-marker, labelled high/low dots with time + metres. It must look designed at 390px — not a default Chart.js / colour-blob sparkline. Prefer reduced motion: if `prefers-reduced-motion: reduce`, do not animate the fill; a static curve is enough.

## Interaction & layout (390px first)

The curve is the stage. There is no map as the main UI (a tiny optional location glyph is fine; do not build another MapLibre product).

1. **Top bar** — wordmark 「潮候」, the current station name, a locate control ≥ 44px, clear of the notch and home indicator.
2. **Hero** — one large current height (metres, one or two decimals, tabular figures), a short status 「漲緊」/「退緊」/「差不多平」, and 「下一潮：高潮/低潮 HH:MM · N.NN m，還有 X 小時 Y 分」.
3. **Today’s extremes** — a single typographic row or compact list, not a stack of cards. Official HKO times are exact; modelled times are prefixed 「約」.
4. **48-hour curve** — full width, finger-scrub / tap to read height at a time; today and tomorrow clearly marked; now-marker. Hit area is the whole chart, forgiving, no hover-only UI.
5. **Station switcher** — a horizontal rail or a simple sheet: Macau model points first, then HK official stations. Selected = slate-blue; others stay quiet.
6. **Marine line** — one quiet typographic strip: 浪高, 週期, 方向 (as 方位, e.g. 「東南」), 水溫, 風向風力, 日出 / 日落. If a marine field is missing, omit it; do not show a dash pretending to be zero.
7. **Footer** — source name(s), licence-level credit, forecast/update time in Asia/Macau, the navigation disclaimer, links to SMG and DSAMA when the station is in Macau, and to HKO when it is an official HK station.

Empty and error states are designed, in Cantonese: network failed, station data incomplete, location denied (still showing 內港).

If geolocation succeeds: snap to the nearest shipped station (haversine). If the user is clearly in Hong Kong, prefer an official HKO station; if in Macau, prefer a Macau point. Say 「已用你附近嘅〔站名〕」.

## Hard constraints

- Static files: `index.html`, `css/`, `js/`, `data/` (optional fixtures only), `assets/fonts/`. Relative paths only. Works on GitHub Pages under `/projects/ciu-hau/`.
- No paid APIs, no API keys, no secrets, no MapTiler/Google/Mapbox tokens, no scraping of SMG or DSAMA.
- No invented data. A renderer must not show a height, time, wave, temperature or sunrise that was not in the payload.
- 0 console errors on a normal load. No horizontal overflow at 360–430px. `env(safe-area-inset-*)`. `touch-action: manipulation`. Any input ≥ 16px.
- `manifest.webmanifest`, apple-touch-icon, `apple-mobile-web-app-capable`.
- Prefer `prefers-reduced-motion`.
- `npm test` (node) must be green.

## Tests (`tests/`, node, no browser required)

Must include at least:

- HKO HLT parser on the real 2026-11-12 Tai O fixture above → four extremes with correct times and heights; incomplete rows do not invent a fifth tide.
- HKO HHOT parser on the real 2026-11-12 Tai O fixture (`01`…`24` hours, including hour 24 as 24:00) and linear interpolation at a known time (e.g. 05:41 should sit near 0.49 m, within a small documented tolerance of the official HLT).
- Rising / falling / near-slack from a known hourly series, plus “next extreme” selection.
- Open-Meteo marine parser (use a recorded 2026-11-12 Macau-shaped fixture with `current.sea_level_height_msl` and `hourly.sea_level_height_msl`) — no default height if the field is missing.
- Extreme detector on an hourly series (local max/min); flat or short series does not crash and does not invent tides.
- Datum labels: HKO fixtures are tagged Chart Datum; Open-Meteo fixtures are tagged MSL; a test must fail if a shared-axis helper would mix them without a label (or, better, no such helper exists).
- Default origin is 澳門內港 when geolocation is absent.
- Nearest-station picker with fixtures (a point in central Macau → 內港 or 媽閣; a point on Lantau near Tai O → `TAO`).
- Time display in Asia/Macau, not UTC.

## Review bar (every grok review)

Every grok review must:

- Do a strict visual and layout pass at **390px** (and note 375 if something breaks).
- Verify **live data actually loads**: for an HKO station, official HLT/HHOT numbers appear; for a Macau point, Open-Meteo sea level and marine fields appear. If the live path fails, confirm the fallback is honest and shows no invented numbers.
- Walk the real tap flow: default 內港, switch to 大澳, scrub the curve, use locate (grant and deny conceptually), confirm datum labels, source lines, update times, and the navigation disclaimer.
- **SHIP is forbidden** while anything looks amateurish, overflows, uses a forbidden visual style, shows invented numbers, mixes datums quietly, has a broken empty chart with no explanation, has untappable controls, or leaves Cantonese copy stiff / templated / bilingual-for-no-reason.

## Out of scope

Games, accounts, navigation or piloting advice, storm-surge warnings as a product (a future official warning feed is out of scope), scraping SMG/DSAMA, paid APIs, a facilities or transit map, push notifications, social features, period or nostalgic story layers.
