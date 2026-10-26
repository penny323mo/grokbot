/**
 * js/render/ui.js
 * DOM rendering engine, tap-only event handling, battle animations, and modal managers.
 */

import { SVG_ART } from "./art.js";
import { getCardById, CARD_TYPES, getCardTypeLabel } from "../engine/cards.js";
import { GUARDIANS, ENEMIES } from "../engine/units.js";
import { TAG_RESONANCE, TOWN_BUILDINGS, TERRAINS } from "../engine/constants.js";
import { getRelicById } from "../engine/relics.js";

export class UIRenderer {
  constructor(soundEngine) {
    this.sound = soundEngine;
    this.selectedHandIndex = null;
    this.selectedGuardian = null;
    this.validTargetCoords = [];
  }

  showScreen(screenId) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add("active");

    // Grokbot dataset hook
    if (screenId === "screenBattle") {
      document.body.dataset.gbPlaying = "1";
    } else {
      delete document.body.dataset.gbPlaying;
    }
  }

  renderTitleHero() {
    const el = document.getElementById("titleHeroArt");
    if (el) el.innerHTML = SVG_ART.lantern_full;
  }

  renderTopResources(coins, stars) {
    const c = document.getElementById("txtCoins");
    const s = document.getElementById("txtStars");
    if (c) c.textContent = coins;
    if (s) s.textContent = stars;
  }

  // ================= BATTLE BOARD RENDERING =================
  renderBattle(battle, onTileTap, onCardTap, onUnitInfo) {
    this.renderLanterns(battle.lanterns);
    this.renderTagResonances(battle.getActiveTags());
    this.renderEnergy(battle.energy, battle.maxEnergy);
    this.renderUndoButton(battle.undoSnapshot !== null);
    this.renderGrid(battle, onTileTap, onUnitInfo);
    this.renderHand(battle, onCardTap);
  }

  renderLanterns(lanterns) {
    const container = document.getElementById("containerLanternStatus");
    if (!container) return;
    container.innerHTML = "";

    lanterns.forEach((l) => {
      const chip = document.createElement("div");
      chip.className = `lantern-hp-chip ${l.hp <= 0 ? "extinguished" : ""}`;
      chip.innerHTML = `<span style="display:inline-flex;width:14px;height:14px;vertical-align:middle;">${SVG_ART.icons.lantern}</span><span>${l.hp}/${l.maxHp}</span>`;
      container.appendChild(chip);
    });
  }

  renderTagResonances(activeTags) {
    const container = document.getElementById("containerTagResonances");
    if (!container) return;
    container.innerHTML = "";

    activeTags.forEach((tag) => {
      const info = TAG_RESONANCE[tag];
      if (info) {
        const chip = document.createElement("div");
        chip.className = "resonance-chip";
        chip.innerHTML = `<span style="display:inline-flex;width:14px;height:14px;vertical-align:middle;">${SVG_ART.icons.star}</span><span>${info.name}</span>`;
        chip.title = info.desc;
        container.appendChild(chip);
      }
    });
  }

  renderEnergy(current, max) {
    const el = document.getElementById("displayEnergy");
    if (el) el.textContent = current;
  }

  renderUndoButton(canUndo) {
    const btn = document.getElementById("btnUndo");
    if (btn) btn.style.display = canUndo ? "inline-flex" : "none";
  }

  renderGrid(battle, onTileTap, onUnitInfo) {
    const gridEl = document.getElementById("tacticsGrid");
    if (!gridEl) return;
    gridEl.innerHTML = "";

    // Map enemy intents for overlay lookup
    const intentTargets = {};
    const intentArrows = {};
    const destMarkers = {};

    for (const enemy of battle.enemies) {
      if (enemy.hp <= 0 || !enemy.intent) continue;

      // 1. Target crosshair & damage
      if (enemy.intent.targetPos) {
        const key = `${enemy.intent.targetPos.x},${enemy.intent.targetPos.y}`;
        intentTargets[key] = enemy.intent;
      }

      // 2. Dest marker
      if (enemy.intent.destPos && (enemy.intent.destPos.x !== enemy.x || enemy.intent.destPos.y !== enemy.y)) {
        const key = `${enemy.intent.destPos.x},${enemy.intent.destPos.y}`;
        destMarkers[key] = true;
      }

      // 3. Path arrows along intermediate steps
      if (enemy.intent.path && enemy.intent.path.length > 1) {
        for (let i = 0; i < enemy.intent.path.length - 1; i++) {
          const from = enemy.intent.path[i];
          const to = enemy.intent.path[i + 1];
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const deg = Math.atan2(-dx, dy) * (180 / Math.PI);
          const key = `${to.x},${to.y}`;
          intentArrows[key] = deg;
        }
      }
    }

    for (let y = 0; y < battle.board.rows; y++) {
      for (let x = 0; x < battle.board.cols; x++) {
        const tile = battle.board.getTile(x, y);
        const tileEl = document.createElement("div");
        tileEl.className = `grid-tile ${tile.terrain || ""}`;

        // Fog row detection
        if (battle.isFogRow && battle.isFogRow(y)) {
          tileEl.classList.add("fog-tile");
        }

        if (battle.board.isFriendlyZone(y)) {
          tileEl.classList.add("town-zone");
        }

        // Check if this tile is a valid target for the selected card
        const isValid = this.validTargetCoords.some((c) => c.x === x && c.y === y);
        if (isValid) {
          tileEl.classList.add("valid-target");
        }

        // Render Path Arrows
        const key = `${x},${y}`;
        if (intentArrows[key] !== undefined) {
          const arrowEl = document.createElement("div");
          arrowEl.className = "intent-path-arrow";
          arrowEl.innerHTML = `<svg viewBox="0 0 24 24" style="transform: rotate(${intentArrows[key]}deg); width: 22px; height: 22px;"><path d="M12 4 L12 20 M6 14 L12 20 L18 14" fill="none" stroke="#E86363" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
          tileEl.appendChild(arrowEl);
        }

        // Render Dest Marker
        if (destMarkers[key]) {
          const destEl = document.createElement("div");
          destEl.className = "intent-dest-marker";
          destEl.title = "敵軍即將推進至此";
          tileEl.appendChild(destEl);
        }

        // Render Unit or Lantern
        if (tile.unit) {
          const unit = tile.unit;
          const unitWrap = document.createElement("div");
          const isSelectedGuardian = this.selectedGuardian && this.selectedGuardian === unit;
          unitWrap.className = `unit-wrapper ${isSelectedGuardian ? "selected-unit" : ""}`;

          const svgKey = unit.typeId || unit.unitId;
          const svgCode = SVG_ART[svgKey] || SVG_ART.cat_patrol;
          unitWrap.innerHTML = `
            <div class="unit-svg-wrap">${svgCode}</div>
            <div class="unit-hp-badge ${unit.armor > 0 ? "armor" : ""}">${unit.hp}${unit.armor > 0 ? `+${unit.armor}` : ""}</div>
          `;

          // If enemy has intent, render intent badge
          if (!unit.isGuardian && unit.intent) {
            const badge = document.createElement("div");
            badge.className = "intent-badge";
            const iconSvg = SVG_ART.icons[unit.intent.icon] || SVG_ART.icons.attack;
            badge.innerHTML = `<span style="display:inline-flex;width:12px;height:12px;vertical-align:middle;">${iconSvg}</span>${unit.intent.damage > 0 ? `<span>${unit.intent.damage}</span>` : ""}`;
            badge.title = unit.intent.desc;
            unitWrap.appendChild(badge);
          }

          unitWrap.onclick = (e) => {
            e.stopPropagation();
            if (isValid) {
              onTileTap(x, y);
            } else if (unit.isGuardian && !unit.hasMoved) {
              onTileTap(x, y);
            } else {
              onUnitInfo(unit);
            }
          };

          tileEl.appendChild(unitWrap);
        } else if (tile.lanternId) {
          // Empty lantern post tile
          const l = battle.lanterns.find((item) => item.id === tile.lanternId);
          const lanternSvg = l && l.hp > 0 ? (l.hp >= l.maxHp ? SVG_ART.lantern_full : SVG_ART.lantern_damaged) : SVG_ART.lantern_extinguished;
          tileEl.innerHTML = `<div style="width:75%;height:75%;">${lanternSvg}</div>`;
        }

        // Render Enemy Target Crosshair
        if (intentTargets[key]) {
          const crosshair = document.createElement("div");
          crosshair.className = "target-crosshair";
          if (intentTargets[key].damage > 0) {
            crosshair.innerHTML = `<span class="crosshair-dmg-badge">-${intentTargets[key].damage}</span>`;
          }
          tileEl.appendChild(crosshair);
        }

        tileEl.onclick = () => onTileTap(x, y);
        gridEl.appendChild(tileEl);
      }
    }
  }

  renderHand(battle, onCardTap) {
    const container = document.getElementById("containerHand");
    if (!container) return;
    container.innerHTML = "";

    battle.hand.forEach((cardId, index) => {
      const card = getCardById(cardId);
      if (!card) return;

      const cardEl = document.createElement("div");
      const isSelected = this.selectedHandIndex === index;
      const actualCost = battle.getCardCost ? battle.getCardCost(card) : card.cost;
      const canAfford = battle.energy >= actualCost;

      cardEl.className = `card-item ${isSelected ? "selected" : ""} ${!canAfford ? "disabled" : ""}`;

      const displayName = card.name.replace(/^召喚：/, "").replace(/！$/, "");

      cardEl.innerHTML = `
        <div class="card-header-mini">
          <div class="card-cost-badge">${actualCost}</div>
          <div class="card-type-tag">${getCardTypeLabel(card.type)}</div>
        </div>
        <div class="card-title-mini">${displayName}</div>
        <div class="card-desc-mini">${card.desc}</div>
      `;

      cardEl.onclick = () => onCardTap(index, card);
      container.appendChild(cardEl);
    });
  }

  // ================= UNIT INFO SHEET MODAL =================
  openUnitInfo(unit) {
    const modal = document.getElementById("modalUnitInfo");
    if (!modal) return;

    const proto = unit.isGuardian ? GUARDIANS[unit.unitId] : ENEMIES[unit.typeId];
    document.getElementById("sheetName").textContent = unit.name;
    document.getElementById("sheetTitle").textContent = unit.title || "";
    document.getElementById("sheetHp").textContent = `${unit.hp}/${unit.maxHp}${unit.armor > 0 ? ` (+${unit.armor} 護甲)` : ""}`;
    document.getElementById("sheetAtk").textContent = unit.atk;
    document.getElementById("sheetRange").textContent = unit.range;
    document.getElementById("sheetMove").textContent = unit.move;

    const svgKey = unit.typeId || unit.unitId;
    document.getElementById("sheetSvg").innerHTML = SVG_ART[svgKey] || SVG_ART.cat_patrol;

    if (unit.isGuardian && proto) {
      document.getElementById("sheetSkillName").textContent = proto.skillName || "守護技能";
      document.getElementById("sheetSkillDesc").textContent = proto.skillDesc || "";
      document.getElementById("sheetFlavor").textContent = proto.flavor || "";
    } else if (proto) {
      document.getElementById("sheetSkillName").textContent = "迷霧習性";
      document.getElementById("sheetSkillDesc").textContent = proto.desc || "";
      document.getElementById("sheetFlavor").textContent = unit.intent ? `下回合意圖：${unit.intent.desc}` : "";
    }

    modal.classList.add("active");
  }

  closeUnitInfo() {
    const modal = document.getElementById("modalUnitInfo");
    if (modal) modal.classList.remove("active");
  }

  // ================= FLOATING DAMAGE NUMBER =================
  showDamageNumber(x, y, amount) {
    const grid = document.getElementById("tacticsGrid");
    if (!grid) return;

    const tile = grid.children[y * 5 + x];
    if (!tile) return;

    const rect = tile.getBoundingClientRect();
    const floater = document.createElement("div");
    floater.className = "damage-floater";
    floater.textContent = `-${amount}`;
    floater.style.left = `${rect.left + rect.width / 2 - 10}px`;
    floater.style.top = `${rect.top + 5}px`;

    document.body.appendChild(floater);
    setTimeout(() => floater.remove(), 600);
  }

  shakeScreen() {
    const viewport = document.getElementById("appViewport");
    if (!viewport) return;
    viewport.classList.add("screen-shake");
    setTimeout(() => viewport.classList.remove("screen-shake"), 260);
  }

  // ================= TOWN BUILDING RENDERING =================
  renderTown(townManager, onBuild) {
    const container = document.getElementById("containerTownBuildings");
    const starsEl = document.getElementById("townStars");
    if (starsEl) starsEl.textContent = townManager.starLanterns;
    if (!container) return;
    container.innerHTML = "";

    TOWN_BUILDINGS.forEach((bldg) => {
      const isBuilt = townManager.hasBuilding(bldg.id);
      const canAfford = townManager.canBuild(bldg.id);

      const card = document.createElement("div");
      card.className = `building-card ${isBuilt ? "built" : ""}`;

      card.innerHTML = `
        <div class="bldg-info">
          <div class="bldg-name">${isBuilt ? `<span style="display:inline-flex;width:14px;height:14px;vertical-align:middle;">${SVG_ART.icons.check}</span> ` : ""}${bldg.name} <span style="font-size:12px;font-weight:normal;color:var(--ink-muted);">(${bldg.subtitle})</span></div>
          <div class="bldg-desc">${bldg.desc}</div>
        </div>
        <div>
          ${
            isBuilt
              ? `<span style="font-size:13px;font-weight:800;color:var(--sage-dark);">已建造</span>`
              : `<button type="button" class="btn-build" ${!canAfford ? "disabled" : ""}><span style="display:inline-flex;width:14px;height:14px;vertical-align:middle;">${SVG_ART.icons.star}</span> ${bldg.cost} 建造</button>`
          }
        </div>
      `;

      if (!isBuilt) {
        const btn = card.querySelector(".btn-build");
        if (btn) btn.onclick = () => onBuild(bldg.id);
      }

      container.appendChild(card);
    });
  }

  // ================= MODAL ALERTS =================
  showAlertModal(title, message, onConfirm = null) {
    const modal = document.getElementById("modalAlert");
    if (!modal) return;
    document.getElementById("alertModalTitle").textContent = title;
    document.getElementById("alertModalMessage").textContent = message;
    const btnCancel = document.getElementById("btnAlertCancel");
    if (btnCancel) btnCancel.style.display = "none";
    const btnConfirm = document.getElementById("btnAlertConfirm");
    btnConfirm.onclick = () => {
      modal.classList.remove("active");
      if (onConfirm) onConfirm();
    };
    modal.classList.add("active");
  }

  showConfirmModal(title, message, onConfirm, onCancel = null) {
    const modal = document.getElementById("modalAlert");
    if (!modal) return;
    document.getElementById("alertModalTitle").textContent = title;
    document.getElementById("alertModalMessage").textContent = message;
    const btnCancel = document.getElementById("btnAlertCancel");
    if (btnCancel) {
      btnCancel.style.display = "inline-flex";
      btnCancel.onclick = () => {
        modal.classList.remove("active");
        if (onCancel) onCancel();
      };
    }
    const btnConfirm = document.getElementById("btnAlertConfirm");
    btnConfirm.onclick = () => {
      modal.classList.remove("active");
      if (onConfirm) onConfirm();
    };
    modal.classList.add("active");
  }

  // ================= COMPENDIUM RENDERING =================
  renderCompendium(activeTab = "guardians") {
    const container = document.getElementById("compendiumList");
    if (!container) return;
    container.innerHTML = "";

    if (activeTab === "guardians") {
      Object.values(GUARDIANS).forEach((g) => {
        const item = document.createElement("div");
        item.className = "building-card";
        const svg = SVG_ART[g.id] || SVG_ART.cat_patrol;
        item.innerHTML = `
          <div style="width:48px;height:48px;flex-shrink:0;">${svg}</div>
          <div class="bldg-info">
            <div class="bldg-name">${g.name} <span style="font-size:12px;color:var(--amber-primary);">[${g.tags.join("/")}]</span></div>
            <div class="bldg-desc" style="margin-bottom:2px;">生命: ${g.hp} | 攻擊: ${g.atk} | 射程: ${g.range} | 移動: ${g.move}</div>
            <div class="bldg-desc" style="color:var(--ink-primary);font-weight:700;">${g.skillName}: ${g.skillDesc}</div>
            <div style="font-size:11px;font-style:italic;color:var(--ink-muted);margin-top:2px;">${g.flavor}</div>
          </div>
        `;
        container.appendChild(item);
      });
    } else {
      Object.values(ENEMIES).forEach((e) => {
        const item = document.createElement("div");
        item.className = "building-card";
        const svg = SVG_ART[e.id] || SVG_ART.fog_blob;
        item.innerHTML = `
          <div style="width:48px;height:48px;flex-shrink:0;">${svg}</div>
          <div class="bldg-info">
            <div class="bldg-name">${e.name} ${e.isBoss ? `<span style="color:var(--crimson-hazard);font-weight:900;">[BOSS]</span>` : ""}</div>
            <div class="bldg-desc" style="margin-bottom:2px;">生命: ${e.hp} | 攻擊: ${e.atk} | 護甲: ${e.armor || 0}</div>
            <div class="bldg-desc">${e.desc}</div>
          </div>
        `;
        container.appendChild(item);
      });
    }
  }
}
