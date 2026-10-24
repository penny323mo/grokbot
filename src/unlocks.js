/**
 * 12碼讀心戰 (Penalty Mind Game v2) - Stars, Unlocks & Trophy Cabinet Module
 * Manages star earnings, unlockable balls, kits, and stadium atmospheres,
 * trophy achievements, and robust localStorage persistence with fallback defaults.
 */

export const STORAGE_KEY_UNLOCKS = 'btb_penalty_unlocks_v2';

export const UNLOCK_CATALOG = {
  balls: [
    {
      id: 'ball_classic',
      name: '經典黑白',
      desc: '經典五角形足球紋路，手感紮實。',
      cost: 0,
      icon: '⚽',
      style: { base: '#f8fafc', accent: '#0f172a', pattern: 'classic' }
    },
    {
      id: 'ball_fire',
      name: '烈焰熔岩',
      desc: '熾熱火山熔岩紋理，旋轉時帶有赤焰流光。',
      cost: 3,
      icon: '🔥',
      style: { base: '#dc2626', accent: '#f59e0b', pattern: 'fire' }
    },
    {
      id: 'ball_cyber',
      name: '霓虹數碼',
      desc: '賽博龐克光軌線條，於夜場飛行如電光劃過。',
      cost: 6,
      icon: '⚡',
      style: { base: '#06b6d4', accent: '#a855f7', pattern: 'cyber' }
    },
    {
      id: 'ball_gold',
      name: '曜石純金',
      desc: '黑曜石基底鑲嵌 24K 純金箔片，尊貴冠軍之選。',
      cost: 10,
      icon: '✨',
      style: { base: '#18181b', accent: '#fbbf24', pattern: 'gold' }
    }
  ],
  kits: [
    {
      id: 'kit_home',
      name: '國家隊主場戰袍',
      desc: '所屬國家代表隊傳統官方主場配色。',
      cost: 0,
      icon: '👕',
      type: 'default'
    },
    {
      id: 'kit_neon',
      name: '街頭霓虹戰袍',
      desc: '香港夜市霓虹青綠與電光粉紅撞色，搶眼奪目。',
      cost: 4,
      icon: '🎽',
      type: 'custom',
      colors: { primary: '#ec4899', secondary: '#06b6d4', shorts: '#111827', socks: '#ec4899' }
    },
    {
      id: 'kit_blackgold',
      name: '尊爵黑金戰甲',
      desc: '霧面磨砂純黑配以璀璨奢華純金邊飾。',
      cost: 8,
      icon: '🖤',
      type: 'custom',
      colors: { primary: '#18181b', secondary: '#fbbf24', shorts: '#09090b', socks: '#fbbf24' }
    },
    {
      id: 'kit_retro',
      name: '復古 90s 格仔',
      desc: '向 90 年代足球黃金盛世致敬的經典幾何暗花。',
      cost: 12,
      icon: '🏁',
      type: 'custom',
      colors: { primary: '#2563eb', secondary: '#f8fafc', shorts: '#1e3a8a', socks: '#f8fafc' }
    }
  ],
  stadiums: [
    {
      id: 'stadium_night',
      name: '狂熱夜戰',
      desc: '夜幕低垂、四座泛光燈塔照耀球場，狂熱激鬥氣氛。',
      cost: 0,
      icon: '🌙',
      sky: '#060c1e',
      fog: '#081028',
      light: '#fff6ea',
      lightIntensity: 1.4
    },
    {
      id: 'stadium_sunset',
      name: '黃昏晚霞',
      desc: '夕陽餘暉灑落綠茵草坪，金黃晚霞映照大看台。',
      cost: 5,
      icon: '🌅',
      sky: '#451a03',
      fog: '#291003',
      light: '#f59e0b',
      lightIntensity: 1.55
    },
    {
      id: 'stadium_day',
      name: '晴空艷陽',
      desc: '明媚陽光灑落球場，藍天白雲下展開激戰。',
      cost: 9,
      icon: '☀️',
      sky: '#1e3a8a',
      fog: '#1e40af',
      light: '#ffffff',
      lightIntensity: 1.7
    }
  ]
};

export const TROPHIES = [
  {
    id: 'trophy_champ',
    name: '世界盃冠軍金盃',
    desc: '連過四關奪得 16 隊世界盃淘汰賽總冠軍！',
    icon: '🏆',
    rarity: 'legendary'
  },
  {
    id: 'trophy_runner_up',
    name: '世界盃亞軍銀牌',
    desc: '過關斬將闖入世界盃決賽！',
    icon: '🥈',
    rarity: 'epic'
  },
  {
    id: 'trophy_third',
    name: '世界盃季軍銅牌',
    desc: '力戰晉級世界盃四強準決賽！',
    icon: '🥉',
    rarity: 'rare'
  },
  {
    id: 'trophy_golden_glove',
    name: '金手套神撲獎',
    desc: '單場比賽完成 3 次或以上精彩撲救！',
    icon: '🧤',
    rarity: 'epic'
  },
  {
    id: 'trophy_dead_eye',
    name: '百步穿楊神射王',
    desc: '單場 5 輪主射 100% 全部命中破網！',
    icon: '⚽',
    rarity: 'epic'
  },
  {
    id: 'trophy_mind_master',
    name: '心理戰讀心狂魔',
    desc: '可預測度低於 25%，連出虛晃令門將徹底崩潰！',
    icon: '🧠',
    rarity: 'legendary'
  }
];

export class UnlocksManager {
  constructor() {
    this.stars = 0;
    this.unlocked = new Set(['ball_classic', 'kit_home', 'stadium_night']);
    this.equipped = {
      ball: 'ball_classic',
      kit: 'kit_home',
      stadium: 'stadium_night'
    };
    this.trophies = {}; // trophyId -> { unlockedAt: timestamp }
    this.load();
  }

  /**
   * Calculate stars earned from a match based on performance
   * @param {Object} stats - { won, savesCount, predictability, cleanSheet, isTournament, isChampion }
   * @returns {Object} { total, breakdown: Array<{ label, count }> }
   */
  calculateMatchStars(stats = {}) {
    const breakdown = [];
    let total = 0;

    if (stats.won) {
      const baseWins = stats.isTournament ? 2 : 1;
      total += baseWins;
      breakdown.push({ label: stats.isTournament ? '錦標賽晉級獲勝' : '比賽獲勝', count: baseWins });
    }

    if (stats.savesCount >= 3) {
      total += 1;
      breakdown.push({ label: '神撲 3 球或以上', count: 1 });
    }

    if (stats.predictability !== null && stats.predictability < 35 && stats.won) {
      total += 1;
      breakdown.push({ label: '出招難以捉摸 (<35%)', count: 1 });
    }

    if (stats.cleanSheet && stats.won) {
      total += 1;
      breakdown.push({ label: '零封對手', count: 1 });
    }

    if (stats.isChampion) {
      total += 5;
      breakdown.push({ label: '榮登世界盃冠軍', count: 5 });
    }

    return { total, breakdown };
  }

  addStars(amount) {
    if (typeof amount === 'number' && amount > 0) {
      this.stars += amount;
      this.save();
    }
    return this.stars;
  }

  getStars() {
    return this.stars;
  }

  isUnlocked(itemId) {
    return this.unlocked.has(itemId);
  }

  unlock(itemId) {
    // Find item in catalog
    let found = null;
    for (const cat of Object.keys(UNLOCK_CATALOG)) {
      const item = UNLOCK_CATALOG[cat].find(i => i.id === itemId);
      if (item) { found = item; break; }
    }
    if (!found) return { success: false, reason: 'item_not_found' };
    if (this.unlocked.has(itemId)) return { success: true, already: true };
    if (this.stars < found.cost) return { success: false, reason: 'insufficient_stars' };

    this.stars -= found.cost;
    this.unlocked.add(itemId);
    this.save();
    return { success: true, item: found };
  }

  equip(category, itemId) {
    if (!this.equipped.hasOwnProperty(category)) return false;
    if (!this.unlocked.has(itemId)) return false;
    this.equipped[category] = itemId;
    this.save();
    return true;
  }

  getEquipped() {
    return { ...this.equipped };
  }

  getEquippedItemData(category) {
    const id = this.equipped[category];
    const catList = UNLOCK_CATALOG[category === 'stadium' ? 'stadiums' : (category === 'ball' ? 'balls' : 'kits')];
    if (!catList) return null;
    return catList.find(i => i.id === id) || catList[0];
  }

  awardTrophy(trophyId) {
    const tDef = TROPHIES.find(t => t.id === trophyId);
    if (!tDef) return null;
    if (this.trophies[trophyId]) return null; // already earned

    this.trophies[trophyId] = {
      id: trophyId,
      unlockedAt: Date.now()
    };
    this.save();
    return tDef;
  }

  hasTrophy(trophyId) {
    return !!this.trophies[trophyId];
  }

  checkTrophies(conditions = {}) {
    const awarded = [];
    if (conditions.tournamentWon) {
      if (this.awardTrophy('trophy_champ')) awarded.push('trophy_champ');
    }
    if (conditions.isFinalist) {
      if (this.awardTrophy('trophy_runner_up')) awarded.push('trophy_runner_up');
    }
    if (conditions.isSemiFinalist) {
      if (this.awardTrophy('trophy_third')) awarded.push('trophy_third');
    }
    if (typeof conditions.savesInMatch === 'number' && conditions.savesInMatch >= 3) {
      if (this.awardTrophy('trophy_golden_glove')) awarded.push('trophy_golden_glove');
    }
    if (conditions.allScored) {
      if (this.awardTrophy('trophy_dead_eye')) awarded.push('trophy_dead_eye');
    }
    if (conditions.lowPredictability) {
      if (this.awardTrophy('trophy_mind_master')) awarded.push('trophy_mind_master');
    }
    return awarded;
  }

  getTrophies() {
    return TROPHIES.map(t => ({
      ...t,
      unlocked: !!this.trophies[t.id],
      unlockedAt: this.trophies[t.id] ? this.trophies[t.id].unlockedAt : null
    }));
  }

  save() {
    try {
      if (typeof localStorage !== 'undefined') {
        const payload = JSON.stringify({
          stars: this.stars,
          unlocked: Array.from(this.unlocked),
          equipped: this.equipped,
          trophies: this.trophies
        });
        localStorage.setItem(STORAGE_KEY_UNLOCKS, payload);
      }
    } catch (e) {
      console.warn('Failed to save unlocks to localStorage:', e);
    }
  }

  load() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY_UNLOCKS);
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (data && typeof data.stars === 'number') {
          this.stars = Math.max(0, data.stars);
          if (Array.isArray(data.unlocked)) {
            this.unlocked = new Set([...data.unlocked, 'ball_classic', 'kit_home', 'stadium_night']);
          }
          if (data.equipped && typeof data.equipped === 'object') {
            this.equipped = {
              ball: data.equipped.ball || 'ball_classic',
              kit: data.equipped.kit || 'kit_home',
              stadium: data.equipped.stadium || 'stadium_night'
            };
          }
          if (data.trophies && typeof data.trophies === 'object') {
            this.trophies = data.trophies;
          }
          return true;
        }
      }
    } catch (e) {
      console.warn('Failed to load unlocks, fallback to default:', e);
    }
    return false;
  }
}
