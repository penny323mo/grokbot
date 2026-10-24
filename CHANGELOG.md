# Changelog

## v2 Round 1

Comprehensive upgrade from 2D tap-a-grid prototype to an authentic 3D mobile penalty shootout game per UPGRADE_PLAN.md:

### 1. 3D Stadium & Three.js Architecture
- **Vendored Three.js**: Pinned Three.js r160 into `vendor/three.module.min.js` (655 KB), loaded via native `<script type="importmap">` without any external CDN dependencies or build step.
- **3D Stadium Scene (`src/scene.js`)**: Procedural pitch with alternating mowing stripes and regulation markings, goal frame (7.32m × 2.44m) with depth net, 260 instanced animated crowd spectators bobbing in stands, night sky fog, floodlights, and blob shadow decals.
- **Dynamic Net Deformation**: Procedural net displacement upon goal impact with realistic backward bulge and quadratic time decay.

### 2. Swipe Shooting Physics (`src/shot.js`)
- **Continuous Gesture Mapping**: Mapped touch and mouse swipe vectors to continuous goal space target coordinates.
- **Ballistic Physics & Magnus Curve**: Implemented 120 Hz fixed-step numerical integration with quadratic aerodynamic drag and lateral Magnus spin acceleration derived from swipe curvature.
- **Power & Overpower Lift**: Swipe speed scaled to 18–32 m/s; overpowered swipes (> 0.92 power) introduce vertical lift that can soar over the crossbar.
- **Turf Bounce & Frame Collision**: Integrated turf bounce physics and restitution rebound off posts and crossbar.

### 3. Procedural Articulated Goalkeeper & Reach Volume Saves (`src/keeper.js`, `src/keeperAI.js`)
- **Joint Hierarchy & State Machine**: Humanoid goalkeeper with articulated joints and keyframe animations (`idle`, `set`, `dive_TL/TR/BL/BR`, `jump_TM`, `stay_BM`, `celebrate`, `concede`).
- **Deterministic Reach-Volume Collision**: Saves are determined geometrically by sphere-vs-capsule intersection of the ball and goalkeeper reach volume at the goal line—not by random dice rolls.
- **Parry vs Catch**: High-speed shots (> 22 m/s) result in glove parry rebounds, while moderate-speed shots within close reach are caught.
- **Unstoppable Top-Corner Rule**: High-speed blasts (> 28 m/s) into the extreme corner beat even a correctly diving goalkeeper.

### 4. Audio Engine & Visual Juice (`src/audio.js`, `src/fx.js`)
- **WebAudio Synthesis**: Synthesized kick bass thuds, referee whistles, net swish noise bursts, metallic post clangs, glove impact saves, and continuous stadium crowd chatter with goal roar swells.
- **Audio Unlock**: Default ON after first tap with automatic context resume on first user interaction.
- **Juice & Slow-Mo**: Camera shake on goals and frame hits, 0.3x slow-motion when ball is within 3.2m of the goal line, hit-stop on glove saves, confetti particle explosions, and in-scene 3D 讀心 heat ring.
- **Accessibility**: Full compliance with `prefers-reduced-motion` disabling slow-mo and camera shake.

### 5. Prediction Model Predictability Fix (`model.js`)
- **Sample Size Guard**: `getPredictabilityScore()` now returns `null` and displays 「數據不足」 when `totalShots < 8`.
- **Laplace Smoothing & Normalization**: Replaced ungrounded entropy estimates with Laplace-smoothed conditional entropy ($\alpha = 1$, `minRow = 3`), ensuring players who vary across 5 distinct zones correctly receive low predictability scores (< 30%).

### 6. Mobile-First Match Experience (`src/main.js`, `index.html`, `style.css`)
- **Sudden-Death Match Flow**: Regulation 5 kicks with early mathematical clinch detection and sudden death if tied after 5 kicks.
- **Tutorial & Ghost Hand**: Animated swipe gesture overlay and dotted aim-assist line displayed during the first 2 kicks for new players.
- **In-Scene Reveal**: Translucent heat ring and HUD pill displaying keeper's predicted zone and confidence percentage.
- **Mobile Safari Optimization**: Styled specifically for iPhone Safari portrait (390×844) with `touch-action: none`, `user-scalable=no`, and 44px tap targets.

### 7. Unit Tests (`tests/`)
- `tests/model.test.js`: 14 tests passing.
- `tests/shot.test.js`: 6 tests passing.
- `tests/keeperAI.test.js`: 6 tests passing.
- `tests/input.test.js`: 3 tests passing.

---

## v2 Round 1 fixes

Following the grok Round 1 code review (`reviews/grok-v2-r1.md`), all CRITICAL, MAJOR, and sensible MINOR issues have been resolved:

### 1. Goalkeeper Reset Between Kicks (CRITICAL #1)
- **Root & Body Transform Reset**: Updated `setReady()` in `src/keeper.js` to unconditionally call `this.reset()`, resetting `root.position` to `this.basePos`, `root.rotation` to `(0,0,0)`, and all `bodyGroup` and joint rotations.
- **Pre-Turn Clean State**: Updated `startPlayerTurn()` and `startCpuTurn()` in `src/main.js` to call `this.keeper.reset()` before `this.keeper.setReady()`, preventing the goalkeeper from staying sprawled in dive poses on later kicks.

### 2. Camera Framing & Stadium Visuals (CRITICAL #2)
- **Unclipped Ball & Pitch**: Reframed camera in `src/scene.js` (`baseCameraPos = (0, 1.85, 15.6)`, `lookTarget = (0, 1.15, 2.5)`, vertical FOV 56°). The ball at `(0, 0.11, 11)` now sits with a 155px margin above the screen bottom, leaving the full ball, penalty spot, and lush turf unclipped under the HUD.
- **Unobstructed Grandstand & Crowd**: Moved North grandstand crowd billboards to the open front terraces (`z = -6.2` to `-12.95m`, `y = 2.45` to `10.1m`), directly above crossbar height ($2.44m$). All 260 cheering crowd spectators bobbing in the stands are now prominently visible across the upper third.
- **In-Frame Floodlights**: Lowered stadium floodlight towers to $y = 13.0m$ and brought them closer (`z = -8m` and `+12m`). Added glowing lens flare halo quads with additive blending, providing realistic night stadium illumination.

### 3. TouchEvent Fallback & Pointer Capture (MAJOR #3)
- **PointerCapture**: Added `setPointerCapture` and `releasePointerCapture` on `#scene` in `src/input.js` to prevent iOS Safari from dropping pointermove events when fingers move quickly.
- **Direct TouchEvent Listeners**: Added `{ passive: false }` touch listeners (`touchstart`, `touchmove`, `touchend`, `touchcancel`) with `preventDefault()` on the canvas, ensuring synthetic touch events reliably execute swipe shooting on iPhone Safari.
- **Added Input Unit Tests**: Created `tests/input.test.js` validating TouchEvent swipe execution, PointerCapture lifecycle, and boundary filtering (3/3 tests pass).

### 4. Unified Camera Juice Composition (MAJOR #4)
- **Composed Sway, Shake & Punch-In**: Refactored `src/fx.js` to track `shakeOffset`, `punchOffset`, and `lookAtOffset`. `stadium.update()` now computes idle camera sway, screen shake, forward punch-in, and look-at lerp in a single unified step, preventing shake from being overwritten.
- **Camera Punch-In on Goal**: Camera now punches forward 1.8m toward the goal on scores with smooth sine recovery and look-at target focus.

### 5. Swipe Start Boundary Tuning (MAJOR #5)
- **Bottom 75% Acceptance**: Updated `_startSwipe` in `src/input.js` to accept touches starting anywhere in the bottom 75% of the screen (`y >= rect.height * 0.25`), enabling players to naturally flick the ball from anywhere on the pitch.

### 6. Minor Improvements & Polish
- **Favicon & Apple Web App Meta (MINOR #6 & #11)**: Added `favicon.svg`, 32×32 `favicon.png`, `apple-touch-icon`, and `<meta name="apple-mobile-web-app-capable" content="yes">` to `index.html`.
- **Canvas-Bounded Renderer Sizing (MINOR #7)**: In `src/scene.js`, renderer now reads `canvas.getBoundingClientRect()`, passes `false` to `setSize()`, and listens to parent resize via `ResizeObserver` for responsive desktop and mobile container support.
- **Reach Volume Capsules (MINOR #8)**: Replaced single 2D circle with two 3D capsules (torso/body capsule + extended arm/glove reach capsule along the dive vector) in `src/keeperAI.js`. Added unit test in `tests/keeperAI.test.js` (6/6 tests pass).
- **Post-Goal Ball Net Penetration (MINOR #9)**: In `src/main.js`, goal trajectory continues past the goal line into the net bulge ($z < 0$), settling realistically into the mesh.
- **Confetti Particle Count (MINOR #10)**: Increased confetti count to 220 in `src/tuning.js` (within budget).

---

## v1 Archive (Legacy 2D Prototype)

Historical changelog for the initial 2D tap-a-grid prototype (prior to the v2 3D WebGL rewrite):

### 1. CRITICAL Fixes
- **Tied probabilities fair sampling & prediction (Review #1)**:
  - In `model.js`, `getProbabilities()` now detects ties within a `1e-9` floating-point tolerance. When multiple zones tie for maximum probability, `predictedZone` returns `null` and `isAmbiguous` is set to `true`.
  - In `chooseDiveZone(0.12)`, ambiguous states now sample uniformly across all tied zones instead of defaulting to top-left (`TL`).
  - In `game.js`, when prediction is ambiguous, the mind-reading overlay displays 「門將估你射：【暫時未有傾向】 (觀察中)」 and avoids marking any zone bar as primary pink.
  - In `model.js`, `recordShot` skips prediction accuracy bookkeeping when `predictedZone` is `null`, preventing fake accuracy inflation.
- **Async timer cleanup & token invalidation (Review #2)**:
  - Added `currentMatchToken` and `activeTimeouts` set. All asynchronous match timeouts now use `safeSetTimeout()`, which verifies token freshness before executing.
  - `cleanTimers()` increments `currentMatchToken`, clears all pending timeouts, and cancels the reaction countdown interval.
  - `cleanTimers()` is invoked whenever starting a match, returning home, or ending a match.
  - The mind-reading overlay's `.active` class is cleared during match initialization and field position resets.
  - The 「繼續」 button is guarded against multi-clicks (`!classList.contains('active')` check) and removes `.active` before initiating the next turn.

### 2. MAJOR Fixes
- **AI run-up separation & countdown pause/resume (Review #3)**:
  - Separated the 1.0s run-up from the 1.5s dive window. Player input is disabled (`waitingForInput = false`) during the run-up animation.
  - After 1.0s, `waitingForInput` is enabled and the 1.5s countdown starts.
  - The reaction countdown is driven by capped tick delta calculations (`Math.min(100, dt)`).
  - Listens to `visibilitychange` to pause countdown on tab freeze / backgrounding and resume with remaining time on return.
  - Replaced browser `confirm()` and `alert()` with custom in-page Cantonese dialogs that pause and resume the keeping timer on open/close.
- **Accurate narration & timeout save accounting (Review #4)**:
  - Passed `{ isGoal, isSaved, isCornerMiss, missType, isAmbiguous }` into `showMindReadingOverlay` to accurately describe crossbar hits, off-target misses, keeper saves, and goals.
  - Saves made by defaulting to bottom-middle on timeout now credit `gameState.playerSavesCount`.
  - Timeout reaction banners keep 「未能及時反應留喺中間」 and append the real outcome (e.g. 「，好彩成功沒收！」 or 「，被對手射入！」).
  - Calculated 把關成功率 as `saves / (saves + aiGoals)` (shots on target faced), properly excluding off-target AI misses from the denominator.
- **15-Round Cap Draw Support (Review #5)**:
  - When the 15-round cap is reached with equal scores, the game records `'draw'` to `model.recordMatchResult()`, plays a neutral blip, and shows 「打和！雙方難分勝負！」 with `.result-title.draw` styling.
- **iPhone Safari viewport & safe-area adaptation (Review #6)**:
  - Configured `#game-container` and `body` with `min-height: 100dvh; min-height: -webkit-fill-available; height: 100dvh;` and padding for `env(safe-area-inset-*)`.
  - Made goal container dimensions responsive with `clamp()` and reduced bottom margin so bottom zones are never clipped behind Safari toolbars.
  - Enabled vertical scrolling (`overflow-y: auto; -webkit-overflow-scrolling: touch; align-items: flex-start;`) in `.mind-reading-overlay` to guarantee the 「繼續賽事」 button is accessible on compact viewports.
- **Sudden-death kick dots horizontal scroll (Review #7)**:
  - Added horizontal scroll (`overflow-x: auto; -webkit-overflow-scrolling: touch;`) to `.kicks-tracker` and auto-scrolled to the latest kick dot upon updates.
- **Cantonese terminology corrections (Review #8)**:
  - Replaced 「中柱彈出！」 with 「中楣彈出！」 for crossbar hits.
  - Replaced 「即時死亡」 with 「突然死亡」 in HTML, README, and `game.js`. First sudden death round reads `突然死亡 第 1 輪` (i.e. `round - 5`).
  - Corrected commentary grammar to 「哈！你行埋嚟嗰陣，我已經知你想射呢度！」.

### 3. MINOR Fixes
- **Storage robustness & data validation (Review #9)**:
  - Added `storageFailed` indicator on the title screen (「呢部機儲存唔到記憶」) when `localStorage` writes fail or quota is exceeded.
  - Added validation on `init(data)` / `loadFromStorage()` to verify finite numeric counts, `totalShots === sum(freq)`, and valid zones in history; resets to clean state if corrupted.
- **Cantonese UI text polish (Review #10)**:
  - Refined headers to 「你嘅可預測度」, 「累計射門熱點圖」, and 「前後兩腳嘅規律」.
  - Rewrote modal dialog messages in natural Cantonese (「結束而家呢場，返主頁？」, 「清晒門將記憶？佢會變返白紙。」, 「已經清晒門將記憶。」).
  - Updated predictability rating tags (e.g. score < 20 is 「完全估唔到 · 毫無破綻」, 40–64 is 「飄忽不定 · 偶有規律」).
  - Dynamically updated team titles on the scoreboard based on turn: 「你 (主射)」/「電腦 (門將)」 vs 「你 (門將)」/「電腦 (主射)」.
- **BM save condition & crossbar flight direction (Review #11)**:
  - Restricted BM shot save to keeper staying in BM (`shotZone === 'BM' && keeperDiveZone === 'BM'`), removing TM dives from saving BM shots.
  - Branched crossbar hit animation into left and right rebounds (`.miss-crossbar-left` and `.miss-crossbar-right`).
- **Test suite enhancements (Review #12)**:
  - `tests/model.test.js` only prints overall success when `passedTests === totalTests`.
  - Added unit test verifying fair uniform dive sampling on tied distributions (fresh model and 1-each-zone history), verifying no zone exceeds 25%.
  - Added unit test verifying `'draw'` match results and invalid data rejection.
  - Allowed dynamic bigram pattern weighting starting from shot 2 (`totalShots >= 2`).
- **Touch polish at 375px (Review #13)**:
  - Ensured `.reset-memory-btn` and sound toggle have at least 44px touch targets.
  - Gated `.zone-cell:hover` under `@media (hover: hover)`.
  - Removed arbitrary 5% minimum from probability bars to reflect raw percentage.
  - Set AI top corner miss rate to 12% to match player and spec.

### 4. Intentionally Not Changed
- **Did not remove 15-round cap**: Kept the 15-round limit (5 regular + 10 sudden-death) as it is directly specified in `SPEC.md` ("sudden death if tied after 5 each, max 10 more each").
- **Kept 6 probability bars rendered on ties**: While no bar is highlighted as primary on ties, all 6 bars remain visible with their uniform ~17% values to clearly convey to the player that the keeper has evaluated all options equally.
- **Did not alter core 6-zone interactive design**: Kept the goal structure and interactive layout conforming to `SPEC.md`.

## Round 2 fixes

Following the code review in `reviews/grok-round-2.md`, all CRITICAL, MAJOR, and sensible MINOR issues have been addressed:

### 1. CRITICAL Fixes
- **Keep clock timeout freeze fix (Review #1)**:
  - Fixed match freeze upon 1.5s countdown expiry in `game.js`. Previously, `cleanTimers()` was called before `handlePlayerDiveChoice('BM', null, true)`, clearing `waitingForInput` and causing `handlePlayerDiveChoice` to bail out.
  - Expiry now clears `keepingTimer` and calls `handlePlayerDiveChoice('BM', null, true)`.
  - In `handlePlayerDiveChoice`, added `timedOut` parameter allowing execution when expired (`if (!timedOut && !gameState.waitingForInput) return;`), followed by `cleanTimers()`. Timeouts scheduled for resolution and `advanceRound()` receive a fresh match token and execute cleanly.

### 2. MAJOR Fixes
- **Modal pause during AI run-up (Review #2)**:
  - Added `gameState.modalOpen`, `gameState.runUpActive`, and `gameState.runUpFinishedWhilePaused` state tracking.
  - Opening any dialog (`showCustomDialog`) sets `modalOpen = true` and pauses pending countdowns.
  - If the 1s run-up finishes while the modal is open or the tab is hidden (`document.hidden`), the countdown does not start in background; instead, `runUpFinishedWhilePaused = true` is flagged.
  - When the modal is cancelled, `resumeKeepingTimer()` triggers the 1.5s countdown with full reaction time; when confirmed, `cleanTimers()` aborts all pending operations.
- **iPhone Safari viewport & double-tap zoom (Review #3)**:
  - Fixed CSS height cascade order on `#game-container` and `body` so `min-height: 100dvh` and `height: 100dvh` are declared last and take precedence over `-webkit-fill-available`.
  - Added `touch-action: manipulation;` on `html` and `.zone-cell` to eliminate iOS double-tap-to-zoom delays and unintentional zooming.
  - Removed duplicated safe-area inset padding on `.stadium-scene` (`padding-bottom: 16px`), retaining safe area insets solely on the root `#game-container`.
- **Sudden-death kick dots layout (Review #4)**:
  - Converted `.kicks-tracker` into a stacked two-row layout (`.kicks-row`) labeled `你` and `電腦`, each with its own full width.
  - Deleted shared `scrollLeft = scrollWidth` manipulation, allowing up to the full 15-kick cap to be clearly displayed on 375px screens without hiding the player's kick dots.
- **Timeout sentences layout on 375px screens (Review #5)**:
  - Updated `.reaction-banner` with `white-space: normal; text-align: center; max-width: calc(100% - 24px); font-size: 1.05rem; line-height: 1.35; width: max-content; box-sizing: border-box;` to prevent text clipping.
  - Shortened timeout feedback strings in `game.js` to concise Cantonese (e.g. 「嚟唔切，留喺中間。好在中楣！」 and 「嚟唔切，留喺中間，被射入！」).
- **Title screen height & scrollport (Review #6)**:
  - Added `min-height: 0;` to `.screen` so flex containers allow scrollports when viewports are constrained.
  - Reduced `.title-graphic` height from 100px to 48px, tightened `.rules-card`, `.rules-list`, and `.memory-status-banner` spacing. The primary start button 「開波！進入大賽」 now sits comfortably above the fold on 375×667 viewports.

### 3. MINOR Fixes
- **Corrupted data sanitization & fallback (Review #7)**:
  - Hardened `init(data)` in `model.js` to deep-sanitize `bigrams` and `trigrams`: only valid zone keys with non-negative finite numeric counts are accepted.
  - Clamped `predictionsTotal` and `predictionsCorrect` to integers `>= 0` with `correct <= total`.
  - Added tracking and sanitization for `matchesDrawn` on `'draw'`.
  - In `chooseDiveZone`, added safety fallback: if any invalid zone or undefined value is sampled, it uniformly samples `ZONES`.
  - In `resetStorage`, set `storageFailed = true` if `localStorage.removeItem()` throws.
- **Goal commentary and reachable BM saves (Review #8)**:
  - Reordered save checks in `game.js`: `shotZone === 'BM' && keeperDiveZone === 'BM'` is now evaluated first so 「門將留守中間，輕鬆沒收！」 is reached.
  - Removed dead `isGoal && keeperDiveZone === shotZone` branch.
  - When `isGoal && predictedZone === shotZone`, updated commentary to 「門將：『估中咗，但撲錯邊……！』」 and subtext to 「門將雖然估中，但撲錯邊，入波！」.
- **Cantonese phrasing & README consistency (Review #9)**:
  - Replaced written Mandarin 「看穿」 with Cantonese 「睇穿」 in `game.js:802` and `index.html:250`.
  - Replaced 「多度變線」 with 「射法多變」 in `model.js:341`.
  - Replaced 「打和！雙方難分勝負！」 with 「打和！分唔到高下！」 in `game.js:1089`.
  - Clarified in `README.md` that the 1s run-up cannot be tapped, and the 1.5s countdown starts right after run-up completes.
- **Predictability score sequence awareness (Review #10)**:
  - Updated `getPredictabilityScore()` in `model.js` to evaluate conditional entropy $H(\text{next} \mid \text{last}) / \log_2(6)$ from the bigram Markov table conditioned on the user's last shot, falling back to marginal entropy if no bigram counts exist.
  - Added unit test in `tests/model.test.js` validating that alternating patterns (TL/BR) score high (>= 90%) while uniform six-way transition patterns score low (<= 10%).
- **Keep bar stalled tick delta (Review #11)**:
  - In `startKeepingCountdown()`, subtracted real tick delta `now - lastTick` instead of capping at 100ms when page is active.
  - Prevented clock deduction while paused, modal is open, or `document.hidden` is active.

### 4. Intentionally Not Changed
- **Did not alter SPEC.md or review files**: In accordance with user instructions, `SPEC.md`, `reviews/`, and `prompts/` were left unmodified.
- **Retained `getShannonEntropy()` as marginal metric**: Retained `getShannonEntropy()` in `model.js` to compute marginal spatial frequency distribution and entropy alongside conditional sequence entropy.
- **Retained 15-round cap and 6-zone shootout structure**: Preserved the core game structure as specified in `SPEC.md`.

## Round 3 fixes

Reviewing `reviews/grok-round-3.md` (which logged a reviewer timeout before findings were written) and performing a full audit against `SPEC.md`, the following issues and polish items were resolved:

### 1. Game Flow & Logic Fixes
- **Sudden-death kick dots exact slot count**:
  - In `game.js`, `renderScoreboard()` previously computed `totalSlots = Math.max(MAX_REGULAR_KICKS, Math.max(playerKicks.length, aiKicks.length) + (isSuddenDeath ? 1 : 0))`. During round 6 after the player's kick, this prematurely rendered a 7th empty dot slot before the AI's 6th kick.
  - Updated to `Math.max(MAX_REGULAR_KICKS, gameState.round, gameState.playerKicks.length, gameState.aiKicks.length)`, ensuring regular time displays 5 slots and sudden-death round $R$ displays exactly $R$ slots for both sides without phantom future dots.
- **Redundant save check clean-up**:
  - In `handlePlayerDiveChoice()`, removed the redundant `else if (shotZone === 'BM' && playerDiveZone === 'BM')` check, as `playerDiveZone === shotZone` already handles this case directly.

### 2. Predictability & Model Enhancements
- **Stationary sequence conditional entropy**:
  - In `model.js`, upgraded `getConditionalEntropy()` to calculate the true weighted Markov transition conditional entropy $H(X_t \mid X_{t-1}) = \sum_{u} P(u) H(X_t \mid X_{t-1} = u)$ across all observed bigram transitions instead of conditioning solely on the last shot's row.
  - This prevents `getPredictabilityScore()` from plummeting (e.g. from 100% to 55%) if the player introduces a single exploratory shot after an established pattern, making sequence predictability robust and mathematically rigorous.
  - Added unit test in `tests/model.test.js` validating resilience of conditional entropy against isolated exploratory shots (12/12 tests passing).

### 3. UI, Touch & Mobile Polish
- **Reaction timer instant initial fill**:
  - In `startKeepingCountdown(initialRemaining)`, immediately set `el.reactionTimerFill.style.width` to the initial percentage upon activation, eliminating a 30ms 100% visual flicker when resuming countdowns.
- **Touch action & touch target sizing**:
  - Expanded `touch-action: manipulation;` in `style.css` to `html, body, button, .zone-cell` to eliminate tap delays and accidental double-tap zooming across all interactive elements on iOS Safari.
  - Added `min-height: 44px; display: inline-flex; align-items: center; justify-content: center;` to `.btn-secondary` to ensure compliance with Apple 44px touch target guidelines.
- **Mind-reading commentary & icon alignment**:
  - Replaced slash-formatted commentary `「門將：『嘩！好彩你呢腳中楣/射出界咋！』」` in `game.js` with distinct branches for crossbars (`「門將：『嘩！中楣彈出，好彩咋！』」`) and off-target misses (`「門將：『嘩！好彩你呢腳射出界咋！』」`).
  - Aligned `#mind-shot-result-pill` initial text in `index.html` to `✓` to match the in-game scoreboard typography.
- **Cantonese phrasing in documentation**:
  - Replaced written Mandarin phrase `（門將閉著眼都能撲中）` in `README.md` with idiomatic Cantonese `（門將瞌埋眼都撲到）`.

### 4. Intentionally Not Changed
- **Did not edit SPEC.md, reviews/, or prompts/**: Strictly adhered to the prompt constraints prohibiting modification of specification and reviewer prompt files.
- **Retained 15-round shootout limit**: Preserved the 5-round regulation plus 10-round sudden death cap and draw resolution at round 15 as mandated by `SPEC.md`.
- **Maintained pure vanilla JS zero-dependency build**: Kept code free of external libraries or build steps, preserving instant double-click operability in browsers and mobile Safari.

---

## v2 Round 2

Full implementation of ROUND 2 ("Both sides + mind games") from `UPGRADE_PLAN.md`:

### 1. Keeper Mode by Swipe (`src/taker.js`, `src/takerAI.js`, `src/main.js`)
- **Alternating Shootout Turns**: Replaced the scripted 75% CPU cut-scene with interactive goalkeeper gameplay. Players now alternate between shooting (striker role) and keeping (goalkeeper role) each round.
- **Procedural 3D Taker**: Created articulated humanoid striker (`src/taker.js`) in away kit with animated run-up, plant foot placement, high-velocity kick swing snap, follow-through landing, celebration, and disappointment poses.
- **Timing Window Mechanics**: Timing matters during the taker's run-up.
  - Early Dive (> 250ms before strike): Taker visibly notices the goalkeeper committing early and immediately punishes by shooting to the open opposite side.
  - Sweet Spot (±200ms around strike): Full dive reach and reaction speed granted.
  - Late Dive (> 220ms after strike): Reaction delay penalty and reach reduction.
- **Taker AI Mind Model (`src/takerAI.js`)**: Pure, fully testable module implementing habit tracking (Markov frequency + bigrams), predicting player dive tendencies, avoiding anticipated dive zones, and punishing early dives.

### 2. Mind-Game Tells and Cantonese Taunts (`src/keeper.js`, `src/taunts.js`)
- **Visual Pre-Kick Tells**: The goalkeeper leans and shuffles toward a side before the strike (`src/keeper.js`), incorporating genuine cues or deceptive bluffs depending on difficulty.
- **Eye-line Gaze Hints**: At Hard and Hell difficulties, subtle head and eye gaze orientation towards the target zone is activated.
- **Cantonese Taunt Speech Bubble**: Integrated in-scene pop-up dialogue bubble with a varied pool of 33 authentic Hong Kong Cantonese lines (`src/taunts.js`) covering habit reads, sequence predictions, glove saves, goals, and early dive punishments for both roles.

### 3. In-Scene 3D Mind-Reading Reveal (`src/fx.js`)
- **6-Zone Goal Mouth Heat Overlay**: Replaced the single ring with real-time 3D translucent planar overlays across all 6 goal zones (`TL`, `TM`, `TR`, `BL`, `BM`, `BR`) displaying live percentage confidence tags and heatmap coloration (crimson for high probability, purple for medium, cyan for low).
- **Physical Collision Markers**:
  - Gold glowing ring + dot marking the exact 3D crossing coordinates where the ball entered/passed the goal frame.
  - Electric cyan ring marking the goalkeeper's peak reach volume at the time of crossing.

### 4. Slow-Motion Replay of Deciding Kicks (`src/scene.js`, `src/main.js`, `style.css`)
- **Broadcast Side TV Angle**: Camera transitions smoothly to a dramatic side broadcast angle (`x = 5.8m, y = 1.8m, z = 4.2m`) focusing on the goal mouth.
- **0.25x Slow-Motion Playback**: Renders the decisive kick and goalkeeper response in ultra-smooth slow motion.
- **Replay Watermark & Skip**: Red blinking `🔴 重播 (REPLAY)` badge and 44px tap target `跳過 ➔` (Skip) button.

### 5. Four Difficulty Levels (`src/difficulty.js`, `index.html`, `style.css`)
- **Difficulty Selection Chips**: Added title screen selector with 4 tiers (🟢 易 / 🟡 中 / 🟠 難 / 🟣 地獄).
- **Multi-Factor Scaling**: Directly modulates keeper reaction delay (120ms to 220ms), reach multiplier (0.38m to 0.48m), predictor habit weight (0.55 to 0.98), tell honesty (35% to 90%), gaze hints, and taker corner accuracy (25% to 85%).
- **Persistence**: Player selection persists in `localStorage`.

### 6. Visual Polish & Clear Readability (`src/scene.js`, `src/tuning.js`)
- **Tiered Concrete Terraces**: Built 10 visible stepped concrete risers with structural edge trims, rear grandstand wall, overhead roof canopy, and structural steel support trusses.
- **Pitchside LED Ad Boards**: Installed dynamic scrolling LED perimeter barrier boards behind the goal net featuring animated typography ("⚽ 12碼讀心戰" & "⚡ AI 讀心大對決").
- **Enlarged Ball Radius**: Increased size 5 football radius to 0.135m in `src/tuning.js` for crisp, unmistakable flight readability at iPhone portrait (390×844).

### 7. Comprehensive Unit Tests (`tests/`)
- Total **7 test suites and 58 passing tests**:
  - `tests/model.test.js` (14 / 14 pass)
  - `tests/shot.test.js` (6 / 6 pass)
  - `tests/keeperAI.test.js` (6 / 6 pass)
  - `tests/input.test.js` (3 / 3 pass)
  - `tests/difficulty.test.js` (3 / 3 pass)
  - `tests/takerAI.test.js` (4 / 4 pass)
  - `tests/taunts.test.js` (22 / 22 pass)
- Added `tests/capture_r2_screenshots.js` validating the complete end-to-end flow via Chrome DevTools Protocol at 390×844 resolution, generating 7 verified screenshots (`screenshots/v2/r2-01` through `r2-07`).

---

## v2 Round 2 fixes

Following the code review in `reviews/grok-v2-r2.md`, all CRITICAL and MAJOR issues and sensible MINOR issues have been completely addressed:

### 1. CRITICAL Fixes
- **CPU Taker Target Property Access (CRITICAL #1)**:
  - Fixed property mismatch in `src/main.js` (`_onCpuTakerStrike` was accessing `takerDecision.target.x`).
  - Updated to read `takerDecision.targetPoint || takerDecision.target`.
  - Added `target: targetPoint` alias in `src/takerAI.js` `decideShot()` to guarantee backward and forward compatibility.
- **Simulate-Compatible Launch for CPU Strike (CRITICAL #2)**:
  - Replaced manual raw velocity object with `pointToLaunch(targetPoint, speed, curve, tuning)` in `src/shot.js` and `src/main.js`.
  - Computes exact ballistic launch velocity compensating for gravity, aerodynamic quadratic drag, and Magnus curve.
  - Added unit test in `tests/shot.test.js` verifying that `simulate(pointToLaunch(...))` runs without throwing and reaches the goal plane.
- **Taker AI Dive Recording Method (CRITICAL #3)**:
  - Corrected method call in `src/main.js` from `this.takerAI.recordDive` to `this.takerAI.recordPlayerDive(actualDiveZone)`.
  - Added `recordDive` alias in `src/takerAI.js` to prevent any runtime exceptions if called under either name.

### 2. MAJOR Fixes
- **Keeper-Mode Swipe Zone Mapping (MAJOR #4)**:
  - In `src/main.js` `_onPlayerKeeperSwipe`, replaced invalid property lookups (`launch.vx`, `launch.targetY`) with `launch.target` coordinates and `getZoneFromPoint(targetX, targetY, TUNING)`.
  - Player swipes now accurately and reliably map to all 6 goal zones (`TL`, `TM`, `TR`, `BL`, `BM`, `BR`).
- **Difficulty Scaling Alignment for Keeper AI (MAJOR #5)**:
  - In `src/keeperAI.js` `decide()`, aligned parameter lookup to consume `difficulty.keeperReactTime ?? difficulty.reactionDelay ?? null` and `reachMultiplier = difficulty.keeperReach / tuning.keeper.gloveReachRadius`.
  - Added alias mappings in `src/difficulty.js` across all 4 tiers (`EASY`, `MEDIUM`, `HARD`, `HELL`).
  - Added test in `tests/difficulty.test.js` verifying `decide(probs, getDifficultyConfig('HELL')).reactTime === 0.11`.
- **Dedicated Keeper-Turn Camera Rig (MAJOR #6 & MINOR #11)**:
  - In `src/scene.js`, added `'KEEPER'` camera mode with `keeperCameraPos = (0, 2.35, 18.2)` and `keeperLookTarget = (0, 1.15, 1.0)`.
  - In `startKeeperTurn()`, camera switches to `'KEEPER'`; in `startPlayerTurn()`, camera switches to `'MAIN'`.
  - Moved striker run-up starting position to `(-0.65, 0, 14.2)` in `src/taker.js` (≥3.2m behind spot and ≥4.0m in front of camera), framing the entire goal, goalkeeper, and human-sized striker without obstruction.
- **Seated 3D Spectators on Stepped Terraces (MAJOR #7)**:
  - Replaced flat billboard planes with 260 true 3D seated spectators (articulated torso box `0.38×0.44×0.28m` + head box `0.20×0.22×0.20m`) sitting directly on the concrete steps.
  - Desaturated realistic stadium kit colors (navy, slate, burgundy, forest green, warm amber, charcoal) and skin/hair tones.
  - Synchronized torso and head crowd cheering bobbing in `src/scene.js`.
- **In-Scene Mind-Reading Reveal Unwrapping (MAJOR #8)**:
  - In `src/main.js` `_onKeeperTurnCrossing`, passed `diveProbs` directly without re-wrapping as `{ probabilities: diveProbs }`.
  - Passed 2D goal-mouth glove reach coordinates `{ x, y }` to `this.fx.showMindReadingReveal` instead of the 3D root group.
  - Added HUD reveal pill in keeper mode displaying player's dive habit recognition.
- **Deciding Kick Slow-Motion Replay (MAJOR #9)**:
  - In `src/main.js` `triggerDecidingReplay()`, stashed the deciding kick snapshot (`trajectory`, `sim`, `divePlan`, `saveCheck`, `isGoal`, `isKeeperTurn`).
  - Rewinds ball and keeper poses to $t=0$, resets trajectory clock, and replays the actual trajectory at 0.25x slow motion from the side broadcast camera.
  - User can watch the replay or click 「跳過 →」 (`btn-skip-replay`) to immediately transition to the end screen.

### 3. Verification & Testing
- **Integration Test Suite**: Created `tests/match_integration.test.js` running 5-round shootouts across all difficulty tiers (`EASY`, `MEDIUM`, `HARD`, `HELL`) and verifying early dive punishment.
- **Browser CDP End-to-End Suite**: Created `tests/full_match_e2e.js` simulating a live 5+5 shootout in headless Chrome at iPhone 390×844 resolution, confirming 0 PAGEERROR, proper turn alternations, and valid end-screen display.
- **Updated Screenshots**: Re-captured all 7 reference screenshots (`screenshots/v2/r2-01` through `r2-07`) at 390×844 @ 2x.
- **Test Pass Count**: Total 8 test suites and 65 tests passing 100% green:
  - `tests/model.test.js` (14/14)
  - `tests/shot.test.js` (7/7)
  - `tests/keeperAI.test.js` (6/6)
  - `tests/input.test.js` (3/3)
  - `tests/difficulty.test.js` (4/4)
  - `tests/takerAI.test.js` (4/4)
  - `tests/taunts.test.js` (22/22)
  - `tests/match_integration.test.js` (5/5)

---

## v2 Round 3

Implementation of ROUND 3 of `UPGRADE_PLAN.md` ("Reason to come back") — World Cup Tournament, Unlocks, Trophy Cabinet, Share Card, and Performance Optimization:

### 1. 2026 World Cup Tournament System (`src/tournament.js`)
- **16 National Teams**: Real names in Traditional Chinese (`香港`, `日本`, `巴西`, `阿根廷`, `英格蘭`, `法國`, `德國`, `西班牙`, `意大利`, `葡萄牙`, `荷蘭`, `克羅地亞`, `南韓`, `烏拉圭`, `摩洛哥`, `墨西哥`) with authentic national kit colors and flags.
- **Knockout Bracket Screen (`#screen-tournament`)**:
  - Full single-elimination tournament progression: 16強 (R16, 8 matches) → 8強 (QF, 4 matches) → 4強 (SF, 2 matches) → 決賽 (Final, 1 match).
  - Dynamic simulation of remaining AI matches with realistic shootout scorelines.
  - Interactive bracket match rows displaying team flags, names, and scores.
- **Opponent Keeper & Taker Personalities**:
  - Each national team features distinct goalkeeper and striker traits:
    - Goalkeepers: 沉著守候 (patient), 神經刀 (early diver), 撲救學徒 (learner), 門線老油條 (bluff master), etc.
    - Strikers: 重砲爆射 (power blaster), 死角狙擊 (corner sniper), 虛晃大師 (deceptive), etc.
- **Natural Difficulty Progression**:
  - Seamless ramping from R16 (`EASY`) → QF (`MEDIUM`) → SF (`HARD`) → Final (`HELL`).
- **Quick Single Match Coexistence**:
  - Players can choose between World Cup Tournament and Quick Match directly from the Title Screen.

### 2. Stars per Match, Locker Room Unlocks & Trophy Cabinet (`src/unlocks.js`)
- **Performance-Based Star Currency**:
  - Awarded per match based on achievements: win (+1⭐), clean sheet (+2⭐), ≥3 saves (+2⭐), low predictability ≤30% (+2⭐), tournament win (+3⭐), tournament champion (+10⭐).
- **Locker Room (`#screen-locker`)**:
  - Category tabs for Balls, Kits, Stadiums, and Trophies.
  - **4 Procedural Ball Skins (`src/ball.js`)**:
    - 經典黑白 (Classic) — Default.
    - 烈焰烈火 (Fire Blast) — Red/orange flame gradient with fiery particle trail (cost: 5⭐).
    - 數碼生化 (Cyber Neon) — Cyan neon circuitry with glowing trail (cost: 8⭐).
    - 尊貴純金 (Gold Champions) — 24K gold metallic shine with dual gloss (cost: 15⭐).
  - **4 Team Kit Styles**:
    - 經典主場 (Classic Home), 街頭霓虹 (Street Neon), 黑金尊爵 (Black & Gold), 復古條紋 (Retro Stripes).
  - **3 Stadium Atmospheres (`src/scene.js`)**:
    - 夜場泛光燈 (Night Floodlights) — Default night lights.
    - 黃昏日落 (Sunset Dusk) — Warm sunset sky gradient and twilight shadows (cost: 6⭐).
    - 明媚白晝 (Daylight Pitch) — Bright daylight sun and lush green pitch (cost: 6⭐).
- **Trophy Cabinet (6 Trophies)**:
  - 🏆 **世界盃冠軍金盃 (Champion)**: Win the 16-team tournament.
  - 🥈 **世界盃亞軍銀牌 (Runner-Up)**: Reach the World Cup final.
  - 🥉 **世界盃季軍銅牌 (Semi-Finalist)**: Reach the World Cup semi-final.
  - 🧤 **金手套神撲獎 (Golden Glove)**: Make ≥ 3 saves in a single match.
  - ⚽ **百步穿楊神射王 (Dead Eye)**: Score 100% of all regulation kicks (5/5).
  - 🧠 **心理戰讀心狂魔 (Mind Master)**: Achieve predictability score < 25%.
- **Safe Persistence**: Robust `localStorage` serialization with fallback handling for missing or corrupt data.

### 3. Canvas Share Card & Native Web Share (`src/share.js`)
- **High-Resolution 780×1200 Canvas Generation**:
  - Renders match results, national team flags, score pill, star bonus, Shannon predictability score gauge with Cantonese rating, and a 2×3 mini goal heatmap.
  - Dynamic Cantonese CTA quote tailored to outcome (e.g. 「我喺《12碼讀心戰》射爆門將，捧走世界盃！你敢唔敢入嚟挑戰？」).
- **Multi-Tier Sharing Support**:
  - Primary: Native `navigator.share` with file payload (direct sharing to WhatsApp, Instagram Stories, AirDrop).
  - Fallback: Automatic PNG file download and mobile-friendly long-press image modal (`#share-card-modal`).

### 4. Polish, Performance & Speed Pass
- **Tab Visibility Pause**: Listens to `document.visibilityState` to pause WebGL rendering and suspend WebAudio context when switching tabs or backgrounding on iOS, saving battery and preventing runaway physics delta ticks.
- **DPR Capped at 2.0**: Prevents 3x Retina displays from rendering 9x pixel fill rates while maintaining razor-sharp visuals.
- **Accessibility & Motion**: Fully respects `prefers-reduced-motion`, skipping screen shake and hit-stop freeze frames.
- **Mobile-First Layout Polish**: 44px minimum tap targets on all buttons, safe-area inset margins, and zero horizontal overflow on iPhone Safari 390×844.

### 5. Procedural Humanoid & Atmosphere Upgrades (`ASSETS.md`)
- **Dynamic Team Kit Coloring**: Goalkeeper and striker procedural humanoids dynamically tint jersey, shorts, socks, and gloves according to active national team kit colors.
- **Spectator Team Colors**: Pitchside crowd spectators color-shift to match the competing nations.
- **100% Procedural Guarantee**: Zero external model or texture downloads; all geometries, canvas textures, and audio synthesis are generated offline in-browser. Documented in `ASSETS.md`.

### 6. Test Suites & Verification
- Total **10 test suites and 75 tests passing** (100% green):
  - `tests/model.test.js` (14/14)
  - `tests/shot.test.js` (7/7)
  - `tests/keeperAI.test.js` (6/6)
  - `tests/input.test.js` (3/3)
  - `tests/difficulty.test.js` (4/4)
  - `tests/takerAI.test.js` (4/4)
  - `tests/taunts.test.js` (22/22)
  - `tests/match_integration.test.js` (5/5)
  - `tests/tournament.test.js` (5/5)
  - `tests/unlocks.test.js` (5/5)
- Automated Headless Chrome CDP Verification:
  - `tests/r3_e2e_test.js`: Verified tournament flow, locker room, match completion, stars, and share card generation with 0 console errors.
  - `tests/full_match_e2e.js`: Verified complete 5+5 shootout match in real browser with 0 console errors.
  - `tests/capture_r3_screenshots.js`: Captured 8 reference screenshots at 390×844 resolution in `screenshots/r3-390/`.



