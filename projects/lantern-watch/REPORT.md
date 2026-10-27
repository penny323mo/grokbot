# 燈影軍略 — orchestrator report

- Generated: 2026-10-27 15:19 (Macau, UTC+8)
- Live: https://penny323mo.github.io/grokbot/projects/lantern-watch/ (HTTP 200)
- Rounds: 1  ·  Started: 2026-10-27T14:09:32+08:00

## Phases
- build finished 2026-10-27T15:06:19+08:00
- review-1 finished 2026-10-27T15:09:20+08:00
- fix-1 finished 2026-10-27T15:18:56+08:00
- publish finished 2026-10-27T15:19:05+08:00

## Reviews
- orch-r1-grok.md: VERDICT: SHIP

## Tests
### tests-build
```
ch2 reasonable win: 43/50 (86%)
ch3 reasonable win: 45/50 (90%)
ch4 reasonable win: 44/50 (88%)
ch5 reasonable win: 42/50 (84%)
ch6 reasonable win: 44/50 (88%)
ch7 reasonable win: 40/50 (80%)
ch8 reasonable win: 38/50 (76%)
balance ok: ch1 naive win 50/50, ch3/5/7 naive failed, all mid chapters reasonable in 75-90% range
```
### tests-fix-1
```
ch2 reasonable win: 43/50 (86%)
ch3 reasonable win: 45/50 (90%)
ch4 reasonable win: 44/50 (88%)
ch5 reasonable win: 42/50 (84%)
ch6 reasonable win: 44/50 (88%)
ch7 reasonable win: 40/50 (80%)
ch8 reasonable win: 38/50 (76%)
balance ok: ch1 naive win 50/50, ch3/5/7 naive failed, all mid chapters reasonable in 75-90% range
```

## Screenshots
- screenshots/orch/live-390-full.png
- screenshots/orch/live-390.png
- screenshots/orch/live-battle.png
- screenshots/orch/live-card-selected.png
- screenshots/orch/live-title.png

## Changelog (tail)
  - Refined `.unit-name-tag` positioning to `top: -11px; z-index: 10` with high-contrast text shadows.

- **MINOR #4: SPEC Alignment**:
  - Updated `SPEC.md` §8 計策 list to include `擂鼓` (mid-battle war drums: ally morale +25, allies within radius 2 gain +1 MOV this turn).
  - Updated §9 balance table to reflect live simulation results: Chapter 5 reasonable win rate at 42/50 (84%) and Chapter 7 at 40/50 (80%).

- **MINOR #5: Chapter 8 Mountain Pass 390px Viewport Framing**:
  - Updated framing targets in `scripts/verify_battle_ui.steps.json` for Chapter 8 to include warlord (4, 1), western archer (2, 2), eastern archer (7, 2), and the 滾木 log ramp chute.
  - Recaptured `screenshots/v11/e-ch8-mountain-pass.png` ensuring the eastern archer has clear margin and is not clipped by the 390px right border.


## Round 1 fixes

### MINOR Fixes
- **MINOR #1 (Compact Tutorial Hint Copy - Action First)**:
  - Updated `showBoardTutorial` in `js/render/ui.js` with concise `actionHint` values for all 7 beats (Beat 1: `點選【熊岳】 · 藍格移動`, Beat 2: `點選【攻擊】 · 紅格鎖定敵軍`, etc.), preventing trailing text truncation by ellipsis. Long title and descriptive lore are cleanly preserved in the 詳情 expanded drawer.
- **MINOR #2 (Four-Star Rating & Objective Calibration)**:
  - Tuned `underTurnLimit` to require fast victory within 60% of turn limit (`currentTurn <= Math.ceil(maxTurns * 0.6)`) for 速戰速決, and `sideObjDone` to require breaking enemy morale (`enemyMorale <= 35`) for 勢如破竹, avoiding trivial 4-star completion on standard wins.
- **MINOR #3 (Combat Bark Header Wrapping)**:
  - Added `white-space: nowrap` to `.bark-header` in `css/style.css` and tightened default bark header to `【${unit.name} · 開戰】`, preventing header line break artifacts on mobile 390px screens.
- **MINOR #4 (Chapter 6 Weather Rain Overlay & Viewport Framing)**:
  - Boosted rain streak canvas stroke alpha from 0.55 to 0.85 and increased streak count in `renderWeatherOverlay` (`js/render/ui.js`) for sharp readability against dark wet stone.
  - Reset `this.deployPlacements = []` when launching different chapters so units use the proper chapter deploy slots, and framed living allies plus incoming reinforcement markers so 燈娘 小螢 and edge markers remain completely visible inside 390px boundaries.
- **MINOR #5 (SPEC Alignment for Weather & Telegraphed Reinforcements)**:
  - Added §8b (Weather System & Telegraphed Reinforcements) to `SPEC.md` documenting weather conditions (`rain`, `fog`, `wind`, `night`) and 1-turn early glowing hazard warning indicators.

## 2026-10-27 15:40 (Asia/Macau): improve round 10 launched (prompts/improve-9.txt)
- Round 9 finished at 15:19. The live site returns 200. npm test passes: ch1 naive 50/50, reasonable ch1 100% and ch2–8 76–90%, no first-phase deaths.
- The 390px review of screenshots/v12 found these issues. Ch1 figures still hug the bottom edge with about 70% of the view showing empty river. Ch6 figures overlap each other. The tutorial hint covers the objective banner. The enemy crimson glow flattens sprites into red silhouettes. 引路燈車 is drawn as a floating lantern, not a cart. The result screen shows the MVP twice.
- Brief: reframe the camera and the ch1 deploy area; one figure per tile; replace the red glow with a rim light and cloth trim; add a cart sprite and a real escort mechanic (moving cart, 護衛, progress shown in the objective line); give stars their conditions and add per-character stat lines on the result screen. Keep all balance invariants. Screenshots go to screenshots/v13, and the old state is in .orch-prev-9.
