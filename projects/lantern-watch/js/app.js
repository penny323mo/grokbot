/**
 * js/app.js
 * Main game coordinator for 燈影軍略 · Lantern Tactics (v4).
 * Connects pure engine, UI rendering, sound, campaign progression, and debug hooks.
 */

import { GAME } from './config.js';
import { CHAPTERS } from './data/maps.js';
import { GUARDIAN_PROTOS, ENEMY_PROTOS, RELICS } from './data/units.js';
import { CampaignManager } from './engine/campaign.js';
import { Battle } from './engine/battle.js';
import { Board } from './engine/board.js';
import { RNG } from './engine/rng.js';
import { SoundEngine } from './audio.js';
import { UIRenderer } from './render/ui.js';
import { getReachableTiles, getAttackRangeTiles, getAttackableTilesFromReachable } from './engine/pathfinding.js';
import { calculateCombat, canTargetUnit } from './engine/combat.js';

class LanternTacticsApp {
  constructor() {
    this.gameConfig = GAME;
    this.sound = new SoundEngine();
    this.campaign = new CampaignManager();
    this.ui = new UIRenderer(this.sound);
    this.rng = new RNG(Date.now());

    // State
    this.activeChapter = CHAPTERS[0];
    this.selectedSquadIds = ['bear_guard', 'cat_patrol', 'lantern_crafter', 'tea_master'];
    this.activeStratagemId = null;
    this.battle = null;
    this.battleSpeed = 1;

    // Deploy Phase State
    this.isDeploying = false;
    this.deployPlacements = [];
    this.deploySlots = new Set();
    this.selectedDeployUnit = null;

    // Interactive Battle Selection
    this.selectedUnit = null;
    this.reachableTiles = new Map();
    this.attackableTiles = new Set();
    this.aoeTiles = new Set();
    this.targetingMode = null; // 'target_unit' | 'light_placement' | 'heal' | 'aoe_cross'
    this.activeActionType = null;
    this.stagedMoveTile = null;

    this.init();
  }

  init() {
    // Set branding
    document.title = `${GAME.name} · ${GAME.nameEn}`;
    const logoEl = document.getElementById('titleMainLogo');
    if (logoEl) logoEl.textContent = GAME.name;
    const taglineEl = document.getElementById('titleTagline');
    if (taglineEl) taglineEl.textContent = GAME.tagline;

    const tutHeader = document.getElementById('boardTutorialTitle');
    if (tutHeader) tutHeader.textContent = `${GAME.name} · 基礎兵法`;
    const tutHeader2 = document.getElementById('tutorialHeaderTitle');
    if (tutHeader2) tutHeader2.textContent = `${GAME.name} · 基礎兵法`;

    this.setupEventListeners();
    this.setupDebugHooks();
  }

  setupEventListeners() {
    // Navigation
    document.getElementById('btnNavHome').onclick = () => {
      this.sound?.playSfx('tap');
      this.ui.showScreen('screenTitle');
    };

    document.getElementById('btnNavWorldMap').onclick = () => {
      this.sound?.playSfx('tap');
      this.openWorldMap();
    };

    document.getElementById('btnHelp').onclick = () => {
      this.sound?.playSfx('tap');
      this.ui.showTacticsTutorialModal();
    };

    const btnSpeed = document.getElementById('btnBattleSpeed');
    if (btnSpeed) {
      btnSpeed.onclick = () => {
        this.battleSpeed = this.battleSpeed === 1 ? 2 : 1;
        const txt = document.getElementById('txtBattleSpeed');
        if (txt) txt.textContent = `${this.battleSpeed}x`;
        btnSpeed.classList.toggle('fast', this.battleSpeed === 2);
        this.sound?.playSfx('tap');
      };
    }

    const btnMusic = document.getElementById('btnToggleMusic');
    if (btnMusic) {
      btnMusic.onclick = () => {
        const muted = this.sound?.toggleMusic();
        btnMusic.style.opacity = muted ? '0.4' : '1';
      };
    }

    const btnSfx = document.getElementById('btnToggleSfx');
    if (btnSfx) {
      btnSfx.onclick = () => {
        const muted = this.sound?.toggleSfx();
        btnSfx.style.opacity = muted ? '0.4' : '1';
      };
    }

    // Title screen
    document.getElementById('btnStartCampaign').onclick = () => {
      this.sound?.playSfx('tap');
      this.openWorldMap();
    };

    const btnOpenCamp = document.getElementById('btnOpenCamp');
    if (btnOpenCamp) {
      btnOpenCamp.onclick = () => {
        this.sound?.playSfx('tap');
        this.openCampScreen();
      };
    }

    const btnCampBackToMap = document.getElementById('btnCampBackToMap');
    if (btnCampBackToMap) {
      btnCampBackToMap.onclick = () => {
        this.sound?.playSfx('tap');
        this.openWorldMap();
      };
    }

    document.getElementById('btnOpenRoster').onclick = () => {
      this.sound?.playSfx('tap');
      const inst = this.campaign.getUnitInstance('cat_patrol');
      this.ui.showDetailSheet(inst, this.campaign);
    };

    document.getElementById('btnOpenTutorial').onclick = () => {
      this.sound?.playSfx('tap');
      this.ui.showTacticsTutorialModal();
    };

    // Battle Top HUD
    const threatBtn = document.getElementById('btnThreatToggle');
    if (threatBtn) threatBtn.onclick = () => {
      this.showThreat = !this.showThreat;
      threatBtn.classList.toggle('active', this.showThreat);
      if (this.isDeploying) this.refreshDeployUI(); else this.refreshBattleUI();
    };
    document.getElementById('btnEndTurn').onclick = () => {
      if (!this.battle || this.battle.phase !== 'ally') return;
      this.sound?.playSfx('tap');
      this.clearSelection();
      this.triggerEnemyTurn();
    };

    document.getElementById('btnUndoMove').onclick = () => {
      if (this.selectedUnit && this.stagedMoveTile) {
        this.battle.undoMove(this.selectedUnit);
        this.clearSelection();
        this.refreshBattleUI();
      }
    };
  }

  openWorldMap() {
    this.ui.showScreen('screenWorldMap');
    this.ui.renderWorldMap(this.campaign, (chapterId) => {
      const ch = CHAPTERS.find(c => c.id === chapterId);
      if (ch) this.openPreBattle(ch);
    });
  }

  openCampScreen(unitId = 'cat_patrol') {
    this.campSelectedUnitId = unitId;
    this.ui.showScreen('screenCamp');
    this.ui.renderCampScreen(this.campaign, this.campSelectedUnitId, {
      onSelectUnit: (uid) => {
        this.openCampScreen(uid);
      },
      onEquipRelic: (uid, relicId) => {
        this.sound?.playSfx('tap');
        this.campaign.equipRelic(uid, relicId);
        this.openCampScreen(uid);
      },
      onPromoteUnit: (uid) => {
        const success = this.campaign.promoteUnit(uid);
        if (success) {
          this.sound?.playSfx('buff');
        }
        this.openCampScreen(uid);
      }
    });
  }

  openPreBattle(chapter) {
    this.activeChapter = chapter;
    const badgeEl = document.getElementById('txtChapterBadge');
    if (badgeEl) badgeEl.textContent = chapter.id === 7 ? '外傳' : `第${chapter.id}回`;
    if (chapter.id === 1) {
      this.selectedSquadIds = ['bear_guard', 'cat_patrol', 'lantern_crafter', 'tea_master'];
    } else {
      const defaultComps = {
        2: ['tanuki_mage', 'bear_guard', 'tea_master', 'cat_patrol', 'lantern_crafter'],
        3: ['lantern_crafter', 'fox_maiden', 'bear_guard', 'tea_master', 'cat_patrol'],
        4: ['bear_guard', 'cat_patrol', 'crane_rider', 'tea_master', 'tanuki_mage', 'lantern_crafter'],
        5: ['lantern_crafter', 'bear_guard', 'tea_master', 'cat_patrol', 'tanuki_mage', 'crane_rider'],
        6: ['bear_guard', 'tea_master', 'crane_rider', 'cat_patrol', 'fox_maiden', 'tanuki_mage'],
        7: ['bear_guard', 'tea_master', 'cat_patrol', 'lantern_crafter', 'crane_rider'],
        8: ['bear_guard', 'tea_master', 'cat_patrol', 'lantern_crafter', 'crane_rider', 'fox_maiden']
      };
      this.selectedSquadIds = defaultComps[chapter.id] || Object.keys(GUARDIAN_PROTOS).slice(0, chapter.squadLimit);
    }
    this.activeStratagemId = null;

    this.ui.showScreen('screenPreBattle');
    this.ui.renderPreBattle(
      chapter,
      this.campaign,
      this.selectedSquadIds,
      this.activeStratagemId,
      this.getPreBattleHandlers()
    );
  }

  getPreBattleHandlers() {
    return {
      onToggleSquad: (gid) => {
        if (this.selectedSquadIds.includes(gid)) {
          if (this.selectedSquadIds.length > 1) {
            this.selectedSquadIds = this.selectedSquadIds.filter(id => id !== gid);
          }
        } else if (this.selectedSquadIds.length < this.activeChapter.squadLimit) {
          this.selectedSquadIds.push(gid);
        }
        this.ui.renderPreBattle(this.activeChapter, this.campaign, this.selectedSquadIds, this.activeStratagemId, this.getPreBattleHandlers());
      },
      onSelectStratagem: (stratId) => {
        this.activeStratagemId = stratId;
        this.ui.renderPreBattle(this.activeChapter, this.campaign, this.selectedSquadIds, this.activeStratagemId, this.getPreBattleHandlers());
      },
      onStartBattle: () => {
        this.startBattleWithDialogue(this.activeChapter);
      }
    };
  }

  startBattleWithDialogue(chapter) {
    if (chapter.storyBefore && chapter.storyBefore.length > 0) {
      this.ui.showStoryDialogue(chapter.storyBefore, () => {
        this.startDeployPhase(chapter);
      });
    } else {
      this.startDeployPhase(chapter);
    }
  }

  startDeployPhase(chapter) {
    this.activeChapter = chapter;
    this.isDeploying = true;
    this.ui.showScreen('screenBattle');

    const squadInstances = this.selectedSquadIds.map(id => this.campaign.getUnitInstance(id));
    const deployTiles = chapter.deployTiles || [];

    // Pre-place squad in default deploy slots
    this.deployPlacements = squadInstances.map((u, i) => {
      const tile = deployTiles[i] || { x: i, y: 11 };
      return { id: u.id, x: tile.x, y: tile.y, isAmbushed: false };
    });

    // Valid deploy slots
    this.deploySlots = new Set();
    deployTiles.forEach(t => this.deploySlots.add(`${t.x},${t.y}`));

    // If ambush stratagem, any forest 'f' tile is also a deploy slot
    if (this.activeStratagemId === 'ambush') {
      for (let r = 0; r < 13; r++) {
        for (let c = 0; c < 10; c++) {
          if (chapter.terrain[r][c] === 'f') {
            this.deploySlots.add(`${c},${r}`);
          }
        }
      }
    }

    this.selectedDeployUnit = squadInstances[0];

    // Dummy battle object for map rendering during deploy
    this.battle = new Battle(chapter, squadInstances, this.activeStratagemId, this.campaign, this.rng, {
      deployPlacements: this.deployPlacements
    });

    this.refreshDeployUI();
    const tray = document.getElementById('deployTrayBar');
    tray?.classList.remove('scouting');
    const scoutBtn = document.getElementById('btnDeployScout');
    if (scoutBtn) {
      scoutBtn.textContent = '偵察';
      scoutBtn.onclick = () => {
        const on = tray.classList.toggle('scouting');
        scoutBtn.textContent = on ? '佈陣' : '偵察';
        const titleEl = tray.querySelector('.deploy-tray-title');
        if (titleEl) {
          titleEl.textContent = on ? '偵察敵陣中 · 可拖曳縮放' : '排兵布陣 · 點選將士再點選金色部署格';
        }
        if (on) {
          const foes = this.battle.enemies.filter(e => e.hp > 0);
          this.ui.frameTiles(foes.length ? foes : deployTiles, true);
        } else this.frameDeploy(true);
      };
    }
    requestAnimationFrame(() => this.frameDeploy(false));
  }

  frameDeploy(smooth) {
    const tiles = [...(this.activeChapter?.deployTiles || []), ...(this.deployPlacements || [])];
    this.ui.frameTiles(tiles, smooth);
  }

  computeThreatTiles() {
    const set = new Set();
    if (!this.battle) return set;
    for (const e of this.battle.enemies) {
      if (e.hp <= 0) continue;
      const reach = getReachableTiles(this.battle.board, e, this.battle.getAllLivingUnits(), { zoc: true, cursedTiles: this.battle.cursedTiles });
      reach.set(`${e.x},${e.y}`, { x: e.x, y: e.y });
      for (const pos of reach.values()) {
        for (const t of getAttackRangeTiles(this.battle.board, e, pos.x, pos.y)) {
          const char = this.battle.board.getTerrainChar(t.x, t.y);
          if (char === '#' || (char === 'w' && !e.flying)) continue;
          if (this.battle.board.isImpassable(t.x, t.y, e.flying)) continue;
          set.add(`${t.x},${t.y}`);
        }
      }
    }
    return set;
  }

  refreshDeployUI() {
    if (!this.battle || !this.isDeploying) return;
    const placedMap = new Map();
    this.deployPlacements.forEach(p => placedMap.set(p.id, p));

    const squadInstances = this.selectedSquadIds.map(id => this.campaign.getUnitInstance(id));
    this.ui.renderDeployPhase(
      this.activeChapter,
      squadInstances,
      this.activeChapter.deployTiles || [],
      placedMap,
      (unit) => {
        this.selectedDeployUnit = unit;
        this.refreshDeployUI();
      },
      () => {
        this.finalizeDeployAndStartBattle(this.activeChapter);
      }
    );

    this.ui.renderBattle(this.battle, {
      selectedUnit: this.selectedDeployUnit ? this.battle.allies.find(a => a.id === this.selectedDeployUnit.id) : null,
      reachableTiles: new Map(),
      attackableTiles: new Set(),
      aoeTiles: new Set(),
      deploySlots: this.deploySlots,
      threatTiles: this.showThreat ? this.computeThreatTiles() : null,
      onUnitTap: (u) => {
        if (u.team === 'ally' && u.role !== 'npc' && u.role !== 'objective') {
          this.selectedDeployUnit = u;
          this.refreshDeployUI();
        }
      },
      onTileTap: (x, y) => this.handleTileTap(x, y)
    });
  }

  finalizeDeployAndStartBattle(chapter) {
    this.isDeploying = false;
    this.ui.hideDeployPhase();
    this.deploySlots = new Set();
    this.launchBattleInstance(chapter, this.deployPlacements);

    const tutKey = `${GAME.storageKey}_tutorial`;
    if (chapter.id === 1 && !localStorage.getItem(tutKey)) {
      this.startTutorialFlow(0);
    }
  }

  launchBattleInstance(chapter, placements = null) {
    this.isDeploying = false;
    this.ui.hideDeployPhase();
    this.deploySlots = new Set();
    const badgeEl = document.getElementById('txtChapterBadge');
    if (badgeEl) badgeEl.textContent = chapter.id === 7 ? '外傳' : `第${chapter.id}回`;

    const squadInstances = this.selectedSquadIds.map(id => this.campaign.getUnitInstance(id));
    this.battle = new Battle(chapter, squadInstances, this.activeStratagemId, this.campaign, this.rng, {
      deployPlacements: placements || this.deployPlacements
    });

    this.clearSelection();
    this.ui.showScreen('screenBattle');
    this.refreshBattleUI();

    // Center camera on first ally
    if (this.battle.allies.length > 0) {
      requestAnimationFrame(() => this.ui.frameTiles(this.battle.allies.filter(a => a.hp > 0)));
    }
  }

  refreshBattleUI() {
    if (!this.battle) return;

    this.ui.renderBattle(this.battle, {
      selectedUnit: this.selectedUnit,
      reachableTiles: this.reachableTiles,
      attackableTiles: this.attackableTiles,
      aoeTiles: this.aoeTiles,
      validTargetKeys: this.targetingMode ? this.validTargetKeys : null,
      selectedTargetKey: this.targetingMode ? this.pendingTargetKey : null,
      deploySlots: this.deploySlots,
      threatTiles: this.showThreat ? this.computeThreatTiles() : null,
      onUnitTap: (unit) => this.handleUnitTap(unit),
      onTileTap: (x, y) => this.handleTileTap(x, y)
    });

    const btnUndo = document.getElementById('btnUndoMove');
    if (btnUndo) {
      btnUndo.style.display = (this.selectedUnit && this.stagedMoveTile) ? 'inline-flex' : 'none';
    }
  }

  clearSelection() {
    this.selectedUnit = null;
    this.reachableTiles = new Map();
    this.attackableTiles = new Set();
    this.aoeTiles = new Set();
    this.targetingMode = null;
    this.activeActionType = null;
    this.stagedMoveTile = null;
    this.resetTargeting();
    this.ui.hideActionMenu();
    this.ui.hideTargetPreview();
  }

  resetTargeting() {
    this.pendingTargetKey = null;
    this.pendingConfirm = null;
    this.validTargetKeys = new Set();
    this.ui.hideTargetHint?.();
  }

  /** Enter manual targeting: highlight valid targets, show hint, nothing auto-selected. */
  beginTargeting(hint, validKeys) {
    this.pendingTargetKey = null;
    this.pendingConfirm = null;
    this.validTargetKeys = validKeys;
    const unit = this.selectedUnit;
    this.ui.showTargetHint(hint, () => {
      this.aoeTiles = new Set();
      this.resetTargeting();
      this.ui.hideTargetPreview();
      this.activeActionType = null;
      this.targetingMode = null;
      if (unit) this.openActionMenuForUnit(unit);
      this.refreshBattleUI();
    });
    const tiles = [...(validKeys || [])].map(k => { const [x, y] = k.split(',').map(Number); return { x, y }; });
    if (unit) tiles.push(unit);
    requestAnimationFrame(() => this.ui.frameTiles(tiles, true));
  }

  /** Tap on a target: first tap previews, tapping the same target again confirms. */
  tapTarget(key, previewFn) {
    if (this.pendingTargetKey === key && this.pendingConfirm) {
      const fn = this.pendingConfirm;
      this.ui.hideTargetPreview();
      this.resetTargeting();
      fn();
      return;
    }
    this.pendingTargetKey = key;
    previewFn();
    this.refreshBattleUI();
  }

  handleUnitTap(unit) {
    if (this.isDeploying) {
      if (unit.team === 'ally' && unit.role !== 'npc' && unit.role !== 'objective') {
        this.selectedDeployUnit = unit;
        this.refreshDeployUI();
      }
      return;
    }

    if (!this.battle || this.battle.phase !== 'ally') return;

    // If unit is enemy and we are in target mode
    if (unit.team === 'enemy' && this.selectedUnit && this.activeActionType) {
      const key = `${unit.x},${unit.y}`;
      if (this.targetingMode === 'aoe_cross') {
        if (!this.attackableTiles.has(key)) return;
        this.tapTarget(key, () => this.previewAoeCross(unit.x, unit.y, unit));
      } else {
        if (!this.validTargetKeys?.has(key)) {
          const t = document.getElementById('targetHintText');
          if (t) t.textContent = '此敵不在射程內 · 點選紅框內的敵人';
          return;
        }
        this.tapTarget(key, () => this.evaluateTargetPreview(unit));
      }
      return;
    }

    // If unit is ally and we are in heal mode
    if (unit.team === 'ally' && this.targetingMode === 'heal') {
      const key = `${unit.x},${unit.y}`;
      if (!this.attackableTiles.has(key)) return;
      this.tapTarget(key, () => this.evaluateTargetPreview(unit));
      return;
    }

    // If unit is ally and has not acted yet: select it!
    if (unit.team === 'ally' && !unit.acted && unit.role !== 'npc' && unit.role !== 'objective') {
      this.sound?.playSfx('tap');
      this.selectedUnit = unit;
      this.stagedMoveTile = null;
      this.activeActionType = null;
      this.targetingMode = null;
      this.aoeTiles = new Set();
      this.ui.hideActionMenu();
      this.ui.hideTargetPreview();

      // Calculate reachable tiles & attackable outline with general ZOC
      this.reachableTiles = this.battle.getReachableFor(unit, { zoc: true });
      this.attackableTiles = getAttackableTilesFromReachable(this.battle.board, unit, this.reachableTiles, this.battle.getAllLivingUnits());

      this.refreshBattleUI();
      this.ui.centerCameraOn(unit.x, unit.y);
      return;
    }

    // Inspect unit details
    if (unit.team === 'ally') {
      const inst = this.campaign.getUnitInstance(unit.id);
      if (inst) this.ui.showDetailSheet(inst, this.campaign);
    }
  }

  handleTileTap(x, y) {
    if (this.isDeploying) {
      if (this.selectedDeployUnit && this.deploySlots.has(`${x},${y}`)) {
        const existing = this.deployPlacements.find(p => p.x === x && p.y === y);
        const myPlacement = this.deployPlacements.find(p => p.id === this.selectedDeployUnit.id);
        const isForest = this.activeChapter.terrain[y][x] === 'f';
        if (myPlacement) {
          if (existing && existing.id !== myPlacement.id) {
            existing.x = myPlacement.x;
            existing.y = myPlacement.y;
            existing.isAmbushed = this.activeChapter.terrain[existing.y][existing.x] === 'f' && this.activeStratagemId === 'ambush';
          }
          myPlacement.x = x;
          myPlacement.y = y;
          myPlacement.isAmbushed = isForest && this.activeStratagemId === 'ambush';
        }
        this.battle.initUnits(this.selectedSquadIds.map(id => this.campaign.getUnitInstance(id)), { deployPlacements: this.deployPlacements });
        this.refreshDeployUI();
      }
      return;
    }

    if (!this.battle || this.battle.phase !== 'ally') return;

    // Update bottom terrain strip
    this.ui.updateBottomStrip(x, y, this.battle.board, this.battle.getUnitAt(x, y));

    // Fire attack stratagem mode
    if (this.targetingMode === 'fire_stratagem') {
      const ter = this.battle.board.getTerrain(x, y);
      if (ter.char === 'f' || ter.char === 'm') {
        const key = `${x},${y}`;
        if (this.pendingTargetKey !== key) {
          // First tap: preview the 3x3 blaze; tap the same tile again to ignite
          this.pendingTargetKey = key;
          this.previewAoe3x3(x, y);
          const t = document.getElementById('targetHintText');
          if (t) t.textContent = '火攻範圍預覽 · 再點一次同一格點火';
          return;
        }
        this.resetTargeting();
        this.battle.triggerFireAttack(x, y);
        this.targetingMode = null;
        setTimeout(() => {
          this.aoeTiles = new Set();
          this.refreshBattleUI();
        }, 900);
        return;
      }
    }

    // Light placement mode (掛燈)
    if (this.targetingMode === 'light_placement') {
      if (this.attackableTiles.has(`${x},${y}`)) {
        this.confirmActionExecution('skill', null, { tileX: x, tileY: y });
        this.targetingMode = null;
        return;
      }
    }

    // AoE cross mode (狐火 緋)
    if (this.targetingMode === 'aoe_cross') {
      if (this.attackableTiles.has(`${x},${y}`)) {
        this.tapTarget(`${x},${y}`, () => this.previewAoeCross(x, y));
        return;
      }
    }

    // Directional line / cone mode (鶴羽 crane_line_gust / 狐火 flame_fan_cone)
    if (this.targetingMode === 'directional') {
      const key = `${x},${y}`;
      if (this.attackableTiles.has(key)) {
        this.tapTarget(key, () => this.previewDirectional(x, y));
        return;
      }
    }

    // In targeting mode, stray taps never deselect the unit
    if (this.targetingMode) return;

    // Normal move: if unit selected and tap blue tile -> move there!
    if (this.selectedUnit && !this.stagedMoveTile) {
      const key = `${x},${y}`;
      if (this.reachableTiles.has(key)) {
        this.sound?.playSfx('tap');
        this.battle.moveUnit(this.selectedUnit, x, y);
        this.stagedMoveTile = { x, y };
        this.reachableTiles = new Map();

        // Switch to current tile range only
        const curRange = getAttackRangeTiles(this.battle.board, this.selectedUnit, x, y);
        this.attackableTiles = new Set(curRange.filter(t => !this.battle.board.isImpassable(t.x, t.y, false)).map(t => `${t.x},${t.y}`));

        // Pop action menu
        this.openActionMenuForUnit(this.selectedUnit);
        this.refreshBattleUI();
        return;
      }
    }

    // If tapping an empty tile, deselect
    if (!this.stagedMoveTile) {
      this.clearSelection();
      this.refreshBattleUI();
    }
  }

  openActionMenuForUnit(unit) {
    this.reachableTiles = new Map();
    const rangeTiles = getAttackRangeTiles(this.battle.board, unit, unit.x, unit.y);
    this.attackableTiles = new Set(rangeTiles.filter(t => !this.battle.board.isImpassable(t.x, t.y, false)).map(t => `${t.x},${t.y}`));

    const vision = this.battle.isFogActive() ? this.battle.calculateVisionMap() : null;
    const enemiesInRange = this.battle.enemies.filter(e =>
      e.hp > 0 && rangeTiles.some(t => t.x === e.x && t.y === e.y) && canTargetUnit(unit, e, this.battle.board, vision)
    );

    const hasSkill = !!unit.skill;
    const skillCost = unit.skill?.cost || 0;
    const hasMpForSkill = (unit.mp ?? 6) >= skillCost;

    let hasSkillTarget = false;
    if (unit.skill?.isLightPlacement || unit.skill?.aoe === 'line' || unit.skill?.aoe === 'cone') {
      hasSkillTarget = true;
    } else if (unit.skill?.isHeal) {
      const sRange = getAttackRangeTiles(this.battle.board, unit, unit.x, unit.y);
      hasSkillTarget = this.battle.allies.some(a => a.hp > 0 && sRange.some(t => t.x === a.x && t.y === a.y));
    } else if (unit.skill) {
      const sRange = getAttackRangeTiles(this.battle.board, unit, unit.x, unit.y);
      hasSkillTarget = this.battle.enemies.some(e => e.hp > 0 && sRange.some(t => t.x === e.x && t.y === e.y));
    }

    const hasMagic = !!unit.magic;
    const magicCost = unit.magic?.cost || 0;
    const hasMpForMagic = (unit.mp ?? 6) >= magicCost;

    let hasMagicTarget = false;
    if (unit.magic?.selfBuff || unit.magic?.aoe === 'line' || unit.magic?.aoe === 'cone') {
      hasMagicTarget = true;
    } else if (unit.magic?.isHeal) {
      const mRange = getAttackRangeTiles(this.battle.board, unit, unit.x, unit.y);
      hasMagicTarget = this.battle.allies.some(a => a.hp > 0 && mRange.some(t => t.x === a.x && t.y === a.y));
    } else if (unit.magic) {
      const mRange = getAttackRangeTiles(this.battle.board, unit, unit.x, unit.y);
      hasMagicTarget = this.battle.enemies.some(e => e.hp > 0 && mRange.some(t => t.x === e.x && t.y === e.y));
    }

    const bondAvailable = this.battle.checkBondAvailable(unit);

    this.ui.showActionMenu(
      unit.x,
      unit.y,
      {
        attack: enemiesInRange.length > 0,
        attackReason: enemiesInRange.length === 0 ? '無目標' : null,
        skill: hasSkill && hasMpForSkill && hasSkillTarget,
        skillCost,
        skillReason: !hasMpForSkill ? 'MP不足' : (!hasSkillTarget ? '無目標' : null),
        magic: hasMagic && hasMpForMagic && hasMagicTarget,
        magicCost,
        magicReason: !hasMpForMagic ? 'MP不足' : (!hasMagicTarget ? '無目標' : null),
        bond: !!bondAvailable
      },
      (actionType) => {
        this.handleActionMenuChoice(actionType);
      },
      () => {
        this.battle.undoMove(unit);
        this.clearSelection();
        this.refreshBattleUI();
      }
    );
    requestAnimationFrame(() => this.ui.frameTiles([unit, ...enemiesInRange]));
  }

  handleActionMenuChoice(actionType) {
    this.activeActionType = actionType;
    this.ui.hideActionMenu();

    if (actionType === 'wait') {
      this.confirmActionExecution('wait');
      return;
    }

    const unit = this.selectedUnit;
    if (!unit) return;

    // Self-buff magic
    if (actionType === 'magic' && unit.magic?.selfBuff) {
      this.confirmActionExecution('magic', unit);
      return;
    }

    // Lantern placement skill (range 3)
    if (actionType === 'skill' && unit.skill?.isLightPlacement) {
      this.targetingMode = 'light_placement';
      this.reachableTiles = new Map();
      this.attackableTiles = new Set();
      for (let r = 0; r < 13; r++) {
        for (let c = 0; c < 10; c++) {
          if (Board.manhattan(unit.x, unit.y, c, r) <= 3 && !this.battle.board.isImpassable(c, r, false)) {
            this.attackableTiles.add(`${c},${r}`);
          }
        }
      }
      this.refreshBattleUI();
      return;
    }

    // Heal skill or magic (range 2) - tap ally to choose target
    if ((actionType === 'skill' && unit.skill?.isHeal) || (actionType === 'magic' && unit.magic?.isHeal)) {
      this.targetingMode = 'heal';
      this.reachableTiles = new Map();
      const rTiles = getAttackRangeTiles(this.battle.board, unit, unit.x, unit.y);
      this.attackableTiles = new Set(rTiles.map(t => `${t.x},${t.y}`));
      this.beginTargeting('點選要治療的隊友 · 再點一次確認', new Set(this.battle.allies.filter(a => a.hp > 0 && this.attackableTiles.has(`${a.x},${a.y}`)).map(a => `${a.x},${a.y}`)));
      this.refreshBattleUI();
      return;
    }

    // AoE Cross skill or magic (狐火 緋)
    const isAoeCross = (actionType === 'skill' && unit.skill?.aoe === 'cross') ||
                       (actionType === 'magic' && unit.magic?.aoe === 'cross');
    if (isAoeCross) {
      this.targetingMode = 'aoe_cross';
      this.reachableTiles = new Map();
      const rTiles = getAttackRangeTiles(this.battle.board, unit, unit.x, unit.y);
      this.attackableTiles = new Set(rTiles.map(t => `${t.x},${t.y}`));

      this.beginTargeting('點選範圍內任一格作中心 · 再點一次施放', new Set(this.battle.enemies.filter(e => e.hp > 0 && this.attackableTiles.has(`${e.x},${e.y}`)).map(e => `${e.x},${e.y}`)));
      this.refreshBattleUI();
      return;
    }

    // Directional skill or magic (Line or Cone: 鶴羽 crane_line_gust / 狐火 flame_fan_cone)
    const activeSkillObj = actionType === 'skill' ? unit.skill : (actionType === 'magic' ? unit.magic : null);
    const isDirectional = activeSkillObj?.aoe === 'line' || activeSkillObj?.aoe === 'cone';
    if (isDirectional) {
      this.targetingMode = 'directional';
      this.directionalSkill = activeSkillObj;
      this.reachableTiles = new Map();
      const cardinals = [
        { x: unit.x + 1, y: unit.y },
        { x: unit.x - 1, y: unit.y },
        { x: unit.x, y: unit.y + 1 },
        { x: unit.x, y: unit.y - 1 }
      ].filter(t => this.battle.board.inBounds(t.x, t.y));
      this.attackableTiles = new Set(cardinals.map(t => `${t.x},${t.y}`));
      const desc = activeSkillObj.aoe === 'line' ? '直線穿透3格' : '扇形烈焰4格';
      this.beginTargeting(`點選施放朝向（上下左右） · 再點一次施放【${activeSkillObj.name}】(${desc})`, this.attackableTiles);
      this.refreshBattleUI();
      return;
    }

    // Regular single-target attack
    this.targetingMode = 'target_unit';
    this.reachableTiles = new Map();
    const rTiles = getAttackRangeTiles(this.battle.board, unit, unit.x, unit.y);
    this.attackableTiles = new Set(rTiles.filter(t => !this.battle.board.isImpassable(t.x, t.y, false)).map(t => `${t.x},${t.y}`));

    const vision = this.battle.isFogActive() ? this.battle.calculateVisionMap() : null;
    const validTargets = this.battle.enemies.filter(e =>
      e.hp > 0 && rTiles.some(t => t.x === e.x && t.y === e.y) && canTargetUnit(unit, e, this.battle.board, vision)
    );
    this.beginTargeting(validTargets.length > 1 ? '點選紅框內的敵人 · 可隨時換目標' : '點選紅框內的敵人 · 再點一次確認',
      new Set(validTargets.map(e => `${e.x},${e.y}`)));
    this.refreshBattleUI();
  }

  previewAoeCross(cx, cy, focusDefender = null) {
    this.aoeTiles = new Set([
      `${cx},${cy}`,
      `${cx+1},${cy}`,
      `${cx-1},${cy}`,
      `${cx},${cy+1}`,
      `${cx},${cy-1}`
    ]);
    const target = focusDefender || this.battle.getUnitAt(cx, cy) || this.battle.enemies.find(e => e.hp > 0 && this.aoeTiles.has(`${e.x},${e.y}`));
    if (target) {
      this.evaluateTargetPreview(target, { tileX: cx, tileY: cy });
    }
    this.refreshBattleUI();
  }

  previewDirectional(x, y) {
    const unit = this.selectedUnit;
    if (!unit || !this.directionalSkill) return;
    const dx = x - unit.x;
    const dy = y - unit.y;
    let tiles = [];
    if (this.directionalSkill.aoe === 'cone') {
      tiles = Board.getConeTiles(unit.x, unit.y, dx, dy);
    } else {
      tiles = Board.getLineTiles(unit.x, unit.y, dx, dy, this.directionalSkill.lineLength || 3);
    }
    this.aoeTiles = new Set(tiles.map(t => `${t.x},${t.y}`));

    const livingEnemies = this.battle.enemies.filter(e => e.hp > 0);
    const hitEnemies = livingEnemies.filter(e => this.aoeTiles.has(`${e.x},${e.y}`));
    const target = hitEnemies[0] || null;

    if (target) {
      this.evaluateTargetPreview(target, { dx, dy, skill: this.directionalSkill });
    } else {
      // Empty direction preview with confirm callback
      const preview = {
        attacker: unit,
        defender: { name: '指定方向', hp: 0, maxHp: 0, cls: '空地' },
        direction: 'front',
        isBackAttack: false,
        isSideAttack: false,
        expectedDamage: this.directionalSkill.power || 12,
        hitRate: 100,
        critRate: 0,
        canCounter: false,
        willKill: false
      };
      const actionType = this.activeActionType;
      this.pendingConfirm = () => this.confirmActionExecution(actionType, null, { dx, dy, skill: this.directionalSkill });
      this.ui.showTargetPreview(
        preview,
        () => {
          this.resetTargeting();
          this.confirmActionExecution(actionType, null, { dx, dy, skill: this.directionalSkill });
        },
        () => {
          this.aoeTiles = new Set();
          this.resetTargeting();
          this.activeActionType = null;
          this.targetingMode = null;
          this.openActionMenuForUnit(unit);
          this.refreshBattleUI();
        }
      );
    }
    this.refreshBattleUI();
  }

  previewAoe3x3(cx, cy) {
    this.aoeTiles = new Set();
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (this.battle.board.inBounds(cx + dx, cy + dy)) {
          this.aoeTiles.add(`${cx + dx},${cy + dy}`);
        }
      }
    }
    this.refreshBattleUI();
  }

  evaluateTargetPreview(defender, options = {}) {
    const unit = this.selectedUnit;
    if (!unit || !defender) return;

    const skill = this.activeActionType === 'skill' ? unit.skill : (this.activeActionType === 'magic' ? unit.magic : null);
    const preview = calculateCombat(unit, defender, this.battle.board, {
      actionType: this.activeActionType,
      skill,
      attackerX: unit.x,
      attackerY: unit.y,
      allies: this.battle.allies,
      synergies: this.battle.synergies
    });

    const actionType = this.activeActionType;
    this.pendingConfirm = () => this.confirmActionExecution(actionType, defender, options);
    this.ui.showTargetPreview(
      preview,
      () => {
        this.resetTargeting();
        this.confirmActionExecution(actionType, defender, options);
      },
      () => {
        this.aoeTiles = new Set();
        this.resetTargeting();
        this.activeActionType = null;
        this.targetingMode = null;
        this.openActionMenuForUnit(unit);
        this.refreshBattleUI();
      }
    );
  }

  confirmActionExecution(actionType, target = null, options = {}) {
    if (!this.battle || !this.selectedUnit) return;

    const actingUnit = this.selectedUnit;
    const res = this.battle.confirmAction(actingUnit, actionType, target, options);
    this.sound?.playSfx('hit');

    // Trigger voice bark banner on skill / magic / combo
    if (actionType === 'skill' || actionType === 'magic') {
      const skillName = options.skill?.name || (actionType === 'magic' ? actingUnit.magic?.name : actingUnit.skill?.name) || '絕技';
      this.ui.showCombatBark(actingUnit, `【${actingUnit.name} · ${skillName}】`, actingUnit.bark || `「${skillName}，破陣！」`);
    } else if (res.events?.some(e => e.type === 'combo_hit')) {
      const comboEv = res.events.find(e => e.type === 'combo_hit');
      const ally = this.battle.allies.find(a => a.id === comboEv.allyId) || actingUnit;
      this.ui.showCombatBark(ally, `【${ally.name} · 協力攻擊】`, ally.bark || '「吾來助陣，同破頑敵！」');
    }

    // Extract combat hit event
    const hitEv = res.events?.find(e => e.type === 'hit');
    const isMiss = res.events?.some(e => e.type === 'miss');
    const combatInfo = {
      actionType,
      element: options.skill?.element || actingUnit.element || (actionType === 'magic' ? 'thunder' : null),
      damage: hitEv?.damage ?? 10,
      isCrit: hitEv?.isCrit || false,
      isBackAttack: hitEv?.isBackAttack || false,
      isSideAttack: hitEv?.isSideAttack || false,
      isHighGround: hitEv?.isHighGround || false,
      isFrontBlocked: hitEv?.isFrontBlocked || (target?.role === 'shield_guard' && hitEv?.direction === 'front'),
      defBonus: hitEv?.defBonus || 0,
      isWeakness: hitEv?.elementWeakness || false,
      isHeal: actionType === 'skill' && actingUnit.skill?.isHeal,
      healAmount: 8,
      isMiss
    };

    if (target) {
      this.ui.playCombatVfx(actingUnit, target, combatInfo, this.battleSpeed, () => {
        this.afterActionResolved(res, actingUnit);
      });
    } else {
      this.afterActionResolved(res, actingUnit);
    }
  }

  afterActionResolved(res, actingUnit) {
    // Check level up
    if (res.levelUp?.leveledUp) {
      const uId = actingUnit.id;
      const uInst = this.campaign.getUnitInstance(uId);
      setTimeout(() => {
        this.ui.showLevelUpModal(uInst, (perkType) => {
          this.campaign.applyPerkChoice(uId, perkType);
        });
      }, 500);
    }

    this.clearSelection();
    this.refreshBattleUI();

    // Check battle victory / defeat
    if (this.battle.status.finished) {
      setTimeout(() => {
        this.ui.showBattleResult(this.battle.status, this.activeChapter, () => {
          if (this.battle.status.victory) {
            this.handlePostBattleEvents(this.activeChapter, () => {
              this.openWorldMap();
            });
          } else {
            this.openWorldMap();
          }
        }, this.campaign, this.battle.allies, this.battle);
      }, 600);
      return;
    }

    // Check if ally phase ended
    if (this.battle.isAllyPhaseComplete()) {
      setTimeout(() => {
        this.triggerEnemyTurn();
      }, 400);
    }
  }

  handlePostBattleEvents(chapter, onFinish) {
    if (!chapter) {
      if (onFinish) onFinish();
      return;
    }

    // Chapter 1 recruit: 鶴羽 (crane_rider)
    if (chapter.id === 1 && !this.ch1RecruitSeen) {
      this.ch1RecruitSeen = true;
      if (this.campaign.roster['crane_rider']) this.campaign.roster['crane_rider'].unlocked = true;
      this.ui.showRecruitModal('crane_rider', () => {
        if (onFinish) onFinish();
      });
      return;
    }

    // Chapter 2 route event: 官道分水嶺 (整備兵刃 vs 安撫將士)
    if (chapter.id === 2 && !this.ch2EventChosen) {
      this.ch2EventChosen = true;
      const eventData = {
        title: '【行軍奇遇 · 官道分水嶺】',
        desc: '突破雄關後，大軍暫憩於山麓驛站。軍師請將軍定奪休整方略：',
        options: [
          {
            text: '【整備兵刃】全軍將士磨礪鋒刃，攻擊力暫時提升 +1',
            effect: 'atk',
            apply: () => {
              for (const u of Object.values(this.campaign.roster)) {
                if (!u.bonusStats) u.bonusStats = { atk: 0, def: 0, mag: 0, res: 0, maxHp: 0, mov: 0 };
                u.bonusStats.atk = (u.bonusStats.atk || 0) + 1;
              }
              this.campaign.save();
            }
          },
          {
            text: '【安撫將士】靈湯滋補，全軍氣血上限永久提升 +3',
            effect: 'hp',
            apply: () => {
              for (const u of Object.values(this.campaign.roster)) {
                if (!u.bonusStats) u.bonusStats = { atk: 0, def: 0, mag: 0, res: 0, maxHp: 0, mov: 0 };
                u.bonusStats.maxHp = (u.bonusStats.maxHp || 0) + 3;
              }
              this.campaign.save();
            }
          }
        ]
      };
      this.ui.showRouteEventModal(eventData, (chosenOpt) => {
        if (chosenOpt?.apply) chosenOpt.apply();
        if (onFinish) onFinish();
      });
      return;
    }

    // Chapter 3 recruit: 狐火 緋 (fox_maiden)
    if (chapter.id === 3 && !this.ch3RecruitSeen) {
      this.ch3RecruitSeen = true;
      if (this.campaign.roster['fox_maiden']) this.campaign.roster['fox_maiden'].unlocked = true;
      this.ui.showRecruitModal('fox_maiden', () => {
        if (onFinish) onFinish();
      });
      return;
    }

    // Chapter 4 route event: 天池靈泉與古碑 (飲泉固本 vs 參悟石刻)
    if (chapter.id === 4 && !this.ch4EventChosen) {
      this.ch4EventChosen = true;
      const eventData = {
        title: '【行軍奇遇 · 天池靈泉與古碑】',
        desc: '踏破雲海大壩，山巔靈泉與上古石刻映入眼簾：',
        options: [
          {
            text: '【飲天池靈泉】全軍法力上限提升 +2，精神飽滿',
            effect: 'mp',
            apply: () => {
              for (const u of Object.values(this.campaign.roster)) {
                if (!u.bonusStats) u.bonusStats = { atk: 0, def: 0, mag: 0, res: 0, maxHp: 0, mov: 0 };
                u.bonusStats.res = (u.bonusStats.res || 0) + 1;
              }
              this.campaign.save();
            }
          },
          {
            text: '【參悟石刻古陣】全體將士領悟玄機，獲得 +50 點功勳 EXP',
            effect: 'exp',
            apply: () => {
              for (const id of Object.keys(this.campaign.roster)) {
                this.campaign.addExp(id, 50);
              }
              this.campaign.save();
            }
          }
        ]
      };
      this.ui.showRouteEventModal(eventData, (chosenOpt) => {
        if (chosenOpt?.apply) chosenOpt.apply();
        if (onFinish) onFinish();
      });
      return;
    }

    if (onFinish) onFinish();
  }

  triggerEnemyTurn() {
    if (!this.battle || this.battle.phase === 'finished') return;
    this.battle.phase = 'enemy';

    const phasePill = document.getElementById('hudPhasePill');
    if (phasePill) {
      phasePill.textContent = '敵方回合';
      phasePill.className = 'battle-phase-pill enemy';
    }

    this.ui.showTurnBanner('敵方回合', '夜霧湧動 · 敵軍進犯', () => {
      this.battle.endTurn();
      this.refreshBattleUI();

      if (this.battle.status.finished) {
        this.ui.showBattleResult(this.battle.status, this.activeChapter, () => {
          if (this.battle.status.victory) {
            this.handlePostBattleEvents(this.activeChapter, () => {
              this.openWorldMap();
            });
          } else {
            this.openWorldMap();
          }
        }, this.campaign, this.battle.allies, this.battle);
        return;
      }

      this.ui.showTurnBanner('我方回合', '凝燈為陣 · 破霧出擊', () => {
        if (phasePill) {
          phasePill.textContent = '我方回合';
          phasePill.className = 'battle-phase-pill ally';
        }
        this.refreshBattleUI();
      });
    });
  }

  // ================= LIVE BOARD SPOTLIGHT TUTORIAL =================
  startTutorialFlow(startStep = 0) {
    this.isDeploying = false;
    this.ui.hideDeployPhase();
    this.deploySlots = new Set();

    const isFromTitle = document.getElementById('screenTitle')?.classList.contains('active');
    const isFromMap = document.getElementById('screenWorldMap')?.classList.contains('active');
    const previousScreen = isFromTitle ? 'screenTitle' : (isFromMap ? 'screenWorldMap' : 'screenBattle');

    // Snapshot player battle state before running tutorial demo
    const savedBattle = this.battle;
    const savedChapter = this.activeChapter || CHAPTERS[0];
    const savedPlacements = this.deployPlacements;
    const savedStratagem = this.activeStratagemId;

    const badgeEl = document.getElementById('txtChapterBadge');
    if (badgeEl) badgeEl.textContent = '第1回';

    // If already in live Ch1 battle, use it directly; otherwise instantiate clean Ch1 battle
    if (!this.battle || this.battle.chapter?.id !== 1) {
      const squad = ['bear_guard', 'cat_patrol', 'lantern_crafter', 'tea_master'].map(id => this.campaign.getUnitInstance(id));
      this.battle = new Battle(CHAPTERS[0], squad, this.activeStratagemId || 'inspire', this.campaign, this.rng);
    }
    this.ui.showScreen('screenBattle');

    const updateSpotlight = (targetEl) => {
      const overlay = document.getElementById('tutorialBoardOverlay');
      if (overlay && targetEl) {
        const r = targetEl.getBoundingClientRect();
        const or = overlay.getBoundingClientRect();
        const cx = r.left + r.width / 2 - or.left;
        const cy = r.top + r.height / 2 - or.top;
        overlay.style.setProperty('--spotlight-x', `${cx}px`);
        overlay.style.setProperty('--spotlight-y', `${cy}px`);
        // If target is in lower portion of screen (rows >= 7), park card at top so unit and movement tiles remain bright and visible
        if (cy > or.height * 0.45) {
          overlay.classList.add('card-at-top');
        } else {
          overlay.classList.remove('card-at-top');
        }
      }
    };

    const updateStepView = (step) => {
      document.querySelectorAll('.spotlight-active').forEach(el => el.classList.remove('spotlight-active'));

      if (step === 0) {
        // Beat 1: Move (移動)
        this.clearSelection();
        this.ui.hideActionMenu();
        this.ui.hideTargetPreview();
        const bear = this.battle.allies.find(a => a.id === 'bear_guard');
        if (bear) {
          bear.x = 1; bear.y = 11;
          bear.turnStartX = 1; bear.turnStartY = 11;
          this.handleUnitTap(bear);
          this.ui.centerCameraOn(bear.x, bear.y);
          const tileEl = document.querySelector(`.grid-tile[data-x="${bear.x}"][data-y="${bear.y}"]`);
          if (tileEl) {
            tileEl.classList.add('spotlight-active');
            updateSpotlight(tileEl);
          }
        }
      } else if (step === 1) {
        // Beat 2: Attack (攻擊)
        this.clearSelection();
        this.ui.hideTargetPreview();
        const bear = this.battle.allies.find(a => a.id === 'bear_guard');
        const foe = this.battle.enemies[0];
        if (bear && foe) {
          bear.x = foe.x; bear.y = foe.y + 1;
          bear.turnStartX = bear.x; bear.turnStartY = bear.y;
          this.selectedUnit = bear;
          this.openActionMenuForUnit(bear);
          this.refreshBattleUI();
          this.ui.centerCameraOn(bear.x, bear.y);
          const pop = document.getElementById('actionMenuPopover');
          if (pop) {
            pop.classList.add('spotlight-active');
            updateSpotlight(pop);
          }
        }
      } else if (step === 2) {
        // Beat 3: Terrain (地形)
        this.clearSelection();
        this.ui.hideActionMenu();
        this.ui.hideTargetPreview();
        const cat = this.battle.allies.find(a => a.id === 'cat_patrol');
        if (cat) {
          cat.x = 2; cat.y = 7; // Forest tile with DEF bonus
          cat.turnStartX = 2; cat.turnStartY = 7;
          this.selectedUnit = cat;
          this.refreshBattleUI();
          this.ui.centerCameraOn(cat.x, cat.y);
          const tileEl = document.querySelector(`.grid-tile[data-x="${cat.x}"][data-y="${cat.y}"]`);
          if (tileEl) {
            tileEl.classList.add('spotlight-active');
            updateSpotlight(tileEl);
          }
        }
      } else if (step === 3) {
        // Beat 4: Counter / Flank (反擊與側翼背刺)
        this.clearSelection();
        this.ui.hideActionMenu();
        const cat = this.battle.allies.find(a => a.id === 'cat_patrol');
        const foe = this.battle.enemies[0];
        if (cat && foe) {
          foe.facing = 1; // Facing East
          cat.x = foe.x - 1; cat.y = foe.y; // Attacking from West = Back Attack!
          cat.turnStartX = cat.x; cat.turnStartY = cat.y;
          this.selectedUnit = cat;
          this.activeActionType = 'attack';
          this.evaluateTargetPreview(foe);
          this.ui.centerCameraOn(foe.x, foe.y);
          const card = document.getElementById('targetPreviewCard');
          if (card) {
            card.classList.add('spotlight-active');
            updateSpotlight(card);
          }
        }
      } else if (step === 4) {
        // Beat 5: Light (引魂明燈)
        this.clearSelection();
        this.ui.hideActionMenu();
        this.ui.hideTargetPreview();
        const cart = this.battle.allies.find(a => a.id === 'lantern_cart') || this.battle.allies.find(a => a.id === 'lantern_crafter');
        if (cart) {
          this.handleUnitTap(cart);
          this.ui.centerCameraOn(cart.x, cart.y);
          const tileEl = document.querySelector(`.grid-tile[data-x="${cart.x}"][data-y="${cart.y}"]`);
          if (tileEl) {
            tileEl.classList.add('spotlight-active');
            updateSpotlight(tileEl);
          }
        }
      } else if (step === 5) {
        // Beat 6: Spell (奇術/絕技)
        this.clearSelection();
        this.ui.hideTargetPreview();
        const caster = this.battle.allies.find(a => a.id === 'lantern_crafter') || this.battle.allies.find(a => a.id === 'tea_master');
        if (caster) {
          caster.x = 2; caster.y = 10;
          caster.turnStartX = 2; caster.turnStartY = 10;
          this.selectedUnit = caster;
          this.openActionMenuForUnit(caster);
          this.refreshBattleUI();
          this.ui.centerCameraOn(caster.x, caster.y);
          const btnSkill = document.getElementById('btnActionSkill');
          if (btnSkill) {
            btnSkill.classList.add('spotlight-active');
            updateSpotlight(btnSkill);
          }
        }
      } else if (step === 6) {
        // Beat 7: Stratagem (軍略妙計)
        this.clearSelection();
        this.ui.hideActionMenu();
        this.ui.hideTargetPreview();
        this.refreshBattleUI();
        const stratBtn = document.getElementById('btnStratagemTop');
        if (stratBtn) {
          stratBtn.classList.add('spotlight-active');
          updateSpotlight(stratBtn);
        }
      }
    };

    const handleSuggest = (step) => {
      document.querySelectorAll('.spotlight-active').forEach(el => el.classList.remove('spotlight-active'));
      if (step === 0) {
        // Suggest move: moves bear to (4, 9)
        const bear = this.battle.allies.find(a => a.id === 'bear_guard');
        if (bear) {
          this.battle.moveUnit(bear, 4, 9);
          this.stagedMoveTile = { x: 4, y: 9 };
          this.openActionMenuForUnit(bear);
          this.refreshBattleUI();
        }
      } else if (step === 1) {
        // Suggest attack: attacks enemy
        const foe = this.battle.enemies[0];
        if (foe && this.selectedUnit) {
          this.activeActionType = 'attack';
          this.evaluateTargetPreview(foe);
        }
      } else if (step === 2) {
        // Suggest terrain: moves to forest (2, 7)
        const cat = this.battle.allies.find(a => a.id === 'cat_patrol');
        if (cat) {
          this.battle.moveUnit(cat, 2, 7);
          this.refreshBattleUI();
        }
      } else if (step === 3) {
        // Suggest back attack execution
        const foe = this.battle.enemies[0];
        if (foe && this.selectedUnit) {
          this.confirmActionExecution('attack', foe);
        }
      } else if (step === 4) {
        // Suggest light: moves cart
        const cart = this.battle.allies.find(a => a.id === 'lantern_cart');
        if (cart) {
          this.battle.moveUnit(cart, cart.x + 1, cart.y - 1);
          this.refreshBattleUI();
        }
      } else if (step === 5) {
        // Suggest spell: Lantern Crafter skill/magic
        const caster = this.battle.allies.find(a => a.id === 'lantern_crafter') || this.battle.allies.find(a => a.id === 'tea_master');
        if (caster) {
          this.selectedUnit = caster;
          this.handleActionMenuChoice('skill');
        }
      } else if (step === 6) {
        // Suggest stratagem
        this.ui.showStratagemModal(this.activeStratagemId || 'inspire');
      }
    };

    this.ui.showBoardTutorial(startStep, updateStepView, () => {
      const tutKey = `${GAME.storageKey}_tutorial`;
      localStorage.setItem(tutKey, '1');
      localStorage.setItem('lt_tutorial_seen', '1');
      document.querySelectorAll('.spotlight-active').forEach(el => el.classList.remove('spotlight-active'));
      const overlay = document.getElementById('tutorialBoardOverlay');
      if (overlay) overlay.classList.remove('card-at-top');
      this.clearSelection();
      this.ui.hideActionMenu();
      this.ui.hideTargetPreview();

      if (isFromTitle || isFromMap) {
        // Restore prior screen and battle state
        this.battle = savedBattle;
        this.ui.showScreen(previousScreen);
      } else {
        this.refreshBattleUI();
      }
    }, handleSuggest);
  }

  // ================= DEBUG & TEST HOOKS =================
  setupDebugHooks() {
    window.__lt = {
      app: this,
      getBattle: () => this.battle,
      getCampaign: () => this.campaign,
      showScreen: (s) => this.ui.showScreen(s),
      openWorldMap: () => this.openWorldMap(),
      openCamp: (unitId = 'cat_patrol') => this.openCampScreen(unitId),
      openPreBattle: (chId = 1) => {
        const ch = CHAPTERS.find(c => c.id === chId) || CHAPTERS[0];
        this.openPreBattle(ch);
      },
      openDeployPhase: (chId = 1) => {
        const ch = CHAPTERS.find(c => c.id === chId) || CHAPTERS[0];
        const badgeEl = document.getElementById('txtChapterBadge');
        if (badgeEl) badgeEl.textContent = ch.id === 7 ? '外傳' : `第${ch.id}回`;
        if (ch.id === 1) {
          this.selectedSquadIds = ['bear_guard', 'cat_patrol', 'lantern_crafter', 'tea_master'];
        } else {
          const defaultComps = {
            2: ['tanuki_mage', 'bear_guard', 'tea_master', 'cat_patrol', 'lantern_crafter'],
            3: ['lantern_crafter', 'fox_maiden', 'bear_guard', 'tea_master', 'cat_patrol'],
            4: ['bear_guard', 'cat_patrol', 'crane_rider', 'tea_master', 'tanuki_mage', 'lantern_crafter'],
            5: ['lantern_crafter', 'bear_guard', 'tea_master', 'cat_patrol', 'tanuki_mage', 'crane_rider'],
            6: ['bear_guard', 'tea_master', 'crane_rider', 'cat_patrol', 'fox_maiden', 'tanuki_mage'],
            7: ['bear_guard', 'tea_master', 'cat_patrol', 'lantern_crafter', 'crane_rider'],
            8: ['bear_guard', 'tea_master', 'cat_patrol', 'lantern_crafter', 'crane_rider', 'fox_maiden']
          };
          this.selectedSquadIds = defaultComps[ch.id] || Object.keys(GUARDIAN_PROTOS).slice(0, ch.squadLimit);
        }
        this.startDeployPhase(ch);
      },
      launchBattle: (chId = 1) => {
        const ch = CHAPTERS.find(c => c.id === chId) || CHAPTERS[0];
        this.launchBattleInstance(ch);
      },
      selectUnit: (unitId) => {
        const u = this.battle?.allies.find(a => a.id === unitId);
        if (u) this.handleUnitTap(u);
      },
      openActionMenuForSelected: () => {
        if (this.selectedUnit) {
          this.openActionMenuForUnit(this.selectedUnit);
        }
      },
      openTargetPreviewForSelected: (enemyId) => {
        const e = this.battle?.enemies.find(en => en.id === enemyId) || this.battle?.enemies[0];
        if (e && this.selectedUnit) {
          this.activeActionType = 'attack';
          this.evaluateTargetPreview(e);
        }
      },
      showTutorial: (step = 0) => this.startTutorialFlow(step),
      showTacticsTutorial: () => this.ui.showTacticsTutorialModal(),
      showRecruit: (id = 'crane_rider') => this.ui.showRecruitModal(id, () => {}),
      showRouteEvent: () => this.handlePostBattleEvents({ id: 2 }, () => {}),
      showLevelUp: (unitId = 'cat_patrol') => {
        const inst = this.campaign.getUnitInstance(unitId);
        const newLevel = Math.max(2, (inst.level || 1) + 1);
        inst.level = newLevel;
        this.ui.showLevelUpModal(inst, newLevel, () => {});
      },
      triggerSpellVfx: (element = 'fire') => {
        const target = this.battle?.enemies[0] || { id: 'dummy', x: 5, y: 3 };
        const attacker = this.battle?.allies[0] || { id: 'dummy_atk', x: 4, y: 3 };
        this.ui.playCombatVfx(attacker, target, {
          actionType: 'magic',
          element,
          damage: 14,
          isCrit: element === 'fire',
          isWeakness: element === 'thunder',
          isHeal: element === 'heal'
        }, 1);
      },
      triggerComboVfx: () => {
        const target = this.battle?.enemies[0] || { id: 'dummy', x: 5, y: 3 };
        const attacker = this.battle?.allies[0] || { id: 'cat_patrol', x: 4, y: 3 };
        const comboAlly = this.battle?.allies[1] || { id: 'bear_guard', name: '熊岳', x: 5, y: 2 };
        this.ui.playCombatVfx(attacker, target, {
          actionType: 'attack',
          damage: 12,
          isCrit: false,
          comboAlly,
          comboDamage: 6
        }, 1);
      },
      showBattleResultModal: (victory = true, chId = 1) => {
        const ch = CHAPTERS.find(c => c.id === chId) || CHAPTERS[0];
        const status = { victory, reason: victory ? '天光破曉 · 突破隘口' : '夜霧重重 · 退守整軍' };
        this.ui.showBattleResult(status, ch, () => {}, this.campaign, this.battle?.allies, this.battle);
      },
      openCampScreen: (unitId = 'cat_patrol') => {
        this.openCampScreen(unitId);
      },
      showDialogue: (chId = 1) => {
        const ch = CHAPTERS.find(c => c.id === chId) || CHAPTERS[0];
        this.ui.showStoryDialogue(ch.storyBefore);
      },
      showDetailSheet: (unitId = 'cat_patrol') => {
        const inst = this.campaign.getUnitInstance(unitId) || ENEMY_PROTOS[unitId];
        this.ui.showDetailSheet(inst, this.campaign);
      },
      showEnemyTurnBanner: () => {
        this.clearSelection();
        this.ui.hideActionMenu();
        this.ui.hideTargetPreview();
        if (this.battle) {
          this.battle.phase = 'enemy';
        }
        this.refreshBattleUI();
        const phasePill = document.getElementById('hudPhasePill');
        if (phasePill) {
          phasePill.textContent = '敵方回合';
          phasePill.className = 'battle-phase-pill enemy';
        }
        this.ui.showTurnBanner('敵方回合', '夜霧湧動 · 敵軍進犯');
      }
    };
  }
}

// Instantiate on DOM load or immediately if already loaded
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    window.app = new LanternTacticsApp();
  });
} else {
  window.app = new LanternTacticsApp();
}
