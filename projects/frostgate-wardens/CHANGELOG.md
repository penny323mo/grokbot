# CHANGELOG — 霜門守望 Frostgate Wardens

## [Unreleased] - 2026-11-04
### Added
- 2026-11-04 01:21 (Macau): Commenced development following SPEC.md. Verified Blender 5.2.3 LTS headless setup and Pillow. Initiated low-poly asset pipeline for Region 1 map, towers, enemies, and hero.
- 2026-11-04 01:37 (Macau): Completed Phase 1 assets. Rendered Map 1 diorama (WebP 37.5 KB) with Blender camera-view waypoints/plots JSON. Rendered 21 tower sprites (5 types x 4 tiers/branches + plot base), 6 enemy walk sprites (runner, armoured, tank), and 2 hero sprites in RGBA. Starting Phase 2 game engine and vertical slice.
- 2026-11-04 01:45 (Macau): Completed Phase 2 vertical slice. Built core game engine, responsive 390x844 layout, camera pan/pinch zoom with inertia, touch build/upgrade/sell flow, hero abilities (Blizzard, Reinforcements, Beacon), tutorial system in natural Cantonese, WebAudio sound synthesizer, and Puppeteer verification suite with 0 console errors. Moving to Phase 3 (Regions 2-5, additional enemies, bosses, and endless mode).
- 2026-11-04 02:03 (Macau): Completed Phases 3 & 4. Rendered Maps 2 through 5 with Blender (WebP sizes 23-27 KB) and exported path/plot metadata. Rendered full enemy roster including 4 special units and 5 region bosses. Added full 5-region campaign with 10-12 waves per region, endless mode with escalating seeded waves, and credits dialog. Created comprehensive test suite under tests/ (data integrity, economy, waves, simulation, save/load) all passing with npm test. Completed review drive across 390x844 and 375x667 viewports with 26 clean screenshots. Ready for shipment.

## Round 1 fixes - 2026-11-04 03:53 (Macau)
### Fixed & Improved
- **Early-call wave mechanics (CRITICAL #1)**: Fixed early wave call so calling the next wave early queues wave `currentWave + 1` with a +15G early-call bounty instead of re-spawning the current wave.
- **Tutorial pan/zoom progression & highlight glow (CRITICAL #2 & Minor #13)**: Linked `camera.onMove` to advance the initial pan/zoom tutorial step upon touch drag (>=12px) or pinch (>=0.04); added `.tutorial-target-glow` saffron pulsing animations and non-blocking pointer routing.
- **Full 4-frame walk cycles (CRITICAL #3)**: Rendered 4-frame walk animations (`_0`, `_1`, `_2`, `_3`) for all 8 regular enemies, all 5 region bosses, and Erika the Hero using Blender faceted clay pipeline; implemented horizontal directional sprite flipping in renderer based on movement velocity.
- **Top HUD layout on 375px screens (Major #4)**: Moved sound mute button from top HUD into the Pause modal (`#modal-pause`), keeping speed toggle and pause buttons in top bar; added `white-space: nowrap` to `.hud-pill`, eliminating overflow clipping on iPhone SE.
- **Tower inspect dock formatting (Major #5 & Minor #16)**: Standardized stats display across tower archetypes (`傷害 | 射程 | 攻速 | DPS` for offensive towers; `威力 | 攻速 | 射程 | 震眩` for bell support towers; `守衛數 | 生命 | 攻擊 | 重生` for guard towers); eliminated all `NaN` and `undefined` outputs.
- **Wave preview timing & completion text (Major #6)**: Connected `game.onWaveComplete` callback to dynamically refresh next wave previews; displays `已全數擊退` upon final wave clearance.
- **Map road alignment & multi-path rendering (Major #7 & Minor #11)**: Fixed Blender camera dependency graph evaluation in `render_map1.py` with `bpy.context.view_layer.update()`; rendered continuous gold road ribbon and aligned all plots within 23-90px of road; verified all 5 maps via `verify_road_colors.py` with 100% compliance.
- **Level 1 Guard Post naming (Minor #10)**: Renamed Level 1 Guard Post to 「前哨營」 per specification.
- **Gate leak damage by enemy archetype (Minor #12)**: Implemented differentiated leak penalties (`runner`: 1, `armoured`: 2, `tank`: 3, `flyer`: 1, `healer`: 2, `swarm`: 1, `fast`: 1, `boss_1..2`: 6, `boss_3..4`: 7, `boss_5`: 8) with dedicated leak sound effect; defeat audio triggers exclusively upon castle collapse (`castleHp <= 0`).
- **Chrome text & Cantonese localization (Minor #14)**: Cleaned all user-facing text into spoken Cantonese / Traditional Chinese (`無盡防守`, `製作名單`); dropped all parenthetical English.
- **Hero ability unlock progression (Minor #15)**: Gated hero abilities by campaign progress (Blizzard in Region 1+, Reinforcements in Region 2+, War Beacon in Region 3+).
- **Endless mode seeded variety (Minor #17)**: Replaced modulo repetition with seeded pseudo-random distribution and region map selection based on player progression.

## Round 2 fixes - 2026-11-04 05:25 (Macau)
### Fixed & Improved
- **Diorama Map Density, Citadel Keep Alignment & Clay Plinths (CRITICAL #1 & MINOR #10)**:
  - Re-rendered Maps 1-5 via Blender headless pipeline with faceted terraced terrain, clustered low-poly fir trees, stone battlements, and continuous warm road gold ribbons (`#D9B87A`).
  - Fixed Map 5 (北辰堡): Extended both `path_A_3d` and `path_B_3d` directly through the grand keep portal into the gold-roof citadel keep; updated `castle_pos` to the central keep gate vertex `(793, 488)`.
  - Crafted low-poly clay stone plinths (`assets/towers/plot.png` and 3D map scene) featuring dark slate foundations, warm stone drums, beveled rims, and runic core sockets, replacing flat hex pads.
  - Enlarged enemy miniature silhouettes in `src/renderer.js` to `size * 3.2` with proper shadow and health bar proportions, elevating miniature readability to style board quality.
  - Updated `scripts/verify_road_colors.py` to strictly sample the road gold band (`115 <= r <= 220, 90 <= g <= 180, b <= 145, r - b >= 18`) and enforce that all waypoints and plot discs touch the road gold band; 100% verified across all 5 maps.
- **Emoji Elimination & Typography Modernization (MAJOR #2 & MINOR #8, #11)**:
  - Replaced all emoji in `#hud-top` with inline clay SVGs (shield icon for HP, coin icon for gold, pause bars icon for pause).
  - Replaced `🔒 未解鎖` with SVG lock badge `<span class="locked-badge"><svg .../>未解鎖</span>` in `index.html` and `src/main.js`.
  - Removed emoji from pause mute button (`音效：開啟` / `音效：靜音`) and boss in-game label (`【首領】${name}` in `src/renderer.js`).
  - Standardized body typography to >= 14px across HUD wave pill, hero name, tutorial title/body, skip button (`min-height: 44px; min-width: 84px`), and credits (`14px`, `line-height: 1.7`).
  - Added non-breaking formatting to title subtitle (`word-break: keep-all; padding: 0 8px`) preventing lonely wrapping of 「南侵！」 on 375px screens.
  - Renamed Region 5 to 「第 5 區域：北辰堡」 in `index.html` and test suite.
- **Tutorial Overlay Lifecycle & Persistence (MAJOR #3)**:
  - Added `tutorialStep: 0` persistence in `saveStore` (`src/save.js`).
  - Centralized tutorial completion in `UIController.completeTutorial()`: calls `saveStore.setTutorialCompleted()`, adds `.hidden` to `#tutorial-overlay`, clears tutorial pointers and target glow.
  - Linked `btnSkipTutorial`, the final tutorial step, and `showVictoryModal()` to `completeTutorial()`, guaranteeing the tutorial never lingers over victory or subsequent regions.
- **Endless Mode Map Picker & State Retention (MAJOR #4)**:
  - Added `#modal-endless-picker` modal allowing players to choose any unlocked region for Endless mode.
  - Set `activeGame.isEndless = isEndless` and `activeGame.region = regionId`.
  - Restart (`#btn-restart`), defeat retry (`#btn-defeat-retry`), and victory replay (`#btn-victory-replay`) now preserve `isEndless`.
- **Guard Tower Initial Spawning (MAJOR #5)**:
  - In `src/game.js`: `buildTower` immediately instantiates all `lDef.guardCount` guards at the rally point so guards appear instantly on place.
  - `upgradeTower` heals existing guards and immediately spawns any missing units up to the new `guardCount`.
  - `updateTowers` resets `t.respawnTimer = 0` whenever `aliveGuards.length >= lDef.guardCount`.
- **Event Listener Cleanup on Start (MAJOR #6)**:
  - Added `this.abortController = new AbortController()` and `destroy()` method to `UIController`.
  - All DOM and canvas event listeners bound with `{ signal: this.abortController.signal }`.
  - `startRegion` calls `activeUI.destroy()` before constructing a new `UIController`, completely eliminating stacked event handlers.
- **Campaign Balance & Headless Simulation (MAJOR #7)**:
  - Retuned `REGION_1_WAVES` (waves 8-12) so honest opener without hero leaks on later waves (failing on wave 8), while active defense with hero clears all 12 waves.
  - Steepened `REGION_2_WAVES` total incoming HP by +35% to 28,780 HP across all 10 waves.
  - Expanded `tests/headless_simulation.test.js`: Simulation 1 proves total defeat (castle HP reaches 0) with zero defense; Simulation 2 proves winnability with sensible build; Simulation 5 simulates full campaign playthroughs across all 5 regions proving both zero-defense defeat and active-defense winnability.
- **Wave Preview Timing (MINOR #9)**:
  - `updateNextWavePreview()` previews `currentWave + 1` while a wave is active/spawning, displays `最後決戰中` during the final wave, and displays `已全數擊退` when `waveState === 'finished'`.

## Round 3 fixes - 2026-11-04 07:15 (Macau)
### Fixed & Improved
- **Diorama Map Density & Grand Background Keeps (CRITICAL #1 Part A)**:
  - Re-rendered all 5 region maps via the Blender headless pipeline to match the cover art's density (`assets/art/style_board.webp` and `assets/art/cover.webp`).
  - Added massive fortress keep complexes anchoring the background leak point on all 5 maps: multi-tiered octagonal stone keeps, saffron and slate spires, flagpoles with fluttering saffron pennants, stone curtain walls, and flanking bastion towers.
  - Added stepped rock and snow terraces framing the lower foreground corners so battlefields are richly grounded dioramas.
  - Clustered dense fir tree groves (50–70+ faceted pines per map) across slopes, ridges, and gullies.
  - Added faceted curb boundary stones lining both sides of the warm gold road ribbons (`#D9B87A`).
  - Generated crisp WebP maps (30–49 KB, well within 450 KB limit).
- **High-Resolution Rendered Enemy & Boss Sprites (CRITICAL #1 Part B)**:
  - Re-rendered 4-frame walk cycles for all 8 regular enemy archetypes at 256×256 px (up from 128×128) and all 5 region bosses at 320×320 px (up from 192×192) using the Blender clay pipeline.
  - Re-rendered hero walk cycles at 256×256 px with faceted armor, shield, and clan banner.
  - When rendered in `src/renderer.js` at `size * 3.2`, units are downsampled cleanly, delivering razor-sharp, antialiased matte clay figurines.
- **Mute Button Lifecycle & Orphan Event Listener Fix (MAJOR #2)**:
  - In `src/main.js`: `returnToTitleScreen()` now explicitly calls `activeUI.destroy()` before nulling `activeUI`.
  - Aborts the active `AbortController`, preventing orphan DOM listeners on `#btn-modal-mute` and `#btn-modal-speed` from stacking when returning to the map and re-entering regions.
  - Verified on 390×844 and 375×667 viewports: mute toggles cleanly between 「音效：開啟」 and 「音效：靜音」 on every re-entry.
- **Typography >= 14px Across All Body Labels (MINOR #3)**:
  - Raised `.btn-ability .ability-title` to `14px` (was `13px`).
  - Raised `.btn-ability .ability-cost` to `14px` (was `11px`).
  - Raised `.btn-branch` choices to `14px` (was `12px`).
  - Standardized `.preview-tag` in `index.html` and runtime chip in `src/ui.js` to `14px` (was `10px` / `13px`).
- **Rendered Clay HUD & Lock Badges (MINOR #4)**:
  - Modeled and rendered 4 genuine 3D matte clay icons in Blender: `assets/ui/icon_shield.png` (faceted clay shield), `assets/ui/icon_coin.png` (faceted gold coin), `assets/ui/icon_pause.png` (faceted clay stone bars), and `assets/ui/icon_lock.png` (faceted stone padlock).
  - Replaced all generic stroke SVGs in `index.html` (HUD HP, Gold, Pause, region cards) and `src/main.js` with `<img>` tags pointing to the rendered clay assets.
- **Strict Plot Road Gold Proximity (<=28px) (MINOR #5)**:
  - Updated `scripts/verify_road_colors.py` to require that every plot center is within ~28px of the road gold band (`115 <= r <= 220, 90 <= g <= 180, b <= 145, r - b >= 18`), tightening the check from the previous 55px disc radius.
  - Repositioned Map 3 Plot 1 to `(0.4, -4.2, 0.25)` and Plot 3 to `(1.3, -1.6, 0.25)`.
  - Opened overhead gate arch lintel on Map 5 so the golden road ribbon remains unobstructed into the citadel keep.
  - All 5 maps pass with 100% compliance under the strict <= 28px criterion.
- **Full 350-Gold Starting Balance Campaign Headless Proof (MINOR #6)**:
  - Updated Simulation 5 in `tests/headless_simulation.test.js` so every region starts with exactly 350 gold (eliminating gifted starting gold).
  - Enforced fixed initial builds with strictly zero mid-wave purchases (purchases and upgrades only occur between waves when `waveState === 'waiting'`).
  - Published final Castle HP across all 5 regions: Region 1 (20/20 HP), Region 2 (4/20 HP), Region 3 (10/20 HP), Region 4 (13/20 HP), and Region 5 (5/20 HP). All 5 cleared with Castle HP > 0.
- **Pure Traditional Chinese Credits Card (MINOR #7)**:
  - Replaced mixed English tool names in the credits modal (`#modal-credits`) with a single, elegant Traditional Chinese paragraph describing the low-poly matte clay art style, procedural audio synthesis, and authentic Cantonese voice guidance.
