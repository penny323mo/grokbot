# Changelog

## v10.0.0 — 全方位戰略進階 (Comprehensive Roadmap Pass)

### 戰鬥動態機制與章節特色 (Dynamic Battle Twists)
- **第2章 城門防守**: 限時堅守機制（8 回合守衛阻截）。
- **第3章 市集伏擊**: 第 3-4 回合側翼伏兵登場，直取中央靈燈；守軍需固守要道形成防護圈。
- **第4章 玄鐵巨將多階段狂暴**:
  - 血量 ≤ 66% 觸發「金甲狂化·二階段」（攻擊 +2、防禦 +1，解鎖裂地斬）。
  - 血量 ≤ 33% 觸發「狂暴崩壞·三階段」（攻擊 +3、速度 +2，蓄力震盪波）。
- **第5章 迷霧天候異變**: 第 4 回合天候轉晴，夜霧退散，全圖視野重開。
- **第6章 護城河斷橋塌陷**: 第 4 回合護城石橋 `(4,8)` 與 `(5,8)` 坍塌為深水，陸軍受阻，突顯鶴羽乘騎 (`crane_rider`) 之空中飛越破陣價值。
- **第7章 沼澤秘境幽魂埋伏**: 咒禁術士佈置幽冥咒縛阻路，需以燈火與火攻破霧破咒。

### 7段引導式戰棋教學 (7-Beat Guided Interactive Tutorial)
- 於第一章融入 7 階段互動指引：
  1. 移動走位 (Move)
  2. 攻擊鎖定 (Attack)
  3. 地形高低 (Terrain)
  4. 反擊與背刺 (Counter & Flank)
  5. 燈火驅霧 (Lantern Light)
  6. 法術轟擊 (Spell)
  7. 軍略計策 (Stratagem)
- 金色動態聚焦光環 (`.spotlight-active`) 與高亮目標格。
- 8 秒無操作貼心提示，引導最佳決策。
- 新增 `💡 建議行動` (Suggest Move) 按鈕，一鍵高亮並輔助執行戰術動作。
- 浮動戰鬥結算標籤：即時顯示 `【背刺 ×1.5】`、`【側翼 ×1.2】`、`【居高臨下 ×1.2】`、`【正面護盾 -70%】`、`【地形防禦 -X】`、`【屬性相剋 ×2.0】`，強化數值回饋透明度。

### 定向線形與錐形技能 (Directional Line & Cone Skills)
- 擴充戰棋幾何演算：`Board.getLineTiles`（貫穿直線）與 `Board.getConeTiles`（前向錐形扇面）。
- 鶴羽乘騎新增定向擊退技能 `crane_line_gust`（鶴羽翔風，3格線形推退）。
- 靈狐醫仙新增錐形烈焰 `flame_fan_cone`（赤羽炎扇，前方4格錐形群傷）。
- 手機端四方向鍵盤式選取與實時橙色預覽確認流程。

### 兵種羈絆與行軍事件 (Class Synergies & Route Events)
- 新增三大兵種羈絆徽章，於選人與布陣欄即時亮起：
  - `【金湯固若】`：防守護衛雙人組（傷害減免 +10%）。
  - `【步騎協同】`：步兵與騎兵聯動（機動與突擊補正）。
  - `【法箭交輝】`：遠程與法術呼應（魔法與射程增益）。
- 戰役間行軍抉擇事件（第2章補給物資、第4章斥候偵察）與名將投奔招募（第1章戰後招募鶴羽乘騎、第3章戰後招募靈狐醫仙）。

### 平衡性深度校準 (Balance Follow-up)
- 敵軍分波梯次推進、側翼伏兵與駐守警戒區（Guard Zones），徹底終結無腦全軍突擊（Naive Rush在第2章 0%、第3章 14%、第4章 24%、第5章 23%、第6章 18%、第7章 0% 均告失敗）。
- 守住第一章 Naive 通關率 ≥ 90% (49/50) 與「全章節首回合零陣亡」之公平體驗。
- 引入「合理戰術機器人」(Reasonable Bot: 集火殘血/高危目標、迴避敵域、低於40%急救、扼守隘口)，在全部7個章節達成 82%–100% 穩定勝率（驗證於 `tests/balance.sim.test.mjs`）。

### 介面與視覺修復 (UI & Polish)
- 布陣界面地圖高度下延填滿，消除下方空洞斷層。
- 頂欄 HUD 分拆為 `.hud-main-row` 與獨立 `.hud-obj-row`，徹底解決任務文字與功能按鍵重疊問題。

---

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

## Improve round 4

### 1. Art & Board Readability (No Tile Lattice / Seams)
- **Fog of War Feathered Radial Mask Overlay (`#fogOverlayCanvas`)**:
  - Replaced per-cell dark square tiles with a continuous canvas mask layer.
  - Per-cell vision is drawn with radial feathered gradient cutouts (radius 68px) and rendered with soft blur (`filter: blur(4px)`).
  - Unseen and remembered terrain is shown dimmed and desaturated rather than blacked out by solid square blocks, completely eliminating stair-step tile borders.
- **水淹 (Water Flood) Continuous Merged Water Body (`#floodOverlayCanvas`)**:
  - Rendered flooded shallow cells as one continuous merged water body on canvas with edge-to-edge fill.
  - Exterior perimeter stroked with soft glowing cyan shoreline foam (`lineWidth: 3.0; shadowBlur: 10;`), strictly omitting internal tile edges.
  - Delicate painted wave ripple arcs drawn across the flooded region, eliminating all per-cell seams.
- **Continuous Move Range & AoE Overlays (`#rangeOverlayCanvas`)**:
  - Implemented cell-union contour calculation: fills reachable and AoE areas with a continuous translucent wash (`rgba(35, 175, 235, 0.26)`), and strokes only exterior perimeter edges with glowing feathered contours (`shadowBlur: 10; lineWidth: 2.5`).
  - Gaps, interior seams, and separate rectangular boxes are 100% eliminated.
  - Prominent red `阻` circular stop indicators appear on movement cells intercepted by enemy Zone of Control (ZOC).
- **Unit Figures & Readability Enhancements**:
  - Rescaled figures to 56px height (1.0–1.1 cell bounds), preventing any overlap with row figures or HP bars.
  - Added soft ground shadow ellipses, faction-colored glowing base rings (azure glow for allies, vermilion for enemies).
  - Added painted calligraphic class emblem badges next to HP bars (`劍`, `槍`, `弓`, `騎`, `術`, `醫`, `砲`, `盾`).

### 2. Gameplay — Deeper Battle Decisions
- **Directional Facing & Flanking**:
  - Units retain facing after movement and actions.
  - Flanking rules implemented in `js/engine/combat.js`:
    - Attacks from the side: +15% damage.
    - Attacks from behind: +30% damage and strictly prevent defender counter-attack.
  - Direction marker displayed in attack preview: `【背刺偷襲】+30% 傷害 (無法反擊)`, `【側翼突襲】+15% 傷害`, `【正面交鋒】`.
- **Zone of Control (ZOC)**:
  - Implemented general ZOC in `js/engine/pathfinding.js`: enemy combatants halt foot soldiers entering adjacent cells.
  - Light units (`cat_patrol`, `mist_scout`) and flying units (`crane_rider`) ignore ZOC.
  - Visible in move-range preview with prominent `阻` stop badges.
- **Rules & AI Unit Tests**:
  - Added tests in `tests/rules.test.mjs` verifying general ZOC pathing, bypass by light/flying units, +15% side damage, +30% back damage, and counterattack prevention from behind.
  - All 39 automated tests in `npm test` pass with 100% success.

### 3. Art — Character Presence
- **Camp Character Sheet (`#screenCamp`)**:
  - Overhauled character profile with large painted half-body portrait (`por_moying_rich.webp`).
  - Calligraphic title header with element, level, and class badge.
  - Character backstory paragraph card (✦ 將士生平 ✦).
  - Compact visual stat bars card (✦ 屬性修為 ✦: 氣血, 攻擊, 防禦, 速度, 仙法, 移動).
  - Personal dialogue quote line: 「以身衛社稷，以智破暗夜。在暗夜裡，無人能逃過我的快劍。」
  - Equipment slot with equipped `sword_yitian` (倚天古劍) and class promotion path.
- **Combat Voice Bark Banner (`.combat-bark-banner`)**:
  - Floating parchment banner with unit portrait, calligraphic title, and spoken quote line appearing whenever a skill, magic, or coordinated combo fires.
- **Attack Preview Large Portraits**:
  - Enlarged attacker and defender portraits to 48px with golden borders and drop shadows side-by-side.

### 4. New Content — Archetype, Stratagem & Side Battle
- **New Enemy Archetype: 妖術師 / 咒禁術士 (`curse_sorcerer`)**:
  - Added to `js/data/units.js` with `fig_curse_sorcerer.webp` and `por_curse_sorcerer.webp`.
  - Casts AoE curse mist and thunder magic (`curse_mist`).
- **New Stratagem: 火攻 (`fire_attack`)**:
  - Dynamic fire stratagem spreading on grass/forest tiles (`battle.burningTiles`), blocked by water and shallows.
  - Rendered via continuous fiery amber-red wash with glowing flame contour and flickering flame tongues on `#fireOverlayCanvas`.
- **New Optional Side Battle: 外傳 · 荒澤伏擊破咒禁 (`side_marsh`, id: 7)**:
  - Custom painted marsh battlefield `assets/art/v4/map_side_marsh.webp` and panoramic banner `assets/art/v4/banner_side.webp`.
  - Distinct objective: `survive_or_rout` (深入荒澤水寨，斬殺【妖術師】或全殲伏兵，12回合內).
  - Integrated into World Map with dedicated cinnabar side-battle seal stamp (`seal_side.webp`).

### 5. Polish
- **Title Screen Foreground Vignette**:
  - Extended title key art to bottom viewport, replacing dark fade with an illuminated lantern-lit foreground vignette highlighting the stone arch bridge, lantern patrols, and willow reflections.
- **World Map Cinnabar Seal Stamps**:
  - Added authentic painted seal stamps across all 7 nodes: `seal_cleared.webp` (捷), `seal_new.webp` (新), `seal_locked.webp` (鎖), and `seal_side.webp` (密).
- **Post-Battle Victory MVP Overhaul**:
  - Enlarged unit portraits (44-50px) across action XP rows with golden laurel crown and border on MVP.
  - Bottom speaker banner featuring MVP portrait, name `墨影 · 本戰MVP`, and personal MVP victory dialogue line.

### 6. Deliverables
- **12 Fresh Deterministic 390px Screenshots (`screenshots/v8/`)**:
  - `00-title.png`: Key-art title screen with illuminated lantern-lit foreground and mature buttons.
  - `01-worldmap.png`: World map showing 7 nodes with painted seal stamps (`seal_cleared`, `seal_new`, `seal_locked`, `seal_side`).
  - `02-camp-profile.png`: Camp character sheet with 墨影 half-body portrait, visual stat bars, quote, backstory, equipment, and promotion.
  - `03-prebattle.png`: Pre-battle intel with `banner_side.webp`, objectives, stratagem picker, and 2×2 scout grid.
  - `04-move-range.png`: Continuous merged cyan move range with single feathered contour, glowing path, and red `阻` ZOC indicator.
  - `05-attack-preview.png`: Attack preview with `【背刺偷襲】+30% 傷害 (無法反擊)` direction marker, large portraits, and combo ally.
  - `06-fog-of-war.png`: Chapter 5 board with soft painted feathered mist canvas overlay and silhouette enemies.
  - `07-stratagem-flood.png`: 水淹 continuous merged water body on shallows with soft shoreline edge and wave ripples.
  - `08-fire-spreading.png`: 火攻 spreading on reed marsh forest tiles, blocked by water.
  - `09-new-sorcerer.png`: New enemy archetype 妖術師 with class badge, curse mist, and floating combat bark banner.
  - `10-side-battle.png`: Full board view of side battle `side_marsh` on `map_side_marsh.webp`.
  - `11-post-battle.png`: Post-battle victory screen with enlarged portraits, MVP laurels, and MVP victory dialogue line.


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






## Round 1 fixes

### Critical Fixes
- **CRITICAL #1 (Side-Battle Boss `curse_sorcerer` AI & `curse_miasma` Tile Mechanics)**:
  - Added dedicated AI handling for `curse_sorcerer` in `js/engine/ai.js`, evaluating cluster targets for AoE `幽冥咒縛` and 2-3 range `邪穢陰雷` (MAG 15 dark magic), eliminating default melee fallback.
  - Resolved naming collision with `mist_sorcerer` by standardizing unit name to `咒禁術士` (title `大荒妖術師`), updating chapter intel, objectives, and dialog copy.
  - Implemented `curse_miasma` as an active tile-effect system in `js/engine/battle.js`:
    - Tiles impose a +1 step movement cost (MOV -1 penalty) for ground units in `pathfinding.js`.
    - Deals 4 erosion damage per turn via `tickCursedTiles()`.
    - Actively cleansed by fire attacks (`triggerFireAttack`, `tickBurningTiles`) and lantern illumination (`isTileLit`).
  - Added unit test in `tests/ai.test.mjs` verifying sorcerer spell priority over melee, and rule test in `tests/rules.test.mjs` verifying movement penalty, 4 tick damage, and fire cleansing.
  - Recaptured `09-new-sorcerer.png` and `10-side-battle.png` with `咒禁術士` on-screen casting `邪穢陰雷` surrounded by active cursed miasma tiles.

### Major Fixes
- **MAJOR #2 (Flanking Modifiers, Dynamic Preview Labels & Live Path Alignment)**:
  - Aligned live combat calculation in `js/engine/combat.js` to SPEC §5 by default: back attack +50% damage and disables defender counterattack; side attack +20% damage; front attack 1.0x with counterattack.
  - Cat patrol `cat_patrol` (`swift_shadow`) grants +100% back attack damage.
  - Made `directionMarker` dynamically reflect exact damage multipliers (`【背刺偷襲】+50% 傷害 (無法反擊)`, `【疾影背刺】+100% 傷害 (無法反擊)`, `【側翼突襲】+20% 傷害`).
  - Removed unused flags so the live path, preview cards, and tests execute identical combat formulas.
  - Recaptured `05-attack-preview.png` displaying `【疾影背刺】+100% 傷害 (無法反擊)` and accurate damage forecast.
- **MAJOR #3 (熊岳「槍林」ZOC Free Interception Hit & AI ZOC Pathing)**:
  - Implemented the free interception hit in `js/engine/battle.js`: enemy cavalry entering an adjacent tile of a friendly unit with `spear_wall` (熊岳 `bear_guard`) immediately triggers a `zoc_strike` dealing uncounterable physical damage before the turn progresses.
  - Passed `{ zoc: true, cursedTiles }` into AI reachable tile generation in `js/engine/ai.js`, ensuring enemy pathfinding respects player ZOC and routes around interception zones.
  - Added unit test in `tests/rules.test.mjs` asserting cavalry HP reduction on ZOC entry and generation of `zoc_strike` battle event.
- **MAJOR #4 (Bond-Restricted 合擊 Combo Attacks)**:
  - Restricted combo attack assist in `js/engine/combat.js` strictly to defined `BOND_PAIRS`:
    - 影燈 (`cat_patrol` + `lantern_crafter`)
    - 雷火 (`tanuki_mage` + `fox_maiden`)
    - 山泉 (`bear_guard` + `tea_master`)
  - Adjacent non-bond allies no longer grant unintended free assist damage.
  - Target preview card dynamically displays the authentic bond title: `【合擊 · 影燈/雷火/山泉】+<AllyName> (+<Dmg>)`.
  - Added test in `tests/rules.test.mjs` verifying cat+bear adjacent does NOT combo, while valid bond partners successfully assist.
- **MAJOR #5 (Class Promotion at Lv5 & 1-of-3 Level-Up Perk Cards)**:
  - Corrected promotion requirement to Lv.5 per SPEC §7, removing premature auto-promotion at Lv.2 from `campaign.js:addExp`.
  - Upgraded level-up modal in `js/render/ui.js` to offer 3 selectable perk cards on every level up:
    - 銳意進取 (攻擊力 +3)
    - 固若金湯 (防禦力 +2 · 氣血上限 +6)
    - 神行百變 (移動力 +1)
  - Camp profile sheet explicitly displays promotion unlock condition as Lv.5.
- **MAJOR #6 (Mobile-First 390px Viewport Safe Insets & Fold Organization)**:
  - Pinned the Stratagem selector chips (`.prebattle-pinned-stratagems`) inside `.prebattle-footer` directly above the launch CTA with safe padding `calc(60px + env(safe-area-inset-bottom, 16px))`, completely eliminating Grokbot occlusion.
  - Restructured Camp profile view (`#campProfileDetails`) so that 【✦ 佩掛神兵寶具 ✦】 and 【✦ 破境晉升 ✦】 sit directly below the header, leaving both fully visible and actionable above the 390px fold.
  - Fine-tuned battle camera centering (`centerCameraOn`) so that unit figures remain safely between the top HUD bar and bottom Grokbot banner.

### Minor Fixes & Polish
- **MINOR #7 (Continuous Flowing Canvas Overlays & Stratagem Restrictions)**:
  - Upgraded `renderFloodOverlay` to draw a continuous undulating river body with feathered banks and ripple crests across flooded rows, eliminating per-cell elliptical glyphs. Restricted 水淹 in stratagem picker strictly to Chapter 4 (山道) dam break per SPEC §8.
  - Upgraded `renderFireOverlay` to render merged flame contours and continuous fiery ink wash; fire spread checks both forest (`f`) and market (`m`), blocked by water (`w`) and stone (`#`).
  - Added dark violet cursed miasma mist rendering with `咒` boundary runes on `fireOverlayCanvas`.
- **MINOR #8 (3-Step Board Tutorial & Synchronized Nomenclature)**:
  - Aligned tutorial overlay to a 3-step board flow matching SPEC §6.
  - Dynamic header reads from `GAME.name` (`${GAME.name} · 基礎兵法`).
  - Tutorial flanking copy teaches +50% back attack and +100% for 疾影劍客.
- **MINOR #9 (SPEC Documentation Synchronization & Encounter Sim Expansion)**:
  - Synchronized `SPEC.md` (§§3, 5, 7, 8, 9, 11) with shipped features: 56px unit figure scale, facing & ZOC mechanics, Lv.5 promotion, 3-perk card choices, bond pairs, all 6 main chapters plus 外傳 (`side_marsh`).
  - Added heuristic simulation solutions and win assertions for Chapter 7 (`side_marsh`) in `tests/encounters.sim.test.mjs`.

### Test & Visual Verification
- `npm test`: **41/41 passing tests** across rules (21), ai (10), objectives (7), branding (2), and encounters simulation (1), verifying all 14 solution compositions win across Chapters 1-6 and 外傳, and naive bot fails.
- All 12 screenshots in `screenshots/v8/` recaptured deterministically at 390×844 DPR 2 with 0 browser console errors.

## v9 (2026-10-27)
- Chapter 1 rebalanced into a gentle tutorial; enemy hit cap (≥4 hits to kill); opening-turn grace; guard aggro; last-stand bonus.
- Manual tap-to-target with a pulse highlight, two-tap confirm and a cancel bar.
- Compact deploy sheet, 偵察 scout mode, auto-framing camera with HUD safe area.
- 敵域 threat-range toggle.


## Round 1 fixes

### Major Fixes
- **MAJOR #1 (Scout Deploy Tray Layout)**:
  - Formatted `.deploy-tray-bar.scouting` as a single horizontal compact bar with `flex-direction: row; justify-content: space-between; align-items: center;`.
  - Hid unit chip grid, synergy strip, and status badge in scouting mode.
  - Kept deploy title on a single line (`偵察敵陣中 · 可拖曳縮放`) and made 佈陣 and 出征開戰 two readable, prominent 44px buttons.
  - Recaptured `c-scout.png` and `live-scout.png` with map filling the viewport.
- **MAJOR #2 (Enemy Threat Canvas Contour & Default Off)**:
  - Filtered out impassable cliffs (`#`) and deep water (`w` for non-flyers) in `computeThreatTiles()`.
  - Replaced DOM-based per-cell `.grid-tile.threat` lattice with a single continuous feathered vermilion region painted on `#rangeOverlayCanvas` via `drawMergedRegion`.
  - Toggled threat off by default across battle UI and tests, isolating threat display exclusively to `b-threat.png`.
- **MAJOR #3 (Tutorial 建議行動 Button Squeeze)**:
  - Dropped `width: 100%` on `.btn-tutorial-ack` inside `.tutorial-card-actions`.
  - Set both `💡 建議行動` and `明白` buttons to `flex: 1 1 0; min-width: 0; height: 44px; white-space: nowrap;`, placing them cleanly side-by-side.
- **MAJOR #4 (Action Menu 技能 Label & Tutorial Beat 6 Align)**:
  - Replaced `計策` on the unit skill action button with `技能` in both `index.html` and `js/render/ui.js` to match SPEC §5 (`攻擊 / 技能 / 魔法 / 待命`).
  - Reserved `計策` strictly for the one-per-battle army stratagems (火攻, 佯攻, 水淹, 鼓舞, 夜襲).
  - Aligned tutorial beat 6 copy to reference `【技能】或【法術】`.
- **MAJOR #5 (Class Synergy Real Combat Modifiers & Unit Tests)**:
  - Connected `getClassSynergies` to active combat resolution in `js/engine/combat.js` and `js/engine/battle.js`:
    - `iron_fortress` (金湯固若): grants +1 DEF to all allies when tank + healer are present.
    - `cavalry_coop` (步騎協同): grants +1 MOV on turn 1 when flanker + (cavalry or flyer) are in squad.
    - `spell_arrow` (法箭交輝): boosts ranged/magic attacks by +10% damage when mage + archer are present.
  - Added dedicated test `Rules: Class synergy bonuses (spell_arrow +10% ranged dmg, iron_fortress +1 def, cavalry_coop +1 turn 1 mov)` in `tests/rules.test.mjs`.
- **MAJOR #6 (Deploy Camera Framing & Live Alignment)**:
  - Ensured deploy framing subtracts measured bottom overlay inset via `frameTiles(deployTiles ∪ units)`.
  - Recaptured `live-deploy.png` and `live-scout.png` against live production URL, completely free of empty black bands.

### Minor Fixes & Polish
- **MINOR #7 (SPEC §6 & Help Modal 7-Beat Sync)**:
  - Updated SPEC §6 and the navigation `?` modal (`showTacticsTutorialModal`) to present all 7 interactive beats in sync with the live battle tutorial.
- **MINOR #8 (Directional Targeting Preview Capture)**:
  - Added `g2-directional.png` to `screenshots/v9/` showcasing crane rider's `crane_line_gust` orange line highlight preview with cardinal confirm flow.
- **MINOR #10 (Combat Damage Multiplier Floaters Visibility)**:
  - Extended floating damage label lifespan to 2500ms and tuned confirm timing so `h-after-confirm.png` visibly captures the damage multiplier tags (`【側翼 ×1.2】`).
