# Changelog

## Round 1 fixes

- **Interactive 2D Map Tapping**: Implemented click/tap listener on the 2D MapLibre map allowing users to select any coordinate in Macau as a destination, instantly updating routes and markers.
- **Native Auto-Suggest Datalist**: Added `<datalist id="macau-stops-list">` populated with all 457 unique station names and curated places, providing instant iOS Safari auto-complete and selection.
- **Strict Touch Target Compliance (≥ 44px)**: Increased tap sizes across all interactive controls (`.input-btn`, `.btn-swap`, `.chip-btn`, `.bus-var-btn`, `.map-toggle-btn`, and input rows) to at least 44px for thumb accessibility.
- **Origin Fallback Copy**: Added clear Cantonese indicator 「而家用澳門半島做起點（未開定位）」 per SPEC.md, updating seamlessly to 「已定位到你現時位置」 upon successful geolocation.
- **Transparent Attribution & Expiry**:
  - Walk Card: Displaying router name (OSRM/Valhalla), speed in km/h, and calculation timestamp.
  - Bus Card: Linked directly to DSAT public bus enquiry with official snapshot download date.
  - Rain Chip: Displaying Open-Meteo model prediction time with non-official disclaimer.
- **Timezone & Date Formatting**: Added `format === 'date'` support to `formatMacauTime` producing localized Macau dates (`YYYY年M月D日`).

## Round 2 fixes

- **Exact DSAT Station Coordinates Alignment**: Aligned all curated destination places (`M3/4 媽閣交通樞紐`, `T345/1 氹仔客運碼頭`, `T356/1 澳門機場`, `M172/1 亞馬喇前地`, `M239/2 外港碼頭`, `C689/1 和諧廣場/樂群樓`) with the official station snapshot coordinate payload (`stops.json`).
- **Additional Curated Destination**: Added Outer Harbour Ferry Terminal (`外港碼頭 M239/2`) to the quick-pick curated destination chips.
- **Route Staleness & Expiry Detection**: Stored `fetchedAt` on routing results and added staleness notification for tabs older than 24 hours per SPEC.md.
- **Default Origin Label Alignment**: Explicitly standardized default origin name to `澳門半島` matching the SPEC.md specification.

## Round 3 fixes

- **Destination Clear Button Interaction**: Connected `#btn-clear-dest` with dynamic visibility toggling based on destination text input, enabling single-tap destination field clearing and re-focusing.
- **Dynamic Origin Subtext Management**: Ensured the origin indicator subtext dynamically reflects swapped or manually selected origin points, reverting cleanly to 「而家用澳門半島做起點（未開定位）」 when set to default.
- **Non-blocking Status Feedback**: Replaced remaining browser `alert()` modal calls with integrated toast status banner notifications for non-blocking mobile UX.
