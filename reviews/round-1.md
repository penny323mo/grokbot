# Prompt 工作室 — Round 1 Grok Review

Read-only review against `SPEC.md`. Inspected `index.html`, `css/style.css`, `js/{data,prompt,store,app}.js`, `sw.js`, `manifest.webmanifest`, `tests/`, `CHANGELOG.md`. Ran `node --test tests/` (9/9 pass). Did not launch Chrome or a long-running server.

The builder shell, live sheet, library CRUD, export schema, draft autosave, and Cantonese copy are in place. The happy path that actually produces a model prompt is broken: curated recipes, Surprise Me, and subject chips all emit Chinese into the English prompt. Several SPEC flows (recipe confirm, 另存新檔, delete confirm, quota toast) are missing, and multiple iPhone tap/input sizes miss the 44px / 16px bar.

---

1. **CRITICAL** — English model prompt is Chinese on every curated and random path. `buildPrompt` uses `state.subject` verbatim and never reads `subjectEn`. All 10 recipes set a Chinese `subject` plus an unused `subjectEn`; Surprise Me and subject chips fill `sampleZh`. Verified with Node: every recipe prompt starts with Han (`一名撐著黑色雨傘的女子…`, `一隻睡眼惺忪的小橘貓…`, etc.), and `randomize({mode:"image"})` starts `一隻毛茸茸的金毛尋回犬在草地歡跑`. SPEC: chips map to an English phrase; the string sent to the model is English.

   - `js/prompt.js:72-80` — Prefer `state.subjectEn` (or category `sampleEn`) when assembling the English prompt; keep `state.subject` for the textarea / 中文解說.
   - `js/prompt.js:418-423` and `js/prompt.js:505-510` — Randomize into `sampleEn` (optionally keep `sampleZh` in a parallel field).
   - `js/app.js:237-240` — Subject chips should set `subject`/`subjectEn` from `cat.sampleEn` (or fill English and show the Chinese label only on the chip).
   - `js/data.js:495-756` — Recipe `state.subject` must be the English phrase (move the Chinese line to a `subjectZh` field used only by `buildExplanation`).

2. **MAJOR** — `updateUI` throws if `styleModifiers` or `negativeChips` is missing, which takes down the SPA. Import stores `state: {}` when the JSON item has no state; 載入編輯 then does `state.styleModifiers.includes(...)`. A draft that is `{mode:"image"}` (passes the `savedDraft.mode` check) crashes on launch the same way.

   - `js/app.js:642` and `js/app.js:678`
   - `js/app.js:1012-1018` (library load)
   - `js/app.js:890-896` (recipe apply)
   - `js/app.js:1379-1384` (draft restore)
   - `js/store.js:292`

   **Fix:** After every load/apply/import/draft restore, merge into `PromptEngine.getDefaultState(mode)` so arrays always exist. Guard `includes` with `Array.isArray(...)`.

3. **MAJOR** — Loading a recipe never confirms unsaved builder work. SPEC: tap recipe → preview → 「用呢個」 loads it, confirm if the builder has unsaved changes. `applySelectedRecipe` clones state, clears `currentEditingItemId`, and toasts success. `pushUndo` is not a confirm.

   - `js/app.js:890-901`
   - `index.html:616-618`

   **Fix:** If the current prompt/draft differs from last save (or from `getDefaultState`), `window.confirm` / a small modal: 「而家嘅創作尚未儲存，確定用呢個配方覆蓋？」 Cancel keeps the builder.

4. **MAJOR** — Editing a library item has no 另存新檔. SPEC: 開啟並編輯 updates the same item, with an option to 另存新檔. Save modal always `updateItem(currentEditingItemId)` when that id is set.

   - `js/app.js:1125-1147`
   - `index.html:591-594`

   **Fix:** When `currentEditingItemId` is set, show two actions: 「更新呢一項」 and 「另存新檔」 (the latter calls `addItem` and points `currentEditingItemId` at the new id).

5. **MAJOR** — Library delete has undo but no confirm. SPEC: 刪除 (with confirm + undo toast). One tap on 「刪除」 (`js/app.js:1031-1039`) immediately `deleteItem`. Accidental hits on a 36px control (see #8) lose the item if the 5s toast is missed.

   **Fix:** Confirm (`確定刪除「${name}」？`) then delete + existing 「復原」 toast.

6. **MAJOR** — Quota / save failure is logged and swallowed. SPEC: quota errors show a message. `saveLibrary` returns `false` on `QuotaExceededError`, but `addItem` / `updateItem` / `validateAndImport` ignore it and the UI toasts success.

   - `js/store.js:84-87`, `js/store.js:110-112`, `js/store.js:304`
   - `js/app.js:1126-1147`, `js/app.js:1072-1081`

   **Fix:** Propagate the boolean (or throw). If save fails, toast 「儲存失敗，空間可能已滿，試下刪走舊項目或匯出備份」 and do not claim 已儲存 / 匯入成功.

7. **MAJOR** — Shot-list inputs are 14px and the add/reorder controls are 32px. iOS 10+ ignores `user-scalable=no`, so focusing `.shot-desc-input` / the shot `<select>`s zooms the page. SPEC: inputs ≥16px; tap targets ≥44×44.

   - `css/style.css:790-798` `.shot-desc-input { font-size: 14px; height: 40px; }`
   - `css/style.css:768-788` `.shot-move-select` / `.shot-sec-select` 14px / 40px
   - `css/style.css:743-747` `.btn-shot-action` 32×32
   - `css/style.css:1760-1762` `#btnAddShot.btn-sm` min-height 32px
   - `index.html:349`

   **Fix:** 16px font and min-height 44px on shot inputs/selects; 44×44 on ▲/▼/✕ and 「＋ 新增鏡頭」.

8. **MAJOR** — Many other primary controls are under 44px, including the Image/Video toggle the user hits on every session.

   - `css/style.css:153-157` `.segment-btn` min-height 32px
   - `css/style.css:181-185` `.btn-icon` (header 隨機/清空) 36×36
   - `css/style.css:300-305` `.btn-section-dice` 32×32
   - `css/style.css:1447-1449` `.btn-lib-action-sm` min-height 36px
   - `css/style.css:1242-1244` `.btn-use-recipe` 42px
   - `css/style.css:924-936` `.btn-copy-chip` padding 4×8
   - `css/style.css:1398-1404` `.btn-lib-fav` no min size

   **Fix:** min-width/min-height 44px (or 44px padding-box with invisible hit slop) on all of the above.

9. **MAJOR** — Toggle chips never get `aria-pressed`. SPEC: `aria-pressed` on toggle chips. Only the mode segmented control sets it (`js/app.js:615-617`). `syncChipActive` (`js/app.js:691-696`) toggles `.active` only. Style / palette / AR cards are `<div>`s with no role, keyboard handler, or pressed state (`js/app.js:266-282`, `361-380`, `384-397`).

   **Fix:** `chip.setAttribute("aria-pressed", val === targetValue)` in `syncChipActive` and the modifier/negative loops. Make style/palette/AR cards `<button type="button">` (or `role="button"` + Enter/Space) with `aria-pressed`.

10. **MAJOR** — Living artist name in the Ghibli English prompt. SPEC: avoid naming living artists. `js/data.js:130` is `"Studio Ghibli style, Hayao Miyazaki aesthetic, ..."`. That string is injected whenever 吉卜力 is selected (default recipes `rec_ghibli_cafe`).

    **Fix:** Drop the person name; keep studio/medium language, e.g. `"Studio Ghibli-like hand-drawn anime, lush painted scenery"`.

11. **MAJOR** — Recipe / preset data defects that silently drop or duplicate fragments.

    - `js/data.js:513` and `js/data.js:730` use `cameraAperture: "ap_f1_8"`, which is not in `DATA.cameras.apertures` (`ap_f1_4` / `ap_f2_8` / `ap_f8_0` only) — aperture omitted from those prompts.
    - `js/data.js:615` negative chip `"deformed"` is not in `negativeDefaults` — skipped.
    - `js/data.js:774-776` shot `descEn` already contains `"Shot 1 (0-3s):"` while `buildPrompt` (`js/prompt.js:182`) prefixes another `Shot N (start–end s):` → `Shot 1 (0–3s): … Shot 1 (0-3s): …`.
    - `js/data.js:655` 維港日落 recipe uses `scene: "golden_beach"` → English `"tranquil ocean beach..."`.
    - `js/data.js:757` 外星荒漠 storyboard uses `scene: "outer_space"` → `"vast deep space nebula..."`.
    - `js/data.js:282` modifier `"volumetric god rays"` stacked on lighting `god_rays` (`js/data.js:293`) in `rec_ink_dragon` duplicates that phrase.

    **Fix:** Point recipes at real ids; strip `Shot N` from `descEn`; pick scenes that match the title (harbour waterfront / desert planet); make the volumetric modifier not clone the lighting string.

12. **MAJOR** — Shot-list `innerHTML` interpolates unsanitized description text. Changing move/seconds after the user types `"` (or pasting import HTML) breaks the card DOM and can inject markup.

    - `js/app.js:525-539` `value="${shot.descZh || shot.descEn || ""}"`
    - Same pattern: library cards `js/app.js:985-1004` (`item.name`, `item.prompt`, tags).

    **Fix:** Build the input with `createElement` / `value = ...` (textContent for snippets). Escape or never `innerHTML` user/import strings.

13. **MAJOR** — iOS clipboard fallback is off-screen, so copy fails when `navigator.clipboard.writeText` rejects (non-HTTPS, permission, or older Safari). Target device is iPhone Safari.

    - `js/app.js:199-218` `ta.style.top = "-9999px"` plus `execCommand('copy')`.

    **Fix:** Keep the textarea in the viewport (`position:fixed; left:0; top:0; width:1px; height:1px; opacity:0`), `focus()`, `setSelectionRange(0, text.length)`, then `execCommand('copy')`. Prefer this fallback first on iOS if the Clipboard API throws.

14. **MAJOR** — Service worker `cache.addAll` of `"./"` is fragile on GitHub Pages `/prompt-studio/`. A 301 from `/prompt-studio/` → `/prompt-studio/index.html` rejects the whole install, so offline never activates. Fetch also writes every HTTP 200 GET into `prompt-studio-v1` with no allowlist.

    - `sw.js:7-30`, `sw.js:54-69`
    - Registration itself correctly skips `file://` (`js/app.js:1356-1362`).

    **Fix:** Precache only real files (`./index.html`, css/js/assets), not `"./"`. Use `cache.add` per URL and ignore failures, or `{ redirect: "follow" }` with a same-origin check. In `fetch`, cache only APP_SHELL_FILES (or `url.origin === self.location.origin` and path under scope).

15. **MAJOR** — Fixed prompt sheet + tab bar do not track the iOS visual viewport. Focusing `#inputSubject` / shot fields leaves `position:fixed; bottom: … tab-bar` stuck to the layout viewport, covering the field or floating over the keyboard. SPEC calls this out.

    - `css/style.css:802-804` `.prompt-sheet`
    - `css/style.css:1072-1080` `.bottom-tab-bar`

    **Fix:** On `visualViewport` resize/scroll, offset the sheet and tab bar by `window.innerHeight - visualViewport.height - visualViewport.offsetTop`, or hide the sheet while an input is focused.

16. **MINOR** — Tests omit store corruption handling, which SPEC lists. `tests/prompt_studio.test.js` covers CRUD, export/import, and relative time; `loadLibrary` try/catch (`js/store.js:62-72`) is untested. Add a case that stuffs `"not-json"` / `"{}"` into the memory store and expects `[]` without throw.

17. **MINOR** — `sampleSubset` uses `[...arr].sort(() => rng() - 0.5)` (`js/prompt.js:405`). That comparator is not a Fisher–Yates shuffle and is engine-dependent. Replace with a seeded Fisher–Yates using `rng()`.

18. **MINOR** — Copy/save/surprise sit on the sheet footer; 清空 is only the 36px header broom. SPEC lists 清空 with the sheet buttons. Add a fourth footer control (or a clear action next to 隨機) that reuses `btnHeaderClear` + 復原 toast.

19. **MINOR** — Library filters are 全部 / 最愛 / 圖片 / 影片 (`index.html:440-444`). SPEC also wants filter-by-tag chips. Search includes tags as text; add chips from the union of saved tags.

20. **MINOR** — Aspect label `直倒` (`js/data.js:424`) is a typo (直圖 / 直向). Collapsed sheet `max-height: 140px` (`css/style.css:820`) leaves ~24px for the live prompt under the 44px footer. `aria-hidden` on modals is never flipped when opened (`index.html:565`). Explanation fallback 「尚未輸入特定主體，將由模型自由發揮。」 (`js/prompt.js:246`) is written-Chinese, not spoken Cantonese (e.g. 「未填主體，模型會自由發揮。」). `user-scalable=no` (`index.html:5`) blocks pinch-zoom for users iOS does not override.

---

Node unit tests: 9/9 pass. They never assert “prompt is English” or “recipes round-trip without unknown ids”, so they stay green while finding #1 is true.

VERDICT: NEEDS_FIXES
