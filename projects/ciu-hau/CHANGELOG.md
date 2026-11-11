# CHANGELOG

## Round 1 fixes

- **Chart & 48-Hour Stage (Major 1)**:
  - Sliced Macau and HKO hourly time series to strictly 48 hours starting from local midnight today in Asia/Macau (`js/app.js`, `js/geo.js`).
  - Separated time ticks (Row 1) and day boundary labels 「今日」 / 「聽日」 (Row 2) onto distinct vertical baselines, preventing label collisions (`js/chart.js`).
  - Implemented proximity drop: if a 6-hour grid tick lands within 32px of an extreme callout, the tick text is omitted to avoid colliding labels (`js/chart.js`).
  - Set chart axis and tick text to spec stone `#6B7380` (4.8:1 contrast on `#FFFFFF`) (`js/chart.js`).
  - Repositioned low-tide callouts above dot when near bottom axis, preventing axis baseline collisions (`js/chart.js`).

- **Extremes Row & Date Filter (Major 2)**:
  - Replaced wrap-prone card grid with a single typographic nowrap row separated by hairline dividers inside a smooth horizontal scrolling container (`css/app.css`, `index.html`, `js/app.js`).
  - Filtered 「今日高低潮」 items to only those whose civil date in `Asia/Macau` matches today, preventing next day's extremes from appearing under today's heading (`js/app.js`).

- **Offline Fallback & Station Isolation (Major 3)**:
  - Restricted offline snapshot fixtures strictly to their respective stations: `hk-tao` for Tai O and `macau-inner-harbour` for Inner Harbour (`js/app.js`).
  - For all other stations, failed fetches cleanly clear old data, display `--` hero height, empty chart, and render an honest Cantonese connection failure message without showing another station's data (`js/app.js`).
  - When Tai O fallback loads, uncontained marine and weather fields are cleared and station name explicitly stays on Tai O (`js/app.js`).

- **Macau Curve Attribution (Major 4)**:
  - Added dedicated chart subtitle under the chart header dynamically displaying `Open-Meteo 模式預測（非官方潮汐表）` for Macau stations and `香港天文台官方天文潮汐表（海圖基準面）` for Hong Kong stations (`index.html`, `css/app.css`, `js/app.js`).

- **Scrub Status Copy (Minor 5)**:
  - Scrub badge now accurately distinguishes between `模式預測` for Macau Open-Meteo points and `天文潮` for Hong Kong Observatory official points (`js/app.js`).

- **Civil Date in Asia/Macau (Minor 6)**:
  - Added `getMacauCivilDate`, `getMacauCivilDateAddDays`, and `getMacauMidnightTimestamp` helpers to derive calendar days, tick hours, and midnight dividers strictly in `Asia/Macau` time (UTC+8) regardless of host timezone, handling year/month rollovers (e.g. Dec 31 to Jan 1) (`js/geo.js`, `js/chart.js`, `js/app.js`).

- **interpolateHkoHeight & Lone HLT (Minor 7)**:
  - Updated `interpolateHkoHeight` to return `null` when target time is outside the hourly bounds, with nullish coalescing `??` preserving 0.00m readings (`js/hko.js`, `js/app.js`).
  - Lone HLT extremes without neighbours leave `type: 'unknown'` without guessing based on 1.5m (`js/hko.js`).

- **Curve Stroke & Scrub Alignment (Minor 8)**:
  - Replaced cubic spline with crisp polyline matching linear interpolation, guaranteeing the scrub dot always sits directly on the stroke (`js/chart.js`).

- **Palette & Self-Hosted Fonts (Minor 9)**:
  - Updated `--color-stone` token from `#DDE3E8` to `#C8D0D6` matching spec (`css/app.css`).
  - Added self-hosted `Noto Sans TC` font file and `@font-face` declaration in `css/fonts.css`.
  - Added `Newsreader` font registration (`css/fonts.css`).

- **Inline Origin Button Touch Target (Minor 10)**:
  - Updated `.btn-default-origin` to `min-height: 44px; padding: 8px 6px;` meeting mobile touch target requirements (`css/app.css`).

- **Next-Tide Duration Wrap (Minor 11)**:
  - Formatted countdown duration as `仲有 <span class="u-nowrap">${hours}小時${mins}分</span>` with `text-wrap: pretty` to prevent orphan units (`js/extremes.js`, `js/app.js`, `css/app.css`).

## Round 2 fixes

- **Extreme Callout Collision Resolution on Tide Curve (Major 1)**:
  - Enforced a minimum 16px baseline separation between time and height text for peaks with sufficient headroom (`js/chart.js`).
  - Added spatial clearance detection: for low-tide troughs, near-baseline extremes, or intermediate extremes located within 36px of another callout, chart displays only the height in metres without colliding with polyline or adjacent labels, leaving exact times to the extremes row and scrub badge (`js/chart.js`).
  - Set font family for all numeric chart callouts to `'Newsreader', 'Source Serif Pro', Georgia, serif` (`js/chart.js`).

- **Extremes Rail Edge Fade & Overflow Indicator (Minor 2)**:
  - Added `-webkit-mask-image` and `mask-image` horizontal fade gradient on `.extremes-row-scroll` (`css/app.css`).
  - Increased right end padding on `.extremes-list` to 28px so any viewport clip gracefully fades out and indicates horizontal scrollability (`css/app.css`).

- **Accurate Empty Curve Error State Messaging (Minor 3)**:
  - Updated `TideChart.renderEmpty(message)` to accept custom error message strings (`js/chart.js`).
  - Updated `clearStationData` and `renderErrorState` to propagate the specific Cantonese connection failure message directly onto the SVG canvas (`js/app.js`).

- **Strict Null Handling for Out-of-Range Timestamps (Minor 4)**:
  - Removed fallback to `hourlyPoints[0].height` when `interpolateHkoHeight` returns `null` for timestamps outside the data range, ensuring hero displays `--` instead of an erroneous hour-1 reading (`js/app.js`).

- **CSS Syntax Cleanup (Minor 5)**:
  - Removed duplicate stray `margin-bottom: 8px;` and closing brace after `.chart-subtitle` in `css/app.css`.

- **Numeric Font Family Renaming (Minor 6)**:
  - Renamed `@font-face` family in `css/fonts.css` from `'Source Serif 4'` to `'Source Serif Pro'` to match actual file contents, and updated `--font-num` to prioritize `'Newsreader'` (`css/fonts.css`, `css/app.css`).

- **HLT Unknown Extreme Next-Tide Formatting (Minor 7)**:
  - Updated `findNextExtreme` in `js/extremes.js` to label an extreme of unknown type as 「潮位」 instead of defaulting to 「低潮」, consistent with `js/app.js`.

## Round 3 fixes

- **Extremes Rail Mask Inset (Minor 1)**:
  - Adjusted horizontal gradient mask to begin smoothly across the gap after the 2nd complete item (`68%` to `96%`), eliminating glyph clipping on 390px viewports (`css/app.css`).
  - Increased list end padding to 32px to ensure clean edge fading (`css/app.css`).

- **Near-Baseline Extreme Clearance (Minor 2)**:
  - Increased clearance for near-baseline low tide metres callouts to 16px above the dot (`metresY = y - 16`), completely clearing the zero line rule and preventing any text-rule collision (`js/chart.js`).
