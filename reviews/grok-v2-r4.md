# grok-v2-r4 — keeper-mode tap/swipe controls

Working tree is clean. Review target is HEAD `b372753` (`r4: keeper tap/swipe zone controls, tolerance, windows, zones, no-zoom`) plus parent `1a850bc` (`wip r4: keeper controls`), which is where `src/{fx,input,keeperAI,main,shot,tuning}.js` actually changed.

Goal: diving in keeper mode should be easy and forgiving on iPhone — tap / short-swipe picks a zone, bigger reach and tolerance, a reaction window scaled by difficulty, a hint and target zones during the run-up, immediate feedback, no scroll/zoom, constants in `src/tuning.js`.

The overlay, hint, tap→zone helpers, difficulty-scaled *numbers*, and no-zoom CSS are in the tree. The timing that those numbers feed is inverted or unused, so the labelled-zone tap the round advertises is the punished line. Official capture `screenshots/r4-390/02_keeper_zone_selected_TR.png` is the e2e of that tap.

Did not launch a browser. Re-ran all 11 unit suites: **81/81 pass**. Used `screenshots/r4-390/*.png`, `tests/verify_r4_keeper.js`, and the current source.

Round 3 blockers (tutorial HUD stealing the swipe; World Cup title CTA dead) are fixed in this tree. Shooter mode still resets to `STRIKER` and hides the zone planes.

---

## CRITICAL

1. **`src/tuning.js:69-76` / `src/main.js:1437-1442` — Easy is the harshest early-dive window, and the happy-path tap is the punish line.** `_onPlayerKeeperDive` flags early when `runUpStarted && (strikeTime - now) > earlyThreshold`. `TUNING.keeperWindows.earlyDiveThresholdMs` is EASY 80 / MEDIUM 140 / HARD 200 / HELL 250. With an 850ms run-up (`TUNING.taker.runUpDurationMs`) that means Easy only treats the last **80ms** before the kick as legal; Hell allows the last **250ms**. Agy’s own write-up (`reviews/v2-r4-agy.done`) says Easy/Medium “are no longer unfairly punished for committing during the striker’s run-up.” The table plus `>` comparison does the reverse.

   `tests/keeper_r4.test.js:163-170` asserts `EASY < MEDIUM < HARD ≤ HELL` and comments that “smaller on Easy means the player can dive much earlier without being punished.” That comment matches the table and contradicts `main.js`. The test never calls `_onPlayerKeeperDive`, so 81/81 stays green.

   Compounding: an early flag sets `reachMultiplier = 1.0`, wiping Easy’s 1.45 player reach, then `takerAI.decideShot(..., earlyZone)` aims at the open side, and the HUD fires `TAKER_PUNISHES_EARLY_DIVE` plus 「太早撲！射手睇到你！」. `tests/verify_r4_keeper.js` taps TR at (301, 390) as the success case. Capture `02_keeper_zone_selected_TR.png` shows that tap: gold 「✓ 右上」, banner 「已選定撲向：右上！準備接波！」, taunt 「咁早撲定？多謝你讓半邊門畀我！」, red 「太早撲！射手睇到你！」, while the taker is still standing on the ball.

   Taps in the 700ms *before* the whistle skip the early check (`runUpStarted === false`). The unpunished Easy commit is therefore “tap during the pre-whistle wait.” The hint and 3D labels tell you to tap a zone during the run-up.

   **Fix:** Zone select (gold highlight + banner) must stay a commit, and `keeper.startDive` must wait until `strikeTime` (or the late window). If a telegraph penalty is kept, invert the table so Easy is largest (e.g. 800 / 500 / 300 / 150) so `msBeforeStrike > threshold` is actually more lenient on Easy. Rewrite `keeper_r4` test 6 to drive `_onPlayerKeeperDive` at known timestamps per difficulty and assert `earlyDive === false` for a mid-run-up tap on Easy.

2. **`src/main.js:1490-1517` / `1406-1407` / `1443-1447` — the difficulty-scaled late window never runs.** `_onCpuTakerStrike` sets `matchState = 'KEEPER_BALL_FLIGHT'` and, if `!playerDived`, immediately `startDive`s BM at `reachMultiplier * 0.85`. `_onPlayerKeeperDive` returns unless `matchState === 'KEEPER_TURN'`. Easy’s advertised 450ms post-strike window (`lateDiveThresholdMs.EASY`) is dead code. A player who taps as the striker kicks — the natural iPhone reaction — is ignored and locked to BM.

   `taker.startRunUp` fires `onStrikeCallback` at the same 850ms as `strikeTime`, so there is no `KEEPER_TURN` slice after the kick either.

   **Fix:** Stay in `KEEPER_TURN` (and keep `input.enabled`) until `strikeTime + lateThreshold`. Apply the late-reach penalty only after that. Default BM only when the late window expires with no gesture. Cover with a test that dispatches a keeper tap 100ms after strike on Easy and asserts the chosen zone, not BM.

---

## MAJOR

3. **`src/keeperAI.js:186-192` — `zoneMatchingToleranceBonus` (0.15m) is added whenever `divePlan.zone === simResult.zone`, with no `isPlayer` gate.** CPU `decide()` always returns `zone`. Shooter-mode saves therefore gain +15cm of glove *and* body capsule when the AI guesses the zone. `keeper_r4` test 5 only checks a player plan with `isPlayer: true`.

   **Fix:** `const zoneBonus = (divePlan.isPlayer && divePlan.zone === shotZone) ? (tuning.keeper.zoneMatchingToleranceBonus || 0) : 0`. Add a CPU plan in the same zone that must still miss the borderline ball from test 5.

4. **`src/shot.js:205-225` — `mapTapToZone` is full-viewport `nx/ny`, not a raycast onto the six 3D planes in `fx.showKeeperTargetZones`.** Splits (`0.363` / `0.637` / `0.493`) are tuned so (301, 390) → TR at 390×844 under the current KEEPER camera, and capture 02 confirms that pixel. The labelled meshes sit at world `x=±2.44, y=1.83|0.61` (`fx.js:99-106`). A HUD change, a camera nudge, or a notched iPhone safe-area will desync finger and gold highlight. Off-goal taps mapping to the nearest *screen* quadrant (test 2) is the same 2D rule, which is fine as a fallback once the in-goal path is a projection.

   **Fix:** Unproject the tap onto the goal plane `z=0` and bin with the same world rectangles as the meshes. Keep the current splits as a fallback when the unproject misses.

5. **`src/main.js:281-292` — document-level `touchend` `preventDefault` for any second touch within 300ms, plus `dblclick` `preventDefault`.** `user-scalable=no` and `touch-action: none` already exist on `html, body, #game-container, #scene, #screen-match` (`index.html:5`, `style.css:35,54,82,383`). The extra `touchend` preventDefault swallows the iOS synthetic `click` on the second tap, so title 「單場快速對決」, skip-replay, and nav home can miss a fast double tap. Keeper input is on the canvas via PointerEvents and does not need this.

   **Fix:** Drop the document `touchend` handler. Keep `touch-action: none` + viewport + canvas `preventDefault`. If a zoom guard is still wanted, limit it to `#scene`.

---

## MINOR

6. **`tests/input.test.js` is still three STRIKER cases.** No KEEPER-mode tap, no 18px swipe threshold, no “start in the top 25% is legal for keeper.” Mapping lives in `keeper_r4`; the canvas path that calls it is untested.

7. **`startKeeperTurn` (`main.js:1388`) does not retain/clear the 700ms whistle timeout.** Re-entry (e2e calls `startKeeperTurn` three times; a Home tap during the wait is saved only by the `matchState !== 'KEEPER_TURN'` guard) can start a second run-up / `_onCpuTakerStrike` on the new `keeperTurnState`. Store the id and `clearTimeout` at the top of `startKeeperTurn` / `goHome`.

8. **Giant taker in the KEEPER camera (r2 leftover).** Capture 01 still has the CPU striker filling the lower half. The six cyan planes remain readable above him. Same camera as r3; out of this round’s tap-mapping scope.

9. **`TUNING.taker.earlyDiveThresholdMs: 250` / `lateDiveThresholdMs: 220` (`tuning.js:123-124`) are unused.** Live values come from `keeperWindows`. Delete or alias so the next tuner does not edit the dead pair.

10. **Early-punish UX clutter.** Even after the window is retuned, firing a taunt *and* a red banner *and* starting the dive while the taker has not kicked is noisy. Gold zone + 「已選定撲向」 is the feedback the round asked for.

11. **CHANGELOG still carries the v1 archive** (r1 MINOR / r2 MINOR / r3 MINOR 6). Untouched this round.

---

## What landed and works

- Cantonese hint 「撲救：㩒龍門你想守嘅位置（或向方向輕掃）」 (`main.js:1337`, capture 01).
- Six in-scene zone planes with 左上/中上/右上/左下/中下/右下; gold highlight + 「✓ 右上」 on select (`fx.js:306-353`, captures 01–02).
- `SwipeInput.setMode('KEEPER')` accepts a tap anywhere; STRIKER still rejects `y < 0.25` (`input.js:92-105`). `startPlayerTurn` sets `STRIKER` and `hideKeeperTargetZones` (`main.js:1066-1070`).
- Pure `mapTapToZone` / `mapSwipeToZone` / `resolveKeeperInput` (`shot.js:205-279`); 18px tap vs swipe; 0.414 tan(22.5°) sectors. Unit tests 1–4 match those helpers.
- `TUNING.keeper` + `TUNING.keeperWindows` hold reach, tolerance, swipe min, tap splits, and per-tier windows. Player divePlan gets `playerReachMultiplier` and `saveHitTolerance` from the tier when the dive is *not* flagged early.
- `touch-action: none` on the match HUD; `#screen-match * { pointer-events: none !important }` with buttons re-enabled — r3 tutorial-steals-swipe is gone. Tutorial children also have inline `pointer-events: none` (`index.html:307-312`).
- World Cup: `openTournamentScreen()` calls `switchScreen('tournament')` first (`main.js:615-619`); `#modal-team-select` has no inline `display: none` (`index.html:238`).
- Stars: `finishMatch` now passes both `won` / `isWin` and renders `item.label` / `item.count` (`main.js:1768-1779, 1947-1948`).
- Hide zone planes on `goHome` and `finishMatch` (HEAD follow-up).
- Pointer capture + TouchEvent fallback still present; `onTouchStart` bails if `isDragging` (iOS 13+ pointer-first is safe).

---

## Tests

Independently re-ran:

| Suite | Result |
| :--- | :--- |
| difficulty | 4/4 |
| input | 3/3 |
| keeperAI | 6/6 |
| keeper_r4 | 6/6 |
| match_integration | 5/5 |
| model | 14/14 |
| shot | 7/7 |
| takerAI | 4/4 |
| taunts | 22/22 |
| tournament | 5/5 |
| unlocks | 5/5 |
| **Total** | **81/81** |

`keeper_r4` test 6 locks the inverted early-threshold monotonicity. Tests do not exercise `_onPlayerKeeperDive` timing, `KEEPER_BALL_FLIGHT` rejecting a post-strike tap, or CPU `zoneMatchingToleranceBonus`. `verify_r4_keeper.js` asserts TR/TL/BL mapping and a CPU kick with 0 page errors; it does not assert `earlyDive === false` and its own TR snapshot is the 太早撲 frame.

---

## Round 1–3 leftover status

| Item | Status |
| :--- | :--- |
| r3 tutorial HUD eats swipe | **Hold** — `#screen-match * { pointer-events: none !important }` |
| r3 World Cup title CTA | **Hold** — `switchScreen('tournament')` then modal; no inline `display:none` |
| r3 stars key mismatch | **Hold** — both key names passed; render uses `label`/`count` |
| r2 PAGEERROR `takerDecision.target.x` | **Hold** — `targetPoint` + `pointToLaunch` |
| r2 keeper swipe always BM | **Hold in mapping** — tap/swipe pick a zone; **live late miss still BM** (CRITICAL 2) |
| r2 keeper camera / giant taker | **Hold** — capture 01; zones readable |
| TouchEvent + pointer capture | **Hold** |
| CHANGELOG v1 leftover | **Still present** |

---

## Checklist (r4 prompt)

| Item | Status |
| :--- | :--- |
| Tap / short-swipe picks a zone | Helpers yes; live tap is punished as early (CRITICAL 1) |
| Bigger reach and tolerance | Numbers in `keeperWindows`; wiped to 1.0 on the Easy run-up tap; CPU gets zone bonus (MAJOR 3) |
| Reaction window scaled by difficulty | Tables exist; early inverted; late unused (CRITICAL 1–2) |
| Hint + target zones during run-up | **Yes** (capture 01) |
| Immediate feedback | Gold zone + banner **yes**; also dumps 太早撲 on the same tap |
| No scroll / zoom | CSS + viewport **yes**; document `touchend` preventDefault is extra (MAJOR 5) |
| Constants in `src/tuning.js` | **Yes** (`keeper` + `keeperWindows`) |
| iOS Safari touch | Pointer + touch fallback hold; document-level second-tap `preventDefault` is a click risk |
| Shooter / World Cup regressions | r3 HUD + CTA hold; zone bonus leaks into shooter saves |
| Tests | 81/81; they encode the wrong early-window story |

---

## Concrete patch order

1. Stop `startDive` on zone select. Remember `diveZone` / gold highlight from tap or swipe; start the dive at `strikeTime` (or when the late window accepts a gesture). Then a run-up tap is the intended Easy play and capture 02 loses the red banner.
2. Keep `KEEPER_TURN` + `input.enabled` until `strikeTime + lateThreshold`. Default BM only after that. Delete the instant BM at `_onCpuTakerStrike`.
3. Retune `earlyDiveThresholdMs` so Easy is largest **if** a telegraph penalty remains, and point `keeper_r4` at `_onPlayerKeeperDive` with fake clocks.
4. Gate `zoneMatchingToleranceBonus` on `isPlayer`; add a CPU negative case.
5. Remove the document `touchend` 300ms `preventDefault`.
6. Re-shoot 390×844: tap TR during run-up on Easy with **no** 太早撲; tap 200ms after the kick and still get TR; one shooter-mode save that does not grow 15cm from the bonus.

VERDICT: NOT READY
