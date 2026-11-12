# 天色 · Tin Sik — SPEC

Nightly 2026-11-13 (Asia/Macau). A practical, everyday **live weather** tool — not a game, not a facilities map, and not a tide briefing. Portrait iPhone-first (390×844, also 375×667 and 430×932), iPhone Safari first. Static web (HTML/CSS/JS, relative paths, no required build step to run). Deploys under grokbot `projects/tinsik/`. All user-facing text in natural spoken Cantonese (Traditional Chinese). No English UI copy except unavoidable proper nouns and unit abbreviations explained in Cantonese.

Visual quality is the #1 priority: it must feel like a commercial typographic weather briefing, not a generic blue weather app, not a stack of metric cards, and not a student dashboard.

## Variety proof (vs last 5 nightlies)

| | Tonight: 天色 | 潮候 (11-12) | 就近 (11-11) | 霜門守望 (11-04) | 鋦瓷記 (11-03) | 十號風球 (11-01) |
|---|---|---|---|---|---|---|
| Type | live weather now + forecast (real open data) | live tide + marine briefing | live map utility (POI) | real-time tower defence | craft puzzle + story | historical forecasting sim |
| Subject | temperature, sky, next-hour rain, UV, 7-day, official warnings, a compact AQI line | tide height, next high/low, waves, sea temp, wind | nearby toilets, car parks, water, pharmacies, AED, clinics | fantasy glacier siege | porcelain mending | typhoon signal decisions |
| Setting | present-day Macau, with nearby HK as a second place | present-day Macau and nearby HK waters | present-day Macau / HK streets | invented glacier kingdom | 1957 Yau Ma Tei | 1962 Royal Observatory |
| Style | warm daylight typographic weather, sans-first, one large temperature as the stage | cool daylight typographic *chart*, Swiss grid, serif figures | light civic wayfinding, warm bone paper, 2D map | matte low-poly clay diorama | oil painting | period charts / paper |
| Interaction | swipe an hourly filmstrip; tap a day to expand; locate / switch place; read a rain ribbon | scrub a 48-hour tide curve; switch stations | locate, filter, tap a place, walk-time | build / upgrade / aim, pan + pinch | slow staged craft taps | read + decide |
| Palette | warm ivory field, warm ink, sunlit ochre, straw sky — not blue-chrome weather | cool field, prussian ink, slate-blue | bone paper, dry ink, persimmon, olive | glacier teal, indigo, saffron | cobalt, amber, teak | slate, signal red |

No old Hong Kong / Macau nostalgia, no 1950s–70s street-life setting, no painterly oil look, no slow craft-and-story format. 就近 already had a one-line weather chip — tonight is a dedicated weather product, not another map. 潮候 was a harbour *water-level* curve; tonight has no tide chart and no marine datum. 十號風球 was a historical typhoon *game*; tonight is not a warning simulator, has no story, and is not set in 1962. Official warnings appear only as a live banner when a feed actually has one.

## Premise

You are in Macau (or nearby Hong Kong) and need to know: what is the sky doing *now*, does it feel warmer or cooler than the number, will it rain in the next couple of hours, and what is the rest of the week like? Open 天色, see one large temperature and a short Cantonese sky phrase, then swipe the next hours and scan seven days. If location is denied or unavailable, start at **澳門半島** (22.1987, 113.5439) and say so plainly: 「而家用澳門半島做起點（未開定位）」.

Tone: serious, precise, useful. Like a well-designed public weather briefing, not a cartoon weather toy and not a glass-orb dashboard.

Always show, in Cantonese, that this does not replace official warnings: 「呢度係預報參考，官方警告以地球物理氣象局同香港天文台為準。」

## Data sources (real, no keys, no invented numbers)

Cite source name, licence and a visible update/forecast time in the UI (Asia/Macau, labelled). If a fetch fails, show an honest empty/error state in Cantonese — never a made-up temperature, time, UV, rain amount or AQI.

### 1. Open-Meteo Forecast API (primary)

- `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,uv_index,is_day&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,uv_index,wind_speed_10m,wind_direction_10m,relative_humidity_2m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,uv_index_max,sunrise,sunset,wind_speed_10m_max&minutely_15=precipitation,weather_code&forecast_days=7&timezone=Asia%2FMacau`
- Verified live on 2026-11-13 01:13 Asia/Macau from the box: HTTP 200, `access-control-allow-origin: *`, no API key. Macau peninsula current was 23.0 °C, weather_code 2, apparent 25.3 °C, UV 0.0 at 01:00; `minutely_15` returned a real 15-minute precipitation series.
- Licence: CC BY 4.0, https://open-meteo.com/en/license — on-screen: 「Open-Meteo」（CC BY 4.0）.
- Timezone must be `Asia/Macau`. Do not display UTC instants as if they were local clock times.
- WMO `weather_code` must be mapped to short, spoken Cantonese (e.g. 0 「晴朗」, 1 「大致天晴」, 2 「有雲」, 3 「密雲」, 45/48 「有霧」, 51–55 「毛毛雨」, 61–65 「落雨」, 80–82 「驟雨」, 95 「雷暴」). Never print the raw code, and never use stiff textbook phrases like 「輕度降水」.
- Wind direction as a Cantonese bearing (「北」「東北」…), not degrees alone.
- If a field is missing, omit it. Do not show 0° / 0 mm / AQI 0 as a stand-in for “no data”.

### 2. Open-Meteo Air Quality API (one compact line, not a second app)

- `https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&current=pm2_5,us_aqi,european_aqi&timezone=Asia%2FMacau`
- Verified live on 2026-11-13: HTTP 200, CORS `*`, no key. Macau current PM2.5 22.1 µg/m³, US AQI 70, European AQI 44 at 01:00.
- Licence: same Open-Meteo CC BY 4.0 (CAMS-based). Attribute on the same source line.
- UI: one typographic line (AQI or PM2.5 plus a short health word). If the request fails, hide the line or say 「空氣指數暫時讀唔到」— never invent a number.

### 3. Hong Kong Observatory Open Data — official warnings, and official HK observations

- Warning summary: `https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=tc`
- Optional richer warning text: same host, `dataType=warningInfo&lang=tc`
- Current readings (use only when the selected place is in / near Hong Kong): `dataType=rhrread&lang=tc`
- Verified live on 2026-11-13: HTTP 200, `access-control-allow-origin: *`, no API key. `warnsum` was `{}` (no active warning) — the empty state must look designed, not like a broken module.
- Terms: HKO open data / https://www.hko.gov.hk/ — attribute 「香港天文台」 when these fields are shown.
- When a warning object is present, show a calm, serious banner with the official name and a short text. When it is empty, show nothing — do not pad with a fake “而家無警告” chip in the hero unless a quiet footer mention is needed.
- Official HKO temperatures and UV from `rhrread` are a *labelled official reading*, never blended into the Open-Meteo hero number. Two sources, two labels.
- Do not use HKO readings for a Macau place.

### 4. Official Macau reference (no scrape)

There is no verified no-key, JSON, CORS-open SMG observation API as of this SPEC (a 2026-11-13 probe of `xml.smg.gov.mo` returned 404). Do **not** scrape smg.gov.mo HTML. Link the official site https://www.smg.gov.mo/ as the Macau authority. If, during build, a no-key CORS-open SMG JSON/XML endpoint is actually verified (HTTP 200, usable payload, `Access-Control-Allow-Origin` that allows the Pages origin), it may be added with attribution 「地球物理氣象局」 and a fixture test. Otherwise Open-Meteo remains the Macau source of truth.

## Art direction

Name three real commercial references and stay close to them. Do not invent a fourth “AI SaaS” look.

1. **Hello Weather** — the temperature is typography, chrome almost disappears, the condition is a word, not a cartoon icon.
2. **yr.no** — numbers as typography, source and time told honestly, light surfaces, forecast readable as a table rather than decoration.
3. **Bloomberg / Financial Times data pages** — tabular lining figures, tight hierarchy, one accent, no boxes around every metric.

Forbidden: dark glass, neon, gradient meshes, generic stacked white cards with drop shadows, Inter/Roboto “startup” look, emoji-as-icons, playful mascots, skeuomorphic paper, cartoon suns/clouds, glass orbs, a generic blue-sky weather-app chrome, cool grey Swiss marine (that was 潮候), warm bone-paper civic wayfinding (that was 就近), glacier teal / saffron, oil-paint cobalt/amber, period telegram charts.

### Palette

- Field: `#F7F1E8` (warm ivory daylight, not cool grey and not bone-civic)
- Ink: `#1C1916`
- Straw / quiet sky wash: `#E8DCC6`
- Stone / rules / muted UI: `#B9A893` and `#6F675C`
- Accent (the now temperature emphasis, selected place, “now” tick on the filmstrip): `#C4841A` (sunlit ochre)
- Warning banner uses ink on a reserved warm alert field `#E8C9B0`, not neon red and not signal-ten crimson.

UV and AQI may use a *short, restrained* semantic scale (a word plus one quiet mark). The chrome of the app stays ivory / ink / ochre.

### Type

- Wordmark and UI: **Noto Sans TC** (self-hosted). No serif display — 潮候 already used Noto Serif TC as the editorial voice.
- Temperature, hours, and other numbers: **Source Sans 3** (self-hosted) with tabular lining figures, or another self-hosted Latin sans that actually has tabular figures. Do not use system San Francisco alone for the hero number if lining tabular figures are uneven.
- Body ≥ 15px, contrast ≥ 4.5:1, no grey-on-grey. Hero temperature may be in the 88–120px range at 390px and must still fit without colliding with the sky phrase or the rain ribbon.
- System stack as fallback only: `"PingFang TC", "Noto Sans TC", -apple-system, "Helvetica Neue", sans-serif`.

### Iconography

A tiny custom SVG set (geometric, ~2px stroke, no emoji, no icon font) only where a mark is truly needed (locate, expand a day, wind bearing). The sky condition is **a Cantonese word first**. A small monoline sky mark may sit beside the word; it must never replace it, and it must not look like a toy sticker.

## Interaction & layout (390px first)

The large *now* temperature is the stage. There is no map as the main UI (a tiny optional location glyph is fine; do not build another MapLibre product). Do not draw a 48-hour SVG curve as the hero — that was 潮候. The hours are a horizontal filmstrip you swipe.

1. **Top bar** — wordmark 「天色」, the current place name, a locate control ≥ 44px, clear of the notch and home indicator.
2. **Hero** — one large current temperature (°C, tabular figures, no false precision beyond one decimal if the API gives it; prefer a whole degree if the visual is calmer and the API integer is honest), a short sky phrase, 「體感 N°」, and a quiet wind + humidity line. If `is_day` is 0, do not show a sunlit “今日紫外線” as if it were daytime; night copy should feel like night without switching the whole app to a dark-glass theme (the ivory field stays; the phrase can say 「夜晚」).
3. **Rain ribbon** — the next ~two hours from `minutely_15` (preferred) and/or the first hourly precipitation + probability. One typographic sentence, e.g. 「未來兩小時都唔會落雨」 or 「大約 XX:XX 開始會有雨」, plus a compact intensity strip. Not a second hero chart. If `prefers-reduced-motion: reduce`, the strip is static (no looping “radar” animation).
4. **Hourly filmstrip** — a horizontally swipeable row of the next 24 hours (time, a short word or tiny mark, temperature, rain probability if useful). The current hour is marked with the ochre tick. Forgiving finger scrolling; no hover-only UI; each hour cell tappable to pin a readout (time, °C, rain %, wind) without opening a modal mess.
5. **Seven-day list** — one row per day: weekday, sky word, min–max, rain sum or probability. Tap a day to expand *that day’s hours* in the same typographic language. Only one day expanded at a time.
6. **UV** — when the sun is up, a short UV line (current and/or today’s max). At night, omit current UV or show only today’s max, labelled as such.
7. **Air** — one compact AQI / PM2.5 line, as specified above.
8. **Place switcher** — a horizontal rail or a simple sheet, Macau first: 澳門半島 (default 22.1987, 113.5439), 氹仔 (22.1590, 113.5590), 路環 (22.1240, 113.5650), then 香港天文台 (22.3019, 114.1743). Selected = ochre; others stay quiet.
9. **Footer** — source name(s), licence-level credit, forecast/update time in Asia/Macau, the official-warning disclaimer, a link to [地球物理氣象局](https://www.smg.gov.mo/) for Macau places and to [香港天文台](https://www.hko.gov.hk/) when the place is in Hong Kong (or whenever an HKO warning banner is shown).

Empty and error states are designed, in Cantonese: network failed, a source incomplete, location denied (still showing 澳門半島).

If geolocation succeeds: snap to the nearest shipped place (haversine). If the user is clearly in Hong Kong, prefer 香港天文台 and you may then load `rhrread`. If in Macau, prefer the nearest of 半島 / 氹仔 / 路環. Say 「已用你附近嘅〔地名〕」.

## Hard constraints

- Static files: `index.html`, `css/`, `js/`, `data/` (optional fixtures only), `assets/fonts/`. Relative paths only. Works on GitHub Pages under `/projects/tinsik/`.
- No paid APIs, no API keys, no secrets, no MapTiler/Google/Mapbox tokens, no scraping of SMG.
- No invented data. A renderer must not show a temperature, time, UV, rain amount, wind, sunrise or AQI that was not in the payload.
- 0 console errors on a normal load. No horizontal overflow at 360–430px. `env(safe-area-inset-*)`. `touch-action: manipulation`. Any input ≥ 16px. Tappable controls ≥ 44×44px.
- `manifest.webmanifest`, apple-touch-icon, `apple-mobile-web-app-capable`.
- Prefer `prefers-reduced-motion`.
- `npm test` (node) must be green.

## Tests (`tests/`, node, no browser required)

Must include at least:

- Open-Meteo current / hourly / daily parser on a recorded 2026-11-13 Macau-shaped fixture (current 23.0 °C, weather_code 2, apparent 25.3, UV 0.0 at 01:00 Asia/Macau) — missing fields do not become 0.
- WMO weather_code → Cantonese: at least codes 0, 1, 2, 3, 45, 61, 80, 95 map to the spoken phrases in this SPEC; unknown codes fall back to a honest 「天氣狀況唔詳」 (not the raw number, not English).
- Rain ribbon logic: a dry `minutely_15` series → a dry sentence; a series that turns wet at a known timestamp → that time appears; an empty/missing series does not invent rain or “0 mm” as a fake reading.
- Daily min/max and precipitation_sum from the fixture; a missing daily block does not crash and does not invent a 7-day forecast.
- Default origin is 澳門半島 (22.1987, 113.5439) when geolocation is absent.
- Nearest-place picker with fixtures (a point in central Macau → 澳門半島; a point on Taipa → 氹仔; a point in Tsim Sha Tsui → 香港天文台).
- Time display in Asia/Macau, not UTC (sunrise/sunset and hourly labels).
- HKO `warnsum` fixture: `{}` shows no warning banner; a recorded non-empty warning fixture shows the official name and does not invent extra warnings.
- Air-quality parser: fixture PM2.5 / US AQI render; a missing payload hides the line rather than showing AQI 0.
- Official HKO `rhrread` temperatures are never used as the hero number for a Macau place (a unit test must fail if a helper would do that).

## Review bar (every grok review)

Every grok review must:

- Do a strict visual and layout pass at **390px** (and note 375 if something breaks).
- Verify **live data actually loads**: the default 澳門半島 hero shows a live Open-Meteo temperature, sky phrase, update time and source. Switch to 香港天文台 and confirm the forecast reloads for that point. If the live path fails, confirm the fallback is honest and shows no invented numbers.
- Walk the real tap flow: default 澳門半島, swipe the hourly filmstrip, expand a day, read the rain ribbon, use locate (grant and deny conceptually), confirm source lines, update times, the official-warning disclaimer, and (if a warning is live) the banner.
- **SHIP is forbidden** while anything looks amateurish, overflows, uses a forbidden visual style (especially a generic blue weather-app look, cartoon weather stickers, or a tide-curve clone), shows invented numbers, has a broken empty hero with no explanation, has untappable controls, or leaves Cantonese copy stiff / templated / bilingual-for-no-reason.

## Out of scope

Games, accounts, a facilities or transit or tide map, radar tiles as the main product (RainViewer’s free tier is max zoom 7 and past-only — too coarse for a Macau street-level radar), push notifications, social features, period or nostalgic story layers, scraping SMG, paid APIs, storm-surge or marine navigation advice.
