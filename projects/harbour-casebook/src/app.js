/**
 * 濠江疑案 · Harbour Casebook
 * 案頭總覽核心協調器 (Diegetic Detective-Desk Rebuild)
 * 以 1962 探長案頭為核心：無底部導航欄，點擊案頭實物切換現場、筆記、軟木板與推理報告
 */

import { CASES } from './data/cases.js';
import { storage } from './engine/storage.js';
import { audio } from './engine/audio.js';
import { DeskHub } from './render/desk-hub.js';
import { SceneRenderer } from './render/scene-renderer.js';
import { BottomSheet } from './render/bottom-sheet.js';
import { NotebookTab } from './render/notebook-tab.js';
import { DeductionSheet } from './render/deduction-sheet.js';
import { Corkboard } from './render/corkboard.js';
import { PhoneMenu } from './render/phone-menu.js';
import { CaseBoard } from './render/case-board.js';
import { EpilogueModal } from './render/epilogue-modal.js';
import { ICONS } from './utils/icons.js';

class App {
  constructor() {
    this.storage = storage;
    this.audio = audio;
    this.cases = CASES;
    this.currentCaseId = 1;
    this.currentScreen = 'title'; // 'title' | 'desk' | 'scene' | 'deduction' | 'cork' | 'notebook' | 'menu' | 'board'
    this.onboardingStep = 1;

    this.initDOM();
    this.initControllers();
    this.bindGlobalEvents();
  }

  initDOM() {
    this.appRoot = document.getElementById('app');
    this.appRoot.innerHTML = `
      <!-- 1. Title Screen (Full-bleed key art, soft scrim, no solid beige box) -->
      <section id="screen-title" class="screen-view is-active">
        <div class="title-key-art-bg" aria-hidden="true"></div>
        <div class="title-scrim-overlay" aria-hidden="true"></div>
        <div class="title-container">
          <div class="title-top-archival">
            <span class="title-archival-docket">POLÍCIA DE SEGURANÇA PÚBLICA · PROC. 1962</span>
            <a href="https://penny323mo.github.io/grokbot/" class="link-grokbot-title" target="_blank" rel="noopener noreferrer">
              檔案主站 grokbot
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
            <p class="title-pitch">重回一九六二年澳門內港。在案頭泛黃案卷中<span style="white-space: nowrap;">蒐證</span>、推演與指認，揭開橫跨四案的殖民黑幕。</p>
          </div>

          <div class="title-actions">
            <button class="btn-title-casebook-dossier" id="btn-start-game" aria-label="開卷 · 調查現場">
              <span class="dossier-ink-seal"></span>
              <span class="dossier-calligraphy">開卷 · 調查現場</span>
            </button>
            <button class="btn-title-drawer-tab" id="btn-view-board" aria-label="案件目錄">
              <span class="drawer-tab-manila">抽屜卷宗目錄</span>
            </button>
          </div>

          <div class="title-footer-credits">
            <span class="credits-tag">澳門治安警察廳 · 刑事偵查檔案 · 1962年十月存案</span>
          </div>
        </div>
      </section>

      <!-- 2. Diegetic Desk Hub Screen (Primary Hub) -->
      <section id="screen-desk" class="screen-view">
        <div id="desk-host" class="desk-host-inner"></div>
      </section>

      <!-- 3. Scene Investigation Screen (Diegetic Paper Tags, No Boxed Top Bar) -->
      <section id="screen-scene" class="screen-view">
        <header class="scene-top-bar">
          <button class="scene-diegetic-tab scene-tab-back btn-back-to-desk" id="btn-scene-back-desk" aria-label="返回案頭">
            <span class="tag-grommet"></span>
            <span class="tag-label">← 案頭</span>
          </button>
          <div class="scene-docket-stamp">
            <span class="scene-docket-text" id="scene-case-title">〈押〉德生大押 · 現場勘查</span>
          </div>
          <button class="scene-diegetic-tab scene-tab-report" id="btn-scene-go-deduction" aria-label="推理報告">
            <span class="tag-label">推理報告 →</span>
          </button>
        </header>

        <!-- Onboarding Tutorial Banner (Case 1 only) -->
        <div id="onboarding-banner" class="onboarding-guide-banner is-hidden">
          <div class="guide-inner">
            <span class="guide-lightbulb">${ICONS.lamp(18, '#9A3B2C')}</span>
            <div class="guide-text" id="guide-text">
              <strong>第 1 步：</strong>在現場點擊紅色線索圈，勘查物證與證言。
            </div>
            <button class="guide-close-btn" id="btn-close-guide" aria-label="關閉引導">&times;</button>
          </div>
        </div>

        <!-- Scene Viewport Host -->
        <main class="scene-workspace">
          <div id="scene-host" class="scene-container-inner"></div>
        </main>
      </section>

      <!-- 4. Deduction Report Screen (police_report.webp) -->
      <section id="screen-deduction" class="screen-view">
        <div id="deduction-host" class="deduction-container-inner"></div>
      </section>

      <!-- 5. Corkboard Screen (corkboard.webp - Who's Who) -->
      <section id="screen-cork" class="screen-view">
        <div id="corkboard-host" class="corkboard-container-inner"></div>
      </section>

      <!-- 6. Notebook Screen (notebook_open.webp - Word Bank) -->
      <section id="screen-notebook" class="screen-view">
        <div id="notebook-host" class="notebook-container-inner"></div>
      </section>

      <!-- 7. Rotary Phone Menu Screen (Settings & Grokbot) -->
      <section id="screen-menu" class="screen-view">
        <div id="menu-host" class="menu-container-inner"></div>
      </section>

      <!-- 8. Case Board Screen (Secondary Dossier Directory) -->
      <section id="screen-board" class="screen-view">
        <div id="board-container" class="board-wrapper"></div>
      </section>
    `;
  }

  initControllers() {
    // 1. Desk Hub Controller
    const deskHost = document.getElementById('desk-host');
    this.deskHub = new DeskHub(deskHost, {
      onNavigate: (viewName) => {
        if (viewName === 'scene') {
          this.openScene();
        } else if (viewName === 'deduction') {
          this.openDeduction();
        } else if (viewName === 'cork') {
          this.openCorkboard();
        } else if (viewName === 'notebook') {
          this.openNotebook();
        } else if (viewName === 'menu') {
          this.openMenu();
        } else if (viewName === 'board') {
          this.showScreen('board');
          this.caseBoard.render();
        }
      }
    });

    // 2. Bottom Sheet for clue inspection
    this.bottomSheet = new BottomSheet({
      onWordCollect: (word, hotspot) => {
        storage.collectWord(this.currentCaseId, word);
        this.updateSceneState();
        const caseState = storage.getCaseState(this.currentCaseId);
        const collectedCount = (caseState.collectedWords || []).length;
        if (collectedCount >= 34) {
          this.advanceOnboarding(4);
        } else {
          this.advanceOnboarding(3);
        }
      },
      onClose: (hotspot) => {
        this.updateSceneState();
      }
    });

    // 3. Scene Renderer
    const sceneHost = document.getElementById('scene-host');
    this.sceneRenderer = new SceneRenderer(sceneHost, {
      onHotspotClick: (hotspot) => {
        storage.markHotspotDiscovered(this.currentCaseId, hotspot.id);
        const caseState = storage.getCaseState(this.currentCaseId);
        this.bottomSheet.show(hotspot, new Set(caseState.collectedWords || []));
        this.advanceOnboarding(2);
      }
    });

    // 4. Deduction Sheet
    const deductionHost = document.getElementById('deduction-host');
    this.deductionSheet = new DeductionSheet(deductionHost, {
      onCaseSolved: (caseData) => {
        this.advanceOnboarding(3);
        this.caseBoard.render();
      },
      onViewEpilogue: (caseData) => {
        this.epilogueModal.show(caseData);
      },
      onSlotFill: () => {
        this.advanceOnboarding(3);
      },
      onBackToDesk: () => {
        this.openDeskHub();
      },
      onGoToScene: () => {
        this.openScene();
      },
      onGoToCorkboard: () => {
        this.openCorkboard();
      }
    });

    // 5. Corkboard (Who's Who)
    const corkboardHost = document.getElementById('corkboard-host');
    this.corkboard = new Corkboard(corkboardHost, {
      onWhoSolved: (caseData) => {
        const cd = caseData || this.cases.find(c => c.id === this.currentCaseId) || this.cases[0];
        this.deductionSheet.render(cd);
        this.caseBoard.render();
      },
      onBackToDesk: () => {
        this.openDeskHub();
      }
    });

    // 6. Notebook Tab (Word Bank)
    const notebookHost = document.getElementById('notebook-host');
    this.notebookTab = new NotebookTab(notebookHost, {
      onBackToDesk: () => {
        this.openDeskHub();
      }
    });

    // 7. Phone Menu (Settings)
    const menuHost = document.getElementById('menu-host');
    this.phoneMenu = new PhoneMenu(menuHost, {
      onBackToDesk: () => {
        this.openDeskHub();
      },
      onResetGame: () => {
        this.showScreen('title');
      }
    });

    // 8. Case Board
    const boardContainer = document.getElementById('board-container');
    this.caseBoard = new CaseBoard(boardContainer, {
      cases: this.cases,
      onSelectCase: (caseId) => {
        this.currentCaseId = caseId;
        this.openDeskHub();
      },
      onViewEpilogue: (caseData) => {
        this.epilogueModal.show(caseData);
      },
      onBackToDesk: () => {
        this.openDeskHub();
      }
    });

    // 9. Epilogue Modal
    this.epilogueModal = new EpilogueModal({
      onNextCase: (nextCaseId) => {
        this.currentCaseId = nextCaseId;
        this.openDeskHub();
      },
      onBackToBoard: () => {
        this.openDeskHub();
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
      this.currentCaseId = targetId;
      this.openDeskHub();
    });

    document.getElementById('btn-view-board').addEventListener('click', () => {
      audio.playSFX('paper_slide');
      this.showScreen('board');
      this.caseBoard.render();
    });

    // Scene Top Bar Navigation
    document.getElementById('btn-scene-back-desk').addEventListener('click', () => {
      audio.playSFX('paper_slide');
      this.openDeskHub();
    });

    document.getElementById('btn-scene-go-deduction').addEventListener('click', () => {
      audio.playSFX('paper_slide');
      this.openDeduction();
    });

    // Onboarding close
    document.getElementById('btn-close-guide').addEventListener('click', () => {
      document.getElementById('onboarding-banner').classList.add('is-hidden');
      storage.state.onboardingDone = true;
      storage.save();
    });
  }

  openDeskHub() {
    const curCase = this.cases.find(c => c.id === this.currentCaseId) || this.cases[0];
    this.deskHub.render(curCase);
    this.showScreen('desk');
    // Subtle sparse ambient desk atmosphere
    audio.playSFX('clock_tick');
  }

  openScene() {
    const caseData = this.cases.find(c => c.id === this.currentCaseId) || this.cases[0];

    // Update Header if elements exist
    const badge = document.getElementById('scene-case-badge');
    if (badge) badge.textContent = `CASE 0${caseData.id}`;
    const title = document.getElementById('scene-case-title');
    if (title) title.textContent = `〈${caseData.symbol}〉 ${caseData.title}`;

    // Onboarding guide for Case 1 (strictly monotonic & dismissible)
    this.updateOnboardingBanner();

    // Load Scene
    const caseState = storage.getCaseState(this.currentCaseId);
    const discoveredIds = caseState.discoveredHotspots || [];
    const harvestedIds = this.calculateHarvestedHotspots(caseData, caseState.collectedWords || []);

    this.showScreen('scene');
    this.sceneRenderer.loadScene(caseData.sceneImage, caseData.hotspots, discoveredIds, harvestedIds);
    this.sceneRenderer.resetView();
  }

  openDeduction() {
    this.advanceOnboarding(4);
    const caseData = this.cases.find(c => c.id === this.currentCaseId) || this.cases[0];
    this.deductionSheet.render(caseData);
    this.showScreen('deduction');
  }

  openCorkboard() {
    const caseData = this.cases.find(c => c.id === this.currentCaseId) || this.cases[0];
    this.corkboard.render(caseData);
    this.showScreen('cork');
  }

  openNotebook() {
    const caseData = this.cases.find(c => c.id === this.currentCaseId) || this.cases[0];
    this.notebookTab.render(caseData);
    this.showScreen('notebook');
  }

  openMenu() {
    this.phoneMenu.render();
    this.showScreen('menu');
  }

  openCase(caseId) {
    this.currentCaseId = caseId;
    this.openScene();
  }

  updateOnboardingBanner() {
    const banner = document.getElementById('onboarding-banner');
    const textEl = document.getElementById('guide-text');
    if (!banner || !textEl) return;
    if (this.currentCaseId !== 1 || storage.state.onboardingDone || this.onboardingStep >= 4) {
      banner.classList.add('is-hidden');
      return;
    }
    if (this.onboardingStep === 1) {
      textEl.innerHTML = `<strong>第 1 步：</strong>在現場點擊紅色線索圈，勘查<span style="white-space: nowrap;">物證細節</span>。`;
    } else if (this.onboardingStep === 2) {
      textEl.innerHTML = `<strong>第 2 步：</strong>在物證描述中，點擊帶底線<span style="white-space: nowrap;">詞語</span>收錄至案頭筆記。`;
    } else if (this.onboardingStep === 3) {
      textEl.innerHTML = `<strong>第 3 步：</strong>點擊右上角「推理報告」，將已收集<span style="white-space: nowrap;">詞語</span>填入案卷空白重組真相。`;
    }
    banner.classList.remove('is-hidden');
  }

  advanceOnboarding(toStep) {
    if (this.currentCaseId !== 1 || storage.state.onboardingDone) return;
    // Strictly monotonic progression: never decrease
    if (toStep > this.onboardingStep) {
      this.onboardingStep = toStep;
      if (this.onboardingStep >= 4) {
        storage.state.onboardingDone = true;
        storage.save();
        const banner = document.getElementById('onboarding-banner');
        if (banner) banner.classList.add('is-hidden');
      }
      this.updateOnboardingBanner();
    }
  }

  showScreen(screenName) {
    this.currentScreen = screenName;
    document.querySelectorAll('.screen-view').forEach(s => s.classList.remove('is-active'));
    const target = document.getElementById(`screen-${screenName}`);
    if (target) {
      target.classList.add('is-active');
    }

    if (screenName === 'title') {
      audio.stopBGM();
    } else {
      audio.playBGM('investigation');
    }
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
}

// Bootstrap once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
