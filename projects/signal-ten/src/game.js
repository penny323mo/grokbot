// 十號風球 · Signal Ten (1962) — Core Simulation Engine & Interactive Desk UI
import {
  SIGNALS_1962,
  SIGNAL_BY_CODE,
  CHARACTERS,
  INITIAL_METRICS,
  STORMS,
  CAMPAIGN_ENDINGS,
  projectLatLon
} from './data.js';
import { SoundController } from './audio.js';

export const SAVE_STORAGE_KEY = 'signal_ten_1962_save_v1';

export function clampMetric(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Pure evaluation of a single shift decision.
 * @param {object} shift - Shift definition from STORMS
 * @param {object} decision - { trackId, confidence, signalCode, actions: { marine, radio, director } }
 * @param {object} currentMetrics - { livesRisk, disruptionCost, publicTrust, directorTrust, stamina }
 */
export function evaluateShiftDecision(shift, decision, currentMetrics) {
  const chosenTrack = decision?.trackId || shift.recommendedTrack;
  const confidence = decision?.confidence || 'med'; // 'low' | 'med' | 'high'
  const chosenSignal = Number.isFinite(Number(decision?.signalCode))
    ? Number(decision.signalCode)
    : shift.recommendedSignal;
  const actions = decision?.actions || {};

  const recSigObj = SIGNAL_BY_CODE[shift.recommendedSignal] || SIGNAL_BY_CODE[0];
  const chosenSigObj = SIGNAL_BY_CODE[chosenSignal] || SIGNAL_BY_CODE[0];

  const isExactSignal = chosenSignal === shift.recommendedSignal;
  const isAcceptableSignal =
    isExactSignal || (Array.isArray(shift.acceptableSignals) && shift.acceptableSignals.includes(chosenSignal));

  // Determine whether the signal was under-warned, over-warned, or wrong quadrant
  const sevDiff = chosenSigObj.severity - recSigObj.severity;
  let outcomeCategory = 'exact';
  let quadrantMismatch = false;

  if (!isAcceptableSignal) {
    if (sevDiff < 0) {
      outcomeCategory = 'under';
    } else if (sevDiff > 0) {
      outcomeCategory = 'over';
    } else {
      // Same severity (e.g. gale 5/6/7/8) but wrong directional quadrant!
      outcomeCategory = 'under';
      quadrantMismatch = true;
    }
  }

  // Track accuracy & confidence multiplier
  const trackCorrect = chosenTrack === shift.recommendedTrack;
  const confMult = confidence === 'high' ? 1.5 : confidence === 'low' ? 0.65 : 1.0;

  let dLives = 0;
  let dDisruption = 0;
  let dPublic = 0;
  let dDirector = 0;
  let dStamina = -3; // Base shift fatigue

  // Track evaluation
  if (trackCorrect) {
    dPublic += Math.round(3 * confMult);
    dDirector += Math.round(4 * confMult);
    dLives -= Math.round(2 * confMult);
  } else {
    dPublic -= Math.round(4 * confMult);
    dDirector -= Math.round(5 * confMult);
    dLives += Math.round(3 * confMult);
  }

  // Signal evaluation
  if (isExactSignal) {
    dPublic += 4;
    dDirector += 5;
    dLives -= 2;
    if (chosenSigObj.severity >= 3) {
      // Necessary economic pause during real gale/hurricane
      dDisruption += 2;
    } else {
      dDisruption -= 1;
    }
  } else if (isAcceptableSignal) {
    dPublic += 2;
    dDirector += 2;
    if (sevDiff > 0) dDisruption += 3;
  } else if (quadrantMismatch) {
    // Hoisted a gale signal, but wrong wind direction quadrant (e.g. NW instead of SE/SW)
    dLives += 8;
    dDisruption += 5;
    dPublic -= 7;
    dDirector -= 9;
  } else if (outcomeCategory === 'under') {
    const gap = Math.max(1, recSigObj.severity - chosenSigObj.severity);
    // Severe penalty when failing to hoist Gale/Storm/Hurricane during dangerous winds
    const dangerScale = recSigObj.severity >= 4 ? 7 : recSigObj.severity >= 3 ? 5 : 3;
    dLives += gap * dangerScale;
    dPublic -= gap * 5;
    dDirector -= gap * 6;
  } else if (outcomeCategory === 'over') {
    const gap = Math.max(1, chosenSigObj.severity - recSigObj.severity);
    dDisruption += gap * 8;
    dPublic -= gap * 5;
    dDirector -= gap * 6;
  }

  // Optional forecaster desk actions (cost stamina, mitigate risk / boost trust when used appropriately)
  const notesZh = [];
  if (actions.marine) {
    dStamina -= 3;
    if (recSigObj.severity >= 2) {
      dLives -= 3;
      dPublic += 2;
      notesZh.push('水警輪接獲專線通報，提前巡弋避風塘及吐露港協助船隻加固。');
    } else {
      dDisruption += 1;
      notesZh.push('海事處接獲通報後派員戒備。');
    }
  }
  if (actions.radio) {
    dStamina -= 3;
    if (recSigObj.severity >= 2) {
      dLives -= 3;
      dPublic += 3;
      notesZh.push('麗的呼聲與香港電台插播你的防風呼籲，低窪木屋區街坊及時撤離。');
    } else {
      dPublic += 1;
      notesZh.push('電台播出天氣簡報，安定市民情緒。');
    }
  }
  if (actions.director) {
    dStamina -= 2;
    if (recSigObj.severity >= 3) {
      dDirector += 4;
      notesZh.push('顏士爾台長嘉許你在關鍵風球更替前主動請示匯報。');
    } else {
      dDirector -= 2;
      notesZh.push('台長認為一般戒備訊號無須深宵致電其寓所。');
    }
  }

  // If stamina is critically low (< 20), decision precision suffers slightly
  if ((currentMetrics?.stamina ?? 80) < 20) {
    dDirector -= 2;
  }

  const nextMetrics = {
    livesRisk: clampMetric((currentMetrics?.livesRisk ?? INITIAL_METRICS.livesRisk) + dLives),
    disruptionCost: clampMetric((currentMetrics?.disruptionCost ?? INITIAL_METRICS.disruptionCost) + dDisruption),
    publicTrust: clampMetric((currentMetrics?.publicTrust ?? INITIAL_METRICS.publicTrust) + dPublic),
    directorTrust: clampMetric((currentMetrics?.directorTrust ?? INITIAL_METRICS.directorTrust) + dDirector),
    stamina: clampMetric((currentMetrics?.stamina ?? INITIAL_METRICS.stamina) + dStamina)
  };

  const baseOutcome = shift.outcomes[outcomeCategory] || shift.outcomes.exact;
  let headlineZh = baseOutcome.headlineZh;
  let bodyZh = baseOutcome.bodyZh;

  if (quadrantMismatch) {
    headlineZh = `誤掛 ${chosenSigObj.shortZh}（象限不符），船隻拋錨方向失準！`;
    bodyZh = `本港實測正吹 ${shift.hkObs.windDirZh}，理應懸掛「${recSigObj.nameZh}」，惟訊號架卻掛出「${chosenSigObj.nameZh}」，令維港浮泡貨輪與避風塘漁船防備方向錯誤！`;
  }
  if (notesZh.length > 0) {
    bodyZh = `${bodyZh} 此外，${notesZh.join(' ')}`;
  }

  return {
    outcomeCategory,
    quadrantMismatch,
    trackCorrect,
    isExactSignal,
    isAcceptableSignal,
    chosenSignal,
    recommendedSignal: shift.recommendedSignal,
    chosenTrack,
    recommendedTrack: shift.recommendedTrack,
    confidence,
    sceneArt: baseOutcome.sceneArt,
    speaker: baseOutcome.speaker,
    headlineZh,
    bodyZh,
    deltas: {
      livesRisk: nextMetrics.livesRisk - (currentMetrics?.livesRisk ?? INITIAL_METRICS.livesRisk),
      disruptionCost: nextMetrics.disruptionCost - (currentMetrics?.disruptionCost ?? INITIAL_METRICS.disruptionCost),
      publicTrust: nextMetrics.publicTrust - (currentMetrics?.publicTrust ?? INITIAL_METRICS.publicTrust),
      directorTrust: nextMetrics.directorTrust - (currentMetrics?.directorTrust ?? INITIAL_METRICS.directorTrust),
      stamina: nextMetrics.stamina - (currentMetrics?.stamina ?? INITIAL_METRICS.stamina)
    },
    nextMetrics
  };
}

export function resolveCampaignEnding(metrics) {
  const m = metrics || INITIAL_METRICS;
  if (m.livesRisk >= 60 || m.directorTrust < 35 || m.publicTrust < 32) {
    return CAMPAIGN_ENDINGS.ending_dismissed;
  }
  if (m.livesRisk <= 22 && m.disruptionCost <= 35 && m.publicTrust >= 80 && m.directorTrust >= 80) {
    return CAMPAIGN_ENDINGS.ending_best;
  }
  if (m.livesRisk <= 42 && m.publicTrust >= 58 && m.directorTrust >= 55) {
    return CAMPAIGN_ENDINGS.ending_trusted;
  }
  return CAMPAIGN_ENDINGS.ending_transferred;
}

/**
 * Automated playthrough helper for Node integrity tests:
 * Simulates a meteorologically sound forecaster across all 4 storms.
 */
export function simulateSoundForecaster() {
  let metrics = { ...INITIAL_METRICS };
  const shiftLogs = [];

  for (const storm of STORMS) {
    for (const shift of storm.shifts) {
      const sev = SIGNAL_BY_CODE[shift.recommendedSignal]?.severity || 0;
      const decision = {
        trackId: shift.recommendedTrack,
        confidence: 'high',
        signalCode: shift.recommendedSignal,
        actions: {
          marine: sev >= 3,
          radio: sev >= 3,
          director: sev >= 4
        }
      };
      const res = evaluateShiftDecision(shift, decision, metrics);
      metrics = res.nextMetrics;
      shiftLogs.push({ stormId: storm.id, shiftNum: shift.shiftNum, ...res });
    }
    // Rest between storms restores some stamina
    metrics.stamina = clampMetric(metrics.stamina + 18);
  }

  const ending = resolveCampaignEnding(metrics);
  return { metrics, ending, shiftLogs };
}

/**
 * Automated playthrough helper for Node integrity tests:
 * Simulates a negligent player who never hoists any signal above No. 1.
 */
export function simulateNeverHoistPlayer() {
  let metrics = { ...INITIAL_METRICS };
  const shiftLogs = [];

  for (const storm of STORMS) {
    for (const shift of storm.shifts) {
      const wrongTrack = shift.tracks.find((t) => t.id !== shift.recommendedTrack)?.id || 'C';
      const decision = {
        trackId: wrongTrack,
        confidence: 'high',
        signalCode: 0,
        actions: { marine: false, radio: false, director: false }
      };
      const res = evaluateShiftDecision(shift, decision, metrics);
      metrics = res.nextMetrics;
      shiftLogs.push({ stormId: storm.id, shiftNum: shift.shiftNum, ...res });
    }
  }

  const ending = resolveCampaignEnding(metrics);
  return { metrics, ending, shiftLogs };
}

/**
 * Automated playthrough helper for Node integrity tests:
 * Simulates an alarmist player who hoists Signal No. 10 on every mild shift.
 */
export function simulatePanicHoister() {
  let metrics = { ...INITIAL_METRICS };
  for (const storm of STORMS) {
    for (const shift of storm.shifts) {
      const res = evaluateShiftDecision(
        shift,
        { trackId: shift.recommendedTrack, confidence: 'high', signalCode: 10, actions: {} },
        metrics
      );
      metrics = res.nextMetrics;
    }
  }
  const ending = resolveCampaignEnding(metrics);
  return { metrics, ending };
}

// ============================================================================
// Interactive Browser UI Controller
// ============================================================================

export class SignalTenGame {
  constructor(rootEl) {
    this.root = rootEl;
    this.sound = new SoundController();
    this.state = this._createDefaultState();
    this.modal = null; // 'chapters' | 'manual' | null
    this.activeTelegramIdx = 0;
    this._loadSavedState();
  }

  _createDefaultState() {
    return {
      screen: 'title', // 'title' | 'storm_intro' | 'desk' | 'outcome' | 'debrief' | 'ending'
      stormIdx: 0,
      shiftIdx: 0,
      currentHoistedSignal: 0,
      metrics: { ...INITIAL_METRICS },
      deskTab: 'chart', // 'chart' | 'inst' | 'signal'
      draft: {
        trackId: 'B',
        confidence: 'med',
        signalCode: 1,
        actions: { marine: false, radio: false, director: false }
      },
      lastOutcome: null,
      stormStats: { exactCount: 0, underCount: 0, overCount: 0 }
    };
  }

  _loadSavedState() {
    try {
      if (typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem(SAVE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.stormIdx === 'number' && parsed.metrics) {
        this.hasSavedGame = true;
        this.savedSnapshot = parsed;
      }
    } catch (_) {
      this.hasSavedGame = false;
    }
  }

  _saveState() {
    try {
      if (typeof localStorage === 'undefined') return;
      const snap = {
        stormIdx: this.state.stormIdx,
        shiftIdx: this.state.shiftIdx,
        currentHoistedSignal: this.state.currentHoistedSignal,
        metrics: { ...this.state.metrics },
        stormStats: { ...this.state.stormStats }
      };
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(snap));
      this.hasSavedGame = true;
      this.savedSnapshot = snap;
    } catch (_) {}
  }

  get currentStorm() {
    return STORMS[this.state.stormIdx] || STORMS[0];
  }

  get currentShift() {
    const st = this.currentStorm;
    return st.shifts[this.state.shiftIdx] || st.shifts[0];
  }

  startNewCampaign(stormIdx = 0) {
    this.sound.unlock();
    this.sound.play('paper');
    this.state = this._createDefaultState();
    this.state.stormIdx = stormIdx;
    this.state.shiftIdx = 0;
    this.state.screen = 'storm_intro';
    this.modal = null;
    this._prepareShiftDraft();
    this._saveState();
    this.render();
  }

  continueSavedCampaign() {
    if (!this.savedSnapshot) {
      this.startNewCampaign(0);
      return;
    }
    this.sound.unlock();
    this.sound.play('paper');
    this.state = this._createDefaultState();
    this.state.stormIdx = Math.min(STORMS.length - 1, Math.max(0, this.savedSnapshot.stormIdx || 0));
    const st = STORMS[this.state.stormIdx];
    this.state.shiftIdx = Math.min(st.shifts.length - 1, Math.max(0, this.savedSnapshot.shiftIdx || 0));
    this.state.currentHoistedSignal = this.savedSnapshot.currentHoistedSignal ?? 0;
    this.state.metrics = { ...INITIAL_METRICS, ...this.savedSnapshot.metrics };
    this.state.stormStats = { exactCount: 0, underCount: 0, overCount: 0, ...(this.savedSnapshot.stormStats || {}) };
    this.state.screen = 'desk';
    this.modal = null;
    this._prepareShiftDraft();
    this.render();
  }

  _prepareShiftDraft() {
    const shift = this.currentShift;
    if (!shift) return;
    this.activeTelegramIdx = 0;
    this.state.deskTab = 'chart';
    this.state.draft = {
      trackId: shift.tracks[0]?.id || 'A',
      confidence: 'med',
      signalCode: this.state.currentHoistedSignal,
      actions: { marine: false, radio: false, director: false }
    };
    this.sound.setWindIntensity(shift.windIntensity || 0.2);
  }

  enterShiftDesk() {
    this.sound.play('teleprinter');
    this.state.screen = 'desk';
    this._prepareShiftDraft();
    this._saveState();
    this.render();
  }

  commitShiftDecision() {
    const shift = this.currentShift;
    const res = evaluateShiftDecision(shift, this.state.draft, this.state.metrics);
    this.state.metrics = res.nextMetrics;
    this.state.currentHoistedSignal = res.chosenSignal;
    this.state.lastOutcome = res;

    if (res.outcomeCategory === 'exact') this.state.stormStats.exactCount += 1;
    else if (res.outcomeCategory === 'under') this.state.stormStats.underCount += 1;
    else this.state.stormStats.overCount += 1;

    if (res.chosenSignal >= 9) {
      this.sound.play('siren');
    } else {
      this.sound.play('paper');
    }

    this.state.screen = 'outcome';
    this._saveState();
    this.render();
  }

  advanceAfterOutcome() {
    const storm = this.currentStorm;
    if (this.state.shiftIdx + 1 < storm.shifts.length) {
      this.state.shiftIdx += 1;
      this.state.screen = 'desk';
      this._prepareShiftDraft();
      this.sound.play('teleprinter');
    } else {
      this.state.screen = 'debrief';
      this.sound.setWindIntensity(0.14);
      this.sound.play('paper');
    }
    this._saveState();
    this.render();
  }

  advanceAfterDebrief() {
    // Between-storm rest restores 16 stamina
    this.state.metrics.stamina = clampMetric(this.state.metrics.stamina + 16);
    if (this.state.stormIdx + 1 < STORMS.length) {
      this.state.stormIdx += 1;
      this.state.shiftIdx = 0;
      this.state.currentHoistedSignal = 0;
      this.state.stormStats = { exactCount: 0, underCount: 0, overCount: 0 };
      this.state.screen = 'storm_intro';
      this._prepareShiftDraft();
      this.sound.play('paper');
    } else {
      this.state.screen = 'ending';
      this.sound.play('paper');
    }
    this._saveState();
    this.render();
  }

  render() {
    if (!this.root) return;
    const s = this.state.screen;
    let html = '';

    if (s === 'title') {
      html = this._renderTitleScreen();
    } else if (s === 'storm_intro') {
      html = this._renderStormIntro();
    } else if (s === 'desk') {
      html = this._renderDeskScreen();
    } else if (s === 'outcome') {
      html = this._renderOutcomeScreen();
    } else if (s === 'debrief') {
      html = this._renderDebriefScreen();
    } else if (s === 'ending') {
      html = this._renderEndingScreen();
    }

    if (this.modal === 'chapters') {
      html += this._renderChapterModal();
    } else if (this.modal === 'manual') {
      html += this._renderManualModal();
    }

    this.root.innerHTML = html;
    this._bindEvents();
  }

  _renderTitleScreen() {
    const muteLabel = this.sound.muted ? '音效：靜音' : '音效：開啟';
    return `
      <main class="screen title-screen" data-screen="title">
        <div class="title-backdrop">
          <img src="assets/art/cover.webp" alt="十號風球 Signal Ten 1962" class="title-cover-img" />
          <div class="title-scrim"></div>
        </div>

        <header class="title-top-bar">
          <span class="rohk-stamp">ROYAL OBSERVATORY HONG KONG · 1962</span>
          <button type="button" class="btn-pill" data-action="toggle-mute" aria-label="切換音效">${muteLabel}</button>
        </header>

        <section class="title-Spacer" aria-hidden="true"></section>

        <section class="title-card">
          <p class="title-kicker">一九六二年 · 尖沙咀彌敦道皇家天文台</p>
          <h1 class="title-heading">十號風球</h1>
          <p class="title-sub">SIGNAL TEN · 颱風預報主任值班手記</p>
          <p class="title-desc">
            手繪南海天氣圖、比對船舶與偵察機電報、凝視水銀氣壓計急跌——在「溫黛」創下 953.2 毫巴世紀低壓之夜，決定何時升起十號颶風十字架訊號。
          </p>

          <div class="title-actions">
            <button type="button" class="btn-primary" data-action="start-new">開始值班（一九六二風季）</button>
            ${
              this.hasSavedGame
                ? `<button type="button" class="btn-secondary" data-action="continue-game">繼續值班（第 ${
                    (this.savedSnapshot?.stormIdx || 0) + 1
                  } 號風暴）</button>`
                : ''
            }
            <div class="title-QuickRow">
              <button type="button" class="btn-ghost" data-action="open-chapters">選擇風暴章節</button>
              <button type="button" class="btn-ghost" data-action="open-manual">一九六二年風球圖鑑</button>
            </div>
          </div>
        </section>
      </main>
    `;
  }

  _renderStormIntro() {
    const storm = this.currentStorm;
    return `
      <main class="screen intro-screen" data-screen="storm_intro">
        <header class="top-nav-strip">
          <button type="button" class="btn-nav" data-action="back-title">返回標題</button>
          <span class="nav-title">第 ${storm.index} 章 · ${storm.codeEn}</span>
          <button type="button" class="btn-nav" data-action="open-manual">風球規例</button>
        </header>

        <article class="paper-sheet intro-sheet">
          <div class="intro-stamp-row">
            <span class="stamp-red">皇家天文台預報室檔案</span>
            <span class="mono-tag">${storm.dateRangeZh}</span>
          </div>
          <h1 class="sheet-title">${storm.nameZh}</h1>
          <p class="sheet-subtitle">${storm.subtitleZh}</p>

          <figure class="vignette-frame">
            <img src="${storm.coverArt}" alt="${storm.nameZh}" class="vignette-img" />
          </figure>

          <p class="sheet-body">${storm.introBriefZh}</p>

          <div class="director-note">
            <img src="${CHARACTERS.director.portrait}" alt="${CHARACTERS.director.nameZh}" class="avatar-sm" />
            <div>
              <div class="speaker-name">${CHARACTERS.director.nameZh} · ${CHARACTERS.director.roleZh}</div>
              <p class="speaker-quote">「請仔細核對每一封電報定位與橫瀾島風力。切記一九六二年烈風訊號分為五號（西北）、六號（西南）、七號（東北）及八號（東南）四個象限！」</p>
            </div>
          </div>

          <button type="button" class="btn-primary" data-action="enter-desk">進入預報室值班（第 1 更）</button>
        </article>
      </main>
    `;
  }

  _renderDeskScreen() {
    const storm = this.currentStorm;
    const shift = this.currentShift;
    const hoistedSig = SIGNAL_BY_CODE[this.state.currentHoistedSignal] || SIGNAL_BY_CODE[0];
    const draftSig = SIGNAL_BY_CODE[this.state.draft.signalCode] || SIGNAL_BY_CODE[0];
    const speaker = CHARACTERS[shift.colleaguePrompt.speaker] || CHARACTERS.lam;
    const m = this.state.metrics;

    return `
      <main class="screen desk-screen ${shift.skyClass}" data-screen="desk">
        <!-- Compact Status & Metrics Header -->
        <header class="desk-header">
          <div class="desk-top-row">
            <button type="button" class="btn-icon-text" data-action="back-title" title="返回主畫面">主頁</button>
            <div class="shift-clock">
              <span class="storm-pill">${storm.nameZh} (${this.state.shiftIdx + 1}/${storm.shifts.length}更)</span>
              <strong class="time-label">${shift.timeZh}</strong>
            </div>
            <button type="button" class="btn-icon-text" data-action="open-manual">風球表</button>
          </div>

          <div class="metrics-bar" role="region" aria-label="預報室指標">
            <div class="metric-chip ${m.livesRisk >= 40 ? 'danger' : ''}">
              <span class="m-lbl">人命風險</span>
              <strong class="m-val" data-metric="livesRisk">${m.livesRisk}</strong>
            </div>
            <div class="metric-chip ${m.disruptionCost >= 45 ? 'warn' : ''}">
              <span class="m-lbl">市面損失</span>
              <strong class="m-val" data-metric="disruptionCost">${m.disruptionCost}</strong>
            </div>
            <div class="metric-chip">
              <span class="m-lbl">市民公信</span>
              <strong class="m-val" data-metric="publicTrust">${m.publicTrust}</strong>
            </div>
            <div class="metric-chip">
              <span class="m-lbl">台長信任</span>
              <strong class="m-val" data-metric="directorTrust">${m.directorTrust}</strong>
            </div>
            <div class="metric-chip">
              <span class="m-lbl">身心體力</span>
              <strong class="m-val" data-metric="stamina">${m.stamina}</strong>
            </div>
          </div>
        </header>

        <!-- Colleague Dialogue Strip -->
        <section class="colleague-strip">
          <img src="${speaker.portrait}" alt="${speaker.nameZh}" class="avatar-md" />
          <div class="colleague-bubble">
            <div class="colleague-meta">
              <strong>${speaker.nameZh}</strong>
              <span>${speaker.roleZh}</span>
              <span class="hoisted-tag">現掛：${hoistedSig.shortZh}</span>
            </div>
            <p class="colleague-text">${shift.colleaguePrompt.textZh}</p>
          </div>
        </section>

        <!-- Workspace Mode Tabs -->
        <nav class="desk-tabs" role="tablist" aria-label="預報桌工作區">
          <button type="button" role="tab" aria-selected="${this.state.deskTab === 'chart'}"
            class="tab-btn ${this.state.deskTab === 'chart' ? 'active' : ''}" data-tab="chart">
            ① 電報與天氣圖
          </button>
          <button type="button" role="tab" aria-selected="${this.state.deskTab === 'inst'}"
            class="tab-btn ${this.state.deskTab === 'inst' ? 'active' : ''}" data-tab="inst">
            ② 氣壓與專線
          </button>
          <button type="button" role="tab" aria-selected="${this.state.deskTab === 'signal'}"
            class="tab-btn ${this.state.deskTab === 'signal' ? 'active' : ''}" data-tab="signal">
            ③ 懸掛風球 (${draftSig.code}號)
          </button>
        </nav>

        <!-- Active Desk Panel -->
        <section class="desk-body">
          ${this.state.deskTab === 'chart' ? this._renderChartTab(storm, shift) : ''}
          ${this.state.deskTab === 'inst' ? this._renderInstrumentsTab(storm, shift) : ''}
          ${this.state.deskTab === 'signal' ? this._renderSignalTab(storm, shift) : ''}
        </section>

        <!-- Persistent Bottom Decision & Hoist Bar -->
        <footer class="desk-footer">
          <div class="draft-summary">
            <span>預測路徑：<strong>${this.state.draft.trackId} 線</strong></span>
            <span>擬掛訊號：<strong class="highlight-sig">${draftSig.shortZh}</strong></span>
          </div>
          <button type="button" class="btn-hoist" data-action="commit-shift">
            簽發預報 · 懸掛風球
          </button>
        </footer>
      </main>
    `;
  }

  _renderChartTab(storm, shift) {
    // Build past points + current fixes + candidate tracks on SVG 840x630 viewBox
    const pastPts = [...storm.historyPoints];
    for (let i = 0; i < this.state.shiftIdx; i++) {
      pastPts.push(storm.shifts[i].actualPos);
    }

    const toSvgXY = (lat, lon) => {
      const p = projectLatLon(lat, lon);
      return { x: (p.xPct / 100) * 840, y: (p.yPct / 100) * 630 };
    };

    const pastPoly = pastPts
      .map((pt) => {
        const { x, y } = toSvgXY(pt.lat, pt.lon);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const pastCircles = pastPts
      .map((pt) => {
        const { x, y } = toSvgXY(pt.lat, pt.lon);
        return `<g>
          <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="#1C1A17" stroke="#EFE4CC" stroke-width="2"/>
          <text x="${(x + 9).toFixed(1)}" y="${(y + 4).toFixed(1)}" fill="#1C1A17" font-size="13" font-family="CourierPrime, monospace" font-weight="bold">${pt.label || ''}</text>
        </g>`;
      })
      .join('');

    // Telegram position fixes (uncertain circles in carbon-blue / ochre)
    const fixCircles = shift.telegrams
      .map((tg, idx) => {
        if (!tg.fix) return '';
        const { x, y } = toSvgXY(tg.fix.lat, tg.fix.lon);
        const rPx = (tg.fix.radiusDeg || 0.4) * 52;
        const isSel = idx === this.activeTelegramIdx;
        const strokeCol = isSel ? '#B5452B' : '#2B3A67';
        return `<g class="chart-fix">
          <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rPx.toFixed(1)}"
            fill="${isSel ? 'rgba(181,69,43,0.16)' : 'rgba(43,58,103,0.10)'}"
            stroke="${strokeCol}" stroke-width="${isSel ? '2.5' : '1.8'}" stroke-dasharray="5,4"/>
          <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="${strokeCol}"/>
          <text x="${(x - 18).toFixed(1)}" y="${(y - rPx - 4).toFixed(1)}" fill="${strokeCol}" font-size="13" font-family="CourierPrime, monospace" font-weight="bold">電報${idx + 1}(${tg.fix.source})</text>
        </g>`;
      })
      .join('');

    // Candidate forecast tracks A / B / C
    const trackLines = shift.tracks
      .map((tr) => {
        const isChosen = this.state.draft.trackId === tr.id;
        const pts = tr.waypoints.map((wp) => toSvgXY(wp.lat, wp.lon));
        const dStr = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
        const lastPt = pts[pts.length - 1];
        const col = isChosen ? '#B5452B' : '#4A5560';
        return `<g class="chart-track" data-track-svg="${tr.id}">
          <path d="${dStr}" fill="none" stroke="${col}" stroke-width="${isChosen ? '4.5' : '2.2'}"
            stroke-dasharray="${isChosen ? 'none' : '7,5'}" opacity="${isChosen ? '0.96' : '0.62'}"/>
          ${pts
            .map(
              (p) =>
                `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${isChosen ? '6' : '4'}" fill="${col}" stroke="#EFE4CC" stroke-width="1.5"/>`
            )
            .join('')}
          <rect x="${(lastPt.x + 6).toFixed(1)}" y="${(lastPt.y - 14).toFixed(1)}" width="34" height="22" rx="4" fill="${col}"/>
          <text x="${(lastPt.x + 13).toFixed(1)}" y="${(lastPt.y + 2).toFixed(1)}" fill="#EFE4CC" font-size="14" font-weight="bold" font-family="CourierPrime, monospace">${tr.id}線</text>
        </g>`;
      })
      .join('');

    const activeTg = shift.telegrams[this.activeTelegramIdx] || shift.telegrams[0];

    return `
      <div class="tab-pane chart-pane">
        <!-- Synoptic Plotting Chart -->
        <div class="chart-container">
          <img src="assets/art/chart_base.webp" alt="1962 南海天氣圖" class="chart-base-img" />
          <svg class="chart-svg-overlay" viewBox="0 0 840 630" preserveAspectRatio="none" aria-label="颱風路徑繪圖層">
            ${pastPts.length > 1 ? `<polyline points="${pastPoly}" fill="none" stroke="#1C1A17" stroke-width="3"/>` : ''}
            ${pastCircles}
            ${fixCircles}
            ${trackLines}
          </svg>
          <div class="chart-legend-strip">
            <span>● 實測過去位置</span>
            <span>◌ 電報定位誤差圈</span>
            <span class="red-legend">━ 鉛筆預測路徑 (${this.state.draft.trackId}線)</span>
          </div>
        </div>

        <!-- Forecast Track & Confidence Selector -->
        <div class="panel-box">
          <div class="panel-header-row">
            <h2 class="panel-title">鉛筆繪製預測路徑（點擊切換 A / B / C 線）</h2>
            <div class="conf-group" role="group" aria-label="預報把握度">
              <button type="button" class="btn-conf ${this.state.draft.confidence === 'low' ? 'active' : ''}" data-conf="low">把握：低</button>
              <button type="button" class="btn-conf ${this.state.draft.confidence === 'med' ? 'active' : ''}" data-conf="med">把握：中</button>
              <button type="button" class="btn-conf ${this.state.draft.confidence === 'high' ? 'active' : ''}" data-conf="high">把握：高</button>
            </div>
          </div>
          <div class="track-selector-list">
            ${shift.tracks
              .map(
                (tr) => `
              <button type="button" class="track-option-btn ${this.state.draft.trackId === tr.id ? 'selected' : ''}"
                data-select-track="${tr.id}">
                <div class="track-opt-top">
                  <span class="track-badge">${tr.id} 線</span>
                  <strong>${tr.labelZh}</strong>
                </div>
                <p class="track-opt-desc">${tr.descZh}</p>
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Incoming Telegram Slips -->
        <div class="panel-box telegram-box">
          <div class="telegram-tabs">
            ${shift.telegrams
              .map(
                (tg, idx) => `
              <button type="button" class="tg-tab-btn ${idx === this.activeTelegramIdx ? 'active' : ''}"
                data-select-tg="${idx}">
                電報 ${idx + 1} · ${tg.fromZh.split(' ')[0]}
              </button>
            `
              )
              .join('')}
          </div>
          <article class="telegram-slip">
            <div class="tg-meta-row">
              <span class="tg-origin">${activeTg.fromZh}</span>
              <span class="tg-time">${activeTg.typeZh} · ${activeTg.timeStamp}</span>
            </div>
            <pre class="tg-raw">${activeTg.rawCode}</pre>
            <p class="tg-decoded">${activeTg.textZh}</p>
          </article>
        </div>
      </div>
    `;
  }

  _renderInstrumentsTab(storm, shift) {
    const obs = shift.hkObs;
    const acts = this.state.draft.actions;

    // Build barograph trace up to current shift
    const baroPts = storm.shifts.slice(0, this.state.shiftIdx + 1).map((s, i) => {
      const x = 40 + i * 68;
      // Map 950..1010 mb to y 145..20
      const p = s.hkObs.pressureMb;
      const y = 145 - ((p - 950) / 60) * 125;
      return { x, y: Math.max(14, Math.min(150, y)), p, label: `第${i + 1}更` };
    });
    const baroPoly = baroPts.map((pt) => `${pt.x},${pt.y.toFixed(1)}`).join(' ');

    return `
      <div class="tab-pane inst-pane">
        <!-- Barograph & Anemometer Readings -->
        <div class="panel-box inst-grid-box">
          <h2 class="panel-title">皇家天文台及橫瀾島實測儀器讀數</h2>
          <div class="inst-cards">
            <div class="inst-card">
              <span class="inst-label">天文台水銀氣壓計</span>
              <strong class="inst-big ${obs.pressureMb < 980 ? 'danger-text' : ''}">${obs.pressureMb.toFixed(1)} mb</strong>
              <span class="inst-sub">${obs.pressureTrendZh}</span>
            </div>
            <div class="inst-card">
              <span class="inst-label">維港持續風力 / 陣風</span>
              <strong class="inst-big ${obs.windKt >= 34 ? 'danger-text' : ''}">${obs.windKt} 節 (陣風 ${obs.gustKt})</strong>
              <span class="inst-sub">風向：${obs.windDirZh}</span>
            </div>
            <div class="inst-card">
              <span class="inst-label">橫瀾島燈塔實測風力</span>
              <strong class="inst-big ${obs.waglanKt >= 34 ? 'danger-text' : ''}">${obs.waglanKt} 節 (陣風 ${obs.waglanGustKt})</strong>
              <span class="inst-sub">風向：${obs.waglanDirZh}</span>
            </div>
            <div class="inst-card">
              <span class="inst-label">風暴距離 / 吐露港潮位</span>
              <strong class="inst-big">${obs.distKm} km (${obs.bearingZh})</strong>
              <span class="inst-sub">雨量 ${obs.rainMmHr} mm/h · 潮位 +${obs.tideM}m</span>
            </div>
          </div>

          <!-- Barograph Drum SVG -->
          <div class="barograph-wrap">
            <div class="baro-caption">自記氣壓計紙鼓記錄 (BAROGRAPH TRACE · 950–1010 MB)</div>
            <svg class="baro-svg" viewBox="0 0 440 165" aria-label="自記氣壓計曲線">
              <line x1="30" y1="25" x2="420" y2="25" stroke="#B5452B" stroke-opacity="0.3" stroke-dasharray="3,3"/>
              <text x="4" y="29" font-size="10" fill="#6E5A4F">1005</text>
              <line x1="30" y1="75" x2="420" y2="75" stroke="#B5452B" stroke-opacity="0.3" stroke-dasharray="3,3"/>
              <text x="4" y="79" font-size="10" fill="#6E5A4F">985</text>
              <line x1="30" y1="125" x2="420" y2="125" stroke="#B5452B" stroke-opacity="0.4" stroke-dasharray="3,3"/>
              <text x="4" y="129" font-size="10" fill="#B5452B">960</text>
              ${baroPts.length > 1 ? `<polyline points="${baroPoly}" fill="none" stroke="#2B3A67" stroke-width="3"/>` : ''}
              ${baroPts
                .map(
                  (pt) => `<g>
                  <circle cx="${pt.x}" cy="${pt.y.toFixed(1)}" r="4.5" fill="#B5452B"/>
                  <text x="${pt.x - 18}" y="${(pt.y - 8).toFixed(1)}" font-size="11" font-weight="bold" fill="#1C1A17">${pt.p}</text>
                  <text x="${pt.x - 14}" y="158" font-size="10" fill="#4A453E">${pt.label}</text>
                </g>`
                )
                .join('')}
            </svg>
          </div>
        </div>

        <!-- Forecaster Rotary Telephone & Radio Desk Actions -->
        <div class="panel-box">
          <h2 class="panel-title">預報室專線電話與特別調度（每項消耗 2–3 點體力）</h2>
          <div class="action-toggles">
            <button type="button" class="action-toggle-btn ${acts.marine ? 'active' : ''}" data-toggle-act="marine">
              <img src="${CHARACTERS.ho_sir.portrait}" alt="水警何幫辦" class="avatar-sm" />
              <div class="act-text">
                <strong>致電海事處及水警輪（何幫辦）</strong>
                <span>通報避風塘封鎖、浮泡加纜及吐露港水警輪撤離行動（降低人命風險）</span>
              </div>
              <span class="act-state">${acts.marine ? '已撥通' : '撥打'}</span>
            </button>

            <button type="button" class="action-toggle-btn ${acts.radio ? 'active' : ''}" data-toggle-act="radio">
              <img src="${CHARACTERS.sau_lan.portrait}" alt="麗的呼聲周秀蘭" class="avatar-sm" />
              <div class="act-text">
                <strong>插播麗的呼聲／香港電台防風呼籲（周秀蘭）</strong>
                <span>向山邊木屋區、沙田大埔低窪艇戶發出粵語特別防風廣播（提升公信力、減傷亡）</span>
              </div>
              <span class="act-state">${acts.radio ? '已插播' : '插播'}</span>
            </button>

            <button type="button" class="action-toggle-btn ${acts.director ? 'active' : ''}" data-toggle-act="director">
              <img src="${CHARACTERS.director.portrait}" alt="顏士爾台長" class="avatar-sm" />
              <div class="act-text">
                <strong>致電天文台長官邸請示（顏士爾博士）</strong>
                <span>在懸掛烈風或十號颶風訊號前向台長匯報氣壓與雷達實況（提升台長信任）</span>
              </div>
              <span class="act-state">${acts.director ? '已請示' : '請示'}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  _renderSignalTab(storm, shift) {
    const chosenCode = this.state.draft.signalCode;
    const chosenSig = SIGNAL_BY_CODE[chosenCode] || SIGNAL_BY_CODE[0];

    return `
      <div class="tab-pane signal-pane">
        <!-- Selected Signal Preview Banner -->
        <div class="signal-preview-card">
          <img src="${chosenSig.art}" alt="${chosenSig.nameZh}" class="sig-preview-img" />
          <div class="sig-preview-info">
            <span class="sig-preview-tag">擬掛訊號 · 夜間燈號：${chosenSig.lightsZh}</span>
            <h2 class="sig-preview-title">${chosenSig.nameZh}</h2>
            <p class="sig-preview-crit"><strong>標準：</strong>${chosenSig.windCriterion}</p>
            <p class="sig-preview-eff"><strong>影響：</strong>${chosenSig.effectDesc}</p>
          </div>
        </div>

        <!-- 9-Signal Historical 1962 Grid -->
        <div class="panel-box">
          <h3 class="panel-title">選擇一九六二年香港熱帶氣旋警告訊號（點擊切換）</h3>
          <div class="signal-grid" role="radiogroup" aria-label="1962風球訊號選擇">
            ${SIGNALS_1962.map(
              (sig) => `
              <button type="button" role="radio" aria-checked="${sig.code === chosenCode}"
                class="sig-grid-btn ${sig.code === chosenCode ? 'selected' : ''}"
                data-select-signal="${sig.code}">
                <img src="${sig.art}" alt="${sig.nameZh}" class="sig-thumb" />
                <div class="sig-btn-meta">
                  <strong class="sig-btn-code">${sig.code === 0 ? '除下 (0)' : `${sig.code} 號`}</strong>
                  <span class="sig-btn-short">${sig.shortZh}</span>
                  <span class="sig-btn-shape">${sig.shapeZh}</span>
                </div>
              </button>
            `
            ).join('')}
          </div>
        </div>
      </div>
    `;
  }

  _renderOutcomeScreen() {
    const res = this.state.lastOutcome;
    const storm = this.currentStorm;
    const shift = this.currentShift;
    const chosenSig = SIGNAL_BY_CODE[res.chosenSignal] || SIGNAL_BY_CODE[0];
    const recSig = SIGNAL_BY_CODE[res.recommendedSignal] || SIGNAL_BY_CODE[0];
    const spk = CHARACTERS[res.speaker] || CHARACTERS.lam;

    const fmtDelta = (val, invertGood = false) => {
      if (val === 0) return '<span class="delta-neutral">±0</span>';
      const isGood = invertGood ? val < 0 : val > 0;
      const sign = val > 0 ? `+${val}` : `${val}`;
      return `<span class="${isGood ? 'delta-good' : 'delta-bad'}">${sign}</span>`;
    };

    const isLastShift = this.state.shiftIdx + 1 >= storm.shifts.length;

    return `
      <main class="screen outcome-screen" data-screen="outcome">
        <article class="paper-sheet outcome-sheet">
          <div class="outcome-top-bar">
            <span class="mono-tag">${storm.nameZh} · ${shift.timeZh}</span>
            <span class="status-badge ${res.isAcceptableSignal ? 'badge-ok' : 'badge-warn'}">
              ${res.isExactSignal ? '精準預警' : res.isAcceptableSignal ? '合理調度' : res.outcomeCategory === 'under' ? '警告不足' : '過度預警'}
            </span>
          </div>

          <h1 class="sheet-title">${res.headlineZh}</h1>

          <figure class="vignette-frame">
            <img src="${res.sceneArt}" alt="${res.headlineZh}" class="vignette-img" />
          </figure>

          <div class="outcome-sig-compare">
            <div class="sig-cmp-item">
              <span>本更懸掛訊號</span>
              <strong>${chosenSig.nameZh}</strong>
            </div>
            <div class="sig-cmp-item">
              <span>實測最切合訊號</span>
              <strong>${recSig.nameZh}</strong>
            </div>
            <div class="sig-cmp-item">
              <span>路徑判斷</span>
              <strong>${res.trackCorrect ? `${res.chosenTrack} 線（準確）` : `${res.chosenTrack} 線（實為 ${res.recommendedTrack} 線）`}</strong>
            </div>
          </div>

          <div class="director-note">
            <img src="${spk.portrait}" alt="${spk.nameZh}" class="avatar-sm" />
            <div>
              <div class="speaker-name">${spk.nameZh} · ${spk.roleZh}</div>
              <p class="speaker-quote">${res.bodyZh}</p>
            </div>
          </div>

          <div class="delta-strip">
            <div>人命風險 ${fmtDelta(res.deltas.livesRisk, true)}</div>
            <div>市面損失 ${fmtDelta(res.deltas.disruptionCost, true)}</div>
            <div>市民公信 ${fmtDelta(res.deltas.publicTrust, false)}</div>
            <div>台長信任 ${fmtDelta(res.deltas.directorTrust, false)}</div>
            <div>身心體力 ${fmtDelta(res.deltas.stamina, false)}</div>
          </div>

          <button type="button" class="btn-primary" data-action="next-shift">
            ${isLastShift ? '翻閱次日《華僑日報》及台長評語' : `進入下一更（第 ${this.state.shiftIdx + 2} 更）`}
          </button>
        </article>
      </main>
    `;
  }

  _renderDebriefScreen() {
    const storm = this.currentStorm;
    const db = storm.debrief;
    const stats = this.state.stormStats;
    const isGoodStorm = stats.underCount === 0 && stats.overCount <= 1;

    const headline = isGoodStorm ? db.goodHeadlineZh : db.badHeadlineZh;
    const subhead = isGoodStorm ? db.goodSubheadZh : db.badSubheadZh;
    const body = isGoodStorm ? db.goodBodyZh : db.badBodyZh;
    const dirComment = isGoodStorm ? db.directorGoodZh : db.directorBadZh;
    const isFinalStorm = this.state.stormIdx + 1 >= STORMS.length;

    return `
      <main class="screen debrief-screen" data-screen="debrief">
        <article class="newspaper-page">
          <header class="news-masthead">
            <div class="news-meta-line">中華民國五十一年 · ${db.dateZh} · 港幣一毫</div>
            <h1 class="news-paper-title">${db.newspaperName}</h1>
            <div class="news-sub-bar">WAH KIU YAT PO · 香港歷史最悠久華文日報</div>
          </header>

          <section class="news-lead-story">
            <h2 class="news-headline">${headline}</h2>
            <h3 class="news-subhead">${subhead}</h3>
            <figure class="vignette-frame news-photo">
              <img src="assets/scenes/news_stand.webp" alt="華僑日報號外" class="vignette-img" />
            </figure>
            <p class="news-body">${body}</p>
          </section>

          <section class="news-stats-box">
            <div>精準更次：<strong>${stats.exactCount} 更</strong></div>
            <div>漏報／偏低：<strong>${stats.underCount} 更</strong></div>
            <div>誤報／偏高：<strong>${stats.overCount} 更</strong></div>
          </section>

          <section class="director-note">
            <img src="${CHARACTERS.director.portrait}" alt="顏士爾台長" class="avatar-sm" />
            <div>
              <div class="speaker-name">皇家天文台長室檢討 · 顏士爾博士</div>
              <p class="speaker-quote">${dirComment}</p>
            </div>
          </section>

          <button type="button" class="btn-primary" data-action="next-storm">
            ${isFinalStorm ? '查閱一九六二風季最終考績與結局' : `迎接下一場風暴（第 ${this.state.stormIdx + 2} 章）`}
          </button>
        </article>
      </main>
    `;
  }

  _renderEndingScreen() {
    const ending = resolveCampaignEnding(this.state.metrics);
    const m = this.state.metrics;

    return `
      <main class="screen ending-screen" data-screen="ending">
        <article class="paper-sheet ending-sheet">
          <span class="stamp-red">${ending.badgeZh}</span>
          <h1 class="sheet-title">${ending.titleZh}</h1>

          <figure class="vignette-frame">
            <img src="${ending.art}" alt="${ending.titleZh}" class="vignette-img" />
          </figure>

          <p class="sheet-body">${ending.summaryZh}</p>

          <section class="final-metrics-grid">
            <div class="fm-item"><span>最終人命風險</span><strong>${m.livesRisk} / 100</strong></div>
            <div class="fm-item"><span>累計市面損失</span><strong>${m.disruptionCost} / 100</strong></div>
            <div class="fm-item"><span>市民公信力</span><strong>${m.publicTrust} / 100</strong></div>
            <div class="fm-item"><span>台長信任度</span><strong>${m.directorTrust} / 100</strong></div>
          </section>

          <div class="title-actions">
            <button type="button" class="btn-primary" data-action="start-new">重新開始一九六二風季</button>
            <button type="button" class="btn-secondary" data-action="open-chapters">自選風暴章節重溫</button>
          </div>
        </article>
      </main>
    `;
  }

  _renderChapterModal() {
    return `
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="選擇風暴章節">
        <div class="modal-card">
          <div class="modal-header">
            <h2>選擇一九六二年風暴章節</h2>
            <button type="button" class="btn-close" data-action="close-modal">關閉</button>
          </div>
          <div class="chapter-list">
            ${STORMS.map(
              (st, idx) => `
              <button type="button" class="chapter-item-btn" data-jump-storm="${idx}">
                <img src="${st.coverArt}" alt="${st.nameZh}" class="chapter-thumb" />
                <div class="chapter-meta">
                  <strong>第 ${st.index} 章 · ${st.nameZh} (${st.codeEn})</strong>
                  <span>${st.subtitleZh}</span>
                </div>
              </button>
            `
            ).join('')}
          </div>
        </div>
      </div>
    `;
  }

  _renderManualModal() {
    return `
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-label="一九六二年香港風球訊號規例">
        <div class="modal-card manual-modal">
          <div class="modal-header">
            <h2>一九六二年香港熱帶氣旋警告訊號表</h2>
            <button type="button" class="btn-close" data-action="close-modal">關閉</button>
          </div>
          <p class="manual-note">
            註：一九六二年香港仍採用一號、三號、五號（西北）、六號（西南）、七號（東北）、八號（東南）、九號及十號制度（一九七三年起方將五至八號統一改稱為八號西北／西南／東北／東南烈風訊號）。
          </p>
          <div class="manual-list">
            ${SIGNALS_1962.filter((s) => s.code > 0)
              .map(
                (s) => `
              <div class="manual-row">
                <img src="${s.art}" alt="${s.nameZh}" class="manual-sig-img" />
                <div class="manual-row-text">
                  <strong>${s.nameZh}（夜燈：${s.lightsZh}）</strong>
                  <span>日間形狀：${s.shapeZh}</span>
                  <span>懸掛標準：${s.windCriterion}</span>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    `;
  }

  _bindEvents() {
    const qAll = (sel) => Array.from(this.root.querySelectorAll(sel));

    qAll('[data-action="toggle-mute"]').forEach((btn) =>
      btn.addEventListener('click', () => {
        this.sound.toggleMute();
        this.render();
      })
    );

    qAll('[data-action="start-new"]').forEach((btn) =>
      btn.addEventListener('click', () => this.startNewCampaign(0))
    );

    qAll('[data-action="continue-game"]').forEach((btn) =>
      btn.addEventListener('click', () => this.continueSavedCampaign())
    );

    qAll('[data-action="back-title"]').forEach((btn) =>
      btn.addEventListener('click', () => {
        this.state.screen = 'title';
        this.modal = null;
        this.render();
      })
    );

    qAll('[data-action="open-chapters"]').forEach((btn) =>
      btn.addEventListener('click', () => {
        this.modal = 'chapters';
        this.render();
      })
    );

    qAll('[data-action="open-manual"]').forEach((btn) =>
      btn.addEventListener('click', () => {
        this.modal = 'manual';
        this.render();
      })
    );

    qAll('[data-action="close-modal"]').forEach((btn) =>
      btn.addEventListener('click', () => {
        this.modal = null;
        this.render();
      })
    );

    qAll('[data-jump-storm]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-jump-storm')) || 0;
        this.startNewCampaign(idx);
      })
    );

    qAll('[data-action="enter-desk"]').forEach((btn) =>
      btn.addEventListener('click', () => this.enterShiftDesk())
    );

    qAll('[data-tab]').forEach((btn) =>
      btn.addEventListener('click', () => {
        this.state.deskTab = btn.getAttribute('data-tab');
        this.sound.play('paper');
        this.render();
      })
    );

    qAll('[data-select-track]').forEach((btn) =>
      btn.addEventListener('click', () => {
        this.state.draft.trackId = btn.getAttribute('data-select-track');
        this.sound.play('paper');
        this.render();
      })
    );

    qAll('[data-track-svg]').forEach((el) =>
      el.addEventListener('click', () => {
        this.state.draft.trackId = el.getAttribute('data-track-svg');
        this.sound.play('paper');
        this.render();
      })
    );

    qAll('[data-conf]').forEach((btn) =>
      btn.addEventListener('click', () => {
        this.state.draft.confidence = btn.getAttribute('data-conf');
        this.sound.play('paper');
        this.render();
      })
    );

    qAll('[data-select-tg]').forEach((btn) =>
      btn.addEventListener('click', () => {
        this.activeTelegramIdx = Number(btn.getAttribute('data-select-tg')) || 0;
        this.sound.play('teleprinter');
        this.render();
      })
    );

    qAll('[data-toggle-act]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-toggle-act');
        this.state.draft.actions[key] = !this.state.draft.actions[key];
        this.sound.play('phone');
        this.render();
      })
    );

    qAll('[data-select-signal]').forEach((btn) =>
      btn.addEventListener('click', () => {
        this.state.draft.signalCode = Number(btn.getAttribute('data-select-signal'));
        this.sound.play('paper');
        this.render();
      })
    );

    qAll('[data-action="commit-shift"]').forEach((btn) =>
      btn.addEventListener('click', () => this.commitShiftDecision())
    );

    qAll('[data-action="next-shift"]').forEach((btn) =>
      btn.addEventListener('click', () => this.advanceAfterOutcome())
    );

    qAll('[data-action="next-storm"]').forEach((btn) =>
      btn.addEventListener('click', () => this.advanceAfterDebrief())
    );
  }
}

if (typeof document !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const appRoot = document.getElementById('app');
    if (appRoot) {
      const game = new SignalTenGame(appRoot);
      window.__signalTenGame = game;
      game.render();
    }
  });
}
