VERDICT: NOT READY

Round-1 grok review of **燈籠小鎮守夜人 v2** against SPEC.md (visual overhaul; v1 gameplay kept). Independently ran `node tests/*.test.mjs`: **22/22 pass**. Bot 20-seed: 悠閒 100% (20/20), 標準 90% (18/20), 挑戰 A1 85% (17/20). The four grok-R3 rule bugs are fixed and tested. The v2 brief is the art bar — Penny’s “小學生 level” — and `screenshots/v2/` still read as a dark-mode of the v1 cartoon grid. SPEC said iterate those shots until they look mature and dense. They do not.

---

## v2 bug-fix status (SPEC “Bug fixes”)

| # | Item | R1 |
|---|---|---|
| 1 | 突進 diagonal | **FIXED.** `battle.js:611-645` scores N / NW / NE empties. Test `rules.test.mjs` Round 3: blocked north → `cat.x === 1 \|\| 3`. |
| 2 | First tap on guardian → info | **FIXED in engine/UI.** `ui.js:198-204` always `onUnitInfo`; `app.js:531-535` opens the sheet; move is a button inside it (`ui.js:347-354`). Tutorial copy still describes the old first-tap-move (MAJOR 4). |
| 3 | Lantern tiles not legal empties | **FIXED.** `board.js:93-96` `isEmpty` requires `!tile.lanternId`. Tests: summon / fireball / `moveGuardian` onto (2,5) fail. |
| 4 | 貓巡邏員 text matches code | **FIXED.** `units.js:20` and `cards.js:30` say 「移動 1 格或以上」; double still on `hasMoved` / `stepsMoved >= 1`. Test v2 cat: 1-step move → 6 dmg. |

---

## CRITICAL

1. **The visual overhaul did not land. `screenshots/v2/` fail the SPEC self-check.**
   - SPEC: palette indigo/lantern/fog/parchment is fine, but also **no flat tiles, no cartoon clip-art, no thick black outlines**; board must be an **illustrated night-town with depth** (sky, distant rooftops, drifting fog, stone/bevel tiles, isometric or shadowed top-down, lantern posts lighting neighbours); units with rim light; cards with ornamented frames and unique art; polish of Into the Breach / Slay the Spire / Monument Valley; **iterate 390px shots until they look mature and dense**.
   - Evidence:
     - `screenshots/v2/battle.png` / `card-selected.png`: 5×6 of rounded rectangles (`css/style.css:423-435` gradient `#1C2344 → #141A35`). `.board-container` comment says “Illustrated night skyline backdrop” (`css/style.css:400-403`) but the background is two CSS gradients — **no rooftop SVG, no fog layers, no tile noise/pattern, no isometric tilt, no neighbour lantern wash**.
     - Units at 64px still read as cute sticker animals (cat ears + blob eyes). Readable, not atmospheric.
     - Hand / reward card “art” is 64×48 clip-art (`art.js:560-597`): circle-with-triangles cat, teardrop tea, triangle scarecrow, up-arrow 突進. Same language as town building icons (`art.js:540-556`: rect + triangle roof + dot).
     - Title (`screenshots/v2/title.png`) is the strongest screen (one lantern, serif title) and is still a sparse menu, not a dense night town.
     - Map is the v1 node graph recolored. Town is a list of 3-shape houses with wrapping names.
   - Fix: rebuild the board as layered SVG (skyline + fog + stone tile pattern + lantern radial glow on the post and the four orthogonal neighbours). Replace `SVG_ART.cardArt` with crops of the unit illustrations, not new geometric icons. Recapture `screenshots/v2/{title,map,battle,card-selected,reward,town}.png` (and tutorial) at 390×844 and **stop only when a stranger would not call it a kids’ dark-mode grid**.

---

## MAJOR

2. **Hand still ellipsis-truncates rules; first tap does not open the detail view.**
   - SPEC: “never ellipsis-truncate rules; tap a card → detail/enlarged view, tap again or button to play.”
   - `css/style.css:803-825`: `.card-title-serif { text-overflow: ellipsis }` and `.card-desc-compact { -webkit-line-clamp: 2 }`. `screenshots/v2/battle.png`: 「【稻草…」「【茶師傅】（生…」「指定一位友軍向前或斜向突進…多 2 格，並立即」.
   - `app.js:424-428` first tap selects + glows tiles; `app.js:403-421` **second** tap opens `openCardInspect`. Player can spend the card without ever seeing full text.
   - Fix: first tap → inspect modal (full rules, no clamp). Confirm / “出牌” then glow tiles. In-hand strip may show cost + title + art only.

3. **Card and town art is a second, cheaper clip-art set, not the unit illustrations.**
   - SPEC: unique SVG per card (or per type with variation); ornamented frame; type colour. Type colour is done (`card-type-summon|command|spell|lantern`). Art is not.
   - `art.js:562` `card_summon_cat` is a circle and two triangles; the board cat (`art.js:11-61`) is a full illustration the card never uses. Reward (`screenshots/v2/reward.png`) shows the same stickers at 48px.
   - Town (`screenshots/v2/town.png`): 「飛信驛站」 wraps mid-word 「鶴 / 郵差」; icons are 48px house glyphs.
   - Fix: `cardArt[id] =` the matching unit/spell SVG inside the frame. Give buildings a 64px illustrated thumbnail and `flex-shrink: 0` on the name so 鶴郵差 stays one line.

4. **Tutorial is still v1 copy and was not recaptured.**
   - SPEC: restyle tutorial with the other screens; grokbot must never overlap it.
   - Capture script (`scripts/capture_screenshots.mjs:4-10`) writes six v2 shots and **skips tutorial**. `index.html:397` still teaches first-tap-move: 「點擊未移動的友軍，金色格子為可走範圍」 — that is the R3 behavior you removed. `index.html:394` uses `var(--ink-secondary)` which **does not exist** in v2 CSS (no `--ink-*` in `style.css`).
   - Grokbot is pinned `top: 6px; left: 8px` (`css/style.css:115-121`) with nav `padding-left: 114px`. Menus in `screenshots/v2/` keep the chip off the home button. Tutorial padding-top 52px (`css/style.css:863-867`) is leftover from the bottom-left chip.
   - Fix: rewrite step 3 to “點單位開詳情，再按戰術移動”. Drop `--ink-secondary`. Capture `screenshots/v2/tutorial.png` with grokbot clear of the sheet.

---

## MINOR

5. **`index.html` chrome still inlines v1 thick-outline SVGs** (`stroke="#2C2621" stroke-width="2"`, lines 19–80) while `art.js:602+` already has parchment-on-indigo icons. The HTML copies win. Swap the buttons to `SVG_ART.icons`.

6. **`card-selected.png` still selects 稻草人 (`empty_tile`) so almost the whole board pulses gold**, including the visual noise of lantern posts sitting in a sea of valid-targets. Recapture with 貓巡邏員 so only rows 3–4 (non-post) glow.

7. **Map node still says `決戰黎明 (Boss)`** (`map.js:56`); 圖鑑 stamps `[BOSS]` (`ui.js` enemy list). SPEC: Cantonese throughout. Use 「首領」.

8. **Google Fonts CSS from `fonts.googleapis.com`** (`index.html:8-10`). SPEC allows OFL Noto via Google Fonts and CREDITS lists them. Bundle `woff2` under `assets/fonts/` anyway so grokbot / airplane mode still gets the serif hierarchy.

---

## What is solid

- Engine/render split, seeded RNG, relative paths, `index.html:454` `../_shared/back.js`, `gbPlaying` on battle only. Audio bundle + CREDITS + mp3→m4a→synth. Mute persisted. `prefers-reduced-motion` (`css/style.css:1124`).
- Indigo / lantern-gold tokens are in `:root`. Type-coloured card frames. Serif titles on the title screen. Grokbot reserved on the top nav.
- All four SPEC bug fixes have node tests. Halo, trap-on-walk, targeted 移位陣法, tap-to-move via the info sheet, versioned save, 3 difficulties + A1, town unlocks remain.
- Tests 22/22. Bot win rates 100 / 90 / 85.

Do not ship on palette swap + clip-art cards. Rebuild the board and card art, recapture v2 shots (including tutorial), then re-review.
