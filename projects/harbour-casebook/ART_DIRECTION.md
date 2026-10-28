# 《濠江疑案》Harbour Casebook — Art Direction (Art Overhaul 2026-10-28)

Penny rejected the first ship as **太小學生 lv** (clip-art SVG + emoji). This document is the binding visual bar for the overhaul. Gameplay stays; visuals must read as a commercial deduction game on iPhone 390px.

## Reference bar (do not ship below this)

| Reference | Take |
|---|---|
| **The Case of the Golden Idol** | Dense period illustration, readable hotspots, archival dossier framing |
| **Return of the Obra Dinn** | Restraint, craft, every pixel intentional — no filler ornament |
| **Pentiment** | Period ink/line quality, manuscript feel, handwritten weight |
| **Apple Arcade premium UI** | Tight spacing, mature type hierarchy, no childish chrome |

**Forbidden:** flat SVG primitives as main art, emoji as icons, neon/dark-glass UI, cartoon faces, thick candy outlines, Comic Sans / default system "cute" stacks as primary display.

## Setting & mood

- **Time / place:** 1962 Macau Inner Harbour (內港) — Portuguese colonial + Cantonese street life
- **Frame:** Police / archival paper dossier (紙、墨、硃砂印), not a phone glass skin
- **Tone:** Somber, adult, slightly faded film still — warm paper, cool ink

## Palette

| Token | Hex | Use |
|---|---|---|
| Paper | `#F4EBDA` | App background, sheets |
| Paper deep | `#E8D9C0` | Cards, panels |
| Ink | `#2C2416` | Body text, rules |
| Ink soft | `#5A4A38` | Secondary labels |
| Vermilion | `#9A3B2C` | Seals, accents, critical UI |
| Azulejo | `#3A6B7A` | Rare cool accent (tile memory) |
| Blood | `#6B1E1E` | Scene only, never UI chrome |
| Gold faded | `#B8975A` | Case titles / chapter marks |

## Typography (iPhone-first)

- Display / titles: **Noto Serif CJK TC** (or Song/Ming stack) — never decorative brush fonts for UI chrome
- Body: system `-apple-system` with CJK fallback; size ≥ 15px for slots, ≥ 13px captions
- Letter-spacing on English subtitles: `0.04em`
- Case chapter marks (押 / 碼頭 / 戲棚 / 西望洋) as single large Song glyphs, vermilion or ink

## Lighting & line

- Soft directional window light; no hard cel shading
- Visible paper grain + slight vignette on full-bleed scenes
- Hotspots: thin vermilion ring or ink pin — **not** bouncing yellow circles or emoji 🔍

## Asset inventory (already produced — do not regenerate unless broken)

### Title / cover
- `assets/art/title_key.webp` (+ `.jpg`) — key art, **no baked Chinese text** (UI overlays title)
- `.orch/cover.png` — publish cover source

### Scenes (390-friendly, ~780–1024 wide; webp primary)
| File | Case |
|---|---|
| `assets/scenes/case1_pawnshop.webp` | 德生大押後櫃 |
| `assets/scenes/case2_pier.webp` | 內港碼頭 |
| `assets/scenes/case3_theatre.webp` | 清平戲棚後台 |
| `assets/scenes/case4_penha.webp` | 西望洋別墅 |

Old SVGs moved to `.art-source/old-svg/` — **do not load them**.

### Portraits (17)
`assets/portraits/<id>.webp` for every key in `src/data/portraits.js`:
`chan_tak_sang`, `ho_bing`, `leung_ah_sei`, `pak_lan`, `so_chi_keung`, `chiu_tai_sing`, `roberto_silva`, `luk_chat_ye`, `blind_chuen`, `fung_sin_ha`, `yuen_so_kam`, `master_liu`, `fong_jie`, `young_master_tse`, `pereira`, `father_stubbs`, `mute_gardener`.

### UI
- `assets/ui/seal_jiean.webp` / `seal_jiean_sm.webp` — 硃砂「結案」印
- `assets/ui/seal_title.webp` — decorative dossier seal
- `assets/ui/paper_texture.webp` — CSS `background-image` tile
- `assets/ui/ink_rule.webp` — section divider flourish

Raw AI outputs live in `.art-source/` (not published).

## Suggested hotspot remaps (verify visually against JPG/WebP)

Percent of scene image (x,y). Open the image and nudge ±3–5 until the tap lands on the object.

### Case 1 — pawnshop
| id | approx x,y | object in new art |
|---|---|---|
| c1_victim | 48, 58 | body center |
| c1_abacus | 30, 52 | abacus by safe |
| c1_safe | 22, 40 | open iron safe |
| c1_handkerchief | 24, 45 | cloth in safe drawer |
| c1_desk_tea | 22, 78 | tea + ruler on desk |
| c1_ticket_ledger | 58, 65 | open ledger near body |
| c1_noodle_basket | 72, 58 | wicker basket |
| c1_drawer_ferry | 78, 40 | slip on wardrobe |
| c1_footprints | 42, 72 | muddy prints from door |
| c1_alley_matches | 55, 50 | cigarette / matches on floor |
| c1_window_grille | 14, 22 | barred window |
| c1_earring | 48, 82 | near doorway threshold |

### Cases 2–4
Re-place every hotspot onto a clearly painted object in the new illustration. Prefer objects already visible (watch, rope, glove, gold crate, fan, victim, boat, clock tower for case 2; costume rack, makeup table, stage door, script for case 3; garden path, villa door, priest items, gardener tools for case 4). If an object is missing from the painting, move the hotspot to the nearest plausible painted stand-in and keep the same narrative text — do **not** fall back to SVG.

## Integration rules for agy

1. `scene-renderer.js`: load **`<img>` / background-image webp**, not `fetch(svg)`. Keep pan/zoom; hotspots stay % overlays.
2. `cases.js`: `sceneImage` → `assets/scenes/caseN_….webp` (+ optional jpg fallback).
3. `portraits.js`: replace inline SVG with `{ img: 'assets/portraits/<id>.webp', … }`; update Who's Who + deduction sheet renderers to `<img class="portrait-img">`.
4. Title screen: full-bleed `title_key.webp` + typographic title/subtitle/CTA — no cartoon logo mark.
5. Solved state: animate `seal_jiean_sm.webp` stamp (rotate ~-12°, slight scale) over the sheet.
6. CSS: paper texture, vermilion accents, generous padding, dossier card radii ≤ 6px, no neon gradients.
7. Remove emoji from UI chrome. Stroke SVG icons in `icons.js` may stay if ink-colored and 20–22px.
8. Do not edit `reviews/` or invent new cases. Do not call The Odds API. Do not git commit (orchestrator commits).

## Art review checklist (grok every round)

At 390px screenshot of title, each case scene, Who's Who, deduction sheet:

- [ ] Still looks like Golden Idol / Pentiment dossier — not school project
- [ ] No SVG clip-art scenes or emoji faces
- [ ] Portraits are painted photos, consistent grade
- [ ] Hotspots land on real painted objects
- [ ] Type hierarchy calm; vermilion used sparingly
- [ ] Seal reads as 硃砂印, not a red square button

**SHIP only if all pass.** Else verdict CONTINUE with concrete MAJOR/CRITICAL art notes.
