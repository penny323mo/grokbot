/**
 * js/engine/battle.js
 * Core battle state machine for 燈影軍略 (v4).
 * Manages turns, units, actions, undo, bonds, stratagems, and objective tracking.
 */

import { Board } from './board.js';
import { ENEMY_PROTOS, NPC_PROTOS, BOND_PAIRS } from '../data/units.js';
import { getReachableTiles, getAttackRangeTiles } from './pathfinding.js';
import { calculateCombat, executeCombat, canTargetUnit, capDamageToAlly } from './combat.js';
import { decideEnemyTurn } from './ai.js';
import { checkBattleStatus } from './objectives.js';

export class Battle {
  constructor(chapter, squadUnits = [], stratagemId = null, campaign = null, rng = null, options = {}) {
    this.chapter = chapter;
    this.stratagemId = stratagemId;
    this.campaign = campaign;
    this.rng = rng;
    this.options = options || {};

    this.board = new Board();
    this.board.loadMap(chapter.terrain, chapter.lanterns || []);

    this.currentTurn = 1;
    this.phase = 'ally'; // 'ally' | 'enemy' | 'finished'
    this.status = { finished: false, victory: false, reason: '' };

    this.allies = [];
    this.enemies = [];
    this.eventLog = [];
    this.usedBondPairThisBattle = false;
    this.actionScores = {};
    this.floodedTiles = new Map();
    this.originalTerrain = new Map();
    this.burningTiles = new Set();
    this.cursedTiles = new Set();

    this.initUnits(squadUnits, this.options);
    this.updateLastStand();
    this.applyStratagemAtStart();
  }

  initUnits(squadUnits, options = {}) {
    const deployTiles = this.chapter.deployTiles || [];

    // Spawn player squad
    squadUnits.forEach((u, i) => {
      const placement = options.deployPlacements?.find(p => p.id === u.id);
      const deployTile = placement || deployTiles[i] || { x: i, y: 11 };
      const ally = {
        ...u,
        x: deployTile.x,
        y: deployTile.y,
        turnStartX: deployTile.x,
        turnStartY: deployTile.y,
        facing: 1, // Allies face East by default
        acted: false,
        moved: false,
        mp: u.mp ?? 6,
        maxMp: u.maxMp ?? 6,
        isAmbushed: placement?.isAmbushed || false
      };
      this.allies.push(ally);
    });

    // Spawn chapter NPCs
    if (this.chapter.npcSpawns) {
      for (const npcConf of this.chapter.npcSpawns) {
        const proto = NPC_PROTOS[npcConf.id];
        if (proto) {
          this.allies.push({
            ...proto,
            x: npcConf.x,
            y: npcConf.y,
            turnStartX: npcConf.x,
            turnStartY: npcConf.y,
            facing: 1,
            acted: false,
            moved: false
          });
        }
      }
    }

    // Spawn chapter enemies
    if (this.chapter.enemySpawns) {
      this.chapter.enemySpawns.forEach((conf, i) => {
        const proto = ENEMY_PROTOS[conf.id];
        if (proto) {
          this.enemies.push({
            ...proto,
            instanceId: `${conf.id}_${i}`,
            x: conf.x,
            y: conf.y,
            facing: conf.facing ?? -1,
            acted: false,
            // Aggression: 'guard' units hold position until a guardian enters guardRadius or they are hurt.
            // Commanders (bosses) hold back by default.
            aggro: conf.aggro || (proto.isBoss || proto.role === 'boss' ? 'guard' : 'rush'),
            guardRadius: conf.guardRadius ?? 4,
            alerted: false
          });
        }
      });
    }

    // Initialize cursed tiles in side_marsh or if chapter has curse_sorcerer
    if (this.chapter.key === 'side_marsh' || this.chapter.id === 7 || this.enemies.some(e => e.id === 'curse_sorcerer' || e.role === 'curse_sorcerer')) {
      const initialCursed = ['3,3', '4,3', '5,3', '6,3', '3,4', '4,4', '5,4', '6,4', '4,2', '5,2'];
      for (const t of initialCursed) {
        const [cx, cy] = t.split(',').map(Number);
        if (!this.isTileLit(cx, cy)) {
          this.cursedTiles.add(t);
        }
      }
    }
  }

  applyStratagemAtStart() {
    if (!this.stratagemId) return;

    if (this.stratagemId === 'inspire') {
      // Allies get damage bonus turns 1-2
      for (const a of this.allies) {
        a.inspireBonus = true;
      }
      this.eventLog.push({ type: 'stratagem', name: '鼓舞', msg: '軍威大振！我方前兩回合傷害提升20%！' });
    } else if (this.stratagemId === 'ambush') {
      // Find an ally deployed in forest or marked as ambushed
      let ambushed = this.allies.find(a => a.isAmbushed);
      if (!ambushed) {
        ambushed = this.allies.find(a => this.board.getTerrain(a.x, a.y).char === 'f') || this.allies.find(a => a.id === 'cat_patrol') || this.allies[0];
      }
      if (ambushed) {
        ambushed.isAmbushed = true;
        ambushed.isShrouded = true;
        ambushed.surpriseAttack = true;
        this.eventLog.push({ type: 'stratagem', name: '伏兵', msg: `【${ambushed.name}】已借密林隱蔽埋伏，首擊將造成額外+50%奇襲傷害！` });
      }
    } else if (this.stratagemId === 'night_raid') {
      this.enemySkipsTurn1 = true;
      this.eventLog.push({ type: 'stratagem', name: '夜襲', msg: '借夜色掩護急襲，敵方第1回合全體無法行動！' });
    } else if (this.stratagemId === 'flood') {
      if (this.chapter.id === 4) {
        this.eventLog.push({ type: 'stratagem', name: '水淹', msg: '天池開閘決堤，巨浪席捲山道！' });
        for (const e of this.enemies) {
          if (e.y >= 6 && e.y <= 10) {
            e.hp = Math.max(0, e.hp - 15);
            this.eventLog.push({ type: 'flood_hit', target: e.id, damage: 15, msg: `天池巨浪重創【${e.name}】！` });
          }
        }
      }
      this.triggerWaterFlood(this.chapter.id === 4 ? 6 : 4, this.chapter.id === 4 ? 10 : 8);
    } else if (this.stratagemId === 'fire_attack') {
      let center = this.fireCenter || this.options.fireCenter;
      if (!center && this.options.manualFireAttack) {
        return; // Wait for UI tap
      }
      if (!center) {
        let bestHits = -1;
        let bestCenter = { x: 5, y: 5 };
        for (let r = 1; r < 12; r++) {
          for (let c = 1; c < 9; c++) {
            let hits = 0;
            for (const e of this.enemies) {
              const ter = this.board.getTerrain(e.x, e.y);
              if ((ter.char === 'f' || ter.char === 'm') && Math.abs(e.x - c) <= 1 && Math.abs(e.y - r) <= 1 && e.element !== 'water') {
                hits++;
              }
            }
            if (hits > bestHits) {
              bestHits = hits;
              bestCenter = { x: c, y: r };
            }
          }
        }
        center = bestCenter;
      }
      this.triggerFireAttack(center.x, center.y);
    }
  }

  triggerFireAttack(cx, cy) {
    const center = { x: cx, y: cy };
    this.fireCenter = center;
    if (!this.burningTiles) this.burningTiles = new Set();
    this.eventLog.push({ type: 'stratagem', name: '火攻', msg: `火箭齊射，烈火燃遍指定3×3區域(${center.x},${center.y})！` });

    for (let r = Math.max(0, cy - 1); r <= Math.min(12, cy + 1); r++) {
      for (let c = Math.max(0, cx - 1); c <= Math.min(9, cx + 1); c++) {
        const terrain = this.board.getTerrain(c, r);
        if (terrain.char === 'f' || terrain.char === 'm') {
          this.burningTiles.add(`${c},${r}`);
          if (this.cursedTiles) {
            this.cursedTiles.delete(`${c},${r}`); // Fire cleanses cursed miasma
          }
        }
      }
    }

    for (const e of this.enemies) {
      if (this.burningTiles.has(`${e.x},${e.y}`)) {
        if (e.element !== 'water') {
          e.hp = Math.max(0, e.hp - 10);
          this.eventLog.push({ type: 'fire_hit', target: e.id, damage: 10 });
        }
      }
    }
  }

  tickBurningTiles() {
    if (!this.burningTiles || this.burningTiles.size === 0) return;
    const spreadCandidates = [];
    for (const key of this.burningTiles) {
      const [tx, ty] = key.split(',').map(Number);
      if (this.cursedTiles) {
        this.cursedTiles.delete(key);
      }
      const unit = this.getUnitAt(tx, ty);
      if (unit && unit.hp > 0 && unit.element !== 'water') {
        unit.hp = Math.max(0, unit.hp - 4);
        this.eventLog.push({ type: 'fire_burn', target: unit.id, damage: 4 });
      }
      const adj = [
        { x: tx + 1, y: ty }, { x: tx - 1, y: ty },
        { x: tx, y: ty + 1 }, { x: tx, y: ty - 1 }
      ];
      for (const a of adj) {
        if (this.board.inBounds(a.x, a.y) && !this.burningTiles.has(`${a.x},${a.y}`)) {
          const char = this.board.getTerrain(a.x, a.y).char;
          if (char === 'f' || char === 'm') { // Spread onto forest and market tiles
            spreadCandidates.push(`${a.x},${a.y}`);
          }
        }
      }
    }
    if (spreadCandidates.length > 0 && this.currentTurn <= 3) {
      const pick = spreadCandidates[0];
      this.burningTiles.add(pick);
      if (this.cursedTiles) {
        this.cursedTiles.delete(pick);
      }
      this.eventLog.push({ type: 'fire_spread', tile: pick, msg: '風助火勢，烈焰蔓延至相鄰竹林！' });
    }
  }

  triggerWaterFlood(targetRowMin = 4, targetRowMax = 8) {
    if (!this.floodedTiles) this.floodedTiles = new Map();
    this.eventLog.push({ type: 'stratagem', name: '水淹', msg: '江河開閘決堤，巨浪滔天席捲淺灘河道！' });

    for (let r = targetRowMin; r <= targetRowMax; r++) {
      for (let c = 0; c < 10; c++) {
        const char = this.board.getTerrainChar(c, r);
        if (char === 's') {
          const key = `${c},${r}`;
          this.floodedTiles.set(key, 2);
          if (!this.originalTerrain) this.originalTerrain = new Map();
          if (!this.originalTerrain.has(key)) this.originalTerrain.set(key, char);
          this.board.setTerrainChar(c, r, 'w');
        }
      }
    }

    for (const e of this.enemies) {
      if (this.floodedTiles.has(`${e.x},${e.y}`)) {
        if (!e.flyer) {
          e.hp = Math.max(0, e.hp - 12);
          this.eventLog.push({ type: 'flood_hit', target: e.id, damage: 12, msg: `巨浪衝擊【${e.name}】造成12點傷害！` });
          if (e.hp > 0) {
            const pushY = Math.min(12, e.y + 1);
            if (!this.getUnitAt(e.x, pushY) && !this.board.isImpassable(e.x, pushY, false)) {
              e.y = pushY;
            }
          }
        }
      }
    }
  }

  tickFloodedTiles() {
    if (!this.floodedTiles || this.floodedTiles.size === 0) return;
    for (const [key, turns] of this.floodedTiles.entries()) {
      if (turns <= 1) {
        const [c, r] = key.split(',').map(Number);
        const orig = this.originalTerrain?.get(key) || '.';
        this.board.setTerrainChar(c, r, orig);
        this.floodedTiles.delete(key);
      } else {
        this.floodedTiles.set(key, turns - 1);
      }
    }
  }

  isTileLit(x, y) {
    const allLanterns = [...(this.board?.placedLanterns || []), ...(this.chapter?.lanterns || [])];
    for (const lantern of allLanterns) {
      const rad = lantern.radius || 2;
      if (Math.abs(lantern.x - x) <= rad && Math.abs(lantern.y - y) <= rad) {
        return true;
      }
    }
    return false;
  }

  isFogActive() {
    return Boolean(this.chapter.hasNightFog || this.chapter.id === 5);
  }

  calculateVisionMap() {
    const visibleTiles = new Set();
    if (!this.isFogActive()) {
      for (let r = 0; r < 13; r++) {
        for (let c = 0; c < 10; c++) {
          visibleTiles.add(`${c},${r}`);
        }
      }
      return visibleTiles;
    }

    // Allied unit vision
    for (const ally of this.allies) {
      if (ally.hp <= 0) continue;
      const radius = (ally.id === 'cat_patrol' || ally.id === 'mist_scout' || ally.id === 'lantern_crafter' || ally.role === 'scout') ? 4 : 2;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = ally.x + dx;
          const ny = ally.y + dy;
          if (this.board.inBounds(nx, ny)) {
            if (Math.abs(dx) + Math.abs(dy) <= radius + 1) {
              visibleTiles.add(`${nx},${ny}`);
            }
          }
        }
      }
    }

    // Active placed lanterns & chapter lanterns
    const allLanterns = [...(this.board.placedLanterns || []), ...(this.chapter.lanterns || [])];
    for (const lantern of allLanterns) {
      const rad = lantern.radius || 2;
      for (let dy = -rad; dy <= rad; dy++) {
        for (let dx = -rad; dx <= rad; dx++) {
          const nx = lantern.x + dx;
          const ny = lantern.y + dy;
          if (this.board.inBounds(nx, ny)) {
            visibleTiles.add(`${nx},${ny}`);
          }
        }
      }
    }

    return visibleTiles;
  }

  isUnitVisible(unit) {
    if (!this.isFogActive()) return true;
    if (unit.team === 'ally') return true;
    const vision = this.calculateVisionMap();
    return vision.has(`${unit.x},${unit.y}`);
  }

  calculateEnemyVisionMap() {
    if (!this.isFogActive()) {
      const all = new Set();
      for (let r = 0; r < 13; r++) {
        for (let c = 0; c < 10; c++) {
          all.add(`${c},${r}`);
        }
      }
      return all;
    }
    const visibleTiles = new Set();
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      const radius = (enemy.role === 'scout' || enemy.id === 'mist_scout') ? 4 : 2;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = enemy.x + dx;
          const ny = enemy.y + dy;
          if (this.board.inBounds(nx, ny) && Math.abs(dx) + Math.abs(dy) <= radius + 1) {
            visibleTiles.add(`${nx},${ny}`);
          }
        }
      }
    }
    const allLanterns = [...(this.board.placedLanterns || []), ...(this.chapter.lanterns || [])];
    for (const lantern of allLanterns) {
      const rad = lantern.radius || 2;
      for (let dy = -rad; dy <= rad; dy++) {
        for (let dx = -rad; dx <= rad; dx++) {
          const nx = lantern.x + dx;
          const ny = lantern.y + dy;
          if (this.board.inBounds(nx, ny)) {
            visibleTiles.add(`${nx},${ny}`);
          }
        }
      }
    }
    return visibleTiles;
  }

  calculateBattleRewards() {
    let mvpId = null;
    let maxScore = -1;
    for (const ally of this.allies) {
      if (ally.role === 'npc' || ally.role === 'objective') continue;
      const score = (this.actionScores[ally.id] || 0) + (ally.hp > 0 ? 25 : 0);
      if (score > maxScore) {
        maxScore = score;
        mvpId = ally.id;
      }
    }

    const awards = [];
    for (const ally of this.allies) {
      if (ally.role === 'npc' || ally.role === 'objective') continue;
      const isMvp = (ally.id === mvpId);
      const baseExp = 35;
      const actionExp = Math.min(35, Math.floor((this.actionScores[ally.id] || 0) * 0.8));
      const mvpBonus = isMvp ? 30 : 0;
      const totalExp = baseExp + actionExp + mvpBonus;
      awards.push({
        id: ally.id,
        name: ally.name,
        isMvp,
        score: this.actionScores[ally.id] || 0,
        expGained: totalExp,
        reason: isMvp ? '【本戰MVP】斬將拔旗，戰功卓著！' : '作戰英勇，獲軍略功勳'
      });
    }
    return { awards, mvpId };
  }

  getAllLivingUnits() {
    return [...this.allies, ...this.enemies].filter(u => u.hp > 0);
  }

  getUnitAt(x, y) {
    return this.getAllLivingUnits().find(u => u.x === x && u.y === y);
  }

  getReachableFor(unit, options = {}) {
    if (unit.acted) return new Map();
    return getReachableTiles(this.board, unit, this.getAllLivingUnits(), { cursedTiles: this.cursedTiles, ...options });
  }

  moveUnit(unit, toX, toY) {
    if (unit.acted) return false;
    unit.turnStartX = unit.x;
    unit.turnStartY = unit.y;

    const moved = (toX !== unit.x || toY !== unit.y);

    if (toX !== unit.x) {
      unit.facing = toX > unit.x ? 1 : -1;
    }

    unit.x = toX;
    unit.y = toY;
    unit.moved = true;

    // MAJOR 3: Cavalry entering spear_wall ZOC suffers free intercept hit
    const isCavalry = unit.role === 'cavalry' || unit.cls === '騎兵';
    if (moved && isCavalry) {
      const opposingUnits = unit.team === 'ally' ? this.enemies : this.allies;
      const spearHostile = opposingUnits.find(u =>
        u.hp > 0 &&
        (u.trait?.id === 'spear_wall' || u.id === 'bear_guard') &&
        Board.manhattan(toX, toY, u.x, u.y) === 1
      );
      if (spearHostile) {
        const dmg = Math.max(1, (spearHostile.atk || 12) - (unit.def || 0));
        unit.hp = Math.max(0, unit.hp - dmg);
        this.eventLog.push({
          type: 'zoc_strike',
          attacker: spearHostile.id,
          target: unit.id,
          damage: dmg,
          msg: `【槍林截擊】${spearHostile.name}長槍如林，對突入之${unit.name}造成${dmg}點截擊傷害！`
        });
      }
    }

    return true;
  }

  undoMove(unit) {
    if (unit.acted || !unit.moved) return false;
    unit.x = unit.turnStartX;
    unit.y = unit.turnStartY;
    unit.moved = false;
    return true;
  }

  checkBondAvailable(unit) {
    if (this.usedBondPairThisBattle) return null;
    for (const bond of BOND_PAIRS) {
      if (bond.pair.includes(unit.id)) {
        const partnerId = bond.pair.find(id => id !== unit.id);
        const partner = this.allies.find(u => u.id === partnerId && u.hp > 0);
        if (partner && Board.manhattan(unit.x, unit.y, partner.x, partner.y) === 1) {
          return { bond, partner };
        }
      }
    }
    return null;
  }

  confirmAction(unit, actionType, target = null, options = {}) {
    let result = { success: true, events: [] };

    switch (actionType) {
      case 'wait':
        unit.acted = true;
        unit.moved = false;
        break;

      case 'attack': {
        if (!target) return { success: false, reason: '未選擇目標' };
        // Set facing towards target
        if (target.x !== unit.x) {
          unit.facing = target.x > unit.x ? 1 : -1;
        }

        const combatRes = executeCombat(unit, target, this.board, this.rng, {
          actionType: 'attack',
          movedTiles: unit.moved ? Board.manhattan(unit.x, unit.y, unit.turnStartX, unit.turnStartY) : 0,
          allies: this.allies
        });

        result.events = combatRes.events;
        unit.acted = true;
        unit.moved = false;

        // Gain EXP & track action score
        if (unit.team === 'ally') {
          const hit = combatRes.events?.find(e => e.type === 'hit');
          if (hit) {
            this.actionScores[unit.id] = (this.actionScores[unit.id] || 0) + (hit.damage || 10);
            if (target.hp <= 0) {
              this.actionScores[unit.id] = (this.actionScores[unit.id] || 0) + 30;
            }
          }
        }
        if (this.campaign && unit.team === 'ally' && unit.role !== 'npc' && unit.role !== 'objective') {
          const expRes = this.campaign.addExp(unit.id, 30);
          result.expGained = 30;
          result.levelUp = expRes;
        }
        break;
      }

      case 'skill': {
        const skill = unit.skill;
        const cost = skill?.cost || 0;
        unit.mp = Math.max(0, (unit.mp ?? 6) - cost);

        if (skill?.isLightPlacement) {
          // Lantern crafter placement
          const tx = options.tileX ?? unit.x;
          const ty = options.tileY ?? unit.y;
          this.board.addPlacedLantern(tx, ty, 2, 3);
          if (this.cursedTiles) {
            for (const key of [...this.cursedTiles]) {
              const [cx, cy] = key.split(',').map(Number);
              if (Board.manhattan(tx, ty, cx, cy) <= 2) {
                this.cursedTiles.delete(key);
              }
            }
          }
          result.events.push({ type: 'placed_lantern', x: tx, y: ty, msg: '引魂明燈已置放，照亮四周迷霧並驅散咒蝕！' });
          unit.acted = true;
          unit.moved = false;
        } else if (skill?.isHeal && target) {
          target.hp = Math.min(target.maxHp, target.hp + (skill.heal || 14));
          result.events.push({ type: 'heal', target: target.id, amount: skill.heal || 14, msg: '甘泉清茶，氣血充盈！' });
          unit.acted = true;
          unit.moved = false;
        } else if (skill?.aoe === 'cross') {
          const cx = options.tileX ?? (target ? target.x : unit.x);
          const cy = options.tileY ?? (target ? target.y : unit.y);
          if (cx !== unit.x) unit.facing = cx > unit.x ? 1 : -1;
          const crossTiles = [
            { x: cx, y: cy },
            { x: cx + 1, y: cy },
            { x: cx - 1, y: cy },
            { x: cx, y: cy + 1 },
            { x: cx, y: cy - 1 }
          ];
          for (const tile of crossTiles) {
            const hitUnit = this.getUnitAt(tile.x, tile.y);
            if (hitUnit && hitUnit.team !== unit.team && hitUnit.hp > 0) {
              const combatRes = executeCombat(unit, hitUnit, this.board, this.rng, {
                actionType: 'skill',
                skill
              });
              result.events.push(...combatRes.events);
            }
          }
          unit.acted = true;
          unit.moved = false;
        } else if (target) {
          if (target.x !== unit.x) unit.facing = target.x > unit.x ? 1 : -1;
          const combatRes = executeCombat(unit, target, this.board, this.rng, {
            actionType: 'skill',
            skill,
            allies: this.allies
          });
          result.events = combatRes.events;
          unit.acted = true;
          unit.moved = false;
        }
        if (this.campaign && unit.team === 'ally' && unit.role !== 'npc') {
          this.campaign.addExp(unit.id, 35);
        }
        break;
      }

      case 'magic': {
        const magic = unit.magic;
        const cost = magic?.cost || 0;
        unit.mp = Math.max(0, (unit.mp ?? 6) - cost);

        if (magic?.selfBuff) {
          unit.def += magic.selfBuff.def || 3;
          result.events.push({ type: 'buff', target: unit.id, msg: '鐵壁之陣展開，防禦大增！' });
          unit.acted = true;
          unit.moved = false;
        } else if (magic?.isHeal && target) {
          target.hp = Math.min(target.maxHp, target.hp + (magic.heal || 18));
          result.events.push({ type: 'heal', target: target.id, amount: magic.heal || 18, msg: '靈露滋潤，生機勃發！' });
          unit.acted = true;
          unit.moved = false;
        } else if (magic?.aoe === 'cross') {
          const cx = options.tileX ?? (target ? target.x : unit.x);
          const cy = options.tileY ?? (target ? target.y : unit.y);
          if (cx !== unit.x) unit.facing = cx > unit.x ? 1 : -1;
          const crossTiles = [
            { x: cx, y: cy },
            { x: cx + 1, y: cy },
            { x: cx - 1, y: cy },
            { x: cx, y: cy + 1 },
            { x: cx, y: cy - 1 }
          ];
          for (const tile of crossTiles) {
            const hitUnit = this.getUnitAt(tile.x, tile.y);
            if (hitUnit && hitUnit.team !== unit.team && hitUnit.hp > 0) {
              const combatRes = executeCombat(unit, hitUnit, this.board, this.rng, {
                actionType: 'magic',
                skill: magic
              });
              result.events.push(...combatRes.events);
            }
          }
          unit.acted = true;
          unit.moved = false;
        } else if (target) {
          if (target.x !== unit.x) unit.facing = target.x > unit.x ? 1 : -1;
          const combatRes = executeCombat(unit, target, this.board, this.rng, {
            actionType: 'magic',
            skill: magic
          });
          result.events = combatRes.events;
          unit.acted = true;
          unit.moved = false;
        }
        if (this.campaign && unit.team === 'ally' && unit.role !== 'npc') {
          this.campaign.addExp(unit.id, 35);
        }
        break;
      }

      case 'bond': {
        const bondInfo = this.checkBondAvailable(unit);
        if (bondInfo && target) {
          this.usedBondPairThisBattle = true;
          if (target.x !== unit.x) unit.facing = target.x > unit.x ? 1 : -1;

          // Unit attacks
          const c1 = executeCombat(unit, target, this.board, this.rng, { actionType: 'attack' });
          result.events = [...c1.events];

          // Partner attacks for free!
          if (target.hp > 0) {
            const c2 = executeCombat(bondInfo.partner, target, this.board, this.rng, { actionType: 'attack' });
            result.events.push(...c2.events);
          }

          result.events.push({ type: 'bond_coop', name: bondInfo.bond.name, msg: `發動【${bondInfo.bond.name}】合擊！` });
          unit.acted = true;
          unit.moved = false;
        }
        break;
      }
    }

    // Check status after action
    this.status = checkBattleStatus(this.chapter, this);
    if (this.status.finished) {
      this.phase = 'finished';
      if (this.status.victory && this.campaign) {
        this.campaign.completeChapter(this.chapter.id);
      }
    }

    return result;
  }

  /** Outnumbered morale: when living foes outnumber the squad, guardians fight harder (背水一戰 +20% dmg). */
  updateLastStand() {
    const squad = this.allies.filter(a => a.hp > 0 && a.role !== 'npc' && a.role !== 'objective').length;
    const foes = this.enemies.filter(e => e.hp > 0).length;
    const on = foes > squad;
    for (const a of this.allies) a.lastStand = on;
    this.lastStandActive = on;
  }

  isAllyPhaseComplete() {
    return this.allies.filter(u => u.hp > 0 && u.role !== 'npc' && u.role !== 'objective').every(u => u.acted);
  }

  endTurn() {
    if (this.phase === 'finished') return;

    // Tick lanterns
    this.board.tickLanterns();

    // Check if ally inspire buff expires
    if (this.currentTurn >= 2) {
      for (const a of this.allies) a.inspireBonus = false;
    }

    // Start enemy phase
    this.phase = 'enemy';

    // Check status
    this.status = checkBattleStatus(this.chapter, this);
    if (this.status.finished) {
      this.phase = 'finished';
      return;
    }

    // Handle Night raid stratagem on Turn 1
    if (this.currentTurn === 1 && this.enemySkipsTurn1) {
      this.eventLog.push({ type: 'skip', msg: '敵方因夜襲陷入慌亂，本回合跳過！' });
      this.endEnemyPhase();
      return;
    }

    // Process enemy AI turns
    const livingEnemies = this.enemies.filter(e => e.hp > 0);
    const enemyActions = [];

    // Handle Feint stratagem on Turn 1 (cavalry paths toward decoy tile away from cart)
    if (this.currentTurn === 1 && this.stratagemId === 'feint') {
      this.eventLog.push({ type: 'feint', msg: '佯攻得手！敵方騎兵被誘餌引向偏遠方向！' });
      const decoy = { x: 9, y: 1 };
      for (const e of livingEnemies) {
        if (e.role === 'cavalry') {
          const reachable = this.getReachableFor(e);
          const tiles = Array.from(reachable.values());
          if (tiles.length > 0) {
            tiles.sort((a, b) => Board.manhattan(a.x, a.y, decoy.x, decoy.y) - Board.manhattan(b.x, b.y, decoy.x, decoy.y));
            this.moveUnit(e, tiles[0].x, tiles[0].y);
          }
          e.acted = true;
        }
      }
    }

    for (const enemy of livingEnemies) {
      if (this.status.finished) break;
      if (enemy.acted) continue;
      if (enemy.aggro === 'guard' && !enemy.alerted) {
        const hurt = enemy.maxHp && enemy.hp < enemy.maxHp;
        const near = this.allies.some(a => a.hp > 0 && a.role !== 'npc' && Board.manhattan(a.x, a.y, enemy.x, enemy.y) <= enemy.guardRadius);
        if (!hurt && !near) continue;
        enemy.alerted = true;
        this.eventLog.push({ type: 'alert', msg: `${enemy.name}察覺到你的行蹤！` });
      }
      const decision = decideEnemyTurn(enemy, this, this.rng);
      enemyActions.push({ enemy, decision });

      // Execute enemy action
      if (decision.move) {
        this.moveUnit(enemy, decision.move.x, decision.move.y);
      }
      if (decision.newFacing) {
        enemy.facing = decision.newFacing;
      }

      // If enemy was eliminated by ZOC intercept strike during move, skip attack
      if (enemy.hp <= 0) {
        this.status = checkBattleStatus(this.chapter, this);
        if (this.status.finished) {
          this.phase = 'finished';
          break;
        }
        continue;
      }

      if ((decision.type === 'attack' || decision.type === 'magic') && decision.target) {
        executeCombat(enemy, decision.target, this.board, this.rng, {
          actionType: decision.type,
          element: decision.element || null,
          movedTiles: decision.movedTiles || 0
        });
        if (enemy.role === 'curse_sorcerer' || enemy.id === 'curse_sorcerer') {
          this.applyCurseTiles(decision.target.x, decision.target.y);
        }
      } else if (decision.type === 'heal' && decision.target) {
        decision.target.hp = Math.min(decision.target.maxHp, decision.target.hp + (decision.healAmount || 8));
      } else if ((decision.type === 'aoe' || decision.type === 'aoe_skill') && decision.targets) {
        if (decision.mpCost && enemy.mp) {
          enemy.mp = Math.max(0, enemy.mp - decision.mpCost);
        }
        for (const t of decision.targets) {
          t.hp = Math.max(0, t.hp - capDamageToAlly(t, decision.damage || 10));
        }
        if (enemy.role === 'curse_sorcerer' || enemy.id === 'curse_sorcerer') {
          this.applyCurseTiles(enemy.x, enemy.y);
        }
      }

      // Opening grace: no player unit can fall during the very first enemy phase
      if (this.currentTurn === 1) {
        for (const a of this.allies) if (a.hp <= 0 && a.role !== 'objective') a.hp = 1;
      }

      // Check objective status after each enemy action
      this.status = checkBattleStatus(this.chapter, this);
      if (this.status.finished) {
        this.phase = 'finished';
        break;
      }
    }

    this.lastEnemyActions = enemyActions;
    this.endEnemyPhase();
  }

  applyCurseTiles(cx, cy) {
    if (!this.cursedTiles) this.cursedTiles = new Set();
    const area = [
      { x: cx, y: cy },
      { x: cx + 1, y: cy },
      { x: cx - 1, y: cy },
      { x: cx, y: cy + 1 },
      { x: cx, y: cy - 1 }
    ];
    for (const c of area) {
      if (this.board.inBounds(c.x, c.y) && !this.isTileLit(c.x, c.y) && (!this.burningTiles || !this.burningTiles.has(`${c.x},${c.y}`))) {
        this.cursedTiles.add(`${c.x},${c.y}`);
      }
    }
  }

  tickCursedTiles() {
    if (!this.cursedTiles || this.cursedTiles.size === 0) return;
    for (const key of [...this.cursedTiles]) {
      const [tx, ty] = key.split(',').map(Number);
      if (this.isTileLit(tx, ty) || (this.burningTiles && this.burningTiles.has(key))) {
        this.cursedTiles.delete(key);
        continue;
      }
      const unit = this.getUnitAt(tx, ty);
      if (unit && unit.hp > 0 && unit.team === 'ally') {
        unit.hp = Math.max(0, unit.hp - 4);
        this.eventLog.push({
          type: 'curse_damage',
          target: unit.id,
          damage: 4,
          msg: `【幽冥咒縛】${unit.name}踏足咒蝕之地，受陰煞侵蝕損失4點氣血！`
        });
      }
    }
  }

  endEnemyPhase() {
    if (this.status.finished) return;

    // Check reinforcements (e.g. Chapter 4 Turn 5 mother_of_mist)
    if (this.chapter.reinforcements) {
      for (const r of this.chapter.reinforcements) {
        if (this.currentTurn + 1 === r.turn) {
          const proto = ENEMY_PROTOS[r.id];
          if (proto && !this.enemies.some(e => e.id === r.id)) {
            this.enemies.push({
              ...proto,
              instanceId: `${r.id}_reinforce`,
              x: r.x,
              y: r.y,
              facing: r.facing || -1,
              acted: false
            });
            this.eventLog.push({ type: 'reinforce', name: proto.name, msg: r.bark || '迷霧深處傳來了可怖的咆哮！' });
          }
        }
      }
    }

    // Advance turn & reset allies
    this.currentTurn++;
    this.phase = 'ally';

    this.tickBurningTiles();
    this.tickFloodedTiles();
    this.tickCursedTiles();

    for (const a of this.allies) {
      a.acted = false;
      a.moved = false;
      a.turnStartX = a.x;
      a.turnStartY = a.y;
    }
    for (const e of this.enemies) {
      e.acted = false;
    }
    this.updateLastStand();

    // Check final status for turn limit
    this.status = checkBattleStatus(this.chapter, this);
    if (this.status.finished) {
      this.phase = 'finished';
      if (this.status.victory && this.campaign) {
        this.campaign.completeChapter(this.chapter.id);
      }
    }
  }
}
