/**
 * js/engine/autobattle.js
 * Objective-aware automated combat bot for 燈影軍略 (v4).
 * Supports styles: 'balanced' (均衡), 'aggressive' (進攻), 'defensive' (防守).
 * Follows chapter objectives (escort 燈車, shrine reach, gate breach).
 * Strictly guarantees ZERO friendly fire / self damage.
 */

import { Board } from './board.js';
import { calculateCombat, canTargetUnit, getClassTriangleMultiplier } from './combat.js';
import { getReachableTiles, getAttackRangeTiles } from './pathfinding.js';

export function computeAutoAction(battle, ally, style = 'balanced') {
  if (!ally || ally.hp <= 0 || ally.acted) return null;
  const { chapter, board } = battle;
  const allUnits = battle.getAllLivingUnits();
  const reachableMap = getReachableTiles(board, ally, allUnits, { zoc: true, cursedTiles: battle.cursedTiles });
  reachableMap.set(`${ally.x},${ally.y}`, { x: ally.x, y: ally.y });
  const reachableList = Array.from(reachableMap.values());

  // 1. NPC Escort Logic for lantern_cart
  if (ally.id === 'lantern_cart') {
    const goal = chapter.escortGoal || { colMin: 6, rowMax: 2 };
    const foes = battle.enemies.filter(e => e.hp > 0);
    const safeMoves = reachableList.filter(m => !foes.some(e => Board.manhattan(m.x, m.y, e.x, e.y) <= 1));
    const pool = safeMoves.length > 0 ? safeMoves : reachableList;
    pool.sort((a, b) => {
      const da = Math.max(0, goal.colMin - a.x) + Math.max(0, a.y - goal.rowMax);
      const db = Math.max(0, goal.colMin - b.x) + Math.max(0, b.y - goal.rowMax);
      return da - db;
    });
    return { move: pool[0] || { x: ally.x, y: ally.y }, type: 'wait' };
  }

  // 2. Objective Goal Rush (Exit tiles in ch4, Shrine tiles in ch5)
  if (chapter.exitTiles || chapter.shrineTiles) {
    const goals = chapter.exitTiles || chapter.shrineTiles;
    for (const m of reachableList) {
      if (goals.some(g => g.x === m.x && g.y === m.y)) {
        return { move: m, type: 'wait' };
      }
    }
  }

  // 3. Healer Support Logic (tea_master)
  const isHealer = ally.role === 'healer' || ally.skill?.isHeal || ally.magic?.isHeal;
  if (isHealer) {
    const injuredAllies = battle.allies.filter(a => a.hp > 0 && a.hp < a.maxHp && a.id !== ally.id);
    if (injuredAllies.length > 0) {
      // Prioritize critically injured or lantern_cart
      injuredAllies.sort((a, b) => {
        if (a.id === 'lantern_cart' && a.hp < a.maxHp * 0.8) return -1;
        if (b.id === 'lantern_cart' && b.hp < b.maxHp * 0.8) return 1;
        return (a.hp / a.maxHp) - (b.hp / b.maxHp);
      });
      const patient = injuredAllies[0];
      const healThreshold = style === 'aggressive' ? 0.45 : (style === 'defensive' ? 0.85 : 0.65);
      if (patient.hp / patient.maxHp <= healThreshold || patient.id === 'lantern_cart') {
        const healActionType = (ally.magic?.isHeal && ally.mp >= (ally.magic.cost || 3) && patient.hp / patient.maxHp < 0.4) ? 'magic' : 'skill';
        const healRange = (healActionType === 'magic' ? ally.magic?.range : ally.skill?.range) || 2;
        const maxR = typeof healRange === 'number' ? healRange : (Array.isArray(healRange) ? healRange[1] : 2);
        for (const m of reachableList) {
          if (Board.manhattan(m.x, m.y, patient.x, patient.y) <= maxR) {
            return { move: m, type: healActionType, target: patient };
          }
        }
      }
    }
  }

  // 4. Tank Self-Buff or Protection (bear_guard)
  if (ally.id === 'bear_guard' && ally.magic?.selfBuff && ally.mp >= (ally.magic.cost || 3) && !ally.hasBuff) {
    const nearFoes = battle.enemies.filter(e => e.hp > 0 && Board.manhattan(ally.x, ally.y, e.x, e.y) <= 3);
    if (nearFoes.length >= 2 || style === 'defensive') {
      return { move: { x: ally.x, y: ally.y }, type: 'magic', target: ally };
    }
  }

  // 5. Evaluate Combat Targets
  const livingFoes = battle.enemies.filter(e => e.hp > 0);
  let bestAttack = null;
  let highestScore = -Infinity;

  for (const m of reachableList) {
    const rangeTiles = getAttackRangeTiles(board, ally, m.x, m.y);
    const mTerrain = board.getTerrain(m.x, m.y);
    const terrainDef = (mTerrain.defBonus || 0) * 4;

    for (const foe of livingFoes) {
      if (!canTargetUnit(ally, foe, board) && Board.manhattan(m.x, m.y, foe.x, foe.y) > 1) {
        continue;
      }

      // Collect available offensive actions
      const actions = [];
      if (rangeTiles.some(t => t.x === foe.x && t.y === foe.y)) {
        actions.push({ type: 'attack', skill: null, cost: 0 });
      }
      if (ally.skill && !ally.skill.isHeal && !ally.skill.isLightPlacement && ally.mp >= (ally.skill.cost || 2)) {
        const sR = ally.skill.range || 1;
        const sMin = Array.isArray(sR) ? sR[0] : 1;
        const sMax = Array.isArray(sR) ? sR[1] : (typeof sR === 'number' ? sR : 1);
        const dist = Board.manhattan(m.x, m.y, foe.x, foe.y);
        if (dist >= sMin && dist <= sMax) {
          actions.push({ type: 'skill', skill: ally.skill, cost: ally.skill.cost || 2 });
        }
      }
      if (ally.magic && !ally.magic.isHeal && !ally.magic.selfBuff && ally.mp >= (ally.magic.cost || 3)) {
        const mR = ally.magic.range || 2;
        const mMin = Array.isArray(mR) ? mR[0] : 1;
        const mMax = Array.isArray(mR) ? mR[1] : (typeof mR === 'number' ? mR : 2);
        const dist = Board.manhattan(m.x, m.y, foe.x, foe.y);
        if (dist >= mMin && dist <= mMax) {
          actions.push({ type: 'magic', skill: ally.magic, cost: ally.magic.cost || 3 });
        }
      }

      for (const act of actions) {
        const combat = calculateCombat(ally, foe, board, {
          attackerX: m.x,
          attackerY: m.y,
          actionType: act.type,
          skill: act.skill,
          aiEval: true
        });

        let score = combat.expectedDamage * 2.5;
        if (combat.willKill) score += 60;
        if (combat.isBackAttack) score += 30;
        if (combat.isSideAttack) score += 12;
        if (combat.knockbackResult?.isInstaKill) score += 120; // Instant water KO!
        if (combat.classTriangle?.relation === 'advantage') score += 20;

        // Style adjustments
        if (style === 'aggressive') {
          score += combat.expectedDamage * 1.5;
          if (act.type !== 'attack') score += 10;
        } else if (style === 'defensive') {
          score += terrainDef;
          if (combat.canCounter) score -= combat.counterDamage * 2;
        }

        // Penalty for high enemy counter damage
        if (combat.canCounter && !combat.willKill) {
          score -= combat.counterDamage * 1.2;
        }

        if (score > highestScore) {
          highestScore = score;
          bestAttack = { move: m, type: act.type, target: foe, skill: act.skill };
        }
      }
    }
  }

  if (bestAttack) return bestAttack;

  // 6. Non-combat movement: Advance towards objective or nearest threat
  let fallbackMove = { x: ally.x, y: ally.y };
  let bestDistScore = -Infinity;

  // Escort or goal anchor
  const cart = battle.allies.find(a => a.id === 'lantern_cart' && a.hp > 0);
  const targetX = cart ? cart.x : (livingFoes[0]?.x ?? 5);
  const targetY = cart ? cart.y - 1 : (livingFoes[0]?.y ?? 4);

  for (const m of reachableList) {
    const dist = Board.manhattan(m.x, m.y, targetX, targetY);
    const terrain = board.getTerrain(m.x, m.y);
    let score = -dist * 5 + (terrain.defBonus || 0) * 4 + (terrain.evaBonus || 0) * 0.2;
    if (terrain.isVillage) score += 15; // Village heal bonus!
    if (style === 'defensive') score += (terrain.defBonus || 0) * 8;
    if (score > bestDistScore) {
      bestDistScore = score;
      fallbackMove = m;
    }
  }

  return { move: fallbackMove, type: 'wait' };
}
