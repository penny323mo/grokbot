# Prompt 工作室 (prompt-studio) — SPEC

A polished, mobile-first single-page web app, written in Traditional Chinese with a Cantonese (廣東話) tone, for building high-quality prompts for AI **image** and **video** generation (e.g. Grok Imagine, Midjourney, Sora, Kling, Runway). The target user is Penny, who uses it on **iPhone Safari (390×844)**. The quality bar is high: it should feel like a premium native app, not a toy.

## Hard constraints
- Pure static files: `index.html`, `css/`, `js/` (ES modules or plain scripts), `assets/`. **No build step, no server, no CDN, no external fonts or network requests** (system font stack: -apple-system, "PingFang TC", "Noto Sans TC", sans-serif). It must work from GitHub Pages under a sub-path (`/prompt-studio/`), so all paths are relative.
- Works offline: include `manifest.webmanifest` + a small `sw.js` service worker that caches the app shell (cache-versioned; skip registration gracefully on `file://`). Add apple-touch-icon and `<meta name="apple-mobile-web-app-capable">`.
- 0 console errors. No horizontal overflow at 360–430px width. Respect safe-area insets (`env(safe-area-inset-*)`).
- Tap targets ≥ 44×44px. Controls must be simple and forgiving: chips/cards you tap, no tiny sliders that need precision (if a slider is used, it also has tap-able preset stops). No hover-only UI. No double-tap zoom issues (`touch-action: manipulation`). Inputs are font-size ≥16px, so iOS doesn't zoom in.
- UI text in Traditional Chinese (Cantonese tone, e.g. 「揀個風格」「撳一下就複製」「隨機嚟一個」). The prompt that's sent to the model is in **English**.
- Dark, elegant theme (deep charcoal/ink background, a subtle gradient, one accent colour such as warm gold or violet, glassy cards). Smooth but light animations (CSS transitions, `prefers-reduced-motion` respected).

## Screens / layout
Bottom tab bar (fixed, safe-area aware) with 3 tabs: **創作 (Build)**, **靈感 (Recipes)**, **我的庫 (Library)**. A top header shows the app name and an Image/Video segmented toggle (圖片 / 影片).

### 1. 創作 (Build)
- **Mode toggle**: 圖片 vs 影片. Video mode reveals the video-only sections; switching keeps the shared fields.
- **Structured builder**: a vertical list of collapsible sections (accordion), each with a one-line summary of the current choice when collapsed:
  1. 主體 Subject: a free text field (Chinese or English accepted, used verbatim) + quick chips (人像, 動物, 產品, 建築, 食物, 風景, 機械/科幻角色…), each mapping to an English phrase.
  2. 場景 Scene/Setting: chips (city at night, misty forest, studio backdrop, cyberpunk street, beach at golden hour, cozy café, outer space, Macau old street…) + an optional text field.
  3. 風格 Style: **visual swatch cards** in a 2-column grid. Each card has a CSS-generated (gradient/pattern) or image thumbnail, a Chinese name and an English hint. At least 16 presets: Cinematic film still, Photorealistic, Studio Ghibli-like anime, 3D Pixar-like render, Watercolor, Oil painting, Ink wash (水墨), Cyberpunk neon, Vaporwave, Film noir, Polaroid / 35mm film, Isometric 3D, Claymation, Low-poly, Ukiyo-e, Fashion editorial. Single-select, plus optional extra "modifiers" chips (highly detailed, 8k, sharp focus, bokeh, film grain…). Avoid naming living artists.
  4. 光線 Lighting: chips (golden hour, blue hour, soft window light, rim light, neon glow, volumetric god rays, Rembrandt, high-key, low-key, candlelight…).
  5. 鏡頭 Camera/Lens: chips for shot size (extreme close-up … wide establishing), angle (eye level, low angle, high angle, bird's-eye, Dutch angle), and lens (24mm wide, 35mm, 50mm, 85mm portrait, macro, telephoto, fisheye), plus aperture chips (f/1.4 shallow DOF, f/8 deep focus).
  6. 構圖 Composition: rule of thirds, centered symmetry, leading lines, negative space, frame within frame, close crop.
  7. 氛圍 Mood: chips (dreamy, melancholic, epic, cozy, mysterious, joyful, tense, serene…).
  8. 色調 Color palette: tappable palette swatches (each shows 4–5 colour dots), e.g. teal & orange, pastel, monochrome, earthy tones, neon pink/blue, muted vintage, high-contrast B&W.
  9. 比例 Aspect ratio: 1:1, 4:5, 3:4, 9:16, 16:9, 21:9 (big chips with small shape icons).
  10. **Video only** — 鏡頭運動 Camera movement (static, slow push-in, pull-out, pan left/right, tilt, orbit, dolly, crane up, handheld, drone fly-over, FPV), 片長 Duration (3s/5s/8s/10s/15s chips), 節奏 Pacing (slow & dreamy, steady, fast-cut energetic), plus subject motion (text). **分鏡 Shot list**: add/remove/reorder (up/down buttons, not drag-only) up to 6 shots, each with a short description + optional camera move + seconds. The shot list is rendered into the prompt as "Shot 1 (0–3s): …".
  11. 負面提示 Negative prompt: default suggestions as toggleable chips (blurry, low quality, extra fingers, deformed hands, watermark, text, logo, oversaturated, jpeg artifacts; for video also flicker, jitter, morphing) + free text.
- **Live prompt preview** (a sticky, collapsible bottom sheet/card above the tab bar, expandable to full view):
  - The **English prompt** assembled from the choices in a sensible order (subject → action/scene → style → lighting → camera → composition → mood → palette → modifiers; video: + camera movement, pacing, duration, shot list), as natural comma/sentence style, not a raw dump. Updates instantly on every change, with a subtle highlight animation.
  - **中文解說** (Chinese explanation): a readable Cantonese sentence-by-sentence explanation of what the prompt asks for, generated from the same choices (each preset has zh + en strings).
  - Negative prompt shown separately.
  - Aspect ratio / duration shown as params (also offer an optional "Midjourney style" suffix toggle, e.g. ` --ar 16:9`, off by default).
  - A character count.
  - Buttons: **複製 Prompt** (one tap; copies the English prompt, plus "Negative prompt: …" if any), 複製負面, 隨機 (Surprise me), 儲存, 清空. Copy uses `navigator.clipboard.writeText` with a fallback (a hidden textarea + `document.execCommand('copy')`) for iOS; shows a toast 「已複製 ✓」.
- **隨機嚟一個 Surprise me**: randomises coherent choices (one style, 1–2 lighting, a camera, a mood, a palette; keeps the subject if the user typed one, otherwise picks from a list of fun sample subjects). Haptic-like micro animation. Also a 🎲 per-section "randomise this section only".
- Undo for the last clear/randomise (a toast with 「復原」).

### 2. 靈感 (Recipes)
- At least **10 curated example recipes** (6 image, 4+ video) with a nice title in Chinese, a short description, a thumbnail (CSS art or a bundled image), and tags. Examples: 澳門雨夜霓虹街頭 (cinematic), 吉卜力風早晨café, 產品廣告 — 香水微距, 水墨山水, 賽博朋克貓, 復古菲林人像, video: 無人機飛越維港日落, 慢鏡咖啡倒奶, 角色轉身 orbit shot, 3-shot 短片 storyboard.
- Tap a recipe → preview sheet → 「用呢個」 loads it into the builder (confirm if the builder has unsaved changes).

### 3. 我的庫 (Library) — localStorage
- Save the current build (name, auto-generated if empty; tags as chips with free entry; mode; full state; assembled prompt; created/updated time).
- List as cards: name, mode badge (圖片/影片), first line of prompt, tags, ★ favourite toggle, updated time (relative in Chinese, e.g. 「3 分鐘前」).
- Search box + filter chips: 全部 / ★ 最愛 / 圖片 / 影片 / by tag.
- Per item: 開啟並編輯 (load into the builder; saving again updates the same item, with an option to 另存新檔), 複製 prompt, 複製一份 (duplicate), 刪除 (with confirm + undo toast).
- **Export** all as JSON (download a file via Blob; on iOS also offer 「複製 JSON」 to the clipboard) and **Import** JSON (file input + paste textarea) with validation, merge (skip duplicates by id), and a summary toast. Schema-versioned (`{app:"prompt-studio", version:1, items:[...]}`).
- Robust to corrupted localStorage (try/catch, fall back to empty, never crash) and to quota errors (show a message).
- The current builder draft also autosaves to localStorage, so a reload restores it.

## Code quality
- Organise as: `js/data.js` (all presets with ids, zh, en, optional colours), `js/prompt.js` (pure functions: `buildPrompt(state)`, `buildExplanation(state)`, `buildNegative(state)`, `randomize(state, rng)`), `js/store.js` (library + draft persistence, import/export validation), `js/ui.js` / `js/app.js` (DOM). Pure modules must be importable in Node for tests.
- `tests/` with Node tests (`node --test tests/`): prompt assembly order and content, video shot-list rendering, negative prompt, randomize determinism with a seeded rng, import validation (bad JSON, wrong app, duplicates), and store corruption handling.
- `README.md` (Chinese) with a short usage guide.
- Accessible: buttons have labels, `aria-pressed` on toggle chips, visible focus, colour contrast OK.

## Acceptance (orchestrator will verify in headless Chrome 390×844)
1. Load → no console errors, no horizontal scroll.
2. Tap a style card + a lighting chip → the English prompt updates and contains the chosen phrases; the Chinese explanation updates.
3. Tap 複製 → toast appears; clipboard contains the prompt.
4. Save to the library with a tag → it appears in 我的庫; reload the page → the item and the draft persist.
5. Switch to 影片, add 2 shots → the prompt contains the camera movement + "Shot 1", "Shot 2".
6. Load a recipe → the builder reflects it.
7. Export → valid JSON; Import the same → "0 new / N duplicates skipped".
