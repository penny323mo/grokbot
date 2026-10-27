/**
 * Every skill & magic in the data: AoE / single-target casts never damage the caster or its own side,
 * AoE never provokes counter-attacks, and no move carries an unlabelled HP cost.
 */
import assert from 'node:assert';
import test from 'node:test';
import { GUARDIAN_PROTOS, ENEMY_PROTOS, STRATAGEM_MOVES } from '../js/data/units.js';
import { RNG } from '../js/engine/rng.js';
import { Battle } from '../js/engine/battle.js';
import { getActionInfo } from '../js/engine/actioninfo.js';
import { calculateCombat } from '../js/engine/combat.js';

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

test('Every unit, every skill/magic, cast on self/own tile/ally/enemy: no hit/counter event ever lands on the caster or a teammate', () => {
  for (const m of moves) {
    const mv = m.p[m.type];
    for (const dir of [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]]) {
      for (const tgtKind of ['self', 'ally', 'enemy', 'none']) {
        const { battle, u } = arena(m.id, m.p);
        const pal = battle.allies.find(a => a !== u);
        pal.x = 4 + (dir[1] || 1); pal.y = 6; pal.hp = pal.maxHp = 40;
        const foe = { ...ENEMY_PROTOS.fog_rider, id: 'foe1', team: 'enemy', x: 4 + (dir[0] || -1), y: 6 + dir[1], hp: 200, maxHp: 200 };
        battle.enemies = [foe];
        const target = { self: u, ally: pal, enemy: foe, none: null }[tgtKind];
        const tx = target ? target.x : u.x, ty = target ? target.y : u.y;
        const before = battle.allies.map(a => a.hp);
        const res = battle.confirmAction(u, m.type, target, { tileX: tx, tileY: ty, dx: dir[0] || undefined, dy: dir[1] || undefined });
        const allyIds = new Set(battle.allies.map(a => a.id));
        for (const e of res?.events || []) {
          if (e.type === 'hit') assert.ok(!allyIds.has(e.target), `${mv.name} (${tgtKind}) produced a hit on ally ${e.target}`);
        }
        // Only a legitimate enemy counter-attack (single-target move vs. enemy) may cost the caster HP
        const counterDmg = (res?.events || []).filter(e => e.type === 'counter').reduce((n, e) => n + (e.damage || 0), 0);
        if (counterDmg) assert.ok(tgtKind === 'enemy' && !mv.aoe, `${mv.name} provoked a counter while not attacking an enemy`);
        battle.allies.forEach((a, i) => assert.ok(a.hp >= before[i] - (a === u ? counterDmg : 0), `${a.name} lost HP to ${m.id} ${mv.name} (${tgtKind}, dir ${dir})`));
      }
    }
  }
});

test('熊岳 鐵壁之陣: caster loses no HP, gets +DEF, buff does not stack and expires after its duration', () => {
  const { battle, u } = arena('bear_guard', GUARDIAN_PROTOS.bear_guard);
  battle.enemies = [{ ...ENEMY_PROTOS.fog_rider, id: 'far', team: 'enemy', x: 0, y: 0, hp: 200, maxHp: 200 }];
  battle.status = { finished: false };
  const def0 = u.def, hp0 = u.hp;
  const res = battle.confirmAction(u, 'magic', u, { tileX: u.x, tileY: u.y });
  assert.strictEqual(u.hp, hp0);
  assert.ok(!res.events.some(e => e.type === 'hit'));
  assert.ok(res.events.some(e => e.type === 'buff' && e.target === u.id));
  assert.strictEqual(u.def, def0 + 4);
  u.acted = false;
  battle.confirmAction(u, 'magic', u, {});
  assert.strictEqual(u.def, def0 + 4, 'buff must not stack');
  battle.phase = 'enemy'; battle.endEnemyPhase();
  battle.phase = 'enemy'; battle.endEnemyPhase();
  assert.strictEqual(u.def, def0, 'buff expires after 2 turns');
});

test('Stratagems: all 6 stratagem moves deal zero friendly fire and never hurt teammates or caster', () => {
  for (const [sId, strat] of Object.entries(STRATAGEM_MOVES)) {
    const { battle, u } = arena('tea_master', GUARDIAN_PROTOS.tea_master);
    const pal = battle.allies.find(a => a !== u);
    pal.x = 5; pal.y = 6; pal.hp = pal.maxHp = 30;
    const hp0 = pal.hp;
    const uHp0 = u.hp;

    // Cast directly on pal
    const res = battle.confirmAction(u, 'magic', pal, { skill: strat });
    if (strat.isHeal) {
      assert.ok(pal.hp >= hp0, `${strat.name} heal should not decrease HP`);
      assert.strictEqual(u.hp, uHp0);
    } else if (strat.isSupport) {
      assert.strictEqual(pal.hp, hp0, `${strat.name} must not damage ally`);
      assert.strictEqual(u.hp, uHp0);
      assert.ok(pal.inspireBonus, `${strat.name} should grant rally bonus`);
    } else {
      assert.strictEqual(pal.hp, hp0, `${strat.name} must not damage teammate`);
      assert.strictEqual(u.hp, uHp0, `${strat.name} must not damage caster`);
      assert.ok(!res.events.some(e => e.type === 'hit' && e.target === pal.id), `${strat.name} produced hit on ally`);
    }
  }
});

test('Stratagems: offensive and confuse stratagems work against enemies without friendly fire', () => {
  for (const sId of ['stratagem_fire', 'stratagem_water', 'stratagem_rockfall', 'stratagem_confuse']) {
    const strat = STRATAGEM_MOVES[sId];
    const { battle, u } = arena('tanuki_mage', GUARDIAN_PROTOS.tanuki_mage);
    const pal = battle.allies.find(a => a !== u);
    pal.x = 4; pal.y = 5; pal.hp = 30;
    const foe = { ...ENEMY_PROTOS.fog_rider, id: 'foe1', team: 'enemy', x: 5, y: 6, hp: 50, maxHp: 50 };
    battle.enemies = [foe];

    const res = battle.confirmAction(u, 'magic', foe, { skill: strat });
    assert.strictEqual(pal.hp, 30, `Teammate lost HP when using ${strat.name} on enemy`);
    assert.strictEqual(u.hp, 40, `Caster lost HP when using ${strat.name} on enemy`);
    if (strat.isConfuse) {
      assert.strictEqual(foe.isConfused, true, 'Enemy should be confused');
    } else {
      assert.ok(res.events.some(e => e.type === 'hit' || e.type === 'miss'), `${strat.name} should produce hit/miss against enemy`);
    }
  }
});

test('Stratagems: weather interactions - rain blocks fire stratagem, boosts water stratagem', () => {
  const fireMove = STRATAGEM_MOVES.stratagem_fire;
  const waterMove = STRATAGEM_MOVES.stratagem_water;
  const { battle, u } = arena('lantern_crafter', GUARDIAN_PROTOS.lantern_crafter);
  const foe = { ...ENEMY_PROTOS.fog_rider, id: 'foe1', team: 'enemy', x: 5, y: 6, hp: 50, maxHp: 50, int: 50 };

  // In rain:
  const rainCombatFire = calculateCombat(u, foe, battle.board, {
    actionType: 'magic',
    skill: fireMove,
    weather: 'rain'
  });
  assert.strictEqual(rainCombatFire.stratagemBlocked, true);
  assert.strictEqual(rainCombatFire.expectedDamage, 0);
  assert.strictEqual(rainCombatFire.targetTags.includes('雨天無法火計'), true);

  // In sunny / normal:
  const sunnyCombatFire = calculateCombat(u, foe, battle.board, {
    actionType: 'magic',
    skill: fireMove,
    weather: 'sunny'
  });
  assert.strictEqual(sunnyCombatFire.stratagemBlocked, false);
  assert.ok(sunnyCombatFire.expectedDamage > 0);

  // Water stratagem in rain has boost:
  const rainCombatWater = calculateCombat(u, foe, battle.board, {
    actionType: 'magic',
    skill: waterMove,
    weather: 'rain'
  });
  const normalCombatWater = calculateCombat(u, foe, battle.board, {
    actionType: 'magic',
    skill: waterMove,
    weather: 'sunny'
  });
  assert.ok(rainCombatWater.expectedDamage > normalCombatWater.expectedDamage, 'Water stratagem should do more damage in rain');
});
