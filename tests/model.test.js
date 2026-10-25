const test = require('node:test');
const assert = require('node:assert');
const model = require('../js/model.js');

test('Poisson / Dixon-Coles score matrix sums to 1 (±1e-9), non-negative, 1X2 sums to 1', () => {
  const lambdas = [
    [1.5, 1.2],
    [2.8, 0.7],
    [0.9, 1.9],
    [3.1, 2.4]
  ];

  for (const [lh, la] of lambdas) {
    const matrix = model.calcScoreMatrix(lh, la, -0.05, 10);
    let sum = 0;
    for (let h = 0; h < matrix.length; h++) {
      for (let a = 0; a < matrix[h].length; a++) {
        const val = matrix[h][a];
        assert.ok(val >= 0, `Probability at ${h}-${a} should be >= 0, got ${val}`);
        sum += val;
      }
    }
    assert.ok(Math.abs(sum - 1.0) < 1e-9, `Matrix sum should be 1.0 ± 1e-9, got ${sum}`);

    const res1x2 = model.derive1X2(matrix);
    const sum1x2 = res1x2.home + res1x2.draw + res1x2.away;
    assert.ok(Math.abs(sum1x2 - 1.0) < 1e-9, `1X2 sum should be 1.0 ± 1e-9, got ${sum1x2}`);
    assert.ok(res1x2.home > 0 && res1x2.draw > 0 && res1x2.away > 0);
  }
});

test('Asian handicap settlement for lines 0, -0.25, -0.5, -0.75, -1, +0.25, +1.25 with exact expected returns', () => {
  const odds = 2.0;

  // Line 0 (Level ball / Draw no bet)
  // Win by 1 -> Full win (2.0)
  assert.strictEqual(model.settleAH(1, 0, odds), 2.0);
  // Draw (0) -> Push (1.0)
  assert.strictEqual(model.settleAH(0, 0, odds), 1.0);
  // Lose by 1 -> Full loss (0.0)
  assert.strictEqual(model.settleAH(-1, 0, odds), 0.0);

  // Line -0.25 (Give quarter / 讓平半)
  // Win by 1 -> Full win (2.0)
  assert.strictEqual(model.settleAH(1, -0.25, odds), 2.0);
  // Draw (0) -> Half loss (0.5)
  assert.strictEqual(model.settleAH(0, -0.25, odds), 0.5);
  // Lose by 1 -> Full loss (0.0)
  assert.strictEqual(model.settleAH(-1, -0.25, odds), 0.0);

  // Line -0.5 (Give half / 讓半球)
  // Win by 1 -> Full win (2.0)
  assert.strictEqual(model.settleAH(1, -0.5, odds), 2.0);
  // Draw (0) -> Full loss (0.0)
  assert.strictEqual(model.settleAH(0, -0.5, odds), 0.0);

  // Line -0.75 (Give half-one / 讓半一)
  // Win by 2 -> Full win (2.0)
  assert.strictEqual(model.settleAH(2, -0.75, odds), 2.0);
  // Win by 1 -> Half win (1.5 at odds 2.0)
  assert.strictEqual(model.settleAH(1, -0.75, odds), 1.5);
  // Draw (0) -> Full loss (0.0)
  assert.strictEqual(model.settleAH(0, -0.75, odds), 0.0);

  // Line -1.0 (Give one / 讓一球)
  // Win by 2 -> Full win (2.0)
  assert.strictEqual(model.settleAH(2, -1.0, odds), 2.0);
  // Win by 1 -> Push (1.0)
  assert.strictEqual(model.settleAH(1, -1.0, odds), 1.0);
  // Draw (0) -> Full loss (0.0)
  assert.strictEqual(model.settleAH(0, -1.0, odds), 0.0);

  // Line +0.25 (Receive quarter / 受讓平半)
  // Win by 1 -> Full win (2.0)
  assert.strictEqual(model.settleAH(1, 0.25, odds), 2.0);
  // Draw (0) -> Half win (1.5)
  assert.strictEqual(model.settleAH(0, 0.25, odds), 1.5);
  // Lose by 1 -> Full loss (0.0)
  assert.strictEqual(model.settleAH(-1, 0.25, odds), 0.0);

  // Line +1.25 (Receive 1.25 / 受讓一球球半)
  // Draw (0) -> Full win (2.0)
  assert.strictEqual(model.settleAH(0, 1.25, odds), 2.0);
  // Lose by 1 (-1) -> Half win (1.5)
  assert.strictEqual(model.settleAH(-1, 1.25, odds), 1.5);
  // Lose by 2 (-2) -> Full loss (0.0)
  assert.strictEqual(model.settleAH(-2, 1.25, odds), 0.0);

  // Also test with non-even odds, e.g. odds = 1.90
  // At -0.75, win by 1 gives 1 + (1.90 - 1)/2 = 1.45
  assert.strictEqual(model.settleAH(1, -0.75, 1.90), 1.45);
});

test('Asian handicap probabilities from matrix sum to 1 and fair price EV ≈ 0', () => {
  const matrix = model.calcScoreMatrix(1.7, 1.2, -0.05, 10);
  const testLines = [-1.5, -1.25, -1.0, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5];

  for (const line of testLines) {
    const ah = model.calcAHProbs(matrix, line);
    const sumHome = ah.home.win + ah.home.halfWin + ah.home.push + ah.home.halfLoss + ah.home.loss;
    assert.ok(Math.abs(sumHome - 1.0) < 1e-9, `AH home probs sum for line ${line} should be 1, got ${sumHome}`);

    const sumAway = ah.away.win + ah.away.halfWin + ah.away.push + ah.away.halfLoss + ah.away.loss;
    assert.ok(Math.abs(sumAway - 1.0) < 1e-9, `AH away probs sum for line ${line} should be 1, got ${sumAway}`);

    // Test that EV at fairHome is approximately 0
    if (ah.fairHome < 100) {
      const evH = ah.evHome(ah.fairHome);
      assert.ok(Math.abs(evH) < 1e-7, `EV at fairHome (${ah.fairHome}) should be ~0, got ${evH}`);
    }
    if (ah.fairAway < 100) {
      const evA = ah.evAway(ah.fairAway);
      assert.ok(Math.abs(evA) < 1e-7, `EV at fairAway (${ah.fairAway}) should be ~0, got ${evA}`);
    }
  }
});

test('Kelly criterion: known examples (p=0.55 @ 2.0 -> 0.10), zero when no edge, fractional scaling', () => {
  // Known example: p = 0.55, odds = 2.0 -> full Kelly = 0.10
  const k1 = model.calcKelly(0.55, 2.0, 1.0);
  assert.ok(Math.abs(k1.fullKelly - 0.10) < 1e-9, `Full Kelly should be 0.10, got ${k1.fullKelly}`);
  assert.ok(Math.abs(k1.fracKelly - 0.10) < 1e-9);

  // Fractional scaling: half Kelly (0.5) -> 0.05
  const kHalf = model.calcKelly(0.55, 2.0, 0.5);
  assert.ok(Math.abs(kHalf.fracKelly - 0.05) < 1e-9, `Half Kelly should be 0.05, got ${kHalf.fracKelly}`);

  // Quarter Kelly (0.25) -> 0.025
  const kQuarter = model.calcKelly(0.55, 2.0, 0.25);
  assert.ok(Math.abs(kQuarter.fracKelly - 0.025) < 1e-9, `Quarter Kelly should be 0.025, got ${kQuarter.fracKelly}`);

  // Zero when no edge: p = 0.50 @ 2.0 -> EV = 0 -> Kelly = 0
  const kZero = model.calcKelly(0.50, 2.0, 1.0);
  assert.strictEqual(kZero.fullKelly, 0);
  assert.strictEqual(kZero.fracKelly, 0);

  // Negative edge: p = 0.40 @ 2.0 -> Kelly = 0
  const kNeg = model.calcKelly(0.40, 2.0, 1.0);
  assert.strictEqual(kNeg.fullKelly, 0);
  assert.strictEqual(kNeg.fracKelly, 0);
});

test('Implied prob with overround removal sums to 1; known example', () => {
  // Test odds: 2.0, 3.5, 4.0
  const odds = [2.0, 3.5, 4.0];
  const overround = model.calcOverround(odds);
  assert.ok(overround > 1.0, `Overround should be > 1.0, got ${overround}`);

  // Proportional removal
  const pProp = model.removeMarginProportional(odds);
  const sumProp = pProp.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sumProp - 1.0) < 1e-9, `Proportional removal should sum to 1.0, got ${sumProp}`);

  // Power removal
  const pPower = model.removeMarginPower(odds);
  const sumPower = pPower.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sumPower - 1.0) < 1e-9, `Power removal should sum to 1.0, got ${sumPower}`);
});

test('CLV (Closing Line Value) calculation example', () => {
  // Example: takenOdds = 2.10, closing sharp odds [1.95, 3.50, 4.20]
  // With closing fair price for index 0 ~ 2.00, CLV should be positive (around +5%)
  const closingSharp = [1.95, 3.50, 4.20];
  const clv = model.calcCLV(2.10, closingSharp, 'proportional', 0);
  assert.ok(typeof clv === 'number');
  assert.ok(clv > 0, `CLV should be positive when taken 2.10 vs sharp 1.95, got ${clv}`);

  // Known exact calculation: if closing fair price is exactly 2.00, taken odds 2.10 -> CLV = 2.10/2.00 - 1 = +0.05
  const fairOdds2 = [2.0, 2.0]; // overround 1.0 -> fair prob is 0.5 -> fair odds 2.0
  const clvExact = model.calcCLV(2.10, fairOdds2, 'proportional', 0);
  assert.ok(Math.abs(clvExact - 0.05) < 1e-9, `CLV should be exactly 0.05, got ${clvExact}`);
});

test('Backtest function runs on a slice and returns finite numbers', () => {
  const d = require('../data/data.js');
  const league = d.leagues['E0'];
  const sliceMatches = league.matches.slice(0, 40);

  const res = model.runBacktest(sliceMatches, league.teams, {
    season: 'all',
    market: '1x2',
    oddsType: 'open',
    edgeThreshold: 0.02,
    staking: 'flat',
    initialBankroll: 100
  });

  assert.ok(Number.isFinite(res.totalBets), 'totalBets must be finite');
  assert.ok(Number.isFinite(res.hitRate), 'hitRate must be finite');
  assert.ok(Number.isFinite(res.roi), 'roi must be finite');
  assert.ok(Number.isFinite(res.profit), 'profit must be finite');
  assert.ok(Number.isFinite(res.maxDrawdown), 'maxDrawdown must be finite');
  assert.ok(Number.isFinite(res.avgCLV), 'avgCLV must be finite');
  assert.ok(Array.isArray(res.bankrollCurve), 'bankrollCurve must be array');
  assert.ok(res.bankrollCurve.length > 0, 'bankrollCurve must not be empty');
});

test('Regression: half-life changes λ when anchored even without asOfDate', () => {
  const d = require('../data/data.js');
  const e0 = d.leagues['E0'];
  const arsenal = e0.teams.find(t => t.name === 'Arsenal').id;
  const coventry = e0.teams.find(t => t.name === 'Coventry').id;

  const m30 = model.fitDixonColes(e0.matches, e0.teams.length, { halfLifeDays: 30 });
  const m180 = model.fitDixonColes(e0.matches, e0.teams.length, { halfLifeDays: 180 });

  const p30 = m30.predict(arsenal, coventry);
  const p180 = m180.predict(arsenal, coventry);

  assert.ok(
    Math.abs(p30.lambdaHome - p180.lambdaHome) > 0.05,
    `Half-life 30d vs 180d should move lambdaHome, got 30d=${p30.lambdaHome}, 180d=${p180.lambdaHome}`
  );
});

test('Regression: same-day or future matches (>= asOfDate) do not leak into walk-forward fit', () => {
  const d = require('../data/data.js');
  const e0 = d.leagues['E0'];
  const arsenal = e0.teams.find(t => t.name === 'Arsenal').id;
  const coventry = e0.teams.find(t => t.name === 'Coventry').id;

  const asOf = '2026-10-20';
  const baseModel = model.fitDixonColes(e0.matches, e0.teams.length, { asOfDate: asOf, iterations: 80 });
  const basePred = baseModel.predict(arsenal, coventry);

  // Clone matches and append a 15-0 match on the same date and one week later
  const leakedMatches = e0.matches.slice();
  const dummy1 = [asOf, arsenal, coventry, 15, 0, 8, 0, '2627'];
  const dummy2 = ['2026-10-27', arsenal, coventry, 15, 0, 8, 0, '2627'];
  leakedMatches.push(dummy1);
  leakedMatches.push(dummy2);

  const leakedModel = model.fitDixonColes(leakedMatches, e0.teams.length, { asOfDate: asOf, iterations: 80 });
  const leakedPred = leakedModel.predict(arsenal, coventry);

  assert.ok(
    Math.abs(basePred.lambdaHome - leakedPred.lambdaHome) < 1e-9,
    `Same-day and future matches must not alter fit: base=${basePred.lambdaHome}, leaked=${leakedPred.lambdaHome}`
  );
});

test('Regression: AH Kelly on line -2 @ 2.03 is 0 for Arsenal vs Coventry (EV <= 0)', () => {
  const d = require('../data/data.js');
  const e0 = d.leagues['E0'];
  const arsenal = e0.teams.find(t => t.name === 'Arsenal').id;
  const coventry = e0.teams.find(t => t.name === 'Coventry').id;

  const m = model.fitDixonColes(e0.matches, e0.teams.length, { halfLifeDays: 180 });
  const pred = m.predict(arsenal, coventry);
  const matrix = model.calcScoreMatrix(pred.lambdaHome, pred.lambdaAway, -0.05, 10);

  // Line -2.0 at odds 2.03
  const ahMinus2 = model.calcAHProbs(matrix, -2.0);
  const kellyMinus2 = model.calcAHKelly(ahMinus2.home, 2.03, 0.25);

  assert.ok(
    kellyMinus2.edge <= 0,
    `Arsenal -2.0 @ 2.03 should have non-positive edge, got ${kellyMinus2.edge}`
  );
  assert.strictEqual(
    kellyMinus2.fullKelly,
    0,
    `Arsenal -2.0 @ 2.03 should recommend 0 Kelly fraction, got ${kellyMinus2.fullKelly}`
  );
  assert.strictEqual(
    kellyMinus2.recommendedStake(10000),
    0,
    `Arsenal -2.0 @ 2.03 stake should be 0`
  );

  // In contrast, on level ball (line 0) at odds 2.03, Kelly is positive
  const ah0 = model.calcAHProbs(matrix, 0.0);
  const kelly0 = model.calcAHKelly(ah0.home, 2.03, 0.25);
  assert.ok(
    kelly0.fullKelly > 0.2,
    `Arsenal line 0 @ 2.03 should have high Kelly, got ${kelly0.fullKelly}`
  );
});

test('Regression: alpha + beta net rating ranks top teams (曼城/阿仙奴) far above bottom/promoted (葉士域治/高雲地利)', () => {
  const d = require('../data/data.js');
  const e0 = d.leagues['E0'];
  const m = model.fitDixonColes(e0.matches, e0.teams.length, { halfLifeDays: 180, iterations: 180 });

  const getNet = (zhName) => {
    const t = e0.teams.find(x => x.zh === zhName);
    assert.ok(t, `Team ${zhName} must exist`);
    return m.alpha[t.id] + m.beta[t.id];
  };

  const netArsenal = getNet('阿仙奴');
  const netManCity = getNet('曼城');
  const netIpswich = getNet('葉士域治');
  const netCoventry = getNet('高雲地利');

  assert.ok(netArsenal > 0.35, `Arsenal net rating should be > 0.35, got ${netArsenal}`);
  assert.ok(netManCity > 0.35, `Man City net rating should be > 0.35, got ${netManCity}`);
  assert.ok(netIpswich < 0, `Ipswich net rating should be negative, got ${netIpswich}`);
  assert.ok(netCoventry < 0, `Coventry net rating should be negative, got ${netCoventry}`);
  assert.ok(
    netArsenal - netIpswich > 0.5,
    `Gap between Arsenal and Ipswich should be > 0.5, got ${netArsenal - netIpswich}`
  );
});

test('Regression: Promoted teams prior prevents overrating (Alaves vs Malaga)', () => {
  const d = require('../data/data.js');
  const sp1 = d.leagues['SP1'];
  const m = model.fitDixonColes(sp1.matches, sp1.teams.length, { halfLifeDays: 180 });

  const alaves = sp1.teams.find(t => t.zh === '艾拉維斯').id;
  const malaga = sp1.teams.find(t => t.zh === '馬拉加').id;

  const pred = m.predict(alaves, malaga);
  const matrix = model.calcScoreMatrix(pred.lambdaHome, pred.lambdaAway, -0.05, 10);
  const m1x2 = model.derive1X2(matrix);

  // Market gave Malaga ~16% away win chance; old broken model gave 28%
  assert.ok(
    m1x2.away < 0.18,
    `Malaga away win probability against Alaves should be < 18%, got ${(m1x2.away * 100).toFixed(1)}%`
  );
  assert.ok(
    m1x2.fairAway > 5.5,
    `Malaga fair away odds should be > 5.5, got ${m1x2.fairAway.toFixed(2)}`
  );
});

test('UK to Macau time conversion handles BST (UTC+1) and GMT (UTC+0) properly', () => {
  // 1. Summer BST (British Summer Time = UTC+1; Macau = UTC+8 -> +7 hours difference)
  const summer = model.convertUKToMacau('2026-08-15', '15:00');
  assert.strictEqual(summer.macauDate, '2026-08-15');
  assert.strictEqual(summer.macauTime, '22:00');
  assert.strictEqual(summer.macauDisplay, '2026-08-15 22:00');

  // Evening kickoff in BST crosses midnight in Macau: 20:00 BST -> 03:00 (+1 day) in Macau
  const summerNight = model.convertUKToMacau('2026-08-15', '20:00');
  assert.strictEqual(summerNight.macauDate, '2026-08-16');
  assert.strictEqual(summerNight.macauTime, '03:00');

  // 2. Winter GMT (Greenwich Mean Time = UTC+0; Macau = UTC+8 -> +8 hours difference)
  const winter = model.convertUKToMacau('2026-12-15', '15:00');
  assert.strictEqual(winter.macauDate, '2026-12-15');
  assert.strictEqual(winter.macauTime, '23:00');
  assert.strictEqual(winter.macauDisplay, '2026-12-15 23:00');

  // 3. Fall transition day (Oct 25 2026: clocks go back 02:00 BST -> 01:00 GMT)
  // Afternoon 14:00 UK is on GMT (+8 to Macau)
  const transition = model.convertUKToMacau('2026-10-25', '14:00');
  assert.strictEqual(transition.macauDate, '2026-10-25');
  assert.strictEqual(transition.macauTime, '22:00');

  // 4. ISO UTC string formatted to Macau time
  const formatted = model.formatMacauDateTime('2026-10-25T03:22:00Z');
  assert.strictEqual(formatted, '2026-10-25 11:22');
});

test('3-day window fixture filter excludes past matches and matches beyond 72 hours', () => {
  // Reference now: 2026-10-25 03:00:00 UTC (11:00 AM Macau time)
  const refNow = new Date('2026-10-25T03:00:00Z');

  const testFixtures = [
    // 0: Yesterday (past)
    ['2026-10-24', '15:00', 0, 1],
    // 1: Earlier today, already kicked off (e.g. 02:00 UTC)
    ['2026-10-25', '02:00', 2, 3],
    // 2: Today afternoon (14:00 UK / 22:00 Macau) -> IN WINDOW
    ['2026-10-25', '14:00', 4, 5],
    // 3: Tomorrow (2026-10-26 19:30 UK / 2026-10-27 03:30 Macau) -> IN WINDOW
    ['2026-10-26', '19:30', 6, 7],
    // 4: Day 2 (2026-10-27 20:00 UK / 2026-10-28 04:00 Macau) -> IN WINDOW (within 72h)
    ['2026-10-27', '20:00', 8, 9],
    // 5: Beyond 72h (2026-10-29 15:00 UK) -> OUT OF WINDOW
    ['2026-10-29', '15:00', 10, 11]
  ];

  const inWindow = model.filterFixturesInWindow(testFixtures, refNow, 72);
  assert.strictEqual(inWindow.length, 3, `Expected exactly 3 fixtures in 72h window, got ${inWindow.length}`);

  // Confirm which fixtures were kept
  assert.deepStrictEqual(inWindow[0], testFixtures[2]);
  assert.deepStrictEqual(inWindow[1], testFixtures[3]);
  assert.deepStrictEqual(inWindow[2], testFixtures[4]);
});

test('Backtest AH records keep exact half-win and push payout multipliers without binary distortion', () => {
  // Test settleAH directly on known quarter-ball lines
  // Half-win: line -0.75, goal diff +1 (1-0 win), odds 1.90 -> 1.0 + 0.5 * (1.90 - 1) = 1.45
  const halfWinMult = model.settleAH(1, -0.75, 1.90);
  assert.strictEqual(halfWinMult, 1.45, `Expected half-win mult 1.45, got ${halfWinMult}`);

  // Push: line 0.0, goal diff 0 (1-1 draw), odds 1.90 -> 1.0 (stake returned)
  const pushMult = model.settleAH(0, 0.0, 1.90);
  assert.strictEqual(pushMult, 1.0, `Expected push mult 1.0, got ${pushMult}`);

  // Half-loss: line -0.25, goal diff 0 (1-1 draw), odds 1.90 -> 0.5 (half stake returned)
  const halfLossMult = model.settleAH(0, -0.25, 1.90);
  assert.strictEqual(halfLossMult, 0.5, `Expected half-loss mult 0.5, got ${halfLossMult}`);

  // Construct a controlled 1-match backtest to verify that runBacktest stores exact payoutMult
  // Match schema: [date, home, away, fthg, ftag, hthg, htag, season, o1x2_h, o1x2_d, o1x2_a, c1x2_h, c1x2_d, c1x2_a, o_ou_o, o_ou_u, c_ou_o, c_ou_u, o_ah_line, o_ah_h, o_ah_a, c_ah_line, c_ah_h, c_ah_a]
  // 1-0 match with line -0.75 @ 3.80 for home (so evHome is positive, picking Home)
  const syntheticMatches = [
    ['2025-09-01', 0, 1, 1, 0, 0, 0, '2526', 1.8, 3.5, 4.2, 1.8, 3.5, 4.2, 1.9, 1.9, 1.9, 1.9, -0.75, 3.80, 1.10, -0.75, 3.80, 1.10, 1.8, 3.5, 4.2, 1.9, 1.9, 3.80, 1.10]
  ];
  const teams = [{ id: 0, zh: '主隊' }, { id: 1, zh: '客隊' }];

  const res = model.runBacktest(syntheticMatches, teams, {
    season: '2526',
    market: 'ah',
    edgeThreshold: -0.99, // place bet regardless of model edge
    staking: 'flat',
    initialBankroll: 100
  });

  assert.strictEqual(res.bets.length, 1, 'Expected 1 bet placed');
  const b = res.bets[0];
  // Half-win on odds 3.80 gives mult: 1.0 + 0.5 * (3.80 - 1.0) = 2.4
  assert.strictEqual(b.payoutMult, 2.4, `Expected payoutMult 2.4 for half-win, got ${b.payoutMult}`);
  assert.strictEqual(b.payout, 2.4, `Expected payout 2.4 on 1u stake, got ${b.payout}`);
  assert.ok(Math.abs(b.profit - 1.4) < 1e-9, `Expected profit 1.4, got ${b.profit}`);

  // Replay test: verify that a toy aggregate replay sized at stake 10 yields 24.0 payout, NOT full win 38.0
  const toyStake = 10;
  const toyPayout = toyStake * b.payoutMult;
  assert.strictEqual(toyPayout, 24.0, `Replayed payout on stake 10 must be 24.0, got ${toyPayout}`);
});

test('Backtest bet records contain pre-match modelProb, isAHMarket, payoutMult for lookahead-free Kelly replay', () => {
  const d = require('../data/data.js');
  const e0 = d.leagues['E0'];
  const res = model.runBacktest(e0.matches.slice(0, 50), e0.teams, {
    season: '2526',
    market: '1x2',
    edgeThreshold: 0.02,
    staking: 'flat'
  });

  assert.ok(res.bets.length > 0, 'Should have placed some bets in 50 matches');
  for (const b of res.bets) {
    assert.strictEqual(typeof b.modelProb, 'number', 'modelProb must be a number');
    assert.ok(b.modelProb > 0 && b.modelProb < 1, 'modelProb must be a valid probability');
    assert.strictEqual(typeof b.isAHMarket, 'boolean', 'isAHMarket must be boolean');
    assert.strictEqual(typeof b.payoutMult, 'number', 'payoutMult must be a number');
    assert.ok(Number.isFinite(b.odds), 'odds must be finite');

    // Verify Kelly sizing calculation from pre-match modelProb produces valid stake without result lookahead
    const k = model.calcKelly(b.modelProb, b.odds, 0.25, 0.2);
    assert.ok(Number.isFinite(k.fracKelly), 'Kelly fraction must be finite');
    assert.ok(k.fracKelly >= 0, 'Kelly fraction must be non-negative');
  }
});

test('MAJOR 4 regression: 2526 teams start at league average (0.0), only true 2627 newcomers (Coventry/Malaga) get promoted prior', () => {
  const d = require('../data/data.js');
  const e0 = d.leagues['E0'];

  // 1. Walk-forward fit inside 2526 (asOfDate = 2025-10-15)
  // All teams present in 2526 must start at league average (0.0, 0.0); none are shrunk to -0.22
  const m2526 = model.fitDixonColes(e0.matches, e0.teams.length, {
    asOfDate: '2025-10-15',
    halfLifeDays: 180,
    iterations: 80
  });

  const arsenal = e0.teams.find(t => t.name === 'Arsenal').id;
  const manCity = e0.teams.find(t => t.name === 'Man City').id;

  // Established top teams should have healthy positive alpha inside 2526
  assert.ok(m2526.alpha[arsenal] > 0.1, `Arsenal alpha in 2526 should be positive, got ${m2526.alpha[arsenal]}`);
  assert.ok(m2526.alpha[manCity] > 0.1, `Man City alpha in 2526 should be positive, got ${m2526.alpha[manCity]}`);

  // 2. Fit in 2627 (present day 2026-10-25)
  // True newcomer Coventry (no matches in 2526) gets the negative promoted prior
  const m2627 = model.fitDixonColes(e0.matches, e0.teams.length, {
    halfLifeDays: 180,
    iterations: 120
  });

  const coventry = e0.teams.find(t => t.name === 'Coventry').id;
  const netArsenal = m2627.alpha[arsenal] + m2627.beta[arsenal];
  const netCoventry = m2627.alpha[coventry] + m2627.beta[coventry];

  assert.ok(netArsenal > 0.35, `Arsenal net rating should be > 0.35, got ${netArsenal}`);
  assert.ok(netCoventry < -0.15, `Coventry net rating should be negative (< -0.15), got ${netCoventry}`);
  assert.ok(netArsenal - netCoventry > 0.5, `Arsenal vs Coventry gap should be > 0.5, got ${netArsenal - netCoventry}`);
});
