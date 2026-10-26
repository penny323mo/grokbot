/**
 * js/engine/town.js
 * Town meta-progression, Star Lantern spending, building construction, and save/load persistence.
 */

import { TOWN_BUILDINGS, SAVE_KEY, RUN_SAVE_KEY } from "./constants.js";

export class TownManager {
  constructor(storage = null) {
    this.storage = storage || (typeof window !== "undefined" && window.localStorage ? window.localStorage : null);
    this.starLanterns = 0;
    this.buildings = [];
    this.unlockedUnits = ["cat_patrol", "tea_master", "lantern_crafter", "scarecrow", "tanuki_mage", "little_dragon"];
    this.unlockedDecks = ["standard"];
    this.highestAscension = 0;
    this.stats = {
      runsAttempted: 0,
      runsWon: 0,
      totalNightsSurvived: 0,
      enemiesDefeated: 0
    };

    this.load();
  }

  getTownPerks() {
    const perks = {
      lanternHpBonus: 0,
      unitHpBonus: 0,
      coinBonus: 0,
      freeCardRemoval: 0,
      startUpgradeCard: 0
    };

    for (const bId of this.buildings) {
      const bldg = TOWN_BUILDINGS.find((b) => b.id === bId);
      if (bldg && bldg.effect) {
        if (bldg.effect.lanternHpBonus) perks.lanternHpBonus += bldg.effect.lanternHpBonus;
        if (bldg.effect.unitHpBonus) perks.unitHpBonus += bldg.effect.unitHpBonus;
        if (bldg.effect.coinBonus) perks.coinBonus += bldg.effect.coinBonus;
        if (bldg.effect.freeCardRemoval) perks.freeCardRemoval += bldg.effect.freeCardRemoval;
        if (bldg.effect.startUpgradeCard) perks.startUpgradeCard += bldg.effect.startUpgradeCard;
      }
    }

    return perks;
  }

  hasBuilding(bldgId) {
    return this.buildings.includes(bldgId);
  }

  canBuild(bldgId) {
    if (this.hasBuilding(bldgId)) return false;
    const bldg = TOWN_BUILDINGS.find((b) => b.id === bldgId);
    return bldg && this.starLanterns >= bldg.cost;
  }

  build(bldgId) {
    const bldg = TOWN_BUILDINGS.find((b) => b.id === bldgId);
    if (!bldg || this.hasBuilding(bldgId)) return false;
    if (this.starLanterns < bldg.cost) return false;

    this.starLanterns -= bldg.cost;
    this.buildings.push(bldgId);

    // Apply unlock effects
    if (bldg.effect.unlockUnit && !this.unlockedUnits.includes(bldg.effect.unlockUnit)) {
      this.unlockedUnits.push(bldg.effect.unlockUnit);
    }
    if (bldg.effect.unlockDeck && !this.unlockedDecks.includes(bldg.effect.unlockDeck)) {
      this.unlockedDecks.push(bldg.effect.unlockDeck);
    }

    this.save();
    return true;
  }

  addStarLanterns(amount) {
    this.starLanterns += Math.max(0, amount);
    this.save();
  }

  recordRunResult(won, nightsSurvived = 1, enemiesDefeated = 0, ascension = 0) {
    this.stats.runsAttempted++;
    this.stats.totalNightsSurvived += nightsSurvived;
    this.stats.enemiesDefeated += enemiesDefeated;
    if (won) {
      this.stats.runsWon++;
      if (ascension >= this.highestAscension) {
        this.highestAscension = Math.min(5, ascension + 1);
      }
    }
    this.save();
  }

  save() {
    if (!this.storage) return;
    try {
      const data = {
        version: 2,
        starLanterns: this.starLanterns,
        buildings: this.buildings,
        unlockedUnits: this.unlockedUnits,
        unlockedDecks: this.unlockedDecks,
        highestAscension: this.highestAscension,
        stats: this.stats
      };
      this.storage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("[Town] Failed to save to storage:", e);
    }
  }

  load() {
    if (!this.storage) return;
    try {
      const raw = this.storage.getItem(SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data && typeof data === "object") {
        switch (data.version) {
          case 1:
          case 2:
          default:
            this.starLanterns = data.starLanterns || 0;
            this.buildings = Array.isArray(data.buildings) ? data.buildings : [];
            if (Array.isArray(data.unlockedUnits)) {
              this.unlockedUnits = Array.from(new Set([...this.unlockedUnits, ...data.unlockedUnits]));
            }
            if (Array.isArray(data.unlockedDecks)) {
              this.unlockedDecks = Array.from(new Set([...this.unlockedDecks, ...data.unlockedDecks]));
            }
            this.highestAscension = data.highestAscension || 0;
            if (data.stats) {
              this.stats = { ...this.stats, ...data.stats };
            }
            break;
        }
      }
    } catch (e) {
      console.warn("[Town] Failed to load save, resetting to defaults:", e);
    }
  }

  saveActiveRun(runState) {
    if (!this.storage) return;
    try {
      const payload = {
        version: 2,
        timestamp: Date.now(),
        data: runState
      };
      this.storage.setItem(RUN_SAVE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("[Town] Failed to save active run:", e);
    }
  }

  loadActiveRun() {
    if (!this.storage) return null;
    try {
      const raw = this.storage.getItem(RUN_SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 2) {
        return parsed.data;
      } else if (parsed && typeof parsed === "object") {
        // v1 raw run blob migration
        return parsed;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  clearActiveRun() {
    if (!this.storage) return;
    try {
      this.storage.removeItem(RUN_SAVE_KEY);
    } catch (e) {}
  }
}
