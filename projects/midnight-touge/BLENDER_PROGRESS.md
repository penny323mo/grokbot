# Blender Progress — 《夜峠》 CC0 Asset Rebuild

**STATUS: EXECUTOR ACTIVE — do not relaunch orchestrator**

Updated: 2026-10-29 ~12:33 Asia/Macau

## Done
- [x] Stopped orch / kept progress file so 30-min loop does not relaunch
- [x] CC0 cars: H-86=1980s-sports panda, GT-20=sports emerald, RE-7=midengine red
- [x] Paint fix (disconnect Base Color textures); GT-20 emerald brightened in cars.js
- [x] Kenney packs (Car/Racing/Nature/City*) packed → ~78 props incl. tunnel mouths, shops, houses, gantry, pits, signs, pines
- [x] scenery-placer landmarks expanded; 200 props placed in verify
- [x] CREDITS.md + in-game CREDITS modal synced (commercial-safe only)
- [x] Playwright 390×844: garage GLBs load usedProcedural=false; STAGE START works; scenery OK
- [x] Published live 200 @ https://penny323mo.github.io/grokbot/projects/midnight-touge/ (12:31 Asia/Macau)
- [x] Cover restored via orch.json cover_src + restore-cover.sh

## Gaps / known
- Grab3D cars remain stylized low-poly (not AAA); better than procedural boxes
- Headless countdown can stick on "3" if RAF starved; hideCountdown path OK on real GO
- Garage may show white translucent blocks (glass/shadow artifact) — minor
- Optional: Poly Haven HDRI as env map (RGBELoader)
- Night track still very dark; scenery readable mainly near road lights

## Mapping
| Car | Source | Notes |
|-----|--------|-------|
| H-86 | 1980s-sports-car.glb | panda Paint + PaintSecondary |
| GT-20 | sports-car.glb | midnight emerald #1A6B6E |
| RE-7 | midengine-sports.glb | formula red |
