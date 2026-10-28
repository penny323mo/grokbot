/**
 * 濠江疑案 · Harbour Casebook
 * 主應用程式核心協調器 (Main Application Controller)
 * 依照 SPEC 要求實作：現場 / 筆記 / 推理 / 選單 四頁籤、三階段引導、音量滑桿與純淨向量圖標
 */

import { CASES } from './data/cases.js';
import { storage } from './engine/storage.js';
import { audio } from './engine/audio.js';
import { SceneRenderer } from './render/scene-renderer.js';
import { BottomSheet } from './render/bottom-sheet.js';
import { NotebookTab } from './render/notebook-tab.js';
import { DeductionSheet } from './render/deduction-sheet.js';
import { CaseBoard } from './render/case-board.js';
import { EpilogueModal } from './render/epilogue-modal.js';
import { ICONS } from './utils/icons.js';

class App {
  constructor() {
    this.storage = storage;
    this.audio = audio;
    this.cases = CASES;
    this.currentCaseId = 1;
    this.activeTab = 'scene'; // 'scene' | 'notebook' | 'deduction' | 'menu'
    this.currentScreen = 'title'; // 'title' | 'board' | 'game'
    this.onboardingStep = 1; // 1 | 2 | 3 | 4 (completed)

    this.initDOM();
    this.initControllers();
    this.bindGlobalEvents();
  }

  initDOM() {
    this.appRoot = document.getElementById('app');
    this.appRoot.innerHTML = `
      <!-- Title Screen -->
      <section id="screen-title" class="screen-view is-active">
        <div class="title-key-art-bg" aria-hidden="true"></div>
        <div class="title-scrim-overlay" aria-hidden="true"></div>
        <div class="title-container">
          <div class="title-top-archival">
            <span class="title-date-badge">1962 · 澳門內港</span>
            <a href="https://penny323mo.github.io/grokbot/" class="link-grokbot-title" target="_blank" rel="noopener noreferrer">
              ← 返回 grokbot
            </a>
          </div>

          <div class="title-emblem-box">
            <div class="title-dossier-seal">
              <img src="assets/ui/seal_title.webp" class="seal-title-img" alt="總督府案卷印" />
            </div>
            <h1 class="main-game-title">濠江疑案</h1>
            <h2 class="main-game-subtitle">HARBOUR CASEBOOK · 1962</h2>
            <div class="title-ink-divider">
              <img src="assets/ui/ink_rule.webp" class="title-rule-img" alt="" />
            </div>
            <p class="title-pitch">重回一九六二年澳門內港。在泛黃案卷中蒐證、推演與指認，揭開橫跨四案的殖民黑幕。</p>
          </div>

          <div class="title-actions">
            <button class="btn-primary-start" id="btn-start-game">
              <span class="btn-ink-symbol">${ICONS.pen(18, 'currentColor')}</span> 開始調查
            </button>
            <button class="btn-secondary-board" id="btn-view-board">
              案件目錄
            </button>
          </div>

          <div class="title-footer-links">
            <a href="https://penny323mo.github.io/grokbot/" class="btn-title-grokbot" target="_blank" rel="noopener noreferrer">
              返回 grokbot 主站
            </a>
          </div>
        </div>
      </section>

      <!-- Case Board Screen -->
      <section id="screen-board" class="screen-view">
        <div id="board-container" class="board-wrapper"></div>
      </section>

      <!-- Main Game Workspace Screen -->
      <section id="screen-game" class="screen-view">
        <!-- Top App Bar -->
        <header class="game-top-bar">
          <button class="btn-back-board" id="btn-game-back" aria-label="返回目錄">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span class="back-txt">卷宗</span>
          </button>
          <div class="game-top-title-group">
            <span class="game-case-badge" id="top-case-badge">CASE 01</span>
            <h2 class="game-case-name" id="top-case-title">當舖驚魂</h2>
          </div>
          <button class="btn-open-menu" id="btn-top-menu" aria-label="開啟選單">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="7" x2="20" y2="7"></line>
              <line x1="4" y1="12" x2="20" y2="12"></line>
              <line x1="4" y1="17" x2="20" y2="17"></line>
            </svg>
          </button>
        </header>

        <!-- Onboarding Tutorial Banner (3-step progressive guide) -->
        <div id="onboarding-banner" class="onboarding-guide-banner is-hidden">
          <div class="guide-inner">
            <span class="guide-lightbulb">${ICONS.lamp(18, '#9A3B2C')}</span>
            <div class="guide-text" id="guide-text">
              <strong>第 1 步：</strong>在現場點擊閃爍光圈，勘查物證細節。
            </div>
            <button class="guide-close-btn" id="btn-close-guide" aria-label="關閉引導">&times;</button>
          </div>
        </div>

        <!-- Tab 1: Scene Viewport Container -->
        <main id="tab-content-scene" class="game-tab-panel is-active">
          <div id="scene-host" class="scene-container-inner"></div>
        </main>

        <!-- Tab 2: Notebook Container (SPEC §6 筆記) -->
        <main id="tab-content-notebook" class="game-tab-panel">
          <div id="notebook-host" class="notebook-container-inner"></div>
        </main>

        <!-- Tab 3: Deduction Notebook Container -->
        <main id="tab-content-deduction" class="game-tab-panel">
          <div id="deduction-host" class="deduction-container-inner"></div>
        </main>

        <!-- Tab 4: Settings & Menu View -->
        <main id="tab-content-menu" class="game-tab-panel">
          <div class="menu-settings-card">
            <div class="menu-header">
              <h3 class="menu-title">卷宗設置與輔助</h3>
              <p class="menu-subtitle">濠江疑案 · 1962 Archival Notebook</p>
            </div>

            <div class="settings-group">
              <h4 class="settings-group-title">配樂與音效</h4>
              <div class="setting-item">
                <span class="setting-label">背景音樂 (BGM)</span>
                <label class="switch">
                  <input type="checkbox" id="check-music" checked>
                  <span class="slider"></span>
                </label>
              </div>
              <div class="setting-slider-item">
                <span class="setting-sublabel">音樂音量</span>
                <input type="range" id="slider-music" min="0" max="1" step="0.05" value="0.7" class="archival-slider">
              </div>

              <div class="setting-item">
                <span class="setting-label">物證音效 (SFX)</span>
                <label class="switch">
                  <input type="checkbox" id="check-sfx" checked>
                  <span class="slider"></span>
                </label>
              </div>
              <div class="setting-slider-item">
                <span class="setting-sublabel">音效音量</span>
                <input type="range" id="slider-sfx" min="0" max="1" step="0.05" value="0.8" class="archival-slider">
              </div>
            </div>

            <div class="settings-group">
              <h4 class="settings-group-title">字級偏好</h4>
              <div class="setting-item">
                <span class="setting-label">文字大小</span>
                <div class="text-size-toggle">
                  <button class="btn-text-size is-active" data-size="normal">標準</button>
                  <button class="btn-text-size" data-size="large">大字</button>
                </div>
              </div>
            </div>

            <div class="settings-group">
              <h4 class="settings-group-title">外部導航</h4>
              <a href="https://penny323mo.github.io/grokbot/" class="btn-menu-grokbot" target="_blank" rel="noopener noreferrer">
                <span class="menu-link-icon">←</span> 返回 grokbot 主站
              </a>
            </div>

            <div class="settings-group">
              <h4 class="settings-group-title">進度重設</h4>
              <button class="btn-danger-reset" id="btn-reset-progress">
                清空本機存檔重新開始
              </button>
            </div>
          </div>
        </main>

        <!-- Bottom Thumb Tab Bar (現場 / 筆記 / 推理 / 選單) -->
        <nav class="bottom-tab-bar">
          <button class="nav-tab-btn is-active" data-tab="scene" aria-label="勘驗現場">
            <span class="tab-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
              </svg>
            </span>
            <span class="tab-label">現場</span>
            <span class="tab-badge" id="badge-clues">0</span>
          </button>

          <button class="nav-tab-btn" data-tab="notebook" aria-label="物證筆記">
            <span class="tab-icon">
              ${ICONS.notebook(20, 'currentColor')}
            </span>
            <span class="tab-label">筆記</span>
          </button>

          <button class="nav-tab-btn" data-tab="deduction" aria-label="推理卷宗">
            <span class="tab-icon">
              ${ICONS.scroll(20, 'currentColor')}
            </span>
            <span class="tab-label">推理</span>
            <span class="tab-badge is-progress" id="badge-deduction">0/2</span>
          </button>

          <button class="nav-tab-btn" data-tab="menu" aria-label="系統選單">
            <span class="tab-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </span>
            <span class="tab-label">選單</span>
          </button>
        </nav>
      </section>
    `;
  }

  initControllers() {
    // 1. Bottom Sheet for clue inspection
    this.bottomSheet = new BottomSheet({
      onWordCollect: (word, hotspot) => {
        storage.collectWord(this.currentCaseId, word);
        this.updateBadges();
        this.updateSceneState();
        this.advanceOnboarding(2); // Word collected -> go to step 3
      },
      onClose: (hotspot) => {
        this.updateBadges();
        this.updateSceneState();
      }
    });

    // 2. Scene Renderer
    const sceneHost = document.getElementById('scene-host');
    this.sceneRenderer = new SceneRenderer(sceneHost, {
      onHotspotClick: (hotspot) => {
        storage.markHotspotDiscovered(this.currentCaseId, hotspot.id);
        const caseState = storage.getCaseState(this.currentCaseId);
        this.bottomSheet.show(hotspot, new Set(caseState.collectedWords || []));
        this.updateBadges();
        this.advanceOnboarding(1); // Hotspot inspected -> go to step 2
      }
    });

    // 3. Notebook Tab
    const notebookHost = document.getElementById('notebook-host');
    this.notebookTab = new NotebookTab(notebookHost);

    // 4. Deduction Sheet
    const deductionHost = document.getElementById('deduction-host');
    this.deductionSheet = new DeductionSheet(deductionHost, {
      onCaseSolved: (caseData) => {
        this.advanceOnboarding(3);
        this.updateBadges();
        this.caseBoard.render();
      },
      onViewEpilogue: (caseData) => {
        this.epilogueModal.show(caseData);
      },
      onSlotFill: () => {
        this.advanceOnboarding(3);
      }
    });

    // 5. Case Board
    const boardContainer = document.getElementById('board-container');
    this.caseBoard = new CaseBoard(boardContainer, {
      cases: this.cases,
      onSelectCase: (caseId) => {
        this.openCase(caseId);
      },
      onViewEpilogue: (caseData) => {
        this.epilogueModal.show(caseData);
      }
    });

    // 6. Epilogue Modal
    this.epilogueModal = new EpilogueModal({
      onNextCase: (nextCaseId) => {
        this.openCase(nextCaseId);
      },
      onBackToBoard: () => {
        this.showScreen('board');
        this.caseBoard.render();
      }
    });
  }

  bindGlobalEvents() {
    // Audio gesture unlock on first user click or touch
    const unlockAudio = () => {
      audio.initOnUserGesture();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });

    // Title screen buttons
    document.getElementById('btn-start-game').addEventListener('click', () => {
      audio.playSFX('paper_slide');
      let targetId = 1;
      for (let i = 1; i <= 4; i++) {
        if (storage.isCaseUnlocked(i) && !storage.isCaseSolved(i)) {
          targetId = i;
          break;
        }
      }
      this.openCase(targetId);
    });

    document.getElementById('btn-view-board').addEventListener('click', () => {
      audio.playSFX('paper_slide');
      this.showScreen('board');
      this.caseBoard.render();
    });

    // Game screen top bar
    document.getElementById('btn-game-back').addEventListener('click', () => {
      audio.playSFX('paper_slide');
      this.showScreen('board');
      this.caseBoard.render();
    });

    document.getElementById('btn-top-menu').addEventListener('click', () => {
      this.switchTab('menu');
    });

    // Bottom Tab Bar
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tab = btn.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Onboarding close
    document.getElementById('btn-close-guide').addEventListener('click', () => {
      document.getElementById('onboarding-banner').classList.add('is-hidden');
      storage.state.onboardingDone = true;
      storage.save();
    });

    // Settings Menu toggles & volume sliders (MAJOR #6)
    const checkMusic = document.getElementById('check-music');
    const checkSfx = document.getElementById('check-sfx');
    const sliderMusic = document.getElementById('slider-music');
    const sliderSfx = document.getElementById('slider-sfx');
    const settings = storage.getSettings();

    checkMusic.checked = !settings.musicMuted;
    checkSfx.checked = !settings.sfxMuted;
    sliderMusic.value = settings.musicVolume !== undefined ? settings.musicVolume : 0.7;
    sliderSfx.value = settings.sfxVolume !== undefined ? settings.sfxVolume : 0.8;

    checkMusic.addEventListener('change', () => {
      audio.setMusicMuted(!checkMusic.checked);
    });

    checkSfx.addEventListener('change', () => {
      audio.setSfxMuted(!checkSfx.checked);
    });

    sliderMusic.addEventListener('input', () => {
      const val = parseFloat(sliderMusic.value);
      audio.setMusicVolume(val);
    });

    sliderSfx.addEventListener('input', () => {
      const val = parseFloat(sliderSfx.value);
      storage.updateSettings({ sfxVolume: val });
    });

    // Text size buttons
    document.querySelectorAll('.btn-text-size').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-text-size').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const size = btn.getAttribute('data-size');
        storage.updateSettings({ textSize: size });
        document.documentElement.classList.toggle('text-large', size === 'large');
      });
    });

    // Reset progress
    document.getElementById('btn-reset-progress').addEventListener('click', () => {
      if (window.confirm('確定要清空所有偵查紀錄與推理筆記嗎？此操作不可逆。')) {
        storage.resetAll();
        audio.playSFX('stamp_thud');
        alert('存檔已清空。即將返回主標題。');
        this.showScreen('title');
      }
    });
  }

  advanceOnboarding(currentStep) {
    if (this.currentCaseId !== 1 || storage.state.onboardingDone) return;
    const banner = document.getElementById('onboarding-banner');
    const textEl = document.getElementById('guide-text');
    if (!banner || !textEl) return;

    if (currentStep === 1) {
      // Hotspot inspected -> Step 2
      this.onboardingStep = 2;
      textEl.innerHTML = `<strong>第 2 步：</strong>在物證描述中，點擊帶墨線的詞語收錄至筆記庫。`;
    } else if (currentStep === 2) {
      // Word collected -> Step 3
      this.onboardingStep = 3;
      textEl.innerHTML = `<strong>第 3 步：</strong>切換至「推理」頁籤，將已收集詞語填入空白重組真相。`;
    } else if (currentStep >= 3) {
      // Step 3 finished (blank filled) -> Complete onboarding!
      this.onboardingStep = 4;
      storage.state.onboardingDone = true;
      storage.save();
      banner.classList.add('is-hidden');
    }
  }

  showScreen(screenName) {
    this.currentScreen = screenName;
    document.querySelectorAll('.screen-view').forEach(s => s.classList.remove('is-active'));
    const target = document.getElementById(`screen-${screenName}`);
    if (target) {
      target.classList.add('is-active');
    }

    if (screenName === 'game') {
      audio.playBGM('investigation');
    } else if (screenName === 'title') {
      audio.stopBGM();
    }
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    audio.playSFX('paper_slide');

    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('is-active', btn.getAttribute('data-tab') === tabName);
    });

    document.querySelectorAll('.game-tab-panel').forEach(panel => {
      panel.classList.toggle('is-active', panel.id === `tab-content-${tabName}`);
    });

    const curCase = this.cases.find(c => c.id === this.currentCaseId);
    if (tabName === 'scene') {
      this.sceneRenderer.resetView();
    } else if (tabName === 'notebook') {
      if (curCase) this.notebookTab.render(curCase);
    } else if (tabName === 'deduction') {
      if (curCase) this.deductionSheet.render(curCase);
    }
  }

  openCase(caseId) {
    this.currentCaseId = caseId;
    const caseData = this.cases.find(c => c.id === caseId) || this.cases[0];

    // Update Header
    document.getElementById('top-case-badge').textContent = `CASE 0${caseData.id}`;
    document.getElementById('top-case-title').textContent = `〈${caseData.symbol}〉 ${caseData.title}`;

    // Onboarding guide for Case 1 (progressive 3-step)
    const guideBanner = document.getElementById('onboarding-banner');
    if (caseId === 1 && !storage.state.onboardingDone) {
      this.onboardingStep = 1;
      document.getElementById('guide-text').innerHTML = `<strong>第 1 步：</strong>在現場點擊閃爍光圈，勘查物證細節。`;
      guideBanner.classList.remove('is-hidden');
    } else {
      guideBanner.classList.add('is-hidden');
    }

    // Load Scene
    const caseState = storage.getCaseState(caseId);
    const discoveredIds = caseState.discoveredHotspots || [];
    const harvestedIds = this.calculateHarvestedHotspots(caseData, caseState.collectedWords || []);

    this.sceneRenderer.loadScene(caseData.sceneImage, caseData.hotspots, discoveredIds, harvestedIds);

    // Prepare Deduction Sheet & Notebook
    this.deductionSheet.render(caseData);
    this.notebookTab.render(caseData);

    // Switch to Scene tab
    this.showScreen('game');
    this.switchTab('scene');
    this.updateBadges();
  }

  calculateHarvestedHotspots(caseData, collectedWords = []) {
    const collectedSet = new Set(collectedWords);
    const harvested = [];

    caseData.hotspots.forEach(h => {
      const regex = /data-word="([^"]+)"/g;
      let match;
      let totalInHotspot = 0;
      let collectedInHotspot = 0;
      while ((match = regex.exec(h.desc)) !== null) {
        totalInHotspot++;
        if (collectedSet.has(match[1])) {
          collectedInHotspot++;
        }
      }
      if (totalInHotspot > 0 && collectedInHotspot === totalInHotspot) {
        harvested.push(h.id);
      }
    });

    return harvested;
  }

  updateSceneState() {
    const caseData = this.cases.find(c => c.id === this.currentCaseId);
    if (!caseData) return;
    const caseState = storage.getCaseState(this.currentCaseId);
    const harvestedIds = this.calculateHarvestedHotspots(caseData, caseState.collectedWords || []);
    this.sceneRenderer.updateHotspotState(caseState.discoveredHotspots, harvestedIds);
  }

  updateBadges() {
    const caseData = this.cases.find(c => c.id === this.currentCaseId);
    if (!caseData) return;
    const caseState = storage.getCaseState(this.currentCaseId);

    // Badge clues: count of collected words
    const clueCount = (caseState.collectedWords || []).length;
    const badgeClues = document.getElementById('badge-clues');
    if (badgeClues) {
      badgeClues.textContent = `${clueCount}`;
    }

    // Badge deduction: solved sections
    const solvedCount = (caseState.solvedSections || []).length;
    const totalSecs = caseData.deductionSections.length;
    const badgeDed = document.getElementById('badge-deduction');
    if (badgeDed) {
      badgeDed.textContent = `${solvedCount}/${totalSecs}`;
    }
  }
}

// Bootstrap once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
