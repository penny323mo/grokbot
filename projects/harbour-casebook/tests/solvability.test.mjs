import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES } from '../src/data/cases.js';
import { checkSection, isAllSectionsSolved } from '../src/engine/deduction.js';

test('Full Solvability of All 4 Cases Start to Finish', (t) => {
  CASES.forEach((caseData) => {
    const solvedSections = [];

    caseData.deductionSections.forEach((sec) => {
      // Simulate player filling correct answers from hotspots
      const filledSlots = {};
      sec.slots.forEach((slot) => {
        filledSlots[slot.key] = slot.answer;
      });

      const check = checkSection(sec, filledSlots);
      assert.equal(check.status, 'CORRECT', `Section ${sec.id} in Case ${caseData.id} must be solvable with exact answers`);
      assert.equal(check.errorCount, 0);
      assert.equal(check.isComplete, true);

      solvedSections.push(sec.id);
    });

    const isCaseComplete = isAllSectionsSolved(caseData, solvedSections);
    assert.equal(isCaseComplete, true, `Case ${caseData.id} (${caseData.title}) must be completely solvable`);
  });
});

test('Decoy Word Bank Depth and Fairness', (t) => {
  CASES.forEach((caseData) => {
    // Collect all slot answers
    const answers = new Set();
    caseData.deductionSections.forEach((sec) => {
      sec.slots.forEach((s) => answers.add(s.answer));
    });

    // Count all bank words
    let totalWords = 0;
    let decoyWords = 0;
    Object.entries(caseData.wordBank).forEach(([cat, words]) => {
      totalWords += words.length;
      words.forEach((w) => {
        if (!answers.has(w)) {
          decoyWords++;
        }
      });
    });

    assert.ok(totalWords >= 25 && totalWords <= 45, `Case ${caseData.id} has ${totalWords} words (within 25-45 range)`);
    assert.ok(decoyWords >= 10, `Case ${caseData.id} has ${decoyWords} decoys to provide fair deductive challenge`);
  });
});
