# 《濠江疑案》Harbour Casebook — Art Direction (Diegetic Desk Rebuild)

Penny rejected card/tab UI as 太小學生. Binding bar: **diegetic 1962 detective desk** — Golden Idol / Her Story / Papers Please / Orwell / Obra Dinn. Player taps **physical props**, not tab bars or rounded cards.

## Commercial bar (must clear)
- Every screen looks like a painted film still of a lamp-lit desk, not an app chrome.
- Navigation = props on `assets/art/desk_hub.webp`.
- Deduction = police report form feel (`assets/art/police_report.webp` as backdrop).
- Who's Who = corkboard (`assets/art/corkboard.webp`).
- Notebook = open notebook (`assets/art/notebook_open.webp`).
- Atmosphere: CSS lamp flicker, `assets/ui/lamp_vignette.webp`, `assets/ui/film_grain.webp`, soft crossfade transitions.
- Audio: eerie drones + sparse pluck + fog horn + clock tick (`assets/audio/investigation.*`).

**Forbidden:** bottom tab bars, rounded iOS cards, emoji icons, neon/glass, bouncing yellow hotspot dots, boxed title rectangles over blank beige, SVG clip-art as main art.

## Scope for this rebuild
1. **Case 1 〈押〉 commercial-complete** end-to-end (title → desk → scene → sheet → notebook → corkboard → solve → epilogue).
2. Cases 2–4 may remain playable OR show 「即將開放」 on desk/board — prefer keep data but route primary CTA to Case 1 only if polish time is short.
3. Studio cover MUST be key art (`assets/art/cover.webp` from desk/title), never a blank paper screenshot. After publish, restore cover.webp from assets/art/cover.webp if publish overwrote it.

## Asset inventory (do not regenerate)
| Path | Role |
|---|---|
| `assets/art/desk_hub.webp` | Hub screen full-bleed; tap targets in % |
| `assets/art/corkboard.webp` | Who's Who / relationships |
| `assets/art/police_report.webp` | Deduction sheet backdrop |
| `assets/art/notebook_open.webp` | Word bank backdrop |
| `assets/art/title_key.webp` | Title full-bleed |
| `assets/art/cover.webp` / `thumb.webp` | Studio card |
| `assets/scenes/case1_pawnshop.webp` | Case 1 scene |
| `assets/portraits/*.webp` | 17 portraits |
| `assets/ui/seal_*.webp`, `paper_texture.webp`, `ink_rule.webp`, `lamp_vignette.webp`, `film_grain.webp` | UI overlays |
| `assets/audio/investigation.{ogg,mp3}`, `resolution.*`, SFX + `fog_horn.mp3`, `clock_tick.mp3` | Audio |

## Desk hub hotspots (percent of desk_hub image; nudge ±3 after visual check)
| Prop | Approx x,y | Opens |
|---|---|---|
| Open casebook / scene sketch (center pages) | 48, 52 | Case 1 scene investigate |
| Corkboard (left wall) | 18, 28 | Who's Who corkboard |
| Leather notebook (bottom-left) | 22, 82 | Notebook / word bank |
| Magnifying glass (bottom-right of book) | 68, 78 | Scene (shortcut) |
| Tea cup / ashtray cluster | 78, 62 | Optional tip / ambience only OR menu |
| Rotary phone | 82, 48 | Menu / settings / 返回 grokbot |
| Desk lamp | 12, 42 | Toggle lamp flicker intensity (optional) |

## Scene Case 1 hotspots
Keep / nudge from previous ART_DIRECTION pawnshop table against `case1_pawnshop.webp`. Thin vermilion pin rings — not bouncing dots. Harvested = ink tick.

## Palette
Paper `#F4EBDA`, ink `#2C2416`, vermilion `#9A3B2C`, lamp amber `#C48A3A`, shadow `#0E0A06`. Title typography overlays desk art with soft scrim — **never** a solid beige box.

## Typography
Noto Serif CJK TC / Song for titles; system for body ≥15px. Traditional Chinese in-game; English only on title subtitle.

## Interaction
- One-thumb 390×844.
- Prop tap → cinematic dim + paper slide SFX → overlay or full-screen prop view.
- Bottom sheet for clue text (max ~42% height), underlined word-chips collectable.
- Deduction: fill blanks on report form; Golden Idol style check feedback.
- Mute + 返回 grokbot reachable from phone prop / subtle title link.

## Done = commercial 100
Harsh playtest at 390×844 must feel like a premium mobile deduction title, not a school project.
