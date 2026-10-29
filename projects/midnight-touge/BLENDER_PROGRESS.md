# Blender cars progress — Midnight Touge 《夜峠》

Updated: 2026-10-29 11:45 Asia/Macau

## Done
- Orch stopped / phase=DONE (loop can relaunch later).
- `tools/blender/make_hero_cars.py` — lofted cage → bevel+subsurf bake, Wheel_FL/FR/RL/RR empties, PBR paint/glass/chrome/emissive. No gltf-transform optimize (keeps empties + material names).
- GLBs in `assets/models/`:
  - car_h86.glb (~1.12MB, ~44k tris) + alias car_rs86.glb — 80s panda FR hatch
  - car_gt20.glb (~1.09MB) + car_st20.glb — 90s hot hatch / turbo coupe paint
  - car_re7.glb (~1.13MB) + car_rx7.glb — rotary-style coupe
- Cycles beauty: `assets/renders/beauty_{h86,gt20,re7}.png`
- Wired: `src/world/car-builder.js` (GLTFLoader, MeshPhysical clearcoat, env cubemap, wheel empties spin/steer), `src/core/engine.js` (brighter garage lights, fog off in garage, track material name matching), `src/data/cars.js` (`?v=blender2` cache-bust).
- Playwright local garage probe: procedural=false, 68 meshes, 4 Wheel_* empties.
- Unit tests: 34/34 pass.
- First publish pushed (commit on grokbot `9ccda99`). Raw GitHub + Pages now serve car_h86.glb content-length **1119776**.

## Track
- `track_kirine.glb` still the overnight primitive (338KB). `tools/blender/make_track_kirine.py` drafted but NOT shipped (would desync KIRINE_PASS_TRACK waypoints). Existing `blender/make_track.py` regenerates both GLB + track_data.js — leave alone until a coordinated rebuild.

## Honest QA (harsh)
- Beauty/garage: real Blender shells with glass, spokes, emissive lights — **not boxes**. Still reads stylized / indie low-poly, not 地獄停車場 / Gran Turismo.
- Race: car visible (white hatch + glowing tails), road dark/minimal, countdown HUD can linger visually.
- Far from 99.99 bar.

## Remaining for this executor turn
1. Commit checkpoint (cars.js cache-bust + BLENDER_PROGRESS + orch screenshots).
2. Playwright 390×844 garage + race; Read screenshots.
3. Republish so live ships `?v=blender2` paths; verify live 200 + non-blank cover.
4. Final report to parent (no user message).

## Resume commands
```bash
/workspace/orchestrator/status.sh /workspace/nightly/2026-10-29-midnight-touge
# rebuild cars (long, detach):
nohup blender -b --python tools/blender/make_hero_cars.py > /tmp/blender_cars.log 2>&1 &
/workspace/orchestrator/publish.sh /workspace/nightly/2026-10-29-midnight-touge
```

## 2026-10-29 11:51 Asia/Macau — resume after interrupt
- Checkpoint commit `01ed845` (cars.js ?v=blender2, cover/thumb, BLENDER_PROGRESS).
- Pages CDN car_h86.glb content-length **1119776** (stale 89KB resolved).
- Garage probe: 68 meshes, 4 Wheel_* empties, procedural=false.
- Fixed startEvent crash: garage nulls fog → setWeather NPE. Guard in lighting-weather.js + restore in engine.js startEvent.
- Harsh scores: beauty/garage ~5.5/10 stylized indie (not boxes); race track still primitive/dark; far from 地獄停車場.
