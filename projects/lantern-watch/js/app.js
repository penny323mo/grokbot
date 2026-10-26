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
    this.selectedSquadIds = ['cat_patrol', 'lantern_crafter', 'bear_guard', 'tea_master'];
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

  openPreBattle(chapter) {
    this.activeChapter = chapter;
    const allGuardianIds = Object.keys(GUARDIAN_PROTOS);
    this.selectedSquadIds = allGuardianIds.slice(0, chapter.squadLimit);
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
    if (deployTiles.length > 0) {
      this.ui.centerCameraOn(deployTiles[0].x, deployTiles[0].y);
    }
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

    const squadInstances = this.selectedSquadIds.map(id => this.campaign.getUnitInstance(id));
    this.battle = new Battle(chapter, squadInstances, this.activeStratagemId, this.campaign, this.rng, {
      deployPlacements: placements || this.deployPlacements
    });

    this.clearSelection();
    this.ui.showScreen('screenBattle');
    this.refreshBattleUI();

    // Center camera on first ally
    if (this.battle.allies.length > 0) {
      this.ui.centerCameraOn(this.battle.allies[0].x, this.battle.allies[0].y);
    }
  }

  refreshBattleUI() {
    if (!this.battle) return;

    this.ui.renderBattle(this.battle, {
      selectedUnit: this.selectedUnit,
      reachableTiles: this.reachableTiles,
      attackableTiles: this.attackableTiles,
      aoeTiles: this.aoeTiles,
      deploySlots: this.deploySlots,
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
    this.ui.hideActionMenu();
    this.ui.hideTargetPreview();
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
      if (this.targetingMode === 'aoe_cross') {
        this.previewAoeCross(unit.x, unit.y, unit);
      } else {
        this.evaluateTargetPreview(unit);
      }
      return;
    }

    // If unit is ally and we are in heal mode
    if (unit.team === 'ally' && this.targetingMode === 'heal') {
      this.evaluateTargetPreview(unit);
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

      // Calculate reachable tiles & attackable outline
      this.reachableTiles = this.battle.getReachableFor(unit);
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
        this.previewAoe3x3(x, y);
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
        this.previewAoeCross(x, y);
        return;
      }
    }

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

    const enemiesInRange = this.battle.enemies.filter(e =>
      e.hp > 0 && rangeTiles.some(t => t.x === e.x && t.y === e.y) && canTargetUnit(unit, e, this.battle.board)
    );

    const hasSkill = !!unit.skill;
    const skillCost = unit.skill?.cost || 0;
    const hasMpForSkill = (unit.mp ?? 6) >= skillCost;

    let hasSkillTarget = false;
    if (unit.skill?.isLightPlacement) {
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
    if (unit.magic?.selfBuff) {
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

      const firstEnemy = this.battle.enemies.find(e => e.hp > 0 && rTiles.some(t => t.x === e.x && t.y === e.y));
      if (firstEnemy) {
        this.previewAoeCross(firstEnemy.x, firstEnemy.y, firstEnemy);
      }
      this.refreshBattleUI();
      return;
    }

    // Regular single-target attack
    this.targetingMode = 'target_unit';
    this.reachableTiles = new Map();
    const rTiles = getAttackRangeTiles(this.battle.board, unit, unit.x, unit.y);
    this.attackableTiles = new Set(rTiles.filter(t => !this.battle.board.isImpassable(t.x, t.y, false)).map(t => `${t.x},${t.y}`));

    const validTargets = this.battle.enemies.filter(e =>
      e.hp > 0 && rTiles.some(t => t.x === e.x && t.y === e.y) && canTargetUnit(unit, e, this.battle.board)
    );
    if (validTargets.length > 0) {
      this.evaluateTargetPreview(validTargets[0]);
    }
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
      allies: this.battle.allies
    });

    this.ui.showTargetPreview(
      preview,
      () => {
        this.confirmActionExecution(this.activeActionType, defender, options);
      },
      () => {
        this.aoeTiles = new Set();
        this.openActionMenuForUnit(unit);
      }
    );
  }

  confirmActionExecution(actionType, target = null, options = {}) {
    if (!this.battle || !this.selectedUnit) return;

    const actingUnit = this.selectedUnit;
    const res = this.battle.confirmAction(actingUnit, actionType, target, options);
    this.sound?.playSfx('hit');

    // Extract combat hit event
    const hitEv = res.events?.find(e => e.type === 'hit');
    const isMiss = res.events?.some(e => e.type === 'miss');
    const combatInfo = {
      actionType,
      element: options.skill?.element || actingUnit.element || (actionType === 'magic' ? 'thunder' : null),
      damage: hitEv?.damage ?? 10,
      isCrit: hitEv?.isCrit || false,
      isBackAttack: hitEv?.isBackAttack || false,
      isFrontBlocked: target?.role === 'shield_guard' && hitEv?.direction === 'front',
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
          this.openWorldMap();
        }, this.campaign, this.battle.allies);
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
          this.openWorldMap();
        }, this.campaign, this.battle.allies);
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
    const isFromTitle = document.getElementById('screenTitle')?.classList.contains('active');
    const isFromMap = document.getElementById('screenWorldMap')?.classList.contains('active');
    const previousScreen = isFromTitle ? 'screenTitle' : (isFromMap ? 'screenWorldMap' : 'screenBattle');

    // Snapshot player battle state before running tutorial demo
    const savedBattle = this.battle;
    const savedChapter = this.activeChapter || CHAPTERS[0];
    const savedPlacements = this.deployPlacements;
    const savedStratagem = this.activeStratagemId;

    // Use a clean, isolated demo battle for tutorial steps so live battle is untouched
    const squad = ['cat_patrol', 'lantern_crafter', 'tea_master', 'bear_guard'].map(id => this.campaign.getUnitInstance(id));
    this.battle = new Battle(CHAPTERS[0], squad, 'inspire', this.campaign, this.rng);
    this.ui.showScreen('screenBattle');

    const updateStepView = (step) => {
      document.querySelectorAll('.spotlight-active').forEach(el => el.classList.remove('spotlight-active'));

      if (step === 0) {
        // Step 0: Unit selected, blue tiles glow + spotlight on unit/reachable
        this.clearSelection();
        this.ui.hideActionMenu();
        this.ui.hideTargetPreview();
        const cat = this.battle.allies.find(a => a.id === 'cat_patrol');
        if (cat) {
          cat.x = 1;
          cat.y = 8;
          cat.turnStartX = 1;
          cat.turnStartY = 8;
          this.handleUnitTap(cat);
          this.ui.centerCameraOn(cat.x, cat.y);
          const tileEl = document.querySelector(`.grid-tile[data-x="${cat.x}"][data-y="${cat.y}"]`);
          if (tileEl) tileEl.classList.add('spotlight-active');
        }
      } else if (step === 1) {
        // Step 1: Unit moves, action menu opens + spotlight on menu
        this.clearSelection();
        this.ui.hideTargetPreview();
        const cat = this.battle.allies.find(a => a.id === 'cat_patrol');
        if (cat) {
          this.selectedUnit = cat;
          this.battle.moveUnit(cat, 0, 9);
          this.stagedMoveTile = { x: 0, y: 9 };
          this.openActionMenuForUnit(cat);
          this.refreshBattleUI();
          this.ui.centerCameraOn(cat.x, Math.max(0, cat.y - 2));
          const pop = document.getElementById('actionMenuPopover');
          if (pop) pop.classList.add('spotlight-active');
        }
      } else if (step === 2) {
        // Step 2: Red attack range + target preview card with spotlight
        this.ui.hideActionMenu();
        const cat = this.battle.allies.find(a => a.id === 'cat_patrol');
        const enemy = this.battle.enemies[0];
        if (cat && enemy) {
          cat.x = enemy.x;
          cat.y = enemy.y - 1;
          cat.turnStartX = cat.x;
          cat.turnStartY = cat.y;
          enemy.facing = 1;
          this.selectedUnit = cat;
          this.activeActionType = 'attack';
          this.evaluateTargetPreview(enemy);
          this.ui.centerCameraOn(cat.x, cat.y);
          const card = document.getElementById('targetPreviewCard');
          if (card) card.classList.add('spotlight-active');
        }
      }
    };

    this.ui.showBoardTutorial(startStep, updateStepView, () => {
      const tutKey = `${GAME.storageKey}_tutorial`;
      localStorage.setItem(tutKey, '1');
      localStorage.setItem('lt_tutorial_seen', '1');
      document.querySelectorAll('.spotlight-active').forEach(el => el.classList.remove('spotlight-active'));
      this.clearSelection();
      this.ui.hideActionMenu();
      this.ui.hideTargetPreview();

      if (isFromTitle || isFromMap) {
        // Restore prior screen and battle state
        this.battle = savedBattle;
        this.ui.showScreen(previousScreen);
      } else {
        // Restore player's live battle cleanly from saved deploy placements
        this.activeStratagemId = savedStratagem;
        this.launchBattleInstance(savedChapter, savedPlacements);
      }
    });
  }

  // ================= DEBUG & TEST HOOKS =================
  setupDebugHooks() {
    window.__lt = {
      app: this,
      getBattle: () => this.battle,
      getCampaign: () => this.campaign,
      showScreen: (s) => this.ui.showScreen(s),
      openWorldMap: () => this.openWorldMap(),
      openPreBattle: (chId = 1) => {
        const ch = CHAPTERS.find(c => c.id === chId) || CHAPTERS[0];
        this.openPreBattle(ch);
      },
      openDeployPhase: (chId = 1) => {
        const ch = CHAPTERS.find(c => c.id === chId) || CHAPTERS[0];
        const allGuardianIds = Object.keys(GUARDIAN_PROTOS);
        this.selectedSquadIds = allGuardianIds.slice(0, ch.squadLimit);
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
        this.ui.showBattleResult(status, ch, () => {}, this.campaign, this.battle?.allies);
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

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new LanternTacticsApp();
});
