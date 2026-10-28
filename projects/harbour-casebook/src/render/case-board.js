/**
 * 濠江疑案 · Harbour Casebook
 * 機密卷宗抽屜渲染器 (Diegetic Filing Drawer of Manila Folders)
 * 模擬自上俯瞰之警司機密公文木抽屜：四份手寫標籤公文夾、封線火漆印、結案硃砂印、推回把手與名片
 */

import { storage } from '../engine/storage.js';
import { audio } from '../engine/audio.js';

export class CaseBoard {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.cases = options.cases || [];
    this.onSelectCase = options.onSelectCase || (() => {});
    this.onViewEpilogue = options.onViewEpilogue || (() => {});
    this.onBackToDesk = options.onBackToDesk || (() => {});
    this.openFolderId = 1; // Default first unlocked case folder open
  }

  render() {
    let foldersHtml = '';

    this.cases.forEach((c, idx) => {
      const isUnlocked = storage.isCaseUnlocked(c.id);
      const isSolved = storage.isCaseSolved(c.id);
      const isOpen = this.openFolderId === c.id;

      // Staggered tab offset: 0, 24%, 48%, 72%
      const tabLeftPercent = idx * 24;

      foldersHtml += `
        <article class="manila-filing-folder ${isUnlocked ? 'is-unlocked' : 'is-locked'} ${isSolved ? 'is-solved' : ''} ${isOpen ? 'is-open' : ''}" data-case-id="${c.id}">
          <!-- Staggered Physical Manila Tab -->
          <div class="folder-standing-tab" style="left: ${tabLeftPercent}%;" data-case-id="${c.id}">
            <div class="tab-label-text">
              <span class="tab-case-no">0${c.id}</span>
              <span class="tab-case-title">〈${c.symbol}〉 ${c.title}</span>
            </div>
            ${isSolved ? `
              <div class="tab-seal-jiean">
                <img src="assets/ui/seal_jiean_sm.webp" alt="結" />
              </div>
            ` : ''}
            ${!isUnlocked ? `
              <div class="tab-wax-seal">
                <span class="wax-seal-dot"></span>
              </div>
            ` : ''}
          </div>

          <!-- Folder Face & Inside Page -->
          <div class="folder-body-packet">
            <div class="folder-packet-header">
              <div class="folder-docket-line">
                <span class="docket-ref">PROC. CRIME N.º 62/1962 · CASE 0${c.id}</span>
                <span class="docket-loc">${c.location}</span>
              </div>
              <h3 class="folder-docket-title">〈${c.symbol}〉 ${c.title}</h3>
              <span class="folder-docket-date">${c.date}</span>
            </div>

            ${!isUnlocked ? `
              <div class="folder-locked-seals">
                <span class="locked-twine-line"></span>
                <div class="locked-twine-badge">
                  <span class="wax-seal-emblem">密</span>
                  <span class="wax-seal-text">〔 機密封簽 · 待前案破獲開封 〕</span>
                </div>
                <span class="locked-twine-line"></span>
              </div>
            ` : `
              <div class="folder-inside-content">
                <div class="telegram-dispatch-intro">
                  <span class="dispatch-badge">【加急公電 · 司法警察司】</span>
                  <p class="dispatch-body">${c.incidentIntro}</p>
                </div>

                ${isSolved ? `
                  <div class="folder-action-row">
                    <button class="btn-card-epilogue" data-case-id="${c.id}" type="button">
                      【 檢閱破案始末 · 《濠江紀實報》號外 】
                    </button>
                  </div>
                ` : `
                  <div class="folder-action-row">
                    <button class="btn-open-case folder-open-cta" data-case-id="${c.id}" type="button">
                      【 翻開卷宗 · 進入現場勘驗 】
                    </button>
                  </div>
                `}
              </div>
            `}
          </div>
        </article>
      `;
    });

    this.container.innerHTML = `
      <div class="case-board-view filing-drawer-view">
        <!-- Top Drawer Brass Lip & Push Back Handle -->
        <header class="filing-drawer-header">
          <div class="drawer-top-lip">
            <button class="drawer-brass-pull-handle btn-back-to-desk" id="btn-board-back-desk" type="button" aria-label="推回抽屜返回案頭">
              <span class="drawer-handle-bracket left"></span>
              <span class="drawer-handle-bar">
                <span class="handle-grip-lines"></span>
                <span class="drawer-handle-label">推回抽屜 · 返回案頭</span>
                <span class="handle-grip-lines"></span>
              </span>
              <span class="drawer-handle-bracket right"></span>
            </button>

            <!-- Vintage Calling Card Tucked in Corner -->
            <a href="https://penny323mo.github.io/grokbot/" class="drawer-tucked-calling-card" target="_blank" rel="noopener noreferrer" title="grokbot 總部專線">
              <span class="calling-card-pin"></span>
              <span class="calling-card-title">特派通訊員</span>
              <span class="calling-card-link">grokbot 專線 →</span>
            </a>
          </div>

          <!-- Stamped Drawer Frame Title -->
          <div class="drawer-frame-plaque">
            <h1 class="drawer-plaque-title">澳門司法警察司 · 機密卷宗抽屜</h1>
            <span class="drawer-plaque-sub">ARCHIVOS CONFIDENCIAIS · 1962年內港重案全四卷</span>
          </div>
        </header>

        <!-- Filing Drawer Interior Box with Suspended Manila Folders -->
        <main class="filing-drawer-cavity">
          <div class="filing-drawer-guide-rails"></div>
          <div class="filing-drawer-folders-stack">
            ${foldersHtml}
          </div>
        </main>

        <!-- Drawer Bottom Sill -->
        <footer class="drawer-bottom-sill">
          <span class="drawer-sill-label">澳門歷史檔案館 1962 巡督日誌複刻 · 離線本地存儲</span>
        </footer>
      </div>
    `;

    this.bindDOMEvents();
  }

  bindDOMEvents() {
    const backBtn = this.container.querySelector('#btn-board-back-desk');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        audio.playSFX('drawer');
        this.onBackToDesk();
      });
    }

    // Tab or card click to expand / open folder
    this.container.querySelectorAll('.folder-standing-tab, .manila-filing-folder').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('a')) return;
        const caseId = parseInt(el.getAttribute('data-case-id'), 10);
        if (storage.isCaseUnlocked(caseId)) {
          this.openFolderId = caseId;
          audio.playSFX('paper_slide');
          this.render();
        }
      });
    });

    this.container.querySelectorAll('.btn-open-case').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const caseId = parseInt(btn.getAttribute('data-case-id'), 10);
        audio.playSFX('paper_slide');
        this.onSelectCase(caseId);
      });
    });

    this.container.querySelectorAll('.btn-card-epilogue').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const caseId = parseInt(btn.getAttribute('data-case-id'), 10);
        const c = this.cases.find(x => x.id === caseId);
        if (c) {
          audio.playSFX('paper_slide');
          this.onViewEpilogue(c);
        }
      });
    });
  }
}
