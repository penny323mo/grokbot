import test from 'node:test';
import assert from 'node:assert/strict';
import { StorageEngine } from '../src/engine/storage.js';

test('StorageEngine state manipulation and Who\'s Who persistence', (t) => {
  const storage = new StorageEngine();

  // Test slot persistence
  storage.setSlotValue(1, 'c1_s1', 'victim', '陳德生');
  assert.equal(storage.getSlotValue(1, 'c1_s1', 'victim'), '陳德生');

  // Test clearing slot
  storage.setSlotValue(1, 'c1_s1', 'victim', null);
  assert.equal(storage.getSlotValue(1, 'c1_s1', 'victim'), null);

  // Test Who's Who persistence
  assert.equal(storage.isWhoSolved(1), false);
  storage.setWhoGuess(1, 'chan_tak_sang', '陳德生');
  storage.setWhoGuess(1, 'ho_bing', '何炳');
  const guesses = storage.getWhoGuesses(1);
  assert.equal(guesses.chan_tak_sang, '陳德生');
  assert.equal(guesses.ho_bing, '何炳');

  storage.setWhoSolved(1, true);
  assert.equal(storage.isWhoSolved(1), true);

  // Test word collection
  assert.equal(storage.collectWord(1, '紅木算盤'), true);
  assert.equal(storage.collectWord(1, '紅木算盤'), false); // duplicate ignored
  assert.ok(storage.getCaseState(1).collectedWords.includes('紅木算盤'));

  // Test section and case solved
  assert.equal(storage.isSectionSolved(1, 'c1_s1'), false);
  storage.markSectionSolved(1, 'c1_s1');
  assert.equal(storage.isSectionSolved(1, 'c1_s1'), true);

  assert.equal(storage.isCaseSolved(1), false);
  storage.markCaseSolved(1);
  assert.equal(storage.isCaseSolved(1), true);
  assert.equal(storage.isCaseUnlocked(2), true);
});
