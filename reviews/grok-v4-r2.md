# Odds Lab v4 — grok re-review (R2)

Reviewed against `reviews/grok-v4-r1.md` items 1–20, `reviews/agy-v4-r2.md`, and `git diff 5e641e3..HEAD`. Did not modify source. Did not print secrets. Did not git-commit.

**Tests (this round):** `python3 tests/test_v4.py` → 13/13 OK. `node --test tests/` → 25/25 pass.

**Data:** `generatedAt` 2026-10-25T13:29:42Z, 25 Macau fixtures (Athletic–Getafe has kicked off), Odds API remaining 484 / used 16 (cache reused). Screenshots `screenshots/v4/r2-01`…`r2-05` at 390px.

---

## Items 1–20 vs R1

| # | R1 item | Status | Evidence |
| :--- | :--- | :--- | :--- |
| 1 | Track record settles future games on last season’s pairing | **FIXED** | `pipeline.py:403-408` stores `{date,home,away,fthg,ftag}`. `record_tracker.py:191-222` refuses settle if `now < kickoff` or `|date Δ| > 1 day`. Live `track_record.json`: 16 pending, 0 settled. Tests `test_p0_1_*` + `v4.test.js` pending assertion. |
| 2 | Away AH settled from home side | **FIXED** | `record_tracker.py:243-248` `settle_ah_single(ftag-fthg, -line, odds)` for `sel=="A"`. `test_p0_2_*`: Liverpool 2-0, AH A −0.5 → loss −1u. |
| 3 | AH 值博 is 100% DC / dummy 1.95 | **PARTIAL** | Blend path is in (`fit_lambdas_from_consensus` + `blend_ah_distributions` 0.7/0.3, `pipeline.py:696-725`). R1’s +51% Hull / +36% Toulouse AH are gone (+9.5% / +5.5%). Dummy 1.95 removed. **But** `pipeline.py:744-746` still clamps AH EV to ±15% and still badges 值博 if raw > 3%; football-data sharp AH only applies when `abs(line) < 1e-4` (`:709`) so Macau quarters (`0/+0.5`, `+0.5/+1`, `−1/−1.5`) never ingest `PCAHH`. Test only covers 1.90/1.90 at line 0. |
| 4 | Team names ASCII `?` | **FIXED** | `fetch_macau.py:28` `Accept-Language: zh-HK,zh-TW,zh;q=0.9`; `:133-137` CJK check + `get_team_cantonese` fallback. 25/25 `homeZh`/`awayZh` have CJK and no `?`. Screenshots show 水晶宮/紐卡素/侯城/賓福特. `v4.test.js` CJK regex. |
| 5 | Snapshots `None_None_None` | **FIXED** | `snapshots_tracker.py:32-41` uses `matchKey` / `macau.odds_1x2` / `consensus.fair_1x2`. Latest snapshot 25 keys, sample `E0_Crystal Palace_Newcastle Utd` with numeric H=2.35. All cards `sparkline` length 1. |
| 6 | Odds API cache not in `git add` | **FIXED** | `update-data.yml:85` adds `data/odds_api_cache.json`. `git ls-files` tracks it. |
| 7 | No schema-check / last-good / health never `error` | **PARTIAL** | `validate_macau_response` / `validate_odds_api_response` exist; Macau exception sets `health.status=error`. Last-good `load_previous_fixtures_from_data_js` runs **only if** `processed_fixtures` is empty (`pipeline.py:953-956`). Macau fetch failure still loads `raw_samples` `target_events` (`:326-334`) which pass the weak schema (ids/names, no odds) and **overwrite** last-good. Odds API `status=error` is a **source warning**, not overall error (`:347-348`). Schema test still only checks `health.json` keys. |
| 8 | CLV never computed / not frozen | **FIXED** | Pre-kickoff updates closing; at kickoff `closing_frozen`. `clv = initial_macau/closing_macau − 1`, plus `clv_consensus`. `avg_clv` over settled only (`:300-302`). `test_p1_8_*` 2.10→2.00 = +5%. Live avg_clv 0 with 0 settled is correct. |
| 9 | Man City = Man United / Madrid = Sociedad | **FIXED** | Identity tokens no longer stripped; substring match removed (`team_names.py:433-479`). Tests assert City≠United, Madrid≠Sociedad; Brighton/PSG/Athletic still match. |
| 10 | Pinnacle counted in “other” median | **FIXED** | `other_1x2_probs` skips `b_key=="pinnacle"` (`pipeline.py:510-514, 557-565`). |
| 11 | Power de-vig unused | **PARTIAL** | `remove_margin(..., method=)` wrapper exists. Pipeline still calls only `remove_margin_multiplicative`. |
| 12 | Hardcoded compare-tab overround | **PARTIAL** | Live average for Macau (11.3%) and non-Pinnacle EU books (7.6%). Screenshot still shows **Bet365 6.2%** — the fallback — because `regions=eu` never returns `bet365` and `booksList[:8]` often drops `pinnacle` (9/25 cards include it). |
| 13 | League chips omit cups | **FIXED** | `index.html:66-68` 歐聯/歐霸/歐協聯. |
| 14 | `.secondary-btn` 42px | **FIXED** | `css/style.css:1233` `min-height: 44px`. |
| 15 | OU Kelly fake p | **FIXED** | `pipeline.py:813-829` uses Poisson over/under/push mass. |
| 16 | `last_run_utc` on total fetch failure | **FIXED** | `fetch_odds_api.py:173-190` sets `last_run_utc` only if `fetched_sports`; else `status=error` and keep cache. |
| 17 | Bet id `home[:4]` collision | **FIXED** | `pipeline.py:867` `{date}_{ev_id}_{market}_{selection}_{line}`. |
| 18 | Tests skip P0/P1 paths | **PARTIAL** | New tests cover 1, 2, 3 (toy), 4, 5, 8, 9. Still missing: truncated Macau → last-good `data.js`, cache-guard, sharp-AH line miss, 15% clamp. |
| 19 | DC ρ undocumented | **FIXED** | `math_engine.py:304-307` documents ρ = −0.05 as a fixed empirical constant. |
| 20 | football-data sharp AH unused | **PARTIAL** | `load_football_data_ah_fixtures` reads `PCAHH`/`B365AHH`. Merge requires **exact** line (`abs(diff) < 1e-4`). Macau’s main lines are mostly quarters, so Pinnacle AH almost never enters the 0.7 consensus leg. |

12 FIXED, 8 PARTIAL, 0 NOT FIXED. Agy’s “all 20 完美解決” overstates 3, 7, 11, 12, 18, 20.

---

## 值博 sanity (the R2 question)

Macau 1X2 overround on this build: **mean 11.31%** (min 10.9, max 11.9). AH juice ~4.3%, OU ~5.4%. UI badge **只睇值博 12** of 25 matches.

That is **12 matches whose best of 3 markets is EV > +3%**, not 12 prices. Under the hood there are **16 prices > +3%** (7 AH, 6 OU, 3 1X2) out of 175 sides. Counting is per-match OR, which inflates the headline. It is not a sign flip on `EV = fair_p * odds − 1` (arithmetic matches stored fair).

A book with 11% 1X2 juice vs a ~3% Pinnacle market should almost never show 1X2 值博. 12/25 is not a plausible Macau-misprice rate. Three mechanisms, not a wrong-side bug:

1. **0.3 Dixon-Coles on thin squads pulls 1X2 fair off Pinnacle** (Hull).
2. **AH fair is a Poisson matrix fitted to 1X2+O2.5**, not an AH market; losing side hits the ±15% clamp (`ev_a = −15.0` on Hull/Celta/PSG) while the other side stays 值博.
3. **OU conversion from Over 2.5 Poisson understates tail variance**, so Under 3.5 / 4.25 looks fat.

### Top 10 值博 prices

| Rank | Match | Mkt / sel | Macau | Fair odds (p) | EV | Judgement |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Hull City vs Brentford | 1X2 H | **4.70** | 3.95 (25.3%) | **+18.9%** | **Bug.** Pinnacle H = **5.07** (de-vig p_H ≈ 19.0%, overround 3.5%). EV vs Pinnacle = **−10.4%**. Macau is *shorter* than the sharp dog. Fair 25.3% is 0.3 DC on a 2627 promotee with no E0_2526 row (`xg 1.17/0.98`). Spotlight of 「只睇值博」. |
| 2 | Celta vs Betis | AH H 0/+0.5 | 1.94 | 1.75 (57%) | +10.5% | **Inflated AH.** 1X2 is 一般 (Macau H 2.78 vs Pin 3.23). Poisson-from-1X2 disagrees with Macau’s 0/+0.5; away side clamped −15%. |
| 3 | PSG vs Lyon | AH A −1/−1.5 | 2.02 | 1.84 (54%) | +9.6% | **Inflated AH.** 1X2 一般. Pin PSG 1.39 / Lyon 6.95. Home AH side clamped −15%. |
| 4 | Hull vs Brentford | AH H +0.5/+1 | 2.04 | 1.86 (54%) | +9.5% | Same Hull DC bias as #1; away clamped −15%. |
| 5 | PSG vs Lyon | OU Under 3.5 | 1.86 | 1.71 (58%) | +8.8% | **OU tail.** Pinnacle Under 3.5 = **1.91**. Macau 1.86 is *worse* than Pin, yet +8.8%. Fair 1.71 comes from converting consensus O2.5=63.6% through a Poisson, which overstates P(≤3). |
| 6 | Hull vs Brentford | 1X2 D | 4.20 | 3.90 (25.6%) | +7.6% | Same as #1 (DC). Pin draw 4.12 ≈ Macau 4.20, not +7.6%. |
| 7 | Atalanta vs Frosinone | OU Under 3.5 | 1.95 | 1.81 (55%) | +7.5% | OU tail on 3.5 (Frosinone newly up). |
| 8 | Liverpool vs Brighton | AH A −0.5 | 1.84 | 1.73 (58%) | +6.6% | More modest; still the Poisson-AH family. R1 had this at +25.6% — blend helped. |
| 9 | Hull vs Brentford | OU Under 2.75 | 1.96 | 1.85 (54%) | +6.2% | Third Hull 值博 on one match. |
| 10 | Toulouse vs Troyes | AH H −1 | 1.88 | 1.78 (56%) | +5.5% | Down from R1 +36.5%. Residual Poisson-AH. |

**#1 is the opposite of beating Pinnacle.** The 12-match filter is that card plus AH/OU Poisson leftovers. Not 12 genuine Macau edges.

---

## Screenshots `screenshots/v4/r2-*.png` (390px)

- **r2-01:** Default 澳彩值博. Traditional names (水晶宮 / 紐卡素), disclaimer, 25 場, 只睇值博 **12**, chips ≥44px, no `?`. Palace card 一般 +2.9% — honest.
- **r2-02:** Filter on. First card **侯城 值博 +18.9% @ 4.7** — the Pinnacle-contradicting spotlight.
- **r2-03:** Modal 水晶宮 vs 紐卡素, Macau juice 11.0%, 1xBet 3.04 highlighted. Pinnacle often missing from the 8-row table (`booksList[:8]`).
- **r2-04:** Macau 11.3% live; Bet365 stuck at fallback **6.2%**; 187 「破綻」 (every book >+4% vs model fair, dominated by Hull).
- **r2-05:** 戰績 all 進行中, CJK 拖連奴/科木, CLV +0.0% (first detect). Cross-season fake settlements are gone.

---

## Remaining findings

### P0 — 值博 vs Pinnacle is inverted on the headline dog

Hull 1X2 H: Macau 4.70, Pinnacle 5.07, UI fair 3.95, badge +18.9% 值博. EV vs Pinnacle de-vig is **−10.4%**. Cause: `fair = 0.7 consensus + 0.3 DC` with Hull’s DC prior from a handful of 2627 E0 games (not in E0_2526). The same 0.3 weight is appropriate for established clubs and toxic for promotees.

**Fix:** For 1X2, either (a) drop DC weight to 0 when the club has < N league games in the fitted sample, or (b) classify Macau vs **Pinnacle/consensus only** and show DC as a separate 「模型」 column. Never badge 值博 when `macau_odds < pinnacle_odds` on that side. Add a test: Pin 5.07 / Macau 4.70 / thin DC must not be 值博.

### P1 — ±15% AH clamp still emits 值博; sharp AH almost never used

`pipeline.py:744-746, 709`. If the Poisson-AH residual were still +51%, the UI would show **+15% 值博**, not hide it. Losing sides already sit on the −15% rail (Hull/Celta/PSG). Sharp `PCAHH` is skipped for every quarter line.

**Fix:** If `|raw EV| > 0.15`, badge 一般 and drop from track record (the R1 “hide” half). Match sharp AH to the nearest 0.25 line, or skip AH 值博 when no sharp line is within 0.25. Convert OU from the Macau line via the same μ but use a NegBin/Dixon-Coles total, not a 2.5-only Poisson, before tagging Under 3.5+.

### P1 — last-good `data.js` is dead if the sample schema-passes

`pipeline.py:326-334` + `:953-956`. A failed Macau fetch loads `target_events` without markets; `validate_macau_response` only requires `ev_id/start_time/home_en`. Those empty events become `processed_fixtures`, so last-good never runs, and Pages would show 25 nameless/priceless cards with `health=error` (issue would open — good — but the site is still blank odds).

**Fix:** Require `odds_1x2` or `main_ah` on ≥1 event. On schema/fetch error, skip sample, always restore previous `macauFixtures`. Test a truncated payload.

### P2 — `half_win` vs `half_won`

`record_tracker.py:254` sets `outcome="half_win"`; `:290` counts `outcome == "half_won"`. KPI 半贏 will stay 0 after the first real quarter-line settle. Align the string.

### P2 — `booksList[:8]` drops Pinnacle

`pipeline.py:944`. Palace/Hull tables are MyBookie/1xBet/Winamax. Force-include `pinnacle` then fill to 8. Compare-tab Pinnacle/Bet365 averages then become real.

### P2 — power de-vig still unused

Call `remove_margin(..., "power")` for two-way AH/OU, or stop advertising it.

---

## Checklist

| Spec item | R2 |
| :--- | :--- |
| AH 0.7 consensus + 0.3 DC | Architecture yes; sharp AH rarely joins; clamp still 值博 |
| Settle only on dated results | Pass |
| Away AH perspective | Pass |
| CJK names | Pass |
| Cache in Actions | Pass |
| Schema + last-good + data-alert | Error flag yes; last-good no |
| CLV freeze | Pass |
| City/United matcher | Pass |
| 值博 vs 11% Macau juice | **Fail** — 12/25, led by a −EV-vs-Pinnacle Hull 1X2 |

VERDICT: **NEEDS_FIXES**

R1 P0-1 and P0-2 are actually gone; CJK, snapshots, cache, and matcher are good. Do not ship while the default tab’s first 值博 card is Hull @ 4.70 against Pinnacle 5.07 labelled +18.9%.
