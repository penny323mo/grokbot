/**
 * js/engine/combat.js
 * Combat formulas, facing calculations, back attacks, counter-attacks,
 * elemental affinities, hill advantage, knockback into water, and preview generation.
 */

import { Board } from './board.js';
import { BOND_PAIRS, getClassSynergies } from '../data/units.js';

/**
 * Fairness guard: a single enemy hit can take at most 30% of an ally's max HP,
 * so any player unit always survives at least 3 hits (design rule: 3-5 hits to KO).
 */
export const ALLY_HIT_CAP_RATIO = 0.3;
export function capDamageToAlly(defender, dmg) {
  if (!defender || defender.team !== 'ally' || defender.role === 'objective' || !defender.maxHp) return dmg;
  const maxHp = defender.maxHp;
  return Math.min(dmg, Math.max(1, Math.ceil(maxHp * ALLY_HIT_CAP_RATIO)));
}

/**
 * Determine attack orientation relative to defender's facing
 * Returns 'back', 'side', or 'front'
 */
export function getAttackDirection(attackerPos, defenderPos, defenderFacing) {
  // defenderFacing: 1 (East), -1 (West), 0 (North), 2 (South)
  const dx = attackerPos.x - defenderPos.x;
  const dy = attackerPos.y - defenderPos.y;

  if (defenderFacing === 2) { // Faces South
    if (dy < 0) return 'back';  // Attacking from North is behind
    if (dy > 0) return 'front'; // Attacking from South is front
    return 'side';              // Same row is flank/side
  } else if (defenderFacing === 0) { // Faces North
    if (dy > 0) return 'back';  // Attacking from South is behind
    if (dy < 0) return 'front'; // Attacking from North is front
    return 'side';
  } else if (defenderFacing === 1) { // Faces East
    if (dx < 0) return 'back';  // Attacking from West is behind
    if (dx > 0) return 'front'; // Attacking from East is front
    return 'side';              // Same column (North/South) is flank/side
  } else {                      // Faces West (-1 or default)
    if (dx > 0) return 'back';  // Attacking from East is behind
    if (dx < 0) return 'front'; // Attacking from West is front
    return 'side';              // Same column is flank/side
  }
}

/**
 * Checks whether a defender can be targeted (handles shadow_rat mist shroud)
 */
export function canTargetUnit(attacker, defender, board, visionTiles = null) {
  if (defender.hp <= 0) return false;

  // Stealthed units (e.g. 墨影 「潛影」) cannot be targeted unless adjacent
  if (defender.isStealthed && attacker.team !== defender.team) {
    if (Board.manhattan(attacker.x, attacker.y, defender.x, defender.y) > 1) {
      return false;
    }
  }

  // Fog of war: if visionTiles set is provided and defender is outside vision, cannot target
  if (visionTiles && !visionTiles.has(`${defender.x},${defender.y}`)) {
    return false;
  }

  if (!defender.isShrouded && defender.trait?.id !== 'mist_shroud') return true;

  // Shrouded units are revealable if:
  // 1. Within light of any lantern
  if (board.isTileLit(defender.x, defender.y)) return true;

  // 2. Adjacent to an enemy (revealed by close proximity)
  const dist = Board.manhattan(attacker.x, attacker.y, defender.x, defender.y);
  if (dist === 1) return true;

  return false;
}

/**
 * Elemental interaction matrix
 */
export function getElementEffectiveness(atkElem, defElem) {
  if (!atkElem || !defElem) return { mult: 1.0, isAdvantage: false, isImmune: false };
  if (defElem === 'water' && atkElem === 'fire') return { mult: 0.0, isAdvantage: false, isImmune: true };
  if (defElem === 'water' && atkElem === 'thunder') return { mult: 2.0, isAdvantage: true, isImmune: false };
  if (defElem === 'wood' && atkElem === 'fire') return { mult: 1.5, isAdvantage: true, isImmune: false };
  if (defElem === 'fire' && atkElem === 'water') return { mult: 1.5, isAdvantage: true, isImmune: false };
  if (defElem === 'earth' && atkElem === 'wood') return { mult: 1.5, isAdvantage: true, isImmune: false };
  if (defElem === 'water' && atkElem === 'earth') return { mult: 1.5, isAdvantage: true, isImmune: false };
  if (defElem === 'dark' && (atkElem === 'light' || atkElem === 'fire')) return { mult: 1.5, isAdvantage: true, isImmune: false };
  return { mult: 1.0, isAdvantage: false, isImmune: false };
}

/**
 * Determine unit class category for the 三國志-style Class Triangle
 * 騎 > 步 > 弓 > 騎
 */
export function getUnitClassCategory(unit) {
  if (!unit) return null;
  const c = unit.cls || '';
  const r = unit.role || '';
  if (c === '騎兵' || c === '飛騎' || c === '斥候' || r === 'cavalry' || r === 'flyer' || r === 'scout' || unit.id === 'crane_rider') return 'cavalry';
  if (c === '槍盾' || c === '劍客' || c === '盾衛' || c === '重將' || c === '刺客' || c === '首領' || c === '統領' || c === '主將' || r === 'tank' || r === 'flanker' || r === 'infantry' || r === 'shield_guard' || r === 'shield_phalanx' || r === 'commander' || r === 'warlord') return 'infantry';
  if (c === '弓手' || c === '砲車' || r === 'archer' || r === 'fire_archer' || r === 'siege') return 'archer';
  return null;
}

/**
 * 三國志-style class triangle: 騎 > 步 > 弓 > 騎 (x1.2 / x0.8)
 */
export function getClassTriangleMultiplier(attacker, defender) {
  const atkCat = getUnitClassCategory(attacker);
  const defCat = getUnitClassCategory(defender);
  if (!atkCat || !defCat || atkCat === defCat) return { mult: 1.0, relation: null };

  if (
    (atkCat === 'cavalry' && defCat === 'infantry') ||
    (atkCat === 'infantry' && defCat === 'archer') ||
    (atkCat === 'archer' && defCat === 'cavalry')
  ) {
    return { mult: 1.2, relation: 'advantage' };
  }

  if (
    (atkCat === 'infantry' && defCat === 'cavalry') ||
    (atkCat === 'archer' && defCat === 'infantry') ||
    (atkCat === 'cavalry' && defCat === 'archer')
  ) {
    return { mult: 0.8, relation: 'disadvantage' };
  }

  return { mult: 1.0, relation: null };
}

/**
 * Calculate combat resolution between attacker and defender
 */
export function calculateCombat(attacker, defender, board, options = {}) {
  const attackerPos = { x: options.attackerX ?? attacker.x, y: options.attackerY ?? attacker.y };
  const defenderPos = { x: defender.x, y: defender.y };
  const dist = Board.manhattan(attackerPos.x, attackerPos.y, defenderPos.x, defenderPos.y);

  // Determine attack direction
  const defenderFacing = defender.facing ?? (defender.team === 'ally' ? 1 : -1);
  const direction = getAttackDirection(attackerPos, defenderPos, defenderFacing);
  const isBackAttack = direction === 'back';
  const isSideAttack = direction === 'side';
  const isFrontAttack = direction === 'front';

  // Terrain bonuses
  const defTerrain = board.getTerrain(defenderPos.x, defenderPos.y);
  const atkTerrain = board.getTerrain(attackerPos.x, attackerPos.y);

  const defBonus = defTerrain.defBonus || 0;
  const evaBonus = defTerrain.evaBonus || 0;

  // Hill advantage (+20% dmg when attacker on hill attacking lower tile)
  const hasHillAdvantage = atkTerrain.char === 'h' && defTerrain.char !== 'h';

  // Action / skill params
  const actionType = options.actionType || 'attack'; // 'attack' | 'skill' | 'magic' | 'bond'
  const skill = options.skill || null;
  const isMagic = actionType === 'magic' || skill?.type === 'magic' || (actionType === 'attack' && (attacker.cls === '術士' || attacker.role === 'mage'));
  const element = skill?.element || attacker.element || null;

  // Base power: 武力 (war) feeds physical attack power, 智力 (int) feeds magic power
  const statWarAtk = attacker.stats?.war ? Math.round(attacker.stats.war * 0.14) : (attacker.atk || 10);
  const statIntMag = attacker.stats?.int ? Math.round(attacker.stats.int * 0.13) : (attacker.mag || 5);
  let attackPower = isMagic ? (attacker.mag ?? statIntMag) : (attacker.atk ?? statWarAtk);
  if (skill?.power) {
    attackPower = skill.power;
  }

  // Damage modifiers calculation
  let damageMod = 1.0;

  // 1. Facing modifier (SPEC §5: Back +50%, Side +20%, 墨影 +100%)
  const flankRateBack = options.flankRateBack ?? 1.5;
  const flankRateSide = options.flankRateSide ?? 1.2;

  if (isBackAttack) {
    // cat_patrol swift_shadow trait: +100% instead of standard back bonus
    if (attacker.trait?.id === 'swift_shadow' || attacker.id === 'cat_patrol') {
      damageMod *= 2.0;
    } else {
      damageMod *= flankRateBack;
    }
  } else if (isSideAttack) {
    damageMod *= flankRateSide;
  } else if (isFrontAttack) {
    if (defender.trait?.id === 'phalanx_wall' || defender.role === 'shield_phalanx') {
      if (!isMagic && !defender.phalanxBroken) {
        damageMod *= 0.15; // Phalanx blocks 85% frontal physical damage
      }
    } else if (defender.trait?.id === 'iron_shield_wall' || defender.trait?.id === 'shield_block' || defender.role === 'shield_guard' || defender.id === 'iron_general') {
      damageMod *= 0.3;
    }
  }

  // 2. Hill advantage
  if (hasHillAdvantage) {
    damageMod *= 1.2;
  }

  // 3. Cavalry charge bonus
  if (options.movedTiles >= 3 && (attacker.trait?.id === 'cavalry_charge' || attacker.role === 'cavalry')) {
    damageMod *= 1.4;
  }

  // 4. Crane dive vs archer
  if ((attacker.trait?.id === 'sky_dive' || attacker.id === 'crane_rider') && (defender.cls === '弓手' || defender.role === 'archer')) {
    damageMod *= 1.3;
  }

  // 5. Elemental affinity
  const defEffectiveElement = defender.element || (defender.trait?.id === 'water_spirit' ? 'water' : null);
  const elemEff = getElementEffectiveness(element, defEffectiveElement);
  damageMod *= elemEff.mult;

  // 5b. Class triangle: 騎 > 步 > 弓 > 騎 (x1.2 / x0.8)
  const classTri = getClassTriangleMultiplier(attacker, defender);
  damageMod *= classTri.mult;

  // 6. Ally inspire stratagem (+20% dmg turns 1-2)
  if (attacker.inspireBonus) {
    damageMod *= 1.2;
  }

  // 6b. Outnumbered morale (背水一戰)
  if (attacker.team === 'ally' && attacker.lastStand) {
    damageMod *= 1.2;
  }

  // 7. Ambush surprise attack bonus (+50% dmg on first strike)
  if (attacker.isAmbushed || attacker.surpriseAttack) {
    damageMod *= 1.5;
  }

  // Weather modifiers
  const weather = options.weather || board?.weather || null;
  if (weather === 'rain') {
    if (element === 'fire') {
      damageMod *= 0.75;
    } else if (element === 'water') {
      damageMod *= 1.25;
    }
  }

  // Class synergies
  const squadAllies = options.allies || (attacker.team === 'ally' ? attacker.squad : (defender.team === 'ally' ? defender.squad : null));
  const activeSynergies = options.synergies || (squadAllies ? getClassSynergies(squadAllies) : []);
  const hasSynergy = (id) => activeSynergies.some(s => (typeof s === 'string' ? s === id : s.id === id));

  // spell_arrow: 法箭交輝 (+10% ranged / magic damage for allies)
  if (attacker.team === 'ally' && hasSynergy('spell_arrow') && (isMagic || dist > 1 || attacker.role === 'archer' || attacker.role === 'mage' || attacker.cls === '弓手' || attacker.cls === '術士')) {
    damageMod *= 1.1;
  }

  // Calculate base damage
  let expectedDamage = 0;
  if (isMagic) {
    const res = defender.res || 0;
    const raw = Math.max(1, attackPower - res);
    expectedDamage = Math.max(0, Math.round(raw * damageMod));
  } else {
    const synergyDef = (defender.team === 'ally' && hasSynergy('iron_fortress')) ? 1 : 0;
    const def = (defender.def || 0) + defBonus + synergyDef;
    const raw = Math.max(1, attackPower - def);
    expectedDamage = Math.max(0, Math.round(raw * damageMod));

    // Fire archer burning forest bonus
    if ((attacker.role === 'fire_archer' || attacker.trait?.id === 'fire_arrows') && defTerrain.char === 'f') {
      expectedDamage += 4;
    }
  }

  if (!options.aiEval) expectedDamage = capDamageToAlly(defender, expectedDamage);

  // If immune, damage is strictly 0
  if (elemEff.isImmune) {
    expectedDamage = 0;
  }

  // Hit rate: 敏捷 (agi) feeds hit accuracy and evasion
  const atkAgi = attacker.stats?.agi || (attacker.spd ? attacker.spd * 7 : 70);
  const defAgi = defender.stats?.agi || (defender.spd ? defender.spd * 7 : 70);
  const spdDiff = Math.max(0, (defender.spd || 10) - (attacker.spd || 10));
  const agiDiff = Math.max(0, Math.round((defAgi - atkAgi) / 7));
  let hitRate = 95 - evaBonus - Math.max(spdDiff, agiDiff);
  hitRate = Math.max(5, Math.min(100, hitRate));

  // Crit rate: 運氣 (luk) feeds critical strike probability
  const lukBonus = attacker.stats?.luk ? Math.max(0, Math.floor((attacker.stats.luk - 75) / 5)) : 0;
  let critRate = Math.max(2, Math.min(50, Math.round(((attacker.spd || 10) - (defender.spd || 10)) * 1.5) + (isBackAttack ? 15 : 0) + lukBonus));
  if (weather === 'night' && attacker.team === 'enemy' && board?.isTileLit && !board.isTileLit(defenderPos.x, defenderPos.y)) {
    critRate = Math.min(50, critRate + 10);
  }

  // Will defender survive?
  const willKill = expectedDamage >= defender.hp;

  // Stratagem resolution
  const isStratagem = !!skill?.isStratagem;
  let stratagemSuccessRate = 0;
  let stratagemBlocked = false;
  let stratagemBlockReason = '';

  if (isStratagem) {
    options.noCounter = true;
    if (skill.id === 'stratagem_fire' && weather === 'rain') {
      stratagemBlocked = true;
      stratagemBlockReason = '雨天無法火計';
      stratagemSuccessRate = 0;
      expectedDamage = 0;
    } else if (skill.isSupport || skill.isHeal) {
      stratagemSuccessRate = 100;
    } else {
      const casterInt = attacker.stats?.int || (attacker.mag ? attacker.mag * 7 : 70);
      const targetInt = defender.stats?.int || (defender.res ? defender.res * 7 : 50);
      let rate = 70 + (casterInt - targetInt) * 3;
      if (skill.id === 'stratagem_fire' && (defTerrain.char === 'f' || defTerrain.char === 'm')) rate += 15;
      if (skill.id === 'stratagem_water' && (defTerrain.char === 'w' || defTerrain.char === 's')) rate += 15;
      if (skill.id === 'stratagem_water' && weather === 'rain') rate += 20;
      if (skill.id === 'stratagem_rockfall' && (defTerrain.char === 'h' || defTerrain.char === 'm')) rate += 20;
      stratagemSuccessRate = Math.max(15, Math.min(95, Math.round(rate)));
    }

    hitRate = stratagemSuccessRate;

    if (skill.id === 'stratagem_fire' && (defTerrain.char === 'f' || defTerrain.char === 'm')) {
      expectedDamage += 4;
    }
    if (skill.id === 'stratagem_water' && weather === 'rain') {
      expectedDamage = Math.round(expectedDamage * 1.3);
    }
    if (skill.id === 'stratagem_rockfall' && defTerrain.char === 'h') {
      expectedDamage += 3;
    }
    if (skill.isConfuse || skill.isSupport) {
      expectedDamage = 0;
    }
  }

  // Counter attack check
  let canCounter = false;
  let counterDamage = 0;
  let counterHitRate = 0;

  if (!willKill && !isBackAttack && !options.noCounter && !isStratagem) {
    // Check defender range
    let defMinRange = 1;
    let defMaxRange = 1;
    if (Array.isArray(defender.range)) {
      defMinRange = defender.range[0];
      defMaxRange = defender.range[1];
    } else if (typeof defender.range === 'number') {
      defMinRange = defender.range;
      defMaxRange = defender.range;
    }

    if (dist >= defMinRange && dist <= defMaxRange && defender.atk > 0) {
      canCounter = true;
      const counterAtk = defender.atk || 8;
      const synergyAtkDef = (attacker.team === 'ally' && hasSynergy('iron_fortress')) ? 1 : 0;
      const atkDef = (attacker.def || 0) + (atkTerrain.defBonus || 0) + synergyAtkDef;
      counterDamage = capDamageToAlly(attacker, Math.max(1, counterAtk - atkDef));
      counterHitRate = Math.max(5, Math.min(100, 95 - (atkTerrain.evaBonus || 0)));
    }
  }

  // 8. Combo / 合擊 check (restricted to valid BOND_PAIRS partner adjacent to defender)
  let comboAlly = null;
  let comboDamage = 0;
  let bondName = null;
  if (attacker.team === 'ally' && options.allies) {
    const validBond = BOND_PAIRS.find(b => b.pair.includes(attacker.id));
    if (validBond) {
      const partnerId = validBond.pair.find(id => id !== attacker.id);
      const partner = options.allies.find(a =>
        a.id === partnerId &&
        a.hp > 0 &&
        Board.manhattan(a.x, a.y, defenderPos.x, defenderPos.y) === 1
      );
      if (partner && (!options.battle || !options.battle.usedBondPairThisBattle)) {
        comboAlly = partner;
        bondName = validBond.name;
        const rawCombo = Math.max(2, Math.round((comboAlly.atk || 10) * 0.5 - ((defender.def || 0) + defBonus) * 0.25));
        comboDamage = rawCombo;
      }
    }
  }

  // Knockback preview
  let knockbackResult = null;
  const knockbackDist = skill?.knockback || (options.isKnockback ? 1 : 0);
  if (knockbackDist > 0) {
    const kx = defenderPos.x - attackerPos.x;
    const ky = defenderPos.y - attackerPos.y;
    // Normalize step
    const stepX = kx === 0 ? 0 : (kx > 0 ? 1 : -1);
    const stepY = ky === 0 ? 0 : (ky > 0 ? 1 : -1);
    const destX = defenderPos.x + stepX;
    const destY = defenderPos.y + stepY;

    if (board.inBounds(destX, destY)) {
      const destTerrain = board.getTerrain(destX, destY);
      const isWater = destTerrain.isWater || destTerrain.char === 'w';
      const isInstaKill = isWater && !defender.flyer;
      knockbackResult = {
        destX,
        destY,
        terrain: destTerrain.char,
        isWater,
        isInstaKill
      };
    }
  }

  let directionMarker = '【正面交鋒】';
  if (isBackAttack) {
    if (attacker.trait?.id === 'swift_shadow' || attacker.id === 'cat_patrol') {
      directionMarker = '【疾影背刺】+100% 傷害 (無法反擊)';
    } else {
      directionMarker = `【背刺偷襲】+${Math.round((flankRateBack - 1) * 100)}% 傷害 (無法反擊)`;
    }
  } else if (isSideAttack) {
    directionMarker = `【側翼突襲】+${Math.round((flankRateSide - 1) * 100)}% 傷害`;
  }

  const isCartGuarded = (defender.id === 'lantern_cart' && (options.isCartGuarded !== undefined ? options.isCartGuarded : options.battle?.isCartGuarded?.()));
  if (isCartGuarded) {
    expectedDamage = Math.max(1, Math.floor(expectedDamage * 0.5));
  }

  const targetTags = [];
  if (isStratagem) {
    if (stratagemBlocked) {
      targetTags.push('雨天無法火計');
    } else {
      targetTags.push(`成功率 ${stratagemSuccessRate}%`);
    }
  } else {
    if (classTri.relation === 'advantage') {
      targetTags.push(`兵種克制 ×${classTri.mult}`);
    }
    if (elemEff.isAdvantage) {
      targetTags.push(`克制 ×${elemEff.mult}`);
    }
    if (willKill) {
      targetTags.push('可擊破');
    }
    if (canCounter && !willKill) {
      targetTags.push('會反擊');
    }
  }

  return {
    attacker,
    defender,
    distance: dist,
    direction,
    directionMarker,
    isBackAttack,
    isSideAttack,
    isFrontAttack,
    hasHillAdvantage,
    classTriangle: classTri,
    damageMod,
    expectedDamage,
    hitRate,
    critRate,
    willKill,
    canCounter,
    counterDamage,
    counterHitRate,
    knockbackResult,
    comboAlly,
    bondName,
    comboDamage,
    isAdvantage: elemEff.isAdvantage,
    elemMult: elemEff.mult,
    targetTags,
    skill,
    isStratagem,
    stratagemSuccessRate,
    stratagemBlocked,
    stratagemBlockReason
  };
}

/**
 * Executes an attack or skill and applies HP changes and knockbacks
 */
export function executeCombat(attacker, defender, board, rng, options = {}) {
  // Damaging actions never resolve against the caster's own side (heals/buffs use their own paths)
  if (!defender || defender === attacker || (attacker.team && attacker.team === defender.team)) {
    const isFriendlyOk = options.skill?.isHeal || options.skill?.isSupport || options.skill?.selfBuff;
    if (!isFriendlyOk) {
      return { preview: null, events: [{ type: 'friendly_blocked', target: defender?.id }], attackerAlive: attacker.hp > 0, defenderAlive: (defender?.hp ?? 0) > 0 };
    }
  }
  const preview = calculateCombat(attacker, defender, board, options);
  const events = [];

  // Consume ambush surprise status on strike
  if (attacker.isAmbushed || attacker.surpriseAttack) {
    attacker.isAmbushed = false;
    attacker.surpriseAttack = false;
    attacker.isShrouded = false;
  }

  // Check if stratagem was blocked by weather
  if (preview.isStratagem && preview.stratagemBlocked) {
    return {
      preview,
      events: [{ type: 'stratagem_blocked', target: defender.id, msg: preview.stratagemBlockReason || '天候限制無法施展！' }],
      attackerAlive: attacker.hp > 0,
      defenderAlive: defender.hp > 0
    };
  }

  // Hit roll
  const hitRoll = rng ? rng.nextInt(1, 100) : 50;
  const effectiveHitRate = preview.isStratagem ? preview.stratagemSuccessRate : preview.hitRate;
  const isHit = hitRoll <= effectiveHitRate;

  if (!isHit) {
    events.push({ type: 'miss', target: defender.id, msg: preview.isStratagem ? '計策落空！' : '迴避！' });
    return { preview, events, attackerAlive: attacker.hp > 0, defenderAlive: defender.hp > 0 };
  }

  // Handle support / utility stratagems
  if (preview.isStratagem) {
    if (options.skill?.isConfuse) {
      defender.acted = true;
      defender.isConfused = true;
      events.push({
        type: 'confuse',
        target: defender.id,
        msg: `【陷入混亂】${defender.name} 陣型散亂，下回合跳過行動！`
      });
      return { preview, events, attackerAlive: attacker.hp > 0, defenderAlive: defender.hp > 0 };
    }
    if (options.skill?.isSupport) {
      defender.inspireBonus = true;
      events.push({
        type: 'rally',
        target: defender.id,
        msg: `【鼓舞士氣】${defender.name} 士氣高昂，增傷+20%！`
      });
      return { preview, events, attackerAlive: attacker.hp > 0, defenderAlive: defender.hp > 0 };
    }
    if (options.skill?.isHeal) {
      const heal = Math.min(defender.maxHp - defender.hp, 10);
      defender.hp = Math.min(defender.maxHp, defender.hp + 10);
      events.push({
        type: 'heal',
        amount: heal,
        target: defender.id,
        defenderHp: defender.hp,
        msg: `【援護療傷】恢復 +${heal} HP！`
      });
      return { preview, events, attackerAlive: attacker.hp > 0, defenderAlive: defender.hp > 0 };
    }
  }

  // Crit roll
  const critRoll = rng ? rng.nextInt(1, 100) : 50;
  const isCrit = critRoll <= preview.critRate;
  let finalDamage = isCrit ? Math.round(preview.expectedDamage * 1.5) : preview.expectedDamage;
  const isCartGuarded = (defender.id === 'lantern_cart' && (options.isCartGuarded !== undefined ? options.isCartGuarded : options.battle?.isCartGuarded?.()));
  if (isCartGuarded) {
    finalDamage = Math.max(1, Math.floor(finalDamage * 0.5));
    events.push({ type: 'guard_reduction', msg: '【護衛減傷 -50%】' });
  }
  finalDamage = capDamageToAlly(defender, finalDamage);

  defender.hp = Math.max(0, defender.hp - finalDamage);
  events.push({
    type: 'hit',
    damage: finalDamage,
    isCrit,
    isBackAttack: preview.isBackAttack,
    isSideAttack: preview.isSideAttack,
    isHighGround: preview.isHighGround,
    isFrontBlocked: preview.isFrontBlocked,
    defBonus: preview.defBonus,
    elementWeakness: preview.elementWeakness,
    target: defender.id,
    defenderHp: defender.hp
  });

  // Check Combo / 合擊 from adjacent valid bond ally
  if (preview.comboAlly && defender.hp > 0) {
    defender.hp = Math.max(0, defender.hp - preview.comboDamage);
    events.push({
      type: 'combo_hit',
      ally: preview.comboAlly,
      bondName: preview.bondName,
      damage: preview.comboDamage,
      target: defender.id,
      defenderHp: defender.hp
    });
  }

  // Check knockback into water
  if (preview.knockbackResult && defender.hp > 0) {
    const kb = preview.knockbackResult;
    if (kb.isInstaKill) {
      defender.hp = 0;
      events.push({
        type: 'drown',
        target: defender.id,
        msg: '被擊落水中，溺亡KO！'
      });
    } else {
      defender.x = kb.destX;
      defender.y = kb.destY;
      events.push({
        type: 'knockback',
        target: defender.id,
        destX: kb.destX,
        destY: kb.destY
      });
    }
  }

  // Check counter-attack if defender survived
  if (defender.hp > 0 && preview.canCounter) {
    const counterHitRoll = rng ? rng.nextInt(1, 100) : 50;
    if (counterHitRoll <= preview.counterHitRate) {
      attacker.hp = Math.max(0, attacker.hp - preview.counterDamage);
      events.push({
        type: 'counter',
        damage: preview.counterDamage,
        target: attacker.id,
        attackerHp: attacker.hp
      });
    } else {
      events.push({ type: 'counter_miss', target: attacker.id, msg: '反擊落空！' });
    }
  }

  return {
    preview,
    events,
    attackerAlive: attacker.hp > 0,
    defenderAlive: defender.hp > 0
  };
}

/**
 * Three Kingdoms single combat (單挑) 3-round duel resolution:
 * 攻 (strike) beats 必殺 (crit)
 * 必殺 (crit) beats 守 (defend)
 * 守 (defend) beats 攻 (strike)
 */
export function resolveDuelRound(pChoice, eChoice) {
  if (pChoice === eChoice) return { outcome: 'tie', text: '平分秋色' };
  if (
    (pChoice === 'strike' && eChoice === 'crit') ||
    (pChoice === 'crit' && eChoice === 'defend') ||
    (pChoice === 'defend' && eChoice === 'strike')
  ) {
    return { outcome: 'win', text: '破招得手' };
  }
  return { outcome: 'lose', text: '失招受挫' };
}

export function resolveDuel(pChoices, eChoices) {
  let playerWins = 0, enemyWins = 0, ties = 0;
  const rounds = [];
  for (let i = 0; i < 3; i++) {
    const pc = pChoices[i] || 'strike';
    const ec = eChoices[i] || 'strike';
    const res = resolveDuelRound(pc, ec);
    if (res.outcome === 'win') playerWins++;
    else if (res.outcome === 'lose') enemyWins++;
    else ties++;
    rounds.push({ round: i + 1, pChoice: pc, eChoice: ec, ...res });
  }
  const overall = playerWins > enemyWins ? 'victory' : (enemyWins > playerWins ? 'defeat' : 'draw');
  return { overall, playerWins, enemyWins, ties, rounds };
}
