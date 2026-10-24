/**
 * 12碼讀心戰 (Penalty Mind Game v2) - Main Application Controller
 * Connects 3D Stadium Scene, Procedural Goalkeeper, Ball, Animated Taker, Input,
 * Physics, Sound, Juice FX, Difficulty, Mind-Game Tells & Taunts, and Mental Prediction.
 */

import * as THREE from 'three';
import { TUNING } from './tuning.js';
import { StadiumScene } from './scene.js';
import { Goalkeeper3D } from './keeper.js';
import { Ball3D } from './ball.js';
import { Taker3D } from './taker.js';
import { FXManager } from './fx.js';
import { SwipeInput } from './input.js';
import { swipeToLaunch, simulate, getZoneFromPoint, pointToLaunch } from './shot.js';
import { decide, checkSave, DIVE_TARGETS } from './keeperAI.js';
import { TakerAIModel } from './takerAI.js';
import { DIFFICULTY, getDifficultyConfig, saveDifficulty, loadDifficulty } from './difficulty.js';
import { getTaunt, computeTell } from './taunts.js';
import { sound } from './audio.js';
import { TEAMS, ROUND_NAMES, TournamentManager } from './tournament.js';
import { UnlocksManager, UNLOCK_CATALOG, TROPHIES } from './unlocks.js';
import { ShareCardManager } from './share.js';

class GameApp {
  constructor() {
    this.canvas = document.getElementById('scene');
    this.model = null;

    // 3D Engine subsystems
    this.stadium = null;
    this.keeper = null;
    this.ball = null;
    this.taker = null;
    this.fx = null;
    this.input = null;

    // AI & Difficulty
    this.takerAI = null;
    this.currentDifficulty = 'MEDIUM';
    this.difficultyConfig = null;

    // Round 3: Tournament & Unlocks & Share Subsystems
    this.tournament = new TournamentManager();
    this.unlocks = new UnlocksManager();
    this.shareCard = new ShareCardManager();
    this.matchMode = 'QUICK'; // 'QUICK' | 'TOURNAMENT'
    this.activePlayerTeam = null;
    this.activeOpponentTeam = null;
    this.selectedTeamForModal = 'HKG';
    this.lastMatchStarResult = { total: 0, breakdown: [] };
    this.isTabPaused = false;

    // Animation & physics loop state
    this.isRunning = false;
    this.lastTime = 0;
    this.timeScale = 1.0;
    this.hitStopTimer = 0;
    this.prefersReducedMotion = false;

    // Active ball flight state
    this.activeShot = null;
    this.flightTime = 0;
    this.ballCrossed = false;
    this.ballDeflecting = false;
    this.deflectPos = null;
    this.deflectVel = null;

    // Keeper mode state
    this.isKeeperTurn = false;
    this.keeperTurnState = null;

    // Mind-game taunt state
    this.tauntTimer = null;

    // Replay state
    this.isReplaying = false;

    // Match state
    this.matchState = 'TITLE'; // 'TITLE' | 'TOURNAMENT' | 'LOCKER' | 'PLAYER_TURN' | 'BALL_FLIGHT' | 'KEEPER_TURN' | 'KEEPER_BALL_FLIGHT' | 'END'
    this.round = 1;
    this.playerScore = 0;
    this.cpuScore = 0;
    this.playerKicks = []; // [{ scored: boolean, zone: string, predictedZone: string }]
    this.cpuKicks = [];    // [{ scored: boolean }]
    this.isSuddenDeath = false;
    this.totalRounds = 5;

    // DOM UI Elements
    this.dom = {};
  }

  init() {
    // 1. Initialize mental prediction model
    const ModelClass = window.PenaltyMindModel;
    if (ModelClass) {
      this.model = new ModelClass();
      this.model.loadFromStorage();
    } else {
      console.warn('PenaltyMindModel not found on window, fallback initialized.');
    }

    // 2. Difficulty configuration
    this.currentDifficulty = loadDifficulty();
    this.difficultyConfig = getDifficultyConfig(this.currentDifficulty);

    // 3. Taker AI Model
    this.takerAI = new TakerAIModel();

    // 4. Load Tournament and Unlocks state
    this.unlocks.load();
    this.tournament.load();

    // 5. Check reduced motion
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // 6. Pause rendering and WebAudio when tab is hidden (Save battery/prevent throttling)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.isTabPaused = true;
          sound.suspend();
        } else {
          this.isTabPaused = false;
          this.lastTime = performance.now();
          sound.resume();
        }
      });
    }

    // 7. Cache DOM Elements
    this._cacheDOMElements();

    // 8. Initialize 3D Scene & Subsystems
    this.stadium = new StadiumScene(this.canvas);
    this.keeper = new Goalkeeper3D(this.stadium.scene);
    this.ball = new Ball3D(this.stadium.scene);
    this.taker = new Taker3D(this.stadium.scene);
    this.fx = new FXManager(this.stadium.scene, this.stadium.camera);

    // Apply equipped cosmetics (Ball skin, Stadium atmosphere, Kit)
    this.applyCosmetics();

    // 9. Initialize Swipe Input
    this.input = new SwipeInput(
      this.canvas,
      (launch) => this.onPlayerShoot(launch),
      (aimPoints) => this.fx.updateAimAssist(aimPoints)
    );
    this.input.setRaycastFn((sx, sy, vp) => {
      return this.stadium ? this.stadium.screenToGoalPlane(sx, sy, vp) : null;
    });

    // 10. Bind UI Handlers
    this._bindEvents();

    // 11. Update Title Screen & Nav Displays
    this._updateTitleMemoryStatus();
    this._updateDifficultyUI();
    this._updateNavStars();

    // 12. Start Render / Physics Loop
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this._loop(t));
  }

  _cacheDOMElements() {
    this.dom = {
      // Screens
      screenTitle: document.getElementById('screen-title'),
      screenMatch: document.getElementById('screen-match'),
      screenEnd: document.getElementById('screen-end'),
      screenTournament: document.getElementById('screen-tournament'),
      screenLocker: document.getElementById('screen-locker'),

      // Top nav
      btnSound: document.getElementById('btn-sound-toggle'),
      soundIcon: document.getElementById('sound-icon'),
      soundLabel: document.getElementById('sound-label'),
      btnNavHome: document.getElementById('btn-nav-home'),
      navStarCount: document.getElementById('nav-star-count'),

      // Title screen
      btnStart: document.getElementById('btn-start-game'),
      btnStartTournament: document.getElementById('btn-start-tournament'),
      btnOpenLocker: document.getElementById('btn-open-locker'),
      titleStarCount: document.getElementById('title-star-count'),
      btnResetTitle: document.getElementById('btn-reset-memory-title'),
      titleMemoryDesc: document.getElementById('title-memory-desc'),
      diffChips: document.getElementById('difficulty-chips'),
      diffDesc: document.getElementById('diff-desc'),

      // Tournament Screen
      tourneyRoundTitle: document.getElementById('tourney-round-title'),
      tourneyPlayerFlag: document.getElementById('tourney-player-flag'),
      tourneyPlayerTeamName: document.getElementById('tourney-player-team-name'),
      tourneyStatusChip: document.getElementById('tourney-status-chip'),
      tourneyOppFlag: document.getElementById('tourney-opp-flag'),
      tourneyOppName: document.getElementById('tourney-opp-name'),
      tourneyOppKeeper: document.getElementById('tourney-opp-keeper'),
      tourneyOppKeeperDesc: document.getElementById('tourney-opp-keeper-desc'),
      tourneyOppTaker: document.getElementById('tourney-opp-taker'),
      tourneyOppTakerDesc: document.getElementById('tourney-opp-taker-desc'),
      tourneyDifficultyBadge: document.getElementById('tourney-difficulty-badge'),
      btnTourneyStartMatch: document.getElementById('btn-tourney-start-match'),
      bracketMatchesList: document.getElementById('bracket-matches-list'),
      bracketRoundName: document.getElementById('bracket-round-name'),
      btnTourneyReset: document.getElementById('btn-tourney-reset'),
      btnTourneyHome: document.getElementById('btn-tourney-home'),

      // Team Select Modal
      modalTeamSelect: document.getElementById('modal-team-select'),
      teamSelectGrid: document.getElementById('team-select-grid'),
      btnConfirmTeam: document.getElementById('btn-confirm-team'),
      btnCancelTeam: document.getElementById('btn-cancel-team'),

      // Locker Room Elements
      lockerStarsNum: document.getElementById('locker-stars-num'),
      lockerTabs: document.querySelectorAll('.locker-tab'),
      lockerPanels: {
        trophies: document.getElementById('locker-panel-trophies'),
        balls: document.getElementById('locker-panel-balls'),
        kits: document.getElementById('locker-panel-kits'),
        stadiums: document.getElementById('locker-panel-stadiums')
      },
      trophiesGrid: document.getElementById('trophies-grid'),
      ballsGrid: document.getElementById('balls-grid'),
      kitsGrid: document.getElementById('kits-grid'),
      stadiumsGrid: document.getElementById('stadiums-grid'),
      btnLockerBackHome: document.getElementById('btn-locker-back-home'),

      // Match HUD
      scoreDigits: document.getElementById('score-digits'),
      roundSubtag: document.getElementById('round-subtag'),
      turnBanner: document.getElementById('turn-banner'),
      playerDots: document.getElementById('player-dots'),
      aiDots: document.getElementById('ai-dots'),
      homeTeamName: document.getElementById('home-team-name'),
      awayTeamName: document.getElementById('away-team-name'),
      reactionBanner: document.getElementById('reaction-banner'),
      tutorialOverlay: document.getElementById('tutorial-overlay'),
      mindRevealPill: document.getElementById('mind-reveal-pill'),
      mindRevealText: document.getElementById('mind-reveal-text'),

      // Taunts & Replay
      tauntBubble: document.getElementById('taunt-bubble'),
      tauntAvatar: document.getElementById('taunt-avatar'),
      tauntText: document.getElementById('taunt-text'),
      replayOverlay: document.getElementById('replay-overlay'),
      btnSkipReplay: document.getElementById('btn-skip-replay'),

      // End screen
      endResultBadge: document.getElementById('end-result-badge'),
      endResultTitle: document.getElementById('end-result-title'),
      endFinalScore: document.getElementById('end-final-score'),
      endPredictNum: document.getElementById('end-predictability-num'),
      endPredictTag: document.getElementById('end-predictability-tag'),
      endPredictDesc: document.getElementById('end-predictability-desc'),
      endTotalShotsTag: document.getElementById('end-total-shots-tag'),
      endHeatmapGrid: document.getElementById('end-heatmap-grid'),
      endKeeperAcc: document.getElementById('end-keeper-acc'),
      endStarsCard: document.getElementById('end-stars-card'),
      endStarsTotal: document.getElementById('end-stars-total'),
      endStarsBreakdown: document.getElementById('end-stars-breakdown'),
      btnTourneyAdvance: document.getElementById('btn-tourney-advance'),
      btnTourneyBracketView: document.getElementById('btn-tourney-bracket-view'),
      btnShareCard: document.getElementById('btn-share-card'),
      btnPlayAgain: document.getElementById('btn-play-again'),
      btnResetEnd: document.getElementById('btn-reset-memory-end'),
      btnBackHome: document.getElementById('btn-back-home'),

      // Modal dialog
      gameModal: document.getElementById('game-modal'),
      gameModalText: document.getElementById('game-modal-text'),
      btnModalConfirm: document.getElementById('btn-modal-confirm'),
      btnModalCancel: document.getElementById('btn-modal-cancel')
    };
  }

  _bindEvents() {
    // Sound unlock on first touch
    const unlockSoundOnce = () => {
      sound.unlock();
      window.removeEventListener('pointerdown', unlockSoundOnce);
      window.removeEventListener('keydown', unlockSoundOnce);
    };
    window.addEventListener('pointerdown', unlockSoundOnce, { passive: true });
    window.addEventListener('keydown', unlockSoundOnce, { passive: true });

    // Sound toggle button
    if (this.dom.btnSound) {
      this.dom.btnSound.addEventListener('click', (e) => {
        e.stopPropagation();
        const enabled = sound.toggleSound();
        if (this.dom.soundIcon) this.dom.soundIcon.textContent = enabled ? '🔊' : '🔇';
        if (this.dom.soundLabel) this.dom.soundLabel.textContent = enabled ? '聲音：開' : '聲音：關';
      });
    }

    // Start match
    if (this.dom.btnStart) {
      this.dom.btnStart.addEventListener('click', () => {
        sound.unlock();
        this.startMatch();
      });
    }

    // Play again
    if (this.dom.btnPlayAgain) {
      this.dom.btnPlayAgain.addEventListener('click', () => {
        this.startMatch();
      });
    }

    // Back to home
    const goHome = () => {
      this.switchScreen('title');
      this._updateTitleMemoryStatus();
      this.ball.reset();
      this.keeper.reset();
      if (this.taker) this.taker.hide();
      if (this.fx && this.fx.hideKeeperTargetZones) this.fx.hideKeeperTargetZones();
      this.matchState = 'TITLE';
    };
    if (this.dom.btnBackHome) this.dom.btnBackHome.addEventListener('click', goHome);
    if (this.dom.btnNavHome) this.dom.btnNavHome.addEventListener('click', goHome);

    // Difficulty chips selection
    if (this.dom.diffChips) {
      this.dom.diffChips.addEventListener('click', (e) => {
        const btn = e.target.closest('.diff-chip');
        if (!btn) return;
        const diff = btn.dataset.diff;
        if (diff && DIFFICULTY[diff]) {
          this.currentDifficulty = diff;
          saveDifficulty(diff);
          this.difficultyConfig = getDifficultyConfig(diff);
          this._updateDifficultyUI();
        }
      });
    }

    // Reset memory buttons
    if (this.dom.btnResetTitle) {
      this.dom.btnResetTitle.addEventListener('click', () => {
        this.showConfirmModal('確定要重置門將記憶？門將將會忘記你所有嘅射門習慣與連招規律。', () => {
          if (this.model) {
            this.model.resetStorage();
            this._updateTitleMemoryStatus();
          }
        });
      });
    }

    if (this.dom.btnResetEnd) {
      this.dom.btnResetEnd.addEventListener('click', () => {
        this.showConfirmModal('確定要重置門將記憶？門將將會忘記你所有嘅射門習慣。', () => {
          if (this.model) {
            this.model.resetStorage();
            this._renderEndScreen();
            this._updateTitleMemoryStatus();
          }
        });
      });
    }

    // Round 3: Tournament mode triggers
    if (this.dom.btnStartTournament) {
      this.dom.btnStartTournament.addEventListener('click', () => {
        sound.unlock();
        this.openTournamentScreen();
      });
    }

    if (this.dom.btnOpenLocker) {
      this.dom.btnOpenLocker.addEventListener('click', () => {
        sound.unlock();
        this.openLockerScreen();
      });
    }

    if (this.dom.btnTourneyStartMatch) {
      this.dom.btnTourneyStartMatch.addEventListener('click', () => {
        sound.unlock();
        if (!this.tournament.isActive()) {
          this.openTeamSelectModal();
          return;
        }
        if (this.tournament.isComplete() || this.tournament.isEliminated) {
          return;
        }
        this.startMatch('TOURNAMENT');
      });
    }

    if (this.dom.btnTourneyReset) {
      this.dom.btnTourneyReset.addEventListener('click', () => {
        this.showConfirmModal('確定要重置世界盃淘汰賽進度？所有對陣將會重新洗牌。', () => {
          this.tournament.reset();
          this.openTournamentScreen();
        });
      });
    }

    if (this.dom.btnTourneyHome) this.dom.btnTourneyHome.addEventListener('click', goHome);
    if (this.dom.btnLockerBackHome) this.dom.btnLockerBackHome.addEventListener('click', goHome);

    // End screen advance & bracket buttons
    if (this.dom.btnTourneyAdvance) {
      this.dom.btnTourneyAdvance.addEventListener('click', () => {
        if (this.tournament.isComplete()) {
          this.openTournamentScreen();
          return;
        }
        const ok = this.tournament.advanceRound();
        if (ok) {
          this.tournament.save();
        }
        this.openTournamentScreen();
      });
    }

    if (this.dom.btnTourneyBracketView) {
      this.dom.btnTourneyBracketView.addEventListener('click', () => {
        this.openTournamentScreen();
      });
    }

    // Share card button
    if (this.dom.btnShareCard) {
      this.dom.btnShareCard.addEventListener('click', () => {
        const stats = this._generateShareStats();
        this.shareCard.shareMatch(stats);
      });
    }

    // Team selection modal buttons
    if (this.dom.btnConfirmTeam) {
      this.dom.btnConfirmTeam.addEventListener('click', () => {
        const teamToStart = this.selectedTeamForModal || 'HKG';
        this.tournament.startTournament(teamToStart);
        this.tournament.save();
        if (this.dom.modalTeamSelect) {
          this.dom.modalTeamSelect.classList.remove('active');
          this.dom.modalTeamSelect.style.display = 'none';
        }
        this.renderTournamentBracket();
        this.switchScreen('tournament');
      });
    }

    if (this.dom.btnCancelTeam) {
      this.dom.btnCancelTeam.addEventListener('click', () => {
        if (this.dom.modalTeamSelect) {
          this.dom.modalTeamSelect.classList.remove('active');
          this.dom.modalTeamSelect.style.display = 'none';
        }
        if (!this.tournament.isActive()) {
          goHome();
        }
      });
    }

    // Locker room category tabs
    if (this.dom.lockerTabs) {
      this.dom.lockerTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const target = tab.dataset.tab;
          if (target) this.switchLockerTab(target);
        });
      });
    }
  }

  showConfirmModal(text, onConfirm) {
    if (!this.dom.gameModal) {
      if (confirm(text)) onConfirm();
      return;
    }
    this.dom.gameModalText.textContent = text;
    this.dom.gameModal.classList.add('active');

    const handleConfirm = () => {
      cleanup();
      onConfirm();
    };
    const handleCancel = () => {
      cleanup();
    };
    const cleanup = () => {
      this.dom.gameModal.classList.remove('active');
      this.dom.btnModalConfirm.removeEventListener('click', handleConfirm);
      this.dom.btnModalCancel.removeEventListener('click', handleCancel);
    };

    this.dom.btnModalConfirm.addEventListener('click', handleConfirm, { once: true });
    this.dom.btnModalCancel.addEventListener('click', handleCancel, { once: true });
  }

  switchScreen(screenName) {
    if (this.dom.screenTitle) this.dom.screenTitle.classList.remove('active');
    if (this.dom.screenMatch) this.dom.screenMatch.classList.remove('active');
    if (this.dom.screenEnd) this.dom.screenEnd.classList.remove('active');
    if (this.dom.screenTournament) this.dom.screenTournament.classList.remove('active');
    if (this.dom.screenLocker) this.dom.screenLocker.classList.remove('active');

    if (this.dom.btnNavHome) {
      this.dom.btnNavHome.style.display = (screenName === 'title') ? 'none' : 'inline-flex';
    }

    if (screenName === 'title' && this.dom.screenTitle) {
      this.dom.screenTitle.classList.add('active');
    } else if (screenName === 'match' && this.dom.screenMatch) {
      this.dom.screenMatch.classList.add('active');
    } else if (screenName === 'end' && this.dom.screenEnd) {
      this.dom.screenEnd.classList.add('active');
    } else if (screenName === 'tournament' && this.dom.screenTournament) {
      this.dom.screenTournament.classList.add('active');
    } else if (screenName === 'locker' && this.dom.screenLocker) {
      this.dom.screenLocker.classList.add('active');
    }
  }

  _updateTitleMemoryStatus() {
    if (!this.model || !this.dom.titleMemoryDesc) return;
    const total = this.model.totalShots || 0;
    const score = this.model.getPredictabilityScore();

    if (score === null) {
      this.dom.titleMemoryDesc.textContent = `已記錄 ${total} 次射門 · 數據不足（需至少 8 次）`;
    } else {
      const rating = this.model.getPredictabilityRating(score);
      this.dom.titleMemoryDesc.textContent = `已記錄 ${total} 次射門 · 可預測度 ${score}% (${rating.tag})`;
    }
  }

  _updateDifficultyUI() {
    if (!this.dom.diffChips) return;
    const chips = this.dom.diffChips.querySelectorAll('.diff-chip');
    chips.forEach(chip => {
      chip.classList.toggle('active', chip.dataset.diff === this.currentDifficulty);
    });

    const descs = {
      EASY: '簡單模式：門將反應較慢、撲救範圍較細，適合輕鬆熱身。',
      MEDIUM: '標準模式：門將具備正常反應速度與大腦讀心判斷。',
      HARD: '困難模式：門將反應迅捷、撲救範圍廣闊，並開啟視線眼神提示！',
      HELL: '地獄模式：門將預判神準、極速撲救，射手連環直抽死角！'
    };
    if (this.dom.diffDesc) {
      this.dom.diffDesc.textContent = descs[this.currentDifficulty] || descs.MEDIUM;
    }
  }

  _updateNavStars() {
    const stars = this.unlocks.getStars();
    if (this.dom.navStarCount) this.dom.navStarCount.textContent = stars;
    if (this.dom.titleStarCount) this.dom.titleStarCount.textContent = stars;
    if (this.dom.lockerStarsNum) this.dom.lockerStarsNum.textContent = stars;
  }

  applyCosmetics() {
    const equipped = this.unlocks.getEquipped();
    if (this.ball) {
      this.ball.applySkin(equipped.ball);
    }
    if (this.stadium) {
      this.stadium.applyAtmosphere(equipped.stadium);
    }

    // Determine kit colors
    let pKit = { primary: '#e53935', shorts: '#ffffff', socks: '#e53935', secondary: '#ff1744' };
    let oppKit = { primary: '#1e88e5', shorts: '#0d47a1', socks: '#1e88e5', secondary: '#00e5ff' };

    if (this.matchMode === 'TOURNAMENT' && this.tournament.isActive()) {
      const pTeam = this.tournament.getPlayerTeam();
      const oppTeam = this.tournament.getOpponentTeam();
      if (pTeam && pTeam.colors) pKit = pTeam.colors;
      if (oppTeam && oppTeam.colors) oppKit = oppTeam.colors;
    } else {
      const kitItem = UNLOCK_CATALOG.kits.find(k => k.id === equipped.kit);
      if (kitItem && kitItem.colors) {
        pKit = { primary: kitItem.colors.jersey, shorts: kitItem.colors.shorts, socks: kitItem.colors.socks, secondary: kitItem.colors.gloves };
      }
    }

    if (this.stadium) {
      this.stadium.updateCrowdTeamColors(pKit.primary, oppKit.primary);
    }

    // In player turn (player shooting): Keeper is opponent, Striker is player
    // In keeper turn (player in goal): Keeper is player, Striker is opponent
    if (!this.isKeeperTurn) {
      if (this.keeper) this.keeper.setKitColors(oppKit);
      if (this.taker) this.taker.setKitColors(pKit);
    } else {
      if (this.keeper) this.keeper.setKitColors(pKit);
      if (this.taker) this.taker.setKitColors(oppKit);
    }
  }

  openTournamentScreen() {
    this.switchScreen('tournament');
    if (!this.tournament.isActive()) {
      this.openTeamSelectModal();
      return;
    }
    this.renderTournamentBracket();
  }

  openTeamSelectModal() {
    if (!this.dom.modalTeamSelect || !this.dom.teamSelectGrid) return;
    this.dom.teamSelectGrid.innerHTML = '';

    const teams = Object.values(TEAMS);
    teams.forEach(team => {
      const card = document.createElement('div');
      card.className = `team-pick-item ${team.id === this.selectedTeamForModal ? 'selected' : ''}`;
      card.dataset.teamId = team.id;
      const keeperName = team.keeper ? team.keeper.name : '鋼門';
      const takerName = team.taker ? team.taker.name : '射手';
      const tag = team.code || team.id;
      card.innerHTML = `
        <div class="team-pick-flag">${team.flag}</div>
        <div class="team-pick-name">${team.name}</div>
        <div class="team-pick-tag">${tag}</div>
        <div class="team-pick-intel">
          <span>🧤 ${keeperName}</span>
          <span>⚽ ${takerName}</span>
        </div>
      `;
      card.addEventListener('click', () => {
        this.selectedTeamForModal = team.id;
        const allItems = this.dom.teamSelectGrid.querySelectorAll('.team-pick-item');
        allItems.forEach(i => i.classList.toggle('selected', i.dataset.teamId === team.id));
        if (this.dom.btnConfirmTeam) this.dom.btnConfirmTeam.disabled = false;
      });
      this.dom.teamSelectGrid.appendChild(card);
    });

    if (this.dom.btnConfirmTeam) {
      this.dom.btnConfirmTeam.disabled = !this.selectedTeamForModal;
    }
    this.dom.modalTeamSelect.style.display = 'flex';
    this.dom.modalTeamSelect.classList.add('active');
  }

  renderTournamentBracket() {
    if (!this.tournament.isActive()) return;

    const round = this.tournament.getRound();
    const roundName = this.tournament.getRoundName();
    const pTeam = this.tournament.getPlayerTeam();
    const oppTeam = this.tournament.getOpponentTeam();
    const currentMatch = this.tournament.getCurrentMatch();
    const isElim = this.tournament.isEliminated;
    const isComp = this.tournament.isComplete();

    if (this.dom.tourneyRoundTitle) {
      this.dom.tourneyRoundTitle.textContent = `2026 世界盃 · ${roundName}`;
    }
    if (this.dom.bracketRoundName) {
      this.dom.bracketRoundName.textContent = roundName;
    }

    // Player HUD
    if (this.dom.tourneyPlayerFlag) this.dom.tourneyPlayerFlag.textContent = pTeam ? pTeam.flag : '🇭🇰';
    if (this.dom.tourneyPlayerTeamName) this.dom.tourneyPlayerTeamName.textContent = pTeam ? pTeam.name : '香港隊';

    // Status chip
    if (this.dom.tourneyStatusChip) {
      if (isComp) {
        this.dom.tourneyStatusChip.textContent = '🏆 榮獲冠軍';
        this.dom.tourneyStatusChip.className = 'status-chip win';
      } else if (isElim) {
        this.dom.tourneyStatusChip.textContent = '❌ 已出局';
        this.dom.tourneyStatusChip.className = 'status-chip elim';
      } else {
        this.dom.tourneyStatusChip.textContent = '進行中';
        this.dom.tourneyStatusChip.className = 'status-chip active';
      }
    }

    // Opponent Intel Card
    if (oppTeam) {
      if (this.dom.tourneyOppFlag) this.dom.tourneyOppFlag.textContent = oppTeam.flag;
      if (this.dom.tourneyOppName) this.dom.tourneyOppName.textContent = oppTeam.name;
      if (this.dom.tourneyOppKeeper) this.dom.tourneyOppKeeper.textContent = oppTeam.keeper ? oppTeam.keeper.name : '門將';
      if (this.dom.tourneyOppKeeperDesc) this.dom.tourneyOppKeeperDesc.textContent = oppTeam.keeper ? oppTeam.keeper.desc : '';
      if (this.dom.tourneyOppTaker) this.dom.tourneyOppTaker.textContent = oppTeam.taker ? oppTeam.taker.name : '射手';
      if (this.dom.tourneyOppTakerDesc) this.dom.tourneyOppTakerDesc.textContent = oppTeam.taker ? oppTeam.taker.desc : '';
      if (this.dom.tourneyDifficultyBadge && currentMatch) {
        const diff = this.tournament.getCurrentDifficulty();
        const diffLabels = { EASY: '簡單 (EASY)', MEDIUM: '標準 (MEDIUM)', HARD: '困難 (HARD)', HELL: '地獄 (HELL)' };
        this.dom.tourneyDifficultyBadge.textContent = diffLabels[diff] || diff;
      }
    }

    // Bracket Matches List
    if (this.dom.bracketMatchesList) {
      this.dom.bracketMatchesList.innerHTML = '';
      const roundMatches = this.tournament.getMatchesForRound(round);
      roundMatches.forEach((m) => {
        const item = document.createElement('div');
        const isPlayerMatch = (m.id === currentMatch?.id) || (m.teamA?.id === pTeam?.id || m.teamB?.id === pTeam?.id);
        const isDone = m.winner !== null;
        item.className = `bracket-match-row ${isPlayerMatch ? 'player-match' : ''} ${isDone ? 'done' : ''}`;

        const scoreA = isDone ? m.scoreA : '-';
        const scoreB = isDone ? m.scoreB : '-';
        const winA = isDone && m.winner?.id === m.teamA?.id;
        const winB = isDone && m.winner?.id === m.teamB?.id;

        item.innerHTML = `
          <div class="bm-team ${winA ? 'winner' : ''}">
            <span class="bm-flag">${m.teamA?.flag || '🏳️'}</span>
            <span class="bm-name">${m.teamA?.name || '待定'}</span>
            <span class="bm-score">${scoreA}</span>
          </div>
          <div class="bm-vs">VS</div>
          <div class="bm-team ${winB ? 'winner' : ''}">
            <span class="bm-score">${scoreB}</span>
            <span class="bm-name">${m.teamB?.name || '待定'}</span>
            <span class="bm-flag">${m.teamB?.flag || '🏳️'}</span>
          </div>
        `;
        this.dom.bracketMatchesList.appendChild(item);
      });
    }

    // Start Button Text & Disabled State
    if (this.dom.btnTourneyStartMatch) {
      if (isComp) {
        this.dom.btnTourneyStartMatch.textContent = '🏆 榮獲世界盃冠軍！';
        this.dom.btnTourneyStartMatch.disabled = true;
      } else if (isElim) {
        this.dom.btnTourneyStartMatch.textContent = '❌ 已出局（點擊下方重置）';
        this.dom.btnTourneyStartMatch.disabled = true;
      } else if (currentMatch && currentMatch.winner !== null) {
        this.dom.btnTourneyStartMatch.textContent = `晉級下一輪 (${this.tournament.getNextRoundName()})`;
        this.dom.btnTourneyStartMatch.disabled = false;
        this.dom.btnTourneyStartMatch.onclick = () => {
          this.tournament.advanceRound();
          this.tournament.save();
          this.renderTournamentBracket();
        };
      } else {
        this.dom.btnTourneyStartMatch.textContent = `開戰！出戰 ${oppTeam ? oppTeam.name : '對手'}`;
        this.dom.btnTourneyStartMatch.disabled = false;
        this.dom.btnTourneyStartMatch.onclick = () => {
          this.startMatch('TOURNAMENT');
        };
      }
    }
  }

  openLockerScreen() {
    this._updateNavStars();
    this.switchLockerTab('trophies');
    this.switchScreen('locker');
  }

  switchLockerTab(tabName) {
    if (this.dom.lockerTabs) {
      this.dom.lockerTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
    }
    if (this.dom.lockerPanels) {
      Object.keys(this.dom.lockerPanels).forEach(key => {
        if (this.dom.lockerPanels[key]) {
          this.dom.lockerPanels[key].classList.toggle('active', key === tabName);
        }
      });
    }

    if (tabName === 'trophies') {
      this.renderLockerTrophies();
    } else {
      this.renderLockerCatalog(tabName);
    }
  }

  renderLockerTrophies() {
    if (!this.dom.trophiesGrid) return;
    this.dom.trophiesGrid.innerHTML = '';

    TROPHIES.forEach(trophy => {
      const isUnlocked = this.unlocks.hasTrophy(trophy.id);
      const card = document.createElement('div');
      card.className = `trophy-card ${isUnlocked ? 'unlocked' : 'locked'}`;
      card.innerHTML = `
        <div class="trophy-icon">${trophy.icon}</div>
        <div class="trophy-name">${trophy.name}</div>
        <div class="trophy-desc">${trophy.desc}</div>
        <div class="trophy-status">${isUnlocked ? '✓ 已解鎖' : '🔒 未獲得'}</div>
      `;
      this.dom.trophiesGrid.appendChild(card);
    });
  }

  renderLockerCatalog(category) {
    const gridMap = {
      balls: this.dom.ballsGrid,
      kits: this.dom.kitsGrid,
      stadiums: this.dom.stadiumsGrid
    };
    const grid = gridMap[category];
    if (!grid) return;
    grid.innerHTML = '';

    const items = UNLOCK_CATALOG[category] || [];
    const equipped = this.unlocks.getEquipped();
    const equippedId = (category === 'balls') ? equipped.ball : (category === 'kits') ? equipped.kit : equipped.stadium;

    items.forEach(item => {
      const isUnlocked = this.unlocks.isUnlocked(category, item.id);
      const isEquipped = (equippedId === item.id);

      const card = document.createElement('div');
      card.className = `catalog-card ${isUnlocked ? 'unlocked' : 'locked'} ${isEquipped ? 'equipped' : ''}`;

      let previewHtml = '';
      if (category === 'balls') {
        previewHtml = `<div class="catalog-preview ball-preview" style="background: radial-gradient(circle, #fff, #888);">${item.icon || '⚽'}</div>`;
      } else if (category === 'kits') {
        const jColor = item.colors?.jersey || '#ff0000';
        previewHtml = `<div class="catalog-preview kit-preview" style="background: ${jColor};">👕</div>`;
      } else if (category === 'stadiums') {
        const bg = (item.id === 'stadium_sunset') ? 'linear-gradient(135deg, #ff7e5f, #feb47b)' : (item.id === 'stadium_day') ? 'linear-gradient(135deg, #70e1f5, #ffd194)' : 'linear-gradient(135deg, #0a0e17, #1b2838)';
        previewHtml = `<div class="catalog-preview stadium-preview" style="background: ${bg};">🏟️</div>`;
      }

      card.innerHTML = `
        ${previewHtml}
        <div class="catalog-info">
          <div class="catalog-title">${item.name}</div>
          <div class="catalog-desc">${item.desc}</div>
        </div>
        <div class="catalog-action">
          ${isEquipped ? '<button class="btn-catalog equipped" disabled>裝備中</button>' : isUnlocked ? '<button class="btn-catalog equip">裝備</button>' : `<button class="btn-catalog unlock">⭐ ${item.cost}</button>`}
        </div>
      `;

      const btn = card.querySelector('.btn-catalog');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (isEquipped) return;
          if (isUnlocked) {
            // Equip
            if (category === 'balls') this.unlocks.equip('ball', item.id);
            else if (category === 'kits') this.unlocks.equip('kit', item.id);
            else if (category === 'stadiums') this.unlocks.equip('stadium', item.id);
            this.unlocks.save();
            this.applyCosmetics();
            this.renderLockerCatalog(category);
          } else {
            // Unlock
            const cost = item.cost;
            if (this.unlocks.getStars() < cost) {
              alert(`⭐ 星星不足！需要 ${cost} 粒星星，目前只有 ${this.unlocks.getStars()} 粒。`);
              return;
            }
            const res = this.unlocks.unlockItem(category, item.id);
            if (res.success) {
              if (category === 'balls') this.unlocks.equip('ball', item.id);
              else if (category === 'kits') this.unlocks.equip('kit', item.id);
              else if (category === 'stadiums') this.unlocks.equip('stadium', item.id);
              this.unlocks.save();
              this.applyCosmetics();
              this._updateNavStars();
              sound.playWhistle();
              this.renderLockerCatalog(category);
            }
          }
        });
      }

      grid.appendChild(card);
    });
  }

  _generateShareStats() {
    const isWin = this.playerScore > this.cpuScore;
    const isDraw = this.playerScore === this.cpuScore;
    const pTeam = (this.matchMode === 'TOURNAMENT' && this.tournament.isActive())
      ? this.tournament.getPlayerTeam()
      : { id: 'HKG', name: '香港隊', flag: '🇭🇰' };
    const oppTeam = (this.matchMode === 'TOURNAMENT' && this.tournament.isActive())
      ? this.tournament.getOpponentTeam()
      : { id: 'CPU', name: '電腦門將', flag: '🤖' };

    const predScore = this.model ? this.model.getPredictabilityScore() : null;
    const predRating = this.model ? this.model.getPredictabilityRating(predScore) : { tag: '未知' };

    return {
      isWin,
      isDraw,
      playerScore: this.playerScore,
      cpuScore: this.cpuScore,
      isSuddenDeath: this.isSuddenDeath,
      roundsPlayed: Math.max(this.playerKicks.length, this.cpuKicks.length),
      predictabilityScore: predScore,
      predictabilityRating: predRating,
      playerTeam: pTeam,
      opponentTeam: oppTeam,
      starsEarned: this.lastMatchStarResult ? this.lastMatchStarResult.total : 0,
      totalStars: this.unlocks.getStars(),
      matchMode: this.matchMode,
      roundName: (this.matchMode === 'TOURNAMENT' && this.tournament.isActive()) ? this.tournament.getRoundName() : null,
      heatmapData: this.model ? this.model.getHeatmapData() : null,
      playerKicks: this.playerKicks
    };
  }

  showTaunt(category, context = null, avatar = '🧤') {
    if (!this.dom.tauntBubble || !this.dom.tauntText) return;
    const text = getTaunt(category);
    this.dom.tauntText.textContent = text;
    if (this.dom.tauntAvatar) this.dom.tauntAvatar.textContent = avatar;
    this.dom.tauntBubble.style.display = 'flex';

    if (this.tauntTimer) clearTimeout(this.tauntTimer);
    this.tauntTimer = setTimeout(() => {
      if (this.dom.tauntBubble) {
        this.dom.tauntBubble.style.display = 'none';
      }
    }, 2400);
  }

  triggerDecidingReplay(onComplete) {
    this.isReplaying = true;
    this.timeScale = (TUNING.replay && TUNING.replay.slowMoScale) || 0.25;
    this.stadium.setCameraMode('REPLAY');
    if (this.dom.replayOverlay) {
      this.dom.replayOverlay.style.display = 'flex';
    }

    // Retrieve replay snapshot of deciding kick
    const replayShot = this.lastDecidingKick || this.activeShot;

    // Rewind ball & keeper poses for replay
    this.ball.reset();
    this.keeper.reset();
    this.keeper.setReady();

    if (replayShot && replayShot.divePlan) {
      this.keeper.startDive(replayShot.divePlan);
    }

    if (replayShot && replayShot.isKeeperTurn) {
      if (this.taker) {
        this.taker.showReady();
        this.taker.root.position.copy(this.taker.strikePos);
        this.taker.state = 'strike';
      }
    } else {
      if (this.taker) this.taker.hide();
    }

    if (replayShot) {
      this.activeShot = {
        sim: replayShot.sim,
        divePlan: replayShot.divePlan,
        saveCheck: replayShot.saveCheck,
        modelProbs: replayShot.modelProbs,
        trajectory: replayShot.trajectory,
        crossing: replayShot.crossing,
        totalPoints: replayShot.totalPoints,
        isGoal: replayShot.isGoal,
        isKeeperTurn: replayShot.isKeeperTurn,
        deflectPos: replayShot.deflectPos ? { ...replayShot.deflectPos } : null,
        deflectVel: replayShot.deflectVel ? { ...replayShot.deflectVel } : null
      };
      if (replayShot.sim && replayShot.sim.launch) {
        this.ball.setSpin(replayShot.sim.launch.spin || { x: 0, y: 0, z: 0 });
      }
    }

    this.flightTime = 0;
    this.ballCrossed = false;
    this.ballDeflecting = false;

    let done = false;
    const endReplay = () => {
      if (done) return;
      done = true;
      this.isReplaying = false;
      this.timeScale = 1.0;
      this.stadium.setCameraMode(this.isKeeperTurn ? 'KEEPER' : 'MAIN');
      if (this.dom.replayOverlay) {
        this.dom.replayOverlay.style.display = 'none';
      }
      if (onComplete) onComplete();
    };

    if (this.dom.btnSkipReplay) {
      this.dom.btnSkipReplay.onclick = () => endReplay();
    }

    const dur = (TUNING.replay && TUNING.replay.durationMs) || 3200;
    setTimeout(endReplay, dur);
  }

  // ==========================================
  // MATCH MANAGEMENT
  // ==========================================

  startMatch(mode = 'QUICK') {
    this.matchMode = mode;
    this.round = 1;
    this.playerScore = 0;
    this.cpuScore = 0;
    this.playerKicks = [];
    this.cpuKicks = [];
    this.isSuddenDeath = false;
    this.timeScale = 1.0;
    this.hitStopTimer = 0;
    this.activeShot = null;
    this.activeCpuShot = null;

    if (this.matchMode === 'TOURNAMENT') {
      const currentMatch = this.tournament.getCurrentMatch();
      if (!currentMatch) {
        this.openTournamentScreen();
        return;
      }
      this.activePlayerTeam = this.tournament.getPlayerTeam();
      this.activeOpponentTeam = this.tournament.getOpponentTeam();
      this.difficultyConfig = getDifficultyConfig(currentMatch.difficulty);
    } else {
      this.activePlayerTeam = { id: 'HKG', name: '香港隊', flag: '🇭🇰', kitColors: { jersey: '#e53935', shorts: '#ffffff', socks: '#e53935', gloves: '#ff1744' } };
      this.activeOpponentTeam = { id: 'CPU', name: '電腦對手', flag: '🤖', kitColors: { jersey: '#1e88e5', shorts: '#0d47a1', socks: '#1e88e5', gloves: '#00e5ff' } };
      this.difficultyConfig = getDifficultyConfig(this.currentDifficulty);
    }

    this.applyCosmetics();
    this.switchScreen('match');
    this.updateHUD();
    this.startPlayerTurn();
  }

  startPlayerTurn() {
    this.matchState = 'PLAYER_TURN';
    this.isKeeperTurn = false;
    this.stadium.setCameraMode('MAIN');
    this.timeScale = 1.0;
    this.ballCrossed = false;
    this.ballDeflecting = false;
    this.activeShot = null;
    this.activeCpuShot = null;

    if (this.input) {
      this.input.setMode('STRIKER');
    }
    if (this.fx && this.fx.hideKeeperTargetZones) {
      this.fx.hideKeeperTargetZones();
    }

    // Reset cosmetics for player turn
    this.applyCosmetics();

    // Reset ball, keeper, and hide taker
    this.ball.reset();
    this.keeper.reset();
    this.keeper.setReady();
    if (this.taker) this.taker.hide();

    // Keeper visual tell before shot
    const modelProbs = this.model ? this.model.getProbabilities() : null;
    const plannedDive = decide(modelProbs, this.difficultyConfig, TUNING);
    const tell = computeTell(plannedDive.zone, this.difficultyConfig);
    let tellType = 'neutral';
    if (tell.tellZone.endsWith('L')) tellType = Math.random() < 0.5 ? 'lean_left' : 'shuffle_left';
    else if (tell.tellZone.endsWith('R')) tellType = Math.random() < 0.5 ? 'lean_right' : 'shuffle_right';
    this.keeper.setTell({
      type: tellType,
      gazeZone: tell.gazeHint ? tell.tellZone : null
    });

    // Turn banner
    const roundText = this.isSuddenDeath
      ? `突然死亡（第 ${this.round} 輪）`
      : `第 ${this.round} 輪`;
    if (this.dom.roundSubtag) this.dom.roundSubtag.textContent = roundText;
    if (this.dom.turnBanner) {
      this.dom.turnBanner.innerHTML = `<span>⚽ 你主射：向球門撥球射門！</span>`;
    }
    const pName = this.activePlayerTeam ? this.activePlayerTeam.name : '你';
    const oppName = this.activeOpponentTeam ? this.activeOpponentTeam.name : '電腦';
    if (this.dom.homeTeamName) this.dom.homeTeamName.textContent = `${pName} (主射)`;
    if (this.dom.awayTeamName) this.dom.awayTeamName.textContent = `${oppName} (門將)`;

    // Check tutorial condition (first 2 kicks of a new player)
    const totalShots = this.model ? (this.model.totalShots || 0) : 0;
    const isTutorial = totalShots < 2;

    if (this.dom.tutorialOverlay) {
      this.dom.tutorialOverlay.style.display = isTutorial ? 'flex' : 'none';
    }

    this.input.setAimAssist(isTutorial);
    this.input.onShoot = (launch) => this.onPlayerShoot(launch);
    this.input.enable();

    // Whistle sound on round ready
    sound.playWhistle();
  }

  onPlayerShoot(launch) {
    if (this.matchState !== 'PLAYER_TURN') return;
    this.matchState = 'BALL_FLIGHT';

    // Hide tutorial prompt
    if (this.dom.tutorialOverlay) {
      this.dom.tutorialOverlay.style.display = 'none';
    }
    this.fx.hideAimAssist();

    // 1. Audio: Kick sound
    sound.playKick();

    // 2. Pure physics trajectory simulation (120 Hz)
    const sim = simulate(launch, 1 / 120, 1.8, TUNING);

    // 3. Mental Model Probabilities & Keeper Dive Decision with Difficulty settings
    const modelProbs = this.model ? this.model.getProbabilities() : null;
    let divePlan = decide(modelProbs, this.difficultyConfig, TUNING);

    // Opponent keeper personality in tournament
    if (this.matchMode === 'TOURNAMENT' && this.activeOpponentTeam?.keeper) {
      const kp = this.activeOpponentTeam.keeper;
      if (typeof kp.reactBonus === 'number') {
        divePlan.reactTime = Math.max(0.04, divePlan.reactTime + kp.reactBonus);
      }
      if (typeof kp.reachBonus === 'number') {
        divePlan.reachMultiplier = (divePlan.reachMultiplier || 1.0) * (1.0 + kp.reachBonus);
      }
    }

    // 4. Save Intersection Check (Deterministic reach volume)
    const saveCheck = checkSave(sim, divePlan, TUNING);

    // 5. Trigger Keeper Animation
    this.keeper.startDive(divePlan);

    // 6. Set Ball Motion Trajectory
    this.ball.setSpin(launch.spin);
    this.activeShot = {
      sim,
      divePlan,
      saveCheck,
      modelProbs,
      trajectory: sim.trajectory,
      crossing: sim.crossing,
      totalPoints: sim.trajectory.length,
      isGoal: sim.result === 'goal' && !saveCheck.saved,
      isKeeperTurn: false
    };
    this.flightTime = 0;
    this.ballCrossed = false;
    this.ballDeflecting = false;
  }

  _onPlayerShotCrossing() {
    this.ballCrossed = true;
    const shot = this.activeShot;
    if (!shot) return;
    this.lastDecidingKick = { ...shot };

    const { sim, divePlan, saveCheck, modelProbs } = shot;
    let scored = false;

    // Check Save vs Goal
    if (saveCheck.saved) {
      scored = false;
      this.keeper.celebrate();

      // Hit stop on glove save
      if (!this.prefersReducedMotion) {
        this.hitStopTimer = TUNING.juice.hitStopMs / 1000;
      }

      if (saveCheck.saveType === 'catch') {
        // Glove catches the ball
        sound.playSave(true);
        sound.swellMiss();
        this.ballDeflecting = false;
        this.activeShot.deflectPos = { ...saveCheck.contactPoint };
        this.activeShot.deflectVel = { vx: 0, vy: 0, vz: 0 };
      } else {
        // Glove parries the ball
        sound.playSave(false);
        sound.swellMiss();
        this.ballDeflecting = true;
        this.deflectPos = {
          x: saveCheck.contactPoint.x,
          y: saveCheck.contactPoint.y,
          z: saveCheck.contactPoint.z
        };
        // Rebound forwards and outwards
        this.deflectVel = {
          vx: (Math.random() - 0.5) * 6.0,
          vy: Math.random() * 4.0 + 1.5,
          vz: 6.5
        };
      }
      this._showReactionBanner('撲出！', 'miss');
    } else {
      // Not saved by keeper
      if (sim.result === 'goal') {
        scored = true;
        this.activeShot.isGoal = true;
        this.keeper.concede();
        this.stadium.deformNet(sim.crossing.x, sim.crossing.y);
        this.fx.triggerGoalExplosion(sim.crossing);
        sound.playNet();
        sound.swellGoal();
        this._showReactionBanner('入波！', 'score');
      } else if (sim.result === 'crossbar' || sim.result === 'post') {
        scored = false;
        this.keeper.celebrate();
        sound.playPost();
        sound.swellMiss();
        this.fx.triggerShake(0.06, 200);
        this._showReactionBanner(sim.result === 'crossbar' ? '中楣！' : '中柱！', 'miss');
        // Deflect off post
        this.ballDeflecting = true;
        this.deflectPos = { x: sim.crossing.x, y: sim.crossing.y, z: sim.crossing.z };
        this.deflectVel = {
          vx: sim.crossing.vx * -0.5,
          vy: Math.abs(sim.crossing.vy) * 0.4 + 1.0,
          vz: 8.0
        };
      } else if (sim.result === 'over') {
        scored = false;
        sound.swellMiss();
        this._showReactionBanner('飛過界！', 'miss');
      } else {
        scored = false;
        sound.swellMiss();
        this._showReactionBanner('出界！', 'miss');
      }
    }

    // 1. Record shot into Mental Model
    const actualZone = sim.zone || getZoneFromPoint(sim.crossing.x, sim.crossing.y, TUNING);
    if (this.model) {
      this.model.recordShot(actualZone, divePlan.zone);
      this.model.saveToStorage();
    }

    // 2. In-scene 3D reveal: 6 zones probabilities + crossing & reach markers
    this.fx.showMindReadingReveal(modelProbs, sim.crossing, this.keeper.getKeeperReachPosition());
    const probPct = modelProbs && modelProbs.probabilities
      ? Math.round((modelProbs.probabilities[divePlan.zone] || 0.16) * 100)
      : 35;
    const zoneName = (this.model && this.model.zoneLabels[divePlan.zone]) || divePlan.zone;
    this._showMindRevealPill(`門將估你射：${zoneName}（信心 ${probPct}%）`);

    // 3. Cantonese Taunts
    if (saveCheck.saved) {
      if (modelProbs && modelProbs.predictedZone === divePlan.zone) {
        this.showTaunt('KEEPER_READS_HABIT', null, '🧤');
      } else {
        this.showTaunt('KEEPER_SAVES_SHOT', null, '🧤');
      }
    } else if (scored) {
      this.showTaunt('PLAYER_SCORES', null, '🧤');
    }

    // 4. Update score & player kick record
    if (scored) this.playerScore++;
    this.playerKicks.push({
      scored,
      zone: actualZone,
      predictedZone: divePlan.zone
    });

    this.updateHUD();

    // 5. Check for regulation early clinch
    const clinch = this._checkEarlyClinch();
    if (clinch) {
      setTimeout(() => {
        this.triggerDecidingReplay(() => this.finishMatch());
      }, 1200);
      return;
    }

    // 6. Proceed to player's keeper turn (swiping to dive against AI taker)
    setTimeout(() => {
      this.startKeeperTurn();
    }, 1400);
  }

  startKeeperTurn() {
    this.matchState = 'KEEPER_TURN';
    this.isKeeperTurn = true;
    this.stadium.setCameraMode('KEEPER');
    this.timeScale = 1.0;
    this.ballCrossed = false;
    this.ballDeflecting = false;
    this.activeShot = null;

    // Apply cosmetics for keeper turn (player in goal, opponent striking)
    this.applyCosmetics();

    // Reset ball and goalkeeper
    this.ball.reset();
    this.keeper.reset();
    this.keeper.setReady();

    // Striker visible in ready stance
    if (this.taker) {
      this.taker.showReady();
    }

    // Turn banner & labels
    const roundText = this.isSuddenDeath
      ? `突然死亡（第 ${this.round} 輪）`
      : `第 ${this.round} 輪`;
    if (this.dom.roundSubtag) this.dom.roundSubtag.textContent = roundText;
    if (this.dom.turnBanner) {
      this.dom.turnBanner.innerHTML = `<span>🧤 撲救：㩒龍門你想守嘅位置（或向方向輕掃）</span>`;
    }
    const pName = this.activePlayerTeam ? this.activePlayerTeam.name : '你';
    const oppName = this.activeOpponentTeam ? this.activeOpponentTeam.name : '電腦';
    if (this.dom.homeTeamName) this.dom.homeTeamName.textContent = `${pName} (門將)`;
    if (this.dom.awayTeamName) this.dom.awayTeamName.textContent = `${oppName} (主射)`;

    if (this.dom.tutorialOverlay) {
      this.dom.tutorialOverlay.style.display = 'none';
    }
    this.fx.hideAimAssist();

    // Show semi-transparent target zones over the goal during run-up
    if (this.fx && this.fx.showKeeperTargetZones) {
      this.fx.showKeeperTargetZones(null);
    }

    this.keeperTurnState = {
      runUpStarted: false,
      runUpStartTime: 0,
      strikeTime: 0,
      playerDived: false,
      diveZone: null,
      divePlan: null,
      earlyDive: false,
      lateDive: false,
      hasStruck: false
    };

    // Configure input for keeper tap/swipe dive
    this.input.setAimAssist(false);
    this.input.setMode('KEEPER');
    this.input.onKeeperPreview = (zone, details) => {
      if (this.matchState !== 'KEEPER_TURN' || this.keeperTurnState.playerDived) return;
      if (this.fx && this.fx.showKeeperTargetZones) {
        this.fx.showKeeperTargetZones(zone);
      }
      const zoneLabel = (DIVE_TARGETS[zone] && DIVE_TARGETS[zone].label) || zone;
      if (this.dom.turnBanner) {
        this.dom.turnBanner.innerHTML = `<span>🧤 已選定撲向：${zoneLabel}！準備接波！</span>`;
      }
    };
    this.input.onKeeperDive = (zone, details) => {
      this._onPlayerKeeperDive(zone, details);
    };
    this.input.onShoot = (launch) => this._onPlayerKeeperSwipe(launch);
    this.input.enable();

    this.updateHUD();

    // Delay then whistle and start striker run-up
    setTimeout(() => {
      if (this.matchState !== 'KEEPER_TURN') return;
      sound.playWhistle();

      const runUpDuration = (TUNING.taker && TUNING.taker.runUpDurationMs) || 850;
      const now = performance.now();
      this.keeperTurnState.runUpStarted = true;
      this.keeperTurnState.runUpStartTime = now;
      this.keeperTurnState.strikeTime = now + runUpDuration;

      if (this.taker) {
        this.taker.startRunUp(() => {
          this._onCpuTakerStrike();
        });
      }
    }, 700);
  }

  _onPlayerKeeperDive(zone, details = {}) {
    if (this.matchState !== 'KEEPER_TURN' || this.keeperTurnState.playerDived) return;

    const validZone = (zone && DIVE_TARGETS[zone]) ? zone : 'BM';
    const diveInfo = DIVE_TARGETS[validZone] || DIVE_TARGETS.BM;

    // Immediately highlight target zone in 3D and update banner
    if (this.fx && this.fx.showKeeperTargetZones) {
      this.fx.showKeeperTargetZones(validZone);
    }
    if (this.dom.turnBanner) {
      this.dom.turnBanner.innerHTML = `<span>🧤 已選定撲向：${diveInfo.label}！準備接波！</span>`;
    }

    const diffKey = (this.difficultyConfig && this.difficultyConfig.key) || 'MEDIUM';
    const windows = TUNING.keeperWindows || {};
    const earlyThreshold = (windows.earlyDiveThresholdMs && windows.earlyDiveThresholdMs[diffKey]) ?? 140;
    const lateThreshold = (windows.lateDiveThresholdMs && windows.lateDiveThresholdMs[diffKey]) ?? 340;
    const diffReachMul = (windows.playerReachMultiplier && windows.playerReachMultiplier[diffKey]) ?? (TUNING.keeper.playerReachMultiplier || 1.30);
    const diffTolerance = (windows.saveHitTolerance && windows.saveHitTolerance[diffKey]) ?? (TUNING.keeper.saveHitTolerance || 0.20);

    const now = performance.now();
    const strikeTime = this.keeperTurnState.strikeTime || (now + 500);
    const msBeforeStrike = strikeTime - now;

    let earlyDive = false;
    let lateDive = false;
    let reactTime = 0.06;
    let reachMultiplier = diffReachMul;

    // Timing window: difficulty scaled (easy is most forgiving)
    if (this.keeperTurnState.runUpStarted && msBeforeStrike > earlyThreshold) {
      earlyDive = true;
      reactTime = 0.02;
      reachMultiplier = 1.0;
      this.showTaunt('TAKER_PUNISHES_EARLY_DIVE', null, '⚽');
      this._showReactionBanner('太早撲！射手睇到你！', 'miss');
    } else if (now > strikeTime + lateThreshold) {
      // Late dive
      lateDive = true;
      reactTime = 0.24;
      reachMultiplier = Math.max(0.75, diffReachMul * 0.70);
    }

    const divePlan = {
      zone: validZone,
      target: { x: diveInfo.x, y: diveInfo.y },
      reactTime,
      diveDuration: TUNING.keeper.diveDuration,
      reachMultiplier,
      tolerance: diffTolerance,
      saveHitTolerance: diffTolerance,
      isPlayer: true,
      animName: diveInfo.anim,
      label: diveInfo.label
    };

    this.keeperTurnState.playerDived = true;
    this.keeperTurnState.diveZone = validZone;
    this.keeperTurnState.divePlan = divePlan;
    this.keeperTurnState.earlyDive = earlyDive;
    this.keeperTurnState.lateDive = lateDive;

    // Start keeper dive animation
    this.keeper.startDive(divePlan);
  }

  _onPlayerKeeperSwipe(launch) {
    if (this.matchState !== 'KEEPER_TURN' || this.keeperTurnState.playerDived) return;

    let zone = launch.zone;
    if (!zone) {
      const targetX = (launch.target && typeof launch.target.x === 'number')
        ? launch.target.x
        : (launch.velocity ? launch.velocity.x * 0.45 : 0);
      const targetY = (launch.target && typeof launch.target.y === 'number')
        ? launch.target.y
        : (launch.velocity ? Math.max(0.2, launch.velocity.y * 0.4) : 0.8);
      zone = getZoneFromPoint(targetX, targetY, TUNING);
    }

    this._onPlayerKeeperDive(zone, launch);
  }

  _onCpuTakerStrike() {
    this.keeperTurnState.hasStruck = true;
    this.matchState = 'KEEPER_BALL_FLIGHT';
    sound.playKick();

    // If player has not swiped yet, default to center BM
    if (!this.keeperTurnState.playerDived) {
      const diffKey = (this.difficultyConfig && this.difficultyConfig.key) || 'MEDIUM';
      const windows = TUNING.keeperWindows || {};
      const diffReachMul = (windows.playerReachMultiplier && windows.playerReachMultiplier[diffKey]) ?? (TUNING.keeper.playerReachMultiplier || 1.30);
      const diffTolerance = (windows.saveHitTolerance && windows.saveHitTolerance[diffKey]) ?? (TUNING.keeper.saveHitTolerance || 0.20);

      const diveInfo = DIVE_TARGETS.BM;
      this.keeperTurnState.diveZone = 'BM';
      this.keeperTurnState.divePlan = {
        zone: 'BM',
        target: { x: diveInfo.x, y: diveInfo.y },
        reactTime: 0.16,
        diveDuration: TUNING.keeper.diveDuration,
        reachMultiplier: diffReachMul * 0.85,
        tolerance: diffTolerance,
        saveHitTolerance: diffTolerance,
        isPlayer: true,
        animName: diveInfo.anim,
        label: diveInfo.label
      };
      this.keeper.startDive(this.keeperTurnState.divePlan);
    }

    // Taker AI decides target (aims away from player habit / punishes early dive)
    const earlyZone = this.keeperTurnState.earlyDive ? this.keeperTurnState.diveZone : null;
    const takerDecision = this.takerAI.decideShot(this.difficultyConfig, earlyZone);

    // Striker personality modifiers in tournament
    if (this.matchMode === 'TOURNAMENT' && this.activeOpponentTeam?.taker) {
      const tp = this.activeOpponentTeam.taker;
      if (typeof tp.speedBonus === 'number') {
        takerDecision.speed += tp.speedBonus;
      }
    }

    const targetPoint = takerDecision.targetPoint || takerDecision.target;
    const launch = pointToLaunch(targetPoint, takerDecision.speed, takerDecision.curve, TUNING);

    const sim = simulate(launch, 1 / 120, 1.8, TUNING);
    const saveCheck = checkSave(sim, this.keeperTurnState.divePlan, TUNING);

    this.ball.setSpin(launch.spin);
    this.activeShot = {
      sim,
      divePlan: this.keeperTurnState.divePlan,
      saveCheck,
      modelProbs: null,
      trajectory: sim.trajectory,
      crossing: sim.crossing,
      totalPoints: sim.trajectory.length,
      isGoal: sim.result === 'goal' && !saveCheck.saved,
      isKeeperTurn: true
    };
    this.lastDecidingKick = { ...this.activeShot };
    this.flightTime = 0;
    this.ballCrossed = false;
    this.ballDeflecting = false;
  }

  _onKeeperTurnCrossing() {
    this.ballCrossed = true;
    const shot = this.activeShot;
    if (!shot) return;
    this.lastDecidingKick = { ...shot };

    const { sim, saveCheck } = shot;
    let scored = false;

    if (saveCheck.saved) {
      scored = false;
      this.keeper.celebrate();
      if (this.taker) this.taker.concede();

      if (!this.prefersReducedMotion) {
        this.hitStopTimer = TUNING.juice.hitStopMs / 1000;
      }

      if (saveCheck.saveType === 'catch') {
        sound.playSave(true);
        sound.swellMiss();
        this.ballDeflecting = false;
        this.activeShot.deflectPos = { ...saveCheck.contactPoint };
        this.activeShot.deflectVel = { vx: 0, vy: 0, vz: 0 };
      } else {
        sound.playSave(false);
        sound.swellMiss();
        this.ballDeflecting = true;
        this.deflectPos = {
          x: saveCheck.contactPoint.x,
          y: saveCheck.contactPoint.y,
          z: saveCheck.contactPoint.z
        };
        this.deflectVel = {
          vx: (Math.random() - 0.5) * 6.0,
          vy: Math.random() * 4.0 + 1.5,
          vz: 6.5
        };
      }

      this.showTaunt('PLAYER_KEEPER_SAVES', null, '🧤');
      this._showReactionBanner('撲出！神撲！', 'score');
    } else {
      if (sim.result === 'goal') {
        scored = true;
        this.cpuScore++;
        this.keeper.concede();
        if (this.taker) this.taker.celebrate();
        this.stadium.deformNet(sim.crossing.x, sim.crossing.y);
        this.fx.triggerGoalExplosion(sim.crossing);
        sound.playNet();
        sound.swellGoal();

        if (this.keeperTurnState.earlyDive) {
          this.showTaunt('TAKER_PUNISHES_EARLY_DIVE', null, '⚽');
        } else {
          this.showTaunt('TAKER_SCORES', null, '⚽');
        }
        this._showReactionBanner('電腦入波', 'miss');
      } else {
        scored = false;
        this.keeper.celebrate();
        if (this.taker) this.taker.concede();
        sound.playPost();
        sound.swellMiss();
        this._showReactionBanner('電腦射失！', 'score');
      }
    }

    // 1. Record player dive into Taker AI memory
    const actualDiveZone = this.keeperTurnState.diveZone || 'BM';
    if (this.takerAI) {
      this.takerAI.recordPlayerDive(actualDiveZone);
    }

    // 2. In-scene 3D reveal: dive habits & crossing marker
    const diveProbs = this.takerAI ? this.takerAI.getDiveProbabilities() : null;
    const diveTarget = (this.keeperTurnState.divePlan && this.keeperTurnState.divePlan.target)
      ? this.keeperTurnState.divePlan.target
      : { x: this.keeper.root.position.x, y: 1.15 };
    this.fx.showMindReadingReveal(
      diveProbs,
      sim.crossing,
      diveTarget
    );

    const probPct = diveProbs && diveProbs.probabilities
      ? Math.round((diveProbs.probabilities[actualDiveZone] || 0.16) * 100)
      : 35;
    const zoneName = (this.model && this.model.zoneLabels[actualDiveZone]) || actualDiveZone;
    this._showMindRevealPill(`你撲向：${zoneName}（電腦讀取撲救慣性）`);

    // 3. Record CPU kick & update HUD
    this.cpuKicks.push({ scored });
    this.updateHUD();

    // 4. Check for deciding kick or round progression
    const isDecided = this._checkMatchDecided();
    if (isDecided) {
      setTimeout(() => {
        this.triggerDecidingReplay(() => this.finishMatch());
      }, 1200);
      return;
    }

    setTimeout(() => {
      this._evaluateRoundEnd();
    }, 1400);
  }

  _checkMatchDecided() {
    const pKicksTaken = this.playerKicks.length;
    const cKicksTaken = this.cpuKicks.length;

    if (this.isSuddenDeath) {
      // In sudden death, if both have kicked and scores differ:
      return pKicksTaken === cKicksTaken && this.playerScore !== this.cpuScore;
    }

    const pRemaining = this.totalRounds - pKicksTaken;
    const cRemaining = this.totalRounds - cKicksTaken;

    if (this.playerScore > this.cpuScore + cRemaining) return true;
    if (this.cpuScore > this.playerScore + pRemaining) return true;
    if (pKicksTaken >= this.totalRounds && cKicksTaken >= this.totalRounds && this.playerScore !== this.cpuScore) return true;

    return false;
  }

  _evaluateRoundEnd() {
    const pCount = this.playerKicks.length;
    const cCount = this.cpuKicks.length;

    // Both sides completed current round
    if (pCount === cCount) {
      if (this.isSuddenDeath) {
        if (this.playerScore !== this.cpuScore) {
          this.finishMatch();
        } else {
          // Tied in sudden death -> next sudden death kick
          this.round++;
          this.startPlayerTurn();
        }
      } else {
        // In regulation
        if (pCount >= this.totalRounds) {
          if (this.playerScore !== this.cpuScore) {
            this.finishMatch();
          } else {
            // Tied after 5 kicks -> Sudden Death!
            this.isSuddenDeath = true;
            this.round = 6;
            this.startPlayerTurn();
          }
        } else {
          // Next regulation round
          this.round++;
          this.startPlayerTurn();
        }
      }
    }
  }

  _checkEarlyClinch() {
    if (this.isSuddenDeath) return false;

    const pKicksTaken = this.playerKicks.length;
    const cKicksTaken = this.cpuKicks.length;
    const pRemaining = this.totalRounds - pKicksTaken;
    const cRemaining = this.totalRounds - cKicksTaken;

    // Player cannot be caught
    if (this.playerScore > this.cpuScore + cRemaining) return true;
    // CPU cannot be caught
    if (this.cpuScore > this.playerScore + pRemaining) return true;

    return false;
  }

  finishMatch() {
    this.matchState = 'END';
    this.timeScale = 1.0;
    this.input.disable();
    if (this.fx && this.fx.hideKeeperTargetZones) this.fx.hideKeeperTargetZones();

    const isWin = this.playerScore > this.cpuScore;
    const isDraw = this.playerScore === this.cpuScore;
    const resultKey = isWin ? 'win' : (isDraw ? 'draw' : 'loss');

    if (this.model) {
      this.model.recordMatchResult(resultKey);
    }

    if (isWin) {
      sound.swellGoal();
    } else {
      sound.swellMiss();
    }

    // Stars & Trophies calculation
    const cleanSheet = (this.cpuScore === 0);
    const savesCount = this.cpuKicks.filter(k => !k.scored).length;
    const predScore = this.model ? this.model.getPredictabilityScore() : null;
    const isTourney = (this.matchMode === 'TOURNAMENT');
    const isTourneyFinalWin = isTourney && isWin && (this.tournament.getRound() === 'FINAL');

    // Tournament match recording
    if (isTourney) {
      this.tournament.recordPlayerMatch(this.playerScore, this.cpuScore);
      this.tournament.save();
    }

    // Stars breakdown & award
    this.lastMatchStarResult = this.unlocks.calculateMatchStars({
      won: isWin,
      isWin,
      cleanSheet,
      savesCount,
      predictability: predScore,
      predictabilityScore: predScore,
      isTournament: isTourney,
      isTournamentMatch: isTourney,
      isChampion: isTourneyFinalWin,
      isTournamentFinalWin: isTourneyFinalWin
    });
    this.unlocks.addStars(this.lastMatchStarResult.total);

    // Trophies unlock evaluation
    this.unlocks.checkTrophies({
      wonMatch: isWin,
      tournamentWon: isTourneyFinalWin,
      cleanSheet,
      savesInMatch: savesCount,
      lowPredictability: (predScore !== null && predScore <= 25),
      suddenDeathWon: (this.isSuddenDeath && isWin)
    });
    this.unlocks.save();

    this._updateNavStars();
    this._renderEndScreen();
    this.switchScreen('end');
  }

  // ==========================================
  // HUD & UI UPDATES
  // ==========================================

  updateHUD() {
    if (this.dom.scoreDigits) {
      this.dom.scoreDigits.textContent = `${this.playerScore} - ${this.cpuScore}`;
    }

    // Render Player Dots
    if (this.dom.playerDots) {
      this.dom.playerDots.innerHTML = '';
      const dotCount = Math.max(this.totalRounds, Math.max(this.playerKicks.length, this.cpuKicks.length));

      for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement('div');
        dot.className = 'kick-dot';

        if (i < this.playerKicks.length) {
          const k = this.playerKicks[i];
          dot.classList.add(k.scored ? 'scored' : 'missed');
          dot.textContent = k.scored ? '✓' : '✕';
        } else if (i === this.playerKicks.length && this.matchState === 'PLAYER_TURN') {
          dot.classList.add('current');
        }
        this.dom.playerDots.appendChild(dot);
      }
    }

    // Render CPU Dots
    if (this.dom.aiDots) {
      this.dom.aiDots.innerHTML = '';
      const dotCount = Math.max(this.totalRounds, Math.max(this.playerKicks.length, this.cpuKicks.length));

      for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement('div');
        dot.className = 'kick-dot';

        if (i < this.cpuKicks.length) {
          const k = this.cpuKicks[i];
          dot.classList.add(k.scored ? 'scored' : 'missed');
          dot.textContent = k.scored ? '✓' : '✕';
        } else if (i === this.cpuKicks.length && (this.matchState === 'KEEPER_TURN' || this.matchState === 'KEEPER_BALL_FLIGHT')) {
          dot.classList.add('current');
        }
        this.dom.aiDots.appendChild(dot);
      }
    }
  }

  _showReactionBanner(text, type) {
    if (!this.dom.reactionBanner) return;
    this.dom.reactionBanner.textContent = text;
    this.dom.reactionBanner.className = `reaction-banner active ${type}`;

    setTimeout(() => {
      if (this.dom.reactionBanner) {
        this.dom.reactionBanner.classList.remove('active');
      }
    }, 1100);
  }

  _showMindRevealPill(text) {
    if (!this.dom.mindRevealPill || !this.dom.mindRevealText) return;
    this.dom.mindRevealText.textContent = text;
    this.dom.mindRevealPill.classList.add('active');

    setTimeout(() => {
      if (this.dom.mindRevealPill) {
        this.dom.mindRevealPill.classList.remove('active');
      }
    }, TUNING.juice.revealDurationMs);
  }

  _renderEndScreen() {
    if (!this.model) return;

    const isWin = this.playerScore > this.cpuScore;
    const isDraw = this.playerScore === this.cpuScore;

    // 1. Result Title
    if (this.dom.endResultBadge) {
      this.dom.endResultBadge.textContent = isWin ? '🏆' : (isDraw ? '🤝' : '😢');
    }
    if (this.dom.endResultTitle) {
      this.dom.endResultTitle.textContent = isWin ? '你贏咗！' : (isDraw ? '惜敗打和！' : '輸咗……下鋪再戰！');
      this.dom.endResultTitle.className = `result-title ${isWin ? 'win' : (isDraw ? 'draw' : 'lose')}`;
    }
    if (this.dom.endFinalScore) {
      this.dom.endFinalScore.textContent = `最終比數：${this.playerScore} - ${this.cpuScore}`;
    }

    // 2. Predictability Gauge
    const score = this.model.getPredictabilityScore();
    if (score === null) {
      if (this.dom.endPredictNum) this.dom.endPredictNum.textContent = '--';
      if (this.dom.endPredictTag) this.dom.endPredictTag.textContent = '數據不足 · 需至少 8 次射門';
      if (this.dom.endPredictDesc) {
        this.dom.endPredictDesc.textContent = '門將大腦仲摸索緊你嘅出招規律，射多幾腳再睇下讀心結果啦！';
      }
    } else {
      const rating = this.model.getPredictabilityRating(score);
      if (this.dom.endPredictNum) this.dom.endPredictNum.textContent = score;
      if (this.dom.endPredictTag) this.dom.endPredictTag.textContent = rating.tag;
      if (this.dom.endPredictDesc) this.dom.endPredictDesc.textContent = rating.desc;
    }

    // 3. Heatmap Grid
    if (this.dom.endHeatmapGrid) {
      this.dom.endHeatmapGrid.innerHTML = '';
      const hmData = this.model.getHeatmapData();

      for (const z of this.model.zones) {
        const item = hmData[z];
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';

        // Background intensity by percentage
        const alpha = Math.min(0.85, 0.12 + (item.percent / 100) * 0.73);
        cell.style.backgroundColor = `rgba(0, 229, 255, ${alpha})`;

        cell.innerHTML = `
          <div class="zone-name">${item.label}</div>
          <div class="zone-pct">${item.percent}%</div>
          <div class="zone-count">${item.count}腳</div>
        `;
        this.dom.endHeatmapGrid.appendChild(cell);
      }
    }

    if (this.dom.endTotalShotsTag) {
      this.dom.endTotalShotsTag.textContent = `累計 ${this.model.totalShots} 次`;
    }

    if (this.dom.endKeeperAcc) {
      this.dom.endKeeperAcc.textContent = `${this.model.getKeeperAccuracy()}%`;
    }

    // 4. Stars Breakdown Card
    if (this.dom.endStarsCard && this.lastMatchStarResult) {
      this.dom.endStarsCard.style.display = 'block';
      if (this.dom.endStarsTotal) {
        this.dom.endStarsTotal.textContent = `+${this.lastMatchStarResult.total} ⭐`;
      }
      if (this.dom.endStarsBreakdown) {
        this.dom.endStarsBreakdown.innerHTML = '';
        this.lastMatchStarResult.breakdown.forEach(item => {
          const row = document.createElement('div');
          row.className = 'star-breakdown-row';
          const label = item.label || item.desc || '獎勵';
          const count = item.count ?? item.stars ?? 1;
          row.innerHTML = `<span>${label}</span><span>+${count} ⭐</span>`;
          this.dom.endStarsBreakdown.appendChild(row);
        });
      }
    }

    // 5. Tournament Navigation Buttons on End Screen
    if (this.matchMode === 'TOURNAMENT') {
      if (this.dom.btnPlayAgain) this.dom.btnPlayAgain.style.display = 'none';
      if (isWin) {
        if (this.tournament.isComplete()) {
          if (this.dom.btnTourneyAdvance) {
            this.dom.btnTourneyAdvance.style.display = 'inline-block';
            this.dom.btnTourneyAdvance.textContent = '🏆 榮獲世界盃冠軍！';
          }
          if (this.dom.btnTourneyBracketView) this.dom.btnTourneyBracketView.style.display = 'inline-block';
        } else {
          if (this.dom.btnTourneyAdvance) {
            this.dom.btnTourneyAdvance.style.display = 'inline-block';
            this.dom.btnTourneyAdvance.textContent = `晉級 ${this.tournament.getNextRoundName()}`;
          }
          if (this.dom.btnTourneyBracketView) this.dom.btnTourneyBracketView.style.display = 'inline-block';
        }
      } else {
        if (this.dom.btnTourneyAdvance) this.dom.btnTourneyAdvance.style.display = 'none';
        if (this.dom.btnTourneyBracketView) {
          this.dom.btnTourneyBracketView.style.display = 'inline-block';
          this.dom.btnTourneyBracketView.textContent = '查看世界盃對陣圖 (已出局)';
        }
      }
    } else {
      if (this.dom.btnPlayAgain) this.dom.btnPlayAgain.style.display = 'inline-block';
      if (this.dom.btnTourneyAdvance) this.dom.btnTourneyAdvance.style.display = 'none';
      if (this.dom.btnTourneyBracketView) this.dom.btnTourneyBracketView.style.display = 'none';
    }
  }

  // ==========================================
  // MAIN LOOP (RENDER & FIXED PHYSICS)
  // ==========================================

  _loop(timestamp) {
    if (!this.isRunning) return;

    if (this.isTabPaused) {
      requestAnimationFrame((t) => this._loop(t));
      return;
    }

    const rawDelta = Math.min(0.05, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    // Hit-stop freeze frame handling
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= rawDelta;
      this.stadium.render();
      requestAnimationFrame((t) => this._loop(t));
      return;
    }

    const deltaSec = rawDelta * this.timeScale;
    const timeSec = timestamp / 1000;

    // 1. Update Ball Trajectory Flight (Player Shot or Keeper Mode CPU Shot or Replay)
    if (this.activeShot && (this.matchState === 'BALL_FLIGHT' || this.matchState === 'KEEPER_BALL_FLIGHT' || this.isReplaying)) {
      this.flightTime += deltaSec;
      const sim = this.activeShot.sim;
      const totalPts = this.activeShot.totalPoints;
      const tCrossing = sim.crossing.t;

      // Check Slow-Mo (ball within 3.2m of goal line)
      if (!this.ballCrossed && !this.prefersReducedMotion && !this.isReplaying) {
        const estZ = TUNING.goal.spotDistance - (this.flightTime / tCrossing) * TUNING.goal.spotDistance;
        if (estZ <= TUNING.juice.slowMoDistZ && estZ > 0) {
          this.timeScale = TUNING.juice.slowMoTimeScale;
        } else {
          this.timeScale = 1.0;
        }
      } else if (!this.isReplaying) {
        this.timeScale = 1.0;
      }

      // Check Crossing moment
      if (!this.ballCrossed && this.flightTime >= tCrossing) {
        this.ballCrossed = true;
        if (!this.isReplaying) {
          if (this.activeShot.isKeeperTurn) {
            this._onKeeperTurnCrossing();
          } else {
            this._onPlayerShotCrossing();
          }
        } else {
          if (this.activeShot.isGoal) {
            this.stadium.deformNet(sim.crossing.x, sim.crossing.y);
          } else if (this.activeShot.saveCheck && this.activeShot.saveCheck.saved) {
            if (this.activeShot.saveCheck.saveType === 'catch') {
              this.activeShot.deflectPos = { ...this.activeShot.saveCheck.contactPoint };
              this.activeShot.deflectVel = { vx: 0, vy: 0, vz: 0 };
            } else {
              this.ballDeflecting = true;
              this.deflectPos = { ...this.activeShot.saveCheck.contactPoint };
              this.deflectVel = {
                vx: (Math.random() - 0.5) * 4.0,
                vy: 2.5,
                vz: 6.0
              };
            }
          }
        }
      }

      // Position Ball
      if (!this.ballCrossed || (this.activeShot.isGoal && !this.ballDeflecting && !this.activeShot.deflectPos)) {
        // Pre-crossing interpolation along trajectory, and continuation into net on goal
        const dt = 1 / 120;
        const maxFlightTime = this.activeShot.isGoal ? (tCrossing + 0.35) : tCrossing;
        const currTime = Math.min(this.flightTime, maxFlightTime);
        const idx = Math.min(totalPts - 1, Math.floor(currTime / dt));
        const nextIdx = Math.min(totalPts - 1, idx + 1);
        const frac = (currTime - idx * dt) / dt;

        const p0 = sim.trajectory[idx];
        const p1 = sim.trajectory[nextIdx];

        if (p0 && p1) {
          const bx = p0.x + (p1.x - p0.x) * frac;
          const by = Math.max(TUNING.ball.radius, p0.y + (p1.y - p0.y) * frac);
          const bz = p0.z + (p1.z - p0.z) * frac;
          this.ball.update({ x: bx, y: by, z: bz }, p0, deltaSec);
        }
      } else if (this.ballDeflecting && this.deflectPos && this.deflectVel) {
        // Post-save parry deflection physics
        this.deflectVel.vy += TUNING.ball.gravity * deltaSec;
        this.deflectPos.x += this.deflectVel.vx * deltaSec;
        this.deflectPos.y += this.deflectVel.vy * deltaSec;
        this.deflectPos.z += this.deflectVel.vz * deltaSec;

        if (this.deflectPos.y <= TUNING.ball.radius) {
          this.deflectPos.y = TUNING.ball.radius;
          this.deflectVel.vy = -this.deflectVel.vy * 0.55;
          this.deflectVel.vx *= 0.85;
          this.deflectVel.vz *= 0.85;
        }
        this.ball.update(this.deflectPos, this.deflectVel, deltaSec);
      } else if (this.activeShot.deflectPos) {
        // Caught by gloves: ball stays fixed at contact point
        this.ball.update(this.activeShot.deflectPos, { vx: 0, vy: 0, vz: 0 }, deltaSec);
      }
    }

    // 2. Update Taker Humanoid
    if (this.taker) {
      this.taker.update(timeSec, deltaSec);
    }

    // 3. Update Subsystems
    const ballPos = this.ball ? this.ball.mesh.position : null;
    const keeperReach = this.keeper ? this.keeper.getKeeperReachPosition() : null;

    this.keeper.update(timeSec, deltaSec);
    this.fx.update(deltaSec);
    this.stadium.update(timeSec, deltaSec, ballPos, keeperReach, this.fx);

    // 4. Render 3D Scene
    this.stadium.render();

    requestAnimationFrame((t) => this._loop(t));
  }
}

// Bootstrap on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  const app = new GameApp();
  app.init();
  window.BTB_GAME = app;

  if (typeof window !== 'undefined' && window.location.search.includes('autostart=1')) {
    setTimeout(() => app.startMatch(), 150);
  }
});
