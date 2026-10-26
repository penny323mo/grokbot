# Launcher review — r1 (390px, light + dark)

Reviewed `index.html`, `launcher.js`, `style.css`, `projects/manifest.json` against `reviews/shots/launcher-r1-390-*.png` and `launcher-r1-390-dark-*.png`. No server, no browser. Cover files were sampled only to check what the launcher is supposed to paint.

The hero line 「每晚一個新作品，諗、寫、審一手包辦」is the only line that sounds like a person. Everything under it is a dashboard template: a stats card that says 4 and 4, a chip row that slices a label in half, and cards whose artwork sits in a fake phone. Light mode’s last card has no artwork at all.

Contrast figures below are WCAG relative contrast for the tokens as written.

---

## P0

### 1. Filter row bisects 「3D遊戲」at 390px

`launcher-r1-390-0.png` and `launcher-r1-390-dark-0.png` both show three full chips and then a pill cut by a vertical edge. Visible text is `3D`. The count and 「遊戲」are gone. 「策略遊戲」is off-screen. `.filter-scroll` sets `scrollbar-width: none` and hides the WebKit scrollbar (`style.css` ~252–266), and it does not bleed past `.shell`’s 16px padding (`margin: 0 -2px` only). There is no fade, so the cut reads as a broken layout, not a scroller.

Five chips cannot fit one row in a 358px content width at 13px / 16px horizontal padding. Snap points would not fix the initial frame; the edge still falls through a pill.

**Fix.** Wrap under 760px. Do not scroll.

```css
.filter-section { margin: 20px 0 16px; }
.filter-scroll {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  overflow: visible;
  margin: 0;
  padding: 2px 0 4px;
  scrollbar-width: auto;
}
```

Delete the `::-webkit-scrollbar { display: none; }` rule. At 390px, row one is 全部 / 創作工具 / 數據分析 and row two is 3D 遊戲 / 策略遊戲. At 320px they wrap to two-plus-two with no clipped glyph.

### 2. Light-mode Beat the Bookie cover is an empty white handset

`launcher-r1-390-2.png` has zero green pixels. The well is flat `#ffffff` (the light `--device-bg`) inside the beige stage, with the 28×3px earpiece from `.card-device::after` as the only mark. The same slot in `launcher-r1-390-dark-2.png` shows the green cover (headline 「你估得贏莊家嗎？」).

The asset is fine: `projects/beat-the-bookie/cover/cover.webp` is 780×1040, opaque, top 16:10 average rgb(35, 69, 42). The `<img>` is not painted in that light capture. `launcher.js` sets `loading="lazy"` on every cover, including this last one, and `.card-device` has no painted fallback — an undecoded image is transparent, so the page shows a blank phone. Dark mode only looks correct because that capture happened after decode.

**Fix.**

- In the card template, drop `loading="lazy"`. Four local covers are ~220KB. First card: `fetchpriority="high"`. The rest: `loading="eager"`.
- Delete `.card-device::after` (the earpiece). It sits at `z-index: 2` over real screenshots, and on a late image it is the entire picture.
- Paint the well with the accent so a late or failed decode is not a white void:

```css
.card-device {
  background-color: color-mix(in srgb, var(--accent) 24%, var(--stage-bg));
}
```

- On `error`, add `is-broken` on the `<img>` and hide it. Do not leave the earpiece behind.

### 3. Category labels use the raw accent as 12px text — fails AA, and one accent is the banned purple

`.card-cat { color: var(--accent); }` (`style.css` ~464). Measured on the light card `#ffffff` and the dark card `#161619`:

| Project | Accent | On white | On `#161619` |
|---|---|---|---|
| Beat the Bookie | `#f5a524` | **2.04:1** | 8.85:1 |
| 盤口實驗室 | `#12a37f` | **3.20:1** | 5.65:1 |
| 12碼讀心戰 | `#e5484d` | **3.91:1** | 4.61:1 |
| Prompt 工作室 | `#7c5cff` | **4.35:1** | **4.15:1** |

12px semibold needs 4.5:1. Light mode fails every category. 「策略遊戲」on the blank card is amber on white. `#7c5cff` is also the generic AI purple the owner banned; `.card-stage::before` washes the first card with it at 8% opacity.

**Fix.** Do not set text color from `--accent`. One ink for every category, accent only as a 6px dot:

```css
.card-cat { color: var(--fg); font-weight: 600; }
.card-cat::before {
  content: "";
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 6px;
  border-radius: 99px;
  background: var(--accent);
  transform: translateY(-1px);
}
```

In `projects/manifest.json`, change prompt-studio `"accent"` from `#7c5cff` to `#c4552a`. Delete `.card-stage::before` (see P1.3) so the purple wash is gone even before the manifest edit.

---

## P1

### 1. `--fg-subtle` is too faint for the eyebrow, the stat labels, the footer, and 「開啓作品」

Token `#989489` on light `#f7f6f2` is **2.80:1**. `#63615b` on dark `#0c0c0e` is **3.16:1** (3.02:1 on the stats card `#121215`). Used at 11.5–12.5px by `.hero-eyebrow`, `.stat-label`, `.card-action`, `.footer`. The hero shot shows the credit line and 「項目數量 / 類別數量 / 最新加入」as washed-out grey above black 22px numbers. That is the “plain” look: the loudest thing after the title is a number, and the labels are below contrast.

`--fg-muted` is fine (about 5.7:1 light, 5.8:1 on the dark card). Do not change it.

**Fix.** Replace the token, and stop using 11.5px.

```css
:root { --fg-subtle: #b1ada4; }                          /* ~8:1 on #0c0c0e */
@media (prefers-color-scheme: light) {
  :root { --fg-subtle: #5c574e; }                        /* 6.6:1 on #f7f6f2 */
}
.hero-eyebrow,
.stat-label { font-size: 12px; letter-spacing: 0.04em; }
```

Drop `text-transform: uppercase` and `letter-spacing: 0.12em` on `.hero-eyebrow`. The markup is already `Penny Lei × Grok Bot`; the CSS is what turns it into a template kicker.

### 2. The stats card is a dashboard widget, and it repeats card one

`launcher.js` ~56–81 renders 項目數量 `4 個作品`, 類別數量 `4 個類別`, 最新加入 `Prompt 工作室` + the same date as the first card’s NEW row. With four projects in four categories, the second number is the first number. The bordered 16px-radius panel is the most generic block on the page, and it pushes the work down.

**Fix.** Delete `.stats-row` and the stat markup. One line under the tagline, muted, 13px, no border:

```html
<p class="hero-meta">4 個作品 · 最新係 Prompt 工作室 · <time datetime="2026-10-26">2026年10月26日</time></p>
```

```css
.hero-meta { margin-top: 14px; font-size: 13px; color: var(--fg-muted); font-variant-numeric: tabular-nums; }
```

Build the string in `launcher.js` from `projects.length`, `latest.title`, `latest.added`. Remove the 類別數量 cell.

### 3. Three frames and a fake earpiece shrink the cover and slice Odds Lab through its chips

Each card is: 18px card border, 12px padding, a stage with its own border and 14px padding, then a device with another border, a shadow, and an earpiece. On a 390px screen the bitmap ends up ~300px wide. `aspect-ratio: 16/10` plus `object-position: top center` on a 780×1040 shot cuts the window through Odds Lab’s league chips — `launcher-r1-390-1.png` ends on a half pill 「法甲」. The right-edge clip of that word is in the cover file; the launcher makes it the bottom edge of the picture.

**Fix.** Bleed the image to the card. No mat, no second phone.

```css
.card { padding: 0 0 14px; overflow: hidden; }
.card-stage { padding: 0; border: 0; background: transparent; border-radius: 18px 18px 0 0; }
.card-device {
  width: 100%;
  aspect-ratio: 3 / 4;
  border: 0;
  border-radius: 18px 18px 0 0;
  box-shadow: none;
}
.card-thumb { object-fit: cover; object-position: top center; }
.card-body { padding: 14px 16px 0; }
```

Delete `.card-stage::before`, `.card-device::after`, and `.card:hover .card-device { transform: translateY(-2px); }`. Native 3/4 matches the files, so the crop is the screenshot, not a slice through a control.

### 4. Press feedback never runs, and reduced-motion still hides the cards

`.card.animate-in` uses `animation-fill-mode: both` with a `transform` keyframe (`style.css` ~362–376). Forwards fill keeps `transform: translateY(0)` after the animation, which overrides `.card:active { transform: scale(0.98) }`. On iPhone there is no hover, so the card has no press response. The reduced-motion block shortens duration to 0.001s but not `animation-delay`, and `both` applies `opacity: 0` during the delay (up to 165ms on the fourth card).

**Fix.** Animate opacity only, and clear the class when it ends.

```css
@keyframes cardEntrance {
  from { opacity: 0; }
  to { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .card.animate-in { animation: none; opacity: 1; }
}
```

```js
cardsGrid.addEventListener('animationend', (e) => {
  if (e.target.classList.contains('card')) e.target.classList.remove('animate-in');
});
```

Keep `:active { transform: scale(0.98); }`. Wrap every `:hover` rule on `.chip`, `.card`, and `.footer-link` in `@media (hover: hover) and (pointer: fine)` so a tap does not leave the hover border stuck.

### 5. Cantonese copy breaks in four places

The hero tagline is spoken Cantonese. These are not.

| Where | Now | Problem | Replace with |
|---|---|---|---|
| `launcher.js` card action | `開啓作品` (啓 is U+5553) | Not the HK standard glyph. 啟 is U+555F. | Delete the row (below). If it stays: `開啟` |
| `index.html` footer | `獨立夜間構建` | Mainland calque of “nightly build”. 構建 is not how this page talks. | `© 2026 Grokbot 工作室` |
| `index.html` footer link | `GitHub 原始碼庫` | 「原始碼庫」is translated “repository”. | `GitHub 源碼` |
| `manifest.json` `beat-the-bookie` | title `Beat the Bookie`, subtitle `你估得贏莊家嗎？` | The other three cards are Cantonese title + English subtitle. This one is inverted, so the loudest line on the card is English. | title `你估得贏莊家嗎？`, subtitle `Beat the Bookie` |
| `launcher.js` NEW badge | `NEW` | English chip on a `zh-Hant-HK` page. `aria-label` is already `最新作品`. | `新` |
| `launcher.js` catch / empty manifest | `暫無作品記錄`, `目前為空，請稍後再試`, `發生問題，請檢查網絡連線` | Written Mandarin next to `呢個分類暫時未有作品`, which is the right register. | `未有作品` / `清單而家係空嘅，遲啲再嚟。` / `讀取作品嗰陣出咗問題。檢查網絡，或者重新載入。` |

Also delete `.card-action` (the hairline + right-aligned grey `開啓作品 →` on every card). The whole card is the link. The row is a second footer in the same faint token as P1.1, and it repeats four times. Move that 14px into the gap under the description.

### 6. The card link and the filter lie to assistive tech

- Each `<a class="card">` sets `aria-label="${title} · ${subtitle}"`, which replaces the category, the date, the description, and the image alt. A VoiceOver user never hears the Cantonese sentence.
- `#filterScroll` is `role="toolbar"` (`index.html` line 27) with `aria-pressed` buttons. These are exclusive filters, not a toolbar, and a toolbar expects arrow keys. Nothing calls `scrollIntoView`, so once P0.1 is fixed by wrapping this matters less, but the role is still wrong.

**Fix.** Remove the `aria-label` on the card. The visible `h2`, category, and description should be the accessible name. Keep the image `alt`.

On the filter container set `role="radiogroup"` and `aria-label="作品分類"`. On each chip set `role="radio"` and `aria-checked`, and remove `aria-pressed`. One `click` handler already enforces a single selection; have it set `aria-checked` instead of `aria-pressed`.

---

## P2

### 1. Subtitle and description are the same grey line

`.card-sub` is 13px `--fg-muted`. `.card-desc` is 13.5px `--fg-muted`. On every card the English name and the Cantonese sentence collapse into one mushy block under a 19px title (visible on all four cards).

**Fix.**

```css
.card-sub { font-size: 12px; color: var(--fg-subtle); margin-top: 2px; }
.card-desc { font-size: 14.5px; line-height: 1.45; color: var(--fg); margin-top: 8px; }
```

`--fg-subtle` only after the P1.1 token change.

### 2. Every description ends mid-clause on an ASCII ellipsis

`.card-desc` is `white-space: nowrap` + `text-overflow: ellipsis`. At 390px that is about 24 characters. All four manifest strings are longer, so every card ends `...` in the same place (`Dixon-Coles ...`, `有分鏡表...`, `AI 會讀你嘅...`). It looks unfinished, not edited.

**Fix.** Two lines, with a reserved height so filtering does not jump:

```css
.card-desc {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  white-space: normal;
  overflow: hidden;
  min-height: calc(1.45em * 2);
}
```

Rewrite the visible lead so line one stands alone if the clamp still hits. Odds Lab in particular should not open on the English proper nouns:

- prompt-studio: `撳選項砌出圖像同影片 prompt，有分鏡、食譜、收藏，離線都用到。`
- odds-lab: `澳門實盤對住全球莊家共識同模型，逐盤睇值唔值博。`
- penalty-mind-game: `滑動射門、撲救、AI 讀你習慣，仲有 16 隊世界盃。`
- beat-the-bookie: `用真實賽果同賠率，同電腦鬥落注眼光。`

### 3. `aria-live` is on the whole feed

`<main id="feed" aria-live="polite">` announces whatever changes inside the grid. Toggling `.is-hidden` can dump every visible card’s text.

**Fix.** Remove `aria-live` from `<main>`. Add `<p class="visually-hidden" id="filterStatus" aria-live="polite"></p>` and on each filter click set its text to `顯示 ${visibleCount} 個作品`.

```css
.visually-hidden {
  position: absolute;
  width: 1px; height: 1px;
  margin: -1px; padding: 0;
  overflow: hidden; clip: rect(0 0 0 0);
  border: 0;
}
```

### 4. Accent is injected into a style attribute with only HTML escaping

`style="--accent: ${esc(accent)}"` (`launcher.js` ~110). `esc` does not stop a non-hex value from breaking out of the declaration.

**Fix.** Before render, `const accent = /^#[0-9a-fA-F]{6}$/.test(p.accent) ? p.accent : '#8d7b68'`.

### 5. “Featured” does nothing at 390px

`.card-featured` only changes layout inside `@media (min-width: 760px)`. On the target phone the latest card matches the others except the `新` badge, while the hero already repeated its title. After P1.2 and P1.3 the full-bleed 3/4 cover is the feature. No second treatment is required on the phone. Leave the desktop grid, but do not add more chrome to chase “featured” at 390.

### 6. Active chip count uses the idle pill color

`.chip-count` always uses `--chip-count-bg`. In light mode that is `rgba(0,0,0,0.06)`, including on the black active chip, so the badge disappears and only the white numeral is left. In dark mode the active chip is `--chip-active-bg: #f4f3f0` with an 8% white pill, same problem inverted.

**Fix.**

```css
.chip.is-active .chip-count {
  background: color-mix(in srgb, var(--chip-active-fg) 16%, transparent);
}
```

---

## Do not change

- `lang="zh-Hant-HK"`, the CJK font stack, safe-area padding, 44px chip height, and `prefers-color-scheme` theme-color metas are right.
- `--fg-muted` contrast is already above 4.5:1 in both themes.
- Filter `display: none` via `.is-hidden` is the right way to avoid a layout jump. Keep it.
- The hero tagline copy stays as written.
