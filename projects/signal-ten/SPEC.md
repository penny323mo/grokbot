# 十號風球 · Signal Ten — SPEC

Nightly 2026-11-01. Single-player narrative decision/forecasting game, iPhone-first (390×844 portrait, also 375×667), static web (HTML/CSS/JS, no build step, relative paths), deploys under grokbot `projects/signal-ten/`. All user-facing text in Traditional Chinese: Cantonese voice for dialogue, radio calls and colleagues; 書面語 for official bulletins, telegrams and newspaper headlines. English only as small period labels (e.g. "ROYAL OBSERVATORY HONG KONG" letterhead).

## Premise
Hong Kong, 1962. You are 林志恆, a newly promoted Chinese 助理預報員 (Scientific Officer) at the Royal Observatory on 彌敦道 Nathan Road hill, working the night shift. Typhoons approach from the Pacific and the South China Sea. You read incoming telegrams, plot positions on the synoptic chart, judge the likely track, and decide WHEN and WHICH storm signal to hoist. Hoist too early and the harbour shuts for nothing: ferries stop, dock workers lose a day's wage, the Director and the press question you. Hoist too late and junks are caught in open water, squatter huts on hillsides collapse, ships drag anchor. Every decision lands on real-feeling people: a 大澳 fishing family, a 天星小輪 coxswain, a 調景嶺 squatter-hut mother, a tramp-ship captain, your own wife waiting at home in 深水埗.

Tone: serious, humane, grounded (no fantasy, no caricature, no disaster spectacle for its own sake). Fictional characters in a real setting. Respectful toward the real 1962 Typhoon Wanda (溫黛); avoid naming real victims.

Reference games (design): **Papers, Please** (desk-bound diegetic document work under pressure, consequences in the morning), **Orwell / Do Not Feed the Monkeys** (reading incoming data and judging), **80 Days** (narrative consequences after decisions). Not a toy: decisions under uncertainty with honest probability, no "right answer" button.

## Structure
- **Campaign of 4 storms** (each 10–15 min): 1. a mild August storm that recurves away (tutorial, Signal 1→3 then lowered); 2. a fast storm that threatens then veers (temptation to over-warn); 3. a slow, erratic storm at night (judgement under conflicting reports); 4. 溫黛 Wanda, 31 Aug–1 Sep 1962: direct hit, the hardest night, culminating in the decision to hoist No. 10.
- Each storm = 5–8 **shifts** (3-hourly synoptic times, e.g. 21:00, 00:00, 03:00…). Each shift:
  1. **Telegrams arrive** on the desk (ship reports, 東沙 Pratas / 橫瀾島 Waglan / Guam aircraft reconnaissance, Manila/Taipei/Macau warnings), some contradictory or late. Tap a telegram to read it on a full paper slip; tapping 「標上圖」 plots its fix automatically on the chart (no precision drags).
  2. **Synoptic chart**: the chart shows plotted fixes with time labels and an uncertainty cone. The player chooses among 2–3 pencilled forecast tracks (big tap targets) and sets their confidence.
  3. **Barometer & anemometer** readings at the observatory and Waglan shown as diegetic instruments (painted dials/barograph trace) — trend matters.
  4. **Decision**: which signal to hoist now, using the period-accurate 1962 Hong Kong system: No. 1 (standby), No. 3 (strong wind), Nos. 5/6/7/8 (gale or storm from NW / SW / NE / SE quadrants), No. 9 (gale increasing), No. 10 (hurricane force). Plus optional actions: phone the Marine Department, issue a radio bulletin to 麗的呼聲 / 香港電台, call the Director at home.
  5. **Consequence vignettes**: short illustrated beats from the harbour and city reacting (typhoon shelter crowded or empty, ferries suspended, hillside huts). Effects are tracked as: 人命風險 (lives at risk), 市面損失 (economic cost of disruption), 公信力 (public trust), 天文台長信任 (Director's confidence), 身心 (your own fatigue).
- **Morning after** each storm: a 華僑日報-style front page and an official report page summarise outcomes and quote people; the Director's note grades you. Endings across the campaign: dismissed, transferred, trusted forecaster, and a quiet best ending.
- Weather model: each storm has a scripted true track with seeded noise; reports carry realistic error; the forecast tracks are plausible alternatives. Wind at Hong Kong derives from distance/bearing to the storm centre and intensity; signals have historical-quadrant logic (e.g. storm to the SE → No. 8 SE / 「八號東南」 in modern naming; for 1962 use No. 7 or 8 per that era's quadrant table — look it up and be correct, show the quadrant meaning on the signal board).
- Save/continue in localStorage; chapter select after completion; ~45–60 min full campaign.

## Controls & UX
- Simple, forgiving taps only; hit areas ≥ 44 px; no precision drags; one-handed portrait.
- **Diegetic UI**: the forecaster's desk IS the interface — telegram slips, a clipboard of observations, the synoptic chart pinned under a desk lamp, a black Bakelite phone, the barograph, and a painted **signal mast board** (the actual hoisted shapes: cones, cylinders, crosses; render these as painted art assets, not CSS shapes) to choose the signal. No floating card stacks, no dark glass, no neon, no generic dashboard panels, no emoji icons.
- Full-bleed title screen with painted key art, calligraphic/period-poster title lettering, 「開工 / 續班」 as painted labels.
- Must fit 390×844 and 375×667 with no overflow or clipped text, safe-area aware. All text sits on paper/painted panels with strong contrast (≥ 4.5:1), body ≥ 15px.
- Sound: rain, wind rising with storm proximity, teleprinter clatter, phone ring, paper, a distant typhoon gun/siren; mute toggle; CC0 sources only, credited.

## Art Direction (ART IS #1 PRIORITY)
References (study, don't copy):
1. **Fan Ho's 1950s–60s Hong Kong photographs** (e.g. "Approaching Shadow") — dramatic shafts of light, rain-wet streets, deep shadow; source of mood and composition for city/harbour vignettes.
2. **1960s Hong Kong cinema poster painting (Shaw Brothers / Cathay/MP&GI era hand-painted posters)** and mid-century gouache illustration — painterly, warm, rich brushwork; source of the rendering style for people and scenes.
3. **Papers, Please / Pentiment** — period documents as the UI: real typewriter telegram forms, carbon copies, rubber stamps, pencil annotations.
Style prompt (use for ALL generated art, consistency is mandatory): "mid-century gouache painting, 1962 Hong Kong, painterly brushwork like a hand-painted 1960s Hong Kong film poster, Fan Ho style dramatic light and rain, muted warm palette, no text".
Palette: lamp amber #E2A04A, signal red #B5452B, harbour teal #2F5E63, storm slate #3C4650, typhoon-sky green-grey #6E7A6A, paper cream #EFE4CC, carbon blue #2B3A67, ink #1C1A17. Avoid pure black/white and neon.
Type: Noto Serif TC (body), a period typewriter face for telegrams (e.g. "Special Elite" or "Courier Prime", self-hosted if possible), a strong period display face for headlines/titles (pre-rendered as art if a suitable webfont isn't available). Newspaper page in 書面語 with tight column layout.
Art production (real tools only; NO code-drawn SVG/geometric art or emoji as main art):
- AI-generated painted illustrations in the single style prompt above; finish with ImageMagick (crop, unified colour grade, paper grain, webp export, sizes ≤ 250 KB each).
- Diegetic object art (telegram blank, chart paper with real South China Sea coastline, barograph, signal-shape set, phone, stamps) as AI-generated or photo-textured images composited with ImageMagick; the chart's coastline must be geographically correct (Hong Kong, Pearl River estuary, Hainan, Luzon, Taiwan) — generate a clean base chart and position plotted fixes by lat/long projection in code.
- Asset list (minimum): title key art 9:16 (starter on disk); forecaster desk 9:16 (starter on disk); synoptic chart base (accurate geography); 4 storm cover vignettes; ~14 consequence vignettes (typhoon shelter full / empty, Star Ferry suspended, hillside huts in rain, Marine Dept launch, tram in flooded street, ship dragging anchor, fishing junk at sea, family taping windows, radio shop crowd, observatory mast hoisting signal, collapsed huts aftermath, calm morning harbour, Director's office, newspaper stand); 8 portraits 3:4 (林志恆 starter on disk; the Director (British, 50s); senior forecaster 何Sir; radio officer; 大澳 fisherman 亞勝; Star Ferry coxswain; squatter mother 陳太; wife 秀蘭); the signal-shape set; telegram blank; newspaper masthead; 4 ending illustrations; cover.webp 780×1040 + thumb.webp (starter on disk).

## Content accuracy
Look things up and get it right: the 1962 Hong Kong signal numbering and shapes (Nos. 1, 3, 5–8 quadrant, 9, 10); the Royal Observatory location (Tsim Sha Tsui, Nathan Road hill) and Waglan Island station; 1962 Hong Kong (Star Ferry, trams, typhoon shelters, squatter areas, Rediffusion 麗的呼聲, Radio Hong Kong); Typhoon Wanda's broad story (formed east of the Philippines late Aug 1962, crossed near Hong Kong morning of 1 Sep, No. 10 hoisted, record storm surge in Tolo Harbour / 沙田). No anachronisms (no satellites imagery, no mobile phones; 1962 had aircraft reconnaissance and radar on Tate's Cairn was later — check).

## Review gate (every grok review)
- Serve the build locally (e.g. `python3 -m http.server`) and play it in headless Chrome (puppeteer-core in /workspace/nightly/shotkit, chrome at /usr/bin/google-chrome) at 390×844 AND 375×667; screenshot every screen to screenshots/review-<r>/ and LOOK at them.
- Strict art and layout pass: block SHIP on any amateurish art, code-drawn placeholder art, CSS-shape signals, emoji, inconsistent illustration style, overflowing/clipped text, card-stack UI, dark glass/neon, tiny tap targets, unreadable text on busy art.
- Score Art, UI/Layout, Decision depth, Story, Accuracy, Audio, Flow, Perf each /100; SHIP only if all ≥ 90.
- Verify storm 1 and storm 2 play through end-to-end, signal choices change outcomes, and save/continue works.

## Deliverables
index.html, src/, css/, assets/, tests/ (node tests: storm data integrity, every event/vignette references an existing asset, signal logic matches the 1962 table, a scripted "sound forecaster" beats each storm with acceptable outcomes and a "never hoist" player gets bad outcomes, no NaN), CHANGELOG.md, PROGRESS.md, in-game CREDITS (art tools, fonts, CC0 audio).

## Starter art on disk (generated before launch)
- assets/art/title_key.{jpg,webp} — 9:16 THE STYLE REFERENCE for everything.
- assets/art/desk.{jpg,webp} — 9:16 forecaster's desk at night (top-down/three-quarter), the base for the main diegetic screen.
- assets/people/lam.{jpg,webp} — protagonist portrait 3:4, portrait style reference.
- assets/scenes/shelter.{jpg,webp} — consequence vignette style reference 4:3.
- assets/art/cover.webp 780×1040 + thumb.webp.
- If your CLI can generate images, generate the remaining assets in exactly this style. If it cannot, do NOT draw placeholders in code: write the exact prompts into assets/ART_REQUESTS.md (filename, aspect ratio, prompt) and build against those filenames; the reviewer or supervisor will generate them.
- NOTE: the starter title_key shows a red-black FLAG on the mast, which is NOT a correct 1962 signal shape. Before release, regenerate or retouch it so the mast carries a correct painted signal shape (or no shape), then rebuild cover.webp/thumb.webp with a proper title lettering overlay.
