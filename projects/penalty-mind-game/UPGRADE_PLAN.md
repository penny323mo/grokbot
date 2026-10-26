# 12碼讀心戰 — Upgrade Plan (v2: "from tap-a-grid to a real penalty game")

## 0. Diagnosis of v1 (why Penny called it 低級)
Read from code (game.js 1193 lines, model.js 553, style.css 1348) and screenshots:
- **It is a quiz, not a game.** Input = tap one of 6 labelled rectangles. No aim, power, timing or skill; outcome is a dice roll vs the predictor.
- **Visuals are flat UI:** dark gradient, a CSS goal with dashed grid boxes and text labels (「左上」「12% 射失率」), a cartoon keeper sprite, emoji-style avatars. No stadium, no perspective, no camera.
- **No game feel:** no run-up, no ball physics, no slow-mo, no screen shake, no net bulge, sound off by default and only beeps.
- **No reason to come back:** single 5-kick match, no progression, teams, tournaments, unlocks or difficulty.
- **The best idea (mind-reading AI) is shown as a stats panel** rather than felt in play; and the predictability score is wrong for new players (known bug from grok final review).

Keep: the predictor model (model.js, tested), Cantonese copy, iPhone-first, static hosting on GitHub Pages.

## 1. Target experience (one sentence)
A **3D, broadcast-camera penalty shootout on iPhone** where you **swipe to shoot** (direction + power + curve), **dive by swiping** as keeper, against **named rival keepers/takers whose AI visibly reads your habits**, inside a **World-Cup-style tournament run** with stadium atmosphere, sound and slow-mo replays — 3-minute sessions you want to repeat.

Reference bar (what top mobile games do): Flick Kick / Football Strike / Penalty Shooters / FIFA-EA FC penalty mode / "Score! Hero":
1. Swipe gesture maps directly to ball path (curve from swipe bend, power from speed) — skill expression.
2. Behind-the-ball camera, then fast cut / slow-mo on the save or goal.
3. Keeper with readable animations (set, shuffle, dive low/high, parry, catch, fake lean).
4. Juice: net bulge, ball spin trail, crowd roar swell, camera shake, confetti, hit-stop.
5. Meta loop: tournament bracket, stars/rewards, unlockable kits/balls, difficulty tiers.
6. Pressure: crowd noise, sudden death, timer, "keeper staring" moments.

## 2. Features ranked by impact (impact / cost)
| # | Feature | Impact | Cost |
|---|---------|--------|------|
| 1 | **3D scene** (Three.js): pitch, goal with cloth-ish net, penalty spot, stadium stands (procedural low-poly + crowd sprites), floodlights, sky/night | ★★★★★ | M |
| 2 | **Swipe-to-shoot**: swipe direction → target point anywhere in goal (continuous, not 6 boxes); swipe speed → power (too hard = over the bar); swipe bend → curve (Magnus-ish lateral accel); real ballistic ball flight | ★★★★★ | M |
| 3 | **Animated keeper**: procedural rigged low-poly keeper (capsule limbs) with states idle/shuffle/set/dive-L/R high/low/stay/catch/parry; dive timing vs ball arrival decides save via reach volume, not dice | ★★★★★ | M-H |
| 4 | **Mind-game AI made visible in play**: keeper "tells" (leans, eye line arrow), taunts in Cantonese after reading you (「又係左下？我睇穿你喇」), pre-kick heat-hint at higher difficulty; predictor feeds dive *region* + commit timing; you can bluff (keeper also reads run-up pause) | ★★★★☆ | S (reuses model.js) |
| 5 | **Juice & audio**: WebAudio procedural crowd (filtered noise swell), kick thud, post "clang", net swish, whistle; slow-mo last 0.3s, camera shake, hit-stop on save, confetti, goal flash; haptics via `navigator.vibrate` where supported | ★★★★☆ | S-M |
| 6 | **Keeper mode by swipe**: opponent taker runs up (animated), you swipe direction to dive; timing window — dive too early and the taker shoots other way (taker AI also reads *your* dive habits) | ★★★★☆ | M |
| 7 | **Tournament / career**: 16-team World Cup knockout (R16→Final) with real national-team names and kit colours (names/colours only, no logos); each opponent keeper has a personality (patient, early-diver, learner) and difficulty ramps | ★★★★☆ | M |
| 8 | **Progression**: stars per match, unlock balls/kits/stadium night mode, trophy cabinet, localStorage save | ★★★☆☆ | S |
| 9 | **Replay & share**: auto slow-mo replay from side camera of the deciding kick; end card screenshot (canvas.toBlob) for sharing | ★★★☆☆ | S-M |
| 10 | Daily challenge (seeded keeper), online leaderboard | ★★☆☆☆ | M (skip) |

## 3. Tech choice
- **Three.js (r16x, vendored as `vendor/three.module.min.js`, ES module + import map)** — no build step, works on GitHub Pages and iPhone Safari (WebGL2). Chosen over Phaser because the step change Penny wants is *perspective 3D*; Phaser 2D would look like "a nicer v1". Babylon is heavier.
- No physics engine: hand-written ballistic + drag + Magnus integration (fixed 120 Hz step) and simple sphere-vs-capsule / sphere-vs-post collision — deterministic and testable in Node.
- Keep `model.js` as pure module (fix predictability bug). New pure modules: `shot.js` (swipe→launch params, trajectory), `keeperAI.js` (prediction → dive plan), `tournament.js`. Each has Node tests.
- Performance budget: ≤ 60k triangles, 1 shadow-casting light (or baked blob shadows), devicePixelRatio capped at 2, 60fps on iPhone 12+.
- UI overlay stays HTML/CSS (scoreboard, menus, Cantonese text) above the WebGL canvas.

## 4. Assets approach
- **Procedural first** (zero licence risk, small download): grass via canvas-generated stripe texture + noise; goal posts = cylinders; net = line-segment grid deformed by a vertex shader/CPU on impact; stands = instanced boxes with canvas-drawn crowd billboards (random colours, animated bob); floodlights = sprites + bloom-lite (additive glow sprites, no postprocessing pass).
- Players/keeper: procedural low-poly humanoid (boxes/capsules) animated by code-driven keyframes — stylised "Football Strike"-like look, consistent and cheap.
- Optional CC0 upgrades (round 3 only if time): Kenney.nl (CC0) sports/character packs, Quaternius CC0 animated characters (glTF) for keeper/taker, Poly Haven CC0 HDRI for sky. Record licences in `ASSETS.md`.
- Audio: generated via WebAudio (noise + filters + envelopes); optional CC0 crowd loop from freesound CC0-filtered, ≤300 KB.
- Fonts: system font stack; no external CDN at runtime.

## 5. Scope across 3 agy↔grok rounds
- **Round 1 – "It's a real 3D penalty"** (spec below): 3D scene, swipe shooting with power/curve and physics, animated procedural keeper whose dive uses the existing predictor, juice + sound v1, single-match flow, fix predictability bug. grok reviews: iPhone touch, fps, correctness, tests.
- **Round 2 – "Both sides + mind games"**: keeper mode by swipe with animated taker run-up and taker AI that learns your dive habits; keeper tells/fakes, Cantonese taunts, mind-reading reveal as an in-scene overlay (heat ring on goal) after each kick; slow-mo replay of deciding kick; difficulty tiers.
- **Round 3 – "Reason to come back"**: World Cup tournament (16 nations, bracket screen, per-keeper personalities), stars/unlocks (balls, kits, night stadium), trophy cabinet, share card, polish pass, optional CC0 models; perf tuning, README/CHANGELOG, deploy to GitHub Pages.

## 6. Round 1 spec for agy (precise)
Work in `/workspace/nightly/2026-10-24-penalty-mind-game/`. Static site, no build step, no runtime CDN. All UI text Traditional Chinese Cantonese. Must run on iPhone Safari portrait (390×844) and desktop.

**Files**
- `vendor/three.module.min.js` (download a pinned Three.js release once into repo; reference via `<script type="importmap">`).
- `index.html`: full-screen `<canvas id="scene">` + HTML overlay (`#hud`, `#menu`, `#result`). Keep title screen (「12碼讀心戰」, start, sound toggle default **ON after first tap**, reset AI memory).
- `src/main.js` (bootstrap, loop with fixed-step physics 120 Hz + render rAF), `src/scene.js` (stadium), `src/keeper.js` (model + anim state machine), `src/ball.js`, `src/input.js` (swipe), `src/fx.js` (juice), `src/audio.js`, `src/shot.js` (pure), `src/keeperAI.js` (pure), keep `model.js` (pure; fix bug).
- Remove the 6-box tap grid UI from the shooting flow (old `game.js` may be deleted/replaced).

**Scene**
- Camera: behind ball, ~1.7 m high, 3 m behind the spot, FOV 50, looking at goal centre; slight idle sway. Real dimensions: goal 7.32 m × 2.44 m, spot 11 m.
- Pitch: canvas-generated mowing stripes, white lines (box, 6-yard, spot, arc). Goal: white cylinder posts/bar (r 0.06 m), net as grid of lines with depth 2 m; on goal, displace net vertices near impact point (bulge, decays over 0.6 s).
- Stadium: 4 stands of instanced boxes, crowd as billboard quads with procedural colours bobbing; 4 floodlight sprites; dark-blue night sky gradient; fog.
- Lighting: hemisphere + 1 directional; ball and keeper get blob shadow decals.

**Shooting (input → physics)**
- Touch/mouse swipe starting near the ball. Record points; on release compute:
  - target direction from the start→end vector (map screen X to goal-width, screen Y length to height);
  - power = swipe speed (px/ms) normalised to 0–1; launch speed 18–32 m/s; power > 0.92 adds upward error (can go over bar);
  - curve = signed max perpendicular deviation of the swipe path from its chord, normalised → lateral spin; apply Magnus accel `a = k * spin × v` and quadratic drag.
- `shot.js` exports pure `swipeToLaunch(points, viewport)` and `simulate(launch, dt)` returning trajectory; ball crossing the goal plane determines in/post/over/wide.
- Aim assist: faint dotted predicted arc appears only during the first 2 kicks of a new player (tutorial), then off.
- Show a ghost hand tutorial on first launch: 「向球門撥一下射門，撥快啲大力啲，撥彎啲會轉彎」.

**Keeper**
- Procedural humanoid (torso box, head sphere, capsule arms/legs, gloves) in a team kit colour; anim states: idle bounce, set (crouch at run-up), dive L/R × high/low, jump-up (centre high), stay; implemented as keyframed joint rotations + root motion (tween over 0.45–0.6 s).
- Decision: `keeperAI.decide(modelProbs, difficulty)` maps the existing 6-zone predictor (continuous target binned to 6 zones for recording) to a dive target point + commit time (reacts at ball launch + reaction delay 120–220 ms by difficulty). Save = ball's path intersects keeper reach volume (hands/body capsules) at time of crossing — computed, not a random roll. Strong shots to the corner beat a correct dive sometimes; parry vs catch by ball speed.
- After each kick record actual zone into model.js (unchanged API: `recordShot(zone, predictedZone)`).

**Match flow (Round 1)**
- 5 player shots vs scripted CPU score (keeper mode arrives in round 2): CPU kicks resolved as quick cut-scene with probability 0.75, shown in HUD dots. Sudden death if tied.
- HUD: top scoreboard 你 vs 對手門將 with kick dots; after each of your kicks a compact in-scene "讀心" reveal: translucent heat overlay on goal mouth for 1.2 s + text 「門將估你射：左下（信心 47%）」.
- End screen keeps heatmap + predictability + keeper accuracy.

**Juice / feel (all must exist)**
- Slow-mo (timeScale 0.3) when ball is within 3 m of goal line; normal on resolution.
- Goal: net bulge, camera punch-in, 0.25 s shake, confetti particles (≤300), crowd roar swell, 「入波！」 big text. Save: hit-stop 80 ms, keeper glove flash, 「撲出！」. Post: clang + ball rebound physics. Over/wide: groan.
- Ball: spin rotation from spin vector, short trail ribbon.
- Haptics: `navigator.vibrate?.(30)` on kick (ignored on iOS, fine).
- Audio via WebAudio only (unlock on first touch): kick thud, whistle, crowd bed (filtered noise loop, gain swells), net swish, post clang.

**Bug fix**
- `getPredictabilityScore()`: return null / 「數據不足」 until ≥ 8 shots; compute normalised conditional entropy with Laplace smoothing so 5 distinct zones yields low predictability (< 30). Add test.

**Tests & quality**
- `node tests/model.test.js` and new `node tests/shot.test.js` (swipe straight → centre target; faster swipe → higher speed; bent swipe → curved lateral displacement sign; over-power over-bar case) and `tests/keeperAI.test.js` (save when dive correct & ball within reach; goal for top corner at high speed).
- No console errors; ≥ 50 fps on a mid iPhone (cap DPR 2); total download ≤ 1.5 MB.
- `prefers-reduced-motion` disables shake/slow-mo.
- Update README.md (Cantonese how-to-play) and CHANGELOG.md.

**grok round-1 review checklist**
Touch swipe on iOS Safari (no page scroll/zoom: `touch-action:none`, `user-scalable=no`), audio unlock, physics correctness & tests, keeper save fairness (not dice), fps/triangle budget, Cantonese wording, no CDN, predictability bug fixed, overall "does it feel like a real game" verdict with headless screenshots at 390px.

## 7. Risks
- Procedural humanoid may look crude → mitigate with stylised kit colours, shadows, good camera; swap to CC0 Quaternius glTF in round 3.
- iOS WebGL perf → instancing, no postprocessing, DPR cap.
- Swipe tuning is subjective → expose constants in one `tuning.js` for quick tweaks after Penny plays.
