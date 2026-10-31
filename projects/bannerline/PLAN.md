# 據點號令 · Bannerline — Project Plan

**Working title (original):** 據點號令 / Bannerline  
**Inspiration only:** Facebook ad screenshot of a bright low-poly territory RTS (reference at `assets/ref/inspiration-ad.png`). Do **not** copy assets, branding, names, logos, maps, unit models, or the title 「Top Force / 最強統帥」. Design an original game that feels similar in *genre*, not a clone.

**Owner prefs:** Penny Lei — speak Cantonese in user-facing copy; iPhone-first (390×844 portrait); commercial quality; live links not zips; short status only when there is something new or a decision.

---

## 1. Concept

A bright, readable real-time strategy for one finger on an iPhone. Two coloured territories face each other on a compact low-poly operations map. Your barracks spawn soldier squads; you drag or tap to send a squad to a road, a building, or the enemy HQ. When squads meet, **counts subtract** until one side is gone. Capture buildings to expand spawn and income. Win by taking the enemy headquarters.

Tone: commercial midcore military RTS matching **mockup-v2** — **not** palette-only mature, **not** pastel/toy/「垃圾級」 flat prototype, **not** grim gore. Safe for a broad audience — no gore, no real-world nation labels, no copied faction names. Full visual rules: `ART-STYLE.md`.

### Elevator pitch (Cantonese UI)

「兩邊陣營出兵，拖一拖就攻過去。人數對撞、數字相減，攻陷對方司令部就贏！」

---

## 2. Core loop

1. **Generate** — Owned barracks tick up a troop count (rate by building level). Cap per building.
2. **Select & send** — Tap a friendly building (or its crowd) to pick up a squad size, then tap/drag to a target (road node, enemy squad, enemy building, HQ). Touch-first; no desktop-only gestures.
3. **March** — Squads are dense low-poly crowds with a floating count badge + unit icon. They follow roads / nav mesh toward the target.
4. **Clash** — On contact, both counts tick down (damage/sec or discrete ticks). Loser dissolves; winner keeps remainder and continues or holds.
5. **Capture** — Empty / overrun enemy building flips colour after a short capture channel. New owner starts generating troops.
6. **Front line** — Glowing border between green (player) and coral-red (enemy) shifts as territory ownership changes.
7. **Win / lose** — Capture enemy HQ → victory. Lose your HQ → defeat. Short result sheet → retry / next map.

### Upgrades (from M2)

- Barracks level → faster spawn / higher cap  
- Unit type (rifle → shield → light vehicle) with rock-paper-scissors bias, still count-based  
- HQ aura / income boost  
- One-shot “rally” ability (cooldown)

### Enemy AI (from M2)

- Periodic evaluate: reinforce threatened buildings, push weak fronts, snipe under-defended nodes  
- Difficulty tiers: Cautious / Balanced / Aggressive  
- Never cheats fog; same rules as player

---

## 3. Tech stack

| Layer | Choice |
|-------|--------|
| Bundler | Vite |
| 3D | Three.js (WebGL) — mockup-v2 bar: GLTF/detailed meshes, MeshStandardMaterial, shadows, InstancedMesh armies, ownership glow, march/clash VFX (see THREEJS-PATH.md) |
| UI | HTML/CSS overlay (or lightweight React) for HUD, mute, menus — 390px portrait |
| Input | Pointer events (touch + mouse); drag from building to target with rubber-band preview |
| Audio | Web Audio / Howler; BGM + SFX; **mute toggle persisted** |
| Persist | localStorage / IndexedDB for settings + campaign progress |
| Tests | Node tests under `tests/` (sim combat math, capture rules, AI smoke) |
| Deploy | Static; GitHub Pages at `https://penny323mo.github.io/bannerline/` |

**Performance budget (acceptance):** ≥50 fps steady on a mid phone emulation / desktop Chrome at 390×844 with ≥200 instanced soldiers on screen. Prefer `InstancedMesh` for troops; merge static terrain; avoid per-frame allocations in the hot path.

**Paths:** relative only (Pages-safe). PWA optional from M3.

---

## 4. Art direction (canonical = mockup-v2)

**Canonical brief (2026-11-01 Asia/Macau):**
- `ART-STYLE.md` (v3)
- `review/art-mockup-v2/01-combat-390x844.png`
- `review/art-mockup-v2/02-home-390x844.png`
- `review/art-mockup-v2/03-siege-390x844.png`
- `review/art-mockup-v2/THREEJS-PATH.md`
- `review/art-mockup-v2/COMPARE.md`

Penny approved those three mockups as the direction after rejecting the live look as 「垃圾級」. A build that does **not** come visually close (density, lighting/shadows, clash VFX, gunmetal HUD) is **NOT SHIP** — palette-only “mature” restyles are insufficient.

Genre feel only from the inspiration ad (never copy assets/branding/nations/title):

- Commercial midcore military RTS polish on 390×844  
- Clear daylight on **muted olive / drab** layered terrain; sky dome/gradient  
- **MeshStandardMaterial** + device-gated shadow maps; FPS gate degrades effects before dropping under ~40 fps  
- Original **GLTF** or equally detailed procedural models: HQ bunker+dish ≠ barracks hangar; pines/rocks; APC/light tank  
- Dense **InstancedMesh** armies with adult-proportion soldiers + rifle badges  
- Ownership border: emissive **two-tone** green|red ribbon — no rainbow middle  
- March dust + clash smoke/muzzle juice  
- Gunmetal HUD / home sheet (map thumbs, 易／中／難, embossed 出戰)  
- No gore; no photoreal AAA texture packs required; no pastel/chibi/toy regression  

Reference (local only): `assets/ref/inspiration-ad.png`.

---

## 5. Levels / campaign

| Stage | Content |
|-------|---------|
| Tutorial skirmish | One road, two barracks + two HQs; forced “send squad” gesture coach |
| Skirmish maps 1–5 | Increasing node count, choke points, dual lanes |
| Campaign acts | Short named chapters (original fiction: island outposts, not real wars) |
| Meta (M4) | Unlock maps, cosmetics for barracks flags, daily challenge seed |

Map format: JSON (nodes, edges, building slots, spawn rates, AI personality). Editor can be deferred; hand-author JSON for M1–M3.

---

## 6. Audio

- Loopable light martial / command-march BGM (not playground jingle)  
- SFX: spawn tick, march step (subtle), clash tick, capture chime, win/lose sting  
- **Mute button** always visible in HUD; preference saved  

Use original or clearly licensed CC0 assets only; list attributions in `ATTRIBUTIONS.md`.

---

## 7. Roadmap & acceptance

Every milestone must pass a **real 390×844 browser** walk (headless Chrome screenshot + manual tap path when reviewing). Orchestrator coder builds; orchestrator reviewer writes `VERDICT: SHIP|NOT READY`; supervisor (Penny’s Grok Bot) audits live before Penny sees a link.

### M1 — Playable vertical slice (one map)

**Ship when:**

- [ ] Vite + Three.js scene loads on `index.html` at 390px without console errors  
- [ ] One hand-authored map: player HQ + barracks (green), enemy HQ + barracks (red), glowing border  
- [ ] Barracks generate troops over time; count badges update  
- [ ] Touch: drag/tap from owned building to enemy building or HQ sends a squad that marches  
- [ ] Clash = count subtraction; survivor continues  
- [ ] Capturing enemy HQ shows win sheet; losing player HQ shows lose sheet  
- [ ] Mute toggle works (even if SFX are placeholders)  
- [ ] `npm test` covers pure combat/capture helpers  
- [ ] Live on GitHub Pages  

### M2 — AI + upgrades + multiple maps

- [ ] 3+ skirmish maps selectable from a home screen  
- [ ] Enemy AI plays without soft-locking (no infinite idle when under attack)  
- [ ] At least two upgrade paths usable mid-match  
- [ ] Difficulty select  
- [ ] Still ≥50 fps at 390 with full AI match  
- [ ] Difficulty: fix-13 bar — 中 reinforces/counters in ~30–40s (human chain rush not a sub-90s win); 難 harder than 中 but sensible play survives ~45s and can win in ~2–4 min; 易 still rushable; HQ grace + 「敵軍打緊司令部」 toast stay  

### M-art — Mockup-v2 art rebuild (NOW — blocking)

Penny-approved visual target. Orchestrator rounds from fix-15 onward until side-by-side audit passes.

- [ ] Original GLTF or procedural detailed HQ/barracks/trees/vehicles  
- [ ] InstancedMesh dense armies (adult proportions)  
- [ ] MeshStandardMaterial + device shadows + FPS-gate fallback  
- [ ] Ownership emissive glow line  
- [ ] March + clash VFX  
- [ ] Gunmetal HUD + home sheet (match 02-home intent)  
- [ ] `npm test` green; gameplay/sim preserved; `static/app.js` rebuilt  
- [ ] Reviewer compares 390×844 shots to mockups; supervisor audits before Penny link  

### M3 — Polish / juice / campaign

- [ ] Capture VFX, spawn pop, clash juice, screen shake subtle  
- [ ] Tutorial coach marks  
- [ ] Campaign of ≥6 missions with progressive difficulty (never easier than prior)  
- [ ] PWA installable (optional but preferred)  
- [ ] Art pass: 390×844 screenshots side-by-side with `review/art-mockup-v2/` 01/02/03 come close (NOT palette-only); follows `THREEJS-PATH.md`  

### M4 — Meta

- [ ] Persistent progress, unlocks, cosmetics  
- [ ] Daily/seeded skirmish  
- [ ] Settings: mute, reduced motion, language (zh-HK default)  
- [ ] Store-ready screenshots + cover art for grokbot manifest  

---

## 8. Orchestrator instructions

- Project dir: `/workspace/sidequest/top-force-like`  
- Coder pane: `tf-coder-pane` — `grok --always-approve -m grok-4.7`  
- Reviewer pane: `tf-review-pane` — `grok --always-approve -m grok-4.7`  
- Session: `orch-top-force` via `/workspace/orchestrator/run.sh`  
- Do **not** touch `orch-english-quest`, `grokcoder-pane`, `eq-review-pane`, or nightly panes  
- Rounds: start with M1 build prompt; continue fixing until M1 acceptance is green, then advance prompts toward M2…  
- Publish: push to `penny323mo/bannerline` main (Pages from `/`); `orch.json` also ready for grokbot portfolio copy  
- Never print secrets; never paid APIs; ask before deletes  

### Build phase order (prompts)

1. `prompts/orch-build.txt` → M1 vertical slice  
2. Review / fix loops until SHIP + supervisor audit pass  
3. Subsequent `orch-fix-N.txt` prompts introduce M2 → M3 → M4 features explicitly  

---

## 9. Out of scope (for now)

- Multiplayer / netcode  
- User accounts / cloud saves  
- Real-world nation / ideology framing  
- Asset rips from the inspiration ad or any commercial RTS  
- Desktop-only controls as the primary path  

---

## 10. Success bar

Penny can open the live link on iPhone, mute on, play one full skirmish with one thumb, win by taking the red HQ, and say it looks like the approved mockup-v2 direction (commercial midcore military RTS) — not 「垃圾級」, not primary-school / pastel toy, and not a flat prototype tech demo.
