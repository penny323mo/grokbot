# 《夜峠》Midnight Touge — Changelog

All notable changes and milestones for the development of **《夜峠》Midnight Touge** are documented in this file.

## [1.0.0] - 2026-10-29

### 3D Asset Pipeline & Procedural Blender Generation
- **Vehicle Models (`assets/models/`)**:
  - `car_rs86.glb`: 1980s FR lightweight sports coupe with two-tone panda livery, bevelled body panels, flip-up headlights, deep-dish Watanabe 8-spoke wheels, front chin spoiler, and sport exhaust.
  - `car_st20.glb`: 1990s AWD rally turbo coupe with quadruple projector headlamps, aggressive front bumper ducts, Enkei-style split multi-spoke wheels, and high-downforce GT rear wing.
  - `car_rx7.glb`: Twin-rotor sequential turbo sports coupe with sculpted aerodynamic rakes, widebody fender flares, vented hood, low-profile pop-up housings, and dual cannon exhaust tips.
  - Procedural Blender generation script `blender/make_cars.py` using Blender 5.2.3 LTS with smooth shading, bevelled edges, disc brake calipers, clearcoat paint, and dark glass materials.
- **Track Geometry (`assets/models/track_kirine.glb`)**:
  - 2.99 km continuous mountain pass modeled after Kirine Pass (霧嶺).
  - Vertical descent from 210m elevation down to 20m above sea level with varying gradients.
  - Five consecutive hairpins (五連髮夾彎), flowing esses, camber banking on apices, inner concrete drainage gutters, galvanized corrugated steel guardrails, and roadside cedar trees.
  - 45 evenly distributed sodium streetlight poles casting pools of amber illumination.
  - Distant valley floor twinkling city light particle constellation.
- **PBR Textures (`assets/textures/`)**:
  - High-resolution road asphalt diffuse, roughness, and normal maps.
  - Mountain rock cliff diffuse texture.
  - Galvanized guardrail metallic texture.
  - Cedar leaf alpha foliage texture.
  - Analog tachometer face dial texture.

### Audio Pipeline & Eurobeat Soundtrack
- **Original Eurobeat Soundtrack (`assets/audio/eurobeat_kirine.mp3`, `.ogg`)**:
  - Original 155 BPM touge soundtrack ("Running in the Touge") with syncopated basslines, 90s supersaw leads, brass stabs, and arcade drum rhythms.
  - Seamlessly loopable with balanced mastering (zero distortion clipping).
- **Interactive Sound Effects (`assets/audio/`)**:
  - Multi-tier tyre squeals (`tyre_squeal_low.wav`, `tyre_squeal_high.wav`) dynamically triggered by slip angle and lateral load.
  - Guardrail metallic scrape sound (`wall_scrape.wav`).
  - Turbo blow-off valve flutter hiss (`turbo_bov.wav`).
  - Transmission gear shifts (`gear_shift.wav`).
  - Countdown beeps and starting fanfare (`countdown_beep.wav`, `countdown_go.wav`).
  - UI tactile confirmation sounds (`menu_click.wav`).

### Vehicle Dynamics & Physics Engine (`src/physics/`)
- **VehiclePhysics (`vehicle-physics.js`)**:
  - Arcade-sim hybrid handling model tuned specifically for mobile touch controls.
  - Rear-wheel drive dynamics with longitudinal weight transfer (dive under heavy braking, rear squat under acceleration) and lateral roll.
  - Slip angle drift calculation with entry handbrake / feint flick mechanics.
  - Mobile counter-steer assistance ensuring controllable drift angles without sudden snap-oversteer spinouts.
  - Gutter drop (溝落とし) mechanic providing a 30% cornering grip multiplier when inside wheels drop into concrete gutters.
  - Progressive wall collision response scrubbing forward speed and repelling the car safely without jarring hard crashes.
  - 5-speed transmission gearing with automatic/manual throttle support.
- **TrackCollision (`track-collision.js`)**:
  - Efficient spline nearest-neighbor search for track progress, sector splits, and lap time telemetry.
  - Precise lateral boundary detection against guardrails and cliff walls.
  - Inside gutter proximity detection on hairpin corners.

### Rendering & Camera System (`src/render/`, `src/world/`)
- **Atmospheric Night Lighting (`lighting-weather.js`)**:
  - ACES filmic tone mapping with deep midnight teal palette (`#0B1418`, `#142630`).
  - High mountain moonlight directional light (`#98C8E0`) casting down the pass.
  - Dual dynamic forward projected headlight spot beams illuminating asphalt gravel texture.
  - Dynamic rear taillights flaring bright crimson (`#E0322B`) under braking.
  - Three weather presets: 深夜 (Midnight Touge), 黎明霧 (Dawn Mist), 雨夜 (Rainy Night).
- **Particle System (`particles.js`)**:
  - Dynamic tyre smoke puffs emitted during sustained drifts.
  - High-velocity spark showers emitted when grazing guardrails.
- **Multi-Angle Camera System (`camera-controller.js`)**:
  - Chase camera with lateral drift lead-in and speed-dependent FOV dilation.
  - Low-slung front bumper camera for visceral speed sensation.
  - Right-hand-drive (右軚) cockpit perspective with dashboard framing.

### UI / HUD & Mobile Optimization (`src/render/`, `css/style.css`)
- **Mobile-First Portrait Layout (390×844 iPhone Safari)**:
  - Zero CDN dependencies; self-hosted Barlow Condensed motorsport fonts (`BoldItalic`, `SemiBold`, `Medium`, `BlackItalic`).
  - Noto Sans HK / Noto Serif TC typography throughout with authentic Cantonese / Hong Kong localization.
  - Ergonomic touch steering zones (left/right) with dedicated Handbrake/Drift pad and Brake pedal.
  - Complete telemetry cluster: analog tachometer sweep, digital speed readout, current gear, lap timer, sector split differentials, and mountain elevation progress bar.
  - Dynamic drift callout banner displaying active slip angle and accumulated drift points.
  - Gutter Drop notification badge and Battle mode lead/chase gap meter.
  - 3D interactive garage showroom with touch turntable, car statistics, color swatches, and coin unlock progression.
  - 12-stage mountain pass route selector.

### Testing & Headless Playthrough Verification
- 15/15 unit tests passing under `node --test tests/*.test.mjs` (`npm test`).
- Automated headless Playwright playthrough executed at 390×844 with 0 console errors.
- 10 reference review screenshots captured to `screenshots/review-1/`.

## Round 1 fixes

### Critical Fixes
- **Unified UI Screen Callbacks**: Fixed callback disconnect between `ui-screens.js` and `engine.js`. Title START button now triggers `onStartGame` / `onSelectEvent(1)`, Results NEXT triggers `onNextEvent`, and RETRY triggers `onRetryEvent`. Added `onStartEvent` fallback handler.
- **Medal Resolution & Progression Engine**: Replaced undefined property lookups with accurate branching based on `event.mode`:
  - `time_attack` / `free_run` checks `timeTargets` (`gold`, `silver`, `bronze`).
  - `drift_challenge` checks `scoreTargets` (`gold`, `silver`, `bronze`) against accumulated `driftScore`.
  - `battle` computes time gap in seconds against `targetGap`.
  - Awards stage `rewardCoins[medal]` and unlocks consecutive stages in `storage.js`.
- **Sector Start & Target Distance Navigation**: Implemented `TrackCollision.setSector(startDist, targetDist, direction)` so stage runs spawn at the waypoint corresponding to `startDist` and complete when reaching `targetDist` (e.g. Stage 1 sector 0–1250m, Stage 3 hairpins 1250–2150m).
- **Uphill Finish Prevention**: Corrected uphill stage initialization (`direction: "uphill"`) so spawning at the bottom of the pass does not trigger instant finish during countdown or initial ticks. Races only finish when downhill distance reaches `targetDist` or uphill distance drops to summit `targetDist`.
- **Authentic Battle Mode with Real Rivals**: Enabled automatic rival spawning whenever `mode === "battle"` or `isBattle === true`. Loads rival car (`car_gt20`, `car_re7`, `car_h86`), advances rival along track spline, and displays real-time lead/chase time gap meter.

### Major Enhancements
- **Ghost Replay Architecture**: Added trajectory sampling during racing at 10 Hz (`{t, x, y, z, heading, speed}`). Saves replay frames to `storage.data.ghostData[stageId]` on personal best times and spawns a semi-transparent ghost car (`ghostRig`) that replays the run.
- **練習 Free Run Mode**: Authored `FREE_RUN_EVENT` ("自由練習 · 全線漫遊") accessible via a dedicated route map banner for untimed touge practice with manual return to garage.
- **In-Car Right-Hand Drive Cockpit View with Rear-View Mirror**: Configured a secondary backward-facing camera (`rearCamera`) rendered into a top-center scissor viewport with a metallic rear-view mirror bezel overlay (`cockpit-mirror-frame`) when in cockpit camera mode.
- **Atmospheric Post-Stack, Rain Volume & Continuous Skid Marks**:
  - Implemented 3D rain particle volume (`rainMesh`) active during `rainy_night`.
  - Added dynamic continuous skid mark ribbon generator (`addSkidSegment`) depositing tire marks during drift slides.
  - Added screen-space post-processing layers: filmic lens vignette, 35mm film grain, speed-scaled chromatic aberration, and peripheral motion blur speed lines.
- **Single-Handler Camera Switch**: Fixed duplicate event bubbling on `#btn-cam-switch` so tapping CAM smoothly cycles from Chase → Bumper → Cockpit without skipping.
- **Wall Collision Contact Cooldown**: Separated frame-by-frame physics penetration correction from audio, camera shake, and spark emissions using a 180ms cooldown to prevent harsh audio buzzing.
- **Spec-Compliant Original Invented Names**: Removed all copyright-adjacent names and badges:
  - Cars: `H-86 白疾` (`car_h86.glb`), `GT-20 烈風` (`car_gt20.glb`), `RE-7 轉子夜影` (`car_re7.glb`).
  - Rivals: `黑曜車手 · 峰`, `赤焰之翼 · 凌雲`, `山道宿老 · 峰雲`.
- **Mountain Route Elevation Profile Map & Vector Badges**: Replaced generic card stack and emoji placeholders with an interactive SVG mountain elevation profile descending from 210m to 20m, clickable waypoint nodes, and bespoke vector SVG medal badges (金/銀/銅) and weather marks (深夜 moon, 黎明 mist, 雨夜 rain).

### Minor Polish & Test Suite Expansion
- **Vehicle Tuning Power Multiplier**: Integrated `carData.tuning.powerMultiplier` directly into vehicle physics engine wattage calculation.
- **Drift Combo Multiplier Scoring**: Fixed drift score accumulation so delta points are multiplied by `driftMultiplier` combo scaling.
- **Game Settings Sheet & Tilt Steering Support**: Built settings modal allowing players to configure Auto/Manual throttle, Touch Zones vs Device Tilt steering, and Audio volume.
- **Expanded Test Coverage**: Added tests in `tests/storage.test.mjs`, `tests/track.test.mjs`, `tests/physics.test.mjs`, `tests/events_battle.test.mjs`, and `tests/headless_load.test.mjs`, bringing total test suite to 27/27 passing unit tests (0 failures).

## Round 2 fixes

### Critical Fixes
- **Spline Tracker Monotonicity & Hairpin Switchback Protection**:
  - Rewrote waypoint progression in `src/physics/track-collision.js` to advance strictly by adjacent segment projection along the travel direction (`step = isUphill ? -1 : 1`).
  - Completely prevents jumping onto lower loops across hairpin switchbacks where roads are 0.49m apart in XY but 200m apart on the spline.
  - Preserved artificial test teleports via distance threshold (`curDistSq > 625`).
  - Added unit test in `tests/track.test.mjs` verifying that walking the centerline at 8m steps maintains strictly monotonic along-track distance across all 5 hairpins.
- **Double Event Start Elimination & Model Load Cancellation**:
  - Fixed `.btn-stage-enter` listener in `src/render/ui-screens.js` using exclusive callback execution (`if (this.callbacks.onStartEvent) onStartEvent(evt); else if (this.callbacks.onSelectEvent) onSelectEvent(evt.id);`).
  - Added generation counters (`this.rivalLoadGen`, `this.ghostLoadGen`) in `src/core/engine.js` to automatically discard stale async model loading resolutions when a new session starts, preventing orphaned duplicate car meshes.

### Major Enhancements
- **True Battle Gap Seconds & Medal Resolution**:
  - Implemented shared `resolveMedal(event, result)` in `src/data/events.js` and wired into `finishRace()`.
  - Authored realistic `rivalTargetTime` across all battle stages (Stage 4: 124s, Stage 7: 118s, Stage 9: 132s, Stage 11: 114s, Stage 12: 110s) based on stage length and target lead gap.
  - Tracked rival arrival clock (`this.rivalFinishTime`) and computed real-time gap `gapSeconds = rivalArrival - totalTime`.
  - Awarded medals strictly against `targetGap` bands with no `|| isVictory` shortcut (0.2s lead awards bronze, not silver; defeat awards no medal).
  - Updated `tests/events_battle.test.mjs` to test `resolveMedal` directly.
- **Sector-Relative Mountain HUD Progress Bar**:
  - Scaled progress bar in `src/render/hud-renderer.js` to event sector span `(progressDist - 0) / totalSectorSpan` based on `event.startDist` and `event.targetDist`.
  - Handled uphill stage direction so progress bar fills as the car climbs from foot to summit.
  - Sector telemetry split displays remaining distance `剩 Xm` to target instead of raw metres.
- **Framebuffer Post-Processing & Speed Chromatic Aberration**:
  - Implemented Three.js framebuffer offscreen rendering pipeline using `THREE.WebGLRenderTarget`, custom `THREE.ShaderMaterial`, orthographic post camera, and full-screen quad in `src/core/engine.js`.
  - Multi-tap bright bloom pass applied to headlights, taillights, and sodium lamps.
  - Radial chromatic aberration driven by `this.speedAberrationRatio = speedRatio > 0.35 ? (speedRatio - 0.35) / 0.65 : 0.0`.
  - Maintained DPR-scaled framebuffer resize in `onResize()`.

### Minor Polish
- **Car ID Alias Resolution in `loadPlayerCar`**:
  - Updated `loadPlayerCar(carId)` to resolve aliases via `getCarById(carId)`.
  - Defaulted boot car to `"h86"`.
- **HUD Battle Badge Name Fallback**:
  - Replaced fallback in `src/render/hud-renderer.js` with `getCarById(eventData.rivalCar || 're7').name`.
- **Cockpit Mirror Bezel & Scissor Rect Alignment**:
  - Defined unified `COCKPIT_MIRROR_CONFIG` (`{ width: 172, height: 65, top: 12 }`) shared by CSS custom properties and WebGL scissor calculations.
  - Synced `rearCamera.aspect` to `COCKPIT_MIRROR_CONFIG.width / COCKPIT_MIRROR_CONFIG.height`.
  - Guaranteed pixel-for-pixel alignment between HTML bezel frame and WebGL mirror viewport.
- **Test Suite & Playthrough Validation**:
  - 28/28 unit tests passing under `npm test` (0 failures).
  - Headless Playwright playthrough executed at 390×844 with 0 console errors, refreshing all 10 review screenshots in `screenshots/review-1/`.

## Round 3 fixes

### Critical Fixes
- **Guardrail Continuous Slide Speed & Yaw Preservation**:
  - Updated `applyWallCollision(normalX, normalY, penetration, isInitialImpact)` in `src/physics/vehicle-physics.js` so penetration is resolved and normal velocity into the wall is removed every frame, but the 0.82 forward speed scrub and 0.3 yaw rate damping are applied only once per contact (`isInitialImpact = (this.wallScrapeCooldown <= 0)`).
  - Continuous contact with guardrails now preserves tangential forward speed and momentum without bringing the car to an abrupt stop.
  - Added unit test in `tests/physics.test.mjs` verifying that holding a car in the guardrail for 0.5s preserves forward speed above 50%.

### Major Enhancements
- **Live Battle Gauge Clock & Arrival Gap Synchronization**:
  - Updated `src/core/engine.js` `updateRacing()` to compute projected arrival time gap every racing frame (`rivalArrival - playerArrival`) using rival finish time or remaining course distance over rival pace, passing `rivalProgress.gapSeconds` directly to the HUD.
  - Aligned live on-screen LEAD/CHASE telemetry with `finishRace()` and `targetGap` medal evaluation.
  - Dropped instantaneous speed-dependent metre fallback in `src/render/hud-renderer.js` to eliminate erratic gauge jumps when braking into corners.
- **HDR Half-Float Framebuffer Bloom & Post-Shader ACES Tone Mapping**:
  - Upgraded `this.mainRenderTarget` in `src/core/engine.js` to `THREE.HalfFloatType` with `depthBuffer: true`, eliminating 8-bit clipping on high-intensity headlights, taillights, and sodium lamps prior to post-processing.
  - Set `toneMapped: false` on `this.postMaterial` and integrated Narkowicz ACES Filmic curve at the end of the post fragment shader after the multi-tap bloom pass.
  - Uncapped HDR headlight and sodium light values (> 0.75) spread naturally through the bloom pass into neighboring pixels.

### Minor Polish
- **Multi-Path Garage Vehicle Unlocking & Contextual Feedback**:
  - Expanded `storage.unlockCar()` in `src/core/storage.js` to grant unlock for GT-20 upon earning 3 gold medals (`getTotalMedals().gold >= 3`), and RE-7 upon winning Stage 12 with gold (`stageProgress[12]?.medal === "gold"`), alongside the existing coin purchase route.
  - Updated `src/render/garage-view.js` to display informative alert dialogs indicating the specific missing requirements (gold medals or coins) when unlock attempt fails.
  - Added unit tests in `tests/storage.test.mjs` verifying dual-path medal and coin unlocks without unexpected coin deductions.
- **Test Suite Expansion & Headless Validation**:
  - Expanded test suite to 30/30 unit tests passing under `npm test` (0 failures).
  - Executed automated headless Playwright playthrough at 390×844 with 0 console errors, refreshing all review screenshots in `screenshots/review-1/`.

## Round 4 fixes

### Critical Fixes
- **Locked Vehicle Garage Preview & Race Load Generation**:
  - Updated `onSelectCar` in `src/core/engine.js` to inspect `storage.selectCar()`: locked cars are loaded as 3D visual previews on the turntable without replacing `this.playerPhysics` or modifying active car selection.
  - Added generation counter `this.playerLoadGen` to `loadPlayerCar` to immediately discard stale async model resolutions.
  - Guarded chassis reset to waypoint 0 to skip when `state` is `COUNTDOWN` or `RACING`, preventing mid-race teleports back to summit.
  - At the start of `startEvent()`, explicitly loaded the player's saved unlocked car: `await this.loadPlayerCar(storage.data.selectedCarId || "h86")`.

### Major Enhancements
- **Enabled Medal Unlock CTA & Predicate Synchronization**:
  - Added `storage.canUnlockCar(carId, price)` predicate evaluating medal achievements (`getTotalMedals().gold >= 3` for GT-20, Stage 12 gold for RE-7) as well as coin wallet.
  - In `src/render/garage-view.js`, enabled the unlock CTA button whenever `canUnlockCar` succeeds, removing the `is-disabled` pointer-event lock.
  - Dynamically labeled the button with the medal path (e.g. 「榮譽解鎖 · 達成 3 枚金牌！」) when coins are short, allowing zero-coin medal claims.
  - Added unit test in `tests/storage.test.mjs` verifying that 3 golds and 0 coins enables the unlock button and successfully unlocks `gt20`.
- **iOS Safari DeviceOrientation Permission Flow**:
  - Updated steering preference toggle in `src/render/ui-screens.js` to request permission via `DeviceOrientationEvent.requestPermission()` from user touch gesture on iOS Safari.
  - Gracefully falls back to touch zones with on-sheet notification if permission is denied or unsupported.

### Minor Polish
- **Accurate Live Battle Gap Player Speed Projection**:
  - Projected player remaining arrival time in `src/core/engine.js` `updateRacing()` using `Math.max(8.0, p.speed)` while keeping rival on `rivalSpeed` (or `rivalFinishTime`).
  - Accurately conveys true lead time differentials during high-speed downhill sections.
- **Test Suite & Headless Playthrough Verification**:
  - All 30 unit tests passing under `npm test` (0 failures).
  - Executed automated headless Playwright playthrough at 390×844 with 0 console errors, refreshing all review screenshots in `screenshots/review-1/`.

## Round 5 fixes

### Critical Fixes
- **Brake Clamping at Full Stop & Directional Deceleration (`src/physics/vehicle-physics.js`)**:
  - Rewrote braking deceleration so braking torque opposes `vForward` and clamps deceleration strictly at 0 m/s without crossing through zero into negative reverse velocity.
  - Held brake pedal at rest clamps `vx`, `vy`, `speed`, and `speedKmh` to 0.0, eliminating unintentional reverse acceleration.
  - Renamed the HUD brake pedal subtitle from `減速 · 倒車` to `腳煞 · 減速` in `src/render/hud-renderer.js`.
  - Added unit test in `tests/physics.test.mjs` verifying a car traveling at 20 m/s, braked for 5 s, comes to a complete rest at 0 m/s and does not travel backward.

### Major Enhancements
- **Battle Rival Start Synchronization (`src/core/engine.js`)**:
  - Suppressed AI rival updates during the 3.5 s starting lights countdown by checking `!isIdle` before calling `updateRival(dt)`.
  - Initialized `rivalDistance` to `startDist ± 15` on the exact frame the race transitions to `RACING`.
  - Executed the racing update on the zero frame of `updateCountdown(dt)` so the rival does not gain any unfair lead or delay during the GO frame.
- **Manual Throttle Pedal Support for Mobile (`src/render/hud-renderer.js`, `css/style.css`, `src/render/ui-screens.js`)**:
  - Added `#btn-throttle` (`GAS / 油門`) inside `.touch-pedals-zone` when `settings.autoThrottle === false`.
  - Configured adaptive ergonomic layout (`.has-manual-throttle`) adjusting button widths and touch spacing for three pedals on mobile portrait viewports (390×844).
  - Bound `#btn-throttle` touch events to `touchThrottle` in `InputController`.
  - Attached `onSettingsChanged` listener from `UIScreens` to dynamically toggle throttle pedal visibility upon settings update.
- **Countdown Pause & Resume State Preservation (`src/core/engine.js`)**:
  - Saved `this.pausedFromState = this.state` upon invoking `pauseGame()`.
  - Restored `this.state = this.pausedFromState || "RACING"` upon `resumeGame()`, preserving remaining `countdownTimer` across pause cycles without skipping starting lights.
- **Elevation Route Line Stage Selector & Full-Bleed Ceremony (`src/render/ui-screens.js`, `css/style.css`)**:
  - Replaced the 12-card scrolling list (`.events-scroll-grid`) with an interactive Kirine Pass Mountain Route Elevation Map where each waypoint node along the spline directly launches the selected stage upon touch.
  - Added an active Touge Stage Briefing bar showing stage conditions, target/best time, and direct launch action.
  - Restyled the Results screen into a full-bleed finish ceremony on the 3D scene with transparent backdrop, radial vignette, glowing vector medal badges, and translucent glass metrics ribbons.

### Minor Polish
- **Engine Sound Termination & HUD Concealment on Finish (`src/core/engine.js`)**:
  - Added `audio.stopEngineSound()` and `#hud-container` concealment directly inside `finishRace()`, shutting down synth oscillators under the results screen.
- **Preserved Livery Selection on Garage Car Flipping (`src/render/garage-view.js`)**:
  - Preserved `storage.data.selectedColorIdx` when cycling through cars in the garage if the car is already selected, and skipped invoking `selectCar` when previewing locked vehicles.
- **Vector Glyphs & Clean Shader Aberration (`src/render/hud-renderer.js`, `src/core/engine.js`)**:
  - Replaced Unicode text glyphs (`⏸`, `🏁`, `◀`, `▶`) with inline crisp SVG icons.
  - Removed obsolete `fxChromatic.style.textShadow` string write on `#fx-chromatic`.
- **Test Suite & Headless Playthrough Verification**:
  - Expanded test suite to 31/31 unit tests passing under `node --test tests/*.test.mjs` (`npm test`).
  - Executed headless Playwright playthrough at 390×844 with 0 console errors, refreshing all review screenshots in `screenshots/review-1/`.
