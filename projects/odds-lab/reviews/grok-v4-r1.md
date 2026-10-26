# Odds Lab v4 — grok review (R1)

Reviewed against `prompts/v4-r1-agy.txt` and `git diff a8c8a45..HEAD`. Did not modify any project source. Did not print secrets. Did not git-commit.

**Tests (re-run this round):** `python3 tests/test_v4.py` → 8/8 OK. `node --test tests/` → 23/23 pass. Those suites do not cover tracker settlement, mapping collisions, credit-guard persistence, or snapshot keys.

**Data inspected:** `data/data.js` (`generatedAt` 2026-10-25T12:35:31Z, 26 Macau fixtures, 26/26 Odds-API pairs this window), `data/track_record.json` (24 bets, 12 marked settled), `data/snapshots/snapshot_2026-10-25_1235.json`, `data/unmatched.json` (`[]`), `data/odds_api_state.json` (remaining 484, used 16, `last_run_utc` 2026-10-25), `data/raw_samples/macau_sample.json`, `raw/*_2526.csv`.

---

## Sound (not listed as issues)

- Multiplicative de-vig (`p_i = (1/o_i) / Σ(1/o_j)`), power/Shin-lite solver, Poisson μ(Over 2.5=50%) ≈ 2.674, quarter O/U split 2.25 → (2.0, 2.5), `classify_ev` thresholds 值博 `> +3%` / 一般 `±3%` / 唔值博 `< −3%`.
- Macau parse: `fb_result` H/D/A and O/U; `hcap_disp` is the **home** line (`away_hcap_disp` is the inverse, e.g. `0/+0.5` vs `0/-0.5`); `parse_handicap("-0.5/-1") = -0.75`. Main line = closest to 1.90. EN market names `Win/Draw/Win` / `Asian Handicap` / `Over/Under` skip first-half under a different EN title. Filter top-5 + UCL/UEL/UECL, now−2h…+72h Macau, batches of 25, UA + XHR + Referer, exponential backoff.
- 1X2 fair = consensus 0.7 + Dixon-Coles 0.3, then `EV = fair_p * macau_odds − 1`. O/U at Macau’s exact line converts blended Over 2.5 via Poisson (including quarter `calc_ou_expected_return`).
- This window’s 26 Macau↔Odds-API pairs are the correct fixtures (kickoff Δt = 0h). Athletic/Brighton/PSG/Ath Bilbao aliases work.
- Odds API: `markets=h2h,totals`, `regions=eu`, decimal; `/v4/sports` first; abort remaining `< 40`; skip inactive keys; 8 soccer keys; used 16 ≈ 2 credits/sport. State file is in the v4 commit. Detached-HEAD push is `git push origin HEAD:${{ github.ref_name }}`. Cron `0 0,6,12,18`. `issues:write` + `data-alert` de-dup **if** status is ever `error`.
- UI chrome: `lang="zh-HK"`, disclaimer 「只供參考，唔保證贏錢，請量力而為，只限合法年齡人士。」, default tab 澳彩值博, 只睇值博 / 1X2/AH/OU filters, empty states, bottom nav 44–48px, `.chip-sm` / `.value-toggle-btn` / `.inline-select` min-height 44px. Snapshot screenshots live in `screenshots/v4/`.

The 1X2/O/U math core is usable. The **homepage 值博 signal, 戰績追蹤, sparklines, and CJK names** are not.

---

## P0

### 1. Track record settles upcoming matches against last season’s same pairing

`scripts/pipeline.py:351-352` keys finished games by `(HomeTeam, AwayTeam)` only — last CSV row wins, **no date**. `scripts/record_tracker.py:96-108` then settles any pending bet whose names substring-match that pair, **without checking kickoff vs now**.

Live `data/track_record.json` (first-detected 2026-10-25T12:35:38Z) already marks 12 future/this-weekend games `settled` using 2025/26 scores:

| Tracked kickoff | Pair | Stored score | Actual CSV source |
| :--- | :--- | :--- | :--- |
| 2026-10-28 Torino vs Como | AH A | 1-5 | `I1_2526.csv` 24/11/2025 |
| 2026-10-28 Sassuolo vs Lazio | OU Under | 1-0 | `I1_2526.csv` 14/09/2025 |
| 2026-10-26 Udinese vs AC Milan | AH H | 0-3 | `I1_2526.csv` 20/09/2025 |
| 2026-10-25 Liverpool vs Brighton | AH A | 2-0 | `E0_2526.csv` 13/12/2025 |
| 2026-10-25 Crystal Palace vs Newcastle | AH H | 2-1 | `E0_2526.csv` 12/04/2026 |
| 2026-10-26 Marseille vs Le Havre | OU Under | 6-2 | `F1_2526.csv` 18/10/2025 |

`fixtures.csv` has these same games with empty FTHG/FTAG (not yet played). Headline 勝率 50% / ROI +11.8% / +1.41u is fiction.

**Fix:** Key results by `(date_iso, home, away)`. Settle only when `kickoff < now` **and** the football-data date is the same calendar day as the bet (Macau date ± timezone slack). Ignore historical pairings from earlier seasons. Add a test: a 值博 bet dated 2026-10-28 must stay `pending` when the only CSV row is 2025-11-24.

### 2. Away Asian handicap is settled from the home side of the line

`scripts/record_tracker.py:126-129`:

```python
elif mkt == "AH":
    line = bet.get("line", 0.0)
    diff = fthg - ftag
    mult = settle_ah_single(diff, line, odds)  # home perspective always
```

`settle_ah_single` is documented home-perspective (`goal_diff + home_line`). Selection `"A"` is the away / 下盤. Away line is `−line`; away goal-diff is `ftag − fthg`.

Confirmed on the (wrong) Liverpool 2-0 Brighton row: market `AH` selection `A` line `−0.5`. Brighton 下盤 should lose. Tracker recorded `outcome=win`. Angers 2-0 Lorient, `AH A` line `+0.25` (away −0.25) also recorded `win`.

Nine of 18 AH tracked bets are selection `A`. Every one of those PnL numbers is inverted.

**Fix:**

```python
if sel == "A":
    mult = settle_ah_single(ftag - fthg, -float(line), odds)
else:
    mult = settle_ah_single(fthg - ftag, float(line), odds)
```

Test: home 2-0, line −0.5, sel A @ 2.00 → multiplier 0 (loss), not 2.00.

### 3. AH「值博」is 100% Dixon-Coles (or a dummy 1.95), not 0.7 consensus + 0.3 DC

Spec: fair = consensus 0.7 + DC 0.3, then classify Macau 1X2 **and** AH at the exact Macau line. Odds API is fetched as `h2h,totals` only (no spreads), so there is no book AH consensus.

`scripts/pipeline.py:620-637`: if a DC matrix exists, AH fair/EV come **only** from `derive_ah_fair_from_matrix`; else `fair_ah_* = 1.95` and `ev = macau/1.95 − 1`. No blend with Pinnacle/median 1X2, no Poisson λ fitted to consensus, no football-data `AHh`/`PCAHH` sharp AH.

That is the default-tab spotlight. This build:

- Hull City vs Brentford AH H +0.75 → **EV +51.1%** (badge 值博)
- Toulouse vs Troyes AH H −1 → **+36.5%**
- Real Sociedad vs Levante AH H −1 → **+30.7%**
- Manchester Utd vs Bournemouth AH H −0.25 → **+24.4%**

Macau overround on those lines is ~5–6%. A 50% edge is the DC score matrix disagreeing with the market, not a Macau misprice. 18/24 tracked bets are AH. Cups (no DC model) would silently use 1.95.

1X2 and O/U **are** blended; AH is the market the UI pushes as 值博.

**Fix:** Build a consensus score matrix: fit λh, λa to consensus 1X2 + Over 2.5 (or use the DC matrix only as the 0.3 leg). `fair_ah = 0.7 * consensus_ah(line) + 0.3 * dc_ah(line)`. Fallback: football-data `PCAHH/PCAHA` / `B365AHH` at the nearest line, de-vigged. Never emit AH EV from a flat 1.95. Cap or hide AH badges when `|EV| > 15%` until the blend exists. Test: a balanced 1.90/1.90 Macau AH with DC λh≈λa must classify 一般, not 值博.

---

## P1

### 4. Every Macau team name is ASCII `?` — Traditional Chinese cards are unreadable

`data/data.js` `homeZh`/`awayZh` and `data/track_record.json` `home_zh` are literal `???` / `??` (byte `0x3f`, not U+FFFD). League labels from `COMPETITION_MAP` (英超/西甲) are real CJK, so this is the Macau payload, not a Python dump encoding bug.

`scripts/fetch_macau.py:18-23` headers have no `Accept-Language`. `130-131` take `translateName.homeTeam.ZHT` then `ZH` with **no** fallback to `team_names.get_team_cantonese(home_en)`.

`get_team_cantonese("Athletic Bilbao")` → `畢爾包`, `"Crystal Palace"` → `水晶宮`, `"Manchester Utd"` → `曼聯`. The UI (`js/app.js:640,645,925,1025`) prints `???` on 上盤/下盤, 莊家比較, and 戰績追蹤. `tests/v4.test.js:32` asserts `f0.homeZh` is truthy — `"???"` passes.

**Fix:** Send `Accept-Language: zh-HK,zh-TW,zh;q=0.9`. If `home_zh` has no CJK (`\u4e00-\u9fff`), replace with `get_team_cantonese(home_en)`. Assert in tests that `homeZh` matches `/[\u4e00-\u9fff]/`.

### 5. Snapshots collapse to one empty key — sparklines are dead

`scripts/snapshots_tracker.py:32-39` reads `match_key`, `league_code`, `home_en`, `odds_1x2`, `consensus_1x2`. Pipeline fixtures use camelCase `matchKey` / `league` / `home` and nest odds under `macau` / `consensus` (`scripts/pipeline.py:774-807`).

Committed snapshot:

```json
{"matches":{"None_None_None":{"macau_1x2":null,"macau_ah":null,"macau_ou":null,"consensus_1x2":null,"consensus_ou25":null}}}
```

All 26 cards have `sparkline: []`. 14-day prune by filename date is fine; the writer never stored a line.

**Fix:** `match_key = f["matchKey"]`; copy `f["macau"]["odds_1x2"]`, `main_ah`, `main_ou`, `f["consensus"]["fair_1x2"]`. Test that a snapshot file has 26 distinct keys and numeric 1X2.

### 6. Daily Odds-API guard cannot see today’s cache in Actions

`.github/workflows/update-data.yml:81-86` stages `data.js`, `health.json`, `track_record.json`, `odds_api_state.json`, `snapshots/`, `unmatched.json`. **`data/odds_api_cache.json` is not added.**

`scripts/fetch_odds_api.py:103-106`: skip fetch only if `last_run_utc == today` **and** `cached_data` is truthy. 00:00 UTC fetches, writes cache on the runner, commits **state** + `data.js`, not cache. 06/12/18 UTC check out **yesterday’s** committed cache, see `last_run_utc == today`, skip the API, and rebuild consensus from stale books.

Same-day later Macau refreshes therefore mix new Macau prices with old Pinnacle/median. Credit burn on the first run is fine; the guard’s purpose (serve **today’s** cache) is not.

**Fix:** `git add data/odds_api_cache.json`. Keep the UTC-day guard. Optionally treat missing/stale cache (`cached_events_count` mismatch or cache mtime before `last_run_timestamp`) as “must not skip”.

### 7. No schema-check, no last-good `data.js`, health never `error` so `data-alert` never opens

Spec: validate Macau + Odds API; on failure keep last good data; write `health.json`; workflow opens/updates one `data-alert` issue.

- `scripts/pipeline.py:272-290`: Macau exception sets overall status **`warning`**, then loads `raw_samples/macau_sample.json` `target_events` (list **before** markets — no 1X2/AH/OU).
- Odds API `error` / `quota_low` / `no_key` only flips the **source** field; overall `health.status` stays `healthy` if Macau succeeded (`pipeline.py:297-304`).
- `.github/workflows/update-data.yml:61-75` alerts only when `STATUS == error`.
- No JSON-schema of Macau `data.events[]` or Odds API `bookmakers[].markets[]` beyond “key exists”.

A dead Macau fetch serves unpriced events, keeps the site “系統正常”, and never files an issue.

**Fix:** On any source exception or schema miss, `health.status = "error"`, keep the previous `ODDS_DATA.macauFixtures` from `data/data.js`, and let the existing `gh issue` step run. Validate required fields (`ev_id`, `start_time`, `translateName.EN`, `rate`, `fb_result`, Odds API `home_team`/`commence_time`/`markets`). Tests should feed a truncated Macau payload and expect last-good fixtures + `status=error`.

### 8. CLV is never computed; formula does not freeze at kickoff

`scripts/record_tracker.py:91-94` sets

`clv = initial_macau_odds / closing_consensus_fair − 1`

only on the **update** path for already-pending bets. First ingest leaves `clv: 0.0`. Because P0-1 settles in the same run, every stored `clv` is 0 and `avg_clv` is 0.00.

Even after P0-1 is fixed: `closing_*` is rewritten every 6h until settle (not at kickoff), and the denominator is model fair odds, not closing Macau / closing de-vig book. Spec: after kickoff record closing Macau **and** consensus, then CLV.

Pending rows are included in `avg_clv` (`record_tracker.py:180-181`).

**Fix:** When `kickoff < now` and still pending, freeze `closing_macau_odds` / `closing_consensus_fair` once. `clv = initial_macau / closing_macau − 1` (same-side price) **or** `initial_macau / closing_fair − 1` documented as “beat the close vs fair”. Average CLV over settled bets only. Test a two-step update: first detect @ 2.10, later close @ 2.00 → CLV +5%.

### 9. `teams_match` treats Manchester City = Manchester United and Real Madrid = Real Sociedad

`team_names.py:431-438` strips `city`, `united`, `utd`, `madrid`, `germain`, … then `473` allows substring:

`n1 == n2 or n1 in n2 or n2 in n1`

So `normalize("Manchester City") = "manchester" = normalize("Manchester United")`. `Real Madrid` → `real`, which is a substring of `real sociedad`.

This window luckily had no dual-home collision inside ±3h, so `unmatched.json = []` is **not** proof the matcher is safe. City vs United on the same afternoon, or Sociedad home within 3h of a Real Madrid listing, will attach the wrong bookmakers to the Macau card (wrong consensus, wrong 值博).

**Fix:** Stop stripping identity tokens (`city`/`united`/`madrid`). Require equal normalized token sets (or alias-table / Cantonese equality). Ban substring unless one name is a registered alias of the other. Tests must include `teams_match("Man City", "Man United") is False` and `teams_match("Real Madrid", "Real Sociedad") is False`, plus the existing Brighton/PSG/Ath Bilbao positives.

---

## P2

### 10. Pinnacle-weighted consensus includes Pinnacle in the “other books” median

`scripts/pipeline.py:405-486`: every book’s de-vig 1X2, including Pinnacle, is appended to `all_1x2_probs`, then `0.6 * pin + 0.4 * median(all)`. Spec/agy text said 0.4 on the **rest**. Mild overweight. Collect non-Pinnacle probs for the median.

### 11. Power de-vig is implemented and unused

`math_engine.remove_margin_power` is never called from `pipeline.py` (only multiplicative). Spec allowed either; wire it as a documented option or drop the dead code from the “we de-vig both ways” claim.

### 12. 莊家比較 overround bars are hardcoded

`js/app.js:871-876`: Pinnacle 2.4% / Bet365 6.2% / EU 7.5% / Macau 10.9%. Live `booksList[].1x2.margin` and Macau `odds_1x2.margin` exist on every fixture. Average those.

### 13. League chips omit UCL / UEL / UECL

`index.html:60-66` only 全部+五大聯賽. Pipeline will ingest cups when Macau lists them; users cannot filter to 歐聯. Add three chips.

### 14. Leftover tap target `.secondary-btn` is 42px

`css/style.css:1233`. v4 primary chips/nav are 44px. Lift this to 44px for the old 對賽/設定 controls.

### 15. OU Kelly uses a fake probability

`scripts/pipeline.py:699`: `calc_kelly_stake(0.50 + 0.5 * best_ou_ev, sel_ou_odds)`. Pass the actual Poisson win/push mass, not `0.5 + 0.5 EV`.

### 16. `last_run_utc` is set even if every sport fetch throws

`scripts/fetch_odds_api.py:169-180`. A total failure still `status=success`, writes empty/partial cache, and blocks retries until tomorrow. Set `last_run_utc` only when `fetched_sports` is non-empty; otherwise `status=error` and keep the previous cache.

### 17. Bet ids use `home[:4]` / `away[:4]`

`scripts/pipeline.py:736`. `Manchester Utd` and `Manchester City` both become `Manc`. Use `ev_id` + market + selection.

### 18. Tests do not exercise the P0/P1 paths

No test for away-AH, kickoff-gated settlement, City/United non-match, snapshot keys, cache git-add, or CLV. The “Cantonese names” test accepts `???`. Green CI currently means “math helpers + file exists”.

### 19. Dixon-Coles ρ is applied in the matrix only (15 IRLS steps, ρ not in the likelihood)

Inherited from v3. Fine for 1X2 blend; it amplifies P0-3 AH EV. Fitting ρ (or documenting the fixed −0.05) belongs with the AH blend fix.

### 20. football-data sharp AH (`PCAHH` / `AHh`) is unused for live classification

`build_data.py` still parses PS/BFE/AvgC into historical `leagues[]`. v4 live AH ignores it. After P0-3, this is the cheapest consensus-AH proxy that does not cost Odds API credits.

---

## Checklist vs spec

| Item | Status |
| :--- | :--- |
| De-vig multiplicative / power | Multiplicative used; power dead (P2-11) |
| Pinnacle-weight else median | Present; Pinnacle double-counted (P2-10) |
| Fair = 0.7 consensus + 0.3 DC | 1X2 and O/U yes; **AH no** (P0-3) |
| AH quarter/half/whole settle + EV | Math helper correct; **tracker away inverted** (P0-2); EV not consensus |
| O/U line conversion | Pass (Poisson from blended O2.5) |
| EV badges 值博/一般/唔值博 | Thresholds correct; AH inputs are not |
| Macau H/D/A, home AH sign, `-0.5/-1` | Pass |
| Cross-source mapping | 26/26 this window; matcher City=United / Madrid=Sociedad (P1-9) |
| Odds API once/UTC day, abort `<40`, skip inactive | Logic yes; **cache not committed** (P1-6) |
| State file committed so Actions sees the guard | State yes, cache no |
| Schema-check + last-good + one `data-alert` | Missing (P1-7) |
| Snapshot prune 14d | Prune yes; writer stores nothing (P1-5) |
| Record CLV then 1u settle | **Settles the future with last year’s score** (P0-1); CLV all zero (P1-8) |
| UI 390px, zh-HK, disclaimer, 44px, empty states | Chrome pass; **team names `???`** (P1-4); leftover 42px (P2-14) |

VERDICT: **NEEDS_FIXES**

P0-1 and P0-2 make 戰績追蹤 unusable. P0-3 makes the default 值博 tab a Dixon-Coles-vs-Macau screen, not a consensus-EV screen. Fix those three, then P1-4/5/6/7/8/9, before another fetch is treated as a release.
