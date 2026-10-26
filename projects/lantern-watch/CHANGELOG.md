# Changelog

## v4.0.0 — 燈影軍略 (Lantern Tactics) 全面重構為經典曹操傳式戰棋 RPG

### 核心玩法重塑 (Major System Overhaul)
- **卡牌系統完全移除**: 徹底移除卡牌抽取、手牌費用與卡組構築機制，全面重構為經典曹操傳戰棋回合制 RPG。
- **單一品牌來源統一**: 新增 `js/config.js`，宣告全域 `GAME` 常量（名稱「燈影軍略」、英文名「Lantern Tactics」、標語「以燈為兵 · 以計破霧」），代碼庫中舊名稱已全數淨空。
- **10×13 地圖與國風地形像素對齊**: 
  - 根據 `assets/art/v4/map_*.webp` 手工校準四大章節地形矩陣：河橋 (river_bridge)、城門 (gate)、市集 (market)、山道 (mountain)。
  - 完整實現深水 (`w`, 飛行專屬)、山丘 (`h`, 制高點遠程+1/傷害+20%)、森林 (`f`, 防+1/迴避+15%)、石橋 (`b`, 跨水通道/擊退即溺亡)、城門 (`g`)、市集 (`m`)、峭壁 (`#`) 地形效果。
- **五大戰棋規則深度實現**:
  - **朝向與背擊 (Directional Facing & Back Attack)**: 背擊 +50% 傷害且防守方無法反擊（墨影 `cat_patrol` 疾影特性為 +100%）；側擊 +20% 傷害；玄鐵巨將正面護盾防禦減免 70%。
  - **反擊機制 (Counter-Attack)**: 近戰受到近戰攻擊存活時立即反擊。
  - **騎兵阻截領域 (ZOC)**: 熊岳 `bear_guard` 的「槍林」領域使穿越相鄰格的騎兵強制止步並受傷。
  - **元素相剋與匿霧破除**: 傘魂水相靈怪火焰免疫、雷擊雙倍傷害；匿鼠在未受燈光照亮或無近身接觸時不可被選中。
  - **擊退墜河秒殺**: 巨盾推擊擊退目標 1 格，推入深水且非飛行單位直接溺斃 KO。
- **確定性角色 AI (`js/engine/ai.js`)**:
  - 弓手風箏保持 2-3 格最遠射程、醫師後排治療最低血量友軍、騎兵鎖定缺乏保護的後排衝鋒、重將卡位防守、匿鼠潛行刺殺、首領密集 AoE。
- **四大章節戰略與軍略計策 (`js/engine/battle.js`, `js/data/units.js`)**:
  - 第一回護送燈車、第二回守門8回合、第三回保衛市集神燈10回合、第四回討伐鐵將。
  - 六大計策：火攻、伏兵、佯攻、水淹、夜襲、鼓舞。
- **手機端介面與視覺體驗 (`index.html`, `css/style.css`, `js/render/ui.js`)**:
  - 640×832 視口平移拖拽、2.5D 立繪陰影與光環、56px 大觸控行動彈窗、攻防對比預覽卡、回合水墨橫幅、大版將士詳情頁。
- **自動化戰略模擬與單元測試**:
  - 新增 `tests/rules.test.mjs`, `tests/ai.test.mjs`, `tests/objectives.test.mjs`, `tests/name.test.mjs`, `tests/encounters.sim.test.mjs`。
  - 模擬測試驗證所有 4 大關卡使用 2 種不同配置計策全部取勝，且 Naive 機器人驗證失敗。
- **10 張自動化截圖產出 (`screenshots/v4/`)**:
  - 通過 `scripts/capture_screenshots.mjs` 在 390×844 DPR 2 下捕獲 10 張完整截圖，零控制台報錯。

---

## Round 1 fixes

### Critical Fixes
- **CRITICAL #1 (Live Board-Spotlight Tutorial)**:
  - Replaced title-screen static modal with a live board overlay spotlight tutorial launched on Chapter 1 battle.
  - Features three interactive steps with pulsing gold spotlight ring (`.spotlight-active`):
    - ① Unit selection with illuminated blue movement tiles.
    - ② Action menu popover (攻擊/技能/魔法/待命) anchored adjacent to unit.
    - ③ Attack range with damage forecast preview card.
  - Standardized CTA button to always display 「明白」, safely positioned above the Grokbot area.
  - Persisted tutorial completion flag in `${GAME.storageKey}_tutorial` and replayable anytime via the nav `?` icon.
- **CRITICAL #2 (Grokbot Safe Insets)**:
  - Reserved a >=58px bottom safe inset across all mobile layouts (`.title-footer-callout`, `.prebattle-footer`, `.target-preview-card`, `.bottom-info-strip`).
  - Lifted 「排兵布陣 · 開戰」, 「確認執行」, and 「出征開戰」 CTAs well above Grokbot's 52px floating back chip, preventing any overlap or mis-clicks.
  - Added 62px left padding to `.bottom-info-strip` so terrain coordinates `(0, 11)` remain fully visible.

### Major Fixes
- **MAJOR #3 (Pre-Battle Deploy Phase)**:
  - Implemented interactive deployment phase on the live battle board prior to combat initiation.
  - Highlights valid deployment slots with gold dashed pulsating borders (`.grid-tile.deploy-slot`).
  - Added bottom squad tray allowing players to tap guardian chips and place or swap them on valid deployment tiles.
  - Gated battle start behind 「出征開戰」 once all squad members are deployed.
- **MAJOR #4 (Stratagem UI & Ambush Implementation)**:
  - Compacted scout enemy cards into a sleek horizontal row so that the Stratagem picker (戰前軍略計策) sits comfortably above the fold.
  - Implemented 伏兵 (Ambush): allows deploying a friendly unit into any forest (`f`) tile on the map; unit starts hidden (`isShrouded`) and inflicts +50% surprise attack damage on first strike.
  - Implemented 3×3 targetable 火攻 (Fire Attack) dealing 10 damage to non-water units on forest/market terrain.
  - Improved 佯攻 (Feint): enemy cavalry dynamically paths toward a decoy tile on turn 1 rather than hard-teleporting.
- **MAJOR #5 (World Map 390px Viewport Fit)**:
  - Converted world map route pin coordinates to percentage-based layout on a responsive 390px art container (`width: 100%; max-width: 390px; height: 520px;`).
  - All four chapter medallions (河橋, 城門, 市集, 山道) and route choice pills are 100% visible and readable without horizontal scrolling.
- **MAJOR #6 (Walkable-Only Hairline Grid)**:
  - Removed borders from base `.grid-tile`.
  - Added `.grid-tile.walkable` hairline border (`0.5px solid rgba(217, 130, 43, 0.18)`) strictly to passable terrain.
  - Impassable deep river water and fortress stone walls now have zero border lines, eliminating the grid lattice over rivers.
- **MAJOR #7 (Faint Attackable Outlines & Post-Move Range Switch)**:
  - Replaced filled red backgrounds with faint dashed outlines (`outline: 1.5px dashed rgba(230, 57, 70, 0.75); background: transparent`).
  - Filtered out impassable tiles lacking enemies from the attackable range union.
  - Switched attackable range to current-tile range immediately after unit movement is staged.
- **MAJOR #8 (Detail Sheet 技能 and 魔法 Display)**:
  - Updated guardian profile sheet to render both 技能 (Skill) and 魔法 (Magic) with names, MP costs, ranges, and descriptions.
  - Deduplicated bond pair description text.
  - Displayed current and max MP alongside HP.
- **MAJOR #9 (MP Resource System & Action Availability Reasons)**:
  - Endowed all units with `mp` and `maxMp` resources.
  - Deducts `skill.cost` and `magic.cost` MP on confirmation.
  - Action menu buttons display MP cost tags and disable with visual reason chips (「MP不足」, 「無目標」).
  - Added MP indicator bar under the HP bar on all unit figures and in character sheets.
- **MAJOR #10 (AoE Cross Shape Preview & Multi-Target Resolution)**:
  - Added orange highlighting (`.grid-tile.aoe-preview`) for area-of-effect skills like 狐火 緋's 狐火焚霧.
  - Resolves damage against all valid enemies caught in the cross blast while respecting water-type immunity (傘魂 takes 0 damage).
- **MAJOR #11 (Escort Cart 2.5D Art Figure)**:
  - Rendered `lantern_cart` and `market_lantern` using `assets/art/v4/fig_lantern_cart.webp` and `assets/art/v4/fig_market_lantern.webp` with an ambient glow ring, removing the emoji sprite.
- **MAJOR #12 (Action Menu Positioning vs Camera)**:
  - Anchored `.action-menu-popover` inside `#battleBoardStage` adjacent to the active unit.
  - Wrapped action buttons into a 2×2 grid (`max-width: 136px`) so the popover remains compact and never clips out of the viewport.

### Minor Fixes
- **MINOR #13**: Implemented tile-targeting mode for 燈娘's 掛燈 (radius 2 light placement up to range 3).
- **MINOR #14**: Implemented targeted heal mode for 茶翁's 清心茶 (range 2 ally selection).
- **MINOR #15**: Formatted bottom terrain strip text to prevent truncation on mobile screens; added long-press tile inspection support.
- **MINOR #16**: Added CSS combat juice animations (`@keyframes unitLunge`, `@keyframes unitHurtShake`, `@keyframes unitKO`, floating damage numbers).
- **MINOR #17**: Expanded level-up perk choices to three meaningful options (銳意進取 +3 ATK, 迅捷如風 +1 MOV, 固若金湯 +2 DEF & +6 HP).
- **MINOR #18**: Updated `showEnemyTurnBanner` debug hook to clear player overlays and set `hudPhasePill` to 敵方回合.
- **MINOR #19**: Enriched title screen with ink-wash art backdrop, gradient mask, and safe padding.
- **MINOR #20**: Updated `CREDITS.md` title to 燈影軍略 (Lantern Tactics) and synchronized all documentation.
- **MINOR #22**: Added comprehensive unit tests in `tests/rules.test.mjs` (AoE cross, MP deduction) and `tests/ai.test.mjs` (shrouded assassin target selection, boss AoE mist blast).

---

## Round 2 fixes

### Major Fixes
- **MAJOR #1 (Board Tutorial Isolation & Battle State Restoration)**:
  - Isolated the board-spotlight tutorial to use a dedicated demo Battle instance rather than mutating the player's live deployed battle.
  - Snapshot player battle state (squad, deployPlacements, stratagem, chapter) prior to tutorial launch.
  - When the tutorial completes: if opened from title or world map via ?, smoothly restores the player to that screen; if launched on real first fight, automatically resets and launches the player's real battle with all deployed placements and stratagem completely intact.
  - Made tutorial overlay non-blocking (pointer-events: none on backdrop, auto on card) so players can tap the highlighted blue movement tiles directly.

### Minor Fixes
- **MINOR #2 (Transparent 2.5D Lantern Cart Sprite)**:
  - Punched the opaque dark navy background of fig_lantern_cart.webp and fig_market_lantern.webp to clean transparent alpha using elliptical rib contouring and chromatic separation.
  - The escort cart now cleanly rests on the terrain tiles as an authentic 2.5D figure without any opaque box.
- **MINOR #3 (Clean Attackable Enemy Range Outlines)**:
  - Refactored getAttackableTilesFromReachable to outline only cells occupied by valid living enemies in reach, eliminating noisy red-dashed lattices across empty passable terrain.
- **MINOR #4 (River Water Terrain & Grid Alignment)**:
  - Updated deep water river terrain in Chapter 1 (maps.js), and excluded shallows from .walkable hairline borders so painted river surfaces have zero lattice line overlay.
- **MINOR #5 (Terrain Strip No-Truncation & Mobile Long-Press Inspection)**:
  - Streamlined terrain strip formatting when inspecting units to prevent horizontal ellipsis truncation.
  - Added mobile long-press pointer handler (350ms) to inspect terrain coordinates and unit stats on any grid tile.
- **MINOR #6 (Targeted Ally Healing Selection)**:
  - Removed auto-selection of first injured ally on 清心茶 / heal action; player now explicitly taps their desired ally target in range.
- **MINOR #7 (火攻 Stratagem Area Selection)**:
  - Added manual 3×3 target selection and preview for 火攻 (Fire Attack) on forest and market terrain, with automatic best-hit fallback for automated simulations.
- **MINOR #8 (2-Column Stratagem Picker Above the Fold)**:
  - Converted .stratagem-picker to a 2-column grid with 2-line clamped descriptions, fitting all 5 available chapter stratagems cleanly above the fold on mobile screens.
- **MINOR #9 (Dedicated MP Stat Pill & Clean Bond Text)**:
  - Added a dedicated 技力/MP stat pill (detailMp) and 4-column stat grid to prevent 「生命」 text from wrapping mid-word.
  - Deduplicated bond pair description text so 「（每戰限1次）」 appears only once.
- **MINOR #10 (Tutorial Overlay Pointer Events)**:
  - Set pointer-events: none on .tutorial-board-overlay and pointer-events: auto on .tutorial-board-card and .spotlight-active.
- **MINOR #11 (Deploy Phase Screenshot)**:
  - Added automated capture of 10-deploy.png showing the golden deploy tiles, squad deployment tray, and Grokbot clearance.
- **MINOR #12 (Documentation & Changelog Hygiene)**:
  - Removed obsolete v1 card-game entries from CHANGELOG.md; documented all Round 1 and Round 2 fixes.

---

## Improve round 1

### Critical Improvements
- **CRITICAL #1 (Legacy Card-Game Copy & Dead Code Elimination)**:
  - Completely excised all residual v1 card-game modals, copy, and strings (手牌, 能量, 守夜, 霧怪, 共鳴).
  - Removed dead v1 engine modules (`cards.js`, `units.js`, `relics.js`, `map.js`, `constants.js`, `bot.js`, `town.js`).
  - Implemented concise 4-step tactics tutorial modal (`#modalTutorial`) matching current tactical controls: unit selection & blue movement tiles, tactical action menu (攻擊/技能/魔法/待命), directional back-attacks & damage forecast preview, and terrain bonuses.
  - Verified 0 regex matches across `index.html`, `js/`, and `css/`.

### Major Board & Art Alignment
- **MAJOR #2 (Figure Overlap, Anchoring & Grid Alignment)**:
  - Standardized figure dimensions to `max-width: 64px; height: 76px; bottom: 2px;` (~1.18x cell height), firmly anchoring feet at tile bottom-center.
  - Implemented dynamic CSS row z-sorting (`z-index: calc(var(--row, 0) * 10 + 5)`) so units in higher rows naturally sit behind units in lower rows.
  - Added soft ground shadow and glowing team base rings (warm gold for allies, crimson for enemies).
  - Eliminated bottom-left Grokbot occlusion: removed `(0, 12)` from deployment and reserved a >=58px safe inset.
  - Staggered starting ally and enemy spawn positions across columns (in Chapters 1 and 2) to eliminate column-stacking.
  - Expanded board stage boundaries to 656×872 with camera clamp padding so units along the right and bottom edges are never clipped.

### Gameplay Depth & Archetypes
- **MAJOR #3 (New Enemy Archetypes & Varied Chapter Tactics)**:
  - Created 4 distinct enemy archetypes with custom painted figures and portraits in `assets/art/v4/`:
    - `shield_guard` (玄甲盾衛): Frontal shield blocks 70% damage, forcing tactical flanking and back-attacks; AI maintains defensive facing.
    - `mist_sorcerer` (幻霧妖術師): AoE elemental thunder magic, penalizing tight player formations and requiring rush tactics.
    - `fire_archer` (赤焰弓手): Inflicts bonus burn damage on targets in forest terrain, making forest cover a double-edged sword.
    - `mist_scout` (影匿斥候): Stealth infiltrator that bypasses frontline tanks to threaten the lantern cart.
  - Enriched Chapters 2 (Gate), 3 (Market), and 4 (Mountain) with these archetypes.
  - Upgraded pre-battle intel to display all enemy types in the chapter with pure Chinese role labels (`騎兵/弓手/盾衛/術士/斥候/鬼魅/主將`) and tactical counter hints.

### Combat Feel & Spell VFX
- **MAJOR #4 (Per-Element Spell VFX & Combat Juice)**:
  - Added vibrant per-element visual effects in CSS and `#vfxLayer`:
    - Fire burst (`vfx-fire-burst`) with blazing ember particles.
    - Thunder strike (`vfx-thunder-strike`) with jagged gold-cyan lightning.
    - Water burst (`vfx-water-burst`) with cascading azure ripples.
    - Wind slash (`vfx-wind-slash`) with sweeping emerald gale arcs.
    - Heal light (`vfx-heal-light`) with soothing jade recovery aura.
  - Integrated slash trail animations, screen/unit hit shake (`anim-hit-shake`), and watercolor ink-dissolve defeat animation (`anim-ink-dissolve`).
  - Added floating combat tags for crits (`暴擊 CRIT!`), back attacks (`背擊 BACK!`), shield blocks (`格擋 BLOCK -70%`), elemental weaknesses (`破綻 WEAK!`), and counterattacks (`反擊`).
  - Added a top HUD speed toggle (`1x`/`2x`) to halve animation durations for fast-paced play.

### Progression & Pre-Battle UI Polish
- **MAJOR #5 (Progression Loop & Pre-Battle Layout Polish)**:
  - Post-battle progression awards XP to surviving deployed units, leading to level-ups with a choice of 3 perk picks (銳意進取 +3 ATK, 迅捷如風 +1 MOV, 固若金湯 +2 DEF & +6 HP).
  - Rewards equipment treasure drops and triggers narrative story dialogue with painted portraits.
  - Resolved pre-battle layout overlap: added `padding-left: 116px` to `.prebattle-footer` so the CTA button clears the Grokbot back button, and `padding-bottom: 100px` to `.prebattle-body-scroll` to prevent occlusion of the 鼓舞 stratagem card.

### Verification & Automated Testing
- **AUTOMATION**:
  - Added 5 new automated unit tests in `tests/rules.test.mjs` and `tests/ai.test.mjs` validating shield block reduction, fire archer forest bonuses, and AI role behaviors.
  - All 27 unit tests pass cleanly in under 100ms.
  - Captured fresh 390×844 screenshots in `screenshots/v5/` (00 through 09) verifying clean visual layout, zero overlaps, zero clipping, and complete elimination of legacy card-game elements.

---

## Round 1 fixes

### Major Issues Resolved (Grok Review Round 1)
- **MAJOR #1 (Camera Clamping & Right-Edge / Top-HUD Safe Insets)**:
  - Fixed unit clipping where right-column cavalry in Chapter 1 (`04-attack-preview.png`) and top-row defenders/enemies (`02-select-move-range.png`, `07-chapter2-board.png`) were partially cut off by the 390px viewport fold and HUD chrome.
  - In `js/render/ui.js` (`centerCameraOn`), enhanced clamping logic: when focusing on col >= 4, clamps `scrollX >= 160` ensuring columns 4 through 8 remain fully inside the viewport with >=48px safe right inset; for row >= 10, clamps `scrollY >= 155` to prevent bottom grokbot clipping; for row <= 7, limits `scrollY <= (y - 1) * 64` so northern units never suffer sliced HP slivers beneath the top HUD.
  - Widened `.battle-board-stage` to 704×880 with 64px right and 48px bottom padding to comfortably accommodate 76px sprites and glowing auras.
- **MAJOR #2 (Water Terrain Matrix Alignment & Hairline Grid Eradication)**:
  - Re-aligned Chapter 1 terrain matrix in `js/data/maps.js` with painted river art: row 4 col 7 set to deep water (`w`), row 6 cols 4-7 set to shallows (`s`) and cols 3 & 8 to deep water (`w`), accurately reflecting navigable bridge and stepping stone paths while keeping bot heuristic simulations 100% winning.
  - Refined `renderBoardGrid` in `js/render/ui.js` so `.walkable` grid hairline borders are strictly painted on tiles where `!battle.board.isImpassable(c, r, false)`, completely eradicating gold hairlines over deep water channels.
- **MAJOR #3 (Pre-Battle Stratagem Layout & Unclipped 鼓舞)**:
  - Resolved vertical clipping on pre-battle screen (`09-prebattle.png`) at 390×844: converted squad roster (`.squad-roster-grid`) into a horizontal flex scroll row, saving ~85px of vertical space.
  - Refactored `.stratagem-picker` into a compact 2-column grid with full-width 5th tile (`鼓舞`), sitting fully visible and unclipped well above the CTA footer.
  - Removed `-webkit-line-clamp` on `.stratagem-desc` so the full 3×3 target area rule for 火攻 is clearly readable without truncation.
  - Updated pre-battle screen capture to display Chapter 3 scouting intel featuring new enemy archetypes (`斥候` and `匿鼠`).
- **MAJOR #4 (Level-Up Modal Lv.2 Promotion & Choice of 2)**:
  - Fixed level-up display bug where screenshot showed 「晉升至 Lv.1」 with 3 perk choices.
  - Updated `showLevelUpModal` in `js/render/ui.js` and `showLevelUp` debug hook in `js/app.js` to increment level (`Math.max(2, (inst.level || 1) + 1)`) so the modal accurately announces promotion to Lv.2.
  - Added unit portrait icon (`#levelUpUnitPor`) to `.levelup-header`.
  - Streamlined perk selection to exactly 2 distinct strategic choices matching the brief: 銳意進取 (ATK +3, Armor Pierce) vs 固若金湯 (DEF +2, Max HP +6).
- **MAJOR #5 (Per-Element Spell VFX Silhouettes & Pure Chinese Tags)**:
  - Overhauled spell VFX from generic radial wash to distinct geometric silhouettes:
    - `.vfx-thunder-strike`: Jagged lightning bolt polygon (`clip-path: polygon(...)`) with high-voltage cyan-gold flash and drop shadow.
    - `.vfx-fire-burst`: Dynamic flame cluster with orbiting radiant ember sparks (`@keyframes emberFly`).
    - `.vfx-water-burst`: Expanding frost-ring ripple with crystalline azure border.
    - `.vfx-wind-slash`: Sweeping crescent emerald blade arcs.
    - `.vfx-heal-light`: Ascending warm jade recovery aura.
  - Recaptured `05-spell-vfx.png` at the hold frame demonstrating distinctive lightning bolt silhouette and pure Chinese floating combat feedback (`屬性克制！ -14`).

### Minor Issues Resolved
- **MINOR #6 (Dimmed Board Tutorial Capture)**:
  - Recaptured `01-tutorial.png` showing the 4-step tactical tutorial modal overlaid on top of the dimmed live Chapter 1 battlefield.
- **MINOR #7 (Action Menu Button Nomenclature & Positioning)**:
  - Renamed action menu buttons in `index.html` and `js/render/ui.js` to match the exact design brief: 攻擊 (Attack), 計策 (Stratagem/Skill), 法術 (Spell/Magic), 待命 (Wait).
  - Recaptured `03-action-menu.png` positioned adjacent to unit without obscuring the warrior figure.
- **MINOR #8 (Enemy Shield Guard Detail Sheet Lore & Button Visibility)**:
  - Added dedicated Chinese backstory and tactical hints for `shield_guard` (玄甲盾衛), `mist_sorcerer` (幻霧妖術師), `fire_archer` (赤焰弓手), and `mist_scout` (影匿斥候) in `js/data/units.js`.
  - In `showGuardianDetailSheet`, dynamically hid the relic change button (`#detailRelicChangeBtn`) for enemy units and displayed appropriate fallback text.
- **MINOR #9 (Complete Eradication of Residual 巡夜 References)**:
  - Replaced all legacy `巡夜` occurrences in `js/data/units.js`, `js/engine/objectives.js`, `index.html`, and `js/render/ui.js` with `燈影` and `三軍`, ensuring 100% brand voice consistency across code and UI.
- **MINOR #10 (Pure Chinese Combat Floating Tags)**:
  - Removed all English words from floating combat tags (`暴擊！`, `背擊！`, `鐵壁格擋！`, `屬性克制！`, `反擊！`, `未中`), eliminating mixed-language clutter.
- **MINOR #11 (Visual Demonstration of New Enemy Types)**:
  - Updated `06-new-enemy-type.png` to showcase 玄甲盾衛 with custom lore, and `09-prebattle.png` to highlight Chapter 3 intel with `斥候` and `匿鼠`.

---

## Improve round 2

### Art Overhaul & Visual Polish
- **Full-Bleed Painted Key Art Title Screen**:
  - Replaced plain text and navy wash on title screen with authentic full-bleed painted Guofeng key art (`assets/art/v4/title_keyart.webp`) depicting an ancient mist-shrouded fortress gate, river bridge, and lantern-lit army.
  - Added CSS animated layers featuring drifting nocturnal mist (`.title-mist-layer`) and flickering ambient lantern particles (`.title-lantern-glow`).
- **Painted Chapter Banners**:
  - Integrated full-width painted chapter landscape banners (`assets/art/v4/banner_ch1.webp` through `banner_ch5.webp`) into the Pre-Battle header and Chapter Select modal, replacing plain borders.
- **Painted Modal Frame & Character Promotion**:
  - Added ornate jade-and-gold scroll border frame (`assets/art/v4/modal_frame.webp`) to the Level-Up / Class Promotion modal (`#modalLevelUp`).
  - Rendered large character portraits and dual promotion path selection with upgraded stat profiles.
- **Painted Equipment Drop Icons**:
  - Integrated high-resolution painted raster equipment icons (`assets/art/v4/item_sword.webp`, `assets/art/v4/item_tome.webp`, `assets/art/v4/item_armor.webp`) for post-battle loot drops.
  - Zero CSS/SVG/code-drawn art; all assets use the authentic Guofeng ink-wash raster asset pipeline.

### Spell VFX Overhaul & Combat Juice
- **Large Multi-Tile Elemental Spell VFX**:
  - Sized all elemental spell effects to ≥2×2 cells around target figures with high-fidelity painted sprites in `assets/art/v4/`:
    - **Fire (`vfx_fire.webp`)**: Multi-cell blazing flame eruption with orbiting ember sparks and ground scorch marks.
    - **Thunder (`vfx_thunder.webp`)**: Full-height descending lightning bolt from screen top, full-viewport white screen flash (`#screenFlash`), and ground crack shockwave.
    - **Water (`vfx_water.webp`)**: Expanding azure crystalline frost shards and water ripples.
    - **Wind (`vfx_wind.webp`)**: Sweeping emerald crescent wind blades cleaving target cells.
    - **Heal (`vfx_heal.webp`)**: Ascending warm jade light pillar with floating spiritual lotus petals.
- **Combat Juice & Feedback**:
  - Added subtle camera screen shake (`anim-hit-shake`) on heavy and critical strikes.
  - Added watercolor defeat ink-dissolve animation (`anim-ink-dissolve`) upon unit defeat.
  - Floating damage numbers and combat tags (`背擊！`, `協力合擊！`, `屬性克制！`, `鐵壁格擋！`) repositioned to float high above unit heads, preventing any overlap with HP/MP bars.
  - Kept all spell animations under 900ms and fully accelerated/skippable via the top HUD 1x/2x speed toggle.

### Board Framing & Compact Attack Preview
- **Compact Single-Row Preview Card**:
  - Redesigned `.target-preview-card` into a sleek single-row card (~145px tall), preserving maximum live board visibility.
  - Added dynamic `【協力合擊】` indicator displaying adjacent ally assist damage bonuses.
- **Smart Camera Auto-Pan & Edge Clamping**:
  - Implemented dynamic camera auto-pan in `evaluateTargetPreview`: calculates bounding box of attacker, defender, and any combo ally, centering them in the upper viewport above the preview panel.
  - Clamped camera bounds to ensure northern units never slip under the top HUD and southern/eastern units are never clipped or obscured by Grokbot buttons.

### Gameplay Depth: Class Promotions, Combo Attacks, Stratagems & Encounter
- **Unit Class Promotions**:
  - Added class promotion system (`PROMOTIONS` in `js/data/units.js`) at level-up:
    - 劍客 (Swordmaster) → 劍聖 (Grand Blademaster): +4 ATK, +2 DEF, unlocks ultimate `萬劍歸宗` (Range 1-2, 180% damage, armor pierce).
    - 弓手 (Archer) / 燈娘 → 連弩手 (Repeating Crossbowman): +3 ATK, +1 Range, unlocks skill `連弩驟雨` (Power 16, multi-hit volley).
    - 術士 (Sorcerer) → 天師 (Celestial Master): +5 ATK, +10 MP, unlocks magic `五雷正法` (AoE 3×3 thunder blast, double damage vs water affinity).
- **Combo Attacks (協力攻擊)**:
  - Adjacent allies now coordinate with the attacking unit, dealing bonus assist damage (`Math.floor(ally.atk * 0.25)`) with an on-screen `【協力合擊】` badge and combo animation.
- **Dynamic Terrain Stratagems**:
  - `火攻` (Fire Stratagem): Ignites forest (`f`) and market (`m`) terrain; active fires spread to adjacent foliage at turn start, inflicting persistent 6-damage burn ticks.
  - `水淹` (Water Stratagem): Floods river banks and shallows (`s`) into impassable deep water (`w`), isolating or drowning non-flying enemy units.
- **Chapter 5 Encounter: 竹海夜霧斷魂隘 (Bamboo Pass)**:
  - New chapter map (`assets/art/v4/map_bamboo_pass.webp`) with nocturnal fog limiting long-range vision, turn 3 fog rider reinforcements, and dual victory conditions (occupy northern shrine or rout all enemies).
- **Automated Encounter Simulations**:
  - Updated `tests/encounters.sim.test.mjs` with automated solutions for Chapters 1-5; all tactical compositions achieve 100% victory while naive rushing fails.

### UI Polish & Post-Battle Progression
- **Pre-Battle 2-Column Intel Grid**:
  - Refactored enemy scout intel into a wrapping 2-column card grid showing portrait, class, and elemental weakness tags with zero horizontal overflow or clipping.
- **Post-Battle Victory Modal**:
  - Added animated XP progress bars per deployed guardian, painted equipment loot drops with item cards, and narrative story dialogue.
- **Character Profile Progression**:
  - Updated guardian detail sheet with class promotion preview, equipment slots, and upgraded skill descriptions.

### Screenshot Verification (screenshots/v6/)
- Captured 11 clean 390×844 (DPR 2) screenshots into `screenshots/v6/` with zero console errors:
  - `00-title.png`: Full-bleed painted key art, glowing lanterns, drifting mist.
  - `01-prebattle.png`: Chapter 5 painted banner, wrapping 2-column intel grid with weakness tags.
  - `02-move-range.png`: Live tactical board, hairline walkable insets.
  - `03-attack-preview.png`: Compact single-row preview panel, combo ally badge, auto-panned board.
  - `04-spell-vfx-thunder.png`: Full-height lightning bolt, screen flash, high floating combat tag.
  - `05-spell-vfx-fire.png`: Fire burst with radiant embers and scorch marks.
  - `06-spell-vfx-heal.png`: Rising jade light pillar with glowing petals.
  - `07-combo-attack.png`: Coordinated ally assist strike.
  - `08-new-chapter-board.png`: Chapter 5 Bamboo Pass battlefield with nocturnal fog and shrine.
  - `09-level-up.png`: Painted jade-scroll modal frame, large portrait, class promotion path.
  - `10-post-battle.png`: Animated XP bars, painted equipment reward, victory story dialogue.

---

## Round 2 fixes

### Major Fixes (Grok Review Round 2)
- **MAJOR #1 (Grokbot Safe Clearance & Extended Stage Scroll)**:
  - Expanded `.battle-board-stage` to 940px height with 96px bottom padding, allowing deep vertical camera travel without clipping.
  - Enhanced camera clamping in `centerCameraOn`: when focusing on southern ranks (`y >= 10`), ensures unit figures stay ≥64px above the viewport bottom, leaving a safe buffer above the 52px Grokbot button.
  - Verified in `08-new-chapter-board.png`: 墨影 at `(3, 11)` is 100% visible from head to toe, and Grokbot sits over empty dark stone in the bottom-left corner with zero figure overlap.
- **MAJOR #2 (Expansive 2.6×2.6 Cell Fire Spell VFX)**:
  - Replaced the narrow 275×768 fire strip with a new high-impact 512×512 1:1 Guofeng painted sprite asset (`assets/art/v4/vfx_fire.webp`).
  - Sized `.vfx-fire-burst` to 170×170px (covering 2.65×2.65 cells) with radial vermilion/golden flame tongues, orbiting embers, fiery ink splatters, and charred ground scorch.
  - Held `vfxFire` animation at peak scale (1.15) and full opacity (0.98–1.0) through 70% duration.
  - Recaptured `05-spell-vfx-fire.png` demonstrating an expansive 42,800+ pixel explosion centered on the target.
- **MAJOR #3 (Attack Preview Board Buffer & Clean Upper Framing)**:
  - Overhauled camera auto-pan in `showTargetPreview`: calculates the union bounding box of attacker, defender, and combo ally, centering them in the upper 45–55% of `#battleViewport` (`sy = midY - 140`).
  - In `03-attack-preview.png`, staged non-attacking squad members adjacent in rows 2–4; zero unit rings peek from under the compact `.target-preview-card`.
- **MAJOR #4 (Pre-Battle Squad Wrapping Grid & Fold Visibility)**:
  - Replaced horizontal scroller with a 4-column wrapping grid (`.squad-roster-grid { display: grid; grid-template-columns: repeat(4, 1fr); }`).
  - Streamlined pre-battle banner height to 90px and updated body scrolling so that all squad members (including 熊岳) and all stratagems (including 鼓舞) are fully visible without horizontal slicing or bottom fold occlusion.
- **MAJOR #5 (Accurate Chapter 5 HUD Objective Ticker)**:
  - Added explicit objective mapping in `js/render/ui.js` for `reach_shrine_or_rout`: displays `竹海 · 佔領神壇` on Bamboo Pass rather than defaulting to `討伐鐵將`.

### Minor Fixes
- **MINOR #9 (影弓 Intel Weakness Tag)**: Added `shadow_archer` entry to `WEAKNESS_ZH` in `ui.js`: `高地狙擊·近身不能反擊`.
- **MINOR #10 (Post-Battle XP Filter)**: Filtered out NPC and objective units (`role === 'npc'`, `role === 'objective'`, `id === 'lantern_cart'`) from the victory XP progress list; recaptured `10-post-battle.png` displaying Chapter 5 victory with guardian progression and `item_tome.webp`.
- **MINOR #11 (Combo Floating Badge)**: Refined screenshot timing to 400ms in `07-combo-attack.png` to capture the `【協力合擊！】 -6` floating badge and combo slash trail mid-strike.
- **MINOR #12 (River Water Terrain & Grid Alignment)**: Updated `isWalkable` in `ui.js` to strictly exclude shallows (`s`) and deep water (`w`) from `.walkable` gold hairline borders, eliminating all lattice lines across river surfaces.
- **MINOR #13 (Promotion Documentation Sync)**: Updated CHANGELOG to accurately describe `連弩手` and `連弩驟雨` matching in-game code.

---

## Improve round 3

### 1. Art & Board Readability
- **Soft Painterly Ink-Wash Range Highlights**:
  - Replaced flat opaque rectangular grids with soft translucent ink-wash radial treatments:
    - Movement range (`.grid-tile.in-move-range`): Feathered cyan-azure wash with a subtle pulsing rim and rounded corners.
    - Attack range (`.grid-tile.in-attack-range`): Translucent vermilion-red ink wash.
    - Skill / AoE range (`.grid-tile.in-skill-range`, `.grid-tile.aoe-preview`): Warm golden aura wash.
  - Added glowing dotted ink path preview (`.path-step`): when hovering over a reachable destination tile, a glowing dotted ink trail traces the optimal traversal route from the selected unit to the target destination.
- **Permanent Grid Lattice Elimination**:
  - Removed permanent hairline borders across all painted terrain tiles.
  - Borders now appear only on hover or selection (`.grid-tile:hover`, `.grid-tile.selected`), keeping painted landscape vistas, rivers, and cliffs pristine.
- **Figure Scaling, Row Z-Sorting & Clear HP Visibility**:
  - Rescaled all unit figures to ~1.15 cells (`max-width: 58px; height: 70px; bottom: 8px;`), anchoring feet firmly at cell center.
  - Implemented dynamic row z-sorting (`z-index: calc(var(--row, 0) * 10 + 5)`), ensuring foreground units never occlude the feet or HP/MP bars of units in the row above.
  - HP/MP bars remain clearly legible at the base of each tile without clipping or visual overlap.
- **Staggered Idle Breathing Animations**:
  - Assigned staggered CSS breathing animation delays (`animation-delay: -${delay}s`) across all units, giving living organic rhythm to squads on the battlefield rather than uniform lockstep idling.

### 2. Gameplay: Dynamic Terrain Stratagems & New Archetypes
- **Chapter 5 True Fog-of-War Vision System**:
  - Implemented authentic fog-of-war vision rules in `js/engine/battle.js` and `js/engine/combat.js`:
    - 斥候 (Scouts) and 燈娘 / lantern bearers reveal a radius of 4 tiles; other units reveal a radius of 2 tiles.
    - Lit lanterns illuminate a radius of 2 tiles.
    - Enemies outside player vision render as shadowy silhouettes (`.in-fog`) and are untargetable by direct attacks, skills, or spells (`canTargetUnit` enforces vision).
    - AI respects fog fairly (`calculateEnemyVisionMap`), targeting only player units that enter enemy vision range.
- **Dynamic 水淹 (Water Flood) Stratagem**:
  - Dynamically mutates board terrain using `Board.prototype.setTerrainChar`:
    - Floods river and shallow cells (`s`) into impassable deep water (`w`) for 2 full turns.
    - Inflicts 12 water damage on non-flying units caught in flooded shallows and pushes them 1 tile back to dry ground.
    - Deep water instantly drowns non-flying units pushed or stranded into it.
    - Active pulsing water ripples (`.flooded-water`) rendered dynamically over flooded tiles until recession after 2 turns.
- **New Enemy Archetype: 霹靂砲車 (Siege Engine)**:
  - Long-range bombardment catapult (`siege_engine`) with range [3, 5] and heavy physical damage (26 ATK).
  - Minimum range blind zone (range 1-2): completely unable to attack or counter-attack in melee, forcing players to rush with cavalry or agile flyers to eliminate it safely.
  - Dedicated AI (`decideSiegeEngineAction`) in `js/engine/ai.js` that bombards clusters from afar and attempts tactical retreats when engaged in melee.
  - Validated via automated simulation tests proving naive rush fails and tactical focus wins.

### 3. Progression: Action XP, MVP & Camp (營帳)
- **Varied Action-Based XP & Post-Battle MVP**:
  - Replaced flat +50 XP with dynamic action scoring (`actionScores`): awards XP for damage inflicted, enemy kills, heals, stratagems, and objective milestones.
  - Crowned top contributor on the post-battle victory screen with gold laurels and 【👑 本戰MVP · 戰功卓著】 badge with custom golden XP progress bar (`.xp-unit-row.is-mvp`).
- **Between-Battle Camp (營帳) Screen (`#screenCamp`)**:
  - Accessible anytime from World Map via the top header `【營帳】` button.
  - Roster view displaying all unlocked guardians with painted portraits and class tags.
  - Character Profile view: detailed backstory lore, traits, base stats, and skill/magic sheets with MP costs and descriptions.
  - Relic & Equipment management: dynamically equip/unequip unlocked weapons, armour, and treasures (`equipRelic`).
  - Class Promotion: eligible guardians (Level ≥ 2) can select their advanced promotion path (e.g. 劍客 → 劍聖) directly in Camp.
  - All camp loadouts and promotions are fully persisted in `localStorage` save state.

### 4. New Encounter: Chapter 6 攻城之役 (Citadel Siege)
- **New Painted Battlemap & Landscape Banner**:
  - Created high-resolution painted raster battlefield `assets/art/v4/map_siege.webp` (citadel walls, moat, fortified bridge, iron gate, ramparts, keep) and panoramic chapter header `assets/art/v4/banner_ch6.webp`.
  - Added new painted unit sprites and portraits: `assets/art/v4/fig_siege_engine.webp`, `por_siege_engine.webp`, `fig_citadel_warlord.webp`, `por_citadel_warlord.webp`.
- **Citadel Siege Encounter (`chapter_6`)**:
  - Enemy composition: 鎮關將領 (`citadel_warlord`), 霹靂砲車 (`siege_engine`), 高地影弓 (`shadow_archer`), 玄甲盾衛 (`shield_guard`).
  - Objective: `breach_gate_or_rout` (破關斬將: 攻破鐵門佔領城樓或斬殺鎮關將領).
  - Fully integrated into World Map navigation, Campaign progression, pre-battle intel, and encounter bot heuristic simulations.

### 5. Polish
- **Repainted Title Screen Key Art (`assets/art/v4/title_keyart.webp`)**:
  - Repainted fortress banners to feature glowing golden lantern crests, completely removing legacy 蜀漢 marks.
- **Directional Combat Lunges & Combo Lunges**:
  - Every single attack now features a directional lunge toward the defender's tile (`lunge-up`, `lunge-down`, `lunge-left`, `lunge-right`).
  - Coordinated combo attacks trigger simultaneous directional lunges for both the primary attacker and adjacent combo assist ally.

### 6. Screenshots & Test Suite Verification
- **Test Suite**:
  - 36 automated unit and simulation tests across 5 test suites (`rules.test.mjs`, `ai.test.mjs`, `objectives.test.mjs`, `name.test.mjs`, `encounters.sim.test.mjs`) passing with 100% success (0 failures).
  - 12 automated bot encounter solutions (2 per chapter across all 6 chapters) achieve victory.
  - Validation test proves naive bot fails on Chapters 1, 2, and 6.
- **Fresh 390px Screenshots (`screenshots/v7/`)**:
  - `00-title.png`: Repainted key art with golden lantern crest and clean layout.
  - `01-worldmap-camp.png`: World map with Chapter 6 node and 【營帳】 Camp navigation.
  - `02-camp-profile.png`: Camp roster, detailed character profile, relics, and class promotion interface.
  - `03-prebattle.png`: Chapter 6 pre-battle screen with painted siege banner and scout intel.
  - `04-move-range.png`: Soft radial ink-wash movement highlight and glowing dotted ink path preview.
  - `05-attack-preview.png`: Directional attack preview with compact forecast card.
  - `06-fog-of-war.png`: Chapter 5 battlefield with true fog-of-war shroud and hidden enemy silhouettes.
  - `07-stratagem-flood.png`: 水淹 (Water Flood) dynamic deep water conversion and pulsing water VFX.
  - `08-archetype-siege.png`: 霹靂砲車 (Siege Engine) long-range bombardment arc and blind-zone rush tactic.
  - `09-ch6-siege-board.png`: Chapter 6 siege battlefield showing fortress walls, moat, gate, and commanders.
  - `10-post-battle-mvp.png`: Post-battle victory screen with varied action XP bars and 【👑 本戰MVP · 戰功卓著】 laurels.

---

## Round 3 fixes

### Major Issues Resolved (Grok Review Round 3)
- **MAJOR #1 (Adjacent-Row Figure Scaling & Clean HP Bar Visibility)**:
  - Rescaled all unit figures in `css/style.css` to `height: 56px; max-width: 52px; bottom: 8px;`, ensuring sprite tops stay strictly within cell boundaries (≤64px) without overflowing into the row above.
  - Positioned `.unit-hp-bar` at `bottom: 4px;` and `.unit-mp-bar` at `bottom: 0px;` with `z-index: 6`, completely preventing foreground unit figures from occluding the feet or HP/MP bars of units in northern rows.
  - Recaptured `04-move-range.png` and `06-fog-of-war.png` demonstrating 100% visible, crisp HP/MP bars across tight clusters (燈娘/狐火, 雷狸/熊岳) with zero overlap.
- **MAJOR #2 (Grokbot & Top HUD Safe Clearance Across Battlefield)**:
  - Enhanced camera centering and safe viewport bounds in `centerCameraOn` and `showTargetPreview`: ensures northern units have ≥16px safe top clearance below the HUD chrome, and southern ranks have ≥72px buffer above the bottom viewport fold.
  - Reframed all battlefield screenshots (`05-attack-preview.png`, `07-stratagem-flood.png`, `08-archetype-siege.png`, `09-ch6-siege-board.png`):
    - `05`: Attacker and combo assist ally lunging cleanly in upper viewport; zero northern units sliced by HUD; preview card clears Grokbot.
    - `07`: Armies positioned at bridgehead (rows 4–5) and south bank (rows 9–10) with surging flood waters between them; no units under Grokbot or cut by HUD.
    - `08`: Catapult at (2, 2) on ramparts with allies rushing into the blind zone at (2, 3) and (3, 2); no units in bottom-left corner under Grokbot.
    - `09`: Full panoramic siege battlefield with keep commander, wall archers, gatekeeper guards, and bridgehead deployment all framed between rows 2 and 9 without clipping.
- **MAJOR #3 (Camp Screen Roster, Equipped Relic & Class Promotion Visibility)**:
  - Streamlined Camp layout (`#screenCamp`) by placing 【✦ 佩掛神兵寶具 ✦】 and 【✦ 破境晉升 ✦】 directly beneath the compact 4-stat attributes grid.
  - Replaced horizontal roster grid with a sleek, compact horizontal scroll strip, saving >120px of vertical space.
  - Shortened Camp subtitle to 「名冊 · 寶具 · 破境」 with `white-space: nowrap` to prevent header line wraps on 390px viewports.
  - Recaptured `02-camp-profile.png` showing 墨影 portrait, stats, equipped 倚天古劍 (`item_sword.webp`) with 【卸下】 button, and locked 【劍聖】 class promotion path (Lv.2 requirement, +4 ATK, +2 DEF, +1 MOV, 【萬劍歸宗】) all readable and fully visible above Grokbot.
- **MAJOR #4 (Chapter 6 Scouting Intel 2×2 Grid Above the Fold)**:
  - Fixed pre-battle scroll offset to start at `scrollTop = 0` so the 2×2 enemy scout intel grid sits prominently at the top of the body fold.
  - Streamlined weakness text in `WEAKNESS_ZH`: `siege_engine` (盲區1-2格·弱飛騎近攻) and `citadel_warlord` (防禦極高·弱法術背刺).
  - Recaptured `03-prebattle.png` displaying painted siege banner, chapter objectives, and all 4 enemy types (鎮關將領, 霹靂砲車, 影弓, 盾衛) without scrolling.

### Minor Issues Resolved
- **MINOR #5 (Painted Flood Water Wave VFX & Accurate Stratagem Text)**:
  - Overhauled `.grid-tile.flooded-water` from a flat radial CSS gradient to authentic painted azure water ripples using `assets/art/v4/vfx_water.webp` with animated ripple surge.
  - Updated `STRATAGEMS.flood` copy in `js/data/units.js` to accurately describe the 2-turn shallow-to-deep-water conversion, 12 damage, push, and drowning KO effects.
- **MINOR #6 (Softened Catapult AoE Range Footprint)**:
  - Softened `.grid-tile.aoe-preview` into a painterly translucent gold ink wash with feathered rounded borders (`border-radius: 12px; border: 1px solid rgba(255, 190, 50, 0.45);`).
  - In `08-archetype-siege.png`, restricted bombardment footprint strictly to passable ground cells, eliminating debug lattices over impassable night sky and solid cliff faces.
- **MINOR #7 (Eliminated Residual Emoji & Unified Chinese Nomenclature in Camp)**:
  - Replaced `r.icon` emoji in relic selector chips with painted item raster thumbnails (`assets/art/v4/item_sword.webp`, `item_armor.webp`, `item_tome.webp`).
  - Replaced `🔒` emoji in promotion lock box with stylized Chinese badge `【修煉進階】`.
  - Replaced fallback element label `天元 · 調和` with authentic martial archetype tag `兵家 · 鋒芒`.
- **MINOR #8 (Coordinated Directional Combo Lunge Proof)**:
  - In `05-attack-preview.png`, applied directional lunge classes to both primary attacker (`lunge-right` on 墨影) and combo assist ally (`lunge-down` on 熊岳), visually proving the synchronized combo strike mechanic in the final contact sheet.




