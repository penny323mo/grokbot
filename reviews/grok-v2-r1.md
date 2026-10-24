VERDICT: NOT READY

It does **not** yet feel like a real penalty game on a 390×844 phone. The sim and the mind-reading model are a real step up from the v1 tap-grid, and a mouse swipe does fly a ball into a 3D goal with a diving keeper. What the player actually sees is a cropped pitch under a black void: the ball is cut off at the bottom edge, there is no stadium/crowd/floodlight in frame, and after the first dive the keeper stays sprawled on the grass for every later kick (screenshots `r1-05` through `r1-09`). Juice that was specified (shake, punch-in) is overwritten every frame. Until the keeper resets, the camera shows the ball and the stands, and touch is proven on iOS, this is a tech demo, not a match.

Tests independently re-ran: `model.test.js` 14/14, `shot.test.js` 5/5, `keeperAI.test.js` 5/5. Predictability guard, Laplace smoothing, no runtime CDN, Cantonese HUD, 5-kick + sudden death, and reach-volume saves (not dice) are in good shape. Did not launch a browser; used coordinator 390×844 captures in `screenshots/v2/`.

---

## CRITICAL

1. **`src/keeper.js:161-164` / `src/main.js:314,502` — keeper never returns to idle/set after a dive.** `startPlayerTurn` and `startCpuTurn` call `keeper.setReady()`, which only flips `state = 'set'` and `stateTime = 0`. It does not reset `root.position`, `root.rotation`, or `bodyGroup.rotation`. The `'set'` branch in `update` (`keeper.js:208-222`) never writes `bodyGroup.rotation.z` or `root.position.x/y`, so the last dive pose (z-rot ~1.45, root translated to the post) is left on the character. Headless frames: kick 1 dive (`r1-03`/`r1-04`), then kicks 2–4 still lying on the turf while the banner says 「你主射」 (`r1-05`, `r1-06`, `r1-07`, `r1-08`, `r1-09`). `reset()` at `keeper.js:143-159` already restores T-pose and origin but is only used on 「返回主頁」. **Fix:** in `startPlayerTurn` and `startCpuTurn`, call `this.keeper.reset()` then `this.keeper.setReady()`. Also have `setReady()` itself zero root/bodyGroup transforms so a stray `setReady()` cannot leave a ragdoll.

2. **`src/scene.js:31-32,59-60,282-360` — 390px camera clips the ball and shows empty black above the bar.** Spec camera is 1.7 m high, 3 m behind the spot, FOV 50, look-at goal centre (`baseCameraPos (0,1.70,14)`, `lookTarget (0,1.22,0)`). On 390×844 the HUD eats the top ~25% and the ball at `(0, 0.11, 11)` sits on the bottom frustum edge — clipped in every match shot (`r1-02`, `r1-05`–`r1-09`). Above the crossbar is `scene.background 0x060c1e` with no stands, crowd, or floodlights. Crowd instances are placed at `z = -10.5 - row*1.2` (`scene.js:341`) **inside** the north stand box (`BoxGeometry(48,14,18)` at `(0,7,-18)` occupies `z ∈ [-27,-9]`), so every billboard is occluded. Floodlight lamps at `y=22` sit outside a 50° vertical FOV. **Fix:** (a) pull camera to ~`z=16.2` or look at `(0, 0.9, 5)` and/or FOV ~58 so the spot and a full ball are in the lower third under the HUD; (b) put crowd on the **front** of the stand (`z ≈ -8.6`) or shrink the stand box so it is a terrace behind the crowd; (c) drop floodlight Y into frame (~12–14 m) or add a visible lamp glow sprite just above the bar. Re-shoot `r1-02` at 390×844 before calling the scene done.

---

## MAJOR

3. **`src/input.js:29-33` — no TouchEvent path; coordinator could not shoot with synthetic touch.** Swipe is pointer-only (`pointerdown` on canvas, `pointermove`/`pointerup` on `window`). No `setPointerCapture`, no `touchstart`/`touchmove`/`touchend` fallback, no `{passive:false}` touch listener to `preventDefault`. Mouse/CDP mouse produced a shot; synthetic touch did not. Overlay correctly uses `pointer-events: none` (`style.css:371-375,549`) and `touch-action: none` is set on `html`/`#scene`, so a real iOS 13+ PointerEvent *may* work — it is unverified, and iOS Safari historically drops window-level pointermove without capture. This is an iPhone-first game. **Fix:** on `pointerdown`, `el.setPointerCapture(e.pointerId)`; also bind `touchstart/move/end` on the canvas with `preventDefault`, mapping `touches[0].clientX/Y` through the same `onPointerDown/Move/Up`. Confirm with a real touch (or CDP `Input.dispatchTouchEvent` that you have seen fire `onShoot`) at 390px.

4. **`src/main.js:900-905` / `src/scene.js:437-442` / `src/fx.js:101-108,166-175` — specified juice is a no-op.** Every frame `stadium.update` writes `camera.position` to `baseCameraPos + sway`, *after* `fx.update` applies shake. Goal `triggerGoalExplosion` → `triggerShake` is wiped before `render()`. There is no camera punch-in at all (spec: punch-in + 0.25 s shake on goal). Hit-stop (`main.js:396-398`) does freeze a frame, slow-mo (`main.js:816-822`) does run, net bulge and confetti exist. Shake/punch-in do not. **Fix:** apply sway + shake + punch offset in **one** place (e.g. `stadium.update` reads `fx.shakeOffset` / a `punchIn` timer, or `fx.update` runs after `stadium.update`). Add a 200–250 ms look-at lerp toward the impact point on goal.

5. **`src/input.js:61-62` plus clipped ball — swipe start band fights the framing.** Swipe is rejected if `y < rect.height * 0.40`. With the ball already at the bottom edge, a natural aim swipe that starts mid-pitch (where the ghost hand is drawn, `r1-02`) is ignored; only a swipe that begins in the bottom 60% counts. Combined with CRITICAL 2 this is why a player staring at the keeper cannot “flick the ball”. **Fix:** after the camera includes the ball, accept a start in the bottom ~75%, or start-near-ball in NDC (within ~1.2 m of the spot in screen space).

---

## MINOR

6. **No favicon — coordinator 404.** `index.html` has no `<link rel="icon">` / `apple-touch-icon`. Safari/Chrome request `/favicon.ico`. **Fix:** add a 32×32 `favicon.png` (or SVG) and `<link rel="icon" href="favicon.png">`.

7. **`src/scene.js:46` — renderer sized to `window`, not `#scene`.** `setSize(window.innerWidth, window.innerHeight)` also writes `canvas.style.width`. Fine at 390px; on desktop `#game-container` is `max-width: 480px` (`style.css:44-68`) so the canvas overflows the phone chrome. **Fix:** `const r = this.canvas.getBoundingClientRect(); this.renderer.setSize(r.width, r.height, false)` and match CSS size; listen to container resize, not only `window`.

8. **`src/keeperAI.js:125-151` — save volume is a 2D circle, not hand/body capsules.** `checkSave` interpolates a single reach centre and tests `hypot(bx-keeperX, by-keeperY) <= gloveReachRadius (0.42)`. Spec asked sphere-vs-capsule. Tests pass and it is not a dice roll (good). Corners vs a correct dive still lose unless the hard-coded `unstoppable_top_corner` (`|x|>3.05 && y>1.95 && speed>=28`). **Fix:** two capsules (torso + extended glove along dive axis) or grow reach with dive progress; keep the top-corner rule.

9. **`src/main.js:832-866` — ball freezes at the goal line on a goal.** After `ballCrossed` with `result==='goal'` there is no `deflectPos` / continue-integrate, so the mesh stops on the last pre-cross sample instead of travelling into the net bulge. **Fix:** keep integrating 150–250 ms past `tCrossing` (or lerp to `(cross.x, cross.y, -0.4)`).

10. **`src/fx.js:107` — no punch-in; confetti 160 (budget allows ≤300).** Cosmetic once MAJOR 4 is fixed. Goal text 「入波！」 exists (`main.js:434`).

11. **`index.html` has no apple-mobile web-app meta; `lang="zh-HK"` is fine.** Copy is Cantonese throughout (title, tutorial, 「撲出！」「飛過界！」「突然死亡」). End-screen 「惜敗打和！」 (`main.js:733`) is unused in practice (tied regulation goes to sudden death) — leave or drop.

12. **`CHANGELOG.md:47-49` still contains leftover v1 “Round 1 fixes / grok-round-1.md” prose** under the v2 section. Harmless, tidy it.

---

## Checklist (UPGRADE_PLAN §6 / grok round-1)

| Item | Status |
| :--- | :--- |
| iOS touch (`touch-action:none`, `user-scalable=no`) | CSS yes; **input path unproven** (MAJOR 3) |
| Audio unlock on first pointer | Pass (`main.js:157-164`, `audio.js:27-37`, default ON) |
| Physics + `shot.test.js` | Pass (straight / faster / curve sign / over-bar) |
| Keeper save fairness (not dice) | Pass (`checkSave` geometric; CPU 0.75 cut-scene is spec) |
| Perf budget (DPR≤2, no post, ~60k tris) | Pass on paper (DPR cap `scene.js:45`; Three 655 KB; crowd 260 quads) |
| Cantonese wording | Pass |
| No CDN | Pass (`vendor/three.module.min.js` + import map) |
| Predictability `< 8` → null / 數據不足; 5-zone `< 30` | Pass (`model.js:434-435`, tests 14/14) |
| Match flow 5 kicks + early clinch + sudden death | Pass (`main.js:575-623`) |
| Feels like a real game @ 390px | **Fail** — ball clipped, black sky, keeper ragdoll |

---

## Concrete patch order

1. `keeper.reset()` before every `setReady()`.
2. Re-frame camera + move crowd in front of the north stand; verify with a 390×844 screenshot that the full ball, posts, and some crowd are visible under the HUD.
3. Pointer capture + touch fallback; re-test swipe with TouchEvents.
4. Compose camera sway/shake/punch in one update.
5. Favicon, renderer size to canvas rect, ball continues into the net.
