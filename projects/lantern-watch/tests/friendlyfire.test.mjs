/**
 * Every skill & magic in the data: AoE / single-target casts never damage the caster or its own side,
 * AoE never provokes counter-attacks, and no move carries an unlabelled HP cost.
 */
import assert from 'node:assert';
import test from 'node:test';
import { GUARDIAN_PROTOS, ENEMY_PROTOS } from '../js/data/units.js';
import { RNG } from '../js/engine/rng.js';
import { Battle } from '../js/engine/battle.js';
import { getActionInfo } from '../js/engine/actioninfo.js';

const moves = [];
for (const [id, p] of Object.entries(GUARDIAN_PROTOS)) {
  if (p.skill) moves.push({ id, p, type: 'skill' });
  if (p.magic) moves.push({ id, p, type: 'magic' });
}

function arena(id, p) {
  const chapter = { id: 99, terrain: Array(13).fill('..........'), deployTiles: [{ x: 4, y: 6 }], enemySpawns: [] };
  const caster = { ...p, id, x: 4, y: 6, hp: 40, maxHp: 40, mp: 99, maxMp: 99 };
  const friend = { ...GUARDIAN_PROTOS.bear_guard, id: id === 'bear_guard' ? 'cat_patrol' : 'bear_guard' };
  const battle = new Battle(chapter, [caster, friend], null, null, new RNG(3));
  const u = battle.allies.find(a => a.id === id);
  u.x = 4; u.y = 6; u.mp = 99; u.hp = u.maxHp = 40;
  return { battle, u };
}

for (const m of moves) {
  const mv = m.p[m.type];
  test(`No friendly/self damage: ${m.id} ${m.type} 「${mv.name}」`, () => {
    for (const dir of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const { battle, u } = arena(m.id, m.p);
      // Surround the caster: allies on every side tile + one enemy in the cast direction
      const pals = battle.allies.filter(a => a !== u);
      const pal = pals[0];
      pal.x = 4 - dir[1]; pal.y = 6 + dir[0]; pal.hp = pal.maxHp = 40;
      const foe = { ...ENEMY_PROTOS.fog_rider, id: 'foe1', team: 'enemy', x: 4 + dir[0], y: 6 + dir[1], hp: 200, maxHp: 200, atk: 30, range: [1, 3] };
      battle.enemies = [foe];
      const allyHp = battle.allies.map(a => a.hp);
      const target = (mv.isHeal || mv.selfBuff) ? pal : foe;
      battle.confirmAction(u, m.type, target, { tileX: foe.x, tileY: foe.y, dx: dir[0], dy: dir[1] });
      battle.allies.forEach((a, i) => {
        if (mv.aoe || mv.isHeal || mv.selfBuff || mv.isLightPlacement) {
          assert.ok(a.hp >= allyHp[i] - (mv.hpCost && a === u ? mv.hpCost : 0), `${a.name} lost HP to ${mv.name}`);
        }
      });
    }
  });
}

test('Directly targeting a teammate with a damaging move does nothing', () => {
  for (const m of moves) {
    const mv = m.p[m.type];
    if (mv.isHeal || mv.selfBuff || mv.isLightPlacement) continue;
    const { battle, u } = arena(m.id, m.p);
    const pal = battle.allies.find(a => a !== u);
    pal.x = 5; pal.y = 6; const hp = pal.hp;
    battle.enemies = [];
    battle.confirmAction(u, m.type, pal, { tileX: 5, tileY: 6, dx: 1, dy: 0 });
    assert.strictEqual(pal.hp, hp, `${mv.name} hurt teammate`);
    assert.strictEqual(u.hp, 40, `${mv.name} hurt caster`);
  }
});

test('No move has a hidden HP cost; any hpCost is surfaced in the info card', () => {
  for (const m of moves) {
    const mv = m.p[m.type];
    const { battle, u } = arena(m.id, m.p);
    battle.enemies = [];
    const info = getActionInfo(battle, u, m.type);
    assert.strictEqual(info.hpCost, mv.hpCost || 0, `${mv.name} hpCost must be shown`);
    if (mv.aoe) assert.match(info.counterNote, /無反擊/);
  }
});
