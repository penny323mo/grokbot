# 百草堂 · The Herbalist's Ledger — SPEC

Nightly 2026-10-30. Single-player narrative identification/deduction game, iPhone-first (390×844 portrait), static web (HTML/CSS/JS, no build step), deploys under grokbot `projects/herbalist-ledger/`. All user-facing text in Traditional Chinese (Cantonese voice for dialogue, 書面語 for the herbal compendium), with English herb Latin names as small secondary labels.

## Premise
Guangzhou, Xiguan, spring 1931. You inherit your late grandfather's herbal shop 「百草堂」. Over 7 days, customers come to the counter with complaints, half-remembered names, sketches, smells and letters. You identify the right herb from the ~24 labelled/unlabelled drawers of the 百子櫃 using the grandfather's annotated compendium (藥典), then hand it over. Between customers, pages of grandfather's ledger and coded marginalia reveal why the shop was nearly lost — a quiet family mystery, resolved on day 7. Tone: serious, warm, literary. NO medical advice claims: the game frames herbs as period lore, with an opening note that it is fiction and not medical guidance.

Reference genre: Strange Horticulture (identification via an in-world book + map + unlabeled specimens), Papers, Please (desk loop), Potion Craft (tactile tools). Not a toy: real deduction, red herrings, consequences.

## Core loop (each customer)
1. Customer portrait appears at the counter with a dialogue line (riddle-ish: "我阿媽話要一種切開係黃色、聞落苦苦哋、生喺河邊嘅根…").
2. Player inspects drawers: tap a drawer → herb close-up plate (painted specimen) with observable traits (colour, cut surface, smell note card, texture). Unknown drawers start unlabelled; correctly identifying lets you write the label (persistent).
3. Player consults the 藥典 (paged book, diegetic, with grandfather's handwriting notes): entries list appearance, taste/nature (性味), origin, look-alikes & cautions.
4. Hand over: drag/tap herb onto the counter paper and wrap. Right → story progresses, coin & reputation; wrong → consequence (customer returns, reputation drop, a branch in the story), never a hard fail.
5. Tools unlocked over days: magnifier, scale (戥子), a regional map for origin clues, letters.
~18–21 customers across 7 days, plus 3 "ledger" puzzles (cipher in grandfather's marginalia using herb names). Save to localStorage; chapter select after completion.

## Controls & UX
- Simple, forgiving taps; large hit areas (≥44px); no precision drags required (drag optional, tap-to-select + tap-to-give always works).
- Diegetic UI: the counter, drawer wall, book, ledger and wrapping paper ARE the interface. No floating cards, no dark glass, no neon, no generic dashboard panels, no emoji icons.
- Full-bleed title screen with painted key art; title calligraphy treatment; "繼續 / 新開舖" set as paper labels.
- Must fit 390×844 and 375×667 with no overflow, no clipped text, safe-area aware.

## Art Direction (ART IS #1 PRIORITY)
References (study, don't copy):
1. **Strange Horticulture** (Bad Viking) — painted top-down desk, specimen illustrations, warm lamp light, in-world book UI.
2. **Botanical plates of 《植物名實圖考》 / Kew Curtis's Botanical Magazine** — specimen plates on aged paper, fine linework + watercolour wash.
3. **Wong Kar-wai / Christopher Doyle palette (In the Mood for Love)** — deep amber, oxblood, jade green under tungsten light; and **Gris** for restraint in UI.
Palette: aged rosewood #3B2418, lacquer oxblood #7A2E22, brass #B08A4A, paper #EADBBE, ink #1E1A16, jade #4F7A62, lamp amber #E2A65A. Avoid pure black/white.
Type: Noto Serif TC / 思源宋體 for body; a brush display face (e.g. "Ma Shan Zheng" or "Zhi Mang Xing" via Google Fonts, or pre-rendered calligraphy PNG generated as art) for titles; small caps serif (Cormorant Garamond) for Latin names. Self-host fonts if possible.
Art production (real tools only; NO code-drawn SVG/geometric art or emoji as main art):
- AI-generated painted illustrations (key art, shop interior, counter, drawer wall, book spreads, customer portraits, herb specimen plates), finished with ImageMagick (crop, colour-grade to palette, paper texture overlay, webp export). Consistent style prompt: "painterly gouache and ink, 1930s Guangzhou, warm tungsten light, muted palette, fine detail, no text".
- Blender optional for the 百子櫃 drawer wall if consistent drawer grid is needed (render a clean orthographic drawer wall so tap targets align).
- Asset list (minimum): title key art (9:16), shop interior/counter background (9:16), drawer wall (百子櫃) background, compendium open-book spread texture, ledger page texture, wrapping paper + string, 24 herb specimen plates (1:1, transparent or paper bg, consistent style), 8–10 customer portraits (3:4, consistent painterly style), 7 day-title cards, cover.webp 780×1040 and thumb.webp.
- Audio: ambient street + rain, drawer slide, paper rustle, scale tick, brass bell; CC0 sources only, credited.
- Pre-generated starter art is in assets/art/ (made before launch) — use it and match its style for everything else.

## Content accuracy
Use real, well-known herbs (e.g. 黃芪, 當歸, 甘草, 陳皮, 枸杞, 菊花, 杞子, 川芎, 黨參, 茯苓, 白朮, 薄荷, 金銀花, 桔梗, 麥冬, 百合, 蓮子, 山楂, 杏仁, 決明子, 板藍根, 艾葉, 紫蘇, 生薑). Visual descriptions must be factually correct (look it up). 陳皮 lore is a nice Guangdong (新會) tie-in. No dosing instructions.

## Review gate (every grok review)
- Play the live/local build in a real browser at 390×844 AND 375×667, screenshot every screen to screenshots/review-<r>/.
- Strict art and layout pass: block SHIP on any amateurish art, code-drawn placeholder art, emoji, inconsistent illustration style, overflowing/clipped text, card-stack UI, dark glass/neon, tiny tap targets, or unreadable text.
- Score Art, UI/Layout, Puzzle depth, Story, Audio, Flow, Perf each /100; SHIP only if all ≥ 90.
- Verify a full playthrough of day 1–2 works and save/continue works.

## Deliverables
index.html, src/, css/, assets/, tests/ (node tests for puzzle data integrity: every customer solvable, every herb has plate + entry), CHANGELOG.md, CREDITS in-game.

## Starter art on disk (generated 2026-10-30 before launch)
- assets/art/title_key.{jpg,webp} (9:16 shop interior, title space top-left), assets/art/counter_bg (9:16 counter view, scale + ledger + wrapping paper), assets/art/cover.webp 780×1040 + thumb.webp (from title key; replace with a titled cover once calligraphy exists), assets/herbs/huangqi (黃芪 plate — THE STYLE REFERENCE for all 24 herb plates), assets/people/ama (customer portrait — THE STYLE REFERENCE for all portraits).
- If your CLI can generate images, generate the remaining assets in exactly this style. If it cannot, do NOT draw placeholders in code: write the exact prompts you need into assets/ART_REQUESTS.md (filename, aspect ratio, prompt) and build the game against those filenames; the reviewer will generate them.
