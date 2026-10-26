/**
 * js/engine/ai.js
 * Enemy intent calculation, pathfinding, lantern targeting, and clear telegraphs.
 */

import { Board } from "./board.js";
import { LANTERN_COORDINATES } from "./constants.js";

export function calculateEnemyIntents(enemies, guardians, lanterns, board, difficultyMod = 0, isRelaxed = false) {
  const activeLanterns = lanterns.filter((l) => l.hp > 0);
  const scarecrows = guardians.filter((g) => g.unitId === "scarecrow" && g.hp > 0);

  for (const enemy of enemies) {
    if (enemy.hp <= 0) {
      enemy.intent = null;
      continue;
    }

    if (enemy.isFrozen) {
      enemy.intent = {
        type: "frozen",
        icon: "frozen",
        damage: 0,
        desc: "凍結中，無法行動",
        destPos: { x: enemy.x, y: enemy.y },
        path: [{ x: enemy.x, y: enemy.y }],
        targetPos: null
      };
      continue;
    }

    // Default intent
    let targetLantern = null;
    let targetGuardian = null;
    let targetPos = null;
    let destPos = { x: enemy.x, y: enemy.y };
    let path = [];
    let intentType = "move";
    let damage = Math.max(1, enemy.atk + difficultyMod);
    let icon = "attack";
    let desc = "";

    // 1. Check Taunt from nearby Scarecrows (within 2 Manhattan distance)
    let taunter = null;
    for (const sc of scarecrows) {
      if (Board.getDistance(enemy, sc) <= 2) {
        taunter = sc;
        break;
      }
    }

    if (taunter && !enemy.isBoss) {
      // Must target Scarecrow
      targetGuardian = taunter;
      targetPos = { x: taunter.x, y: taunter.y };
    } else {
      // Find closest active lantern
      let minDist = 999;
      for (const l of activeLanterns) {
        const d = Board.getDistance(enemy, l);
        if (d < minDist) {
          minDist = d;
          targetLantern = l;
        }
      }

      // Check if an adjacent guardian is blocking the path
      const adjGuardians = board.getAdjacentUnits(enemy.x, enemy.y, (u) => u.isGuardian && u.hp > 0);
      if (adjGuardians.length > 0) {
        // Can attack adjacent guardian
        targetGuardian = adjGuardians[0];
        targetPos = { x: targetGuardian.x, y: targetGuardian.y };
      } else if (targetLantern) {
        targetPos = { x: targetLantern.x, y: targetLantern.y };
      }
    }

    // 2. Decide movement towards target
    const currentDist = targetPos ? Board.getDistance(enemy, targetPos) : 0;
    const canAttackNow = currentDist <= enemy.range;

    if (canAttackNow) {
      // Already in range! Stand ground and attack
      intentType = "attack";
      icon = "attack";
      destPos = { x: enemy.x, y: enemy.y };
      path = [destPos];
      desc = `攻擊 (${targetPos.x}, ${targetPos.y}) 造成 ${damage} 點傷害`;
    } else {
      // Need to move closer
      const moveSpeed = enemy.isRooted ? 0 : enemy.move;
      const plannedPath = findBestStep(enemy, targetPos, moveSpeed, board);

      if (plannedPath.length > 1) {
        destPos = plannedPath[plannedPath.length - 1];
        path = isRelaxed ? [destPos] : plannedPath;
      } else {
        destPos = { x: enemy.x, y: enemy.y };
        path = [destPos];
      }

      // Check if after moving, target is in attack range
      const distAfterMove = targetPos ? Board.getDistance(destPos, targetPos) : 999;
      if (distAfterMove <= enemy.range) {
        intentType = "move_and_attack";
        icon = "attack";
        desc = `移動至 (${destPos.x}, ${destPos.y}) 並發動攻擊 (${damage} 傷)`;
      } else {
        intentType = "move";
        icon = "move";
        damage = 0;
        desc = `向前推進至 (${destPos.x}, ${destPos.y})`;
      }
    }

    // 3. Special Boss behaviors
    if (enemy.isBoss) {
      if (enemy.typeId === "boss_mother_of_mist") {
        if (enemy.turnCount && enemy.turnCount % 2 === 1) {
          intentType = "spawn";
          icon = "spawn";
          damage = 0;
          desc = "召喚幼年迷霧並為全軍施加護盾";
        }
      } else if (enemy.typeId === "boss_night_crow_king") {
        if (enemy.turnCount && enemy.turnCount % 3 === 0) {
          intentType = "aoe";
          icon = "aoe";
          damage = enemy.atk + 2;
          desc = "黑羽俯衝：橫掃整排友軍！";
        }
      } else if (enemy.typeId === "boss_elder_demon") {
        if (enemy.turnCount && enemy.turnCount % 2 === 0) {
          intentType = "attack";
          icon = "attack";
          damage = 1;
          desc = "吞噬燈油：奪取燈籠 1 點生命並自我修復";
        }
      }
    }

    enemy.intent = {
      type: intentType,
      targetPos,
      destPos,
      path,
      damage,
      icon,
      desc,
      targetGuardianId: targetGuardian ? targetGuardian.id : null,
      targetLanternId: targetLantern ? targetLantern.id : null
    };
  }
}

/**
 * Greedy A*-like step towards target position avoiding obstacles.
 */
function findBestStep(unit, targetPos, maxSteps, board) {
  if (!targetPos || maxSteps <= 0) return [{ x: unit.x, y: unit.y }];

  let current = { x: unit.x, y: unit.y };
  const path = [current];

  for (let s = 0; s < maxSteps; s++) {
    const neighbors = board.getOrthogonalNeighbors(current.x, current.y);
    let best = null;
    let bestDist = Board.getDistance(current, targetPos);

    for (const n of neighbors) {
      // Must be empty or target tile itself
      const isTarget = n.x === targetPos.x && n.y === targetPos.y;
      if (!isTarget && n.unit !== null) continue;

      const d = Board.getDistance(n, targetPos);
      if (d < bestDist) {
        bestDist = d;
        best = n;
      }
    }

    // Special Leap behavior for hop_lantern: can jump over an adjacent blocking unit
    if ((unit.typeId === "hop_lantern" || unit.behavior === "leap") && !best) {
      for (const n of neighbors) {
        if (n.unit !== null) {
          const leapX = n.x + (n.x - current.x);
          const leapY = n.y + (n.y - current.y);
          if (board.isValid(leapX, leapY) && board.isEmpty(leapX, leapY)) {
            const d = Board.getDistance({ x: leapX, y: leapY }, targetPos);
            if (d < bestDist) {
              bestDist = d;
              best = { x: leapX, y: leapY };
            }
          }
        }
      }
    }

    if (best && (best.x !== targetPos.x || best.y !== targetPos.y)) {
      current = { x: best.x, y: best.y };
      path.push(current);
    } else {
      break;
    }
  }

  return path;
}
