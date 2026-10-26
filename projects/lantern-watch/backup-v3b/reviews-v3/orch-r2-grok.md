VERDICT: NOT READY

Round-2 grok re-review of **燈籠小鎮守夜人 v2** against SPEC.md. Independently ran `node tests/*.test.mjs`: **22/22 pass**. Bot 20-seed: 悠閒 100% (20/20), 標準 90% (18/20), 挑戰 A1 85% (17/20). R1 CRITICAL board-depth work is in the shots: skyline, moon, lantern-neighbour wash, first-tap inspect. Two starting-deck cards still paint as the cat, and reward/shop still ellipsis-truncate rules. Do not ship.

---

## R1 status

| R1 | Topic | R2 |
|---|---|---|
| C1 | Board depth / skyline / lantern wash / clip-art grid | **FIXED enough to drop CRITICAL.** `art.js:602-633` `SVG_ART.skyline`; `index.html:175-176` skyline + fog layer; `ui.js:167-171` + `css/style.css:512-528` lantern-post + orthogonal neighbour glow. `screenshots/v2/battle.png` shows moon, eave silhouette, warm wash on tiles above the three posts. Tiles have a CSS bevel (`css/style.css:460-478`). Title/map remain sparse; command/spell art is still stickers — see MAJOR 3. |
| M2 | Hand ellipsis + first tap inspect | **PARTIAL.** Hand no longer prints rules (`ui.js:284-291`). `app.js:416-433` first tap always opens `#modalCardInspect`. Reward (`app.js:619`) and shop (`app.js:692`) still use `.card-desc-compact` clamp — MAJOR 2. |
| M3 | Card art = unit SVG; town 64px + nowrap | **PARTIAL.** Summon cards alias to unit SVGs (`art.js:662-682`) except two **wrong keys** (MAJOR 1). Town `.bldg-thumb` 64px and `.bldg-subtitle { white-space: nowrap }` (`css/style.css:1141-1184`). `screenshots/v2/town.png` keeps 「鶴郵差」 on one line. |
| M4 | Tutorial copy + capture + grokbot | **FIXED.** `index.html:399` 「點友軍開詳情，再按『戰術移動』」. `--ink-secondary` gone. `screenshots/v2/tutorial.png` exists; grokbot sits in the top-left reserved pad, clear of the sheet. |
| m5 | index.html v1 chrome SVGs | **FIXED.** Nav icons match `art.js:icons` parchment-on-indigo (`index.html:19`). |
| m6 | card-selected scarecrow whole-board glow | **FIXED.** Capture selects 貓巡邏員; `screenshots/v2/card-selected.png` glows rows 3–4 / empty row-5, not the three posts. |
| m7 | `決戰黎明 (Boss)` / `[BOSS]` | **FIXED.** `map.js:56` 「首領」; `ui.js:543` `[首領]`. |
| m8 | Bundle OFL fonts | **PARTIAL.** `assets/fonts/notoseriftc.woff2` + `@font-face` (`css/style.css:1-6`). `index.html:8-10` still loads Noto Sans (and Serif) from Google Fonts CDN. |

Four SPEC rule bugs stay green: diagonal 突進, first-tap unit info, `isEmpty` excludes lanterns, 貓 text matches `hasMoved`.

---

## CRITICAL

None.

---

## MAJOR

1. **燈籠匠 and 小龍 card art resolve to `undefined` and fall back to the cat.**
   - `art.js:667-668` assigns `SVG_ART.mole_smith`; `art.js:673-674` assigns `SVG_ART.lantern_dragon`. Neither key exists. Real sprites are `lantern_crafter` (`art.js:212`) and `little_dragon` (`art.js:191`).
   - `ui.js:282` then does `SVG_ART.cardArt[id] || SVG_ART.cardArt.card_summon_cat`. Starting-deck 燈籠匠 therefore renders as 貓巡邏員. Visible in `screenshots/v2/battle.png` (second hand card labelled 燈籠匠, cat portrait).
   - Fix: `SVG_ART.cardArt.card_summon_lantern_crafter = SVG_ART.lantern_crafter` (and `_plus`); `card_summon_dragon` / `_plus` = `SVG_ART.little_dragon`. Recapture battle + reward.

2. **Reward and shop still ellipsis-truncate rules.**
   - SPEC: “never ellipsis-truncate rules; tap a card → detail/enlarged view.”
   - Battle hand is clean (art + title only, inspect on tap). Reward `app.js:619` and shop `app.js:692` inject `${c.desc}` into `.card-desc-compact` (`css/style.css:895-904`, `-webkit-line-clamp: 2`). `screenshots/v2/reward.png`: 「【茶師傅】（生命 7，回…結束為相鄰友軍回復」「造成 8 點巨…雷擊傷害！」「升…供 5 點護甲。」
   - Fix: drop the compact desc on those 92×136 tiles. Tap-to-inspect (reuse `openCardInspect`) or a full-text sheet under the row. Same for upgrade modal if it still clamps (`app.js` ~829).

3. **Command / spell / lantern vignettes are still geometric clip-art; title and map are still empty menus.**
   - SPEC allowed “unique SVG per card **or per card type with variations**.” Summon cards (when the alias is valid) now reuse unit art. Command/spell/lantern stay 64×64 stickers: up-arrow 突進, bolt 驚蟄神雷, shield 竹符結界 (`art.js:574-598`, `screenshots/v2/battle.png` / `reward.png`).
   - Title (`screenshots/v2/title.png`) is one lantern on a void. Map is the v1 node graph recolored. Fog layer (`css/style.css:432-440`) is two static radials — SPEC asked for gentle **animated** fog (`prefers-reduced-motion` already exists at `css/style.css` ~reduced-motion block).
   - Fix: give each non-summon type 3–4 illustrated vignettes (gust, trap, oil, flare) instead of shapes. Put a cropped skyline or lantern street behind the title buttons. Drift the fog with a 12s opacity/translate keyframe, disabled under `prefers-reduced-motion`.

---

## MINOR

4. **Noto Sans TC is CDN-only.** Serif is local (`assets/fonts/notoseriftc.woff2`). Body copy (`--font-body`) still depends on `fonts.googleapis.com` (`index.html:10`). Bundle `notosanstc.woff2` the same way, or point `--font-body` at the serif face offline.

5. **`.card-title-serif` is `white-space: nowrap` with no ellipsis** (`css/style.css:884-893`). 5×70px hand titles currently fit; 掌風擊退 / 連環迅擊 will clip. Allow a 2-line wrap or shrink the type.

6. **Town body copy still clips the last row.** `screenshots/v2/town.png` 鍛造工房: 「升級為 +」 cut off. `.bldg-desc` needs a bit more line-height / card padding, or let the list scroll with the last card fully visible.

7. **No isometric / SVG stone noise.** Bevel via CSS borders is a fair top-down read. Optional: a repeating `feTurbulence` fill on `.grid-tile` so pavers are not identical.

---

## What is solid now

- Skyline + moon + window lights behind the grid; lantern posts light orthogonal neighbours; beveled slate tiles; unit rim/drop-shadow. Battle screenshot is a night scene, not a beige grid painted indigo.
- First tap on a hand card opens inspect; first tap on a unit opens the sheet with 戰術移動. Tutorial matches that. Grokbot reserved on the top nav (`padding-left: 114px`) and clear of the tutorial sheet.
- Summon cards that alias correctly (貓, 茶師傅, 稻草人, …) show the board illustration. Type-coloured frames. 5 cards fit 390px with no rules clamp in-hand.
- Relative paths, `../_shared/back.js`, `gbPlaying`, audio bundle, versioned save, 3 difficulties + A1, 22/22 tests.

Point the two cardArt aliases at `lantern_crafter` / `little_dragon`, stop clamping reward/shop rules, then this is a SHIP candidate.
