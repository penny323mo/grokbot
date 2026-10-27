
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
