/**
 * 濠江疑案 · Harbour Casebook
 * 存檔管理引擎 (Local Storage & Progress Persistence)
 */

const STORAGE_KEY = 'harbour_casebook_save_v1';

const DEFAULT_STATE = {
  currentCaseId: 1,
  cases: {
    1: { discoveredHotspots: [], collectedWords: [], filledSlots: {}, solvedSections: [], solved: false, timeSpent: 0, hintsUsed: 0 },
    2: { discoveredHotspots: [], collectedWords: [], filledSlots: {}, solvedSections: [], solved: false, timeSpent: 0, hintsUsed: 0 },
    3: { discoveredHotspots: [], collectedWords: [], filledSlots: {}, solvedSections: [], solved: false, timeSpent: 0, hintsUsed: 0 },
    4: { discoveredHotspots: [], collectedWords: [], filledSlots: {}, solvedSections: [], solved: false, timeSpent: 0, hintsUsed: 0 }
  },
  settings: {
    musicMuted: false,
    sfxMuted: false,
    musicVolume: 0.7,
    sfxVolume: 0.8,
    textSize: 'normal' // 'normal' | 'large'
  },
  onboardingDone: false
};

export class StorageEngine {
  constructor() {
    this.state = this.load();
  }

  load() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return JSON.parse(JSON.stringify(DEFAULT_STATE));
      }
      const data = window.localStorage.getItem(STORAGE_KEY);
      if (!data) return JSON.parse(JSON.stringify(DEFAULT_STATE));
      const parsed = JSON.parse(data);
      // Merge with defaults to ensure schema consistency
      return {
        ...DEFAULT_STATE,
        ...parsed,
        cases: {
          ...DEFAULT_STATE.cases,
          ...(parsed.cases || {})
        },
        settings: {
          ...DEFAULT_STATE.settings,
          ...(parsed.settings || {})
        }
      };
    } catch (e) {
      console.warn('StorageEngine load error, falling back to default:', e);
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }

  save() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      }
    } catch (e) {
      console.warn('StorageEngine save failed:', e);
    }
  }

  getCaseState(caseId) {
    if (!this.state.cases[caseId]) {
      this.state.cases[caseId] = {
        discoveredHotspots: [],
        collectedWords: [],
        filledSlots: {},
        solvedSections: [],
        solved: false,
        timeSpent: 0,
        hintsUsed: 0
      };
    }
    return this.state.cases[caseId];
  }

  markHotspotDiscovered(caseId, hotspotId) {
    const c = this.getCaseState(caseId);
    if (!c.discoveredHotspots.includes(hotspotId)) {
      c.discoveredHotspots.push(hotspotId);
      this.save();
      return true;
    }
    return false;
  }

  collectWord(caseId, word) {
    const c = this.getCaseState(caseId);
    if (!c.collectedWords.includes(word)) {
      c.collectedWords.push(word);
      this.save();
      return true;
    }
    return false;
  }

  setSlotValue(caseId, sectionId, slotKey, word) {
    const c = this.getCaseState(caseId);
    if (!c.filledSlots[sectionId]) {
      c.filledSlots[sectionId] = {};
    }
    if (word === null || word === undefined || word === '') {
      delete c.filledSlots[sectionId][slotKey];
    } else {
      c.filledSlots[sectionId][slotKey] = word;
    }
    this.save();
  }

  setWhoGuess(caseId, portraitId, name) {
    const c = this.getCaseState(caseId);
    if (!c.whoGuesses) c.whoGuesses = {};
    if (!name) {
      delete c.whoGuesses[portraitId];
    } else {
      c.whoGuesses[portraitId] = name;
    }
    this.save();
  }

  getWhoGuesses(caseId) {
    const c = this.getCaseState(caseId);
    return c.whoGuesses || {};
  }

  setWhoSolved(caseId, isSolved = true) {
    const c = this.getCaseState(caseId);
    c.whoSolved = isSolved;
    this.save();
  }

  isWhoSolved(caseId) {
    const c = this.getCaseState(caseId);
    return !!c.whoSolved;
  }

  getSlotValue(caseId, sectionId, slotKey) {
    const c = this.getCaseState(caseId);
    return c.filledSlots[sectionId]?.[slotKey] || null;
  }

  markSectionSolved(caseId, sectionId) {
    const c = this.getCaseState(caseId);
    if (!c.solvedSections.includes(sectionId)) {
      c.solvedSections.push(sectionId);
      this.save();
      return true;
    }
    return false;
  }

  isSectionSolved(caseId, sectionId) {
    const c = this.getCaseState(caseId);
    return c.solvedSections.includes(sectionId);
  }

  markCaseSolved(caseId) {
    const c = this.getCaseState(caseId);
    c.solved = true;
    c.solvedAt = new Date().toISOString();
    this.save();
  }

  isCaseSolved(caseId) {
    const c = this.getCaseState(caseId);
    return !!c.solved;
  }

  isCaseUnlocked(caseId) {
    if (caseId === 1) return true;
    // Each case unlocks when previous is solved
    return this.isCaseSolved(caseId - 1);
  }

  incrementHintUsed(caseId) {
    const c = this.getCaseState(caseId);
    c.hintsUsed = (c.hintsUsed || 0) + 1;
    this.save();
  }

  addTimeSpent(caseId, seconds) {
    const c = this.getCaseState(caseId);
    c.timeSpent = (c.timeSpent || 0) + seconds;
    this.save();
  }

  getSettings() {
    return this.state.settings;
  }

  updateSettings(newSettings) {
    this.state.settings = {
      ...this.state.settings,
      ...newSettings
    };
    this.save();
  }

  resetAll() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.save();
  }
}

export const storage = new StorageEngine();
