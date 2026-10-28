# 濠江疑案 · Harbour Casebook — CHANGELOG

## [1.0.0] - 1962 Macau Inner Harbour Archival Release

### Phase 1: Conceptualisation & Historical Grounding
- Set in 1962 Macau Inner Harbour (Rua da Felicidade, Pier 16, Cheng Peng Theatre, Penha Hill).
- Established archival paper & deep ink visual direction (`#F4EDE2` / `#FAF6EE`, `#1F1B16`, Macau vermilion `#9A3B2C`, muted jade `#4F6F5F`, subtle paper grain texture).
- Designed a 4-case interconnected conspiracy arc linking a missing Qing Dynasty imperial jade bracelet, smuggling black ledgers, a poisoned Cantonese opera star, and the midnight assassination of a colonial advisor.

### Phase 2: Core Deduction & Game Engine
- Hand-authored 4 cases with rich Cantonese dialogue and noir narration in `src/data/cases.js`:
  - Case 1: 〈押〉 當舖驚魂 (12 hotspots, 35 words, 2 deduction sections, Who's Who)
  - Case 2: 〈潮〉 內港碼頭 (12 hotspots, 39 words, 3 sections with 4-event timeline, Who's Who)
  - Case 3: 〈戲〉 清平戲院後台 (12 hotspots, 37 words, 3 sections, Who's Who)
  - Case 4: 〈燈〉 主教山之夜 (12 hotspots, 34 words, 4 sections, Grand Finale)
- Authored vector SVG portraits and character metadata for 17 historical Macau characters in `src/data/portraits.js`.
- Implemented *The Case of the Golden Idol* style deduction checker in `src/engine/deduction.js` with partial error feedback (<=2 errors vs >2 errors, never spoiling exact slots).
- Implemented offline-first persistence in `src/engine/storage.js` with auto-save for discovered clues, collected words, filled slots, and unlocked cases.

### Phase 3: Audio Composition & Synthesizer Fallback
- Composed loopable BGM score using `pretty_midi` and FluidSynth with FluidR3_GM soundfont:
  - `investigation.ogg` / `.mp3`: slow minor-pentatonic Guzheng, Erhu, strings, and piano.
  - `resolution.ogg` / `.mp3`: lyrical D-major flute, koto, and strings.
- Rendered authentic tactile SFX:
  - `paper_slide.mp3`, `word_collect.mp3`, `pen_scratch.mp3`, `stamp_thud.mp3`, `error_tick.mp3`, `hint_chime.mp3`.
- Implemented `src/engine/audio.js` with Web Audio API synthesis fallback and iOS touch gesture unlocking.

### Phase 4: Visual Assets & Illustrated SVG Scenes
- Hand-crafted 4 rich tall architectural SVG scenes (390×700 viewBox) in `assets/scenes/`:
  - `case1_pawnshop.svg`: High counter with vertical grilles, wall safe, abacus, transom window.
  - `case2_pier.svg`: Pier 16 misty harbour, "Tai Sing" junk ship, water police launch, pontoon barge.
  - `case3_theatre.svg`: Cheng Peng Theatre backstage, lighted vanity mirror, purple clay teapot, velvet curtains.
  - `case4_penha.svg`: Penha Hill chapel spire, full mid-autumn moon, stone balustrade, Walther PPK in roses.

### Phase 5: Mobile-First UX & Renderers
- Designed mobile-first iPhone layout (390×844 portrait) in `css/style.css` and `index.html`:
  - 1-finger pan and pinch zoom in `src/render/scene-renderer.js` with ≥44px tap targets.
  - Max 45% height bottom sheet clue inspector in `src/render/bottom-sheet.js` with flying word animations.
  - Deduction sheet with 2-tap word picker in `src/render/deduction-sheet.js`.
  - Archival dossier index card board in `src/render/case-board.js`.
  - Epilogue resolution modal in `src/render/epilogue-modal.js`.
  - Prominent **「返回 grokbot」** links to `https://penny323mo.github.io/grokbot/` across title, case board, and menu.

### Phase 6: Automated Testing & Verification
- Created unit and integration tests in `tests/`:
  - `cases.test.mjs`: Validates all 4 cases, slot completeness, and ensures 100% of word bank words are harvestable from clues.
  - `deduction.test.mjs`: Tests partial error counts, section locking, and Who's Who matching.
  - `solvability.test.mjs`: Tests full start-to-finish solvability of all cases and decoy balance.
- Captured 390px mobile screenshots using Puppeteer into `screenshots/`:
  - `01_title.png`, `02_case_board.png`, `03_scene.png`, `04_bottom_sheet.png`, `05_deduction_sheet.png`, `06_solved_stamp.png`, `07_epilogue.png`.

## Round 1 fixes

### Critical Fixes
- **Deduction Blank Template Rendering (CRITICAL #1)**: Resolved template literal newline insertion in `src/render/deduction-sheet.js`. Previously, multi-line template buttons resulted in `<button<br/>...>` tags when replacing newlines with line breaks. Rewrote `renderTemplateWithBlanks` to build single-line contiguous HTML tags (`<button class="..." data-...><span ...>...</span></button>`) before applying newline breaks, rendering clean `＿＿受害人＿＿` chips.

### Major Enhancements
- **100% Offline Font Independence (MAJOR #2)**: Removed external Google Fonts CDN preconnect and stylesheet links from `index.html`. Updated `css/style.css` font stacks to prioritize local system CJK fonts (`"Noto Serif CJK TC"`, `"Noto Sans CJK TC"`, `"PingFang TC"`, `"Songti TC"`, `"Heiti TC"`) ensuring complete offline functionality without network requests.
- **Interactive Who's Who Matching Puzzle (MAJOR #3)**: Transformed the static Who's Who character card into an interactive two-tap assignment puzzle matching SPEC §3.3. Players tap a blank under any portrait to assign a name from the gathered word bank, verify assignments with the 「核對人物」 button, persist guesses in `src/engine/storage.js` (`setWhoGuess`, `getWhoGuesses`, `setWhoSolved`), and lock correct assignments with jade borders.
- **Pure SVG Iconography / Complete Emoji Removal (MAJOR #4)**: Created `src/utils/icons.js` offering single-color archival SVGs (`pen`, `lamp`, `search`, `lock`, `scale`, `check`, `alert`, `scroll`, `pin`, `notebook`). Completely removed emoji characters across `src/app.js`, `src/render/deduction-sheet.js`, and `src/render/case-board.js`.
- **Rich Architectural Elevation Scenes (MAJOR #5)**: Rewrote `scripts/generate_scenes.py` with multi-layered architectural perspectives for all 4 scenes:
  - `case1_pawnshop.svg`: 德生大押 interior with ceiling pendant lamp beam, brass-hinged wall safe, detailed ledger desk, abacus, victim blood pool, footprints, and back alley exit.
  - `case2_pier.svg`: Inner Harbour Pier 16 with warehouse cargo crane, moored wood-ribbed junk "Tai Sing", floating wooden pontoon, warehouse sliding door, and oil-slicked harbour water.
  - `case3_theatre.svg`: Cheng Peng Theatre backstage with ornate gilded proscenium, glowing mirror vanity bulbs, teak costume wardrobe, iron steamer trunks, and jade hairpins.
  - `case4_penha.svg`: Penha Hill colonial estate with stone balustrade overlooking midnight harbour, granite church belfry, iron garden gazebo, bloodstained rose bushes, and discarded Walther pistol.
  All hotspot percentages strictly preserved.
- **Extended BGM (≥90s) & Maritime Bed & Volume Sliders (MAJOR #6)**:
  - Composed extended multi-theme MIDI progressions and rendered with FluidSynth: `investigation.mp3` (101.8s) mixed with an authentic `sox`-synthesized tidal water/wind ambient bed (`amix`), and `resolution.mp3` (100.3s).
  - Added music and SFX volume sliders to the Menu tab wired to `audio.setMusicVolume()` and `audio.setSFXVolume()` with persistence in `src/engine/storage.js`.

### Minor Polish & Fixes
- **Four-Tab Architecture (MINOR #7)**: Added the 4th tab 「筆記」 (`src/render/notebook-tab.js`) to the bottom navigation bar (`現場` / `筆記` / `推理` / `選單`), displaying collected clues categorized into 人名證供, 搜獲物證, and 作案動機, along with progressive hint seals.
- **Three-Step Progressive Onboarding (MINOR #8)**: Added a step-by-step tutorial banner at the top of the interface guide (Step 1: 勘查現場 → Step 2: 收錄筆記 → Step 3: 填補空白).
- **Body Typography (MINOR #9)**: Increased `--font-size-base` to `16px` across `css/style.css` (with `18px` in large mode) ensuring comfortable legibility on mobile viewports.
- **CSS Token Fix (MINOR #10)**: Corrected syntax error `--color-paper-dark: #E6DC melt;` to `#E6DCC8`.
- **Hint Depth (MINOR #11)**: Added 3-tiered hints for Case 4 Section 4 in `src/data/cases.js`.
- **Epilogue Vignette Art (MINOR #12)**: Added an archival vector illustration depicting Macau Inner Harbour at sunrise with junk boats and jade seal to `src/render/epilogue-modal.js`.
- **Unit & Storage Tests**: Added `tests/storage.test.mjs` verifying storage engine state management, Who's Who persistence, and case unlocking; all 7 test suites pass cleanly.
- **390px Screenshots**: Captured complete 8-screenshot mobile walkthrough (`01_title.png` through `08_epilogue.png`) into `screenshots/`.

## Round 2 fixes

### Major Enhancements
- **True Portrait-to-Name Who's Who Deduction Puzzle (MAJOR #1)**:
  - Eliminated all caption and role spoilers prior to solving: character cards display neutral designations (「人物甲」, 「人物乙」, 「人物丙」, 「人物丁」) instead of `char.title`.
  - Protected character bio modal: clicking an avatar before solving now presents an archival police inquiry dossier without revealing character names, titles, or descriptions.
  - Neutralized word picker header to `選取【人物甲】姓名`.
  - Implemented Golden Idol tier feedback for Who's Who in `src/engine/deduction.js` (`checkWhosWho`): detects incomplete entries, all-correct confirmation, partial feedback for ≤ 2 errors without leaking specific portraits, and many-errors notification.
  - Strictly gated Case Resolution (`markCaseSolved` and vermilion 結案 seal) to require both all deduction sections solved AND Who's Who completely verified.
- **Cover-Worthy 1960s Macau Architectural Illustrated Scenes (MAJOR #2)**:
  - Completely redrew all four scene SVGs in `scripts/generate_scenes.py` with unified single-camera perspective, authentic 1960s Macau architectural details, layered ink linework, and archival watercolor washes:
    - `case1_pawnshop.svg`: Oblique perspective pawnshop interior featuring timber ceiling joists, Portuguese azulejo tile frieze, bat-and-coin gold leaf signboard, high rosewood counter with turned balusters, 3D cast-iron wall safe with shelves and spilled handkerchief, carved cabriole-leg accountant desk with open ledgers and porcelain tea bowl, muddy footprint trail, and open back door to cobbled alley.
    - `case2_pier.svg`: Panoramic nocturnal maritime perspective of Inner Harbour Pier 16 with granite quay, British Victorian lattice-girder cargo crane with gears, Cantonese double-masted trading junk "Tai Sing" with battened fan sails and dragon eye, floating timber pontoon, noodle pushcart with steam, severed hemp hawser, and water police launch.
    - `case3_theatre.svg`: Oblique theatrical backstage interior of Cheng Peng Theatre with timber fly grid loft, rope rigging and sandbags, heavy draped crimson velvet curtain with gold tassels, ornate 3-fold oval vanity mirror with glowing light bulbs, tall rosewood wardrobe with hanging embroidered robes, stage weapon rack, and brass opium lamp.
    - `case4_penha.svg`: Moonlit Penha Hill garden terrace overlooking Macau harbour with glowing mid-autumn full moon, granite Gothic chapel with belfry spire and cross, 3-tiered sculpted marble angel fountain, Portuguese calçada wave mosaic, climbing rose bushes with concealed Walther PPK, and brass telescope.
    - Preserved 100% of the 48 hotspot percentage coordinates across all cases.
    - Refined hotspot markers in `css/style.css` into archival brass and vermilion reticle rings.

### Minor Polish & Fixes
- **Onboarding Step 3 Auto-Dismiss (MINOR #3)**:
  - Connected `onSlotFill` and `onCaseSolved` in `src/app.js` to `advanceOnboarding(3)`, properly saving `storage.state.onboardingDone = true` and permanently dismissing the guide banner upon blank completion.
- **Comprehensive CJK Typography Fallbacks (MINOR #4)**:
  - Expanded font stack definitions in `css/style.css` to ensure consistent archival typography across all operating systems (`"Noto Serif CJK TC"`, `"Noto Serif TC"`, `"Songti TC"`, `"STSong"`, `"PingFang TC"`, `"Biaukai"`, `"Source Han Serif TC"`).
- **Archival Epilogue Harbour Vignette Artwork (MINOR #5)**:
  - Replaced generic shapes in `src/render/epilogue-modal.js` with an intricate ink drawing of Macau Inner Harbour at sunrise with Taipa hills, Penha chapel, a traditional 3-masted junk with battened sails, wooden pier pilings, and jade seal.
- **Unit Testing & Verification**:
  - Expanded `tests/deduction.test.mjs` to rigorously test Golden Idol Who's Who status buckets (incomplete, correct, partial, many errors); all 7 test suites pass in ~450ms.
  - Recaptured complete 390px mobile walkthrough screenshots (`01_title.png` through `08_epilogue.png`) reflecting the updated architecture, neutral character cards, and clean solved state.

## Round 3 fixes

### Minor Polish & Camera Perspective Craft
- **Case 1 Oblique 3/4 Floor & Corpse Alignment (MINOR #1)**:
  - Updated `assets/scenes/case1_pawnshop.svg` via `scripts/generate_scenes.py` to bring the floor tiles and victim body into the exact same 3/4 oblique perspective as the desk and safe.
  - Replaced horizontal transverse tile lines with angled orthogonal floor seams that recede with perspective depth.
  - Redrew pawnbroker Chen Tak-sang's body in 3/4 foreshortening with stretched legs, white-soled black cloth shoes, silk changshan drapery folds, outstretched right hand reaching toward the desk, and eyeglasses resting on the floor.
- **Who's Who Heavenly Stems Labels Expansion (MINOR #2)**:
  - Expanded neutral character labeling array in `src/render/deduction-sheet.js` to full 10 Heavenly Stems: `['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']`.
  - Ensures Case 4 (featuring 8 characters) cleanly renders characters 7 and 8 as 「人物庚」 and 「人物辛」 without falling back to numeric indices.
- **Verification & Screenshots**:
  - Re-verified all 7 test suites via `node --test tests/*.test.mjs` (all pass with 0 failures).
  - Recaptured updated 390px mobile screenshots `03_scene.png` and `04_bottom_sheet.png` reflecting the enhanced 3/4 pawnshop perspective.

## Art overhaul

### Commercial Art Asset Integration
- **Full WebP Scene Integration**:
  - Replaced SVG scene fetching in `src/render/scene-renderer.js` with direct WebP image loading (`<img>`), preserving pan, pinch, and zoom transforms.
  - Aligned scene viewport transform layer to exact 2:3 aspect ratio (390×585) matching the 832×1248 painted illustrations.
  - Updated all 4 cases in `src/data/cases.js` to point `sceneImage` at commercial WebP assets: `case1_pawnshop.webp`, `case2_pier.webp`, `case3_theatre.webp`, and `case4_penha.webp`.
  - Remapped Case 1 hotspot coordinates using the binding table in `ART_DIRECTION.md` (`c1_victim` 48,58; `c1_abacus` 30,52; `c1_safe` 22,40; `c1_handkerchief` 24,45; `c1_desk_tea` 22,78; `c1_ticket_ledger` 58,65; `c1_noodle_basket` 72,58; `c1_drawer_ferry` 78,40; `c1_footprints` 42,72; `c1_alley_matches` 55,50; `c1_window_grille` 14,22; `c1_earring` 48,82), verified to land directly on painted objects.
- **Commercial Painted Portraits (17 Characters)**:
  - Updated `src/data/portraits.js` to replace inline SVG blobs with commercial painted portraits (`img: 'assets/portraits/<id>.webp'`), maintaining full character metadata.
  - Added backward-compatible `get svg()` getter on every character record returning `<img class="portrait-img" ...>`.
  - Updated `src/render/deduction-sheet.js` Who's Who cards and bio modals to render `<img class="portrait-img">` with circular archival photo framing and ink borders.
  - Preserved neutral labels (「人物甲」, 「人物乙」, 「人物丙」...) in Who's Who to eliminate spoilers before case completion.
- **Title Screen Rebuild**:
  - Built full-bleed key art layout using `assets/art/title_key.webp` with an archival vignette scrim for crisp contrast.
  - Added decorative dossier seal `assets/ui/seal_title.webp` and section flourish `assets/ui/ink_rule.webp`.
  - Refined typography with Noto Serif CJK TC display title 「濠江疑案」, letter-spaced English subtitle 「HARBOUR CASEBOOK · 1962」, and mature 「開始調查」 primary CTA.
- **Archival UI Polish & Seal Stamps**:
  - Switched background texture tile across the app shell, screens, and modals to `assets/ui/paper_texture.webp`.
  - Replaced CSS red square buttons with authentic vermilion 硃砂「結案」印 (`assets/ui/seal_jiean_sm.webp`) on case resolution (with -12° rotation and stamp thud animation), dossier cards on the case board, and the epilogue dialog.
  - Embedded `assets/ui/ink_rule.webp` archival flourishes across the title screen, case board, and deduction sheet.
  - Aligned color palette tokens with `ART_DIRECTION.md`: Paper `#F4EBDA`, Paper deep `#E8D9C0`, Ink `#2C2416`, Ink soft `#5A4A38`, Vermilion `#9A3B2C`, Azulejo `#3A6B7A`, Jade `#4F6F5F`, Gold `#B8975A`.
- **CSS De-Cartooning Pass**:
  - Removed childish comic solid offset drop shadows (`3px 3px 0 var(--color-ink)`) throughout buttons, cards, modals, and controls, replacing them with subtle archival borders and diffuse paper elevation.
  - Enforced dossier card corner radii ≤ 6px with tight rhythm and clear typographical hierarchy.
- **Automated Verification & Screenshots**:
  - Ran all 7 test suites via `node --test tests/*.test.mjs` (all pass with 0 failures in ~150ms).
  - Recaptured fresh 390px mobile screenshots (`01_title.png` through `08_epilogue.png`) and updated `screenshots/orch/` benchmarks.

## Round 1 fixes

### Art Overhaul Review Refinements (orch-r1-grok)
- **CRITICAL #1: Warm Paper Grain Restored**:
  - Re-generated `assets/ui/paper_texture.webp` (512×512 seamless wrap) with warm off-white tone (base `#F4EBDA`, mean RGB `[243.5, 234.5, 217.5]`, stddev `~1.8`), completely eliminating the analog TV noise across `#app`, `.screen-view`, `.bottom-sheet-content`, deduction sheet, notebook, and epilogue modal.
- **CRITICAL #2: Authentic Vermilion 硃砂 Seals**:
  - Re-generated `assets/ui/seal_jiean.webp`, `assets/ui/seal_jiean_sm.webp`, and `assets/ui/seal_title.webp` as authentic vermilion `#9A3B2C` (154, 59, 44) stone chop seals with eroded edges and crisp transparent alpha backgrounds, eliminating the black square bug across the title screen, solved case stamps, and epilogue.
- **MAJOR #3: Title Screen Atmospheric Key Art & Archival Typography**:
  - Dropped `.title-scrim-overlay` opacity to ≤0.35 over the painting with an atmospheric gradient, allowing the hand-painted 1962 Inner Harbour illustration `assets/art/title_key.webp` to prominently carry the cover.
  - Placed title typography and subtitle on a distinguished archival parchment plaque (`rgba(244, 235, 218, 0.94)`) with ink borders and a subtle vermilion double-inset line.
  - Restyled primary CTA 「開始調查」 as a refined typographic paper button with vermilion archival lacquer finish and letter-spaced serif typography.
- **MAJOR #4: Precise Painted Object Hotspot Alignment**:
  - Re-measured and re-mapped all 48 hotspot coordinates across all 4 cases in `src/data/cases.js` directly to the painted objects in the 832×1248 WebP scene illustrations:
    - Case 1 (`pawnshop`): Re-aligned victim Chen Tak-sang body `(48, 68)`, abacus `(32, 58)`, ledger `(66, 68)`, noodle basket `(74, 58)`, footprints `(42, 84)`, matches `(54, 52)`, earring `(48, 88)`.
    - Case 2 (`pier`): Re-aligned victim So Chi-keung floating corpse on pier `(48, 48)`, pocket ledger `(52, 52)`, tide clock on belfry tower `(12, 18)`, broken watch `(52, 82)`, cargo rope `(58, 70)`, police launch `(22, 32)`, Tai Sing junk `(72, 28)`, gold/opium crate `(82, 82)`.
    - Case 3 (`theatre`): Re-aligned victim Fung Sin-ha collapsed at stage exit `(48, 54)`, purple clay teapot `(72, 46)`, vanity mirror `(78, 40)`, costume box `(24, 58)`, spilled tea dregs `(56, 76)`, Luk's box `(85, 26)`, backstage exit door `(16, 82)`.
    - Case 4 (`penha`): Re-aligned Pereira body by balustrade `(52, 50)`, Walther PPK in rose bush `(70, 68)`, Father Stubbs at chapel arched door `(30, 44)`, bracelet box `(42, 54)`, dossier `(34, 58)`, Pak Lan `(22, 62)`, Roberto `(78, 54)`, Yuen So-kam `(84, 68)`, Leung Ah-sei cart `(18, 76)`, gardener `(62, 38)`.
- **MAJOR #5: Epilogue Modal Period Painting Vignette**:
  - Replaced the inline SVG vector clip-art in `src/render/epilogue-modal.js` with `assets/ui/epilogue_vignette.webp` (640×180 period painting strip), rendered within an archival ink frame with real vermilion 硃砂「結案」印 on warm parchment.
- **Verification & Recaptured Visuals**:
  - All 7 test suites passing in `node --test tests/*.test.mjs` (0 failures).
  - Recaptured fresh 390px mobile screenshots `01_title.png` through `08_epilogue.png` and updated orchestrator review captures `screenshots/orch/live-390.png` and `live-390-full.png`.

## Round 2 fixes

### Visual Hotspot & Prop Precision Alignment (orch-r2-grok)
- **MAJOR #1: Comprehensive Pin-on-Object Alignment (Cases 3 & 4 + Case 1 Residuals)**:
  - **Case 4 (`penha`) Climax Clustered Realignment**:
    - Re-aligned Pereira's corpse torso `c4_victim` to `(38, 62)`.
    - Placed Walther PPK pistol `c4_gun` onto the foreground stone table at `(22, 88)`.
    - Placed open jewelry box `c4_bracelet_box` holding the jade bracelet onto the stone table at `(38, 86)`.
    - Placed secret dossier/briefcase `c4_dossier` onto the stone table at `(30, 85)`.
    - Moved Pak Lan `c4_pak_lan` onto the standing figure in 旗袍 at `(62, 68)`.
    - Moved police inspector Roberto Silva `c4_roberto` onto the uniformed policeman at `(30, 44)`.
    - Placed Father Stubbs `c4_father_stubbs` at the Penha chapel arched doorway at `(58, 42)`.
    - Placed Leung Ah-sei's rickshaw `c4_leung_cart` onto the left-hand cart at `(18, 48)`.
    - Placed Yuen So-kam `c4_yuen_so_kam` beside Pak Lan at `(76, 68)` and the mute gardener `c4_gardener` at `(72, 82)`.
    - Preserved `c4_fence_cloth` at `(88, 42)` and overlook balustrade `c4_overlook` at `(50, 20)`.
  - **Case 3 (`theatre`) Props on Furniture & Stage Architecture**:
    - Moved purple clay teapot `c3_teapot` onto the front-left tea table at `(18, 78)`.
    - Moved arsenic wrapper `c3_poison_paper` onto the calling card/medicine paper by the front table at `(20, 84)`.
    - Re-aligned backstage stage doorway `c3_backstage_door` to the black stage curtain opening at `(28, 22)`.
    - Re-aligned Luk's balcony seat `c3_luk_box` onto the upstairs red upholstered box seat at `(80, 18)`.
    - Placed wooden costume trunk `c3_costume_box` onto the backstage wardrobe trunk at `(16, 66)`.
    - Placed medicine box key `c3_fong_key` on the wardrobe rack at `(14, 52)`.
    - Placed torn love letter `c3_tse_letter` onto the vanity tabletop at `(76, 54)`, thermos flask `c3_yuen_tea` at `(86, 54)`, and insurance policy `c3_insurance` at `(82, 58)`.
    - Placed collapsed victim Fung Sin-ha `c3_victim` at `(48, 52)` and spilled tea dregs / dead rat `c3_tea_dregs` beside her at `(44, 58)`.
  - **Case 1 (`pawnshop`) Residual Fixes**:
    - Restored `c1_ticket_ledger` to `(58, 65)` squarely on the open pawn ledger near the victim.
    - Restored `c1_footprints` to `(42, 72)` on the muddy footprints leading from the doorway.
    - Restored `c1_earring` to `(48, 82)` near the doorway threshold and planter.
- **MINOR #2: Case 2 Fine Nudges**:
  - Nudged `c2_blind_chuen` from the bamboo roof down onto the seated fortune-teller at `(18, 74)`.
  - Nudged `c2_broken_watch` directly onto the shattered pocket watch glass on jetty timber at `(52, 86)`.
  - Nudged `c2_cargo_hook` upward from the canvas gloves onto the hanging iron cargo hook at `(34, 68)`.
- **MINOR #3: Typographic Text Button on Paper for Title CTA**:
  - Refined primary CTA 「開始調查」 to an archival paper text button with double vermilion lacquer borders, off-white parchment background, letter-spaced serif typography, and stroke pen icon rendered in `currentColor`.
- **Verification & Recaptured Visuals**:
  - All 7 test suites passing in `node --test tests/*.test.mjs` (0 failures, ~122ms).
  - Recaptured fresh 390px mobile screenshots `01_title.png` through `08_epilogue.png`, plus dedicated scene captures `03b_scene_case2.png`, `03c_scene_case3.png`, and `03d_scene_case4.png`.
  - Updated orchestrator review captures `screenshots/orch/live-390.png` and `live-390-full.png`.

## Round 3 fixes

### Art Overhaul Pin-on-Object Alignment (orch-r3-grok)
- **MAJOR #1: 100% Painted Clue & Prop Registration across all 4 Cases**:
  - **Case 1 (`pawnshop`)**:
    - Aligned `c1_ticket_ledger` to `(78, 72)` directly on the painted open 当簿 with the red chop.
    - Aligned `c1_footprints` to `(50, 48)` on the threshold doorway muddy prints.
    - Aligned `c1_earring` to `(50, 46)` on the doorway threshold stone.
  - **Case 2 (`pier`)**:
    - Aligned `c2_cargo_hook` to `(22, 78)` directly on the hanging iron cargo hook under the bamboo awning.
    - Aligned `c2_blind_chuen` to `(16, 84)` squarely on the seated fortune-teller under the stall.
  - **Case 3 (`theatre`)**:
    - Aligned `c3_costume_box` to `(68, 56)` onto the large black costume wardrobe trunk.
    - Aligned `c3_fong_key` to `(62, 32)` onto the backstage wardrobe locker.
    - Aligned `c3_yuen_tea` to `(70, 62)` onto the thermos flask on the front-right desk.
    - Aligned `c3_tse_letter` to `(76, 72)` onto the wax-sealed envelope on the front-right desk.
    - Aligned `c3_insurance` to `(80, 68)` directly onto the LIFE INSURANCE policy document on the desk.
  - **Case 4 (`penha`)**:
    - Aligned `c4_gardener` to `(84, 90)` directly on the seated shears-man (啞巴花匠) in the lower right garden.
    - Aligned `c4_father_stubbs` to `(64, 38)` on the Penha chapel doorway silhouette.
    - Aligned `c4_yuen_so_kam` to `(58, 42)` on the woman in black holding the dossier document stand-in.
    - Nudged `c4_overlook` to `(42, 28)` onto the Penha Hill stone balustrade view.
- **Verification & Recaptured Visuals**:
  - All 7 test suites passing in `node --test tests/*.test.mjs` (0 failures, ~145ms).
  - Recaptured fresh 390px mobile screenshots `01_title.png` through `08_epilogue.png` and scene captures `03b_scene_case2.png`, `03c_scene_case3.png`, `03d_scene_case4.png`.
  - Re-generated visual debug overlay maps `case1_round3_overlay.jpg` through `case4_round3_overlay.jpg` in `screenshots/debug/`.
  - Updated orchestrator review captures `screenshots/orch/live-390.png` and `live-390-full.png`.
