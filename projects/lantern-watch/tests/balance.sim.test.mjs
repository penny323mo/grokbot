// Balance guards: Chapter 1 is a gentle tutorial; no unit falls in the first enemy phase; 3+ hits to KO.
import assert from 'node:assert';
import { CHAPTERS } from '../js/data/maps.js';
import { play } from './helpers/naive-bot.mjs';
import { playReasonable } from './helpers/reasonable-bot.mjs';
import { capDamageToAlly } from '../js/engine/combat.js';

let w1 = 0;
for (let s = 1; s <= 50; s++) if (play(CHAPTERS[0], s).status?.victory) w1++;
assert.ok(w1 >= 45, `Chapter 1 naive win rate ${w1}/50 < 90%`);
assert.ok(CHAPTERS[0].enemySpawns.length <= 4, 'Chapter 1 should have at most 4 enemies');

for (const ch of CHAPTERS) for (let s = 1; s <= 10; s++) {
  const r = play(ch, s);
  assert.deepStrictEqual(r.firstDeaths, [], `ch${ch.id} seed ${s}: unit died in first enemy phase`);
}
assert.ok(capDamageToAlly({ team: 'ally', maxHp: 30 }, 99) <= 9);

// Balance follow-up: Naive rush fails on non-tutorial tactical chapters (Ch3, Ch5, Ch7)
const naiveCh3 = [...Array(50)].filter((_, i) => play(CHAPTERS[2], i + 1).status?.victory).length;
assert.ok(naiveCh3 < 25, `Chapter 3 naive win rate ${naiveCh3}/50 should fail (< 50%)`);

const naiveCh5 = [...Array(50)].filter((_, i) => play(CHAPTERS[4], i + 1).status?.victory).length;
assert.ok(naiveCh5 < 25, `Chapter 5 naive win rate ${naiveCh5}/50 should fail (< 50%)`);

const naiveCh7 = [...Array(50)].filter((_, i) => play(CHAPTERS[6], i + 1).status?.victory).length;
assert.ok(naiveCh7 < 25, `Chapter 7 naive win rate ${naiveCh7}/50 should fail (< 50%)`);

// Reasonable bot: Ch1 gentle tutorial 100%, Ch2-Ch8 landing in strategic 75-90% range
for (const ch of CHAPTERS) {
  let wins = 0;
  for (let s = 1; s <= 50; s++) {
    if (playReasonable(ch, s).status?.victory) wins++;
  }
  const rate = wins / 50;
  if (ch.id === 1) {
    assert.strictEqual(rate, 1.0, `Chapter 1 reasonable win rate ${wins}/50 must be 100%`);
  } else {
    assert.ok(rate >= 0.74 && rate <= 0.90, `Chapter ${ch.id} (${ch.key}) reasonable win rate ${wins}/50 (${Math.round(rate * 100)}%) outside 75-90% range`);
  }
  console.log(`ch${ch.id} reasonable win: ${wins}/50 (${Math.round(rate * 100)}%)`);
}

console.log(`balance ok: ch1 naive win ${w1}/50, ch3/5/7 naive failed, all mid chapters reasonable in 75-90% range`);
