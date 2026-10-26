/**
 * js/engine/battle.js
 * Turn state machine, card playing, combat resolution, tag resonance, undo stack, win/loss.
 */

import { Board } from "./board.js";
import { calculateEnemyIntents } from "./ai.js";
import { getCardById, CARD_TYPES } from "./cards.js";
import { GUARDIANS, ENEMIES } from "./units.js";
import { TAG_RESONANCE, TAGS, LANTERN_COORDINATES, DIFFICULTIES } from "./constants.js";

export class Battle {
  constructor(options = {}) {
    this.rng = options.rng;
    this.difficulty = options.difficulty || DIFFICULTIES.STANDARD;
    this.ascension = options.ascension || 0;
    this.relics = options.relics || [];
    this.townPerks = options.townPerks || {};
    this.battleNode = options.battleNode || { type: "battle", name: "初臨霧夜", night: 1 };

    this.board = new Board();
    this.board.initTiles("battle", this.rng);

    // Initialize 3 Lanterns at bottom row (0, 5), (2, 5), (4, 5)
    let lanternBaseHp = this.difficulty.lanternHp;
    if (this.townPerks.lanternHpBonus) {
      lanternBaseHp += this.townPerks.lanternHpBonus;
    }
    if (options.initialLanternHp && Array.isArray(options.initialLanternHp)) {
      this.lanterns = LANTERN_COORDINATES.map((c, idx) => ({
        ...c,
        hp: options.initialLanternHp[idx] !== undefined ? options.initialLanternHp[idx] : lanternBaseHp,
        maxHp: lanternBaseHp
      }));
    } else {
      this.lanterns = LANTERN_COORDINATES.map((c) => ({
        ...c,
        hp: lanternBaseHp,
        maxHp: lanternBaseHp
      }));
    }

    // Player deck & hand
    this.deck = this.rng.shuffle(options.deck ? [...options.deck] : []);
    this.hand = [];
    this.discard = [];
    this.exhaust = [];

    this.turn = 1;
    this.maxTurns = 7; // Survive 7 turns or wipe out all enemies to win
    this.energy = 3;
    this.maxEnergy = 3;

    this.guardians = [];
    this.enemies = [];
    this.unitIdCounter = 1;

    // Undo stack: snapshot of state before last card play
    this.undoSnapshot = null;
    this.undoAvailable = true;

    // Combat logs & animation events
    this.events = [];
    this.status = "ongoing"; // "ongoing", "victory", "defeat"

    // Wave enemies pool
    this.spawnQueue = [];
    if (!options.skipStart) {
      this.initEnemiesForNode();

      // Start turn 1
      this.startPlayerTurn();
    }
  }

  initEnemiesForNode() {
    const night = this.battleNode.night || 1;
    const isBoss = this.battleNode.type === "boss" || night === 8;
    const isElite = this.battleNode.type === "elite" || night === 4;

    let initialSpawn = [];
    let queue = [];

    if (isBoss) {
      // Night 8 Boss
      const bossTypes = ["boss_mother_of_mist", "boss_night_crow_king", "boss_elder_demon"];
      const bossId = this.battleNode.bossId || this.rng.choice(bossTypes);
      initialSpawn.push(bossId);
      initialSpawn.push("split_mist");
      initialSpawn.push("paper_ghost");
      queue.push("fog_blob", "shadow_rat", "hop_lantern");
    } else if (isElite) {
      initialSpawn.push("mud_golem", "paper_ghost", "windchime_spectre");
      queue.push("shadow_rat", "fog_blob");
    } else {
      // Normal combat scaling by night
      if (night === 1) {
        initialSpawn.push("fog_blob", "shadow_rat");
        queue.push("fog_blob");
      } else if (night === 2) {
        initialSpawn.push("fog_blob", "paper_ghost", "shadow_rat");
        queue.push("fog_blob");
      } else {
        initialSpawn.push("fog_blob", "paper_ghost", "hop_lantern");
        queue.push("split_mist", "shadow_rat");
      }
    }

    // Extra spawn for challenging difficulty
    if (this.difficulty.extraSpawns) {
      queue.push("fog_blob");
    }

    // Place initial enemies at row 0 or 1
    const spawnCols = this.rng.shuffle([0, 1, 2, 3, 4]);
    for (let i = 0; i < initialSpawn.length; i++) {
      const col = spawnCols[i % spawnCols.length];
      const row = Math.floor(i / spawnCols.length);
      this.spawnEnemy(initialSpawn[i], col, row);
    }

    this.spawnQueue = queue;
  }

  spawnEnemy(enemyId, x, y) {
    const proto = ENEMIES[enemyId] || ENEMIES.fog_blob;
    let hp = proto.hp;
    let atk = proto.atk;

    // Apply Ascension modifiers
    if (this.ascension >= 2) atk += 1; // A2: 凶煞凶靈
    if (this.ascension >= 4 && (proto.isBoss || proto.hp >= 10)) {
      hp = Math.floor(hp * 1.25); // A4: 強敵環伺
    }

    const enemy = {
      id: `enemy_${this.unitIdCounter++}`,
      typeId: proto.id,
      name: proto.name,
      title: proto.title,
      hp,
      maxHp: hp,
      atk,
      range: proto.range,
      move: proto.move,
      armor: proto.armor || 0,
      isBoss: !!proto.isBoss,
      isGuardian: false,
      behavior: proto.behavior,
      x,
      y,
      intent: null,
      isRooted: false,
      turnCount: 0
    };

    if (this.board.isValid(x, y) && this.board.isEmpty(x, y)) {
      if (this.ascension >= 1 && this.isFogRow(y)) {
        enemy.armor = (enemy.armor || 0) + 1; // A1: 濃霧蔓延，濃霧中霧怪獲得迷霧護體 (+1 護甲)
      }
      this.board.tiles[y][x].unit = enemy;
      this.enemies.push(enemy);
      return enemy;
    }
    return null;
  }

  spawnGuardian(unitId, x, y, bonusHp = 0, bonusAtk = 0, bonusArmor = 0) {
    const proto = GUARDIANS[unitId];
    if (!proto) return null;

    let hp = proto.hp + bonusHp;
    if (this.townPerks.unitHpBonus) {
      hp += this.townPerks.unitHpBonus;
    }

    let atk = proto.atk + bonusAtk;
    // Check relics
    if (unitId === "cat_patrol" && this.hasRelic("relic_catnip_grass")) {
      atk += 1;
    }

    const guardian = {
      id: `guardian_${this.unitIdCounter++}`,
      unitId: proto.id,
      name: proto.name,
      title: proto.title,
      hp,
      maxHp: hp,
      atk,
      range: proto.range,
      move: proto.move + (unitId === "cat_patrol" && this.hasRelic("relic_catnip_grass") ? 1 : 0),
      armor: bonusArmor,
      tags: [...proto.tags],
      isGuardian: true,
      hasAttacked: false,
      hasMoved: false,
      x,
      y
    };

    if (this.board.isValid(x, y) && this.board.isEmpty(x, y)) {
      this.board.tiles[y][x].unit = guardian;
      this.guardians.push(guardian);

      // Fox maiden on-spawn: cleanse all negative states and curses from friendly units
      if (unitId === "fox_maiden") {
        for (const g of this.guardians) {
          g.curseAtk = 0;
          if (g.bonusNextAtk < 0) g.bonusNextAtk = 0;
        }
        this.events.push({ type: "cleanse_allies" });
      }

      return guardian;
    }
    return null;
  }

  startPlayerTurn() {
    this.events.push({ type: "turn_start", turn: this.turn });
    this.undoSnapshot = null;
    this.undoAvailable = true;

    // Reset Energy (default 3)
    this.energy = this.maxEnergy;
    if (this.turn === 1 && this.hasRelic("relic_clay_teapot")) {
      this.energy += 1;
    }
    if (this.hasRelic("relic_ancient_tea_brick") && this.rng.next() < 0.3) {
      this.energy = Math.min(4, this.energy + 1);
    }

    // Determine hand draw count
    let drawCount = 5;
    if (this.turn === 1 && this.hasRelic("relic_blessed_chalk")) {
      drawCount += 1;
    }
    if (this.turn === 1 && this.ascension >= 5) {
      drawCount -= 1; // A5: 夜深霜重
    }
    this.drawCards(drawCount);

    // Reset guardian turn actions
    for (const g of this.guardians) {
      g.hasAttacked = false;
      g.hasMoved = false;
      g.bonusNextAtk = 0;
      if (g.hp > 0 && g.hasHalo && g.haloBonus >= 2) {
        g.armor += 2;
      }
    }

    // Check Tag Resonances
    this.applyTagResonances();

    // Adjacency buffs (e.g. Tea Master heals adjacent)
    this.applyAdjacencyBuffs();

    // First turn relic buffs (e.g. Hot Water Bottle gives armor)
    if (this.turn === 1 && this.hasRelic("relic_hot_water_bottle")) {
      for (const g of this.guardians) {
        g.armor += 2;
      }
    }

    // Calculate enemy intents for this turn
    this.updateEnemyIntents();

    // Check win/loss right away
    this.checkWinLoss();
  }

  /**
   * Helper to trigger tile hazards (bamboo trap, bun) when any unit enters a tile.
   */
  triggerTileHazards(unit, tile) {
    if (!tile || !unit) return;

    // Bun consumed by friendly guardian
    if (tile.bun && unit.isGuardian) {
      unit.hp = Math.min(unit.maxHp, unit.hp + (tile.bun.heal || 3));
      unit.armor += tile.bun.armor || 2;
      tile.bun = null;
      this.events.push({ type: "heal", unit, amount: 3 });
    }

    // Bamboo trap triggered by enemy unit
    if (tile.trap && !unit.isGuardian) {
      const trapDmg = tile.trap.damage || 5;
      tile.trap = null;
      this.events.push({ type: "trap_triggered", unit, damage: trapDmg });
      unit.isRooted = true;
      if (this.isEnemyPhase) {
        unit.skipNextMove = true;
      }
      this.damageUnit(unit, trapDmg);
    }
  }

  /**
   * Central push handler on the board that executes collision/water/trap damage events.
   */
  pushUnitOnBoard(unit, dx, dy, distance = 1, options = {}) {
    if (!unit || unit.hp <= 0) return { moved: false, steps: 0, damageEvents: [] };

    const result = this.board.pushUnit(unit, dx, dy, distance, {
      spiritBellBonus: this.hasRelic("relic_spirit_bell") ? 3 : 0,
      ...options
    });

    this.events.push({ type: "unit_pushed", unit, result });

    if (result.damageEvents && result.damageEvents.length > 0) {
      for (const ev of result.damageEvents) {
        this.damageUnit(ev.unit, ev.damage);
      }
    }

    return result;
  }

  /**
   * Calculates a guardian's attack power including halo buffs from adjacent allies.
   */
  getGuardianAtk(guardian) {
    if (!guardian) return 0;
    let atk = guardian.atk + (guardian.bonusNextAtk || 0) - (guardian.curseAtk || 0);

    // Check if any orthogonally adjacent living ally has hasHalo
    const neighbors = this.board.getAdjacentUnits(guardian.x, guardian.y, (u) => u.isGuardian && u !== guardian && u.hp > 0);
    for (const ally of neighbors) {
      if (ally.hasHalo) {
        atk += ally.haloBonus || 1;
      }
    }

    return Math.max(0, atk);
  }

  /**
   * Move a guardian to an empty tile within movement range.
   */
  moveGuardian(guardian, targetX, targetY) {
    if (this.status !== "ongoing" || !guardian || guardian.hp <= 0) {
      return { success: false, reason: "invalid_guardian" };
    }
    if (guardian.hasMoved) {
      return { success: false, reason: "already_moved" };
    }
    if (!this.board.isValid(targetX, targetY) || !this.board.isEmpty(targetX, targetY)) {
      return { success: false, reason: "tile_not_empty" };
    }

    const maxMove = guardian.move + (guardian.moveBonus || 0);
    const dist = Board.getDistance(guardian, { x: targetX, y: targetY });
    if (dist > maxMove || dist <= 0) {
      return { success: false, reason: "out_of_range" };
    }

    // Take undo snapshot
    this.takeUndoSnapshot();

    const fromX = guardian.x;
    const fromY = guardian.y;

    // Move on board
    this.board.tiles[fromY][fromX].unit = null;
    guardian.x = targetX;
    guardian.y = targetY;
    this.board.tiles[targetY][targetX].unit = guardian;
    guardian.hasMoved = true;

    // Bear baker bun drop on vacated tile
    if (guardian.unitId === "bear_baker") {
      this.board.tiles[fromY][fromX].bun = { heal: 3, armor: 2 };
    }

    // Check hazards on destination tile
    this.triggerTileHazards(guardian, this.board.getTile(targetX, targetY));

    this.events.push({ type: "unit_moved", unit: guardian, fromX, fromY, toX: targetX, toY: targetY });

    // Recalculate intents
    this.updateEnemyIntents();

    return { success: true };
  }

  drawCards(count) {
    for (let i = 0; i < count; i++) {
      if (this.deck.length === 0) {
        if (this.discard.length === 0) break;
        this.deck = this.rng.shuffle([...this.discard]);
        this.discard = [];
      }
      if (this.deck.length > 0) {
        this.hand.push(this.deck.pop());
      }
    }
  }

  getActiveTags() {
    const counts = {};
    for (const g of this.guardians) {
      if (g.hp > 0 && g.tags) {
        for (const t of g.tags) {
          counts[t] = (counts[t] || 0) + 1;
        }
      }
    }
    const resonances = [];
    for (const [tag, count] of Object.entries(counts)) {
      if (count >= 2) {
        resonances.push(tag);
      }
    }
    return resonances;
  }

  applyTagResonances() {
    const resonances = this.getActiveTags();
    // Guard Duo: +2 Shield to all allies
    if (resonances.includes(TAGS.GUARD)) {
      for (const g of this.guardians) {
        g.armor += 2;
      }
    }
    // Furry Duo: +1 Move to all allies
    if (resonances.includes(TAGS.FURRY)) {
      for (const g of this.guardians) {
        g.moveBonus = 1;
      }
      if (this.hasRelic("relic_fluffy_blanket")) {
        for (const g of this.guardians) {
          g.armor += 2;
        }
      }
    }
  }

  applyAdjacencyBuffs() {
    for (const g of this.guardians) {
      if (g.unitId === "tea_master" && g.hp > 0) {
        const neighbors = this.board.getAdjacentUnits(g.x, g.y, (u) => u.isGuardian && u.hp > 0);
        let healAmount = 2;
        if (this.hasRelic("relic_clay_teapot")) healAmount += 1;
        for (const n of neighbors) {
          n.hp = Math.min(n.maxHp, n.hp + healAmount);
          n.armor += 1;
          this.events.push({ type: "heal", unit: n, amount: healAmount });
        }
      }
    }
  }

  isFogRow(y) {
    return this.ascension >= 1 ? y <= 2 : y <= 1;
  }

  getCardCost(cardId) {
    const card = typeof cardId === "string" ? getCardById(cardId) : cardId;
    if (!card) return 0;
    let actualCost = card.cost;
    // Ascension 3 modifier: Lantern cards cost +1 energy
    if (this.ascension >= 3 && card.type === CARD_TYPES.LANTERN) {
      actualCost += 1;
    }
    // Mystic Duo synergy: First spell played costs -1
    const resonances = this.getActiveTags();
    if (card.type === CARD_TYPES.SPELL && resonances.includes(TAGS.MYSTIC) && !this.playedSpellThisTurn) {
      actualCost = Math.max(0, actualCost - 1);
    }
    return actualCost;
  }

  updateEnemyIntents() {
    const diffMod = this.difficulty.enemyAtkMod || 0;
    const isRelaxed = this.difficulty.id === "relaxed";
    calculateEnemyIntents(this.enemies, this.guardians, this.lanterns, this.board, diffMod, isRelaxed);
  }

  /**
   * Save a snapshot for 1-step undo
   */
  takeUndoSnapshot() {
    if (!this.undoAvailable && !this.difficulty.infiniteUndo) return;
    this.undoSnapshot = this.serializeState();
  }

  undo() {
    if (!this.undoSnapshot) return false;
    this.restoreState(this.undoSnapshot);
    this.undoSnapshot = null;
    this.undoAvailable = this.difficulty.infiniteUndo;
    this.events.push({ type: "undo" });
    return true;
  }

  /**
   * Play a card from hand to a target tile (targetX, targetY).
   */
  playCard(handIndex, targetX = null, targetY = null) {
    if (this.status !== "ongoing") return { success: false, reason: "battle_ended" };
    if (handIndex < 0 || handIndex >= this.hand.length) {
      return { success: false, reason: "invalid_hand_index" };
    }

    const cardId = this.hand[handIndex];
    const card = getCardById(cardId);
    if (!card) return { success: false, reason: "unknown_card" };

    const actualCost = this.getCardCost(card);
    if (this.energy < actualCost) {
      return { success: false, reason: "insufficient_energy" };
    }

    // Validate target
    if (!this.validateCardTarget(card, targetX, targetY)) {
      return { success: false, reason: "invalid_target" };
    }

    // Take undo snapshot before modifying state
    this.takeUndoSnapshot();

    // Consume energy and move card from hand to discard
    this.energy -= actualCost;
    this.hand.splice(handIndex, 1);
    this.discard.push(cardId);

    if (card.type === CARD_TYPES.SPELL) {
      this.playedSpellThisTurn = true;
    }

    // Execute card effect
    this.executeCardEffect(card, targetX, targetY);

    // Update enemy intents as board state might have shifted
    this.updateEnemyIntents();

    // Check win/loss
    this.checkWinLoss();

    return { success: true };
  }

  validateCardTarget(card, x, y) {
    if (card.targetType === "none") return true;

    if (card.targetType === "empty_friendly_tile") {
      return this.board.isValid(x, y) && this.board.isFriendlyZone(y) && this.board.isEmpty(x, y);
    }
    if (card.targetType === "empty_tile") {
      return this.board.isValid(x, y) && this.board.isEmpty(x, y);
    }
    if (card.targetType === "friendly_unit") {
      const u = this.board.getUnitAt(x, y);
      return u && u.isGuardian;
    }
    if (card.targetType === "enemy_unit") {
      const u = this.board.getUnitAt(x, y);
      return u && !u.isGuardian;
    }
    if (card.targetType === "lantern_or_unit") {
      if (this.board.isLanternTile(x, y)) return true;
      const u = this.board.getUnitAt(x, y);
      return u && u.isGuardian;
    }
    if (card.targetType === "row_select") {
      return y >= 0 && y < this.board.rows;
    }
    return true;
  }

  executeCardEffect(card, targetX, targetY) {
    this.events.push({ type: "card_played", cardId: card.id, targetX, targetY });

    if (card.type === CARD_TYPES.SUMMON) {
      this.spawnGuardian(card.unitId, targetX, targetY, card.unitBonusHp, card.unitBonusAtk, card.bonusArmor);
    } else if (card.type === CARD_TYPES.COMMAND) {
      this.executeCommandCard(card, targetX, targetY);
    } else if (card.type === CARD_TYPES.SPELL) {
      this.executeSpellCard(card, targetX, targetY);
    } else if (card.type === CARD_TYPES.LANTERN) {
      this.executeLanternCard(card, targetX, targetY);
    }
  }

  executeCommandCard(card, x, y) {
    if (card.id.startsWith("card_command_advance")) {
      const unit = this.board.getUnitAt(x, y);
      if (unit && unit.isGuardian) {
        // Step forward or diagonally forward up to 2 tiles towards nearest enemy
        let stepCount = card.value || 2;
        let curX = unit.x;
        let curY = unit.y;
        const fromX = curX;
        const fromY = curY;
        let stepsMoved = 0;

        for (let i = 0; i < stepCount; i++) {
          const nextY = curY - 1;
          if (nextY < 0) break;

          // If north tile has an enemy directly adjacent, stop here and strike!
          const northTile = this.board.getTile(curX, nextY);
          if (northTile && northTile.unit && !northTile.unit.isGuardian) {
            break;
          }

          // Evaluate candidate steps: North, NW, NE
          const candidates = [];
          if (this.board.isEmpty(curX, nextY)) candidates.push({ x: curX, y: nextY, dir: "north" });
          if (curX > 0 && this.board.isEmpty(curX - 1, nextY)) candidates.push({ x: curX - 1, y: nextY, dir: "nw" });
          if (curX < this.board.cols - 1 && this.board.isEmpty(curX + 1, nextY)) candidates.push({ x: curX + 1, y: nextY, dir: "ne" });

          if (candidates.length === 0) break;

          // Score candidates based on proximity to nearest enemy
          let chosen = candidates[0];
          let bestDist = 999;
          const enemies = this.enemies.filter((e) => e.hp > 0);

          if (enemies.length > 0) {
            for (const cand of candidates) {
              let minEnemyDist = 999;
              for (const e of enemies) {
                const d = Math.abs(e.x - cand.x) + Math.abs(e.y - cand.y);
                if (d < minEnemyDist) minEnemyDist = d;
              }
              if (minEnemyDist < bestDist || (minEnemyDist === bestDist && cand.dir === "north")) {
                bestDist = minEnemyDist;
                chosen = cand;
              }
            }
          }

          this.board.tiles[curY][curX].unit = null;
          curX = chosen.x;
          curY = chosen.y;
          unit.x = curX;
          unit.y = curY;
          this.board.tiles[curY][curX].unit = unit;
          stepsMoved++;

          // If already in attack range of an enemy, stop advancing to strike!
          const enemiesAdjacent = this.getEnemiesInRange(unit);
          if (enemiesAdjacent.length > 0) {
            break;
          }
        }

        if (stepsMoved > 0) {
          unit.hasMoved = true;
          if (unit.unitId === "bear_baker") {
            this.board.tiles[fromY][fromX].bun = { heal: 3, armor: 2 };
          }
          this.triggerTileHazards(unit, this.board.getTile(unit.x, unit.y));
        }
        // Attack enemies in range immediately
        const enemiesInRange = this.getEnemiesInRange(unit);
        if (enemiesInRange.length > 0) {
          let dmg = this.getGuardianAtk(unit) + (card.bonusAtk || 0);
          if (unit.unitId === "cat_patrol" && stepsMoved >= 1) {
            dmg *= 2; // Night claw double swipe on advance
          }
          this.damageUnit(enemiesInRange[0], dmg, unit);
          unit.curseAtk = 0;
        }
        if (card.bonusArmor) unit.armor += card.bonusArmor;
      }
    } else if (card.id.startsWith("card_command_reposition")) {
      const unit = this.board.getUnitAt(x, y);
      if (unit && unit.isGuardian) {
        const fromX = unit.x;
        const fromY = unit.y;
        const maxDist = card.value || 1;
        let destTile = null;
        if (maxDist > 1) {
          const candidates = [];
          for (let r = 0; r < this.board.rows; r++) {
            for (let c = 0; c < this.board.cols; c++) {
              if (this.board.isEmpty(c, r)) {
                const dist = Math.abs(c - fromX) + Math.abs(r - fromY);
                if (dist > 0 && dist <= maxDist) {
                  candidates.push({ x: c, y: r, dist });
                }
              }
            }
          }
          if (candidates.length > 0) {
            candidates.sort((a, b) => b.dist - a.dist);
            destTile = candidates[0];
          }
        } else {
          const neighbors = this.board.getOrthogonalNeighbors(unit.x, unit.y);
          destTile = neighbors.find((n) => n.unit === null && !n.lanternId);
        }

        if (destTile) {
          this.board.tiles[fromY][fromX].unit = null;
          unit.x = destTile.x;
          unit.y = destTile.y;
          this.board.tiles[unit.y][unit.x].unit = unit;
          unit.hasMoved = true;
          if (unit.unitId === "bear_baker") {
            this.board.tiles[fromY][fromX].bun = { heal: 3, armor: 2 };
          }
          this.triggerTileHazards(unit, this.board.getTile(unit.x, unit.y));
        }
        if (card.bonusAtk) unit.bonusNextAtk = (unit.bonusNextAtk || 0) + card.bonusAtk;
      }
    } else if (card.id.startsWith("card_command_rally")) {
      for (const g of this.guardians) {
        g.armor += card.value || 2;
        if (card.healValue) {
          g.hp = Math.min(g.maxHp, g.hp + card.healValue);
        }
        const fromX = g.x;
        const fromY = g.y;
        // Step 1 tile toward row 5 if empty
        const nextY = g.y + 1;
        if (nextY < this.board.rows && this.board.isEmpty(g.x, nextY)) {
          this.board.tiles[fromY][fromX].unit = null;
          g.y = nextY;
          this.board.tiles[g.y][g.x].unit = g;
          g.hasMoved = true;
          if (g.unitId === "bear_baker") {
            this.board.tiles[fromY][fromX].bun = { heal: 3, armor: 2 };
          }
          this.triggerTileHazards(g, this.board.getTile(g.x, g.y));
        }
      }
    } else if (card.id.startsWith("card_command_strike_again")) {
      const unit = this.board.getUnitAt(x, y);
      if (unit && unit.isGuardian) {
        unit.hasAttacked = false;
        const enemiesInRange = this.getEnemiesInRange(unit);
        if (enemiesInRange.length > 0) {
          this.damageUnit(enemiesInRange[0], this.getGuardianAtk(unit) + (card.bonusAtk || 0), unit);
        }
      }
    } else if (card.id.startsWith("card_command_tactical_swap")) {
      let targetGuardian = this.board.getUnitAt(x, y);
      if (!targetGuardian || !targetGuardian.isGuardian) {
        targetGuardian = this.guardians.find((g) => g.hp > 0);
      }
      if (targetGuardian) {
        const others = this.guardians.filter((g) => g !== targetGuardian && g.hp > 0);
        if (others.length > 0) {
          others.sort((a, b) => Board.getDistance(targetGuardian, a) - Board.getDistance(targetGuardian, b));
          const partner = others[0];

          const g1 = targetGuardian;
          const g2 = partner;
          const g1OrigX = g1.x;
          const g1OrigY = g1.y;
          const g2OrigX = g2.x;
          const g2OrigY = g2.y;

          this.board.tiles[g1OrigY][g1OrigX].unit = g2;
          this.board.tiles[g2OrigY][g2OrigX].unit = g1;
          g1.x = g2OrigX;
          g1.y = g2OrigY;
          g2.x = g1OrigX;
          g2.y = g1OrigY;

          g1.hasMoved = true;
          g2.hasMoved = true;

          const armorBonus = card.isUpgraded ? 3 : 2;
          g1.armor += armorBonus;
          g2.armor += armorBonus;

          if (g1.unitId === "bear_baker") {
            this.board.tiles[g1OrigY][g1OrigX].bun = { heal: 3, armor: 2 };
          }
          if (g2.unitId === "bear_baker") {
            this.board.tiles[g2OrigY][g2OrigX].bun = { heal: 3, armor: 2 };
          }

          this.triggerTileHazards(g1, this.board.getTile(g1.x, g1.y));
          this.triggerTileHazards(g2, this.board.getTile(g2.x, g2.y));

          if (card.isUpgraded || card.id.includes("plus")) {
            this.drawCards(1);
          }
          this.events.push({ type: "unit_swapped", g1, g2 });
        }
      }
    }
  }

  executeSpellCard(card, x, y) {
    if (card.id.startsWith("card_spell_gust")) {
      const enemy = this.board.getUnitAt(x, y);
      if (enemy && !enemy.isGuardian) {
        let dmg = card.value || 2;
        if (this.hasRelic("relic_ancestral_flint")) dmg += 3;
        this.damageUnit(enemy, dmg);
        // Push enemy backward (dy = -1, towards row 0)
        let pushDist = card.pushDistance || 1;
        if (this.hasRelic("relic_paper_fan")) pushDist += 1;
        this.pushUnitOnBoard(enemy, 0, -1, pushDist);
      }
    } else if (card.id.startsWith("card_spell_fireball")) {
      const enemy = this.board.getUnitAt(x, y);
      if (enemy && !enemy.isGuardian) {
        let dmg = card.value || 4;
        if (this.hasRelic("relic_ancestral_flint")) dmg += 3;
        this.damageUnit(enemy, dmg);
      }
    } else if (card.id.startsWith("card_spell_barrier")) {
      const unit = this.board.getUnitAt(x, y);
      if (unit) {
        unit.armor += card.value || 5;
      }
    } else if (card.id.startsWith("card_spell_whirlwind")) {
      // Hits entire row y
      for (let col = 0; col < this.board.cols; col++) {
        const u = this.board.getUnitAt(col, y);
        if (u && !u.isGuardian) {
          this.damageUnit(u, card.value || 3);
          this.pushUnitOnBoard(u, 0, -1, 1);
        }
      }
    } else if (card.id.startsWith("card_spell_freeze_mist")) {
      const enemy = this.board.getUnitAt(x, y);
      if (enemy && !enemy.isGuardian) {
        enemy.isFrozen = true;
        enemy.intent = { type: "frozen", icon: "frozen", damage: 0, desc: "凍結中，無法行動" };
        if (card.isUpgraded) this.damageUnit(enemy, 2);
      }
    } else if (card.id.startsWith("card_spell_bamboo_trap")) {
      const tile = this.board.getTile(x, y);
      if (tile && !tile.unit) {
        tile.trap = { damage: card.isUpgraded ? 7 : 5 };
      }
    } else if (card.id.startsWith("card_spell_spirit_rain")) {
      for (const g of this.guardians) {
        g.hp = Math.min(g.maxHp, g.hp + 3);
      }
    } else if (card.id.startsWith("card_spell_thunder_strike")) {
      const enemy = this.board.getUnitAt(x, y);
      if (enemy && !enemy.isGuardian) {
        this.damageUnit(enemy, card.value || 8);
      }
    }
  }

  executeLanternCard(card, x, y) {
    if (card.id.startsWith("card_lantern_refuel")) {
      let healAmount = card.healLantern || 1;
      if (this.hasRelic("relic_oil_funnel")) healAmount += 1;
      // If target is lantern
      const tile = this.board.getTile(x, y);
      if (tile && tile.lanternId) {
        const l = this.lanterns.find((item) => item.id === tile.lanternId);
        if (l) {
          l.hp = Math.min(l.maxHp, l.hp + healAmount);
          this.events.push({ type: "lantern_healed", lanternId: l.id, amount: healAmount });
        }
      } else {
        const u = this.board.getUnitAt(x, y);
        if (u && u.isGuardian) {
          u.armor += card.bonusArmor || 4;
        }
      }
      if (card.draw) this.drawCards(card.draw);
    } else if (card.id.startsWith("card_lantern_flare")) {
      // Attacks all enemies in front of lanterns
      const dmg = card.value || 2;
      for (const l of this.lanterns) {
        if (l.hp > 0) {
          for (let row = 0; row < l.y; row++) {
            const u = this.board.getUnitAt(l.x, row);
            if (u && !u.isGuardian) {
              this.damageUnit(u, dmg);
            }
          }
        }
      }
    } else if (card.id.startsWith("card_lantern_guardian_halo")) {
      const u = this.board.getUnitAt(x, y);
      if (u && u.isGuardian) {
        u.hasHalo = true;
        u.haloBonus = card.isUpgraded ? 2 : 1;
        u.armor += card.isUpgraded ? 4 : 3;
      }
    } else if (card.id.startsWith("card_lantern_ignite")) {
      const dmg = card.isUpgraded ? 4 : 3;
      // Hits all enemies in top rows (fog rows)
      for (const e of this.enemies) {
        if (e.hp > 0 && this.isFogRow(e.y)) {
          this.damageUnit(e, dmg);
        }
      }
    } else if (card.id.startsWith("card_lantern_oil_flask_plus")) {
      this.energy += 2;
      this.drawCards(1);
    } else if (card.id.startsWith("card_lantern_oil_flask")) {
      this.energy += 1;
      this.drawCards(1);
    }
  }

  getEnemiesInRange(guardian) {
    const enemies = [];
    const tile = this.board.getTile(guardian.x, guardian.y);
    let effectiveRange = guardian.range;
    // Stone lantern post gives +1 attack range
    if (tile && tile.terrain === "post") effectiveRange += 1;
    if (this.hasRelic("relic_night_scout_spyglass") && guardian.range > 1) effectiveRange += 1;

    for (const e of this.enemies) {
      if (e.hp > 0 && Board.getDistance(guardian, e) <= effectiveRange) {
        enemies.push(e);
      }
    }
    return enemies;
  }

  damageUnit(unit, amount, attacker = null) {
    if (!unit || unit.hp <= 0 || amount <= 0) return;

    // Check cover reduction
    const tile = this.board.getTile(unit.x, unit.y);
    if (tile && tile.terrain === "bamboo" && attacker && attacker.range > 1) {
      amount = Math.max(1, amount - 1);
    }

    // Double Light Resonance: all friendly attacks deal +1 burn damage
    if (attacker && attacker.isGuardian && this.getActiveTags().includes(TAGS.LIGHT)) {
      amount += 1;
    }

    // Fox maiden exorcism bonus vs Boss, Elite, or armored units
    if (attacker && attacker.unitId === "fox_maiden" && (unit.isBoss || unit.maxHp >= 10 || unit.armor >= 2)) {
      amount += 3;
    }

    // Apply armor first
    if (unit.armor > 0) {
      if (unit.armor >= amount) {
        unit.armor -= amount;
        amount = 0;
      } else {
        amount -= unit.armor;
        unit.armor = 0;
      }
    }

    unit.hp = Math.max(0, unit.hp - amount);
    this.events.push({ type: "damage", unit, damage: amount });

    // Scarecrow reflect damage: reflects 2 (or 3 with relic) back to melee attacker
    if (unit.isGuardian && unit.unitId === "scarecrow" && attacker && !attacker.isGuardian) {
      if (Board.getDistance(unit, attacker) <= 1) {
        const reflectDmg = this.hasRelic("relic_straw_woven_amulet") ? 3 : 2;
        this.damageUnit(attacker, reflectDmg);
      }
    }

    // Handle unit defeat
    if (unit.hp <= 0) {
      this.events.push({ type: "unit_died", unit });
      this.board.tiles[unit.y][unit.x].unit = null;

      // Special split mist mechanic: spawns up to 2 fog blobs on death
      if (unit.typeId === "split_mist") {
        const neighbors = this.board.getOrthogonalNeighbors(unit.x, unit.y).filter((n) => n.unit === null);
        const count = Math.min(2, neighbors.length);
        for (let i = 0; i < count; i++) {
          this.spawnEnemy("fog_blob", neighbors[i].x, neighbors[i].y);
        }
      }
      // Crane courier draw card mechanic
      if (attacker && attacker.unitId === "crane_courier") {
        this.drawCards(1);
      }
    }
  }

  /**
   * End player turn, execute friendly auto-attacks and enemy intents!
   */
  endPlayerTurn() {
    if (this.status !== "ongoing") return;

    this.events.push({ type: "turn_end", turn: this.turn });
    this.undoSnapshot = null;
    this.undoAvailable = false;
    this.playedSpellThisTurn = false;

    // 1. Friendly Guardians Auto-Attack nearest enemy in range
    for (const g of this.guardians) {
      if (g.hp > 0 && !g.hasAttacked) {
        let inRange = this.getEnemiesInRange(g);
        if (inRange.length > 0) {
          const atkPower = this.getGuardianAtk(g);
          // Special unit skills
          if (g.unitId === "little_dragon") {
            // Piercing straight line flame breath up to 2 enemies
            const lineEnemies = this.enemies.filter((e) => e.hp > 0 && e.x === g.x && e.y < g.y).slice(0, 2);
            for (const le of lineEnemies) {
              this.damageUnit(le, atkPower, g);
            }
            g.hasAttacked = true;
          } else if (g.unitId === "frog_bard") {
            // AoE attack all 4 orthogonal enemies + push back
            const neighbors = this.board.getAdjacentUnits(g.x, g.y, (u) => !u.isGuardian && u.hp > 0);
            for (const ne of neighbors) {
              this.damageUnit(ne, atkPower, g);
              this.pushUnitOnBoard(ne, 0, -1, 1);
            }
            g.hasAttacked = true;
          } else if (g.unitId === "tanuki_mage") {
            // Push back on hit
            const target = inRange[0];
            this.damageUnit(target, atkPower, g);
            this.pushUnitOnBoard(target, 0, -1, 1);
            g.hasAttacked = true;
          } else if (g.unitId === "lantern_crafter") {
            // 破霧明燈: attacks target, strips armor, and dispels fog armor on adjacent enemies
            const target = inRange[0];
            this.damageUnit(target, atkPower, g);
            target.armor = 0;
            const neighbors = this.board.getAdjacentUnits(target.x, target.y, (u) => !u.isGuardian && u.hp > 0);
            for (const ne of neighbors) {
              ne.armor = Math.max(0, (ne.armor || 0) - 1);
            }
            g.hasAttacked = true;
          } else {
            const target = inRange[0];
            let dmg = atkPower;
            if (g.unitId === "cat_patrol" && g.hasMoved) {
              dmg *= 2; // Night claw double swipe
            }
            this.damageUnit(target, dmg, g);
            g.hasAttacked = true;
          }
          g.curseAtk = 0;
        }
      }
    }

    // Clean up dead enemies before enemy phase
    this.enemies = this.enemies.filter((e) => e.hp > 0);

    // Double Light tag resonance: heal 1 HP to any damaged lantern
    if (this.getActiveTags().includes(TAGS.LIGHT)) {
      for (const l of this.lanterns) {
        if (l.hp > 0 && l.hp < l.maxHp) {
          l.hp += 1;
          this.events.push({ type: "lantern_healed", lanternId: l.id, amount: 1 });
          break;
        }
      }
    }

    // 2. Enemy Intent Execution Phase
    this.isEnemyPhase = true;
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;

      // Frozen check
      if (enemy.isFrozen) {
        enemy.isFrozen = false;
        continue;
      }

      // Armored snail passive: gains +1 armor every turn
      if (enemy.typeId === "armored_snail") {
        enemy.armor = Math.min(5, (enemy.armor || 0) + 1);
      }

      // Boss specials
      if (enemy.typeId === "boss_mother_of_mist" && enemy.turnCount && enemy.turnCount % 2 === 1) {
        // Spawn split mist
        const emptyTile = this.board.getOrthogonalNeighbors(enemy.x, enemy.y).find((n) => n.unit === null);
        if (emptyTile) {
          this.spawnEnemy("split_mist", emptyTile.x, emptyTile.y);
        }
        for (const e of this.enemies) {
          e.armor = (e.armor || 0) + 2;
        }
        enemy.turnCount++;
        continue;
      }

      if (enemy.typeId === "boss_night_crow_king" && enemy.turnCount && enemy.turnCount % 3 === 0) {
        // Sweeping row dive attack
        for (let col = 0; col < this.board.cols; col++) {
          const u = this.board.getUnitAt(col, enemy.y);
          if (u && u.isGuardian) {
            this.damageUnit(u, enemy.atk + 2, enemy);
          }
        }
        enemy.turnCount++;
        continue;
      }

      if (enemy.typeId === "boss_elder_demon" && enemy.turnCount && enemy.turnCount % 2 === 0) {
        // Drain lantern
        const targetLantern = this.lanterns.find((l) => l.hp > 0);
        if (targetLantern) {
          targetLantern.hp = Math.max(0, targetLantern.hp - 1);
          enemy.hp = Math.min(enemy.maxHp, enemy.hp + 2);
          this.events.push({ type: "lantern_hit", lanternId: targetLantern.id, damage: 1, remaining: targetLantern.hp });
        }
      }

      const intent = enemy.intent;
      if (!intent) continue;

      // Movement step
      if (intent.destPos && (intent.destPos.x !== enemy.x || intent.destPos.y !== enemy.y)) {
        if (this.board.isEmpty(intent.destPos.x, intent.destPos.y)) {
          this.board.tiles[enemy.y][enemy.x].unit = null;
          enemy.x = intent.destPos.x;
          enemy.y = intent.destPos.y;
          this.board.tiles[enemy.y][enemy.x].unit = enemy;
          this.triggerTileHazards(enemy, this.board.getTile(enemy.x, enemy.y));
        }
      }

      if (enemy.hp <= 0) continue;

      // Check copper windchime relic: push back if near lantern
      if (this.hasRelic("relic_copper_windchime") && enemy.y === 4) {
        this.pushUnitOnBoard(enemy, 0, -1, 1);
        if (enemy.hp <= 0) continue;
      }

      // Attack step
      if (intent.damage > 0 && intent.targetPos) {
        const targetTile = this.board.getTile(intent.targetPos.x, intent.targetPos.y);

        if (targetTile && targetTile.lanternId) {
          const l = this.lanterns.find((item) => item.id === targetTile.lanternId);
          if (l && l.hp > 0) {
            l.hp = Math.max(0, l.hp - intent.damage);
            this.events.push({ type: "lantern_hit", lanternId: l.id, damage: intent.damage, remaining: l.hp });
          }
        } else if (targetTile && targetTile.unit && targetTile.unit.isGuardian) {
          const defender = targetTile.unit;
          this.damageUnit(defender, intent.damage, enemy);

          // Enemy attack special skills (only if defender survived)
          if (defender.hp > 0) {
            if (enemy.typeId === "windchime_spectre") {
              // Windchime curses target (-1 attack on next attack)
              defender.curseAtk = (defender.curseAtk || 0) + 1;
            } else if (enemy.typeId === "mud_golem") {
              // Mud golem pushes target backward
              this.pushUnitOnBoard(defender, 0, 1, 1);
            }
          }
        }
      }

      enemy.turnCount = (enemy.turnCount || 0) + 1;
    }
    this.isEnemyPhase = false;

    // Reset rooted state for enemies
    for (const e of this.enemies) {
      if (e.skipNextMove) {
        e.skipNextMove = false;
      } else {
        e.isRooted = false;
      }
    }

    // Clean up dead units after enemy turn
    this.guardians = this.guardians.filter((g) => g.hp > 0);
    this.enemies = this.enemies.filter((e) => e.hp > 0);

    // 3. Spawn reinforcements from queue if any
    if (this.spawnQueue.length > 0 && this.enemies.length < 5) {
      const nextEnemyId = this.spawnQueue.shift();
      const emptyRow0 = [0, 1, 2, 3, 4].filter((col) => this.board.isEmpty(col, 0));
      if (emptyRow0.length > 0) {
        const col = this.rng.choice(emptyRow0);
        this.spawnEnemy(nextEnemyId, col, 0);
      }
    }

    // Check Win/Loss Condition
    if (this.checkWinLoss()) return;

    // Discard remaining hand
    this.discard.push(...this.hand);
    this.hand = [];

    // Increment turn and start next player turn
    this.turn++;
    this.startPlayerTurn();
  }

  checkWinLoss() {
    // Loss condition: All 3 lanterns extinguished
    const activeLanterns = this.lanterns.filter((l) => l.hp > 0);
    if (activeLanterns.length === 0) {
      // Check Phoenix Feather relic
      if (this.hasRelic("relic_phoenix_feather") && !this.phoenixFeatherUsed) {
        this.phoenixFeatherUsed = true;
        this.lanterns[1].hp = 2; // Mid lantern revives
        this.events.push({ type: "phoenix_revive" });
        return false;
      }
      this.status = "defeat";
      this.events.push({ type: "battle_defeat" });
      return true;
    }

    // Win condition: All enemies dead and spawn queue empty, OR survived max turns
    if ((this.enemies.length === 0 && this.spawnQueue.length === 0) || this.turn > this.maxTurns) {
      this.status = "victory";
      this.events.push({ type: "battle_victory" });
      return true;
    }

    return false;
  }

  hasRelic(relicId) {
    return this.relics.some((r) => (typeof r === "string" ? r === relicId : r.id === relicId));
  }

  serializeState() {
    return JSON.stringify({
      turn: this.turn,
      energy: this.energy,
      hand: [...this.hand],
      deck: [...this.deck],
      discard: [...this.discard],
      lanterns: JSON.parse(JSON.stringify(this.lanterns)),
      guardians: JSON.parse(JSON.stringify(this.guardians)),
      enemies: JSON.parse(JSON.stringify(this.enemies)),
      spawnQueue: [...this.spawnQueue],
      status: this.status,
      difficulty: this.difficulty,
      ascension: this.ascension,
      relics: this.relics,
      townPerks: this.townPerks,
      battleNode: this.battleNode,
      tiles: this.board.tiles.map((row) =>
        row.map((t) => ({
          x: t.x,
          y: t.y,
          terrain: t.terrain,
          trap: t.trap ? { ...t.trap } : null,
          bun: t.bun ? { ...t.bun } : null,
          lanternId: t.lanternId
        }))
      )
    });
  }

  restoreState(jsonOrObj) {
    const data = typeof jsonOrObj === "string" ? JSON.parse(jsonOrObj) : jsonOrObj;
    this.turn = data.turn;
    this.energy = data.energy;
    this.hand = data.hand;
    this.deck = data.deck;
    this.discard = data.discard;
    this.lanterns = data.lanterns;
    this.guardians = data.guardians;
    this.enemies = data.enemies;
    this.spawnQueue = data.spawnQueue;
    this.status = data.status;
    if (data.difficulty) this.difficulty = data.difficulty;
    if (data.ascension !== undefined) this.ascension = data.ascension;
    if (data.relics) this.relics = data.relics;
    if (data.townPerks) this.townPerks = data.townPerks;
    if (data.battleNode) this.battleNode = data.battleNode;

    // Restore tiles (terrains, traps, buns)
    if (data.tiles) {
      for (let y = 0; y < this.board.rows; y++) {
        for (let x = 0; x < this.board.cols; x++) {
          const st = data.tiles[y][x];
          this.board.tiles[y][x].terrain = st.terrain;
          this.board.tiles[y][x].trap = st.trap;
          this.board.tiles[y][x].bun = st.bun;
          this.board.tiles[y][x].lanternId = st.lanternId;
          this.board.tiles[y][x].unit = null;
        }
      }
    } else {
      for (let y = 0; y < this.board.rows; y++) {
        for (let x = 0; x < this.board.cols; x++) {
          this.board.tiles[y][x].unit = null;
        }
      }
    }

    for (const g of this.guardians) {
      if (this.board.isValid(g.x, g.y)) {
        this.board.tiles[g.y][g.x].unit = g;
      }
    }
    for (const e of this.enemies) {
      if (this.board.isValid(e.x, e.y)) {
        this.board.tiles[e.y][e.x].unit = e;
      }
    }
  }

  static deserialize(jsonOrObj, rng) {
    const data = typeof jsonOrObj === "string" ? JSON.parse(jsonOrObj) : jsonOrObj;
    const battle = new Battle({
      rng,
      difficulty: data.difficulty,
      ascension: data.ascension,
      deck: data.deck,
      relics: data.relics,
      townPerks: data.townPerks,
      battleNode: data.battleNode,
      skipStart: true
    });
    battle.restoreState(data);
    return battle;
  }
}
