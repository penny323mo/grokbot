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
