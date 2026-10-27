/**
 * js/engine/actioninfo.js
 * Info for the long-press card on attack / skill / magic buttons: power, element, hit, cost,
 * range, counter rules, and per-enemy predictions from the current tile.
 */
import { Board } from './board.js';
import { getAttackRangeTiles } from './pathfinding.js';
import { calculateCombat, canTargetUnit } from './combat.js';

const ELEMENT_NAMES = { fire: '火', water: '水', wood: '木', metal: '金', earth: '土', light: '光', dark: '暗' };
const AOE_NAMES = { cross: '十字範圍', line: '直線貫穿', cone: '扇形範圍', '3x3': '3×3範圍' };

function rangeOf(unit, actionType) {
  const src = actionType === 'attack' ? unit : (actionType === 'skill' ? unit.skill : unit.magic);
  const r = src?.range ?? unit.range ?? 1;
  return Array.isArray(r) ? [r[0], r[1]] : [r, r === 1 ? 1 : r].map((v, i) => (i === 0 && actionType !== 'attack' ? 1 : v));
}

export function getActionRangeTiles(battle, unit, actionType) {
  if (actionType === 'attack') {
    return getAttackRangeTiles(battle.board, unit, unit.x, unit.y).filter(t => !battle.board.isImpassable(t.x, t.y, false));
  }
  const [mn, mx] = rangeOf(unit, actionType);
  const tiles = [];
  const H = battle.board.rows || 13;
  const W = battle.board.cols || 10;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Board.manhattan(unit.x, unit.y, x, y);
    if (d >= mn && d <= mx && !battle.board.isImpassable(x, y, false)) tiles.push({ x, y });
  }
  return tiles;
}

export function getActionInfo(battle, unit, actionType) {
  const move = actionType === 'attack' ? null : (actionType === 'skill' ? unit.skill : unit.magic);
  if (actionType !== 'attack' && !move) return null;
  const tiles = getActionRangeTiles(battle, unit, actionType);
  const keys = new Set(tiles.map(t => `${t.x},${t.y}`));
  const [mn, mx] = actionType === 'attack' ? (Array.isArray(unit.range) ? unit.range : [unit.range ?? 1, unit.range ?? 1]) : rangeOf(unit, actionType);
  const isSupport = !!(move && (move.isHeal || move.selfBuff || move.isLightPlacement));
  const vision = battle.isFogActive?.() ? battle.calculateVisionMap() : null;
  const targets = [];
  if (!isSupport) {
    for (const e of battle.enemies) {
      if (e.hp <= 0 || !keys.has(`${e.x},${e.y}`)) continue;
      if (!canTargetUnit(unit, e, battle.board, vision)) continue;
      const pv = calculateCombat(unit, e, battle.board, {
        actionType, skill: move, attackerX: unit.x, attackerY: unit.y, allies: battle.allies, synergies: battle.synergies
      });
      const hit = Math.max(0, Math.min(100, Math.round(pv.hitRate ?? 100)));
      const crit = Math.max(0, Math.min(100, Math.round(pv.critRate ?? 0)));
      const dmg = Math.round(pv.expectedDamage ?? 0);
      let ko = 0;
      if (dmg >= e.hp) ko = hit;
      else if (Math.round(dmg * 1.5) >= e.hp) ko = Math.round(hit * crit / 100);
      targets.push({
        id: e.id, name: e.name, x: e.x, y: e.y, hp: e.hp, damage: dmg, hit, crit, koChance: ko,
        counter: !!pv.canCounter && ko < 100, counterDamage: pv.canCounter ? Math.round(pv.counterDamage ?? 0) : 0,
        direction: pv.directionMarker || ''
      });
    }
  }
  const power = actionType === 'attack' ? (unit.atk ?? 0) : (move.power ?? (move.isHeal ? (move.healAmount ?? 8) : null));
  return {
    actionType,
    name: actionType === 'attack' ? '普通攻擊' : move.name,
    desc: move?.desc || (unit.cls ? `${unit.cls}普攻` : '近身交鋒'),
    power,
    element: ELEMENT_NAMES[move?.element || (actionType === 'attack' ? unit.element : null)] || '無',
    cost: actionType === 'attack' ? 0 : (move.cost || 0),
    mp: unit.mp ?? 0,
    range: mn === mx ? `${mx}` : `${mn}-${mx}`,
    aoe: move?.aoe ? (AOE_NAMES[move.aoe] || move.aoe) : '單體',
    counterNote: isSupport ? '輔助 · 無反擊' : '正面可被反擊；背刺無反擊',
    baseHit: targets.length ? Math.round(targets.reduce((s, t) => s + t.hit, 0) / targets.length) : null,
    tiles,
    targets,
    isSupport
  };
}
