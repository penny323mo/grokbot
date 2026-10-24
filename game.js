/**
 * 12碼讀心戰 (Penalty Mind Game) - Main Game Controller
 * Pure vanilla JavaScript with Web Audio API sound synthesis and mobile-first UI interactions.
 */

(function () {
  'use strict';

  // --- AUDIO SYNTHESIS ENGINE (Web Audio API) ---
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.isMuted = true; // Muted by default per SPEC
    }

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      if (!this.isMuted) {
        this.init();
        this.playBlip(600, 0.08);
      }
      return this.isMuted;
    }

    playWhistle() {
      if (this.isMuted || !this.ctx) return;
      this.init();
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(2400, now);
      osc2.frequency.setValueAtTime(2800, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    }

    playKick() {
      if (this.isMuted || !this.ctx) return;
      this.init();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    }

    playGoal() {
      if (this.isMuted || !this.ctx) return;
      this.init();
      const now = this.ctx.currentTime;

      // Net swish (filtered white noise)
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);
      filter.Q.setValueAtTime(1.5, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.4);

      // Cheer chord
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + 0.05 + idx * 0.04);
        g.gain.setValueAtTime(0.12, now + 0.05 + idx * 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(now + 0.05 + idx * 0.04);
        osc.stop(now + 0.7);
      });
    }

    playSave() {
      if (this.isMuted || !this.ctx) return;
      this.init();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.22);

      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    }

    playCrossbar() {
      if (this.isMuted || !this.ctx) return;
      this.init();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(840, now);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.65);
    }

    playMiss() {
      if (this.isMuted || !this.ctx) return;
      this.init();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.35);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    }

    playBlip(freq = 480, duration = 0.08) {
      if (this.isMuted || !this.ctx) return;
      this.init();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    }
  }

  // --- GAME CONSTANTS & STATE ---
  const sound = new SoundEngine();
  const model = new PenaltyMindModel();
  model.loadFromStorage();

  const ZONE_LIST = ['TL', 'TM', 'TR', 'BL', 'BM', 'BR'];
  const ZONE_NAMES = {
    TL: '左上',
    TM: '中上',
    TR: '右上',
    BL: '左下',
    BM: '中下',
    BR: '右下'
  };

  const MAX_REGULAR_KICKS = 5;
  const MAX_TOTAL_ROUNDS = 15; // 5 regular + 10 sudden death

  let gameState = {
    round: 1,
    turn: 'player', // 'player' (shooting) | 'ai' (keeping)
    playerScore: 0,
    aiScore: 0,
    playerKicks: [], // array of 'scored' | 'missed'
    aiKicks: [],     // array of 'scored' | 'missed'
    isSuddenDeath: false,
    waitingForInput: false,
    keepingTimer: null,
    keepingTimerLastTick: 0,
    keepingTimeRemaining: 1500, // 1.5 seconds response window
    isTimerPaused: false,
    modalOpen: false,
    runUpActive: false,
    runUpFinishedWhilePaused: false,
    aiShotZone: null,
    playerSavesCount: 0,
    aiShotsFaced: 0
  };

  // Match token and active timeouts set to prevent state corruption on leaving or double clicking
  let currentMatchToken = 0;
  const activeTimeouts = new Set();

  function safeSetTimeout(fn, ms) {
    const token = currentMatchToken;
    let id;
    id = setTimeout(() => {
      activeTimeouts.delete(id);
      if (token === currentMatchToken) {
        fn();
      }
    }, ms);
    activeTimeouts.add(id);
    return id;
  }

  // DOM Elements
  const screens = {
    title: document.getElementById('screen-title'),
    match: document.getElementById('screen-match'),
    end: document.getElementById('screen-end')
  };

  const el = {
    soundToggle: document.getElementById('btn-sound-toggle'),
    soundIcon: document.getElementById('sound-icon'),
    soundLabel: document.getElementById('sound-label'),
    navHome: document.getElementById('btn-nav-home'),

    // Title screen
    startGameBtn: document.getElementById('btn-start-game'),
    titleMemoryDesc: document.getElementById('title-memory-desc'),
    resetMemoryTitleBtn: document.getElementById('btn-reset-memory-title'),

    // Match screen
    homeTeamName: document.getElementById('home-team-name'),
    awayTeamName: document.getElementById('away-team-name'),
    scoreDigits: document.getElementById('score-digits'),
    roundSubtag: document.getElementById('round-subtag'),
    playerDots: document.getElementById('player-dots'),
    aiDots: document.getElementById('ai-dots'),
    turnBanner: document.getElementById('turn-banner'),
    reactionTimerWrap: document.getElementById('reaction-timer-wrap'),
    reactionTimerFill: document.getElementById('reaction-timer-fill'),
    goalNet: document.getElementById('goal-net'),
    goalkeeper: document.getElementById('goalkeeper'),
    kickerAi: document.getElementById('kicker-ai'),
    soccerBall: document.getElementById('soccer-ball'),
    reactionBanner: document.getElementById('reaction-banner'),
    zoneCells: document.querySelectorAll('.zone-cell'),

    // Mind-reading overlay
    mindOverlay: document.getElementById('mind-reading-overlay'),
    mindResultPill: document.getElementById('mind-shot-result-pill'),
    mindPredictionMain: document.getElementById('mind-prediction-main'),
    mindPredictionSub: document.getElementById('mind-prediction-sub'),
    probBarsContainer: document.getElementById('prob-bars-container'),
    mindCommentary: document.getElementById('mind-commentary'),
    nextKickBtn: document.getElementById('btn-next-kick'),

    // End screen
    endResultBadge: document.getElementById('end-result-badge'),
    endResultTitle: document.getElementById('end-result-title'),
    endFinalScore: document.getElementById('end-final-score'),
    endPredictabilityNum: document.getElementById('end-predictability-num'),
    endPredictabilityTag: document.getElementById('end-predictability-tag'),
    endPredictabilityDesc: document.getElementById('end-predictability-desc'),
    endHeatmapGrid: document.getElementById('end-heatmap-grid'),
    endTotalShotsTag: document.getElementById('end-total-shots-tag'),
    endKeeperAcc: document.getElementById('end-keeper-acc'),
    endPlayerSaveAcc: document.getElementById('end-player-save-acc'),
    playAgainBtn: document.getElementById('btn-play-again'),
    resetMemoryEndBtn: document.getElementById('btn-reset-memory-end'),
    backHomeBtn: document.getElementById('btn-back-home'),

    // In-page modal
    gameModal: document.getElementById('game-modal'),
    modalText: document.getElementById('game-modal-text'),
    modalCancelBtn: document.getElementById('btn-modal-cancel'),
    modalConfirmBtn: document.getElementById('btn-modal-confirm')
  };

  // --- IN-PAGE CANTONESE MODAL SYSTEM ---
  let modalConfirmCallback = null;
  let modalCancelCallback = null;

  function showCustomDialog({ text, showCancel = false, onConfirm = null, onCancel = null }) {
    gameState.modalOpen = true;
    pauseKeepingTimer();
    el.modalText.textContent = text;
    el.modalCancelBtn.style.display = showCancel ? 'block' : 'none';
    modalConfirmCallback = onConfirm;
    modalCancelCallback = onCancel;
    el.gameModal.classList.add('active');
  }

  function closeCustomDialog() {
    gameState.modalOpen = false;
    el.gameModal.classList.remove('active');
  }

  el.modalConfirmBtn.addEventListener('click', () => {
    const cb = modalConfirmCallback;
    closeCustomDialog();
    if (cb) {
      cb();
    } else {
      resumeKeepingTimer();
    }
  });

  el.modalCancelBtn.addEventListener('click', () => {
    const cb = modalCancelCallback;
    closeCustomDialog();
    if (cb) {
      cb();
    } else {
      resumeKeepingTimer();
    }
  });

  // --- SCREEN SWITCHING ---
  function showScreen(name) {
    Object.keys(screens).forEach((s) => {
      screens[s].classList.toggle('active', s === name);
    });
    if (name === 'title') {
      updateTitleMemoryDisplay();
      el.navHome.style.display = 'none';
    } else {
      el.navHome.style.display = 'flex';
    }
  }

  function updateTitleMemoryDisplay() {
    const shots = model.totalShots;
    const score = model.getPredictabilityScore();
    if (model.storageFailed) {
      el.titleMemoryDesc.textContent = `呢部機儲存唔到記憶 · 可預測度 ${score}%`;
    } else {
      el.titleMemoryDesc.textContent = `已記錄 ${shots} 次射門 · 可預測度 ${score}%`;
    }
  }

  // --- AUDIO TOGGLE ---
  function updateSoundUI(muted) {
    el.soundIcon.textContent = muted ? '🔇' : '🔊';
    el.soundLabel.textContent = muted ? '聲音：關' : '聲音：開';
  }

  el.soundToggle.addEventListener('click', () => {
    const isMuted = sound.toggleMute();
    updateSoundUI(isMuted);
  });

  el.navHome.addEventListener('click', () => {
    showCustomDialog({
      text: '結束而家呢場，返主頁？',
      showCancel: true,
      onConfirm: () => {
        cleanTimers();
        showScreen('title');
      },
      onCancel: () => {
        resumeKeepingTimer();
      }
    });
  });

  // --- RESET MEMORY HANDLERS ---
  function handleResetMemory() {
    showCustomDialog({
      text: '清晒門將記憶？佢會變返白紙。',
      showCancel: true,
      onConfirm: () => {
        model.resetStorage();
        updateTitleMemoryDisplay();
        sound.playBlip(350, 0.15);
        if (screens.end.classList.contains('active')) {
          renderEndScreenStats();
        }
        showCustomDialog({
          text: '已經清晒門將記憶。',
          showCancel: false
        });
      },
      onCancel: () => {
        resumeKeepingTimer();
      }
    });
  }

  el.resetMemoryTitleBtn.addEventListener('click', handleResetMemory);
  el.resetMemoryEndBtn.addEventListener('click', handleResetMemory);

  // --- TIMER MANAGEMENT & PAUSE/RESUME ---
  function cleanTimers() {
    currentMatchToken++;
    activeTimeouts.forEach(id => clearTimeout(id));
    activeTimeouts.clear();
    if (gameState.keepingTimer) {
      clearInterval(gameState.keepingTimer);
      gameState.keepingTimer = null;
    }
    gameState.isTimerPaused = false;
    gameState.waitingForInput = false;
    gameState.runUpActive = false;
    gameState.runUpFinishedWhilePaused = false;
  }

  function pauseKeepingTimer() {
    if (gameState.turn === 'ai') {
      if (gameState.waitingForInput && gameState.keepingTimer && !gameState.isTimerPaused) {
        gameState.isTimerPaused = true;
        clearInterval(gameState.keepingTimer);
        gameState.keepingTimer = null;
      }
    }
  }

  function resumeKeepingTimer() {
    if (gameState.modalOpen || document.hidden) return;
    if (gameState.turn === 'ai') {
      if (gameState.runUpFinishedWhilePaused) {
        gameState.runUpFinishedWhilePaused = false;
        el.turnBanner.innerHTML = `<span>🧤 <strong>第 ${gameState.round} 輪 · 你把關</strong>：出腳喇！1.5秒內點擊撲救！</span>`;
        gameState.waitingForInput = true;
        startKeepingCountdown(1500);
        return;
      }
      if (gameState.waitingForInput && gameState.isTimerPaused && gameState.keepingTimeRemaining > 0) {
        gameState.isTimerPaused = false;
        startKeepingCountdown(gameState.keepingTimeRemaining);
      }
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pauseKeepingTimer();
    } else {
      if (!gameState.modalOpen) {
        resumeKeepingTimer();
      }
    }
  });

  function startKeepingCountdown(initialRemaining = 1500) {
    if (gameState.keepingTimer) {
      clearInterval(gameState.keepingTimer);
      gameState.keepingTimer = null;
    }
    gameState.keepingTimeRemaining = initialRemaining;
    gameState.keepingTimerLastTick = performance.now();
    el.reactionTimerFill.style.width = `${(initialRemaining / 1500) * 100}%`;
    el.reactionTimerWrap.classList.add('active');

    gameState.keepingTimer = setInterval(() => {
      if (gameState.modalOpen || document.hidden || gameState.isTimerPaused) {
        gameState.keepingTimerLastTick = performance.now();
        return;
      }
      const now = performance.now();
      const dt = Math.max(0, now - gameState.keepingTimerLastTick);
      gameState.keepingTimerLastTick = now;
      gameState.keepingTimeRemaining = Math.max(0, gameState.keepingTimeRemaining - dt);

      const pct = (gameState.keepingTimeRemaining / 1500) * 100;
      el.reactionTimerFill.style.width = `${pct}%`;

      if (gameState.keepingTimeRemaining <= 0) {
        clearInterval(gameState.keepingTimer);
        gameState.keepingTimer = null;
        handlePlayerDiveChoice('BM', null, true);
      }
    }, 30);
  }

  // --- INITIALIZE NEW MATCH ---
  function startMatch() {
    cleanTimers();
    sound.init();
    sound.playWhistle();

    gameState = {
      round: 1,
      turn: 'player',
      playerScore: 0,
      aiScore: 0,
      playerKicks: [],
      aiKicks: [],
      isSuddenDeath: false,
      waitingForInput: false,
      keepingTimer: null,
      keepingTimerLastTick: 0,
      keepingTimeRemaining: 1500,
      isTimerPaused: false,
      modalOpen: false,
      runUpActive: false,
      runUpFinishedWhilePaused: false,
      aiShotZone: null,
      playerSavesCount: 0,
      aiShotsFaced: 0
    };

    renderScoreboard();
    resetFieldPositions();
    el.mindOverlay.classList.remove('active');
    showScreen('match');
    startPlayerTurn();
  }

  el.startGameBtn.addEventListener('click', startMatch);
  el.playAgainBtn.addEventListener('click', startMatch);
  el.backHomeBtn.addEventListener('click', () => {
    cleanTimers();
    showScreen('title');
  });

  // --- FIELD & ACTOR RESET ---
  function resetFieldPositions() {
    el.goalkeeper.className = 'goalkeeper idle';
    el.goalkeeper.style.transform = '';

    el.soccerBall.className = 'soccer-ball';
    el.soccerBall.style.transform = '';
    el.soccerBall.style.opacity = '1';

    el.kickerAi.className = 'kicker-ai';

    el.goalNet.classList.remove('ripple');

    el.reactionBanner.className = 'reaction-banner';
    el.reactionBanner.textContent = '';

    el.zoneCells.forEach((c) => {
      c.classList.remove('selected', 'disabled');
    });

    el.reactionTimerWrap.classList.remove('active');
    el.reactionTimerFill.style.width = '100%';
    el.mindOverlay.classList.remove('active');
  }

  // --- RENDER SCOREBOARD ---
  function renderScoreboard() {
    el.scoreDigits.textContent = `${gameState.playerScore} - ${gameState.aiScore}`;

    if (gameState.turn === 'player') {
      if (el.homeTeamName) el.homeTeamName.textContent = '你 (主射)';
      if (el.awayTeamName) el.awayTeamName.textContent = '電腦 (門將)';
    } else {
      if (el.homeTeamName) el.homeTeamName.textContent = '你 (門將)';
      if (el.awayTeamName) el.awayTeamName.textContent = '電腦 (主射)';
    }

    if (gameState.isSuddenDeath) {
      el.roundSubtag.textContent = `突然死亡 第 ${gameState.round - 5} 輪`;
    } else {
      el.roundSubtag.textContent = `第 ${gameState.round} 輪 / 共 5 輪`;
    }

    // Render Kick Dots (shows 5 in regular time; exactly round R in sudden death)
    const totalSlots = Math.max(MAX_REGULAR_KICKS, gameState.round, gameState.playerKicks.length, gameState.aiKicks.length);

    el.playerDots.innerHTML = '';
    el.aiDots.innerHTML = '';

    for (let i = 0; i < totalSlots; i++) {
      // Player dot
      const pDot = document.createElement('div');
      pDot.className = 'kick-dot';
      if (i < gameState.playerKicks.length) {
        const res = gameState.playerKicks[i];
        pDot.classList.add(res === 'scored' ? 'scored' : 'missed');
        pDot.textContent = res === 'scored' ? '✓' : '✗';
      } else if (i === gameState.playerKicks.length && gameState.turn === 'player') {
        pDot.classList.add('current');
      }
      el.playerDots.appendChild(pDot);

      // AI dot
      const aDot = document.createElement('div');
      aDot.className = 'kick-dot';
      if (i < gameState.aiKicks.length) {
        const res = gameState.aiKicks[i];
        aDot.classList.add(res === 'scored' ? 'scored' : 'missed');
        aDot.textContent = res === 'scored' ? '✓' : '✗';
      } else if (i === gameState.aiKicks.length && gameState.turn === 'ai') {
        aDot.classList.add('current');
      }
      el.aiDots.appendChild(aDot);
    }
  }

  // --- TURN 1: PLAYER SHOOTS ---
  function startPlayerTurn() {
    cleanTimers();
    gameState.turn = 'player';
    resetFieldPositions();
    renderScoreboard();

    el.turnBanner.className = 'turn-banner';
    el.turnBanner.innerHTML = `<span>⚽ <strong>第 ${gameState.round} 輪 · 你主射</strong>：點擊球門 6 個方位之一起腳！</span>`;

    gameState.waitingForInput = true;
  }

  // Player clicks a zone
  el.zoneCells.forEach((cell) => {
    cell.addEventListener('click', () => {
      const zone = cell.dataset.zone;
      if (!gameState.waitingForInput) return;

      if (gameState.turn === 'player') {
        handlePlayerShot(zone, cell);
      } else if (gameState.turn === 'ai') {
        handlePlayerDiveChoice(zone, cell);
      }
    });
  });

  function handlePlayerShot(shotZone, cellElement) {
    if (!gameState.waitingForInput) return;
    gameState.waitingForInput = false;
    cellElement.classList.add('selected');
    el.zoneCells.forEach((c) => c.classList.add('disabled'));

    // AI Keeper Prediction
    const prediction = model.getProbabilities();
    const predictedZone = prediction.predictedZone; // null on tie
    const isAmbiguous = prediction.isAmbiguous;
    const confidence = prediction.confidence;

    // AI Keeper Dive Zone (fair random when tied, else exploration)
    const keeperDiveZone = model.chooseDiveZone(0.12);

    // Record shot in persistent memory (null predictedZone safely skips recording accuracy)
    model.recordShot(shotZone, predictedZone);
    model.saveToStorage();

    // Determine Shot Outcome:
    // 1. Top corner miss chance (~12% for TL and TR)
    let isCornerMiss = false;
    let missType = null;
    if (shotZone === 'TL' || shotZone === 'TR') {
      if (Math.random() < 0.12) {
        isCornerMiss = true;
        missType = Math.random() < 0.5 ? 'crossbar' : (shotZone === 'TL' ? 'wide-left' : 'wide-right');
      }
    }

    let isGoal = false;
    let isSaved = false;
    let resultMessage = '';

    if (isCornerMiss) {
      if (missType === 'crossbar') {
        resultMessage = '中楣彈出！';
      } else {
        resultMessage = '球飛過界射失！';
      }
    } else {
      // On target: check keeper save
      if (shotZone === 'BM' && keeperDiveZone === 'BM') {
        // Bottom-middle: keeper stays central (BM), easy save
        isSaved = true;
        resultMessage = '門將留守中間，輕鬆沒收！';
      } else if (keeperDiveZone === shotZone) {
        isSaved = true;
        resultMessage = '被門將飛身撲出！';
      } else {
        isGoal = true;
        resultMessage = '入波！！！';
      }
    }

    // Play visual animations
    sound.playKick();

    // Keeper dive animation
    el.goalkeeper.className = `goalkeeper dive-${keeperDiveZone}`;

    // Ball flight animation
    if (isCornerMiss) {
      if (missType === 'crossbar') {
        el.soccerBall.className = shotZone === 'TL' ? 'soccer-ball miss-crossbar-left' : 'soccer-ball miss-crossbar-right';
        safeSetTimeout(() => sound.playCrossbar(), 300);
      } else if (missType === 'wide-left') {
        el.soccerBall.className = 'soccer-ball miss-wide-left';
        safeSetTimeout(() => sound.playMiss(), 300);
      } else {
        el.soccerBall.className = 'soccer-ball miss-wide-right';
        safeSetTimeout(() => sound.playMiss(), 300);
      }
    } else {
      el.soccerBall.className = `soccer-ball kick-${shotZone}`;
      if (isSaved) {
        safeSetTimeout(() => sound.playSave(), 300);
      } else {
        safeSetTimeout(() => {
          sound.playGoal();
          el.goalNet.classList.add('ripple');
        }, 320);
      }
    }

    // Reaction Popup
    safeSetTimeout(() => {
      el.reactionBanner.textContent = resultMessage;
      el.reactionBanner.className = `reaction-banner show ${isGoal ? 'goal' : 'miss'}`;
    }, 380);

    // Record kick result
    const outcome = isGoal ? 'scored' : 'missed';
    gameState.playerKicks.push(outcome);
    if (isGoal) gameState.playerScore += 1;
    renderScoreboard();

    // Open Mind-Reading Overlay after flight completes
    safeSetTimeout(() => {
      showMindReadingOverlay({
        shotZone,
        predictedZone,
        confidence,
        keeperDiveZone,
        outcome,
        isGoal,
        isSaved,
        isCornerMiss,
        missType,
        isAmbiguous,
        probs: prediction.probabilities
      });
    }, 1100);
  }

  // --- SCREEN 3: MIND READING OVERLAY DISPLAY ---
  function showMindReadingOverlay({
    shotZone,
    predictedZone,
    confidence,
    keeperDiveZone,
    outcome,
    isGoal,
    isSaved,
    isCornerMiss,
    missType,
    isAmbiguous,
    probs
  }) {
    sound.playBlip(720, 0.12);

    el.mindResultPill.className = `kick-dot ${outcome}`;
    el.mindResultPill.textContent = outcome === 'scored' ? '✓' : '✗';

    if (isAmbiguous || !predictedZone) {
      el.mindPredictionMain.innerHTML = `門將估你射：<strong>【暫時未有傾向】</strong> (觀察中)`;
    } else {
      el.mindPredictionMain.innerHTML = `門將估你射：<strong>【${ZONE_NAMES[predictedZone]}】</strong> (信心 ${confidence}%)`;
    }

    let subText = `你射：【${ZONE_NAMES[shotZone]}】 · 門將撲向：【${ZONE_NAMES[keeperDiveZone]}】 ➔ `;
    if (isGoal) {
      if (!predictedZone || predictedZone !== shotZone) {
        subText += `<span style="color: #00e676;">你成功騙過門將讀心！入波！</span>`;
      } else {
        subText += `<span style="color: #00e676;">門將雖然估中，但撲錯邊，入波！</span>`;
      }
    } else if (isCornerMiss) {
      if (missType === 'crossbar') {
        subText += `<span style="color: #ff334b;">射中門楣彈出！差啲！</span>`;
      } else {
        subText += `<span style="color: #ff334b;">角度太刁，飛出界外！</span>`;
      }
    } else if (isSaved) {
      if (predictedZone === shotZone) {
        subText += `<span style="color: #ff334b;">門將一早睇穿你嘅習慣，神勇撲出！</span>`;
      } else {
        subText += `<span style="color: #ff334b;">門將反應神速，成功撲出！</span>`;
      }
    }
    el.mindPredictionSub.innerHTML = subText;

    // Build 6-zone probability bar chart
    el.probBarsContainer.innerHTML = '';
    ZONE_LIST.forEach((z) => {
      const pct = Math.round((probs[z] || 0) * 100);
      const isPredicted = !isAmbiguous && z === predictedZone;
      const isShot = z === shotZone;

      const row = document.createElement('div');
      row.className = `prob-bar-row ${isPredicted ? 'predicted' : ''} ${isShot ? 'shot' : ''}`;

      const nameEl = document.createElement('div');
      nameEl.className = 'prob-zone-name';
      nameEl.textContent = ZONE_NAMES[z];

      const track = document.createElement('div');
      track.className = 'prob-track';

      const fill = document.createElement('div');
      fill.className = 'prob-fill';
      fill.style.width = '0%';
      track.appendChild(fill);

      const valEl = document.createElement('div');
      valEl.className = 'prob-val';
      valEl.textContent = `${pct}%`;

      row.appendChild(nameEl);
      row.appendChild(track);
      row.appendChild(valEl);
      el.probBarsContainer.appendChild(row);

      // Animate bar fill with raw percentage
      safeSetTimeout(() => {
        fill.style.width = `${pct}%`;
      }, 50);
    });

    // Cantonese commentary
    let commentary = '';
    if (isCornerMiss) {
      if (missType === 'crossbar') {
        commentary = '「門將：『嘩！中楣彈出，好彩咋！』」';
      } else {
        commentary = '「門將：『嘩！好彩你呢腳射出界咋！』」';
      }
    } else if (isGoal) {
      if (!predictedZone || predictedZone !== shotZone) {
        commentary = '「門將：『估你唔到……你呢腳完全打破咗你平時嘅規律！』」';
      } else {
        commentary = '「門將：『估中咗，但撲錯邊……！』」';
      }
    } else if (isSaved) {
      if (predictedZone === shotZone) {
        commentary = '「門將：『哈！你行埋嚟嗰陣，我已經知你想射呢度！』」';
      } else {
        commentary = '「門將：『好彩我反應夠快撲到！』」';
      }
    }
    el.mindCommentary.textContent = commentary;

    el.mindOverlay.classList.add('active');
  }

  el.nextKickBtn.addEventListener('click', () => {
    if (!el.mindOverlay.classList.contains('active')) return;
    el.mindOverlay.classList.remove('active');
    proceedAfterPlayerShot();
  });

  function proceedAfterPlayerShot() {
    if (checkShootoutDecided()) {
      endMatch();
      return;
    }
    startAiTurn();
  }

  // --- TURN 2: AI SHOOTS (PLAYER KEEPS GOAL) ---
  function startAiTurn() {
    cleanTimers();
    gameState.turn = 'ai';
    resetFieldPositions();
    renderScoreboard();

    gameState.aiShotsFaced += 1;

    // AI Kicker tendencies:
    // Low corners ~60% (BL 30%, BR 30%), Middle 20% (TM 10%, BM 10%), Top corners 20% (TL 10%, TR 10%)
    const aiDistribution = [
      { zone: 'BL', weight: 0.30 },
      { zone: 'BR', weight: 0.30 },
      { zone: 'TL', weight: 0.10 },
      { zone: 'TR', weight: 0.10 },
      { zone: 'TM', weight: 0.10 },
      { zone: 'BM', weight: 0.10 }
    ];
    const r = Math.random();
    let cumulative = 0;
    let chosenZone = 'BL';
    for (const item of aiDistribution) {
      cumulative += item.weight;
      if (r <= cumulative) {
        chosenZone = item.zone;
        break;
      }
    }
    gameState.aiShotZone = chosenZone;

    // Show Kicker Character
    el.kickerAi.classList.add('active');
    el.turnBanner.className = 'turn-banner urgent';
    el.turnBanner.innerHTML = `<span>🧤 <strong>第 ${gameState.round} 輪 · 你把關</strong>：助跑緊……準備撲救！</span>`;

    // 1.0s run-up animation with input disabled
    gameState.waitingForInput = false;
    gameState.runUpActive = true;
    gameState.runUpFinishedWhilePaused = false;
    el.kickerAi.classList.add('run-up');

    // After 1000ms run-up finishes, enable dive input & start 1.5s countdown
    safeSetTimeout(() => {
      gameState.runUpActive = false;
      if (gameState.modalOpen || document.hidden) {
        gameState.runUpFinishedWhilePaused = true;
        return;
      }
      el.turnBanner.innerHTML = `<span>🧤 <strong>第 ${gameState.round} 輪 · 你把關</strong>：出腳喇！1.5秒內點擊撲救！</span>`;
      gameState.waitingForInput = true;
      startKeepingCountdown(1500);
    }, 1000);
  }

  function handlePlayerDiveChoice(playerDiveZone, cellElement, timedOut = false) {
    if (!timedOut && !gameState.waitingForInput) return;
    gameState.waitingForInput = false;
    cleanTimers();

    if (cellElement) {
      cellElement.classList.add('selected');
    }
    el.zoneCells.forEach((c) => c.classList.add('disabled'));
    el.reactionTimerWrap.classList.remove('active');

    const shotZone = gameState.aiShotZone;

    // Opponent miss check (~12% if top corner per SPEC)
    let aiMissed = false;
    let missType = null;
    if (shotZone === 'TL' || shotZone === 'TR') {
      if (Math.random() < 0.12) {
        aiMissed = true;
        missType = Math.random() < 0.5 ? 'crossbar' : 'wide';
      }
    }

    // Save check
    let isSaved = false;
    if (!aiMissed) {
      if (playerDiveZone === shotZone) {
        isSaved = true;
      }
    }

    // Credit save count whenever isSaved is true (including on timeout)
    if (isSaved) {
      gameState.playerSavesCount += 1;
    }

    const aiScored = !aiMissed && !isSaved;

    sound.playKick();
    el.goalkeeper.className = `goalkeeper dive-${playerDiveZone}`;

    // Ball flight
    if (aiMissed) {
      if (missType === 'crossbar') {
        el.soccerBall.className = shotZone === 'TL' ? 'soccer-ball miss-crossbar-left' : 'soccer-ball miss-crossbar-right';
        safeSetTimeout(() => sound.playCrossbar(), 300);
      } else {
        el.soccerBall.className = shotZone === 'TL' ? 'soccer-ball miss-wide-left' : 'soccer-ball miss-wide-right';
        safeSetTimeout(() => sound.playMiss(), 300);
      }
    } else {
      el.soccerBall.className = `soccer-ball kick-${shotZone}`;
      if (isSaved) {
        safeSetTimeout(() => sound.playSave(), 300);
      } else {
        safeSetTimeout(() => {
          sound.playGoal();
          el.goalNet.classList.add('ripple');
        }, 320);
      }
    }

    // Reaction text
    let feedback = '';
    if (timedOut) {
      if (isSaved) {
        feedback = '嚟唔切，留喺中間。好彩成功沒收！';
      } else if (aiMissed) {
        feedback = missType === 'crossbar' ? '嚟唔切，留喺中間。好在中楣！' : '嚟唔切，留喺中間。好在對手射出界！';
      } else {
        feedback = '嚟唔切，留喺中間，被射入！';
      }
    } else if (isSaved) {
      feedback = '神救！你成功撲出 12 碼！';
    } else if (aiMissed) {
      feedback = missType === 'crossbar' ? '電腦中楣彈出！' : '電腦射出界！';
    } else {
      feedback = '電腦射入！';
    }

    safeSetTimeout(() => {
      el.reactionBanner.textContent = feedback;
      el.reactionBanner.className = `reaction-banner show ${aiScored ? 'miss' : 'goal'}`;
    }, 380);

    // Record AI kick result
    const outcome = aiScored ? 'scored' : 'missed';
    gameState.aiKicks.push(outcome);
    if (aiScored) gameState.aiScore += 1;
    renderScoreboard();

    // Advance round or end game
    safeSetTimeout(() => {
      advanceRound();
    }, 1500);
  }

  // --- ROUND PROGRESSION & SUDDEN DEATH ---
  function checkShootoutDecided() {
    const pKicks = gameState.playerKicks.length;
    const aKicks = gameState.aiKicks.length;
    const pScore = gameState.playerScore;
    const aScore = gameState.aiScore;

    // 1. Regular Shootout (First 5 rounds)
    if (!gameState.isSuddenDeath && pKicks <= MAX_REGULAR_KICKS && aKicks <= MAX_REGULAR_KICKS) {
      const pRemaining = MAX_REGULAR_KICKS - pKicks;
      const aRemaining = MAX_REGULAR_KICKS - aKicks;

      // Mathematical impossibility to catch up
      if (pScore > aScore + aRemaining) return true; // Player insurmountable lead
      if (aScore > pScore + pRemaining) return true; // AI insurmountable lead

      // Both completed 5 kicks
      if (pKicks === MAX_REGULAR_KICKS && aKicks === MAX_REGULAR_KICKS) {
        if (pScore !== aScore) return true;
        // Tied after 5 rounds -> Enter Sudden Death!
        gameState.isSuddenDeath = true;
        return false;
      }
      return false;
    }

    // 2. Sudden Death (Rounds > 5)
    // Only decided when both teams have had equal number of kicks in the sudden death round
    if (gameState.isSuddenDeath && pKicks === aKicks) {
      if (pScore !== aScore) return true;
      if (gameState.round >= MAX_TOTAL_ROUNDS) return true; // Safety cap
    }

    return false;
  }

  function advanceRound() {
    if (checkShootoutDecided()) {
      endMatch();
      return;
    }

    if (gameState.playerKicks.length === 5 && gameState.aiKicks.length === 5 && gameState.playerScore === gameState.aiScore) {
      gameState.isSuddenDeath = true;
    }

    gameState.round += 1;
    startPlayerTurn();
  }

  // --- SCREEN 4: END MATCH & STATS ---
  function endMatch() {
    cleanTimers();
    const won = gameState.playerScore > gameState.aiScore;
    const isDraw = gameState.playerScore === gameState.aiScore;

    if (isDraw) {
      sound.playBlip(520, 0.25);
      model.recordMatchResult('draw');
      el.endResultBadge.textContent = '🤝';
      el.endResultTitle.textContent = '打和！分唔到高下！';
      el.endResultTitle.className = 'result-title draw';
    } else if (won) {
      sound.playGoal();
      model.recordMatchResult(true);
      el.endResultBadge.textContent = '🏆';
      el.endResultTitle.textContent = '你贏咗！奪得冠軍！';
      el.endResultTitle.className = 'result-title win';
    } else {
      sound.playMiss();
      model.recordMatchResult(false);
      el.endResultBadge.textContent = '💔';
      el.endResultTitle.textContent = '你輸咗！門將技高一籌！';
      el.endResultTitle.className = 'result-title loss';
    }

    el.endFinalScore.textContent = `最終比數：${gameState.playerScore} - ${gameState.aiScore}`;
    renderEndScreenStats();
    showScreen('end');
  }

  function renderEndScreenStats() {
    // 1. Predictability
    const predictability = model.getPredictabilityScore();
    const rating = model.getPredictabilityRating(predictability);
    el.endPredictabilityNum.textContent = predictability;
    el.endPredictabilityTag.textContent = rating.tag;
    el.endPredictabilityDesc.textContent = rating.desc;

    // 2. Heatmap
    el.endTotalShotsTag.textContent = `累計已射門 ${model.totalShots} 次`;
    const heatmap = model.getHeatmapData();
    el.endHeatmapGrid.innerHTML = '';

    ZONE_LIST.forEach((z) => {
      const data = heatmap[z];
      const cell = document.createElement('div');
      cell.className = 'heatmap-cell';

      // Intensity tint
      const alpha = Math.min(0.7, 0.08 + (data.percent / 100) * 0.7);
      cell.style.backgroundColor = `rgba(0, 229, 255, ${alpha})`;

      const label = document.createElement('div');
      label.className = 'heatmap-zone-label';
      label.textContent = ZONE_NAMES[z];

      const pct = document.createElement('div');
      pct.className = 'heatmap-zone-pct';
      pct.textContent = `${data.percent}%`;

      cell.appendChild(label);
      cell.appendChild(pct);
      el.endHeatmapGrid.appendChild(cell);
    });

    // 3. Dual Stats
    el.endKeeperAcc.textContent = `${model.getKeeperAccuracy()}%`;

    // Save accuracy = saves / (saves + AI goals) (leaving off-target AI misses out of denominator)
    const aiGoals = gameState.aiKicks.filter(k => k === 'scored').length;
    const onTargetFaced = gameState.playerSavesCount + aiGoals;
    const saveAcc = onTargetFaced > 0
      ? Math.round((gameState.playerSavesCount / onTargetFaced) * 100)
      : 0;
    el.endPlayerSaveAcc.textContent = `${saveAcc}%`;
  }

  // --- BOOTSTRAP ---
  updateTitleMemoryDisplay();
  updateSoundUI(sound.isMuted);
  showScreen('title');

})();
