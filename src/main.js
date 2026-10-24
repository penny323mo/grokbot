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
import { swipeToLaunch, simulate, getZoneFromPoint } from './shot.js';
import { decide, checkSave, DIVE_TARGETS } from './keeperAI.js';
import { TakerAIModel } from './takerAI.js';
import { DIFFICULTY, getDifficultyConfig, saveDifficulty, loadDifficulty } from './difficulty.js';
import { getTaunt, computeTell } from './taunts.js';
import { sound } from './audio.js';

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
    this.matchState = 'TITLE'; // 'TITLE' | 'PLAYER_TURN' | 'BALL_FLIGHT' | 'KEEPER_TURN' | 'KEEPER_BALL_FLIGHT' | 'END'
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

    // 4. Check reduced motion
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // 5. Cache DOM Elements
    this._cacheDOMElements();

    // 6. Initialize 3D Scene & Subsystems
    this.stadium = new StadiumScene(this.canvas);
    this.keeper = new Goalkeeper3D(this.stadium.scene);
    this.ball = new Ball3D(this.stadium.scene);
    this.taker = new Taker3D(this.stadium.scene);
    this.fx = new FXManager(this.stadium.scene, this.stadium.camera);

    // 7. Initialize Swipe Input
    this.input = new SwipeInput(
      this.canvas,
      (launch) => this.onPlayerShoot(launch),
      (aimPoints) => this.fx.updateAimAssist(aimPoints)
    );

    // 8. Bind UI Handlers
    this._bindEvents();

    // 9. Update Title Screen Display
    this._updateTitleMemoryStatus();
    this._updateDifficultyUI();

    // 10. Start Render / Physics Loop
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

      // Top nav
      btnSound: document.getElementById('btn-sound-toggle'),
      soundIcon: document.getElementById('sound-icon'),
      soundLabel: document.getElementById('sound-label'),
      btnNavHome: document.getElementById('btn-nav-home'),

      // Title screen
      btnStart: document.getElementById('btn-start-game'),
      btnResetTitle: document.getElementById('btn-reset-memory-title'),
      titleMemoryDesc: document.getElementById('title-memory-desc'),
      diffChips: document.getElementById('difficulty-chips'),
      diffDesc: document.getElementById('diff-desc'),

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

    if (this.dom.btnNavHome) {
      this.dom.btnNavHome.style.display = (screenName === 'title') ? 'none' : 'inline-flex';
    }

    if (screenName === 'title' && this.dom.screenTitle) {
      this.dom.screenTitle.classList.add('active');
    } else if (screenName === 'match' && this.dom.screenMatch) {
      this.dom.screenMatch.classList.add('active');
    } else if (screenName === 'end' && this.dom.screenEnd) {
      this.dom.screenEnd.classList.add('active');
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

    let done = false;
    const endReplay = () => {
      if (done) return;
      done = true;
      this.isReplaying = false;
      this.timeScale = 1.0;
      this.stadium.setCameraMode('MAIN');
      if (this.dom.replayOverlay) {
        this.dom.replayOverlay.style.display = 'none';
      }
      if (onComplete) onComplete();
    };

    if (this.dom.btnSkipReplay) {
      this.dom.btnSkipReplay.onclick = () => endReplay();
    }

    const dur = (TUNING.replay && TUNING.replay.durationMs) || 2600;
    setTimeout(endReplay, dur);
  }

  // ==========================================
  // MATCH MANAGEMENT
  // ==========================================

  startMatch() {
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

    this.switchScreen('match');
    this.updateHUD();
    this.startPlayerTurn();
  }

  startPlayerTurn() {
    this.matchState = 'PLAYER_TURN';
    this.isKeeperTurn = false;
    this.timeScale = 1.0;
    this.ballCrossed = false;
    this.ballDeflecting = false;
    this.activeShot = null;
    this.activeCpuShot = null;

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
    if (this.dom.homeTeamName) this.dom.homeTeamName.textContent = '你 (主射)';
    if (this.dom.awayTeamName) this.dom.awayTeamName.textContent = '電腦 (門將)';

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
    const divePlan = decide(modelProbs, this.difficultyConfig, TUNING);

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
    this.timeScale = 1.0;
    this.ballCrossed = false;
    this.ballDeflecting = false;
    this.activeShot = null;

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
      this.dom.turnBanner.innerHTML = `<span>🧤 你把關撲救：向目標滑動撲救！</span>`;
    }
    if (this.dom.homeTeamName) this.dom.homeTeamName.textContent = '你 (門將)';
    if (this.dom.awayTeamName) this.dom.awayTeamName.textContent = '電腦 (主射)';

    if (this.dom.tutorialOverlay) {
      this.dom.tutorialOverlay.style.display = 'none';
    }
    this.fx.hideAimAssist();

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

    // Configure input for keeper dive swipe
    this.input.setAimAssist(false);
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

  _onPlayerKeeperSwipe(launch) {
    if (this.matchState !== 'KEEPER_TURN' || this.keeperTurnState.playerDived) return;

    // Determine target dive zone from player swipe
    const isLeft = launch.vx < -0.6;
    const isRight = launch.vx > 0.6;
    const isHigh = (launch.targetY > 1.3) || (launch.vy > 1.2);

    let zone = 'BM';
    if (isLeft) zone = isHigh ? 'TL' : 'BL';
    else if (isRight) zone = isHigh ? 'TR' : 'BR';
    else zone = isHigh ? 'TM' : 'BM';

    const now = performance.now();
    const strikeTime = this.keeperTurnState.strikeTime || (now + 500);
    const msBeforeStrike = strikeTime - now;

    let earlyDive = false;
    let lateDive = false;
    let reactTime = 0.08;
    let reachMultiplier = 1.0;

    // Timing window:
    // If player dives > 250ms before strike, striker spots the dive and shoots opposite!
    if (this.keeperTurnState.runUpStarted && msBeforeStrike > 250) {
      earlyDive = true;
      reactTime = 0.02;
      this.showTaunt('TAKER_PUNISHES_EARLY_DIVE', null, '⚽');
      this._showReactionBanner('太早撲！射手睇到你！', 'miss');
    } else if (now > strikeTime + 220) {
      // Late dive
      lateDive = true;
      reactTime = 0.28;
      reachMultiplier = 0.65;
    }

    const diveInfo = DIVE_TARGETS[zone] || DIVE_TARGETS.BM;
    const divePlan = {
      zone,
      target: { x: diveInfo.x, y: diveInfo.y },
      reactTime,
      diveDuration: TUNING.keeper.diveDuration,
      reachMultiplier,
      animName: diveInfo.anim,
      label: diveInfo.label
    };

    this.keeperTurnState.playerDived = true;
    this.keeperTurnState.diveZone = zone;
    this.keeperTurnState.divePlan = divePlan;
    this.keeperTurnState.earlyDive = earlyDive;
    this.keeperTurnState.lateDive = lateDive;

    // Start keeper dive animation
    this.keeper.startDive(divePlan);
  }

  _onCpuTakerStrike() {
    this.keeperTurnState.hasStruck = true;
    this.matchState = 'KEEPER_BALL_FLIGHT';
    sound.playKick();

    // If player has not swiped yet, default to center BM
    if (!this.keeperTurnState.playerDived) {
      const diveInfo = DIVE_TARGETS.BM;
      this.keeperTurnState.diveZone = 'BM';
      this.keeperTurnState.divePlan = {
        zone: 'BM',
        target: { x: diveInfo.x, y: diveInfo.y },
        reactTime: 0.18,
        diveDuration: TUNING.keeper.diveDuration,
        reachMultiplier: 0.85,
        animName: diveInfo.anim,
        label: diveInfo.label
      };
      this.keeper.startDive(this.keeperTurnState.divePlan);
    }

    // Taker AI decides target (aims away from player habit / punishes early dive)
    const earlyZone = this.keeperTurnState.earlyDive ? this.keeperTurnState.diveZone : null;
    const takerDecision = this.takerAI.decideShot(this.difficultyConfig, earlyZone);

    // Launch ball along physics trajectory toward taker's target
    const targetX = takerDecision.target.x;
    const targetY = takerDecision.target.y;
    const launchSpeed = takerDecision.speed;
    const curve = takerDecision.curve;

    const launch = {
      vx: (targetX / 11.0) * launchSpeed * 0.95,
      vy: Math.max(0.5, (targetY / 11.0) * launchSpeed * 0.95 - 0.5 * TUNING.ball.gravity * (11.0 / launchSpeed)),
      speed: launchSpeed,
      spin: { x: 0, y: curve, z: 0 },
      power: launchSpeed / 32.0,
      targetX,
      targetY
    };

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
      isKeeperTurn: true
    };
    this.flightTime = 0;
    this.ballCrossed = false;
    this.ballDeflecting = false;
  }

  _onKeeperTurnCrossing() {
    this.ballCrossed = true;
    const shot = this.activeShot;
    if (!shot) return;

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
      this.takerAI.recordDive(actualDiveZone);
    }

    // 2. In-scene 3D reveal
    const diveProbs = this.takerAI ? this.takerAI.getDiveProbabilities() : null;
    this.fx.showMindReadingReveal(
      diveProbs ? { probabilities: diveProbs } : null,
      sim.crossing,
      this.keeper.getKeeperReachPosition()
    );

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
  }

  // ==========================================
  // MAIN LOOP (RENDER & FIXED PHYSICS)
  // ==========================================

  _loop(timestamp) {
    if (!this.isRunning) return;

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

    // 1. Update Ball Trajectory Flight (Player Shot or Keeper Mode CPU Shot)
    if (this.activeShot && (this.matchState === 'BALL_FLIGHT' || this.matchState === 'KEEPER_BALL_FLIGHT')) {
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
        if (this.activeShot.isKeeperTurn) {
          this._onKeeperTurnCrossing();
        } else {
          this._onPlayerShotCrossing();
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
