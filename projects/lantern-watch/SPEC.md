# 燈影軍略 · Lantern Tactics — v4 SPEC (classic tactics rewrite)

Static vanilla-ES-module web game, mobile-first (iPhone 390px), relative paths only.
Lives at grokbot `projects/lantern-watch/` (URL path MUST stay `lantern-watch`). Keep `<script src="../_shared/back.js">` in index.html.
Clarity first: a first-time player must understand within 10 seconds. All in-game text Traditional Chinese (Cantonese-friendly).

## 0. Name — single source of truth
Create `js/config.js` exporting `GAME = { name:'燈影軍略', nameEn:'Lantern Tactics', tagline:'以燈為兵 · 以計破霧', storageKey:'lantern_tactics_v4' }`.
Title screen logo text, `document.title`, tutorial header and any other occurrence MUST read from it (index.html static `<title>` may also say 燈影軍略 · Lantern Tactics). Grep must find the old name 燈籠小鎮守夜人 nowhere in js/ or index.html. Title logo: large brush-calligraphy style (font-family stack with "Ma Shan Zheng"/serif fallback is fine via Google Fonts link OR local serif; gold gradient text with ink shadow).

## 1. Keep the look
Keep the ink-wash palette, gold hairline grid, parchment panels, lantern tokens, back button. Remove the card hand/deck/shop/reward-card systems entirely (cards removed). Old v3 code can be deleted or left unused; tests for removed systems should be replaced.

## 2. Art (already generated — use it, do not regenerate)
`assets/art/v4/`:
- Figures (transparent webp, 3/4 view, ~510x680): `fig_<id>.webp`; half-body portraits `por_<id>.webp` (top crop of the figure).
  Guardians: cat_patrol, lantern_crafter, tanuki_mage, tea_master, fox_maiden, bear_guard, crane_rider.
  Enemies: fog_rider, shadow_archer, paper_ghost, shadow_rat, mist_shaman, iron_general, mother_of_mist.
- Battle maps (768x1024 painted, top-down): `map_river_bridge.webp`, `map_gate.webp`, `map_market.webp`, `map_mountain.webp`.
- `world_map.webp` (parchment world map: bridge village lower-left, walled gate centre-right, market town lower-right, mountain shrine top).
Write CREDITS.md noting AI-generated art.

## 3. Units on the grid (2.5D figures)
Each unit renders as its figure image standing on its tile, feet at tile bottom, figure CSS height ~56px in a 64px cell (source figure aspect ratio ~1.6x, overflowing upward with z-index by row so lower rows draw in front). Elliptical soft ground shadow under feet. Warm amber `drop-shadow` rim light for guardians, cold violet for enemies. Facing: CSS `scaleX(-1)` to face left/right based on last move/attack direction. Idle: subtle breathing (scaleY 1→1.015, 3s) + sway, desynced per unit. Attack: lunge toward target 120ms; hurt: red flash + shake; KO: fade + sink + desaturate. Small HP bar under feet; team colour ring (gold ally / crimson enemy). Units that have acted this turn are greyed (filter: grayscale .7).
Portrait expression variant: in dialogue/detail, portrait gets CSS mood class (`.mood-angry` red tint+slight zoom, `.mood-hurt` desat, `.mood-calm` normal).

## 4. Maps, camera, terrain
Each battle map: grid **10 cols × 13 rows** overlaid on the 768x1024 painting (tile ≈ 76.8px source). Rendered at tile size 64px CSS → board 640×832, larger than the 390px screen. Board sits in a scroll viewport: drag-to-pan (pointer events, with a 6px threshold so taps still register), and the camera smoothly centres on the selected/active unit and on each enemy as it acts. Gold hairline grid only on walkable tiles.
Terrain per tile defined in `js/data/maps.js` as 13 strings of 10 chars, hand-aligned to each painting:
| char | terrain | move cost | DEF bonus | EVA % | notes |
|---|---|---|---|---|---|
| `.` | 平地 plain | 1 | 0 | 0 | |
| `f` | 森林 forest | 2 | +1 | 15 | |
| `h` | 山丘 hill | 2 | +1 | 10 | ranged +1 range, +20% dmg vs lower |
| `r` | 道路/橋 road/bridge | 1 | 0 | 0 | bridge tiles `b` same + knockback into water = KO for non-flyers |
| `w` | 河水 water | impassable (flyers ok) | | | |
| `#` | 牆/屋/崖 wall/roof/cliff | impassable (flyers ok) | | | |
| `g` | 城門 gate | 1 | +2 | 0 | hold-objective tile |
| `m` | 市集 market | 1 | 0 | 10 | |
| `s` | 淺灘 shallows | 3 | -1 | 0 | |
Tap an empty tile (or long-press any) → bottom info strip shows terrain name, move cost, DEF/EVA bonus.

## 5. Controls (classic 曹操傳 flow)
1. Tap own unit → selected; reachable tiles glow blue (BFS by move cost, blocked by enemies & impassable, flyers ignore costs). Attackable-from-anywhere tiles faint red outline.
2. Tap a blue tile → unit walks there (animated along path). Tap the unit's own tile = stay.
3. Action menu pops next to the unit (big 56px buttons): **攻擊 / 技能 / 魔法 / 待命**, plus small **取消** (undo move; allowed until an action is confirmed). Buttons disabled (greyed with reason) if no target/MP.
4. 攻擊/技能/魔法 → range tiles red; area shapes (line/cross/cone) previewed in orange following the tapped direction/target. Tapping a target shows **preview card**: attacker → defender portraits, damage numbers, hit %, crit, counter-attack yes/no, terrain bonus, "KO!" marker. Buttons 確認 / 返回.
5. After all allies acted or 結束回合 pressed → banner **敵方回合** (ink-brush sweep, 1.2s) → enemies act one by one with camera follow + animations → banner **我方回合**.
Back attack: attacking from the tile opposite defender's facing = +50% dmg and no counter (cat_patrol with 「疾影」deals +100% and no counter). Preview shows 【背刺偷襲】+50% 傷害 (無法反擊) or 【疾影背刺】+100%. Side attack = +20% dmg (defender can counter if melee in range), preview shows 【側翼突襲】+20% 傷害. Frontal attack = 1.0x damage.
General ZOC: Hostile combatants project Zone of Control onto adjacent tiles stopping foot soldiers ({ zoc: true }), showing '阻' badge. Light units and flyers ignore general ZOC. Cavalry entering adjacent tile of a spear wall (bear_guard 熊岳「槍林」) is intercepted and takes an immediate free hit (zoc_strike).
Counter-attack: melee defenders hit back once if attacker in range and defender survives.

## 6. Tutorial (3 steps, first launch + replayable via 「?」)
Overlay with dimmed screen and pulsing spotlight: ① 「撳角色 → 藍格係可以行嘅位」 ② 「撳藍格移動 → 揀 攻擊/技能/魔法/待命」 ③ 「紅格係攻擊範圍，睇清傷害預覽先確認」. Big 「明白」 button. localStorage `${GAME.storageKey}_tutorial`.

## 7. Characters & progression (scoped)
`js/data/units.js`. Each guardian: id, name, title, class, backstory line, bark (shown in floating speech bubble on attack/skill), stats (HP, ATK, DEF, MAG, RES, SPD, MOV, range), one personal trait, 1 skill + 1 magic.
| id | 名 | class | role | trait |
|---|---|---|---|---|
| cat_patrol | 墨影 | 劍客 | flanker, MOV 5 | 「疾影」back-attack +100% instead of +50% |
| lantern_crafter | 燈娘 小螢 | 弓手 | range 2–3 | 「掛燈」skill: place a light on a tile (radius 2 reveals shrouded enemies, 3 turns) |
| tanuki_mage | 雷狸 | 術士 | magic | 「連雷」thunder chains to adjacent enemies (x2 vs water-type) |
| tea_master | 茶翁 | 醫師 | healer | 「清心茶」heal 2-range + cleanse |
| fox_maiden | 狐火 緋 | 術士 | magic AoE | 「狐火」cross-shaped fire (x0 vs water-type) |
| bear_guard | 熊岳 | 槍盾 | tank MOV 3 | 「槍林」ZOC: cavalry entering adjacent tile is stopped and takes a free hit |
| crane_rider | 鶴羽 | 飛騎 | flyer MOV 6 | ignores terrain; 「俯衝」+30% vs archers |
Enemies: fog_rider 霧騎 (cavalry MOV 6, charge +40% after moving ≥3), shadow_archer 影弓 (range 2–3, +hill), paper_ghost 傘魂 (water-type, fire immune, thunder x2), shadow_rat 匿鼠 (shrouded: invisible/untargetable unless within light or adjacent), mist_shaman 霧巫 (heals 8 to an ally in 3), iron_general 鐵將 (front shield: frontal dmg -70%, back attack full; on bridge can be knocked into water by bear_guard 「推」), siege_engine 霹靂砲車 (long-range bombardment 3–6 range, blind zone <3 range), curse_sorcerer 咒禁術士 (大荒妖術師: MAG 15, role curse_sorcerer, AoE 幽冥咒縛, magic 邪穢陰雷, trait 「咒蝕之霧」curse_miasma creating cursed tiles: MOV -1, 4 tick dmg/turn, cleansed by fire or lantern), mother_of_mist 霧母 (boss).
Progression: EXP per action; level-up shows **1-of-3 choice** cards (e.g. +3 ATK / +2 DEF & +6 HP / +1 MOV 神行百變). **Relic slot** ×1 per unit (relics from victories, e.g. 倚天古劍 +4 ATK, 鐵護符 +2 DEF). **Bond pairs** (cat_patrol+lantern_crafter 「影燈」, tanuki_mage+fox_maiden 「雷火」, bear_guard+tea_master 「山泉」): when adjacent to designated partner, the actor gets a 合擊 option in the menu (one free extra hit from partner, once per battle; preview displays 【合擊 · 影燈/雷火/山泉】). Adjacent non-bond allies do not trigger extra hits. **Promotion** at Lv5: class name upgrades (劍客→劍聖 etc.) + stat bump + figure gets gold aura class, unlocked via camp 破境晉升 button. **Detail sheet**: tap portrait/long-press unit → modal with large portrait, stats, terrain, trait, skills, relic, bond, lore.
Persist roster progress in localStorage.

## 8. Campaign flow
Title → World map (`world_map.webp`, 6 main route nodes + 1 外傳 node with 捷/新/鎖/密 seals, locked until previous cleared; chapter 2 & 3 can be chosen in either order = route choice) → Story intro (2–4 dialogue lines with portraits, mood) → **Pre-battle**: scout panel (enemy list with portraits + roles, tap map tiles for terrain), **pick squad** (limit per battle), **deploy** onto highlighted deployment tiles (tap unit then tile), choose optional **計策** (one per battle, pinned above CTA button with safe margin) → Battle → Victory (EXP, level-ups, relic, bark, MVP portrait) / Defeat (retry) → World map.
計策 list: 火攻 (fire on a 3x3 forest/market area at turn 1: 10 dmg, x0 water; spreads to adjacent forest/market tiles unless blocked by water/stone), 伏兵 (one ally deploys anywhere hidden in forest), 佯攻 (enemy cavalry turn 1 moves toward a decoy tile), 水淹 (map 4 only: dam break floods the lower path, 15 dmg to units in shallows/road rows ≥9), 夜襲 (enemies skip turn 1), 鼓舞 (+20% dmg for allies turns 1–2).

## 9. Encounter design table
| # | Map | Objective | Enemy mix | Intended counters | Solution A | Solution B |
|---|---|---|---|---|---|---|
| 1 | 河橋 river_bridge | 護送燈籠車 escort the lantern cart (NPC, MOV 3) to the bridge's far end within 12 turns | 4 fog_rider + 2 shadow_archer on hill | spear wall (bear ZOC), chokepoint at bridge, archers flanked | bear_guard + tea_master hold bridge mouth, archer snipes riders funnelled | crane_rider + cat_patrol flank the hill archers, 佯攻 pulls cavalry away from cart |
| 2 | 城門 gate | 守門 hold the gate tile area for 8 turns | 3 paper_ghost (water) + 2 fog_rider + 1 mist_shaman | thunder chain vs water spirits, focus healer | tanuki_mage chains ghosts that bunch at gate, bear blocks gate | cat_patrol/crane dive mist_shaman first, then grind; fox useless vs ghosts (teaches counter) |
| 3 | 市集 market | 保護燈柱 protect the central lantern (destroyed at 0 HP) 10 turns or rout | 4 shadow_rat (shrouded) + 2 shadow_archer on rooftops-edge | light placement reveals rats, alleys as chokepoints | lantern_crafter 掛燈 around the square + fox AoE | 火攻 on market stalls turn 1 + tight ring of tank/healer adjacent to lantern (rats reveal when adjacent) |
| 4 | 山道 mountain | 擊破鐵將 defeat iron_general (or reach the shrine exit) | iron_general (shield, holds dam bridge) + 2 mist_shaman + 2 shadow_archer high ground + mother_of_mist appears turn 5 at shrine | back attack, knock off bridge, focus healers, 水淹 | cat_patrol/crane get behind general for back attack, healers killed first | bear_guard 推 general into reservoir from bridge; or 水淹 + rush exit |
| 5 | 竹海關隘 bamboo_pass | 抵達祭壇或殲滅敵軍 reach shrine or rout all enemies | 3 shadow_rat + 2 shadow_archer + 2 mist_shaman | light reveals stealth rats, AoE clears bamboo groves | lantern_crafter + bear_guard push central road; crane_rider snipes archers | cat_patrol + tanuki_mage + fox_maiden clear bamboo flank with fire/thunder |
| 6 | 總壇攻城 citadel_siege | 破壞城門或擊敗總壇首領 breach gate or defeat citadel warlord | siege_engine (3-6 range) + iron_general + 2 shadow_archer + mist_shaman | rush siege engine blind zone (<3 range), flank heavy shields | bear_guard + crane_rider rush siege engine blind zone; fox AoE on gate | cat_patrol flanks general; tanuki + lantern destroy siege engine from cover |
| 外傳 | 幽澤迷陣 side_marsh | 抵達祭壇或擊破咒禁術士 survive 5 turns or rout curse_sorcerer | curse_sorcerer (MAG 15) + 3 paper_ghost + 2 shadow_rat + cursed miasma tiles | cleanse cursed miasma with fire/lantern, rush boss, thunder vs water | bear_guard + tea_master + lantern_crafter cleanse path with lanterns/fire and burst boss | cat_patrol + fox_maiden + tanuki_mage flank and exploit elemental thunder/fire weaknesses |
Squad limits: 4, 5, 5, 6, 6, 6, 5. Different comps must win (see tests).

## 10. Enemy role AI (`js/engine/ai.js`)
- archer: stay at max range, prefer hill tiles, retreat (kite) if an ally is adjacent.
- healer: stay ≥2 tiles behind front; heal lowest-HP% ally in range; else move toward allies, never frontline.
- cavalry: target the most exposed (fewest adjacent allies) or backline unit, path around ZOC, charge.
- commander: hold position (guard tile) facing nearest threat; attack only adjacent.
- shrouded: move through alleys/forest to attack lowest-DEF unit; untargetable unless lit/adjacent.
- boss: AoE mist on clusters of ≥2.
- curse_sorcerer: cast AoE 幽冥咒縛 on clusters, or range 2-3 邪穢陰雷; spreads cursed tiles.
AI must be deterministic given a seeded RNG (for tests).

## 11. Engine & tests
Pure engine (`js/engine/*.js`) independent of DOM: map/terrain, pathfinding, combat formula (dmg = max(1, ATK - DEF - terrainDEF) × mods; magic uses MAG/RES; hit = 95 - EVA), facing/back attack, ZOC, knockback, objectives, AI, campaign state, serialize/deserialize.
`npm test` runs node tests:
- rules: movement costs, impassable, flyer, ZOC stop, back-attack mods, counter, water immunity/weakness, shrouded targeting, knockback into water.
- ai: archer kites, healer stays back, cavalry targets backline, commander holds.
- objectives: escort/hold/protect/defeat win & lose conditions.
- **sim**: `tests/encounters.sim.test.mjs` — a scripted heuristic player bot with comp + 計策 parameter. For each of the 6 main battles + 外傳 assert ≥2 distinct comps (from the table) win with seed set; assert no single comp wins all battles with the *same* naive "charge nearest" bot (i.e. naive brute force fails at least one), so strategy matters. Print a win table.
- name: config GAME.name === '燈影軍略' and no old name in js/ & index.html.
Keep tests fast (<60s).
Keep tests fast (<60s).

## 12. Screenshots
`scripts/capture_screenshots.mjs` (Playwright chromium, 390×844, DPR 2) → `screenshots/v4/`: `01-tutorial.png`, `02-select-move-range.png`, `03-action-menu.png`, `04-attack-preview.png`, `05-enemy-turn.png`, plus `06-world-map.png`, `07-prebattle.png`, `08-detail-sheet.png`, `09-dialogue.png`, `00-title.png`. Expose `window.__lt` debug hooks for deterministic capture.

## 13. Docs
REPORT.md (v4 summary, controls, weak spots), CHANGELOG.md, CREDITS.md. Old card-game docs moved to backup-v3b/.

## v9 Balance Rationale (2026-10-27)

Global rules: an enemy hit on a guardian is capped at ceil(maxHp × 30%) after crits, so it takes **≥4 hits** to kill anyone (AI planning sees uncapped numbers, so the AI isn't changed). On turn 1, no guardian can drop below 1 HP (opening grace). Enemies marked `aggro:'guard'` (and every boss) hold position until a guardian comes within `guardRadius` tiles or they get hit. When living foes outnumber the squad, **背水一戰 (last stand)** gives guardians ×1.2 damage. The **敵域** HUD toggle draws every enemy's move+attack threat in red, and **偵察** during deployment collapses the sheet and frames the enemy force before 開戰.

| # | Battle | Force | Why it's fair | How to win | Naive-rush sim (50 seeds) | Reasonable bot (50 seeds) |
|---|---|---|---|---|---|---|
| 1 | 孤舟燈影渡寒川 (escort, tutorial) | 4 v 3 (was 4 v 6) | Player outnumbers enemy. One rider, one archer, and one archer on guard near the far bank, so there's no turn-1 rush on the cart | Kill the rider first, then walk the cart over the bridge; the guarded archer only wakes when you get close | 49/50 (98% win) | 50/50 (100% win) |
| 2 | 鐵壁雄關鎮夜魘 (hold gate) | waves at the gate chokepoint | Gate chokepoint + ZOC; waves are staggered | Hold the 1-tile gate with your sturdiest unit, mage behind, heal on rotation | 0/50 (fails: rushing outside loses) | 49/50 (98% win) |
| 3 | 長街百肆明燈燃 (protect lantern) | market street + flank ambushes | Stalls offer cover; north alley guards hold ground; turn 3–4 flank waves spawn behind naive rush | Hold choke perimeter around the lantern, intercept rear flankers, heal lantern | 14/50 (fails: undefended lantern falls) | 43/50 (86% win) |
| 4 | 雲海天池決戰峰 (boss / reach) | summit dam + 2-phase boss enrage | Boss triggers phase 2 (+2 ATK) at ≤66% HP and phase 3 (+3 ATK) at ≤33% HP | Clear wall flankers first, fly crane over water reservoir for back attack or rush altar | 24/50 (fails: boss wipes frontal rush) | 50/50 (100% win) |
| 5 | 竹海夜霧斷魂隘 (shrine / rout) | bamboo pass + turn 4 dawn | Dense guard zones hold the pass; turn 3 rear cavalry ambush; fog clears on turn 4 | Move in pairs through bamboo, hold choke with bear guard, push altar at dawn | 23/50 (fails: cavalry pincer wipes rush) | 48/50 (96% win) |
| 6 | 鐵甲雄關破重圍 (breach) | moat fortress + collapsing bridge | Moat bridge collapses on turn 4 into deep water; siege engine covers bridge | Fly crane rider over walls to snipe artillery, breach gate or cross before turn 4 | 18/50 (fails: stranded outside by moat) | 41/50 (82% win) |
| 7 | 荒澤伏擊破咒禁 (survive / rout) | marsh ambush + cursed miasma | Cursed tiles slow movement and tick damage; turn 3–4 paper ghost ambushes from water | Turtle on dry ground, cleanse curses with fire/lantern, focus sorcerer | 0/50 (fails: drowned in marsh) | 45/50 (90% win) |

Invariant tests (`tests/balance.sim.test.mjs`):
1. Chapter 1 naive win rate ≥45/50 (≥90%).
2. Zero guardian deaths in the first enemy phase across all chapters.
3. Naive rush fails non-tutorial tactical chapters (Ch3, Ch5, Ch7 < 25/50).
4. Generic reasonable bot achieves ≥70% win rate across all chapters (82%–100% per chapter).
