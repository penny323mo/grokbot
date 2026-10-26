# Code review: 12碼讀心戰 vs SPEC.md

`node tests/model.test.js` — 8/8 pass. An exhaustive walk of `checkShootoutDecided` (every goal/miss sequence, player kicks first, sudden death through round 15) matches best-of-5 early elimination and “sudden death ends only after both sides have taken the kick.” Turn order and the 5+10 cap count are right. The bugs below are the ones that still break the match.

## 1. CRITICAL — Tied probabilities always become a top-left dive

`model.js:222-230`, `model.js:247-261`, called from `game.js:499-507` and shown at `game.js:601-622`.

`getProbabilities` picks the winner with strict `>`. On a tie the winner stays `zones[0]` (`TL`). `chooseDiveZone(0.12)` returns that argmax whenever `Math.random() > 0.12` (88% of dives). The other 12% samples the flat distribution, which still hits `TL` one time in six.

Measured on 20,000 fresh-model dives: **TL 89.8%**, every other zone ~2%. After one shot in each of the six zones the distribution is still a perfect tie, and the dive rate is still **89.8% TL**. A balanced shooter never grows a unique mode from the unigram, and the last zone often has an empty bigram row (`bigrams[last]` is only filled when something has followed it), so the keeper keeps camping 左上 for the whole career.

The mind-reading panel then labels that array-order tie as a real read. Each 1/6 is `Math.round`’d to 17 (`game.js:622`), the six labels sum to 102, and the copy is 「門將估你射：【左上】 (信心 17%)」. `screenshots/03-mind-reading-overlay.png` is this state. `recordShot(shotZone, predictedZone)` (`game.js:507`, `model.js:70-74`) also books that fake guess into 門將讀心命中率.

**Fix:** Treat a tie as no prediction. In `getProbabilities`, collect every zone within `1e-9` of the max. If more than one, return `predictedZone: null` (or `ambiguous: true`). In `chooseDiveZone`, sample uniformly among the tied zones and skip the argmax shortcut. In `showMindReadingOverlay`, when there is no unique mode, write 「門將暫時未有傾向」 and do not mark a pink “首選” bar. Pass `null` into `recordShot` so a tie is not a hit or a miss (`if (predictedZone)` already skips that). Add a unit test: fresh model and a one-each-zone history must not send more than ~25% of dives to any single zone over a few thousand draws. Keep the existing “10× TL → predict TL” test; that case is a unique mode.

## 2. CRITICAL — Leaving the match, or tapping 繼續 twice, corrupts the next kick

`game.js:301-311`, `game.js:330-334`, `game.js:354-378`, `game.js:416-421`, `game.js:589-591`, `game.js:676-679`, `game.js:839-841`, `game.js:897-900`.

`cleanTimers` only `clearInterval`s the keeping bar. Shot resolution, the mind-reading delay, and the post-save `advanceRound` delay are bare `setTimeout`s. Nothing clears `#mind-reading-overlay.active`.

Deterministic repro:

1. Shoot once and wait for 門將讀心透視.
2. Tap 🏠 and confirm. `showScreen('title')` hides the match; the overlay keeps `active`.
3. Tap 開波. `startMatch` never removes `active`, so the old panel is on top of the new match.
4. Tap 繼續. `proceedAfterPlayerShot` runs on the reset 0–0 state and calls `startAiTurn`. The player’s first shot is skipped.

Second repro: tap 🏠 during the 1.5s pause after an AI kick (`game.js:839`). Confirm does not cancel that timeout. It then calls `advanceRound` → `endMatch` → `model.recordMatchResult` (`model.js:339-342`) and yanks a quitter onto the result screen, or, if 開波 already ran, it does `gameState.round += 1` on the new match.

Third repro: the 繼續 listener (`game.js:676-679`) is not guarded. A double tap calls `proceedAfterPlayerShot` twice. The second call invokes `startAiTurn` again, so `aiShotsFaced` increments twice (`game.js:698`) and the AI zone is re-rolled.

**Fix:** Bump a `matchToken` inside `cleanTimers`, and ignore every timeout whose token is stale. Call `cleanTimers()` from `startMatch`, `endMatch`, and the home handler, and set `waitingForInput = false`. Remove `active` from the overlay in `startMatch` and `resetFieldPositions`. Make 繼續 a no-op unless the overlay is active, and remove `active` before `proceedAfterPlayerShot`.

## 3. MAJOR — The 1.5s save window includes the run-up, and the clock runs while the tab is frozen

SPEC.md line 7: show a 1s run-up **before** the player must dive; if they do not choose within 1.5s they stay in the middle. `game.js:723-749` sets `waitingForInput`, starts the 1.5s `performance.now()` clock, and adds `.run-up` (1s, `style.css:756-764`) in the same turn. The dive is legal during the run-up, and only ~0.5s remains after the animation finishes.

The clock is wall time. `confirm()` (`game.js:331`) blocks interval ticks and does not stop `performance.now()`. Cancel the “return home?” dialog after 1.5s and the next tick sees `remaining <= 0` and forces `BM` (`game.js:742-747`). Hiding the tab on iPhone Safari does the same: the interval stalls, then one tick forfeits the kick.

**Fix:** On the AI turn, play `.run-up` with input disabled. After 1000ms, set `waitingForInput` and start a 1500ms clock. Ignore zone clicks before that. Drive the bar by subtracting a capped tick delta (or `requestAnimationFrame` dt), and pause on `visibilitychange`. Replace `confirm`/`alert` with an in-page dialog that clears the keeping interval before it opens; on cancel, resume with the remaining time, not the original timestamp.

## 4. MAJOR — A miss is narrated as a save, and a timeout save is not counted

`game.js:525-544`, `game.js:603-670`, `game.js:814-825`, `game.js:697`, `game.js:957-960`.

The overlay only knows `outcome === 'scored' | 'missed'` and whether `predictedZone === shotZone`. It does not know whether the ball missed the frame or the keeper actually touched it.

- Top-corner miss (`Math.random() < 0.12`, `game.js:514-518`) with a matching argmax: the banner can say 「中柱彈出！」 and the panel still says 「門將早已看穿你嘅習慣，神勇撲出！」 (`game.js:612`, commentary `game.js:666`). The dive may have gone somewhere else; `chooseDiveZone` is a second draw (`game.js:504`).
- Argmax matches the shot, exploration dives elsewhere, and the shot is a goal: the panel says 「門將雖然估中，但角度太刁依然射入！」 (`game.js:608`) while the line above says the keeper went to a different zone.
- Timeout is the first branch (`game.js:816-818`), ahead of `isSaved`. Staying on `BM` and stopping a `BM` shot shows only 「未能及時反應！留喺中間！」 and does **not** increment `playerSavesCount`. A timeout goal does not say 「電腦射入！」 either. The end-screen 把關成功率 (`game.js:957-960`) uses that undercount as the numerator and `aiShotsFaced` (incremented at the start of the turn, including AI misses) as the denominator.

**Fix:** Pass `{ isGoal, isSaved, isCornerMiss, missType, timedOut }` into the overlay and branch on those flags. Credit `playerSavesCount` whenever `isSaved` is true, including a timeout. On timeout, keep the “留喺中間” clause and append the real result. Compute 把關成功率 as saves / (saves + AI goals), and leave off-target AI misses out of the denominator.

## 5. MAJOR — A tie at the 15-round cap is stored and shown as a loss

`game.js:870-874`, `game.js:897-911`, `model.js:339-342`.

If both sides still have the same score after round 15 (5 regulation + 10 sudden-death rounds, which matches the spec cap), `checkShootoutDecided` returns true because `gameState.round >= MAX_TOTAL_ROUNDS`. `endMatch` sets `won = playerScore > aiScore`, so a draw takes the loss path: sound is `playMiss`, the title is 「你輸咗！門將技高一籌！」, and `recordMatchResult(false)` writes a loss. There is no draw class on `.result-title` (`style.css:1055-1061`).

**Fix:** When the cap ends the match with equal scores, show 「打和」 with its own style and call `recordMatchResult('draw')` (do not increment `matchesWon`). Keep the unequal-score endings as they are; those comparisons are correct.

## 6. MAJOR — iPhone Safari layout puts the six zones and 繼續 in the toolbar area

`index.html:5`, `style.css:31-40`, `style.css:45-54`, `style.css:507-519`, `style.css:565-571`, `style.css:877-892`.

The spec requires 375px portrait and iPhone Safari. The page sets `viewport-fit=cover` and never reads `env(safe-area-inset-top)` or `env(safe-area-inset-bottom)`. `body` and `#game-container` are `min-height: 100vh` (the large viewport, which includes the area behind Safari’s dynamic toolbars). The match column is a flex column; `.stadium-scene` is `justify-content: flex-end`, and the goal sits on the bottom of that column (`margin-bottom: 60px`). The bottom row of zones — the row the AI aims at 60% of the time — is the first thing covered when the visual viewport is shorter than `100vh`. During a 1.5s dive that is the difference between a tap and a timeout.

`.mind-reading-overlay` is `display: flex; align-items: center` with no `overflow-y: auto` and no `max-height`. The card (header, two-line prediction, legend, six bars, commentary, button) is centered in the match pane. On a short iPhone viewport the 繼續 button is clipped, zone clicks are covered by the overlay (`z-index: 80`), and the match cannot continue.

**Fix:** Size the shell with `min-height: 100dvh` and `min-height: -webkit-fill-available`, and pad the container with `env(safe-area-inset-*)`. Drop `viewport-fit=cover`, or keep it only together with those insets. Keep the goal fully inside the small viewport (shrink `margin-bottom` / goal height before clipping zones). Give the overlay `overflow-y: auto; -webkit-overflow-scrolling: touch; align-items: flex-start` so 繼續 scrolls into view.

## 7. MAJOR — Sudden-death kick dots overflow a 375px screen

`game.js:434-463`, `style.css:54`, `style.css:411-421`.

Each dot is 14px with a 5px gap (`19n − 5` per side). The tracker’s usable width at 375px is `375 − 32` (scoreboard padding) `− 12` (tracker padding) = 331px for **both** rows. `totalSlots` grows without a cap once `isSuddenDeath` is set.

| Dots per side | Both rows | Versus 331px |
|---|---|---|
| 8 (3rd sudden-death kick) | 294 | fits |
| 9 | 332 | clips |
| 10 | 370 | clips |
| 15 (the spec max) | 560 | clips |

`.kick-dots-group` does not wrap or scroll, and `#game-container` is `overflow: hidden`, so the extra ✅/❌ history is cut off from the 4th sudden-death round onward.

**Fix:** Let `.kicks-tracker` scroll horizontally (`overflow-x: auto`), or once `isSuddenDeath` is set show only the sudden-death dots (plus a “正規 5 輪完” note). Shrink the dot to 10px if you keep all 15 on one row: `15*10 + 14*4 = 206` per side, 412px combined, which still needs the scroll.

## 8. MAJOR — Cantonese that names the wrong event, or is not a sentence

- `game.js:527` 「中柱彈出！」 names the upright. The flight is `.miss-crossbar` (`style.css:823-831`), which hits the bar. The rules already say 門楣 (`index.html:49`). Use 「中楣彈出！」 or 「射中橫樑！」. Same lump in `game.js:822` 「電腦射失門楣/出界！」 is closer, and the two strings should use one term.
- `index.html:47`, `game.js:428`, `README.md:11` 「即時死亡」 means instant death. The football term is 「突然死亡」. 「打和即時死亡」 also has no verb. Use 「打和就入突然死亡」. The round chip `即時死亡 第 ${round} 輪` counts from the start of the match, so the first extra round reads as sudden-death round 6. Use `突然死亡 第 ${round - 5} 輪`.
- `game.js:666` 「由你行埋去個下」 is not grammatical. 「個下」 is not 「嗰陣」. Use 「哈！你行埋嚟嗰陣，我已經知你想射呢度！」.

## 9. MINOR — localStorage accepts a broken model and fails silently

`model.js:26-47`, `model.js:359-382`.

`saveToStorage` swallows quota and private-mode failures. The in-memory brain keeps learning, the title still says 「已記錄 N 次」, and a reload comes back empty. There is no on-screen line when the write fails.

`init` copies `freq` and `history` with no checks. A string count (`freq.TL = "2"`, which `+` concatenates) makes every probability `NaN` and `confidence` **-100** (`Math.round` never runs, because `NaN > -1` is false and `maxProb` stays `-1`). The panel would show 「信心 -100%」. `totalShots > 0` with an all-zero `freq` yields entropy 0 and 可預測度 100 (`model.js:270-298`). History entries are not restricted to `ZONES`. The catch in `loadFromStorage` says it falls back to a fresh init and then does not call `init()`; a throw after a partial write would leave the half-built object (today `JSON.parse` usually throws before `init`, so this is latent).

**Fix:** After `JSON.parse`, rebuild through `recordShot` from a sanitized history, or reject the blob and `init()` when `freq` values are not finite, `totalShots !== sum(freq)`, or any history entry is outside `ZONES`. On `setItem` failure, set the title memory line to 「呢部機儲存唔到記憶」.

## 10. MINOR — Other copy that misses the spec’s Cantonese UI

SPEC.md line 3: all UI text in 廣東話.

- `index.html:296` 「你的可預測度」 uses Mandarin 的. Use 「你嘅可預測度」. The same header plus 「Shannon 熵值分析」 (`index.html:298`) and 「(Predictability)」 do not fit a 375px card: `.stat-header` is a non-wrapping flex (`style.css:1078-1086`). Drop the English gloss, or allow the header to wrap.
- `index.html:313` “(Heatmap)”, `index.html:49` “N-gram” — same issue. Say 「熱點圖」 and 「前後兩腳嘅規律」.
- `game.js:331`, `game.js:339`, `game.js:343` dialogs are written Mandarin (「目前」「嗎」「的所有記憶」「將會」). Use 「結束而家呢場，返主頁？」, 「清晒門將記憶？佢會變返白紙。」, 「已經清晒門將記憶。」
- `model.js:306-310`: a score under 20 is tagged 「頂級讀心大師」, which reads as “you read minds.” That band means the keeper cannot read you. Use 「完全估唔到 · 毫無破綻」. 「攻守兼備」 (`model.js:308`) describes a player’s all-round game, not a shot distribution.
- `index.html:340` 「重置門將記憶 (重新開始)」 does not start a match. `game.js:348-351` only resets storage and re-renders the end stats. Delete 「(重新開始)」, or call `startMatch()` after a confirmed reset.
- `index.html:86` the scoreboard name stays 「你 (主射)」 while you are keeping. Swap it in `startPlayerTurn` / `startAiTurn`. Spec line 13 also says the sides are 你 vs 電腦; 「AI 門將」 (`index.html:100`) is acceptable if it changes to the kicker on the AI’s turn.

## 11. MINOR — Bottom-middle “stay” includes a top-middle dive; the bar miss always flies right

- `game.js:536-539` and `game.js:780-782`: a `BM` shot is saved when the keeper dives `TM`. SPEC says bottom-middle is easier **if the keeper stays**. A dive to the top middle is not staying. Only `BM` (the timeout default, `game.js:743`) should get that save. Diving to `BM` is already covered by `keeperDiveZone === shotZone`.
- `style.css:827-831`: `@keyframes hit-crossbar` always translates `+60px`. A 左上 miss hits the right side of the bar. `.miss-over` (`style.css:813-816`) is unused. Branch the keyframes, or set a CSS variable for the horizontal sign from `TL` vs `TR`.

## 12. MINOR — Tests stay green on the tie bug, and they announce success after failures

`tests/model.test.js:18-22`, `tests/model.test.js:201`, `model.js:184-186`.

The suite never draws `chooseDiveZone` on a tied distribution, so finding 1 ships green. The fail path sets `process.exitCode = 1` and then always prints `All ${passed} / ${total} tests passed successfully!`. Print that line only when `passedTests === totalTests`.

`getProbabilities` drops bigram and trigram weight while `totalShots < 3` (`model.js:184-186`). After `BR`, `TL` the two zones tie at 0.292 and the argmax is `TL`, so the pattern “next is BR” is invisible until the third shot. Once ties are sampled fairly this is only a slow start; either let a single observed transition carry a small weight from shot 2, or document the warm-up in the rules.

## 13. MINOR — Touch polish at 375px

- `.reset-memory-btn` is `padding: 5px 10px` and `font-size: 0.75rem` (`style.css:293-301`), about 24px tall. The sound chip is similar (`style.css:129-143`). Spec asks for big touch targets; give both at least 44px of hit area.
- `.zone-cell:hover` (`style.css:638-643`) sticks after a tap on iOS. Gate the hover rule with `@media (hover: hover)`.
- Probability bars use `Math.max(5, pct)` (`game.js:652`), so a 0% zone still draws a 5% bar. Use the raw percent; a 2px minimum is enough to see the track.
- AI top corners miss on 10% (`game.js:768-771`). The player’s corners miss on 12% (`game.js:515`), which is the only rate the rules state (`index.html:49`). Use 12% for both, or add the AI miss to the rules card.
