# three.js path to mockup-v2 look (Bannerline)

Current stack (cheap): `MeshLambertMaterial` primitives, `renderer.shadowMap.enabled = false`, box-merged soldiers, no GLTF, no particles, `NoToneMapping`, CSS HUD.

Target: mockup-v2 commercial midcore RTS — still mobile WebGL, still 390×844.

## 1. Models (biggest jump)
- Author or buy **original** low-poly GLTF: HQ bunker, barracks hangar, pine, rock, APC/light tank, 1–2 soldier LODs.
- Load with `GLTFLoader`; keep soldiers as **InstancedMesh** (LOD0 ~80–150 tris) capped ~300–480 instances.
- Buildings: one GLTF each, faction tint via material color / emissive stripe — silhouettes must differ (dish HQ vs roll-door barracks).
- Optional: bake AO into vertex colors or a lightmap atlas for terrain slabs.

## 2. Lighting & materials
- Switch Lambert → **MeshStandardMaterial** (roughness 0.55–0.85, metalness 0–0.15 on armor).
- Keep Hemisphere + Ambient, but enable **one DirectionalLight shadow map** only on real devices:
  - `renderer.shadowMap.enabled = true`, `PCFSoftShadowMap`, mapSize 1024.
  - SwiftShader / low FPS: fall back to current blob contact shadows (already noted in `stage.js`).
- Tone mapping: `ACESFilmicToneMapping` + exposure ~1.0; sky gradient mesh behind diorama (not flat clearColor alone).

## 3. Terrain & ownership
- Replace tan disc with layered mesh: meadow / dirt road / rock (vertex paint or splat).
- Ownership border: existing line → additive **emissive ribbon** + soft ground tint (green/red) updating with `frontierFrom`.
- Fog shorter so edges vignette like mockups.

## 4. Combat juice (particles)
- Lightweight custom system (or `three/examples` GPU points): dust on march, clash smoke puffs, muzzle flash sprites (billboards, 8–16 frames).
- Capture / 危: pulse emissive on HQ + brief ring expand (shader or scaled torus).
- Budget: ≤1k particles live; recycle pools.

## 5. HUD / typography
- Keep HTML overlay (perf), restyle to mockup gunmetal: hard bevels, icon chips, condensed title font (self-hosted woff).
- Count badges: canvas/`CSS2DRenderer` circles with rifle glyph + number — drop soft pills.
- Home sheet: map thumbnails (static canvas renders of each map) + embossed 出戰.

## 6. Post (optional, gated)
- `EffectComposer` + UnrealBloomPass **very mild** on border/muzzle only; disable under 40fps.
- MSAA off; use `antialias: true` on Apple GPU, FXAA pass as fallback.

## 7. Ship order (suggested milestones)
1. **Art gate:** Penny picks mockup(s); lock palette + silhouette sheet.
2. **M-art1:** GLTF HQ/barracks/trees + StandardMaterial + soft shadows on device.
3. **M-art2:** Soldier/vehicle GLTF instances + clash/march particles.
4. **M-art3:** HUD chrome + badge redesign + home thumbnails.
5. **M-art4:** Tone map + optional bloom; perf budget pass on iPhone SE-class.

Penny approved mockup-v2 (01-combat, 02-home, 03-siege) on 2026-11-01 Asia/Macau. Orch resumes at fix-15 toward this path.
