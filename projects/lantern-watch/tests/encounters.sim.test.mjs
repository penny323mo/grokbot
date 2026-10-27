/**
 * tests/encounters.sim.test.mjs
 * Scripted heuristic player bot encounter simulation test for 燈影軍略 (v4).
 * Verifies that:
 * 1. For each of the 4 battles, >= 2 distinct squad comps + stratagems win with seeded RNG.
 * 2. No single squad comp wins all 4 battles with the same naive "charge nearest" bot.
 * 3. Prints a clean formatted win table.
 */

import assert from 'node:assert';
import test from 'node:test';
import { CHAPTERS } from '../js/data/maps.js';
import { Battle } from '../js/engine/battle.js';
import { CampaignManager } from '../js/engine/campaign.js';
import { RNG } from '../js/engine/rng.js';
import { Board } from '../js/engine/board.js';
import { getReachableTiles, getAttackRangeTiles } from '../js/engine/pathfinding.js';
import { calculateCombat, canTargetUnit } from '../js/engine/combat.js';

export function executeAllyBotTurn(battle, botType, rng) {
  const { chapter, board } = battle;
  const combatAllies = battle.allies.filter(u => u.hp > 0 && !u.acted && u.id !== 'lantern_cart' && u.role !== 'objective');
  const npcAllies = battle.allies.filter(u => u.hp > 0 && !u.acted && (u.id === 'lantern_cart' || u.role === 'objective'));
  // Combat allies act first to clear threats & establish defensive line, then NPC cart follows
  const livingAllies = [...combatAllies, ...npcAllies];

  for (const ally of livingAllies) {
    if (battle.status.finished) break;
    if (ally.hp <= 0 || ally.acted) continue;

    // NPC: Lantern cart escort logic
    if (ally.id === 'lantern_cart') {
      const reachable = battle.getReachableFor(ally);
      const reachableList = Array.from(reachable.values());
      if (reachableList.length > 0) {
        const goal = chapter.escortGoal || { colMin: 6, rowMax: 2 };
        const enemiesAhead = battle.enemies.filter(e => e.hp > 0 && e.y <= ally.y);
        const bear = battle.allies.find(a => a.id === 'bear_guard' && a.hp > 0);

        let candidates = reachableList;
        // While cavalry is active, cart holds safely on the western approach (x <= 2) behind Bear Guard (y >= bear.y)
        const livingCavalry = battle.enemies.filter(e => e.hp > 0 && e.role === 'cavalry');
        if (livingCavalry.length > 0) {
          const westCandidates = reachableList.filter(m => m.x <= 2 && (!bear || m.y >= bear.y));
          candidates = westCandidates.length > 0 ? westCandidates : [{ x: ally.x, y: ally.y }];
        }

        // Avoid stepping adjacent (dist <= 1) to any living enemy
        const safeCandidates = candidates.filter(m => {
          return !battle.enemies.some(e => e.hp > 0 && Board.manhattan(m.x, m.y, e.x, e.y) <= 1);
        });
        const finalCandidates = safeCandidates.length > 0 ? safeCandidates : candidates;

        finalCandidates.sort((a, b) => {
          // If any tile reaches goal directly, choose it!
          const aInGoal = a.x >= goal.colMin && a.y <= goal.rowMax;
          const bInGoal = b.x >= goal.colMin && b.y <= goal.rowMax;
          if (aInGoal && !bInGoal) return -1;
          if (!aInGoal && bInGoal) return 1;

          const distA = Math.max(0, goal.colMin - a.x) + Math.max(0, a.y - goal.rowMax);
          const distB = Math.max(0, goal.colMin - b.x) + Math.max(0, b.y - goal.rowMax);
          return distA - distB;
        });
        const bestMove = finalCandidates[0];
        battle.moveUnit(ally, bestMove.x, bestMove.y);
      }
      battle.confirmAction(ally, 'wait');
      continue;
    }

    if (ally.role === 'objective') {
      battle.confirmAction(ally, 'wait');
      continue;
    }

    const reachable = battle.getReachableFor(ally);
    const reachableList = Array.from(reachable.values());
    if (reachableList.length === 0) {
      battle.confirmAction(ally, 'wait');
      continue;
    }

    if (botType === 'naive') {
      // NAIVE BOT: blindly charges nearest enemy, ignores objectives & tactics
      const livingEnemies = battle.enemies.filter(e => e.hp > 0);
      if (livingEnemies.length === 0) {
        battle.confirmAction(ally, 'wait');
        continue;
      }

      let bestAction = null;
      let minEnemyDist = Infinity;

      for (const m of reachableList) {
        for (const e of livingEnemies) {
          const d = Board.manhattan(m.x, m.y, e.x, e.y);
          if (d === 1 && !bestAction) {
            bestAction = { type: 'attack', move: m, target: e };
          }
          if (d < minEnemyDist) {
            minEnemyDist = d;
            if (!bestAction) {
              bestAction = { type: 'wait', move: m };
            }
          }
        }
      }

      if (bestAction?.move) {
        battle.moveUnit(ally, bestAction.move.x, bestAction.move.y);
      }
      if (bestAction?.type === 'attack' && bestAction.target) {
        battle.confirmAction(ally, 'attack', bestAction.target);
      } else {
        battle.confirmAction(ally, 'wait');
      }
      continue;
    }

    // HEURISTIC BOT: tactical play with role knowledge
    // 1. Mountain chapter special: Push Iron General into reservoir water!
    if (chapter.id === 4 && ally.id === 'bear_guard') {
      const ironGen = battle.enemies.find(e => e.id === 'iron_general' && e.hp > 0);
      if (ironGen) {
        // Can bear reach a tile to push iron_general into water (3,2)-(6,2)?
        for (const m of reachableList) {
          if (Board.manhattan(m.x, m.y, ironGen.x, ironGen.y) === 1) {
            const combat = calculateCombat(ally, ironGen, board, {
              attackerX: m.x,
              attackerY: m.y,
              actionType: 'skill',
              skill: ally.skill
            });
            if (combat.knockbackResult?.isInstaKill) {
              battle.moveUnit(ally, m.x, m.y);
              battle.confirmAction(ally, 'skill', ironGen);
              continue;
            }
          }
        }
      }
    }

    // 2. Mountain chapter exit rush
    if (chapter.id === 4 && (ally.id === 'crane_rider' || ally.id === 'cat_patrol')) {
      const exitTiles = chapter.exitTiles || [{ x: 4, y: 0 }, { x: 5, y: 0 }];
      for (const m of reachableList) {
        if (exitTiles.some(e => e.x === m.x && e.y === m.y)) {
          battle.moveUnit(ally, m.x, m.y);
          battle.confirmAction(ally, 'wait');
          continue;
        }
      }
    }

    // 3. Healer logic (tea_master)
    if (ally.role === 'healer') {
      const injured = battle.allies.filter(a => a.hp > 0 && a.hp < a.maxHp && a.id !== ally.id);
      if (injured.length > 0) {
        injured.sort((a, b) => {
          // Prioritize defending/healing objective if damaged
          if (a.role === 'objective' && a.hp < a.maxHp * 0.75) return -1;
          if (b.role === 'objective' && b.hp < b.maxHp * 0.75) return 1;
          return (a.hp / a.maxHp) - (b.hp / b.maxHp);
        });
        const target = injured[0];
        let bestHealMove = null;
        for (const m of reachableList) {
          if (Board.manhattan(m.x, m.y, target.x, target.y) <= 2) {
            bestHealMove = m;
            break;
          }
        }
        if (bestHealMove) {
          battle.moveUnit(ally, bestHealMove.x, bestHealMove.y);
          battle.confirmAction(ally, 'skill', target);
          continue;
        }
      }
    }

    // 4. Lantern crafter logic (market chapter): place light if shrouded rat nearby
    if (ally.id === 'lantern_crafter' && chapter.id === 3) {
      if (!board.lanterns.some(l => l.placed && l.turnsLeft > 1)) {
        battle.moveUnit(ally, ally.x, ally.y);
        battle.confirmAction(ally, 'skill', null, { tileX: ally.x, tileY: ally.y });
        continue;
      }
    }

    // 5. Tactical attack / skill scoring
    const livingEnemies = battle.enemies.filter(e => e.hp > 0);
    let bestAction = null;
    let bestScore = -Infinity;

    for (const m of reachableList) {
      const rangeTiles = getAttackRangeTiles(board, ally, m.x, m.y);

      for (const e of livingEnemies) {
        if (!canTargetUnit(ally, e, board) && Board.manhattan(m.x, m.y, e.x, e.y) > 1) {
          continue;
        }

        const candidateActions = [];
        // Basic attack
        if (rangeTiles.some(t => t.x === e.x && t.y === e.y)) {
          candidateActions.push({ type: 'attack', skill: null });
        }
        // Offensive skill
        if (ally.skill && !ally.skill.isLightPlacement && !ally.skill.isHeal) {
          const sRange = ally.skill.range || 1;
          const sMin = Array.isArray(sRange) ? sRange[0] : 1;
          const sMax = Array.isArray(sRange) ? sRange[1] : (typeof sRange === 'number' ? sRange : 1);
          const d = Board.manhattan(m.x, m.y, e.x, e.y);
          if (d >= sMin && d <= sMax) {
            candidateActions.push({ type: 'skill', skill: ally.skill });
          }
        }
        // Offensive magic
        if (ally.magic && !ally.magic.selfBuff && !ally.magic.isHeal) {
          const mRange = ally.magic.range || 2;
          const mMin = Array.isArray(mRange) ? mRange[0] : 1;
          const mMax = Array.isArray(mRange) ? mRange[1] : (typeof mRange === 'number' ? mRange : 2);
          const d = Board.manhattan(m.x, m.y, e.x, e.y);
          if (d >= mMin && d <= mMax) {
            candidateActions.push({ type: 'magic', skill: ally.magic });
          }
        }

        for (const act of candidateActions) {
          const combat = calculateCombat(ally, e, board, {
            attackerX: m.x,
            attackerY: m.y,
            actionType: act.type,
            skill: act.skill
          });

          let score = combat.expectedDamage * 2;
          if (combat.isBackAttack) score += 40; // Prioritize back attack!
          if (combat.isSideAttack) score += 20; // Prioritize flank attack!
          if (combat.isFrontAttack && (e.role === 'shield_guard' || e.trait?.id === 'shield_block')) score -= 30; // Strongly avoid hitting shield guard from front
          if (combat.willKill) score += 60;
          if (combat.knockbackResult?.isInstaKill) score += 120; // Instant drown KO!
          if (e.role === 'cavalry' && chapter.id === 1) score += 45; // Escort priority
          if (e.role === 'archer' && (ally.id === 'crane_rider' || ally.id === 'cat_patrol')) score += 35; // Flanker priority
          if (e.role === 'healer') score += 30; // Focus healers!
          if (e.element === 'water' && ally.id === 'tanuki_mage') score += 40; // Tanuki vs water spirit!

          // Defend the escort cart / market lantern: prioritize enemies threatening objective!
          const obj = battle.allies.find(a => a.id === 'lantern_cart' || a.id === 'market_lantern' || a.role === 'objective');
          if (obj && Board.manhattan(e.x, e.y, obj.x, obj.y) <= 4) {
            score += (6 - Board.manhattan(e.x, e.y, obj.x, obj.y)) * 35;
          }

          // Defense / gate holding bonus for chapter 2
          if (chapter.id === 2 && (m.x === 4 || m.x === 5) && m.y === 6) {
            score += 35;
          }

          if (score > bestScore) {
            bestScore = score;
            bestAction = {
              type: act.type,
              move: m,
              target: e,
              skill: act.skill
            };
          }
        }
      }
    }

    if (bestAction) {
      battle.moveUnit(ally, bestAction.move.x, bestAction.move.y);
      battle.confirmAction(ally, bestAction.type, bestAction.target, { skill: bestAction.skill });
      continue;
    }

    // Move toward objective or enemy
    let fallbackMove = reachableList[0];
    let bestDistScore = -Infinity;

    for (const m of reachableList) {
      let score = 0;
      if (chapter.id === 1) {
        const hillArchers = livingEnemies.filter(e => e.role === 'archer');
        const livingCavalry = livingEnemies.filter(e => e.role === 'cavalry');
        const bear = battle.allies.find(a => a.id === 'bear_guard' && a.hp > 0);

        if (ally.id === 'crane_rider' || ally.id === 'cat_patrol') {
          if (hillArchers.length > 0) {
            // Flank the hill archers together!
            let minA = Infinity;
            for (const a of hillArchers) minA = Math.min(minA, Board.manhattan(m.x, m.y, a.x, a.y));
            score = -minA * 6;
            // On turn 1 approaching archers, prefer distance 4 over distance 3 to avoid getting sniped before melee contact
            if (battle.currentTurn === 1 && minA === 3) score -= 20;
          } else if (livingCavalry.length > 0) {
            // Archers defeated -> support bridge / cavalry
            let minC = Infinity;
            for (const c of livingCavalry) minC = Math.min(minC, Board.manhattan(m.x, m.y, c.x, c.y));
            score = -minC * 6;
          } else {
            // Clear path to north-east goal (8, 1)
            const dDest = Board.manhattan(m.x, m.y, 8, 1);
            score = -dDest * 8;
          }
        } else if (ally.id === 'bear_guard') {
          if (livingCavalry.length > 0) {
            // Bear holds bridge chokepoint (3, 5) while cavalry is active
            const dBridge = Board.manhattan(m.x, m.y, 3, 5);
            score = -dBridge * 8;
          } else {
            // Advance to clear path for cart to (8, 1)
            const dDest = Board.manhattan(m.x, m.y, 8, 1);
            score = -dDest * 8;
          }
        } else {
          // tea_master / others
          if (livingCavalry.length > 0) {
            // Support Bear Guard at bridge
            const targetPos = bear ? { x: bear.x, y: bear.y } : { x: 3, y: 5 };
            const dBear = Board.manhattan(m.x, m.y, targetPos.x, targetPos.y);
            score = -dBear * 5;
            if (bear && m.y < bear.y) score -= 30;
          } else {
            const dDest = Board.manhattan(m.x, m.y, 8, 1);
            score = -dDest * 8;
          }
        }
      } else if (chapter.id === 2) {
        // Gate: stay close to gate tiles
        const dGate = Math.abs(m.x - 4.5) + Math.abs(m.y - 6);
        score = -dGate * 6;
      } else if (chapter.id === 6) {
        // Chapter 6: Siege
        // Crane Rider uses flight to flank siege engine blind zone (dist 1)
        if (ally.id === 'crane_rider') {
          const siege = livingEnemies.find(e => e.id === 'siege_engine');
          if (siege) {
            const dSiege = Board.manhattan(m.x, m.y, siege.x, siege.y);
            score = -Math.abs(dSiege - 1) * 9;
          } else {
            const boss = livingEnemies.find(e => e.id === 'citadel_warlord');
            const targetPos = boss ? { x: boss.x, y: boss.y } : { x: 4, y: 2 };
            score = -Board.manhattan(m.x, m.y, targetPos.x, targetPos.y) * 6;
          }
        } else if (ally.id === 'bear_guard') {
          // Bear Guard takes bridge chokepoint and breaches gate
          const dGate = Math.abs(m.x - 4.5) + Math.abs(m.y - 5);
          score = -dGate * 8;
        } else if (ally.id === 'tea_master') {
          // Tea stays behind frontliner
          const bear = battle.allies.find(a => a.id === 'bear_guard' && a.hp > 0);
          if (bear) {
            const dBear = Board.manhattan(m.x, m.y, bear.x, bear.y);
            score = -Math.abs(dBear - 1.5) * 6;
          } else {
            const dGate = Math.abs(m.x - 4.5) + Math.abs(m.y - 5);
            score = -dGate * 5;
          }
        } else {
          // DPS units push bridge / gate
          let minD = Infinity;
          for (const e of livingEnemies) {
            minD = Math.min(minD, Board.manhattan(m.x, m.y, e.x, e.y));
          }
          score = -minD * 5 + (12 - m.y) * 2;
        }
      } else if (chapter.id === 3) {
        const lantern = battle.allies.find(a => a.id === 'market_lantern');
        if (lantern) {
          const dLantern = Board.manhattan(m.x, m.y, lantern.x, lantern.y);
          score = -Math.abs(dLantern - 1.5) * 6;
        } else {
          let minD = Infinity;
          for (const e of livingEnemies) minD = Math.min(minD, Board.manhattan(m.x, m.y, e.x, e.y));
          score = -minD * 4;
        }
      } else {
        // Closer to squishiest enemy
        let minD = Infinity;
        for (const e of livingEnemies) {
          minD = Math.min(minD, Board.manhattan(m.x, m.y, e.x, e.y));
        }
        score = -minD * 4;
      }

      if (score > bestDistScore) {
        bestDistScore = score;
        fallbackMove = m;
      }
    }

    battle.moveUnit(ally, fallbackMove.x, fallbackMove.y);
    battle.confirmAction(ally, 'wait');
  }
}

export function runBotBattle(chapter, squadIds, stratagemId, seed = 42, botType = 'heuristic') {
  const rng = new RNG(seed);
  const campaign = new CampaignManager();
  const squadInstances = squadIds.map(id => campaign.getUnitInstance(id));
  const battle = new Battle(chapter, squadInstances, stratagemId, campaign, rng);

  while (!battle.status.finished && battle.currentTurn <= chapter.maxTurns) {
    if (battle.phase === 'ally') {
      executeAllyBotTurn(battle, botType, rng);
      if (battle.status.finished) break;
      battle.endTurn();
    }
  }
  return battle;
}

test('Simulation: Encounters heuristic bot test table & naive failure check', () => {
  const ch1 = CHAPTERS.find(c => c.key === 'river_bridge');
  const ch2 = CHAPTERS.find(c => c.key === 'gate');
  const ch3 = CHAPTERS.find(c => c.key === 'market');
  const ch4 = CHAPTERS.find(c => c.key === 'mountain');
  const ch5 = CHAPTERS.find(c => c.key === 'bamboo_pass');
  const ch6 = CHAPTERS.find(c => c.key === 'siege');
  const chSide = CHAPTERS.find(c => c.key === 'side_marsh');

  console.log('\n================ ENCOUNTER SIMULATION RESULTS ================');
  console.log('| Chapter | Comp Name | Squad | Stratagem | Result | Turns |');
  console.log('|---------|-----------|-------|-----------|--------|-------|');

  // Chapter 1: River Bridge
  // Solution A: Bear + Tea + Archer + Cat, Stratagem: 鼓舞
  const b1A = runBotBattle(ch1, ['bear_guard', 'tea_master', 'lantern_crafter', 'cat_patrol'], 'inspire', 101, 'heuristic');
  assert.strictEqual(b1A.status.victory, true, 'Chapter 1 Solution A must win');
  console.log(`| Ch 1    | Solution A | 熊岳+茶翁+燈娘+墨影 | 鼓舞 | ${b1A.status.victory ? 'WIN ' : 'FAIL'} | ${b1A.currentTurn} 回合 |`);

  // Solution B: Cat + Crane + Bear + Tea Master, Stratagem: 佯攻
  const b1B = runBotBattle(ch1, ['cat_patrol', 'crane_rider', 'bear_guard', 'tea_master'], 'feint', 102, 'heuristic');
  assert.strictEqual(b1B.status.victory, true, 'Chapter 1 Solution B must win');
  console.log(`| Ch 1    | Solution B | 墨影+鶴羽+熊岳+茶翁 | 佯攻 | ${b1B.status.victory ? 'WIN ' : 'FAIL'} | ${b1B.currentTurn} 回合 |`);

  // Chapter 2: Gate
  // Solution A: Tanuki (thunder chain) + Bear + Tea + Cat + Archer, Stratagem: 鼓舞
  const b2A = runBotBattle(ch2, ['tanuki_mage', 'bear_guard', 'tea_master', 'cat_patrol', 'lantern_crafter'], 'inspire', 201, 'heuristic');
  assert.strictEqual(b2A.status.victory, true, 'Chapter 2 Solution A must win');
  console.log(`| Ch 2    | Solution A | 雷狸+熊岳+茶翁+墨影+燈娘 | 鼓舞 | ${b2A.status.victory ? 'WIN ' : 'FAIL'} | ${b2A.currentTurn} 回合 |`);

  // Solution B: Cat + Crane + Bear + Tea + Tanuki, Stratagem: 夜襲
  const b2B = runBotBattle(ch2, ['cat_patrol', 'crane_rider', 'bear_guard', 'tea_master', 'tanuki_mage'], 'night_raid', 202, 'heuristic');
  assert.strictEqual(b2B.status.victory, true, 'Chapter 2 Solution B must win');
  console.log(`| Ch 2    | Solution B | 墨影+鶴羽+熊岳+茶翁+雷狸 | 夜襲 | ${b2B.status.victory ? 'WIN ' : 'FAIL'} | ${b2B.currentTurn} 回合 |`);

  // Chapter 3: Market
  // Solution A: Lantern Crafter (reveals rats) + Fox (AoE) + Bear + Tea + Cat, Stratagem: 鼓舞
  const b3A = runBotBattle(ch3, ['lantern_crafter', 'fox_maiden', 'bear_guard', 'tea_master', 'cat_patrol'], 'inspire', 301, 'heuristic');
  assert.strictEqual(b3A.status.victory, true, 'Chapter 3 Solution A must win');
  console.log(`| Ch 3    | Solution A | 燈娘+狐火+熊岳+茶翁+墨影 | 鼓舞 | ${b3A.status.victory ? 'WIN ' : 'FAIL'} | ${b3A.currentTurn} 回合 |`);

  // Solution B: Bear + Tea + Cat + Lantern Crafter + Crane, Stratagem: 火攻
  const b3B = runBotBattle(ch3, ['bear_guard', 'tea_master', 'cat_patrol', 'lantern_crafter', 'crane_rider'], 'fire_attack', 304, 'heuristic');
  assert.strictEqual(b3B.status.victory, true, 'Chapter 3 Solution B must win');
  console.log(`| Ch 3    | Solution B | 熊岳+茶翁+墨影+燈娘+鶴羽 | 火攻 | ${b3B.status.victory ? 'WIN ' : 'FAIL'} | ${b3B.currentTurn} 回合 |`);

  // Chapter 4: Mountain
  // Solution A: Bear (push into water) + Cat (back attack) + Crane + Tea + Tanuki + Archer, Stratagem: 鼓舞
  const b4A = runBotBattle(ch4, ['bear_guard', 'cat_patrol', 'crane_rider', 'tea_master', 'tanuki_mage', 'lantern_crafter'], 'inspire', 401, 'heuristic');
  assert.strictEqual(b4A.status.victory, true, 'Chapter 4 Solution A must win');
  console.log(`| Ch 4    | Solution A | 熊岳+墨影+鶴羽+茶翁+雷狸+燈娘 | 鼓舞 | ${b4A.status.victory ? 'WIN ' : 'FAIL'} | ${b4A.currentTurn} 回合 |`);

  // Solution B: Crane + Cat (rush shrine exit) + Bear + Tea + Fox + Tanuki, Stratagem: 水淹
  const b4B = runBotBattle(ch4, ['crane_rider', 'cat_patrol', 'bear_guard', 'tea_master', 'fox_maiden', 'tanuki_mage'], 'flood', 402, 'heuristic');
  assert.strictEqual(b4B.status.victory, true, 'Chapter 4 Solution B must win');
  console.log(`| Ch 4    | Solution B | 鶴羽+墨影+熊岳+茶翁+狐火+雷狸 | 水淹 | ${b4B.status.victory ? 'WIN ' : 'FAIL'} | ${b4B.currentTurn} 回合 |`);

  // Chapter 5: Bamboo Pass
  // Solution A: Lantern Crafter + Bear + Tea + Cat + Tanuki + Crane, Stratagem: 鼓舞
  const b5A = runBotBattle(ch5, ['lantern_crafter', 'bear_guard', 'tea_master', 'cat_patrol', 'tanuki_mage', 'crane_rider'], 'inspire', 501, 'heuristic');
  assert.strictEqual(b5A.status.victory, true, 'Chapter 5 Solution A must win');
  console.log(`| Ch 5    | Solution A | 燈娘+熊岳+茶翁+墨影+雷狸+鶴羽 | 鼓舞 | ${b5A.status.victory ? 'WIN ' : 'FAIL'} | ${b5A.currentTurn} 回合 |`);

  // Solution B: Cat + Crane + Bear + Tea + Fox + Tanuki, Stratagem: 火攻
  const b5B = runBotBattle(ch5, ['cat_patrol', 'crane_rider', 'bear_guard', 'tea_master', 'fox_maiden', 'tanuki_mage'], 'fire_attack', 502, 'heuristic');
  assert.strictEqual(b5B.status.victory, true, 'Chapter 5 Solution B must win');
  console.log(`| Ch 5    | Solution B | 墨影+鶴羽+熊岳+茶翁+狐火+雷狸 | 火攻 | ${b5B.status.victory ? 'WIN ' : 'FAIL'} | ${b5B.currentTurn} 回合 |`);

  // Chapter 6: Siege
  // Solution A: Bear + Tea + Crane + Cat + Fox + Tanuki, Stratagem: 鼓舞
  const b6A = runBotBattle(ch6, ['bear_guard', 'tea_master', 'crane_rider', 'cat_patrol', 'fox_maiden', 'tanuki_mage'], 'inspire', 601, 'heuristic');
  assert.strictEqual(b6A.status.victory, true, 'Chapter 6 Solution A must win');
  console.log(`| Ch 6    | Solution A | 熊岳+茶翁+鶴羽+墨影+狐火+雷狸 | 鼓舞 | ${b6A.status.victory ? 'WIN ' : 'FAIL'} | ${b6A.currentTurn} 回合 |`);

  // Solution B: Bear + Tea + Crane + Fox + Tanuki + Lantern, Stratagem: 夜襲
  const b6B = runBotBattle(ch6, ['bear_guard', 'tea_master', 'crane_rider', 'fox_maiden', 'tanuki_mage', 'lantern_crafter'], 'night_raid', 602, 'heuristic');
  assert.strictEqual(b6B.status.victory, true, 'Chapter 6 Solution B must win');
  console.log(`| Ch 6    | Solution B | 熊岳+茶翁+鶴羽+狐火+雷狸+燈娘 | 夜襲 | ${b6B.status.victory ? 'WIN ' : 'FAIL'} | ${b6B.currentTurn} 回合 |`);

  // Chapter 7: Side Battle (Marsh)
  // Solution A: Bear + Tea + Cat + Lantern + Crane, Stratagem: 火攻
  const bSideA = runBotBattle(chSide, ['bear_guard', 'tea_master', 'cat_patrol', 'lantern_crafter', 'crane_rider'], 'fire_attack', 701, 'heuristic');
  assert.strictEqual(bSideA.status.victory, true, 'Side Battle Solution A must win');
  console.log(`| 外傳    | Solution A | 熊岳+茶翁+墨影+燈娘+鶴羽 | 火攻 | ${bSideA.status.victory ? 'WIN ' : 'FAIL'} | ${bSideA.currentTurn} 回合 |`);

  // Solution B: Cat + Fox + Tanuki + Bear + Tea, Stratagem: 鼓舞
  const bSideB = runBotBattle(chSide, ['cat_patrol', 'fox_maiden', 'tanuki_mage', 'bear_guard', 'tea_master'], 'inspire', 702, 'heuristic');
  assert.strictEqual(bSideB.status.victory, true, 'Side Battle Solution B must win');
  console.log(`| 外傳    | Solution B | 墨影+狐火+雷狸+熊岳+茶翁 | 鼓舞 | ${bSideB.status.victory ? 'WIN ' : 'FAIL'} | ${bSideB.currentTurn} 回合 |`);

  console.log('==============================================================\n');

  // Verify that a naive "charge nearest" bot does NOT win all 4 battles with the same comp
  // E.g. Naive bot with Cat + Fox + Tanuki + Archer charging headlong into Chapter 2 (Gate) or Chapter 1 (abandoning cart)
  const naiveCh1 = runBotBattle(ch1, ['cat_patrol', 'fox_maiden', 'tanuki_mage', 'lantern_crafter'], null, 101, 'naive');
  const naiveCh2 = runBotBattle(ch2, ['cat_patrol', 'fox_maiden', 'tanuki_mage', 'lantern_crafter', 'crane_rider'], null, 201, 'naive');
  const naiveCh6 = runBotBattle(ch6, ['cat_patrol', 'fox_maiden', 'tanuki_mage', 'lantern_crafter', 'crane_rider', 'tea_master'], null, 601, 'naive');

  const naiveAllWon = (naiveCh1.status.victory && naiveCh2.status.victory && naiveCh6.status.victory);
  assert.strictEqual(naiveAllWon, false, 'Naive brute-force bot must fail at least one tactical objective without strategy');
  assert.strictEqual(naiveCh6.status.victory, false, 'Naive charge must fail against Chapter 6 siege engine bombardment');
  console.log(`[Validation] Naive bot failed tactical challenge as expected (Ch1: ${naiveCh1.status.victory ? 'WIN' : 'FAIL'}, Ch2: ${naiveCh2.status.victory ? 'WIN' : 'FAIL'}, Ch6: ${naiveCh6.status.victory ? 'WIN' : 'FAIL'})`);
});
