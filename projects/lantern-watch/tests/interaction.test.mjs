/**
 * tests/interaction.test.mjs
 * Attack without moving (原地攻擊), walk paths for animation, and the tutorial modal wiring.
 */
import assert from 'node:assert';
import test from 'node:test';
import fs from 'node:fs';
import { GUARDIAN_PROTOS, ENEMY_PROTOS } from '../js/data/units.js';
import { RNG } from '../js/engine/rng.js';
import { Battle } from '../js/engine/battle.js';

function setup() {
  const chapter = { id: 99, terrain: Array(13).fill('..........'), deployTiles: [{ x: 3, y: 5 }], enemySpawns: [] };
  const cat = { ...GUARDIAN_PROTOS.cat_patrol, id: 'cat_patrol', x: 3, y: 5, hp: 24, maxHp: 24, mp: 6, maxMp: 6 };
  const battle = new Battle(chapter, [cat], null, null, new RNG(7));
  const unit = battle.allies.find(u => u.id === 'cat_patrol');
  unit.x = 3; unit.y = 5;
  const rider = { ...ENEMY_PROTOS.fog_rider, id: 'fog_rider', team: 'enemy', x: 4, y: 5, hp: 22, maxHp: 22 };
  battle.enemies = [rider];
  return { battle, unit, rider };
}

test('Interaction: 墨影 at (3,5) can attack adjacent 霧騎 without moving', () => {
  const { battle, unit, rider } = setup();
  const targets = battle.getTargetsInRangeNow(unit);
  assert.ok(targets.includes(rider), 'adjacent enemy must be attackable from current tile');
  assert.ok(battle.holdPosition(unit), 'stay-in-place counts as the move step');
  assert.deepStrictEqual([unit.x, unit.y], [3, 5]);
  const hp0 = rider.hp;
  const res = battle.confirmAction(unit, 'attack', rider);
  assert.notStrictEqual(res.success, false);
  assert.ok(rider.hp < hp0, 'attack must deal damage');
  assert.deepStrictEqual([unit.x, unit.y], [3, 5], 'unit never moved');
  assert.ok(unit.acted);
});

test('Interaction: out-of-range enemy is not a stay-in-place target', () => {
  const { battle, unit, rider } = setup();
  rider.x = 8; rider.y = 9;
  assert.strictEqual(battle.getTargetsInRangeNow(unit).length, 0);
});

test('Interaction: moveUnit records an orthogonal tile-by-tile walk path', () => {
  const { battle, unit } = setup();
  battle.enemies = [];
  battle.moveUnit(unit, 1, 3);
  const p = unit.lastPath;
  assert.deepStrictEqual(p[0], { x: 3, y: 5 });
  assert.deepStrictEqual(p[p.length - 1], { x: 1, y: 3 });
  assert.strictEqual(p.length, 5);
  for (let i = 1; i < p.length; i++) {
    assert.strictEqual(Math.abs(p[i].x - p[i - 1].x) + Math.abs(p[i].y - p[i - 1].y), 1, 'each step is one tile');
  }
  assert.ok(battle.movePaths.some(m => m.id === unit.id));
});

test('Tutorial modal: ui.js imports GAME and wires ×, backdrop, Esc and final step to close', () => {
  const src = fs.readFileSync(new URL('../js/render/ui.js', import.meta.url), 'utf8');
  if (/\bGAME\./.test(src)) assert.match(src, /import\s*\{[^}]*\bGAME\b[^}]*\}\s*from/, 'GAME used but not imported (crashed the tutorial modal)');
  const fn = src.slice(src.indexOf('showTacticsTutorialModal(onClose)'), src.indexOf('playCombatVfx('));
  assert.match(fn, /btnClose\.onclick/);
  assert.match(fn, /Escape/);
  assert.match(fn, /e\.target === modal/);
  assert.match(fn, /else \{ close\(\); \}/);
});

test('Action info: long-press data for attack/skill shows range, cost and per-enemy predictions', async () => {
  const { getActionInfo } = await import('../js/engine/actioninfo.js');
  const { battle, unit, rider } = setup();
  const atk = getActionInfo(battle, unit, 'attack');
  assert.strictEqual(atk.name, '普通攻擊');
  assert.ok(atk.tiles.some(t => t.x === 4 && t.y === 5), 'range covers adjacent tile');
  const t = atk.targets.find(x => x.id === rider.id);
  assert.ok(t, 'enemy in range listed');
  assert.ok(t.damage > 0 && t.hit >= 0 && t.hit <= 100 && t.koChance >= 0 && t.koChance <= 100);
  assert.strictEqual(typeof t.counter, 'boolean');
  const sk = getActionInfo(battle, unit, 'skill');
  assert.strictEqual(sk.cost, unit.skill.cost);
  assert.ok(sk.power > 0);
  rider.x = 9; rider.y = 12;
  assert.strictEqual(getActionInfo(battle, unit, 'attack').targets.length, 0);
  const ui = fs.readFileSync(new URL('../js/render/ui.js', import.meta.url), 'utf8');
  assert.match(ui, /bindActionLongPress/);
  assert.match(ui, /}, 400\);/);
});

test('Tutorial: acknowledging/closing every tutorial step never changes unit positions or acted flags', async () => {
  const { CHAPTERS } = await import('../js/data/maps.js');
  const ch1 = CHAPTERS[0];
  const squad = ['bear_guard', 'cat_patrol', 'lantern_crafter', 'tea_master'].map(id => ({
    ...GUARDIAN_PROTOS[id],
    id,
    hp: GUARDIAN_PROTOS[id].maxHp,
    mp: GUARDIAN_PROTOS[id].maxMp,
    acted: false
  }));
  const battle = new Battle(ch1, squad, 'inspire', null, new RNG(1));

  // Snapshot initial positions and acted flags
  const initialSnap = battle.allies.map(a => ({ id: a.id, x: a.x, y: a.y, acted: a.acted, hp: a.hp, mp: a.mp }));

  // Verify app.js source: tutorial steps must NEVER directly mutate unit coordinates or call moveUnit
  const appSrc = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  const tutSection = appSrc.slice(appSrc.indexOf('startTutorialFlow(startStep = 0)'), appSrc.indexOf('setupDebugHooks()'));
  assert.doesNotMatch(tutSection, /\bbear\.x\s*=\s*/, 'Tutorial step view must never mutate bear.x directly');
  assert.doesNotMatch(tutSection, /\bcat\.x\s*=\s*/, 'Tutorial step view must never mutate cat.x directly');
  assert.doesNotMatch(tutSection, /this\.battle\.moveUnit\(/, 'Tutorial step/suggest must never auto-move units');
  assert.doesNotMatch(tutSection, /this\.confirmActionExecution\(/, 'Tutorial step/suggest must never auto-execute actions');

  // Verify ui.js source: 明白 (btnBoardTutorialAck) only renders next step and triggers onStepChange without performing game actions
  const uiSrc = fs.readFileSync(new URL('../js/render/ui.js', import.meta.url), 'utf8');
  const showTutFn = uiSrc.slice(uiSrc.indexOf('showBoardTutorial('), uiSrc.indexOf('setTutorialStep('));
  assert.match(showTutFn, /btnBoardTutorialAck/, 'ui.js must wire btnBoardTutorialAck');
  assert.match(showTutFn, /btnBoardTutorialClose/, 'ui.js must wire btnBoardTutorialClose');
  assert.doesNotMatch(showTutFn, /moveUnit|confirmAction/, 'Tutorial UI must not call battle mutations');

  // Drive the live UI: instantiate UIRenderer and click 明白 (btnBoardTutorialAck) through all steps
  const dom = {};
  const mockEl = (id) => ({
    id,
    style: { setProperty: () => {} },
    classList: { add() {}, remove() {}, toggle() {} },
    textContent: '',
    innerHTML: '',
    onclick: null,
    addEventListener: () => {},
    appendChild: () => {},
    setAttribute: () => {},
    getAttribute: () => null
  });
  global.document = {
    getElementById: (id) => dom[id] || (dom[id] = mockEl(id)),
    querySelector: () => mockEl('sel'),
    querySelectorAll: () => [],
    createElement: (tag) => mockEl(tag)
  };
  global.window = { addEventListener: () => {} };

  const { UIRenderer } = await import('../js/render/ui.js');
  const ui = new UIRenderer();
  let uiStep = 0;
  let completed = false;

  ui.showBoardTutorial(0, (s) => { uiStep = s; }, () => { completed = true; });
  assert.strictEqual(uiStep, 0, 'Tutorial must start at step 0');

  // Drive all 7 tutorial steps via real UI button clicks
  for (let s = 0; s < 7; s++) {
    for (const snap of initialSnap) {
      const u = battle.allies.find(a => a.id === snap.id);
      assert.strictEqual(u.x, snap.x, `Unit ${u.id} position X must not change on tutorial step ${s}`);
      assert.strictEqual(u.y, snap.y, `Unit ${u.id} position Y must not change on tutorial step ${s}`);
      assert.strictEqual(u.acted, snap.acted, `Unit ${u.id} acted flag must not change on tutorial step ${s}`);
      assert.strictEqual(u.hp, snap.hp, `Unit ${u.id} HP must not change on tutorial step ${s}`);
      assert.strictEqual(u.mp, snap.mp, `Unit ${u.id} MP must not change on tutorial step ${s}`);
    }
    // Click '明白' button
    dom['btnBoardTutorialAck'].onclick();
  }
  assert.ok(completed, 'Tutorial must complete after last step ack');
  assert.strictEqual(dom['tutorialBoardOverlay'].style.display, 'none');

  // Drive closing via close button '✕' (btnBoardTutorialClose)
  completed = false;
  ui.showBoardTutorial(3, () => {}, () => { completed = true; });
  dom['btnBoardTutorialClose'].onclick();
  assert.ok(completed, 'Clicking close button must dismiss tutorial');
  assert.strictEqual(dom['tutorialBoardOverlay'].style.display, 'none');

  // Verify units remain 100% untouched after close
  for (const snap of initialSnap) {
    const u = battle.allies.find(a => a.id === snap.id);
    assert.strictEqual(u.x, snap.x, `Unit ${u.id} position X must not change on tutorial close`);
    assert.strictEqual(u.y, snap.y, `Unit ${u.id} position Y must not change on tutorial close`);
    assert.strictEqual(u.acted, snap.acted, `Unit ${u.id} acted flag must not change on tutorial close`);
  }
});
