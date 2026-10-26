/**
 * js/engine/campaign.js
 * Campaign progression, chapter unlocks, roster state, leveling, relics, and persistence.
 */

import { GAME } from '../config.js';
import { GUARDIAN_PROTOS, RELICS, PROMOTIONS, BOND_PAIRS } from '../data/units.js';

export class CampaignManager {
  constructor() {
    this.storageKeyRoster = `${GAME.storageKey}_roster`;
    this.storageKeyCampaign = `${GAME.storageKey}_campaign`;
    this.roster = {};
    this.relics = [];
    this.clearedChapters = [];
    this.unlockedChapters = [1];
    this.currentChapterId = 1;
    this.load();
  }

  initDefaultRoster() {
    this.roster = {};
    for (const [id, proto] of Object.entries(GUARDIAN_PROTOS)) {
      this.roster[id] = {
        id,
        level: 1,
        exp: 0,
        promoted: false,
        relic: null,
        bonusStats: { atk: 0, def: 0, mag: 0, res: 0, maxHp: 0, mov: 0 }
      };
    }
    this.relics = ['iron_talisman'];
    this.clearedChapters = [];
    this.unlockedChapters = [1];
    this.currentChapterId = 1;
  }

  load() {
    try {
      if (typeof localStorage === 'undefined') {
        this.initDefaultRoster();
        return;
      }
      const rawRoster = localStorage.getItem(this.storageKeyRoster);
      const rawCampaign = localStorage.getItem(this.storageKeyCampaign);

      if (rawRoster) {
        this.roster = JSON.parse(rawRoster);
      } else {
        this.initDefaultRoster();
      }

      if (rawCampaign) {
        const cData = JSON.parse(rawCampaign);
        this.clearedChapters = cData.clearedChapters || [];
        this.unlockedChapters = cData.unlockedChapters || [1];
        this.currentChapterId = cData.currentChapterId || 1;
        this.relics = cData.relics || ['iron_talisman'];
      }
    } catch (e) {
      this.initDefaultRoster();
    }
  }

  save() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(this.storageKeyRoster, JSON.stringify(this.roster));
      localStorage.setItem(this.storageKeyCampaign, JSON.stringify({
        clearedChapters: this.clearedChapters,
        unlockedChapters: this.unlockedChapters,
        currentChapterId: this.currentChapterId,
        relics: this.relics
      }));
    } catch (e) {}
  }

  getUnitInstance(id) {
    const proto = GUARDIAN_PROTOS[id];
    if (!proto) return null;

    const saved = this.roster[id] || {
      level: 1,
      exp: 0,
      promoted: false,
      relic: null,
      bonusStats: { atk: 0, def: 0, mag: 0, res: 0, maxHp: 0, mov: 0 }
    };

    const inst = {
      ...proto,
      trait: { ...proto.trait },
      skill: { ...proto.skill },
      magic: { ...proto.magic },
      level: saved.level,
      exp: saved.exp,
      promoted: saved.promoted,
      relic: saved.relic,
      bonusStats: { ...saved.bonusStats }
    };

    // Apply promotion bonuses if promoted
    if (inst.promoted && PROMOTIONS[id]) {
      const p = PROMOTIONS[id];
      inst.cls = p.newClass;
      if (p.promotedSkill) {
        inst.promotedSkill = { ...p.promotedSkill };
        // If skill type is skill, upgrade or provide secondary
        if (p.promotedSkill.type === 'skill') {
          inst.skill = { ...p.promotedSkill };
        } else if (p.promotedSkill.type === 'magic') {
          inst.magic = { ...p.promotedSkill };
        }
      }
      if (p.statBonus.atk) inst.atk += p.statBonus.atk;
      if (p.statBonus.def) inst.def += p.statBonus.def;
      if (p.statBonus.mag) inst.mag += p.statBonus.mag;
      if (p.statBonus.res) inst.res += p.statBonus.res;
      if (p.statBonus.maxHp) {
        inst.maxHp += p.statBonus.maxHp;
        inst.hp += p.statBonus.maxHp;
      }
      if (p.statBonus.mov) inst.mov += p.statBonus.mov;
      if (p.statBonus.rangeMaxBonus) inst.rangeMaxBonus = p.statBonus.rangeMaxBonus;
    }

    // Apply level-up bonusStats
    for (const [stat, val] of Object.entries(inst.bonusStats)) {
      if (inst[stat] !== undefined) {
        inst[stat] += val;
      }
    }

    // Apply relic bonuses
    if (inst.relic) {
      const rObj = RELICS.find(r => r.id === inst.relic);
      if (rObj && inst[rObj.stat] !== undefined) {
        inst[rObj.stat] += rObj.bonus;
      }
    }

    inst.hp = inst.maxHp;
    return inst;
  }

  addExp(unitId, amount) {
    const u = this.roster[unitId];
    if (!u) return { leveledUp: false };

    u.exp += amount;
    let leveledUp = false;
    let newLevel = u.level;

    if (u.exp >= 100) {
      u.exp -= 100;
      u.level += 1;
      leveledUp = true;
      newLevel = u.level;

      // Check promotion at Lv2+
      if (u.level >= 2 && !u.promoted) {
        u.promoted = true;
      }
    }

    this.save();
    return { leveledUp, newLevel, promoted: u.promoted };
  }

  applyPerkChoice(unitId, perkType) {
    const u = this.roster[unitId];
    if (!u) return;
    if (!u.bonusStats) u.bonusStats = { atk: 0, def: 0, mag: 0, res: 0, maxHp: 0, mov: 0 };

    switch (perkType) {
      case 'atk': u.bonusStats.atk = (u.bonusStats.atk || 0) + 3; break;
      case 'def': u.bonusStats.def = (u.bonusStats.def || 0) + 2; break;
      case 'mag': u.bonusStats.mag = (u.bonusStats.mag || 0) + 3; break;
      case 'mov': u.bonusStats.mov = (u.bonusStats.mov || 0) + 1; break;
      case 'hp':  u.bonusStats.maxHp = (u.bonusStats.maxHp || 0) + 8; break;
      case 'def_hp':
        u.bonusStats.def = (u.bonusStats.def || 0) + 2;
        u.bonusStats.maxHp = (u.bonusStats.maxHp || 0) + 6;
        break;
    }
    this.save();
  }

  equipRelic(unitId, relicId) {
    const u = this.roster[unitId];
    if (u) {
      u.relic = relicId;
      this.save();
    }
  }

  completeChapter(chapterId) {
    if (!this.clearedChapters.includes(chapterId)) {
      this.clearedChapters.push(chapterId);
    }

    // Unlock logic:
    // Chapter 1 unlocks 2 and 3
    if (chapterId === 1) {
      if (!this.unlockedChapters.includes(2)) this.unlockedChapters.push(2);
      if (!this.unlockedChapters.includes(3)) this.unlockedChapters.push(3);
    }
    // If both 2 and 3 are cleared, unlock 4
    if (this.clearedChapters.includes(2) && this.clearedChapters.includes(3)) {
      if (!this.unlockedChapters.includes(4)) this.unlockedChapters.push(4);
    }

    // Reward relics based on chapter
    const relicRewards = {
      1: 'swift_boots',
      2: 'spirit_jade',
      3: 'brave_crest',
      4: 'tea_leaf_pouch'
    };
    const newRelic = relicRewards[chapterId];
    if (newRelic && !this.relics.includes(newRelic)) {
      this.relics.push(newRelic);
    }

    this.save();
  }

  isChapterUnlocked(chapterId) {
    return this.unlockedChapters.includes(chapterId);
  }
}
