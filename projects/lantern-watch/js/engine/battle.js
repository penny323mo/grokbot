/**
 * js/engine/battle.js
 * Core battle state machine for 燈影軍略 (v4).
 * Manages turns, units, actions, undo, bonds, stratagems, and objective tracking.
 */

import { Board } from './board.js';
import { ENEMY_PROTOS, NPC_PROTOS, BOND_PAIRS, getClassSynergies } from '../data/units.js';
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
    this.weather = chapter.weather || 'clear';
    this.board.weather = this.weather;

    this.currentTurn = 1;
    this.phase = 'ally'; // 'ally' | 'enemy' | 'finished'
    this.status = { finished: false, victory: false, reason: '' };

    this.allies = [];
    this.enemies = [];
    this.eventLog = [];
    this.telegraphedReinforcements = new Set();
    this.allyMorale = 100;
    this.enemyMorale = 100;
    this.maxMorale = 100;
    this.usedBondPairThisBattle = false;
    this.rallyUsed = false;
    this.actionScores = {};
    this.unitStats = {};
    this.escortPath = chapter.escortPath || null;
    this.escortStep = 0;
    this.cartHold = false;
    this.cartSpeedBoost = false;
    this.floodedTiles = new Map();
    this.originalTerrain = new Map();
    this.burningTiles = new Set();
    this.cursedTiles = new Set();

    this.initUnits(squadUnits, this.options);
    for (const a of this.allies) {
      this.unitStats[a.id] = { damageDealt: 0, kills: 0, heals: 0 };
    }
    this.updateLastStand();
    this.applyStratagemAtStart();
    this.checkTelegraphedReinforcements();
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
            element: conf.element || proto.element || null,
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

    // Compute active class synergies
    this.synergies = getClassSynergies(this.allies);
    if (this.synergies.some(s => s.id === 'cavalry_coop')) {
      for (const a of this.allies) {
        if (a.team === 'ally' && a.id !== 'lantern_cart' && a.role !== 'objective') {
          a.mov = (a.mov || 3) + 1;
          a._cavalryCoopBonus = true;
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
    } else if (this.stratagemId === 'cart_speed') {
      this.triggerCartSpeed();
    } else if (this.stratagemId === 'cart_hold') {
      this.triggerCartHold();
    } else if (this.stratagemId === 'rolling_log') {
      this.triggerRollingLog();
    }
  }

  triggerRally() {
    if (this.rallyUsed) return false;
    this.rallyUsed = true;
    this.modifyMorale('ally', 25, '擂鼓振威');
    if (this.chapter?.objectiveType === 'escort') {
      this.cartSpeedBoost = true;
    }
    const leader = this.allies.find(a => a.hp > 0);
    if (leader) {
      for (const a of this.allies) {
        if (a.hp > 0 && Board.manhattan(a.x, a.y, leader.x, leader.y) <= 2) {
          a.mov = (a.mov || 3) + 1;
          a.rallyBuffed = true;
        }
      }
    }
    this.eventLog.push({
      type: 'stratagem',
      name: '擂鼓',
      msg: '【擂鼓振威】戰鼓如雷，我軍士氣提升25點，將士周圍2格友軍本回合移動力+1！'
    });
    return true;
  }

  awardBonusExp(unit, amount, reason = '擊潰逃敵') {
    if (this.campaign) {
      this.campaign.addExp(unit.id, amount);
    }
    this.eventLog.push({
      type: 'bonus_xp',
      unitId: unit.id,
      amount,
      reason,
      msg: `【${reason} +${amount} XP】${unit.name}追擊潰逃敵兵，全軍士氣大振！`
    });
  }

  modifyMorale(team, delta, reason = '') {
    if (team === 'ally') {
      this.allyMorale = Math.max(0, Math.min(this.maxMorale, this.allyMorale + delta));
    } else {
      this.enemyMorale = Math.max(0, Math.min(this.maxMorale, this.enemyMorale + delta));
    }
    const tag = team === 'ally' ? '我軍' : '敵軍';
    const sign = delta > 0 ? `+${delta}` : `${delta}`;
    const msg = `【${tag}士氣 ${sign}】${reason ? ' · ' + reason : ''}`;
    this.eventLog.push({ type: 'morale', team, delta, reason, msg });
  }

  processCombatMorale(attacker, defender, combatRes) {
    if (!combatRes || !combatRes.preview) return;
    const { preview, attackerAlive, defenderAlive } = combatRes;

    // Check flank attacks by allies against enemies
    if (attacker.team === 'ally' && defender.team === 'enemy') {
      const st = (this.unitStats[attacker.id] = this.unitStats[attacker.id] || { damageDealt: 0, kills: 0, heals: 0 });
      const hitEvent = combatRes.events?.find(e => e.type === 'hit');
      if (hitEvent) {
        st.damageDealt += (hitEvent.damage || 0);
      }
      if (!defenderAlive) {
        st.kills += 1;
      }
      if (preview.isBackAttack) {
        this.modifyMorale('enemy', -5, '背刺重創');
      } else if (preview.isSideAttack) {
        this.modifyMorale('enemy', -2, '側翼奇襲');
      }
    }

    // Check defeats
    if (!defenderAlive && defender._moraleProcessed !== true) {
      defender._moraleProcessed = true;
      if (defender.team === 'enemy') {
        const isCommander = defender.role === 'commander' || defender.isBoss || defender.id === this.chapter.bossId;
        const delta = isCommander ? -25 : -8;
        this.modifyMorale('enemy', delta, isCommander ? '主將陣亡' : '陣斬敵兵');
        if (defender.isRouted && attacker.team === 'ally') {
          this.awardBonusExp(attacker, 5, '擊潰逃敵');
        }
      } else if (defender.team === 'ally') {
        this.modifyMorale('ally', -15, '折損將士');
      }
    }

    if (!attackerAlive && attacker._moraleProcessed !== true) {
      attacker._moraleProcessed = true;
      if (attacker.team === 'enemy') {
        const isCommander = attacker.role === 'commander' || attacker.isBoss || attacker.id === this.chapter.bossId;
        const delta = isCommander ? -25 : -8;
        this.modifyMorale('enemy', delta, isCommander ? '主將陣亡' : '陣斬敵兵');
      } else if (attacker.team === 'ally') {
        this.modifyMorale('ally', -15, '折損將士');
      }
    }
  }

  triggerRollingLog(targetCols = [3, 4, 5]) {
    this.eventLog.push({
      type: 'stratagem',
      name: '滾木',
      msg: '【滾木傾瀉】擂木巨石自萬壑絕壁轟然滾落，重創峽道敵陣並砸碎重裝盾陣！'
    });

    for (const e of this.enemies) {
      if (targetCols.includes(e.x) && e.y >= 2 && e.y <= 9) {
        e.hp = Math.max(0, e.hp - 16);
        if (e.trait?.id === 'phalanx_wall' || e.role === 'shield_phalanx') {
          e.phalanxBroken = true;
        }
        const ny = Math.min(12, e.y + 1);
        if (!this.board.isImpassable(e.x, ny, false) && !this.getUnitAt(e.x, ny)) {
          e.y = ny;
        }
        this.eventLog.push({
          type: 'rolling_log_hit',
          target: e.id,
          damage: 16,
          msg: `滾木巨力轟擊【${e.name}】，造成16點傷害並破除盾陣！`
        });
        if (e.hp <= 0 && !e._moraleProcessed) {
          e._moraleProcessed = true;
          this.modifyMorale('enemy', -8, '滾木砸死敵兵');
        }
      }
    }
  }

  checkTelegraphedReinforcements() {
    if (!this.chapter?.reinforcements) return;
    for (const r of this.chapter.reinforcements) {
      if (r.turn === this.currentTurn + 1 && !this.telegraphedReinforcements.has(r)) {
        this.telegraphedReinforcements.add(r);
        const proto = ENEMY_PROTOS[r.id];
        const name = proto ? proto.name : '敵軍精銳';
        this.eventLog.push({
          type: 'reinforce_warning',
          turn: r.turn,
          x: r.x,
          y: r.y,
          id: r.id,
          name,
          msg: `【敵襲警報】斥候探明：下回合（第${r.turn}回合）敵軍【${name}】將於(${r.x},${r.y})發起突襲！`
        });
      }
    }
  }

  getIncomingReinforcements() {
    if (!this.chapter?.reinforcements) return [];
    return this.chapter.reinforcements.filter(r => r.turn === this.currentTurn + 1);
  }

  triggerFireAttack(cx, cy) {
    const center = { x: cx, y: cy };
    this.fireCenter = center;
    if (!this.burningTiles) this.burningTiles = new Set();
    const weatherNotice = this.weather === 'rain' ? '（暴雨綿延，火勢受制，傷害-25%）' : '';
    this.eventLog.push({ type: 'stratagem', name: '火攻', msg: `火箭齊射，烈火燃遍指定3×3區域(${center.x},${center.y})！${weatherNotice}` });

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

    const fireBaseDmg = this.weather === 'rain' ? 8 : 10;
    for (const e of this.enemies) {
      if (this.burningTiles.has(`${e.x},${e.y}`)) {
        if (e.element !== 'water') {
          e.hp = Math.max(0, e.hp - fireBaseDmg);
          this.eventLog.push({ type: 'fire_hit', target: e.id, damage: fireBaseDmg });
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
        if (unit.hp <= 0 && !unit._moraleProcessed) {
          unit._moraleProcessed = true;
          if (unit.team === 'enemy') {
            const isCommander = unit.role === 'commander' || unit.isBoss || unit.id === this.chapter.bossId;
            this.modifyMorale('enemy', isCommander ? -25 : -8, isCommander ? '主將陣亡' : '火灼陣亡');
          } else if (unit.team === 'ally') {
            this.modifyMorale('ally', -15, '折損將士');
          }
        }
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
    const weatherNotice = this.weather === 'rain' ? '（暴雨助陣，江河浪潮兇猛，傷害+25%）' : '';
    this.eventLog.push({ type: 'stratagem', name: '水淹', msg: `江河開閘決堤，巨浪滔天席捲淺灘河道！${weatherNotice}` });

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

    const floodDmg = this.weather === 'rain' ? 15 : 12;
    for (const e of this.enemies) {
      if (this.floodedTiles.has(`${e.x},${e.y}`)) {
        if (!e.flyer) {
          e.hp = Math.max(0, e.hp - floodDmg);
          this.eventLog.push({ type: 'flood_hit', target: e.id, damage: floodDmg, msg: `巨浪衝擊【${e.name}】造成${floodDmg}點傷害！` });
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
        stats: this.unitStats[ally.id] || { damageDealt: 0, kills: 0, heals: 0 },
        reason: isMvp ? '【本戰MVP】斬將拔旗，戰功卓著！' : '作戰英勇，獲軍略功勳'
      });
    }
    return { awards, mvpId };
  }

  getEscortCart() {
    return this.allies.find(a => a.id === (this.chapter.escortTargetId || 'lantern_cart'));
  }

  isCartGuarded() {
    const cart = this.getEscortCart();
    if (!cart || cart.hp <= 0) return false;
    return this.allies.some(a => a.hp > 0 && a.id !== cart.id && (Math.abs(a.x - cart.x) + Math.abs(a.y - cart.y) === 1));
  }

  getNextCartDestination() {
    const path = this.chapter?.escortPath;
    if (!path) return null;
    const nextIdx = (this.escortStep || 0) + 1;
    if (nextIdx < path.length) {
      return path[nextIdx];
    }
    return null;
  }

  triggerCartSpeed() {
    this.cartSpeedBoost = true;
    this.cartHold = false;
    this.eventLog.push({ type: 'cart_speed', msg: '【全速前進】號令下達！引路燈車將加速疾馳！' });
  }

  triggerCartHold() {
    this.cartHold = true;
    this.cartSpeedBoost = false;
    this.eventLog.push({ type: 'cart_hold', msg: '【原地待援】號令下達！引路燈車原地固守待援！' });
  }

  advanceEscortCart() {
    const cart = this.getEscortCart();
    if (!cart || cart.hp <= 0) return;
    const path = this.chapter?.escortPath;
    if (!path || !path.length) return;

    if (this.cartHold) {
      this.cartHold = false;
      this.eventLog.push({ type: 'cart_held', msg: '【燈車止步】引路燈車遵令原地據守待援！' });
      return;
    }

    const stepsToMove = this.cartSpeedBoost ? 2 : 1;
    this.cartSpeedBoost = false;

    for (let s = 0; s < stepsToMove; s++) {
      const nextStepIdx = (this.escortStep || 0) + 1;
      if (nextStepIdx >= path.length) break;
      const targetCoord = path[nextStepIdx];
      // Check if blocked by enemy
      const enemyAtTile = this.enemies.find(e => e.hp > 0 && e.x === targetCoord.x && e.y === targetCoord.y);
      if (enemyAtTile) {
        this.eventLog.push({ type: 'cart_blocked', msg: `【路障受阻】前方有敵軍【${enemyAtTile.name}】攔路，燈車暫緩前行！` });
        break;
      }
      // If blocked by ally, shift ally to adjacent open tile
      const allyAtTile = this.allies.find(a => a.hp > 0 && a.id !== cart.id && a.x === targetCoord.x && a.y === targetCoord.y);
      if (allyAtTile) {
        const adj = [
          { x: allyAtTile.x + 1, y: allyAtTile.y }, { x: allyAtTile.x - 1, y: allyAtTile.y },
          { x: allyAtTile.x, y: allyAtTile.y + 1 }, { x: allyAtTile.x, y: allyAtTile.y - 1 }
        ];
        const open = adj.find(p => this.board.inBounds(p.x, p.y) && !this.getUnitAt(p.x, p.y) && !this.board.isImpassable(p.x, p.y));
        if (open) {
          allyAtTile.x = open.x;
          allyAtTile.y = open.y;
        } else {
          break;
        }
      }

      // Move cart
      cart.turnStartX = cart.x;
      cart.turnStartY = cart.y;
      cart.x = targetCoord.x;
      cart.y = targetCoord.y;
      this.escortStep = nextStepIdx;
      this.eventLog.push({
        type: 'cart_move',
        x: cart.x,
        y: cart.y,
        step: this.escortStep,
        total: path.length,
        msg: `【燈車前進】引路燈車沿石道推進至(${cart.x},${cart.y})！`
      });

      // Check win condition
      if (this.chapter.escortGoal) {
        const { rowMax, colMin } = this.chapter.escortGoal;
        if (cart.y <= rowMax && cart.x >= colMin) {
          this.status = { finished: true, victory: true, reason: '引路燈車成功安抵北岸燈標！' };
          this.phase = 'finished';
          break;
        }
      }
    }
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

  /** Pathfinding route from the unit's current tile to (toX,toY), used for walk animation. */
  computeMovePath(unit, toX, toY) {
    if (unit.x === toX && unit.y === toY) return [{ x: toX, y: toY }];
    try {
      const reach = getReachableTiles(this.board, unit, this.getAllLivingUnits(), { cursedTiles: this.cursedTiles });
      const hit = reach.get(`${toX},${toY}`);
      if (hit && hit.path && hit.path.length) {
        const path = hit.path.map(p => ({ x: p.x, y: p.y }));
        const last = path[path.length - 1];
        if (last.x !== toX || last.y !== toY) path.push({ x: toX, y: toY });
        return path;
      }
    } catch (e) { /* fall through */ }
    // Fallback: L-shaped orthogonal steps (never a diagonal slide)
    const path = [{ x: unit.x, y: unit.y }];
    let cx = unit.x, cy = unit.y;
    while (cx !== toX) { cx += Math.sign(toX - cx); path.push({ x: cx, y: cy }); }
    while (cy !== toY) { cy += Math.sign(toY - cy); path.push({ x: cx, y: cy }); }
    return path;
  }

  /** Enemies the unit can attack right now from its current tile, without moving. */
  getTargetsInRangeNow(unit) {
    if (!unit || unit.acted) return [];
    const keys = new Set(getAttackRangeTiles(this.board, unit, unit.x, unit.y).map(t => `${t.x},${t.y}`));
    const foes = unit.team === 'ally' ? this.enemies : this.allies;
    return foes.filter(f => f.hp > 0 && keys.has(`${f.x},${f.y}`) && (!this.isUnitVisible || this.isUnitVisible(f)));
  }

  /** Stay in place: counts as the move step (0 tiles) so the action menu can open. */
  holdPosition(unit) {
    if (unit.acted) return false;
    return this.moveUnit(unit, unit.x, unit.y);
  }

  moveUnit(unit, toX, toY) {
    if (unit.acted) return false;
    const path = this.computeMovePath(unit, toX, toY);
    unit.lastPath = path;
    if (!this.movePaths) this.movePaths = [];
    if (path.length > 1) this.movePaths.push({ id: unit.id, team: unit.team, path });
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
          allies: this.allies,
          synergies: this.synergies
        });
        this.processCombatMorale(unit, target, combatRes);

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
          const expGain = target?.hp <= 0 ? 25 : 12;
          const expRes = this.campaign.addExp(unit.id, expGain);
          result.expGained = expGain;
          result.levelUp = expRes;
          if (expRes.leveledUp) {
            unit.level = expRes.newLevel;
            result.events.push({
              type: 'levelup',
              unitId: unit.id,
              unitName: unit.name,
              newLevel: expRes.newLevel,
              statGains: expRes.statGains,
              msg: `【等級提升】${unit.name} 升至 Lv.${expRes.newLevel}！生命+${expRes.statGains.hp} 武力+${expRes.statGains.atk} 防禦+${expRes.statGains.def}！`
            });
          }
        }
        break;
      }

      case 'skill': {
        const skill = options.skill || unit.skill;
        const cost = skill?.cost || 0;
        unit.mp = Math.max(0, (unit.mp ?? 6) - cost);

        if (skill?.isTaunt) {
          let tauntCount = 0;
          for (const e of this.enemies) {
            if (e.hp > 0 && Board.manhattan(unit.x, unit.y, e.x, e.y) === 1) {
              e.isTaunted = true;
              e.tauntTargetId = unit.id;
              tauntCount++;
            }
          }
          result.events.push({
            type: 'taunt',
            source: unit.id,
            count: tauntCount,
            msg: `【怒吼挑釁】熊岳怒吼震懾！相鄰 ${tauntCount} 名敵軍被激怒，下回合強制攻擊熊岳！`
          });
          unit.acted = true;
          unit.moved = false;
        } else if (skill?.isStealth || skill?.selfBuff?.stealth) {
          unit.isStealthed = true;
          result.events.push({
            type: 'stealth',
            source: unit.id,
            msg: '【潛影潛行】墨影遁入夜幕暗影！敵軍非相鄰不可鎖定，持續一回合！'
          });
          unit.acted = true;
          unit.moved = false;
        } else if (skill?.isLightRadius || skill?.id === 'hero_light_lantern') {
          const tx = options.tileX ?? unit.x;
          const ty = options.tileY ?? unit.y;
          this.board.addPlacedLantern(tx, ty, 3, 3);
          let revealed = 0;
          for (const e of this.enemies) {
            if (e.hp > 0 && Board.manhattan(tx, ty, e.x, e.y) <= 3) {
              if (e.isAmbushed || e.isShrouded) {
                e.isAmbushed = false;
                e.isShrouded = false;
                revealed++;
              }
            }
          }
          result.events.push({
            type: 'placed_lantern',
            x: tx,
            y: ty,
            revealed,
            msg: `【明燈破煞】照亮半徑3格迷霧，勘破 ${revealed} 名匿影伏兵！`
          });
          unit.acted = true;
          unit.moved = false;
        } else if (skill?.isCleanse) {
          const healTarget = target || unit;
          healTarget.isConfused = false;
          healTarget.isBurned = false;
          healTarget.isTaunted = false;
          healTarget.isPoisoned = false;
          const healAmt = skill.heal || 12;
          const oldHp = healTarget.hp;
          healTarget.hp = Math.min(healTarget.maxHp, healTarget.hp + healAmt);
          const actualHeal = healTarget.hp - oldHp;
          if (unit.team === 'ally') {
            const st = (this.unitStats[unit.id] = this.unitStats[unit.id] || { damageDealt: 0, kills: 0, heals: 0 });
            st.heals += actualHeal;
          }
          result.events.push({
            type: 'cleanse',
            target: healTarget.id,
            amount: actualHeal,
            msg: `【清心靈茗】驅散 ${healTarget.name} 身上一切異常狀態，恢復 +${actualHeal} HP！`
          });
          unit.acted = true;
          unit.moved = false;
        } else if (skill?.isLightPlacement) {
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
          const healAmt = skill.heal || 14;
          target.hp = Math.min(target.maxHp, target.hp + healAmt);
          if (unit.team === 'ally') {
            const st = (this.unitStats[unit.id] = this.unitStats[unit.id] || { damageDealt: 0, kills: 0, heals: 0 });
            st.heals += healAmt;
          }
          result.events.push({ type: 'heal', target: target.id, amount: healAmt, msg: '甘泉清茶，氣血充盈！' });
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
                noCounter: true, // AoE never provokes one counter per enemy caught in the area
                actionType: 'skill',
                skill,
                allies: this.allies,
                synergies: this.synergies
              });
              this.processCombatMorale(unit, hitUnit, combatRes);
              result.events.push(...combatRes.events);
            }
          }
          unit.acted = true;
          unit.moved = false;
        } else if (skill?.aoe === 'line') {
          let dx = options.dx, dy = options.dy;
          if (dx === undefined && dy === undefined && target) {
            dx = target.x > unit.x ? 1 : (target.x < unit.x ? -1 : 0);
            dy = dx !== 0 ? 0 : (target.y > unit.y ? 1 : (target.y < unit.y ? -1 : 0));
          }
          dx = dx ?? (unit.facing || 1);
          dy = dy ?? 0;
          if (dx !== 0) unit.facing = dx > 0 ? 1 : -1;
          const lineTiles = Board.getLineTiles(unit.x, unit.y, dx, dy, skill.lineLength || 3);
          for (const tile of lineTiles) {
            const hitUnit = this.getUnitAt(tile.x, tile.y);
            if (hitUnit && hitUnit.team !== unit.team && hitUnit.hp > 0) {
              const combatRes = executeCombat(unit, hitUnit, this.board, this.rng, {
                noCounter: true, // AoE never provokes one counter per enemy caught in the area
                actionType: 'skill',
                skill,
                allies: this.allies,
                synergies: this.synergies
              });
              this.processCombatMorale(unit, hitUnit, combatRes);
              result.events.push(...combatRes.events);
            }
          }
          unit.acted = true;
          unit.moved = false;
        } else if (skill?.aoe === 'cone') {
          let dx = options.dx, dy = options.dy;
          if (dx === undefined && dy === undefined && target) {
            dx = target.x > unit.x ? 1 : (target.x < unit.x ? -1 : 0);
            dy = dx !== 0 ? 0 : (target.y > unit.y ? 1 : (target.y < unit.y ? -1 : 0));
          }
          dx = dx ?? (unit.facing || 1);
          dy = dy ?? 0;
          if (dx !== 0) unit.facing = dx > 0 ? 1 : -1;
          const coneTiles = Board.getConeTiles(unit.x, unit.y, dx, dy);
          for (const tile of coneTiles) {
            const hitUnit = this.getUnitAt(tile.x, tile.y);
            if (hitUnit && hitUnit.team !== unit.team && hitUnit.hp > 0) {
              const combatRes = executeCombat(unit, hitUnit, this.board, this.rng, {
                noCounter: true, // AoE never provokes one counter per enemy caught in the area
                actionType: 'skill',
                skill,
                allies: this.allies,
                synergies: this.synergies
              });
              this.processCombatMorale(unit, hitUnit, combatRes);
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
            allies: this.allies,
            synergies: this.synergies
          });
          this.processCombatMorale(unit, target, combatRes);
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
        const magic = options.skill || unit.magic;
        const cost = magic?.cost || 0;
        unit.mp = Math.max(0, (unit.mp ?? 6) - cost);

        if (magic?.selfBuff) {
          // Timed, non-stacking DEF buff on the caster only — never routed through combat
          const amt = magic.selfBuff.def || 3;
          if (unit._fortress) unit.def -= unit._fortress.def;
          unit._fortress = { def: amt, turns: magic.selfBuff.duration || 2 };
          unit.def += amt;
          result.events.push({ type: 'buff', target: unit.id, amount: amt, msg: '鐵壁之陣展開，防禦大增！' });
          unit.acted = true;
          unit.moved = false;
        } else if (magic?.isHeal && target) {
          const healAmt = magic.heal || 18;
          target.hp = Math.min(target.maxHp, target.hp + healAmt);
          if (unit.team === 'ally') {
            const st = (this.unitStats[unit.id] = this.unitStats[unit.id] || { damageDealt: 0, kills: 0, heals: 0 });
            st.heals += healAmt;
          }
          result.events.push({ type: 'heal', target: target.id, amount: healAmt, msg: '靈露滋潤，生機勃發！' });
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
                noCounter: true, // AoE never provokes one counter per enemy caught in the area
                actionType: 'magic',
                skill: magic,
                allies: this.allies,
                synergies: this.synergies
              });
              this.processCombatMorale(unit, hitUnit, combatRes);
              result.events.push(...combatRes.events);
            }
          }
          unit.acted = true;
          unit.moved = false;
        } else if (magic?.aoe === 'line') {
          let dx = options.dx, dy = options.dy;
          if (dx === undefined && dy === undefined && target) {
            dx = target.x > unit.x ? 1 : (target.x < unit.x ? -1 : 0);
            dy = dx !== 0 ? 0 : (target.y > unit.y ? 1 : (target.y < unit.y ? -1 : 0));
          }
          dx = dx ?? (unit.facing || 1);
          dy = dy ?? 0;
          if (dx !== 0) unit.facing = dx > 0 ? 1 : -1;
          const lineTiles = Board.getLineTiles(unit.x, unit.y, dx, dy, magic.lineLength || 3);
          for (const tile of lineTiles) {
            const hitUnit = this.getUnitAt(tile.x, tile.y);
            if (hitUnit && hitUnit.team !== unit.team && hitUnit.hp > 0) {
              const combatRes = executeCombat(unit, hitUnit, this.board, this.rng, {
                noCounter: true, // AoE never provokes one counter per enemy caught in the area
                actionType: 'magic',
                skill: magic,
                allies: this.allies,
                synergies: this.synergies
              });
              this.processCombatMorale(unit, hitUnit, combatRes);
              result.events.push(...combatRes.events);
            }
          }
          unit.acted = true;
          unit.moved = false;
        } else if (magic?.aoe === 'cone') {
          let dx = options.dx, dy = options.dy;
          if (dx === undefined && dy === undefined && target) {
            dx = target.x > unit.x ? 1 : (target.x < unit.x ? -1 : 0);
            dy = dx !== 0 ? 0 : (target.y > unit.y ? 1 : (target.y < unit.y ? -1 : 0));
          }
          dx = dx ?? (unit.facing || 1);
          dy = dy ?? 0;
          if (dx !== 0) unit.facing = dx > 0 ? 1 : -1;
          const coneTiles = Board.getConeTiles(unit.x, unit.y, dx, dy);
          for (const tile of coneTiles) {
            const hitUnit = this.getUnitAt(tile.x, tile.y);
            if (hitUnit && hitUnit.team !== unit.team && hitUnit.hp > 0) {
              const combatRes = executeCombat(unit, hitUnit, this.board, this.rng, {
                noCounter: true, // AoE never provokes one counter per enemy caught in the area
                actionType: 'magic',
                skill: magic,
                allies: this.allies,
                synergies: this.synergies
              });
              this.processCombatMorale(unit, hitUnit, combatRes);
              result.events.push(...combatRes.events);
            }
          }
          unit.acted = true;
          unit.moved = false;
        } else if (target) {
          if (target.x !== unit.x) unit.facing = target.x > unit.x ? 1 : -1;
          const combatRes = executeCombat(unit, target, this.board, this.rng, {
            actionType: 'magic',
            skill: magic,
            allies: this.allies,
            synergies: this.synergies,
            weather: this.weather
          });
          this.processCombatMorale(unit, target, combatRes);
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
          const c1 = executeCombat(unit, target, this.board, this.rng, { actionType: 'attack', allies: this.allies, synergies: this.synergies });
          this.processCombatMorale(unit, target, c1);
          result.events = [...c1.events];

          // Partner attacks for free!
          if (target.hp > 0) {
            const c2 = executeCombat(bondInfo.partner, target, this.board, this.rng, { actionType: 'attack', allies: this.allies, synergies: this.synergies });
            this.processCombatMorale(bondInfo.partner, target, c2);
            result.events.push(...c2.events);
          }

          result.events.push({ type: 'bond_coop', name: bondInfo.bond.name, msg: `發動【${bondInfo.bond.name}】合擊！` });
          unit.acted = true;
          unit.moved = false;
        }
        break;
      }
    }

    if (result.expGained === undefined && this.campaign && unit.team === 'ally' && unit.role !== 'npc' && unit.role !== 'objective' && actionType !== 'wait') {
      const expGain = 12;
      const expRes = this.campaign.addExp(unit.id, expGain);
      result.expGained = expGain;
      result.levelUp = expRes;
      if (expRes.leveledUp) {
        unit.level = expRes.newLevel;
        result.events.push({
          type: 'levelup',
          unitId: unit.id,
          unitName: unit.name,
          newLevel: expRes.newLevel,
          statGains: expRes.statGains,
          msg: `【等級提升】${unit.name} 升至 Lv.${expRes.newLevel}！生命+${expRes.statGains.hp} 武力+${expRes.statGains.atk} 防禦+${expRes.statGains.def}！`
        });
      }
    }

    this.checkBossPhases();

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

  checkBossPhases() {
    if (this.chapter?.id === 4) {
      const boss = this.enemies.find(e => e.id === 'iron_general' && e.hp > 0);
      if (boss) {
        if (!boss.phase2Triggered && boss.hp <= boss.maxHp * 0.66) {
          boss.phase2Triggered = true;
          boss.atk = (boss.atk || 16) + 2;
          boss.def = (boss.def || 10) + 1;
          this.eventLog.push({
            type: 'boss_phase',
            phase: 2,
            msg: '【玄鐵巨將·二階段】重鎧解禁！攻擊+2、防禦+1！「爾等休想跨過天池大壩！」'
          });
        }
        if (!boss.phase3Triggered && boss.hp <= boss.maxHp * 0.33) {
          boss.phase3Triggered = true;
          boss.atk = (boss.atk || 16) + 3;
          boss.spd = (boss.spd || 7) + 2;
          this.eventLog.push({
            type: 'boss_phase',
            phase: 3,
            msg: '【玄鐵巨將·瀕死狂暴】狂怒咆哮！攻擊+3、速度+2！「同歸於盡吧！」'
          });
        }
      }
    }
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
    this.movePaths = [];
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

      // Check morale rout for weak enemies
      const isWeak = !enemy.isBoss && enemy.role !== 'commander' && enemy.id !== this.chapter.bossId;
      if (this.enemyMorale <= 35 && isWeak) {
        const routRoll = this.rng ? this.rng.nextInt(1, 100) : 50;
        const routThreshold = this.enemyMorale <= 20 ? 60 : 35;
        if (routRoll <= routThreshold) {
          enemy.isRouted = true;
          const reachable = Array.from(this.getReachableFor(enemy).values());
          if (reachable.length > 0) {
            const livingAllies = this.allies.filter(a => a.hp > 0);
            if (livingAllies.length > 0) {
              // Flee towards map edge (min y or min/max x) away from living allies
              reachable.sort((a, b) => {
                const distEdgeA = Math.min(a.x, 9 - a.x, a.y, 12 - a.y);
                const distEdgeB = Math.min(b.x, 9 - b.x, b.y, 12 - b.y);
                const minDa = Math.min(...livingAllies.map(al => Board.manhattan(a.x, a.y, al.x, al.y)));
                const minDb = Math.min(...livingAllies.map(al => Board.manhattan(b.x, b.y, al.x, al.y)));
                return (minDb * 2 - distEdgeB) - (minDa * 2 - distEdgeA);
              });
              this.moveUnit(enemy, reachable[0].x, reachable[0].y);
            }
          }
          enemy.acted = true;
          this.eventLog.push({ type: 'rout', target: enemy.id, x: enemy.x, y: enemy.y, msg: `【敵軍潰逃！】${enemy.name}軍心潰散，棄械倉皇逃竄！` });
          continue;
        }
      }

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
        const cRes = executeCombat(enemy, decision.target, this.board, this.rng, {
          actionType: decision.type,
          element: decision.element || null,
          movedTiles: decision.movedTiles || 0,
          allies: this.allies,
          synergies: this.synergies
        });
        this.processCombatMorale(enemy, decision.target, cRes);
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
        if (unit.hp <= 0 && !unit._moraleProcessed) {
          unit._moraleProcessed = true;
          this.modifyMorale('ally', -15, '折損將士');
        }
      }
    }
  }

  tickVillageHealing() {
    const allLiving = [...this.allies, ...this.enemies].filter(u => u.hp > 0);
    for (const u of allLiving) {
      const t = this.board.getTerrain(u.x, u.y);
      if (t && (t.isVillage || t.isFort || t.isGate || t.healPercent || t.healAmount)) {
        const heal = Math.max(2, Math.round(u.maxHp * 0.10));
        const oldHp = u.hp;
        u.hp = Math.min(u.maxHp, u.hp + heal);
        const actual = u.hp - oldHp;
        if (actual > 0) {
          this.eventLog.push({
            type: 'village_heal',
            unitId: u.id,
            x: u.x,
            y: u.y,
            heal: actual,
            terrainName: t.name,
            msg: `【${t.name}補給】${u.name} 於${t.name}休養生息，恢復 +${actual} HP！`
          });
        }
      }
    }
  }

  endEnemyPhase() {
    if (this.status.finished) return;

    // Check reinforcements (e.g. Chapter 4 Turn 5 mother_of_mist, flank waves)
    if (this.chapter.reinforcements) {
      if (!this.spawnedReinforcements) this.spawnedReinforcements = new Set();
      for (const r of this.chapter.reinforcements) {
        if (this.currentTurn + 1 === r.turn && !this.spawnedReinforcements.has(r)) {
          const proto = ENEMY_PROTOS[r.id];
          if (proto) {
            this.spawnedReinforcements.add(r);
            this.enemies.push({
              ...proto,
              instanceId: r.instanceId || `${r.id}_turn${r.turn}_${this.enemies.length}`,
              x: r.x,
              y: r.y,
              facing: r.facing || -1,
              aggro: r.aggro || proto.aggro || 'rush',
              guardRadius: r.guardRadius || proto.guardRadius || 3,
              acted: false
            });
            this.eventLog.push({ type: 'reinforce', name: proto.name, msg: r.bark || '迷霧深處傳來了可怖的咆哮！' });
          }
        }
      }
    }

    // Advance turn & reset allies
    this.currentTurn++;
    for (const e of this.enemies) {
      if (e.isTaunted) {
        e.isTaunted = false;
        delete e.tauntTargetId;
      }
    }
    for (const a of this.allies) {
      if (a.isStealthed) {
        a.isStealthed = false;
      }
    }
    for (const u of [...this.allies, ...this.enemies]) {
      if (u._fortress && --u._fortress.turns <= 0) { u.def -= u._fortress.def; u._fortress = null; }
    }
    this.phase = 'ally';
    this.checkTelegraphedReinforcements();

    // Escort cart advances along road in escort missions
    if (this.chapter?.objectiveType === 'escort') {
      this.advanceEscortCart();
    }

    for (const a of this.allies) {
      if (a.rallyBuffed) {
        a.mov = Math.max(1, (a.mov || 3) - 1);
        delete a.rallyBuffed;
      }
    }

    if (this.currentTurn === 2) {
      for (const a of this.allies) {
        if (a._cavalryCoopBonus) {
          a.mov = Math.max(1, (a.mov || 3) - 1);
          delete a._cavalryCoopBonus;
        }
      }
    }

    // Chapter 5: Fog dissipates on turn 4 (weather change)
    if (this.chapter?.id === 5 && this.currentTurn === 4 && this.chapter.hasNightFog) {
      this.chapter.hasNightFog = false;
      this.eventLog.push({
        type: 'weather_change',
        msg: '【天光破曉】晨風驟起，竹海夜霧盡散！全體敵陣一覽無遺！'
      });
    }

    // Chapter 6: Collapsible bridge on turn 4
    if (this.chapter?.id === 6 && this.currentTurn === 4 && !this.bridgeCollapsed) {
      this.bridgeCollapsed = true;
      this.board.setTerrainChar(4, 8, 'w');
      this.board.setTerrainChar(5, 8, 'w');
      this.eventLog.push({
        type: 'bridge_collapse',
        msg: '【吊橋斷裂】要塞機關啟動！護城河吊橋踏板轟然崩塌，化為滾滾護城深水！'
      });
    }

    // Chapter 8: Mountain pass rockslide on turn 3
    if (this.chapter?.id === 8 && this.currentTurn === 3 && !this.mountainAmbushTriggered) {
      this.mountainAmbushTriggered = true;
      this.board.setTerrainChar(2, 6, '#');
      this.board.setTerrainChar(7, 6, '#');
      this.eventLog.push({
        type: 'mountain_rockslide',
        msg: '【落石封道】兩側懸崖巨石轟然滾落，狹道兩側被落石封阻，山道伏兵發動全面夾擊！'
      });
    }

    this.checkBossPhases();

    this.tickBurningTiles();
    this.tickFloodedTiles();
    this.tickCursedTiles();
    this.tickVillageHealing();

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
