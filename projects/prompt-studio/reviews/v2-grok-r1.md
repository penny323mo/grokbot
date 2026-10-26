# Prompt 工作室 — V2 Round 1 Grok Review

Visual redesign vs `CHANGELOG.md` “V2 Round 1”, `css/style.css`, and `screenshots/v2/after-r1-*.png` (light/dark × builder/video/recipes/library). Compared with `before-*.png`. Checked JS/HTML for feature regressions. Ran `node --test tests/` (14/14 pass). Did not edit code.

**What improved.** The purple-glass / gold-neon look is gone. Light mode is real iOS grouped UI (`#F2F2F7` page, white cards, hairline separators, System Blue `#007AFF`). Dark mode is true black / `#1C1C1E` cards / `#0A84FF`, not muddy glass. Chips as filled pills with a solid selected state, frosted tab bar, monospace prompt card, `prefers-reduced-motion`, inputs forced to 16px, and most hit areas declared 44px. Round-1 behaviour is still in the JS (`sanitizeState`, `subjectEn`, recipe confirm, 另存新檔, quota toasts, SW v2). Prompts stay English (test 10 + a 20-trial randomize check).

**What is not Apple/Linear yet.** The collapsed live sheet still hides the prompt, the 390px chrome overflows or ellipsizes the title, and Recipes/Library are half-covered by composer chrome that belongs on 創作.

---

## P0

1. **Collapsed live sheet is ~200px and does not show the English prompt.**  
   Every after-r1 screenshot: handle + “即時 Prompt 預覽” + a second “複製 Prompt” chip + an empty grey well + a four-button footer (複製 / 儲存 / 隨機 / 清空). The actual prompt text is clipped to nothing. `css/style.css:958` sets `.prompt-sheet { max-height: 200px }` while the footer + duplicate copy chip + `min-height: 60px` prompt card (`css/style.css:1109`) already exceed that. The product’s output is the one thing the sheet exists to show.

   Recipes (`css/style.css:1323`) and Library (`css/style.css:1462`) only pad `120px` for a sheet+tab stack of ~256px, so the first recipe CTA sits on the fold and later cards never appear without scrolling under the sheet (`after-r1-recipes-*.png`, `after-r1-library-*.png`).

   **Fix:** Collapsed height ≈ 64–80px: one truncated prompt line + one primary Copy. Put 儲存 / 隨機 / 清空 (and 中文解說 / negative) only in `.expanded`. Hide `#btnCopyPrompt` in the sheet body while the footer Copy exists, or drop the footer Copy. On `tab-recipes` / `tab-library`, hide the sheet (or collapse to a 44px bar) and raise `padding-bottom` to `calc(var(--tab-bar-height) + env(safe-area-inset-bottom) + 16px)`.

2. **Library toolbar clips 匯入 at 390px.**  
   `after-r1-library-light.png` / `dark.png`: search field + 匯出 (label wrapping 匯/出) + 匯入 cut off on the right edge. `.library-toolbar` (`css/style.css:1465-1470`) is a non-wrapping flex row. `.search-input-wrap` is `flex: 1` without `min-width: 0`, so the long placeholder (`index.html:424`) keeps min-content width and shoves the two `.btn-lib-action` buttons past the viewport.

   **Fix:** `min-width: 0` on `.search-input-wrap`. Icon-only 44×44 匯出/匯入 (text in `aria-label` / `title`), or put those two buttons on the next row. Confirm `scrollWidth <= 390` on the library pane.

---

## P1

3. **Header cannot fit 390px — title becomes “Prompt 工…”.**  
   Visible in all eight after shots. `.app-header` (`css/style.css:157-169`) packs logo + two-line title + iOS segmented 圖片/影片 + two 44px icon buttons. `.brand-title` ellipsizes (`css/style.css:191-200`). The old neon header wrapped “Prompt 工作 / 室”; V2 truncates instead. Still not a native nav.

   **Fix:** One of: (a) mark-only brand, title as `aria-label`; (b) move 圖片/影片 onto a second header row (full-width `UISegmentedControl`); (c) drop header 🎲/🧹 (they already exist on the sheet footer). Do not ellipsis the app name to two characters.

4. **「＋ 新增鏡頭」 wraps to two lines.**  
   `after-r1-video-light.png` / `dark.png`: the blue CTA reads “＋ 新增 / 鏡頭” beside “分鏡故事板 (Shot List)”. `.storyboard-header` (`css/style.css:813-818`) is space-between; `.btn-accent` (`css/style.css:832-846`) has no `white-space: nowrap` and no `flex-shrink: 0`.

   **Fix:** `white-space: nowrap; flex-shrink: 0` on the button. Shorten the left title, or stack the button full-width under the heading.

5. **`--fill-secondary` is never defined.**  
   Used on chip hover (`css/style.css:572`), copy-chip active (`1095`), footer secondary active (`1267`), modal secondary active (`1761`). `:root` only defines `--fill-tertiary` / `--fill-quaternary` (`css/style.css:29-30`). On iOS, `:hover` sticks after the first tap; an invalid `var()` drops `background` and the chip can flash empty.

   **Fix:** Add `--fill-secondary: rgba(118, 118, 128, 0.20)` (light) and `0.32` (dark), or replace those rules with `--fill-tertiary`.

6. **清空 no longer clears.**  
   `getDefaultState` (`js/prompt.js:32-60`) now returns a complete portrait build (subject, scene, style, lighting, camera, mood, palette, four negative chips). `btnHeaderClear` / `#btnSheetClear` (`js/app.js:1400-1411`) assign that object, then toast 「已清空所有選項」. The builder screenshots are this default, not an empty canvas. SPEC 清空 is a reset-to-empty.

   **Fix:** Restore an empty default (subject `""`, chips unset). Keep the fashion-portrait string as a recipe or as the Surprise-me pool, not as Clear.

7. **iOS keyboard transform fights the sheet.**  
   `.prompt-sheet` is centered with `left: 50%; transform: translateX(-50%)` (`css/style.css:945-948`). `body.keyboard-open` tucks it with `translateX(-50%) translateY(100%)` (`967-972`). `setupVisualViewport` (`js/app.js:1347-1356`) then sets an **inline** `transform: translateY(${keyboardHeight}px)`, which (a) wins over the class, (b) drops `translateX(-50%)` so the sheet jumps to the right half of the screen.

   **Fix:** Do not set inline `transform`. Toggle `.keyboard-open` only, or write the full `translateX(-50%) translateY(...)`.

---

## P2

8. **Type scale misses the brief.** Redesign asked for large title 34/700, section 13/600, body 17, captions 13. Shipping: brand 16/700, accordion titles 15/600, chips 14, prompt 14, tab labels 10 (`css/style.css:191, 376, 556, 1106, 1316`). Fine for a cramped utility chrome; not Linear. Once the header is un-cramped, use 17px body and a 34px large title on Recipes/Library (「靈感」「我的庫」) instead of the tiny hero card title.

9. **Native form controls ignore dark mode.** No `color-scheme: light dark` on `html` / `:root`. Shot `<select>`s (`css/style.css:915-925`) will stay light-on-light inside a dark sheet on iOS. Add `color-scheme: light dark` next to the token block.

10. **Segmented control geometry fights itself.** `.segmented-control { height: 36px }` (`css/style.css:223`) vs `.segment-btn { height: 32px; min-height: 44px }` (`239-241`). `min-height` wins, so the 44px hit box overflows the 36px track (and is then clipped). Keep the 36px iOS visual and expand the hit slop with `::after` or padding on the header, not by stretching the capsule.

11. **Shot reorder/delete look disabled.** `.btn-shot-action` is 44×44 but `color: var(--text-secondary)` on a matching card (`css/style.css:890-902`). In both video screenshots the ▲▼✕ glyphs are almost invisible. Use `--text-primary` / `--accent-destructive` for ✕.

12. **`html` has no `color-scheme`; `apple-mobile-web-app-status-bar-style` is `default`.** Light status bar is correct for the new default; dark mode PWA will keep a light status bar. Use `black-translucent` plus the existing media `theme-color` pair, or `media="(prefers-color-scheme: dark)"` on a second status-bar meta if you add one.

13. **`before-01-builder-390.png` is the wrong app** (12碼讀心戰). Not a product bug; do not treat it as a Prompt Studio before-shot. `before-05_recipes_tab.png` is the real previous UI.

---

## Features / tests (no P0 regressions found)

- `node --test tests/`: **14/14 pass**, including English-prompt purity, recipe id validity, corruption, quota, `sanitizeState`.
- Recipes still have `subjectEn`; `buildPrompt` prefers it (`js/prompt.js:88-91`). Ghibli string no longer names Miyazaki.
- Library: confirm delete, 另存新檔 (`#btnSaveAsNew`), tag filter chips, `escapeHtml` on cards — still wired in `js/app.js`.
- SW cache name `prompt-studio-v2` (from Round 1); not re-broken in this CSS pass.

---

The colour system and dark mode are the right target. Fix the sheet (show the prompt, stop covering other tabs) and the 390px header/library overflow before calling this Apple/Linear-quality.
