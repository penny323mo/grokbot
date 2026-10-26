# Prompt 工作室 — V2 Round 2 Grok Re-review

Checked `CHANGELOG.md` “V2 Round 2 fixes”, `screenshots/v2/after-r2-*.png` (light/dark × builder/video/recipes/library), and the CSS/JS named in `reviews/v2-grok-r1.md`. Ran `node --test tests/prompt_studio.test.js` (14/14 pass). Did not edit code.

The R1 P0/P1 list is fixed. Light grouped UI + true-black dark mode now have a header that fits 390px, a collapsed sheet that actually shows the English prompt, and Recipes/Library that are no longer buried under composer chrome.

---

## Status of R1 findings

| # | Sev | Finding | Status |
|---|-----|---------|--------|
| 1 | P0 | Collapsed sheet hides the prompt; covers Recipes/Library | **FIXED** |
| 2 | P0 | Library toolbar clips 匯入 at 390px | **FIXED** |
| 3 | P1 | Header title ellipsizes to “Prompt 工…” | **FIXED** |
| 4 | P1 | 「＋ 新增鏡頭」 wraps to two lines | **FIXED** |
| 5 | P1 | `--fill-secondary` undefined | **FIXED** |
| 6 | P1 | 清空 fills a full default portrait | **FIXED** (image); video leftover, see remaining P2 |
| 7 | P1 | Keyboard `transform` drops `translateX(-50%)` | **FIXED** |
| 8 | P2 | Type scale / large titles | **FIXED** (32px/700 「靈感配方」「提示詞庫」) |
| 9 | P2 | No `color-scheme` for native controls | **FIXED** |
| 10 | P2 | Segmented 36px track vs 44px `min-height` | **FIXED** |
| 11 | P2 | Shot ▲▼✕ look disabled | **FIXED** |
| 12 | P2 | PWA status bar `default` | **FIXED** (`black-translucent`) |
| 13 | P2 | Wrong `before-01` screenshot | n/a (process) |

### Evidence

1. **Sheet.** `.prompt-sheet { max-height: 128px }` (`css/style.css:1015`). Collapsed hides header / copy-chip / explanation (`1062-1092`) and `-webkit-line-clamp: 2` on `#promptDisplay`. `after-r2-builder-*.png` and `after-r2-video-*.png` show two lines of English plus 複製/儲存/隨機/清空. Recipes/Library: `switchTab` sets `promptSheet.style.display` (`js/app.js:922-925`) and `[data-active-tab="tab-recipes"|"tab-library"] .prompt-sheet { display: none }` (`css/style.css:1025-1028`). `after-r2-recipes-*.png` / `after-r2-library-*.png` have no sheet; second recipe/library card is on screen. Padding is `tab-bar + safe-area + 24px` (`1434`, `1538`).

2. **Library toolbar.** `.search-input-wrap { min-width: 0 }` (`css/style.css:1553`). Placeholder shortened (`index.html:428`). `.btn-lib-action` is 44×44, `.btn-label { display: none }` (`css/style.css:1600-1626`), `aria-label` on both buttons (`index.html:432-437`). Both icons fully visible in `after-r2-library-*.png`.

3. **Header.** Two rows: `.header-top-bar` (mark + full 「Prompt 工作室」 17/700, no ellipsis) + full-width segmented (`index.html:28-74`, `css/style.css:163-280`). Segment hidden on Recipes/Library (`css/style.css:266-268`). Title is complete in all eight after-r2 shots.

4. **新增鏡頭.** `#btnAddShot { white-space: nowrap; flex-shrink: 0 }` (`css/style.css:881-883`). Single line in `after-r2-video-*.png`.

5. **`--fill-secondary`.** Light `rgba(118, 118, 128, 0.20)`, dark `0.32` (`css/style.css:31`, `83`).

6. **清空.** `getDefaultState` is an empty canvas (`js/prompt.js:32-60`): `subject: ""`, `style/lighting/…: null`, empty chip arrays. Image `buildPrompt` returns `""`. Clear still goes through this object (`js/app.js:1402`).

7. **Keyboard.** `setupVisualViewport` only toggles `.keyboard-open` (`js/app.js:1353-1357`). CSS keeps `translateX(-50%) translateY(120%)` (`css/style.css:1031-1034`). No inline `transform`.

8–12. Large titles `.ios-large-title { font-size: 32px; font-weight: 700 }` (`css/style.css:360-366`). `:root { color-scheme: light dark }` / dark `{ color-scheme: dark }` (`css/style.css:10`, `72`). Segmented visual 36/32 with `::after { inset: -6px -2px }` (`271-307`). Shot actions `--text-primary`, delete `--accent-destructive` on red fill (`css/style.css:941-965`); ✕ is clearly red in `after-r2-video-*.png`. Status bar `black-translucent` (`index.html:10`).

---

## Remaining issues

No remaining P0. No remaining P1 that still blocks the R1 bar.

1. **P2 — Collapsed sheet is still a 128px action dock.** R1 asked ~64–80px: prompt line + one Copy. Shipping collapsed chrome still includes 儲存 / 隨機 / 清空 (`after-r2-builder-*.png`), which duplicate the header 🎲/🧹. Hide 隨機/清空 (and maybe 儲存) until `.expanded`.

2. **P2 — Video 清空 is not empty.** `getDefaultState("video")` still sets `cameraMovement: "push_in"`, `pacing: "smooth_steady"`, `duration: 5`. `buildPrompt` of that state is `smooth slow push-in camera movement towards the subject, smooth, steady and measured cinematic pace, 5 seconds video clip`. Null those video fields on clear (or skip them in `buildPrompt` when the user has not chosen them).

3. **P2 — Header 🎲/🧹 stay on Recipes and Library.** `after-r2-recipes-*.png` / `after-r2-library-*.png`. Surprise/clear from a browse tab mutate the hidden builder with no live preview. Hide `.header-right` with the same `[data-active-tab="tab-recipes"|"tab-library"]` rule as `.header-center`.

4. **P2 — 匯出 / 匯入 are two similar tray glyphs.** Labels are CSS-hidden; `aria-label` is set. At a glance in `after-r2-library-*.png` they read as the same orange box. Keep icon-only, but use a clearer pair (square-and-arrow-up vs tray-and-arrow-down) or a one-letter 出/入.

5. **P2 — Light-mode header icon contrast.** 🎲/🧹 use `--text-secondary` (`css/style.css:237`) and wash out on `#F2F2F7` (`after-r2-builder-light.png`). Use `--text-primary`.

6. **P2 — Large title is 32px, not 34px.** Close enough for iOS; bump to 34px if matching the redesign brief exactly.

---

## Tests / regressions

- `node --test tests/prompt_studio.test.js`: **14/14 pass** (purity, recipe ids, corruption, quota, `sanitizeState`).
- Image default prompt is `""`; recipes still English. No new JS feature breakage spotted (confirm-on-recipe, 另存新檔, quota toasts, `sanitizeState` still wired).

The V2 visual direction plus these layout fixes is now in the Apple/Linear neighborhood on 390px. Remaining items are polish, not blockers.
