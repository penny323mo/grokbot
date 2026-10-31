# 季風帆影 · Monsoon Carrack — SPEC

Nightly 2026-10-31. Single-player narrative trade-voyage strategy game, iPhone-first (390×844 portrait), static web (HTML/CSS/JS, no build step), deploys under grokbot `projects/monsoon-carrack/`. All user-facing text in Traditional Chinese (Cantonese voice for dialogue/letters, 書面語 for the ledger and chronicle), with Portuguese/Japanese place names as small secondary labels.

## Premise
Macau, 1600. You are the new 船主 (capitán) of a family-owned 黑船 (nau / carrack) after your elder brother is lost at sea. Over ~3 monsoon years (each year = NE monsoon sailing season + SW monsoon season) you must keep the family house solvent and repay a debt to a Guangzhou guild before the deadline, by buying silk, porcelain, musk and pepper, and sailing them to Nagasaki (silver), Manila (Mexican silver), Malacca (pepper, cloth) and back. Monsoon timing matters: sail out of season and you risk typhoons and delays. Between voyages, letters, crew petitions, rival merchants, officials and a slowly unfolding mystery about what really happened to your brother's ship drive branching choices. Endings: ruin, survival, fortune, and a hidden "true" ending. Tone: serious, literary, historically grounded (no fantasy, no caricature). Fictional characters in a real setting; avoid modern political framing.

Reference genre: **80 Days** (inkle — route planning + narrative vignettes + money/time pressure), **Sunless Sea** (voyage risk, crew, port stories), **Pentiment** (historical illustrated art and diegetic manuscript UI). Not a toy: real economic decisions, price differences by port and season, risk vs reward, consequences that carry over.

## Core loop
1. **Port (Macau or abroad)** — full-bleed painted port vignette. Diegetic choices as painted signboards/scroll labels: 市集 (buy/sell; prices vary by port, season and events), 船塢 (repair hull, hire crew, provisions), 書信 (letters/events), 啟航.
2. **Chart table** — the painted portolan chart IS the route UI: tap a port, see an in-world note slip with distance, monsoon fit (順風/逆風), risk and expected days. Confirm to sail.
3. **Voyage** — the ship advances along the chart over a few beats; 2–3 narrative event vignettes per voyage (storm, pirates/wokou, becalmed, sickness, a stranger rescued, smuggling offer) with 2–3 choices that spend cargo, silver, crew morale or hull, sometimes with a visible chance.
4. **Ledger** — the account book shows silver, debt, cargo hold (capacity), crew, hull, reputation with each port, and the year/season calendar. The ledger is a painted book spread, not a dashboard.
5. Year end: the guild collects instalments; chronicle page records what happened (generated from choices).
Goods: 生絲, 絲綢, 瓷器, 麝香, 胡椒, 白銀, 蘇木 — ~7 goods, with historically plausible directions (Chinese silk→Japan for silver is the big trade; Manila pays Mexican silver; Malacca for pepper). Balance so a careful player finishes in ~30–45 min; save to localStorage; continue; new game.

## Controls & UX
- Simple, forgiving taps; hit areas ≥ 44 px; never requires precision drags. Quantity selection via big +/− tap steppers and "全部/一半" quick buttons styled as brass/ink stamps.
- Diegetic UI: port signboards, chart table, note slips, ledger book, sealed letters ARE the interface. No floating card stacks, no dark glass, no neon, no generic dashboard panels, no emoji icons.
- Full-bleed title screen with the painted key art and a calligraphy title; 「續航 / 新船主」 as painted labels.
- Must fit 390×844 and 375×667 with no overflow, no clipped text, safe-area aware. Text sits on painted paper/gold-cloud panels with sufficient contrast.

## Art Direction (ART IS #1 PRIORITY)
References (study, don't copy):
1. **Nanban byōbu folding screens (e.g. Kanō Naizen's screens, c.1600, Museu Nacional de Arte Antiga / Kobe City Museum)** — gold-leaf clouds, mineral pigments, black carracks, merchants on quays. This is the primary look for title, ports, portraits and event vignettes.
2. **80 Days (inkle)** — confident illustrated travel UI, elegant typography, map as the main interface.
3. **Pentiment (Obsidian)** — manuscript-style diegetic text, period hand-lettering, restraint.
Palette: gold leaf #C9A24A, deep gold #8A6A2A, malachite #3F7D5C, azurite #2E4F86, vermilion #B6402C, ochre #C08A3E, parchment #EADCB8, ink #1F1A14, lacquer black #241C17. Avoid pure black/white and avoid neon.
Type: Noto Serif TC / 思源宋體 body; brush display face (e.g. Ma Shan Zheng / Zhi Mang Xing via Google Fonts, self-hosted if possible, or pre-rendered calligraphy PNG generated as art) for titles; IM Fell / Cormorant Garamond for Latin place names.
Art production (real tools only; NO code-drawn SVG/geometric art or emoji as main art):
- AI-generated painted illustrations in a single consistent style prompt: "Nanban byobu folding screen painting circa 1600, gold leaf clouds, mineral pigments malachite azurite vermilion ochre, fine ink linework, no text". Finish with ImageMagick (crop, palette grade, gold-paper texture overlay, webp export).
- Blender optional for a ship sprite / ship-on-chart token if a clean cut-out is needed (or AI art cut out with ImageMagick).
- Asset list (minimum): title key art (9:16), chart table (9:16), 5 port vignettes (Macau, Nagasaki, Manila, Malacca, Guangzhou) 4:3, ~10 event vignettes (storm/typhoon, wokou pirates, becalmed, sickness, rescue, smuggler, customs official, guild hall, chapel, shipwreck), 8 character portraits 3:4 (captain, mother, guild master, Japanese merchant, Jesuit interpreter, Spanish factor in Manila, first mate, rival merchant), 7 goods illustrations 1:1, ledger book spread texture, letter/seal paper, ship token, 3–4 ending illustrations, cover.webp 780×1040 and thumb.webp.
- Audio: sea/wind ambience, harbour bustle, wood creak, coins, paper, bell; CC0 sources only, credited.

## Content accuracy
Historically grounded: the Macau–Nagasaki "Great Ship" silk-for-silver trade, Manila galleon silver, Malacca as a Portuguese port, NE monsoon (roughly Nov–Mar) and SW monsoon (roughly May–Sep), typhoon risk in late summer. Look things up; no anachronisms in goods or places.

## Review gate (every grok review)
- Play the live/local build in a real browser at 390×844 AND 375×667, screenshot every screen to screenshots/review-<r>/.
- Strict art and layout pass: block SHIP on any amateurish art, code-drawn placeholder art, emoji, inconsistent illustration style, overflowing/clipped text, card-stack UI, dark glass/neon, tiny tap targets, unreadable text on busy art.
- Score Art, UI/Layout, Strategy depth, Story, Audio, Flow, Perf each /100; SHIP only if all ≥ 90.
- Verify a full first year (at least 2 voyages) plays through, prices respond to trades/season, and save/continue works.

## Deliverables
index.html, src/, css/, assets/, tests/ (node tests: economy data integrity, every event has art + valid choices, a scripted "careful player" simulation can repay the debt, no NaN/negative cargo), CHANGELOG.md, PROGRESS.md, in-game CREDITS.

## Starter art on disk (generated 2026-10-31 before launch)
- assets/art/title_key.{jpg,webp} — 9:16 carrack arriving at Macau, gold-cloud title space in the upper third. THE STYLE REFERENCE for all Nanban-style art.
- assets/art/chart_table.{jpg,webp} — 9:16 top-down cabin chart table (portolan chart, astrolabe, ledger, coins). Note it has painted red port dots; either align tap targets to them or regenerate a clean chart with ports exactly where you need them.
- assets/people/captain.{jpg,webp} — portrait style reference (3:4).
- assets/ports/nagasaki.{jpg,webp} — port vignette style reference (4:3).
- assets/art/cover.webp 780×1040 + thumb.webp (from title key; replace with a titled cover once calligraphy exists).
- If your CLI can generate images, generate the remaining assets in exactly this style. If it cannot, do NOT draw placeholders in code: write the exact prompts you need into assets/ART_REQUESTS.md (filename, aspect ratio, prompt) and build the game against those filenames; the reviewer will generate them.
