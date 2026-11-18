# Changelog

## Round 1 fixes
- Generated LineString stop-sequence geometry for direct bus itineraries in `bus.js` to ensure the bus route is visually rendered on the 2D supporting map.
- Added dynamic boarding (`上`) and alighting (`落`) stop map pins with distinct styling in `app.js` and `style.css` when switching to the Bus option.
- Added automated test assertion in `tests/bus.test.js` verifying that bus itineraries contain a valid LineString geometry and stop coordinates for map display.
- Verified all 27 unit, integration, and integrity tests pass without git commits.

## Round 2 fixes
- Implemented 1-transfer route finding algorithm in `bus.js` for destinations without direct bus routes, fulfilling SPEC line 117.
- Added UI support in `app.js` to render 1-transfer itineraries with intermediate transfer stop details and transfer leg geometry.
- Enriched the editorial decision sentence in `app.js` to comprehensively summarize all three options (Walk, Bus, and Park-then-walk).
- Added unit test in `tests/bus.test.js` verifying that 1-transfer bus routes are identified and structured correctly.
- Verified all 28 automated tests pass.

## Round 3 fixes
- Added official Macau LRT interchange recognition (`此站可轉輕軌`) on bus stops matching the official DSAT `metro` field (per SPEC line 117).
- Styled `.lrt-chip` badge in `css/style.css` for clear visual distinction without cluttering stop names.
- Verified all 28 automated unit, integration, and integrity tests pass.


