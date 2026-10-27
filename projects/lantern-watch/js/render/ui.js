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
    // When unit is near bottom (y >= 9), scroll down so unit's feet stay >=64px above viewport bottom
    if (y >= 9) {
      scrollY = Math.max(scrollY, (y * tilePx + 64) - vpHeight + 80);
    }

    // Top safe inset: northern units must never be sliced by HUD (keep at least 16px clearance)
    if (y <= 5) {
      scrollY = Math.min(scrollY, Math.max(0, (y - 1.2) * tilePx));
    }

    scrollX = Math.max(0, Math.min(maxScrollX, scrollX));
    scrollY = Math.max(0, Math.min(maxScrollY, scrollY));

    vp.scrollTo({ left: scrollX, top: scrollY, behavior: smooth ? 'smooth' : 'auto' });
  }

  /** Pixels of the battle viewport hidden by bottom overlays (sheets, menus, preview cards). */
  measureBottomInset() {
    const vp = document.getElementById('battleViewport');
    if (!vp) return 0;
    const vr = vp.getBoundingClientRect();
    let top = vr.bottom;
    const els = ['deployTrayBar', 'targetPreviewCard'].map(id => document.getElementById(id));
    els.push(document.querySelector('#tutorialBoardOverlay .tutorial-board-card'));
    els.forEach(el => {
      if (!el || el.offsetParent === null) return;
      const r = el.getBoundingClientRect();
      if (r.height > 0 && r.top < vr.bottom && r.bottom > vr.top + vr.height * 0.4) top = Math.min(top, r.top);
    });
    return Math.max(0, vr.bottom - top);
  }

  /** Scroll so every tile in `tiles` sits inside the uncovered part of the viewport (HUD safe area). */
  frameTiles(tiles, smooth = false) {
    const vp = document.getElementById('battleViewport');
    const stage = vp?.querySelector('.battle-board-stage');
    if (!vp || !tiles || !tiles.length) return;
    const inset = this.measureBottomInset();
    if (stage) stage.style.height = (940 + inset) + 'px';
    const xs = tiles.map(t => t.x), ys = tiles.map(t => t.y);
    const minX = Math.min(...xs) * 64, maxX = Math.max(...xs) * 64 + 64;
    const minY = Math.min(...ys) * 64, maxY = Math.max(...ys) * 64 + 64;
    const w = vp.clientWidth || 390, h = Math.max(160, (vp.clientHeight || 520) - inset);
    let sx = (minX + maxX) / 2 - w / 2;
    let sy = (minY + maxY) / 2 - h / 2;
    // if box is bigger than band, prioritise keeping the bottom (player side) visible
    if (maxY - minY > h - 24) sy = maxY - h + 12;
    if (maxX - minX > w - 16) sx = minX - 8;
    sx = Math.max(0, Math.min(vp.scrollWidth - vp.clientWidth, sx));
    sy = Math.max(0, Math.min(vp.scrollHeight - vp.clientHeight, sy));
    vp.scrollTo({ left: sx, top: sy, behavior: smooth ? 'smooth' : 'auto' });
  }

  // ================= WORLD MAP RENDERING =================
  renderWorldMap(campaign, onSelectChapter) {
    const nodesLayer = document.getElementById('worldMapNodes');
    if (!nodesLayer) return;
    nodesLayer.innerHTML = '';

    // Relative node positions fitting inside 390px world map frame
    const nodeCoords = {
      1: { left: '26%', top: '74%', name: '第一回 · 河橋' },
      2: { left: '70%', top: '54%', name: '第二回 · 城門' },
      3: { left: '72%', top: '78%', name: '第三回 · 市集' },
      4: { left: '58%', top: '22%', name: '第四回 · 山道' },
      5: { left: '38%', top: '40%', name: '第五回 · 竹海' },
      6: { left: '80%', top: '24%', name: '第六回 · 攻城' },
      7: { left: '18%', top: '28%', name: '外傳 · 荒澤' }
    };

    CHAPTERS.forEach(ch => {
      const coord = nodeCoords[ch.id];
      if (!coord) return;

      const isCleared = campaign.clearedChapters.includes(ch.id);
      const isUnlocked = campaign.isChapterUnlocked(ch.id);

      const pin = document.createElement('div');
      pin.className = `map-route-pin ${isCleared ? 'cleared' : (isUnlocked ? 'available' : 'locked')} ${ch.isSideBattle ? 'side-battle' : ''}`;
      pin.style.left = coord.left;
      pin.style.top = coord.top;

      let sealSrc = 'assets/art/v4/seal_locked.webp';
      let sealAlt = '未解鎖';
      if (isCleared) {
        sealSrc = 'assets/art/v4/seal_cleared.webp';
        sealAlt = '已通關';
      } else if (isUnlocked) {
        sealSrc = ch.isSideBattle ? 'assets/art/v4/seal_side.webp' : 'assets/art/v4/seal_new.webp';
        sealAlt = ch.isSideBattle ? '外傳密境' : '新戰役';
      }

      pin.innerHTML = `
        <div class="pin-medallion">
          <img src="${sealSrc}" class="pin-seal-stamp" alt="${sealAlt}">
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
      const bannerFile = chapter.banner || `banner_ch${chapter.id}.webp`;
      bannerArt.style.backgroundImage = `url('assets/art/v4/${bannerFile}')`;
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
      iron_general: '弱背擊·落水KO',
      siege_engine: '盲區1-2格·弱飛騎近攻',
      citadel_warlord: '防禦極高·弱法術背刺'
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
      battle.chapter.objectiveType === 'reach_shrine_or_rout' ? '佔領神壇' :
      battle.chapter.objectiveType === 'survive_or_rout' ? '破咒誅妖' :
      battle.chapter.objectiveType === 'breach_gate_or_rout' ? '破關斬將' : '討伐鐵將';
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

    const isFog = battle.isFogActive ? battle.isFogActive() : false;
    const visionMap = isFog && battle.calculateVisionMap ? battle.calculateVisionMap() : null;

    const clearPathPreview = () => {
      gridEl.querySelectorAll('.path-step').forEach(el => el.classList.remove('path-step'));
    };
    gridEl.onpointerleave = clearPathPreview;

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

        if (handlers.threatTiles && handlers.threatTiles.has(key)) {
          tileDiv.classList.add('threat');
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
        if (handlers.validTargetKeys && handlers.validTargetKeys.has(key)) {
          tileDiv.classList.add('target-valid');
        }
        if (handlers.selectedTargetKey === key) {
          tileDiv.classList.add('target-selected');
        }
        if (deploySlots.has(key)) {
          tileDiv.classList.add('deploy-slot');
        }
        if (selectedUnit && selectedUnit.x === c && selectedUnit.y === r) {
          tileDiv.classList.add('selected');
        }

        // Active flooded water VFX
        if (battle.floodedTiles && battle.floodedTiles.has(key)) {
          tileDiv.classList.add('flooded-water');
        }

        // Dotted ink path preview on hovering reachable tile
        tileDiv.onpointerenter = () => {
          if (reachable.has(key)) {
            clearPathPreview();
            const stepInfo = reachable.get(key);
            if (stepInfo && stepInfo.path) {
              stepInfo.path.forEach(pt => {
                if (selectedUnit && pt.x === selectedUnit.x && pt.y === selectedUnit.y) return;
                const pathTile = gridEl.querySelector(`.grid-tile[data-x="${pt.x}"][data-y="${pt.y}"]`);
                if (pathTile) pathTile.classList.add('path-step');
              });
            }
          }
        };

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
          clearPathPreview();
          if (this.hasDraggedBeyondThreshold) return;
          handlers.onTileTap(c, r);
        };

        gridEl.appendChild(tileDiv);
      }
    }

    // Render Continuous Merged Canvas Layers (Water flood, fire attack, move & AoE ranges, soft fog mist)
    this.renderFloodOverlay(battle);
    this.renderFireOverlay(battle);
    this.renderRangeOverlay(handlers);
    this.renderFogOverlay(battle, visionMap);

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
    allUnits.forEach((u, uIdx) => {
      const figWrap = document.createElement('div');
      figWrap.className = `unit-figure ${u.team} ${u.promoted ? 'promoted' : ''} ${u.acted ? 'acted' : ''}`;
      figWrap.dataset.unitId = u.id;
      figWrap.style.left = `${u.x * 64}px`;
      figWrap.style.top = `${u.y * 64}px`;
      figWrap.style.setProperty('--row', u.y);
      figWrap.style.setProperty('--unit-idx', uIdx);
      figWrap.style.setProperty('--facing', u.facing ?? (u.team === 'ally' ? 1 : -1));

      // Fog of war silhouette
      const isVisible = battle.isUnitVisible ? battle.isUnitVisible(u) : true;
      if (!isVisible) {
        figWrap.classList.add('in-fog');
      }

      // Staggered breathing delay per unit
      const delay = ((u.x * 7 + u.y * 13 + uIdx * 3) % 10) * 0.3;

      const isCart = (u.id === 'lantern_cart' || u.id === 'market_lantern');
      const figContent = isCart ?
        `<div class="npc-ambient-halo" style="position:absolute;width:64px;height:64px;background:radial-gradient(circle,rgba(255,190,60,0.5) 0%,transparent 70%);border-radius:50%;pointer-events:none;"></div>
         <img src="assets/art/v4/fig_${u.id}.webp" alt="${u.name}" class="unit-fig-img" style="animation-delay: -${delay}s;">` :
        `<img src="assets/art/v4/fig_${u.id}.webp" alt="${u.name}" class="unit-fig-img" style="animation-delay: -${delay}s;">`;

      const classChar = u.clsBadge || (u.cls ? u.cls[0] : (u.role === 'tank' ? '盾' : '兵'));

      figWrap.innerHTML = `
        <div class="unit-ground-shadow"></div>
        <div class="unit-team-ring"></div>
        ${figContent}
        <div class="unit-class-badge">${classChar}</div>
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
        if (!isVisible && u.team === 'enemy') {
          // Cannot target or inspect enemy in deep fog
          return;
        }
        handlers.onUnitTap(u);
      };

      figuresLayer.appendChild(figWrap);
    });

    // Bottom terrain info
    if (selectedUnit) {
      this.updateBottomStrip(selectedUnit.x, selectedUnit.y, battle.board, selectedUnit);
    }
  }

  // Continuous Flood Water Overlay Canvas (merged continuous water body, gentle wave animation, soft shoreline edge)
  renderFloodOverlay(battle) {
    const canvas = document.getElementById('floodOverlayCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 640, 832);

    const flooded = battle.floodedTiles;
    if (!flooded || flooded.size === 0) return;

    const tilePx = 64;
    const keys = Array.from(flooded.keys ? flooded.keys() : flooded);
    const keySet = new Set(keys);

    // 1. Fill continuous merged water body (no gaps, edge-to-edge)
    ctx.save();
    ctx.fillStyle = 'rgba(10, 52, 92, 0.78)';
    for (const key of keys) {
      const [c, r] = key.split(',').map(Number);
      ctx.fillRect(c * tilePx, r * tilePx, tilePx, tilePx);
    }
    ctx.restore();

    // 2. Soft shoreline edge - ONLY outer perimeter boundaries where neighbor is not flooded!
    ctx.save();
    ctx.beginPath();
    for (const key of keys) {
      const [c, r] = key.split(',').map(Number);
      const x0 = c * tilePx;
      const y0 = r * tilePx;
      const x1 = (c + 1) * tilePx;
      const y1 = (r + 1) * tilePx;

      // North edge
      if (!keySet.has(`${c},${r - 1}`)) {
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y0);
      }
      // South edge
      if (!keySet.has(`${c},${r + 1}`)) {
        ctx.moveTo(x0, y1);
        ctx.lineTo(x1, y1);
      }
      // West edge
      if (!keySet.has(`${c - 1},${r}`)) {
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0, y1);
      }
      // East edge
      if (!keySet.has(`${c + 1},${r}`)) {
        ctx.moveTo(x1, y0);
        ctx.lineTo(x1, y1);
      }
    }

    ctx.strokeStyle = 'rgba(90, 220, 255, 0.9)';
    ctx.lineWidth = 3.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0, 200, 255, 0.85)';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.restore();

    // 3. Continuous sweeping wave currents across the merged water body (no per-cell isolated glyphs)
    ctx.save();
    ctx.beginPath();
    for (const key of keys) {
      const [c, r] = key.split(',').map(Number);
      ctx.rect(c * tilePx, r * tilePx, tilePx, tilePx);
    }
    ctx.clip();

    ctx.strokeStyle = 'rgba(180, 240, 255, 0.4)';
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';

    const rows = Array.from(new Set(keys.map(k => Number(k.split(',')[1])))).sort((a, b) => a - b);
    for (const r of rows) {
      const yBase = r * tilePx + 22;
      ctx.beginPath();
      ctx.moveTo(0, yBase);
      for (let x = 0; x <= 640; x += 40) {
        ctx.quadraticCurveTo(x + 20, yBase + 8, x + 40, yBase);
      }
      ctx.stroke();

      const yBase2 = r * tilePx + 46;
      ctx.beginPath();
      ctx.moveTo(20, yBase2);
      for (let x = 20; x <= 640; x += 48) {
        ctx.quadraticCurveTo(x + 24, yBase2 + 8, x + 48, yBase2);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // Continuous Fire Inferno Overlay Canvas (merged continuous flame body, fiery ink wash, glowing perimeter contour, flame tongues)
  renderFireOverlay(battle) {
    const canvas = document.getElementById('fireOverlayCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 640, 832);

    const tilePx = 64;
    const burning = battle.burningTiles;
    if (burning && burning.size > 0) {
      const keys = Array.from(burning);
      const keySet = new Set(keys);

      // 1. Merged fiery amber-red wash inside
      ctx.save();
      ctx.fillStyle = 'rgba(220, 60, 20, 0.35)';
      for (const key of keys) {
        const [c, r] = key.split(',').map(Number);
        ctx.fillRect(c * tilePx, r * tilePx, tilePx, tilePx);
      }
      ctx.restore();

      // 2. Feathered flame contour around exterior edges
      ctx.save();
      ctx.beginPath();
      for (const key of keys) {
        const [c, r] = key.split(',').map(Number);
        const x0 = c * tilePx;
        const y0 = r * tilePx;
        const x1 = (c + 1) * tilePx;
        const y1 = (r + 1) * tilePx;

        if (!keySet.has(`${c},${r - 1}`)) {
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y0);
        }
        if (!keySet.has(`${c},${r + 1}`)) {
          ctx.moveTo(x0, y1);
          ctx.lineTo(x1, y1);
        }
        if (!keySet.has(`${c - 1},${r}`)) {
          ctx.moveTo(x0, y0);
          ctx.lineTo(x0, y1);
        }
        if (!keySet.has(`${c + 1},${r}`)) {
          ctx.moveTo(x1, y0);
          ctx.lineTo(x1, y1);
        }
      }
      ctx.strokeStyle = 'rgba(255, 170, 30, 0.95)';
      ctx.lineWidth = 3.0;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(255, 60, 0, 0.9)';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.restore();

      // 3. Merged billowing warmth across zone (no per-cell isolated stair-step stamps)
      ctx.save();
      ctx.beginPath();
      for (const key of keys) {
        const [c, r] = key.split(',').map(Number);
        ctx.rect(c * tilePx, r * tilePx, tilePx, tilePx);
      }
      ctx.clip();

      for (const key of keys) {
        const [c, r] = key.split(',').map(Number);
        const cx = c * tilePx + 32;
        const cy = r * tilePx + 32;

        const grad = ctx.createRadialGradient(cx, cy, 6, cx, cy, 38);
        grad.addColorStop(0, 'rgba(255, 235, 150, 0.7)');
        grad.addColorStop(0.5, 'rgba(255, 110, 20, 0.45)');
        grad.addColorStop(1, 'rgba(220, 40, 10, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(c * tilePx - 4, r * tilePx - 4, tilePx + 8, tilePx + 8);
      }

      ctx.strokeStyle = 'rgba(255, 220, 90, 0.85)';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      for (const key of keys) {
        const [c, r] = key.split(',').map(Number);
        const x0 = c * tilePx;
        const y0 = r * tilePx;
        ctx.beginPath();
        ctx.moveTo(x0 + 12, y0 + 52);
        ctx.quadraticCurveTo(x0 + 26, y0 + 28, x0 + 36, y0 + 10);
        ctx.quadraticCurveTo(x0 + 44, y0 + 24, x0 + 50, y0 + 50);
        ctx.stroke();
      }
      ctx.restore();
    }

  // Render Cursed Miasma (幽冥咒縛沼澤)
  const cursed = battle.cursedTiles;
  if (cursed && cursed.size > 0) {
    const cKeys = Array.from(cursed);
    const cKeySet = new Set(cKeys);

    // Deep violet-black ink mist
    ctx.save();
    ctx.fillStyle = 'rgba(68, 16, 92, 0.38)';
    for (const k of cKeys) {
      const [c, r] = k.split(',').map(Number);
      ctx.fillRect(c * tilePx, r * tilePx, tilePx, tilePx);
    }
    ctx.restore();

    // Violet feathered boundary
    ctx.save();
    ctx.beginPath();
    for (const k of cKeys) {
      const [c, r] = k.split(',').map(Number);
      const x0 = c * tilePx;
      const y0 = r * tilePx;
      const x1 = (c + 1) * tilePx;
      const y1 = (r + 1) * tilePx;

      if (!cKeySet.has(`${c},${r - 1}`)) { ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); }
      if (!cKeySet.has(`${c},${r + 1}`)) { ctx.moveTo(x0, y1); ctx.lineTo(x1, y1); }
      if (!cKeySet.has(`${c - 1},${r}`)) { ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); }
      if (!cKeySet.has(`${c + 1},${r}`)) { ctx.moveTo(x1, y0); ctx.lineTo(x1, y1); }
    }
    ctx.strokeStyle = 'rgba(180, 80, 240, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(140, 40, 220, 0.9)';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.restore();

    // Cursed miasma indicator
    ctx.save();
    ctx.fillStyle = 'rgba(215, 145, 255, 0.75)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    for (const k of cKeys) {
      const [c, r] = k.split(',').map(Number);
      ctx.fillText('咒', c * tilePx + 32, r * tilePx + 20);
    }
    ctx.restore();
  }
  }

  // Continuous Movement Range & AoE Footprints Overlay Canvas (merged contour outline, translucent wash, no separate boxes)
  renderRangeOverlay(handlers) {
    const canvas = document.getElementById('rangeOverlayCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 640, 832);

    const reachable = handlers.reachableTiles || new Map();
    const aoeTiles = handlers.aoeTiles || new Set();
    const tilePx = 64;

    // Helper to draw merged region with translucent wash & single feathered perimeter contour
    const drawMergedRegion = (cellsMapOrSet, fillColor, strokeColor, shadowColor, isZoc = false) => {
      const keys = cellsMapOrSet.keys ? Array.from(cellsMapOrSet.keys()) : Array.from(cellsMapOrSet);
      if (keys.length === 0) return;
      const keySet = new Set(keys);

      // 1. Translucent wash inside (seamless fill, no gaps)
      ctx.save();
      ctx.fillStyle = fillColor;
      for (const key of keys) {
        const [c, r] = key.split(',').map(Number);
        ctx.fillRect(c * tilePx, r * tilePx, tilePx, tilePx);
      }
      ctx.restore();

      // 2. Single feathered outline (contour of cell union - exterior edges ONLY)
      ctx.save();
      ctx.beginPath();
      for (const key of keys) {
        const [c, r] = key.split(',').map(Number);
        const x0 = c * tilePx;
        const y0 = r * tilePx;
        const x1 = (c + 1) * tilePx;
        const y1 = (r + 1) * tilePx;

        if (!keySet.has(`${c},${r - 1}`)) {
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y0);
        }
        if (!keySet.has(`${c},${r + 1}`)) {
          ctx.moveTo(x0, y1);
          ctx.lineTo(x1, y1);
        }
        if (!keySet.has(`${c - 1},${r}`)) {
          ctx.moveTo(x0, y0);
          ctx.lineTo(x0, y1);
        }
        if (!keySet.has(`${c + 1},${r}`)) {
          ctx.moveTo(x1, y0);
          ctx.lineTo(x1, y1);
        }
      }
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();

      // 3. If move range, mark ZOC intercepted stop tiles with prominent indicator
      if (isZoc && reachable.size > 0) {
        ctx.save();
        for (const [key, info] of reachable.entries()) {
          if (info.zocStopped) {
            const [c, r] = key.split(',').map(Number);
            const cx = c * tilePx + 32;
            const cy = r * tilePx + 32;
            ctx.beginPath();
            ctx.arc(cx, cy, 9, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(235, 50, 65, 0.9)';
            ctx.shadowColor = 'rgba(255, 60, 80, 0.85)';
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1.6;
            ctx.stroke();

            // Tiny ZOC stop label
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('阻', cx, cy);
          }
        }
        ctx.restore();
      }
    };

    // 1. Move Range: Azure wash + cyan feathered contour
    if (reachable.size > 0) {
      drawMergedRegion(
        reachable,
        'rgba(35, 175, 235, 0.26)',
        'rgba(80, 225, 255, 0.92)',
        'rgba(50, 200, 255, 0.85)',
        true
      );
    }

    // 2. AoE / Bombardment: Vermilion/Amber wash + gold feathered contour
    if (aoeTiles.size > 0) {
      drawMergedRegion(
        aoeTiles,
        'rgba(245, 140, 30, 0.28)',
        'rgba(255, 200, 60, 0.95)',
        'rgba(255, 160, 30, 0.85)',
        false
      );
    }
  }

  // Soft Painted Fog of War Mask Overlay Canvas (soft ink mist, feathered radial cutouts around vision tiles, dimmed remembered terrain)
  renderFogOverlay(battle, visionMap) {
    const canvas = document.getElementById('fogOverlayCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 640, 832);

    const isFog = battle.isFogActive ? battle.isFogActive() : false;
    if (!isFog || !visionMap) return;

    ctx.save();
    // Fill stage with smooth nocturnal ink mist (dimmed/desaturated, NOT solid pitch black)
    ctx.fillStyle = 'rgba(10, 14, 26, 0.82)';
    ctx.fillRect(0, 0, 640, 832);

    // Clear vision tiles with soft radial feathered mask
    ctx.globalCompositeOperation = 'destination-out';
    for (const key of visionMap) {
      const [c, r] = key.split(',').map(Number);
      const cx = c * 64 + 32;
      const cy = r * 64 + 32;
      const rad = 68;
      const grad = ctx.createRadialGradient(cx, cy, 22, cx, cy, rad);
      grad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
      grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.88)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  showCombatBark(unit, title, text) {
    const banner = document.getElementById('combatBarkBanner');
    if (!banner) return;
    const por = document.getElementById('barkPortrait');
    const hdr = document.getElementById('barkHeader');
    const quote = document.getElementById('barkQuote');

    if (por) por.src = `assets/art/v4/por_${unit.id}.webp`;
    if (hdr) hdr.textContent = title || `【${unit.name}】`;
    if (quote) quote.textContent = text || unit.bark || '「破陣！」';

    banner.style.display = 'flex';
    clearTimeout(this._barkTimer);
    this._barkTimer = setTimeout(() => {
      banner.style.display = 'none';
    }, 2400);
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

    // Auto-frame attacker, defender (and combo ally) inside the area not covered by the preview card
    {
      const unitsToFrame = [attacker, defender];
      if (comboAlly) unitsToFrame.push(comboAlly);
      requestAnimationFrame(() => this.frameTiles(unitsToFrame, true));
    }

    // Combo badge (restricted to valid bond pairs)
    const comboEl = document.getElementById('prevComboBadge');
    if (comboEl) {
      if (comboAlly && preview.bondName) {
        comboEl.style.display = 'inline-block';
        comboEl.textContent = `【合擊 · ${preview.bondName}】+${comboAlly.name} (+${comboDamage})`;
      } else if (comboAlly) {
        comboEl.style.display = 'inline-block';
        comboEl.textContent = `【合擊】+${comboAlly.name} (+${comboDamage})`;
      } else {
        comboEl.style.display = 'none';
      }
    }

    // Badges & texts (matching live SPEC flanking multipliers: Back +50% / Cat +100%, Side +20%)
    const dirBadge = document.getElementById('prevDirectionBadge');
    if (dirBadge) {
      dirBadge.textContent = preview.directionMarker || (isBackAttack ? '【背刺偷襲】+50% 傷害 (無法反擊)' : (isSideAttack ? '【側翼突襲】+20% 傷害' : '【正面交鋒】'));
      if (isBackAttack) {
        dirBadge.className = 'preview-direction-badge back';
      } else if (isSideAttack) {
        dirBadge.className = 'preview-direction-badge side';
      } else {
        dirBadge.className = 'preview-direction-badge front';
      }
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

  /** One-line targeting hint bar (top of map) with a cancel button. */
  showTargetHint(text, onCancel) {
    let bar = document.getElementById('targetHintBar');
    if (!bar) return;
    bar.style.display = 'flex';
    document.getElementById('targetHintText').textContent = text;
    document.getElementById('btnTargetCancel').onclick = () => onCancel && onCancel();
  }

  hideTargetHint() {
    const bar = document.getElementById('targetHintBar');
    if (bar) bar.style.display = 'none';
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

    const headerTitle = document.getElementById('tutorialHeaderTitle');
    if (headerTitle) {
      headerTitle.textContent = `${GAME.name} · 基礎兵法`;
    }

    const steps = [
      {
        num: '第 1 / 3 步',
        icon: '⚑',
        title: '【步法前進 · 藍格移動】',
        text: '點選我方將士，腳下藍色格子為合法移動範圍。點選藍格即可率軍行進至該位置（點選自身即原地待命）。'
      },
      {
        num: '第 2 / 3 步',
        icon: '⚔',
        title: '【軍略指令 · 行動四選】',
        text: '移動後彈出軍略選單：常規「攻擊」、專屬「技能」、屬性剋制「魔法」或原地「待命」（確認前可悔棋重走）。'
      },
      {
        num: '第 3 / 3 步',
        icon: '🎯',
        title: '【射程預覽 · 側翼與背刺】',
        text: '紅色格子為攻擊射程，點選目標可查看傷害與反擊預測。背刺+50%傷害且敵方無法反擊（墨影「疾影」+100%），側擊+20%傷害！'
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

    // Helper for directional attack lunges
    const getLungeClass = (src, dst) => {
      const dx = (dst.x ?? 0) - (src.x ?? 0);
      const dy = (dst.y ?? 0) - (src.y ?? 0);
      if (Math.abs(dx) >= Math.abs(dy)) {
        return dx >= 0 ? 'anim-lunge-right' : 'anim-lunge-left';
      } else {
        return dy >= 0 ? 'anim-lunge-down' : 'anim-lunge-up';
      }
    };

    // Trigger attacker directional lunge animation
    const attackerEl = figuresLayer?.querySelector(`[data-unit-id="${attacker.id}"]`);
    const lungeCls = getLungeClass(attacker, defender);
    if (attackerEl) {
      attackerEl.classList.add(lungeCls);
      setTimeout(() => attackerEl.classList.remove(lungeCls), 240 * durMult);
    }

    // Both units lunge during combo attacks
    if (combatInfo.comboAlly) {
      const comboEl = figuresLayer?.querySelector(`[data-unit-id="${combatInfo.comboAlly.id}"]`);
      if (comboEl) {
        const comboLungeCls = getLungeClass(combatInfo.comboAlly, defender);
        comboEl.classList.add(comboLungeCls);
        setTimeout(() => comboEl.classList.remove(comboLungeCls), 240 * durMult);
      }
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

    document.getElementById('levelUpUnitPrompt').textContent = `【${unitInst.name}】晉升至 Lv.${newLevel}！請選取一項突破（三選一）：`;

    const choices = [
      { type: 'atk', name: '銳意進取', boost: '攻擊力 +3 · 鋒芒畢露' },
      { type: 'def_hp', name: '固若金湯', boost: '防禦 +2 · 氣血上限 +6' },
      { type: 'mov', name: '神行百變', boost: '移動力 +1 · 馳騁戰場' }
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

  showBattleResult(status, chapter, onContinue, campaign = null, squad = null, battle = null) {
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
      document.getElementById('resultExpAwards').innerHTML = '<span>✦ 斬將拔旗 · 論功行賞 ✦</span>';

      const rewards = battle?.calculateBattleRewards ? battle.calculateBattleRewards() : null;

      if (xpList) {
        xpList.innerHTML = '';
        const awards = rewards?.awards || [
          { id: 'cat_patrol', name: '墨影', isMvp: true, expGained: 85, reason: '【本戰MVP】斬將拔旗，戰功卓著！' },
          { id: 'bear_guard', name: '熊岳', isMvp: false, expGained: 65, reason: '鐵壁扼守，格擋千鈞傷害' },
          { id: 'tea_master', name: '茶翁', isMvp: false, expGained: 55, reason: '靈茶甘露，妙手回春援護' },
          { id: 'crane_rider', name: '鶴羽', isMvp: false, expGained: 60, reason: '雲霄奇襲，突擊敵軍腹地' }
        ];

        awards.forEach(u => {
          const row = document.createElement('div');
          row.className = `xp-unit-row ${u.isMvp ? 'is-mvp' : ''}`;
          row.innerHTML = `
            <div class="xp-unit-por-wrap">
              <img src="assets/art/v4/por_${u.id}.webp" class="xp-unit-por" alt="${u.name}">
              ${u.isMvp ? '<span class="xp-mvp-crown">👑</span>' : ''}
            </div>
            <div class="xp-unit-info">
              <div class="xp-unit-name-line">
                <span class="xp-unit-name">${u.name}</span>
                ${u.isMvp ? '<span class="xp-mvp-badge">本戰MVP · 戰功卓著</span>' : ''}
              </div>
              <span class="xp-unit-reason">${u.reason}</span>
              <div class="xp-bar-track">
                <div class="xp-bar-fill ${u.isMvp ? 'mvp-fill' : ''}" style="width: ${Math.min(100, Math.max(30, (u.expGained || 50) % 100))}%;"></div>
              </div>
            </div>
            <span class="xp-gain-badge ${u.isMvp ? 'mvp-badge' : ''}">+${u.expGained} EXP</span>
          `;
          xpList.appendChild(row);
        });
      }

      const relicRewardMap = {
        1: { id: 'sword_yitian', name: '倚天古劍', img: 'assets/art/v4/item_sword.webp', desc: '攻擊力 +4 · 暴擊率 +15%' },
        2: { id: 'tome_taiping', name: '太平天書', img: 'assets/art/v4/item_tome.webp', desc: '法術力 +4 · 技力上限 +4' },
        3: { id: 'armor_xuanjia', name: '玄鐵明光甲', img: 'assets/art/v4/item_armor.webp', desc: '防禦力 +3 · 氣血上限 +12' },
        4: { id: 'spirit_jade', name: '靈心玉', img: 'assets/art/v4/item_tome.webp', desc: '法術力 +3' },
        5: { id: 'tea_leaf_pouch', name: '靈泉茶囊', img: 'assets/art/v4/item_tome.webp', desc: '生命上限 +10' },
        6: { id: 'warlord_seal', name: '破軍印', img: 'assets/art/v4/item_sword.webp', desc: '要塞告捷 · 全軍攻擊+5' }
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
        const awards = rewards?.awards || [];
        const mvpInfo = awards.find(a => a.isMvp) || (squad && squad[0]) || { id: 'cat_patrol', name: '墨影' };
        speakerPor.src = `assets/art/v4/por_${mvpInfo.id}.webp`;
        speakerName.textContent = `${mvpInfo.name} · 本戰MVP`;

        const mvpQuotes = {
          cat_patrol: '「暗夜之中，劍鋒所向披靡。敵酋已斬，長夜將明！」',
          bear_guard: '「鐵甲如磐，固若金湯！隨我乘勝破敵！」',
          crane_rider: '「雲海縱橫，長空無敵！敵陣破綻已盡在掌中！」',
          tea_master: '「品茗笑談間，檣櫓灰飛煙滅。全軍且進熱茶！」',
          tanuki_mage: '「雷霆破霄，天威莫測！妖霧豈能擋我玄門道法！」',
          fox_maiden: '「靈狐引火，照破十方。這漫漫黑夜，該退了！」'
        };
        speakerText.textContent = mvpQuotes[mvpInfo.id] || '「長夜終有盡，迷霧隨燈散。全軍稍作整頓，繼續進軍！」';
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

  renderCampScreen(campaign, selectedUnitId = 'cat_patrol', handlers = {}) {
    const rosterGrid = document.getElementById('campRosterGrid');
    const profileDetails = document.getElementById('campProfileDetails');
    if (!rosterGrid || !profileDetails) return;

    const allGuardianIds = Object.keys(GUARDIAN_PROTOS);
    const activeUnitId = selectedUnitId || 'cat_patrol';

    // 1. Render Roster Grid
    rosterGrid.innerHTML = '';
    allGuardianIds.forEach(id => {
      const inst = campaign.getUnitInstance(id);
      const isSelected = (id === activeUnitId);
      const card = document.createElement('div');
      card.className = `camp-char-card ${isSelected ? 'active' : ''} ${inst.promoted ? 'promoted' : ''}`;
      
      const relicObj = inst.relic ? RELICS.find(r => r.id === inst.relic) : null;
      card.innerHTML = `
        <div class="camp-card-por-wrap">
          <img src="assets/art/v4/por_${id}.webp" class="camp-card-por" alt="${inst.name}">
          ${inst.promoted ? '<span class="camp-card-promo-tag">破境</span>' : ''}
        </div>
        <div class="camp-card-meta">
          <strong class="camp-card-name">${inst.name}</strong>
          <span class="camp-card-cls">Lv.${inst.level}</span>
        </div>
      `;
      card.onclick = () => {
        handlers.onSelectUnit?.(id);
      };
      rosterGrid.appendChild(card);
    });

    // 2. Render Character Profile
    const unit = campaign.getUnitInstance(activeUnitId);
    const proto = GUARDIAN_PROTOS[activeUnitId];
    const promo = PROMOTIONS[activeUnitId];
    const equippedRelic = unit.relic ? RELICS.find(r => r.id === unit.relic) : null;
    const canPromote = !unit.promoted && promo && unit.level >= 5;

    const elementNames = { water: '水相 · 潤澤', fire: '火相 · 熾烈', thunder: '雷相 · 迅破', wind: '風相 · 凌厲' };
    const elText = elementNames[unit.element] || '兵家 · 鋒芒';
    const halfBodySrc = proto.richPortrait || (activeUnitId === 'cat_patrol' ? 'assets/art/v4/por_moying_rich.webp' : `assets/art/v4/por_${activeUnitId}.webp`);

    profileDetails.innerHTML = `
      <div class="camp-profile-header">
        <div class="camp-profile-por-box rich">
          <img src="${halfBodySrc}" class="camp-profile-portrait rich-portrait" alt="${unit.name}">
          ${unit.promoted ? '<div class="camp-promo-laurel">✦ 破境高階 ✦</div>' : ''}
        </div>
        <div class="camp-profile-title-block">
          <div class="camp-profile-badge-row">
            <span class="camp-badge element">${elText}</span>
            <span class="camp-badge level">Lv.${unit.level}</span>
            <span class="camp-badge class">${unit.cls}</span>
          </div>
          <h3 class="camp-profile-name">${unit.name}</h3>
          <p class="camp-profile-title">${unit.title || proto.title}</p>
          <div class="camp-exp-bar-wrap">
            <div class="camp-exp-label"><span>戰功修煉</span><span>${unit.exp % 100} / 100 EXP</span></div>
            <div class="camp-exp-track"><div class="camp-exp-fill" style="width: ${unit.exp % 100}%;"></div></div>
          </div>
        </div>
      </div>

      <!-- Equipment Slot -->
      <div class="camp-section-card">
        <div class="camp-card-heading">✦ 佩掛神兵寶具 ✦</div>
        <div class="camp-equip-row">
          <div class="camp-relic-item">
            ${equippedRelic ? `
              <img src="${equippedRelic.img || 'assets/art/v4/item_sword.webp'}" class="camp-relic-img" alt="${equippedRelic.name}">
              <div class="camp-relic-info">
                <strong>${equippedRelic.name}</strong>
                <span>${equippedRelic.desc}</span>
              </div>
              <button type="button" class="btn-brush-secondary btn-unequip" id="btnCampUnequip">卸下</button>
            ` : `
              <div class="camp-relic-empty">未佩掛寶具</div>
            `}
          </div>
        </div>
        <div class="camp-relics-picker" id="campRelicsPicker">
          <div class="picker-title">可用軍械庫寶物（點擊佩掛）：</div>
          <div class="relics-pill-list">
            ${(campaign.relics || []).map(rid => {
              const r = RELICS.find(item => item.id === rid);
              if (!r) return '';
              const isEquippedHere = (unit.relic === rid);
              const equippedOnOther = Object.entries(campaign.roster).find(([uid, u]) => u.relic === rid && uid !== activeUnitId);
              const holderName = equippedOnOther ? GUARDIAN_PROTOS[equippedOnOther[0]]?.name : null;
              return `
                <button type="button" class="btn-relic-chip ${isEquippedHere ? 'active' : ''}" data-relic-id="${rid}">
                  <img src="${r.img || 'assets/art/v4/item_sword.webp'}" class="r-thumb-img" alt="${r.name}">
                  <span class="r-name">${r.name}</span>
                  ${holderName ? `<span class="r-holder">(${holderName})</span>` : ''}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Class Promotion -->
      <div class="camp-section-card camp-promo-card">
        <div class="camp-card-heading">✦ 破境晉升 ✦</div>
        ${unit.promoted ? `
          <div class="camp-promo-box done">
            <span class="p-star">✦</span>
            <div class="p-info">
              <strong>已登堂入室 · 破境為【${unit.cls}】</strong>
              <p>承天載道，領悟終極奧義【${unit.skill?.name || '破曉絕技'}】！</p>
            </div>
          </div>
        ` : canPromote ? `
          <div class="camp-promo-box ready">
            <div class="p-info">
              <strong>可破境晉升為【${promo.newClass}】！</strong>
              <p>${promo.desc}。<br><span class="p-buffs">攻擊+${promo.statBonus.atk || 0} · 氣血+${promo.statBonus.maxHp || 0} · 移動+${promo.statBonus.mov || 0} · 領悟【${promo.promotedSkill.name}】</span></p>
            </div>
            <button type="button" class="btn-brush-main" id="btnCampPromote">破境晉升</button>
          </div>
        ` : `
          <div class="camp-promo-box locked">
            <span class="p-lock-badge">修煉進階</span>
            <div class="p-info">
              <strong>下一階破境：【${promo?.newClass || '高階'}】</strong>
              <p>須修煉至 Lv.5 方可開啟破境進階（當前 Lv.${unit.level}）。</p>
            </div>
          </div>
        `}
      </div>

      <!-- Attributes with Visual Stat Bars -->
      <div class="camp-section-card camp-stat-bars-card">
        <div class="camp-card-heading">✦ 屬性修為 ✦</div>
        <div class="camp-stat-bar-row">
          <span class="sb-label">氣血</span>
          <div class="sb-track"><div class="sb-fill hp" style="width: ${Math.min(100, Math.round((unit.maxHp / 50) * 100))}%;"></div></div>
          <strong class="sb-val">${unit.maxHp}</strong>
        </div>
        <div class="camp-stat-bar-row">
          <span class="sb-label">攻擊</span>
          <div class="sb-track"><div class="sb-fill atk" style="width: ${Math.min(100, Math.round((unit.atk / 25) * 100))}%;"></div></div>
          <strong class="sb-val">${unit.atk}</strong>
        </div>
        <div class="camp-stat-bar-row">
          <span class="sb-label">防禦</span>
          <div class="sb-track"><div class="sb-fill def" style="width: ${Math.min(100, Math.round((unit.def / 20) * 100))}%;"></div></div>
          <strong class="sb-val">${unit.def}</strong>
        </div>
        <div class="camp-stat-bar-row">
          <span class="sb-label">速度</span>
          <div class="sb-track"><div class="sb-fill spd" style="width: ${Math.min(100, Math.round((unit.spd / 20) * 100))}%;"></div></div>
          <strong class="sb-val">${unit.spd}</strong>
        </div>
        <div class="camp-stat-bar-row">
          <span class="sb-label">仙法</span>
          <div class="sb-track"><div class="sb-fill mag" style="width: ${Math.min(100, Math.round(((unit.mag || 0) / 20) * 100))}%;"></div></div>
          <strong class="sb-val">${unit.mag || 0}</strong>
        </div>
        <div class="camp-stat-bar-row">
          <span class="sb-label">移動</span>
          <div class="sb-track"><div class="sb-fill mov" style="width: ${Math.min(100, Math.round((unit.mov / 6) * 100))}%;"></div></div>
          <strong class="sb-val">${unit.mov}</strong>
        </div>
      </div>

      <!-- Backstory & Quote (Collapsible) -->
      <details class="camp-section-card camp-backstory-card">
        <summary class="camp-card-heading" style="cursor:pointer;">✦ 將士生平與語錄 ✦（點擊展開）</summary>
        <div class="camp-lore-quote" style="margin-top:6px;">
          「${proto.quote || proto.bark || '以身衛社稷，以智破暗夜。在暗夜裡，無人能逃過我的快劍。'}」
        </div>
        <p class="camp-backstory-p" style="margin-top:6px;">${proto.backstory || '生平詳傳收錄於軍略密卷。'}</p>
      </details>

      <!-- Skills & Trait -->
      <div class="camp-section-card">
        <div class="camp-card-heading">✦ 戰技與仙法 ✦</div>
        <div class="camp-skill-row">
          <strong class="s-name">【${unit.skill?.name || '專精之技'}】</strong>
          <span class="s-cost">技力: ${unit.skill?.cost ?? 2}</span>
          <p class="s-desc">${unit.skill?.desc || '施展強大作戰技巧。'}</p>
        </div>
        ${unit.magic ? `
          <div class="camp-skill-row">
            <strong class="s-name">【${unit.magic.name}】</strong>
            <span class="s-cost">技力: ${unit.magic.cost ?? 3}</span>
            <p class="s-desc">${unit.magic.desc}</p>
          </div>
        ` : ''}
        <div class="camp-skill-row trait">
          <strong class="s-name">【專屬特性 · ${unit.trait?.name || '軍略'}】</strong>
          <p class="s-desc">${unit.trait?.desc || '獨特戰場被動效果。'}</p>
        </div>
      </div>
    `;

    // Wire Equip clicks
    profileDetails.querySelectorAll('.btn-relic-chip').forEach(btn => {
      btn.onclick = () => {
        const rid = btn.dataset.relicId;
        handlers.onEquipRelic?.(activeUnitId, rid);
      };
    });

    const btnUnequip = document.getElementById('btnCampUnequip');
    if (btnUnequip) {
      btnUnequip.onclick = () => {
        handlers.onEquipRelic?.(activeUnitId, null);
      };
    }

    const btnPromote = document.getElementById('btnCampPromote');
    if (btnPromote) {
      btnPromote.onclick = () => {
        handlers.onPromoteUnit?.(activeUnitId);
      };
    }
  }
}
