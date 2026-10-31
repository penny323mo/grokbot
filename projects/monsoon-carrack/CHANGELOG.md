# Changelog — 季風帆影 · Monsoon Carrack

## [1.0.0] - 2026-10-31

### Added
- **Diegetic Nanban Byōbu & Portolan Manuscript UI (`index.html`, `css/style.css`, `src/game.js`)**:
  - Built mobile-first (`390×844` and `375×667`) portrait layout styled with gold-leaf (`#C9A24A`), malachite (`#3F7D5C`), azurite (`#2E4F86`), vermilion (`#B6402C`), mulberry parchment (`#EADCB8`), and lacquer black (`#241C17`).
  - Implemented Title folding-screen scene, Port hub (Overview, Market, Dock, Letters), Portolan Chart Table with interactive port pins and route slips, Voyage illustrated event vignettes, Double-page Ledger & Chronicle book, Year-End Guild Settlement, and 4 Endings.
- **3-Year Monsoon Trade & Narrative Simulation (`src/data.js`, `src/game.js`)**:
  - 5 historical ports (`澳門 Macau`, `廣州 Guangzhou`, `長崎 Nagasaki`, `馬尼拉 Manila`, `麻六甲 Malacca`) with 20 directed routes governed by Southwest (`西南季風`) and Northeast (`東北季風`) wind seasons.
  - 7 historical trade goods (`生絲`, `絲綢`, `青花瓷`, `胡椒`, `丁香`, `白銀`, `蘇木／麝香`) with dynamic supply/demand, seasonal, rumour, reputation, and trade-pressure pricing.
  - 10 sea & port voyage events, 7 port letters across 3 years, and a 4-clue investigation into the disappearance of the brother's ship *Wanghai* (`《望海號》`).
- **Art, Self-Hosted Typography & CC0 Audio (`assets/`)**:
  - 41 `.webp` Nanban byōbu & portolan illustrations across `assets/art/`, `assets/ports/`, `assets/people/`, `assets/goods/`, `assets/events/`, `assets/ui/`, and `assets/endings/`, plus `assets/ART_REQUESTS.md`.
  - Self-hosted `Noto Serif TC`, `Ma Shan Zheng`, and `Cormorant Garamond` under `assets/fonts/`.
  - 6 CC0 `.ogg` ambient loops and SFX (`sea.ogg`, `harbour.ogg`, `creak.ogg`, `coins.ogg`, `paper.ogg`, `bell.ogg`) with mute persistence (`src/audio.js`).
- **Automated Integrity & Playability Test Suite (`tests/integrity.test.js`)**:
  - Verified price/route tables, asset file existence and relative paths, buy/sell/hold invariants, event/letter execution, and a 3-year simulated careful player campaign repaying the full 3,600-tael guild debt.

## Round 1 fixes
- **Enforced 120-Day Monsoon Clock (`src/game.js`)**: `beginVoyage` now checks `state.daysLeft < route.expectedDays` and sends the player through `advanceSeasonOrYear()` when remaining days cannot cover a voyage; `advanceVoyageStep` automatically triggers `advanceSeasonOrYear()` upon arrival whenever `daysLeft <= 0`.
- **Enforced 60-擔 Cargo Hold Cap & Smuggler Refusal (`src/data.js`, `src/game.js`)**: Added `grantCargo` free-space helper shared by `buyGood` and all narrative cargo grants (Guangzhou letter, Malacca letter, Smuggler event, Shipwreck salvage); fixed `ev_smuggler` choice 0 to refuse cleanly with no silver or cargo change when `silver < 120` or hold is full.
- **Gated Year-2 Brother Investigation Arc (`src/data.js`, `src/game.js`)**: Restricted `let_jesuit_cipher_y2` to granting only `clue_jesuit_cipher`, and gated `let_brother_rescue_y2` on possessing all three prior clues (`clue_logbook`, `clue_manila_draft`, `clue_jesuit_cipher`) without back-filling missing clue IDs, reducing its silver gift to 60/80 taels.
- **Locked Chart Table Pins & Fixed Aspect-Ratio Plate (`assets/art/chart_table.webp`, `css/style.css`, `src/data.js`)**: Exported a `720×560` (`9:7`) portolan chart plate with 5 unmarked port rings at fixed fractions (`guangzhou: 35.0/18.0`, `macau: 51.5/39.0`, `nagasaki: 70.0/20.0`, `manila: 71.5/56.0`, `malacca: 27.0/79.0`), matched `.portolan-map-wrap` to `aspect-ratio: 9 / 7` with `object-fit: fill`, and verified zero pin overlap across `390×844` and `375×667`.
- **Safe-Area Inset Padding & Polish (`css/style.css`, `src/game.js`, `src/data.js`)**: Added `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` padding to `.top-ribbon`, `.title-screen`, `.title-signboards`, `.port-stage`, `.chart-stage`, and `.slip-actions`; dropped duplicate TTF from `@font-face` in favor of `MaShanZheng-Regular.woff2`; disabled the 300-tael debt prepayment button when `silver < 300`; unified the storm jettison option (`ev_storm`) to 5 units across label, subtitle, and loop limit.

## Round 2 fixes
- **Smart Route Refusal on Chart (`src/game.js`)**: `beginVoyage` now checks if any other outbound route from the current port fits within `daysLeft`; if a shorter hop fits, it stays on the chart and shows a refusal toast listing the reachable ports, calling `advanceSeasonOrYear()` only when every outbound route exceeds `daysLeft`.
- **Pirate Porcelain Bribe Deduction (`src/data.js`)**: `ev_pirates` choice 1 now deducts up to 2 crates of `porcelain` from the hold (scaling `cargoCostBasis.porcelain` proportionally) in addition to 80 taels of silver, matching its label and updated sub-line.
- **Voyage/Ledger/Ending Safe-Area Bottom Inset (`css/style.css`)**: Added `env(safe-area-inset-bottom, 0px)` bottom padding to `.voyage-stage`, `.ledger-stage`, and `.ending-stage`.
- **30-Second Ambient Audio Loops (`assets/audio/sea.ogg`, `assets/audio/harbour.ogg`)**: Replaced the short ambient loops with 30.0-second seamless CC0 `.ogg` loops at the same relative paths.

## Round 3 fixes
- **Review Verification (`reviews/orch-r3-grok.md`)**: Round 3 review returned `VERDICT: SHIP` (Art 92, UI/Layout 93, Strategy 92, Story 92, Audio 92, Flow 92, Perf 93) with 0 CRITICAL, 0 MAJOR, and 0 MINOR issues; re-verified full `npm test` suite (6/6 passing).
