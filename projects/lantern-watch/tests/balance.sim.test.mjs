// Balance guards: Chapter 1 is a gentle tutorial; no unit falls in the first enemy phase; 3+ hits to KO.
import assert from 'node:assert';
import { CHAPTERS } from '../js/data/maps.js';
import { play } from './helpers/naive-bot.mjs';
import { capDamageToAlly } from '../js/engine/combat.js';
let w = 0;
for (let s = 1; s <= 50; s++) if (play(CHAPTERS[0], s).status?.victory) w++;
assert.ok(w >= 45, `Chapter 1 naive win rate ${w}/50 < 90%`);
assert.ok(CHAPTERS[0].enemySpawns.length <= 4, 'Chapter 1 should have at most 4 enemies');
for (const ch of CHAPTERS) for (let s = 1; s <= 10; s++) {
  const r = play(ch, s);
  assert.deepStrictEqual(r.firstDeaths, [], `ch${ch.id} seed ${s}: unit died in first enemy phase`);
}
assert.ok(capDamageToAlly({ team: 'ally', maxHp: 30 }, 99) <= 9);
console.log(`balance ok: ch1 naive win ${w}/50`);
