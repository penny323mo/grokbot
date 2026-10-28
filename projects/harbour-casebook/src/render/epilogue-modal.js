/**
 * 濠江疑案 · Harbour Casebook
 * 案件真相與結案紀實彈窗 (Epilogue & Resolution Modal)
 * 歷史檔案紙感排版，重組全案因果鏈與大結局
 */

import { audio } from '../engine/audio.js';

export class EpilogueModal {
  constructor(options = {}) {
    this.onNextCase = options.onNextCase || (() => {});
    this.onBackToBoard = options.onBackToBoard || (() => {});
    this.currentCase = null;

    this.initDOM();
  }

  initDOM() {
    this.modalEl = document.createElement('div');
    this.modalEl.className = 'epilogue-modal-overlay';
    this.modalEl.innerHTML = `
      <div class="epilogue-backdrop"></div>
      <div class="epilogue-dialog" role="dialog" aria-labelledby="epilogue-title">
        <header class="epilogue-header">
          <div class="epilogue-header-badge">
            <span class="epilogue-symbol" id="epilogue-sym">押</span>
            <span class="epilogue-case-tag" id="epilogue-tag">CASE 01 · 破案始末</span>
          </div>
          <button class="epilogue-close-btn" aria-label="關閉檔案">&times;</button>
        </header>

        <div class="epilogue-scroll-body">
          <div class="epilogue-paper-card">
            <div class="epilogue-stamp-mark">
              <img class="epilogue-seal-img" src="assets/ui/seal_jiean_sm.webp" alt="結案" />
            </div>
            <!-- Archival Vignette Illustration (WebP period painting) -->
            <div class="epilogue-vignette-art">
              <img src="assets/ui/epilogue_vignette.webp" class="epilogue-vignette-img" alt="1962 澳門內港" />
            </div>
            <h2 class="epilogue-headline" id="epilogue-title">破案始末</h2>
            <div class="epilogue-meta" id="epilogue-meta"></div>
            <div class="epilogue-content-text" id="epilogue-body"></div>
          </div>
        </div>

        <footer class="epilogue-footer-bar">
          <button class="btn-epilogue-board" id="btn-epilogue-board">返回卷宗架</button>
          <button class="btn-epilogue-next" id="btn-epilogue-next">進入下一案 →</button>
        </footer>
      </div>
    `;

    document.body.appendChild(this.modalEl);

    this.backdrop = this.modalEl.querySelector('.epilogue-backdrop');
    this.closeBtn = this.modalEl.querySelector('.epilogue-close-btn');
    this.symEl = this.modalEl.querySelector('#epilogue-sym');
    this.tagEl = this.modalEl.querySelector('#epilogue-tag');
    this.titleEl = this.modalEl.querySelector('#epilogue-title');
    this.metaEl = this.modalEl.querySelector('#epilogue-meta');
    this.bodyEl = this.modalEl.querySelector('#epilogue-body');
    this.btnBoard = this.modalEl.querySelector('#btn-epilogue-board');
    this.btnNext = this.modalEl.querySelector('#btn-epilogue-next');

    this.backdrop.addEventListener('click', () => this.hide());
    this.closeBtn.addEventListener('click', () => this.hide());
    this.btnBoard.addEventListener('click', () => {
      this.hide();
      this.onBackToBoard();
    });
    this.btnNext.addEventListener('click', () => {
      this.hide();
      if (this.currentCase && this.currentCase.id < 4) {
        this.onNextCase(this.currentCase.id + 1);
      } else {
        this.onBackToBoard();
      }
    });
  }

  show(caseData) {
    this.currentCase = caseData;
    this.symEl.textContent = caseData.symbol;
    this.tagEl.textContent = `CASE 0${caseData.id} · 破案始末`;
    this.titleEl.textContent = caseData.epilogue.title;
    this.metaEl.textContent = `${caseData.date} · ${caseData.location}`;

    // Convert newlines to paragraphs
    const paragraphs = caseData.epilogue.text.split('\n\n');
    this.bodyEl.innerHTML = paragraphs.map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('');

    const caseNumerals = ['', '第一案', '第二案', '第三案', '第四案'];
    const nextCaseName = caseNumerals[caseData.id + 1] || `第 ${caseData.id + 1} 案`;

    if (caseData.id >= 4) {
      this.btnNext.textContent = '終章致謝 · 返回主卷';
    } else {
      this.btnNext.textContent = `進入${nextCaseName} →`;
    }

    this.modalEl.classList.add('is-open');
    audio.playBGM('resolution');
  }

  hide() {
    this.modalEl.classList.remove('is-open');
    audio.playBGM('investigation');
  }
}
