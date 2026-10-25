const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const data = require('../data/data.js');
const model = require('../js/model.js');

test('v4 Schema: ODDS_DATA contains rich macauFixtures, trackRecord, sourcesStatus, health', () => {
  assert.ok(data, 'data must be defined');
  assert.ok(Array.isArray(data.macauFixtures), 'macauFixtures must be an array');
  assert.ok(data.macauFixtures.length > 0, 'macauFixtures must contain upcoming matches');

  assert.ok(data.trackRecord, 'trackRecord must exist');
  assert.ok(data.trackRecord.summary, 'trackRecord.summary must exist');
  assert.ok(typeof data.trackRecord.summary.total_bets === 'number');
  assert.ok(typeof data.trackRecord.summary.roi === 'number');
  assert.ok(typeof data.trackRecord.summary.avg_clv === 'number');

  assert.ok(data.sourcesStatus, 'sourcesStatus must exist');
  assert.ok(data.sourcesStatus.macau_slot, 'sourcesStatus.macau_slot must exist');
  assert.ok(data.sourcesStatus.the_odds_api, 'sourcesStatus.the_odds_api must exist');
  assert.ok(typeof data.sourcesStatus.the_odds_api.requests_remaining === 'number');

  assert.ok(data.health, 'health must exist');
  assert.ok(data.health.status === 'healthy' || data.health.status === 'warning');
});

test('v4 Macau Fixtures: structure, classification badges, and Cantonese team names', () => {
  const f0 = data.macauFixtures[0];
  assert.ok(f0.id, 'id required');
  assert.ok(f0.home && f0.away, 'home and away required');
  assert.ok(f0.homeZh && f0.awayZh, 'Cantonese team names required');
  assert.ok(f0.dayLabel, 'dayLabel required');
  assert.ok(f0.macau, 'macau odds object required');
  assert.ok(f0.consensus, 'consensus object required');

  for (const fix of data.macauFixtures) {
    if (fix.bestOpportunity) {
      assert.ok(['值博', '一般', '唔值博'].includes(fix.bestOpportunity.badge.label));
      assert.ok(['value', 'neutral', 'avoid'].includes(fix.bestOpportunity.badge.tier));
    }
  }
});

test('v4 Math: AH Quarter-line split settlement and exact payoffs', () => {
  const settle = model.settleAH;

  // -0.75 line (split -0.5 and -1.0) @ 2.00
  assert.equal(settle(2, -0.75, 2.0), 2.0); // full win
  assert.equal(settle(1, -0.75, 2.0), 1.5); // half win (half win @ 2.0 + half push @ 1.0 = 1.5)
  assert.equal(settle(0, -0.75, 2.0), 0.0); // full loss

  // +0.75 line (split +0.5 and +1.0) @ 2.00
  assert.equal(settle(-1, 0.75, 2.0), 0.5); // half loss (half push @ 1.0 + half loss @ 0.0 = 0.5)

  // -0.25 line (split 0 and -0.5) @ 2.00
  assert.equal(settle(1, -0.25, 2.0), 2.0); // full win
  assert.equal(settle(0, -0.25, 2.0), 0.5); // half loss (half push @ 1.0 + half loss @ 0.0 = 0.5)
  assert.equal(settle(-1, -0.25, 2.0), 0.0); // full loss

  // +0.25 line (split 0 and +0.5) @ 2.00
  assert.equal(settle(0, 0.25, 2.0), 1.5); // half win (half push @ 1.0 + half win @ 2.0 = 1.5)
});

test('v4 Math: De-vigging multiplicative normalization', () => {
  const probs = model.removeMargin([2.0, 3.4, 3.8], 'proportional');
  const sum = probs.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1.0) < 1e-9, `Sum was ${sum}`);
  assert.ok(probs[0] > probs[1] && probs[1] > probs[2]);
});
