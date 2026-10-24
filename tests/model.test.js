/**
 * Unit tests for PenaltyMindModel
 * Run with: node tests/model.test.js
 */

const assert = require('assert');
const { PenaltyMindModel, ZONES, ZONE_LABELS } = require('../model.js');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

console.log('--- Running PenaltyMindModel Unit Tests ---\n');

test('Initial state: uniform-ish distribution and 0 predictability', () => {
  const model = new PenaltyMindModel();
  const pred = model.getProbabilities();

  // All 6 zones present
  assert.strictEqual(Object.keys(pred.probabilities).length, 6);
  
  // Sum of probabilities must be 1.0
  let sum = 0;
  for (const z of ZONES) {
    sum += pred.probabilities[z];
    // In empty state, prior is uniform 1/6
    assert(Math.abs(pred.probabilities[z] - 1 / 6) < 0.05, `Initial prob for ${z} should be ~1/6`);
  }
  assert(Math.abs(sum - 1.0) < 1e-6, 'Probabilities must sum to 1.0');

  // Predictability score must be null with fewer than 8 shots (insufficient data)
  assert.strictEqual(model.getPredictabilityScore(), null, 'Initial predictability score should be null (< 8 shots)');
  assert.strictEqual(model.getPredictabilityRating().tag, '數據不足');
  assert.strictEqual(model.totalShots, 0);
});

test('Learns repeated pattern: after 10x always "top-left" (TL), predicts TL with highest probability', () => {
  const model = new PenaltyMindModel();

  // Shoot TL 10 times
  for (let i = 0; i < 10; i++) {
    const predBefore = model.getProbabilities();
    model.recordShot('TL', predBefore.predictedZone);
  }

  const pred = model.getProbabilities();
  assert.strictEqual(pred.predictedZone, 'TL', 'Predicted zone must be TL');
  assert(pred.probabilities['TL'] > 0.60, `TL probability (${pred.probabilities['TL']}) should be > 60%`);
  assert(pred.confidence >= 60, `Confidence (${pred.confidence}%) should be >= 60%`);

  // Other zones should have much lower probability
  for (const z of ZONES) {
    if (z !== 'TL') {
      assert(pred.probabilities[z] < 0.15, `${z} prob should be low`);
    }
  }

  // Predictability score should be very high
  const predictability = model.getPredictabilityScore();
  assert(predictability >= 90, `Predictability score (${predictability}) should be >= 90 for pure repeated shot`);
});

test('Entropy score behaves: uniform distribution has low predictability, repeated has high', () => {
  const uniformModel = new PenaltyMindModel();
  
  // Shoot all transitions uniformly so both marginal frequency and bigram transitions are uniform
  for (const fromZ of ZONES) {
    for (const toZ of ZONES) {
      uniformModel.recordShot(fromZ);
      uniformModel.recordShot(toZ);
    }
  }

  const uniformEntropy = uniformModel.getShannonEntropy();
  const maxEntropy = Math.log2(6);
  assert(Math.abs(uniformEntropy - maxEntropy) < 0.01, `Entropy (${uniformEntropy}) should be close to max (${maxEntropy})`);

  const uniformPredScore = uniformModel.getPredictabilityScore();
  assert(uniformPredScore <= 10, `Uniform distribution predictability (${uniformPredScore}) should be <= 10`);

  // Concentrated model: 30 shots all in BM
  const concentratedModel = new PenaltyMindModel();
  for (let i = 0; i < 30; i++) {
    concentratedModel.recordShot('BM');
  }
  const concentratedEntropy = concentratedModel.getShannonEntropy();
  assert.strictEqual(concentratedEntropy, 0, 'Concentrated distribution entropy must be 0');
  assert.strictEqual(concentratedModel.getPredictabilityScore(), 100, 'Predictability must be 100%');
});

test('Predictability score reflects sequence learning: TL/BR alternation scores high, uniform transitions stay low', () => {
  const alternatingModel = new PenaltyMindModel();
  for (let i = 0; i < 15; i++) {
    alternatingModel.recordShot('TL');
    alternatingModel.recordShot('BR');
  }
  const altScore = alternatingModel.getPredictabilityScore();
  assert(altScore >= 90, `TL/BR alternating pattern predictability (${altScore}) should be >= 90%`);

  const uniformModel = new PenaltyMindModel();
  for (const fromZ of ZONES) {
    for (const toZ of ZONES) {
      uniformModel.recordShot(fromZ);
      uniformModel.recordShot(toZ);
    }
  }
  const uniformScore = uniformModel.getPredictabilityScore();
  assert(uniformScore <= 10, `Uniform transitions predictability (${uniformScore}) should be <= 10%`);
});

test('Learns N-gram alternating pattern: TL -> BR -> TL -> BR', () => {
  const model = new PenaltyMindModel();

  // Pattern: TL -> BR repeated 10 times (20 shots total)
  for (let i = 0; i < 10; i++) {
    model.recordShot('TL');
    model.recordShot('BR');
  }

  // History ends with BR -> next prediction should predict TL
  const predAfterBR = model.getProbabilities();
  assert.strictEqual(predAfterBR.predictedZone, 'TL', 'After BR, model should predict TL');
  assert(predAfterBR.probabilities['TL'] > predAfterBR.probabilities['BR'], 'TL probability should exceed BR');

  // If previous shot was TL -> next prediction should predict BR
  const predAfterTL = model.getProbabilities([...model.history, 'TL']);
  assert.strictEqual(predAfterTL.predictedZone, 'BR', 'After TL, model should predict BR');
  assert(predAfterTL.probabilities['BR'] > predAfterTL.probabilities['TL'], 'BR probability should exceed TL');
});

test('Probabilities always sum to 1.0 and are non-negative', () => {
  const model = new PenaltyMindModel();
  const sampleShots = ['TL', 'TR', 'TR', 'BL', 'BM', 'BM', 'BR', 'BM', 'TL'];
  
  for (const shot of sampleShots) {
    model.recordShot(shot);
    const pred = model.getProbabilities();
    let sum = 0;
    for (const z of ZONES) {
      assert(pred.probabilities[z] >= 0, `Probability for ${z} must be >= 0`);
      sum += pred.probabilities[z];
    }
    assert(Math.abs(sum - 1.0) < 1e-6, `Probabilities sum (${sum}) must be 1.0`);
  }
});

test('Dive zone selection returns valid zone and respects probabilities', () => {
  const model = new PenaltyMindModel();
  for (let i = 0; i < 15; i++) {
    model.recordShot('TR');
  }

  let trCount = 0;
  const trials = 100;
  for (let i = 0; i < trials; i++) {
    const dive = model.chooseDiveZone(0.1); // 10% exploration
    assert(ZONES.includes(dive), `Dive zone ${dive} must be a valid zone`);
    if (dive === 'TR') trCount++;
  }

  // With 15 shots to TR and 10% exploration, TR should be chosen the vast majority of times
  assert(trCount >= 70, `TR should be chosen frequently (got ${trCount} / ${trials})`);
});

test('Heatmap and accuracy calculation', () => {
  const model = new PenaltyMindModel();
  model.recordShot('TL', 'TL'); // correct
  model.recordShot('TL', 'TR'); // incorrect
  model.recordShot('BM', 'BM'); // correct
  model.recordShot('BR', 'BL'); // incorrect

  assert.strictEqual(model.predictionsTotal, 4);
  assert.strictEqual(model.predictionsCorrect, 2);
  assert.strictEqual(model.getKeeperAccuracy(), 50);

  const heatmap = model.getHeatmapData();
  assert.strictEqual(heatmap['TL'].count, 2);
  assert.strictEqual(heatmap['TL'].percent, 50);
  assert.strictEqual(heatmap['BM'].count, 1);
  assert.strictEqual(heatmap['BM'].percent, 25);
  assert.strictEqual(heatmap['BR'].count, 1);
  assert.strictEqual(heatmap['BR'].percent, 25);
  assert.strictEqual(heatmap['TR'].count, 0);
  assert.strictEqual(heatmap['TR'].percent, 0);
});

test('Export and import state preserves all data', () => {
  const model = new PenaltyMindModel();
  model.recordShot('TL', 'TL');
  model.recordShot('BM', 'TM');
  model.recordShot('TR', 'TR');
  model.recordMatchResult(true);

  const exported = model.exportState();
  const restoredModel = new PenaltyMindModel(exported);

  assert.strictEqual(restoredModel.totalShots, model.totalShots);
  assert.strictEqual(restoredModel.matchesPlayed, 1);
  assert.strictEqual(restoredModel.matchesWon, 1);
  assert.deepStrictEqual(restoredModel.freq, model.freq);
  assert.deepStrictEqual(restoredModel.getProbabilities(), model.getProbabilities());
  assert.strictEqual(restoredModel.getPredictabilityScore(), model.getPredictabilityScore());

  // Test reset
  restoredModel.init();
  assert.strictEqual(restoredModel.totalShots, 0);
  assert.strictEqual(restoredModel.matchesPlayed, 0);
  assert.strictEqual(restoredModel.getPredictabilityScore(), null);
});

test('Tied probabilities: fair dive sampling and no fake prediction', () => {
  // 1. Fresh model
  const freshModel = new PenaltyMindModel();
  const predFresh = freshModel.getProbabilities();
  assert.strictEqual(predFresh.predictedZone, null, 'Fresh model should have no predictedZone (tie)');
  assert.strictEqual(predFresh.isAmbiguous, true, 'Fresh model should be marked ambiguous');
  assert.strictEqual(predFresh.tiedZones.length, 6, 'All 6 zones should be tied');

  const draws = 6000;
  const countsFresh = {};
  for (const z of ZONES) countsFresh[z] = 0;
  for (let i = 0; i < draws; i++) {
    const dive = freshModel.chooseDiveZone(0.12);
    countsFresh[dive] = (countsFresh[dive] || 0) + 1;
  }
  for (const z of ZONES) {
    const rate = countsFresh[z] / draws;
    assert(rate < 0.25, `Fresh model: ${z} dive rate (${rate}) should not exceed 25% (got ${countsFresh[z]})`);
    assert(rate > 0.10, `Fresh model: ${z} dive rate (${rate}) should be > 10% (got ${countsFresh[z]})`);
  }

  // 2. One shot in each zone (perfect tie)
  const balancedModel = new PenaltyMindModel();
  for (const z of ZONES) {
    balancedModel.recordShot(z);
  }
  const predBalanced = balancedModel.getProbabilities();
  assert.strictEqual(predBalanced.predictedZone, null, 'Balanced model should have no predictedZone');
  assert.strictEqual(predBalanced.isAmbiguous, true, 'Balanced model should be marked ambiguous');

  const countsBalanced = {};
  for (const z of ZONES) countsBalanced[z] = 0;
  for (let i = 0; i < draws; i++) {
    const dive = balancedModel.chooseDiveZone(0.12);
    countsBalanced[dive] = (countsBalanced[dive] || 0) + 1;
  }
  for (const z of ZONES) {
    const rate = countsBalanced[z] / draws;
    assert(rate < 0.25, `Balanced model: ${z} dive rate (${rate}) should not exceed 25% (got ${countsBalanced[z]})`);
  }
});

test('Draw match result and sanitization against invalid data', () => {
  const model = new PenaltyMindModel();
  model.recordMatchResult('draw');
  assert.strictEqual(model.matchesPlayed, 1, 'Draw should increment matchesPlayed');
  assert.strictEqual(model.matchesWon, 0, 'Draw should NOT increment matchesWon');

  // Corrupted data with string freq or sum mismatch
  const corruptedModel = new PenaltyMindModel({
    totalShots: 2,
    freq: { TL: '2', TM: 0, TR: 0, BL: 0, BM: 0, BR: 0 },
    history: ['TL', 'TL']
  });
  // Should reject and reset to 0
  assert.strictEqual(corruptedModel.totalShots, 0);
  assert.strictEqual(corruptedModel.getPredictabilityScore(), null);

  // Poisoned brain with string bigrams and negative predictions
  const poisonedBlob = {
    totalShots: 2,
    freq: { TL: 2, TM: 0, TR: 0, BL: 0, BM: 0, BR: 0 },
    history: ['TL', 'TL'],
    bigrams: { TL: { TL: '2', TM: 0, TR: 0, BL: 0, BM: 0, BR: 0 } },
    predictionsTotal: -5,
    predictionsCorrect: 12
  };
  const sanitizedModel = new PenaltyMindModel(poisonedBlob);
  assert.strictEqual(sanitizedModel.predictionsTotal, 0);
  assert.strictEqual(sanitizedModel.predictionsCorrect, 0);
  assert.strictEqual(sanitizedModel.getKeeperAccuracy(), 0);
  const dive = sanitizedModel.chooseDiveZone(0.12);
  assert(ZONES.includes(dive), `Sanitized model dive zone (${dive}) must be a valid zone`);
});

test('Sequence predictability resilience: 15x alternating TL/BR + 1 TM retains high sequence predictability', () => {
  const model = new PenaltyMindModel();
  for (let i = 0; i < 15; i++) {
    model.recordShot('TL');
    model.recordShot('BR');
  }
  assert.strictEqual(model.getPredictabilityScore(), 100, 'Pure alternating sequence should score 100%');

  // One deviant shot should not cause conditional entropy to collapse
  model.recordShot('TM');
  const scoreAfterDeviant = model.getPredictabilityScore();
  assert(scoreAfterDeviant >= 85, `Predictability (${scoreAfterDeviant}%) should remain high (>= 85%) after 30 alternating shots and 1 deviant`);
});

test('Predictability score requires >= 8 shots, returns null / 數據不足 otherwise', () => {
  const model = new PenaltyMindModel();
  assert.strictEqual(model.getPredictabilityScore(), null);
  assert.strictEqual(model.getPredictabilityRating().tag, '數據不足');

  // Single shot
  model.recordShot('TL');
  assert.strictEqual(model.getPredictabilityScore(), null, 'Single shot must return null predictability');
  assert.strictEqual(model.getPredictabilityRating().tag, '數據不足');

  // Up to 7 shots
  const sample = ['TM', 'TR', 'BL', 'BM', 'BR', 'TL'];
  for (const z of sample) model.recordShot(z);
  assert.strictEqual(model.totalShots, 7);
  assert.strictEqual(model.getPredictabilityScore(), null, '7 shots must return null predictability');
  assert.strictEqual(model.getPredictabilityRating().tag, '數據不足');

  // 8th shot reaches threshold
  model.recordShot('TM');
  assert.strictEqual(model.totalShots, 8);
  assert.notStrictEqual(model.getPredictabilityScore(), null, '8 shots should return numeric predictability score');
  assert.notStrictEqual(model.getPredictabilityRating().tag, '數據不足');
});

test('Five distinct varied zones yields low predictability (< 30)', () => {
  const model = new PenaltyMindModel();
  // 10 varied shots across 5 distinct zones: TL, TM, TR, BL, BM
  const varied = ['TL', 'TM', 'TR', 'BL', 'BM', 'TR', 'TL', 'BM', 'TM', 'BL'];
  for (const z of varied) {
    model.recordShot(z);
  }
  assert(model.totalShots >= 8);
  const score = model.getPredictabilityScore();
  assert(score !== null);
  assert(score < 30, `Score for 5 distinct varied zones (${score}%) must be < 30%`);
});

if (passedTests === totalTests) {
  console.log(`\nAll ${passedTests} / ${totalTests} tests passed successfully!`);
} else {
  console.error(`\nTests failed: ${totalTests - passedTests} failed, ${passedTests} passed.`);
  process.exitCode = 1;
}
