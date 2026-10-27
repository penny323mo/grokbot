/**
 * js/app.js
 * Main game coordinator for 燈影軍略 · Lantern Tactics (v4).
 * Connects pure engine, UI rendering, sound, campaign progression, and debug hooks.
 */

import { GAME } from './config.js';
import { CHAPTERS } from './data/maps.js';
import { GUARDIAN_PROTOS, ENEMY_PROTOS, RELICS, STRATAGEMS } from './data/units.js';
import { CampaignManager } from './engine/campaign.js';
import { Battle } from './engine/battle.js';
import { Board } from './engine/board.js';
import { RNG } from './engine/rng.js';
import { SoundEngine } from './audio.js';
import { UIRenderer } from './render/ui.js';
import { getReachableTiles, getAttackRangeTiles, getAttackableTilesFromReachable } from './engine/pathfinding.js';
import { calculateCombat, canTargetUnit } from './engine/combat.js';
import { getActionInfo } from './engine/actioninfo.js';

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

    const btnTopMenu = document.getElementById('btnTopMenu');
    const menuDropdown = document.getElementById('topMenuDropdown');
    if (btnTopMenu && menuDropdown) {
      btnTopMenu.onclick = (e) => {
        e.stopPropagation();
        const isOpen = menuDropdown.style.display !== 'none';
        menuDropdown.style.display = isOpen ? 'none' : 'block';
        this.sound?.playSfx('tap');
      };
      const btnCloseMenu = document.getElementById('btnCloseTopMenu');
      if (btnCloseMenu) {
        btnCloseMenu.onclick = (e) => {
          e.stopPropagation();
          menuDropdown.style.display = 'none';
        };
      }
      document.addEventListener('click', (e) => {
        if (!menuDropdown.contains(e.target) && e.target !== btnTopMenu) {
          menuDropdown.style.display = 'none';
        }
      });
    }

    const btnWorldMap = document.getElementById('btnNavWorldMap');
    if (btnWorldMap) {
      btnWorldMap.onclick = () => {
        if (menuDropdown) menuDropdown.style.display = 'none';
        this.sound?.playSfx('tap');
        this.openWorldMap();
      };
    }

    const btnHelp = document.getElementById('btnHelp');
    if (btnHelp) {
      btnHelp.onclick = () => {
        if (menuDropdown) menuDropdown.style.display = 'none';
        this.sound?.playSfx('tap');
        this.ui.showTacticsTutorialModal();
      };
    }

    // Auto End Turn Setting
    this.autoEndTurnEnabled = localStorage.getItem('lt_auto_end_turn') === '1';
    const syncAutoEndBtn = () => {
      const txt = document.getElementById('txtAutoEndTurnState');
      if (txt) txt.textContent = this.autoEndTurnEnabled ? '開啟' : '關閉';
      const btn = document.getElementById('btnToggleAutoEndTurn');
      if (btn) btn.classList.toggle('is-active', this.autoEndTurnEnabled);
    };
    syncAutoEndBtn();
    const btnAutoEnd = document.getElementById('btnToggleAutoEndTurn');
    if (btnAutoEnd) {
      btnAutoEnd.onclick = () => {
        this.autoEndTurnEnabled = !this.autoEndTurnEnabled;
        localStorage.setItem('lt_auto_end_turn', this.autoEndTurnEnabled ? '1' : '0');
        syncAutoEndBtn();
        this.sound?.playSfx('tap');
      };
    }

    // Prologue triggers
    const triggerPrologue = () => {
      if (menuDropdown) menuDropdown.style.display = 'none';
      this.sound?.playSfx('tap');
      this.ui.showPrologue(() => {
        if (this.battle) {
          this.ui.showScreen('screenBattle');
        } else {
          this.openWorldMap();
        }
      });
    };
    const btnProTitle = document.getElementById('btnOpenPrologueTitle');
    if (btnProTitle) btnProTitle.onclick = triggerPrologue;
    const btnProMenu = document.getElementById('btnOpenPrologueMenu');
    if (btnProMenu) btnProMenu.onclick = triggerPrologue;

    // Next Unacted Unit button
    const btnNextUnacted = document.getElementById('btnNextUnactedUnit');
    if (btnNextUnacted) {
      btnNextUnacted.onclick = () => {
        if (!this.battle || this.battle.phase !== 'ally') return;
        this.selectNextUnactedUnit();
      };
    }

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

    // Audio toggles: toggle*() returns the ON state. Reflect it (class + aria-pressed) and sync on load.
    const btnMusic = document.getElementById('btnToggleMusic');
    const btnSfx = document.getElementById('btnToggleSfx');
    const syncAudioBtns = () => {
      const set = (btn, on, label) => {
        if (!btn) return;
        btn.classList.toggle('is-off', !on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.title = `${label}：${on ? '開' : '關'}`;
        btn.style.opacity = '';
      };
      set(btnMusic, this.sound?.musicOn !== false, '音樂');
      set(btnSfx, this.sound?.sfxOn !== false, '音效');
    };
    if (btnMusic) {
      btnMusic.onclick = (e) => {
        e.stopPropagation();
        this.sound?.toggleMusic();
        syncAudioBtns();
      };
    }
    if (btnSfx) {
      btnSfx.onclick = (e) => {
        e.stopPropagation();
        this.sound?.toggleSfx();
        syncAudioBtns();
        this.sound?.playSfx('tap');
      };
    }
    syncAudioBtns();
    // iOS unlock on the very first tap anywhere (capture so it runs before the button handler).
    const unlockAudio = () => {
      this.sound?.unlock();
      ['pointerdown', 'touchend', 'click'].forEach(ev => document.removeEventListener(ev, unlockAudio, true));
    };
    ['pointerdown', 'touchend', 'click'].forEach(ev => document.addEventListener(ev, unlockAudio, true));

    // Title screen
    document.getElementById('btnStartCampaign').onclick = () => {
      this.sound?.playSfx('tap');
      if (!localStorage.getItem('lt_prologue_seen')) {
        this.ui.showPrologue(() => this.openWorldMap());
      } else {
        this.openWorldMap();
      }
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

    const stratBtnTop = document.getElementById('btnStratagemTop');
    if (stratBtnTop) {
      stratBtnTop.onclick = () => {
        if (!this.battle || this.battle.phase !== 'ally') return;
        this.sound?.playSfx('tap');
        this.handleUseStratagem();
      };
    }

    document.getElementById('btnEndTurn').onclick = () => {
      this.handleEndTurn();
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
          this.ui.frameTiles(foes.length ? foes : deployTiles, true, true);
        } else this.frameDeploy(true);
      };
    }
    requestAnimationFrame(() => this.frameDeploy(false));
  }

  frameDeploy(smooth) {
    const deployTiles = [...(this.activeChapter?.deployTiles || []), ...(this.deployPlacements || [])];
    const livingFoes = (this.battle?.enemies || []).filter(e => e.hp > 0);
    let nearestFoe = null;
    let minDist = Infinity;
    const deployCenterY = deployTiles.reduce((acc, t) => acc + t.y, 0) / (deployTiles.length || 1);
    const deployCenterX = deployTiles.reduce((acc, t) => acc + t.x, 0) / (deployTiles.length || 1);
    for (const foe of livingFoes) {
      const d = Math.hypot(foe.x - deployCenterX, foe.y - deployCenterY);
      if (d < minDist) {
        minDist = d;
        nearestFoe = foe;
      }
    }
    const tiles = nearestFoe ? [...deployTiles, nearestFoe] : deployTiles;
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

    const activePlacements = placements || (this.activeChapter?.id === chapter.id ? this.deployPlacements : null);
    const squadInstances = this.selectedSquadIds.map(id => this.campaign.getUnitInstance(id));
    this.battle = new Battle(chapter, squadInstances, this.activeStratagemId, this.campaign, this.rng, {
      deployPlacements: activePlacements
    });

    this.clearSelection();
    this.ui.showScreen('screenBattle');
    this.refreshBattleUI();

    // Battle start camera pan: show enemies first, then return smoothly to player squad
    const enemies = this.battle.enemies.filter(e => e.hp > 0);
    const allies = this.battle.allies.filter(a => a.hp > 0);
    if (enemies.length > 0) {
      this.ui.frameTiles(enemies, false, true);
      if (this.battleStartPanTimer) clearTimeout(this.battleStartPanTimer);
      this.battleStartPanTimer = setTimeout(() => {
        if (this.battle && this.battle.allies) {
          this.ui.frameTiles(this.battle.allies.filter(a => a.hp > 0), true, false);
        }
      }, 1200);
    } else if (allies.length > 0) {
      requestAnimationFrame(() => this.ui.frameTiles(allies, false, false));
    }

    // Battle start dialogue bark
    this.firstKillBarkPlayed = false;
    const leader = this.battle.allies.find(a => a.hp > 0);
    if (leader) {
      const startBarks = {
        bear_guard: '「敵陣已近！結鐵壁之陣，護住明燈！」',
        cat_patrol: '「暗夜之中，正是拔劍破陣之時！」',
        crane_rider: '「風雲在握，敵陣破綻已收眼底！」',
        tea_master: '「品此清茶，靜觀敵變，破陣只在彈指間。」',
        lantern_crafter: '「明燈照徹，諸位將士隨我照破夜霧！」'
      };
      if (this.battleStartBarkTimer) clearTimeout(this.battleStartBarkTimer);
      this.battleStartBarkTimer = setTimeout(() => {
        if (this.battle && this.battle.currentTurn === 1) {
          this.ui.showCombatBark(leader, `【${leader.name} · 開戰號令】`, startBarks[leader.id] || leader.bark || '「全軍列陣，隨我迎敵！」', 1500);
        }
      }, 1400);
    }
  }

  selectNextUnactedUnit() {
    if (!this.battle) return;
    const allies = this.battle.allies.filter(a => a.hp > 0 && a.role !== 'npc' && a.role !== 'objective');
    const currentIndex = this.selectedUnit ? allies.indexOf(this.selectedUnit) : -1;
    let next = null;
    for (let i = 1; i <= allies.length; i++) {
      const idx = (currentIndex + i) % allies.length;
      if (!allies[idx].acted) {
        next = allies[idx];
        break;
      }
    }
    if (next) {
      this.sound?.playSfx('tap');
      this.handleUnitTap(next);
      this.ui.centerCameraOn(next.x, next.y, true);
    }
  }

  checkAutoEndTurn() {
    if (!this.autoEndTurnEnabled || !this.battle || this.battle.phase !== 'ally') return;
    const livingAllies = this.battle.allies.filter(a => a.hp > 0 && a.role !== 'npc' && a.role !== 'objective');
    if (livingAllies.length > 0 && livingAllies.every(a => a.acted)) {
      setTimeout(() => {
        if (this.battle && this.battle.phase === 'ally') {
          this.handleEndTurn();
        }
      }, 450);
    }
  }

  refreshBattleUI() {
    if (!this.battle) return;

    const targetTagsMap = new Map();
    const actionForTags = this.activeActionType || (this.isGuidedTutorial && this.tutorialStep === 4 ? 'magic' : null);
    if (this.selectedUnit && actionForTags) {
      const unit = this.selectedUnit;
      const skill = this.selectedSkill || (actionForTags === 'skill' ? unit.skill : (actionForTags === 'magic' ? unit.magic : null));
      const rangeTiles = getAttackRangeTiles(this.battle.board, unit, unit.x, unit.y);
      for (const enemy of this.battle.enemies) {
        if (enemy.hp <= 0) continue;
        const key = `${enemy.x},${enemy.y}`;
        const inRange = rangeTiles.some(t => t.x === enemy.x && t.y === enemy.y);
        if (!inRange && this.validTargetKeys && !this.validTargetKeys.has(key)) continue;
        const pv = calculateCombat(unit, enemy, this.battle.board, {
          actionType: actionForTags,
          skill,
          noCounter: !!skill?.aoe,
          attackerX: unit.x,
          attackerY: unit.y,
          allies: this.battle.allies,
          synergies: this.battle.synergies
        });
        if (pv.targetTags && pv.targetTags.length > 0) {
          targetTagsMap.set(enemy.id, pv.targetTags);
        }
      }
    }

    this.ui.renderBattle(this.battle, {
      selectedUnit: this.selectedUnit,
      reachableTiles: this.reachableTiles,
      attackableTiles: this.attackableTiles,
      aoeTiles: this.aoeTiles,
      validTargetKeys: this.targetingMode ? this.validTargetKeys : null,
      selectedTargetKey: this.targetingMode ? this.pendingTargetKey : null,
      targetTagsMap,
      deploySlots: this.deploySlots,
      threatTiles: this.showThreat ? this.computeThreatTiles() : null,
      onUnitTap: (unit) => this.handleUnitTap(unit),
      onTileTap: (x, y) => this.handleTileTap(x, y)
    });

    const btnUndo = document.getElementById('btnUndoMove');
    if (btnUndo) {
      btnUndo.style.display = (this.selectedUnit && this.stagedMoveTile) ? 'inline-flex' : 'none';
    }

    const stratBtn = document.getElementById('btnStratagemTop');
    if (stratBtn) {
      const stratId = this.battle?.stratagemId || this.activeStratagemId;
      if (stratId === 'rally') {
        stratBtn.style.display = 'inline-flex';
        stratBtn.innerHTML = '<span>擂鼓</span>';
        stratBtn.style.opacity = this.battle?.rallyUsed ? '0.45' : '1';
        stratBtn.title = this.battle?.rallyUsed ? '擂鼓已使用' : '點擊施放【擂鼓】：我軍士氣+25，周圍友軍MOV+1';
      } else if (stratId) {
        stratBtn.style.display = 'inline-flex';
        const st = STRATAGEMS.find(s => s.id === stratId);
        stratBtn.innerHTML = `<span>${st?.name || '軍略'}</span>`;
        stratBtn.style.opacity = '1';
      } else {
        stratBtn.style.display = 'none';
      }
    }
  }

  handleUseStratagem() {
    if (!this.battle) return;
    const stratId = this.battle.stratagemId || this.activeStratagemId;
    if (stratId === 'rally') {
      if (this.battle.rallyUsed) {
        this.ui.showMoraleNotice('【軍略已用】擂鼓每場戰鬥僅可施放一次！');
        return;
      }
      const ok = this.battle.triggerRally();
      if (ok) {
        this.sound?.playSfx('buff');
        const leader = this.battle.allies.find(a => a.hp > 0) || { x: 2, y: 10 };
        this.ui.showFloatingMorale(leader.x, leader.y, '【我軍士氣 ↑ +25】', true);
        this.ui.showMoraleNotice('【擂鼓振威】戰鼓如雷！我軍士氣提升25點，周圍友軍步法+1！');
        this.refreshBattleUI();
      }
    } else {
      this.ui.showStratagemModal(stratId || 'inspire');
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
    if (this.inputLocked) return;

    // Re-tap the selected unit during the move stage: stay put (原地行動) and open the action menu
    if (this.selectedUnit && unit === this.selectedUnit && !this.stagedMoveTile && !this.activeActionType && !this.targetingMode) {
      this.stayInPlace(unit);
      return;
    }

    // Tap an enemy while still in the move stage: attack directly (from here if in range, else walk to the nearest tile that reaches it)
    if (unit.team === 'enemy' && this.selectedUnit && !this.stagedMoveTile && !this.activeActionType && !this.targetingMode) {
      if (this.quickAttack(this.selectedUnit, unit)) return;
    }

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
      if (this.isGuidedTutorial && this.tutorialStep === 0) {
        this.advanceGuidedTutorial(0);
      }
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
    if (this.inputLocked) return;

    // Tapping the selected unit's own tile = stay in place
    if (this.selectedUnit && !this.stagedMoveTile && !this.targetingMode && !this.activeActionType &&
        x === this.selectedUnit.x && y === this.selectedUnit.y) {
      this.stayInPlace(this.selectedUnit);
      return;
    }

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
        this.walkSelectedTo(x, y, () => this.openActionMenuForUnit(this.selectedUnit));
        return;
      }
    }

    // If tapping an empty tile, deselect
    if (!this.stagedMoveTile) {
      this.clearSelection();
      this.refreshBattleUI();
    }
  }

  /** Move the selected unit with a tile-by-tile walk; input is locked until the walk ends. */
  walkSelectedTo(x, y, after) {
    const unit = this.selectedUnit;
    if (!unit) return;
    this.battle.moveUnit(unit, x, y);
    this.stagedMoveTile = { x, y };
    this.reachableTiles = new Map();
    this.attackableTiles = new Set();
    this.refreshBattleUI();
    const path = unit.lastPath || [];
    const onWalkComplete = () => {
      this.inputLocked = false;
      if (this.isGuidedTutorial && this.tutorialStep === 1) {
        this.advanceGuidedTutorial(1);
      }
      if (this.selectedUnit === unit) { after && after(); }
      this.refreshBattleUI();
    };
    if (path.length < 2 || !this.ui.animateWalks) { onWalkComplete(); return; }
    this.inputLocked = true;
    this.ui.animateWalks([{ id: unit.id, path, unit }]).then(onWalkComplete);
  }

  /** 原地行動: no movement, go straight to the action menu. */
  stayInPlace(unit) {
    if (!unit || unit.acted) return;
    this.sound?.playSfx('tap');
    this.battle.holdPosition(unit);
    this.stagedMoveTile = { x: unit.x, y: unit.y };
    if (this.isGuidedTutorial && this.tutorialStep === 1) {
      this.advanceGuidedTutorial(1);
    }
    this.openActionMenuForUnit(unit);
    this.refreshBattleUI();
  }

  /** Tap enemy in the move stage: attack from the current tile if possible, otherwise walk to the cheapest tile in range. */
  quickAttack(unit, foe) {
    const startAttack = () => {
      this.openActionMenuForUnit(unit);
      const vision = this.battle.isFogActive() ? this.battle.calculateVisionMap() : null;
      if (!canTargetUnit(unit, foe, this.battle.board, vision)) { this.refreshBattleUI(); return; }
      this.handleActionMenuChoice('attack');
      const key = `${foe.x},${foe.y}`;
      if (this.validTargetKeys?.has(key)) this.tapTarget(key, () => this.evaluateTargetPreview(foe));
      this.refreshBattleUI();
    };
    if (this.battle.getTargetsInRangeNow(unit).includes(foe)) {
      this.sound?.playSfx('tap');
      this.battle.holdPosition(unit);
      this.stagedMoveTile = { x: unit.x, y: unit.y };
      startAttack();
      return true;
    }
    let best = null;
    for (const [key, info] of this.reachableTiles) {
      const [tx, ty] = key.split(',').map(Number);
      const occ = this.battle.getUnitAt(tx, ty);
      if (occ && occ !== unit) continue;
      const inRange = getAttackRangeTiles(this.battle.board, unit, tx, ty).some(t => t.x === foe.x && t.y === foe.y);
      if (inRange && (!best || info.cost < best.cost)) best = { x: tx, y: ty, cost: info.cost };
    }
    if (!best) return false;
    this.sound?.playSfx('tap');
    this.walkSelectedTo(best.x, best.y, startAttack);
    return true;
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
      },
      (actionType, pressing) => this.showActionInfo(unit, actionType, pressing),
      unit
    );
    requestAnimationFrame(() => this.ui.frameTiles([unit, ...enemiesInRange]));
  }

  /** Long-press on 攻擊/技能/法術: info card + range highlight; release restores the menu state. */
  showActionInfo(unit, actionType, pressing) {
    if (!pressing) {
      this.ui.hideActionInfoCard();
      if (this._infoSavedTiles) { this.attackableTiles = this._infoSavedTiles; this._infoSavedTiles = null; }
      this.aoeTiles = new Set();
      this.ui.renderRangeOnly?.(this.attackableTiles, this.aoeTiles) ?? this.refreshBattleUI();
      return;
    }
    const info = getActionInfo(this.battle, unit, actionType);
    if (!info) return;
    this._infoSavedTiles = this.attackableTiles;
    this.attackableTiles = new Set(info.tiles.map(t => `${t.x},${t.y}`));
    this.aoeTiles = new Set(info.targets.map(t => `${t.x},${t.y}`));
    this.ui.showActionInfoCard(info, unit);
    this.ui.renderRangeOnly?.(this.attackableTiles, this.aoeTiles) ?? this.refreshBattleUI();
  }

  handleActionMenuChoice(actionType, skipSublist = false) {
    const unit = this.selectedUnit;
    if (!unit) return;

    if (actionType === 'skill' && !skipSublist && unit.skill) {
      const skills = [unit.skill].filter(Boolean);
      this.ui.showActionSublist('技能列表', skills, () => {
        this.handleActionMenuChoice('skill', true);
      }, () => {
        this.openActionMenuForUnit(unit);
      });
      return;
    }

    if (actionType === 'magic' && !skipSublist && unit.magic) {
      const magics = [unit.magic].filter(Boolean);
      this.ui.showActionSublist('法術列表', magics, () => {
        this.handleActionMenuChoice('magic', true);
      }, () => {
        this.openActionMenuForUnit(unit);
      });
      return;
    }

    this.activeActionType = actionType;
    this.ui.hideActionMenu();

    if (actionType === 'wait') {
      this.confirmActionExecution('wait');
      return;
    }

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
      noCounter: !!skill?.aoe,
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
    if (!(actionType === 'magic' && actingUnit.magic?.selfBuff)) this.sound?.playSfx('hit');

    if (this.isGuidedTutorial) {
      if (actionType === 'attack' && this.tutorialStep === 2) {
        this.advanceGuidedTutorial(2);
      } else if (actionType === 'skill' && this.tutorialStep === 3) {
        this.advanceGuidedTutorial(3);
      } else if (actionType === 'magic' && this.tutorialStep === 4) {
        this.advanceGuidedTutorial(4);
      } else if (actionType === 'wait' && this.tutorialStep === 5) {
        this.advanceGuidedTutorial(5);
      }
    }

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
      isHeal: !!res.events?.some(e => e.type === 'heal'),
      healAmount: res.events?.find(e => e.type === 'heal')?.amount ?? 8,
      isMiss,
      events: res.events || []
    };

    const isSelfBuff = actionType === 'magic' && actingUnit.magic?.selfBuff;
    if (isSelfBuff) {
      // Self-buff is not an attack: no lunge, no hurt shake, no thunder strike on the caster
      this.sound?.playSfx('buff');
      this.ui.playBuffVfx?.(actingUnit, `防+${actingUnit.magic.selfBuff.def || 3}`);
      setTimeout(() => this.afterActionResolved(res, actingUnit), 450 / (this.battleSpeed || 1));
    } else if (target && target !== actingUnit) {
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
    this.checkAutoEndTurn();

    // First kill dialogue bark
    if (!this.firstKillBarkPlayed && res?.events?.some(e => e.type === 'defeat' || e.type === 'kill' || (e.type === 'hit' && e.targetDead))) {
      this.firstKillBarkPlayed = true;
      const killBarks = {
        cat_patrol: '「先下一城！劍鋒所向，敵酋必隕！」',
        bear_guard: '「喝！不堪一擊，隨俺乘勝追擊！」',
        crane_rider: '「長空破敵！側翼敵陣已瓦解！」',
        tanuki_mage: '「天雷破煞！妖霧散盡之時到了！」',
        fox_maiden: '「靈狐烈焰，焚盡宵小！」'
      };
      this.ui.showCombatBark(actingUnit, `【${actingUnit.name} · 首殺拔旗】`, killBarks[actingUnit.id] || '「首戰告捷！乘勝破敵！」', 1500);
    }

    // Ally low HP dialogue bark
    for (const ally of (this.battle?.allies || [])) {
      if (ally.hp > 0 && ally.hp <= ally.maxHp * 0.3 && !ally._lowHpBarkPlayed) {
        ally._lowHpBarkPlayed = true;
        this.ui.showCombatBark(ally, `【${ally.name} · 鏖戰負創】`, '「此等微傷何足懼……死戰不退！」', 1500);
        break;
      }
    }

    // Boss phase change bark
    const bossEv = res?.events?.find(e => e.type === 'boss_phase');
    if (bossEv) {
      const boss = this.battle.enemies.find(e => e.id === 'iron_general') || { id: 'iron_general', name: '鐵將' };
      this.ui.showCombatBark(boss, `【${boss.name} · 暴怒】`, '「狂妄之徒！見識本將軍的狂暴刀罡吧！」', 1500);
    }

    // Check events from action (morale drops, bonus XP, routs)
    if (this.battle.eventLog) {
      const recentEvents = this.battle.eventLog.slice(-5);
      for (const ev of recentEvents) {
        if (ev.type === 'morale' && ev.delta !== 0) {
          const sign = ev.delta > 0 ? `+${ev.delta}` : `${ev.delta}`;
          const tag = ev.team === 'ally' ? '我軍' : '敵軍';
          const symbol = ev.delta > 0 ? '↑' : '↓';
          const pos = actingUnit ? { x: actingUnit.x, y: actingUnit.y } : { x: 5, y: 5 };
          this.ui.showFloatingMorale(pos.x, pos.y, `【${tag}士氣 ${symbol} ${sign}】`, ev.delta > 0);
        } else if (ev.type === 'bonus_xp') {
          const pos = actingUnit ? { x: actingUnit.x, y: actingUnit.y } : { x: 5, y: 5 };
          this.ui.showFloatingMorale(pos.x, pos.y, `【擊潰逃敵 +${ev.amount} XP】`, true);
        }
      }
    }

    // Check first time morale drops below 50
    if ((this.battle.enemyMorale < 50 || this.battle.allyMorale < 50) && !localStorage.getItem('lt_morale_hint_seen')) {
      localStorage.setItem('lt_morale_hint_seen', '1');
      this.ui.showMoraleNotice('【軍心動搖】士氣低於35時敵兵將潰散逃竄，追擊潰敵可獲額外戰功！');
    }

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
      const walks = (this.battle.movePaths || []).filter(m => m.path && m.path.length > 1);
      if (walks.length && this.ui.animateWalks) {
        this.inputLocked = true;
        this.ui.animateWalks(walks, { sequential: true }).then(() => {
          this.inputLocked = false;
          this.refreshBattleUI();
          this.afterEnemyWalks(phasePill);
        });
      } else {
        this.afterEnemyWalks(phasePill);
      }
    });
  }

  afterEnemyWalks(phasePill) {
    {
      // Check rout events from enemy turn
      if (this.battle.eventLog) {
        const routEvs = this.battle.eventLog.filter(e => e.type === 'rout');
        for (const ev of routEvs) {
          if (ev.x !== undefined && ev.y !== undefined) {
            this.ui.showFloatingMorale(ev.x, ev.y, '【敵軍潰逃！】', false);
          }
        }
      }

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

        // Check telegraphed reinforcement alerts
        const warnings = this.battle?.eventLog?.filter(e => e.type === 'reinforce_warning' && !e._notified);
        if (warnings && warnings.length > 0) {
          for (const w of warnings) {
            w._notified = true;
            this.ui.showMoraleNotice(w.msg);
          }
        }

        // Check low HP allies
        for (const ally of (this.battle?.allies || [])) {
          if (ally.hp > 0 && ally.hp <= ally.maxHp * 0.3 && !ally._lowHpBarkPlayed) {
            ally._lowHpBarkPlayed = true;
            this.ui.showCombatBark(ally, `【${ally.name} · 鏖戰負創】`, '「此等微傷何足懼……死戰不退！」', 1500);
            break;
          }
        }
      });
    }
  }

  advanceGuidedTutorial(expectedStep) {
    if (!this.isGuidedTutorial) return;
    if (this.tutorialStep === expectedStep) {
      this.tutorialStep++;
      if (this.tutorialStep > 6) {
        this.isGuidedTutorial = false;
        this.ui.hideBoardTutorial();
        const tutKey = `${GAME.storageKey}_tutorial`;
        localStorage.setItem(tutKey, '1');
        localStorage.setItem('lt_tutorial_seen', '1');
        document.querySelectorAll('.spotlight-active').forEach(el => el.classList.remove('spotlight-active'));
      } else {
        this.ui.setTutorialStep(this.tutorialStep, this._updateTutorialView);
      }
    }
  }

  handleEndTurn() {
    if (!this.battle || this.battle.phase !== 'ally') return;
    if (this.isGuidedTutorial && this.tutorialStep === 6) {
      this.advanceGuidedTutorial(6);
    }
    this.sound?.playSfx('tap');
    this.clearSelection();
    this.triggerEnemyTurn();
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
    const isExternal = isFromTitle || isFromMap;

    const badgeEl = document.getElementById('txtChapterBadge');
    if (badgeEl) badgeEl.textContent = '第1回';

    // If already in live Ch1 battle, use it directly; otherwise instantiate clean Ch1 battle
    if (!this.battle || this.battle.chapter?.id !== 1) {
      const squad = ['bear_guard', 'cat_patrol', 'lantern_crafter', 'tea_master'].map(id => this.campaign.getUnitInstance(id));
      this.battle = new Battle(CHAPTERS[0], squad, this.activeStratagemId || 'inspire', this.campaign, this.rng);
    }
    this.ui.showScreen('screenBattle');

    this.isGuidedTutorial = true;
    this.tutorialStep = startStep;

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
      this.tutorialStep = step;
      document.querySelectorAll('.spotlight-active').forEach(el => el.classList.remove('spotlight-active'));

      if (step === 0) {
        // Step 1: Select unit (Bear Guard)
        const bear = this.battle?.allies.find(a => a.id === 'bear_guard') || this.battle?.allies[0];
        if (bear) {
          this.ui.centerCameraOn(bear.x, bear.y);
          const tileEl = document.querySelector(`.grid-tile[data-x="${bear.x}"][data-y="${bear.y}"]`);
          if (tileEl) {
            tileEl.classList.add('spotlight-active');
            updateSpotlight(tileEl);
          }
        }
      } else if (step === 1) {
        // Step 2: Move unit
        const bear = this.battle?.allies.find(a => a.id === 'bear_guard') || this.battle?.allies[0];
        if (bear) {
          const targetY = Math.max(0, bear.y - 2);
          const tileEl = document.querySelector(`.grid-tile[data-x="${bear.x}"][data-y="${targetY}"]`) ||
                         document.querySelector(`.grid-tile[data-x="${bear.x}"][data-y="${bear.y - 1}"]`);
          if (tileEl) {
            tileEl.classList.add('spotlight-active');
            updateSpotlight(tileEl);
          }
          this.ui.centerCameraOn(bear.x, targetY);
        }
      } else if (step === 2) {
        // Step 3: Attack
        const btnAtk = document.getElementById('btnActionAttack');
        if (btnAtk && btnAtk.offsetParent !== null) {
          btnAtk.classList.add('spotlight-active');
          updateSpotlight(btnAtk);
        } else {
          const foe = this.battle?.enemies.find(e => e.hp > 0);
          if (foe) {
            const tileEl = document.querySelector(`.grid-tile[data-x="${foe.x}"][data-y="${foe.y}"]`);
            if (tileEl) { tileEl.classList.add('spotlight-active'); updateSpotlight(tileEl); }
            this.ui.centerCameraOn(foe.x, foe.y);
          }
        }
      } else if (step === 3) {
        // Step 4: Skill
        const btnSkill = document.getElementById('btnActionSkill');
        if (btnSkill && btnSkill.offsetParent !== null) {
          btnSkill.classList.add('spotlight-active');
          updateSpotlight(btnSkill);
        }
      } else if (step === 4) {
        // Step 5: Magic with element counter
        const lc = this.battle?.allies.find(a => a.id === 'lantern_crafter');
        const woodFoe = this.battle?.enemies.find(e => e.hp > 0 && e.element === 'wood') || this.battle?.enemies[0];
        if (lc && !lc.acted) {
          this.selectedUnit = lc;
          this.openActionMenuForUnit(lc);
          this.refreshBattleUI();
        }
        const btnMag = document.getElementById('btnActionMagic');
        if (btnMag && btnMag.offsetParent !== null) {
          btnMag.classList.add('spotlight-active');
          updateSpotlight(btnMag);
        }
        if (woodFoe) {
          this.ui.centerCameraOn(woodFoe.x, woodFoe.y);
        }
      } else if (step === 5) {
        // Step 6: Standby / 待命
        const btnWait = document.getElementById('btnActionWait');
        if (btnWait && btnWait.offsetParent !== null) {
          btnWait.classList.add('spotlight-active');
          updateSpotlight(btnWait);
        }
      } else if (step === 6) {
        // Step 7: End turn
        const btnEnd = document.getElementById('btnEndTurn');
        if (btnEnd) {
          btnEnd.classList.add('spotlight-active');
          updateSpotlight(btnEnd);
        }
      }
    };

    const handleSuggest = (step) => {
      document.querySelectorAll('.spotlight-active').forEach(el => el.classList.remove('spotlight-active'));
      if (step === 0) {
        const bear = this.battle?.allies.find(a => a.id === 'bear_guard') || this.battle?.allies[0];
        if (bear) {
          this.ui.centerCameraOn(bear.x, bear.y, true);
          const el = document.querySelector(`.grid-tile[data-x="${bear.x}"][data-y="${bear.y}"]`);
          if (el) { el.classList.add('spotlight-active'); updateSpotlight(el); }
        }
      } else if (step === 1) {
        if (this.selectedUnit && this.reachableTiles?.size > 0) {
          const keys = Array.from(this.reachableTiles.keys());
          const [tx, ty] = keys[Math.floor(keys.length / 2)].split(',').map(Number);
          this.ui.centerCameraOn(tx, ty, true);
          const el = document.querySelector(`.grid-tile[data-x="${tx}"][data-y="${ty}"]`);
          if (el) { el.classList.add('spotlight-active'); updateSpotlight(el); }
        }
      } else if (step === 2) {
        const btn = document.getElementById('btnActionAttack');
        if (btn) { btn.classList.add('spotlight-active'); updateSpotlight(btn); }
      } else if (step === 3) {
        const btn = document.getElementById('btnActionSkill');
        if (btn) { btn.classList.add('spotlight-active'); updateSpotlight(btn); }
      } else if (step === 4) {
        const btn = document.getElementById('btnActionMagic');
        if (btn) { btn.classList.add('spotlight-active'); updateSpotlight(btn); }
      } else if (step === 5) {
        const btn = document.getElementById('btnActionWait');
        if (btn) { btn.classList.add('spotlight-active'); updateSpotlight(btn); }
      } else if (step === 6) {
        const btn = document.getElementById('btnEndTurn');
        if (btn) { btn.classList.add('spotlight-active'); updateSpotlight(btn); }
      }
    };

    this._updateTutorialView = updateStepView;

    this.ui.showBoardTutorial(startStep, updateStepView, () => {
      this.isGuidedTutorial = false;
      const tutKey = `${GAME.storageKey}_tutorial`;
      localStorage.setItem(tutKey, '1');
      localStorage.setItem('lt_tutorial_seen', '1');
      document.querySelectorAll('.spotlight-active').forEach(el => el.classList.remove('spotlight-active'));
      const overlay = document.getElementById('tutorialBoardOverlay');
      if (overlay) overlay.classList.remove('card-at-top');
      this.clearSelection();
      this.ui.hideActionMenu();
      this.ui.hideTargetPreview();

      if (isExternal) {
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
        const defaultComps = {
          1: ['bear_guard', 'cat_patrol', 'lantern_crafter', 'tea_master'],
          2: ['bear_guard', 'cat_patrol', 'lantern_crafter', 'tea_master', 'fox_maiden'],
          3: ['bear_guard', 'cat_patrol', 'lantern_crafter', 'tea_master', 'fox_maiden'],
          4: ['bear_guard', 'cat_patrol', 'lantern_crafter', 'tea_master', 'crane_rider', 'fox_maiden'],
          5: ['bear_guard', 'cat_patrol', 'lantern_crafter', 'tea_master', 'crane_rider', 'fox_maiden'],
          6: ['bear_guard', 'cat_patrol', 'lantern_crafter', 'tea_master', 'crane_rider', 'fox_maiden'],
          7: ['bear_guard', 'cat_patrol', 'lantern_crafter', 'tea_master', 'crane_rider'],
          8: ['bear_guard', 'tea_master', 'cat_patrol', 'lantern_crafter', 'crane_rider', 'fox_maiden']
        };
        this.selectedSquadIds = defaultComps[ch.id] || Object.keys(GUARDIAN_PROTOS).slice(0, ch.squadLimit);
        this.activeChapter = ch;
        this.deployPlacements = [];
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
      triggerRally: () => this.handleUseStratagem(),
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
