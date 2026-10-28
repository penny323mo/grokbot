// Storage Engine for Midnight Touge (《夜峠》)
// Offline-first persistence for records, ghost data, garage unlocks & settings

const STORAGE_KEY = "midnight_touge_v1_save";

export class StorageEngine {
  constructor() {
    this.data = this.load();
  }

  getDefaultState() {
    return {
      coins: 500,
      selectedCarId: "h86",
      selectedColorIdx: 0,
      unlockedCars: ["h86", "rs86"],
      stageProgress: {
        1: { unlocked: true, medal: null, bestTime: null, bestDriftScore: 0 }
      },
      settings: {
        musicVolume: 0.8,
        sfxVolume: 0.9,
        autoThrottle: true,
        cameraMode: "chase", // chase, bumper, cockpit
        graphicsQuality: "high", // high, medium
        controlType: "touch_zones" // touch_zones, virtual_wheel
      },
      ghostData: {} // Compressed replay paths for rival ghost runs
    };
  }

  load() {
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const state = { ...this.getDefaultState(), ...parsed };
          if (!state.unlockedCars.includes("h86")) state.unlockedCars.push("h86");
          return state;
        }
      }
    } catch (e) {
      console.warn("Storage load error:", e);
    }
    return this.getDefaultState();
  }

  save() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch (e) {
      console.warn("Storage save error:", e);
    }
  }

  recordStageResult(stageId, time, driftScore = 0, medal = null, coinsEarned = 0, ghostFrames = null) {
    if (!this.data.stageProgress[stageId]) {
      this.data.stageProgress[stageId] = { unlocked: true, medal: null, bestTime: null, bestDriftScore: 0 };
    }
    const prog = this.data.stageProgress[stageId];

    // Update best time
    let isNewBest = false;
    if (!prog.bestTime || time < prog.bestTime) {
      prog.bestTime = time;
      isNewBest = true;
    }

    // Save ghost frames on new best time or if no ghost saved yet
    if (ghostFrames && ghostFrames.length > 0 && (isNewBest || !this.data.ghostData[stageId])) {
      this.data.ghostData[stageId] = ghostFrames;
    }

    // Update best drift score
    if (driftScore > (prog.bestDriftScore || 0)) {
      prog.bestDriftScore = driftScore;
    }

    // Update medal if higher
    const rankOrder = { null: 0, "bronze": 1, "silver": 2, "gold": 3 };
    if (rankOrder[medal] > rankOrder[prog.medal]) {
      prog.medal = medal;
    }

    // Add coins
    this.data.coins += coinsEarned;

    // Unlock next stage if completed with at least bronze
    if (medal && stageId < 12) {
      const nextId = stageId + 1;
      if (!this.data.stageProgress[nextId]) {
        this.data.stageProgress[nextId] = { unlocked: true, medal: null, bestTime: null, bestDriftScore: 0 };
      } else {
        this.data.stageProgress[nextId].unlocked = true;
      }
    }

    this.save();
  }

  canUnlockCar(carId, price = 0) {
    const aliasMap = { rs86: "h86", st20: "gt20", rx7: "re7" };
    const id = aliasMap[carId] || carId;
    if (this.isCarUnlocked(id)) return true;

    const hasMedalUnlock =
      (id === "gt20" && this.getTotalMedals().gold >= 3) ||
      (id === "re7" && this.data.stageProgress[12]?.medal === "gold");

    return hasMedalUnlock || (this.data.coins >= price);
  }

  unlockCar(carId, price = 0) {
    const aliasMap = { rs86: "h86", st20: "gt20", rx7: "re7" };
    const id = aliasMap[carId] || carId;
    if (this.isCarUnlocked(id)) return true;

    // Alternative unlock paths based on stage & medal achievements:
    // GT-20 (st20): 3 gold medals OR paying coin price
    // RE-7 (rx7): Stage 12 gold medal (beating Touge boss) OR paying coin price
    const hasMedalUnlock =
      (id === "gt20" && this.getTotalMedals().gold >= 3) ||
      (id === "re7" && this.data.stageProgress[12]?.medal === "gold");

    if (hasMedalUnlock) {
      this.data.unlockedCars.push(id);
      this.save();
      return true;
    }

    if (this.data.coins >= price) {
      this.data.coins -= price;
      this.data.unlockedCars.push(id);
      this.save();
      return true;
    }
    return false;
  }

  isCarUnlocked(carId) {
    const aliasMap = { rs86: "h86", st20: "gt20", rx7: "re7" };
    const id = aliasMap[carId] || carId;
    return this.data.unlockedCars.includes(id) || this.data.unlockedCars.includes(carId);
  }

  selectCar(carId, colorIdx = 0) {
    if (this.isCarUnlocked(carId)) {
      this.data.selectedCarId = carId;
      this.data.selectedColorIdx = colorIdx;
      this.save();
      return true;
    }
    return false;
  }

  updateSettings(partialSettings) {
    this.data.settings = { ...this.data.settings, ...partialSettings };
    this.save();
  }

  getTotalMedals() {
    let gold = 0, silver = 0, bronze = 0;
    for (const p of Object.values(this.data.stageProgress)) {
      if (p.medal === "gold") gold++;
      else if (p.medal === "silver") silver++;
      else if (p.medal === "bronze") bronze++;
    }
    return { gold, silver, bronze, total: gold + silver + bronze };
  }
}

export const storage = new StorageEngine();
