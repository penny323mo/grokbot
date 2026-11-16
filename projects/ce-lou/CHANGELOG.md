# Changelog

## Round 1 fixes
- Enhanced interactive elevation profile SVG with immediate `touchstart` response for smooth mobile scrubbing on iOS Safari.
- Added explicit external hyperlinks in footer for OpenStreetMap, FOSSGIS Valhalla Pedestrian, Open-Meteo, and OpenFreeMap.
- Added `@media (prefers-reduced-motion: reduce)` accessibility rule for reduced motion preferences.
- Added raw coordinate input support (`lat, lon`) with Macau boundary validation in origin/destination fields.
- Verified copy constraints (no safety assertions, no claims of official surveying).
- Verified test suite passes 23/23 tests.

## Round 2 fixes
- Added in-memory LRU route caching in `router.js` for identical origin/destination pairs to prevent unnecessary requests to the public FOSSGIS Valhalla instance (per SPEC line 35).
- Added unit test in `router.test.js` validating that repeated queries hit the cache without re-fetching.
- Added profile hint text clarifying that grade percentages are estimated from model elevation samples.
- Verified all 24 automated unit and integrity tests pass.

## Round 3 fixes
- Guarded MapLibre edge tile 404 error events to ensure clean console logging during edge-of-Macau panning (SPEC line 146).
- Enforced `overflow-x: hidden` on root elements to guarantee zero horizontal overflow across 360px–430px mobile viewports.
- Validated all 24 automated unit, integrity, and router tests.


