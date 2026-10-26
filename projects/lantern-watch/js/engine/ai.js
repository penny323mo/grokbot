/**
 * js/engine/ai.js
 * Role-based deterministic enemy AI for 燈影軍略 (v4).
 * Handles archer kite, healer backline support, cavalry charge & flanking,
 * commander position holding, shrouded assassin stealth, and boss cluster AoE.
 */

import { Board } from './board.js';
import { getReachableTiles, getAttackRangeTiles } from './pathfinding.js';
import { calculateCombat, canTargetUnit } from './combat.js';

export function decideEnemyTurn(enemy, battleState, rng) {
  const { board, allies, enemies } = battleState;
  // Note: in battleState, allies = player guardians; enemies = enemy squad
  let playerUnits = allies.filter(u => u.hp > 0);
  const enemyUnits = enemies.filter(u => u.hp > 0 && u.id !== enemy.id);
  const allUnits = [...allies, ...enemies];

  if (playerUnits.length === 0) return { type: 'wait', move: { x: enemy.x, y: enemy.y } };

  // AI respects fog of war: only targets player units within enemy vision
  if (battleState.isFogActive && battleState.isFogActive()) {
    const enemyVision = battleState.calculateEnemyVisionMap ? battleState.calculateEnemyVisionMap() : null;
    if (enemyVision) {
      const visiblePlayers = playerUnits.filter(u => enemyVision.has(`${u.x},${u.y}`));
      if (visiblePlayers.length > 0) {
        playerUnits = visiblePlayers;
      }
    }
  }

  // Calculate reachable movement tiles
  const reachable = getReachableTiles(board, enemy, allUnits);
  const reachableList = Array.from(reachable.values());

  const role = enemy.role || 'fighter';

  switch (role) {
    case 'commander':
      return decideCommanderAction(enemy, reachableList, playerUnits, board, rng);
    case 'shield_guard':
      return decideShieldGuardAction(enemy, reachableList, playerUnits, board, rng);
    case 'healer':
      return decideHealerAction(enemy, reachableList, enemyUnits, playerUnits, board, rng);
    case 'archer':
      return decideArcherAction(enemy, reachableList, playerUnits, board, rng);
    case 'fire_archer':
      return decideFireArcherAction(enemy, reachableList, playerUnits, board, rng);
    case 'cavalry':
      return decideCavalryAction(enemy, reachableList, playerUnits, board, rng);
    case 'shrouded':
    case 'scout':
      return decideScoutAction(enemy, reachableList, playerUnits, board, rng);
    case 'siege_engine':
      return decideSiegeEngineAction(enemy, reachableList, playerUnits, board, rng);
    case 'sorcerer':
      return decideSorcererAction(enemy, reachableList, playerUnits, board, rng);
    case 'boss':
      return decideBossAction(enemy, reachableList, playerUnits, board, rng);
    default:
      return decideDefaultAction(enemy, reachableList, playerUnits, board, rng);
  }
}

/**
 * Commander: Holds position on guard tile, faces threat, only attacks adjacent enemies
 */
function decideCommanderAction(enemy, reachableList, playerUnits, board, rng) {
  // Find nearest player unit to face
  let nearestDist = Infinity;
  let nearestUnit = null;
  for (const p of playerUnits) {
    const d = Board.manhattan(enemy.x, enemy.y, p.x, p.y);
    if (d < nearestDist) {
      nearestDist = d;
      nearestUnit = p;
    }
  }

  // Update facing toward nearest threat
  const newFacing = nearestUnit && nearestUnit.x < enemy.x ? -1 : 1;

  // Check if any player unit is currently adjacent
  const adjacentTargets = playerUnits.filter(p => Board.manhattan(enemy.x, enemy.y, p.x, p.y) === 1);
  if (adjacentTargets.length > 0) {
    // Pick squishiest adjacent target
    adjacentTargets.sort((a, b) => a.hp - b.hp);
    const target = adjacentTargets[0];
    return {
      type: 'attack',
      move: { x: enemy.x, y: enemy.y },
      target,
      newFacing
    };
  }

  // Otherwise hold ground
  return {
    type: 'wait',
    move: { x: enemy.x, y: enemy.y },
    newFacing
  };
}

/**
 * Healer: Stay >=2 tiles behind frontline, heal lowest-HP% ally in range
 */
function decideHealerAction(enemy, reachableList, woundedAllies, playerUnits, board, rng) {
  const needsHeal = woundedAllies.filter(u => u.hp < u.maxHp);

  // If allies need healing
  if (needsHeal.length > 0) {
    // Sort by lowest HP percentage
    needsHeal.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
    const target = needsHeal[0];

    // Find reachable tiles that can heal target (range <= 3) while staying as safe as possible from player units
    const validMoves = [];
    for (const m of reachableList) {
      const distToTarget = Board.manhattan(m.x, m.y, target.x, target.y);
      if (distToTarget >= 1 && distToTarget <= 3) {
        // Distance to nearest player
        let minDistToPlayer = Infinity;
        for (const p of playerUnits) {
          minDistToPlayer = Math.min(minDistToPlayer, Board.manhattan(m.x, m.y, p.x, p.y));
        }
        validMoves.push({ move: m, minDistToPlayer });
      }
    }

    if (validMoves.length > 0) {
      // Pick move with safest distance from players
      validMoves.sort((a, b) => b.minDistToPlayer - a.minDistToPlayer);
      const chosen = validMoves[0].move;
      return {
        type: 'heal',
        move: chosen,
        target,
        healAmount: 8
      };
    }
  }

  // If no heal needed, move toward friendly cluster while staying >= 2 tiles away from players
  let bestMove = reachableList[0];
  let bestScore = -Infinity;

  for (const m of reachableList) {
    let minDistToPlayer = Infinity;
    for (const p of playerUnits) {
      minDistToPlayer = Math.min(minDistToPlayer, Board.manhattan(m.x, m.y, p.x, p.y));
    }

    // Heavy penalty for getting within 2 tiles of any player
    const safetyScore = minDistToPlayer < 2 ? -100 : minDistToPlayer * 5;

    // Proximity to allies
    let allyDistSum = 0;
    for (const a of woundedAllies) {
      allyDistSum += Board.manhattan(m.x, m.y, a.x, a.y);
    }
    const clusterScore = woundedAllies.length > 0 ? -allyDistSum / woundedAllies.length : 0;

    const score = safetyScore + clusterScore;
    if (score > bestScore) {
      bestScore = score;
      bestMove = m;
    }
  }

  return { type: 'wait', move: bestMove };
}

/**
 * Archer: Stay at max range (2-3), prefer hill tiles, kite if an enemy is adjacent
 */
function decideArcherAction(enemy, reachableList, playerUnits, board, rng) {
  // Check if player unit is adjacent to current position
  const isThreatened = playerUnits.some(p => Board.manhattan(enemy.x, enemy.y, p.x, p.y) === 1);

  let bestAction = null;
  let bestScore = -Infinity;

  for (const m of reachableList) {
    const terrain = board.getTerrain(m.x, m.y);
    const isHill = terrain.char === 'h';
    const rangeTiles = getAttackRangeTiles(board, enemy, m.x, m.y);

    // Check minimum distance to players from this tile
    let minDistToPlayer = Infinity;
    for (const p of playerUnits) {
      minDistToPlayer = Math.min(minDistToPlayer, Board.manhattan(m.x, m.y, p.x, p.y));
    }

    // If threatened, prioritize escaping adjacent contact (minDistToPlayer > 1)
    if (isThreatened && minDistToPlayer === 1) {
      continue; // Skip tiles that remain adjacent if possible
    }

    // Check targets attackable from this tile
    for (const p of playerUnits) {
      if (!canTargetUnit(enemy, p, board)) continue;
      const inRange = rangeTiles.some(t => t.x === p.x && t.y === p.y);
      if (inRange) {
        const combat = calculateCombat(enemy, p, board, { attackerX: m.x, attackerY: m.y });
        let score = combat.expectedDamage * 2;
        if (isHill) score += 15; // Prefers hill制高點
        if (combat.willKill) score += 50;
        // Prefer max range (distance 3) over close combat
        const dist = Board.manhattan(m.x, m.y, p.x, p.y);
        score += dist * 5;
        // Bonus for safer distance
        score += minDistToPlayer * 4;

        if (score > bestScore) {
          bestScore = score;
          bestAction = {
            type: 'attack',
            move: m,
            target: p,
            newFacing: p.x < m.x ? -1 : 1
          };
        }
      }
    }
  }

  if (bestAction) return bestAction;

  // If cannot attack, move toward best vantage point (hill or safe distance)
  let bestMove = reachableList[0];
  let bestMoveScore = -Infinity;
  for (const m of reachableList) {
    const terrain = board.getTerrain(m.x, m.y);
    let s = (terrain.char === 'h') ? 20 : 0;
    // Prefer distance ~3 from nearest player
    let minDist = Infinity;
    for (const p of playerUnits) {
      minDist = Math.min(minDist, Board.manhattan(m.x, m.y, p.x, p.y));
    }
    s -= Math.abs(minDist - 3) * 5;
    if (s > bestMoveScore) {
      bestMoveScore = s;
      bestMove = m;
    }
  }

  return { type: 'wait', move: bestMove };
}

/**
 * Siege Engine: High-ground bombarder with range [3, 5], blind zone at range 1-2
 */
function decideSiegeEngineAction(enemy, reachableList, playerUnits, board, rng) {
  let bestAction = null;
  let bestScore = -Infinity;

  for (const m of reachableList) {
    const rangeTiles = getAttackRangeTiles(board, enemy, m.x, m.y);

    for (const p of playerUnits) {
      if (!canTargetUnit(enemy, p, board)) continue;
      const inRange = rangeTiles.some(t => t.x === p.x && t.y === p.y);
      if (inRange) {
        const combat = calculateCombat(enemy, p, board, { attackerX: m.x, attackerY: m.y });
        let score = combat.expectedDamage * 2;
        let clusterCount = 0;
        for (const other of playerUnits) {
          if (other.id !== p.id && Board.manhattan(p.x, p.y, other.x, other.y) <= 2) {
            clusterCount++;
          }
        }
        score += clusterCount * 8;
        if (score > bestScore) {
          bestScore = score;
          bestAction = {
            type: 'attack',
            move: m,
            target: p,
            newFacing: p.x < m.x ? -1 : 1
          };
        }
      }
    }
  }

  if (bestAction) return bestAction;
  return { type: 'wait', move: { x: enemy.x, y: enemy.y } };
}

/**
 * Cavalry: Target most exposed (fewest adjacent allies) or backline unit, charge >=3 tiles
 */
function decideCavalryAction(enemy, reachableList, playerUnits, board, rng) {
  let bestAction = null;
  let bestScore = -Infinity;

  for (const m of reachableList) {
    const movedTiles = Math.abs(m.x - enemy.x) + Math.abs(m.y - enemy.y);
    const getsChargeBonus = movedTiles >= 3;

    for (const p of playerUnits) {
      if (!canTargetUnit(enemy, p, board)) continue;
      const dist = Board.manhattan(m.x, m.y, p.x, p.y);
      if (dist === 1) {
        // Evaluate target exposure (how many allies are protecting p)
        let protectingAllies = 0;
        for (const other of playerUnits) {
          if (other.id !== p.id && Board.manhattan(p.x, p.y, other.x, other.y) === 1) {
            protectingAllies++;
          }
        }

        const combat = calculateCombat(enemy, p, board, {
          attackerX: m.x,
          attackerY: m.y,
          movedTiles
        });

        let score = combat.expectedDamage;
        if (combat.willKill) score += 60;
        if (getsChargeBonus) score += 20; // 衝鋒 bonus
        if (protectingAllies === 0) score += 25; // 針對落單目標
        if (p.role === 'healer' || p.role === 'archer') score += 20; // 針對後排

        if (score > bestScore) {
          bestScore = score;
          bestAction = {
            type: 'attack',
            move: m,
            target: p,
            movedTiles,
            newFacing: p.x < m.x ? -1 : 1
          };
        }
      }
    }
  }

  if (bestAction) return bestAction;

  // Move toward most isolated or squishy player
  let bestMove = reachableList[0];
  let minTargetDist = Infinity;
  for (const m of reachableList) {
    for (const p of playerUnits) {
      const d = Board.manhattan(m.x, m.y, p.x, p.y);
      if (d < minTargetDist) {
        minTargetDist = d;
        bestMove = m;
      }
    }
  }

  return { type: 'wait', move: bestMove };
}

/**
 * Shrouded: Stealthily prioritize lowest-DEF unit, approach through cover
 */
function decideShroudedAction(enemy, reachableList, playerUnits, board, rng) {
  let bestAction = null;
  let bestScore = -Infinity;

  for (const m of reachableList) {
    const inCover = board.getTerrain(m.x, m.y).char === 'f' || board.getTerrain(m.x, m.y).char === 'm';

    for (const p of playerUnits) {
      if (!canTargetUnit(enemy, p, board)) continue;
      const dist = Board.manhattan(m.x, m.y, p.x, p.y);
      if (dist === 1) {
        const combat = calculateCombat(enemy, p, board, { attackerX: m.x, attackerY: m.y });
        let score = combat.expectedDamage * 2;
        if (combat.isBackAttack) score += 20; // 背擊
        if (combat.willKill) score += 50;
        score += (30 - (p.def || 0)) * 5; // Heavily prioritize lowest-DEF unit
        if (inCover) score += 10;

        if (score > bestScore) {
          bestScore = score;
          bestAction = {
            type: 'attack',
            move: m,
            target: p,
            newFacing: p.x < m.x ? -1 : 1
          };
        }
      }
    }
  }

  if (bestAction) return bestAction;

  // Move towards squishiest target while preferring forest/market tiles
  let bestMove = reachableList[0];
  let bestScoreMove = -Infinity;
  const lowestDefPlayer = [...playerUnits].sort((a, b) => (a.def || 0) - (b.def || 0))[0];

  for (const m of reachableList) {
    const dist = Board.manhattan(m.x, m.y, lowestDefPlayer.x, lowestDefPlayer.y);
    const inCover = board.getTerrain(m.x, m.y).char === 'f' || board.getTerrain(m.x, m.y).char === 'm';
    let s = -dist * 5 + (inCover ? 12 : 0);
    if (s > bestScoreMove) {
      bestScoreMove = s;
      bestMove = m;
    }
  }

  return { type: 'wait', move: bestMove };
}

/**
 * Boss: AoE mist on clusters of >=2 player units, else standard attack
 */
function decideBossAction(enemy, reachableList, playerUnits, board, rng) {
  // Check for clusters of >= 2 units within range 2
  let bestClusterMove = null;
  let maxClusterCount = 0;
  let bestClusterTargets = [];

  for (const m of reachableList) {
    const inRange = playerUnits.filter(p => Board.manhattan(m.x, m.y, p.x, p.y) <= 2);
    if (inRange.length >= 2 && inRange.length > maxClusterCount) {
      maxClusterCount = inRange.length;
      bestClusterMove = m;
      bestClusterTargets = inRange;
    }
  }

  if (bestClusterMove && maxClusterCount >= 2) {
    return {
      type: 'aoe_skill',
      skillId: 'abyssal_mist',
      name: '迷霧降臨',
      move: bestClusterMove,
      targets: bestClusterTargets,
      damage: 10,
      newFacing: bestClusterTargets[0].x < bestClusterMove.x ? -1 : 1
    };
  }

  // Otherwise pick strongest single target attack
  return decideDefaultAction(enemy, reachableList, playerUnits, board, rng);
}

/**
 * Shield Guard: Holds choke points / advances steadily, always turns facing to directly face nearest threat
 */
function decideShieldGuardAction(enemy, reachableList, playerUnits, board, rng) {
  // Find nearest player unit
  let nearestDist = Infinity;
  let nearestUnit = null;
  for (const p of playerUnits) {
    const d = Board.manhattan(enemy.x, enemy.y, p.x, p.y);
    if (d < nearestDist) {
      nearestDist = d;
      nearestUnit = p;
    }
  }

  // Always orient facing toward the nearest player unit so frontal block (70%) is active
  const newFacing = nearestUnit && nearestUnit.x < enemy.x ? -1 : 1;

  let bestAction = null;
  let bestScore = -Infinity;

  for (const m of reachableList) {
    for (const p of playerUnits) {
      if (!canTargetUnit(enemy, p, board)) continue;
      const dist = Board.manhattan(m.x, m.y, p.x, p.y);
      if (dist === 1) {
        const combat = calculateCombat(enemy, p, board, { attackerX: m.x, attackerY: m.y });
        let score = combat.expectedDamage;
        if (combat.willKill) score += 50;
        // Face the attacked target
        const facingTowardsTarget = p.x < m.x ? -1 : 1;

        if (score > bestScore) {
          bestScore = score;
          bestAction = {
            type: 'attack',
            move: m,
            target: p,
            newFacing: facingTowardsTarget
          };
        }
      }
    }
  }

  if (bestAction) return bestAction;

  // Move toward nearest player unit while keeping facing toward them
  let bestMove = reachableList[0];
  let minD = Infinity;
  for (const m of reachableList) {
    for (const p of playerUnits) {
      const d = Board.manhattan(m.x, m.y, p.x, p.y);
      if (d < minD) {
        minD = d;
        bestMove = m;
      }
    }
  }

  return { type: 'wait', move: bestMove, newFacing };
}

/**
 * Sorcerer: Casts AoE thunder spell when >=2 players cluster within range, else magic attack
 */
function decideSorcererAction(enemy, reachableList, playerUnits, board, rng) {
  // Check for clusters of >= 2 units within range 2
  let bestClusterMove = null;
  let maxClusterCount = 0;
  let bestClusterTargets = [];

  for (const m of reachableList) {
    const targetsInAoe = playerUnits.filter(p => Board.manhattan(m.x, m.y, p.x, p.y) <= 2 && canTargetUnit(enemy, p, board));
    if (targetsInAoe.length > maxClusterCount) {
      maxClusterCount = targetsInAoe.length;
      bestClusterMove = m;
      bestClusterTargets = targetsInAoe;
    }
  }

  // If cluster of >= 2 units and MP available (>= 4), unleash AoE magic
  if (maxClusterCount >= 2 && enemy.mp >= 4) {
    return {
      type: 'aoe',
      move: bestClusterMove,
      targets: bestClusterTargets,
      damage: 10,
      element: 'thunder',
      mpCost: 4
    };
  }

  // Otherwise perform single-target magic attack (range 1-2)
  let bestAction = null;
  let bestScore = -Infinity;

  for (const m of reachableList) {
    // Keep 2 tiles distance from melee attackers if possible
    let minDistToPlayer = Infinity;
    for (const p of playerUnits) {
      minDistToPlayer = Math.min(minDistToPlayer, Board.manhattan(m.x, m.y, p.x, p.y));
    }

    for (const p of playerUnits) {
      if (!canTargetUnit(enemy, p, board)) continue;
      const dist = Board.manhattan(m.x, m.y, p.x, p.y);
      if (dist >= 1 && dist <= 2) {
        const combat = calculateCombat(enemy, p, board, {
          attackerX: m.x,
          attackerY: m.y,
          actionType: 'magic'
        });
        let score = combat.expectedDamage;
        if (combat.willKill) score += 50;
        if (minDistToPlayer >= 2) score += 15; // Prefers staying at range

        if (score > bestScore) {
          bestScore = score;
          bestAction = {
            type: 'magic',
            move: m,
            target: p,
            element: 'thunder',
            newFacing: p.x < m.x ? -1 : 1
          };
        }
      }
    }
  }

  if (bestAction) return bestAction;

  // Move keeping distance (dist ~ 2) from nearest player
  let bestMove = reachableList[0];
  let bestScoreMove = -Infinity;
  for (const m of reachableList) {
    let minDist = Infinity;
    for (const p of playerUnits) {
      minDist = Math.min(minDist, Board.manhattan(m.x, m.y, p.x, p.y));
    }
    const score = minDist === 2 ? 20 : (minDist > 2 ? 10 - minDist : -10);
    if (score > bestScoreMove) {
      bestScoreMove = score;
      bestMove = m;
    }
  }

  return { type: 'wait', move: bestMove };
}

/**
 * Fire Archer: Attacks at range 2-3, prioritizes targets standing in forest ('f')
 */
function decideFireArcherAction(enemy, reachableList, playerUnits, board, rng) {
  let bestAction = null;
  let bestScore = -Infinity;

  for (const m of reachableList) {
    for (const p of playerUnits) {
      if (!canTargetUnit(enemy, p, board)) continue;
      const dist = Board.manhattan(m.x, m.y, p.x, p.y);
      if (dist >= 2 && dist <= 3) {
        const defTerrain = board.getTerrain(p.x, p.y);
        const combat = calculateCombat(enemy, p, board, {
          attackerX: m.x,
          attackerY: m.y,
          actionType: 'attack'
        });
        let score = combat.expectedDamage;
        if (defTerrain.char === 'f') score += 30; // High priority to ignite forest!
        if (combat.willKill) score += 50;

        if (score > bestScore) {
          bestScore = score;
          bestAction = {
            type: 'attack',
            move: m,
            target: p,
            element: 'fire',
            newFacing: p.x < m.x ? -1 : 1
          };
        }
      }
    }
  }

  if (bestAction) return bestAction;

  // Fallback kite
  return decideArcherAction(enemy, reachableList, playerUnits, board, rng);
}

/**
 * Scout / Shrouded Assassin: Prioritizes objective units (cart/lantern) and lowest-DEF units
 */
function decideScoutAction(enemy, reachableList, playerUnits, board, rng) {
  let bestAction = null;
  let bestScore = -Infinity;

  for (const m of reachableList) {
    for (const p of playerUnits) {
      if (!canTargetUnit(enemy, p, board)) continue;
      const dist = Board.manhattan(m.x, m.y, p.x, p.y);
      if (dist === 1) {
        const combat = calculateCombat(enemy, p, board, { attackerX: m.x, attackerY: m.y });
        let score = combat.expectedDamage * 2;
        if (p.id === 'lantern_cart' || p.role === 'objective' || p.role === 'npc') {
          score += 80; // High priority: attack lantern cart / objective
        }
        if (combat.isBackAttack) score += 20;
        if (combat.willKill) score += 60;
        score += (30 - (p.def || 0)) * 4;

        if (score > bestScore) {
          bestScore = score;
          bestAction = {
            type: 'attack',
            move: m,
            target: p,
            newFacing: p.x < m.x ? -1 : 1
          };
        }
      }
    }
  }

  if (bestAction) return bestAction;

  // Move towards objective or lowest-DEF unit
  const objectiveUnit = playerUnits.find(p => p.id === 'lantern_cart' || p.role === 'objective');
  const targetUnit = objectiveUnit || [...playerUnits].sort((a, b) => (a.def || 0) - (b.def || 0))[0];

  let bestMove = reachableList[0];
  let minTargetDist = Infinity;
  for (const m of reachableList) {
    const dist = Board.manhattan(m.x, m.y, targetUnit.x, targetUnit.y);
    if (dist < minTargetDist) {
      minTargetDist = dist;
      bestMove = m;
    }
  }

  return { type: 'wait', move: bestMove };
}

/**
 * Default fallback action: move towards closest target and attack
 */
function decideDefaultAction(enemy, reachableList, playerUnits, board, rng) {
  let bestAction = null;
  let bestScore = -Infinity;

  for (const m of reachableList) {
    for (const p of playerUnits) {
      if (!canTargetUnit(enemy, p, board)) continue;
      const dist = Board.manhattan(m.x, m.y, p.x, p.y);
      if (dist === 1) {
        const combat = calculateCombat(enemy, p, board, { attackerX: m.x, attackerY: m.y });
        let score = combat.expectedDamage;
        if (combat.willKill) score += 50;
        if (score > bestScore) {
          bestScore = score;
          bestAction = {
            type: 'attack',
            move: m,
            target: p,
            newFacing: p.x < m.x ? -1 : 1
          };
        }
      }
    }
  }

  if (bestAction) return bestAction;

  // Move towards nearest player unit
  let bestMove = reachableList[0];
  let minD = Infinity;
  for (const m of reachableList) {
    for (const p of playerUnits) {
      const d = Board.manhattan(m.x, m.y, p.x, p.y);
      if (d < minD) {
        minD = d;
        bestMove = m;
      }
    }
  }

  return { type: 'wait', move: bestMove };
}
