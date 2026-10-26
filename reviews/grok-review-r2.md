# Launcher review — r2 (390px, light + dark)

Reviewed `index.html`, `launcher.js`, `style.css`, `projects/manifest.json` against `reviews/shots/launcher-r2-390-*.png` and `launcher-r2-390-dark-*.png` (frames are 390×740, last slice 390×60). No server, no browser. Cover files were measured only to see what a crop would keep.

The r1 failures that are actually gone: the chip row wraps (全部 / 創作工具 / 數據分析, then 3D 遊戲 / 策略遊戲) with no bisected glyph; category ink is `--fg` plus a 6px dot; prompt-studio accent is `#c4552a`; the earpiece, the stats grid, and the purple wash are gone; the tagline is untouched. Text tokens in the stylesheet clear 4.5:1 (measured below).

What is still on screen: frame 0 is chrome plus an unlabeled app screenshot, and the light frame of 你估得贏莊家嗎？ is a flat tan panel with no bitmap.

Contrast of the tokens as written (WCAG relative):

| Pair | Ratio |
|---|---|
| `--fg` on `--bg`, dark / light | 17.6 / 16.4 |
| `--fg-muted` `#95928a` on `#0c0c0e`, `#646158` on `#f7f6f2` | 6.29 / 5.72 |
| `--fg-subtle` on `--bg`, dark / light | 8.73 / 6.63 |
| `--chip-fg` on chip, dark / light | 7.60 / 7.69 |
| `#f5a524` dot on white card | **2.04** |

---

## P0

### 1. Light frame of Beat the Bookie is still an empty cover

`launcher-r2-390-3.png` y=0–471, x=17–372 (the 356px stage) is flat `rgb(242, 221, 185)`, standard deviation 0. That is `color-mix(in srgb, #f5a524 24%, #f1efe8)` — the `.card-device` fallback in `style.css` (~306), accent `#f5a524` over light `--stage-bg`. The same slot in `launcher-r2-390-dark-3.png` is the green pitch UI. The file is fine: `projects/beat-the-bookie/cover/cover.webp` is 780×1040, top band mean `rgb(17, 60, 34)`, 59KB.

`loading="eager"` did not put pixels in this capture. The `<img>` is created only after `await fetch('projects/manifest.json')` (`launcher.js` ~31–83), so it is not in the document `load`. The fourth cover sits ~1900px down; Chrome still deprioritizes it. Dark frames were taken after the bitmap was cached. A 24% amber mix reads as a finished poster, so the miss is silent. The card body under it (策略遊戲, the title, the one-line description) is painted, which rules out the entrance animation: the card is not at `opacity: 0`.

**Fix.** Decode every cover before inserting the cards, and paint a quiet well until pixels exist.

```js
await Promise.all(projects.map((p) => {
  const img = new Image();
  img.src = p.cover;
  return img.decode().catch(() => {});
}));
```

Place that immediately before `cardsGrid.innerHTML = projects.map(...)`. In the template, set `fetchpriority="high"` on all four (about 220KB together) and drop the inline `onerror`. After the assignment:

```js
cardsGrid.querySelectorAll('.card-thumb').forEach((img) => {
  const ready = () => img.closest('.card-device')?.classList.add('is-ready');
  if (img.complete && img.naturalWidth) ready();
  else {
    img.addEventListener('load', ready, { once: true });
    img.addEventListener('error', () => img.classList.add('is-broken'), { once: true });
  }
});
```

```css
.card-device {
  background-color: var(--stage-bg);
  background-color: color-mix(in srgb, var(--accent) 10%, var(--stage-bg));
}
.card-thumb { opacity: 0; transition: opacity 0.2s ease; }
.card-device.is-ready .card-thumb { opacity: 1; }
```

`prefers-reduced-motion` already zeroes transitions. Keep `.card-thumb.is-broken { display: none; }`.

### 2. The 3:4 stage is a full phone screenshot, so the first screen has no project title

At 390 the stage is x=17–372, width 356. `aspect-ratio: 3 / 4` (`style.css` ~302) makes it 475px tall, and the files are exactly 3:4, so `object-fit: cover` shows every pixel, including each app’s own chrome.

In `launcher-r2-390-0.png` the cover starts at y=296. The `h2` would start near y=785 (296 + 475 + 14px body padding). The frame ends at 740. Frame 0 is the eyebrow, the title, the tagline, the meta line, two chip rows, and Prompt 工作室’s screenshot. The only name for that work is the meta phrase 「最新係 Prompt 工作室」. The screenshot’s own header is the pink-purple mode pill sitting on top of the word 「Prompt 工作室」 (that collision is inside `cover.webp`, y≈8–199; this fix does not redraw project files). Frame 1 then opens on Odds Lab’s league row 全部 / 英超 / … / 法甲, a second filter bar directly under the launcher’s chips. 法甲 is already cut on the right edge of the asset; full-bleed makes that cut the card edge.

Measured on the 780×1040 files, a top-aligned window of source y 0–381:

- clears Odds Lab’s green 全部 pill (y 396–483) and the clipped 法甲
- clears Prompt 工作室’s type chips (activity from y 390)
- keeps the penalty brain graphic (y 357–381)
- keeps Beat the Bookie’s wordmark and gold banner (y 130–220) and cuts the rules essay

That window is `aspect-ratio: 41 / 20` (356 × 174 at this width). The `h2` then lands near y=484, inside frame 0, with the description above y=650.

**Fix.**

```css
.card-device {
  aspect-ratio: 41 / 20;
  /* object-fit / object-position on .card-thumb stay cover + top center */
}
```

The desktop featured card sets `aspect-ratio: auto` and `height: 100%` (`style.css` ~441–445) with `min-height: 280px` on the stage. At a ~400px column that grows back into the league-chip crop. Keep the same window there:

```css
.card-featured { align-items: center; }
.card-featured .card-stage { height: auto; min-height: 0; }
.card-featured .card-device {
  aspect-ratio: 41 / 20;
  height: auto;
}
```

`3/2` is the wrong constant: it shows source y 0–520 and includes the whole Odds Lab pill row.

---

## P1

### 1. `role="radio"` is announced and then ignored by the keyboard

`#filterScroll` is `role="radiogroup"` and each chip is `role="radio"` with `aria-checked` (`index.html` ~27, `launcher.js` ~69–79). The click handler updates `aria-checked`. Nothing else implements the radio pattern:

- every chip is a `<button>` in the tab order (five extra stops)
- ArrowLeft / ArrowRight / ArrowUp / ArrowDown / Home / End do nothing
- VoiceOver treats them as radios and will not move the check with its radio gesture

**Fix.** In the chip template add `tabindex="${idx === 0 ? '0' : '-1'}"`. One selector updates check, class, and tabindex; arrows move it.

```js
const chips = [...filterScroll.querySelectorAll('.chip')];

function selectChip(chip) {
  chips.forEach((c) => {
    const on = c === chip;
    c.classList.toggle('is-active', on);
    c.setAttribute('aria-checked', on ? 'true' : 'false');
    c.tabIndex = on ? 0 : -1;
  });
  const target = chip.dataset.filter;
  let visibleCount = 0;
  cards.forEach((card) => {
    const isMatch = target === 'all' || card.dataset.category === target;
    card.classList.toggle('is-hidden', !isMatch);
    if (isMatch) visibleCount++;
  });
  const name = chip.querySelector('.chip-label')?.textContent ?? '';
  if (filterStatus) filterStatus.textContent = `${name}，顯示 ${visibleCount} 個作品`;
  if (emptyState) emptyState.hidden = visibleCount > 0;
}

chips.forEach((chip) => {
  chip.addEventListener('click', () => selectChip(chip));
  chip.addEventListener('keydown', (e) => {
    const i = chips.indexOf(chip);
    const key = e.key;
    let next = null;
    if (key === 'ArrowRight' || key === 'ArrowDown') next = chips[(i + 1) % chips.length];
    else if (key === 'ArrowLeft' || key === 'ArrowUp') next = chips[(i - 1 + chips.length) % chips.length];
    else if (key === 'Home') next = chips[0];
    else if (key === 'End') next = chips[chips.length - 1];
    if (!next) return;
    e.preventDefault();
    selectChip(next);
    next.focus();
  });
});
```

### 2. The cover alt is inside the link, so the name is the title twice

`launcher.js` ~98: `alt="${esc(p.title)} 介面截圖"`. The `<a class="card">` has no `aria-label` (correct, the visible copy should be the name) but the alt is part of that name. VoiceOver reads 「Prompt 工作室 介面截圖」 and then the heading 「Prompt 工作室」 again, plus category, date, subtitle, and description.

**Fix.** `alt=""`. The `h2`, category, date, and description are the accessible name. The bitmap is a preview of that same work.

### 3. The chips leave the viewport, and each card is still a long scroll

`.filter-section` is `position: relative` (`style.css` ~160). After one card the only way back to 全部 / 創作工具 / … is to scroll to the top. `body` sets `overflow-x: hidden` (`style.css` ~81), which computes `overflow-y` to `auto` and is a known reason `position: sticky` fails to stick to the viewport.

**Fix.** Delete `overflow-x: hidden` on `body`. The wrapped chips and the 16px shell padding already stay inside 320–430.

```css
.filter-section {
  position: sticky;
  top: env(safe-area-inset-top);
  z-index: 2;
  margin: 24px 0 16px;
  padding: 8px 0 10px;
  background-color: var(--bg);
}
```

### 4. Cantonese breaks on the empty state, the error title, and one description

The hero tagline, the card titles, and three of the four descriptions are spoken Cantonese. These are not.

| Where | Now | Replace with |
|---|---|---|
| `index.html` empty desc | `請撳「全部」瀏覽所有收錄項目。` | `撳「全部」睇晒所有作品。` |
| `launcher.js` catch title | `暫時未能載入作品清單` | `作品清單載入唔到` |
| `manifest.json` `prompt-studio` description | `…有分鏡、食譜、收藏…` | `撳選項砌出圖像同影片 prompt，有分鏡、prompt 食譜、收藏，離線都用到。` |

「食譜」 alone is a cooking recipe. 「prompt 食譜」 keeps the feature name and the modifier. Leave the empty-state title `呢個分類暫時未有作品`, the empty-manifest line `清單而家係空嘅，遲啲再嚟。`, and the catch description `讀取作品嗰陣出咗問題。檢查網絡，或者重新載入。` Those are already the right register. Leave the hero tagline.

---

## P2

### 1. The 策略遊戲 dot fails non-text contrast in light mode

`.card-cat::before` uses raw `--accent` (`style.css` ~345–354). `#f5a524` on `#ffffff` is 2.04:1. The other three dots clear 3:1 (green 3.20, red 3.91, terracotta 4.49). Dark mode is fine (amber 8.85 on `#161619`). WCAG 1.4.11 asks 3:1 for a graphic that marks the category.

**Fix.** Light mode only. 70% accent mixed into `#191816` puts amber at 3.64:1 on white, green 5.34, red 6.30, terracotta 6.93. Dark keeps the raw accent.

```css
@media (prefers-color-scheme: light) {
  .card-cat::before {
    background: color-mix(in srgb, var(--accent) 70%, #191816);
  }
}
```

The base `background: var(--accent)` stays for browsers that drop `color-mix`.

### 2. The bookie description is one line, and the CSS reserves a blank second line

`用真實賽果同賠率，同電腦鬥落注眼光。` is 18 characters. Card measure at 390 is 390 − 32 shell − 32 body = 326px. 18 × 14.5px ≈ 261px, so it fits on one line. `.card-desc` sets `min-height: calc(1.45em * 2)` (`style.css` ~412). Filtering hides whole cards; it does not reflow this string, so the reserved line does not stop a jump. It paints an empty line under the shortest card (visible under the title block in `launcher-r2-390-3.png`).

**Fix.** Delete the `min-height` declaration. Keep the two-line clamp.

While you are on that string, it is compressed. Replace with `用真實賽果同賠率，同電腦鬥邊個睇得準。` (still one line at 390, still inside the clamp).

### 3. Spacing drifts off the 8px grid the file claims

`style.css` header says 8px grid. These are the ones that show:

| Rule | Now | Set |
|---|---|---|
| `.hero-meta` margin-top | 14px | 16px |
| `.filter-section` margin-top | 20px | 24px (also in the sticky rule above) |
| `.card-body` padding-top | 14px | 16px |
| `.card-headings` margin-top | 6px | 8px |
| `.shell` padding-bottom extra | 36px | 32px |
| `.badge-new` | 10px, `letter-spacing: 0.06em`, padding 3px 6px | 12px, `letter-spacing: 0`, padding 4px 6px |

A 10px 「新」 with tracking is the only mobile mark on the latest card, and the tracking shoves a single character off-center in the pill.

### 4. Small a11y and markup leftovers

- `index.html` ~26–27: `<nav aria-label="作品分類">` wraps a radiogroup that also has `aria-label="作品分類"`. Drop the `aria-label` on the `<nav>`. Keep it on `#filterScroll`.
- `.visually-hidden` (`style.css` ~85) is missing `white-space: nowrap`. Add it so the live region is not spelled out.
- `.card` sets `user-select: none` (`style.css` ~255). Delete it so the Cantonese description can be copied.
- `.card { overflow: hidden }` can eat the focus ring. Add `.card:focus-visible { outline-offset: -3px; }`.
- The empty-manifest panel (`launcher.js` ~38) has no `role="alert"`. The catch panel does. Add `role="alert"` to the empty panel too.
- The retry control is `onclick="location.reload()"` (`launcher.js` ~166). After inserting the error HTML, bind the button:

```js
cardsGrid.querySelector('.btn-retry')?.addEventListener('click', () => location.reload());
```

- The grid is a `div` of links. Use `<ul class="cards-grid" id="cardsGrid">` and wrap each card in `<li>`. Reset `ul { list-style: none; }` is already covered by the universal margin/padding reset.

---

## Leave these

- `lang="zh-Hant-HK"`, the CJK font stack, safe-area padding, 44px chip height, `theme-color` metas.
- Wrapped chips. The r1 bisect is gone at 390. Five chips at 13px / 16px horizontal padding cannot share one row in a 358px measure; wrap is the layout.
- Category text stays `--fg`. Accent stays a dot (light-mode mix above). Manifest accent `#c4552a` stays.
- Opacity-only `cardEntrance`, the `animationend` removal of `animate-in`, and the reduced-motion block. A transform in that keyframe would stick and cancel `.card:active { transform: scale(0.98) }`.
- Hover rules stay inside `@media (hover: hover) and (pointer: fine)`.
- The hero tagline, `© 2026 Grokbot 工作室`, footer link `GitHub 源碼`, badge text `新`, and Cantonese title + English subtitle on every card including Beat the Bookie.
- No second 「開啟」 row. The card is the link.
- `aria-live` stays on `#filterStatus`, not on `<main>`.
- Accent hex check before it goes into `--accent`.
- `--fg-muted` and `--fg-subtle` values. Both clear 4.5:1. The faint footer pixels in the 60px slices are antialiased fringe at the cut, not the token.
