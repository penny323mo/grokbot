import { CHAPTERS } from '../../js/data/maps.js';
import { GUARDIAN_PROTOS } from '../../js/data/units.js';
import { Battle } from '../../js/engine/battle.js';
import { CampaignManager } from '../../js/engine/campaign.js';
import { RNG } from '../../js/engine/rng.js';
import { Board } from '../../js/engine/board.js';
import { calculateCombat, canTargetUnit } from '../../js/engine/combat.js';
import { getReachableTiles, getAttackRangeTiles } from '../../js/engine/pathfinding.js';

export function computeEnemyThreatTiles(battle) {
  const threat = new Set();
  const allUnits = battle.getAllLivingUnits();
  for (const e of battle.enemies) {
    if (e.hp <= 0) continue;
    const reach = getReachableTiles(battle.board, e, allUnits, { zoc: true, cursedTiles: battle.cursedTiles });
    reach.set(`${e.x},${e.y}`, { x: e.x, y: e.y });
    for (const pos of reach.values()) {
      for (const t of getAttackRangeTiles(battle.board, e, pos.x, pos.y)) {
        threat.add(`${t.x},${t.y}`);
      }
    }
  }
  return threat;
}

export function reasonableTurn(battle) {
  const { chapter, board } = battle;
  const threatTiles = computeEnemyThreatTiles(battle);

  // 1. NPC Escort Logic (e.g. Lantern Cart in Ch 1)
  const cart = battle.allies.find(u => u.id === 'lantern_cart' && u.hp > 0 && !u.acted);
  if (cart) {
    const reachable = Array.from(battle.getReachableFor(cart).values());
    if (reachable.length > 0) {
      const goal = chapter.escortGoal || { colMin: 6, rowMax: 2 };
      // Stay behind living combat allies and away from living enemies
      const livingFoes = battle.enemies.filter(e => e.hp > 0);
      const candidates = reachable.filter(m => {
        // Avoid stepping adjacent to any living enemy
        return !livingFoes.some(e => Board.manhattan(m.x, m.y, e.x, e.y) <= 1);
      });
      const valid = candidates.length > 0 ? candidates : reachable;
      valid.sort((a, b) => {
        const aGoal = a.x >= goal.colMin && a.y <= goal.rowMax;
        const bGoal = b.x >= goal.colMin && b.y <= goal.rowMax;
        if (aGoal && !bGoal) return -1;
        if (!aGoal && bGoal) return 1;
        const da = Math.max(0, goal.colMin - a.x) + Math.max(0, a.y - goal.rowMax);
        const db = Math.max(0, goal.colMin - b.x) + Math.max(0, b.y - goal.rowMax);
        return da - db;
      });
      battle.moveUnit(cart, valid[0].x, valid[0].y);
    }
    battle.confirmAction(cart, 'wait');
  }

  // 2. Combat Allies Turn
  const combatAllies = battle.allies.filter(u => u.hp > 0 && !u.acted && u.role !== 'objective' && u.id !== 'lantern_cart');

  for (const ally of combatAllies) {
    if (battle.status.finished || battle.phase === 'finished') break;
    if (ally.acted || ally.hp <= 0) continue;

    const reachable = Array.from(battle.getReachableFor(ally, { zoc: true }).values());
    if (reachable.length === 0) {
      battle.confirmAction(ally, 'wait');
      continue;
    }

    // Heuristic: Objective Goal Step (e.g. exitTiles in ch4 or shrineTiles in ch5)
    if (chapter.exitTiles || chapter.shrineTiles) {
      const targets = chapter.exitTiles || chapter.shrineTiles;
      let goalTile = null;
      for (const m of reachable) {
        if (targets.some(e => e.x === m.x && e.y === m.y)) {
          goalTile = m;
          break;
        }
      }
      if (goalTile) {
        battle.moveUnit(ally, goalTile.x, goalTile.y);
        battle.confirmAction(ally, 'wait');
        continue;
      }
    }

    // Heuristic: HEAL UNDER 40% (and heal vulnerable objective)
    const isHealer = ally.role === 'healer' || ally.skill?.isHeal || ally.magic?.isHeal;
    if (isHealer) {
      const criticallyInjured = battle.allies.filter(a => a.hp > 0 && ((a.hp / a.maxHp) < 0.40 || (a.role === 'objective' && (a.hp / a.maxHp) < 0.90)));
      if (criticallyInjured.length > 0) {
        criticallyInjured.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
        const patient = criticallyInjured[0];
        let bestHeal = null;
        for (const m of reachable) {
          const dist = Board.manhattan(m.x, m.y, patient.x, patient.y);
          const healRange = ally.skill?.range || 2;
          const maxR = typeof healRange === 'number' ? healRange : (Array.isArray(healRange) ? healRange[1] : 2);
          if (dist <= maxR) {
            const inThreat = threatTiles.has(`${m.x},${m.y}`) ? 1 : 0;
            if (!bestHeal || inThreat < bestHeal.inThreat) {
              bestHeal = { m, inThreat };
            }
          }
        }
        if (bestHeal) {
          battle.moveUnit(ally, bestHeal.m.x, bestHeal.m.y);
          battle.confirmAction(ally, 'skill', patient);
          continue;
        }
      }
    }

    // Heuristic: FOCUS FIRE & ATTACK EVALUATION
    const livingFoes = battle.enemies.filter(e => e.hp > 0);
    if (livingFoes.length === 0) {
      battle.confirmAction(ally, 'wait');
      continue;
    }

    let bestOption = null;
    let highestScore = -Infinity;

    for (const m of reachable) {
      const mKey = `${m.x},${m.y}`;
      const inThreat = threatTiles.has(mKey);
      const terrain = board.getTerrain(m.x, m.y);
      const terrainBonus = (terrain.def || 0) * 8 + (terrain.eva || 0) * 0.4;
      const isCursed = battle.cursedTiles && battle.cursedTiles.has(mKey);

      // Threat penalty: tanks don't care as much; squishies care a lot
      let baseTileScore = terrainBonus;
      if (inThreat) {
        baseTileScore -= (ally.role === 'tank' || chapter.key === 'siege' ? 10 : 35);
      }
      if (isCursed) baseTileScore -= 40;

      // Check all valid actions from tile m
      const rangeTiles = getAttackRangeTiles(board, ally, m.x, m.y);

      for (const foe of livingFoes) {
        if (!canTargetUnit(ally, foe, board) && Board.manhattan(m.x, m.y, foe.x, foe.y) > 1) {
          continue;
        }

        const candidateActions = [];
        // Attack
        if (rangeTiles.some(t => t.x === foe.x && t.y === foe.y)) {
          candidateActions.push({ type: 'attack', skill: null });
        }
        // Offensive skill
        if (ally.skill && !ally.skill.isHeal && !ally.skill.isLightPlacement && ally.mp >= (ally.skill.cost || 0)) {
          const sRange = ally.skill.range || 1;
          const sMin = Array.isArray(sRange) ? sRange[0] : 1;
          const sMax = Array.isArray(sRange) ? sRange[1] : (typeof sRange === 'number' ? sRange : 1);
          const d = Board.manhattan(m.x, m.y, foe.x, foe.y);
          if (d >= sMin && d <= sMax) {
            candidateActions.push({ type: 'skill', skill: ally.skill });
          }
        }
        // Offensive magic
        if (ally.magic && !ally.magic.isHeal && !ally.magic.selfBuff && ally.mp >= (ally.magic.cost || 0)) {
          const mRange = ally.magic.range || 2;
          const mMin = Array.isArray(mRange) ? mRange[0] : 1;
          const mMax = Array.isArray(mRange) ? mRange[1] : (typeof mRange === 'number' ? mRange : 2);
          const d = Board.manhattan(m.x, m.y, foe.x, foe.y);
          if (d >= mMin && d <= mMax) {
            candidateActions.push({ type: 'magic', skill: ally.magic });
          }
        }

        for (const act of candidateActions) {
          const combat = calculateCombat(ally, foe, board, {
            attackerX: m.x,
            attackerY: m.y,
            actionType: act.type,
            skill: act.skill
          });

          let score = baseTileScore + combat.expectedDamage * 2.2;
          // Focus fire: Prioritize kills
          if (combat.willKill) score += 80;
          // Focus fire: Prioritize lower remaining HP %
          score += (1 - (foe.hp / (foe.maxHp || 20))) * 35;
          // Flank & Back attack bonuses
          if (combat.isBackAttack) score += 40;
          else if (combat.isSideAttack) score += 20;
          // Elemental advantage
          if (foe.element === 'water' && ally.id === 'tanuki_mage') score += 45;
          // Knockback into water insta-KO
          if (combat.knockbackResult?.isInstaKill) score += 150;
          // Avoid frontal attack on heavy shields
          if (combat.isFrontAttack && (foe.role === 'shield_guard' || foe.trait?.id === 'shield_block')) score -= 40;

          // Objective protection bonus:
          if (chapter.objectiveType === 'protect_lantern') {
            const lantern = battle.allies.find(a => a.id === 'market_lantern');
            if (lantern && Board.manhattan(foe.x, foe.y, lantern.x, lantern.y) <= 4) {
              score += (6 - Board.manhattan(foe.x, foe.y, lantern.x, lantern.y)) * 30;
            }
          } else if (chapter.objectiveType === 'hold_gate') {
            const gateTiles = chapter.gateTiles || [{ x: 4, y: 6 }, { x: 5, y: 6 }];
            const nearGate = gateTiles.some(g => Board.manhattan(foe.x, foe.y, g.x, g.y) <= 2);
            if (nearGate) score += 60;
          } else if (chapter.objectiveType === 'escort') {
            if (cart && Board.manhattan(foe.x, foe.y, cart.x, cart.y) <= 2) score += 80;
          }

          if (score > highestScore) {
            highestScore = score;
            bestOption = { m, action: act.type, target: foe };
          }
        }
      }
    }

    if (bestOption) {
      battle.moveUnit(ally, bestOption.m.x, bestOption.m.y);
      battle.confirmAction(ally, bestOption.action, bestOption.target);
      continue;
    }

    // Heuristic: HOLD CHOKES & DEFENSIVE FORMATION
    // If no good attack is available, hold position near the objective or choke, staying out of danger
    let bestHold = null;
    let bestHoldScore = -Infinity;

    // Define choke anchor per chapter
    let anchor = null;
    if (chapter.objectiveType === 'hold_gate') {
      anchor = chapter.gateTiles ? chapter.gateTiles[0] : { x: 4, y: 7 };
    } else if (chapter.objectiveType === 'protect_lantern') {
      anchor = { x: 4, y: 6 };
    } else if (chapter.objectiveType === 'escort' && cart) {
      anchor = { x: cart.x, y: cart.y };
    } else if (chapter.key === 'siege') {
      anchor = { x: 4.5, y: 3 };
    } else if (chapter.shrineTiles) {
      anchor = chapter.shrineTiles[0];
    } else {
      // General anchor: center of living enemies
      const avgX = livingFoes.reduce((s, e) => s + e.x, 0) / livingFoes.length;
      const avgY = livingFoes.reduce((s, e) => s + e.y, 0) / livingFoes.length;
      anchor = { x: avgX, y: avgY };
    }

    for (const m of reachable) {
      const mKey = `${m.x},${m.y}`;
      const inThreat = threatTiles.has(mKey);
      const ter = board.getTerrain(m.x, m.y);
      let holdScore = (ter.def || 0) * 12 + (ter.eva || 0) * 0.5;

      // Strongly stay out of red threat zone when holding (unless pushing siege fortress)
      if (inThreat) holdScore -= (ally.role === 'tank' || (chapter.key === 'siege' && m.y <= 9) ? 15 : 50);
      if (battle.cursedTiles && battle.cursedTiles.has(mKey)) holdScore -= 60;

      // Distance to choke anchor
      const distToAnchor = Board.manhattan(m.x, m.y, anchor.x, anchor.y);
      holdScore -= distToAnchor * (chapter.key === 'siege' ? 5 : 3);

      if (holdScore > bestHoldScore) {
        bestHoldScore = holdScore;
        bestHold = m;
      }
    }

    if (bestHold) {
      battle.moveUnit(ally, bestHold.x, bestHold.y);
    }
    battle.confirmAction(ally, 'wait');
  }

  for (const n of battle.allies.filter(u => u.hp > 0 && !u.acted)) {
    battle.confirmAction(n, 'wait');
  }
}

export function playReasonable(ch, seed, customSquad = null) {
  const camp = new CampaignManager();
  const r = new RNG(seed);
  // Sensible default squad: Tank + Healer + Melee + Ranged/Mage per chapter context
  let squadIds = customSquad;
  if (!squadIds) {
    if (ch.id === 3) {
      squadIds = ['bear_guard', 'tea_master', 'cat_patrol', 'tanuki_mage', 'lantern_crafter'];
    } else if (ch.id === 4 || ch.id === 6) {
      squadIds = ['bear_guard', 'tea_master', 'crane_rider', 'cat_patrol', 'tanuki_mage', 'fox_maiden'];
    } else {
      const balanced = ['bear_guard', 'tea_master', 'cat_patrol', 'tanuki_mage', 'crane_rider', 'lantern_crafter', 'fox_maiden'];
      squadIds = balanced.slice(0, ch.squadLimit);
    }
  }
  const squad = squadIds.map(id => camp.getUnitInstance(id));
  const b = new Battle(ch, squad, 'inspire', camp, r);
  let firstDeaths = [];
  for (let t = 0; t < 40 && !b.status?.finished && b.phase !== 'finished'; t++) {
    reasonableTurn(b);
    if (b.phase === 'finished') break;
    b.endTurn();
    if (t === 0) {
      firstDeaths = b.allies.filter(a => a.hp <= 0).map(a => a.id);
    }
  }
  return { status: b.status, firstDeaths, turn: b.currentTurn };
}
