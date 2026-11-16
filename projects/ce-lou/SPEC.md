# 斜路 (Ce Lou)

A Macau-first *slope-aware walking* tool for a phone in a pocket. Open it and you should know, in a few seconds, how steep the walk is from here to a place you named — with a real pedestrian route, a real elevation profile, metres of climb, and stairs taken from the router, plus a second option when a meaningfully flatter or shorter walk exists. Not a walk-versus-bus planner, not a 3D terrain explorer, not a rain radar, not a facilities map.

Live URL will be `https://penny323mo.github.io/grokbot/projects/ce-lou/`.

User-facing copy is Cantonese (廣東話, Traditional Chinese). Timezone Asia/Macau. iPhone-first (Safari, 390px wide).

## Variety proof (vs last 5 nightlies)

| | Tonight: 斜路 | 點去 (11-16) | 雨勢 (11-15) | 地勢 (11-14) | 天色 (11-13) | 潮候 (11-12) |
|---|---|---|---|---|---|---|
| Type | slope-aware walking decision tool (elevation profile + optional flatter/shorter alternative) | trip decision tool (walk vs bus comparison) | live rainfall radar + nowcast | live 3D terrain + building-mass explorer | live weather now + forecast briefing | live tide + marine briefing |
| Subject | how steep a walk is: climb, grade, stairs, a gentler or shorter path when one exists | how to get from A to B on foot or by public bus | where rain is falling, when it may start or stop | relief, named hills, bridges, building height | temperature, sky, rain line, UV, warnings, compact AQI | tide height, waves, sea temp |
| Setting | present-day Macau streets, ramps and stairs (半島, 氹仔, 路環) | present-day Macau streets and bus routes | present-day Macau and nearby waters | present-day Macau landform | present-day Macau / HK weather points | present-day Macau and nearby HK waters |
| Style | warm cork typographic *section drawing*: the elevation profile is the hero; a modest 2D line map is supporting | cool mist-grey typographic journey planner; two itineraries; modest 2D line map | cool rain-washed typographic weather-graphics; the rain field is the stage | cool limestone daylight 3D cartography | warm ivory typographic weather, one large temperature | cool daylight typographic *chart*, Swiss grid, serif figures |
| Interaction | set origin / destination; read climb and a profile; switch 較平 vs 較短 when both exist | set origin / destination; read 行路 vs 巴士; tap an option to see the line | play / scrub radar frames; tap a place; read a rain-timing sentence | one-finger pan, pinch, two-finger rotate / pitch | swipe hourly filmstrip; tap a day; switch place | scrub a 48-hour tide curve; switch stations |
| Palette | cork field `#F4EFE6`, ink `#1C1916`, clay climb `#B44A2A`, sage gentler `#2F5E49`, stone descent `#5A6B75`, pale path `#E7D8C4` | cool mist grey `#EEF1F4`, ink `#16181D`, signal-red bus `#C8102E`, deep-teal walk `#0B6E6A`, spare butter chip `#F3E6B8` | cool concrete, charcoal, slate-rain, mulberry | cool limestone, iron-oxide, mineral grey-green water | warm ivory, sunlit ochre, straw sky | cool field, prussian ink, slate-blue |

No old Hong Kong / Macau nostalgia, no 1950s–70s street-life setting, no painterly oil look, no slow craft-and-story format. Tonight is **not** a walk-versus-bus comparison (點去), **not** a rainfall radar (雨勢), **not** a 3D terrain model (地勢), **not** a temperature / AQI / warning briefing (天色), **not** a tide chart (潮候), **not** a POI facilities map (就近, 11-11). Forbidden on this product: bus itineraries, live arrivals, a large temperature number, a 7-day / hourly weather filmstrip, UV, AQI, tide curves, 3D pitch/rotate terrain, category filters for toilets / car parks / pharmacies, a full-bleed rain mosaic, invented walking times, invented grades, and any "safe / unsafe to walk" judgement.

## Premise

You are in Macau and you need to walk somewhere that might be uphill — 東望洋, 望廈山, 路環的山路, a ramp, a flight of stairs. Open 斜路. A quiet typographic section is already there, defaulted to origin **議事亭前地** (Nominatim / OSM, 22.1938271, 113.5399903, probed 2026-11-17 00:55 Asia/Macau) and destination **東望洋燈塔** (Nominatim / OSM, 22.1964359, 113.5497062, same probe). One walking option is already computed from a real pedestrian router, with duration, distance, metres of climb and descent, a count of "stairs" maneuvers, and an elevation profile drawn from the router's own samples. If a second request (avoid hills / accept hills) returns a *meaningfully different* path, show 較平 and 較短 side by side. A compact 2D map shows the chosen line. A single rain sentence may warn that the walk is wet, clearly labelled as a model, never as a weather app.

This is a decision tool, not a dashboard and not a safety briefing. Climb and grade are descriptive. Never say a path is 安全, 危險, 適合或唔適合某類行人.

## Data sources (real, no keys, no invented numbers)

Never use a paid service. Never use an API key (including the data.gov.mo `APPCODE` / `ApiKeyAuth` gateway used by DSAT parking — out of scope). Never invent duration, distance, elevation, climb, grade, or stair counts. If a field cannot be read, omit it or say it is unavailable. Every number on screen shows **來源** and **更新時間** (converted to Asia/Macau, labelled).

### 1. FOSSGIS Valhalla pedestrian (the *walking* duration, geometry, elevation, and alternatives) — primary

- `POST https://valhalla1.openstreetmap.de/route` with `costing=pedestrian`, `units=km`, and `elevation_interval` (probe used 15). CORS `Access-Control-Allow-Origin: *`. HTTP 200.
- Licence / terms: public FOSSGIS / OSM.de Valhalla instance, no key, no SLA. Attribution required: OpenStreetMap contributors and FOSSGIS e.V. Link `https://valhalla1.openstreetmap.de` (or the FOSSGIS routing page) and `https://www.openstreetmap.org/copyright`. Debounce requests, cache the current A→B pair, do not hammer the public instance.
- Probe, 2026-11-17 00:55 Asia/Macau, pair approximately 議事亭→東望洋燈塔 at `22.1937,113.5406` → `22.19647,113.54996` (a few metres from the Nominatim curated coordinates above):
  - Default pedestrian + `elevation_interval=15`: **1.659 km, 1370 s (~22.8 min)**, elevation start 14.0 m / end 75.5 m / min 13.0 / max 82.7, **climb 98.4 m**, descent 36.9 m, 112 samples, maneuvers include 「松山晨運斜坡 Rampa do Padre Vasconcelos」 and two 「Take the stairs.」
  - `costing_options.pedestrian.use_hills=0` with a high `step_penalty` returned the **same** geometry as default on this pair (and on two Coloane probes). Do not pretend a second option exists when the shape is the same.
  - `use_hills=1` (accept hills): **1.55 km, 1306.6 s (~21.8 min)**, climb **117.6 m**, descent 56.1 m, three 「Take the stairs.」 maneuvers. This is a real, steeper, slightly shorter alternative.
- Always request `elevation_interval` (15 or 20) so `legs[0].elevation` is present. Climb and descent are the sum of positive / negative steps in that sample array. Grade for a segment is rise / `elevation_interval`, labelled as calculated from Valhalla samples, not as an official survey. Stair counts come only from router maneuvers whose instruction is about stairs (e.g. "Take the stairs."); never infer stairs from a bumpy profile.
- Request at least two costings for the same A→B: the default pedestrian route, and `use_hills=1`. Optionally also `use_hills=0` with a higher `step_penalty`. Keep an alternative only when it is meaningfully different: length differs by ≥ 50 m, or climb differs by ≥ 8 m, or the stairs-maneuver count differs, or the decoded shape is clearly not the same path. Otherwise show one route and say 「去呢度主要得呢條行人路」 (still with the profile — a single steep path is still the answer).
- If Valhalla fails, try FOSSGIS OSRM for the line and duration (below), then Valhalla `/height` for a profile along that shape. If elevation is missing, show the walk without a profile and say 「暫時未能讀到高度剖面」 — **no invented contour**. If both routers fail, show 「暫時未能計算步行路線」 and **no number at all**. Never fall back to straight-line distance or a fixed walking speed.

### 2. FOSSGIS Valhalla `/height` (elevation fallback along a known shape)

- `POST https://valhalla1.openstreetmap.de/height` with `range=true` and a `shape` of `{lat,lon}` points. CORS `*`, HTTP 200.
- Probe of the two endpoints only: `range_height` `[[0, 14], [1013, 75]]` (metres along the straight segment, heights 14 m and 75 m). A two-point request is **not** a route profile; only use `/height` along the *router*'s decoded shape (sampled), never along a crow-flies line presented as the walk.
- Same attribution as the route endpoint.

### 3. FOSSGIS pedestrian OSRM (walking fallback for duration and geometry)

- `https://routing.openstreetmap.de/routed-foot/route/v1/foot/{lon},{lat};{lon},{lat}?overview=full&geometries=geojson` (HTTP 200, CORS `*`).
- Probe of the same approximate Senado→Guia pair, 2026-11-17 00:55 Asia/Macau: **1511.6 m, 1209.6 s (~20.2 min), ~4.50 km/h** — a real pedestrian result. OSRM does not return elevation; if this fallback is the one that succeeded, get the profile from Valhalla `/height` along the OSRM geometry, or omit the profile honestly.
- Licence / terms: public FOSSGIS routing instance, no key, no SLA. Attribution: OpenStreetMap contributors and FOSSGIS e.V. Link `https://routing.openstreetmap.de` and `https://www.openstreetmap.org/copyright`.
- Do *not* use `router.project-osrm.org` for walking. (A previous nightly probe of a Macau foot pair on that host returned a ~36 km/h "foot" time. Forbidden as a walking source, even if the path says `foot`.)

### 4. Open-Meteo (one rain *hint*, not a weather product)

- `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&minutely_15=precipitation,precipitation_probability&forecast_minutely_15=8&forecast_days=1&timezone=Asia/Macau`. No key. When it responds, CORS has historically been `*`.
- Licence: Open-Meteo terms, attribution required, link `https://open-meteo.com`. Label: 「Open-Meteo 模式預測（非官方觀測）」 plus the series time, marked 預測.
- Probe note: on 2026-11-17 00:54–00:56 Asia/Macau this forecast URL timed out from the build box. The app must try the live fetch and, on failure, omit the rain line or say 「暫時未能讀到落雨預測」. Never invent rain. Never turn this into a weather briefing (no temperature hero, no UV, no AQI, no 7-day strip).
- Open-Meteo also has `https://api.open-meteo.com/v1/elevation?latitude=…&longitude=…`. A first probe returned point elevations `[19.0, 73.0, 31.0]` for Senado / Guia / a peninsula point — useful only as an optional point cross-check, **never** as a route profile and never as a substitute for along-route samples.

### 5. Map (supporting, 2D only)

- MapLibre GL, **2D only**, OpenFreeMap style `https://tiles.openfreemap.org/styles/positron` (or `/styles/liberty` if it better matches the cork field; both are no-key). Attribution: OpenFreeMap / OpenMapTiles / OpenStreetMap contributors.
- MapLibre is **vendored** in the repo. No CDN script tags for the library. No MapTiler, Google, Mapbox, Cesium ion, or other keyed tile services. No 3D terrain, no pitch/rotate "globe", no extruded buildings — that is 地勢, not this product.
- Map max bounds should keep the camera around Macau and the immediate bridges. The elevation profile, not the map, is the hero.

### 6. Place coordinates (curated list)

Default origin is **議事亭前地**; default destination is **東望洋燈塔**. Curated places must use the Nominatim / OSM coordinates probed 2026-11-17 00:55 Asia/Macau (attribute OpenStreetMap contributors, link `https://www.openstreetmap.org/copyright`; Nominatim usage policy: polite User-Agent, no hammering — these values are vendored at build time, not queried on every page load):

| Place | lat | lon |
|---|---|---|
| 議事亭前地 Largo do Senado | 22.1938271 | 113.5399903 |
| 東望洋燈塔 Farol da Guia | 22.1964359 | 113.5497062 |
| 媽閣廟 Templo de A-Ma | 22.1861086 | 113.5312671 |
| 望廈炮台 Fortaleza de Mong-Há | 22.2079651 | 113.5476729 |
| 黑沙海灘 Praia de Hác Sá | 22.1212703 | 113.5709904 |
| 疊石塘山 Alto de Coloane | 22.1206541 | 113.5612955 |

Do not add a place whose coordinates were not sourced. A 2026-11-17 Nominatim query for 「路環市政花園」 returned a park in Shandong, China — **rejected**, do not ship it.

Origin: browser geolocation when the user allows it, otherwise 議事亭前地, with a plain line 「而家用議事亭前地做起點（未開定位）」. The user can swap, pick from the curated list, filter by name, or tap the map. A map-tap is an origin or destination coordinate, never a fake official name.

### 7. Optional OSM stairs / ramps (do not block first paint)

- Overpass (`https://overpass-api.de/api/interpreter` and documented mirrors) may be used later to label `highway=steps` or named ramps near the route, attributed as OpenStreetMap. A previous nightly hit HTTP 502 on Overpass. Do not block the first route on it. Never invent a stair flight the router did not mention just because a nearby OSM step exists.

## What the first screen must do

First paint already shows a complete answer for the default A→B (議事亭前地 → 東望洋燈塔), not a blank form:

1. Origin and destination, editable, with locate and swap.
2. A typographic hero: walking minutes and metres of climb (or an honest unavailable state). Distance, descent, and stairs-maneuver count nearby, not in a stack of generic cards.
3. An elevation *profile* (SVG section) for the chosen route, with start/end heights and a clear horizontal distance axis. This is the visual centre of the product.
4. If a second meaningfully different route exists, two typographic options — 較平 (less climb, or fewer stairs) and 較短 (shorter distance or time) — tappable, each with climb + minutes. The profile and map follow the selected option. If only one path exists, do not draw a fake second option.
5. A compact 2D map of the chosen line, Macau-first.
6. Source + time for the router (and for rain, if shown).
7. Optional one-line rain hint, labelled 預測, or an honest failure.

Copy tone: short, spoken Cantonese, no marketing fluff. Example shape (numbers must come from the live or fixture router, not from this sentence verbatim if the live result differs): 「大約要行 23 分鐘，爬升約 98 米，途中有樓梯。」

## Art direction

Commercial typographic *sectional drawing* for a walk, not a hiking-game map and not a weather card. References (look, do not copy assets): **Komoot** (clean route + elevation profile, minute-and-climb first), **SwitzerlandMobility / swisstopo** hiking (clear grade language, daylight, no neon), **The New York Times** / serious news graphics for elevation sections (quiet axes, typographic numbers). Not AllTrails' busy photo chrome, not Strava's activity social feed, not Citymapper dark neon, not a card stack, not generic AI glass.

- Field `#F4EFE6`, ink `#1C1916`, climb / selected option `#B44A2A`, gentler-option line `#2F5E49`, descent / secondary axis `#5A6B75`, pale path wash `#E7D8C4`.
- Type: a distinctive, licensed-or-self-hosted pair — a sharp grotesque for UI (e.g. self-hosted IBM Plex Sans or a comparable grotesque already usable without a key) and a tabular / slightly editorial figure style for metres and minutes. No system-only stack that looks like a default template if a self-hosted face is feasible. All fonts relative-path, no runtime CDN required at ship.
- The profile and the climb figure are the hero. The map is supporting, compact, 2D, Macau-first. Plenty of air. Thumb-sized targets (≥ 44px). No dummy grey boxes, no Unsplash, no AI decorative images in the ship build. No contour-painting or nostalgic "old Macau hill" illustration.

## Interaction and layout (iPhone Safari, 390 × 844)

- First paint must already show a complete default A→B answer, not a blank form.
- All primary controls reachable with a thumb; hit targets ≥ 44px.
- At 390px: no horizontal overflow, no clipped metres or minutes, no overlapping source line, no destination field pushing the profile off-screen without a way to scroll. The profile must remain readable (not a 20 px squiggle). Test this width for real.
- Safe-area insets (notch / home indicator) respected. `env(safe-area-inset-*)`.
- Prefer CSS/SVG/MapLibre 2D. `lang="zh-Hant"` and a proper viewport meta. Static site on GitHub Pages (no server, no secrets, no keys). Relative paths. Vendor MapLibre and fonts locally.
- Locate is optional and forgiving. Check Safari.
- Prefer `prefers-reduced-motion`. Any input ≥ 16px.

## Tests (`npm test`)

Ship a Node test suite (`package.json` `"test": "node --test tests/*.test.js"`) that, at least:

- Parses a fixture of the Valhalla pedestrian JSON from the 2026-11-17 Senado→Guia probe (default, 1.659 km / ~22.8 min / climb ~98.4 m) into duration, distance, geometry, climb, descent, and stairs-maneuver count; asserts the probe-scale pedestrian speed is accepted.
- Parses the `use_hills=1` fixture (1.55 km / ~21.8 min / climb ~117.6 m) and classifies it as a meaningfully different alternative under the thresholds above.
- A pair of fixtures that share the same shape (default vs `use_hills=0` on this probe) is **not** presented as two options.
- A missing / failed router result yields an unavailable state, not a haversine or `distance / 1.25 m/s` fallback, and not an invented elevation profile.
- A fixture matching a `project-osrm.org`-style ~36 km/h "foot" result is **rejected** as a walking time.
- Climb / descent are computed only from the elevation sample array; a helper must not invent grade from crow-flies height (e.g. Open-Meteo point elevations of 19 m and 73 m alone are not a route profile).
- Copy helpers never label Valhalla, OSRM, OSM or Open-Meteo as 官方測量 / 官方觀測; never call a path 安全 or 危險; never label a CORS / network failure as an empty official profile.
- Default origin is 議事亭前地 with the Nominatim coordinate above; default destination is 東望洋燈塔 with the Nominatim coordinate above.

Tests must be behaviour checks, not string-rename theatre. `npm test` must be green before claiming the build is done.

## Grok review bar (every review, including review-1)

Grok must do a **strict visual and layout pass at 390px** (Safari-equivalent viewport), and must **verify that live data actually loads**: a real walking route (duration consistent with walking, not driving) with a real elevation profile for the default 議事亭→東望洋 pair, or a clearly labelled failure; climb / minutes / source + time visible; alternatives shown only when they actually differ. Block SHIP on anything amateurish, broken, overflowing, invented, or that looks like a reskinned 點去 / 雨勢 / 天色 / 潮候 / 就近 / 地勢. Block SHIP if walking minutes were clearly faked from crow-flies, if the profile was faked from two endpoint heights, if a second option is a duplicate path, or if the UI judges safety. Check the WebGL / `maplibregl.supported()` trap (MapLibre 4.x may not have `supported()` — detect canvas WebGL, do not call a missing helper and blank the map). If Open-Meteo rain is missing, that is acceptable only when the line is honest or omitted. If Valhalla elevation is missing but the walk loaded, the unavailable profile line must be honest.

## Engineering constraints

- Static frontend only (HTML/CSS/JS), publishable by the orchestrator to GitHub Pages. No backend, no secrets, no keys.
- Cantonese UI only (a discreet 葡/EN place-name subtitle is optional, not a second app).
- Hard constraints: relative paths only; works on GitHub Pages under `/projects/ce-lou/`; 0 console errors on a normal load (MapLibre missing-tile warnings at the edge of the bbox should be guarded or declared); no horizontal overflow at 360–430px; `manifest.webmanifest`, apple-touch-icon, `apple-mobile-web-app-capable`.
- Quota: if agy hits a hard usage limit, stop empty continue-loops; leave a note in the progress / report. Do not burn rounds on empty diffs after a hard limit.
- Visual quality is the #1 priority. Clean, deliberate, commercial. If the elevation typography or the profile looks amateur, it is not done.
