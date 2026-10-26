VERDICT: NOT READY

It does **not** yet feel like a real two-sided penalty game on a 390×844 phone. The title screen, 易/中/難/地獄 chips, Cantonese HUD, standing keeper, full ball, terrace stands and LED ads now look like a match (`r2-01`, `r2-02`). Player-shoot is playable. Then you swap to 把關 and the product falls over: the CPU taker fills the entire frame (`r2-09`), and the first AI strike throws `PAGEERROR: Cannot read properties of undefined (reading 'x')`. Coordinator end screen is 「惜敗打和！」 0–0 with **累計 0 次** (`r2-07`). Tells, taunts, heat overlay, timing window, and dive-habit learning are wired in source and pass node tests, but the live keeper-mode path never finishes a kick. Until that crash is gone and the keeper camera shows the goal, this is still a shooter demo with a broken second half.

Tests independently re-ran: difficulty 3/3, input 3/3, keeperAI 6/6, model 14/14, shot 6/6, takerAI 4/4, taunts 22/22 (33 lines, ≥20). All 58 pass. Did not launch a browser; used coordinator 390×844 captures in `screenshots/v2/r2-*.png`.

Round 1 CRITICAL/MAJOR from `reviews/grok-v2-r1.md` still hold: `setReady()` calls `reset()` (`keeper.js:165-168`); camera `(0, 1.85, 15.6)` FOV 56° with the ball fully in frame (`scene.js:32,63-65`; `r2-02`); PointerEvents + `setPointerCapture` + TouchEvent fallback (`input.js:34-51,151`); swipe start band `y < rect.height * 0.25` (`input.js:85`); sway/shake/punch composed in `stadium.update` (`scene.js:644-649`); favicon + canvas-rect `setSize(..., false)` (`index.html:10-12`, `scene.js:99-108`); two-capsule `checkSave` (`keeperAI.js:169-180`).

---

## CRITICAL

1. **`src/main.js:802-803` / `src/takerAI.js:196-198` — coordinator PAGEERROR `"Cannot read properties of undefined (reading 'x')"`.** `_onCpuTakerStrike` does `const targetX = takerDecision.target.x`. `TakerAIModel.decideShot` returns `{ targetZone, targetPoint: { x, y }, speed, curve, ... }` — there is no `target`. First CPU/keeper-mode strike throws, so the automated match never records a CPU kick (`r2-07` 0–0 / 0 shots; `r2-09` hangs on 「你把關撲救」 with the taker planted on the ball). **Fix:** read `takerDecision.targetPoint.x/y` (or alias `target: targetPoint` in the `decideShot` return). This is the PAGEERROR.

2. **`src/main.js:807-817` / `src/shot.js:164-170` — even after (1), `simulate(launch)` immediately throws the same class of error.** The handmade launch is `{ vx, vy, speed, spin, power, targetX, targetY }`. `simulate` does `launch.position.x` then `launch.velocity.x`. Player shots work because `swipeToLaunch` (`shot.js:127-135`) returns `{ position, velocity: {x,y,z}, spin, power, speed, target, curve }`. **Fix:** build the CPU launch in that shape: `position` at the penalty spot `(0, ball.radius, 11)`, `velocity` aimed at `targetPoint` with magnitude `takerDecision.speed`, `spin.y = curve`. Reuse `swipeToLaunch` math or a small `pointToLaunch(targetPoint, speed, curve)` helper. Add a node test that `simulate(decideShot(...)-derived launch)` returns a trajectory.

3. **`src/main.js:907` / `src/takerAI.js:54` — `this.takerAI.recordDive` does not exist.** The live method is `recordPlayerDive`. After a strike that actually crossed, this is a second TypeError. TakerAI never learns the player's dive habits in a real match (unit tests call the right name; the game does not). **Fix:** `this.takerAI.recordPlayerDive(actualDiveZone)`.

---

## MAJOR

4. **`src/main.js:723-725` / `src/shot.js:127-135` — keeper-mode swipe always maps to BM.** `_onPlayerKeeperSwipe` reads `launch.vx`, `launch.targetY`, `launch.vy`. `swipeToLaunch` does not set those; it sets `launch.velocity.x` and `launch.target.{x,y}`. `undefined < -0.6` is false, so every dive is centre. Timing-window flags still set, but the dive itself is wrong. **Fix:** `const vx = launch.velocity?.x ?? 0; const targetY = launch.target?.y ?? 0;` (or map `target.x` through the same 6-zone bins as `getZoneFromPoint`).

5. **`src/keeperAI.js:44-47,75-77` / `src/difficulty.js:12-16` — difficulty chips persist but do not change keeper reaction or reach.** `decide(modelProbs, difficultyConfig)` reads `difficulty.reactionDelay` and `difficulty.reachMultiplier`. Config fields are `keeperReactTime` (0.22→0.11) and `keeperReach` (0.38→0.50, an absolute radius, not a multiplier). `customReact = undefined`; `undefined !== null` is true, so `reactTime` is `undefined`; `stateTime < undefined` is false (`keeper.js:269`) and every AI dive starts on frame 0. `reachMultiplier` falls through to `1.0`. Title chips and `localStorage` (`difficulty.js:61-100`) work; 易 vs 地獄 is a no-op for the keeper. `tests/difficulty.test.js` never calls `keeperAI.decide` with the config object, so 3/3 is green. **Fix:** `customReact = difficulty.keeperReactTime ?? difficulty.reactionDelay ?? null`; convert `keeperReach / tuning.keeper.gloveReachRadius` into `reachMultiplier` (or pass absolute radii into `checkSave`). Add one test: `decide(probs, getDifficultyConfig('HELL')).reactTime === 0.11`.

6. **`src/scene.js:32,343-345` / `src/taker.js:32-33` / `src/main.js:647-663` — keeper-turn camera stays MAIN; the taker occludes the goal.** MAIN camera is `(0, 1.85, 15.6)` looking at the goal. Taker `startPos` is `(-0.65, 0, 13.8)` — 1.8 m in front of the lens. `startKeeperTurn` never calls `setCameraMode`. `r2-09` is the result: a giant red #10 standing on the ball, keeper a speck, swipe-to-dive has no readable goal. Camera modes are only `'MAIN' | 'REPLAY'`. **Fix:** add a `'KEEPER'` (or sideline) rig behind the goal / slightly above the bar looking back at the taker; `startKeeperTurn` → `setCameraMode('KEEPER')`, `startPlayerTurn` → `'MAIN'`. Pull `startPos.z` back toward ~16.5 if you keep a behind-taker view. Re-shoot `r2-04` at 390×844 with the full goal and a human-sized taker in frame.

7. **`src/scene.js:468-518` — crowd is still 260 coloured `PlaneGeometry(0.55, 0.85)` billboards.** Spec asked to replace the floating coloured crowd blocks with proper stands: *tiered terraces with crowd on them*. Terraces, roof, trusses, and LED ads 「12碼讀心戰」 are in (`scene.js:347-466`; visible in `r2-02`). The people are candy-coloured rectangles stacked on the steps — the same look grok-v2-r1 rejected, now sitting on concrete. **Fix:** seated low-poly bodies (torso+head boxes per instance, or a textured spectator sprite atlas) on each riser, kit colours desaturated so they read as a crowd instead of Tetris.

8. **`src/main.js:911-916` / `src/fx.js:239-244` — keeper-turn mind-reading reveal is nested, so every zone paints 16%.** `getDiveProbabilities()` already returns `{ probabilities, predictedDive, confidence }`. The call wraps it as `{ probabilities: diveProbs }`, so `probs[zoneId]` is undefined and the overlay falls back to 0.16. Player-turn path (`main.js:604`) passes `modelProbs` correctly. Coordinator `r2-03-mind-reading-3d-reveal.png` is still idle 「你主射」 with **no** heat planes — the overlay exists in `fx.js:94-194` but the keeper-mode match never reached a clean crossing, and the player-turn capture was taken before/without a resolved kick. **Fix:** `this.fx.showMindReadingReveal(diveProbs, sim.crossing, { x: keeper.x, y: gloveY })`. Do not wrap. `getKeeperReachPosition()` (`keeper.js:192-198`) returns body `{x, y: root.y+0.95, z: 0.05}`; the marker uses only x/y at z=0.035, so pass a 2D goal-mouth point (glove at crossing), not the 3D root.

9. **`src/main.js:369-396` — 「重播」 is a camera cut + `timeScale = 0.25` of the leftover scene, not a replay of the deciding kick.** Overlay and skip exist (`r2-06` shows 「重播 (REPLAY)」 + 「跳過 →」). `triggerDecidingReplay` is called 1200 ms *after* crossing, does not rewind `activeShot.trajectory`, does not reset keeper/ball, does not re-run the dive. `r2-06` is a side view of an idle set-stance keeper, 0–0, still 「你主射」. **Fix:** stash `{ trajectory, divePlan, crossing }` of the deciding kick, reset poses, replay from t=0 at 0.25× on the REPLAY camera, skip jumps to `endReplay`.

---

## MINOR

10. **`CHANGELOG.md:82-84` still contains the v1 archive** (“Round 1 fixes (v1)”) under the v2 file. Same leftover grok-v2-r1 MINOR 12 called out. Harmless; tidy it.

11. **`src/taker.js:32` `startPos.z = 13.8` is almost on the MAIN near plane even after a keeper-camera fix.** If MAIN is ever used during run-up, the taker is a close-up. Keep run-up start ≥ ~3 m behind the spot *and* ≥ ~4 m in front of the active camera.

12. **Replay skip / difficulty persist / taunt pool / tells are in good shape on paper.** 33 HK Cantonese lines (`src/taunts.js`), `computeTell` honesty + `gazeHint` mapped to `keeper.setTell({ gazeZone })` (`main.js:437-444`), `loadDifficulty` / title chips (`index.html:77-81`). They never show in coordinator frames because of CRITICAL 1. After the crash is fixed, re-shoot taunt bubble + 6-zone heat on a real kick.

13. **`tests/difficulty.test.js` does not lock the `keeperAI.decide` field names.** That is why MAJOR 5 shipped green. One integration assert would have caught it.

---

## Round 1 leftover status

| r1 item | Status |
| :--- | :--- |
| Keeper ragdoll after dive | **Hold** — `setReady()` → `reset()`; both turns call `reset()` then `setReady()` (`main.js:429-431,656-658`) |
| 390px ball clipped / black sky | **Hold** — ball fully visible, terraces + ads in upper third (`r2-02`) |
| No TouchEvent / no pointer capture | **Hold** — capture + touch fallback + tests 3/3 |
| Shake/punch clobbered | **Hold** — composed in `stadium.update` |
| Swipe start `y < 0.40` | **Hold** — bottom 75% (`input.js:85`) |
| Favicon / renderer-to-window / 2D circle save / ball freeze on line | **Hold** |
| CHANGELOG v1 leftover | **Still present** (MINOR 10) |
| Coloured crowd blocks | **Partial** — now on terraces, still cubes (MAJOR 7) |

---

## Checklist (UPGRADE_PLAN §5 Round 2 / v2-r2-agy.txt)

| Item | Status |
| :--- | :--- |
| Alternate shooter/keeper turns (replace 75% cut-scene) | Turns exist; **CPU strike crashes** (CRITICAL 1–2) |
| Animated taker run-up + swipe dive + early-dive window | Run-up + window coded; swipe maps to BM (MAJOR 4); strike never completes |
| `takerAI` learns dive habits, aims away | Module + tests pass; live call is `recordDive` (CRITICAL 3) |
| Tells/fakes + eye-line + ≥20 Cantonese taunts | **Pass** in source (33 lines, 22/22 tests); unseen in play |
| In-scene 6-zone heat + shot/dive markers | Built; keeper-turn nesting makes 16% (MAJOR 8); `r2-03` shows none |
| Slow-mo deciding-kick replay + 「重播」 + skip | Overlay/skip yes; does not replay the kick (MAJOR 9) |
| Difficulty 易/中/難/地獄 persisted | UI + localStorage yes; keeper react/reach ignored (MAJOR 5) |
| Proper stands + clearer ball | Stands/ads/ball **yes**; crowd still cubes (MAJOR 7) |
| iPhone pointer + touch fallback | **Pass** (r1 hold) |
| Existing tests stay green; takerAI + difficulty tests added | **58/58 pass** |
| Feels like a real game @ 390px | **Fail** — PAGEERROR on first CPU kick; keeper camera unusable |

---

## Concrete patch order

1. `takerDecision.targetPoint` + `simulate`-compatible launch in `_onCpuTakerStrike`. Add a node test that a CPU strike simulates without throwing.
2. `recordPlayerDive` in the live match path.
3. Map keeper swipe from `launch.velocity` / `launch.target`.
4. Align `keeperAI.decide` with `keeperReactTime` / `keeperReach`; add the one missing difficulty→decide test.
5. Keeper-view camera so `r2-04` shows the goal, not a taker close-up.
6. Pass `diveProbs` unwrapped into `showMindReadingReveal`; rewind the deciding kick for replay.
7. Replace cube billboards with seated spectators.

Do not ship until (1)–(3) are gone and a headless 390×844 match completes 5+5 kicks without PAGEERROR, with a keeper-turn frame that shows the goal.
