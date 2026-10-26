/**
 * 12碼讀心戰 (Penalty Mind Game v2) - Tournament Module Unit Tests
 * Tests 16 national teams definitions, keeper/taker personalities,
 * bracket generation, round progression, difficulty ramping, and safe storage.
 */

import assert from 'assert';
import { TEAMS, ROUND_NAMES, TournamentManager } from '../src/tournament.js';

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

console.log('--- Running Tournament System (src/tournament.js) Unit Tests ---\n');

test('All 16 national teams are defined with unique IDs, valid kit colors and personalities', () => {
  assert.strictEqual(TEAMS.length, 16, 'Must contain exactly 16 national teams');
  const ids = new Set();

  TEAMS.forEach(team => {
    assert(!ids.has(team.id), `Duplicate team ID: ${team.id}`);
    ids.add(team.id);

    // Color verification
    assert(team.colors && team.colors.primary, `${team.name} must have primary color`);
    assert(team.colors.shorts, `${team.name} must have shorts color`);

    // Keeper personality verification
    assert(team.keeper && team.keeper.name, `${team.name} must have keeper name`);
    assert(team.keeper.style, `${team.name} must have keeper style`);
    assert(typeof team.keeper.tellHonesty === 'number', `${team.name} must have numeric tell honesty`);

    // Taker personality verification
    assert(team.taker && team.taker.name, `${team.name} must have taker name`);
    assert(team.taker.style, `${team.name} must have taker style`);
    assert(typeof team.taker.speedBonus === 'number', `${team.name} must have numeric speed bonus`);
  });
});

test('Tournament initializes 16-team bracket in R16 with 8 matches and player match at M0', () => {
  const tm = new TournamentManager();
  const state = tm.startNewTournament('HKG');

  assert.strictEqual(state.active, true);
  assert.strictEqual(state.playerTeam.id, 'HKG');
  assert.strictEqual(state.currentRoundIndex, 0);
  assert.strictEqual(state.currentRoundName, '16強淘汰賽');
  assert.strictEqual(state.currentDifficulty, 'EASY');

  const r16 = state.rounds[0];
  assert.strictEqual(r16.matches.length, 8, 'R16 must have 8 matches');

  const playerMatch = tm.getCurrentPlayerMatch();
  assert(playerMatch !== null, 'Player must have an active match in R16');
  assert.strictEqual(playerMatch.teamA.id, 'HKG');
  assert(playerMatch.teamB.id !== 'HKG', 'Opponent must be distinct team');
  assert.strictEqual(playerMatch.winner, null);
});

test('Difficulty scales properly across rounds: R16 (EASY) -> QF (MEDIUM) -> SF (HARD) -> FINAL (HELL)', () => {
  const tm = new TournamentManager();
  tm.startNewTournament('JPN');

  assert.strictEqual(tm.getCurrentDifficulty(), 'EASY');

  // Win R16 -> advance to QF
  tm.recordPlayerMatchResult(true, 5, 4);
  assert.strictEqual(tm.currentRoundIndex, 1);
  assert.strictEqual(tm.getCurrentDifficulty(), 'MEDIUM');
  assert.strictEqual(tm.rounds[1].matches.length, 4, 'QF must have 4 matches');

  // Win QF -> advance to SF
  tm.recordPlayerMatchResult(true, 4, 2);
  assert.strictEqual(tm.currentRoundIndex, 2);
  assert.strictEqual(tm.getCurrentDifficulty(), 'HARD');
  assert.strictEqual(tm.rounds[2].matches.length, 2, 'SF must have 2 matches');

  // Win SF -> advance to Final
  tm.recordPlayerMatchResult(true, 5, 3);
  assert.strictEqual(tm.currentRoundIndex, 3);
  assert.strictEqual(tm.getCurrentDifficulty(), 'HELL');
  assert.strictEqual(tm.rounds[3].matches.length, 1, 'Final must have 1 match');

  // Win Final -> Champion!
  tm.recordPlayerMatchResult(true, 5, 4);
  assert.strictEqual(tm.isChampion, true, 'Player must be crowned champion');
  assert.strictEqual(tm.active, false);
});

test('Player elimination on loss ends tournament and records elimination round', () => {
  const tm = new TournamentManager();
  tm.startNewTournament('BRA');

  // Win R16
  tm.recordPlayerMatchResult(true, 5, 3);
  assert.strictEqual(tm.currentRoundIndex, 1);

  // Lose QF
  tm.recordPlayerMatchResult(false, 3, 4);
  assert.strictEqual(tm.isEliminated, true);
  assert.strictEqual(tm.isChampion, false);
  assert.strictEqual(tm.active, false);
  assert.strictEqual(tm.eliminatedInRound, '8強半準決賽');
});

test('Safe persistence handling: survives corrupt localStorage data', () => {
  const fakeStorage = {};
  global.localStorage = {
    getItem: (k) => fakeStorage[k] || null,
    setItem: (k, v) => { fakeStorage[k] = v; },
    removeItem: (k) => { delete fakeStorage[k]; }
  };

  const tm = new TournamentManager();
  tm.startNewTournament('ARG');
  tm.save();

  const tm2 = new TournamentManager();
  const loaded = tm2.load();
  assert.strictEqual(loaded, true);
  assert.strictEqual(tm2.playerTeam.id, 'ARG');

  // Inject corrupted data
  global.localStorage.setItem('btb_penalty_tournament_v2', '{ invalid json : ');
  const tm3 = new TournamentManager();
  const corruptLoaded = tm3.load();
  assert.strictEqual(corruptLoaded, false);
  assert.strictEqual(tm3.active, false);

  delete global.localStorage;
});

if (passedTests === totalTests) {
  console.log(`\nAll ${passedTests} / ${totalTests} tournament unit tests passed successfully!`);
} else {
  console.error(`\nTournament tests failed.`);
  process.exitCode = 1;
}
