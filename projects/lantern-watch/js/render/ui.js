/**
 * js/render/ui.js
 * DOM rendering engine, camera panning, 2.5D unit figures, combat previews,
 * action menus, and modal dialogs for 燈影軍略 · Lantern Tactics (v4).
 */

import { CHAPTERS, TERRAIN_INFO } from '../data/maps.js';
import { GUARDIAN_PROTOS, ENEMY_PROTOS, STRATAGEMS, RELICS, BOND_PAIRS, PROMOTIONS } from '../data/units.js';

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
    const vpHeight = vp.clientHeight || 520;

    const maxScrollX = Math.max(0, 704 - vpWidth);
    const maxScrollY = Math.max(0, 940 - vpHeight);

    let scrollX = targetX - vpWidth / 2;
    let scrollY = targetY - vpHeight / 2;

    // Right-edge protection: when focusing on units in middle/right columns (x >= 4),
    // ensure rightmost units (up to col 7/8 + 48px margin) stay fully inside the viewport
    if (x >= 4) {
      scrollX = Math.max(scrollX, 160);
    }

    // Bottom safe inset & Grokbot clearance:
    // When unit is near bottom (y >= 10), scroll down so unit's feet stay >=64px above viewport bottom
    if (y >= 10) {
      scrollY = Math.max(160, (y * tilePx + 64) - vpHeight + 72);
    }

    // Top safe inset: if focused on northern battlefield (y <= 7), ensure top units never get clipped
    if (y <= 7) {
      scrollY = Math.min(scrollY, Math.max(0, (y - 1) * tilePx));
    }

    scrollX = Math.max(0, Math.min(maxScrollX, scrollX));
    scrollY = Math.max(0, Math.min(maxScrollY, scrollY));

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
      4: { left: '58%', top: '20%', name: '第四回 · 山道' },
      5: { left: '40%', top: '38%', name: '第五回 · 竹海' }
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
    // Painted Chapter Banner
    const bannerArt = document.getElementById('preBannerArt');
    if (bannerArt) {
      bannerArt.style.backgroundImage = `url('assets/art/v4/banner_ch${chapter.id}.webp')`;
    }

    document.getElementById('preChapterTitle').textContent = chapter.title;
    document.getElementById('preObjectiveDesc').textContent = chapter.objectiveDesc;
    document.getElementById('preDefeatDesc').textContent = chapter.defeatDesc;

    // Scout enemies
    const scoutGrid = document.getElementById('scoutEnemyGrid');
    scoutGrid.innerHTML = '';
    document.getElementById('preEnemyCountBadge').textContent = `${chapter.enemySpawns.length} 支部隊`;

    const enemyCounts = {};
    chapter.enemySpawns.forEach(e => {
      enemyCounts[e.id] = (enemyCounts[e.id] || 0) + 1;
    });

    const ROLE_ZH = {
      cavalry: '騎兵',
      archer: '弓手',
      fire_archer: '烈弓',
      shield_guard: '盾衛',
      sorcerer: '術士',
      healer: '醫官',
      shrouded: '刺客',
      scout: '斥候',
      spirit: '鬼魅',
      commander: '主將',
      boss: '首領'
    };

    const WEAKNESS_ZH = {
      paper_ghost: '弱雷(×2)·火免疫',
      shield_guard: '正面減傷-70%·弱背刺',
      shadow_rat: '匿霧隱身·弱燈火照亮',
      shadow_archer: '高地狙擊·近身不能反擊',
      fog_rider: '弱槍盾領域(ZOC)',
      mist_sorcerer: '弱近身突刺·怕打斷',
      fire_archer: '怕近身·林地加成',
      mist_scout: '弱防禦·懼包抄',
      iron_general: '弱背擊·落水KO'
    };

    Object.entries(enemyCounts).forEach(([eid, count]) => {
      const proto = ENEMY_PROTOS[eid];
      if (!proto) return;
      const roleName = ROLE_ZH[proto.role] || proto.cls;
      const roleBadge = (proto.cls && proto.cls !== roleName) ? `${proto.cls} · ${roleName}` : roleName;
      const weakBadge = WEAKNESS_ZH[eid] || '常規弱點';
      const card = document.createElement('div');
      card.className = 'scout-enemy-card';
      card.innerHTML = `
        <div class="scout-por-wrap">
          <img src="assets/art/v4/por_${eid}.webp" alt="${proto.name}" class="scout-enemy-por">
          <span class="scout-count-badge">×${count}</span>
        </div>
        <div class="scout-enemy-info">
          <div class="scout-enemy-name-row">
            <span class="scout-enemy-name">${proto.name}</span>
            <span class="scout-role-pill">${roleBadge}</span>
          </div>
          <span class="scout-weakness-pill">${weakBadge}</span>
        </div>
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
      battle.chapter.objectiveType === 'protect_lantern' ? '保護神燈' :
      battle.chapter.objectiveType === 'reach_shrine_or_rout' ? '佔領神壇' : '討伐鐵將';
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
        const isWalkable = !battle.board.isImpassable(c, r, false) && char !== 's' && char !== 'w';
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
    btnSkill.title = actions.skill ? '施展專屬計策' : (actions.skillReason || 'MP不足');
    btnSkill.innerHTML = `
      <span class="action-txt">計策</span>
      <span class="action-cost-tag">${actions.skillCost ? `${actions.skillCost}MP` : ''}</span>
      ${!actions.skill ? `<span class="action-reason-chip">${actions.skillReason || 'MP不足'}</span>` : ''}
    `;
    btnSkill.onclick = () => onChooseAction('skill');

    const btnMag = document.getElementById('btnActionMagic');
    btnMag.disabled = !actions.magic;
    btnMag.title = actions.magic ? '施展五行法術' : (actions.magicReason || 'MP不足');
    btnMag.innerHTML = `
      <span class="action-txt">法術</span>
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

    const { attacker, defender, direction, isBackAttack, isSideAttack, expectedDamage, hitRate, critRate, canCounter, counterDamage, counterHitRate, willKill, comboAlly, comboDamage } = preview;

    // Auto-pan camera so attacker, defender, and combo ally are all in clear upper 55% of viewport above preview panel
    const vp = document.getElementById('battleViewport');
    if (vp) {
      const tilePx = 64;
      const unitsToFrame = [attacker, defender];
      if (comboAlly) unitsToFrame.push(comboAlly);

      const minX = Math.min(...unitsToFrame.map(u => u.x));
      const maxX = Math.max(...unitsToFrame.map(u => u.x));
      const minY = Math.min(...unitsToFrame.map(u => u.y));
      const maxY = Math.max(...unitsToFrame.map(u => u.y));

      const midX = ((minX + maxX) / 2) * tilePx + 32;
      const midY = ((minY + maxY) / 2) * tilePx + 32;
      const vpWidth = vp.clientWidth || 390;
      const vpHeight = vp.clientHeight || 520;
      const maxScrollX = Math.max(0, 704 - vpWidth);
      const maxScrollY = Math.max(0, 940 - vpHeight);

      let sx = midX - vpWidth / 2;
      // Position midY at ~140px from top so units comfortably sit in upper 45-55% of viewport
      let sy = midY - 140;

      if (Math.max(...unitsToFrame.map(u => u.x)) >= 4) {
        sx = Math.max(sx, 160);
      }
      sx = Math.max(0, Math.min(maxScrollX, sx));
      sy = Math.max(0, Math.min(maxScrollY, sy));
      vp.scrollTo({ left: sx, top: sy, behavior: 'auto' });
    }

    // Combo badge
    const comboEl = document.getElementById('prevComboBadge');
    if (comboEl) {
      if (comboAlly) {
        comboEl.style.display = 'inline-block';
        comboEl.textContent = `【協力合擊】+${comboAlly.name} (+${comboDamage})`;
      } else {
        comboEl.style.display = 'none';
      }
    }

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
      document.getElementById('dialogueSpeakerName').textContent = proto ? proto.name : '軍師';
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
    this.showTacticsTutorialModal(onComplete);
  }

  showTacticsTutorialModal(onClose) {
    const modal = document.getElementById('modalTutorial');
    if (!modal) return;
    modal.style.display = 'flex';

    const steps = [
      {
        num: '第 1 / 4 步',
        icon: '⚑',
        title: '【步法前進 · 靈活走位】',
        text: '點選我方將士，腳下藍色格子為合法移動範圍。再次點選藍格，將士即可調兵遣將挺進目標位置。'
      },
      {
        num: '第 2 / 4 步',
        icon: '⚔',
        title: '【戰術指令 · 四維謀略】',
        text: '移動後喚出軍略指令選單：常規「攻擊」、扣除MP之專屬「技能」、屬性剋制之「魔法」，或原地堅守「待命」。'
      },
      {
        num: '第 3 / 4 步',
        icon: '🎯',
        title: '【射程預覽 · 克制背擊】',
        text: '紅色格子為打擊射程。點選目標即可查看命中率、傷害與敵方反擊預測；繞至敵後發動「背擊」可享+50%（劍客+100%）巨額傷害！'
      },
      {
        num: '第 4 / 4 步',
        icon: '⛰',
        title: '【地形兵法 · 結束回合】',
        text: '石橋為隘口通道，河道深水不可涉足，樹林具掩體防禦加成。全員行動完畢點擊「結束回合」，輪至敵軍進犯。'
      }
    ];

    let curStep = 0;
    const stepInd = document.getElementById('tutorialStepIndicator');
    const iconEl = document.getElementById('tutorialIcon');
    const titleEl = document.getElementById('tutorialStepTitle');
    const instEl = document.getElementById('tutorialInstruction');
    const btnPrev = document.getElementById('btnTutorialPrev');
    const btnNext = document.getElementById('btnTutorialNext');
    const btnTxt = document.getElementById('btnTutorialTxt');
    const btnClose = document.getElementById('btnCloseTutorialModal');

    const updateView = () => {
      const s = steps[curStep];
      if (stepInd) stepInd.textContent = s.num;
      if (iconEl) iconEl.textContent = s.icon;
      if (titleEl) titleEl.textContent = s.title;
      if (instEl) instEl.textContent = s.text;

      if (btnPrev) btnPrev.style.display = curStep > 0 ? 'inline-flex' : 'none';
      if (btnTxt) btnTxt.textContent = curStep === steps.length - 1 ? '明白出征 ✦' : '下一步 ▶';
    };

    updateView();

    if (btnPrev) {
      btnPrev.onclick = () => {
        if (curStep > 0) {
          curStep--;
          updateView();
        }
      };
    }

    if (btnNext) {
      btnNext.onclick = () => {
        if (curStep < steps.length - 1) {
          curStep++;
          updateView();
        } else {
          modal.style.display = 'none';
          if (onClose) onClose();
        }
      };
    }

    if (btnClose) {
      btnClose.onclick = () => {
        modal.style.display = 'none';
        if (onClose) onClose();
      };
    }
  }

  playCombatVfx(attacker, defender, combatInfo = {}, speed = 1, onComplete = null) {
    const vfxLayer = document.getElementById('vfxLayer') || document.getElementById('battleBoardStage');
    const figuresLayer = document.getElementById('figuresLayer');
    const durMult = speed === 2 ? 0.5 : 1.0;

    // Trigger attacker lunge animation
    const attackerEl = figuresLayer?.querySelector(`[data-unit-id="${attacker.id}"]`);
    if (attackerEl) {
      attackerEl.classList.add('anim-lunge');
      setTimeout(() => attackerEl.classList.remove('anim-lunge'), 200 * durMult);
    }

    // Trigger defender hurt shake after a brief delay
    setTimeout(() => {
      const defenderEl = figuresLayer?.querySelector(`[data-unit-id="${defender.id}"]`);
      if (defenderEl) {
        defenderEl.classList.add('anim-hurt');
        setTimeout(() => defenderEl.classList.remove('anim-hurt'), 400 * durMult);
      }

      const element = combatInfo.element || (combatInfo.actionType === 'magic' ? 'thunder' : null);
      const vp = document.getElementById('battleViewport');

      // Heavy shake & thunder white screen flash
      if (element === 'thunder') {
        vp?.classList.add('anim-thunder-flash');
        setTimeout(() => vp?.classList.remove('anim-thunder-flash'), 300 * durMult);
      }
      if (combatInfo.isCrit || combatInfo.damage >= 12) {
        vp?.classList.add('anim-heavy-shake');
        setTimeout(() => vp?.classList.remove('anim-heavy-shake'), 400 * durMult);
      }

      // Add elemental spell or slash VFX at defender position
      if (vfxLayer) {
        const vfx = document.createElement('div');
        const tilePx = 64;
        const centerX = defender.x * tilePx + 32;
        const centerY = defender.y * tilePx + 32;

        vfx.style.left = `${centerX}px`;
        vfx.style.top = `${centerY}px`;

        if (element === 'fire') {
          vfx.className = 'vfx-fire-burst';
        } else if (element === 'thunder') {
          vfx.className = 'vfx-thunder-strike';
        } else if (element === 'water') {
          vfx.className = 'vfx-water-burst';
        } else if (element === 'wind') {
          vfx.className = 'vfx-wind-slash';
        } else if (combatInfo.isHeal) {
          vfx.className = 'vfx-heal-light';
        } else {
          vfx.className = 'vfx-slash-trail';
        }

        vfxLayer.appendChild(vfx);
        setTimeout(() => vfx.remove(), 700 * durMult);
      }

      // Show floating damage number & badges
      this.showFloatingDamage(defender.x, defender.y, combatInfo);

      // Trigger Combo / 協力攻擊 if present
      if (combatInfo.comboAlly) {
        setTimeout(() => {
          const comboEl = figuresLayer?.querySelector(`[data-unit-id="${combatInfo.comboAlly.id}"]`);
          if (comboEl) {
            comboEl.classList.add('anim-lunge');
            setTimeout(() => comboEl.classList.remove('anim-lunge'), 200 * durMult);
          }
          if (vfxLayer) {
            const vfx2 = document.createElement('div');
            const tilePx = 64;
            vfx2.style.left = `${defender.x * tilePx + 32}px`;
            vfx2.style.top = `${defender.y * tilePx + 32}px`;
            vfx2.className = 'vfx-slash-trail';
            vfxLayer.appendChild(vfx2);
            setTimeout(() => vfx2.remove(), 400 * durMult);
          }
          this.showFloatingDamage(defender.x, defender.y, { damage: combatInfo.comboDamage, isCombo: true });
        }, 220 * durMult);
      }

      // Defeat ink-dissolve if defender defeated
      if (defender.hp <= 0 && defenderEl) {
        defenderEl.classList.add('anim-ko');
      }

      setTimeout(() => {
        if (onComplete) onComplete();
      }, 550 * durMult);
    }, 120 * durMult);
  }

  showFloatingDamage(x, y, info = {}) {
    const vfxLayer = document.getElementById('vfxLayer') || document.getElementById('battleBoardStage');
    if (!vfxLayer) return;

    const floater = document.createElement('div');
    const tilePx = 64;
    floater.style.left = `${x * tilePx + 32}px`;
    floater.style.top = `${y * tilePx - 26}px`;

    let floaterClass = 'floating-dmg-number';
    let tagHtml = '';

    if (info.isHeal) {
      floaterClass += ' heal';
      tagHtml = '<span class="floating-tag-badge" style="background:#059669;color:#fff;">甘露回春！</span>';
      floater.innerHTML = `${tagHtml}+${info.healAmount || 12}`;
    } else if (info.isMiss) {
      floater.className = `${floaterClass} block`;
      floater.innerHTML = `<span class="floating-tag-badge block">迴避</span>未中`;
    } else if (info.isCombo) {
      floaterClass += ' crit';
      floater.innerHTML = `<span class="floating-tag-badge crit">【協力合擊！】</span>-${info.damage ?? 6}`;
    } else {
      if (info.isCrit) {
        floaterClass += ' crit';
        tagHtml += '<span class="floating-tag-badge crit">暴擊！</span>';
      } else if (info.isBackAttack) {
        floaterClass += ' back';
        tagHtml += '<span class="floating-tag-badge back">背擊！</span>';
      } else if (info.isFrontBlocked) {
        floaterClass += ' block';
        tagHtml += '<span class="floating-tag-badge block">鐵壁格擋！</span>';
      } else if (info.isWeakness) {
        floaterClass += ' weak';
        tagHtml += '<span class="floating-tag-badge weak">屬性克制！</span>';
      } else if (info.isCounter) {
        tagHtml += '<span class="floating-tag-badge counter">反擊！</span>';
      }

      floater.className = floaterClass;
      floater.innerHTML = `${tagHtml}-${info.damage ?? 10}`;
    }

    vfxLayer.appendChild(floater);
    setTimeout(() => floater.remove(), 800);
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
    if (s || m) {
      const sRange = Array.isArray(s?.range) ? s.range.join('-') : (s?.range ?? 1);
      const mRange = Array.isArray(m?.range) ? m.range.join('-') : (m?.range ?? 2);
      document.getElementById('detailSkills').innerHTML = `
        ${s ? `<div style="margin-bottom: 5px;"><span style="color:var(--lantern-gold);font-weight:700;">【技能·${s.name}】</span>(消耗 ${s.cost || 2} MP, 射程 ${sRange})：${s.desc}</div>` : ''}
        ${m ? `<div><span style="color:#70C1B3;font-weight:700;">【法術·${m.name}】</span>(消耗 ${m.cost || 3} MP, 射程 ${mRange})：${m.desc}</div>` : ''}
      `;
    } else {
      document.getElementById('detailSkills').innerHTML = `<div><span style="color:var(--lantern-gold);font-weight:700;">【兵種軍略】</span>${unitInst.tacticalHint || '標準主力攻擊'}</div>`;
    }

    // Relic display
    const isEnemy = unitInst.team === 'enemy' || !!ENEMY_PROTOS[unitInst.id];
    const relicBtn = document.getElementById('btnEquipRelic');
    if (relicBtn) relicBtn.style.display = isEnemy ? 'none' : 'inline-block';

    const relicObj = RELICS.find(r => r.id === unitInst.relic);
    document.getElementById('detailRelicDisplay').textContent = isEnemy ? '無裝備寶物' : (relicObj ? `【${relicObj.name}】${relicObj.desc}` : '未裝備寶物');

    const rImg = document.getElementById('detailRelicImg');
    if (rImg) {
      if (relicObj && relicObj.img && !isEnemy) {
        rImg.src = relicObj.img;
        rImg.style.display = 'block';
      } else {
        rImg.style.display = 'none';
      }
    }

    // Class progression path display
    const promo = PROMOTIONS[unitInst.id];
    const pathEl = document.getElementById('detailClassPath');
    if (pathEl) {
      pathEl.textContent = promo ? `${unitInst.cls} ➔ ${promo.newClass}（${unitInst.promoted ? '已進階 · 領悟【' + promo.promotedSkill.name + '】' : '晉升至Lv.2領悟【' + promo.promotedSkill.name + '】'}）` : '頂級兵種';
    }

    // Bond display (deduplicated)
    const bond = BOND_PAIRS.find(b => b.pair.includes(unitInst.id));
    if (isEnemy) {
      document.getElementById('detailBond').textContent = '敵軍部隊無合擊羈絆。';
    } else if (bond) {
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

    document.getElementById('detailLore').textContent = unitInst.backstory || '燈影麾下英豪。';

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
      if (rImg) {
        if (updatedRelic && updatedRelic.img) {
          rImg.src = updatedRelic.img;
          rImg.style.display = 'block';
        } else {
          rImg.style.display = 'none';
        }
      }
      if (onRelicChanged) onRelicChanged();
    };
  }

  showLevelUpModal(unitInst, newLevelOrCb, onChosenPerk) {
    const modal = document.getElementById('modalLevelUp');
    if (!modal) return;
    modal.style.display = 'flex';

    let newLevel = null;
    let callback = onChosenPerk;
    if (typeof newLevelOrCb === 'function') {
      callback = newLevelOrCb;
      newLevel = unitInst.level > 1 ? unitInst.level : 2;
    } else {
      newLevel = newLevelOrCb || (unitInst.level > 1 ? unitInst.level : 2);
    }

    const promo = PROMOTIONS[unitInst.id];
    const promoBanner = document.getElementById('levelUpPromoBanner');
    if (promoBanner) {
      if (promo) {
        promoBanner.style.display = 'inline-block';
        promoBanner.textContent = `✦ 領悟兵種晉升：【${unitInst.cls}】➔【${promo.newClass}】 ✦`;
      } else {
        promoBanner.style.display = 'none';
      }
    }

    const por = document.getElementById('levelUpUnitPor');
    if (por) {
      por.src = `assets/art/v4/por_${unitInst.id}.webp`;
      por.alt = unitInst.name;
    }

    document.getElementById('levelUpUnitPrompt').textContent = `【${unitInst.name}】晉升至 Lv.${newLevel}！請選取一項突破（二選一）：`;

    const choices = [
      { type: 'atk', name: '銳意進取', boost: '攻擊力 +3 · 破甲暴擊' },
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
        if (callback) callback(c.type);
      };
      grid.appendChild(item);
    });
  }

  showBattleResult(status, chapter, onContinue, campaign = null, squad = null) {
    const modal = document.getElementById('modalBattleResult');
    if (!modal) return;
    modal.style.display = 'flex';

    const card = document.getElementById('resultCard');
    const title = document.getElementById('resultTitle');
    const sub = document.getElementById('resultSubtitle');
    const relicWrap = document.getElementById('resultRelicReward');
    const xpList = document.getElementById('resultXpList');

    if (status.victory) {
      card.className = 'result-card victory';
      title.textContent = '大獲全勝';
      sub.textContent = status.reason || '天光破曉 · 迷霧退散';
      document.getElementById('resultExpAwards').textContent = '參戰將士每人獲得 50 點軍略功勳 (EXP)！';

      if (xpList) {
        xpList.innerHTML = '';
        const activeSquad = squad || (campaign?.selectedSquad ? campaign.selectedSquad.map(id => campaign.getUnitInstance(id)) : [
          { id: 'cat_patrol', name: '墨影', exp: 60 },
          { id: 'bear_guard', name: '熊岳', exp: 75 },
          { id: 'tea_master', name: '茶翁', exp: 40 },
          { id: 'lantern_crafter', name: '燈娘 小螢', exp: 55 }
        ]);
        activeSquad.forEach(u => {
          if (!u || u.role === 'npc' || u.role === 'objective' || u.id === 'lantern_cart') return;
          const row = document.createElement('div');
          row.className = 'xp-unit-row';
          row.innerHTML = `
            <img src="assets/art/v4/por_${u.id}.webp" class="xp-unit-por" alt="${u.name}">
            <span class="xp-unit-name">${u.name}</span>
            <div class="xp-bar-track"><div class="xp-bar-fill" style="width: ${Math.min(100, ((u.exp || 30) % 100))}%"></div></div>
            <span class="xp-gain-badge">+50 EXP</span>
          `;
          xpList.appendChild(row);
        });
      }

      const relicRewardMap = {
        1: { id: 'sword_yitian', name: '倚天古劍', img: 'assets/art/v4/item_sword.webp', desc: '攻擊力 +4 · 暴擊率 +15%' },
        2: { id: 'tome_taiping', name: '太平天書', img: 'assets/art/v4/item_tome.webp', desc: '法術力 +4 · 技力上限 +4' },
        3: { id: 'armor_xuanjia', name: '玄鐵明光甲', img: 'assets/art/v4/item_armor.webp', desc: '防禦力 +3 · 氣血上限 +12' },
        4: { id: 'spirit_jade', name: '靈心玉', img: 'assets/art/v4/item_tome.webp', desc: '法術力 +3' },
        5: { id: 'tea_leaf_pouch', name: '靈泉茶囊', img: 'assets/art/v4/item_tome.webp', desc: '生命上限 +10' }
      };

      const rew = relicRewardMap[chapter?.id || 1] || relicRewardMap[1];
      if (rew && relicWrap) {
        relicWrap.style.display = 'block';
        const rImg = document.getElementById('resultRelicImg');
        if (rImg) rImg.src = rew.img;
        document.getElementById('resultRelicName').textContent = rew.name;
        const rDesc = document.getElementById('resultRelicDesc');
        if (rDesc) rDesc.textContent = rew.desc;
      }

      const speakerPor = document.getElementById('resultSpeakerPor');
      const speakerName = document.getElementById('resultSpeakerName');
      const speakerText = document.getElementById('resultSpeakerText');
      if (speakerPor && speakerName && speakerText) {
        const leader = (squad && squad[0]) || { id: 'cat_patrol', name: '墨影' };
        speakerPor.src = `assets/art/v4/por_${leader.id}.webp`;
        speakerName.textContent = leader.name;
        speakerText.textContent = '「長夜終有盡，迷霧隨燈散。全軍稍作整頓，繼續進軍！」';
      }
    } else {
      card.className = 'result-card defeat';
      title.textContent = '戰鬥失利';
      sub.textContent = status.reason || '夜霧重重 · 退守整軍';
      document.getElementById('resultExpAwards').textContent = '將士稍作休整，整頓兵甲以待再戰。';
      if (relicWrap) relicWrap.style.display = 'none';
      if (xpList) xpList.innerHTML = '';
    }

    document.getElementById('btnResultContinue').onclick = () => {
      modal.style.display = 'none';
      onContinue();
    };
  }
}
