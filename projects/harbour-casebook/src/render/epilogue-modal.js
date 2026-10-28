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
        <div class="epilogue-scroll-body">
          <div class="epilogue-paper-card newspaper-paper-layout">
            <div class="newspaper-masthead">
              <div class="masthead-main-title">《濠江紀實報》· 警情號外</div>
              <div class="masthead-pt-line">DIÁRIO DE MACAU · EDIÇÃO ESPECIAL</div>
              <div class="masthead-date-line">一九六二年十月 · 司法警察司存檔公報</div>
              <div class="masthead-double-rule"></div>
            </div>

            <div class="epilogue-stamp-mark">
              <img class="epilogue-seal-img" src="assets/ui/seal_jiean_sm.webp" alt="結案" />
            </div>
            <!-- Archival Noir Crime Scene Painting -->
            <div class="epilogue-vignette-art">
              <img src="assets/ui/epilogue_vignette.webp" class="epilogue-vignette-img" alt="1962 澳門內港案發現場" />
              <span class="vignette-caption">【案發現場勘驗檔案照 · 刑事偵查司存】</span>
            </div>
            <h2 class="epilogue-headline" id="epilogue-title">破案始末</h2>
            <div class="epilogue-meta" id="epilogue-meta"></div>
            <div class="epilogue-content-text" id="epilogue-body"></div>

            <!-- Stamped Action Line on the Newspaper Paper under the Column -->
            <div class="newspaper-dispatch-section">
              <div class="newspaper-dispatch-divider"></div>
              <div class="newspaper-dispatch-actions">
                <button class="newspaper-stamped-action" id="btn-epilogue-next">
                  <span class="stamped-action-seal">【續案號外】</span>
                  <span class="stamped-action-text" id="epilogue-next-text">進入下一案 →</span>
                </button>
                <button class="newspaper-board-link" id="btn-epilogue-board">
                  〔 闔報歸檔 · 檢閱卷宗架 〕
                </button>
              </div>
            </div>
          </div>
        </div>
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
    this.btnNextText = this.modalEl.querySelector('#epilogue-next-text');

    this.backdrop.addEventListener('click', () => this.hide());
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.hide());
    }
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
    if (this.symEl) this.symEl.textContent = caseData.symbol;
    if (this.tagEl) this.tagEl.textContent = `CASE 0${caseData.id} · 破案始末`;
    this.titleEl.textContent = caseData.epilogue.title;
    this.metaEl.textContent = `${caseData.date} · ${caseData.location}`;

    // Convert newlines to paragraphs
    const paragraphs = caseData.epilogue.text.split('\n\n');
    this.bodyEl.innerHTML = paragraphs.map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('');

    const caseNumerals = ['', '第一案', '第二案', '第三案', '第四案'];
    const nextCaseName = caseNumerals[caseData.id + 1] || `第 ${caseData.id + 1} 案`;

    if (caseData.id >= 4) {
      if (this.btnNextText) this.btnNextText.textContent = '終章致謝 · 返回主卷';
      else this.btnNext.textContent = '終章致謝 · 返回主卷';
    } else {
      if (this.btnNextText) this.btnNextText.textContent = `進入${nextCaseName} →`;
      else this.btnNext.textContent = `進入${nextCaseName} →`;
    }

    this.modalEl.classList.add('is-open');
    audio.playBGM('resolution');
  }

  hide() {
    this.modalEl.classList.remove('is-open');
    audio.playBGM('investigation');
  }
}
