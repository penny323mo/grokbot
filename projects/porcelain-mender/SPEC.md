# 鋦瓷記 · The Porcelain Mender — SPEC

Nightly 2026-11-03. Single-player tactile restoration puzzle + narrative, iPhone-first (390×844 portrait, also 375×667), static web (HTML/CSS/JS, no build step, relative paths), deploys under grokbot `projects/porcelain-mender/`. All user-facing text in Traditional Chinese, Cantonese voice for dialogue; 書面語 only for receipts, newspaper scraps and letters. Natural, varied writing: every customer has their own voice; no templated lines that only swap names.

## Premise
Hong Kong, 1957, 油麻地 Yau Ma Tei. You are 葉伯 (Uncle Yip), a 鋦碗佬 who fled Chaozhou/Shantou in 1949 and now runs a stool-and-bench street stall under a canvas awning near 廟街. Before cheap enamel and plastic, people did not throw broken porcelain away: they paid a mender to drill tiny holes with a diamond-tipped bow drill and clamp the shards back together with brass staples (鋦釘, the real craft of 鋦瓷). Neighbours bring broken pieces, and each piece carries a life: a widow's wedding bowl, a refugee's only heirloom from the mainland, a teahouse's cracked teapot, a child's rice bowl broken in a family fight, a pawnshop owner's "antique" that may be fake. You mend the pieces, and through them you slowly mend your own past (a daughter left behind in 1949, letters that stopped).

Tone: quiet, humane, grounded, melancholic but warm. Fictional people in a real setting. No caricature, no fantasy.

Reference games (design): **Assemble with Care** (ustwo; tactile repair + one story per object), **Unpacking** (wordless storytelling through objects), **Papers, Please** (small daily economy and moral pressure at a desk). Not a toy: real craft decisions and real trade-offs.

## Core loop (one job ≈ 3–5 min)
1. **Customer arrives** (portrait + 2–4 lines). They describe the piece and what they can pay. Choices: quote price (fair / high / take it for free), promise a date, ask about the piece (unlocks story).
2. **Sort & clean**: shards (cut from the real AI-painted piece) lie scattered on the felt pad. Tap a shard to pick it up and wipe it (one tap).
3. **Reassemble**: tap a shard, then tap where it belongs on the faint outline of the piece. Forgiving: a placement within ~28px auto-snaps; rotation is automatic once the slot is right (or a large ⟲ rotate button that is ≥ 44px). Wrong placements bounce back with a soft clink. No precision drags required (drag may be supported as an extra).
4. **Mark the staples**: along each crack, tap to set staple positions. Spacing matters: too few → the piece leaks/weak (shown in the result), too many → ugly and costs brass; ideal is evenly spaced roughly every 1.5–2 cm on the real object. Show a pencil tick on the glaze for each mark.
5. **Drill**: a short rhythm action with the bow drill: tap in time with the bow strokes (a forgiving timing window, ≥ 180 ms). Pushing too fast risks a chip (a new mini-crack). Sound of the bow drill.
6. **Set staples & finish**: tap each hole pair to hammer a brass staple; a final water test (pour water, see if it holds) and polish. The finished piece is shown with real brass staples composited on the art.
7. **Hand back**: customer reaction varies with quality, price and promises kept; small story beats and letters.
- Days: ~12 days campaign, 2–3 jobs per day, rent due weekly to the landlord, rice and medicine costs, a brass supply that must be bought. Reputation in the street (街坊口碑) and money; your own eyesight/hands fatigue at night.
- Story arcs across days: (a) the pawnshop "Ming" bowl (fake or real? you can tell from foot ring and glaze details when assembled), (b) the refugee family's 潮州 teapot, (c) a teahouse owner who wants to switch to cheap enamel, the end of the trade, (d) letters from your daughter via a Macau intermediary. Endings: stall closes, you take an apprentice, reunion letter, and a quiet best ending.
- Save/continue in localStorage; chapter/day select after completion; ~45–60 min.

## Controls & UX
- iPhone Safari first: simple, forgiving taps, hit areas ≥ 44px, one-handed portrait, no hover reliance, no long-press needed, safe-area aware, no horizontal scroll. Check that `touchstart`/pointer events work in iOS Safari.
- **Diegetic UI**: the workbench IS the interface (felt pad, tin of staples, bow drill, glue dish, pencil, lamp). Money/receipts are written on a small paper ledger; the day and rent are on a torn calendar on the stall post. No floating card stacks, no dark glass, no neon, no generic dashboard, no emoji icons.
- Full-bleed title screen with the painted key art, period calligraphic title lettering, 「開檔 / 續做」 as painted labels on wood or paper.
- Must fit 390×844 and 375×667 with no overflow or clipped text. All text on paper/painted panels with strong contrast (≥ 4.5:1), body ≥ 15px.
- Sound: street ambience (Temple Street evening, distant Cantonese opera radio, rain on awning), porcelain clink, bow-drill whirr, tiny hammer taps, water pour; mute toggle; CC0 sources only, credited (or carefully synthesised with WebAudio as a fallback, but no beeps).

## Art Direction (ART IS #1 PRIORITY)
References (study, don't copy):
1. **Museum catalogue photography of Chinese export porcelain** (V&A / Palace Museum style): exact, rich glaze, real 青花 brushwork; the source for every piece you mend.
2. **Mid-century hand-painted Hong Kong film posters and Edward Hopper-like oil painting**: warm lamplight versus cool dusk, visible brushwork; the source for people and street scenes (the starter key art and portrait set this style).
3. **Assemble with Care / Unpacking**: calm, tactile, close-up object staging and generous negative space.
Style prompt for people/scenes (consistency is mandatory): "rich oil-painting brushwork like a mid-century illustrated film poster, 1957 Hong Kong Yau Ma Tei, warm tungsten lamp amber against cool blue-grey dusk, quiet, dignified, no text".
Style prompt for pieces: "exact top-down orthographic museum catalogue photograph of a single antique Chinese porcelain <piece>, perfectly centred, on a plain flat neutral warm grey background, even soft lighting, no text".
Palette: cobalt 青花 #2F4F7F, lamp amber #E2A04A, brass #B08A3E, felt oat #CFC3A8, teak #5A3B26, dusk slate #46505E, paper cream #EFE4CC, ink #1C1A17. No pure black/white, no neon.
Type: Noto Serif TC (body, already on most systems; self-host a subset if needed), a brush/kai display face pre-rendered as art for titles if no webfont fits; numbers in the ledger in a handwritten feel.
Art production (real tools only; NO code-drawn SVG/geometric art or emoji as main art):
- AI-generated images in the style prompts above, finished with Python Pillow (ImageMagick is not installed): crop, circular/alpha cutouts, unified colour grade, webp, ≤ 250 KB each.
- Shards: cut the real piece image into 4–9 irregular shards in code (canvas clip paths from a seeded crack generator, or pre-cut PNGs with Pillow). Draw thin realistic crack edges (light glaze edge + shadow), not cartoon outlines. Brass staples are a small AI-generated or photo-textured brass staple sprite (one image, rotated per position), never a CSS rectangle.
- Asset list (minimum): title key art 9:16 (starter on disk); workbench top-down 9:16 (starter on disk); 10–12 pieces (plates, bowls seen top-down, a teapot lid, a spoon, a 潮州 gongfu teapot top-down, a rice bowl, a 廣彩 famille-rose plate, a celadon dish, a pawnshop "Ming" bowl, an enamel tin cup for the ending), plate_01 on disk; brass staple sprite; 8 portraits 3:4 (陳太 widow, starter `assets/people/lau.webp` reused as 劉婆; pawnshop 何老闆; refugee father 林生 and daughter 阿珍; teahouse 黃老闆; landlord; a boy 細路明; Uncle Yip himself; a Macau go-between); 6 street/story vignettes 4:3 (stall at night in rain, Temple Street crowd, pawnshop interior, teahouse, tenement stairwell, harbour from Jordan Road ferry pier); 3–4 ending illustrations; letter paper; cover.webp 780×1040 + thumb.webp (starter on disk).

## Content accuracy
Get it right: 鋦瓷 technique (diamond-tipped bow drill, brass/copper staples called 鋦釘 / 蚂蝗钉 style, holes drilled not through the body, paste to seal; "沒有金剛鑽，別攬瓷器活"), 1957 Hong Kong prices in HK$ (a bowl repair a few 毫 to $1–2; rent, rice prices plausible), Yau Ma Tei / Temple Street / Jordan Road ferry, 1949–1957 refugee context, Chaozhou gongfu tea. No anachronisms (no plastic everywhere yet; enamelware and early plastics arriving is part of the story).

## Review gate (every grok review)
- Serve the build locally and play it in headless Chrome (puppeteer-core in /workspace/nightly/shotkit, chrome at /usr/bin/google-chrome) at 390×844 AND 375×667, touch emulation on; screenshot every screen to screenshots/review-<r>/ and LOOK at them.
- Strict art and layout pass: block SHIP on amateurish art, code-drawn placeholder art (CSS/SVG shards or staples with flat fills), emoji, inconsistent style, overflowing/clipped text, card-stack UI, dark glass/neon, tap targets < 44px, body < 15px, unreadable text on art, 404s.
- Playfeel: can a first-time player finish job 1 without instructions in under 4 minutes by tapping only? Is snapping forgiving? Do staple spacing and drilling actually change outcomes?
- Score Art, UI/Layout, Playfeel, Craft depth, Story/Writing, Accuracy, Audio, Flow, Perf each /100. SHIP only if all ≥ 90.

## Deliverables
index.html, src/, css/, assets/, tests/ (node tests: job data integrity, every job/portrait/vignette references an existing asset, shard generator always produces a solvable set covering the piece with no gaps, staple scoring rewards even spacing and penalises too few/too many, economy never NaN and a careful player can pay rent, a careless player can't), CHANGELOG.md, PROGRESS.md, in-game CREDITS (art tools, fonts, CC0 audio).

## Starter art on disk (generated before launch)
- assets/art/title_key.{jpg,webp}: 9:16 THE STYLE REFERENCE for people/scenes (the mended bowl with brass staples is the hero image).
- assets/art/bench.{jpg,webp}: 9:16 top-down workbench with felt pad (main play screen background).
- assets/plates/plate_01.webp: 900×900 transparent cutout of a 青花 landscape plate (first job's piece; style reference for pieces). `plate_01_src.jpg` is the raw source on grey.
- assets/people/lau.{jpg,webp}: 3:4 portrait of 劉婆 holding shards in a cloth (first customer; portrait style reference).
- assets/art/cover.webp 780×1040 + thumb.webp with title lettering.
- If your CLI can generate images, generate the remaining assets in exactly these styles. If it cannot, do NOT draw placeholders in code: write the exact prompts into assets/ART_REQUESTS.md (filename, aspect ratio, prompt) and build against those filenames, reusing starter art gracefully until they exist; the reviewer or supervisor will generate them.
