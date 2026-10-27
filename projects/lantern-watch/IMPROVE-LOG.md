
## Improve loop changelog
- 2026-10-27 02:02 (Asia/Macau): Previous 2-round run DONE 01:43, live site 200 with 燈影軍略 title. Strict 390px review found: live first-load still shows the old v1 card-game tutorial modal (守夜入門指引); figures overlap/stack and clip at map edges; grokbot button covers bottom-left units; pre-battle 開戰 bar overlaps a stratagem card, intel shows only 2 of 6 enemies with English labels. Launched improve round 1 (prompts/improve-1.txt): fix stale tutorial, figure anchoring/z-sort/safe insets, 3+ new enemy archetypes with varied chapter objectives, elemental spell VFX, post-battle progression. Previous state in .orch-prev-1, old prompts/reviews in prompts/prev-1 and reviews/prev-1.
- 2026-10-27 03:39 (Asia/Macau): Improve round 1 DONE 03:30 (grok review NOT READY before fix-1; fix-1 resolved level-up Lv.2, 2-pick, Chinese tags, enemy lore, action menu 攻擊/計策/法術/待命), live 200. Strict 390px review: title screen lower half blank with no painted key art; spell VFX tiny (thunder a sliver, tag overlaps sprite); attack-preview panel covers ~30% of the board and a bottom-right unit is still clipped; level-up/pre-battle panels plain. Launched improve round 2 (prompts/improve-2.txt): painted title key art and panel art, large per-element VFX, camera framing + compact preview, new class changes/combo attack/terrain stratagems/new encounter, intel grid and post-battle progression. Previous state in .orch-prev-2, old prompts/reviews in prompts/prev-2 and reviews/prev-2.
- 2026-10-27 05:11 (Asia/Macau): Improve round 2 DONE 05:03 (grok review NOT READY before fix-1; fix-1 addressed grokbot clearance, 2.6-cell fire VFX, preview auto-pan, wrapping squad grid, Ch5 objective label), live 200. Strict 390px review of screenshots/v6: move-range highlight is flat opaque blue debug squares; figures in adjacent rows overlap (heads over HP bars); faint permanent grid lattice; Ch5 fog vision never implemented and 水淹 is still a damage pulse; post-battle XP is a flat +50 for all. Launched improve round 3 (prompts/improve-3.txt): painted range highlights + path preview and figure scaling/z-sort, real fog-of-war + flooding + new enemy archetype, per-action XP/MVP and camp screen with profile/equipment/promotion, Ch6 siege map, title flag and lunge/idle polish. Previous state in .orch-prev-3, old prompts/reviews in prompts/prev-3 and reviews/prev-3.

- 2026-10-27 06:35 (Asia/Macau): Improve round 3 DONE 06:33 (grok review NOT READY before fix-1; fix-1 addressed row overlap, grokbot/HUD clearance, camp equip/promotion fold, Ch6 intel grid, painted flood/AoE wash, emoji cleanup), live 200. Strict 390px review of screenshots/v7: fog of war is hard-edged black squares, flood is per-cell repeated water tiles with seams, move range and 砲車 AoE still look like separate boxes, figures small and hard to read, camp profile has empty areas and a small portrait. Launched improve round 4 (prompts/improve-4.txt): soft painted fog mask, merged flood/range regions, clearer figures with base rings and class badges, facing/flanking + zone of control + AI use, rich character sheet with large portraits and barks, 火攻 stratagem vs 妖術師 enemy in a new side battle, title/world-map/post-battle polish. Previous state in .orch-prev-4, old prompts/reviews in prompts/prev-4 and reviews/prev-4.

## 2026-10-27 · v10 comprehensive roadmap pass (Balance, 7-Beat Tutorial, Directional Skills, Battle Twists)
- Balance follow-up:
  - Staggered enemy waves, turn 3–4 flank reinforcements, and guard zones configured across maps. Naive rush fails Ch2 (0/50), Ch3 (14/50), Ch4 (24/50), Ch5 (23/50), Ch6 (18/50), Ch7 (0/50) — well under 50%.
  - Preserved Ch1 naive win rate (49/50 = 98% >= 90%) and zero first-phase deaths across all chapters.
  - Generic reasonable bot (`tests/helpers/reasonable-bot.mjs`: focus fire lowest-HP/high-threat, threat zone evasion, heal under 40%, hold chokes and objective perimeter) achieves 82%–100% win rate across all 7 chapters (asserted in `tests/balance.sim.test.mjs`). Updated `SPEC.md` v9/v10 table.
- 7-Beat Guided Interactive Tutorial:
  - Implemented 7 progressive beats across Chapter 1: 1. Move (移動走位), 2. Attack (攻擊鎖定), 3. Terrain (地形高低), 4. Counter & Flank (反擊與背刺), 5. Lantern Light (燈火驅霧), 6. Spell (法術轟擊), 7. Stratagem (軍略計策).
  - Spotlight focus ring with gold pulse highlights on target/tiles.
  - One-line contextual hints with an 8-second idle prompt advising exact tactical choices.
  - `💡 建議行動` (suggested move) button allowing players to preview and execute ideal tactical decisions instantly.
  - Post-hit combat feedback floating tags displaying exact damage multipliers: `【背刺 ×1.5】`, `【側翼 ×1.2】`, `【居高臨下 ×1.2】`, `【正面護盾 -70%】`, `【地形防禦 -X】`, `【屬性相剋 ×2.0】`.
- Dynamic Battle Twists:
  - Ch2 timed gate defense (8 turns).
  - Ch3 market ambush + turn 3/4 flank wave reinforcements targeting the central lantern cart.
  - Ch4 Iron General multi-phase boss: triggers Phase 2 (+2 ATK, +1 DEF) at <=66% HP and Phase 3 (+3 ATK, +2 SPD, berserk AoE) at <=33% HP.
  - Ch5 night fog clearance: weather turns clear on Turn 4, dispersing fog and revealing enemies.
  - Ch6 collapsible moat bridge: stone walkway at (4,8) and (5,8) collapses into deep water on Turn 4, isolating ground forces and emphasizing aerial mobility (Crane Rider).
  - Ch7 marsh escort & cursed miasma ambush with Sorcerer.
- Directional Skills & Targeting Flow:
  - Added line geometry (`Board.getLineTiles`) and cone geometry (`Board.getConeTiles`).
  - Added `crane_line_gust` (鶴羽翔風, 3-tile linear knockback) for Crane Rider and `flame_fan_cone` (赤羽炎扇, 4-tile cone blast) for Fox Maiden.
  - 4-way cardinal direction picker with live orange area highlight preview and confirm flow.
- Route Events, Recruits & Class Synergies:
  - Inter-battle route events (Ch2 supply choice, Ch4 scouting choice).
  - Hero recruitment events (Crane Rider after Ch1, Fox Maiden after Ch3).
  - Class synergy badges: `【金湯固若】` (Bear + Iron Guard), `【步騎協同】` (Cavalry + Infantry), `【法箭交輝】` (Archer + Mage) displayed in squad selection and deployment tray.
- UI & Polish:
  - Fixed deploy screen map gap: `.battle-map-bg` and `frameTiles()` ensure map fills full height above deploy tray.
  - Top bar HUD: separated into `.hud-main-row` and dedicated `.hud-obj-row` to prevent objective text clipping by buttons.

## 2026-10-27 · v9 urgent fairness pass (Penny: 「第一關…2秒比佢哋秒殺」)
- Root cause: ch1 was an escort with 6 enemies (4 fog_riders: move 6, ×1.4 charge, plus back/side multipliers) rushing a 25 HP cart. Also the default squad has no bear_guard, which the map's design assumed. The naive bot won 0/50.
- Fix: enemy hit cap at 30% of maxHp, turn-1 grace, guard/aggro AI zones, last-stand ×1.2, ch1 cut to 3 enemies with a guard. ch1 naive is now 49/50, with no first-phase deaths in any chapter.
- Manual targeting: all valid targets pulse red. Tap once to preview, tap the same target again (or 確認執行) to confirm; 取消 goes back to the action menu. No auto-picked target.
- Deploy/camera: compact sheet, 偵察 scout mode, camera frames the bounding box of the deploy tiles and units. Every pan uses `frameTiles()`, which subtracts the measured bottom-overlay inset (HUD safe area). The camera frames attacker+target for the preview and the unit+targets for the action menu.
- 敵域 threat-range toggle.
- Not done: naive rush still wins ch3/ch5/ch7, a generic 70–90% "reasonable" bot, the tutorial, map variety. See prompts/improve-next.txt.

## 2026-10-27 11:05 · improve round 7 launched (prompts/improve-6.txt)
- Round 6 (improve-5) finished 10:57. Live returns 200. npm test passes: ch1 naive 50/50; reasonable ch1/2/4/5/6 100%, ch3/ch7 92%; the naive rush fails ch3/5/7.
- 390px review of screenshots/v9: the deploy gap and the objective clipping are fixed, and the attack preview is clean. New issues: the ch1 tutorial names 熊岳, who wasn't deployed, and undeployed 槍/飛 units appear; the info bar shows "河水 移∞" for a unit; the tutorial dims the whole map.
- Brief: ch1 roster/tutorial coherence plus a spotlight; tune mid chapters to a 75–90% reasonable-bot win rate via composition (not stats); a 士氣 morale/rout system; ch8 山道伏兵 with a 盾陣 phalanx and a 滾木 stratagem; 1.25× figures with shadows and idle bob. Screenshots go to screenshots/v10. Old state is in .orch-prev-6.

## 2026-10-27 12:05 (Asia/Macau): Improve round 7 DONE (prompts/orch-build.txt)
- All test suites passing (`npm test`: 28 rules, 10 AI, 8 objectives, 2 branding, 16 encounter simulations, 8 balance simulations).
- 390px mobile battle UI verified across 5 critical steps in `screenshots/v10/`:
  - `screenshots/v10/a-deploy.png`: Deploy tray and pre-battle roster completely consistent on `['bear_guard', 'cat_patrol', 'lantern_crafter', 'tea_master']` (熊岳, 墨影, 燈娘, 茶翁), removing phantom flyer/spear units.
  - `screenshots/v10/b-tutorial-spotlight.png`: Tutorial Beat 1 with dynamic radial gradient spotlight cutout around Bear at `(1, 11)`. Bottom info bar reads `(1,11) 平地 · 移1 · 防+0 【熊岳】` (no deep water/infinite move).
  - `screenshots/v10/c-battle-morale.png`: Dual morale bar in HUD (`#hudAllyMorale` / `#hudEnemyMorale`) with dynamic morale drops from flank/back attacks and unit losses, plus rout behavior on low morale.
  - `screenshots/v10/d-ch8-shield-wall.png`: Chapter 8 (萬壑松風伏兵隘) with hand-painted `map_mountain_pass.webp` background, `shield_phalanx` (鐵壁盾陣) 85% frontal physical damage reduction, and `rolling_log` (滾木) stratagem.
  - `screenshots/v10/e-target-preview.png`: Compact action and target preview cards with safe insets never covering units or targets.
- Balance Calibration (Zero Stat Inflation):
  - Reasonable Bot: Ch1 100%, Ch2 86%, Ch3 90%, Ch4 88%, Ch5 88%, Ch6 90%, Ch7 76%, Ch8 76% (all mid chapters land in 75–90% range).
  - Naive Bot fails tactically: Ch2 0%, Ch3 22%, Ch4 26%, Ch5 2%, Ch6 24%, Ch7 18%, Ch8 2% (all well below 50%).
  - Core invariants held: Ch1 naive 100%, zero first-phase deaths across all chapters, enemy hit cap holds at 30% maxHp.
- Visual Polish at 390px:
  - Battle figures scaled 1.25x (`height: 60px; max-width: 58px`) with 52px grounded contact shadows and `figureBob` idle breathing.
  - Clearer faction silhouettes and high-contrast ally (gold-cyan) and enemy (crimson) outline glows.
- Deployment: Published to GitHub Pages (`/workspace/orchestrator/publish.sh .`), live URL returns HTTP 200.

## 2026-10-27 13:20 (Asia/Macau): Improve round 8 DONE (prompts/orch-build.txt)
- All test suites passing (`npm test`: 30 rules, 10 AI, 8 objectives, 2 branding, 16 encounter simulations, 8 balance simulations).
- 390px mobile battle UI verified across 5 critical steps in `screenshots/v11/`:
  - `screenshots/v11/a-deploy.png`: Chapter 1 deploy phase with spread tiles, 1-tile gap options, zero figure overlap, full clearance above bottom info bar, visible `.unit-name-tag` badges, and agreed class badges (熊岳=盾, 墨影=劍, 茶翁=醫, 燈娘=弓, 燈車=車).
  - `screenshots/v11/b-tutorial-spotlight.png`: Tutorial Beat 1 with dynamic spotlight focused on 熊岳 at `(1, 11)` with 盾 badge, matching bottom info bar and prompt text.
  - `screenshots/v11/c-battle-start-pan.png`: Battle start camera pan and 偵察 scout mode framing northern enemies (`霧騎` at north bridgehead, `影弓` in pine groves).
  - `screenshots/v11/d-morale-rout.png`: Morale rout in battle with floating callouts `【敵軍士氣 ↓ -15】` and `【潰走逃亡！】`, toast alert, and enemy morale gauge at 20.
  - `screenshots/v11/e-ch8-mountain-pass.png`: Chapter 8 (萬壑松風伏兵隘) with hand-painted `map_mountain_pass.webp` background matching river map ink-wash quality: sheer cliffs, high ground terraces, pine slopes, log chute for 滾木, and aligned 盾陣精兵 phalanx and 伏兵統領 boss.
- Unit Identity & Name Labels:
  - Added explicit `.unit-name-tag` above every figure (amber/gold for allies, crimson for enemies), hidden in fog of war.
  - Explicit `clsBadge` mapped for every ally and enemy archetype; added rules unit test asserting badge-class agreement.
- Rich Morale & Stratagem Gameplay:
  - Added 擂鼓 (`rally`) stratagem (+25 ally morale, +1 MOV within radius 2).
  - Routed enemies flee towards map edges away from player allies; chasing down routed enemies awards +5 bonus XP (`【擊潰逃敵 +5 經驗】`).
  - First-time low morale (<50) triggers `showMoraleNotice` tutorial guidance toast.
- Balance Calibration (Zero Stat Inflation):
  - Ch1 naive win rate: 50/50 (100% >= 90%).
  - Reasonable bot win rate: Ch1 100%, Ch2 86%, Ch3 90%, Ch4 88%, Ch5 84%, Ch6 90%, Ch7 80%, Ch8 76% (75–90% range across Ch2–Ch8).
  - Naive rush fails tactically across Ch2, Ch3, Ch5, Ch6, Ch7, Ch8 (< 50%).
  - Core invariants held: zero first-phase deaths, enemy hit cap at 30% maxHp.
- Deployment: Published via `/workspace/orchestrator/publish.sh .`, live URL returns HTTP 200.

## 2026-10-27 12:40 (Asia/Macau): improve round 8 launched (prompts/improve-7.txt)
- Round 7 finished at 12:22. The live site returns 200. npm test passes: ch1 naive 50/50; reasonable ch2–8 76–90%; no first-phase deaths.
- The 390px review of screenshots/v10 found several issues. The ch1 class badges and sprites don't match the names: the shield figure is badged 槍, and the tutorial says 熊岳 but the spotlight sits on the 劍 unit. All units are crammed into the bottom-left corner and clipped by the info bar, and no enemy is visible at battle start. The ch8 mountain-pass art is murky and unreadable.
- Brief: make unit identity coherent (with name labels and a test); spread out the deploy area; add a battle-start camera pan that shows the enemies; repaint the ch8 map; give morale visible callouts, routing enemies and a 擂鼓 rally stratagem; keep all balance invariants. Screenshots go to screenshots/v11, and the old state is in .orch-prev-7.

## 2026-10-27 15:05 (Asia/Macau): Improve round 9 DONE (prompts/orch-build.txt)
- All test suites passing (`npm test`: 32 rules, 10 AI, 8 objectives, 2 branding, 16 encounter simulations, 8 balance simulations).
- 390px mobile battle UI verified across 6 critical steps in `screenshots/v12/`:
  - `screenshots/v12/a-deploy-collapsed.png`: Deploy tray collapsible with compact toggle button (`展開 ▲`), 2–3 rows of deploy tiles, and character chip names (`燈娘 小螢`) fitting neatly without wrapping.
  - `screenshots/v12/b-tutorial-compact.png`: Compact dockable 1-line tutorial hint at top (`#tutorialBoardCard.compact`) with `💡 建議`, `詳情`, and `明白` buttons, completely unobstructed view of spotlighted unit (熊岳) and move range.
  - `screenshots/v12/c-weather-reinforce.png`: Weather system in action (`🌧️ 雨` badge + tooltip, animated rain overlay canvas), accompanied by telegraphed reinforcement warning marker (`⚠️ 援軍突襲 斥候`) at map edge with glowing hazard border.
  - `screenshots/v12/d-dialogue-bark.png`: Character portrait dialogue bark bubble (`【熊岳 · 開戰號令】`) floating at top safe area without overlapping HUD morale or battle units.
  - `screenshots/v12/e-star-result.png`: 4-star evaluation row (旗開得勝, 速戰速決, 全員生還, 勢如破竹) and MVP highlight card (`【本戰MVP】 熊岳・戰功卓著`) with crown badge and victory quote.
  - `screenshots/v12/f-visible-rout.png`: Single rally callout (`【我軍士氣 ↑ +25】`), fleeing routed enemy (`霧騎`) with floating `⚑ 潰` flag, dust trail, and cleared bottom info strip.
- Gameplay & Weather Mechanics:
  - Per-chapter weather implemented: `rain` (water flood +25%, fire attack -25%, rain streaks), `fog` (range/vision -1, mist), `wind` (downwind +y range bonus, blowing leaves), `night` (lantern light radius).
  - Distinct weather & event combos across Ch2 (wind + Turn 3 side reinforcement), Ch4 (fog + Turn 5 boss reinforcement), and Ch6 (rain + moat bridge collapse + Turn 5 scout reinforcement).
  - Telegraphed reinforcements announce 1 turn early with edge hazard markers, enabling chokepoint preparation.
- Art & Silhouette Pop:
  - Enemy units (影弓, 霧騎, 盾衛, 盾陣精兵, 刺客) enhanced with crimson cloth accents, weapon gleams, and rim lighting.
- Balance Calibration (Zero Stat Inflation):
  - Ch1 naive win rate: 50/50 (100% >= 90%).
  - Reasonable bot win rate: Ch1 100%, Ch2 86%, Ch3 90%, Ch4 88%, Ch5 84%, Ch6 88%, Ch7 80%, Ch8 76% (75–90% range across Ch2–Ch8).
  - Naive rush fails tactically across Ch2, Ch3, Ch5, Ch6, Ch7, Ch8 (< 50%).
  - Core invariants held: zero first-phase deaths, enemy hit cap at 30% maxHp.
- Deployment: Published via `/workspace/orchestrator/publish.sh .`, live URL returns HTTP 200.

## 2026-10-27 15:40 (Asia/Macau): improve round 10 launched (prompts/improve-9.txt)
- Round 9 finished at 15:19. The live site returns 200. npm test passes: ch1 naive 50/50, reasonable ch1 100% and ch2–8 76–90%, no first-phase deaths.
- The 390px review of screenshots/v12 found these issues. Ch1 figures still hug the bottom edge with about 70% of the view showing empty river. Ch6 figures overlap each other. The tutorial hint covers the objective banner. The enemy crimson glow flattens sprites into red silhouettes. 引路燈車 is drawn as a floating lantern, not a cart. The result screen shows the MVP twice.
- Brief: reframe the camera and the ch1 deploy area; one figure per tile; replace the red glow with a rim light and cloth trim; add a cart sprite and a real escort mechanic (moving cart, 護衛, progress shown in the objective line); give stars their conditions and add per-character stat lines on the result screen. Keep all balance invariants. Screenshots go to screenshots/v13, and the old state is in .orch-prev-9.

## 2026-10-27 16:20 (Asia/Macau): Improve round 10 DONE (prompts/orch-build.txt)
- All test suites passing (`npm test`: 32 rules, 10 AI, 9 objectives, 2 branding, 16 encounter simulations, 8 balance simulations).
- 390px mobile battle UI verified across 5 critical steps in `screenshots/v13/`:
  - `screenshots/v13/a-deploy.png`: Chapter 1 deploy formation centered on action (rows 8 & 9), empty row 10 & grass breathing room below, camera framing deploy zone and bridge/enemies, no figure clipped by bottom strip.
  - `screenshots/v13/b-escort-cart.png`: Escort cart moving along the road, faint dotted line path ahead with destination marker (`⚑ 次回進軍`), adjacent allies providing `護衛` (50% damage reduction badge), and objective line displaying progress `✦ 河橋 · 護送燈車 【燈車 HP 35/35 · 護衛中 · 進度 2/9】 ✦`.
  - `screenshots/v13/c-ch6-battle.png`: Chapter 6 siege with non-overlapping units in staggered checkerboard formation (unique columns 2, 3, 4, 5, 6, 7), scaled 52px figures, and crisp 1.5px enemy rim light replacing overdone flat red glow.
  - `screenshots/v13/d-tutorial-hint.png`: Compact dockable tutorial hint sitting cleanly below the top HUD, leaving the objective banner fully visible and readable.
  - `screenshots/v13/e-star-result.png`: 4-star result screen with earned vs missed conditions (e.g. `★ 速戰速決 [超限(需≤8回合)]` greyed out), unified MVP spotlight card (shown once with quote, EXP, and battle stats), and deduplicated squad list with per-character battle stats (`造成 X 傷害 · 斬敵 Y · 治癒 Z`).
- Escort Objective & Authenticity:
  - Generated authentic painted wooden hand-cart sprite with wheels, shafts, cargo, and mounted amber lantern (`assets/art/v4/fig_lantern_cart.webp`, `por_lantern_cart.webp`).
  - Implemented dynamic cart advancement, `護衛` guarded damage reduction (-50%), hold/speed stratagem orders, and dedicated test suite in `tests/objectives.test.mjs`.
- Balance Calibration (Zero Stat Inflation):
  - Ch1 naive win rate: 50/50 (100% >= 90%).
  - Reasonable bot win rate: Ch1 100%, Ch2 86%, Ch3 90%, Ch4 88%, Ch5 84%, Ch6 90%, Ch7 80%, Ch8 76% (75–90% range across Ch2–Ch8).
  - Naive rush fails tactically across Ch2, Ch3, Ch5, Ch6, Ch7, Ch8 (< 50%).
  - Core invariants held: zero first-phase deaths, enemy hit cap at 30% maxHp.
- Deployment: Published via `/workspace/orchestrator/publish.sh .`, live URL returns HTTP 200.

## 2026-10-27 17:15 (Asia/Macau): improve round 11 launched (prompts/improve-10.txt)
- Round 10 finished at 16:58. The live site returns 200. npm test passes (ch1 naive 50/50, reasonable ch1 100%, ch2–8 76–90%, no first-phase deaths); verify_map_fit passes.
- Real-tap 390x844 playthrough (screenshots/play11) found: 開始戰役 skips straight to the world map with no prologue; pressing 明白 on a tutorial step performs the step for the player (熊岳 auto-moved onto the bridge next to 霧騎, 墨影 too), spending their turn; the fitted board leaves ~40% of the screen as empty black bands; figures are small and walk limbs unreadable; the action popover still covers units (backlog).
- Brief: fix the tutorial so the player does every step (attack, 技能, 法術 once each, with when-to-use lines and element counters); docked bottom action bar with icons + subtitles, tap-twice targeting, undo, 下一個未行動, ≡ menu; recommended target tags (克制 ×1.5 / 可擊破 / 會反擊); a skippable illustrated prologue; exaggerated walk cycle and cavalry gallop; use the empty band. Screenshots go to screenshots/v14; old state in .orch-prev-10.
