# 盤口實驗室 — review (grok-r1)

Reviewed against SPEC.md. `node --test tests/` : 9 passed, 0 failed. No browser was launched (per the brief); layout notes are from the CSS and DOM.

Checked and sound, so they are not issues below:

- Walk-forward does not use the match or anything after it. `fitDixonColes` drops `mDate >= asOfDate` (`js/model.js:489`). Adding a 15-0 on the as-of date and a week later changed fitted parameters by 0. The same score the day before moved λ from 1.66 to 2.15. Same-calendar-day games are all held out, which is the right call on date-only data.
- Quarter-line settlement matches an independent split-stake implementation (lines −2…+2, goal diff −5…+5, odds 1.85/2/2.40): 0 mismatches. `settleAH(1, −0.75, 1.90) = 1.45`. Fair AH prices have EV ≈ 0. AH Kelly’s log-growth root matches a 0.001 grid search.
- Binary Kelly: p=0.55 @ 2.0 → 0.10, zero when EV ≤ 0, fractional scaling and the cap work. Proportional and power de-vig both sum to 1; power shifts mass onto the short price. CLV formula `(taken / fair close) − 1` is right when the sharp trio is complete.
- Dixon–Coles τ for (0,0)/(0,1)/(1,0)/(1,1) matches the usual formula; ρ is fixed at −0.05 and applied in `calcScoreMatrix`. 0-0 and 1-1 rise vs independent Poisson. Spec allows a fixed ρ. τ is not inside the fit likelihood (two-step Poisson λ, then τ). That is allowed; it is why displayed λ and matrix xG differ only in the 4th decimal on a normal scoreline.
- `build_data.py` column map checks out on E0 2026-08-21 Arsenal 3-0 Coventry: B365 open 1.20/7/13, close 1.18/7.5/13, AHh=AHCh=−2 with B365AHH 2.03 / B365AHA 1.78, sharp 1.23/7.4/18 = BFE (no PS on 2627). AHh is the home handicap (home favourites are negative; 219/240 E0 2425 home-favourites have AHh < 0, none positive). Dates are dd/mm/yyyy → ISO, yy → 20yy. BOM handled. Five leagues, 2627 squad sizes 20/20/20/18/18, `data.js` 488 KB. All 121 team strings hit `team_names.py`, including 馬拉加 / 拉科魯尼亞 / 侯城 / 勒芒 / 艾華斯堡 / 高雲地利 / 柏達邦 / 桑坦德競賽. No Simplified characters in `index.html`, `js/app.js`, or `js/model.js` (只睇 / 系數 / 薩姆松 are the traditional characters).

The fit that the UI actually shows, and the AH Kelly card, are not safe to bet from.

## Issues

### 1. CRITICAL — AH Kelly always prices the level ball, then stakes the fixture’s AH odds

- File: `js/app.js:712-716` (odds prefilled at `js/app.js:671-672`, options in `index.html:214-215`)
- The selector `ah_home` / `ah_away` sets `ahLine = 0` and never reads `fix[10]`. The odds box is filled with B365AHH/B365AHA for the real line (often −1.5 or −2).
- Arsenal vs Coventry, UI model, home price 2.03 which is the −2 quote: Kelly on line 0 reports edge **+32.2%** and quarter-Kelly **10.4% of bankroll**. The same price on line −2 has edge **−56.7%** and Kelly **0**. The card tells the user to load up on a bet the model itself says is awful.
- Fix: resolve the line from the loaded fixture when home/away ids match (`fix[10]`), otherwise require an explicit line control. Pass that same home-line into `calcAHProbs` for both sides (`ah.away` is already the other side of that line; do not negate it again). Put the line in the option label, e.g. 「主隊 −2（讓兩球）」. Recompute when the fixture changes.

### 2. CRITICAL — Half-life does nothing on the model the user sees

- File: `js/model.js:491-498`, call site `js/app.js:93-97`
- `getLeagueModel` passes `halfLifeDays` and does not pass `asOfDate`. In `fitDixonColes`, decay runs only when `asOfDate` is set. The else branch is commented 「relative to newest match」 and then sets `weight = 1.0`.
- Empirical: half-life 180 vs 30 with no `asOfDate` → max |Δα|, |Δβ|, |Δ home advantage| = **0**. 2024-25 games weigh the same as last week. The settings slider only changes the cache key and then refits the same equal-weight model. Backtest does pass `asOfDate`, so the backtest model and the match-lab model are different objects.
- Fix: anchor decay at `asOfDate` or, if omitted, at the latest match date (for the lab, `2026-10-25` / `dataThrough`). Always apply `exp(−Δt · ln2 / halfLife)`. Pass that anchor from `getLeagueModel`. Keep the cache key as league + half-life + anchor.

### 3. CRITICAL — Ridge is on the wrong scale, so every team is shrunk toward average

- File: `js/model.js:555-564` (also the `/ totalW` at `js/model.js:555` and α recentering at `js/model.js:573-577`)
- The score gradient is divided by the league’s total weight (~800), then `l2 * α` with `l2 = 0.08` is subtracted unscaled. The prior is effectively hundreds of phantom matches. Promoted sides sit near 0, which is what the spec wants, but so does Arsenal.
- UI fit (60 iterations, no decay), Arsenal home vs Coventry: λ **1.74 / 1.06**, fair 1X2 **1.89 / 4.04 / 4.48** (home 53%). The market is **1.20 / 7.00 / 13.00**, AH −2 @ 2.03. Model fair price on −2 is **6.32**.
- Running the same optimizer to convergence does not rescue it. With `asOfDate=2026-10-25`, half-life 180: α SD of the 20 current sides saturates at **0.123** by 400–800 iterations (60 iterations is 0.085, Poisson LL/match −1.774 vs −1.750). Arsenal vs Coventry becomes λ 1.98 / 0.83, fair home **1.57**, still nowhere near 1.20. Home advantage sticks near 0.20 in log space.
- E0 2026-27 1X2 backtest at 3% edge is the symptom: **54 bets, hit rate 20.4%, ROI −17%, average CLV −8.5%, 20.4% beat the close**. The “value” bets are the longshots this shrinkage invents.
- Fix: put the penalty on the same scale as the data gradient, e.g. `g_α[i] − l2 * α[i]` with `l2` a pseudo-count (about 6–10 matches), and a smaller step size; or multiply `l2` by `invW` if you keep the averaged gradient. Do not recenter α inside the loop after an L2 pull toward 0, or recenter both α and β and penalise the deviations. Re-check Arsenal–Coventry: fair home should land in the mid 1.2s–1.4s, and α SD should be several tenths, before shipping. 400 iterations is ~8 ms, so the browser budget is not the constraint.

### 4. CRITICAL — 淨評分 is α − β, and β is defensive strength, so the table is upside down

- File: `js/app.js:1346-1350`, displayed at `js/app.js:1369-1370`. The λ definition that makes β a strength is `js/model.js:540-541` (`λ_away = exp(μ + α_away − β_home)`).
- Higher β means fewer goals conceded. Subtracting it treats a good defence as a worse team. On the UI fit, α+β ranks 阿仙奴 0.32, 曼城 0.30, which matches the 2026-27 table (曼城 21 pts, 阿仙奴 18, 白禮頓 16). α−β ranks 利物浦, then 葉士域治 (β = −0.13, a bad defence inflates the score), and leaves 阿仙奴 near the bottom. 葉士域治 is last on α+β.
- Fix: rank and label 淨評分 as α+β, with one line of copy: 「β 越高，對手越難入波」. Keep α and β as separate columns so the sign is visible.

### 5. CRITICAL — O/U line chips stack a new click handler on every render

- File: `js/app.js:557-566`, called from `renderMatchLab` (`js/app.js:328`) and again from inside the handler.
- `#ouLineChips` is not inside the HTML that `renderOUMarkets` replaces, and the code uses `addEventListener` with no removal. Each fixture load adds another listener. The next tap fires every accumulated handler, and each handler adds still more. Ten fixture taps, then one chip tap, fans out into hundreds of re-renders and will lock an iPhone.
- Fix: bind the three chips once in `initApp`, or assign `chip.onclick = ...` so the previous handler is replaced. Do not register listeners inside `renderOUMarkets`.

### 6. MAJOR — 盤口走勢 is missing the model, the sparkline, and CLV on the model’s side

- File: `js/app.js:776-870`, copy at `index.html:266` and `index.html:302-308`
- Spec for this tab: last ~10 matches, open vs close 1X2 and AHh → AHCh, drift arrows, the walk-forward pre-match probability, CLV of a hypothetical bet on the model’s side, and an open→close implied-probability sparkline. The card shows the selected team’s own 1X2 price (home or away only, no draw), an AH line string, and CLV of betting that team at the open (`js/app.js:821-824`). There is no model probability and no chart. The intro calls this 「模型事後驗證」, which is the opposite of walk-forward.
- CLV here also ignores the margin-method setting and always uses `'proportional'`.
- Fix: for each of the 10 matches, fit with `asOfDate = match date` (cache by week), record the model’s 1X2/AH pick, and compute CLV on that selection against sharp close. Draw a 2-point canvas/SVG bar of open vs close implied probability inside the card. Change the sentence to 賽前概率.

### 7. MAJOR — Margin-removed book probability is calculated and then thrown away

- File: `js/app.js:338-404`. CLV hardcodes the method at `js/app.js:824` and `js/model.js:822`.
- `bookieFairProbs` is filled with `removeMargin(..., settings.marginMethod)` and never rendered. The row the user sees is model probability, model fair odds, raw book odds, and edge `p_model * odds − 1`. Spec asks for the de-vigged book probability next to those. Switching 比例均攤 / 指數冪次 in settings therefore changes nothing on screen, and backtest CLV cannot follow the setting because `calcCLV` is called with `'proportional'` only.
- Fix: add a row 「莊家去水後」 with `bookieFairProb` and the de-vigged fair odds `1/p`. Thread `state.settings.marginMethod` into movement CLV and `runBacktest` → `calcCLV`.

### 8. MAJOR — Saved bankroll and Kelly fraction do not drive the calculator, and the two sliders disagree

- File: `js/app.js:1604-1631` (load/apply), `js/app.js:635-646` and `js/app.js:689-692` (calculator reads the DOM), `index.html:233` vs `index.html:568`
- `loadSettings` / `updateSettingsUI` restore the settings sheet only. They never set `#kellyBankrollInput` or `#kellyFractionSlider`. After a reload the sheet and `runBacktest` use the stored fraction, while the Kelly card still shows the HTML defaults (10000, 0.25) and `calculateKellyNow` trusts those inputs.
- The card slider is 0.10–1.00. The settings slider is 0.05–0.50. Saving settings reads the clamped settings slider, so a card value of 0.80 is stored as 0.50, and the card slider is not updated. Reset (`js/app.js:1571-1584`) writes the defaults and does not reset the card inputs or the backtest controls. The backtest edge slider (`js/app.js:961`, `index.html:372`) is a third copy and does not follow the settings threshold.
- Fix: one `applySettingsToDom()` that sets every slider and the bankroll input from `state.settings`, call it from init, save, and reset. Use the same Kelly range 0.10–1.00 in both places. Point the backtest edge control at `state.settings.edgeThreshold` (or write back into it).

### 9. MAJOR — Kelly odds stay on the previous fixture after the teams change

- File: `js/app.js:660-674`, contrast with the guard at `js/app.js:309-323`
- The 1X2 grid shows book prices only when `fix[2/3]` equal the selected teams. `autoPrefillKellyOdds` always writes `fixtures[selectedFixtureIdx]` into the odds box, and `renderMatchLab` calls it on every team pick, swap, and settings save. Swap 阿仙奴/高雲地利 and the card still stakes 高雲地利’s price on 阿仙奴’s λ.
- Fix: prefill only when the fixture’s home and away ids match `state.activeHomeId/activeAwayId`; otherwise leave the input blank and show 「未有對應盤口」.

### 10. MAJOR — 「全部五大聯賽」is five separate banks glued end to end

- File: `js/app.js:972-1024`. Each call uses `initialBankroll: 100` at `js/app.js:988-997`.
- Leagues are simulated independently, then profits are appended E0 → SP1 → I1 → D1 → F1 onto one curve that also starts at 100. Kelly stakes were sized off each league’s own bank, not the combined bank. The curve is not in date order, so the drawdown is not a drawdown anyone could have lived through. Flat-stake ROI (total profit / total staked) is still a valid blend; the equity curve and max drawdown are not. Per-league rows are fine.
- Fix: for ALL, either show five curves, or merge bets by date onto one bank and, for Kelly, size each stake from that running bank (one walk-forward, not five).

### 11. MAJOR — 「近兩季」backtests 2024-25 as well

- File: `index.html:341`, filter `js/model.js:615-617`
- The option label is 「近兩季完整數據 (2526 + 2627)」. The value is `all`, and `all` keeps every row. E0 then tests **830** matches (380+380+70), not 450. The 2025-26 option also says 「380場」 for every league; 德甲 and 法甲 are 306.
- Fix: filter `m[7] === '2526' || m[7] === '2627'`, and drop the 380-game claim or make it league-specific.

### 12. MAJOR — Kelly staking has a 0.1u floor that can exceed the bank

- File: `js/model.js:765-774`
- After `recommendedStake(bankroll)`, any stake `< 0.1` becomes 0.1. `recommendedStake` rounds to the cent, so a small fraction on a bruised bank becomes 0, then 0.1. On a bank of 0.05 with fracKelly 0.05 the stake is 0.1, larger than the bank, and the next settlement can drive the bankroll negative. The floor also over-bets any genuine Kelly stake in `(0, 0.1)`.
- Fix: `stake = min(bankroll, kelly stake)` and skip the bet when that is 0. Drop the 0.1 floor.

### 13. MAJOR — 平均收市抽水率 is the sum of implied probabilities, shown as ~105%

- File: `js/app.js:885-924`, labels `index.html:282-284`
- `calcOverround` returns Σ 1/odds ≈ 1.056 on E0 closes. The UI multiplies by 100 and prints **105.6%** under 「抽水率 / 莊家理論抽水」. The vig is **5.6%**. (Every built match has close 1X2, so the “divide by all matches” denominator happens to be harmless on this file; still divide by the count of matches that actually contributed.)
- Fix: display `(overround − 1) * 100` with the 抽水 label, one decimal.

### 14. MAJOR — Half the 「即將開賽」list has already kicked off, and it is the default match

- File: `build_data.py:241-273` (no date filter), sort `build_data.py:273`, default load `js/app.js:188-190`
- Today in the spec is 2026-10-25. Of 48 fixtures in E0/SP1/I1/D1/F1, **24 are dated 2026-10-23 or 2026-10-24**. Results stop at `dataThrough` 2026-10-21, so these games are neither results nor future. Lists are sorted ascending, so every league opens on 23 Oct (E0: 葉士域治 vs 諾定咸森林, 20:00). The strip is titled 「本週即將開賽」.
- Fix: in `build_data.py`, keep fixtures with `date >= 2026-10-25` (or `> dataThrough` if you intentionally keep 22–24 Oct). Default-load the earliest remaining fixture.

### 15. MAJOR — 球隊 tab is missing the splits the spec asks for, and 「預期得球」is not xG

- File: `js/app.js:1215-1401`, pills at `js/app.js:1297-1302`, xG at `js/app.js:1381-1384`
- Spec: form cards with the last five as 贏/和/輸, goals for/against, attack and defence, home/away splits, 2026-27 mini table, tap to set home or away. The table has a mini table and a last-five strip, but the pills say 勝/和/負. The power card has α, β, the inverted 淨評分 from issue 4, and `exp(μ + α)` labelled 預期得球 — that ignores opponent defence and home advantage, so it is not a match xG. There is no home GF/GA vs away GF/GA. Tapping a table row only assigns 主隊 (`js/app.js:1320-1324`) and will happily set home = away.
- Fix: pills 贏/和/輸. On each card show 主場 得/失 and 作客 得/失 from 2627 matches, plus last five. Replace 預期得球 with a clearly labelled baseline, or delete it. Reject the tap when it would duplicate the other side.

### 16. MAJOR — 390px tap targets and tooltips miss the iPhone rules

- Spec hard rule: ≥44px targets, no hover-only UI, tooltips open on tap, no page-level horizontal scroll.
- Under 44px: league chips `min-height: 36px` (`css/style.css:212`), gear `38px` (`css/style.css:165`), swap `36px` (`css/style.css:513`), sheet close `32px` (`css/style.css:1538`), selects `min-height: 40px` and the movement select `32px` (`css/style.css:965`, `css/style.css:1016`), O/U chips padding `3px 8px` (`css/style.css:895`), ⓘ padding `2px 4px` (`css/style.css:295`), 「設為主隊」padding `3px 8px` (`css/style.css:1377`), standings cells padding `6px` (`css/style.css:1299`), sliders `height: 28px` (`css/style.css:977`).
- AH split pills and form pills use `title=` only (`js/app.js:607-611`, `js/app.js:1302`). iPhone Safari does not open `title` on tap, so 贏/贏半/走/輸半/輸 never get an explanation. The ⓘ sheets themselves are fine.
- At `max-width: 400px` the heatmap glyphs are forced to 8px (`css/style.css:1694-1698`). Power ratings are four columns (`css/style.css:1392`) and the efficiency stats are three (`css/style.css:1102`) with 9–10px labels. The header is a nowrap flex row (logo + 「數據截至: YYYY-MM-DD」 + 38px gear) inside `body { overflow-x: hidden }` (`css/style.css:55`), so anything that does not fit is clipped rather than scrolled. Inner scroll on the AH table and the standings is the right pattern; the header is not in one.
- `index.html:5` sets `maximum-scale=1, user-scalable=no`, which blocks the pinch a user would need for 8px type.
- Fix: min-height/min-width 44px on chips, gear, swap, ⓘ, O/U chips, sheet close, team buttons, and standings rows. Replace `title` with a tap popover (the same bottom sheet you already use). Allow the header to wrap. Drop `user-scalable=no`. Bump the 390px heatmap type to ≥11px.

### 17. MAJOR — User-facing copy is formal written Chinese, not written Cantonese

- Hard rule: all UI text in written Cantonese, Traditional Chinese. Character set is clean (see the header). The register is not. Particles 嘅 / 點解 / 偷睇 appear a handful of times; most labels are Mandarin or literary Chinese.
- Concrete errors: `index.html:302` 「頂尖職業注碼」— 注碼 is the stake, not the bettor; write 「職業投注嘅人」. `index.html:266` 「模型事後驗證」. `index.html:451-453` 「過往回測表現不代表未來收益保證…請始終遵循…切勿過度投注」— write something like 「舊績唔代表之後都會贏。樣本少，隨機性大，注碼要守住。」 `js/app.js:795` 「暫無比賽數據」→「未有賽事」. `js/app.js:1301` 勝/負 where the spec requires 贏/輸. Other lines to rewrite in the same pass: 「查看詳情」「儲存並套用」「偏好與模型設定」「當模型邊緣大於此數值」「注碼保守縮放系數」「嚴謹步進回測引擎」.
- Fix: one pass over `index.html` and the strings in `js/app.js`. Keep the betting terms the spec lists (上盤、下盤、贏半、輸半、走盤、大細波、值博、注碼).

### 18. MINOR — Bankroll chart is a single paint, and the axes are two captions

- File: `js/app.js:1098-1206`, canvas CSS `css/style.css:1214-1227` (the 700×300 buffer is scaled to the container, so it does not widen the page)
- Spec asks for an animated draw with axes and a zero line. The code strokes the polyline once. The dashed line is the 100u start, which is the right zero-profit line, labelled 「100u」. There is no axis line, no tick series, and no animation.
- Fix: `requestAnimationFrame` to grow the path, and two or three y ticks plus a real baseline labelled 「開波本金」.

### 19. MINOR — Backtest scorelines are truncated at 8, the lab uses 10

- File: `js/model.js:671` vs `js/app.js:304`
- Both matrices are renormalised, so a 9-0 tail is spread back over 0…8 in the backtest and over 0…10 in the lab. Edges and AH fair prices will not match the screen for high-λ games.
- Fix: use max goals 10 in `runBacktest` too.

### 20. MINOR — AH and O/U “CLV” de-vigs Bet365’s own close

- File: `js/model.js:711-713` and `js/model.js:733-735`. Sharp 1X2 correctly prefers PS then BFE then Avg (`build_data.py:193-196`).
- 2425/2526 files also have Pinnacle AH (`PCAHH`/`PCAHA`) and Pinnacle totals (`PC>2.5`/`PC<2.5`). They are not stored. AH/OU CLV therefore removes the margin from B365 close. A backtest that bets the close reports a negative average CLV equal to the vig (E0 2526 AH Kelly came out at −3.6%), which does not answer “did we beat a sharp close”.
- Fix: extend the match schema with sharp AH and sharp OU using the same PS → BFE → Avg order, and point `sharpClosingOdds` at those. Keep B365 vs B365 as a separate 「贏咗收市價」only when you mean that book.

### 21. MINOR — Missing open prices are replaced with the close, so the line never moved

- File: `build_data.py:187-191`, `build_data.py:206-209`, `build_data.py:221-224`
- If any leg of the open trio is empty, the whole open quote becomes the close quote (and the reverse). SP1 2526 has 4 matches with no AHh and 31 with neither PS nor BFE (those correctly fall through to Avg). Copied opens show up as 「平盤 / 盤口維持」and zero CLV.
- Fix: leave the missing side as null and let the UI print 「未有開盤」. Only fall back when you are displaying a single pre-match price for a fixture.

### 22. MINOR — Favicon files are unused, and zoom is locked

- File: `index.html:5` and `index.html:8`. `favicon.ico` and `favicon.svg` exist and are not referenced. The tab icon is an inline emoji data URI.
- Fix: `<link rel="icon" href="favicon.svg">` (relative, so GitHub Pages works) and remove `user-scalable=no` / `maximum-scale=1`.

### 23. MINOR — Small spec mismatches

- Bottom nav says 「策略回測」and 「球隊戰力」(`index.html:514`, `index.html:518`); spec names are 「回測」and 「球隊」. The fixture strip says 「本週即將開賽」rather than 「本週賽事」.
- Heatmap detail opens on 1-0 (`js/app.js:18` and `js/app.js:461`) while the highlighted cell is the mode. Initialise `selectedScore` from `deriveMostLikelyScores`.
- `generatedAt` is the literal `"2026-10-25 01:15:00"` (`build_data.py:289`), not the clock time of the build.
- Tabular figures are opt-in via a class list (`css/style.css:66-69`). The 1X2 and AH prices are plain `<strong>` and will not line up.
- `tests/model.test.js` never builds a fixture where decay, `asOfDate`, AH Kelly’s line, or rating spread can fail, which is why issues 1–4 stay green. Add one regression each: half-life changes λ; a same-day 15-0 does not; AH Kelly on −2 @ 2.03 is ≤ 0 for the Arsenal–Coventry matrix; α+β ranks 曼城/阿仙奴 above 葉士域治.

## Suggested fix order

1. AH Kelly line (issue 1) and the O/U listener leak (issue 5). Both are user-visible and wrong on the default screen.
2. Fit: decay anchor (issue 2) and L2 scale (issue 3), then re-rank by α+β (issue 4). Re-price Arsenal–Coventry before touching anything else.
3. Settings/localStorage and Kelly prefill (issues 8, 9), then the backtest season filter, stake floor, and multi-league curve (issues 11, 12, 10).
4. Movement tab, de-vigged book probability, fixture date filter, team-card splits, 44px targets, Cantonese pass.
