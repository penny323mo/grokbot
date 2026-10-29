// 3D Turntable Garage Screen for Midnight Touge (《夜峠》)
// High-end showroom presentation with PBR car turntable, stats bars & livery customization
import { CARS_DATA } from '../data/cars.js';
import { storage } from '../core/storage.js';
import { audio } from '../core/audio.js';

export class GarageView {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.onSelectCar = options.onSelectCar || (() => {});
    this.onStartRace = options.onStartRace || (() => {});
    this.onBackToTitle = options.onBackToTitle || (() => {});
    this.selectedCarIdx = 0;
  }

  render() {
    if (this.selectedCarIdx === undefined || this.selectedCarIdx === null || this.selectedCarIdx < 0) {
      const curCarId = storage.data.selectedCarId || "h86";
      this.selectedCarIdx = CARS_DATA.findIndex(c => c.id === curCarId || (curCarId === "rs86" && c.id === "h86"));
      if (this.selectedCarIdx < 0) this.selectedCarIdx = 0;
    }
    const car = CARS_DATA[this.selectedCarIdx];
    const isUnlocked = storage.isCarUnlocked(car.id);
    const coins = storage.data.coins;
    const curColorIdx = (car.id === storage.data.selectedCarId) ? (storage.data.selectedColorIdx || 0) : 0;

    const aliasMap = { rs86: "h86", st20: "gt20", rx7: "re7" };
    const carId = aliasMap[car.id] || car.id;
    const canUnlock = storage.canUnlockCar(car.id, car.price);
    const hasMedalUnlock =
      (carId === "gt20" && storage.getTotalMedals().gold >= 3) ||
      (carId === "re7" && storage.data.stageProgress[12]?.medal === "gold");

    let unlockBtnLabel = `解鎖購置 (${car.price.toLocaleString()} 峠幣)`;
    if (coins < car.price && hasMedalUnlock) {
      if (carId === "gt20") {
        unlockBtnLabel = "榮譽解鎖 · 達成 3 枚金牌！";
      } else if (carId === "re7") {
        unlockBtnLabel = "榮譽解鎖 · 霧嶺魔王已擊敗！";
      }
    }

    this.container.innerHTML = `
      <div class="garage-screen-layer">
        <!-- Top Bar -->
        <header class="garage-top-bar">
          <button class="garage-back-btn" id="btn-garage-back" type="button">
            <span class="back-arrow">←</span>
            <span class="back-text">返回主頁</span>
          </button>

          <div class="garage-coin-purse">
            <span class="coin-icon" style="font-size:11px;font-weight:900;background:#D4941E;color:#0C1418;border-radius:50%;width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;">幣</span>
            <span class="coin-amount" id="garage-coins">${coins.toLocaleString()}</span>
            <span class="coin-unit">峠幣</span>
          </div>
        </header>

        <!-- 3D Turntable Stage Container (Transparent overlay for WebGL viewport) -->
        <div class="garage-turntable-canvas-slot" id="garage-turntable-slot">
          <div class="turntable-hint">左右滑動旋轉檢閱車體</div>
        </div>

        <!-- Car Switcher Carousel -->
        <div class="garage-car-switcher">
          <button class="car-nav-btn prev" id="btn-car-prev" type="button" aria-label="上一車輛">◀</button>
          <div class="car-title-box">
            <span class="car-brand-tag">${car.badge}</span>
            <h1 class="car-main-title">${car.name}</h1>
            <span class="car-subtitle">${car.subtitle}</span>
          </div>
          <button class="car-nav-btn next" id="btn-car-next" type="button" aria-label="下一車輛">▶</button>
        </div>

        <!-- Specs & Customization Panel (Slim Angled HUD Strip Over 3D Scene) -->
        <div class="garage-hud-strip">
          <!-- Power / Weight / Handling Meters -->
          <div class="garage-stats-strip">
            <div class="spec-stat-item">
              <div class="stat-name-row">
                <span class="stat-name">馬力 (HP)</span>
                <span class="stat-val">${car.horsepower} PS</span>
              </div>
              <div class="stat-bar-track">
                <div class="stat-bar-fill" style="width: ${(car.horsepower / 300) * 100}%"></div>
              </div>
            </div>

            <div class="spec-stat-item">
              <div class="stat-name-row">
                <span class="stat-name">車重 (WEIGHT)</span>
                <span class="stat-val">${car.weight} KG</span>
              </div>
              <div class="stat-bar-track">
                <div class="stat-bar-fill" style="width: ${(1.0 - (car.weight - 900) / 600) * 100}%"></div>
              </div>
            </div>

            <div class="spec-stat-item">
              <div class="stat-name-row">
                <span class="stat-name">操控 (HANDLING)</span>
                <span class="stat-val">${car.handling}</span>
              </div>
              <div class="stat-bar-track">
                <div class="stat-bar-fill" style="width: ${car.handling}%"></div>
              </div>
            </div>

            <div class="spec-stat-item">
              <div class="stat-name-row">
                <span class="stat-name">甩尾 (DRIFT)</span>
                <span class="stat-val">${car.driftEase}</span>
              </div>
              <div class="stat-bar-track">
                <div class="stat-bar-fill" style="width: ${car.driftEase}%"></div>
              </div>
            </div>
          </div>

          <!-- Livery Paint Chips Floor Rail -->
          <div class="garage-livery-rail">
            <span class="color-palette-label">塗裝 / LIVERY</span>
            <div class="color-swatches-row">
              ${car.colors.map((col, idx) => `
                <button class="color-swatch-chip ${curColorIdx === idx ? 'is-selected' : ''}" data-color-idx="${idx}" style="background-color: ${col.hex}" title="${col.name}"></button>
              `).join('')}
            </div>
          </div>

          <!-- Description -->
          <p class="garage-car-desc">${car.desc}</p>

          <!-- Primary CTA Button (Select / Purchase / Drive) -->
          <div class="garage-action-row">
            ${isUnlocked ? `
              <button class="btn-garage-launch btn-drive-car" id="btn-garage-drive" type="button">
                <span class="btn-skew-accent"></span>
                <span class="btn-label">// 選用此車 · 前往山道 DRIVE //</span>
              </button>
            ` : `
              <button class="btn-garage-launch btn-unlock-car ${canUnlock ? '' : 'is-disabled'}" id="btn-garage-unlock" type="button">
                <span class="btn-skew-accent"></span>
                <span class="btn-label">// ${unlockBtnLabel} //</span>
              </button>
            `}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.onSelectCar(car.id, curColorIdx);
  }

  bindEvents() {
    const btnBack = this.container.querySelector("#btn-garage-back");
    const btnPrev = this.container.querySelector("#btn-car-prev");
    const btnNext = this.container.querySelector("#btn-car-next");
    const btnDrive = this.container.querySelector("#btn-garage-drive");
    const btnUnlock = this.container.querySelector("#btn-garage-unlock");

    if (btnBack) {
      btnBack.addEventListener("click", () => {
        audio.playSFX("menu_click");
        this.onBackToTitle();
      });
    }

    if (btnPrev) {
      btnPrev.addEventListener("click", () => {
        audio.playSFX("menu_click");
        this.selectedCarIdx = (this.selectedCarIdx - 1 + CARS_DATA.length) % CARS_DATA.length;
        const car = CARS_DATA[this.selectedCarIdx];
        if (storage.isCarUnlocked(car.id)) {
          const colorIdx = storage.data.selectedCarId === car.id ? (storage.data.selectedColorIdx || 0) : 0;
          storage.selectCar(car.id, colorIdx);
        }
        this.render();
      });
    }

    if (btnNext) {
      btnNext.addEventListener("click", () => {
        audio.playSFX("menu_click");
        this.selectedCarIdx = (this.selectedCarIdx + 1) % CARS_DATA.length;
        const car = CARS_DATA[this.selectedCarIdx];
        if (storage.isCarUnlocked(car.id)) {
          const colorIdx = storage.data.selectedCarId === car.id ? (storage.data.selectedColorIdx || 0) : 0;
          storage.selectCar(car.id, colorIdx);
        }
        this.render();
      });
    }

    this.container.querySelectorAll(".color-swatch-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(btn.dataset.colorIdx, 10);
        audio.playSFX("menu_click");
        const car = CARS_DATA[this.selectedCarIdx];
        storage.selectCar(car.id, idx);
        this.render();
      });
    });

    if (btnDrive) {
      btnDrive.addEventListener("click", () => {
        audio.playSFX("gear_shift");
        this.onStartRace();
      });
    }

    if (btnUnlock) {
      btnUnlock.addEventListener("click", () => {
        const car = CARS_DATA[this.selectedCarIdx];
        if (storage.unlockCar(car.id, car.price)) {
          audio.playSFX("drift_award");
          this.render();
        } else {
          audio.playSFX("menu_click");
          const aliasMap = { rs86: "h86", st20: "gt20", rx7: "re7" };
          const carId = aliasMap[car.id] || car.id;
          let reasonMsg = `峠幣不足！需要 ${car.price} 峠幣（目前 ${storage.data.coins}）！`;
          if (carId === "gt20") {
            const goldMedals = storage.getTotalMedals().gold;
            reasonMsg = `解鎖條件未達成！需要 3 枚金牌（目前 ${goldMedals}/3）或 ${car.price} 峠幣（目前 ${storage.data.coins}）！`;
          } else if (carId === "re7") {
            reasonMsg = `解鎖條件未達成！需要擊敗霧嶺魔王（Stage 12 金牌）或 ${car.price} 峠幣（目前 ${storage.data.coins}）！`;
          }
          alert(reasonMsg);
        }
      });
    }
  }
}
