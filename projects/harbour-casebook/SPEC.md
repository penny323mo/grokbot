# 濠江疑案 · Harbour Casebook — SPEC

A serious, story-rich **deduction game** (in the spirit of *The Case of the Golden Idol* / *Return of the Obra Dinn*) set in **Macau's Inner Harbour, 1962**. The player does not get told the answer: they examine illustrated scenes, collect words (names, objects, motives, places) and then *prove* what happened by filling a structured deduction sheet. Tone: noir, humane, historically textured, never cartoonish. All in-game text in **Traditional Chinese (Cantonese-flavoured where it's dialogue)**; English subtitle only on the title screen.

Audience: Penny, playing on an **iPhone (390×844 portrait first)**. She wants depth and high production value — no toy game, no generic AI look, **no dark glass / neon**. She plays with one thumb.

## 1. Tech & constraints
- Static site, no build step required at runtime: `index.html` + ES modules in `src/` + `assets/`. No external CDNs (Phaser/howler etc. may be vendored from `~/creative-libs` if truly needed, but plain DOM/SVG/Canvas is preferred).
- Works offline once loaded; progress saved in `localStorage` (per case: found clues, filled slots, solved state).
- Tools available on the box (see `/workspace/engines/README.md`): ImageMagick, Inkscape, Noto CJK TC fonts, ffmpeg, sox, FluidSynth + FluidR3_GM soundfont, pretty_midi, pillow. **Use them** to make real assets: hand-authored SVG illustrations, a composed loopable ambient score, real SFX.
- A clear **「返回 grokbot」** link to `https://penny323mo.github.io/grokbot/` on the title screen and in the menu.
- Tests: `tests/*.test.mjs` runnable with `node` (no network) — at minimum validate every case's data (every slot answer exists in the word bank, every word is obtainable from a clue, solutions are unique), and the checker logic.

## 2. Visual direction (critical)
- **Archival paper & ink**: warm off-white paper (#F3EBDD-ish), deep ink (#1F1B16), one accent — Macau vermilion **#9A3B2C** — plus a muted jade (#4F6F5F) for "correct". Subtle paper grain via a small tiled noise PNG, thin rules, stamp/seal motifs (a red 印章 "結案" stamp when a case is solved).
- Typography: Noto Serif TC for headings and narration, Noto Sans TC for UI. Generous line-height, real hierarchy.
- Scenes are **illustrated SVG in a consistent style**: limited palette, ink linework, flat washes, 1960s Macau architecture (shophouses with arcades, pawnshop 押 sign, harbour junks, Portuguese tile, neon is NOT used — think hand-painted signboards). Each scene is one large tall illustration (approx 390×700 viewport, scrollable/pinch-zoomable) with 10–16 tappable hotspots.
- No emoji as icons; draw small SVG icons. No purple gradients, no glassmorphism.

## 3. Core loop
1. **Case file intro**: short typed narration with an archival photo-style illustration, the date, place, and the question(s) to answer.
2. **Investigate**: pan/zoom the scene. Tap a person/object → a bottom sheet (max 45% screen height) shows a description; **underlined words** in it can be tapped to collect into the notebook (word bank). Collected words fly into the notebook tab with a soft paper SFX. Hotspots already fully harvested get a small ink tick. Large tap targets (≥44px), forgiving hit areas.
3. **Deduce**: the notebook has a **deduction sheet** of sentences with blanks, e.g. 「＿＿＿ 用 ＿＿＿ 殺害咗 ＿＿＿，因為 ＿＿＿。」, plus a "who is who" table matching portraits to names. Tap a blank → word picker filtered by type (人名 / 物件 / 動機 / 地點 / 時間). Two taps max per fill.
4. **Check**: when a section's blanks are all filled, the game says only whether **all are correct** or "有 2 處或以下錯誤" (Golden Idol style partial feedback when ≤2 wrong), never which ones. Correct section locks with the jade colour and a stamp.
5. **Resolution**: an illustrated epilogue sequence revealing the full story with the player's reconstructed timeline.
6. **Hints** (optional, gentle): three tiers per section — a nudge, a pointed clue, then reveal one slot. Hint use shown in the case summary.

## 4. Content — 4 connected cases (one arc)
Write strong, coherent mysteries with fair-play clues; each case needs ~25–40 collectable words with decoys.
1. **〈押〉 當舖驚魂** (tutorial-sized but not trivial): a pawnbroker found dead at closing time in a Rua da Felicidade pawnshop; a pledged jade bracelet missing. 4 people, 2 deduction sections.
2. **〈潮〉 內港碼頭**: a cargo clerk drowned at the Inner Harbour; smuggling ledgers, a junk captain, a customs officer. 6 people, 3 sections including a timeline (order 4 events).
3. **〈戲〉 清平戲院後台**: a Cantonese opera actor collapses mid-performance; poison, rivalry, a fan's letters. 6 people, 3 sections + who-is-who portraits.
4. **〈燈〉 主教山之夜**: the finale ties the jade bracelet, the ledgers and the opera troupe into one conspiracy. 8 people, 4 sections, a final motive chain.
Cases unlock in order; a **case board** screen (cork-free; use a clean archival index-card layout) shows progress, time spent, hints used, and a stamp per solved case.

## 5. Audio
- Compose a real **loopable ambient score** (≈90–120 s each, 2 tracks: investigation and resolution) with pretty_midi + FluidSynth: slow, minor-key, erhu/guzheng-like + soft piano/strings timbres from GM; render to OGG/MP3 (small). Harbour ambience bed (synthesised water/wind with sox, very subtle).
- SFX: paper slide, word collect, pen scratch on fill, stamp thud on solve, gentle error tick. Mute toggle; audio starts only after first tap (iOS).

## 6. UX details (iPhone)
- Bottom tab bar (scene / 筆記 / 推理 / 選單) within thumb reach; nothing important in the top 15% except the case title.
- Safe-area insets respected; no horizontal scrolling of the page; pinch-zoom only inside the scene canvas.
- Readable sizes (body ≥16px). Contrast AA.
- First case includes an unobtrusive 3-step onboarding (tap hotspot → collect word → fill blank), dismissible and never auto-playing the move.
- Settings: text size, music/SFX volume, reset progress (with confirm).

## 7. Quality bar / done criteria
- All 4 cases fully playable start to finish, with solvable, unique, fair solutions verified by tests.
- Every scene is a real, detailed illustration (not placeholder boxes); a consistent art style across cases; cover-worthy title screen.
- No console errors; loads under ~3 MB total for first case (lazy-load later cases' art/audio).
- 390px-wide screenshots of: title, case board, a scene, the bottom sheet with underlined words, deduction sheet, solved stamp, epilogue.
- `CHANGELOG.md` updated each phase.

Reviewers (grok): play every case at 390px, check the logic/fairness of each mystery, the art consistency, tap targets, text overflow, and that the UI looks like a tasteful printed casebook rather than a generic AI app.
