# 就近 · Just Around — SPEC

Nightly 2026-11-11 (Asia/Macau). A practical, everyday nearby-facilities tool — not a game. Portrait iPhone-first (390×844, also 375×667 and 430×932), iPhone Safari first. Static web (HTML/CSS/JS, relative paths, no required build step to run). Deploys under grokbot `projects/jauhgan/`. All user-facing text in natural spoken Cantonese (Traditional Chinese). No English UI copy except unavoidable proper nouns and map labels already in the basemap.

This is the first nightly in more than a week that is a live-data utility rather than a game or period simulation. Visual quality is the #1 priority: it must feel like a commercial civic app, not a student mashup of a map and a card list.

## Variety proof (vs last 5 nightlies)

| | Tonight: 就近 | 霜門守望 (11-04) | 鋦瓷記 (11-03) | 十號風球 (11-01) | 季風帆影 (10-31) | 百草堂 (10-30) |
|---|---|---|---|---|---|---|
| Type | live map utility (real open data) | real-time tower defence | craft puzzle + story | forecasting sim | trade sim | shop puzzle / management |
| Subject | nearby toilets, car parks, water, pharmacies, AED, clinics | fantasy glacier siege | porcelain mending | typhoon signal decisions | monsoon trade voyages | herbal apothecary |
| Setting | present-day Macau (HK when located there) | invented glacier kingdom | 1957 Yau Ma Tei | 1962 Royal Observatory | 1600 Macau | 1931 Guangzhou |
| Style | light civic wayfinding, editorial typography, paper field | matte low-poly clay diorama | oil painting | period charts / paper | painted screen / namban | ink / period ledger |
| Interaction | locate, filter, tap a place, walk-time, open directions | build / upgrade / aim, pan + pinch | slow staged craft taps | read + decide | choose routes | read + choose |
| Palette | bone paper, dry ink, persimmon, olive | glacier teal, indigo, saffron | cobalt, amber, teak | slate, signal red | ochre, indigo | brown, ink |

No old Hong Kong / Macau nostalgia, no 1950s–70s street-life setting, no painterly oil look, no slow craft-and-story format. Signal Ten was a historical typhoon game — tonight is not a weather or warning sim; weather is only a one-line conditions strip so you know whether to take an umbrella while you walk.

## Premise

You are in Macau (or Hong Kong) and need a public toilet, a car park, drinking water, a pharmacy, a clinic, or an AED — now. Open 就近, see what is actually around you on a clear map, how many minutes on foot, and whether we know opening hours or (in Hong Kong only) live parking vacancy. If location is denied or unavailable, start at 議事亭前地 (Largo do Senado: **22.1937, 113.5406**) and say so plainly: 「而家用議事亭前地做起點（未開定位）」.

Tone: serious, calm, useful. Like a well-designed municipal tool, not a playful mascot app.

## Art direction

Name three real commercial references and stay close to them. Do not invent a fourth "AI SaaS" look.

1. **Citymapper** — the map is the stage; typography carries hierarchy; one confident accent; distances are large and instantly readable; chrome is almost absent.
2. **SBB Mobile** (Swiss Federal Railways) — civic calm, generous padding, precise unfilled icons, light surfaces, no decoration for its own sake.
3. **yr.no** (Norwegian Meteorological Institute) — the slim conditions line only: numbers as typography, not badges or pills; honesty about time and source.

Forbidden: dark glass, neon, gradient meshes, generic stacked white cards with drop shadows, inter/roboto "startup" look, emoji-as-icons, playful mascots, skeuomorphic paper textures that look rustic or nostalgic, teal/glacier palettes, cobalt-and-amber oil-paint palettes.

### Palette

- Paper field: `#F3EFE6`
- Ink: `#1C1915`
- Stone / rules / quiet UI: `#D9D2C5` and `#8A8378`
- Accent persimmon (brand, primary actions, selected chip): `#C6532A`
- Olive (open / available / walking): `#3E4F38`
- Closed / unavailable: `#8B2E1F`
- Map should lean light (OpenFreeMap Positron or Liberty, then restyle water / land / labels toward bone and ink so the map and chrome feel like one product). No dark basemap.

### Type

System stack only, no webfonts, no CDN fonts: `"PingFang TC", "Noto Sans TC", -apple-system, "Helvetica Neue", sans-serif`. Tabular lining numerals for distances, minutes, temperature, vacancy counts. The nearest walking time or the selected place name may go large (in the 40–64px range) — typography, not a badge. Body 16–17px. All tappable controls ≥ 44×44px.

### Iconography

A tiny custom SVG set (geometric, ~2px stroke, no emoji, no icon font). Categories: 公廁, 停車場, 飲水, 藥房, AED, 診所. Same marks on the map (legible at 390px, not tiny pins that collide).

## Data sources (real, no keys, no invented numbers)

Never use a paid service. Never use an API key. Never invent vacancy, opening hours, ratings, or coordinates. If a field is unknown, omit it or say 「未有呢項資料」— do not fake it. Every data surface shows **來源** and **更新時間** (ISO converted to Asia/Macau, labelled).

### 1. OpenStreetMap via Overpass (primary places)

- Query endpoint, try in order: `https://overpass-api.de/api/interpreter`, `https://overpass.kumi.systems/api/interpreter`, `https://overpass.osm.ch/api/interpreter`
- Licence: ODbL 1.0, https://www.openstreetmap.org/copyright — on-screen attribution: 「© OpenStreetMap contributors」
- Amenities (nodes + ways, use `out center tags`): `toilets`, `parking`, `parking_entrance`, `drinking_water`, `pharmacy`, `clinic`, `hospital`, `doctors`, `defibrillator` (and `emergency=defibrillator`)
- Also read useful tags when present: `name`, `name:zh`, `name:zh-Hant`, `name:en`, `opening_hours`, `wheelchair`, `fee`, `access`, `operator`, `toilets:wheelchair`, `bottle`, `capacity`
- Because Overpass can time out or block the browser, **commit a dated snapshot** `data/snapshot-macau.json` covering Macau Peninsula + Taipa + Coloane (plus a modest buffer), generated from a real Overpass pull (or an official dump). The app tries a live bounded query around the user, and falls back to the snapshot. The footer must say whether the places are live or from the snapshot, and the snapshot's fetch time. An empty or hand-invented snapshot is a ship blocker.
- Do not query the whole world. Bound by a radius (~1.2–2 km) or a bbox.

### 2. Official Hong Kong parking vacancy (when the user is in / near HK)

- `https://api.data.gov.hk/v1/carpark-info-vacancy?data=info&lang=zh_TW` and `data=vacancy&vehicleTypes=privateCar&lang=zh_TW`, optionally with `extent=`
- No authentication (confirmed 2026-11-11).
- Licence / terms: data.gov.hk Terms and Conditions, https://data.gov.hk/en/terms-and-conditions — attribute 「香港政府 data.gov.hk／運輸署」
- Join vacancy to info by `park_Id`. Show remaining private-car spaces and the API `lastupdate` only when present. If vacancy is missing, show the car park as a place without a number.
- **Do not use this API for Macau.** Macau DSAT live vacancy (`https://dsat.apigateway.data.gov.mo/car_park_maintance`) requires an Authorization key — forbidden in this project. Macau car parks are locations only (OSM / snapshot), never a fake "剩餘車位".

### 3. Open-Meteo (slim conditions strip only)

- Weather: `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weather_code,precipitation,apparent_temperature,relative_humidity_2m,wind_speed_10m&hourly=precipitation,precipitation_probability&forecast_hours=2&timezone=Asia%2FMacau`
- Air: `https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&current=pm2_5,us_aqi,european_aqi&timezone=Asia%2FMacau`
- Licence: CC BY 4.0, https://open-meteo.com/en/terms — attribute 「Open-Meteo」
- UI: one typographic line, e.g. temperature, a short Cantonese sky phrase from WMO weather_code, 「未來兩小時會唔會落雨」, PM2.5 or AQI if loaded. Not a forecast app. If the request fails, hide the strip or say 「天氣暫時讀唔到」, never invent °C or AQI.

### 4. Basemap

- MapLibre GL JS **vendored** in the repo (BSD-3-Clause). No CDN script tags for the library.
- Tiles / style: OpenFreeMap, no key, no account — `https://tiles.openfreemap.org/styles/positron` or `/styles/liberty`. https://openfreemap.org/ — attribute OpenFreeMap + OSM (ODbL).
- Offline / tile failure: the list still works from snapshot + location; the map area shows a calm message, not a broken grey square.

### 5. Optional official Macau toilets

The Municipal Affairs Bureau publishes a public-toilet dataset on https://data.gov.mo/Detail?id=f6a9892d-7e16-49f0-bcd3-573d670cefe5. Use it **only** if a no-key JSON/GeoJSON download can be confirmed and attributed. If the portal requires login or a key, skip it and stay on OSM. Do not scrape HTML as if it were an API.

### Location

`navigator.geolocation` with a clear permission button 「用我嘅位置」. Default 議事亭前地 22.1937, 113.5406. No tracking beyond that one fix (and a user-triggered refresh). You may let the user drag the map or drop a pin to change the origin; the list re-sorts.

## Product surfaces

One screen, not a tab zoo.

1. **Top bar** — title 「就近」, the conditions strip, and a short origin line (place or 「議事亭前地 · 預設」).
2. **Full-bleed map** under the bar — user origin, category marks, selected place highlighted. Forgiving gestures: one-finger pan, pinch zoom; no hover-only UI. A "返返我嘅位置" target ≥ 44px, clear of the home indicator and safe-area insets.
3. **Category rail** — horizontal chips: 全部 / 公廁 / 停車場 / 飲水 / 藥房 / AED / 診所. Selected chip uses persimmon; others stay quiet. This is a rail, not a stack of cards.
4. **Place list** — a single bottom sheet or a short scroll of rows (name, category, walking time). Tap a row to select it on the map. **Do not** build a generic three-card dashboard.
5. **Detail** — one focused sheet for the selected place: name, category, walking distance + minutes (assume ~4.8 km/h, haversine; say 「約 N 分鐘」), opening hours only if tagged, wheelchair if tagged, HK vacancy only if official data matched, source + update time, primary action 「開始導航」 opening `https://maps.apple.com/?daddr={lat},{lon}` (and a `geo:` fallback). No ratings we did not receive.

Empty and error states are designed, in Cantonese: no results in this category, network failed (showing snapshot), location denied.

## Hard constraints

- Static files: `index.html`, `css/`, `js/`, `data/`, `assets/`, vendored MapLibre. Relative paths only. Works on GitHub Pages under `/projects/jauhgan/`.
- No paid APIs, no API keys, no secrets in the repo, no console leftovers of tokens.
- No invented data. Tests must fail if a renderer would show a vacancy or temperature that was not in the input.
- 0 console errors in a normal load. No horizontal overflow at 360–430px. `env(safe-area-inset-*)`. `touch-action: manipulation`. Inputs ≥ 16px if any.
- `manifest.webmanifest`, apple-touch-icon, `apple-mobile-web-app-capable`. Optional service worker for the app shell only (not as a way to cache stale vacancy as if it were live).
- Prefer `prefers-reduced-motion`.
- `npm test` (node) must be green.

## Tests (`tests/`, node, no browser required)

Must include at least:

- Haversine + walking minutes (known fixtures).
- Category filter (toilets vs parking vs AED).
- Overpass / snapshot parser: real-shaped fixture → places; rejects empty or obviously synthetic records used as production snapshot (snapshot must include a fetched-at timestamp and a source URL).
- Open-Meteo parser (use the known 2026-11-11 Macau shape: `current.temperature_2m`, `hourly.precipitation`) — no default temperature.
- HK vacancy joiner: info + vacancy by `park_Id`; missing vacancy ⇒ no number.
- Default origin is Senado when geolocation is absent.
- A fixture that would have invented a Macau "remaining spaces" field must not be displayed.

## Review bar (every grok review)

Every grok review must:

- Do a strict visual and layout pass at **390px** (and note 375 if something breaks).
- Verify live data actually loads (Open-Meteo conditions, and places from live Overpass or the committed snapshot). If the live path fails, confirm the fallback is honest and still useful.
- Walk the real tap flow: grant or deny location conceptually, switch categories, open a place, confirm 導航 URL, confirm sources and update times are visible.
- **SHIP is forbidden** while anything looks amateurish, overflows, uses a forbidden visual style, shows invented numbers, has a broken or grey empty map with no explanation, has untappable controls, or leaves Cantonese copy stiff / templated / bilingual-for-no-reason.

## Out of scope

Games, accounts, routing engines, turn-by-turn inside the app, paid map keys (MapTiler, Google Maps JS, Mapbox tokens), Macau DSAT key APIs, push notifications, writing reviews, social features. Do not add a typhoon-signal game or a 1950s story layer.
