/**
 * 12碼讀心戰 (Penalty Mind Game v2) - World Cup Tournament Module
 * Pure logic module managing 16 national teams, team kits, keeper & taker personalities,
 * knockout bracket progression (R16 -> QF -> SF -> Final), AI match simulation,
 * difficulty ramp, and tournament save state.
 */

export const TEAMS = [
  {
    id: 'HKG',
    code: 'HKG',
    name: '香港',
    flag: '🇭🇰',
    colors: {
      primary: '#dc2626',   // Crimson Red
      secondary: '#ffffff', // White
      shorts: '#f8fafc',    // White
      socks: '#b91c1c',     // Dark Red
      number: '#ffffff'
    },
    keeper: {
      name: '輝哥 (地膽鋼門)',
      style: 'patient',
      desc: '沉著冷靜、極少提早移位，擅長守死角與近身封截。',
      reactBonus: -0.015,
      reachBonus: 0.02,
      tellHonesty: 0.85
    },
    taker: {
      name: '安永佳 (前線箭頭)',
      style: 'power_blaster',
      desc: '擅長中路高速勁射及強行破網。',
      speedBonus: 1.5,
      cornerFocus: 0.4
    }
  },
  {
    id: 'JPN',
    code: 'JPN',
    name: '日本',
    flag: '🇯🇵',
    colors: {
      primary: '#1d4ed8',   // Samurai Blue
      secondary: '#ffffff', // White
      shorts: '#1e3a8a',    // Dark Blue
      socks: '#1e3a8a',
      number: '#ffffff'
    },
    keeper: {
      name: '權田修一 (技術守護神)',
      style: 'mind_reader',
      desc: '極度敏銳、快速剖析對手連招規律，針對性封鎖慣用角度。',
      reactBonus: -0.01,
      reachBonus: 0.01,
      tellHonesty: 0.70
    },
    taker: {
      name: '三笘薰 (突破刺客)',
      style: 'corner_sniper',
      desc: '刁鑽腳法，專門抽射上下兩邊極限死角。',
      speedBonus: 0.8,
      cornerFocus: 0.85
    }
  },
  {
    id: 'BRA',
    code: 'BRA',
    name: '巴西',
    flag: '🇧🇷',
    colors: {
      primary: '#facc15',   // Canary Yellow
      secondary: '#16a34a', // Green
      shorts: '#1e40af',    // Royal Blue
      socks: '#ffffff',
      number: '#15803d'
    },
    keeper: {
      name: '艾利臣 (森巴門神)',
      style: 'power_absorber',
      desc: '身型高大、臂展極廣，任何中高球都能輕鬆沒收。',
      reactBonus: -0.02,
      reachBonus: 0.05,
      tellHonesty: 0.75
    },
    taker: {
      name: '尼馬 (森巴魔術師)',
      style: 'deceptive',
      desc: '助跑節奏多變，擅於觀察門將動態再反向破網。',
      speedBonus: 1.2,
      cornerFocus: 0.75
    }
  },
  {
    id: 'ARG',
    code: 'ARG',
    name: '阿根廷',
    flag: '🇦🇷',
    colors: {
      primary: '#38bdf8',   // Sky Blue
      secondary: '#ffffff', // White
      shorts: '#0f172a',    // Black
      socks: '#ffffff',
      number: '#0f172a'
    },
    keeper: {
      name: '達米安馬天尼斯 (讀心狂魔)',
      style: 'bluff_master',
      desc: '垃圾話連篇、虛晃眼神與動作，心理戰極強。',
      reactBonus: -0.025,
      reachBonus: 0.04,
      tellHonesty: 0.45 // 55% bluffs
    },
    taker: {
      name: '美斯 (球王傳奇)',
      style: 'corner_sniper',
      desc: '黃金左腳，百步穿楊專射十指關死角。',
      speedBonus: 2.0,
      cornerFocus: 0.90
    }
  },
  {
    id: 'ENG',
    code: 'ENG',
    name: '英格蘭',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    colors: {
      primary: '#f8fafc',   // White
      secondary: '#1e3a8a', // Navy
      shorts: '#1e293b',    // Navy
      socks: '#ffffff',
      number: '#1e3a8a'
    },
    keeper: {
      name: '碧福特 (激情大砲)',
      style: 'early_diver',
      desc: '神經刀撲救，爆發力極強但有時過早撲出。',
      reactBonus: 0.02,
      reachBonus: 0.03,
      tellHonesty: 0.80
    },
    taker: {
      name: '哈利簡尼 (冷面射手)',
      style: 'power_blaster',
      desc: '重砲勁射，直抽網頂威力驚人。',
      speedBonus: 2.2,
      cornerFocus: 0.60
    }
  },
  {
    id: 'FRA',
    code: 'FRA',
    name: '法國',
    flag: '🇫🇷',
    colors: {
      primary: '#1e3a8a',   // Dark Navy
      secondary: '#ef4444', // Red
      shorts: '#ffffff',    // White
      socks: '#ef4444',
      number: '#facc15'
    },
    keeper: {
      name: '邁治蘭 (高盧黑豹)',
      style: 'patient',
      desc: '彈跳力驚人，留到最後一刻才出擊飛撲。',
      reactBonus: -0.018,
      reachBonus: 0.035,
      tellHonesty: 0.82
    },
    taker: {
      name: '麥巴比 (閃電神鋒)',
      style: 'corner_sniper',
      desc: '高速抽射，門將剛有反應球已入網。',
      speedBonus: 2.4,
      cornerFocus: 0.80
    }
  },
  {
    id: 'GER',
    code: 'GER',
    name: '德國',
    flag: '🇩🇪',
    colors: {
      primary: '#ffffff',   // White
      secondary: '#0f172a', // Black
      shorts: '#000000',    // Black
      socks: '#ffffff',
      number: '#000000'
    },
    keeper: {
      name: '紐亞 (清道夫門神)',
      style: 'power_absorber',
      desc: '制霸整個小禁區，極難被大力球突破。',
      reactBonus: -0.02,
      reachBonus: 0.045,
      tellHonesty: 0.78
    },
    taker: {
      name: '梅斯亞拿 (靈動小將)',
      style: 'deceptive',
      desc: '動作隱蔽，難以透過擺腿判斷出招路線。',
      speedBonus: 1.3,
      cornerFocus: 0.70
    }
  },
  {
    id: 'ESP',
    code: 'ESP',
    name: '西班牙',
    flag: '🇪🇸',
    colors: {
      primary: '#b91c1c',   // Bull Red
      secondary: '#eab308', // Gold
      shorts: '#1e3a8a',    // Navy
      socks: '#1e3a8a',
      number: '#facc15'
    },
    keeper: {
      name: '施蒙 (狂牛鐵閘)',
      style: 'mind_reader',
      desc: '擅長閱讀射手習慣，針對下三路防守滴水不漏。',
      reactBonus: -0.012,
      reachBonus: 0.025,
      tellHonesty: 0.72
    },
    taker: {
      name: '耶馬爾 (天才新星)',
      style: 'corner_sniper',
      desc: '腳法細膩，專門利用弧線拉向右上死角。',
      speedBonus: 1.6,
      cornerFocus: 0.85
    }
  },
  {
    id: 'ITA',
    code: 'ITA',
    name: '意大利',
    flag: '🇮🇹',
    colors: {
      primary: '#2563eb',   // Azure Blue
      secondary: '#ffffff', // White
      shorts: '#ffffff',    // White
      socks: '#2563eb',
      number: '#ffffff'
    },
    keeper: {
      name: '當拿隆馬 (亞平寧巨人)',
      style: 'power_absorber',
      desc: '身形魁梧，封截面積冠絕賽場。',
      reactBonus: -0.022,
      reachBonus: 0.05,
      tellHonesty: 0.80
    },
    taker: {
      name: '基艾沙 (藍衣突擊手)',
      style: 'power_blaster',
      desc: '果斷發力，直奔左下底角破網。',
      speedBonus: 1.8,
      cornerFocus: 0.65
    }
  },
  {
    id: 'NED',
    code: 'NED',
    name: '荷蘭',
    flag: '🇳🇱',
    colors: {
      primary: '#ea580c',   // Orange
      secondary: '#ffffff', // White
      shorts: '#ea580c',    // Orange
      socks: '#ea580c',
      number: '#0f172a'
    },
    keeper: {
      name: '費布根 (風車之盾)',
      style: 'patient',
      desc: '冷靜判斷球路，不輕易被虛晃牽制。',
      reactBonus: -0.015,
      reachBonus: 0.03,
      tellHonesty: 0.85
    },
    taker: {
      name: '加普 (橙軍箭頭)',
      style: 'corner_sniper',
      desc: '長腿大力拉桿射門，死角命中率極高。',
      speedBonus: 1.7,
      cornerFocus: 0.80
    }
  },
  {
    id: 'POR',
    code: 'POR',
    name: '葡萄牙',
    flag: '🇵🇹',
    colors: {
      primary: '#991b1b',   // Crimson Red
      secondary: '#15803d', // Green
      shorts: '#15803d',    // Green
      socks: '#991b1b',
      number: '#facc15'
    },
    keeper: {
      name: '迪奧高哥斯達 (救十二碼專家)',
      style: 'mind_reader',
      desc: '國際大賽曾連續撲出三球點球，心理素質頂級。',
      reactBonus: -0.025,
      reachBonus: 0.04,
      tellHonesty: 0.65
    },
    taker: {
      name: 'C朗拿度 (歷史得分王)',
      style: 'power_blaster',
      desc: '標誌性站姿，雷霆萬鈞轟入網角。',
      speedBonus: 2.5,
      cornerFocus: 0.70
    }
  },
  {
    id: 'CRO',
    code: 'CRO',
    name: '克羅地亞',
    flag: '🇭🇷',
    colors: {
      primary: '#e11d48',   // Chequered Red
      secondary: '#ffffff', // White
      shorts: '#1e40af',    // Blue
      socks: '#ffffff',
      number: '#1e40af'
    },
    keeper: {
      name: '利華高域 (格子軍門神)',
      style: 'patient',
      desc: '撲十二碼專家，以極高專注度守住最後一關。',
      reactBonus: -0.02,
      reachBonus: 0.035,
      tellHonesty: 0.85
    },
    taker: {
      name: '莫迪歷 (大師隊長)',
      style: 'deceptive',
      desc: '眼神假動作極逼真，善於騙過門將反身推射。',
      speedBonus: 1.1,
      cornerFocus: 0.85
    }
  },
  {
    id: 'KOR',
    code: 'KOR',
    name: '南韓',
    flag: '🇰🇷',
    colors: {
      primary: '#dc2626',   // Taegeuk Red
      secondary: '#0f172a', // Black
      shorts: '#1e293b',    // Black
      socks: '#dc2626',
      number: '#ffffff'
    },
    keeper: {
      name: '趙賢祐 (太極守門王)',
      style: 'early_diver',
      desc: '反應敏捷迅速飛撲，常常上演極限神撲。',
      reactBonus: 0.015,
      reachBonus: 0.03,
      tellHonesty: 0.80
    },
    taker: {
      name: '孫興慜 (亞洲球王)',
      style: 'corner_sniper',
      desc: '雙腳均衡，左右開弓直飛右上左上死角。',
      speedBonus: 2.1,
      cornerFocus: 0.85
    }
  },
  {
    id: 'URU',
    code: 'URU',
    name: '烏拉圭',
    flag: '🇺🇾',
    colors: {
      primary: '#0284c7',   // Sky Blue
      secondary: '#ffffff', // White
      shorts: '#0f172a',    // Black
      socks: '#0284c7',
      number: '#ffffff'
    },
    keeper: {
      name: '羅捷特 (天藍鐵閘)',
      style: 'power_absorber',
      desc: '防守硬朗，無懼近距離爆射。',
      reactBonus: -0.01,
      reachBonus: 0.03,
      tellHonesty: 0.80
    },
    taker: {
      name: '紐尼斯 (狂野射手)',
      style: 'power_blaster',
      desc: '力拔山兮，球速經常飆破極限。',
      speedBonus: 2.3,
      cornerFocus: 0.60
    }
  },
  {
    id: 'MAR',
    code: 'MAR',
    name: '摩洛哥',
    flag: '🇲🇦',
    colors: {
      primary: '#b91c1c',   // Moroccan Red
      secondary: '#16a34a', // Green
      shorts: '#15803d',    // Green
      socks: '#b91c1c',
      number: '#facc15'
    },
    keeper: {
      name: '保奴 (阿特拉斯巨岩)',
      style: 'mind_reader',
      desc: '世界盃撲點球一戰封神，善於揣摩射手心理。',
      reactBonus: -0.02,
      reachBonus: 0.04,
      tellHonesty: 0.68
    },
    taker: {
      name: '薛耶治 (魔術左足)',
      style: 'corner_sniper',
      desc: '弧線刁鑽，擅長挑射上角。',
      speedBonus: 1.5,
      cornerFocus: 0.80
    }
  },
  {
    id: 'MEX',
    code: 'MEX',
    name: '墨西哥',
    flag: '🇲🇽',
    colors: {
      primary: '#15803d',   // Green
      secondary: '#ffffff', // White
      shorts: '#f8fafc',    // White
      socks: '#b91c1c',     // Red
      number: '#ffffff'
    },
    keeper: {
      name: '奧祖亞 (世界盃限定神)',
      style: 'bluff_master',
      desc: '世界盃逢賽必神，各類假身段與眼神騙術爐火純青。',
      reactBonus: -0.025,
      reachBonus: 0.04,
      tellHonesty: 0.50
    },
    taker: {
      name: '占美尼斯 (冷面主射手)',
      style: 'deceptive',
      desc: '助跑微停頓，等待門將先郁動。',
      speedBonus: 1.2,
      cornerFocus: 0.75
    }
  }
];

export const ROUND_NAMES = [
  { id: 'R16', name: '16強淘汰賽', shortName: '16強', difficulty: 'EASY', requiredWins: 1 },
  { id: 'QF',  name: '8強半準決賽', shortName: '8強',  difficulty: 'MEDIUM', requiredWins: 2 },
  { id: 'SF',  name: '4強準決賽',   shortName: '4強',  difficulty: 'HARD', requiredWins: 3 },
  { id: 'FINAL', name: '世界盃冠軍決賽', shortName: '決賽', difficulty: 'HELL', requiredWins: 4 }
];

export const STORAGE_KEY_TOURNAMENT = 'btb_penalty_tournament_v2';

export class TournamentManager {
  constructor() {
    this.playerTeam = null;
    this.rounds = [];
    this.currentRoundIndex = 0;
    this.isChampion = false;
    this.isEliminated = false;
    this.eliminatedInRound = null;
    this.active = false;
  }

  /**
   * Start a brand new 16-team tournament.
   * @param {string} playerTeamId - Team ID chosen by player (e.g. 'HKG', 'JPN', 'BRA')
   */
  startNewTournament(playerTeamId = 'HKG') {
    const pTeam = TEAMS.find(t => t.id === playerTeamId) || TEAMS[0];
    this.playerTeam = pTeam;
    this.currentRoundIndex = 0;
    this.isChampion = false;
    this.isEliminated = false;
    this.eliminatedInRound = null;
    this.active = true;

    // Pick 15 opponents from the remaining teams
    const opponents = TEAMS.filter(t => t.id !== pTeam.id);
    this._shuffleArray(opponents);

    // Build initial 16-team knockout bracket (8 matches in R16)
    // Put player in Match 0 of R16
    const r16Matches = [];
    r16Matches.push({
      id: 'R16_M0',
      teamA: pTeam,
      teamB: opponents[0],
      winner: null,
      scoreA: null,
      scoreB: null,
      isPlayerMatch: true
    });

    for (let i = 1; i < 8; i++) {
      r16Matches.push({
        id: `R16_M${i}`,
        teamA: opponents[i * 2 - 1],
        teamB: opponents[i * 2],
        winner: null,
        scoreA: null,
        scoreB: null,
        isPlayerMatch: false
      });
    }

    this.rounds = [
      { id: 'R16', name: ROUND_NAMES[0].name, difficulty: ROUND_NAMES[0].difficulty, matches: r16Matches },
      { id: 'QF',  name: ROUND_NAMES[1].name, difficulty: ROUND_NAMES[1].difficulty, matches: [] },
      { id: 'SF',  name: ROUND_NAMES[2].name, difficulty: ROUND_NAMES[2].difficulty, matches: [] },
      { id: 'FINAL', name: ROUND_NAMES[3].name, difficulty: ROUND_NAMES[3].difficulty, matches: [] }
    ];

    this.save();
    return this.getState();
  }

  /**
   * Get the current active match for the player.
   */
  getCurrentPlayerMatch() {
    if (!this.active || this.currentRoundIndex >= this.rounds.length) return null;
    const round = this.rounds[this.currentRoundIndex];
    if (!round) return null;
    return round.matches.find(m => m.isPlayerMatch && !m.winner) || null;
  }

  /**
   * Advance tournament after player match finishes.
   * @param {boolean} playerWon
   * @param {number} playerScore
   * @param {number} opponentScore
   */
  recordPlayerMatchResult(playerWon, playerScore, opponentScore) {
    const match = this.getCurrentPlayerMatch();
    if (!match) return;

    match.scoreA = playerScore;
    match.scoreB = opponentScore;
    match.winner = playerWon ? match.teamA : match.teamB;

    if (!playerWon) {
      this.isEliminated = true;
      this.eliminatedInRound = this.rounds[this.currentRoundIndex].name;
      this.active = false;
      this.save();
      return;
    }

    // Simulate other AI matches in this round
    this._simulateAIMatches(this.currentRoundIndex);

    // If player won the final, they are champion!
    if (this.currentRoundIndex === 3) {
      this.isChampion = true;
      this.active = false;
      this.save();
      return;
    }

    // Generate next round bracket
    this._generateNextRound(this.currentRoundIndex);
    this.currentRoundIndex++;
    this.save();
  }

  _simulateAIMatches(roundIndex) {
    const round = this.rounds[roundIndex];
    if (!round) return;

    round.matches.forEach((m, idx) => {
      if (m.winner) return; // Player match already resolved
      // Realistic shootout simulation
      let baseA = 3 + Math.floor(Math.random() * 3);
      let baseB = 3 + Math.floor(Math.random() * 3);
      if (baseB === baseA) {
        if (Math.random() < 0.5) baseA++;
        else baseB++;
      }
      m.scoreA = baseA;
      m.scoreB = baseB;
      m.winner = baseA > baseB ? m.teamA : m.teamB;
    });
  }

  _generateNextRound(completedRoundIndex) {
    const nextIdx = completedRoundIndex + 1;
    if (nextIdx >= this.rounds.length) return;

    const currRound = this.rounds[completedRoundIndex];
    const nextRound = this.rounds[nextIdx];
    const winners = currRound.matches.map(m => m.winner);

    const nextMatches = [];
    const matchCount = winners.length / 2;

    for (let i = 0; i < matchCount; i++) {
      const teamA = winners[i * 2];
      const teamB = winners[i * 2 + 1];
      const isPlayerMatch = (teamA.id === this.playerTeam.id || teamB.id === this.playerTeam.id);

      // Keep player team as teamA for consistent Home rendering
      const actualA = (teamB.id === this.playerTeam.id) ? teamB : teamA;
      const actualB = (teamB.id === this.playerTeam.id) ? teamA : teamB;

      nextMatches.push({
        id: `${nextRound.id}_M${i}`,
        teamA: actualA,
        teamB: actualB,
        winner: null,
        scoreA: null,
        scoreB: null,
        isPlayerMatch
      });
    }

    nextRound.matches = nextMatches;
  }

  getCurrentDifficulty() {
    if (this.currentRoundIndex >= ROUND_NAMES.length) return 'HELL';
    return ROUND_NAMES[this.currentRoundIndex].difficulty;
  }

  // --- Convenience Getters & Aliases ---
  isActive() {
    return !!this.active;
  }

  isComplete() {
    return !!this.isChampion;
  }

  checkEliminated() {
    return !!this.isEliminated;
  }

  getPlayerTeam() {
    return this.playerTeam;
  }

  getCurrentMatch() {
    return this.getCurrentPlayerMatch();
  }

  getOpponentTeam() {
    const m = this.getCurrentPlayerMatch();
    if (!m) return null;
    return m.teamA.id === this.playerTeam?.id ? m.teamB : m.teamA;
  }

  getRound() {
    const r = this.rounds[this.currentRoundIndex];
    return r ? r.id : 'R16';
  }

  getRoundName() {
    const r = this.rounds[this.currentRoundIndex];
    return r ? r.name : '完成';
  }

  getNextRoundName() {
    const r = this.rounds[this.currentRoundIndex + 1];
    return r ? r.name : '世界之巔';
  }

  getMatchesForRound(roundId) {
    const r = this.rounds.find(x => x.id === roundId) || this.rounds[this.currentRoundIndex];
    return r ? r.matches : [];
  }

  startTournament(playerTeamId = 'HKG') {
    return this.startNewTournament(playerTeamId);
  }

  recordPlayerMatch(playerScore, opponentScore) {
    const won = playerScore > opponentScore;
    return this.recordPlayerMatchResult(won, playerScore, opponentScore);
  }

  advanceRound() {
    return true;
  }

  getState() {
    return {
      active: this.active,
      playerTeam: this.playerTeam,
      currentRoundIndex: this.currentRoundIndex,
      currentRoundName: ROUND_NAMES[this.currentRoundIndex] ? ROUND_NAMES[this.currentRoundIndex].name : '完成',
      currentDifficulty: this.getCurrentDifficulty(),
      isChampion: this.isChampion,
      isEliminated: this.isEliminated,
      eliminatedInRound: this.eliminatedInRound,
      rounds: this.rounds
    };
  }

  save() {
    try {
      if (typeof localStorage !== 'undefined') {
        const payload = JSON.stringify(this.getState());
        localStorage.setItem(STORAGE_KEY_TOURNAMENT, payload);
      }
    } catch (e) {
      console.warn('Failed to save tournament state to localStorage:', e);
    }
  }

  load() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY_TOURNAMENT);
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (data && data.playerTeam && Array.isArray(data.rounds) && data.rounds.length === 4) {
          this.active = data.active;
          this.playerTeam = data.playerTeam;
          this.currentRoundIndex = data.currentRoundIndex || 0;
          this.isChampion = !!data.isChampion;
          this.isEliminated = !!data.isEliminated;
          this.eliminatedInRound = data.eliminatedInRound || null;
          this.rounds = data.rounds;
          return true;
        }
      }
    } catch (e) {
      // Safe fallback on corrupted storage data
    }
    return false;
  }

  reset() {
    this.playerTeam = null;
    this.rounds = [];
    this.currentRoundIndex = 0;
    this.isChampion = false;
    this.isEliminated = false;
    this.eliminatedInRound = null;
    this.active = false;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY_TOURNAMENT);
      }
    } catch (e) {}
  }

  _shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
