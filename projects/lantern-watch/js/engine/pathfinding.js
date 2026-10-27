/**
 * js/engine/pathfinding.js
 * Dijkstra-based movement reachability with terrain costs, flyer rules, and cavalry ZOC.
 */

import { Board } from './board.js';

export function getReachableTiles(board, unit, allUnits = [], options = {}) {
  const mov = unit.mov ?? 4;
  const isFlyer = !!unit.flyer;
  const isCavalry = unit.role === 'cavalry' || unit.cls === '騎兵';
  const isLight = unit.isLight || unit.role === 'assassin' || unit.role === 'scout' ||
    unit.id === 'cat_patrol' || unit.id === 'mist_scout' || unit.role === 'npc' ||
    unit.id === 'lantern_cart' || unit.id === 'market_lantern' ||
    unit.trait?.id === 'swift_shadow' || unit.trait?.id === 'light_foot' || unit.ignoreZoc;
  const ignoresZoc = isFlyer || isLight;

  // Build occupancy maps
  const allyTiles = new Set();
  const enemyTiles = new Set();
  const enemyZocCenters = [];
  const enemyCombatants = [];

  for (const u of allUnits) {
    if (u.hp <= 0) continue;
    if (u === unit || (u.instanceId && unit.instanceId && u.instanceId === unit.instanceId)) continue;
    const key = `${u.x},${u.y}`;
    if (u.team === unit.team) {
      allyTiles.add(key);
    } else {
      enemyTiles.add(key);
      if (u.role !== 'npc' && u.role !== 'objective' && u.id !== 'lantern_cart' && u.id !== 'market_lantern') {
        enemyCombatants.push(u);
      }
      if (u.trait?.id === 'spear_wall' || u.id === 'bear_guard') {
        enemyZocCenters.push(u);
      }
    }
  }

  // ZOC rule: when options.zoc === true (or preview mode), general ZOC stops non-light/non-flyers at any enemy combatant
  const generalZoc = options.zoc === true || options.generalZoc === true;

  // Helper to test if a tile is in enemy ZOC
  function isInEnemyZoc(x, y) {
    if (ignoresZoc) return false;
    // Cavalry is stopped by spear_wall / bear_guard
    if (isCavalry) {
      for (const ez of enemyZocCenters) {
        if (Board.manhattan(x, y, ez.x, ez.y) === 1) {
          return true;
        }
      }
      return false;
    }
    // General ZOC: stops foot soldiers at any enemy combatant
    if (generalZoc) {
      for (const ez of enemyCombatants) {
        if (Board.manhattan(x, y, ez.x, ez.y) === 1) {
          return true;
        }
      }
      return false;
    }
    return false;
  }

  // Priority queue / min-cost search
  // Key: `${x},${y}` -> { x, y, cost, path, zocStop }
  const bestCost = new Map();
  const reachable = new Map();

  const startKey = `${unit.x},${unit.y}`;
  bestCost.set(startKey, 0);

  const queue = [{ x: unit.x, y: unit.y, cost: 0, path: [{ x: unit.x, y: unit.y }], zocStopped: false }];

  while (queue.length > 0) {
    // Pop lowest cost
    queue.sort((a, b) => a.cost - b.cost);
    const curr = queue.shift();

    if (curr.cost > (bestCost.get(`${curr.x},${curr.y}`) ?? Infinity)) {
      continue;
    }

    // A tile is a valid landing spot if it's NOT occupied by another unit (ally or enemy)
    // Starting tile is always a valid landing spot (unit staying in place)
    const isOccupiedByOther = (allyTiles.has(`${curr.x},${curr.y}`) || enemyTiles.has(`${curr.x},${curr.y}`)) &&
      !(curr.x === unit.x && curr.y === unit.y);

    const terrain = board.getTerrain(curr.x, curr.y);
    // Even flyers cannot land inside solid stone walls
    const cannotLandTerrain = terrain.char === '#';

    if (!isOccupiedByOther && !cannotLandTerrain) {
      reachable.set(`${curr.x},${curr.y}`, {
        x: curr.x,
        y: curr.y,
        cost: curr.cost,
        path: curr.path,
        zocStopped: curr.zocStopped
      });
    }

    // If unit stopped by ZOC, cannot branch further
    if (curr.zocStopped) {
      continue;
    }

    // Expand to neighbors
    const neighbors = board.getNeighbors(curr.x, curr.y);
    for (const n of neighbors) {
      const nKey = `${n.x},${n.y}`;

      // Enemies block movement through their tile
      if (enemyTiles.has(nKey)) continue;

      // Check terrain passability
      if (!isFlyer && board.isImpassable(n.x, n.y, false)) continue;

      let stepCost = isFlyer ? 1 : board.getMoveCost(n.x, n.y, false);
      if (options.cursedTiles && options.cursedTiles.has(nKey) && !isFlyer) {
        stepCost += 1; // Cursed miasma tile: movement cost +1 (MOV -1)
      }
      if (isCavalry && !isFlyer) {
        const nTer = board.getTerrain(n.x, n.y);
        if (nTer && (nTer.char === 'f' || nTer.char === 'h')) {
          stepCost += 1; // Cavalry movement slowed in forest/mountain
        }
      }
      const newCost = curr.cost + stepCost;

      if (newCost > mov) continue;

      // Check ZOC stop when entering neighbor tile
      const entersZoc = isInEnemyZoc(n.x, n.y);

      if (newCost < (bestCost.get(nKey) ?? Infinity)) {
        bestCost.set(nKey, newCost);
        const newPath = [...curr.path, { x: n.x, y: n.y }];
        queue.push({
          x: n.x,
          y: n.y,
          cost: newCost,
          path: newPath,
          zocStopped: entersZoc
        });
      }
    }
  }

  return reachable;
}

export function getAttackRangeTiles(board, unit, fromX, fromY, customRange = null) {
  let minRange = 1;
  let maxRange = 1;

  const rangeDef = customRange || unit?.range;
  if (Array.isArray(rangeDef)) {
    minRange = rangeDef[0];
    maxRange = rangeDef[1];
  } else if (typeof rangeDef === 'number') {
    minRange = rangeDef;
    maxRange = rangeDef;
  }

  // Hill advantage: ranged units on hill gain +1 max range
  const terrain = board.getTerrain(fromX, fromY);
  if (terrain.char === 'h' && maxRange > 1) {
    maxRange += 1;
  }

  // Promotion bonus for archer
  if (unit.rangeMaxBonus) {
    maxRange += unit.rangeMaxBonus;
  }

  const isDownwindBonus = board.weather === 'wind' && (maxRange > 1 || unit.role === 'archer' || unit.cls === '弓手');

  const tiles = [];
  const maxDy = isDownwindBonus ? maxRange + 1 : maxRange;
  for (let dy = -maxRange; dy <= maxDy; dy++) {
    for (let dx = -maxRange; dx <= maxRange; dx++) {
      const dist = Math.abs(dx) + Math.abs(dy);
      const effectiveMax = (isDownwindBonus && dy > 0) ? maxRange + 1 : maxRange;
      if (dist >= minRange && dist <= effectiveMax) {
        const tx = fromX + dx;
        const ty = fromY + dy;
        if (board.inBounds(tx, ty)) {
          tiles.push({ x: tx, y: ty, dist });
        }
      }
    }
  }

  return tiles;
}

export function getAttackableTilesFromReachable(board, unit, reachableMap, livingUnits = []) {
  const attackTiles = new Set();
  const enemies = (livingUnits || []).filter(u => u.hp > 0 && u.team !== unit.team);

  for (const [key, pos] of reachableMap.entries()) {
    const rangeTiles = getAttackRangeTiles(board, unit, pos.x, pos.y);
    for (const t of rangeTiles) {
      const hasEnemy = enemies.some(e => e.x === t.x && e.y === t.y);
      if (hasEnemy) {
        attackTiles.add(`${t.x},${t.y}`);
      }
    }
  }
  return attackTiles;
}
