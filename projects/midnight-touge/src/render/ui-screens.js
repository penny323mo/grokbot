// Full-Bleed UI Screens for Midnight Touge (《夜峠》)
// Title Screen, Mountain Route Elevation Map, Settings Sheet, Pause Modal & Results Ceremony
import { EVENTS_DATA, FREE_RUN_EVENT } from '../data/events.js';
import { storage } from '../core/storage.js';
import { audio } from '../core/audio.js';

// SVG Vector Mark Generators (Zero Emoji Discipline)
function getMedalSvg(medalType) {
  if (medalType === 'gold') {
    return `<span class="vector-badge badge-gold" title="金牌">
      <svg viewBox="0 0 32 32" class="svg-medal"><defs><linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFF2A3"/><stop offset="50%" stop-color="#D4941E"/><stop offset="100%" stop-color="#8C5C08"/></linearGradient></defs><circle cx="16" cy="16" r="14" fill="url(#gGold)" stroke="#FFF" stroke-width="1.2"/><text x="16" y="21" font-size="14" font-weight="900" text-anchor="middle" fill="#2A1B02">金</text></svg>
    </span>`;
  }
  if (medalType === 'silver') {
    return `<span class="vector-badge badge-silver" title="銀牌">
      <svg viewBox="0 0 32 32" class="svg-medal"><defs><linearGradient id="gSilver" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="50%" stop-color="#B0B8C0"/><stop offset="100%" stop-color="#6A737C"/></linearGradient></defs><circle cx="16" cy="16" r="14" fill="url(#gSilver)" stroke="#FFF" stroke-width="1.2"/><text x="16" y="21" font-size="14" font-weight="900" text-anchor="middle" fill="#1C2126">銀</text></svg>
    </span>`;
  }
  if (medalType === 'bronze') {
    return `<span class="vector-badge badge-bronze" title="銅牌">
      <svg viewBox="0 0 32 32" class="svg-medal"><defs><linearGradient id="gBronze" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFD4B8"/><stop offset="50%" stop-color="#C27A45"/><stop offset="100%" stop-color="#733814"/></linearGradient></defs><circle cx="16" cy="16" r="14" fill="url(#gBronze)" stroke="#FFF" stroke-width="1.2"/><text x="16" y="21" font-size="14" font-weight="900" text-anchor="middle" fill="#240E05">銅</text></svg>
    </span>`;
  }
  return '';
}

function getWeatherSvg(weather) {
  if (weather === 'rainy_night') {
    return `<span class="vector-weather weather-rain" title="雨夜">
      <svg viewBox="0 0 24 24" class="svg-weather"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" fill="#4B6A82"/><line x1="8" y1="18" x2="6" y2="22" stroke="#6ED4F0" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="18" x2="10" y2="22" stroke="#6ED4F0" stroke-width="2" stroke-linecap="round"/><line x1="16" y1="18" x2="14" y2="22" stroke="#6ED4F0" stroke-width="2" stroke-linecap="round"/></svg>
      <span class="weather-text">雨夜 (WET)</span>
    </span>`;
  }
  if (weather === 'dawn_mist') {
    return `<span class="vector-weather weather-mist" title="黎明霧">
      <svg viewBox="0 0 24 24" class="svg-weather"><path d="M4 14h16M2 18h20M6 10h12M12 4v4" stroke="#8AC8E8" stroke-width="2" stroke-linecap="round"/></svg>
      <span class="weather-text">黎明霧 (FOG)</span>
    </span>`;
  }
  return `<span class="vector-weather weather-night" title="深夜">
    <svg viewBox="0 0 24 24" class="svg-weather"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#F2B451"/></svg>
    <span class="weather-text">深夜 (NIGHT)</span>
  </span>`;
}

export class UIScreens {
  constructor(containerEl, callbacks = {}) {
    this.container = containerEl;
    this.callbacks = callbacks;
  }

  showTitle() {
    this.container.innerHTML = `
      <section class="ui-screen-view title-screen-view is-active" id="screen-title">
        <div class="title-backdrop-art" style="background-image: url('assets/art/keyart-portrait.jpg');"></div>
        <div class="title-vignette-overlay"></div>

        <!-- Top Header Bar -->
        <header class="title-header-bar">
          <span class="title-date-badge">KIRINE PASS · 1996</span>
          <div class="title-top-actions">
            <button class="title-settings-btn" id="btn-title-settings" type="button" aria-label="設定">
              <svg viewBox="0 0 24 24" class="svg-gear" width="18" height="18"><path fill="#F3EDE2" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54A.48.48 0 0 0 13.9 2h-3.8c-.24 0-.45.17-.48.41l-.38 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.72 8.47c-.13.22-.08.49.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.8c.24 0 .45-.17.48-.41l.38-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
            </button>
            <a href="https://penny323mo.github.io/grokbot/" class="title-grokbot-link" target="_blank" rel="noopener noreferrer">
              <span class="grokbot-icon">❖</span>
              <span class="grokbot-text">grokbot →</span>
            </a>
          </div>
        </header>

        <!-- Main Title Typography -->
        <div class="title-hero-content">
          <div class="title-kanji-wrap">
            <h1 class="main-kanji-title">夜峠</h1>
            <span class="main-romaji-subtitle">MIDNIGHT TOUGE</span>
          </div>
          <div class="title-rule-line"></div>
          <p class="title-pitch-desc">深夜山道 3D 甩尾競速 · 五連髮夾彎 · 霧氣 · 引擎咆哮</p>
        </div>

        <!-- Arcade Typographic Selections (No boxed web cards) -->
        <nav class="title-arcade-menu" aria-label="主選單">
          <button class="arcade-menu-item btn-menu-action item-start-race" id="btn-title-start" type="button">
            <span class="menu-slash">//</span>
            <div class="menu-text-col">
              <span class="btn-main-text">出走山道 · START</span>
              <span class="btn-sub-text">第一賽事 · 霧嶺初試</span>
            </div>
            <span class="menu-streak"></span>
          </button>

          <button class="arcade-menu-item btn-menu-action item-garage" id="btn-title-garage" type="button">
            <span class="menu-slash">//</span>
            <div class="menu-text-col">
              <span class="btn-main-text">車庫整備 · GARAGE</span>
              <span class="btn-sub-text">檢閱跑車 · 塗裝調校</span>
            </div>
            <span class="menu-streak"></span>
          </button>

          <button class="arcade-menu-item btn-menu-action item-events" id="btn-title-events" type="button">
            <span class="menu-slash">//</span>
            <div class="menu-text-col">
              <span class="btn-main-text">賽事地圖 · STAGES</span>
              <span class="btn-sub-text">12 關卡 · 追擊與逆走</span>
            </div>
            <span class="menu-streak"></span>
          </button>
        </nav>

        <!-- Title Footer -->
        <footer class="title-footer-sill">
          <span class="footer-credit">霧嶺傳說 · 3D DRIFT ENGINE · STORE READY</span>
          <button class="btn-credits-link" id="btn-credits" type="button">CREDITS / 素材致謝</button>
        </footer>
      </section>
    `;

    this.bindTitleEvents();
  }

  bindTitleEvents() {
    const btnStart = this.container.querySelector("#btn-title-start");
    const btnGarage = this.container.querySelector("#btn-title-garage");
    const btnEvents = this.container.querySelector("#btn-title-events");
    const btnSettings = this.container.querySelector("#btn-title-settings");

    if (btnStart) {
      btnStart.addEventListener("click", () => {
        audio.unlockAudio();
        audio.playSFX("gear_shift");
        if (this.callbacks.onStartGame) this.callbacks.onStartGame();
        else if (this.callbacks.onSelectEvent) this.callbacks.onSelectEvent(1);
        else if (this.callbacks.onStartEvent) this.callbacks.onStartEvent(EVENTS_DATA[0]);
      });
    }

    if (btnGarage) {
      btnGarage.addEventListener("click", () => {
        audio.unlockAudio();
        audio.playSFX("menu_click");
        if (this.callbacks.onOpenGarage) this.callbacks.onOpenGarage();
      });
    }

    if (btnEvents) {
      btnEvents.addEventListener("click", () => {
        audio.unlockAudio();
        audio.playSFX("menu_click");
        this.showEventSelect();
      });
    }

    if (btnSettings) {
      btnSettings.addEventListener("click", () => {
        audio.playSFX("menu_click");
        this.showSettingsModal();
      });
    }

    const btnCredits = this.container.querySelector("#btn-credits");
    if (btnCredits) {
      btnCredits.addEventListener("click", () => {
        audio.playSFX("menu_click");
        this.showCreditsModal();
      });
    }
  }

  showCreditsModal() {
    const existing = document.getElementById("credits-modal");
    if (existing) existing.remove();
    const modal = document.createElement("div");
    modal.id = "credits-modal";
    modal.className = "credits-modal-overlay";
    modal.innerHTML = `
      <div class="credits-modal-card" role="dialog" aria-labelledby="credits-title">
        <header class="credits-modal-head">
          <h2 id="credits-title">CREDITS · 素材致謝</h2>
          <button type="button" class="credits-close" id="btn-credits-close" aria-label="關閉">×</button>
        </header>
        <div class="credits-scroll">
          <p class="credits-lead">《夜峠》使用可商用自由授權素材（CC0 / CC-BY）。無品牌徽章。</p>
          <h3>Cars · 車體 (CC0)</h3>
          <ul>
            <li>H-86 — Grab3D <em>1980s sports-car</em> · panda clearcoat</li>
            <li>GT-20 — Grab3D <em>sports-car</em> · midnight emerald</li>
            <li>RE-7 — 3DAssets / Grab3D <em>midengine-sports</em> · formula red</li>
          </ul>
          <h3>Roadside · 路旁建築 (CC0)</h3>
          <ul>
            <li>Tea house / terrace / feudal tea house / covered bridge / stone house / vending — Grab3D</li>
            <li>Torii shrine gate — Quaternius (Poly Pizza)</li>
            <li>Tunnel mouth (cliff cave) · mountain houses · rest-stop shops · toll booth · highway signs · power poles — Kenney City / Nature kits</li>
          </ul>
          <h3>Kits · 套件 (CC0 · Kenney.nl via OpenGameArt)</h3>
          <ul>
            <li>Kenney Car Kit · Racing Kit (gantry, pits, billboards, flags)</li>
            <li>Kenney Nature Kit (pines, rocks, cave tunnel mouths, stone bridge)</li>
            <li>Kenney City Kit Roads / Suburban / Commercial</li>
          </ul>
          <h3>Environment · 環境 (CC0 · Poly Haven)</h3>
          <ul>
            <li>HDRI <em>narrow_moonlit_road</em></li>
            <li>Textures asphalt_02 · rock_face_03 · street_lamp_01</li>
          </ul>
          <p class="credits-foot">完整列表見專案 <code>CREDITS.md</code>。<br/>Game code &amp; Kirine Pass waypoints © Midnight Touge.</p>
        </div>
      </div>`;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelector("#btn-credits-close").addEventListener("click", close);
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  }

  showEventSelect() {
    const medals = storage.getTotalMedals();

    const highestUnlocked = EVENTS_DATA.reduce((acc, evt) => {
      const p = storage.data.stageProgress[evt.id];
      if (evt.id === 1 || (p && p.unlocked)) return evt;
      return acc;
    }, EVENTS_DATA[0]);

    if (!this.selectedEventId) {
      this.selectedEventId = highestUnlocked.id;
    }
    const currentEvt = EVENTS_DATA.find(e => e.id === this.selectedEventId) || highestUnlocked;
    const currentProg = storage.data.stageProgress[currentEvt.id] || { unlocked: false, medal: null, bestTime: null };
    const currentMedalBadge = getMedalSvg(currentProg.medal);
    const currentWeatherBadge = getWeatherSvg(currentEvt.weather);

    const routePoints = [
      { x: 34, y: 46 },   // Stage 1
      { x: 92, y: 52 },   // Stage 2
      { x: 168, y: 66 },  // Stage 3
      { x: 254, y: 80 },  // Stage 4 (Battle)
      { x: 326, y: 110 }, // Stage 5 (Rain)
      { x: 260, y: 136 }, // Stage 6 (Bridge)
      { x: 178, y: 148 }, // Stage 7 (Battle)
      { x: 96, y: 160 },  // Stage 8 (Dawn)
      { x: 38, y: 188 },  // Stage 9 (Duel)
      { x: 118, y: 208 }, // Stage 10
      { x: 206, y: 224 }, // Stage 11 (Battle)
      { x: 318, y: 236 }, // Stage 12 (Boss)
    ];

    const splinePath = "M 34,46 C 60,46 75,52 92,52 C 130,52 145,66 168,66 C 210,66 230,80 254,80 C 290,80 340,94 326,110 C 310,126 285,136 260,136 C 220,136 200,148 178,148 C 140,148 115,160 96,160 C 60,160 20,174 38,188 C 55,202 90,208 118,208 C 155,208 180,224 206,224 C 255,224 285,236 318,236";

    // Generate Route Waypoints Coordinates on SVG
    const waypointsSvg = EVENTS_DATA.map((evt, idx) => {
      const prog = storage.data.stageProgress[evt.id] || { unlocked: false, medal: null };
      const isUnlocked = prog.unlocked || evt.id === 1;
      const pt = routePoints[idx];
      const strokeCol = isUnlocked ? (prog.medal === "gold" ? "#FFD700" : (prog.medal === "silver" ? "#E0E4E8" : (prog.medal === "bronze" ? "#CD7F32" : "#F2B451"))) : "#3A454E";
      const bgCol = isUnlocked ? "#102430" : "#080F14";
      const isBattle = evt.mode === "battle" || !!evt.isBattle;
      const isSelected = evt.id === currentEvt.id;

      return `
        <g class="svg-route-node btn-stage-enter ${isUnlocked ? 'node-active' : 'node-locked'} ${isSelected ? 'node-selected' : ''}" data-event-id="${evt.id}" transform="translate(${pt.x}, ${pt.y})" role="button" tabindex="0" style="cursor: ${isUnlocked ? 'pointer' : 'not-allowed'};">
          <circle r="18" fill="transparent"/>
          ${isSelected ? `<circle r="14" fill="none" stroke="#F2B451" stroke-width="2" opacity="0.8"/>` : ''}
          <circle r="9" fill="${bgCol}" stroke="${strokeCol}" stroke-width="${isUnlocked ? '2.5' : '1.5'}"/>
          <text y="3.5" font-size="8.5" font-family="'Barlow Condensed', sans-serif" font-weight="900" text-anchor="middle" fill="${isUnlocked ? '#FFF' : '#5A6672'}">${evt.id}</text>
          ${prog.medal ? `<circle cx="6" cy="-6" r="3.5" fill="${strokeCol}" stroke="#0C1418" stroke-width="1"/>` : ''}
          ${isBattle ? `<text x="0" y="-11" font-size="7" font-weight="900" text-anchor="middle" fill="#E0322B">VS</text>` : ''}
        </g>
      `;
    }).join('');

    this.container.innerHTML = `
      <section class="ui-screen-view events-screen-view is-active" id="screen-events">
        <header class="events-top-bar">
          <button class="events-back-btn" id="btn-events-back" type="button">
            <span class="back-arrow">←</span>
            <span class="back-text">返回主頁</span>
          </button>
          <div class="events-medal-tally">
            <span class="medal-tally-slash"><span class="medal-lbl gold">金</span> ${medals.gold} <span class="slash-div">//</span> <span class="medal-lbl silver">銀</span> ${medals.silver} <span class="slash-div">//</span> <span class="medal-lbl bronze">銅</span> ${medals.bronze}</span>
          </div>
        </header>

        <!-- Mountain Route Elevation Profile Map -->
        <div class="mountain-route-section">
          <div class="route-section-header">
            <span class="route-tag">KIRINE PASS · 霧嶺山道標高剖面圖</span>
            <span class="route-length-tag">2.99 km / 5 HAIRPINS</span>
          </div>

          <div class="mountain-elevation-map">
            <div class="elevation-labels">
              <span class="elev-summit">▲ 山頂 210m</span>
              <span class="elev-bridge">赤橋 115m</span>
              <span class="elev-valley">▼ 山腳 20m</span>
            </div>
            <svg viewBox="0 0 360 260" class="mountain-route-svg">
              <defs>
                <linearGradient id="slopeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#183648" stop-opacity="0.6"/>
                  <stop offset="100%" stop-color="#080F14" stop-opacity="0.95"/>
                </linearGradient>
                <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#FAF4E6"/>
                  <stop offset="35%" stop-color="#F2B451"/>
                  <stop offset="70%" stop-color="#E0322B"/>
                  <stop offset="100%" stop-color="#6ED4F0"/>
                </linearGradient>
              </defs>
              <!-- Mountain Slope Contour -->
              <path d="M 0,260 L 0,46 Q 90,50 180,120 T 360,210 L 360,260 Z" fill="url(#slopeGrad)"/>
              <!-- Route Spline Stroke -->
              <path d="${splinePath}" fill="none" stroke="url(#routeGrad)" stroke-width="4.0" stroke-linecap="round"/>
              <!-- Waypoints -->
              ${waypointsSvg}
            </svg>
          </div>
        </div>

        <!-- In-World Slim Stage Banner & Big Angled Launch Slash (No boxed card!) -->
        <div class="stage-inworld-banner">
          <div class="inworld-banner-meta">
            <div class="inworld-title-line">
              <span class="inworld-stage-name">${currentEvt.title}</span>
              ${currentMedalBadge || ''}
            </div>
            <div class="inworld-tags-line">
              ${currentWeatherBadge}
              <span class="stage-mode-tag ${currentEvt.direction === 'uphill' ? 'uphill' : ''}">${currentEvt.direction === 'uphill' ? '逆走上坡' : '下坡疾走'}</span>
              ${currentEvt.mode === 'battle' ? '<span class="stage-mode-tag battle">追擊決鬥</span>' : ''}
              <span class="inworld-target-tag">${currentProg.bestTime ? `最佳: ${currentProg.bestTime.toFixed(2)}s` : `目標金牌: ${currentEvt.timeTargets ? currentEvt.timeTargets.gold + 's' : (currentEvt.targetGap ? '+' + currentEvt.targetGap + 's' : '8500分')}`}</span>
            </div>
          </div>

          <button class="btn-stage-enter btn-inworld-slash-launch" data-event-id="${currentEvt.id}" type="button">
            <span class="btn-skew-accent"></span>
            <span class="btn-label">// 出擊 START //</span>
          </button>
        </div>

        <!-- In-World Practice Link (No boxed card) -->
        <button class="btn-freerun-link" id="btn-enter-free-run" type="button">
          <span class="freerun-tag">// FREE RUN</span>
          <span class="freerun-title">自由練習試車 · ${FREE_RUN_EVENT.title}</span>
          <span class="freerun-arrow">→</span>
        </button>

        <!-- Stage Intel & Course Lore (Fills lower screen with authentic touge racing briefing) -->
        <div class="stage-intel-briefing">
          <div class="intel-header">// 賽道情報 · STAGE BRIEFING //</div>
          <div class="intel-desc">${currentEvt.desc || '霧嶺連續急彎路段，全線設有內側排水溝與夜間低溫柏油路面。'}</div>
          <div class="intel-metrics-grid">
            <div class="intel-metric-row"><span class="im-key">// 全長 LENGTH</span><span class="im-val">${(Math.abs((currentEvt.targetDist ?? 2990) - (currentEvt.startDist ?? 0))).toFixed(0)}m</span></div>
            <div class="intel-metric-row"><span class="im-key">// 路面 SURFACE</span><span class="im-val">冷卻柏油 · 高抓地排水溝</span></div>
            <div class="intel-metric-row"><span class="im-key">// 推薦戰術 TACTIC</span><span class="im-val">${currentEvt.direction === 'uphill' ? '高轉速出彎 · 內線鎖定' : '重心前移 · 排水溝落とし入彎'}</span></div>
          </div>
        </div>
      </section>
    `;

    const btnBack = this.container.querySelector("#btn-events-back");
    if (btnBack) {
      btnBack.addEventListener("click", () => {
        audio.playSFX("menu_click");
        this.showTitle();
      });
    }

    // Free Run Mode Handler
    const freeRunBtn = this.container.querySelector("#btn-enter-free-run");
    if (freeRunBtn) {
      freeRunBtn.addEventListener("click", () => {
        audio.playSFX("gear_shift");
        if (this.callbacks.onStartEvent) this.callbacks.onStartEvent(FREE_RUN_EVENT);
      });
    }

    const handleStageEnter = (id) => {
      const evt = EVENTS_DATA.find(e => e.id === id);
      if (!evt) return;
      const prog = storage.data.stageProgress[evt.id] || { unlocked: false };
      const isUnlocked = prog.unlocked || evt.id === 1;
      if (!isUnlocked) {
        audio.playSFX("menu_click");
        return;
      }

      if (this.selectedEventId === id || !this.selectedEventId) {
        audio.playSFX("gear_shift");
        if (this.callbacks.onStartEvent) {
          this.callbacks.onStartEvent(evt);
        } else if (this.callbacks.onSelectEvent) {
          this.callbacks.onSelectEvent(evt.id);
        }
      } else {
        audio.playSFX("menu_click");
        this.selectedEventId = id;
        this.showEventSelect();
      }
    };

    // Clicking route SVG waypoint or enter button starts or selects the stage
    this.container.querySelectorAll(".btn-stage-enter, .svg-route-node").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.eventId, 10);
        handleStageEnter(id);
      });
    });
  }

  showResults(eventData, resultData = {}) {
    const timeVal = Math.max(0, resultData.time || resultData.totalTime || 0);
    const driftScore = resultData.driftScore || 0;
    const medal = resultData.medal || null;
    const coinsEarned = resultData.coinsEarned || 150;
    const titleText = eventData.title || eventData.name || "STAGE COMPLETED";

    const mins = Math.floor(timeVal / 60);
    const secs = Math.floor(timeVal % 60);
    const millis = Math.floor((timeVal % 1) * 100);
    const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(2, '0')}`;

    const medalBadge = getMedalSvg(medal);
    const medalText = medal === 'gold' ? '金牌 · 峠之霸者' : (medal === 'silver' ? '銀牌 · 凌厲過彎' : (medal === 'bronze' ? '銅牌 · 順利完賽' : '未達標 · 再接再厲'));

    this.container.innerHTML = `
      <div class="results-screen-overlay is-active" id="screen-results">
        <div class="results-fullbleed-ceremony">
          <header class="results-top-header">
            <span class="results-tag">// FINISH CHECKPOINT · 完賽 //</span>
            <h1 class="results-event-title">${titleText}</h1>
          </header>

          <!-- Big Medal Award Stamp (Vector Drawn) -->
          <div class="results-medal-ceremony ${medal || 'no-medal'}">
            <div class="medal-big-icon">
              ${medalBadge || `<span class="no-medal-flag"><svg viewBox="0 0 24 24" width="56" height="56"><path fill="#6A7782" d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg></span>`}
            </div>
            <div class="medal-callout-text">${medalText}</div>
          </div>

          <!-- Big Kinetic Time Readout -->
          <div class="results-time-block">
            <span class="results-time-label">RECORD TIME</span>
            <div class="results-big-digits">${timeFormatted}</div>
          </div>

          <!-- In-world Slim Metrics Strip -->
          <div class="results-metrics-strip">
            <div class="metric-pill">
              <span class="metric-label">甩尾 DRIFT</span>
              <span class="metric-val highlight">${Math.floor(driftScore).toLocaleString()} PTS</span>
            </div>
            <div class="metric-pill">
              <span class="metric-label">獲得 COINS</span>
              <span class="metric-val coin-gold">+${coinsEarned} 幣</span>
            </div>
          </div>

          <!-- Angled Arcade Action Slashes (No boxed buttons!) -->
          <div class="results-arcade-actions">
            ${eventData.id < 12 && medal ? `
              <button class="btn-arcade-slash btn-next-stage" id="btn-results-next" type="button">
                <span class="btn-skew-accent"></span>
                <span class="btn-label">// 下一賽事 NEXT (STAGE 0${eventData.id + 1}) //</span>
              </button>
            ` : ''}
            <button class="btn-arcade-slash btn-retry-stage" id="btn-results-retry" type="button">
              <span class="btn-skew-accent"></span>
              <span class="btn-label">// 再戰一次 RETRY //</span>
            </button>
            <button class="btn-arcade-slash btn-return-garage" id="btn-results-garage" type="button">
              <span class="btn-skew-accent"></span>
              <span class="btn-label">// 返回車庫 GARAGE //</span>
            </button>
          </div>
        </div>
      </div>
    `;

    const btnNext = this.container.querySelector("#btn-results-next");
    const btnRetry = this.container.querySelector("#btn-results-retry");
    const btnGarage = this.container.querySelector("#btn-results-garage");

    if (btnNext) {
      btnNext.addEventListener("click", () => {
        audio.playSFX("gear_shift");
        if (this.callbacks.onNextEvent) {
          this.callbacks.onNextEvent();
        } else if (this.callbacks.onSelectEvent) {
          this.callbacks.onSelectEvent(eventData.id + 1);
        } else if (this.callbacks.onStartEvent) {
          const nextEvt = EVENTS_DATA.find(e => e.id === eventData.id + 1);
          if (nextEvt) this.callbacks.onStartEvent(nextEvt);
        }
      });
    }

    if (btnRetry) {
      btnRetry.addEventListener("click", () => {
        audio.playSFX("gear_shift");
        if (this.callbacks.onRetryEvent) {
          this.callbacks.onRetryEvent();
        } else if (this.callbacks.onSelectEvent) {
          this.callbacks.onSelectEvent(eventData.id);
        } else if (this.callbacks.onStartEvent) {
          this.callbacks.onStartEvent(eventData);
        }
      });
    }

    if (btnGarage) {
      btnGarage.addEventListener("click", () => {
        audio.playSFX("menu_click");
        if (this.callbacks.onOpenGarage) this.callbacks.onOpenGarage();
      });
    }
  }

  showPauseModal(onContinue, onRestart, onQuit) {
    const existing = document.getElementById("pause-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "pause-modal";
    modal.className = "pause-modal-overlay";
    modal.innerHTML = `
      <div class="pause-panel-box">
        <h2 class="pause-title">// 暫停中 · PAUSED //</h2>
        <div class="pause-actions-list">
          <button class="btn-pause-action resume" id="btn-pause-resume" type="button">
            <span class="menu-slash">//</span>
            <span class="btn-main-text">繼續賽事 · RESUME</span>
            <span class="menu-arrow">→</span>
          </button>
          <button class="btn-pause-action restart" id="btn-pause-restart" type="button">
            <span class="menu-slash">//</span>
            <span class="btn-main-text">重新開始 · RESTART</span>
            <span class="menu-arrow">→</span>
          </button>
          <button class="btn-pause-action settings" id="btn-pause-settings" type="button">
            <span class="menu-slash">//</span>
            <span class="btn-main-text">遊戲設定 · SETTINGS</span>
            <span class="menu-arrow">→</span>
          </button>
          <button class="btn-pause-action quit" id="btn-pause-quit" type="button">
            <span class="menu-slash">//</span>
            <span class="btn-main-text">放棄比賽 · QUIT</span>
            <span class="menu-arrow">→</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector("#btn-pause-resume").addEventListener("click", () => {
      audio.playSFX("menu_click");
      modal.remove();
      if (onContinue) onContinue();
    });

    modal.querySelector("#btn-pause-restart").addEventListener("click", () => {
      audio.playSFX("gear_shift");
      modal.remove();
      if (onRestart) onRestart();
    });

    modal.querySelector("#btn-pause-settings").addEventListener("click", () => {
      audio.playSFX("menu_click");
      this.showSettingsModal();
    });

    modal.querySelector("#btn-pause-quit").addEventListener("click", () => {
      audio.playSFX("menu_click");
      modal.remove();
      if (onQuit) onQuit();
    });
  }

  showSettingsModal() {
    const existing = document.getElementById("settings-modal");
    if (existing) existing.remove();

    const titleScreen = document.getElementById("screen-title");
    if (titleScreen) titleScreen.style.display = "none";

    const s = storage.data.settings;
    const modal = document.createElement("div");
    modal.id = "settings-modal";
    modal.className = "settings-modal-overlay";
    modal.innerHTML = `
      <div class="settings-panel-box">
        <div class="settings-header">
          <h2 class="settings-title">遊戲設定 · SETTINGS</h2>
          <button class="btn-settings-close" id="btn-settings-close" type="button">✕</button>
        </div>

        <div class="settings-group">
          <h4 class="group-title">操控偏好 (CONTROLS)</h4>
          <div class="setting-item">
            <span class="setting-label">油門模式</span>
            <div class="toggle-buttons">
              <button class="btn-toggle ${s.autoThrottle !== false ? 'is-active' : ''}" id="btn-toggle-autothrottle-on" type="button">自動 (AUTO)</button>
              <button class="btn-toggle ${s.autoThrottle === false ? 'is-active' : ''}" id="btn-toggle-autothrottle-off" type="button">手動 (MANUAL)</button>
            </div>
          </div>

          <div class="setting-item">
            <span class="setting-label">轉向方式</span>
            <div class="toggle-buttons">
              <button class="btn-toggle ${s.controlType !== 'tilt' ? 'is-active' : ''}" id="btn-toggle-steer-touch" type="button">觸控按鍵 (TOUCH)</button>
              <button class="btn-toggle ${s.controlType === 'tilt' ? 'is-active' : ''}" id="btn-toggle-steer-tilt" type="button">陀螺儀 (TILT)</button>
            </div>
            <div class="setting-hint" id="tilt-permission-hint" style="display: none; font-size: 11px; color: #F87171; margin-top: 4px; text-align: right;"></div>
          </div>
        </div>

        <div class="settings-group">
          <h4 class="group-title">音效設定 (AUDIO)</h4>
          <div class="setting-item">
            <span class="setting-label">音樂 (EUROBEAT)</span>
            <button class="btn-toggle ${s.musicVolume > 0 ? 'is-active' : ''}" id="btn-toggle-music" type="button">
              ${s.musicVolume > 0 ? '開啟 (ON)' : '靜音 (MUTE)'}
            </button>
          </div>
          <div class="setting-item">
            <span class="setting-label">引擎/輪胎音效 (SFX)</span>
            <button class="btn-toggle ${s.sfxVolume > 0 ? 'is-active' : ''}" id="btn-toggle-sfx" type="button">
              ${s.sfxVolume > 0 ? '開啟 (ON)' : '靜音 (MUTE)'}
            </button>
          </div>
        </div>

        <div class="settings-footer">
          <button class="btn-primary-action" id="btn-settings-save" type="button">確認保存 · SAVE</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    let newSettings = { ...s };

    modal.querySelector("#btn-toggle-autothrottle-on").addEventListener("click", () => {
      newSettings.autoThrottle = true;
      modal.querySelector("#btn-toggle-autothrottle-on").classList.add("is-active");
      modal.querySelector("#btn-toggle-autothrottle-off").classList.remove("is-active");
    });

    modal.querySelector("#btn-toggle-autothrottle-off").addEventListener("click", () => {
      newSettings.autoThrottle = false;
      modal.querySelector("#btn-toggle-autothrottle-off").classList.add("is-active");
      modal.querySelector("#btn-toggle-autothrottle-on").classList.remove("is-active");
    });

    const btnSteerTouch = modal.querySelector("#btn-toggle-steer-touch");
    const btnSteerTilt = modal.querySelector("#btn-toggle-steer-tilt");
    const tiltHint = modal.querySelector("#tilt-permission-hint");

    btnSteerTouch.addEventListener("click", () => {
      newSettings.controlType = "touch_zones";
      btnSteerTouch.classList.add("is-active");
      btnSteerTilt.classList.remove("is-active");
      if (tiltHint) tiltHint.style.display = "none";
    });

    btnSteerTilt.addEventListener("click", async () => {
      if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        try {
          const perm = await DeviceOrientationEvent.requestPermission();
          if (perm === "granted") {
            newSettings.controlType = "tilt";
            btnSteerTilt.classList.add("is-active");
            btnSteerTouch.classList.remove("is-active");
            if (tiltHint) tiltHint.style.display = "none";
          } else {
            newSettings.controlType = "touch_zones";
            btnSteerTouch.classList.add("is-active");
            btnSteerTilt.classList.remove("is-active");
            if (tiltHint) {
              tiltHint.textContent = "陀螺儀權限已拒絕，已保留觸控按鍵操控";
              tiltHint.style.display = "block";
            }
          }
        } catch (e) {
          newSettings.controlType = "touch_zones";
          btnSteerTouch.classList.add("is-active");
          btnSteerTilt.classList.remove("is-active");
          if (tiltHint) {
            tiltHint.textContent = "無法請求陀螺儀權限，已保留觸控按鍵操控";
            tiltHint.style.display = "block";
          }
        }
      } else {
        newSettings.controlType = "tilt";
        btnSteerTilt.classList.add("is-active");
        btnSteerTouch.classList.remove("is-active");
        if (tiltHint) tiltHint.style.display = "none";
      }
    });

    modal.querySelector("#btn-toggle-music").addEventListener("click", (e) => {
      newSettings.musicVolume = newSettings.musicVolume > 0 ? 0.0 : 0.8;
      e.target.textContent = newSettings.musicVolume > 0 ? '開啟 (ON)' : '靜音 (MUTE)';
      e.target.classList.toggle("is-active", newSettings.musicVolume > 0);
    });

    modal.querySelector("#btn-toggle-sfx").addEventListener("click", (e) => {
      newSettings.sfxVolume = newSettings.sfxVolume > 0 ? 0.0 : 0.9;
      e.target.textContent = newSettings.sfxVolume > 0 ? '開啟 (ON)' : '靜音 (MUTE)';
      e.target.classList.toggle("is-active", newSettings.sfxVolume > 0);
    });

    const closeAndSave = () => {
      storage.updateSettings(newSettings);
      audio.setBgmVolume(newSettings.musicVolume);
      audio.setSfxVolume(newSettings.sfxVolume);
      if (this.callbacks.onSettingsChanged) {
        this.callbacks.onSettingsChanged(newSettings);
      }
      modal.remove();
      if (titleScreen) titleScreen.style.display = "";
    };

    modal.querySelector("#btn-settings-close").addEventListener("click", closeAndSave);
    modal.querySelector("#btn-settings-save").addEventListener("click", closeAndSave);
  }
}
