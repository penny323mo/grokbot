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
