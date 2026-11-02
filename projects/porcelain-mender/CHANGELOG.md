# CHANGELOG — 鋦瓷記 · The Porcelain Mender

## [1.0.0] - 2026-11-03

### Added
- **Core Narrative & 12-Day Campaign**:
  - Full 12-day story arc set in 1957 Yau Ma Tei, Temple Street, Hong Kong.
  - Distinct Cantonese dialogue voices for all characters (劉婆, 陳太, 細路明, 林生, 何老闆, 包租公, 黃老闆, 水客九叔, 葉伯).
  - Four branching story arcs: the pawnshop fake "Ming" dragon bowl, the Chaozhou refugee family's teapot, the teahouse owner facing the arrival of mass-produced plastic/enamel wares, and letters from Uncle Yip's daughter in Shantou via Macau courier.
  - 4 unique illustrated narrative endings (Reunion / Apprentice / Peaceful Retirement / Community Pillar).
- **Tactile 7-Stage Craft Loop**:
  - Stage 1: Customer arrival, inquiry into object backstory, price quotes (fair, high, charity/free).
  - Stage 2: Sort & clean with cloth wipe and dust cleaning feedback.
  - Stage 3: Geometric puzzle reassembly with 28px forgiving auto-snap, rotate button (≥ 44px), and ceramic clink audio feedback.
  - Stage 4: Staple marking along crack edges with spacing analysis (penalizing < min and > max staples, rewarding uniform spacing).
  - Stage 5: Rhythm-based bow-drill action with diamond-point friction sound effects.
  - Stage 6: Hammering real antique brass staple sprites (鋦釘 / 蚂蝗钉) into place, sealing paste, and physical water test (watertight vs. leaky).
  - Stage 7: Hand-back settlement, customer evaluation, paper ledger bookkeeping, and calendar flip.
- **Diegetic UI & Mobile-First Styling**:
  - Built strictly for iPhone Safari portrait (390×844 and 375×667), responsive, safe-area aware.
  - Diegetic components: Felt workbench pad, paper ledger (流水賬), torn calendar (老黃曆), brass staple tin, oil lamp glow.
  - Authentic mid-century palette: Cobalt 青花 (`#2F4F7F`), Lamp Amber (`#E2A04A`), Brass (`#B08A3E`), Felt Oat (`#CFC3A8`), Teak (`#5A3B26`), Dusk Slate (`#46505E`), Paper Cream (`#EFE4CC`), Chinese Ink (`#1C1A17`).
  - Zero emoji, zero floating card stacks, zero dark glass or neon.
  - All interactive tap targets ≥ 44px, body text ≥ 15px, high contrast ≥ 4.5:1.
- **Physical Procedural WebAudio System**:
  - Multi-bandpass resonant ceramic clink synthesis (`playPorcelainClink`).
  - Cloth wipe friction sound (`playClothWipe`).
  - Bow-drill grinding whirr (`playBowStroke`).
  - High-frequency metallic hammer ping (`playHammerTap`).
  - Moving-filter liquid pour sound (`playWaterPour`).
  - Rain and Temple Street night ambiance (`startAmbience`).
  - Diegetic mute toggle with persistence in `localStorage`.
- **Art Direction & Museum Asset Pipeline**:
  - High-resolution museum orthographic catalogue photography for porcelain pieces.
  - Mid-century oil-painting film poster aesthetic for character portraits and street vignettes.
  - Real photo-textured brass staple sprite (`assets/art/staple_brass.webp` and `.png`).
  - Traditional red-lined manuscript letter paper (`assets/art/letter_paper.webp`).
  - Complete art manifest documented in `assets/ART_REQUESTS.md`.
- **Test Suite & Verification**:
  - 17 unit tests under `tests/` using Node's native test runner (`node --test`).
  - Tests covering job data integrity, asset reference validity, shard geometry coverage and solvability, staple spacing scoring, and economy solvability (careful player pays rent, careless player fails).

## Round 1 fixes

### Critical Fixes
- **Centroid & Scatter Solvability (CRITICAL 1)**: Corrected the Shoelace formula factor in `src/engine/shard-generator.js:42` from `points[j][0] * points[i][0]` to `points[j][0] * points[i][1]`. Added polygon bounding box validation, clamped scattered shards within canvas bounds with a minimum margin of ≥ 24px (`[24, 696]`), and added automated unit tests in `tests/shards.test.js` validating centroid and bounding-box margins across all 12 days.
- **Scene & Ending Vignette Duplication (CRITICAL 2 & MINOR 13)**: Replaced copied ending vignettes with 4 distinct historical 1950s oil paintings (`ending_reunion.webp`, `ending_apprentice.webp`, `ending_peaceful.webp`, `ending_community.webp`). Repainted `jordan_pier.webp` removing modern high-rises in favor of misty Victoria Peak ridgeline, repainted the wall calendar on `landlord.webp` from 1959 to 1957, removed Latin sign artifacts from `ending_apprentice.webp`, and documented the new assets in `assets/ART_REQUESTS.md`.

### Major Fixes
- **Settlement Ledger Math (MAJOR 3)**: Implemented `recordDailySettlement` in `src/engine/economy.js` which immediately deducts daily living costs ($-1.5$) and rent (if Day 6 or 12), ensuring the printed settlement breakdown strictly and mathematically sums to the final displayed balance (`opening + earned - 1.5 - rent = balance`). Added unit tests in `tests/economy.test.js`.
- **Shard Rotation Control (MAJOR 4)**: Implemented full quarter-turn geometric rotation in `rotateSelectedShard()`. Rotates `s.polygon` points by 90° about its centroid, tracks `s.rotation`, updates the HUD with angle feedback, and automatically aligns back to canonical orientation when snapping into place.
- **Bow Drill Timing & Chipping Penalty (MAJOR 5)**: Slowed bow oscillation step to `1.6` so the sweet spot lasts ≥ 220ms (measured ~350ms). Fast, early, or late strokes outside the sweet spot trigger a physical chipping penalty: plays dull porcelain clink, deducts 10 points from the evaluation score, adds mini-cracks (`chippedCracks`) drawn on the canvas, and displays a HUD warning.
- **Stage 6 Staple Hammering & Water Test (MAJOR 6)**: Stage 6 now starts with empty drilled holes. Tapping hole pairs hammers brass staple sprites one-by-one with realistic hammer tap sounds, consuming 1 staple per strike and fading the crack line beneath. Completing all staples unlocks the `抹灰試水` button, which runs an animated water pour clipped to the ceramic plate that beads droplets on leaky repairs.
- **UI Palette, Black Bar Elimination & Font Floors (MAJOR 7 & MINOR 12)**: Enforced a strict ≥ 15px font floor across all body elements (`title-badge`, `calendar-year`, `calendar-label`, `customer-role`, `customer-piece-badge`, `inquiry-btn`, `ledger-table`, hints, and credits). Replaced dark-glass translucent bars with authentic teak wood strips with brass borders (`#3A2A1E`, border `#B08A3E`, text `#EFE4CC`). Eliminated pure `#FFF` in piece badges and drill buttons in favor of paper cream `#EFE4CC`. Converted dialogue box to `flex: 1; min-height: 140px;` preventing speech clipping on 375×667.
- **Cantonese Dialogue Registers & Accuracy (MAJOR 8)**: Rewrote Uncle Yip's lines on Day 1, Day 2, and Day 12 from 書面語 into authentic spoken Cantonese. Corrected typo 「完壁」 to 「完璧」, replaced 「十元大洋」 with 「十蚊港紙」, and changed coolie son's phrase 「御用」 to 「私家大飯碗」. Added diverse moral and dilemma choice shapes on Pawnshop, Landlord, and Courier days.
- **Physical Procedural Audio Enhancements (MAJOR 9)**: Started the triangle friction oscillator in `playBowStroke`, replaced the single-tone beep in `playHammerTap` with high-frequency noise shaped through dual resonant bandpasses (3400Hz & 6200Hz), and added subtle valve hum (174.6Hz) and rain-on-canvas awning filtering in `startAmbience`.
- **Street Vignettes, Secondary Jobs & Dynamic Letters (MAJOR 10)**: Added scene vignette headers (`#day-vignette-banner`) displaying each day's authentic setting before meeting the customer. Added secondary quick repair jobs on market days (Day 1: spoon, Day 7: gaiwan cup stand). Added dynamic three-phase letter progression in the Chapters modal (Day 1–7 draft home letter, Day 8–11 daughter's letter with broken spoon, Day 12 travel permit reunion letter). Prominently integrated Uncle Yip's portrait (`yip_self.webp`) in the dialogue box and credits craftsman profile.

## Round 2 fixes

### Critical Fixes
- **Day 2 Skip / Leak Callback Elimination (CRITICAL 1)**:
  - Removed `.onclick` dynamic mutation from `#btn-proceed-stage`. `#btn-proceed-stage` now exclusively advances stages via its `advanceCraftStage()` listener (Stage 2 -> Stage 3 -> Stage 4 -> Stage 5).
  - Added dedicated `#btn-water-test` and `#btn-wipe-paste` buttons in `index.html` with explicit event listeners.
  - Explicitly reset `proceedBtn.onclick = null` in `startWorkbenchStage()` and reset all button visibility and stage states on each day start, guaranteeing Day 2 cannot inherit any water test callback and properly advances into Stage 3 (Assemble Shards).

### Major Fixes
- **Street-Date Vignette Banner Stack & Layout (MAJOR 2)**:
  - Converted `.day-vignette-overlay` in `css/style.css` to a stacked column layout (`display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-start; gap: 2px;`) so the day title sits vertically above the scene description.
  - Set `.day-vignette-banner` to `min-height: 96px; height: auto;` allowing the banner to grow naturally without clipping or horizontal collisions on 390×844 and 375×667 viewports.
- **Physical Water Pour & 糯米灰 Rice Paste Action (MAJOR 3)**:
  - Added physical 糯米灰 sealing step after hammering staples: clicking `#btn-wipe-paste` plays `playClothWipe` and renders pale translucent rice slurry seam seals along all crack edges on canvas.
  - Replaced the sentence overlay with a physical animated water pour directly rendered onto the ceramic dish: fills water inside the plate rim with expanding concentric ripple waves (`requestAnimationFrame` over 1.2s). Leaky repairs bead water droplets trailing off the plate rim onto the felt cloth.
- **Organic Transverse Fractures & Clamp-Sized Staples (MAJOR 4)**:
  - Overhauled `src/engine/shard-generator.js` from 4 radial pie spokes meeting at a central point to an authentic jagged transverse fracture spine traversing the plate with staggered branching cracks.
  - Verified exact partition math, crack edge counts, and full coverage across all 12 campaign jobs in unit tests.
  - Increased staple composite sprite size from 48×40 to 80×64 canvas pixels in `renderCanvas()`, enabling 螞蝗釘 claws to bridge across the crack seams.
- **Missed Bow Stroke Failure & Thick Porcelain Chips (MAJOR 5)**:
  - Updated `handleBowDrillStroke()` so that any missed stroke outside the sweet spot immediately sets `watertight = false`, drops score by 30 points, sets rating to `leaky`, and creates a prominent porcelain chip.
  - Rendered physical glaze chips in `renderCanvas()` with an exposed dark terracotta biscuit core (`#3A271D`, radius 15–23px), a thick 6px white glaze fracture rim (`#FBF8F0`), and radiating crimson stress micro-cracks.
- **Side Job Row & Honest Arithmetic (MAJOR 6)**:
  - Added dedicated printed row `<div id="settle-sidejob-row">` on the settlement card.
  - Removed unmentioned perfect-work tip from quick side job tap in `handleSecondaryJob()`, awarding the flat advertised reward ($1.0) and updating the balance strictly to $7.0 ($6.0 opening + $1.5 wage - $1.5 living + $1.0 side job = $7.0).
  - Styled `#btn-secondary-job` with `word-break: keep-all; white-space: normal;` preventing the word "羹" from orphaning.
- **Spoken Cantonese Consistency Across Inquiries & Dialogues (MAJOR 7)**:
  - Rewrote all `inquiryTopic` strings across all 12 days into natural spoken Cantonese (e.g. “打聽呢隻盤嘅來歷”, “打聽碟上對蝶嘅寓意”, “摸摸阿明個頭，問佢阿爸做邊行”, “睇真啲圈足同青花發色”, “拆開阿娟寄嚟嘅家書信札”).
  - Rewrote literary spoken lines in `src/data/jobs.js` into natural 1957 Cantonese (replaced “蓬蓽生輝” with “親自大駕光臨”, rewrote Day 5 and Day 8 dialogue).

### Minor Fixes
- **Shard Rotation Constraint for Snap (MINOR 8)**:
  - Enforced in `handleReassembleTap()` that a shard only snaps into its canonical dish slot if its rotation is aligned to $0^\circ$ ($\pmod{360}$). If not aligned, retains the player's rotation and prompts with angle feedback.
- **Chronological Ledger Display (MINOR 9)**:
  - Updated `renderLedgerRecords()` to render rows in chronological play order from oldest to newest, matching the new title `油麻地攤檔流水賬（時序記賬）` so arithmetic flows seamlessly down the column.
- **Stall Signboard Title Buttons & Modal Close Labels (MINOR 10)**:
  - Replaced "✕" with the word "關閉" styled as traditional cinnabar wax paper seals across all modal screens.
  - Styled title action buttons as weathered carved wooden stall signboards with brass gilt borders (`#3A2619`, border `#B08A3E`) and vermilion primary signboard (`#8B2518`, border `#E2A04A`).
- **Asset Text Cleanup (MINOR 11)**:
  - Inpainted and removed the Latin text ("REDIFFUSION" and "64") on the wooden loudspeaker radio box in `assets/scenes/ending_community.webp`, blending seamlessly with the vintage wood texture under 250KB.

## Round 3 fixes

### Major Fixes
- **Physical Water Pour & Felt Seepage Droplets (MAJOR 1)**:
  - Eliminated the concentric ripple rings from the water test animation on canvas, replacing them with a natural rising pool from dish foot to inner rim (`rgba(125, 185, 235, 0.45)`).
  - Implemented persistent dark damp felt stains (`rgba(20, 38, 55, 0.60)`) and 7 glistening three-dimensional water beads (complete with drop shadow, deep blue core, and specular reflection) sitting outside the rim on the felt pad for the entire duration of a leaky pour.
- **Authentic Multi-Tone 糯米灰 Rice Paste Slurry Seam (MAJOR 2)**:
  - Upgraded the wiped rice paste stroke to render an earthen slurry border (`lineWidth: 10`, `rgba(105, 80, 55, 0.75)`), a warm slurry body (`lineWidth: 7.5`, `#C4B49A`), and a fine core highlight (`lineWidth: 2.5`, `#DDD2BE`), providing rich, readable contrast against both cobalt underglaze and white porcelain biscuit.
- **Day 2 Clean Shard Silhouette & Alpha Keying (MAJOR 3)**:
  - Keyed out the contact-shadow fringe from `assets/plates/plate_02_famille_rose.webp` with an anti-aliased circular alpha mask at $r=334$ and rescaled the gilt rim to diameter 776 within the 900×900 image. This eliminates the grey mat border and aligns the gilt rim with the geometric puzzle rim radius ($R=309.6$) on the 720×720 canvas.
- **Street Vignette Banner Height & Viewport Fit (MAJOR 4)**:
  - Locked `.day-vignette-banner` at `height: 96px; max-height: 96px; overflow: hidden;` with an absolutely positioned, cover-scaled image (`.day-vignette-img`).
  - Restructured `.customer-card` with `flex: 1; min-height: 0;` and scrollable `.dialogue-scroll-box` (`flex: 1 1 auto; min-height: 50px; overflow-y: auto;`).
  - Guarantees all negotiation pricing buttons remain fully visible inside the screen on both iPhone 390×844 and 375×667 viewports with comfortable bottom margins (18px).
- **Interactive Secondary Spoon Mending & Honest Accounting (MAJOR 5)**:
  - Changed secondary job titles in `src/data/jobs.js` to single-instance names (`"粗瓷匙羹"` and `"蓋碗托"`), eliminating the duplicate "街坊急修" prefix.
  - Tapping `#btn-secondary-job` now opens the workbench to repair the broken porcelain spoon (`assets/plates/spoon_porcelain_shou.webp`) on the green felt pad.
  - Players tap either the canvas or the proceed button to hammer two brass 螞蝗釘 across the spoon fracture with metallic hammer audio.
  - Returning to settlement prints the updated total staple expenditure (`-6 枚`) matching the topbar staple tin, displays the side-job wage row (`街坊急修（粗瓷匙羹）： +$1.0`), and updates cash balance to $6.3 (or $7.0).
- **Staple Clamp Orientation & Tangential Glaze Chip Offset (MAJOR 6)**:
  - Cropped `assets/art/staple_brass.webp` tightly to its true 155×88 pixel boundary and updated canvas rendering to `sw = 96, sh = 54`, placing both claws at $\pm 41\text{px}$ so they cleanly clear the crack seam on both sides.
  - Offset accidental drill chips along the crack tangent (`chipOffsetDist = 38px`), ensuring the exposed terracotta glaze chip sits beside the staple rather than hidden underneath it.

### Minor Fixes
- **Cantonese Register Consistency in Settlement Dialogue (MINOR 7)**:
  - Rewrote Day 1 leaky hand-back line in `src/data/jobs.js:62` to authentic spoken Cantonese: 「劉婆望住盤底滲出嘅幾滴水珠，輕輕嘆咗口氣：「雖然有少少滲水……但好在齊齊整整駁返埋，多謝你呀葉伯。」」.
- **Audio Synthesizer Cleanup (MINOR 8)**:
  - Removed the unconnected triangle oscillator in `playBowStroke()` in `src/engine/audio.js`.
- **Painted Wooden Stall Signboard Title Actions (MINOR 9)**:
  - Restyled title action buttons in `css/style.css` with weathered woodgrain gradients, dark timber bevels (`#6E492B` / `#140A05`), engraved lacquer lettering (`#D8B06B`), and vermilion seal plaques (`#6B1E13` / `#BD4B33`), making them appear naturally painted and carved into the stall woodwork.
