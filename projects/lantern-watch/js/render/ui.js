/**
 * js/render/ui.js
 * DOM rendering engine, camera panning, 2.5D unit figures, combat previews,
 * action menus, and modal dialogs for 燈影軍略 · Lantern Tactics (v4).
 */

import { GAME } from '../config.js';
import { CHAPTERS, TERRAIN_INFO, WEATHER_CONFIG } from '../data/maps.js';
import { GUARDIAN_PROTOS, ENEMY_PROTOS, STRATAGEMS, RELICS, BOND_PAIRS, PROMOTIONS, getClassSynergies } from '../data/units.js';
export { getClassSynergies };

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

  // ---- Camera: transform-based fit / pinch-zoom / clamped pan (map is 640x832) ----
  camState() { if (!this.cam) this.cam = { s: 1, tx: 0, ty: 0, fit: true }; return this.cam; }
  fitScale() {
    const vp = document.getElementById('battleViewport');
    const w = vp?.clientWidth || 390, h = vp?.clientHeight || 520;
    return Math.min(w / 640, h / 832);
  }
  applyCamera() {
    const vp = document.getElementById('battleViewport');
    const stage = document.getElementById('battleBoardStage');
    if (!vp || !stage) return;
    const c = this.camState();
    const w = vp.clientWidth, h = vp.clientHeight, fit = this.fitScale();
    c.s = Math.max(fit, Math.min(Math.max(fit * 3, 1.4), c.s));
    const cw = 640 * c.s, ch = 832 * c.s;
    c.tx = cw <= w ? (w - cw) / 2 : Math.min(0, Math.max(w - cw, c.tx));
    c.ty = ch <= h ? (h - ch > 16 ? 4 : (h - ch) / 2) : Math.min(0, Math.max(h - ch, c.ty));
    stage.style.transform = `translate(${c.tx}px, ${c.ty}px) scale(${c.s})`;
    stage.style.setProperty('--cam-inv', String(1 / c.s));
  }
  fitCamera() { const c = this.camState(); c.s = this.fitScale(); c.fit = true; this.applyCamera(); }

  setupViewportDrag() {
    const vp = document.getElementById('battleViewport');
    if (!vp) return;
    const pts = new Map();
    let pinch = null, lastTap = 0;
    vp.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.action-menu-popover') || e.target.closest('.target-preview-card') || e.target.closest('.btn-cam-fit')) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const c = this.camState();
      if (pts.size === 1) {
        this.isDraggingViewport = true;
        this.hasDraggedBeyondThreshold = false;
        this.dragStartX = e.clientX; this.dragStartY = e.clientY;
        this.scrollStartX = c.tx; this.scrollStartY = c.ty;
        const now = Date.now();
        if (now - lastTap < 300 && e.pointerType === 'touch' && !c.fit) { this.fitCamera(); this.hasDraggedBeyondThreshold = true; }
        lastTap = now;
      } else if (pts.size === 2) {
        const [p1, p2] = [...pts.values()];
        const r = vp.getBoundingClientRect();
        const mx = (p1.x + p2.x) / 2 - r.left, my = (p1.y + p2.y) / 2 - r.top;
        pinch = { d: Math.hypot(p1.x - p2.x, p1.y - p2.y) || 1, s: c.s, wx: (mx - c.tx) / c.s, wy: (my - c.ty) / c.s };
        this.hasDraggedBeyondThreshold = true;
      }
    });
    vp.addEventListener('dblclick', () => this.fitCamera());
    window.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const c = this.camState();
      if (pinch && pts.size >= 2) {
        const [p1, p2] = [...pts.values()];
        const r = vp.getBoundingClientRect();
        const mx = (p1.x + p2.x) / 2 - r.left, my = (p1.y + p2.y) / 2 - r.top;
        c.s = pinch.s * Math.hypot(p1.x - p2.x, p1.y - p2.y) / pinch.d;
        c.fit = false;
        c.tx = mx - pinch.wx * c.s; c.ty = my - pinch.wy * c.s;
        this.applyCamera();
        return;
      }
      if (!this.isDraggingViewport) return;
      const dx = e.clientX - this.dragStartX, dy = e.clientY - this.dragStartY;
      if (Math.hypot(dx, dy) > 6) this.hasDraggedBeyondThreshold = true;
      if (!this.hasDraggedBeyondThreshold) return;
      c.tx = this.scrollStartX + dx; c.ty = this.scrollStartY + dy;
      this.applyCamera();
    });
    const up = (e) => {
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = null;
      if (pts.size === 0) this.isDraggingViewport = false;
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    vp.addEventListener('wheel', (e) => {
      e.preventDefault();
      const c = this.camState(), r = vp.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      const wx = (mx - c.tx) / c.s, wy = (my - c.ty) / c.s;
      c.s *= e.deltaY < 0 ? 1.1 : 1 / 1.1; c.fit = false;
      c.tx = mx - wx * c.s; c.ty = my - wy * c.s;
      this.applyCamera();
    }, { passive: false });
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'btn-cam-fit'; btn.id = 'btnCamFit';
    btn.title = '顯示全圖'; btn.setAttribute('aria-label', '顯示全圖'); btn.textContent = '全圖';
    btn.addEventListener('click', (e) => { e.stopPropagation(); this.fitCamera(); });
    vp.appendChild(btn);
    const refit = () => { const c = this.camState(); if (c.fit) this.fitCamera(); else this.applyCamera(); };
    window.addEventListener('resize', refit);
    window.addEventListener('orientationchange', () => setTimeout(refit, 250));
    if (window.ResizeObserver) new ResizeObserver(refit).observe(vp);
    this.fitCamera();
  }

  centerCameraOn(x, y, smooth = false) { this.frameTiles([{ x, y }], smooth); }

  /** Pixels of the battle viewport hidden by bottom overlays (sheets, menus, preview cards, info strip). */
  measureBottomInset() {
    const vp = document.getElementById('battleViewport');
    if (!vp) return 0;
    const vr = vp.getBoundingClientRect();
    let top = vr.bottom;
    const els = ['deployTrayBar', 'targetPreviewCard', 'actionMenuPopover', 'actionSublistPanel', 'bottomTerrainStrip'].map(id => document.getElementById(id));
    const overlay = document.getElementById('tutorialBoardOverlay');
    if (overlay && overlay.style.display !== 'none' && !overlay.classList.contains('card-at-top')) {
      els.push(overlay.querySelector('.tutorial-board-card'));
    }
    els.forEach(el => {
      if (!el || el.offsetParent === null) return;
      const r = el.getBoundingClientRect();
      if (r.height > 0 && r.bottom >= vr.bottom - 30 && r.top < vr.bottom) top = Math.min(top, r.top);
    });
    return Math.max(0, vr.bottom - top);
  }

  /** Pan (never zoom) so tiles sit in the uncovered part of the viewport. At fit scale the whole map is already visible, except tiles hidden under a bottom overlay. */
  frameTiles(tiles, smooth = false, preferTop = false) {
    const vp = document.getElementById('battleViewport');
    if (!vp || !tiles || !tiles.length) return;
    const c = this.camState();
    const inset = this.measureBottomInset();
    const w = vp.clientWidth, h = Math.max(120, vp.clientHeight - inset);
    const xs = tiles.map(t => t.x), ys = tiles.map(t => t.y);
    const minX = Math.min(...xs) * 64 * c.s, maxX = (Math.max(...xs) + 1) * 64 * c.s;
    const minY = Math.min(...ys) * 64 * c.s, maxY = (Math.max(...ys) + 1) * 64 * c.s;
    const fitsY = maxY - minY <= h - 8;
    // Only move if a tile is out of the visible area
    if (minX + c.tx < 0 || maxX + c.tx > w) c.tx = w / 2 - (minX + maxX) / 2;
    if (minY + c.ty < 0 || maxY + c.ty > h) {
      c.ty = preferTop ? 8 - minY : (fitsY ? h / 2 - (minY + maxY) / 2 : Math.max(8 - minY, h - 36 - maxY));
      // allow lifting the map above an overlay even when at fit scale
      const stage = document.getElementById('battleBoardStage');
      const ch = 832 * c.s;
      const lo = Math.min(0, vp.clientHeight - ch) - inset;
      c.ty = Math.min(Math.max(c.ty, lo), Math.max(0, (vp.clientHeight - ch) / 2));
      if (stage) {
        stage.style.transition = smooth ? 'transform 0.25s ease-out' : '';
        stage.style.transform = `translate(${c.tx = (640 * c.s <= w ? (w - 640 * c.s) / 2 : Math.min(0, Math.max(w - 640 * c.s, c.tx)))}px, ${c.ty}px) scale(${c.s})`;
      }
      return;
    }
    this.applyCamera();
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
      7: { left: '18%', top: '28%', name: '外傳 · 荒澤' },
      8: { left: '46%', top: '16%', name: '第八回 · 萬壑' }
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
    const badgeEl = document.getElementById('txtChapterBadge');
    if (badgeEl) badgeEl.textContent = chapter.id === 7 ? '外傳' : `第${chapter.id}回`;

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

    const preSynergy = document.getElementById('preSquadSynergyStrip');
    if (preSynergy) {
      const syns = getClassSynergies(selectedSquadIds);
      if (syns.length > 0) {
        preSynergy.style.display = 'flex';
        preSynergy.innerHTML = syns.map(s => `
          <div class="synergy-badge" title="${s.desc}">
            <span class="syn-icon">${s.icon}</span>
            <span class="syn-name">${s.name}</span>
            <span class="syn-desc">${s.desc}</span>
          </div>
        `).join('');
      } else {
        preSynergy.style.display = 'none';
        preSynergy.innerHTML = '';
      }
    }

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
    const badgeEl = document.getElementById('txtChapterBadge');
    if (badgeEl) badgeEl.textContent = battle.chapter.id === 7 ? '外傳' : `第${battle.chapter.id}回`;

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
      battle.chapter.objectiveType === 'breach_gate_or_rout' ? '破關斬將' :
      battle.chapter.objectiveType === 'break_phalanx_or_rout' ? '破陣斬將' : '討伐鐵將';

    const cart = battle.getEscortCart ? battle.getEscortCart() : battle.allies.find(u => u.id === 'lantern_cart');
    if (cart && battle.chapter.objectiveType === 'escort') {
      const isGuarded = battle.isCartGuarded ? battle.isCartGuarded() : false;
      const guardText = isGuarded ? '護衛中' : '落單警戒';
      const totalSteps = battle.escortPath ? battle.escortPath.length : 9;
      const currentStep = (battle.escortStep ?? 0) + 1;
      const stepSpeed = battle.cartHold ? '固守+0' : (battle.cartSpeedBoost ? '疾馳+2' : '行進+1');
      document.getElementById('hudObjectiveTicker').textContent =
        `${battle.chapter.mapName} · 護送燈車 【HP ${cart.hp}/${cart.maxHp} · ${guardText} · ${stepSpeed} · ${currentStep}/${totalSteps}】`;
    } else {
      document.getElementById('hudObjectiveTicker').textContent = `${battle.chapter.mapName} · ${shortObj}`;
    }

    // Update Morale HUD
    const allyMorale = battle.allyMorale ?? 100;
    const enemyMorale = battle.enemyMorale ?? 100;
    const maxMorale = battle.maxMorale ?? 100;
    const elAllyM = document.getElementById('hudAllyMorale');
    if (elAllyM) elAllyM.textContent = allyMorale;
    const elEnemyM = document.getElementById('hudEnemyMorale');
    if (elEnemyM) elEnemyM.textContent = enemyMorale;
    const elAllyFill = document.getElementById('hudAllyMoraleFill');
    if (elAllyFill) elAllyFill.style.width = `${Math.max(0, Math.min(100, (allyMorale / maxMorale) * 100))}%`;
    const elEnemyFill = document.getElementById('hudEnemyMoraleFill');
    if (elEnemyFill) elEnemyFill.style.width = `${Math.max(0, Math.min(100, (enemyMorale / maxMorale) * 100))}%`;

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
      figWrap.className = `unit-figure ${u.team} ${u.promoted ? 'promoted' : ''} ${u.acted ? 'acted' : ''} ${u.isRouted ? 'is-routed' : ''} ${u.y % 2 === 0 ? 'row-even' : 'row-odd'}`;
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
      const isGuarded = (u.id === 'lantern_cart' && battle.isCartGuarded?.());
      if (isGuarded) figWrap.classList.add('is-guarded');

      const guardBadgeHtml = isGuarded ? `<div class="cart-guard-badge">🛡️ 護衛減傷50%</div>` : '';
      const figContent = isCart ?
        `<div class="npc-ambient-halo" style="position:absolute;width:64px;height:64px;background:radial-gradient(circle,rgba(255,190,60,0.5) 0%,transparent 70%);border-radius:50%;pointer-events:none;"></div>
         <img src="assets/art/v4/fig_${u.id}.webp" alt="${u.name}" class="unit-fig-img" style="animation-delay: -${delay}s;">` :
        `<img src="assets/art/v4/fig_${u.id}.webp" alt="${u.name}" class="unit-fig-img" style="animation-delay: -${delay}s;">`;

      const classChar = u.clsBadge || (u.cls ? u.cls[0] : (u.role === 'tank' ? '盾' : '兵'));

      const routHtml = u.isRouted ? `
        <div class="unit-rout-flag"><span class="rout-flag-icon">⚑</span><span class="rout-flag-text">潰</span></div>
        <div class="unit-rout-dust"></div>
      ` : '';

      const tags = handlers.targetTagsMap ? handlers.targetTagsMap.get(u.id) : null;
      const targetTagsHtml = (tags && tags.length > 0) ? `
        <div class="target-tags-container">
          ${tags.map(t => {
            const cls = t.includes('克制') ? 'tag-advantage' : (t.includes('擊破') ? 'tag-kill' : 'tag-counter');
            return `<span class="target-map-tag ${cls}">${t}</span>`;
          }).join('')}
        </div>
      ` : '';

      figWrap.innerHTML = `
        <div class="unit-ground-shadow"></div>
        <div class="unit-team-ring"></div>
        ${targetTagsHtml}
        <div class="unit-name-tag">${u.name}</div>
        ${guardBadgeHtml}
        ${figContent}
        ${routHtml}
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

    // Render Telegraphed Reinforcements Warning Markers
    const incoming = battle.getIncomingReinforcements ? battle.getIncomingReinforcements() : [];
    incoming.forEach(r => {
      const marker = document.createElement('div');
      marker.className = 'reinforcement-spawn-marker';
      marker.style.left = `${r.x * 64}px`;
      marker.style.top = `${r.y * 64}px`;
      const foeProto = ENEMY_PROTOS[r.id];
      const foeName = foeProto ? foeProto.name : '敵軍精銳';
      marker.innerHTML = `
        <div class="marker-pulse-ring"></div>
        <div class="marker-hazard-badge">⚠️ 援軍突襲</div>
        <div class="marker-unit-name">${foeName}</div>
      `;
      figuresLayer.appendChild(marker);
    });

    // Render Escort Mission Path & Next Turn Destination Marker
    if (battle.chapter?.objectiveType === 'escort' && battle.escortPath && battle.escortPath.length > 0) {
      const currentStep = battle.escortStep ?? 0;
      // Dotted path steps for remaining route
      for (let i = currentStep + 1; i < battle.escortPath.length; i++) {
        const pt = battle.escortPath[i];
        const pathDot = document.createElement('div');
        pathDot.className = 'escort-path-dot';
        pathDot.style.left = `${pt.x * 64}px`;
        pathDot.style.top = `${pt.y * 64}px`;
        figuresLayer.appendChild(pathDot);
      }
      // Destination marker for next move (only during active battle phase)
      const isDeploy = handlers.deploySlots && handlers.deploySlots.size > 0;
      if (!isDeploy && battle.phase !== 'deploy') {
        const nextDest = battle.getNextCartDestination ? battle.getNextCartDestination() : null;
        if (nextDest) {
          const destMarker = document.createElement('div');
          destMarker.className = 'escort-dest-marker';
          destMarker.style.left = `${nextDest.x * 64}px`;
          destMarker.style.top = `${nextDest.y * 64}px`;
          destMarker.innerHTML = `
            <div class="escort-dest-ring"></div>
            <div class="escort-dest-badge">⚑ 次回進軍</div>
          `;
          figuresLayer.appendChild(destMarker);
        }
      }
    }

    // Bottom terrain info: reflect selected unit or clear stale info
    if (selectedUnit) {
      this.updateBottomStrip(selectedUnit.x, selectedUnit.y, battle.board, selectedUnit);
    } else {
      this.clearBottomStrip();
    }

    // Weather badge update & visual overlay
    const wKey = battle.weather || battle.chapter?.weather || 'clear';
    const wCfg = WEATHER_CONFIG[wKey] || WEATHER_CONFIG.clear;
    const wBadge = document.getElementById('hudWeatherBadge');
    if (wBadge) {
      wBadge.title = wCfg.tooltip;
      const wIcon = document.getElementById('hudWeatherIcon');
      const wName = document.getElementById('hudWeatherName');
      if (wIcon) wIcon.textContent = wCfg.icon;
      if (wName) wName.textContent = wCfg.tag;
    }
    this.renderWeatherOverlay(battle);
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

    // 3. Enemy Threat Range: Feathered vermilion contour & translucent wash
    if (handlers.threatTiles && handlers.threatTiles.size > 0) {
      drawMergedRegion(
        handlers.threatTiles,
        'rgba(215, 45, 45, 0.18)',
        'rgba(240, 60, 60, 0.88)',
        'rgba(255, 50, 50, 0.8)',
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

  // Visual Weather Overlays Canvas (Rain streaks, misty fog haze, blowing wind leaves)
  renderWeatherOverlay(battle) {
    const canvas = document.getElementById('weatherOverlayCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 640, 832);

    const weather = battle?.weather || battle?.chapter?.weather || 'clear';
    if (weather === 'rain') {
      ctx.save();
      // Stormy atmospheric mist wash
      ctx.fillStyle = 'rgba(15, 30, 55, 0.2)';
      ctx.fillRect(0, 0, 640, 832);

      ctx.strokeStyle = 'rgba(215, 240, 255, 0.88)';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      // Draw 260 distinct rain streaks slanted at -15 deg
      for (let i = 0; i < 260; i++) {
        const x = (i * 29 + 17) % 640;
        const y = (i * 43 + 23) % 832;
        const len = (i % 3 === 0) ? 32 : ((i % 2 === 0) ? 26 : 20);
        ctx.moveTo(x, y);
        ctx.lineTo(x - 7, y + len);
      }
      ctx.stroke();

      // Rain splashes / ripples on ground
      ctx.strokeStyle = 'rgba(215, 240, 255, 0.45)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 45; i++) {
        const sx = (i * 59 + 31) % 640;
        const sy = (i * 71 + 47) % 832;
        ctx.beginPath();
        ctx.ellipse(sx, sy, 5, 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    } else if (weather === 'fog') {
      ctx.save();
      const grad = ctx.createLinearGradient(0, 0, 0, 832);
      grad.addColorStop(0, 'rgba(150, 175, 205, 0.22)');
      grad.addColorStop(0.35, 'rgba(180, 205, 230, 0.32)');
      grad.addColorStop(0.7, 'rgba(135, 160, 190, 0.20)');
      grad.addColorStop(1, 'rgba(165, 190, 215, 0.28)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 832);
      ctx.restore();
    } else if (weather === 'wind') {
      ctx.save();
      ctx.fillStyle = 'rgba(215, 240, 150, 0.75)';
      for (let i = 0; i < 30; i++) {
        const x = (i * 53 + 43) % 640;
        const y = (i * 47 + 31) % 832;
        ctx.beginPath();
        ctx.ellipse(x, y, 7, 3, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  showCombatBark(unit, title, text, duration = 1500) {
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
    }, duration);
  }

  clearBottomStrip() {
    const coord = document.getElementById('stripCoord');
    const terrain = document.getElementById('stripTerrain');
    const unitInfo = document.getElementById('stripUnitInfo');
    if (coord) coord.textContent = '';
    if (terrain) terrain.textContent = '點擊棋子或地塊查看情報';
    if (unitInfo) {
      unitInfo.style.display = 'none';
      unitInfo.textContent = '';
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

  showActionMenu(x, y, actions, onChooseAction, onCancel, onInfo = null, unit = null) {
    const pop = document.getElementById('actionMenuPopover');
    if (!pop) return;

    pop.style.display = 'flex';
    // Clear any obsolete absolute stage coordinates so it cleanly docks in bottom third
    pop.style.left = '';
    pop.style.top = '';
    pop.style.transformOrigin = '';
    pop.style.transform = '';

    if (unit) {
      const nameEl = document.getElementById('dockedActingUnitName');
      if (nameEl) nameEl.textContent = `${unit.name} · 行動`;
      const badgeEl = document.getElementById('dockedUnitBadge');
      if (badgeEl) badgeEl.textContent = unit.clsBadge || (unit.cls ? unit.cls[0] : '兵');
      const hpEl = document.getElementById('dockedUnitHp');
      if (hpEl) hpEl.textContent = `HP ${unit.hp}/${unit.maxHp} · MP ${unit.mp ?? 6}/${unit.maxMp ?? 6}`;
    }

    const btnClose = document.getElementById('btnDockedClose');
    if (btnClose) btnClose.onclick = () => onCancel();

    // Hook buttons with subtitles and reason chips
    const btnAtk = document.getElementById('btnActionAttack');
    if (btnAtk) {
      btnAtk.disabled = !actions.attack;
      btnAtk.title = actions.attack ? '進行普通攻擊' : (actions.attackReason || '範圍內無目標');
      const reasonHtml = !actions.attack ? `<span class="action-reason-chip">${actions.attackReason || '無目標'}</span>` : '';
      btnAtk.innerHTML = `
        <span class="action-btn-icon">⚔️</span>
        <div class="action-btn-text-group">
          <span class="action-txt">攻擊</span>
          <span class="action-sub-txt">近身物理·無消耗·可能被反擊</span>
        </div>
        ${reasonHtml}
      `;
      btnAtk.onclick = () => onChooseAction('attack');
    }

    const btnSkill = document.getElementById('btnActionSkill');
    if (btnSkill) {
      btnSkill.disabled = !actions.skill;
      btnSkill.title = actions.skill ? '施展專屬技能' : (actions.skillReason || 'MP不足');
      const costHtml = actions.skillCost ? `<span class="action-cost-tag">${actions.skillCost}MP</span>` : '';
      const reasonHtml = !actions.skill ? `<span class="action-reason-chip">${actions.skillReason || 'MP不足'}</span>` : '';
      btnSkill.innerHTML = `
        <span class="action-btn-icon">⚡</span>
        <div class="action-btn-text-group">
          <span class="action-txt">技能</span>
          <span class="action-sub-txt">職業招式·耗氣力</span>
        </div>
        ${costHtml}
        ${reasonHtml}
      `;
      btnSkill.onclick = () => onChooseAction('skill');
    }

    const btnMag = document.getElementById('btnActionMagic');
    if (btnMag) {
      btnMag.disabled = !actions.magic;
      btnMag.title = actions.magic ? '施展五行法術' : (actions.magicReason || 'MP不足');
      const costHtml = actions.magicCost ? `<span class="action-cost-tag">${actions.magicCost}MP</span>` : '';
      const reasonHtml = !actions.magic ? `<span class="action-reason-chip">${actions.magicReason || 'MP不足'}</span>` : '';
      btnMag.innerHTML = `
        <span class="action-btn-icon">🔮</span>
        <div class="action-btn-text-group">
          <span class="action-txt">法術</span>
          <span class="action-sub-txt">屬性·克制·耗MP</span>
        </div>
        ${costHtml}
        ${reasonHtml}
      `;
      btnMag.onclick = () => onChooseAction('magic');
    }

    const btnBond = document.getElementById('btnActionBond');
    if (btnBond) {
      if (actions.bond) {
        btnBond.style.display = 'flex';
        btnBond.innerHTML = `
          <span class="action-btn-icon">🤝</span>
          <div class="action-btn-text-group">
            <span class="action-txt">合擊</span>
            <span class="action-sub-txt">同氣連枝·協同突擊</span>
          </div>
        `;
        btnBond.onclick = () => onChooseAction('bond');
      } else {
        btnBond.style.display = 'none';
      }
    }

    const btnWait = document.getElementById('btnActionWait');
    if (btnWait) {
      btnWait.innerHTML = `
        <span class="action-btn-icon">🛡️</span>
        <div class="action-btn-text-group">
          <span class="action-txt">待命</span>
          <span class="action-sub-txt">結束行動·防禦+10%</span>
        </div>
      `;
      btnWait.onclick = () => onChooseAction('wait');
    }

    const btnCancel = document.getElementById('btnActionCancel');
    if (btnCancel) {
      btnCancel.innerHTML = `
        <span class="action-btn-icon">↩️</span>
        <div class="action-btn-text-group">
          <span class="action-txt">復原</span>
          <span class="action-sub-txt">撤回移動</span>
        </div>
      `;
      btnCancel.onclick = () => onCancel();
    }

    this.bindActionLongPress(pop, onInfo);
  }

  showActionSublist(title, moves, onSelectMove, onBack) {
    const sub = document.getElementById('actionSublistPanel');
    if (!sub) return;
    this.hideActionMenu();
    sub.style.display = 'flex';

    const titleEl = document.getElementById('sublistTitle');
    if (titleEl) titleEl.textContent = title;

    const btnBack = document.getElementById('btnSublistBack');
    if (btnBack) btnBack.onclick = () => {
      sub.style.display = 'none';
      onBack && onBack();
    };

    const container = document.getElementById('sublistItemsContainer');
    if (!container) return;
    container.innerHTML = '';

    const elemMap = { fire: '🔥 火相', water: '💧 水相', thunder: '⚡ 雷相', wood: '🌿 木相', dark: '🌙 暗煞', light: '✨ 光輝' };

    moves.forEach(m => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sublist-item-btn';
      const elemName = elemMap[m.element] || '⚔️ 物理';
      btn.innerHTML = `
        <div class="sublist-item-left">
          <div class="sublist-item-row">
            <span class="sublist-item-name">${m.name}</span>
            <span class="sublist-item-elem">${elemName}</span>
          </div>
          <span class="sublist-item-desc">${m.desc || '強效戰術招式'}</span>
        </div>
        <span class="sublist-item-cost">${m.cost ? `${m.cost} MP` : '無消耗'}</span>
      `;
      btn.onclick = () => {
        sub.style.display = 'none';
        onSelectMove(m);
      };
      container.appendChild(btn);
    });
  }

  hideActionMenu() {
    const pop = document.getElementById('actionMenuPopover');
    if (pop) pop.style.display = 'none';
    const sub = document.getElementById('actionSublistPanel');
    if (sub) sub.style.display = 'none';
  }

  /** ~400ms press (touch or mouse) on attack/skill/magic shows info; release hides; a short tap still selects. */
  bindActionLongPress(pop, onInfo) {
    pop._onInfo = onInfo;
    if (pop._lpBound) return;
    pop._lpBound = true;
    let timer = null, active = null, suppressClick = false;
    const end = () => {
      clearTimeout(timer); timer = null;
      if (active) { const a = active; active = null; pop._onInfo && pop._onInfo(a, false); }
    };
    pop.addEventListener('pointerdown', (e) => {
      const btn = e.target.closest('[data-action]');
      const act = btn?.dataset.action;
      if (!['attack', 'skill', 'magic'].includes(act)) return;
      suppressClick = false;
      clearTimeout(timer);
      timer = setTimeout(() => {
        active = act; suppressClick = true;
        if (navigator.vibrate) try { navigator.vibrate(10); } catch (_) {}
        pop._onInfo && pop._onInfo(act, true);
      }, 400);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => pop.addEventListener(t, end));
    window.addEventListener('pointerup', end);
    pop.addEventListener('contextmenu', (e) => e.preventDefault());
    // Swallow the click that follows a long-press so it doesn't also select
    pop.addEventListener('click', (e) => { if (suppressClick) { suppressClick = false; e.stopPropagation(); e.preventDefault(); } }, true);
  }

  showActionInfoCard(info, unit) {
    let card = document.getElementById('actionInfoCard');
    if (!card) {
      card = document.createElement('div');
      card.id = 'actionInfoCard';
      card.className = 'action-info-card';
      document.body.appendChild(card);
    }
    const esc = (v) => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const rows = info.targets.length ? info.targets.map(t => `
      <div class="aic-target">
        <span class="aic-tname">${esc(t.name)}</span>
        <span class="aic-dmg">-${t.damage}<small>/${t.hp}</small></span>
        <span>命中${t.hit}%</span>
        <span class="${t.koChance > 0 ? 'aic-ko' : ''}">擊破${t.koChance}%</span>
        <span class="${t.counter ? 'aic-counter' : 'aic-safe'}">${t.counter ? `反擊-${t.counterDamage}` : '無反擊'}</span>
      </div>`).join('') : `<div class="aic-none">${info.isSupport ? '輔助招式' : '射程內暫無敵人'}</div>`;
    card.innerHTML = `
      <div class="aic-head"><b>${esc(info.name)}</b><span>${esc(info.desc)}</span></div>
      <div class="aic-stats">
        <span>威力 <b>${info.power ?? '—'}</b></span>
        <span>屬性 <b>${esc(info.element)}</b></span>
        <span>命中 <b>${info.baseHit != null ? info.baseHit + '%' : '—'}</b></span>
        <span>MP <b>${info.cost}/${info.mp}</b></span>${info.hpCost ? `<span class="aic-counter">耗血 -${info.hpCost}</span>` : ''}
        <span>射程 <b>${esc(info.range)}</b></span>
        <span>範圍 <b>${esc(info.aoe)}</b></span>
      </div>
      <div class="aic-note">${esc(info.counterNote)}</div>
      ${rows}`;
    // Keep the unit visible: dock the card on the opposite half of the screen
    const el = document.querySelector(`[data-unit-id="${unit.id}"]`);
    const r = el ? el.getBoundingClientRect() : { top: 0, bottom: 0 };
    const vh = window.innerHeight;
    card.classList.toggle('dock-top', (r.top + r.bottom) / 2 > vh / 2);
    card.classList.toggle('dock-bottom', (r.top + r.bottom) / 2 <= vh / 2);
    card.style.display = 'block';
  }

  hideActionInfoCard() {
    const card = document.getElementById('actionInfoCard');
    if (card) card.style.display = 'none';
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
      document.getElementById('prevCounterVal').textContent = `反擊 ${counterDamage}`;
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

  showBoardTutorial(step = 0, onStepChange, onComplete, onSuggest = null) {
    const overlay = document.getElementById('tutorialBoardOverlay');
    if (!overlay) return;

    overlay.style.display = 'flex';
    const steps = [
      {
        num: '1 / 7',
        title: '選擇將士 · 排兵先行',
        actionHint: '點選【熊岳】· 查看移動與指令',
        text: '①「選定」點選將士查看移動範圍與指令。何時使用：戰鬥開始或切換目標時點選。',
        when: '何時使用：戰鬥開始或切換目標時點選。',
        idle: '✦ 提示：點擊發光的熊岳查看前進路線！'
      },
      {
        num: '2 / 7',
        title: '步法挺進 · 搶佔要津',
        actionHint: '點選藍格 · 挺進石橋前線',
        text: '②「移動」點選藍色地塊挺進前線。何時使用：接近敵軍或搶佔樹林高地時使用。',
        when: '何時使用：接近敵軍或搶佔樹林高地時使用。',
        idle: '✦ 提示：點擊前方藍色地塊走位至前線！'
      },
      {
        num: '3 / 7',
        title: '普通攻擊 · 近身破敵',
        actionHint: '點選【攻擊】· 鎖定橋頭敵軍',
        text: '③「攻擊」近身物理·無消耗。何時使用：近距交鋒、節省MP或殘血補刀時使用。',
        when: '何時使用：近距交鋒、節省MP或殘血補刀時使用。',
        idle: '✦ 提示：點擊【攻擊】鎖定紅框內敵軍！'
      },
      {
        num: '4 / 7',
        title: '專屬技能 · 職業特技',
        actionHint: '點選【技能】· 施展職業招式',
        text: '④「技能」職業特技·耗氣力。何時使用：需要擊退破陣、推敵落水或強控時使用。',
        when: '何時使用：需要擊退破陣、推敵落水或強控時使用。',
        idle: '✦ 提示：點擊【技能】施展巨盾推擊或影步突刺！'
      },
      {
        num: '5 / 7',
        title: '屬性法術 · 克制制勝',
        actionHint: '點選【法術】· 克制×1.5',
        text: '⑤「法術」屬性魔法·看克制。何時使用：敵帶五行弱點時使用（火克木享1.5倍傷害）。',
        when: '何時使用：敵帶五行弱點時使用（火克木享1.5倍傷害）。',
        idle: '✦ 提示：點擊【法術】施展破煞靈矢，看準【克制 ×1.5】爆發破敵！'
      },
      {
        num: '6 / 7',
        title: '原地待命 · 固守陣型',
        actionHint: '點選【待命】· 結束本回行動',
        text: '⑥「待命」結束將士行動。何時使用：已到有利防守陣位且無須行動時待命獲防禦加成。',
        when: '何時使用：已到有利防守陣位且無須行動時待命獲防禦加成。',
        idle: '✦ 提示：點擊【待命】讓將士固守陣地結束本動！'
      },
      {
        num: '7 / 7',
        title: '結束回合 · 輪轉敵軍',
        actionHint: '點選【結束回合】· 輪到敵方行動',
        text: '⑦「回合」結束我軍階段。何時使用：全體將士行動皆已完畢，輪到敵軍進犯時點選。',
        when: '何時使用：全體將士行動皆已完畢，輪到敵軍進犯時點選。',
        idle: '✦ 提示：點擊右上角【結束回合】交替回合！'
      }
    ];

    let curStep = Math.max(0, Math.min(steps.length - 1, step));
    this.boardTutorialStep = curStep;
    let idleTimer = null;

    const render = () => {
      clearTimeout(idleTimer);
      const s = steps[curStep];
      this.boardTutorialStep = curStep;
      const stepEl = document.getElementById('boardTutorialStep');
      const titleEl = document.getElementById('boardTutorialTitle');
      const textEl = document.getElementById('boardTutorialText');
      const compactTextEl = document.getElementById('boardTutorialTextCompact');

      if (stepEl) stepEl.textContent = s.num;
      if (titleEl) titleEl.textContent = `燈影軍略 · ${s.title}`;
      if (textEl) textEl.textContent = s.text;
      if (compactTextEl) {
        compactTextEl.textContent = s.actionHint || `${s.title}：${s.text.replace(/^[①②③④⑤⑥⑦]\s*「.*?」\s*/, '')}`;
      }

      const expandBtn = document.getElementById('btnTutorialExpand');
      const expandedBody = document.getElementById('tutorialCardExpandedBody');
      const cardEl = document.getElementById('tutorialBoardCard');
      if (expandBtn && expandedBody && cardEl) {
        expandBtn.onclick = () => {
          const isExp = expandedBody.style.display !== 'none';
          expandedBody.style.display = isExp ? 'none' : 'block';
          expandBtn.textContent = isExp ? '詳情' : '收起';
          cardEl.classList.toggle('expanded', !isExp);
        };
      }

      const btnSuggest = document.getElementById('btnTutorialSuggest');
      if (btnSuggest) {
        btnSuggest.classList.remove('pulse-idle');
        btnSuggest.onclick = () => {
          if (onSuggest) onSuggest(curStep);
        };
      }

      idleTimer = setTimeout(() => {
        const textEl = document.getElementById('boardTutorialText');
        if (textEl) textEl.textContent = s.idle;
        if (compactTextEl) compactTextEl.textContent = s.idle;
        if (btnSuggest) btnSuggest.classList.add('pulse-idle');
      }, 8000);
    };

    render();
    if (onStepChange) onStepChange(curStep);

    const btnAck = document.getElementById('btnBoardTutorialAck');
    if (btnAck) {
      btnAck.onclick = () => {
        clearTimeout(idleTimer);
        if (curStep < steps.length - 1) {
          curStep++;
          render();
          if (onStepChange) onStepChange(curStep);
        } else {
          overlay.style.display = 'none';
          if (onComplete) onComplete();
        }
      };
    }

    const btnClose = document.getElementById('btnBoardTutorialClose');
    if (btnClose) {
      btnClose.onclick = () => {
        clearTimeout(idleTimer);
        overlay.style.display = 'none';
        if (onComplete) onComplete();
      };
    }
  }

  setTutorialStep(step, onStepChange) {
    this.boardTutorialStep = step;
    this.showBoardTutorial(step, onStepChange);
  }

  hideBoardTutorial() {
    const overlay = document.getElementById('tutorialBoardOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  renderDeployPhase(chapter, squadUnits, deployTiles, placedMap, onSelectSquadUnit, onConfirmDeploy) {
    const badgeEl = document.getElementById('txtChapterBadge');
    if (badgeEl) badgeEl.textContent = chapter.id === 7 ? '外傳' : `第${chapter.id}回`;

    const tray = document.getElementById('deployTrayBar');
    if (!tray) return;

    tray.style.display = 'flex';

    const deploySynergy = document.getElementById('deploySynergyStrip');
    if (deploySynergy) {
      const syns = getClassSynergies(squadUnits.map(u => u.id));
      if (syns.length > 0) {
        deploySynergy.style.display = 'flex';
        deploySynergy.innerHTML = syns.map(s => `
          <div class="synergy-badge" title="${s.desc}">
            <span class="syn-icon">${s.icon}</span>
            <span class="syn-name">${s.name}</span>
            <span class="syn-desc">${s.desc}</span>
          </div>
        `).join('');
      } else {
        deploySynergy.style.display = 'none';
        deploySynergy.innerHTML = '';
      }
    }

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

    const toggleBtn = document.getElementById('btnToggleDeployTray');
    if (toggleBtn) {
      toggleBtn.onclick = () => {
        const isCollapsed = tray.classList.toggle('collapsed');
        toggleBtn.textContent = isCollapsed ? '展開 ▲' : '收起 ▼';
      };
    }
  }

  hideDeployPhase() {
    const tray = document.getElementById('deployTrayBar');
    if (tray) tray.style.display = 'none';
    const stage = document.querySelector('.battle-board-stage');
    this.applyCamera();
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
        num: '第 1 / 7 步',
        icon: '⚑',
        title: '【步法前進 · 藍格移動】',
        text: '點選我方將士，腳下藍色格子為合法移動範圍。點選藍格即可率軍行進至該位置（點選自身即原地待命）。'
      },
      {
        num: '第 2 / 7 步',
        icon: '⚔',
        title: '【攻擊鎖定 · 陣前交鋒】',
        text: '移動後點擊【攻擊】，紅格為射程範圍。再次點擊目標或點確認執行交鋒。'
      },
      {
        num: '第 3 / 7 步',
        icon: '🌲',
        title: '【險要據守 · 地形生克】',
        text: '進駐林木可獲防禦與迴避加成；山丘制高點居高臨下享有20%傷害增益與射程加成。'
      },
      {
        num: '第 4 / 7 步',
        icon: '🎯',
        title: '【反擊側翼 · 致命背刺】',
        text: '正面交鋒易遭反擊；側翼突襲享受1.2倍傷害，背面偷襲更享1.5倍傷害且敵方無法反擊（墨影疾影享雙倍）。'
      },
      {
        num: '第 5 / 7 步',
        icon: '🏮',
        title: '【燈火長明 · 破霧驅咒】',
        text: '長明燈光照亮前方夜霧，驅散幽冥咒縛，令隱匿刺客與妖霧敵軍徹底現形。'
      },
      {
        num: '第 6 / 7 步',
        icon: '⚡',
        title: '【奇術破陣 · 直線扇面】',
        text: '消耗法力施展專屬「技能」或「法術」，支援直線貫穿推進或錐形烈焰覆蓋群敵。'
      },
      {
        num: '第 7 / 7 步',
        icon: '📜',
        title: '【軍略妙算 · 運籌帷幄】',
        text: '戰場即時發動全軍軍略妙計（火攻、水淹、夜襲、鼓舞），逆轉戰局克敵制勝！'
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

    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      modal.style.display = 'none';
      document.removeEventListener('keydown', onKey);
      modal.onclick = null;
      if (onClose) onClose();
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    // Tap on the dimmed backdrop (outside the card) closes too
    modal.onclick = (e) => { if (e.target === modal) close(); };
    if (btnClose) btnClose.onclick = (e) => { e.stopPropagation(); close(); };
    if (btnNext) {
      btnNext.onclick = () => {
        if (curStep < steps.length - 1) { curStep++; updateView(); } else { close(); }
      };
    }
  }

  // ================= WALK ANIMATION (rAF, distance-synced rig) =================
  /**
   * Animate units walking tile by tile along their pathfinding route.
   * walks: [{ id, path:[{x,y}...], unit? }]. Figures are already rendered at the final tile;
   * we offset them back with translate3d and interpolate per frame (GPU transforms only).
   */
  animateWalks(walks, opts = {}) {
    const layer = document.getElementById('figuresLayer');
    if (!layer || !walks || !walks.length) return Promise.resolve();
    const TILE = 64, MS_PER_TILE = opts.msPerTile || window.__ltWalkMs || 140;
    const prep = walks.map(w => {
      const el = layer.querySelector(`[data-unit-id="${w.id}"]`);
      if (!el || !w.path || w.path.length < 2) return null;
      const end = w.path[w.path.length - 1];
      const off = (p) => ({ x: (p.x - end.x) * TILE, y: (p.y - end.y) * TILE });
      const s0 = off(w.path[0]);
      el.style.transform = `translate3d(${s0.x}px, ${s0.y}px, 0)`;
      return { ...w, el, off };
    }).filter(Boolean);
    this.walkFrameTimes = [];
    const runOne = (w) => new Promise(resolve => {
      const el = w.el;
      const u = w.unit || {};
      const isCav = u.role === 'cavalry' || u.cls === '騎兵' || /騎|cavalry|rider/.test(`${u.cls || ''}${u.role || ''}${w.id}`);
      const rig = this.buildWalkRig(el, isCav);
      el.classList.add('is-walking');
      const segs = w.path.length - 1;
      const total = segs * MS_PER_TILE;
      let t0 = null, lastStep = 0, lastFacing = null, prevTs = null;
      const frame = (ts) => {
        if (t0 === null) t0 = ts;
        if (prevTs !== null) this.walkFrameTimes.push(ts - prevTs);
        prevTs = ts;
        const tt = Math.min(1, (ts - t0) / total);
        const dist = tt * segs;                       // tiles travelled
        const i = Math.min(segs - 1, Math.floor(dist));
        const f = dist - i;
        const a = w.off(w.path[i]), b = w.off(w.path[i + 1]);
        const x = a.x + (b.x - a.x) * f, y = a.y + (b.y - a.y) * f;
        const dx = w.path[i + 1].x - w.path[i].x;
        if (dx !== 0) {
          const facing = dx > 0 ? 1 : -1;
          if (facing !== lastFacing) {
            lastFacing = facing;
            el.style.setProperty('--facing', facing);
            if (u) u.facing = facing;
          }
        }
        el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
        // Exaggerated Walk cycle: 2 footfalls per tile, gallop: 1 cycle per tile
        const ph = dist * Math.PI * 2;
        const s = Math.sin(ph), c = Math.cos(ph);
        const fade = Math.min(1, dist * 4, (segs - dist) * 4); // ease limbs in/out at path ends
        if (rig) {
          if (isCav) {
            // Cavalry: visible galloping leap, rearing pitch, foreleg reach & hindleg kick
            rig.body.style.transform = `translate3d(0, ${(-Math.abs(s) * 11 * fade).toFixed(2)}px, 0) rotate(${(c * 12 * fade).toFixed(2)}deg)`;
            rig.legA.style.transform = `rotate(${(s * 42 * fade).toFixed(2)}deg)`;
            rig.legB.style.transform = `rotate(${(Math.sin(ph + 1.4) * -38 * fade).toFixed(2)}deg)`;
            rig.top.style.transform = `rotate(${(-c * 8 * fade).toFixed(2)}deg) skewX(${(s * 4 * fade).toFixed(2)}deg)`;
          } else {
            // Foot soldiers: wide stride swing (38deg), energetic bounce (6.5px), weapon/cloak swing
            rig.body.style.transform = `translate3d(0, ${(-Math.abs(s) * 6.5 * fade).toFixed(2)}px, 0) rotate(${(s * 4 * fade).toFixed(2)}deg)`;
            rig.legA.style.transform = `rotate(${(s * 38 * fade).toFixed(2)}deg)`;
            rig.legB.style.transform = `rotate(${(-s * 38 * fade).toFixed(2)}deg)`;
            rig.top.style.transform = `rotate(${(-s * 10 * fade).toFixed(2)}deg) skewX(${(c * 6 * fade).toFixed(2)}deg)`;
          }
        }
        const step = Math.floor(dist * (isCav ? 1 : 2));
        if (step > lastStep) { lastStep = step; this.spawnDustPuff(el, isCav); }
        if (tt < 1) { requestAnimationFrame(frame); return; }
        el.style.transform = '';
        el.classList.remove('is-walking');
        if (rig) rig.destroy();
        resolve();
      };
      requestAnimationFrame(frame);
    });
    if (opts.sequential) {
      return prep.reduce((p, w) => p.then(() => runOne(w)), Promise.resolve());
    }
    return Promise.all(prep.map(runOne));
  }

  /** Split the figure sprite into upper body + two leg layers (clip-path) so limbs can swing. */
  buildWalkRig(el, isCav) {
    const img = el.querySelector('.unit-fig-img');
    if (!img) return null;
    const w = img.offsetWidth || 50, h = img.offsetHeight || 60;
    const rig = document.createElement('div');
    rig.className = 'walk-rig';
    rig.style.width = `${w}px`;
    rig.style.height = `${h}px`;
    const body = document.createElement('div');
    body.className = 'walk-body';
    const hip = isCav ? 52 : 58;
    const mk = (cls, clip, origin) => {
      const d = document.createElement('div');
      d.className = `walk-part ${cls}`;
      d.style.clipPath = clip;
      d.style.transformOrigin = origin;
      const im = document.createElement('img');
      im.src = img.src; im.alt = '';
      d.appendChild(im);
      body.appendChild(d);
      return d;
    };
    const legB = mk('leg-back', `inset(${hip - 4}% 0 0 50%)`, `75% ${hip}%`);
    const legA = mk('leg-front', `inset(${hip - 4}% 50% 0 0)`, `25% ${hip}%`);
    const top = mk('upper', `inset(0 0 ${100 - hip - 2}% 0)`, `50% ${hip}%`);
    rig.appendChild(body);
    el.appendChild(rig);
    img.style.visibility = 'hidden';
    return { body, legA, legB, top, destroy: () => { rig.remove(); img.style.visibility = ''; } };
  }

  spawnDustPuff(el, big) {
    const d = document.createElement('div');
    d.className = `walk-dust ${big ? 'big' : ''}`;
    el.appendChild(d);
    setTimeout(() => d.remove(), 520);
  }

  /** Self-buff feedback: a blue shield glow and a green "防+N" float — never a damage number. */
  playBuffVfx(unit, label) {
    const vfxLayer = document.getElementById('vfxLayer') || document.getElementById('battleBoardStage');
    if (!vfxLayer) return;
    const el = document.createElement('div');
    el.className = 'vfx-buff-shield';
    el.textContent = `🛡 ${label}`;
    el.style.cssText = `position:absolute;left:${unit.x * 64 + 32}px;top:${unit.y * 64 + 8}px;transform:translate(-50%,-50%);` +
      'color:#9fe8ff;font-weight:800;font-size:18px;text-shadow:0 0 6px #2aa8ff,0 2px 2px #000;pointer-events:none;z-index:50;' +
      'animation:buffRise 1s ease-out forwards;';
    if (!document.getElementById('buffRiseKf')) {
      const st = document.createElement('style'); st.id = 'buffRiseKf';
      st.textContent = '@keyframes buffRise{0%{opacity:0;margin-top:10px}20%{opacity:1}100%{opacity:0;margin-top:-30px}}';
      document.head.appendChild(st);
    }
    vfxLayer.appendChild(el);
    setTimeout(() => el.remove(), 1000);
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

      // Floating numbers come from the resolved events, each drawn on the unit it actually hit
      if (Array.isArray(combatInfo.events)) {
        const ev = combatInfo.events;
        const where = (id) => (() => { const b = window.__lt?.getBattle?.(); return b ? [...b.allies, ...b.enemies] : []; })().find(u => u.id === id) || (id === attacker.id ? attacker : id === defender.id ? defender : null);
        ev.forEach(e => {
          const u = where(e.target);
          if (!u) return;
          if (e.type === 'hit') this.showFloatingDamage(u.x, u.y, { ...combatInfo, ...e, isWeakness: e.elementWeakness, isHeal: false, isMiss: false, isCounter: false });
          else if (e.type === 'miss') this.showFloatingDamage(u.x, u.y, { isMiss: true });
          else if (e.type === 'heal') this.showFloatingDamage(u.x, u.y, { isHeal: true, healAmount: e.amount });
          else if (e.type === 'counter') setTimeout(() => this.showFloatingDamage(u.x, u.y, { damage: e.damage, isCounter: true }), 260 * durMult);
        });
      } else {
        this.showFloatingDamage(defender.x, defender.y, combatInfo);
      }

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
      }
      if (info.isBackAttack) {
        floaterClass += ' back';
        tagHtml += '<span class="floating-tag-badge back">背刺 ×1.5</span>';
      } else if (info.isSideAttack) {
        tagHtml += '<span class="floating-tag-badge side">側翼 ×1.2</span>';
      }
      if (info.isHighGround) {
        tagHtml += '<span class="floating-tag-badge hill">居高臨下 ×1.2</span>';
      }
      if (info.isFrontBlocked) {
        floaterClass += ' block';
        tagHtml += '<span class="floating-tag-badge block">正面護盾 -70%</span>';
      }
      if (info.defBonus && info.defBonus > 0) {
        tagHtml += `<span class="floating-tag-badge def">地形防禦 -${info.defBonus}</span>`;
      }
      if (info.isWeakness) {
        floaterClass += ' weak';
        tagHtml += '<span class="floating-tag-badge weak">屬性相剋 ×2.0</span>';
      }
      if (info.isCounter) {
        tagHtml += '<span class="floating-tag-badge counter">反擊！</span>';
      }

      floater.className = floaterClass;
      floater.innerHTML = `${tagHtml}-${info.damage ?? 10}`;
    }

    vfxLayer.appendChild(floater);
    setTimeout(() => floater.remove(), 2500);
  }

  showFloatingMorale(x, y, text, isPositive = false, offsetY = 0) {
    if (!this._floatingMoraleCooldown) this._floatingMoraleCooldown = new Map();
    const key = `${x},${y},${text}`;
    const now = Date.now();
    if (this._floatingMoraleCooldown.has(key) && (now - this._floatingMoraleCooldown.get(key) < 1200)) {
      return;
    }
    this._floatingMoraleCooldown.set(key, now);

    const vfxLayer = document.getElementById('vfxLayer') || document.getElementById('battleBoardStage');
    if (!vfxLayer) return;

    const floater = document.createElement('div');
    const tilePx = 64;
    floater.style.left = `${x * tilePx + 32}px`;
    floater.style.top = `${y * tilePx - 26 + offsetY}px`;
    floater.className = `floating-dmg-number ${isPositive ? 'heal' : 'crit'} floating-morale-text`;
    floater.innerHTML = `<span class="floating-tag-badge ${isPositive ? 'heal' : 'crit'}">${text}</span>`;
    vfxLayer.appendChild(floater);
    setTimeout(() => floater.remove(), 2500);
  }

  showMoraleNotice(text) {
    const screen = document.getElementById('screenBattle');
    if (!screen) return;
    screen.querySelectorAll('.morale-notice-toast').forEach(t => t.remove());
    const banner = document.createElement('div');
    banner.className = 'morale-notice-toast';
    banner.textContent = text;
    screen.appendChild(banner);
    setTimeout(() => {
      banner.classList.add('fade-out');
      setTimeout(() => banner.remove(), 400);
    }, 3200);
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

  showPrologue(onComplete) {
    this.showScreen('screenPrologue');
    const panels = [
      {
        title: '長夜將至 · 燈影之境',
        art: 'assets/art/v4/title_keyart.webp',
        text: '千百年來，九州大地皆由長明古燈庇佑。凡燈火所照之處，妖邪辟易，萬民安居。燈火是黑暗中唯一的屏障。',
        hero: null
      },
      {
        title: '夜霧狂湧 · 影軍肆虐',
        art: 'assets/art/v4/map_river_bridge.webp',
        text: '然而黑月升起，幽冥深處的夜霧忽自荒澤蔓延，沿途燈柱相繼被毀。影軍借暗夜大舉進犯，九州天下岌岌可危。',
        hero: null
      },
      {
        title: '引路燈車 · 守望相助',
        art: 'assets/art/v4/fig_lantern_cart.webp',
        text: '唯一的生機，便是推動滿載靈火的【引路燈車】穿過寒川孤橋，逐一重燃各處要塞燈標，驅散盤踞的夜霧妖靈。',
        hero: null
      },
      {
        title: '前驅先鋒 · 熊岳與墨影',
        art: 'assets/art/v4/por_moying_rich.webp',
        text: '【熊岳】誓以鐵盾築起血肉長城，寸步不讓阻截敵軍；【墨影】暗夜拔刀疾馳，誓以凌厲劍芒斬滅敵將首級！',
        hero: { name: '熊岳 · 墨影', title: '不動鐵壁 · 疾影絕殺', por: 'assets/art/v4/por_moying_rich.webp' }
      },
      {
        title: '後應神術 · 燈娘與茶翁',
        art: 'assets/art/v4/por_lantern_crafter.webp',
        text: '【燈娘·小螢】引五行靈火洞穿夜霧，看準克制重創敵陣；【茶翁】坐鎮中軍調製清心靈茶，撫平將士傷創守護生機！',
        hero: { name: '燈娘 · 茶翁', title: '長明靈燈 · 回春仙茗', por: 'assets/art/v4/por_lantern_crafter.webp' }
      },
      {
        title: '寒川渡橋 · 啟程開戰',
        art: 'assets/art/v4/banner_ch1.webp',
        text: '夜霧濃烈，石橋對岸敵軍騎兵已經列陣扼守。四人義結同盟，引路燈車啟程——吹響出征號角，破霧奪橋！',
        hero: null
      }
    ];

    let curStep = 0;
    const artImg = document.getElementById('prologueArtImg');
    const titleEl = document.getElementById('prologuePanelTitle');
    const textEl = document.getElementById('prologuePanelText');
    const dotsEl = document.getElementById('prologueDots');
    const countEl = document.getElementById('prologueStepCount');
    const btnPrev = document.getElementById('btnProloguePrev');
    const btnNext = document.getElementById('btnPrologueNext');
    const btnSkip = document.getElementById('btnPrologueSkip');
    const spot = document.getElementById('prologueHeroSpotlight');
    const spotName = document.getElementById('prologueHeroName');
    const spotTitle = document.getElementById('prologueHeroTitle');
    const spotPor = document.getElementById('prologueHeroPor');

    const render = () => {
      const p = panels[curStep];
      if (artImg) {
        artImg.style.opacity = '0.3';
        setTimeout(() => {
          artImg.src = p.art;
          artImg.style.opacity = '1';
        }, 150);
      }
      if (titleEl) titleEl.textContent = p.title;
      if (textEl) textEl.textContent = p.text;
      if (dotsEl) {
        dotsEl.textContent = panels.map((_, i) => i === curStep ? '●' : '○').join(' ');
      }
      if (countEl) countEl.textContent = `${curStep + 1} / ${panels.length}`;
      if (btnPrev) btnPrev.style.display = curStep > 0 ? 'block' : 'none';
      if (btnNext) {
        btnNext.innerHTML = curStep < panels.length - 1 ? '<span>下一節 ›</span>' : '<span>啟程征戰 ›</span>';
      }
      if (spot) {
        if (p.hero) {
          spot.style.display = 'flex';
          if (spotName) spotName.textContent = p.hero.name;
          if (spotTitle) spotTitle.textContent = p.hero.title;
          if (spotPor) spotPor.src = p.hero.por;
        } else {
          spot.style.display = 'none';
        }
      }
    };

    render();

    const finish = () => {
      localStorage.setItem('lt_prologue_seen', '1');
      onComplete && onComplete();
    };

    if (btnNext) {
      btnNext.onclick = () => {
        if (curStep < panels.length - 1) {
          curStep++;
          render();
        } else {
          finish();
        }
      };
    }
    if (btnPrev) {
      btnPrev.onclick = () => {
        if (curStep > 0) {
          curStep--;
          render();
        }
      };
    }
    if (btnSkip) {
      btnSkip.onclick = () => finish();
    }
  }

  showRecruitModal(recruitId, onConfirm) {
    const modal = document.getElementById('modalRecruit');
    if (!modal) return;
    const proto = GUARDIAN_PROTOS[recruitId];
    if (!proto) return;

    modal.style.display = 'flex';
    const por = document.getElementById('recruitPor');
    if (por) por.src = `assets/art/v4/por_${recruitId}.webp`;
    document.getElementById('recruitName').textContent = proto.name;
    document.getElementById('recruitTitle').textContent = `${proto.cls} · ${proto.title || '遊俠'}`;
    document.getElementById('recruitDesc').textContent = proto.backstory || proto.desc || proto.trait?.desc || '新同伴加入陣營！';
    document.getElementById('recruitBark').textContent = proto.bark || '「願隨將軍共赴沙場！」';

    document.getElementById('btnRecruitConfirm').onclick = () => {
      modal.style.display = 'none';
      if (onConfirm) onConfirm();
    };
  }

  showRouteEventModal(eventData, onChoose) {
    const modal = document.getElementById('modalRouteEvent');
    if (!modal) return;
    modal.style.display = 'flex';

    document.getElementById('routeEventTitle').textContent = eventData.title || '行軍奇遇';
    document.getElementById('routeEventDesc').textContent = eventData.desc || '請將軍定奪行軍休整方略：';

    const container = document.getElementById('routeEventChoices');
    container.innerHTML = '';

    (eventData.options || []).forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-route-choice';
      btn.innerHTML = `<span>${opt.text}</span>`;
      btn.onclick = () => {
        modal.style.display = 'none';
        if (onChoose) onChoose(opt);
      };
      container.appendChild(btn);
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

      // 4-Star Evaluation Calculation
      const maxT = chapter?.maxTurns || 12;
      const targetTurns = Math.ceil(maxT * 0.6);
      const hasVictory = Boolean(status.victory);
      const underTurnLimit = battle ? (battle.currentTurn <= targetTurns) : true;
      const noAllyLost = battle ? battle.allies.every(a => a.hp > 0) : true;
      const sideObjDone = battle ? (battle.enemyMorale <= 35) : true;

      const starRow = document.getElementById('resultStarRow');
      if (starRow) {
        starRow.style.display = 'grid';
        const starVic = document.getElementById('starVictory');
        const starTur = document.getElementById('starTurns');
        const starCas = document.getElementById('starCasualty');
        const starObj = document.getElementById('starObjective');

        if (starVic) {
          starVic.classList.toggle('active', hasVictory);
          const c = document.getElementById('condVictory');
          if (c) c.textContent = hasVictory ? '達成主目標' : '未達主目標';
        }
        if (starTur) {
          starTur.classList.toggle('active', underTurnLimit);
          const c = document.getElementById('condTurns');
          if (c) c.textContent = underTurnLimit ? `${targetTurns}回合內速勝` : `超限(需≤${targetTurns}回合)`;
        }
        if (starCas) {
          starCas.classList.toggle('active', noAllyLost);
          const c = document.getElementById('condCasualty');
          if (c) c.textContent = noAllyLost ? '全軍生還無損' : '有將士陣亡';
        }
        if (starObj) {
          starObj.classList.toggle('active', sideObjDone);
          const c = document.getElementById('condObjective');
          if (c) c.textContent = sideObjDone ? '大挫敵軍士氣' : '敵士氣未降至35';
        }
      }

      // Unified MVP Highlight Card
      const awards = rewards?.awards || [
        { id: 'cat_patrol', name: '墨影', isMvp: true, expGained: 85, reason: '【本戰MVP】斬將拔旗，戰功卓著！', stats: { damageDealt: 68, kills: 3, heals: 0 } },
        { id: 'bear_guard', name: '熊岳', isMvp: false, expGained: 65, reason: '鐵壁扼守，格擋千鈞傷害', stats: { damageDealt: 42, kills: 1, heals: 0 } },
        { id: 'tea_master', name: '茶翁', isMvp: false, expGained: 55, reason: '靈茶甘露，妙手回春援護', stats: { damageDealt: 12, kills: 0, heals: 58 } },
        { id: 'crane_rider', name: '鶴羽', isMvp: false, expGained: 60, reason: '雲霄奇襲，突擊敵軍腹地', stats: { damageDealt: 54, kills: 2, heals: 0 } }
      ];
      const mvpInfo = awards.find(a => a.isMvp) || awards[0] || (squad && squad[0]) || { id: 'cat_patrol', name: '墨影', expGained: 85, stats: { damageDealt: 60, kills: 2, heals: 0 } };
      const mvpStats = mvpInfo.stats || { damageDealt: 0, kills: 0, heals: 0 };
      const mvpCard = document.getElementById('resultMvpCard');
      if (mvpCard) {
        mvpCard.style.display = 'flex';
        const porEl = document.getElementById('resultMvpPor');
        const nameEl = document.getElementById('resultMvpName');
        const expEl = document.getElementById('resultMvpExp');
        const statsEl = document.getElementById('resultMvpStats');
        const quoteEl = document.getElementById('resultMvpQuote');
        if (porEl) porEl.src = `assets/art/v4/por_${mvpInfo.id}.webp`;
        if (nameEl) nameEl.textContent = `【本戰MVP】${mvpInfo.name} · 戰功卓著`;
        if (expEl) expEl.textContent = `+${mvpInfo.expGained || 85} EXP`;
        if (statsEl) statsEl.textContent = `造成 ${mvpStats.damageDealt} 傷害 · 斬敵 ${mvpStats.kills} · 治癒 ${mvpStats.heals}`;
        const mvpQuotes = {
          cat_patrol: '「暗夜之中，劍鋒所向披靡。敵酋已斬，長夜將明！」',
          bear_guard: '「鐵甲如磐，固若金湯！隨我乘勝破敵！」',
          crane_rider: '「雲海縱橫，長空無敵！敵陣破綻已盡在掌中！」',
          tea_master: '「品茗笑談間，檣櫓灰飛煙滅。全軍且進熱茶！」',
          tanuki_mage: '「雷霆破霄，天威莫測！妖霧豈能擋我玄門道法！」',
          fox_maiden: '「靈狐引火，照破十方。這漫漫黑夜，該退了！」',
          lantern_crafter: '「明燈常駐，諸邪辟易。破曉之光已照亮前路！」'
        };
        if (quoteEl) quoteEl.textContent = mvpQuotes[mvpInfo.id] || '「長夜終有盡，迷霧隨燈散。全軍稍作整頓，繼續進軍！」';
      }

      // Non-MVP squad members list (MVP is displayed above, no duplicates)
      if (xpList) {
        xpList.innerHTML = '';
        const nonMvpAwards = awards.filter(u => u.id !== mvpInfo.id);

        nonMvpAwards.forEach(u => {
          const uStats = u.stats || { damageDealt: 0, kills: 0, heals: 0 };
          const row = document.createElement('div');
          row.className = 'xp-unit-row';
          row.innerHTML = `
            <div class="xp-unit-por-wrap">
              <img src="assets/art/v4/por_${u.id}.webp" class="xp-unit-por" alt="${u.name}">
            </div>
            <div class="xp-unit-info">
              <div class="xp-unit-name-line">
                <span class="xp-unit-name">${u.name}</span>
                <span class="xp-unit-reason">${u.reason}</span>
              </div>
              <div class="xp-unit-stats">造成 ${uStats.damageDealt} 傷害 · 斬敵 ${uStats.kills} · 治癒 ${uStats.heals}</div>
              <div class="xp-bar-track">
                <div class="xp-bar-fill" style="width: ${Math.min(100, Math.max(30, (u.expGained || 50) % 100))}%;"></div>
              </div>
            </div>
            <span class="xp-gain-badge">+${u.expGained} EXP</span>
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
    } else {
      card.className = 'result-card defeat';
      title.textContent = '戰鬥失利';
      sub.textContent = status.reason || '夜霧重重 · 退守整軍';
      document.getElementById('resultExpAwards').textContent = '將士稍作休整，整頓兵甲以待再戰。';
      const starRow = document.getElementById('resultStarRow');
      if (starRow) starRow.style.display = 'none';
      const mvpCard = document.getElementById('resultMvpCard');
      if (mvpCard) mvpCard.style.display = 'none';
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
