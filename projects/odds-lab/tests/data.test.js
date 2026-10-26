const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('data/data.js loads via VM and has expected top-level schema and 5 leagues', () => {
  const filePath = path.join(__dirname, '..', 'data', 'data.js');
  const code = fs.readFileSync(filePath, 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);

  const data = sandbox.window.ODDS_DATA;
  assert.ok(data, 'ODDS_DATA should be defined in window');
  assert.ok(data.generatedAt, 'generatedAt should exist');
  assert.ok(data.dataThrough, 'dataThrough should exist');
  assert.ok(data.matchSchema, 'matchSchema should exist');
  assert.ok(data.fixtureSchema, 'fixtureSchema should exist');

  const expectedLeagues = ['E0', 'SP1', 'I1', 'D1', 'F1'];
  assert.deepStrictEqual(Object.keys(data.leagues).sort(), expectedLeagues.sort());
});

test('2627 teams count is 20 for E0/SP1/I1 and 18 for D1/F1, and matches have valid scores', () => {
  const data = require('../data/data.js');

  const expectedCounts = {
    'E0': 20,
    'SP1': 20,
    'I1': 20,
    'D1': 18,
    'F1': 18
  };

  for (const [div, expectedCount] of Object.entries(expectedCounts)) {
    const lg = data.leagues[div];
    assert.ok(lg, `League ${div} must exist`);
    assert.strictEqual(
      lg.currentTeams.length,
      expectedCount,
      `League ${div} should have ${expectedCount} current teams in 2627 season, got ${lg.currentTeams.length}`
    );

    // Verify all matches have valid scores and belong only to 2526 or 2627
    assert.ok(lg.matches.length > 300, `League ${div} should have > 300 historical matches (2526 + 2627)`);
    for (const m of lg.matches) {
      const fthg = m[3];
      const ftag = m[4];
      const season = m[7];
      assert.ok(Number.isInteger(fthg) && fthg >= 0, `fthg must be non-negative integer, got ${fthg}`);
      assert.ok(Number.isInteger(ftag) && ftag >= 0, `ftag must be non-negative integer, got ${ftag}`);
      assert.ok(season === '2526' || season === '2627', `season must be 2526 or 2627, got ${season}`);
    }

    // Verify fixtures
    assert.ok(lg.fixtures.length > 0, `League ${div} should have upcoming fixtures`);
  }
});
