import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES } from '../src/data/cases.js';
import { PORTRAITS } from '../src/data/portraits.js';

test('Cases data structure and completeness', (t) => {
  assert.equal(CASES.length, 4, 'Should have exactly 4 cases');

  CASES.forEach((c) => {
    assert.ok(c.id, `Case has id`);
    assert.ok(c.title, `Case ${c.id} has title`);
    assert.ok(c.location, `Case ${c.id} has location`);
    assert.ok(c.incidentIntro, `Case ${c.id} has incidentIntro`);
    assert.ok(c.hotspots && c.hotspots.length >= 10, `Case ${c.id} has >= 10 hotspots`);
    assert.ok(c.deductionSections && c.deductionSections.length >= 2, `Case ${c.id} has >= 2 deduction sections`);
    assert.ok(c.epilogue && c.epilogue.text, `Case ${c.id} has epilogue`);

    // Collect all data-word in hotspot descriptions
    const wordsInHotspots = new Set();
    c.hotspots.forEach((h) => {
      assert.ok(h.id, `Hotspot has id`);
      assert.ok(typeof h.x === 'number' && h.x >= 0 && h.x <= 100, `Hotspot x in range: ${h.x}`);
      assert.ok(typeof h.y === 'number' && h.y >= 0 && h.y <= 100, `Hotspot y in range: ${h.y}`);
      assert.ok(h.name, `Hotspot has name`);
      assert.ok(h.desc, `Hotspot has desc`);

      const regex = /data-word="([^"]+)"/g;
      let match;
      while ((match = regex.exec(h.desc)) !== null) {
        wordsInHotspots.add(match[1]);
      }
    });

    // Check wordBank completeness: every word in wordBank must be obtainable in hotspots
    assert.ok(c.wordBank, `Case ${c.id} has wordBank`);
    const allBankWords = new Set();
    Object.entries(c.wordBank).forEach(([category, list]) => {
      assert.ok(Array.isArray(list), `Category ${category} is array`);
      list.forEach((w) => {
        allBankWords.add(w);
        assert.ok(wordsInHotspots.has(w), `Word '${w}' in category '${category}' must be obtainable from hotspots in Case ${c.id}`);
      });
    });

    // Verify all slot answers exist in wordBank and in hotspots
    c.deductionSections.forEach((sec) => {
      assert.ok(sec.title, `Section has title`);
      assert.ok(sec.template, `Section has template`);
      assert.ok(Array.isArray(sec.slots), `Section has slots`);
      sec.slots.forEach((slot) => {
        const slotKey = slot.id || slot.key;
        assert.ok(slotKey, `Slot has id or key`);
        assert.ok(slot.type, `Slot has type`);
        assert.ok(slot.answer, `Slot has answer: ${slotKey}`);

        // Category bank check
        const catWords = c.wordBank[slot.type];
        assert.ok(catWords, `Word bank category '${slot.type}' exists in case ${c.id}`);
        assert.ok(catWords.includes(slot.answer), `Slot answer '${slot.answer}' exists in category '${slot.type}' bank`);
        assert.ok(wordsInHotspots.has(slot.answer), `Slot answer '${slot.answer}' is collectible from hotspots in case ${c.id}`);
      });
    });

    // Verify characters exist in PORTRAITS
    c.characters.forEach((charId) => {
      assert.ok(PORTRAITS[charId], `Character ${charId} exists in PORTRAITS`);
    });
  });
});
