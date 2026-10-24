# Code review: 12碼讀心戰 vs SPEC.md (round 2)

`node tests/model.test.js` — 10/10 pass. A line-by-line simulation of `checkShootoutDecided` / `advanceRound` matches the spec’s shootout: player kicks first each round; 3–0 and 0–3 end after three kicks each; a 5–3 lead ends before the opponent’s fifth kick; a 4–3 lead does not, because the opponent can still tie; sudden death waits until both have kicked that pair; a 15–15 tie (5 + 10) ends as a draw and a one-kick lead ends as a win. `endMatch` already has a draw branch. The bugs below are elsewhere. No browser was launched.

## 1. CRITICAL — Letting the 1.5s keep clock expire freezes the match

`game.js:482-495`, `game.js:438-448`, `game.js:930-933`.

The keep interval is the spec path “if you don’t choose in 1.5s you stay in the middle”:

```js
if (gameState.keepingTimeRemaining <= 0) {
  cleanTimers();
  handlePlayerDiveChoice('BM', null, true);
}
```

`cleanTimers` sets `gameState.waitingForInput = false` (`game.js:447`) and then `handlePlayerDiveChoice` returns on that flag (`game.js:931`). The AI kick is never pushed, the score never changes, `advanceRound` is never scheduled, and the interval is already cleared. No exception is thrown.

Repro: start a match, shoot once, tap through 門將讀心透視, wait out the run-up, then do not tap for 1.5s. The bar sits at 0%. The banner still says 「1.5秒內點擊撲救」. The zones are still painted as tappable (`disabled` is only added inside the handler, which returned). Further taps hit `game.js:633` and return. 🏠 can abandon the match; the shootout itself cannot continue. A bottom-middle stay-save, which is the spec’s “keeper stays” rule, is on this same dead path (`game.js:996-1003`).

Fix: stop clearing the input flag before the handler runs, and let a timeout enter the handler.

```js
if (gameState.keepingTimeRemaining <= 0) {
  clearInterval(gameState.keepingTimer);
  gameState.keepingTimer = null;
  handlePlayerDiveChoice('BM', null, true);
}

function handlePlayerDiveChoice(playerDiveZone, cellElement, timedOut = false) {
  if (!timedOut && !gameState.waitingForInput) return;
  gameState.waitingForInput = false;
  cleanTimers();
  // existing resolution, including safeSetTimeout(advanceRound, 1500)
}
```

`cleanTimers()` inside the handler must stay after the guard, so the `advanceRound` timeout is armed with the new match token.

## 2. MAJOR — 「返主頁？」 during the run-up does not pause the kick

`game.js:330-331`, `game.js:450-456`, `game.js:914-927`.

`pauseKeepingTimer` only pauses when `turn === 'ai' && waitingForInput && keepingTimer`. During the 1s run-up, `waitingForInput` is false and `keepingTimer` is null (`game.js:919`), so the dialog does not pause anything. The run-up `safeSetTimeout` still fires, calls `startKeepingCountdown(1500)`, and the clock runs behind the modal. The zones are covered (`z-index: 100` on the dialog), so the user cannot dive.

Repro: on the AI turn, tap 🏠 while the banner says 「助跑緊」 and wait. After 1s + 1.5s the expiry path in finding 1 freezes the match. Cancel leaves that freeze in place (`resumeKeepingTimer` requires `isTimerPaused`, which was never set). Confirm is the only way out, and the in-progress round is discarded.

After finding 1 is fixed, the same repro resolves the kick with a forced `BM` dive and can call `advanceRound` / `endMatch` / `recordMatchResult` while the dialog is still up.

Fix: set `gameState.modalOpen = true` in `showCustomDialog`, and the same flag from `visibilitychange` while the run-up timeout is pending. The run-up callback and the keep interval must return without starting or decrementing the clock when the flag is set. On cancel, if the run-up finished while paused, start the 1500ms window then; if the window was already running, resume it with `keepingTimeRemaining`. On confirm, `cleanTimers()` as now.

## 3. MAJOR — iPhone Safari still sizes the shell to the large viewport, so the bottom zones sit under the toolbar

`index.html:5`, `style.css:47-65`, `style.css:534-546`.

`viewport-fit=cover` is set, and safe-area padding is present, but the height cascade is backwards:

```css
height: 100dvh;
height: -webkit-fill-available; /* wins everywhere that understands both */
```

`-webkit-fill-available` tracks the large layout viewport (the same box as `100vh` on iPhone Safari). `#game-container` is `overflow: hidden`, and `.stadium-scene` is `justify-content: flex-end`, so the goal — including BL/BM/BR, where the AI shoots 60% — is the first thing covered by Safari’s bottom toolbar. The document is not taller than that large viewport, so the page does not scroll the zones back into view. During the 1.5s window that is the difference between a dive and finding 1.

Safe-area is also applied twice: `#game-container` padding (`style.css:61-64`) and again `.stadium-scene` (`style.css:545`). On a notched phone that is ~34px + ~34px under the goal before `margin-bottom`.

There is no `touch-action: manipulation`. iOS ignores `user-scalable=no`, so a fast second tap on a zone (normal in a 1.5s window) double-tap-zooms the page.

Fix:

```css
#game-container {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  min-height: 100dvh;
  height: 100vh;
  height: -webkit-fill-available;
  height: 100dvh;
}
html, .zone-cell { touch-action: manipulation; }
```

Keep `env(safe-area-inset-*)` on the container only. Drop the extra `safe-area` padding on `.stadium-scene` (a 16px `padding-bottom` is enough). Declare `100dvh` last so a browser that understands it does not fall back to the large viewport.

## 4. MAJOR — Sudden-death kick dots throw away the player’s row

`game.js:579-613`, `style.css:429-448`.

Both dot rows sit in one horizontal flex. At 375px the tracker’s content box is about 331px (375 minus scoreboard padding 32 and tracker padding 12). A dot is 14px with a 4px gap, so a row of n is `18n − 4`. Two rows plus the 12px gap is `36n + 4`:

| Dots per side | Width | Versus 331px |
|---|---|---|
| 9 | 328 | fits |
| 10 | 364 | overflows |
| 15 (spec cap) | 544 | overflows by 213px |

`totalSlots` reaches 10 at the start of round 10 (sudden-death round 5). `renderScoreboard` then sets `scrollLeft = scrollWidth` (`game.js:611-613`), which pins the view on the AI group. At 15 dots the visible 331px is the AI row plus about three of the player’s latest dots. Earlier ✅/❌ for 你 are off to the left, and every re-render jumps back there. Stacked, one team needs only 266px for 15 dots, which fits in 331px.

Fix: make `.kicks-tracker` a column of two labeled rows (`你` / `電腦`), each `flex-wrap: nowrap` on its own full width. Delete the shared `scrollLeft`. Add `min-height: 0` only if a row still needs its own `overflow-x: auto`; with a stacked row it does not, up to the spec cap of 15.

## 5. MAJOR — The timeout sentences do not fit a 375px pitch

`style.css:885-903`, `style.css:544`, `game.js:996-1003`.

`.reaction-banner` is `white-space: nowrap`, `font-size: 1.4rem` (~22px per CJK glyph), `padding: 10px 24px`. `.stadium-scene` is `overflow: hidden`.

「未能及時反應留喺中間，好在電腦中楣！」 is 18 glyphs: about 18×22 + 48px padding ≈ 450px, against a 375px viewport. 「未能及時反應！留喺中間被對手射入！」 is the same class of string. The banner is centered with `translateX(-50%)` and clipped on both sides, with no wrap and no ellipsis. These are the only sentences the keep timeout shows, so once finding 1 is fixed every missed dive on a phone is unreadable. Shorter banners such as 「入波！！！」 fit; these do not.

Fix: `white-space: normal; text-align: center; max-width: calc(100% - 24px); font-size: 1.05rem; line-height: 1.3`. Shorten the copy so each banner is two short lines, for example 「嚟唔切，留喺中間。好在中楣！」 and 「嚟唔切，留喺中間，被射入！」。

## 6. MAJOR — The title column is taller than a 375×667 phone, and the screen is not a reliable scrollport

`style.css:47-65`, `style.css:78-97`, `style.css:166-173`, `style.css:212-220`, `index.html:31-72`.

Sum of the title CSS, top to bottom, at a 16px root and ~25 glyphs per line inside the rules card: header ~69px, hero (tagline, 2rem title, pitch, 100px radar) ~213px, rules card ~244px, memory row ~74px, start button ~54px, title padding 40px. About 690px. A 375×667 portrait layout is 667px, and iPhone Safari’s visual viewport is shorter than that once the toolbars are up. 「開波！進入大賽」 is the primary action and it starts below the fold.

`.screen` is a column flex item with `height: 100%`, `flex: 1`, and `overflow-y: auto`, and it does not set `min-height: 0`. The default `min-height: auto` floors the item at its content height, so the item has nothing to scroll, and `#game-container { overflow: hidden }` clips the overflow. That is the failure mode where the start button cannot be reached.

Fix: `.screen { min-height: 0; }`. Cut `.title-graphic` from 100px to about 48px and tighten `.rules-card` so the start button is inside the first 667px. `justify-content: space-between` on `.title-content` does not shrink children when the column is short.

## 7. MINOR — localStorage sanitizing still lets a poisoned brain through, and the dive becomes `undefined`

`model.js:43-53`, `model.js:249-254`, `model.js:271-293`, `model.js:366-368`, `model.js:421-427`, `game.js:783`.

`init` checks `freq`, `totalShots`, and `history`, then copies `bigrams` / `trigrams` with `JSON.parse(JSON.stringify(...))` and accepts any finite `predictionsTotal` / `predictionsCorrect`. A blob the freq check allows:

```js
{ totalShots: 2, freq: { TL: 2, TM: 0, TR: 0, BL: 0, BM: 0, BR: 0 },
  history: ['TL', 'TL'],
  bigrams: { TL: { TL: '2', TM: 0, TR: 0, BL: 0, BM: 0, BR: 0 } },
  predictionsTotal: -5, predictionsCorrect: 12 }
```

Measured: every zone probability is `NaN`, `maxProb` stays `-1`, `confidence` is **-100**, `predictedZone` is `undefined` (`tiedZones[0]` of an empty list). `chooseDiveZone(0.12)` returned `undefined` on **4407 / 5000** draws (88%) and `TL` on the rest. The keeper class becomes `dive-undefined`, the save check never matches, and the mind-reading line prints `門將撲向：【undefined】` (`game.js:783`, because `NaN` is falsy so the bars collapse to 0% and the headline takes the “未有傾向” branch). `getKeeperAccuracy()` is `Math.round(12 / -5 * 100)` = **-240**, which `renderEndScreenStats` prints as-is. The unit test “sanitization against invalid data” only feeds a string `freq`, so this stays green.

`resetStorage` calls `init()` (which sets `storageFailed = false`) before `removeItem`. If `removeItem` throws, the banner says the brain is empty and the old key is still there for the next load.

`recordMatchResult('draw')` increments `matchesPlayed` and leaves `matchesWon` unchanged, same as a loss. A saved career cannot tell a draw from a loss.

Fix: when loading, drop any bigram/trigram cell that is not a finite number `>= 0`, or reject the whole blob and `init()`. Clamp `predictionsCorrect` and `predictionsTotal` to integers `>= 0` with `correct <= total`. In `chooseDiveZone`, if the chosen value is not in `ZONES`, sample `ZONES[0..5]` uniformly. On `removeItem` failure set `storageFailed` and leave the key’s failure visible. Store `matchesDrawn` (or an outcome enum) for `'draw'`.

## 8. MINOR — The keeper’s quote describes a goal the dive model cannot produce

`game.js:683-696`, `game.js:784-792`, `game.js:850-855`.

A shot is a goal only when it is on target and `keeperDiveZone !== shotZone`. The branch `isGoal && keeperDiveZone === shotZone` (`game.js:788-789`, 「估中兼撲啱，但射門太死角入波」) is unreachable: the equal-zone case is always `isSaved` (`game.js:685-687`). The `else if (shotZone === 'BM' && keeperDiveZone === 'BM')` block (`game.js:688-690`) is the same dead check, so 「門將留守中間，輕鬆沒收！」 never appears.

The quote that does appear is wrong for the case that remains. When the argmax matches the shot but exploration dives elsewhere, the subtext correctly says 「分身撲咗另一邊」 (`game.js:791`) and the commentary says 「你射得太死角喇！」 (`game.js:854`). That pair is the only way `isGoal && predictedZone === shotZone` happens, including a bottom-corner goal. The keeper is admitting a wrong dive and then claiming the shot was too good.

Fix: delete both dead branches. When `isGoal && predictedZone === shotZone`, set the commentary to the same fact as the subtext: 「估中咗，但撲錯邊。」 Use 「撲錯邊」 in the subtext as well; 「分身」 is not how a dive is described.

## 9. MINOR — Cantonese that names the wrong thing, plus a README rule that contradicts the code

- `game.js:802` 「門將早已看穿你嘅習慣」. 看穿 and 早已 are written Mandarin in a sentence that otherwise uses 嘅. Use 「門將一早睇穿你嘅習慣」. The same 看穿 is the placeholder at `index.html:250`.
- `model.js:341` 「多度變線」 is not a shot habit. Use 「射法多變」.
- `game.js:1089` 「打和！雙方難分勝負！」 is sports-page Mandarin. Use 「打和！分唔到高下！」.
- `README.md:23-25` says the 1.5s starts when the run-up starts (「助跑開始後…必須喺 1.5 秒倒數計時內」). The code and the spec play the 1s run-up with input disabled, then start a fresh 1.5s (`game.js:918-927`). The in-game rules card is the one to follow. Change the README to 「助跑嗰 1 秒唔可以撲。助跑完，先有 1.5 秒揀位。」

## 10. MINOR — 可預測度 ignores the sequence the keeper actually learned

`model.js:302-330`. Measured after 15× TL, BR: marginal entropy is 1 bit, `getPredictabilityScore()` is **61**, while `getProbabilities()` assigns **0.814** to the true next zone (TL). The end screen calls 61 「可預測度」. A player who alternates perfectly looks only moderately readable, and the keeper’s own panel shows a confident read. The README formula is marginal Shannon entropy, so the number matches that formula and the tests. It does not match “how predictable you are” once n-grams are the product.

Fix: score `1 − H(next | last) / log2(6)` from the bigram row the keeper conditions on (fall back to the marginal when that row has no counts), and keep the marginal figure only as a secondary 「落點集中度」 if you still want it. Add a test that TL/BR alternation scores high and that a uniform six-way history stays low.

## 11. MINOR — The keep bar under-counts stalled ticks

`game.js:484`.

Each tick subtracts `Math.min(100, dt)`. A single coalesced 1s interval (iOS timer clamping in Low Power Mode, or a long frame) burns 100ms of a 1500ms window, so the bar can take on the order of 15s of wall time to expire. `visibilitychange` already pauses the clock, which is the case the cap was meant to catch.

Fix: subtract the real delta, and cap a single tick at the full remaining window only when `document.hidden` was true at the start of the gap. While the page is visible, a late tick should cost its real time.
