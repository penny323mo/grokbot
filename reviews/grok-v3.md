# Odds Lab v3 — grok review

Reviewed against `SPEC.md` and `prompts/round-2-agy-v3.txt`. Did not modify any project file. Did not launch a browser. `node --test tests/` → **16/16 pass**. `data/data.js` inspected via Node (`generatedAt` present, `dataThrough` 2026-10-21, seasons **only** 2526/2627, 310 KB, current squads 20/20/20/18/18).

**Sound, so not listed as issues:** Dixon–Coles τ on (0,0)/(0,1)/(1,0)/(1,1) with ρ = −0.05; score matrix renormalised to 1; 1X2/OU/BTTS derived from it; quarter-line `settleAH` split-stake (incl. `settleAH(1, −0.75, 1.90) = 1.45`); fair AH prices have EV ≈ 0; binary Kelly p=0.55 @ 2.00 → 0.10; proportional + power de-vig sum to 1; CLV = taken / closing-fair − 1; `fitDixonColes` drops `mDate >= asOfDate` (same-day 15–0 does not leak); time decay now always anchored (`anchorDate` / max date); ridge is a pseudo-count (`tau=8`) and 淨評分 is α+β; Arsenal vs Coventry λ ≈ 2.34/0.62, fair 1.32/6.01/13.01 (market 1.20/7/13) — r1’s collapsed ratings are gone; `build_data.py` B365 open/close, AHh/AHCh as home handicap, PS→BFE→AvgC for 2627 (Arsenal 3–0 Coventry sharp 1.23/7.4/18 = BFECH); dates dd/mm/yyyy → ISO; fixtures prefer B365C* then B365* (fixtures.csv has empty closing columns, so opening *is* latest pre-match); UK→Macau via `Europe/London` + `Asia/Macau` (BST +7h, GMT +8h, 2026-10-25 14:00 → 22:00); client `filterFixturesInWindow` 72h; `generatedAt` shown as 「數據更新於 …（澳門時間）」; `fetch_data.sh` UA + curl retries + empty/HTML guards; 2526/2627 only in SEASONS, backtest pickers, tests, raw/; team names 馬拉加/拉科魯尼亞/侯城/勒芒/艾華斯堡/高雲地利/柏達邦/桑坦德競賽; no Simplified in `index.html` / `js/` / `css/`; r1 AH-Kelly-on-level-ball, half-life-noop, OU listener leak, settings-not-applied, and 值博 de-vig row are fixed.

The live-fixtures home page, 3-day filter, and math core are in good shape. Two v3-path bugs still make the product unsafe to ship: the backtest numbers the user sees after clicking 跑回測, and the GitHub Action that is supposed to refresh Pages.

---

1. **CRITICAL — Backtest UI restakes every bet with lookahead Kelly and binary AH settlement.** `js/app.js:1671-1728` (called from `runCurrentBacktest` for *every* league choice, including 「當前所選聯賽」).

   `runBacktest` is always invoked with `staking: 'flat'`. Bets are then replayed. For Kelly, `prob = (b.profit > 0 ? (b.payout / odds) : 0.35)`. A won 1u bet has `payout/odds ≈ 1`, so Kelly sees p = 1 and loads the cap; a loser is sized at a dummy 0.35. That uses the **result** to size the stake. `betRecords` (`js/model.js:885-897`) never stores `modelProb`, which is why the UI path invented this.

   The same loop does `payout = isWin ? stake * b.odds : 0` with `isWin = b.profit > 0`. AH half-win (e.g. Crystal Palace 1–1, 客隊 +0.25, stored payout 1.415) is paid as a full win at 1.83; a push (profit 0) is a full loss. Per-league table still shows the flat `res`, so headline ROI and the breakdown disagree when Kelly is on.

   **Fix:** Persist `modelProb` / `ahProbs` / `ahLine` / `selectionIdx` on each bet. Size Kelly from those, not from `b.profit`. Settle with `settleAH` (or reuse `b.payout/b.stake` as a multiplier). For a single league, display `runBacktest`’s own curve when staking is flat; only merge-sort dates for 「全部五大聯賽」. Add a test that a known AH half-win does not become a full win in the UI aggregate.

2. **CRITICAL — `update-data.yml` commits on a detached HEAD, so `git push` will fail and Pages never refreshes.** `.github/workflows/update-data.yml:39-56`.

   `actions/checkout@v4` leaves `HEAD` detached at the SHA. `git commit` works; `git push` with no ref is `fatal: You are not currently on a branch`. Cron, `contents: write`, `pages: write`, test-before-commit, and `gh api …/pages/builds` are otherwise right; the push never lands, so the Pages workaround never runs.

   **Fix:**
   ```bash
   git push origin HEAD:${{ github.ref_name }}
   ```
   (or `git checkout ${{ github.ref_name }}` before commit). Keep the `gh api` Pages call after a successful push. Optionally `persist-credentials: true` (already the default).

3. **MAJOR — 盤口走勢 CLV is still “bet this team at the open”, not the model’s side.** `js/app.js:1484-1489` (sparkline/model row at 1472-1482 is new and good).

   Spec: last ~10 matches with walk-forward pre-match probability **and CLV of a hypothetical bet on the model’s side**. The card shows Arsenal’s (or whoever’s) own 1X2 open vs sharp close (`selIdx` 0 or 2). If the model preferred the draw or the other side, the CLV pill is a different bet. Margin method is now threaded; the selection is not.

   **Fix:** From the walk-forward 1X2 (or AH) pick the side with the highest pre-match edge vs the open book, compute `calcCLV` on that index, and label it 「模型方向 CLV」.

4. **MAJOR — Dropping 2425 makes every 2526 club look promoted during walk-forward.** `js/model.js:497-524, 539-551`.

   Cutoff is `2026-08-01` or `2025-08-01` depending on `asOfTime`. With no 2425 files, **no match exists before 2025-08-01**, so for every 2526 `asOfDate` `pastSeasonMatches[i] === 0` and every team gets prior α=−0.22, β=−0.20. Recenter of “established” α is skipped (`countEst === 0`). Relative ratings still move with the 2526 results, but early-season 2526 backtest is over-shrunk. 2627 identification of Coventry-style promotions is fine (they have no 2526 row).

   **Fix:** Treat “has any match with `season < current season` in the dataset” as established, or set cutoff to the first date of the *previous season present* (min 2526 date when asOf is in 2627; no promoted prior when asOf is inside the oldest season).

5. **MAJOR — Several iPhone tap targets are still under 44px.** `css/style.css:1033-1037` (`.inline-select` min-height 32px — the only team control on 走勢); `css/style.css:890` (`.chip-sm` O/U 1.5/2.5/3.5); split-pills and sheet ✕ remain padding-only. League chips, gear, nav, and primary buttons were lifted to 44–48px.

   **Fix:** `.inline-select`, `.chip-sm`, `.close-sheet-btn`, `.split-pill` → `min-height: 44px` (split-pills can wrap).

6. **MINOR — `scripts/fetch_data.sh` retries are linear, not exponential.** `scripts/fetch_data.sh:18`. `curl --retry 3 --retry-delay 2` is four attempts, 2s apart. v3 prompt asked for retries (satisfied); `CHANGELOG.md` / `reviews/agy-v3.md` claim 指數退避. Add `--retry-all-errors` and `--retry-max-time` if football-data.co.uk flaps; optional `--retry-delay` growth via a small loop.

7. **MINOR — `raw/` is committed and not gitignored.** `.gitignore` only has `reviews/*.log`, `node_modules/`, `__pycache__/`. v3 said keep `raw/` in `.gitignore` if the workflow downloads fresh. SPEC allows committing CSVs. Harmless for the site, but the Action dirties `raw/*.csv` and only stages `data/data.js` — fine on a fresh checkout, noisy on a reused runner cache.

   **Fix:** add `raw/` to `.gitignore` *or* commit the CSVs on purpose and document that in README.

8. **MINOR — 對賽「本週賽事」 is not client-filtered.** `js/app.js:778-808`. Home tab uses `filterFixturesInWindow` (72h, hide kicked-off). The match-lab strip lists every `league.fixtures` row, including 2026-10-24 12:30 games that the build window kept as slack (`build_data.py:250-261`, today−1…today+5). Deep-dive from 實盤 is correct; scrolling 本週賽事 can load a match that already kicked off.

   **Fix:** run the same 72h filter (or at least `kickoff > now`) before rendering the strip.

9. **MINOR — `switchToMatchLab` does not set `selectedFixtureIdx` before painting 本週賽事.** `js/app.js:743-775`. Odds are recovered later by `getActiveFixture` team-id search (`js/app.js:178-198`), so the lab is right; the strip highlight can stay on the previous league’s index. Call `getActiveFixture()` (or search) before `renderFixturesList`.

10. **MINOR — Movement implied-prob sparkline uses raw 1/odds, not de-vigged probability.** `js/app.js:1496-1498`. Open vs close 1X2 for one side does not sum to 1, so the bar is “price”, not probability. Pass `[H,D,A]` through `removeMargin(..., settings.marginMethod)` and plot that side’s fair p.

11. **MINOR — `console.warn` on localStorage quota / parse failure.** `js/app.js:81, 89`. SPEC wants 0 console warnings. Swallow or surface in the settings sheet.

12. **MINOR — Tests never exercise `app.js` restake, the workflow, or `fetch_data.sh`.** `tests/model.test.js` covers convertUKToMacau / 72h / no-leak fit. Add a Node test that `runBacktest` AH records keep a half-win multiplier, and that a toy UI aggregate using those records must not pay `odds` in full. The workflow needs a `git push` dry-run comment or `push: false` + `HEAD:$ref` already in the YAML.

---

### v3 checklist

| Item | Status |
| :--- | :--- |
| Only 2526 + 2627 | Pass (`SEASONS`, tests, no `raw/*_2425.csv`) |
| Home = 未來三日實盤 | Pass (default tab, date groups, Kelly/AH copy, empty state) |
| Build window + client 72h | Pass (slack today−1…+5; `filterFixturesInWindow`) |
| UK → Macau incl. 25 Oct 2026 | Pass (test 14:00 → 22:00 GMT) |
| `generatedAt` display | Pass |
| `scripts/fetch_data.sh` | Pass (UA, retries, empty/CSV/HTML checks); exponential claim is overstated |
| `update-data.yml` permissions, tests-before-commit, Pages API | Permissions/tests/Pages API pass; **push from detached HEAD fails** (CRITICAL 2) |
| Fixtures = latest pre-match | Pass (C* then open; fixtures.csv has no closing quotes) |
| Cantonese / Traditional | Pass (natural 冇/聽日/值博/走盤; no Simplified in UI) |

VERDICT: NEEDS_FIXES
