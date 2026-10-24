/**
 * 12碼讀心戰 (Penalty Mind Game v2) - Main Application Controller
 * Connects 3D Stadium Scene, Procedural Goalkeeper, Ball, Input, Physics,
 * Sound, Juice FX, and the Mental Prediction Model.
 */

import * as THREE from 'three';
import { TUNING } from './tuning.js';
import { StadiumScene } from './scene.js';
import { Goalkeeper3D } from './keeper.js';
import { Ball3D } from './ball.js';
import { FXManager } from './fx.js';
import { SwipeInput } from './input.js';
import { swipeToLaunch, simulate, getZoneFromPoint } from './shot.js';
import { decide, checkSave, DIVE_TARGETS } from './keeperAI.js';
import { sound } from './audio.js';

class GameApp {
  constructor() {
    this.canvas = document.getElementById('scene');
    this.model = null;

    // 3D Engine subsystems
    this.stadium = null;
    this.keeper = null;
    this.ball = null;
    this.fx = null;
    this.input = null;

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

    // CPU kick flight state
    this.activeCpuShot = null;

    // Match state
    this.matchState = 'TITLE'; // 'TITLE' | 'PLAYER_TURN' | 'BALL_FLIGHT' | 'REVEAL' | 'CPU_TURN' | 'END'
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

    // 2. Check reduced motion
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // 3. Cache DOM Elements
    this._cacheDOMElements();

    // 4. Initialize 3D Scene & Subsystems
    this.stadium = new StadiumScene(this.canvas);
    this.keeper = new Goalkeeper3D(this.stadium.scene);
    this.ball = new Ball3D(this.stadium.scene);
    this.fx = new FXManager(this.stadium.scene, this.stadium.camera);

    // 5. Initialize Swipe Input
    this.input = new SwipeInput(
      this.canvas,
      (launch) => this.onPlayerShoot(launch),
      (aimPoints) => this.fx.updateAimAssist(aimPoints)
    );

    // 6. Bind UI Handlers
    this._bindEvents();

    // 7. Update Title Screen Display
    this._updateTitleMemoryStatus();

    // 8. Start Render / Physics Loop
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

      // Match HUD
      scoreDigits: document.getElementById('score-digits'),
      roundSubtag: document.getElementById('round-subtag'),
      turnBanner: document.getElementById('turn-banner'),
      playerDots: document.getElementById('player-dots'),
      aiDots: document.getElementById('ai-dots'),
      reactionBanner: document.getElementById('reaction-banner'),
      tutorialOverlay: document.getElementById('tutorial-overlay'),
      mindRevealPill: document.getElementById('mind-reveal-pill'),
      mindRevealText: document.getElementById('mind-reveal-text'),

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
      this.matchState = 'TITLE';
    };
    if (this.dom.btnBackHome) this.dom.btnBackHome.addEventListener('click', goHome);
    if (this.dom.btnNavHome) this.dom.btnNavHome.addEventListener('click', goHome);

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
    this.timeScale = 1.0;
    this.ballCrossed = false;
    this.ballDeflecting = false;
    this.activeShot = null;
    this.activeCpuShot = null;

    // Reset ball and keeper
    this.ball.reset();
    this.keeper.setReady();

    // Turn banner
    const roundText = this.isSuddenDeath
      ? `突然死亡（第 ${this.round} 輪）`
      : `第 ${this.round} 輪`;
    if (this.dom.roundSubtag) this.dom.roundSubtag.textContent = roundText;
    if (this.dom.turnBanner) {
      this.dom.turnBanner.innerHTML = `<span>⚽ 你主射：向球門撥球射門！</span>`;
    }

    // Check tutorial condition (first 2 kicks of a new player)
    const totalShots = this.model ? (this.model.totalShots || 0) : 0;
    const isTutorial = totalShots < 2;

    if (this.dom.tutorialOverlay) {
      this.dom.tutorialOverlay.style.display = isTutorial ? 'flex' : 'none';
    }

    this.input.setAimAssist(isTutorial);
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

    // 3. Mental Model Probabilities & Keeper Dive Decision
    const modelProbs = this.model ? this.model.getProbabilities() : null;
    const divePlan = decide(modelProbs, 0.5, TUNING);

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
      totalPoints: sim.trajectory.length
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

    // 2. In-scene 讀心 reveal
    this.fx.showMindHeatRing(divePlan.zone);
    const probPct = modelProbs && modelProbs.probabilities
      ? Math.round((modelProbs.probabilities[divePlan.zone] || 0.16) * 100)
      : 35;
    const zoneName = (this.model && this.model.zoneLabels[divePlan.zone]) || divePlan.zone;
    this._showMindRevealPill(`門將估你射：${zoneName}（信心 ${probPct}%）`);

    // 3. Update score & player kick record
    if (scored) this.playerScore++;
    this.playerKicks.push({
      scored,
      zone: actualZone,
      predictedZone: divePlan.zone
    });

    this.updateHUD();

    // 4. Check for regulation early clinch
    const clinch = this._checkEarlyClinch();
    if (clinch) {
      setTimeout(() => this.finishMatch(), 1600);
      return;
    }

    // 5. Proceed to CPU turn
    setTimeout(() => {
      this.startCpuTurn();
    }, 1400);
  }

  startCpuTurn() {
    this.matchState = 'CPU_TURN';
    this.ball.reset();
    this.keeper.setReady();

    if (this.dom.turnBanner) {
      this.dom.turnBanner.innerHTML = `<span>🤖 電腦主射中……</span>`;
    }

    // Brief delay then whistle + CPU kick cut-scene
    setTimeout(() => {
      sound.playWhistle();

      setTimeout(() => {
        sound.playKick();

        // CPU kick has probability 0.75 per spec
        const isGoal = Math.random() < 0.75;
        const targetX = isGoal ? (Math.random() > 0.5 ? 2.5 : -2.5) : (Math.random() > 0.5 ? 4.2 : -4.2);
        const targetY = isGoal ? 1.6 : 2.9;

        // Animated ball flight for CPU shot
        this.activeCpuShot = {
          startTime: performance.now(),
          duration: 0.55,
          isGoal,
          targetX,
          targetY
        };

        // Keeper reaction
        if (isGoal) {
          // Keeper dives opposite or misses
          this.keeper.startDive({
            target: { x: -targetX * 0.8, y: targetY * 0.6 },
            reactTime: 0.18,
            diveDuration: 0.45
          });
        } else {
          // Keeper saves
          this.keeper.startDive({
            target: { x: targetX, y: targetY },
            reactTime: 0.10,
            diveDuration: 0.42
          });
        }
      }, 700);
    }, 500);
  }

  _onCpuShotComplete(isGoal) {
    this.activeCpuShot = null;

    if (isGoal) {
      this.cpuScore++;
      this.stadium.deformNet(2.0, 1.4);
      sound.playNet();
      sound.swellGoal();
      this.keeper.concede();
      this._showReactionBanner('電腦入波', 'score');
    } else {
      this.keeper.celebrate();
      sound.playSave(true);
      sound.swellMiss();
      this._showReactionBanner('電腦射失！', 'miss');
    }

    this.cpuKicks.push({ scored: isGoal });
    this.updateHUD();

    // Check round progression or match resolution
    setTimeout(() => {
      this._evaluateRoundEnd();
    }, 1400);
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
        } else if (i === this.cpuKicks.length && this.matchState === 'CPU_TURN') {
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

    // 1. Update Player Ball Flight Trajectory
    if (this.activeShot && this.matchState === 'BALL_FLIGHT') {
      this.flightTime += deltaSec;
      const sim = this.activeShot.sim;
      const totalPts = this.activeShot.totalPoints;
      const tCrossing = sim.crossing.t;

      // Check Slow-Mo (ball within 3.2m of goal line)
      if (!this.ballCrossed && !this.prefersReducedMotion) {
        const estZ = TUNING.goal.spotDistance - (this.flightTime / tCrossing) * TUNING.goal.spotDistance;
        if (estZ <= TUNING.juice.slowMoDistZ && estZ > 0) {
          this.timeScale = TUNING.juice.slowMoTimeScale;
        } else {
          this.timeScale = 1.0;
        }
      } else {
        this.timeScale = 1.0;
      }

      // Check Crossing moment
      if (!this.ballCrossed && this.flightTime >= tCrossing) {
        this._onPlayerShotCrossing();
      }

      // Position Ball
      if (!this.ballCrossed) {
        // Pre-crossing interpolation along trajectory
        const dt = 1 / 120;
        const idx = Math.min(totalPts - 1, Math.floor(this.flightTime / dt));
        const nextIdx = Math.min(totalPts - 1, idx + 1);
        const frac = (this.flightTime - idx * dt) / dt;

        const p0 = sim.trajectory[idx];
        const p1 = sim.trajectory[nextIdx];

        if (p0 && p1) {
          const bx = p0.x + (p1.x - p0.x) * frac;
          const by = p0.y + (p1.y - p0.y) * frac;
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

    // 2. Update CPU Shot Cutscene Flight
    if (this.activeCpuShot && this.matchState === 'CPU_TURN') {
      const elapsed = (timestamp - this.activeCpuShot.startTime) / 1000;
      const prog = Math.min(1.0, elapsed / this.activeCpuShot.duration);
      const ease = prog;

      const sx = 0;
      const sy = TUNING.ball.radius;
      const sz = TUNING.goal.spotDistance;

      const tx = this.activeCpuShot.targetX;
      const ty = this.activeCpuShot.targetY;
      const tz = 0;

      const cx = sx + (tx - sx) * ease;
      const cz = sz + (tz - sz) * ease;
      const arc = Math.sin(prog * Math.PI) * 0.8;
      const cy = sy + (ty - sy) * ease + arc;

      this.ball.update({ x: cx, y: cy, z: cz }, { vx: 0, vy: 5, vz: -20 }, deltaSec);

      if (prog >= 1.0) {
        const isGoal = this.activeCpuShot.isGoal;
        this._onCpuShotComplete(isGoal);
      }
    }

    // 3. Update Subsystems
    const ballPos = this.ball ? this.ball.mesh.position : null;
    const keeperReach = this.keeper ? this.keeper.getKeeperReachPosition() : null;

    this.keeper.update(timeSec, deltaSec);
    this.fx.update(deltaSec);
    this.stadium.update(timeSec, deltaSec, ballPos, keeperReach);

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
});
