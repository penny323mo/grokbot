# 地勢 · Dei Sai — SPEC

Nightly 2026-11-14 (Asia/Macau). A practical, everyday **3D terrain map** of present-day Macau — not a game, not a weather briefing, not a tide chart, and not a nearby-facilities finder. Portrait iPhone-first (390×844, also 375×667 and 430×932), iPhone Safari first. Static web (HTML/CSS/JS, relative paths, no required build step to run). Deploys under grokbot `projects/dei-sai/`. All user-facing text in natural spoken Cantonese (Traditional Chinese). No English UI copy except unavoidable proper nouns and unit abbreviations explained in Cantonese.

Visual quality is the #1 priority: it must feel like a commercial 3D civic map, daylight and serious, not a toy globe, not a neon city, and not a 2D pin map with a pitch slider tacked on.

## Variety proof (vs last 5 nightlies)

| | Tonight: 地勢 | 天色 (11-13) | 潮候 (11-12) | 就近 (11-11) | 霜門守望 (11-04) | 鋦瓷記 (11-03) |
|---|---|---|---|---|---|---|
| Type | live 3D terrain + building-mass explorer (real open tiles) | live weather now + forecast | live tide + marine briefing | live 2D map utility (POI) | real-time tower defence | craft puzzle + story |
| Subject | relief, named hills, bridges, building height, a sampled elevation | temperature, sky, rain, UV, warnings, a compact AQI line | tide height, waves, sea temp | toilets, car parks, water, pharmacies, AED, clinics | fantasy glacier siege | porcelain mending |
| Setting | present-day Macau (peninsula, 氹仔, 路環), pan allowed to the immediate bridges | present-day Macau / HK weather points | present-day Macau and nearby HK waters | present-day Macau / HK streets | invented glacier kingdom | 1957 Yau Ma Tei |
| Style | cool limestone daylight 3D cartography; terrain is the stage; typographic labels | warm ivory typographic weather, one large temperature | cool daylight typographic *chart*, Swiss grid, serif figures | light civic wayfinding, warm bone paper, 2D map | matte low-poly clay diorama | oil painting |
| Interaction | one-finger pan, pinch zoom, two-finger rotate / pitch; tap a landmark; locate; flatten / 立體 toggle | swipe an hourly filmstrip; tap a day; switch place | scrub a 48-hour tide curve; switch stations | locate, filter categories, tap a place, walk-time | build / upgrade / aim, pan + pinch | slow staged craft taps |
| Palette | cool limestone field, charcoal ink, mineral grey-green water, iron-oxide accent | warm ivory, sunlit ochre, straw sky | cool field, prussian ink, slate-blue | bone paper, dry ink, persimmon, olive | glacier teal, indigo, saffron | cobalt, amber, teak |

No old Hong Kong / Macau nostalgia, no 1950s–70s street-life setting, no painterly oil look, no slow craft-and-story format. 就近 was a **2D facilities** map (toilets, parking, pharmacies); tonight has **no category filters and no POI types from 就近**. The map is a 3D relief model. 天色 and 潮候 were typographic briefing / chart products with no MapLibre stage; tonight is not a weather or tide product and must not show a forecast, AQI line, or tide curve.

## Premise

You are in Macau and want to *see the shape of the place*: how 東望洋山 sits above the peninsula, how 氹仔 and 路環 rise, how the bridges leave the shore, how tall a block is beside a hill. Open 地勢 and a pitched, daylight 3D model of Macau is already there. Drag to look around, pinch to close in, tilt to flatten or steepen. Tap a named hill or landmark to read its height. If location is denied or unavailable, start above **澳門半島** (22.1987, 113.5439) and say so plainly: 「而家用澳門半島做起點（未開定位）」.

Tone: serious, precise, cartographic. Like a well-designed municipal 3D geoportal on a phone, not a game camera and not a glass globe.

Always show, in Cantonese, that sampled heights are a terrain estimate unless a figure is tagged from OpenStreetMap: 「山勢高度來自地形資料，只供參考。」

## Data sources (real, no keys, no invented numbers)

Every number on screen must come from one of these sources, or from a DEM sample clearly labelled as a terrain estimate. Never invent a coordinate or an elevation.

### 1. OpenFreeMap vector tiles + style (basemap and 3D buildings)

- Style (no key, CORS): `https://tiles.openfreemap.org/styles/liberty` (or `positron` as a starting point, then restyled to tonight's palette).
- Site: [OpenFreeMap](https://openfreemap.org/). Data is OpenStreetMap, licence [ODbL](https://opendatacommons.org/licenses/odbl/).
- The liberty style already includes a `building-3d` `fill-extrusion` layer from the `building` source-layer. Tonight **the 3D buildings must be on in the default view** (pitched), using height from the tile properties (`render_height` / `height` / `levels`, in that order of preference). If a building has no height, extrude a modest default **and do not label that default as a measured height**.
- Restyle land, water, roads and labels toward tonight's limestone / ink palette so the map and the chrome are one product. Water must stay a **mineral grey-green**, not a weather-cyan or tide-prussian. No dark basemap.
- Attribute OpenFreeMap and OpenStreetMap in the footer.

### 2. AWS / Mapzen terrain tiles (raster DEM, no key, CORS)

- Template (verified 2026-11-14, `Access-Control-Allow-Origin: *`): `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`
- Encoding: [Terrarium](https://github.com/tilezen/joerd/blob/master/docs/formats.md#terrarium) (`height = r * 256 + g + b / 256 - 32768` metres).
- Dataset: [Registry of Open Data on AWS — Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) (Mapzen / tiles originally from SRTM, GMTED, ETOPO1 and others). Enable MapLibre `raster-dem` terrain and a discreet hillshade. Default exaggeration may be **1.3×** so Guia and Coloane read on a 390px screen, but the UI must say 「高度誇張 1.3 倍」 (or the actual factor) whenever it is not 1.0. A control can reset to 1.0×.
- Attribute the terrain tiles (Mapzen / AWS Terrain Tiles, SRTM and other included sources) in the footer.
- If a terrain tile fails, keep the 3D buildings if they still load, flatten the DEM, and say 「地勢暫時載入唔到」 — never fake hills.

### 3. Landmark gazetteer (OpenStreetMap, ODbL)

Ship a committed `data/landmarks.json` built from OpenStreetMap (Overpass during development; the live app reads the file, and may optionally refresh from a public Overpass instance if CORS allows — if the live refresh fails, keep the shipped file and say so).

Must include at least these *kinds of* places, looked up for real, never guessed: the highest named peaks / hills in 澳門半島, 氹仔 and 路環 (e.g. 東望洋山 / Guia, 疊石塘山 if present in OSM); 澳門塔; 大三巴牌坊; 議事亭前地; 媽閣廟; 氹仔官也街 / 氹仔市中心; 路環市區; the Macau ends of the three road bridges and 港珠澳大橋. Each record: `id`, Cantonese `name`, optional English `name_en` only as a subtitle, `lat`, `lon`, `kind` (山丘 / 地標 / 橋 / 廣場…), `ele_m` (only if OSM has `ele` or `height`), `ele_source` (`osm:ele`, `osm:height`, or `dem` if sampled), `osm_type`, `osm_id`.

If OSM has no elevation, either omit `ele_m` and sample the DEM at that point in the running app, labelled 「地形高程（DEM）約 N 米」, or pre-sample the DEM while building the file and set `ele_source` to `dem`. **Never invent a nice round number.** A missing height is 「高度不詳」, never 0 m presented as a measurement.

Coordinates must fall inside a generous Macau-and-bridges box (about 22.06–22.26 N, 113.50–113.65 E). A unit test must reject any landmark outside that box.

### 4. Geolocation

Browser geolocation when the user taps locate. Default origin **澳門半島** 22.1987, 113.5439 (same peninsula starting point as 天色 / 就近, so the three tools agree). If locate succeeds inside the bounding box, fly the camera there (keep pitch). If the point is clearly outside (e.g. far in Hong Kong or the mainland), say so and stay on the Macau model, or offer a single honest jump only as far as the 港珠澳大橋 Macau side — do not turn this into a Hong Kong map product.

## Art direction

Name three real commercial references and stay close to them. Do not invent a fourth "AI SaaS" look.

1. **Apple Maps 3D (daylight)** — terrain and building massing as the stage; labels few and typographic; chrome almost absent; no game-like camera swoops.
2. **Swisstopo / Swiss Federal Geoportal 3D** — serious cartography, the landform is the point, restrained colour, height treated as data.
3. **The New York Times 3D locator maps** — editorial typography over a model, one accent for the selected place, no stacked UI cards.

Forbidden: dark glass, neon, night-city cyber grids, gradient meshes, generic stacked white cards with drop shadows, Inter/Roboto "startup" look, emoji-as-icons, playful mascots, skeuomorphic paper, a generic Google/Mapbox demo look, a dark globe, a 2D pin-and-category clone of 就近, warm ivory weather chrome (天色), cool prussian chart chrome (潮候), bone-and-persimmon wayfinding (就近), glacier teal / saffron, oil-paint cobalt/amber.

### Palette

- Field / UI chrome: `#E8E6E1` (cool limestone, not warm ivory and not bone-civic)
- Ink: `#1A1C1B`
- Quiet stone / rules: `#C5C1B8` and `#6E6A63`
- Water on the map: `#8A9590` (mineral grey-green)
- Terrain should read as dry limestone and vegetation in muted olive-stone, not saturated park-green and not tropical postcard teal
- Accent (selected landmark, locate, 立體 toggle on): `#7A3E2B` (iron oxide)
- Error / missing: ink on a quiet warm-stone field `#E4D4C8`, not neon red

### Type

- Wordmark and UI: **Noto Sans TC** (self-hosted). No serif display — 潮候 already used a serif editorial voice.
- Heights, coordinates and other numbers: a self-hosted Latin sans with **tabular lining figures** (Source Sans 3 is fine), so "91 米" does not jitter.
- Body ≥ 15px, contrast ≥ 4.5:1. The selected place name may go large (in the 28–40px range) in the bottom sheet; the height figure may be larger still, typography not a badge.
- System stack as fallback only: `"PingFang TC", "Noto Sans TC", -apple-system, "Helvetica Neue", sans-serif`.

### Iconography

A tiny custom SVG set (geometric, ~2px stroke, no emoji, no icon font): locate, compass / reset north, flatten vs 立體, search. Landmarks on the model are small typographic labels or a single iron-oxide pin for the *selected* place only — not a spray of colourful category icons.

## Interaction & layout (390px first)

The 3D model is the stage. Chrome is a thin top bar and a slim bottom sheet. Do not build a stack of cards, a category rail, or a weather / tide panel.

1. **Top bar** — wordmark 「地勢」, the current place or 「澳門」, a locate control ≥ 44px, a compass / reset control, clear of the notch and home indicator.
2. **The model** — on first paint, a pitched (~55°) daylight view framing 澳門半島 + 氹仔 + 路環, north-ish with a slight oblique bearing so hills and towers read in perspective. Buildings extruded. Terrain on. One-finger pan, pinch zoom, two-finger rotate and pitch (MapLibre defaults are fine if they are forgiving). A short first-run hint, once, in Cantonese: 「兩隻手指可以轉同斜」; dismiss on first gesture and do not show again that session.
3. **立體 / 平面 toggle** — ≥ 44px. 平面 eases pitch toward 0 and may drop extrusion to a quiet footprint; 立體 returns to the default pitch and extrusion. Default is 立體.
4. **Height exaggeration** — default 1.3×, labelled in the footer or a quiet chip; a control to set 1.0×. Do not hide the factor.
5. **Gazetteer** — a search field (input font-size ≥ 16px) that filters the shipped landmarks. Tapping a result flies the camera and opens the sheet. A short horizontal rail of a few named hills (not facility categories) is allowed as a shortcut.
6. **Tap / long-press the terrain** — a slim bottom sheet (not a modal stack): name if it is a landmark, otherwise 「呢個位置」; latitude / longitude to a honest precision (4–5 decimal degrees is enough); height as OSM figure or 「地形高程（DEM）約 N 米」 or 「高度不詳」. Close with a large target. Do not overload the sheet with Wikipedia essays.
7. **Locate** — fly to the user if inside the box; otherwise the honest Macau-default copy above.
8. **Footer** — sources (OpenFreeMap, OpenStreetMap ODbL, AWS/Mapzen Terrain Tiles / SRTM), licence-level credit, the height-disclaimer, exaggeration factor, and a last-loaded time in Asia/Macau.

Empty and error states are designed, in Cantonese: network failed, tiles incomplete, location denied (still showing 澳門半島). Prefer `prefers-reduced-motion`: first camera move is instant or a short ease, no looping orbit.

Map max bounds should keep the camera around Macau and the immediate bridges (do not let the user spin out over the Pacific). Min/max zoom chosen so the whole SAR fits on a 390px screen at the wide end, and a street block is readable at the close end.

## Hard constraints

- Static files: `index.html`, `css/`, `js/`, `data/landmarks.json`, `assets/` (fonts, icons), vendored MapLibre. Relative paths only. Works on GitHub Pages under `/projects/dei-sai/`.
- MapLibre GL JS is **vendored** in the repo (BSD-3-Clause). No CDN script tags for the library. No MapTiler, Google, Mapbox, Cesium ion, or other keyed tile services. No secrets.
- No invented data. A renderer must not show a height, coordinate, or "N 米" that was not in OSM, the DEM sample, or the shipped gazetteer.
- 0 console errors on a normal load (MapLibre missing-tile warnings at the edge of the bbox should be guarded or declared). No horizontal overflow at 360–430px. `env(safe-area-inset-*)`. `touch-action` chosen so map gestures still work; tappable chrome ≥ 44×44px. Any input ≥ 16px.
- `manifest.webmanifest`, apple-touch-icon, `apple-mobile-web-app-capable`.
- Prefer `prefers-reduced-motion`.
- `npm test` (node) must be green.
- Performance on iPhone Safari: the default view must be usable (terrain + buildings) without jank so bad the model cannot be rotated. If needed, cap building extrusion to a sensible zoom, and keep the default pitch/zoom inside what a phone can hold.

## Tests (`tests/`, node, no browser required)

Must include at least:

- Terrarium decoder: a fixture RGB triple decodes to a known metre value with the formula `r * 256 + g + b / 256 - 32768`; decoder does not treat a missing tile as 0 m of real ground.
- Default origin is 澳門半島 (22.1987, 113.5439) when geolocation is absent.
- Every shipped landmark in `data/landmarks.json` has `lat`/`lon` inside 22.06–22.26 N, 113.50–113.65 E, a Cantonese `name`, a `kind`, and an `ele_source` that is one of `osm:ele` / `osm:height` / `dem` / `none`. If `ele_source` is `none`, `ele_m` is absent (not 0).
- At least one named hill on the peninsula, one on 路環 (or the highest available OSM peak in Macau), and 澳門塔 are present.
- Height copy helper: OSM elevation → 「N 米」 (or the wording in the app) without a DEM disclaimer; a DEM sample → must include 「地形」 or 「DEM」; missing → 「高度不詳」, never 「0 米」.
- Exaggeration helper: 1.3 is labelled; 1.0 is labelled as 1.0 or as not exaggerated, and is not silently shown as 1.3.
- Locate policy: a point in central Macau is accepted; a point clearly outside the box (e.g. 22.30, 114.17 Tsim Sha Tsui) does not silently become the camera target without the out-of-area copy.
- Time display in Asia/Macau, not UTC, for the footer clock.
- Bounding-box helper used by the map max-bounds must include 路環 and 港珠澳大橋 Macau side, and must not be so tight that 路環 is clipped at the default frame.

## Review bar (every grok review)

Every grok review must:

- Do a strict visual and layout pass at **390px** (and note 375 if something breaks).
- Verify **live 3D actually loads**: the default Macau view is pitched, terrain relief is visible (hills are not a flat plane), and building massing is extruded. If terrain tiles fail, the fallback copy is honest and buildings (if present) still explain the state. This must not ship as a 2D pin map.
- Walk the real tap flow: default 澳門半島, rotate and pitch with two fingers (or the documented control), toggle 立體 / 平面, open a landmark, read a height and its source, use search, use locate (grant and deny conceptually), confirm source lines, exaggeration label, and the height disclaimer.
- **SHIP is forbidden** while anything looks amateurish, overflows, uses a forbidden visual style (especially a dark neon globe, a generic Mapbox demo, or a 就近-style category pin map), shows invented heights, has a flat 2D-only default, has untappable controls, or leaves Cantonese copy stiff / templated / bilingual-for-no-reason.

## Out of scope

Games, accounts, nearby toilets / parking / pharmacies / AED / clinics, live weather, tides, bus arrivals, turn-by-turn navigation, Street View, paid or keyed tile APIs, scraping, push notifications, social features, period or nostalgic story layers, a Hong Kong-wide 3D city map.
