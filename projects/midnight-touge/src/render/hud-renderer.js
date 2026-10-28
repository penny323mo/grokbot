// Racing HUD & In-Game Telemetry Renderer for Midnight Touge (《夜峠》)
// Initial D / Gran Turismo inspired digital dashboard, tachometer arc & drift scoring
import { getCarById } from '../data/cars.js';
import { storage } from '../core/storage.js';

export class HudRenderer {
  constructor(containerEl) {
    this.container = containerEl;
    this.initDOM();
  }

  initDOM() {
    this.container.innerHTML = `
      <div id="hud-overlay" class="hud-screen-layer">
        <!-- 1. Top Section: Time, Sector Split, Distance Progress -->
        <header class="hud-top-bar">
          <div class="hud-stage-badge">
            <span class="hud-badge-tag" id="hud-event-mode">TIME ATTACK</span>
            <span class="hud-badge-title" id="hud-event-title">STAGE 01 · 霧嶺初試</span>
          </div>

          <!-- Big Italic Lap Timer -->
          <div class="hud-timer-block">
            <div class="hud-timer-digits" id="hud-timer">00:00.00</div>
            <div class="hud-sector-split" id="hud-split">SEC 1 · 0.00</div>
          </div>

          <!-- Quick Action Buttons (Cam & Pause) -->
          <div class="hud-top-actions">
            <button class="hud-icon-btn" id="btn-cam-switch" type="button" aria-label="切換視角">
              <span class="cam-icon">CAM</span>
            </button>
            <button class="hud-icon-btn" id="btn-pause" type="button" aria-label="暫停">
              <span class="pause-bars">
                <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
                  <rect x="4" y="3" width="4" height="14" rx="1.5" />
                  <rect x="12" y="3" width="4" height="14" rx="1.5" />
                </svg>
              </span>
            </button>
          </div>
        </header>

        <!-- Mountain Downhill Descent Progress Bar -->
        <div class="hud-track-progress-wrap">
          <div class="hud-progress-mountain-icon">▲</div>
          <div class="hud-progress-track-line">
            <div class="hud-progress-fill" id="hud-track-fill"></div>
            <div class="hud-progress-car-marker" id="hud-track-marker"></div>
          </div>
          <div class="hud-progress-flag-icon">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="#F3EDE2">
              <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
            </svg>
          </div>
        </div>

        <!-- 2. Center Alert: Rival Battle Gap Bar (Active in Battle Mode) -->
        <div class="hud-battle-gap-container is-hidden" id="hud-battle-gap-box">
          <div class="battle-rival-info">
            <span class="rival-tag">RIVAL BATTLE</span>
            <span class="rival-name" id="hud-rival-name">黑曜 S-T20 · 峰</span>
          </div>
          <div class="battle-gap-bar-wrap">
            <div class="gap-marker-center"></div>
            <div class="gap-bar-lead" id="hud-gap-lead"></div>
            <div class="gap-bar-chase" id="hud-gap-chase"></div>
          </div>
          <div class="battle-gap-text" id="hud-gap-text">+0.00s</div>
        </div>

        <!-- 3. Dynamic Drift Score Callout -->
        <div class="hud-drift-callout is-hidden" id="hud-drift-banner">
          <div class="drift-header">
            <span class="drift-title">DRIFT</span>
            <span class="drift-combo" id="hud-drift-combo">x2.0</span>
          </div>
          <div class="drift-points" id="hud-drift-pts">1,480</div>
          <div class="drift-meta">
            <span class="drift-angle" id="hud-drift-angle">ANGLE 36°</span>
            <span class="gutter-drop-tag is-hidden" id="hud-gutter-tag">溝落とし!</span>
          </div>
        </div>

        <!-- 4. Bottom Right Cluster: Big Speedometer & Analog Tachometer Arc -->
        <div class="hud-telemetry-cluster">
          <!-- Digital Speed & Gear -->
          <div class="hud-speedo-box">
            <div class="hud-gear-badge" id="hud-gear">3</div>
            <div class="hud-speed-num" id="hud-speed">124</div>
            <span class="hud-speed-unit">KM/H</span>
          </div>

          <!-- Curved Tachometer SVG Gauge -->
          <div class="hud-tachometer-arc-wrap">
            <svg class="hud-tacho-svg" viewBox="0 0 160 160">
              <!-- Background Arc (0 - 9000 RPM) -->
              <path class="tacho-bg-arc" d="M 30,130 A 70,70 0 1,1 130,130" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="8" stroke-linecap="round" />
              <!-- Redline Segment (7500 - 9000 RPM) -->
              <path class="tacho-redline-arc" d="M 112,50 A 70,70 0 0,1 130,130" fill="none" stroke="rgba(224,50,43,0.85)" stroke-width="9" stroke-linecap="round" />
              <!-- Dynamic Value Arc -->
              <path class="tacho-value-arc" id="hud-tacho-fill" d="M 30,130 A 70,70 0 1,1 130,130" fill="none" stroke="#F2B451" stroke-width="8" stroke-dasharray="329" stroke-dashoffset="329" stroke-linecap="round" />
            </svg>
            <div class="hud-rpm-numeric" id="hud-rpm">6400 RPM</div>
          </div>
        </div>

        <!-- 5. Mobile Ergonomic Touch Control Layer (iPhone 390×844) -->
        <div class="hud-touch-controls" id="touch-controls-layer">
          <!-- Left Steering Thumb Pad -->
          <div class="touch-steer-zone">
            <button class="touch-btn btn-steer-left" id="btn-steer-left" type="button" aria-label="左轉">
              <span class="arrow-shape left">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M15.5 5L8.5 12L15.5 19Z"/></svg>
              </span>
            </button>
            <button class="touch-btn btn-steer-right" id="btn-steer-right" type="button" aria-label="右轉">
              <span class="arrow-shape right">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8.5 5L15.5 12L8.5 19Z"/></svg>
              </span>
            </button>
          </div>

          <!-- Right Pedals: Brake & Handbrake / Drift & Optional Manual Throttle -->
          <div class="touch-pedals-zone">
            <button class="touch-btn btn-drift-trigger" id="btn-drift" type="button" aria-label="甩尾手煞">
              <span class="drift-icon-text">DRIFT</span>
              <span class="drift-sub">手煞</span>
            </button>
            <button class="touch-btn btn-brake-pedal" id="btn-brake" type="button" aria-label="腳煞減速">
              <span class="brake-icon-text">BRAKE</span>
              <span class="brake-sub">腳煞 · 減速</span>
            </button>
            <button class="touch-btn btn-throttle-pedal is-hidden" id="btn-throttle" type="button" aria-label="油門加速">
              <span class="throttle-icon-text">GAS</span>
              <span class="throttle-sub">油門</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Cache elements
    this.elTimer = this.container.querySelector("#hud-timer");
    this.elSplit = this.container.querySelector("#hud-split");
    this.elSpeed = this.container.querySelector("#hud-speed");
    this.elGear = this.container.querySelector("#hud-gear");
    this.elRpm = this.container.querySelector("#hud-rpm");
    this.elTachoFill = this.container.querySelector("#hud-tacho-fill");
    this.elTrackFill = this.container.querySelector("#hud-track-fill");
    this.elTrackMarker = this.container.querySelector("#hud-track-marker");
    this.elDriftBanner = this.container.querySelector("#hud-drift-banner");
    this.elDriftPts = this.container.querySelector("#hud-drift-pts");
    this.elDriftCombo = this.container.querySelector("#hud-drift-combo");
    this.elDriftAngle = this.container.querySelector("#hud-drift-angle");
    this.elGutterTag = this.container.querySelector("#hud-gutter-tag");
    this.elBattleGapBox = this.container.querySelector("#hud-battle-gap-box");
    this.elGapText = this.container.querySelector("#hud-gap-text");
    this.elGapLead = this.container.querySelector("#hud-gap-lead");
    this.elGapChase = this.container.querySelector("#hud-gap-chase");
    this.elEventTitle = this.container.querySelector("#hud-event-title");
    this.elEventMode = this.container.querySelector("#hud-event-mode");

    this.updateSettingsLayout();
  }

  updateSettingsLayout(settings) {
    const s = settings || (storage && storage.data && storage.data.settings) || {};
    const isManual = s.autoThrottle === false;
    const btnThrottle = this.container.querySelector("#btn-throttle");
    const touchControls = this.container.querySelector("#touch-controls-layer");
    if (btnThrottle) {
      btnThrottle.classList.toggle("is-hidden", !isManual);
    }
    if (touchControls) {
      touchControls.classList.toggle("has-manual-throttle", !!isManual);
    }
  }

  setEventInfo(eventData) {
    if (!eventData) return;
    this.updateSettingsLayout();
    this.elEventTitle.textContent = eventData.title || eventData.name || "STAGE";
    const mode = eventData.mode || (eventData.isBattle ? "battle" : "time_attack");
    this.elEventMode.textContent = mode.toUpperCase().replace("_", " ");
    if (mode === "battle" || eventData.isBattle) {
      this.elBattleGapBox.classList.remove("is-hidden");
      const rivalEl = this.container.querySelector("#hud-rival-name");
      if (rivalEl) rivalEl.textContent = eventData.rivalName || getCarById(eventData.rivalCar || 're7').name;
    } else {
      this.elBattleGapBox.classList.add("is-hidden");
    }
  }

  update(physics, collision, elapsedTime = 0, rivalProgress = null) {
    // 1. Time string (MM:SS.ms)
    const mins = Math.floor(elapsedTime / 60);
    const secs = Math.floor(elapsedTime % 60);
    const millis = Math.floor((elapsedTime % 1) * 100);
    this.elTimer.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(2, '0')}`;

    // 2. Speed and Gear
    const kmh = Math.floor(physics.speedKmh);
    this.elSpeed.textContent = kmh;
    this.elGear.textContent = physics.gear;
    if (physics.rpm >= 7800) {
      this.elGear.classList.add("is-redline");
    } else {
      this.elGear.classList.remove("is-redline");
    }

    // 3. Tachometer Arc
    const rpm = Math.floor(physics.rpm);
    this.elRpm.textContent = `${rpm} RPM`;
    const rpmRatio = Math.min(1.0, Math.max(0.0, (rpm - 1000) / 7500));
    const dashOffset = 329 * (1.0 - rpmRatio);
    this.elTachoFill.style.strokeDashoffset = `${dashOffset}`;

    // 4. Track Progress Descent Marker (Respects startDist, targetDist and direction)
    const startDist = collision.startDist !== undefined ? collision.startDist : 0;
    const targetDist = collision.targetDist !== undefined ? collision.targetDist : ((collision.track && collision.track.totalLength) || 2990);
    const curDist = collision.distanceAlongTrack || collision.dist || 0;
    const curSec = collision.currentSector || collision.sector || 1;

    const totalSectorSpan = Math.abs(targetDist - startDist);
    const progressDist = Math.abs(curDist - startDist);
    const progressRatio = Math.min(1.0, Math.max(0.0, totalSectorSpan > 0 ? progressDist / totalSectorSpan : 0));
    this.elTrackFill.style.width = `${progressRatio * 100}%`;
    this.elTrackMarker.style.left = `${progressRatio * 100}%`;

    // Distance remaining to finish target
    const distRemaining = Math.max(0, Math.abs(targetDist - curDist));
    this.elSplit.textContent = `SEC ${curSec} · 剩 ${distRemaining.toFixed(0)}m`;

    // 5. Drift Score Banner
    const isGutter = collision.isInGutter || collision.inGutter || physics.inGutter || false;
    if (physics.isDrifting) {
      this.elDriftBanner.classList.remove("is-hidden");
      this.elDriftPts.textContent = Math.floor(physics.driftScore).toLocaleString();
      this.elDriftCombo.textContent = `x${(physics.driftMultiplier || 1.0).toFixed(1)}`;
      this.elDriftAngle.textContent = `ANGLE ${Math.floor(physics.driftAngleDeg || 0)}°`;
      if (isGutter) {
        this.elGutterTag.classList.remove("is-hidden");
      } else {
        this.elGutterTag.classList.add("is-hidden");
      }
    } else {
      this.elDriftBanner.classList.add("is-hidden");
    }

    // 6. Battle Gap Meter (if active)
    if (rivalProgress !== null && !this.elBattleGapBox.classList.contains("is-hidden")) {
      const gapSec = (rivalProgress.gapSeconds !== undefined) ? rivalProgress.gapSeconds : 0.0;
      if (gapSec >= 0) {
        this.elGapText.textContent = `+${gapSec.toFixed(2)}s LEAD`;
        this.elGapText.style.color = "#4ADE80"; // Green
        this.elGapLead.style.width = `${Math.min(50, gapSec * 15)}%`;
        this.elGapChase.style.width = "0%";
      } else {
        this.elGapText.textContent = `${gapSec.toFixed(2)}s CHASE`;
        this.elGapText.style.color = "#F87171"; // Red
        this.elGapLead.style.width = "0%";
        this.elGapChase.style.width = `${Math.min(50, Math.abs(gapSec) * 15)}%`;
      }
    }
  }

  showCountdownNumber(val) {
    let cdEl = this.container.querySelector("#hud-countdown-banner");
    if (!cdEl) {
      cdEl = document.createElement("div");
      cdEl.id = "hud-countdown-banner";
      cdEl.style.cssText = `
        position: absolute;
        top: 35%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-family: var(--font-race-num);
        font-size: 88px;
        font-weight: 900;
        font-style: italic;
        color: #FFF;
        text-shadow: 0 0 25px rgba(242, 180, 81, 0.8), 0 4px 15px rgba(0,0,0,0.9);
        pointer-events: none;
        z-index: 100;
        animation: cd-pop 0.4s ease-out;
      `;
      this.container.appendChild(cdEl);
    }
    cdEl.textContent = val;
    cdEl.style.display = "block";
    if (val === "GO!") {
      cdEl.style.color = "var(--color-sodium-amber)";
    }
  }

  hideCountdown() {
    const cdEl = this.container.querySelector("#hud-countdown-banner");
    if (cdEl) {
      cdEl.style.display = "none";
    }
  }

  showGutterDropEffect() {
    if (this.elGutterTag) {
      this.elGutterTag.classList.remove("is-hidden");
      this.elGutterTag.style.animation = "pulse-gutter 0.4s ease-in-out 3";
      setTimeout(() => {
        if (this.elGutterTag) this.elGutterTag.classList.add("is-hidden");
      }, 1500);
    }
  }

  showDriftCallout(angleDeg, points, combo = 1.0) {
    if (this.elDriftBanner) {
      this.elDriftBanner.classList.remove("is-hidden");
      if (this.elDriftAngle) this.elDriftAngle.textContent = `ANGLE ${Math.floor(angleDeg)}°`;
      if (this.elDriftPts) this.elDriftPts.textContent = Math.floor(points).toLocaleString();
      if (this.elDriftCombo) this.elDriftCombo.textContent = `x${combo.toFixed(1)}`;
    }
  }
}
