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
              <span class="stamp-txt">真相徹查</span>
            </div>
            <!-- Archival Vignette Illustration (SPEC §7 / MINOR #5) -->
            <div class="epilogue-vignette-art">
              <svg viewBox="0 0 320 95" class="epilogue-svg-vignette">
                <defs>
                  <linearGradient id="vignetteSky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#F7EFE1"/>
                    <stop offset="70%" stop-color="#EDE2CF"/>
                    <stop offset="100%" stop-color="#E2D4BF"/>
                  </linearGradient>
                  <linearGradient id="vignetteWater" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#8DA79B" stop-opacity="0.35"/>
                    <stop offset="100%" stop-color="#4F6F5F" stop-opacity="0.6"/>
                  </linearGradient>
                </defs>
                <rect width="320" height="95" fill="url(#vignetteSky)"/>

                <!-- Morning Sun over Harbour -->
                <circle cx="160" cy="38" r="18" fill="#9A3B2C" opacity="0.12"/>
                <circle cx="160" cy="38" r="12" fill="#9A3B2C" opacity="0.22"/>

                <!-- Distant Taipa / Ilha Verde Contoured Hills -->
                <path d="M0 50 Q45 36 90 44 T180 38 T270 42 Q295 40 320 46 L320 95 L0 95 Z" fill="#C9BDAA" opacity="0.7"/>
                <path d="M30 52 Q80 44 140 48 T240 45 Q280 43 320 49 L320 95 L30 95 Z" fill="#B3A591" opacity="0.6"/>

                <!-- Penha Hill Chapel Spire on Ridge (Left) -->
                <g transform="translate(60, 24)">
                  <!-- Church belfry & spire -->
                  <polygon points="12,18 16,3 20,18" fill="#5A4E3E"/>
                  <line x1="16" y1="0" x2="16" y2="5" stroke="#1F1B16" stroke-width="0.8"/>
                  <line x1="14" y1="2" x2="18" y2="2" stroke="#1F1B16" stroke-width="0.8"/>
                  <rect x="12" y="18" width="8" height="12" fill="#756754" stroke="#1F1B16" stroke-width="0.6"/>
                  <!-- Belfry arch window -->
                  <path d="M14 24 L14 21 Q16 19 18 21 L18 24 Z" fill="#1F1B16"/>
                  <!-- Church nave body -->
                  <polygon points="6,30 26,30 26,24 6,24" fill="#8C7D68"/>
                </g>

                <!-- Water Surface -->
                <rect x="0" y="58" width="320" height="37" fill="url(#vignetteWater)"/>
                <!-- Fine ink water ripples -->
                <path d="M5 64 Q35 62 65 64 T125 64 T185 64 T245 64 T305 64" stroke="#1F1B16" stroke-width="0.6" stroke-dasharray="8 6" fill="none" opacity="0.5"/>
                <path d="M20 72 Q50 70 80 72 T140 72 T200 72 T260 72 T315 72" stroke="#1F1B16" stroke-width="0.6" stroke-dasharray="12 8" fill="none" opacity="0.4"/>
                <path d="M10 80 Q40 78 70 80 T130 80 T190 80 T250 80 T310 80" stroke="#4F6F5F" stroke-width="0.7" fill="none" opacity="0.6"/>
                <path d="M35 88 Q75 86 115 88 T195 88 T275 88" stroke="#1F1B16" stroke-width="0.5" stroke-dasharray="14 10" fill="none" opacity="0.3"/>

                <!-- Detailed 3-Masted Traditional Chinese Junk (Center-Right) -->
                <g transform="translate(195, 42)">
                  <!-- Wake ripple behind hull -->
                  <path d="M-15 32 Q-5 30 5 32" stroke="#FAF6EE" stroke-width="1.2" fill="none" opacity="0.8"/>
                  <!-- Curved wooden hull -->
                  <path d="M0 26 Q35 34 70 24 L66 19 Q35 24 6 20 Z" fill="#3D291D" stroke="#1F1B16" stroke-width="1.2"/>
                  <!-- Dragon eye badge on bow -->
                  <circle cx="64" cy="22" r="2" fill="#FAF6EE" stroke="#1F1B16" stroke-width="0.6"/>
                  <circle cx="64" cy="22" r="0.8" fill="#1F1B16"/>
                  <!-- Main mast & battened fan sail -->
                  <line x1="38" y1="2" x2="38" y2="24" stroke="#1F1B16" stroke-width="1.2"/>
                  <!-- Bamboo sail battens -->
                  <path d="M38 3 Q54 8 52 22 L38 22 Z" fill="#9A3B2C" opacity="0.85" stroke="#1F1B16" stroke-width="0.8"/>
                  <line x1="38" y1="7" x2="53" y2="10" stroke="#1F1B16" stroke-width="0.6"/>
                  <line x1="38" y1="12" x2="53" y2="14" stroke="#1F1B16" stroke-width="0.6"/>
                  <line x1="38" y1="17" x2="52" y2="18" stroke="#1F1B16" stroke-width="0.6"/>
                  <!-- Fore mast & sail -->
                  <line x1="56" y1="8" x2="56" y2="22" stroke="#1F1B16" stroke-width="0.9"/>
                  <path d="M56 9 Q66 13 65 21 L56 21 Z" fill="#822E22" opacity="0.8" stroke="#1F1B16" stroke-width="0.6"/>
                  <!-- Mizzen mast & sail -->
                  <line x1="16" y1="9" x2="16" y2="23" stroke="#1F1B16" stroke-width="0.9"/>
                  <path d="M16 10 Q26 14 25 22 L16 22 Z" fill="#822E22" opacity="0.8" stroke="#1F1B16" stroke-width="0.6"/>
                  <!-- Rigging lines -->
                  <line x1="38" y1="2" x2="10" y2="22" stroke="#1F1B16" stroke-width="0.5" opacity="0.7"/>
                  <line x1="38" y1="2" x2="68" y2="21" stroke="#1F1B16" stroke-width="0.5" opacity="0.7"/>
                </g>

                <!-- Pier Wooden Piling & Mooring Ring (Left foreground) -->
                <g transform="translate(15, 52)">
                  <!-- Wooden piling posts -->
                  <rect x="0" y="0" width="7" height="38" fill="#4A3423" stroke="#1F1B16" stroke-width="1"/>
                  <rect x="10" y="4" width="6" height="34" fill="#3D291D" stroke="#1F1B16" stroke-width="1"/>
                  <!-- Cross timber beam -->
                  <rect x="-4" y="6" width="24" height="5" fill="#5C422C" stroke="#1F1B16" stroke-width="0.8"/>
                  <!-- Coiled hemp mooring rope -->
                  <path d="M4 11 Q12 18 18 28" stroke="#D3B88C" stroke-width="1.2" fill="none"/>
                  <!-- Water splash / foam at base of piles -->
                  <path d="M-3 36 Q3 34 8 36 T18 36" stroke="#FAF6EE" stroke-width="1" fill="none" opacity="0.7"/>
                </g>

                <!-- Archival Vignette Ink Frame -->
                <rect x="1" y="1" width="318" height="93" fill="none" stroke="#1F1B16" stroke-width="1.2"/>
                <rect x="3" y="3" width="314" height="89" fill="none" stroke="#9A3B2C" stroke-width="0.6" opacity="0.6"/>
              </svg>
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

    if (caseData.id >= 4) {
      this.btnNext.textContent = '終章致謝 · 返回主卷';
    } else {
      this.btnNext.textContent = `進入 Case 0${caseData.id + 1} →`;
    }

    this.modalEl.classList.add('is-open');
    audio.playBGM('resolution');
  }

  hide() {
    this.modalEl.classList.remove('is-open');
    audio.playBGM('investigation');
  }
}
