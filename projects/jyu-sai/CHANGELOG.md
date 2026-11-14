# CHANGELOG

## Round 1 fixes
- Handled disagreement between RainViewer radar returns and Open-Meteo numerical forecast: states both sources explicitly in natural Cantonese without picking a fake winner or fabricating official observations.
- Implemented `sampleRadarReturn` to sample RainViewer tile alpha channel at coordinates (z=8) to detect actual rain returns near Macau in the browser.
- Displayed honest copy `澳門地球物理氣象局官方雨量未能喺瀏覽器讀取（來源無開放跨域）` with link `前往官網 ↗` directly on the panel when SMG XML cannot be fetched across origins.
- Displayed `呢個來源暫時未有未來雨勢預測` in the scrubber when RainViewer nowcast is empty, preventing frame invention.
- Added explicit `Open-Meteo 模式預測（非官方觀測）` and model timestamp with `預測` tag in the 15-minute timeline strip header.
- Enforced minimum 44px touch targets across scrubber slider, close buttons, and interactive links.
- Supported `prefers-reduced-motion` in cartographic camera movement (`jumpTo` instead of `flyTo`).
- Expanded test suite to 18 unit and integrity tests covering radar/forecast disagreement, touch accessibility, and empty nowcast handling.

## Round 2 fixes
- Added source update tracking with timestamp formatting (`formatMacauTime`) in the Details sheet, displaying last successful update time per data source.
- Added visual spin feedback animation to the manual refresh button (`.btn-icon.loading`), respecting `prefers-reduced-motion`.
- Implemented network status monitoring (`window.addEventListener('online' / 'offline')`) with status banners for smooth mobile connectivity recovery.
- Enhanced scrubber range slider event handling with both `input` and `change` listeners for fat-finger mobile Safari interactions, plus accessible `aria-valuenow` and `aria-valuetext` attributes.
- Added timeout guarding (1800ms) to `sampleRadarReturn` tile canvas inspection to prevent rendering stalls on slow networks.
- Expanded test suite to 19 unit and integrity tests, verifying Asia/Macau timezone formatting and UI styling rules.

## Round 3 fixes
- Added automated integrity testing asserting the absence of SPEC-forbidden items (temperature cards, UV, AQI, 7-day briefing, tide curves).
- Verified full-bleed responsive layout at 390px iPhone viewport with zero horizontal overflow.
- Validated all vendor dependencies and web font assets locally without external CDN requests.
- Maintained 20 passing unit and integrity tests covering cartography, radar parsing, forecast timing, and honest error handling.
