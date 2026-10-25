# Odds Lab v4 — 澳門盤值博 (2026-10-25)

Live: https://penny323mo.github.io/odds-lab/

## What's in it
- Macau Slot public odds (1X2 / Asian handicap / over-under) for the top 5 leagues plus UCL/UEL/UECL, next 3 days. Fetched 4 times a day by GitHub Actions (cron 00/06/12/18 UTC = 08/14/20/02 Macau time).
- The Odds API (h2h + totals, eu region): at most once per UTC day, guarded by a committed state file, aborts if fewer than 40 credits remain.
- football-data.co.uk: Pinnacle/Bet365 reference prices, including Asian handicap interpolated to Macau's quarter lines.
- Consensus: each bookmaker's margin removed; Pinnacle used as the anchor when present, otherwise the median. Blended 0.7 consensus + 0.3 Dixon-Coles (Dixon-Coles weight drops toward 0 when a team has fewer than 20 top-flight matches).
- Classification of every Macau price: 值博 EV>+3% / 一般 / 唔值博 <-3%. Clamped or extreme EVs are labelled 數據不足.
- Bookmaker comparison, line movement from snapshots (pruned at 14 days), and record tracking (closing price frozen at kickoff, CLV, 1u flat settlement).
- Schema check: on failure the last good data is kept, data/health.json is set to error, and a single de-duplicated `data-alert` issue is opened.
- UI: Traditional Chinese, 390px mobile-first, with a 「點樣計」 explainer and the disclaimer 只供參考，唔保證贏錢.

## Process
agy built it in 3 rounds (R1 build, R2 and R3 fixes) and grok reviewed twice (reviews/grok-v4-r1.md, grok-v4-r2.md). R3 fixed grok's R2 findings. grok has not re-reviewed R3.

## Verification
- Tests: python tests/test_v4.py OK; node --test 27/27 pass.
- The GitHub Actions run (40200399259) fetched Macau Slot from GitHub's IPs: 153 events, 18 in scope.
- Screenshots: screenshots/v4/r3-*.png.

## Credits
16 of 500 used (484 remaining). About 16 per day would come to roughly 480 a month, which is right at the limit. Sports with no data are free.

## Limits
- After R3: 5 value prices, all Asian handicap; 0 in 1X2 (Macau's 1X2 margin is about 11%). AH value of +5–10% is still optimistic, since the sharp line is interpolated. Treat it as reference only.
- The Odds API eu region doesn't always include Pinnacle. football-data only covers weekends.
- Macau Slot is an unofficial endpoint and may change; the schema-check alert covers that.
- The record tracker has only just started, so the track record is empty for now.
- Not tested on a real iPhone.
