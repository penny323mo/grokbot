/**
 * js/engine/bot.js
 * Autonomous AI player bot to simulate complete battles and multi-night runs for balance sanity.
 */

import { Battle } from "./battle.js";
import { RunMap } from "./map.js";
import { RNG } from "./rng.js";
import { STARTING_DECK_STANDARD, getCardById, CARD_TYPES } from "./cards.js";
import { DIFFICULTIES } from "./constants.js";

export class BotPlayer {
  constructor(options = {}) {
    this.difficulty = options.difficulty || DIFFICULTIES.STANDARD;
    this.ascension = options.ascension || 0;
    this.rng = options.rng || new RNG(42);
    this.townPerks = options.townPerks || {};
  }

  /**
   * Simulates a single battle until completion.
   * Returns: { won: boolean, turns: number, lanternHp: number }
   */
  playBattle(battle) {
    let safetyCounter = 0;
    const maxIterations = 50;

    while (battle.status === "ongoing" && safetyCounter++ < maxIterations) {
      // 1. Try to play cards while energy > 0
      let cardPlayedThisRound = true;
      let cardTries = 0;

      while (cardPlayedThisRound && battle.energy > 0 && cardTries++ < 15) {
        cardPlayedThisRound = false;

        for (let i = 0; i < battle.hand.length; i++) {
          const cardId = battle.hand[i];
          const card = getCardById(cardId);
          if (!card || card.cost > battle.energy) continue;

          // Find a valid target
          const target = this.findBestCardTarget(card, battle);
          if (target !== null) {
            const res = battle.playCard(i, target.x, target.y);
            if (res.success) {
              cardPlayedThisRound = true;
              break;
            }
          }
        }
      }

      // 2. Move guardians towards nearest enemies if not yet in range
      for (const g of battle.guardians) {
        if (!g.hasMoved && g.move > 0) {
          const inRange = battle.getEnemiesInRange(g);
          if (inRange.length === 0 && battle.enemies.length > 0) {
            let closestEnemy = battle.enemies[0];
            let minDist = 999;
            for (const e of battle.enemies) {
              const d = Math.abs(g.x - e.x) + Math.abs(g.y - e.y);
              if (d < minDist) {
                minDist = d;
                closestEnemy = e;
              }
            }
            const stepY = closestEnemy.y < g.y ? g.y - 1 : (closestEnemy.y > g.y ? g.y + 1 : g.y);
            const stepX = closestEnemy.x < g.x ? g.x - 1 : (closestEnemy.x > g.x ? g.x + 1 : g.x);
            if (battle.board.isEmpty(g.x, stepY)) {
              battle.moveGuardian(g, g.x, stepY);
            } else if (battle.board.isEmpty(stepX, g.y)) {
              battle.moveGuardian(g, stepX, g.y);
            }
          }
        }
      }

      // 3. End player turn
      battle.endPlayerTurn();
    }

    return {
      won: battle.status === "victory",
      turns: battle.turn,
      lanternsAlive: battle.lanterns.filter((l) => l.hp > 0).length
    };
  }

  findBestCardTarget(card, battle) {
    if (card.targetType === "none") {
      return { x: 0, y: 0 };
    }

    if (card.targetType === "empty_friendly_tile") {
      // Find empty friendly tile on row 4 or 3
      for (let y = 4; y >= 3; y--) {
        for (let x = 0; x < battle.board.cols; x++) {
          if (battle.board.isEmpty(x, y)) {
            return { x, y };
          }
        }
      }
      return null;
    }

    if (card.targetType === "empty_tile") {
      for (let y = 3; y >= 1; y--) {
        for (let x = 0; x < battle.board.cols; x++) {
          if (battle.board.isEmpty(x, y)) {
            return { x, y };
          }
        }
      }
      return null;
    }

    if (card.targetType === "enemy_unit") {
      // Target enemy closest to lanterns (highest Y)
      let bestEnemy = null;
      let maxY = -1;
      for (const e of battle.enemies) {
        if (e.hp > 0 && e.y > maxY) {
          maxY = e.y;
          bestEnemy = e;
        }
      }
      return bestEnemy ? { x: bestEnemy.x, y: bestEnemy.y } : null;
    }

    if (card.targetType === "friendly_unit") {
      if (battle.guardians.length > 0) {
        const g = battle.guardians[0];
        return { x: g.x, y: g.y };
      }
      return null;
    }

    if (card.targetType === "lantern_or_unit") {
      // Prefer damaged lantern
      for (const l of battle.lanterns) {
        if (l.hp > 0 && l.hp < l.maxHp) {
          return { x: l.x, y: l.y };
        }
      }
      if (battle.guardians.length > 0) {
        return { x: battle.guardians[0].x, y: battle.guardians[0].y };
      }
      return { x: 2, y: 5 };
    }

    if (card.targetType === "row_select") {
      // Find row with most enemies
      let bestRow = 1;
      let maxEnemies = 0;
      for (let y = 0; y < battle.board.rows; y++) {
        let count = 0;
        for (let x = 0; x < battle.board.cols; x++) {
          const u = battle.board.getUnitAt(x, y);
          if (u && !u.isGuardian) count++;
        }
        if (count > maxEnemies) {
          maxEnemies = count;
          bestRow = y;
        }
      }
      return { x: 0, y: bestRow };
    }

    return null;
  }

  /**
   * Simulates an entire 8-night run from Night 1 to Boss!
   */
  simulateFullRun() {
    const runMap = new RunMap(this.rng);
    let currentDeck = [...STARTING_DECK_STANDARD];
    let relics = [];
    let coins = 50;
    let starLanternsEarned = 0;
    let nightsSurvived = 0;

    let currentNode = runMap.nodes.find((n) => n.night === 1);

    for (let night = 1; night <= 8; night++) {
      if (!currentNode) break;

      if (currentNode.type === "battle" || currentNode.type === "elite" || currentNode.type === "boss") {
        const battle = new Battle({
          rng: this.rng.fork(),
          difficulty: this.difficulty,
          ascension: this.ascension,
          deck: currentDeck,
          relics,
          townPerks: this.townPerks,
          battleNode: currentNode
        });

        const result = this.playBattle(battle);
        if (!result.won) {
          return {
            won: false,
            nightsSurvived,
            starLanternsEarned,
            finalNight: night,
            relicsCount: relics.length,
            deckSize: currentDeck.length
          };
        }

        // Won this battle!
        nightsSurvived++;
        coins += currentNode.type === "elite" ? 35 : 20;
        starLanternsEarned += currentNode.type === "boss" ? 25 : 3;

        // Card reward: pick 1 card
        currentDeck.push("card_command_advance");
      } else if (currentNode.type === "shop") {
        nightsSurvived++;
        // Buy a cheap relic or upgrade card if affordable
        if (coins >= 45 && relics.length < 5) {
          relics.push("relic_hot_water_bottle");
          coins -= 45;
        }
      } else if (currentNode.type === "rest") {
        nightsSurvived++;
        // Upgrade 1st card in deck
        const cardToUpgrade = currentDeck[0];
        const cardProto = getCardById(cardToUpgrade);
        if (cardProto && cardProto.upgrade) {
          currentDeck[0] = cardProto.upgrade.id;
        }
      } else if (currentNode.type === "event") {
        nightsSurvived++;
      }

      // Pick next node
      if (currentNode.nextNodes.length > 0) {
        const nextId = this.rng.choice(currentNode.nextNodes);
        currentNode = runMap.getNode(nextId);
      } else {
        currentNode = null;
      }
    }

    return {
      won: nightsSurvived >= 8,
      nightsSurvived,
      starLanternsEarned,
      finalNight: 8,
      relicsCount: relics.length,
      deckSize: currentDeck.length
    };
  }
}
