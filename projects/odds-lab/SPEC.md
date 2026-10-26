# 盤口實驗室 (odds-lab) — SPEC

Nightly build 2026-10-25 (Asia/Macau). Audience: Penny, a football-odds enthusiast who reads Cantonese and uses an iPhone.
She loved a previous odds game and is interested in opening vs closing odds and Asian handicap (AH) lines.
Last night's project was criticised as "too toy-like" — this must feel like a polished, deep, PRO analytics tool.

## Hard constraints
- Static site, no server, no build step needed to run: `index.html` at repo root, works when served from GitHub Pages at `https://penny323mo.github.io/odds-lab/` (use RELATIVE paths only).
- No CDN dependencies. Plain ES modules or classic scripts. Charts drawn with canvas or inline SVG (no chart libs).
- ALL user-facing text in written Cantonese, Traditional Chinese (e.g. 「主隊」「客隊」「讓球」「上盤」「下盤」「贏半」「輸半」「走盤」「入球」「大細波」「兩隊入球」「公平賠率」「值博」「注碼」「資金曲線」). Team names in Cantonese via `team_names.py` mapping (HK media style); add missing ones: Malaga 馬拉加, La Coruna 拉科魯尼亞, Hull 侯城, Le Mans 勒芒, Elversberg 艾華斯堡, Coventry 高雲地利, Paderborn 柏達邦, Santander 桑坦德競賽.
- Mobile-first: perfect at 390x844 (iPhone). Large tap targets (>=44px). No hover-only interactions; tooltips open on tap. No horizontal page scroll (wide tables/heatmaps scroll inside their own container or are sized to fit).
- 0 console errors / warnings in Chrome.
- Dark sporty design: near-black background, pitch-green / neon accent, clean typography (system font stack incl. "PingFang HK", "Noto Sans TC"), tabular numbers for odds, smooth transitions between tabs, subtle card shadows. Should look like a premium betting analytics app, not a demo.

## Data (already downloaded into raw/ by the orchestrator — do not re-download unless missing)
Source: football-data.co.uk. Files: `raw/{E0,SP1,I1,D1,F1}_{2425,2526,2627}.csv` and `raw/fixtures.csv` (upcoming fixtures with pre-match odds, all leagues mixed; filter Div in E0/SP1/I1/D1/F1).
- IMPORTANT: today is 2026-10-25. The CURRENT season is **2026-27** (`2627`, ~6-9 rounds played so far). 2025-26 (`2526`) is complete; 2024-25 (`2425`) also available. Use all three for model fitting with time decay.
- Columns differ by season. 2627 & fixtures have NO Pinnacle (PS*) columns; 2425/2526 do. Use per match, with fallbacks:
  - 1X2 opening: B365H/D/A; closing: B365CH/CD/CA. Market average: AvgH/D/A, AvgCH/CD/CA. Sharp reference: PSCH/PSCD/PSCA if present, else BFECH/BFECD/BFECA (Betfair exchange), else AvgC*.
  - O/U 2.5: B365>2.5, B365<2.5, B365C>2.5, B365C<2.5 (+ Avg variants).
  - AH: opening line `AHh` with B365AHH/B365AHA (or AvgAHH/AvgAHA); closing line `AHCh` with B365CAHH/B365CAHA (or AvgCAHH/AvgCAHA). AHh is the handicap applied to the HOME team (e.g. -0.75 = home gives 0.75).
  - Files start with a UTF-8 BOM; dates are dd/mm/yyyy (some older may be dd/mm/yy).
- `build_data.py` (Python 3, stdlib only) reads raw/ and writes `data/data.js` (assigns `window.ODDS_DATA = {...}`) — compact arrays, include a schema list, per-league teams, matches (date, home, away, FTHG, FTAG, HTHG, HTAG, open/close 1X2, open/close OU2.5, open/close AH line + prices, sharp closing 1X2), upcoming fixtures with their odds, and generated-at timestamp + data-through date. Keep the file reasonably small (< ~1.5 MB). A previous project's script at `/workspace/nightly/2026-10-23-beat-the-bookie/build_data.py` can be used as reference.
- Only teams in the 2026-27 season of a league appear in team pickers.

## Math core — `js/model.js` (pure functions, must work in both browser and Node for tests)
1. Odds helpers: decimal odds → implied prob; overround; remove margin (proportional AND power/Shin-lite method — at least proportional + one other); fair odds = 1/p.
2. Team strength model: Dixon–Coles (or Poisson with home advantage + DC low-score tau correction, rho fitted or fixed ~ -0.05) with exponential time-decay weighting (half-life ~ 180 days, configurable), fitted per league by maximum likelihood (iterative / gradient or the standard iterative scaling for Poisson). Promoted teams with few matches must still get sane ratings (shrink to league average / prior). Fitting must be fast in browser (< ~1s per league) OR be precomputed — either is fine, but the backtest must use only information available BEFORE each match (walk-forward, refit e.g. weekly or every N matches; can be precomputed in Python if browser is too slow — if so, document).
3. Score matrix 0..10 internally (display 0..6), normalised to sum 1. Derive: 1X2, Over/Under 0.5…4.5 (at least 2.5 shown), BTTS yes/no, most likely scores, expected goals each side.
4. Asian handicap: for any line in quarter steps (−3 … +3), compute probability of full win / half win / push / half loss / full loss for home and away from the score matrix, the expected value at given odds, and the FAIR price (odds where EV = 0). Quarter lines (e.g. −0.75) are split stakes: half on −0.5, half on −1. Also find the model's "fair AH line" (line where home and away fair prices are closest to equal).
5. Settlement function `settleAH(goalDiffHome, line)` → return multiplier result per unit stake for given odds (win/half-win/push/half-loss/loss), handles quarter lines.
6. Kelly: full Kelly fraction f* = (bp − q)/b for decimal odds; fractional Kelly; clamp to [0, cap]; Kelly also for AH with half-win/half-loss outcomes (numerical maximisation of expected log growth is fine).
7. CLV: closing line value = (taken odds / closing fair odds) − 1, using sharp closing with margin removed.

## UI — single page, bottom tab bar (4 tabs) with smooth transitions
Header: 「盤口實驗室」 logo + small subtitle 「足球模型 × 盤口分析」, data-through date.
League chips: 英超 / 西甲 / 意甲 / 德甲 / 法甲 (horizontally scrollable chip row).

### Tab 1 「對賽分析」 (Match lab) — default
- Pick home & away team (big tappable selectors / bottom-sheet list with team names, NOT tiny native selects only). Also a row 「本週賽事」 listing upcoming fixtures for that league from fixtures.csv — tap one to load it (default-load the first upcoming fixture so the page is never empty).
- Show: expected goals (λ home, λ away), 1X2 probability bars + fair odds; if bookmaker odds exist for that fixture, show them alongside with margin-removed implied prob, model edge %, and a glowing 「值博」 badge when edge > threshold (default 3%, adjustable in settings).
- Score heatmap 7×7 (0–6) with percentages, colour scale, highlight most likely score; tap a cell to see its probability and fair odds.
- O/U 2.5 (and a small selector for 1.5/2.5/3.5), BTTS yes/no fair odds.
- Asian handicap table: lines −2 … +2 in 0.25 steps (scrollable), each row: 主隊 fair price, 客隊 fair price, and breakdown (贏 / 贏半 / 走盤 / 輸半 / 輸 %). Highlight the model's fair line and the bookmaker's line (if fixture odds available). Info button (ⓘ) explaining quarter lines in Cantonese, e.g. 「-0.75（讓半一）= 一半注碼落 -0.5，一半落 -1；淨贏一球就贏半…」.
- Kelly calculator card: choose a market/selection (1X2, O/U, AH), input odds (prefilled from bookmaker), bankroll, fractional Kelly slider (0.1–1.0, default 0.25) → recommended stake, EV %. Persist bankroll & settings in localStorage.

### Tab 2 「盤口走勢」 (Market / line movement)
- For the selected team(s): last ~10 matches with opening vs closing 1X2 odds and AH line (AHh → AHCh), arrows showing movement (drifted / shortened), the model's pre-match probability (walk-forward), and CLV of a hypothetical bet on the model's side. A small sparkline/bar chart of opening→closing implied probability.
- League-wide stats card: avg closing overround, % of matches where AH line moved, how often the side the line moved toward covered.
- ⓘ explanation of CLV in Cantonese: 「收市值（CLV）＝ 你買入嘅賠率同收市賠率比較；長期買得贏收市價，通常代表你搵到真正嘅值博…」.

### Tab 3 「回測」 (Backtest)
- Controls: league (or 全部五大聯賽), season (2025-26 full / 2026-27 to date), market (1X2 / AH / O/U 2.5), odds used (opening vs closing), edge threshold slider, staking (flat 1u vs fractional Kelly).
- Walk-forward: for each match only use data before that match date. Run fast (cache).
- Output: bankroll curve (canvas, with axes & zero line, animated draw), number of bets, hit rate, ROI, profit units, max drawdown, average CLV and % bets beating the close, per-league breakdown table. Explain in a short note that past results ≠ future and small samples.

### Tab 4 「球隊」 (Teams / form)
- Form cards for the league's teams (or selected two): last 5 results as W/D/L pills (Cantonese 贏/和/輸), goals for/against, attack & defence rating from the model, home/away splits, mini table position (compute standings of 2026-27 from results). Tap a team to set it as home/away in Tab 1.

### Settings (gear icon, bottom sheet)
Edge threshold, Kelly fraction, half-life, margin-removal method, reset. Persist in localStorage.

## Tests — `tests/*.test.js`, run with `node --test tests/` (no deps)
- Poisson/DC score matrix sums to 1 (±1e-9), probabilities non-negative, 1X2 sum to 1.
- AH settlement: lines 0, −0.25, −0.5, −0.75, −1, +0.25, +1.25 for various goal differences (incl. half-win/half-loss/push cases) with exact expected returns.
- AH probabilities from matrix: win+halfwin+push+halfloss+loss = 1; fair price makes EV ≈ 0.
- Kelly: known examples (e.g. p=0.55 @2.0 → 0.10), zero when no edge, fractional scaling.
- Implied prob with overround removal sums to 1; known example.
- CLV calc example.
- Data sanity: data/data.js loads in Node (vm), has 5 leagues, 2627 teams count 18/20 as expected, matches have valid scores.
- Backtest function runs on a small slice and returns finite numbers.

## Deliverables in repo root
index.html, css/style.css, js/*.js, data/data.js, build_data.py, team_names.py, tests/, README.md (Cantonese, how to rebuild data), favicon. Do NOT commit raw/*.csv? — raw CSVs may be committed (they are small) for reproducibility.
