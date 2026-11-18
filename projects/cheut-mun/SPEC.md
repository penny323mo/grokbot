# 出門 (Cheut Mun)

A Macau-first *unified going-out* app for a phone in a pocket. Open it, name a place, and get one typographic decision: 行路, 巴士, and — when you are driving — 泊車再行. Walking minutes come from a real pedestrian router and include climb, stairs and a compact elevation profile when the router provides one. Bus lines and stops come from official DSAT public enquiry data. Rain is a single labelled forecast hint that can change the reading of those options, not a weather product. This is the consolidated Macau decision tool Penny asked for on 2026-11-14 and 2026-11-17: **點去 and 斜路 live inside this app**, together with rain and parking, rather than as separate sites or a dashboard of numbers.

Live URL will be `https://penny323mo.github.io/grokbot/projects/cheut-mun/`.

User-facing copy is Cantonese (廣東話, Traditional Chinese). Timezone Asia/Macau. iPhone-first (Safari, 390px wide).

## Variety proof (vs last 5 nightlies)

| | Tonight: 出門 | 斜路 (11-17) | 點去 (11-16) | 雨勢 (11-15) | 地勢 (11-14) | 天色 (11-13) |
|---|---|---|---|---|---|---|
| Type | unified decision-support app: one destination, jointly-used walk / bus / park-then-walk | single-purpose slope-aware walking tool | single-purpose walk vs bus tool | live rainfall radar + nowcast | live 3D terrain + building-mass explorer | live weather now + forecast briefing |
| Subject | how to leave for a place, using routes, slopes, rain and parking together | how steep a walk is: climb, grade, stairs, flatter/shorter alt | how to get from A to B on foot or by public bus | where rain is falling, when it may start or stop | relief, named hills, bridges, building height | temperature, sky, rain line, UV, warnings, compact AQI |
| Setting | present-day Macau streets, bus routes, car parks (半島, 氹仔, 路環) | present-day Macau streets, ramps and stairs | present-day Macau streets and bus routes | present-day Macau and nearby waters | present-day Macau landform | present-day Macau / HK weather points |
| Style | cool lilac-stone typographic *editorial broadsheet*: a serif decision sentence is the hero; one sheet over a quiet 2D map; options share ink (not colour-coded modes) | warm cork typographic section drawing; elevation profile is the hero | cool mist-grey typographic journey planner; two colour-coded itineraries | cool rain-washed typographic weather-graphics; rain field is the stage | cool limestone daylight 3D cartography | warm ivory typographic weather, one large temperature |
| Interaction | set A→B; read 行路 / 巴士 / 泊車再行 as one comparison; tap an option to show its line or park-to-door walk | set A→B; read climb and a profile; switch 較平 vs 較短 | set A→B; read 行路 vs 巴士; tap an option | play / scrub radar frames; tap a place | one-finger pan, pinch, two-finger rotate / pitch | swipe hourly filmstrip; tap a day; switch place |
| Palette | lilac-stone field `#F2F3F7`, ink `#12141A`, gallery-blue recommended rule `#2143A8`, quiet line `#C5C7D1`, map water `#D4D8E6`, dry-sand rain wash `#E6E0D4` | cork `#F4EFE6`, clay `#B44A2A`, sage `#2F5E49` | mist `#EEF1F4`, signal-red `#C8102E`, deep-teal `#0B6E6A` | cool concrete, charcoal, slate-rain, mulberry | limestone, iron-oxide, mineral grey-green | warm ivory, sunlit ochre, straw sky |

No old Hong Kong / Macau nostalgia, no 1950s–70s street-life setting, no painterly oil look, no slow craft-and-story format. Tonight is **not** a standalone slope profile (斜路), **not** a standalone walk-vs-bus site (點去), **not** a rainfall radar (雨勢), **not** a 3D terrain model (地勢), **not** a temperature / AQI / warning briefing (天色), **not** a tide chart (潮候, 11-12), **not** a category POI map (就近, 11-11). Forbidden on this product: a tabbed dashboard that merely links or embeds those earlier tools; a large temperature number; a 7-day / hourly weather filmstrip; UV; AQI; tide curves or any tide-as-safety language; 3D pitch/rotate terrain; a full-bleed rain mosaic; a category rail for toilets / pharmacies / AED; invented walking times; invented bus ETAs; colour-coding walk as teal and bus as Macau red (that is 點去). Previous nightlies may stay on Pages as their own projects; this app must re-implement the decision flows itself.

You may *read* earlier nightly code under `/workspace/orchestrator/work/grokbot/projects/` (`dim-heoi`, `ce-lou`, `jauhgan`, `jyu-sai`) only for verified API parsing patterns and fixture shapes. Do not copy their chrome, palettes, or page structure.

## Premise

You are in Macau and you need to go somewhere. Open 出門. A quiet editorial comparison is already there, defaulted to origin **議事亭前地** and destination **關閘總站**. One typographic sentence states what is actually known (minutes, climb, a named bus, rain if any) — it does not invent a "best" when a number is missing. Below it, three options share the same ink:

- **行路** — real pedestrian duration, distance, climb, stairs, and a compact elevation profile when samples exist; a flatter or shorter alternative only when the router returns a meaningfully different path.
- **巴士** — official route and stops (direct, or one transfer), boarding and alighting names, access/egress walks from the pedestrian router. No invented in-vehicle minutes.
- **泊車再行** — two or three OSM car parks near the destination, each with a real walk from the park to the door. Macau live vacancy is **unavailable** without a DSAT key; say so, do not invent spaces.

A compact 2D map shows the selected option. A single rain sentence, labelled 預測, may note that a walk of this length would be wet — never a command, never a safety judgement.

If geolocation is denied or unavailable, stay on 議事亭前地 as origin and say so plainly: 「而家用議事亭前地做起點（未開定位）」.

Tone: serious, precise, civic, typographic. Like a broadsheet and a public journey sheet, not a toy map and not a stack of product cards.

Never invent a walking time from straight-line distance. Never convert a live bus position into minutes with an assumed speed. Never treat rain, slopes, or tides as a safety judgement (do not say a road is 安全 / 危險, or that someone 「應該」 go out or stay in). Climb and grade are descriptive. Tide data is out of scope for v1.

## Data sources (real, no keys, no invented numbers)

Every duration, distance, climb, route number, stop name, car-park coordinate and rain figure on screen must come from one of the sources below, with a visible **來源**, **資料時間**, and **有效期 / 下次更新**. Never invent a time. Never present a bundled snapshot, a model forecast, or the moment the app fetched as a live official arrival or official vacancy. If a source fails or is blocked, say that source is unavailable; do not fill the gap with a guess, a haversine, a 25 km/h ETA, or a cached "official live" label.

Never use a paid service. Never use an API key (including the data.gov.mo `APPCODE` / `ApiKeyAuth` gateway used by DSAT parking — out of scope).

Verified earlier in this series, and re-checked where noted on 2026-11-18 00:51 Asia/Macau:

### 1. FOSSGIS Valhalla pedestrian (walking duration, geometry, elevation, alternatives) — primary for walk and for park-to-door / stop-access walks

- `POST https://valhalla1.openstreetmap.de/route` with `costing=pedestrian`, `units=km`, and `elevation_interval` (15 or 20). CORS `Access-Control-Allow-Origin: *`. HTTP 200 (probed 2026-11-17).
- Licence / terms: public FOSSGIS / OSM.de Valhalla instance, no key, no SLA. Attribution required: OpenStreetMap contributors and FOSSGIS e.V. Link `https://valhalla1.openstreetmap.de` and `https://www.openstreetmap.org/copyright`. Debounce requests, cache the current A→B (and park→B) pairs, do not hammer the public instance.
- Probe, 2026-11-17 00:55 Asia/Macau, 議事亭→東望洋 approximate `22.1937,113.5406` → `22.19647,113.54996`: default **1.659 km, ~22.8 min, climb 98.4 m**, two stair maneuvers; `use_hills=1` was a real steeper shorter alternative (1.55 km, climb 117.6 m). A second pair 議事亭-ish → 關閘-ish was probed 2026-11-16 on OSRM as ~3.3 km / ~44.5 min (pedestrian speed).
- Always request `elevation_interval` so `legs[0].elevation` is present when available. Climb and descent are the sum of positive / negative steps in that sample array. Grade is rise / interval, labelled as calculated from Valhalla samples, not as an official survey. Stair counts come only from router maneuvers about stairs; never infer stairs from a bumpy profile.
- For the main walk, also request `use_hills=1` (and optionally `use_hills=0` with a higher `step_penalty`). Keep an alternative only when it is meaningfully different: length differs by ≥ 50 m, or climb differs by ≥ 8 m, or the stairs-maneuver count differs, or the decoded shape is clearly not the same path. Otherwise show one walk and do not draw a fake second path.
- If Valhalla fails, try FOSSGIS OSRM for the line and duration, then Valhalla `/height` for a profile along that *router* shape (`POST https://valhalla1.openstreetmap.de/height` with `range=true`). A two-point `/height` request is not a route profile. If elevation is missing, show the walk without a profile and say 「暫時未能讀到高度剖面」. If both routers fail, show 「暫時未能計算步行路線」 and **no number at all**. Never fall back to straight-line distance or a fixed walking speed.
- Label: 「步行路線：OpenStreetMap / FOSSGIS Valhalla 行人路徑（非官方測時）」 plus the successful-fetch time, marked 路徑計算. Expiry: recompute when origin, destination or selected car park changes; if older than 24 hours in a long-lived tab, re-fetch or say it may be stale.

### 2. FOSSGIS pedestrian OSRM (walking fallback)

- `https://routing.openstreetmap.de/routed-foot/route/v1/foot/{lon},{lat};{lon},{lat}?overview=full&geometries=geojson` (HTTP 200, CORS `*`).
- Licence / terms: public FOSSGIS routing instance, no key, no SLA. Attribution: OpenStreetMap contributors and FOSSGIS e.V. Link `https://routing.openstreetmap.de` and `https://www.openstreetmap.org/copyright`.
- Do *not* use `router.project-osrm.org` for walking. (A previous nightly probe of a Macau foot pair on that host returned a ~36 km/h "foot" time. Forbidden as a walking source, even if the path says `foot`.)

### 3. DSAT public bus enquiry (routes, stops, optional live positions)

These are the public JSON endpoints of the Transport Bureau's own bus website (`https://bis.dsat.gov.mo/macauweb/`), **not** a documented data.gov.mo open-data API and **not** the SOAP `BusEnquiryServices` (that one requires a UID/PWD token — do not call it, do not invent credentials). No key is used on the website JSON.

- Route + company list: `https://bis.dsat.gov.mo/macauweb/getRouteAndCompanyList.html?lang=zh-tw`
- Route stop sequence: `https://bis.dsat.gov.mo/macauweb/getRouteData.html?routeName={name}&dir={0|1}&lang=zh-tw` — always try `dir=0` and `dir=1` only. Treat `direction: "2"` in the company list as a one-way flag, not as a `dir` value. `header=003` / `error: no data.` means no such direction.
- Stop coordinates: `https://bis.dsat.gov.mo/ddbus/common/supermap/point/station?device=web&HUID=33&keywords={staCode or name}&lang=zh-tw` — empty keywords returns only 20 stops; look up each `staCode`. Official 關閘總站 `M1/11` is 22.215282, 113.54882 (probed 2026-11-16).
- Live positions: `https://bis.dsat.gov.mo/macauweb/routestation/bus?routeName={name}&dir={0|1}` — a **position at a stop**, not an arrival minute.

**CORS:** none of the four endpoints send `Access-Control-Allow-Origin`. A browser on GitHub Pages will not be allowed to read them. The app **must** try the live fetch in the browser, and if it fails, say so honestly.

**Build-time snapshot (required):** at build time, politely fetch the company/route list, every route at `dir=0` and `dir=1` (skip `no data`), and coordinates for every collected `staCode`. Vendor as `data/routes.json`, `data/stops.json`, and a `data/meta.json` with `fetchedAt` (Asia/Macau ISO), source URLs, and a short licence note. Small delay between requests; do not hammer the bureau. Label on screen as 「路線同站位：交通事務局公開巴士查詢（{fetchedAt 日期} 下載；唔係即時到站）」 with a link to `https://bis.dsat.gov.mo/macauweb/`. Never call it 即時 or data.gov.mo 開放數據. If a later in-browser refresh succeeds, show that fresher time; if it fails, keep the snapshot and the download-date label.

**Live positions:** try `routestation/bus` for the chosen route. If it succeeds, you may say 「而家有車喺{站名}」 with source and fetch time. If it fails (expected, CORS), show 「即時巴士位置暫時未能喺瀏覽器讀到」 and do **not** invent an ETA. Never compute minutes from distance or from `speed`. A missing live position is not a reason to hide the static trip plan.

### 4. Open-Meteo (one rain *hint*, not a weather product)

- `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&minutely_15=precipitation,precipitation_probability&forecast_minutely_15=8&forecast_days=1&timezone=Asia/Macau`. No key. CORS has historically been `*`.
- Licence: Open-Meteo terms, attribution required, link `https://open-meteo.com`. Label: 「Open-Meteo 模式預測（非官方觀測）」 plus the series time, marked 預測.
- Re-probed 2026-11-18 00:51 Asia/Macau at 議事亭: HTTP 200, eight slots 00:45–02:30 all **0.0 mm** and probability **0** — a real dry forecast, not an error. Use it for a single sentence (「而家落緊雨，行路會濕」, 「大約 xx 會有雨」, or stay silent if dry for the next two hours). Do not draw a radar, a temperature, UV, AQI, or a 7-day strip. If the fetch fails, omit the hint or say 「暫時未能讀到落雨預測」; do not invent rain.

### 5. OpenStreetMap car parks (for 泊車再行 only)

- Build-time snapshot of `amenity=parking` in a Macau bbox (roughly `22.10,113.52,22.22,113.60`, covering 半島 / 氹仔 / 路環), via Overpass (`https://overpass-api.de/api/interpreter` or a documented mirror) during development. Vendor as `data/carparks.json` plus `fetchedAt` in `data/meta.json`. Attribution: OpenStreetMap contributors, ODbL, link `https://www.openstreetmap.org/copyright`.
- A 2026-11-18 00:51 probe of overpass-api.de failed with a TLS unexpected-eof; earlier nightlies also saw HTTP 502. Do not block first paint on a live Overpass call. Optional in-browser refresh if CORS allows; on failure keep the snapshot and its download date.
- Show the park's OSM `name` / `name:zh` / `name:pt` when present; an unnamed park is 「停車場」 plus a short locality if a sourced address / street tag exists — never invent a civic name.
- **Macau live vacancy is out of scope.** DSAT / data.gov.mo parking occupancy goes through a keyed gateway. Do not use a key. Show a standing honest line: 「澳門即時車位（交通事務局）暫時未能喺無密鑰情況下讀到」. Do not display a guessed "有位 / 已滿". Do not use a Hong Kong vacancy feed as if it were Macau.

### 6. Map (supporting, 2D only)

- MapLibre GL, **2D only**, OpenFreeMap style `https://tiles.openfreemap.org/styles/positron` (re-checked 2026-11-18 00:51, HTTP 200, no key), restyled toward tonight's field and water. Attribution: OpenFreeMap / OpenMapTiles / OpenStreetMap contributors.
- MapLibre is **vendored** in the repo. No CDN script tags for the library. No MapTiler, Google, Mapbox, Cesium ion, or other keyed tile services. No 3D terrain, no pitch/rotate "globe", no extruded buildings — that is 地勢, not this product.
- First paint must already show Macau, not a world or China-scale map. Map max bounds around Macau and the immediate bridges. Detect canvas WebGL yourself; **do not** call `maplibregl.supported()` (MapLibre 4.x may not have it — that blanked earlier nightlies).

### 7. Place coordinates (curated list)

Default origin is **議事亭前地**; default destination is **關閘總站** (official DSAT stop coordinate). Curated places must use only the sourced coordinates below (OSM/Nominatim probed 2026-11-17, or DSAT station payload probed 2026-11-16). Do not add a place whose coordinates were not sourced. A previous Nominatim query for 「路環市政花園」 returned a park in Shandong — **rejected**.

| Place | lat | lon | source |
|---|---|---|---|
| 議事亭前地 Largo do Senado | 22.1938271 | 113.5399903 | OSM/Nominatim, 2026-11-17 |
| 關閘總站 | 22.215282 | 113.54882 | DSAT station `M1/11`, 2026-11-16 |
| 東望洋燈塔 Farol da Guia | 22.1964359 | 113.5497062 | OSM/Nominatim, 2026-11-17 |
| 媽閣廟 Templo de A-Ma | 22.1861086 | 113.5312671 | OSM/Nominatim, 2026-11-17 |
| 望廈炮台 Fortaleza de Mong-Há | 22.2079651 | 113.5476729 | OSM/Nominatim, 2026-11-17 |
| 黑沙海灘 Praia de Hác Sá | 22.1212703 | 113.5709904 | OSM/Nominatim, 2026-11-17 |
| 疊石塘山 Alto de Coloane | 22.1206541 | 113.5612955 | OSM/Nominatim, 2026-11-17 |

Origin: browser geolocation when the user allows it, otherwise 議事亭前地. The user can swap, pick from the curated list, filter by name (and, for bus, by official stop names from the vendored stop file), or tap the map. A map-tap is a coordinate, never a fake official name. Additional official DSAT stops from the vendored stop file may be offered as destinations; their coordinates must come from that file.

## Journey and decision rules

- **行路:** pedestrian router from origin to destination. Show duration in minutes (rounded honestly from the router), distance, climb / descent / stairs when present, and a compact SVG elevation profile. If a meaningfully different flatter or shorter walk exists, two typographic sub-options — 較平 and 較短 — sit under 行路, not as a separate app. Access and egress walks to bus stops or from car parks follow the same router rules.
- **巴士:** from the official stop graph, find direct routes (and, if none, **one** transfer) where a boarding stop is near the origin and an alighting stop is near the destination. "Near" must use the walking router to the stop when possible. If a router call for the access legs fails, you may use stop coordinates only to *rank* nearby stops, with a clearly labelled 「直線距離只用嚟揀站、唔係行路時間」. **Never display that straight-line figure as a walking time.** Prefer fewer transfers, then shorter access walk, then a sensible in-vehicle stop count. If official first/last departure times appear in a payload, you may show them with source and time; if they do not (they were **absent** from `getRouteData` in the 11-16 probe), do not invent a timetable or headway. In-vehicle duration: do not invent it. You may list intermediate stop names / count. If no bus option exists, say so, and still show the walk. LRT: you may mark 「此站可轉輕軌」 only from an official `metro` field. Do not invent LRT times or a full LRT planner.
- **泊車再行:** rank two or three vendored parks near the destination by the *router* walk from park to destination (or omit the option with an honest unavailable if the park file is empty / the router fails for every candidate). Show each park's walk minutes, climb if known, and a line on the map when selected. Origin-to-park driving time is **out of scope** (no driving router required); do not invent a driving ETA. The option is "park near the destination, then walk."
- **Recommendation sentence:** typographic emphasis (weight, a gallery-blue rule) is allowed only when it rests on numbers actually on screen. If bus in-vehicle minutes are unknown, do not say the bus is faster or slower. If rain is forecast during the walk duration, you may note that the walk would be wet — not that the user must take the bus. If only one option loaded, do not invent the others.

## What the first screen must do

First paint already shows a complete answer for the default A→B (議事亭前地 → 關閘總站), not a blank form and not a hub of links:

1. Origin and destination, editable, with locate and swap.
2. A serif decision sentence stating what is known for this trip (walk minutes and climb if loaded; a named bus if loaded; rain if wet). No marketing fluff.
3. The three typographic options (行路, 巴士, 泊車再行), same ink, one recommended rule only when justified. Tapping an option updates the map and, for 行路, the compact profile.
4. A compact 2D map of the chosen line or park-to-door walk, Macau-first.
5. Source + time for every number (router, DSAT snapshot date, Open-Meteo, OSM parks snapshot).
6. Optional one-line rain hint, labelled 預測, or an honest failure.

Copy tone: short, spoken Cantonese. Example *shape* only (live numbers must come from the router / snapshot, not from this sentence if they differ): 「行路大約 45 分鐘，爬升約 12 米。巴士可坐 10，喺關閘總站落；車程分鐘冇官方數字就唔寫。」

## Art direction

Commercial typographic *editorial broadsheet* for a going-out decision, not a reskin of 點去 or 斜路, and not a dashboard of widgets. References (look, do not copy assets): **The Financial Times app** (editorial typographic hierarchy, calm chrome, no product-card stacks), **9292** (Dutch multimodal leave-now comparison of walk / transit / car, daylight), **iOS 18 Maps** route sheet (one sheet over a quiet map, not a tab bar of tools). Not Citymapper dark neon, not Komoot trail chrome, not a generic Google/Mapbox demo, not generic AI glass.

- Field `#F2F3F7`, ink `#12141A`, recommended rule / selected state `#2143A8`, quiet rules and disabled `#C5C7D1`, map water `#D4D8E6`, rain hint wash `#E6E0D4` used sparingly. Do not colour-code 行路 as teal or 巴士 as `#C8102E`.
- Type: a distinctive self-hosted pair — **Newsreader** or **Source Serif 4** (serif) for the decision sentence and for minutes / metres; **Noto Sans TC** (or Source Han Sans TC) for UI chrome. All fonts relative-path, no runtime CDN required at ship. No Inter / Roboto / system-only stack if a self-hosted face is feasible.
- The comparison is the hero. The map and the walk profile are supporting. Plenty of air. Thumb-sized targets (≥ 44px). No dummy grey boxes, no Unsplash, no AI decorative images, no nostalgic illustration, no stacked white cards with drop shadows.

## Interaction and layout (iPhone Safari, 390 × 844)

- First paint must already show a complete default A→B answer, not a blank form.
- All primary controls reachable with a thumb; hit targets ≥ 44px.
- At 390px: no horizontal overflow, no clipped minutes or climb, no overlapping source line, no destination field pushing the options off-screen without a way to scroll. The compact profile must remain readable (not a 20 px squiggle). Test this width for real.
- Safe-area insets (notch / home indicator) respected. `env(safe-area-inset-*)`.
- Prefer CSS/SVG/MapLibre 2D. `lang="zh-Hant"` and a proper viewport meta. Static site on GitHub Pages (no server, no secrets, no keys). Relative paths. Vendor MapLibre and fonts locally.
- Locate is optional and forgiving. Check Safari. Prefer `prefers-reduced-motion`. Any input ≥ 16px.
- Hard constraints: relative paths only; works on GitHub Pages under `/projects/cheut-mun/`; 0 console errors on a normal load (MapLibre missing-tile warnings at the edge of the bbox should be guarded or declared); no horizontal overflow at 360–430px; `manifest.webmanifest`, apple-touch-icon, `apple-mobile-web-app-capable`.

## Tests (`npm test`)

Ship a Node test suite (`package.json` `"test": "node --test tests/*.test.js"`) that, at least:

- Parses a fixture of FOSSGIS Valhalla / OSRM foot JSON into duration, distance, geometry, and climb; asserts the probe-scale pedestrian speed is accepted; a fixture matching the `project-osrm.org` 36 km/h "foot" result is **rejected** as a walking time.
- A missing / failed router result yields an unavailable state, not a haversine or `distance / 1.25 m/s` fallback.
- Alternatives are kept only when climb / length / stairs / shape actually differ; a duplicate geometry is not shown as 較平.
- Parses fixtures of `getRouteAndCompanyList`, `getRouteData` (including `header=003` / no data on one direction), and station lookups; builds a stop graph; finds a direct route on a fixture where one exists (e.g. a 10-like 關閘↔媽閣 sequence) and yields no invented in-vehicle times.
- Live-position fixture may be rendered as "bus at stop X"; a helper must not turn it into minutes via speed or distance.
- Park-then-walk ranks parks by router walk fixtures, never by displaying crow-flies as walking minutes; an empty park file or failed walks yields an honest unavailable option, not invented vacancy.
- Copy helpers never label the bundled DSAT snapshot as 即時, never label Open-Meteo or OSM routing as 官方觀測, never label a CORS failure as a live official empty arrival, and never label OSM parks as 交通事務局車位.
- A CORS / network failure path for DSAT live returns unavailable, while the snapshot plan can still be shown with its download date.
- Default origin is 議事亭前地 and default destination is 關閘總站 with the sourced coordinates above.
- Recommendation / emphasis helpers refuse to call a bus "faster" when in-vehicle minutes are missing.

Tests must be behaviour checks, not string-rename theatre. `npm test` must be green before claiming the build is done.

## Grok review bar (every review, including review-1)

Grok must do a **strict visual and layout pass at 390px** (Safari-equivalent viewport), and must **verify that live data actually loads**: a real walking route (duration consistent with walking, not driving) with climb / profile when the router provides it, or a clearly labelled failure; a real bus option from the official graph or a clearly labelled absence; park-then-walk from vendored OSM parks with a real walk, or an honest unavailable; source + time visible for each number. Block SHIP on anything amateurish, broken, overflowing, invented, or that looks like a reskinned 點去 / 斜路 / 雨勢 / 天色 / 潮候 / 就近 / 地勢 (especially colour-coded red/teal itineraries, cork section-drawing chrome, a weather-temperature hero, or a tabbed dashboard of the old tools). Block SHIP if walking minutes were clearly faked from crow-flies, if bus ETAs were invented from speed, if vacancy was invented, if a second walk is a duplicate path, or if the UI judges safety. Check the WebGL / `maplibregl.supported()` trap. If official live positions, Open-Meteo rain, or Overpass refresh are missing because of CORS or network, that is acceptable only when the unavailable line is honest and the static plan is still usable.

## Engineering constraints

- Static frontend only (HTML/CSS/JS), publishable by the orchestrator to GitHub Pages. No backend, no secrets, no keys.
- Cantonese UI only (a discreet 葡/EN place-name subtitle is optional, not a second app).
- Quota: if agy hits a hard usage limit, stop empty continue-loops; leave a note in the progress / report. Do not burn rounds on empty diffs after a hard limit.
- Visual quality is the #1 priority. Clean, deliberate, commercial. If the typography or the comparison looks amateur, it is not done.
