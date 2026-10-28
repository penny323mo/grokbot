/**
 * 濠江疑案 · Harbour Casebook
 * 案件目錄卷宗架 (Case Board & Dossier Index Cards)
 * 純淨檔案卷宗卡片風格（不使用俗套軟木板），清晰展示進度、時間與結案印章
 */

import { storage } from '../engine/storage.js';
import { audio } from '../engine/audio.js';
import { ICONS } from '../utils/icons.js';

export class CaseBoard {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.cases = options.cases || [];
    this.onSelectCase = options.onSelectCase || (() => {});
    this.onViewEpilogue = options.onViewEpilogue || (() => {});
    this.onBackToDesk = options.onBackToDesk || (() => {});
  }

  render() {
    let cardsHtml = '';

    this.cases.forEach((c) => {
      const isUnlocked = storage.isCaseUnlocked(c.id);
      const isSolved = storage.isCaseSolved(c.id);
      const caseState = storage.getCaseState(c.id);
      const solvedSectionsCount = (caseState.solvedSections || []).length;
      const totalSections = c.deductionSections.length;
      const hintsUsed = caseState.hintsUsed || 0;
      const collectedCount = (caseState.collectedWords || []).length;

      cardsHtml += `
        <article class="case-dossier-card manila-case-folder ${isUnlocked ? 'is-unlocked' : 'is-locked'} ${isSolved ? 'is-solved' : ''}" data-case-id="${c.id}">
          <!-- Manila Folder Tab -->
          <div class="manila-folder-tab">
            <span class="tab-idx">CASE 0${c.id}</span>
            <span class="tab-proc">PROC. CRIME N.º 62/1962</span>
            <span class="tab-symbol">〈${c.symbol}〉</span>
          </div>

          <div class="manila-folder-body">
            <div class="folder-typed-header">
              <h3 class="folder-case-title">〈${c.symbol}〉 ${c.title}</h3>
              <span class="folder-meta-date">${c.date} · ${c.location}</span>
            </div>

            ${!isUnlocked ? `
              <div class="folder-string-and-seal">
                <span class="twine-seal-string"></span>
                <span class="string-tie-text">〔 機密封簽 · 待前案破獲開封 〕</span>
                <span class="twine-seal-string"></span>
              </div>
            ` : `
              <p class="folder-intro-snip">${c.incidentIntro.substring(0, 60)}……</p>
              ${isSolved ? `
                <div class="folder-epilogue-strip">
                  <button class="btn-card-epilogue" data-case-id="${c.id}">
                    【檢閱破案始末 · 《濠江紀實報》號外】
                  </button>
                </div>
              ` : `
                <div class="folder-open-prompt">
                  <span class="open-tab-hint">【翻開卷宗 · 進入現場勘驗】</span>
                </div>
              `}
            `}

            ${isSolved ? `
              <div class="dossier-card-stamp">
                <img class="card-seal-jiean" src="assets/ui/seal_jiean_sm.webp" alt="已結案" />
              </div>
            ` : ''}
          </div>
        </article>
      `;
    });

    this.container.innerHTML = `
      <div class="case-board-view filing-drawer-view">
        <!-- Manila Drawer Header (In-world filing drawer, no boxed web bar) -->
        <header class="board-drawer-header">
          <div class="drawer-nav-row">
            <button class="drawer-manila-tab btn-back-to-desk" id="btn-board-back-desk">
              【推回抽屜 · 返回案頭】
            </button>
            <a href="https://penny323mo.github.io/grokbot/" class="drawer-grokbot-link" target="_blank" rel="noopener noreferrer">
              【grokbot 總部專線 →】
            </a>
          </div>
          <div class="drawer-title-group">
            <h1 class="drawer-main-title">澳門司法警察司 · 機密卷宗抽屜</h1>
            <p class="drawer-intro">ARCHIVOS CONFIDENCIAIS · 1962年內港重案全四卷</p>
          </div>
        </header>

        <div class="archival-ink-rule-divider"></div>

        <!-- Four Manila Folders Stack in Filing Drawer -->
        <div class="dossier-grid filing-drawer-stack">
          ${cardsHtml}
        </div>

        <!-- Bottom Footer info -->
        <footer class="board-footer">
          <div class="board-archival-note">
            <span>澳門歷史檔案館 1962 巡督日誌複刻 · 離線本地存儲</span>
          </div>
          <a href="https://penny323mo.github.io/grokbot/" class="link-footer-grokbot" target="_blank" rel="noopener noreferrer">
            返回 grokbot 主站
          </a>
        </footer>
      </div>
    `;

    this.bindDOMEvents();
  }

  bindDOMEvents() {
    const backBtn = this.container.querySelector('#btn-board-back-desk');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        audio.playSFX('paper_slide');
        this.onBackToDesk();
      });
    }

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

    this.container.querySelectorAll('.case-dossier-card.is-unlocked').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return;
        const caseId = parseInt(card.getAttribute('data-case-id'), 10);
        audio.playSFX('paper_slide');
        this.onSelectCase(caseId);
      });
    });
  }
}
