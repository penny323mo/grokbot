# 燈影軍略 — orchestrator report

- Generated: 2026-10-27 13:53 (Macau, UTC+8)
- Live: https://penny323mo.github.io/grokbot/projects/lantern-watch/ (HTTP 200)
- Rounds: 1  ·  Started: 2026-10-27T12:40:05+08:00

## Phases
- build finished 2026-10-27T13:24:20+08:00
- review-1 finished 2026-10-27T13:31:04+08:00
- fix-1 finished 2026-10-27T13:53:13+08:00
- publish finished 2026-10-27T13:53:22+08:00

## Reviews
- orch-r1-grok.md: VERDICT: NOT READY

## Tests
### tests-build
```
ch2 reasonable win: 43/50 (86%)
ch3 reasonable win: 45/50 (90%)
ch4 reasonable win: 44/50 (88%)
ch5 reasonable win: 42/50 (84%)
ch6 reasonable win: 45/50 (90%)
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
ch6 reasonable win: 45/50 (90%)
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
  - Fixed `measureBottomInset()` in `js/render/ui.js` to strictly require elements to cover or touch the bottom edge of the viewport (`r.bottom >= vr.bottom - 30`), completely preventing `.tutorial-board-card` from being miscalculated as a bottom overlay when docked at the top with `.card-at-top`.
  - Added stage height reset to 940px in `hideDeployPhase()` to clear deploy tray padding extensions.
  - In `startTutorialFlow()` step 0, applied `.card-at-top` before framing and called `frameTiles(liveAllies, false, false)` so row 12 sits directly above the bottom info bar.
  - Verified `b-tutorial-spotlight.png` now has full painted river bank terrain filling the band under 茶翁 and 燈車 with 0px empty void.

- **MAJOR #2: 擂鼓 Mid-Battle Stratagem Activation & Dynamic Morale Boost**:
  - Removed 擂鼓 (`rally`) from turn 1 auto-cast list in `applyStratagemAtStart()`.
  - Added dedicated in-battle `#btnStratagemTop` in `index.html` and wired it in `js/app.js` to trigger `battle.triggerRally()` once per battle during ally phase.
  - Generates floating callout `【我軍士氣 ↑ +25】`, toast notice `【擂鼓振威】戰鼓如雷！我軍士氣提升25點，周圍友軍步法+1！`, and actually moves the ally morale gauge.
  - Updated rules test #30 in `tests/rules.test.mjs` asserting mid-battle rally activation (60 -> 85 morale, +1 MOV within radius 2, and once-per-battle enforcement).
  - Captured fresh `d-morale-rout.png` showing ally morale dynamically rising to 85.

### MINOR Fixes
- **MINOR #3: Chapter 1 Deployment Column Gaps & Name Tag Clearance**:
  - Configured Chapter 1 `deployTiles` as `[{ x: 1, y: 11 }, { x: 0, y: 11 }, { x: 3, y: 12 }, { x: 4, y: 12 }, { x: 1, y: 12 }, { x: 0, y: 12 }]`.
  - Units spawn across discrete columns (Col 0: 墨影, Col 1: 熊岳, Col 2: 引路燈車, Col 3: 燈娘 小螢, Col 4: 茶翁), completely eliminating north-south figure/name tag collisions between 熊岳 and 茶翁.
  - Refined `.unit-name-tag` positioning to `top: -11px; z-index: 10` with high-contrast text shadows.

- **MINOR #4: SPEC Alignment**:
  - Updated `SPEC.md` §8 計策 list to include `擂鼓` (mid-battle war drums: ally morale +25, allies within radius 2 gain +1 MOV this turn).
  - Updated §9 balance table to reflect live simulation results: Chapter 5 reasonable win rate at 42/50 (84%) and Chapter 7 at 40/50 (80%).

- **MINOR #5: Chapter 8 Mountain Pass 390px Viewport Framing**:
  - Updated framing targets in `scripts/verify_battle_ui.steps.json` for Chapter 8 to include warlord (4, 1), western archer (2, 2), eastern archer (7, 2), and the 滾木 log ramp chute.
  - Recaptured `screenshots/v11/e-ch8-mountain-pass.png` ensuring the eastern archer has clear margin and is not clipped by the 390px right border.

## 2026-10-27 14:10 (Asia/Macau): improve round 9 launched (prompts/improve-8.txt)
- Round 8 finished at 13:53. The live site returns 200. npm test passes: ch1 naive 50/50 and reasonable 100%; reasonable ch2–8 76–90%; no first-phase deaths.
- The 390px review of screenshots/v11 found these issues. The rally callout shows twice and the rout shows no fleeing enemy. The ch8 info bar still shows ch1 熊岳 (1,11). The deploy panel covers about 30% of the map, the units sit in one row on the bottom edge, and a tray name wraps. The tutorial card covers the top third of the screen. Enemy figures read as near-black blobs. The ch8 repaint is now clear.
- Brief: fix those UI bugs (collapsible deploy panel, compact tutorial hint, visible rout); add per-chapter weather (rain, fog, wind, night) with real mechanics and art overlays, plus reinforcements telegraphed one turn early; add portrait dialogue barks and a post-battle star rating with an MVP; add enemy colour accents and rim light; keep all balance invariants. Screenshots go to screenshots/v12, and the old state is in .orch-prev-8.
