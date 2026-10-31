# 據點號令 · Bannerline — Art Style (v3 · mockup-v2)

**Authority:** This file + `PLAN.md` §4 + `review/art-mockup-v2/THREEJS-PATH.md` are the canonical art target.  
**Trigger (v2):** Penny 2026-10-31 — 「又小學生lv」.  
**Trigger (v3):** Penny 2026-11-01 ~01:25 Asia/Macau — live look 「垃圾級」; then **approved** `review/art-mockup-v2/` (01-combat, 02-home, 03-siege) as the direction.

**Goal:** Commercial midcore military RTS on iPhone 390×844 — Top-Force-*ad* genre feel only. Never copy assets, branding, nation labels, or 「Top Force / 最強統帥」.

Still: readable in portrait; no gore; no real-world nation / ideology labels; **original** meshes / GLTF only.

---

## 0. Canonical references (acceptance bar)

| File | Role |
|------|------|
| `review/art-mockup-v2/01-combat-390x844.png` | Mid-match: dense infantry + vehicles, ownership glow, clash VFX, hard HUD |
| `review/art-mockup-v2/02-home-390x844.png` | Home: gunmetal map/difficulty sheet over lit battlefield + 出戰 |
| `review/art-mockup-v2/03-siege-390x844.png` | Siege climax: muzzle/smoke, 司令部 危, cinematic light |
| `review/art-mockup-v2/THREEJS-PATH.md` | Implementation path (GLTF, StandardMaterial, shadows, particles, FPS gate) |
| `review/art-mockup-v2/COMPARE.md` | Why the pre-v3 live build read cheap |

**NOT SHIP / VERDICT SHIP forbidden** while a 390×844 screenshot side-by-side with these mockups still reads as prototype / flat Lambert boxes / empty diorama / soft toy. Palette alone is not enough — density, lighting, VFX, and HUD chrome must come close.

---

## 1. Tone

| Do | Don’t |
|----|-------|
| Compact theatre-of-operations, commercial midcore polish | Pastel toy island / soft candy / chibi |
| Detailed low-poly soldiers + light vehicles (adult proportions) | Cylinder studs, brick blobs, rounded toy people |
| Fortified HQ ≠ barracks (dish/antenna vs hangar) | One reused hall mesh |
| Muted olive terrain + **strong** faction paints | Rainbow bridges, neon candy, cream hero trees |
| Gunmetal HUD (hard bevels, icon chips) | Giant pastel pills, bubble chrome, system-only boxes |
| Formal spoken Cantonese (司令部 / 兵營 / 出兵 / 攻陷) | Cute / playground copy |

Elevator line (keep): 「兩邊陣營出兵，拖一拖就攻過去。人數對撞、數字相減，攻陷對方司令部就贏！」

---

## 2. Palette

Terrain muted so units/buildings pop. Faction paints strong.

| Token | Hex | Role |
|-------|-----|------|
| sky | `#7FA8C4` → gradient / sky dome | Cool day, not baby pastel |
| water | `#3E6F8F` | Deep bay / river |
| meadow | `#6B7A4E` → `#5A6B42` | Olive drab / dry grass |
| sand / dirt | `#8A7A5C` | Dust roads, pads |
| road | `#5C5348` | Packed earth / asphalt |
| rock | `#6E6A63` | Ridges |
| leaf / tree | `#3F5A3A` + `#2F4530` | Real green pines |
| ink | `#1A2220` | HUD text |
| panel | `#1C2422` @ ~88–92% | Gunmetal fill |
| panel-edge | `#9AA39A` / steel bevel | Hard border |

**綠軍:** main `#2F9E5B`, deep `#1B6B3D`, glow `#3DCE7A`, slab `#3A5C3F`  
**紅軍:** main `#C43C32`, deep `#8E241C`, glow `#E25548`, slab `#5C3532`  

Ownership border: **two-tone only** green|red hard edge + emissive ribbon. No yellow/rainbow middle. Bridges neutral stone/metal.

---

## 3. Buildings (silhouette at 390px)

**司令部:** low wide bunker, angled concrete, sandbag/berm, dish/mast cluster, faction flag, trench/pad ring; under attack → deep glow + 「危」.  
**兵營:** shorter hangar / block with roll door or vents; spawn pad; upgrade chips on hard square/diamond (not soft bubble).  
Do **not** reuse one mesh for both. Prefer **original GLTF** (or equally detailed procedural merges) per `THREEJS-PATH.md`.

---

## 4. Units & badges

- Dense **InstancedMesh** armies (helmet + torso + rifle; optional APC/light tank tier). Adult proportions — not chibi.
- Cap ~300–480 instances; visual density must read as stacks/armies (mockup bar).
- Floating badge: **hard circle** with rifle glyph + crisp white count (≥11px at 390). Building badges win taps; de-overlap on bridges.

---

## 5. Lighting, materials, VFX

- **MeshStandardMaterial** (roughness ~0.55–0.85; light metalness on armor/dish).
- Directional sun + hemisphere/ambient; **shadow map on real devices** (`PCFSoftShadowMap`, mapSize 1024). SwiftShader / &lt;40 fps → blob contact-shadow fallback (FPS gate).
- Tone: `ACESFilmicToneMapping` (or equivalent readable grade); sky gradient / dome, not empty flat void only.
- Juice: march dust, clash smoke puffs, muzzle flash billboards; capture/危 pulse + brief ring. Particle budget ≤~1k live, pooled.
- Optional mild bloom on border/muzzle only — disable under FPS gate.

---

## 6. HUD / UI chrome

- Sharp gunmetal panels: ≤4px radius (or 0); hard bevels; dark translucent fills; icon chips.
- Primary buttons ≥44px; semi-bold zh-HK.
- Home: map thumbnails (對岸 / 長路 / 雙橋), 難度 易／中／難, embossed 「出戰」 — match `02-home` chrome intent.
- Hide troop totals on home until a match is running (or clearly label as preview).
- In-match: 「出兵」「加速」「加固」; mute 🔊/🔇 + aria-label.
- Result: win/lose, match time, one-line reason, 「再戰」「地圖」.
- Coach: formal short line in panel style, not cartoon bubble.

---

## 7. Copy register (zh-HK)

據點號令、司令部、兵營、出兵、行軍、對撞、攻陷、升級、加速、加固、靜音、再戰、揀地圖、難度、敵軍打緊司令部.

---

## 8. Acceptance (art pass — mockup-v2)

Ship / SHIP only when **all** are true at 390×844 (real taps + screenshots **side-by-side** with the three mockups):

1. Build comes **visually close** to 01-combat / 02-home / 03-siege (density, light/shadow, VFX, HUD) — not “palette-only mature”.
2. Models are original GLTF **or** procedural detail clearly above box/cylinder prototype.
3. Instanced dense armies; HQ ≠ barracks silhouettes.
4. MeshStandardMaterial + device shadows (or documented FPS-gate fallback).
5. Ownership emissive two-tone glow line updates with capture.
6. March + clash VFX visible in mid-match / siege moments.
7. Gunmetal HUD + home sheet match mockup chrome intent.
8. FPS gate: target ≥50 fps with ≥200 soldiers; degrade shadows/bloom/particles before dropping below ~40.
9. M1/M2 gameplay + balance (incl. fix-13 中/難) intact; `npm test` green; `static/app.js` rebuilt for Pages.
10. Supervisor audits mockup side-by-side before Penny gets the link.

Inspiration (local only): `assets/ref/inspiration-ad.png`.
