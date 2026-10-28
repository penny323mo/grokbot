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
        <article class="case-dossier-card ${isUnlocked ? 'is-unlocked' : 'is-locked'} ${isSolved ? 'is-solved' : ''}" data-case-id="${c.id}">
          <div class="dossier-card-side-tag">
            <span class="dossier-symbol">${c.symbol}</span>
            <span class="dossier-idx">0${c.id}</span>
          </div>
          <div class="dossier-card-main">
            <div class="dossier-top-meta">
              <span class="dossier-date">${c.date}</span>
              ${isSolved ? '<span class="dossier-solved-tag">結案歸檔</span>' : (isUnlocked ? '<span class="dossier-active-tag">偵查中</span>' : '<span class="dossier-lock-tag">尚未解鎖</span>')}
            </div>
            <h3 class="dossier-title">〈${c.symbol}〉 ${c.title}</h3>
            <div class="dossier-location">
              <span class="loc-pin">${ICONS.pin(13, 'currentColor')}</span> ${c.location}
            </div>
            <p class="dossier-intro-snip">${c.incidentIntro.substring(0, 54)}……</p>

            ${isUnlocked ? `
              <div class="dossier-progress-row">
                <div class="progress-item">
                  <span class="p-label">已收錄詞彙</span>
                  <span class="p-val">${collectedCount}</span>
                </div>
                <div class="progress-item">
                  <span class="p-label">推理進度</span>
                  <span class="p-val">${solvedSectionsCount}/${totalSections}</span>
                </div>
                <div class="progress-item">
                  <span class="p-label">錦囊次數</span>
                  <span class="p-val">${hintsUsed}</span>
                </div>
              </div>

              <div class="dossier-btn-bar">
                <button class="btn-open-case" data-case-id="${c.id}">
                  ${isSolved ? '複查卷宗現場' : '進入現場偵查'} →
                </button>
                ${isSolved ? `
                  <button class="btn-card-epilogue" data-case-id="${c.id}">
                    破案始末
                  </button>
                ` : ''}
              </div>
            ` : `
              <div class="dossier-locked-hint">
                <span>需破獲前案方可解密此卷</span>
              </div>
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
      <div class="case-board-view">
        <!-- Top Board Header -->
        <header class="board-header">
          <div class="board-title-line">
            <button class="btn-desk-nav btn-back-to-desk" id="btn-board-back-desk">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span>返回案頭</span>
            </button>
            <a href="https://penny323mo.github.io/grokbot/" class="btn-return-grokbot" target="_blank" rel="noopener noreferrer">
              ← 返回 grokbot
            </a>
          </div>
          <h1 class="board-main-title">濠江疑案 · 卷宗目錄</h1>
          <p class="board-intro">一九六二年澳門內港。四樁命案，一條貫穿殖民黑幕的驚天伏線。</p>
        </header>

        <div class="archival-ink-rule-divider"></div>

        <!-- Cards List -->
        <div class="dossier-grid">
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
