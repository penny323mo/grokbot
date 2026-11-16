# 點去 (Dim Heoi)

A Macau-first *walk versus bus* trip tool for a phone in a pocket. Open it and you should know, in a few seconds, whether walking or taking a bus is the better way from here to a place you named — with a real walking route, real bus lines and stops, and an honest rain line when wet. Not a weather briefing, not a facilities map, not a live-arrivals dashboard of every route.

Live URL will be `https://penny323mo.github.io/grokbot/projects/dim-heoi/`.

User-facing copy is Cantonese (廣東話, Traditional Chinese). Timezone Asia/Macau. iPhone-first (Safari, 390px wide).

## Variety proof (vs last 5 nightlies)

| | Tonight: 點去 | 雨勢 (11-15) | 地勢 (11-14) | 天色 (11-13) | 潮候 (11-12) | 就近 (11-11) |
|---|---|---|---|---|---|---|
| Type | trip decision tool (walk vs bus comparison) | live rainfall radar + nowcast | live 3D terrain + building-mass explorer | live weather now + forecast briefing | live tide + marine briefing | live 2D map utility (POI) |
| Subject | how to get from A to B on foot or by public bus | where rain is falling, when it may start or stop | relief, named hills, bridges, building height | temperature, sky, rain line, UV, warnings, compact AQI | tide height, waves, sea temp | toilets, car parks, water, pharmacies, AED, clinics |
| Setting | present-day Macau streets and bus routes (半島, 氹仔, 路環) | present-day Macau and nearby waters | present-day Macau landform | present-day Macau / HK weather points | present-day Macau and nearby HK waters | present-day Macau / HK streets |
| Style | cool mist-grey typographic journey planner; two clear itineraries; a modest 2D line map as supporting stage, not the hero | cool rain-washed typographic weather-graphics; the rain field is the stage | cool limestone daylight 3D cartography | warm ivory typographic weather, one large temperature | cool daylight typographic *chart*, Swiss grid, serif figures | light civic wayfinding, warm bone paper, 2D map |
| Interaction | set origin / destination; read 行路 vs 巴士 as two typographic trip options; tap an option to see the line on a compact 2D map | play / scrub radar frames; tap a place; read a rain-timing sentence | one-finger pan, pinch, two-finger rotate / pitch | swipe hourly filmstrip; tap a day; switch place | scrub a 48-hour tide curve; switch stations | locate, filter categories, tap a place |
| Palette | cool mist grey field `#EEF1F4`, ink `#16181D`, signal-red bus `#C8102E`, deep-teal walk `#0B6E6A`, spare butter chip `#F3E6B8` only for a rain hint | cool concrete, charcoal, slate-rain, mulberry | cool limestone, iron-oxide, mineral grey-green water | warm ivory, sunlit ochre, straw sky | cool field, prussian ink, slate-blue | bone paper, dry ink, persimmon, olive |

No old Hong Kong / Macau nostalgia, no 1950s–70s street-life setting, no painterly oil look, no slow craft-and-story format. Tonight is **not** a rainfall radar (雨勢), **not** a temperature / AQI / warning briefing (天色), **not** a tide chart (潮候), **not** a 3D terrain model (地勢), **not** a POI facilities map (就近). Forbidden on this product: a large temperature number, a 7-day / hourly weather filmstrip, UV, AQI, tide curves, 3D pitch/rotate terrain, category filters for toilets / car parks / pharmacies, a full-bleed rain mosaic, invented walking times, invented bus ETAs.

## Premise

You are in Macau and you need to get somewhere. Open 點去. A quiet typographic comparison is already there, defaulted to origin **澳門半島** (22.1987, 113.5439) and destination **關閘總站** (official stop `M1/11`, 22.215282, 113.54882, from the DSAT station lookup probed 2026-11-16 00:56 Asia/Macau). One option is 行路, with a duration and distance from a real pedestrian router. The other is 巴士, naming the route (or one transfer), the boarding stop, and the alighting stop, from official route and stop data. A compact 2D map shows the chosen path. A single rain sentence may advise taking the bus if it is raining or about to, clearly labelled as a model, never as a weather app.

If geolocation is denied or unavailable, stay on 澳門半島 as origin and say so plainly: 「而家用澳門半島做起點（未開定位）」.

Tone: serious, precise, civic. Like a well-designed public-transport journey planner on a phone (Apple Maps Transit sheet, TfL Go options, SBB Mobile connection list) — daylight, typographic, not a toy map and not a dashboard of cards.

Never invent a walking time from straight-line distance. Never convert a live bus position into minutes with an assumed speed. Never treat rain, slopes, or tides as a safety judgement (do not say a road is safe, or that someone "should" go out).

## Data sources (real, no keys, no invented numbers)

Every duration, distance, route number, stop name and coordinate on screen must come from one of the sources below, with a visible **source name**, **data time**, and **expiry / next expected update**. Never invent a time. Never present a bundled snapshot, a model forecast, or the moment the app fetched as a live official arrival. If a source fails or is blocked, say that source is unavailable; do not fill the gap with a guess, a haversine, a 25 km/h ETA, or a cached "official live" label.

Verified 2026-11-16 00:51–00:56 Asia/Macau (server-side curl), before writing this SPEC:

### 1. FOSSGIS pedestrian OSRM (the *walking* duration and geometry) — primary

- `https://routing.openstreetmap.de/routed-foot/route/v1/foot/{lon},{lat};{lon},{lat}?overview=full&geometries=geojson` (HTTP 200, CORS `Access-Control-Allow-Origin: *`).
- Probe, 議事亭前地-ish (113.5406, 22.1933) → 關閘-ish (113.5497, 22.2156): `code=Ok`, 3329.9 m, 2671.6 s (~44.5 min, ≈ 4.5 km/h). Second probe, 媽閣-ish (113.5310, 22.1865) → 關閘-ish: 4704.9 m, 3771.8 s (~62.9 min). These are pedestrian speeds. Use this service first.
- Licence / terms: public FOSSGIS routing instance, no key, no SLA. Attribution required: OpenStreetMap contributors and FOSSGIS e.V. Link `https://routing.openstreetmap.de` and `https://www.openstreetmap.org/copyright`. Debounce requests, cache the current A→B result, do not hammer the public instance.
- Label: 「步行路線：OpenStreetMap / FOSSGIS 行人路徑（非官方測時）」 plus the response time or the moment of the successful fetch, marked as 路徑計算. Expiry: recompute when origin or destination changes; if the fetch is older than 24 hours in a long-lived tab, re-fetch or say it may be stale.
- If this fails, try Valhalla (below). If both fail, show 「暫時未能計算步行路線」 and **no number at all**. Never fall back to straight-line distance or a fixed walking speed.

### 2. FOSSGIS Valhalla pedestrian (walking fallback)

- `POST https://valhalla1.openstreetmap.de/route` with `costing=pedestrian`, `units=km` (HTTP 200, CORS `*`). Probe of the same first pair: 3.486 km, 2761.5 s (~46 min). Also a real pedestrian result.
- Same attribution and honesty rules as OSRM. Label it as Valhalla / OSM if this fallback is the one that succeeded.

### 3. Do *not* use `router.project-osrm.org` for walking

- The same first pair on `https://router.project-osrm.org/route/v1/foot/...` returned 3682.7 m in **365.4 s** (~36 km/h). That is not a walking time. Forbidden as a walking source, even if the path says `foot`.

### 4. DSAT public bus enquiry (routes, stops, optional live positions)

These are the public JSON endpoints of the Transport Bureau's own bus website (`https://bis.dsat.gov.mo/macauweb/`), **not** a documented data.gov.mo open-data API and **not** the SOAP `BusEnquiryServices` (that one requires a UID/PWD token — do not call it, do not invent credentials). No key is used on the website JSON.

Probed:

- Route + company list: `https://bis.dsat.gov.mo/macauweb/getRouteAndCompanyList.html?lang=zh-tw` — HTTP 200, 90 routes, companies 新福利 (Blue) and 澳巴 (Orange). The list field `direction` is `0` or `2`; this is **not** the `dir` query parameter (see below).
- Route stop sequence: `https://bis.dsat.gov.mo/macauweb/getRouteData.html?routeName={name}&dir={0|1}&lang=zh-tw` — HTTP 200, `header=000`. Route 10 `dir=0` has 21 stops (關閘總站 `M1/2` → 媽閣交通樞紐 `M3/4`); `dir=1` is the reverse (19 stops). Route 2A works only as `dir=0` (29 stops, first 東城第三街); `dir=1` and `dir=2` return `header=003` / `error: no data.` **Always try `dir=0` and `dir=1` only.** Treat `direction: "2"` in the company list as a one-way flag, not as a `dir` value.
- Stop coordinates: `https://bis.dsat.gov.mo/ddbus/common/supermap/point/station?device=web&HUID=33&keywords={staCode or name}&lang=zh-tw` — HTTP 200. Empty keywords returns only **20** stops (not the full set). Look up each `staCode` collected from route data, or search a place name (「關閘總站」 returned official coords, e.g. `M1/11` 22.215282, 113.54882).
- Live positions: `https://bis.dsat.gov.mo/macauweb/routestation/bus?routeName={name}&dir={0|1}` — HTTP 200, `header=000`. Route 10 `dir=0` at 00:51 listed buses at stops with plate / `staCode` (e.g. `M48`, plate AA2699, speed 37). This is a **position at a stop**, not an arrival minute.

**CORS:** none of the four endpoints send `Access-Control-Allow-Origin`. A browser on GitHub Pages will not be allowed to read them. (GET with an `Origin` header still returned 200 JSON to curl — that does not help Safari.) The app **must** try the live fetch in the browser, and if it fails, say so honestly.

**Build-time snapshot (required):** at build time, politely fetch the company/route list, every route at `dir=0` and `dir=1` (skip `no data`), and coordinates for every collected `staCode`. Vendor as `data/routes.json`, `data/stops.json`, and a `data/meta.json` with `fetchedAt` (Asia/Macau ISO), source URLs, and a short licence note. Small delay between requests; do not hammer the bureau. This snapshot is the graph used for journey planning. Label it on screen as 「路線同站位：交通事務局公開巴士查詢（{fetchedAt 日期} 下載；唔係即時到站）」 with a link to `https://bis.dsat.gov.mo/macauweb/`. Never call it 即時 or data.gov.mo 開放數據. If a later in-browser refresh succeeds, show that fresher time; if it fails, keep the snapshot and keep the download-date label.

**Live positions in the browser:** try `routestation/bus` for the chosen route. If it succeeds, you may say 「而家有車喺{站名}」 (or list plates) with source and fetch time. If it fails (expected, CORS), show 「即時巴士位置暫時未能喺瀏覽器讀到」 and do **not** invent an ETA. Never compute minutes from distance or from `speed`. A missing live position is not a reason to hide the static trip plan.

The official data.gov.mo dataset 「巴士路線資料」 (`https://data.gov.mo/Detail?id=e7b2e84d-3333-42f0-b676-64ce95306f0d`, DSAT shapefiles, noted as updated 2026-07-08 on a third-party catalogue) could not be downloaded in this probe without the portal's tokenised gateway (`dsat.apigateway.data.gov.mo` parking APIs require `ApiKeyAuth`). Do not use a key. Do not pretend we shipped that dataset.

### 5. Open-Meteo (one rain *hint*, not a weather product)

- `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&minutely_15=precipitation,precipitation_probability&forecast_minutely_15=8&forecast_days=1&timezone=Asia/Macau` (HTTP 200, CORS `*`). Probe at 澳門半島 00:54 Asia/Macau: eight 0.0 mm slots from 00:45 — a real dry forecast, not an error.
- Licence: Open-Meteo terms, attribution required, link `https://open-meteo.com`. Label: 「Open-Meteo 模式預測（非官方觀測）」 plus the series time, marked 預測.
- Use only for a single sentence or chip on the comparison (「而家落緊雨，行路會濕」, 「大約 xx 會有雨」, or stay silent if dry for the next two hours). Do not draw a radar, a temperature, UV, AQI, or a 7-day strip. If the fetch fails, omit the hint; do not invent rain.

### 6. Map tiles

- MapLibre GL, **2D only**, OpenFreeMap style `https://tiles.openfreemap.org/styles/positron` (HTTP 200, CORS `*`, no key). Attribution: OpenFreeMap / OpenMapTiles / OpenStreetMap contributors.
- First paint must already show Macau, not a world or China-scale map. No 3D pitch, no terrain exaggeration, no building extrusion as the product. A modest 2D line map supporting the typographic itineraries.

### 7. Overpass / OSM bus data — optional fallback only

- `https://overpass-api.de/api/interpreter` advertised CORS `*` but returned HTTP 502 at 00:54 Asia/Macau for a Macau bus-stop count. Do not block first paint on Overpass. If a later Overpass fetch works, it may fill a gap, labelled as OpenStreetMap, never as 交通事務局.

## Journey planning rules

- Origin: browser geolocation when the user allows it, otherwise 澳門半島 (22.1987, 113.5439). Destination defaults to 關閘總站 using the official stop coordinate above. The user can swap, pick from a curated list of official / clearly sourced places (at least 關閘總站, 媽閣交通樞紐, 氹仔客運碼頭, 澳門機場, plus other stops from the official stop file), filter stops by name, or tap the map. Curated coordinates must come from the DSAT station payload (or from the walking router only as a map-tap origin, never as a fake stop).
- **行路:** pedestrian router from origin to destination. Show duration in minutes (rounded honestly from the router, not from crow-flies) and distance in m / km. Draw the geometry.
- **巴士:** from the official stop graph, find direct routes (and, if none, **one** transfer) where a boarding stop is near the origin and an alighting stop is near the destination. "Near" must use the walking router to the stop when possible; if a router call for the access legs fails, you may use the already-fetched stop coordinates only to *rank* nearby stops by the router's previous matrix or by a clearly labelled "直線距離只用嚟揀站、唔係行路時間". **Never display that straight-line figure as a walking time.** Access and egress walking times, when shown, must be router results (or omitted as unavailable).
- Prefer fewer transfers, then shorter access walk, then a sensible in-vehicle stop count. If official first/last departure times appear in a payload, you may show them with source and time; if they do not (they were **absent** from `getRouteData` in the probe), do not invent a timetable or headway.
- In-vehicle duration: do not invent it. You may list the intermediate stop names / count. If a live position is available, say where the bus is, not when it will arrive.
- If no bus option exists in the graph, say so, and still show the walk.
- LRT: a `metro` field appeared on some official stops (e.g. 媽閣交通樞紐 `metro=1`). You may mark 「此站可轉輕軌」 only from that field. Do not invent LRT times or a full LRT planner.

## Art direction

Commercial typographic journey planner. References (look, do not copy assets): **Apple Maps Transit** (iOS trip options, minute-first, quiet map), **TfL Go** journey option list, **SBB Mobile** daylight connection typography. Not Citymapper's dark neon, not a card stack, not generic AI glass.

- Field `#EEF1F4`, ink `#16181D`, bus line and route pills `#C8102E`, walk line `#0B6E6A`, rain chip background `#F3E6B8` used sparingly.
- Type: a distinctive, licensed-or-self-hosted pair — a sharp grotesque for UI (e.g. self-hosted IBM Plex Sans or a comparable grotesque already usable without a key) and a tabular / slightly editorial figure style for minutes. No system-only stack that looks like a default template if a self-hosted face is feasible. All fonts relative-path, no runtime CDN required at ship.
- The comparison (行路 vs 巴士) is the hero. The map is supporting, compact, 2D, Macau-first. Plenty of air. Thumb-sized targets (≥ 44px). No dummy grey boxes, no Unsplash, no AI decorative images in the ship build.

## Interaction and layout (iPhone Safari, 390 × 844)

- First paint must already show a complete comparison for the default A→B, not a blank form.
- All primary controls reachable with a thumb; hit targets ≥ 44px.
- At 390px: no horizontal overflow, no clipped minutes, no overlapping source line, no destination field pushing the options off-screen without a way to scroll. Test this width for real.
- Safe-area insets (notch / home indicator) respected.
- Prefer CSS/SVG/MapLibre 2D. `lang="zh-Hant"` and a proper viewport meta. Static site on GitHub Pages (no server, no secrets, no keys). Relative paths. Vendor MapLibre and fonts locally.
- Locate is optional and forgiving. Check Safari.

## Tests (`npm test`)

Ship a Node test suite (`package.json` `"test": "node --test tests/*.test.js"`) that, at least:

- Parses a fixture of FOSSGIS OSRM foot JSON into duration, distance and geometry; asserts the probe-scale pedestrian speed is accepted; a fixture matching the `project-osrm.org` 36 km/h "foot" result is **rejected** as a walking time.
- A missing / failed router result yields an unavailable state, not a haversine or `distance / 1.25 m/s` fallback.
- Parses fixtures of `getRouteAndCompanyList`, `getRouteData` (including `header=003` / no data on one direction), and station lookups; builds a stop graph; finds a direct route on a fixture where one exists (e.g. a 10-like 關閘↔媽閣 sequence) and yields no invented times.
- Live-position fixture may be rendered as "bus at stop X"; a helper must not turn it into minutes via speed or distance.
- Copy helpers never label the bundled DSAT snapshot as 即時, never label Open-Meteo or OSM routing as 官方觀測, and never label a CORS failure as a live official empty arrival.
- A CORS / network failure path for DSAT live returns unavailable, while the snapshot plan can still be shown with its download date.
- Default origin is the Macau peninsula point above; default destination is 關閘總站 with the official coordinate above.

Tests must be behaviour checks, not string-rename theatre. `npm test` must be green before claiming the build is done.

## Grok review bar (every review, including review-1)

Grok must do a **strict visual and layout pass at 390px** (Safari-equivalent viewport), and must **verify that live data actually loads**: a real walking route (duration consistent with walking, not driving) or a clearly labelled failure; a real bus option from the official graph or a clearly labelled absence; source + time visible for each number. Block SHIP on anything amateurish, broken, overflowing, invented, or that looks like a reskinned 雨勢 / 天色 / 潮候 / 就近 / 地勢. Block SHIP if walking minutes were clearly faked from crow-flies, or if bus ETAs were invented from speed. Check the WebGL / `maplibregl.supported()` trap (MapLibre 4.x may not have `supported()` — detect canvas WebGL, do not call a missing helper and blank the map). If official live positions are missing because of CORS, that is acceptable only when the unavailable line is honest and the static plan is still usable.

## Engineering constraints

- Static frontend only (HTML/CSS/JS), publishable by the orchestrator to GitHub Pages. No backend, no secrets, no keys.
- Cantonese UI only (a discreet 葡/EN place-name subtitle is optional, not a second app).
- Quota: if agy hits a hard usage limit, stop empty continue-loops; leave a note in the progress / report. Do not burn rounds on empty diffs after a hard limit.
- Visual quality is the #1 priority. Clean, deliberate, commercial. If the itinerary typography or the map looks amateur, it is not done.
