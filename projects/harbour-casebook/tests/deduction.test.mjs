import test from 'node:test';
import assert from 'node:assert/strict';
import { checkSection, isAllSectionsSolved, checkWhosWho, CHECK_STATUS } from '../src/engine/deduction.js';
import { CASES } from '../src/data/cases.js';

test('Deduction Checker Logic - Golden Idol Feedback', (t) => {
  const c1 = CASES[0];
  const sec1 = c1.deductionSections[0]; // slots: victim ('陳德生'), scene ('當舖庫房'), weapon ('紅木算盤')

  // 1. Incomplete
  const r1 = checkSection(sec1, { victim: '陳德生' });
  assert.equal(r1.status, CHECK_STATUS.INCOMPLETE);
  assert.equal(r1.isComplete, false);

  // 2. All Correct
  const r2 = checkSection(sec1, {
    victim: '陳德生',
    scene: '當舖庫房',
    weapon: '紅木算盤'
  });
  assert.equal(r2.status, CHECK_STATUS.CORRECT);
  assert.equal(r2.errorCount, 0);
  assert.equal(r2.isComplete, true);

  // 3. Exactly 1 Error -> PARTIAL
  const r3 = checkSection(sec1, {
    victim: '陳德生',
    scene: '福隆新街', // Wrong
    weapon: '紅木算盤'
  });
  assert.equal(r3.status, CHECK_STATUS.PARTIAL);
  assert.equal(r3.errorCount, 1);

  // 4. Exactly 2 Errors -> PARTIAL
  const r4 = checkSection(sec1, {
    victim: '何炳', // Wrong
    scene: '大堂櫃檯', // Wrong
    weapon: '紅木算盤'
  });
  assert.equal(r4.status, CHECK_STATUS.PARTIAL);
  assert.equal(r4.errorCount, 2);

  // 5. 3 Errors (Section 2 has 4 slots)
  const sec2 = c1.deductionSections[1]; // slots: culprit, motive, treasure, accomplice
  const r5 = checkSection(sec2, {
    culprit: '陳德生', // Wrong
    motive: '尋仇洩憤', // Wrong
    treasure: '當票存根', // Wrong
    accomplice: '白蘭' // Correct
  });
  assert.equal(r5.status, CHECK_STATUS.MANY_ERRORS);
  assert.equal(r5.errorCount, 3);
});

test('Case completion verification', (t) => {
  const c1 = CASES[0];
  assert.equal(isAllSectionsSolved(c1, ['c1_s1']), false);
  assert.equal(isAllSectionsSolved(c1, ['c1_s1', 'c1_s2']), true);
});

test('Whos Who verification', (t) => {
  const c1 = CASES[0];

  // 1. Incomplete
  const rIncomplete = checkWhosWho(c1.whosWho, {
    chan_tak_sang: '陳德生'
  });
  assert.equal(rIncomplete.status, CHECK_STATUS.INCOMPLETE);
  assert.equal(rIncomplete.isComplete, false);
  assert.equal(rIncomplete.isAllCorrect, false);

  // 2. All Correct
  const r = checkWhosWho(c1.whosWho, {
    chan_tak_sang: '陳德生',
    ho_bing: '何炳',
    leung_ah_sei: '梁阿四',
    pak_lan: '白蘭'
  });
  assert.equal(r.status, CHECK_STATUS.CORRECT);
  assert.equal(r.isAllCorrect, true);
  assert.equal(r.correctCount, 4);
  assert.equal(r.errorCount, 0);

  // 3. Partial (<= 2 errors)
  const rWrong = checkWhosWho(c1.whosWho, {
    chan_tak_sang: '陳德生',
    ho_bing: '梁阿四', // Wrong
    leung_ah_sei: '何炳', // Wrong
    pak_lan: '白蘭'
  });
  assert.equal(rWrong.status, CHECK_STATUS.PARTIAL);
  assert.equal(rWrong.isAllCorrect, false);
  assert.equal(rWrong.correctCount, 2);
  assert.equal(rWrong.errorCount, 2);

  // 4. Many Errors (> 2 errors)
  const rManyWrong = checkWhosWho(c1.whosWho, {
    chan_tak_sang: '何炳', // Wrong
    ho_bing: '陳德生', // Wrong
    leung_ah_sei: '白蘭', // Wrong
    pak_lan: '梁阿四' // Wrong
  });
  assert.equal(rManyWrong.status, CHECK_STATUS.MANY_ERRORS);
  assert.equal(rManyWrong.isAllCorrect, false);
  assert.equal(rManyWrong.errorCount, 4);
});
