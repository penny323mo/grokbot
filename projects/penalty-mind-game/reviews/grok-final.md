# Final review — 12碼讀心戰 vs SPEC.md

**Verdict: NOT READY**

No CRITICAL issues. Shootout flow, the keep-clock timeout, and the 375px layout fixes from earlier rounds hold. One MAJOR is still open and it is the spec’s end-screen number: 「可預測度」. `node --check` is clean on `model.js`, `game.js`, and `tests/model.test.js`. `node tests/model.test.js` is 12/12. Those tests never feed a short, varied history, so they stay green while a normal debut match is scored as solved. No browser was launched.

## Still unresolved

Blocking:

1. MAJOR — plug-in conditional entropy scores a short varied career as 「極易捉路」. Fix `model.js` before ship.

Not blocking, still open:

2. MINOR — localStorage still accepts a freq/history/bigram blob the game itself would not write.
3. MINOR — mind-reading bar percents sum to 101 or 102.
4. MINOR — README band names are not the strings the end screen shows.

## Checked and holding

- Regulation early wins use strict “cannot catch up”. A 3–0 and a 0–3 both end at 3 kicks each. A 5–3 lead ends on the leader’s fifth kick, before the trailer’s fifth. Tied 5–5 enters sudden death instead of ending.
- Sudden death does not end on the first kicker’s goal. It ends only once both sides have taken that pair and the scores differ. Round 15 with level scores is a draw (5 + 10). A lead on that pair is a win, not a draw.
- A 4096-pattern comparison of `checkShootoutDecided` / `advanceRound` against that rule set produced 0 mismatches. Turn order stays player shot, then AI shot, including sudden death.
- Keep timeout calls `handlePlayerDiveChoice('BM', null, true)` and the `timedOut` guard lets that path record the kick (`game.js:517-521`, `game.js:963-966`). The 1s run-up does not start the 1.5s clock while a dialog is open or the tab is hidden (`game.js:951-955`).
- `#game-container` sets `height: 100dvh` after `-webkit-fill-available` (`style.css:57-60`). `touch-action: manipulation` covers `html`, `body`, `button`, and `.zone-cell` (`style.css:31-33`). Kick dots are two stacked rows; 15 dots are about 300px against a ~331px content box at 375px, so the player row is not pushed off. The reaction banner wraps (`style.css:917-920`). `.screen` has `min-height: 0` (`style.css:87`).
- Dive choice, top-corner 12% miss, BM stay-save, muted-by-default WebAudio, and the pre-shot mind-reading panel match the spec. In-game Cantonese (睇穿, 嚟唔切, 分唔到高下, 開波, 可預測度) is in good shape.

## Issues

### 1. MAJOR — 「可預測度」 treats an unseen habit as a certainty

- File: `model.js:414-421` (row entropy), `model.js:434-440` (score), `model.js:446-448` (copy). Shown at `game.js:381-387` and `game.js:1143-1147`. Contract: `README.md:50`.
- The score is the plug-in estimate of H(next | last). A context seen once has only one successor, so that row’s entropy is 0. A debut that never repeats a setup is therefore scored as perfectly predictable. `getPredictabilityScore` falls back to the marginal only when there are zero transitions (`model.js:401-402`), which is not the “歷史不足則平滑退回” rule in the README. One shot also has marginal entropy 0, so the fallback still returns 100.
- Measured with `PenaltyMindModel`:
  - `TL, TM, TR, BL, BM`: score **100**, conditional entropy **0**, marginal entropy **2.322** (that marginal would be a score of 10). `getProbabilities()` is ambiguous, confidence **19%**. `getPredictabilityRating()` returns 「極易捉路 · 習慣定型」 / 「門將已經完全摸清你嘅射門套路！」.
  - One `TL`: score **100**, keeper confidence **39%**. The title line becomes 「已記錄 1 次射門 · 可預測度 100%」.
  - 8000 uniform random 5-shot debuts: minimum **54**, median **81**, **32.3%** exactly 100, **0%** at or below 20. **59.4%** of those models still had an ambiguous next read or confidence under 40%. A human-like mix (60% low corners) had the same median **81** and **27.4%** at 100.
- The same end screen can show 可預測度 100 and 門將讀心命中率 0, because ambiguous guesses are not counted (`model.js:136-141`, `game.js:1177`). The dive model is doing the right thing. The headline number contradicts it. Alternation and “always TL” still deserve a high score; those paths are fine and the existing tests should keep passing.
- Fix: in `getConditionalEntropy`, if `rowCount < 2`, set that row’s entropy to `Math.log2(6)` instead of the plug-in value. In `getPredictabilityScore`, `if (this.totalShots < 2) return 0`. Do not weaken `tests/model.test.js:303` (30 alternating shots must stay 100). Add two asserts: five distinct zones score `<= 20`, and a single shot scores `0`.

```javascript
if (rowCount < 2) {
  rowEntropy = Math.log2(this.zones.length);
} else {
  // existing plug-in over this row
}
```

### 2. MINOR — localStorage sanitizing still accepts a brain the game would not save

- File: `model.js:32-43` (freq), `model.js:47-59` (bigrams), `model.js:80` (history).
- Non-numeric bigrams and negative accuracy are rejected, and `chooseDiveZone` no longer returns `undefined`. Three holes remain, all on load of a blob `recordShot` would not write:
  - Freq values are not required to be integers. `{ totalShots: 1.5, freq: { TL: 1.5, ... }, history: ['TL'] }` is kept.
  - History is not capped and is not checked against freq. A 800-long history loads as-is (`recordShot` caps at 500). `{ totalShots: 4, freq all on TL, history: ['BR','BR','BR','BR'] }` loads and then predicts **TL** from freq while the context is BR.
  - Bigram magnitudes are unbounded. A row of `TL → TL: 100000` with `totalShots: 2` predicts TL at **75%** and dove TL on **193/200** draws.
- Fix: require `Number.isInteger` on each freq count. If `history.length > totalShots` or `history.length > 500`, or the sum of all bigram counts is greater than `max(0, totalShots - 1)`, fall through to the clean `init()` the same way a bad freq sum already does. Slice is the wrong repair for a contradictory history; reject the blob.

### 3. MINOR — the six bar percents do not add up to 100

- File: `game.js:834`.
- Each zone is `Math.round(p * 100)` on its own. A fresh model shows **17% × 6 = 102**. After 10× TL the bars sum to **101** while the headline confidence is 91. The panel is the feature the spec calls out, and the columns visibly disagree with “100%”.
- Fix: turn the six probabilities into integers with the largest-remainder method so they sum to 100, and use that same integer for the predicted zone’s 「信心」 label.

### 4. MINOR — README rating names are not the end-screen copy

- File: `README.md:51-55` vs `model.js:446-452`.
- The game says 「完全估唔到 · 毫無破綻」, 「難以捉摸 · 射法多變」, 「飄忽不定 · 偶有規律」, 「明顯偏好 · 露出破綻」, 「極易捉路 · 習慣定型」. The README says 「頂級讀心大師」, 「攻守兼備 · 飄忽不定」, and draws the 40–65 and 65–85 bands so that 65 sits in both. Players who read the README will not find those labels on the result screen.
- Fix: paste the five `getPredictabilityRating` tags into the README and split the bands at the same cuts the code uses (0–19, 20–39, 40–64, 65–84, 85–100).
