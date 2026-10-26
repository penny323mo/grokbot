/**
 * js/engine/combat.js
 * Combat formulas, facing calculations, back attacks, counter-attacks,
 * elemental affinities, hill advantage, knockback into water, and preview generation.
 */

import { Board } from './board.js';

/**
 * Determine attack orientation relative to defender's facing
 * Returns 'back', 'side', or 'front'
 */
export function getAttackDirection(attackerPos, defenderPos, defenderFacing) {
  // defenderFacing: 1 (faces right/East), -1 (faces left/West)
  const dx = attackerPos.x - defenderPos.x;
  const dy = attackerPos.y - defenderPos.y;

  if (defenderFacing === 1) { // Faces East
    if (dx < 0) return 'back';  // Attacking from West is behind
    if (dx > 0) return 'front'; // Attacking from East is front
    return 'side';              // Same column (North/South) is flank/side
  } else {                      // Faces West
    if (dx > 0) return 'back';  // Attacking from East is behind
    if (dx < 0) return 'front'; // Attacking from West is front
    return 'side';              // Same column is flank/side
  }
}

/**
 * Checks whether a defender can be targeted (handles shadow_rat mist shroud)
 */
export function canTargetUnit(attacker, defender, board) {
  if (defender.hp <= 0) return false;
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

  // Base power
  let attackPower = isMagic ? (attacker.mag || 5) : (attacker.atk || 10);
  if (skill?.power) {
    attackPower = skill.power;
  }

  // Damage modifiers calculation
  let damageMod = 1.0;

  // 1. Facing modifier
  if (isBackAttack) {
    // cat_patrol swift_shadow trait: +100% instead of +50%
    if (attacker.trait?.id === 'swift_shadow' || attacker.id === 'cat_patrol') {
      damageMod *= 2.0;
    } else {
      damageMod *= 1.5;
    }
  } else if (isSideAttack) {
    damageMod *= 1.2;
  } else if (isFrontAttack) {
    // iron_general trait: frontal damage -70%
    if (defender.trait?.id === 'iron_shield_wall' || defender.id === 'iron_general') {
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

  // 5. Elemental affinity vs water-type (paper_ghost)
  const isDefenderWater = defender.element === 'water' || defender.trait?.id === 'water_spirit';
  if (isDefenderWater) {
    if (element === 'fire') {
      damageMod *= 0.0; // Completely immune to fire
    } else if (element === 'thunder') {
      damageMod *= 2.0; // Thunder deals double
    }
  }

  // 6. Ally inspire stratagem (+20% dmg turns 1-2)
  if (attacker.inspireBonus) {
    damageMod *= 1.2;
  }

  // 7. Ambush surprise attack bonus (+50% dmg on first strike)
  if (attacker.isAmbushed || attacker.surpriseAttack) {
    damageMod *= 1.5;
  }

  // Calculate base damage
  let expectedDamage = 0;
  if (isMagic) {
    const res = defender.res || 0;
    const raw = Math.max(1, attackPower - res);
    expectedDamage = Math.max(0, Math.round(raw * damageMod));
  } else {
    const def = (defender.def || 0) + defBonus;
    const raw = Math.max(1, attackPower - def);
    expectedDamage = Math.max(0, Math.round(raw * damageMod));
  }

  // If immune, damage is strictly 0
  if (isDefenderWater && element === 'fire') {
    expectedDamage = 0;
  }

  // Hit rate
  const spdDiff = Math.max(0, (defender.spd || 10) - (attacker.spd || 10));
  let hitRate = 95 - evaBonus - spdDiff;
  hitRate = Math.max(5, Math.min(100, hitRate));

  // Crit rate
  let critRate = Math.max(2, Math.min(50, Math.round(((attacker.spd || 10) - (defender.spd || 10)) * 1.5) + (isBackAttack ? 15 : 0)));

  // Will defender survive?
  const willKill = expectedDamage >= defender.hp;

  // Counter attack check
  let canCounter = false;
  let counterDamage = 0;
  let counterHitRate = 0;

  if (!willKill && !isBackAttack) {
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
      const atkDef = (attacker.def || 0) + (atkTerrain.defBonus || 0);
      counterDamage = Math.max(1, counterAtk - atkDef);
      counterHitRate = Math.max(5, Math.min(100, 95 - (atkTerrain.evaBonus || 0)));
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

  return {
    attacker,
    defender,
    distance: dist,
    direction,
    isBackAttack,
    isSideAttack,
    isFrontAttack,
    hasHillAdvantage,
    damageMod,
    expectedDamage,
    hitRate,
    critRate,
    willKill,
    canCounter,
    counterDamage,
    counterHitRate,
    knockbackResult
  };
}

/**
 * Executes an attack or skill and applies HP changes and knockbacks
 */
export function executeCombat(attacker, defender, board, rng, options = {}) {
  const preview = calculateCombat(attacker, defender, board, options);
  const events = [];

  // Consume ambush surprise status on strike
  if (attacker.isAmbushed || attacker.surpriseAttack) {
    attacker.isAmbushed = false;
    attacker.surpriseAttack = false;
    attacker.isShrouded = false;
  }

  // Hit roll
  const hitRoll = rng ? rng.nextInt(1, 100) : 50;
  const isHit = hitRoll <= preview.hitRate;

  if (!isHit) {
    events.push({ type: 'miss', target: defender.id, msg: '迴避！' });
    return { preview, events, attackerAlive: attacker.hp > 0, defenderAlive: defender.hp > 0 };
  }

  // Crit roll
  const critRoll = rng ? rng.nextInt(1, 100) : 50;
  const isCrit = critRoll <= preview.critRate;
  const finalDamage = isCrit ? Math.round(preview.expectedDamage * 1.5) : preview.expectedDamage;

  defender.hp = Math.max(0, defender.hp - finalDamage);
  events.push({
    type: 'hit',
    damage: finalDamage,
    isCrit,
    isBackAttack: preview.isBackAttack,
    target: defender.id,
    defenderHp: defender.hp
  });

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
