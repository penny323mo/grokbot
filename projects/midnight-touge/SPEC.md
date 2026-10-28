# 《夜峠》Midnight Touge — SPEC (nightly 2026-10-29)

A 3D Initial D-style mountain-pass (touge) night drift racing game for **iPhone Safari, portrait, 390px wide first**.
Quality bar: **99.99/100, store-ready commercial game**. Reference for visual design, presentation and car feel: the hit
iOS game **《地獄停車場》(Hell Parking Lot)** — especially its 榛名山 mountain-race levels — plus the references below.
No toy prototype, no "kindergarten → primary-one" incremental versions. Penny will not review interim builds.

ALL art, code, names, logos and audio must be ORIGINAL. Do not copy assets, code, track layouts, car names, logos or
text from 地獄停車場, Initial D, Toyota or any other IP. No real car brands/badges. Track is a fictional mountain:
**霧嶺 (Kirine Pass)**. Cars are fictional 80s/90s-inspired JDM shapes with invented names.

## What the reference does (reverse-engineered — match the feel, not the content)
地獄停車場 is a 3D driving game set in dense Hong Kong car parks, with a 榛名山-style touge race mode. Notable traits:
- Realistic-leaning 3D (not cartoon/low-poly toy): believable concrete, asphalt, lighting; strong night mood (午夜地庫,
  wet surfaces, sodium/fluorescent pools of light), weather & time-of-day variants.
- Camera options: chase/top-down view and a right-hand-drive (右軚) in-car view with mirrors. Smooth, weighty camera.
- Handling with real weight: steering wheel, throttle depth, brake, D/R gear; damage + repair with coins; leaderboards.
- Clean, confident Chinese (Traditional/Cantonese) UI with HK flavour; 77 levels, garage with unlockable cars.
Grok reviewer: research it yourself too (App Store page https://apps.apple.com/hk/app/id6811795826, news articles,
gameplay videos/screens) and keep a short notes file `reviews/reference-notes.md`.

## Core game
- Modes: **峠挑戰 Time Attack** (downhill & uphill), **追擊戰 Battle** vs. a ghost/AI rival (lead/chase, gap wins),
  **練習 Free run**. Times of day/weather: 深夜 (default), 黎明霧, 雨夜.
- Track: one long, believable downhill course (≥ 2.5 km, 5+ hairpins incl. a famous "five consecutive hairpins" style
  section, esses, a tunnel or bridge, gutters along the inside of corners), with checkpoints/sectors and a finish.
  Built in **Blender** (road spline mesh, camber, guardrails, cliff walls, cedar trees, streetlights, signs, valley town
  lights far below) and exported to .glb; optimise with gltf-transform.
- Drift handling model (most important feel): arcade-sim hybrid. Rear-wheel drive, weight transfer on brake/lift,
  slip angle → drift, counter-steer assist that is forgiving on phone, handbrake/feint entry, drift angle & speed
  scoring, wall taps scrub speed (no instant fail), tyre smoke + skid marks. Must feel weighty and controllable, never
  ice-skating or on-rails. Tune with telemetry tests.
- iPhone controls: simple, forgiving taps. Left/right steer zones (or tilt option), auto-throttle by default with a
  BRAKE pad and a DRIFT/handbrake button; optional manual throttle. Big targets, safe-area aware, no pinch-zoom.
- Cars: 3 original Blender-modelled cars (e.g. a white/black 80s hatchback, a 90s turbo coupe, a rotary-style coupe)
  with different stats; garage with turntable view, colour/livery choices, unlock by medals/coins.
- Progression: medals (金/銀/銅) per event, best times + ghost replay saved in localStorage, ~12 events.
- Camera: chase cam (default, low & weighty with speed FOV), bumper cam, right-hand-drive in-car cam with mirror;
  cinematic intro fly-over and replay camera after finish.
- Audio: real-sounding engine (RPM-pitched layered loops synthesised/processed with sox/ffmpeg or Web Audio granular),
  tyre squeal tied to slip, turbo flutter, ambient night insects/wind; an ORIGINAL **eurobeat-style** soundtrack
  (fast 155 BPM, synth lead, driving bass) composed with pretty_midi + FluidSynth/real synth processing, loopable,
  mastered (no harsh clipping). Music/SFX toggles.
- Cantonese/Traditional Chinese UI text throughout (English secondary OK).

## Art Direction (ART IS THE #1 PRIORITY)
Visual bar (all three, aim to stand next to them in screenshots):
1. **《地獄停車場》** — realistic 3D night driving on iPhone, moody lighting, clean HK-Chinese UI.
2. **Gran Turismo 7 / Forza Horizon** — photographic car rendering, reflections, menu typography & garage presentation.
3. **Tokyo Xtreme Racer / Initial D Arcade Stage** — night highway/touge mood, speed HUD, battle gap gauge.
Key art already in repo: `assets/art/keyart-portrait.jpg` (cover.webp / thumb.webp derived) — the target mood.

- Palette: deep night teal/blue-black (#0B1418, #142630), sodium amber light (#D9822B, #F2B451), tail-light red
  (#E0322B), cool fog grey (#9AA7AD), warm off-white UI text (#F3EDE2). No neon/cyberpunk, no dark-glass panels.
- Lighting: night with real light pools from sodium streetlights, headlight cones (projected spotlights), wet asphalt
  reflections/specular, volumetric-looking fog (height fog + sprite haze), bloom on lights, vignette, subtle film grain,
  filmic tone mapping (ACES), slight chromatic aberration at high speed, motion blur/speed lines tastefully.
- Type: real fonts — Noto Serif TC / Noto Sans TC (on box) for Chinese, a condensed motorsport sans (e.g. Barlow
  Condensed / Oswald, self-hosted, OFL) for numbers. Big italic speed/time numerals like racing HUDs.
- UI: full-bleed, game-like screens (title over key art/3D scene, garage turntable, event select as a mountain map
  with route line). Diegetic touches: tachometer gauge, gear indicator, battle gap bar. NEVER generic web cards/boxes.
- Asset pipeline (MUST use real tools, see /workspace/engines/README.md): Blender for cars (bevelled, proper wheels,
  lights, glass, clearcoat paint) and track; textures from AI image generation (Huggingface image generator or
  similar, saved as files) and real-world-style PBR (asphalt, concrete, rock, foliage), finished with ImageMagick;
  Blender Cycles renders for menu car shots / garage backdrops; Three.js (in ~/creative-libs) or Godot 4.7 web export
  for the runtime. Primitive SVG shapes, emoji or flat code-drawn boxes must NOT stand in for main art.
- Performance: 60 fps target on iPhone 13-class in Safari; adaptive quality (pixel ratio cap, shadow/fog tiers),
  initial load < 15 MB with a stylish loading screen.

## Quality gates
- Tests: `npm test` (or tests/*.test.mjs) covering handling model (drift entry/hold/exit, counter-steer, wall scrub),
  lap timing/checkpoints, save data, no console errors on load (headless browser).
- Every **grok review round** MUST:
  1. Actually play the build in a real (headless Chromium/Playwright) browser at **390×844**, driving full runs with
     scripted touch input; capture screenshots of title, garage, event select, race start, mid-drift, hairpin,
     battle, results, replay into `screenshots/review-<r>/`.
  2. Do a **strict art-review pass**: compare those 390px screenshots against 地獄停車場 and the bar above. Score each
     area 0–100: car models, track/environment, lighting & post-FX, UI/typography, menus/presentation, handling feel,
     camera, audio/music, performance, polish/bugs. **Verdict is SHIP only if EVERY area ≥ 95.** Anything amateurish,
     flat, clip-art-like, toy-like, low-poly-placeholder or childish ⇒ NOT SHIP, with concrete fix list.
  3. Write `reviews/review-<r>.md` with scores, verdict, and a prioritised fix list for the next agy round.
- agy USAGE LIMIT FALLBACK: if agy hits its usage limit / rate limit, do not stop — grok writes the code itself and the
  parent bot reviews; record the switch in `PROGRESS.md`.

## Deliverables
- `index.html` playable at the project root (published to penny323mo/grokbot projects/midnight-touge/).
- `assets/` (glb, textures, audio), `blender/` (.py/.blend sources), `CHANGELOG.md`, `PROGRESS.md`.
