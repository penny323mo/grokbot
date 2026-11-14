# 雨勢 (Jyu Sai)

A Macau-first *rain field and timing* tool for a phone in a pocket. Open it and you should know, in a few seconds, whether it is raining here, whether rain is approaching, and roughly when it might start or stop. Not a general weather briefing.

Live URL will be `https://penny323mo.github.io/grokbot/projects/jyu-sai/`.

User-facing copy is Cantonese (廣東話, Traditional Chinese). Timezone Asia/Macau. iPhone-first (Safari, 390px wide).

## Variety proof (vs last 5 nightlies)

| | Tonight: 雨勢 | 地勢 (11-14) | 天色 (11-13) | 潮候 (11-12) | 就近 (11-11) | 霜門守望 (11-04) |
|---|---|---|---|---|---|---|
| Type | live rainfall radar + nowcast (animated precipitation field) | live 3D terrain + building-mass explorer | live weather now + forecast briefing | live tide + marine briefing | live 2D map utility (POI) | real-time tower defence |
| Subject | where rain is falling, when it may start or stop in the next two hours | relief, named hills, bridges, building height | temperature, sky, rain line, UV, warnings, compact AQI | tide height, waves, sea temp | toilets, car parks, water, pharmacies, AED, clinics | fantasy glacier siege |
| Setting | present-day Macau (半島, 氹仔, 路環) and the waters immediately around it | present-day Macau landform | present-day Macau / HK weather points | present-day Macau and nearby HK waters | present-day Macau / HK streets | invented glacier kingdom |
| Style | cool rain-washed typographic weather-graphics; the rain field is the stage; chrome almost absent | cool limestone daylight 3D cartography | warm ivory typographic weather, one large temperature | cool daylight typographic *chart*, Swiss grid, serif figures | light civic wayfinding, warm bone paper, 2D map | matte low-poly clay diorama |
| Interaction | play / scrub radar frames (past ~2 h + nowcast if present); tap a place; read a rain-timing sentence | one-finger pan, pinch, two-finger rotate / pitch; flatten / 立體 | swipe hourly filmstrip; tap a day; switch place | scrub a 48-hour tide curve; switch stations | locate, filter categories, tap a place | build / upgrade / aim |
| Palette | cool concrete field, charcoal ink, slate-rain scale, mulberry accent | cool limestone, iron-oxide accent, mineral grey-green water | warm ivory, sunlit ochre, straw sky | cool field, prussian ink, slate-blue | bone paper, dry ink, persimmon, olive | glacier teal, indigo, saffron |

No old Hong Kong / Macau nostalgia, no 1950s–70s street-life setting, no painterly oil look, no slow craft-and-story format. Tonight is **not** a temperature / AQI / warning briefing (天色), **not** a tide chart (潮候), **not** a 3D terrain model (地勢), **not** a POI facilities map (就近). Forbidden on this product: a large temperature number, a 7-day / hourly weather filmstrip, UV, AQI, tide curves, 3D pitch/rotate terrain, category filters, toilets / car parks / pharmacies.

## Premise

You are in Macau and you want to know whether to take an umbrella, and whether the shower will last. Open 雨勢. A quiet map of Macau is already there, with a live rain field over it, defaulted to **澳門半島** (22.1987, 113.5439). A short typographic sentence states the situation in Cantonese, for example 「而家冇雨」, 「而家落緊雨」, or 「大約 25 分鐘後會有雨」. You can play the last two hours and, when the source provides it, the short nowcast. Tap 氹仔 or 路環, or use locate, to reread the sentence for that point.

If geolocation is denied or unavailable, stay on 澳門半島 and say so plainly: 「而家用澳門半島做起點（未開定位）」.

Tone: serious, precise, observational. Like a well-designed national weather service rainfall map on a phone, not a toy radar and not a dashboard of weather cards.

Never turn a rain rate or a model forecast into a safety judgement. Do not say it is safe to go out, or that a road will flood, or that a signal "means" anything beyond what the official warning text itself says.

## Data sources (real, no keys, no invented numbers)

Every number and every coloured rain cell on screen must come from one of the sources below, with a visible **source name**, **data time**, and **expiry / next expected update**. Never invent rainfall. Never present a model forecast, a mosaic, or the moment the app fetched as an official SMG or HKO observation. If a source fails or is blocked, say that source is unavailable; do not fill the gap with a guess, a cached "official live" snapshot, or the model.

Verified 2026-11-15 01:10 Asia/Macau (server-side curl), before writing this SPEC:

### 1. RainViewer public radar API (the rain *field*)

- Index: `https://api.rainviewer.com/public/weather-maps.json` (HTTP 200, CORS `Access-Control-Allow-Origin: *`).
- Tiles: `https://tilecache.rainviewer.com{path}/256/{z}/{x}/{y}/2/1_1.png` (HTTP 200, `image/png`, CORS `*`). Path and unix time come from the index (`radar.past` and `radar.nowcast` when present).
- Coverage: worldwide mosaic, including the Pearl River Delta / Macau. Refresh about every 5 minutes. On the probe, `radar.past` had 13 frames; `radar.nowcast` was empty — the UI must tolerate an empty nowcast and say so (「呢個來源暫時未有未來雨勢預測」), not invent frames.
- Licence / terms: free for personal, educational, and small-scale community use; no API key. Attribution is mandatory: visible credit such as 「天氣雷達資料由 RainViewer 提供」 with a link to `https://www.rainviewer.com`. No SLA. Documented at `https://www.rainviewer.com/api.html`.
- Label on screen: 「RainViewer 雷達拼圖（非澳門氣象局官方圖）」 plus the frame's time in Asia/Macau. Expiry: treat a frame as stale if it is more than 20 minutes older than "now", and say 「資料可能已過時」.
- This is a **third-party mosaic of many radars**, not SMG official imagery. Never caption it as 地球物理氣象局 or 香港天文台 official radar.

### 2. Open-Meteo forecast (the point *timing* sentence)

- `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&minutely_15=precipitation,precipitation_probability&hourly=precipitation,precipitation_probability,weather_code&forecast_minutely_15=8&forecast_days=1&timezone=Asia/Macau` (HTTP 200, CORS `*`). 8 × 15-minute steps is two hours.
- Probe at 澳門半島 returned all-zero precipitation for 01:00–02:45 Asia/Macau — that is a real "no rain" forecast, not an error. Only treat a fetch / parse failure as unavailable.
- Licence: Open-Meteo terms (attribution required). Link `https://open-meteo.com`. Label: 「Open-Meteo 模式預測（非官方觀測）」 plus the model time if the payload exposes it, otherwise the first `minutely_15.time` and a clear 「預測」 mark. Do not call this 實況.
- Use this series only to phrase *future* timing (next rain start / stop within two hours) and a small 15-minute strip under the sentence. Do not draw a second rain field from it. If the array is missing, say 「未有未來兩小時模式預測」.

### 3. Official SMG station rainfall (try; likely blocked in the browser)

- Machine-readable official observations: `https://xml.smg.gov.mo/c_actualweather.xml` (HTTP 200, XML). Stations include 澳門 / 氹仔 / 路環 and more. `Rainfall` entries: Type 3 = instantaneous observation, Type 4 = accumulation in the past hour, Type 5 = accumulation since 00:01 today. `System/SysPubdate` is the publication time (probe: `2026-11-15 01:05`). Index and field definitions: `https://xml.smg.gov.mo/`.
- **CORS: the probe response had no `Access-Control-Allow-Origin` header.** A GitHub Pages page almost certainly cannot read this in Safari. Still *attempt* a fetch. If it succeeds, show official 過去一小時雨量 / 今日累積 for the selected district, labelled 「澳門地球物理氣象局官方觀測」 with `SysPubdate`, and link the source.
- If it fails (including a CORS error): do **not** silently skip it. Show a quiet, specific line: 「澳門地球物理氣象局官方雨量未能喺瀏覽器讀取（來源無開放跨域）」 and a text link to SMG (e.g. `https://www.smg.gov.mo/` or the official actual-weather page). Never paste an old XML snapshot into the repo and present it as live official data. Never proxy the request through a random public CORS proxy.
- Rainstorm / thunderstorm official XML (`c_rainstorm.xml`, `c_thunderstorm.xml`) has the same CORS risk. Only show a warning if a live fetch of the official XML succeeds and the payload says a signal is in force. Otherwise omit it. This product is not a warning briefing; a hanging official rainstorm signal may appear as one short attributed line, nothing more.

### 4. HKO open data (optional supporting official *Hong Kong* observation only)

- `https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=tc` — HTTP 200, CORS `*`. Licensed under the DATA.GOV.HK terms (free, attribution to 香港天文台 / the Government / DATA.GOV.HK required): `https://data.gov.hk/en/terms-and-conditions`.
- May be used only as **nearby Hong Kong official rainfall**, clearly labelled 「香港天文台官方雨量（香港站，非澳門觀測）」 with the HKO report time. Prefer a western station actually present in the payload (do not invent a "Macau" station). If the payload has no rainfall, say so.
- Do **not** use HKO website radar JPEGs scraped from `nradar_img.json` — those site images are not the documented open-data API.
- HKO gridded rainfall nowcast CSV `https://data.weather.gov.hk/weatherAPI/hko_data/F3/Gridded_rainfall_nowcast.csv` **does cover Macau** (probe: nearest cell ≈ 22.196, 113.540, ~0.5 km; updated 2026-11-15 00:48 HKT, four half-hour steps) and is official open data, but the probe had **no CORS header** and the file is ~2.6 MB. Do not ship a browser fetch of this file as a required path. If you later discover a documented, CORS-enabled, reasonably small HKO nowcast endpoint, you may use it with official attribution. Until then, do not depend on it.

### 5. Basemap

- Quiet daylight vector basemap via MapLibre and free **OpenFreeMap** tiles (same family as 就近 / 地勢 is fine; the *visual role* must differ: a pale underlay so the rain field is what you see). No API key. Attribute OpenFreeMap / OpenStreetMap contributors in the footer (ODbL).
- **P0 lesson from 地勢 (2026-11-14):** MapLibre 4.7.1 has **no** `maplibregl.supported()`. Do not call a missing `supported()` and then show a WebGL-failed banner to every browser. Feature-detect WebGL (or use a MapLibre version that actually exposes the helper you call). If WebGL genuinely fails, show a typographic fallback that still presents the timing sentence and source lines, plus a static "no map" state — never a blank page and never a false WebGL error.

No paid service, no secret, no API key. Browser geolocation is optional.

## Product behaviour

1. **First screen (390px):** rain field already on a Macau-centred map (peninsula default), a short Cantonese hero sentence, the selected place name, source + data time + expiry, and a time scrubber / play control. No splash, no hamburger, no card stack.
2. **Hero sentence** (examples, not templates to loop through word-for-word every hour):
   - No rain now and none in the two-hour forecast: 「而家冇雨，未來兩小時模式預測都唔預期會落。」
   - Raining now (radar return at/near the point, or official hourly rainfall > 0 if that source loaded): 「而家落緊雨。」 Optionally add the official past-hour mm if present: 「氣象局錄得過去一小時 3.2 毫米。」
   - Dry now, rain in the 15-minute forecast: 「而家冇雨，模式預測大約 HH:MM 會開始有雨。」
   - Raining now, forecast going dry: 「而家落緊，模式預測大約 HH:MM 可能轉停。」
   The time must come from the forecast timestamps, displayed in Asia/Macau. If radar and forecast disagree, say both, with sources — do not silently pick a winner or average them into a fake official value.
3. **Place switcher:** 澳門半島, 氹仔, 路環, and 定位. Coordinates: 澳門半島 22.1987, 113.5439; 氹仔 22.1566, 113.5595; 路環 22.1180, 113.5528. Locate uses the browser position; if it is unreasonably far from the Pearl River Delta, keep the map on Macau, show the user position if they want, and say the default is still Macau. Never invent a walking time.
4. **Scrubber:** frames from `radar.past` (and `radar.nowcast` when the index includes them). Play at a calm speed, loop or stop at the last frame with a clear "而家 / 預測" mark. The active frame time is always visible. Tapping a frame or dragging the scrub must work with a fat finger at 390px.
5. **Refresh:** reload the RainViewer index and Open-Meteo (and retry SMG) on a sensible interval (about 5 minutes) and on a manual refresh control. Show last successful update time per source.
6. **Failures:** each source fails independently. A down radar still leaves the typographic forecast (and vice versa). Never show a colourful empty map that looks like "no rain" when the tiles simply failed — that would be invented data. Use a distinct unavailable state.

## Art direction

Name three real commercial references and stay close to them. Do not invent a fourth "AI SaaS" look.

1. **UK Met Office rainfall radar (app / site)** — rain field as the subject, pale basemap, calm typography, a serious national-service instrument, not a game.
2. **MeteoSwiss precipitation maps** — restrained colour, rainfall treated as data, chrome almost absent.
3. **BBC Weather rainfall map** — large, readable timing language; one clear state; no dashboard clutter.

Forbidden: dark glass, neon, cyber grids, rainbow "video game" radar palettes, Windy / Ventusky particle-wind clones, gradient meshes, generic stacked white cards with drop shadows, Inter/Roboto "startup" look, emoji-as-icons, playful mascots, skeuomorphic paper, a generic Google/Mapbox demo look, warm ivory weather chrome (天色), cool prussian chart chrome (潮候), bone-and-persimmon wayfinding (就近), iron-oxide limestone 3D chrome (地勢), glacier teal / saffron, oil-paint cobalt/amber.

### Palette

- Field / UI chrome: `#E4E9ED` (cool rain-washed concrete; bluer and greyer than 地勢 limestone and not warm ivory / bone)
- Ink: `#16191C`
- Quiet rules / muted labels: `#B7C0C6` and `#5A646B`
- Rain scale (stepped, not a neon rainbow): light `#A9C4D1`, moderate `#3D6F8F`, heavy `#1B3F5A`. Keep the scale short and legible. Include a tiny legend with mm/h or RainViewer colour-scheme meaning as documented by that API (do not invent mm/h if the tile scheme does not provide it — then legend is relative 弱 / 中 / 強 and say so).
- Accent (selected place, play, locate on): `#7A3D62` (mulberry)
- Error / missing: ink on a quiet clay field `#E6D6D1`, not neon red

### Type

- Wordmark 「雨勢」 and UI: self-hosted **Noto Sans TC**. A slightly tighter, instrument-like sans, not a magazine serif (潮候 already used serif editorial figures) and not a large warm temperature numeral (天色).
- Times and rainfall figures: self-hosted Latin sans with **tabular lining figures** (Source Sans 3 is fine) so "01:15" and "3.2 mm" do not jitter.
- Body ≥ 15px, contrast ≥ 4.5:1. The hero sentence may go large (in the 22–32px range) but must wrap cleanly at 390px; never truncate mid-clause. System fallback only: `"PingFang TC", "Noto Sans TC", -apple-system, "Helvetica Neue", sans-serif`.

### Chrome

A thin top wordmark, a floating or bottom-docked sentence + place + scrubber that does not hide the peninsula, a footer for sources. One accent at a time. Custom SVG icons (play, pause, locate, refresh), geometric, ~2px stroke, no emoji, no icon font. The map is full-bleed; UI sits on it with a light concrete panel, not a dark glass pill.

## Interaction and layout (iPhone Safari, 390 × 844)

- First paint must already show Macau, not a world or China-scale map.
- All primary controls reachable with a thumb; hit targets ≥ 44px.
- At 390px: no horizontal overflow, no clipped sentence, no overlapping scrubber and source line, no place names wrapping into an unreadable stack. Test this width for real.
- Safe-area insets (notch / home indicator) respected.
- Prefer CSS/SVG/MapLibre. No stock Unsplash, no AI-generated decoration images, no placeholder grey boxes in the ship build.
- `lang="zh-Hant"` and a proper viewport meta. Works as a static site on GitHub Pages (no server, no build step required at runtime). Relative paths.

## Tests (`npm test`)

Ship a Node test suite (`package.json` `"test": "node --test tests/*.test.js"`) that, at least:

- Parses a fixture of RainViewer `weather-maps.json` (including empty `nowcast`) and builds tile URLs / frame times correctly; empty nowcast does not invent frames.
- Parses a fixture of Open-Meteo `minutely_15` into a start/stop time or a dry-two-hours result; all-zero precipitation is "no rain", not an error.
- Parses a fixture of SMG `c_actualweather.xml` Rainfall types 3/4/5 and `SysPubdate` for 澳門 / 氹仔 / 路環.
- Copy helpers never label Open-Meteo or RainViewer as 官方觀測, and never label a failed SMG fetch as a live official zero.
- A CORS / network failure path returns an unavailable state, not a fabricated 0 mm official reading.
- Default coordinates are the Macau peninsula point above.

Tests must be behaviour checks, not string-rename theatre. `npm test` must be green before claiming the build is done.

## Grok review bar (every review, including review-1)

Grok must do a **strict visual and layout pass at 390px** (Safari-equivalent viewport), and must **verify that live data actually loads** (radar tiles or a clearly labelled failure; Open-Meteo timing or a clearly labelled failure; source + time visible). Block SHIP on anything amateurish, broken, overflowing, invented, or that looks like a reskinned 天色 / 潮候 / 就近 / 地勢. Check the WebGL/`supported()` trap. Check that RainViewer and Open-Meteo are not captioned as SMG official. If official SMG rainfall is missing because of CORS, that is acceptable only when the unavailable line is honest.

## Engineering constraints

- Static frontend only (HTML/CSS/JS), publishable by the orchestrator to GitHub Pages. No backend, no secrets, no keys.
- Cantonese UI only (a discreet 葡/EN place-name subtitle is optional, not a second app).
- Quota: if agy hits a hard usage limit, stop empty continue-loops; leave a note in the progress / report. Do not burn rounds on empty diffs after a hard limit.
- Visual quality is the #1 priority. Clean, deliberate, commercial. If the rain field or typography looks amateur, it is not done.
