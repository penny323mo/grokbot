VERDICT: NOT READY

It looks closer to a real game than Round 2 — seated crowd, kits, World Cup CTA, locker, share card, and the player-turn framing at 390×844 is finally a penalty pitch (`r3-02`). A fresh player still cannot play it. The tutorial prompt sits on the ball and steals the swipe, so 單場快速對決 stays 0–0 for every kick (`r3-02` through `r3-09`). Tapping 「世界盃淘汰賽 (16隊爭霸)」 never leaves the title screen (`r3wc-01`–`r3wc-09`, and even the implementer's own `screenshots/r3-390/02_screen_team_select.png` is still the title). Round 2's CPU-strike crash is gone in source, but Round 3's headline loop (play a match, enter the Cup) does not run from the UI. Not a ship.

Tests independently re-ran: difficulty 4/4, input 3/3, keeperAI 6/6, match_integration 5/5, model 14/14, shot 7/7, takerAI 4/4, taunts 22/22, tournament 5/5, unlocks 5/5. **75/75 pass.** Did not launch a browser; used coordinator 390×844 captures in `screenshots/v2/r3*.png` and `screenshots/r3-390/`.

Round 1 holds: keeper `setReady()` → `reset()`; camera `(0, 1.85, 15.6)` FOV 56° with a full ball; PointerEvents + capture + TouchEvent; swipe band `y < 0.25`; shake/punch composed; favicon; two-capsule saves.

Round 2 holds in source: `pointToLaunch` + `takerDecision.targetPoint` (`main.js:1445-1448`); `recordPlayerDive` (`main.js:1541`); keeper swipe reads `launch.target` (`main.js:1359`); `keeperAI.decide` consumes `keeperReactTime` / `keeperReach`; `'KEEPER'` camera (`scene.js:38,349-351,770`); seated crowd; reveal passed unwrapped (`main.js:1546-1553`); replay rewinds trajectory (`main.js:918-969`). None of that is visible in coordinator play because the first swipe never fires.

---

## CRITICAL

1. **`style.css:541-549,589-598` / `index.html:307-314` / `src/main.js:1074-1079` — 單場 swipe regression: tutorial HUD eats pointer hits, so no shot ever leaves the spot.** `#screen-match` is `z-index: 20` over `#scene` (`z-index: 1`) with `pointer-events: none` on the section. `pointer-events` is **not inherited**. `.tutorial-overlay` is `none`, but `.ghost-hand-track`, `.ghost-hand-anim`, and `.tutorial-prompt-box` stay `auto`. On a fresh profile (`totalShots < 2`) the overlay is `display: flex`. The prompt pill sits on the ball; the ghost hand sits mid-pitch (`r3-02`, `r3-03-kick1-flight` is still idle 0–0). A mouse swipe at y=780 hits the prompt; y=650 hits the hand. `SwipeInput` is bound only to the canvas, so `onPointerDown` never runs, `onShoot` never fires, `totalShots` stays 0, the overlay never hides — every later kick is blocked the same way (`r3-09` is still 0–0 「你主射」). Unit tests dispatch onto a mock canvas and stay green. **Fix:** `#screen-match * { pointer-events: none; }` then re-enable only real controls (`button`, skip). Also `.tutorial-overlay, .tutorial-overlay * { pointer-events: none; }`. Set `#screen-match { overflow: hidden; }` — `.screen { overflow-y: auto }` (`style.css:156`) was added for the bracket and now makes the match HUD a full-screen scroll layer. Re-shoot a 390×844 swipe that actually moves the ball.

2. **`src/main.js:591-594` / `index.html:238` / `style.css:1073-1075` — 「世界盃淘汰賽 (16隊爭霸)」 never shows a bracket.** `openTournamentScreen()` on a new save only calls `openTeamSelectModal()` and **returns** without `switchScreen('tournament')`. The modal is `<div id="modal-team-select" class="game-modal-overlay" style="display: none;">`. `classList.add('active')` cannot override an inline `display: none` (`.game-modal-overlay.active { display: flex }` loses). Result: title stays up, nothing appears. Coordinator `r3wc-*.png` are all the title; the implementer's `screenshots/r3-390/02_screen_team_select.png` is also the title after `openTeamSelectModal()`. Forced `tournament.startTournament('HKG')` then `openTournamentScreen()` does render a real bracket (`r3-390/03_screen_tournament.png`) — the module works, the title CTA does not. **Fix:** drop the inline `display: none` (let `.game-modal-overlay` hide it); `this.dom.modalTeamSelect.style.display = ''` when opening; after confirm, keep the existing `switchScreen('tournament')`. Or skip the modal and `switchScreen('tournament')` immediately with a team picker on that screen.

---

## MAJOR

3. **`src/main.js:1681-1687,1853-1857` / `src/unlocks.js:181-211` — stars meta loop is miswired.** `calculateMatchStars` keys are `won`, `isTournament`, `isChampion`, `predictability`. `finishMatch` passes `isWin`, `isTournamentMatch`, `isTournamentFinalWin`, `predictabilityScore`. A win therefore does not add the win star. End-screen rows render `item.desc` / `item.stars` while the module emits `{ label, count }`. Implementer capture `r3-390/07_screen_end_stars.png` shows `+1 ⭐` and the literal string `undefined+undefined ⭐` (the +1 is the saves≥3 branch, which does not need `won`). Tests pass because they call `calculateMatchStars` with the module's own names. **Fix:** pass `{ won: isWin, isTournament: isTourney, isChampion: isTourneyFinalWin, predictability: predScore, ... }` and render `${item.label}` / `+${item.count} ⭐`. Add one test that constructs the object `finishMatch` actually builds.

4. **`src/scene.js:598-608,817-837` — headless fps ~12 (was ~18–60) under swiftshader.** Crowd is now two `InstancedMesh` of `MeshStandardMaterial` (torso + head, 260 each) instead of one `MeshBasicMaterial` plane. Every frame `update()` does `new THREE.Object3D()` × 2, then 260×2 `getMatrixAt` + `decompose` + `setMatrixAt`. Terrace steps are 20 individual `Mesh` boxes, not instanced. Lit standard crowd on CPU GL is the drop. Seated look is good (`r3-02`) — keep the meshes, cheapen the update. **Fix:** `MeshBasicMaterial` (or unlit) for crowd; hoist the two dummy `Object3D`s; skip bob when `document.hidden` / reduced motion; instance the 10 risers. Target: crowd = 2 draw calls, no per-frame alloc.

5. **`style.css:149-160` — `.screen { overflow-y: auto }` applies to `#screen-match`.** Needed for the bracket/locker. On match it turns the transparent HUD into a scrollport stacked above the canvas (CRITICAL 1 amplifier). **Fix:** `#screen-match { overflow: hidden; }` and keep `overflow-y: auto` on `#screen-tournament, #screen-locker, #screen-title, #screen-end` only.

---

## MINOR

6. **`CHANGELOG.md:82+` still carries the v1 archive.** Same leftover as grok-v2-r1 MINOR 12 and grok-v2-r2 MINOR 10.

7. **`ASSETS.md:11` cites `vendor/three.module.js`.** The file is `vendor/three.module.min.js`. No CC0 glTF (procedural only) — that's allowed.

8. **Tournament/unlock `console.warn` on corrupt JSON** (`tournament.js:742`, `unlocks.js:335`). Tests intentionally feed garbage and the fallback is correct; the warn is noisy. Swallow or debug-gate it.

9. **Replay / tells / taunts / difficulty / KEEPER camera / `pointToLaunch` are in good shape in source** and covered by the 75 tests. Coordinator never reached a keeper turn, a heat overlay, a taunt, or a real replay. After CRITICAL 1–2, re-shoot: a flying ball, a keeper-turn goal mouth, a 6-zone heat, 「重播」, and the title→team-select→bracket path.

---

## Round 1–2 leftover status

| Item | Status |
| :--- | :--- |
| Keeper ragdoll after dive | **Hold** |
| 390px ball clipped / black sky | **Hold** — ball + stands in `r3-02` |
| TouchEvent + pointer capture | **Hold** in `input.js`; **live mouse blocked by HUD** (CRITICAL 1) |
| Shake/punch composed | **Hold** |
| Swipe start band 75% | **Hold** (`input.js:85`) |
| r2 PAGEERROR `takerDecision.target.x` | **Hold** — `targetPoint` + `pointToLaunch` |
| r2 `recordDive` missing | **Hold** — `recordPlayerDive` |
| r2 keeper swipe always BM | **Hold** — reads `launch.target` |
| r2 difficulty field names | **Hold** — `keeperReactTime` / `keeperReach` |
| r2 keeper camera / giant taker | **Hold** in source (`KEEPER` at z=18.2); untested in play |
| r2 cube crowd | **Hold** — seated torso+head, looks right |
| r2 nested reveal probs | **Hold** — passed unwrapped |
| r2 replay not rewound | **Hold** in source (`lastDecidingKick` rewind) |
| CHANGELOG v1 leftover | **Still present** (MINOR 6) |

---

## Checklist (UPGRADE_PLAN §5 Round 3 / v2-r3-agy.txt)

| Item | Status |
| :--- | :--- |
| 16-team World Cup + bracket + personalities + ramp | **Module yes** (5/5 tests, `r3-390/03` via forced API). **Title CTA dead** (CRITICAL 2) |
| Quick single match still available | Button works; **shots do not** (CRITICAL 1) |
| Stars / unlocks / trophy cabinet / localStorage | Module yes (5/5). **Live keys don't match** (MAJOR 3) |
| Share card + 「分享」 | Code in `src/share.js`; end-screen button present; untested in coordinator play |
| Polish + speed pass, DPR≤2, pause when hidden | DPR cap + `visibilitychange` pause exist; **fps regression** (MAJOR 4) |
| Optional CC0 models ≤2 MB | Skipped; procedural; `ASSETS.md` present |
| iPhone pointer + touch fallback | Listeners exist; HUD intercepts first-run swipe |
| Existing tests green + tournament/unlock tests | **75/75** |
| Feels like a real game @ 390px | **Fail** — cannot shoot, cannot open the Cup |

---

## Concrete patch order

1. `pointer-events: none` on all `#screen-match` descendants except actual buttons; `overflow: hidden` on the match screen. Confirm a y=780 swipe scores.
2. Remove inline `display:none` on `#modal-team-select`; make the World Cup button either show that modal or `switchScreen('tournament')`. Confirm `r3wc-02` is a bracket or a 16-team picker.
3. Align `finishMatch` ↔ `calculateMatchStars` ↔ end-screen field names.
4. Cheapen crowd update (basic material, reused dummies, no per-frame alloc).
5. Re-shoot 390×844: swipe goal, keeper-turn framing, heat overlay, title→World Cup.

Do not ship until a headless 390×844 單場 match records at least one shot and the World Cup title button shows a bracket or team picker without a forced `startTournament()` call.
