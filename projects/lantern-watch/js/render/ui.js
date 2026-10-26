/**
 * js/render/ui.js
 * DOM rendering engine, camera panning, 2.5D unit figures, combat previews,
 * action menus, and modal dialogs for 燈影軍略 · Lantern Tactics (v4).
 */

import { CHAPTERS, TERRAIN_INFO } from '../data/maps.js';
import { GUARDIAN_PROTOS, ENEMY_PROTOS, STRATAGEMS, RELICS, BOND_PAIRS } from '../data/units.js';

export class UIRenderer {
  constructor(soundEngine) {
    this.sound = soundEngine;
    this.isDraggingViewport = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.scrollStartX = 0;
    this.scrollStartY = 0;
    this.hasDraggedBeyondThreshold = false;
    this.setupViewportDrag();
  }

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');

    // Keep Grokbot back button visible
    delete document.body.dataset.gbPlaying;

    const btnNavWorldMap = document.getElementById('btnNavWorldMap');
    if (btnNavWorldMap) {
      btnNavWorldMap.style.display = (screenId === 'screenTitle') ? 'none' : 'inline-flex';
    }
  }

  setupViewportDrag() {
    const vp = document.getElementById('battleViewport');
    if (!vp) return;

    vp.addEventListener('pointerdown', (e) => {
      // Don't drag if clicking buttons or figures
      if (e.target.closest('.action-menu-popover') || e.target.closest('.target-preview-card')) {
        return;
      }
      this.isDraggingViewport = true;
      this.hasDraggedBeyondThreshold = false;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.scrollStartX = vp.scrollLeft;
      this.scrollStartY = vp.scrollTop;
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isDraggingViewport) return;
      const dx = e.clientX - this.dragStartX;
      const dy = e.clientY - this.dragStartY;
      if (Math.hypot(dx, dy) > 6) {
        this.hasDraggedBeyondThreshold = true;
      }
      vp.scrollLeft = this.scrollStartX - dx;
      vp.scrollTop = this.scrollStartY - dy;
    });

    window.addEventListener('pointerup', () => {
      this.isDraggingViewport = false;
    });
  }

  centerCameraOn(x, y, smooth = false) {
    const vp = document.getElementById('battleViewport');
    if (!vp) return;
    const tilePx = 64;
    const targetX = x * tilePx + 32;
    const targetY = y * tilePx + 32;

    const vpWidth = vp.clientWidth || 390;
    const vpHeight = vp.clientHeight || 500;

    const scrollX = Math.max(0, Math.min(640 - vpWidth, targetX - vpWidth / 2));
    const scrollY = Math.max(0, Math.min(832 - vpHeight, targetY - vpHeight / 2));

    vp.scrollTo({ left: scrollX, top: scrollY, behavior: smooth ? 'smooth' : 'auto' });
  }

  // ================= WORLD MAP RENDERING =================
  renderWorldMap(campaign, onSelectChapter) {
    const nodesLayer = document.getElementById('worldMapNodes');
    if (!nodesLayer) return;
    nodesLayer.innerHTML = '';

    // Relative node positions fitting inside 390px world map frame
    const nodeCoords = {
      1: { left: '28%', top: '72%', name: '第一回 · 河橋' },
      2: { left: '70%', top: '52%', name: '第二回 · 城門' },
      3: { left: '72%', top: '78%', name: '第三回 · 市集' },
      4: { left: '58%', top: '20%', name: '第四回 · 山道' }
    };

    CHAPTERS.forEach(ch => {
      const coord = nodeCoords[ch.id];
      if (!coord) return;

      const isCleared = campaign.clearedChapters.includes(ch.id);
      const isUnlocked = campaign.isChapterUnlocked(ch.id);

      const pin = document.createElement('div');
      pin.className = `map-route-pin ${isCleared ? 'cleared' : (isUnlocked ? 'available' : 'locked')}`;
      pin.style.left = coord.left;
      pin.style.top = coord.top;

      pin.innerHTML = `
        <div class="pin-medallion">
          ${isCleared ? '✓' : (isUnlocked ? ch.id : '密')}
        </div>
        <div class="pin-label-pill">${coord.name}</div>
      `;

      if (isUnlocked) {
        pin.onclick = () => {
          this.sound?.playSfx('tap');
          onSelectChapter(ch.id);
        };
      }

      nodesLayer.appendChild(pin);
    });
  }

  // ================= PRE-BATTLE RENDERING =================
  renderPreBattle(chapter, campaign, selectedSquadIds, activeStratagemId, handlers) {
    document.getElementById('preChapterTitle').textContent = chapter.title;
    document.getElementById('preObjectiveDesc').textContent = chapter.objectiveDesc;
    document.getElementById('preDefeatDesc').textContent = chapter.defeatDesc;

    // Scout enemies
    const scoutGrid = document.getElementById('scoutEnemyGrid');
    scoutGrid.innerHTML = '';
    const uniqueEnemyIds = [...new Set(chapter.enemySpawns.map(e => e.id))];
    document.getElementById('preEnemyCountBadge').textContent = `${chapter.enemySpawns.length} 支部隊`;

    uniqueEnemyIds.forEach(eid => {
      const proto = ENEMY_PROTOS[eid];
      if (!proto) return;
      const card = document.createElement('div');
      card.className = 'scout-enemy-card';
      card.innerHTML = `
        <img src="assets/art/v4/por_${eid}.webp" alt="${proto.name}" class="scout-enemy-por">
        <div class="scout-enemy-name">${proto.name}</div>
        <div class="scout-enemy-role">${proto.cls} · ${proto.role}</div>
      `;
      scoutGrid.appendChild(card);
    });

    // Squad selection
    const squadGrid = document.getElementById('squadRosterGrid');
    squadGrid.innerHTML = '';
    document.getElementById('preSquadLimitBadge').textContent = `已選 ${selectedSquadIds.length} / ${chapter.squadLimit} 人`;

    for (const [gid, proto] of Object.entries(GUARDIAN_PROTOS)) {
      const unitInst = campaign.getUnitInstance(gid);
      const isSelected = selectedSquadIds.includes(gid);

      const card = document.createElement('div');
      card.className = `squad-unit-card ${isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <img src="assets/art/v4/por_${gid}.webp" alt="${proto.name}" class="squad-unit-por">
        <div class="squad-unit-info">
          <div class="squad-unit-name">${unitInst.name}</div>
          <div class="squad-unit-meta">Lv.${unitInst.level} ${unitInst.cls}</div>
        </div>
      `;

      card.onclick = () => {
        handlers.onToggleSquad(gid);
      };
      squadGrid.appendChild(card);
    }

    // Stratagem picker
    const stratPicker = document.getElementById('stratagemPicker');
    stratPicker.innerHTML = '';

    STRATAGEMS.forEach(strat => {
      if (strat.mapReq && strat.mapReq !== chapter.id) return;
      const isActive = activeStratagemId === strat.id;

      const opt = document.createElement('div');
      opt.className = `stratagem-option ${isActive ? 'active' : ''}`;
      opt.innerHTML = `
        <div class="stratagem-icon">${strat.icon}</div>
        <div class="stratagem-details">
          <div class="stratagem-name">${strat.name}</div>
          <div class="stratagem-desc">${strat.desc}</div>
        </div>
      `;

      opt.onclick = () => {
        handlers.onSelectStratagem(isActive ? null : strat.id);
      };
      stratPicker.appendChild(opt);
    });

    document.getElementById('btnLaunchBattle').onclick = () => {
      handlers.onStartBattle();
    };
  }

  // ================= BATTLE BOARD RENDERING =================
  renderBattle(battle, handlers) {
    // Top HUD
    document.getElementById('hudTurnBadge').textContent = `第 ${battle.currentTurn} / ${battle.chapter.maxTurns} 回合`;
    const phasePill = document.getElementById('hudPhasePill');
    phasePill.textContent = battle.phase === 'ally' ? '我方回合' : '敵方回合';
    phasePill.className = `battle-phase-pill ${battle.phase}`;

    const shortObj = battle.chapter.objectiveType === 'escort' ? '護送燈車' :
      battle.chapter.objectiveType === 'hold_gate' ? '守護城門' :
      battle.chapter.objectiveType === 'protect_lantern' ? '保護神燈' : '討伐鐵將';
    document.getElementById('hudObjectiveTicker').textContent = `${battle.chapter.mapName} · ${shortObj}`;

    // Background Map Image
    const mapBg = document.getElementById('battleMapBg');
    const expectedSrc = `assets/art/v4/${battle.chapter.image}`;
    if (!mapBg.src.includes(battle.chapter.image)) {
      mapBg.src = expectedSrc;
    }

    // Render Grid Tiles (10 cols x 13 rows)
    const gridEl = document.getElementById('tacticsGrid');
    gridEl.innerHTML = '';

    const reachable = handlers.reachableTiles || new Map();
    const attackable = handlers.attackableTiles || new Set();
    const aoeTiles = handlers.aoeTiles || new Set();
    const deploySlots = handlers.deploySlots || new Set();
    const selectedUnit = handlers.selectedUnit;

    for (let r = 0; r < 13; r++) {
      for (let c = 0; c < 10; c++) {
        const key = `${c},${r}`;
        const tileDiv = document.createElement('div');
        tileDiv.className = 'grid-tile';
        tileDiv.dataset.x = c;
        tileDiv.dataset.y = r;

        const char = battle.board.getTerrainChar(c, r);
        const isWalkable = !battle.board.isImpassable(c, r, false) && char !== 's';
        if (isWalkable) {
          tileDiv.classList.add('walkable');
        }

        if (reachable.has(key)) {
          tileDiv.classList.add('reachable');
        }
        if (attackable.has(key)) {
          tileDiv.classList.add('attackable');
        }
        if (aoeTiles.has(key)) {
          tileDiv.classList.add('aoe-preview');
        }
        if (deploySlots.has(key)) {
          tileDiv.classList.add('deploy-slot');
        }
        if (selectedUnit && selectedUnit.x === c && selectedUnit.y === r) {
          tileDiv.classList.add('selected');
        }

        let pressTimer = null;
        tileDiv.onpointerdown = () => {
          pressTimer = setTimeout(() => {
            handlers.onTileTap(c, r);
          }, 350);
        };
        tileDiv.onpointerup = () => clearTimeout(pressTimer);
        tileDiv.onpointercancel = () => clearTimeout(pressTimer);
        tileDiv.onpointermove = () => {
          if (this.hasDraggedBeyondThreshold) clearTimeout(pressTimer);
        };

        tileDiv.onclick = (e) => {
          clearTimeout(pressTimer);
          if (this.hasDraggedBeyondThreshold) return;
          handlers.onTileTap(c, r);
        };

        gridEl.appendChild(tileDiv);
      }
    }

    // Render Placed Lanterns Layer
    const lanternsLayer = document.getElementById('lanternsLayer');
    lanternsLayer.innerHTML = '';
    battle.board.lanterns.forEach(l => {
      const halo = document.createElement('div');
      halo.className = 'lantern-light-halo';
      halo.style.left = `${l.x * 64 + 32}px`;
      halo.style.top = `${l.y * 64 + 32}px`;
      const haloPx = (l.radius * 2 + 1) * 64;
      halo.style.width = `${haloPx}px`;
      halo.style.height = `${haloPx}px`;
      lanternsLayer.appendChild(halo);
    });

    // Render 2.5D Figures Layer
    const figuresLayer = document.getElementById('figuresLayer');
    figuresLayer.innerHTML = '';

    const allUnits = battle.getAllLivingUnits();
    allUnits.forEach(u => {
      const figWrap = document.createElement('div');
      figWrap.className = `unit-figure ${u.team} ${u.promoted ? 'promoted' : ''} ${u.acted ? 'acted' : ''}`;
      figWrap.style.left = `${u.x * 64}px`;
      figWrap.style.top = `${u.y * 64}px`;
      figWrap.style.setProperty('--row', u.y);
      figWrap.style.setProperty('--facing', u.facing ?? (u.team === 'ally' ? 1 : -1));

      // Desync idle breathing animation slightly
      const delay = ((u.x * 7 + u.y * 13) % 10) * 0.25;

      const isCart = (u.id === 'lantern_cart' || u.id === 'market_lantern');
      const figContent = isCart ?
        `<div class="npc-ambient-halo" style="position:absolute;width:64px;height:64px;background:radial-gradient(circle,rgba(255,190,60,0.5) 0%,transparent 70%);border-radius:50%;pointer-events:none;"></div>
         <img src="assets/art/v4/fig_${u.id}.webp" alt="${u.name}" class="unit-fig-img" style="animation-delay: -${delay}s;">` :
        `<img src="assets/art/v4/fig_${u.id}.webp" alt="${u.name}" class="unit-fig-img" style="animation-delay: -${delay}s;">`;

      figWrap.innerHTML = `
        <div class="unit-ground-shadow"></div>
        <div class="unit-team-ring"></div>
        ${figContent}
        <div class="unit-hp-bar">
          <div class="unit-hp-fill" style="width: ${Math.max(0, Math.min(100, Math.round((u.hp / u.maxHp) * 100)))}%;"></div>
        </div>
        <div class="unit-mp-bar">
          <div class="unit-mp-fill" style="width: ${Math.max(0, Math.min(100, Math.round(((u.mp ?? 6) / (u.maxMp ?? 6)) * 100)))}%;"></div>
        </div>
      `;

      figWrap.onclick = (e) => {
        if (this.hasDraggedBeyondThreshold) return;
        e.stopPropagation();
        handlers.onUnitTap(u);
      };

      figuresLayer.appendChild(figWrap);
    });

    // Bottom terrain info
    if (selectedUnit) {
      this.updateBottomStrip(selectedUnit.x, selectedUnit.y, battle.board, selectedUnit);
    }
  }

  updateBottomStrip(x, y, board, unit = null) {
    const t = board.getTerrain(x, y);
    document.getElementById('stripCoord').textContent = `(${x},${y})`;
    if (unit) {
      document.getElementById('stripTerrain').textContent =
        `${t.name} · 移${t.moveCost === 99 ? '∞' : t.moveCost} · 防${t.defBonus >= 0 ? '+' : ''}${t.defBonus}`;
      const unitInfoEl = document.getElementById('stripUnitInfo');
      unitInfoEl.style.display = 'block';
      unitInfoEl.textContent = `【${unit.name}】Lv.${unit.level || 1} HP ${unit.hp}/${unit.maxHp}`;
    } else {
      document.getElementById('stripTerrain').textContent =
        `${t.name} · 移耗 ${t.moveCost === 99 ? '∞' : t.moveCost} · 防${t.defBonus >= 0 ? '+' : ''}${t.defBonus} · 避+${t.evaBonus}%`;
      const unitInfoEl = document.getElementById('stripUnitInfo');
      unitInfoEl.style.display = 'none';
    }
  }

  showActionMenu(x, y, actions, onChooseAction, onCancel) {
    const pop = document.getElementById('actionMenuPopover');
    if (!pop) return;

    pop.style.display = 'flex';

    // Position menu near the unit tile within 640x832 stage
    const tilePx = 64;
    let menuLeft = x * tilePx - 36;
    let menuTop = y * tilePx - 135;

    if (menuTop < 10) menuTop = y * tilePx + 70; // flip below if at top edge
    if (menuLeft < 10) menuLeft = 10;
    if (menuLeft > 640 - 146) menuLeft = 640 - 146;

    pop.style.left = `${menuLeft}px`;
    pop.style.top = `${menuTop}px`;

    // Hook buttons with reason chips
    const btnAtk = document.getElementById('btnActionAttack');
    btnAtk.disabled = !actions.attack;
    btnAtk.title = actions.attack ? '進行普通攻擊' : (actions.attackReason || '範圍內無目標');
    btnAtk.innerHTML = `
      <span class="action-txt">攻擊</span>
      ${!actions.attack ? `<span class="action-reason-chip">${actions.attackReason || '無目標'}</span>` : ''}
    `;
    btnAtk.onclick = () => onChooseAction('attack');

    const btnSkill = document.getElementById('btnActionSkill');
    btnSkill.disabled = !actions.skill;
    btnSkill.title = actions.skill ? '施展專屬技能' : (actions.skillReason || 'MP不足');
    btnSkill.innerHTML = `
      <span class="action-txt">技能</span>
      <span class="action-cost-tag">${actions.skillCost ? `${actions.skillCost}MP` : ''}</span>
      ${!actions.skill ? `<span class="action-reason-chip">${actions.skillReason || 'MP不足'}</span>` : ''}
    `;
    btnSkill.onclick = () => onChooseAction('skill');

    const btnMag = document.getElementById('btnActionMagic');
    btnMag.disabled = !actions.magic;
    btnMag.title = actions.magic ? '施展五行法術' : (actions.magicReason || 'MP不足');
    btnMag.innerHTML = `
      <span class="action-txt">魔法</span>
      <span class="action-cost-tag">${actions.magicCost ? `${actions.magicCost}MP` : ''}</span>
      ${!actions.magic ? `<span class="action-reason-chip">${actions.magicReason || 'MP不足'}</span>` : ''}
    `;
    btnMag.onclick = () => onChooseAction('magic');

    const btnBond = document.getElementById('btnActionBond');
    if (actions.bond) {
      btnBond.style.display = 'flex';
      btnBond.onclick = () => onChooseAction('bond');
    } else {
      btnBond.style.display = 'none';
    }

    const btnWait = document.getElementById('btnActionWait');
    btnWait.onclick = () => onChooseAction('wait');

    const btnCancel = document.getElementById('btnActionCancel');
    btnCancel.onclick = () => onCancel();
  }

  hideActionMenu() {
    const pop = document.getElementById('actionMenuPopover');
    if (pop) pop.style.display = 'none';
  }

  showTargetPreview(preview, onConfirm, onBack) {
    const card = document.getElementById('targetPreviewCard');
    if (!card) return;

    card.style.display = 'block';
    this.hideActionMenu();

    const { attacker, defender, direction, isBackAttack, isSideAttack, expectedDamage, hitRate, critRate, canCounter, counterDamage, counterHitRate, willKill } = preview;

    // Badges & texts
    const dirBadge = document.getElementById('prevDirectionBadge');
    if (isBackAttack) {
      dirBadge.className = 'preview-direction-badge back';
      dirBadge.textContent = '背擊 (+50% 無反擊)';
    } else if (isSideAttack) {
      dirBadge.className = 'preview-direction-badge';
      dirBadge.textContent = '側擊 (+20%)';
    } else {
      dirBadge.className = 'preview-direction-badge';
      dirBadge.textContent = '正面交鋒';
    }

    // Attacker
    document.getElementById('prevAttackerPor').src = `assets/art/v4/por_${attacker.id}.webp`;
    document.getElementById('prevAttackerName').textContent = attacker.name;
    document.getElementById('prevDamageVal').textContent = `${expectedDamage} 傷害`;
    document.getElementById('prevAttackerRates').textContent = `命中 ${hitRate}% · 暴擊 ${critRate}%`;

    // Defender
    document.getElementById('prevDefenderPor').src = `assets/art/v4/por_${defender.id}.webp`;
    document.getElementById('prevDefenderName').textContent = defender.name;
    if (canCounter) {
      document.getElementById('prevCounterVal').textContent = `反擊: ${counterDamage} 傷害`;
      document.getElementById('prevDefenderRates').textContent = `反擊命中 ${counterHitRate}%`;
    } else {
      document.getElementById('prevCounterVal').textContent = '無反擊';
      document.getElementById('prevDefenderRates').textContent = '-';
    }

    // KO indicator
    document.getElementById('prevKoBadge').style.display = willKill ? 'inline-block' : 'none';

    // Buttons
    document.getElementById('btnConfirmAction').onclick = () => {
      this.hideTargetPreview();
      onConfirm();
    };

    document.getElementById('btnBackToMenu').onclick = () => {
      this.hideTargetPreview();
      onBack();
    };
  }

  hideTargetPreview() {
    const card = document.getElementById('targetPreviewCard');
    if (card) card.style.display = 'none';
  }

  showTurnBanner(phaseName, subTxt, callback) {
    const banner = document.getElementById('turnBanner');
    if (!banner) return;
    document.getElementById('bannerMainTxt').textContent = phaseName;
    document.getElementById('bannerSubTxt').textContent = subTxt;
    banner.style.display = 'flex';

    setTimeout(() => {
      banner.style.display = 'none';
      if (callback) callback();
    }, 1200);
  }

  showStoryDialogue(dialogueLines, onComplete) {
    const modal = document.getElementById('modalDialogue');
    if (!modal) return;

    modal.style.display = 'flex';
    let lineIdx = 0;

    const renderLine = () => {
      const cur = dialogueLines[lineIdx];
      if (!cur) {
        modal.style.display = 'none';
        if (onComplete) onComplete();
        return;
      }

      const por = document.getElementById('dialoguePortrait');
      por.src = `assets/art/v4/por_${cur.speaker}.webp`;
      por.className = `dialogue-portrait mood-${cur.mood || 'calm'}`;

      const proto = GUARDIAN_PROTOS[cur.speaker] || ENEMY_PROTOS[cur.speaker];
      document.getElementById('dialogueSpeakerName').textContent = proto ? proto.name : '守夜人';
      document.getElementById('dialogueSpeakerTitle').textContent = proto ? (proto.title || proto.cls) : '';
      document.getElementById('dialogueText').textContent = cur.text;
    };

    renderLine();

    document.getElementById('btnNextDialogue').onclick = () => {
      lineIdx++;
      renderLine();
    };
  }

  showBoardTutorial(step = 0, onStepChange, onComplete) {
    const overlay = document.getElementById('tutorialBoardOverlay');
    if (!overlay) return;

    overlay.style.display = 'flex';
    const steps = [
      { num: '1 / 3', text: '① 「撳角色 → 藍格係可以行嘅位」' },
      { num: '2 / 3', text: '② 「撳藍格移動 → 揀 攻擊/技能/魔法/待命」' },
      { num: '3 / 3', text: '③ 「紅格係攻擊範圍，睇清傷害預覽先確認」' }
    ];

    let curStep = step;
    const render = () => {
      const s = steps[curStep];
      document.getElementById('boardTutorialStep').textContent = s.num;
      document.getElementById('boardTutorialText').textContent = s.text;
    };

    render();
    if (onStepChange) onStepChange(curStep);

    document.getElementById('btnBoardTutorialAck').onclick = () => {
      if (curStep < 2) {
        curStep++;
        render();
        if (onStepChange) onStepChange(curStep);
      } else {
        overlay.style.display = 'none';
        if (onComplete) onComplete();
      }
    };
  }

  hideBoardTutorial() {
    const overlay = document.getElementById('tutorialBoardOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  renderDeployPhase(chapter, squadUnits, deployTiles, placedMap, onSelectSquadUnit, onConfirmDeploy) {
    const tray = document.getElementById('deployTrayBar');
    if (!tray) return;

    tray.style.display = 'flex';
    const container = document.getElementById('deployTrayUnits');
    container.innerHTML = '';

    const totalNeeded = squadUnits.length;
    let placedCount = 0;

    squadUnits.forEach(u => {
      const isPlaced = placedMap.has(u.id);
      if (isPlaced) placedCount++;

      const chip = document.createElement('div');
      chip.className = `deploy-unit-chip ${isPlaced ? 'placed' : ''}`;
      chip.dataset.unitId = u.id;
      chip.innerHTML = `
        <img src="assets/art/v4/por_${u.id}.webp" alt="${u.name}" class="deploy-unit-por">
        <div class="deploy-unit-name">${u.name}</div>
      `;
      chip.onclick = () => {
        document.querySelectorAll('.deploy-unit-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        onSelectSquadUnit(u);
      };
      container.appendChild(chip);
    });

    document.getElementById('deployStatusBadge').textContent = `${placedCount} / ${totalNeeded} 已就位`;
    document.getElementById('btnConfirmDeploy').onclick = () => {
      onConfirmDeploy();
    };
  }

  hideDeployPhase() {
    const tray = document.getElementById('deployTrayBar');
    if (tray) tray.style.display = 'none';
  }

  showTutorial(step = 0, onComplete) {
    this.showBoardTutorial(step, null, onComplete);
  }

  showDetailSheet(unitInst, campaign, onRelicChanged) {
    const modal = document.getElementById('modalDetailSheet');
    if (!modal) return;
    modal.style.display = 'flex';

    document.getElementById('detailPortrait').src = `assets/art/v4/por_${unitInst.id}.webp`;
    document.getElementById('detailTitle').textContent = unitInst.title || unitInst.cls;
    document.getElementById('detailLevel').textContent = `Lv.${unitInst.level || 1}`;
    document.getElementById('detailName').textContent = unitInst.name;
    document.getElementById('detailClass').textContent = `${unitInst.cls} · MOV ${unitInst.mov}`;

    document.getElementById('detailHp').textContent = `${unitInst.hp}/${unitInst.maxHp}`;
    const detailMpEl = document.getElementById('detailMp');
    if (detailMpEl) detailMpEl.textContent = `${unitInst.mp ?? 6}/${unitInst.maxMp ?? 6}`;
    const detailMovEl = document.getElementById('detailMov');
    if (detailMovEl) detailMovEl.textContent = `${unitInst.mov}`;
    document.getElementById('detailAtk').textContent = unitInst.atk;
    document.getElementById('detailDef').textContent = unitInst.def;
    document.getElementById('detailMag').textContent = unitInst.mag;
    document.getElementById('detailRes').textContent = unitInst.res;
    document.getElementById('detailSpd').textContent = unitInst.spd;

    document.getElementById('detailTrait').textContent = `【${unitInst.trait.name}】${unitInst.trait.desc}`;

    // Render both skill and magic as two clean rows
    const s = unitInst.skill;
    const m = unitInst.magic;
    const sRange = Array.isArray(s?.range) ? s.range.join('-') : (s?.range ?? 1);
    const mRange = Array.isArray(m?.range) ? m.range.join('-') : (m?.range ?? 2);
    document.getElementById('detailSkills').innerHTML = `
      <div style="margin-bottom: 5px;">
        <span style="color:var(--lantern-gold);font-weight:700;">【技能·${s.name}】</span>(消耗 ${s.cost || 2} MP, 射程 ${sRange})：${s.desc}
      </div>
      <div>
        <span style="color:#70C1B3;font-weight:700;">【法術·${m.name}】</span>(消耗 ${m.cost || 3} MP, 射程 ${mRange})：${m.desc}
      </div>
    `;

    // Relic display
    const relicObj = RELICS.find(r => r.id === unitInst.relic);
    document.getElementById('detailRelicDisplay').textContent = relicObj ? `【${relicObj.name}】${relicObj.desc}` : '未裝備寶物';

    // Bond display (deduplicated)
    const bond = BOND_PAIRS.find(b => b.pair.includes(unitInst.id));
    if (bond) {
      const partnerId = bond.pair.find(id => id !== unitInst.id);
      const partnerProto = GUARDIAN_PROTOS[partnerId];
      const cleanDesc = (bond.desc || '')
        .replace(/^相鄰時解鎖合擊：/, '')
        .replace(/（每戰限1次）$/, '')
        .trim();
      document.getElementById('detailBond').textContent = `與【${partnerProto?.name}】相鄰時解鎖【${bond.name}】合擊（每戰限1次）：${cleanDesc}`;
    } else {
      document.getElementById('detailBond').textContent = '暫無特殊合擊羈絆。';
    }

    document.getElementById('detailLore').textContent = unitInst.backstory || '巡夜守護之人。';

    document.getElementById('btnCloseDetailSheet').onclick = () => {
      modal.style.display = 'none';
    };

    document.getElementById('btnEquipRelic').onclick = () => {
      // Cycle through available campaign relics
      if (!campaign.relics || campaign.relics.length === 0) return;
      const curIdx = campaign.relics.indexOf(unitInst.relic);
      const nextRelic = campaign.relics[(curIdx + 1) % campaign.relics.length];
      campaign.equipRelic(unitInst.id, nextRelic);
      unitInst.relic = nextRelic;
      const updatedRelic = RELICS.find(r => r.id === nextRelic);
      document.getElementById('detailRelicDisplay').textContent = updatedRelic ? `【${updatedRelic.name}】${updatedRelic.desc}` : '未裝備寶物';
      if (onRelicChanged) onRelicChanged();
    };
  }

  showLevelUpModal(unitInst, onChosenPerk) {
    const modal = document.getElementById('modalLevelUp');
    if (!modal) return;
    modal.style.display = 'flex';

    document.getElementById('levelUpUnitPrompt').textContent = `【${unitInst.name}】晉升至 Lv.${unitInst.level}！請選取一項突破：`;

    const choices = [
      { type: 'atk', name: '銳意進取', boost: '攻擊力 +3' },
      { type: 'mov', name: '迅捷如風', boost: '移動力 +1' },
      { type: 'def_hp', name: '固若金湯', boost: '防禦 +2 · 氣血上限 +6' }
    ];

    const grid = document.getElementById('levelUpChoicesGrid');
    grid.innerHTML = '';

    choices.forEach(c => {
      const item = document.createElement('div');
      item.className = 'levelup-choice-card';
      item.innerHTML = `
        <span class="choice-perk-name">${c.name}</span>
        <span class="choice-perk-boost">${c.boost}</span>
      `;
      item.onclick = () => {
        modal.style.display = 'none';
        onChosenPerk(c.type);
      };
      grid.appendChild(item);
    });
  }

  showBattleResult(status, chapter, onContinue) {
    const modal = document.getElementById('modalBattleResult');
    if (!modal) return;
    modal.style.display = 'flex';

    const card = document.getElementById('resultCard');
    const title = document.getElementById('resultTitle');
    const sub = document.getElementById('resultSubtitle');
    const relicWrap = document.getElementById('resultRelicReward');

    if (status.victory) {
      card.className = 'result-card victory';
      title.textContent = '大獲全勝';
      sub.textContent = status.reason || '天光破曉 · 迷霧退散';
      document.getElementById('resultExpAwards').textContent = '參戰將士每人獲得 30 點軍略功勳 (EXP)！';

      const relicRewards = { 1: '疾風履', 2: '靈心玉', 3: '勇者印', 4: '靈泉茶囊' };
      const rName = relicRewards[chapter.id];
      if (rName) {
        relicWrap.style.display = 'block';
        document.getElementById('resultRelicName').textContent = rName;
      } else {
        relicWrap.style.display = 'none';
      }
    } else {
      card.className = 'result-card defeat';
      title.textContent = '守夜失利';
      sub.textContent = status.reason || '夜霧重重 · 退守整軍';
      document.getElementById('resultExpAwards').textContent = '將士稍作休整，整頓兵甲以待再戰。';
      relicWrap.style.display = 'none';
    }

    document.getElementById('btnResultContinue').onclick = () => {
      modal.style.display = 'none';
      onContinue();
    };
  }
}
