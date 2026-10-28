/**
 * 濠江疑案 · Harbour Casebook
 * 現場物證勘驗底板 (Diegetic Torn Notebook Page / Evidence Tag)
 * 模擬自現場掀起之撕角筆記與物證籤條，點擊墨線詞語錄入案頭手記，無白色圓角與現代拖拽條
 */

import { audio } from '../engine/audio.js';
import { ICONS } from '../utils/icons.js';

export class BottomSheet {
  constructor(options = {}) {
    this.onWordCollect = options.onWordCollect || (() => {});
    this.onClose = options.onClose || (() => {});
    this.collectedWords = new Set();
    this.currentHotspot = null;

    this.initDOM();
  }

  initDOM() {
    this.sheetEl = document.createElement('div');
    this.sheetEl.className = 'clue-bottom-sheet';
    this.sheetEl.innerHTML = `
      <div class="bottom-sheet-backdrop"></div>
      <div class="bottom-sheet-content evidence-torn-page" role="dialog" aria-labelledby="sheet-title">
        <!-- Torn Paper Top Edge -->
        <div class="torn-paper-edge" aria-hidden="true"></div>

        <div class="evidence-tag-header">
          <div class="evidence-docket-stamp">
            <span class="stamp-org">POLÍCIA JUDICIÁRIA DE MACAU</span>
            <span class="stamp-no">PROC. EVIDÊNCIA N.º 62/1962</span>
          </div>
          <div class="evidence-title-row">
            <span class="evidence-tag-icon">${ICONS.clip(16, '#7A6246')}</span>
            <h3 id="sheet-title" class="evidence-sheet-title">勘驗物證</h3>
            <button class="sheet-close-btn evidence-dismiss-pin" aria-label="收卷歸位" type="button">
              <span class="pin-head"></span>
              <span class="pin-text">〔 收卷 ✕ 〕</span>
            </button>
          </div>
        </div>

        <div class="sheet-body evidence-sheet-body">
          <div class="sheet-description evidence-sheet-desc" id="sheet-desc"></div>
          <div class="evidence-ink-footnote">
            <span class="footnote-mark">※</span>
            <span class="footnote-text">點擊<strong>帶墨線詞語</strong>錄入案頭手記</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.sheetEl);

    this.backdrop = this.sheetEl.querySelector('.bottom-sheet-backdrop');
    this.contentEl = this.sheetEl.querySelector('.bottom-sheet-content');
    this.titleEl = this.sheetEl.querySelector('#sheet-title');
    this.descEl = this.sheetEl.querySelector('#sheet-desc');
    this.closeBtn = this.sheetEl.querySelector('.sheet-close-btn');

    this.backdrop.addEventListener('click', () => this.hide());
    this.closeBtn.addEventListener('click', () => this.hide());
  }

  show(hotspot, collectedWords = new Set()) {
    this.currentHotspot = hotspot;
    this.collectedWords = new Set(collectedWords);

    this.titleEl.textContent = hotspot.name;
    this.descEl.innerHTML = hotspot.desc;

    // Enhance all .word-chip elements
    const chips = this.descEl.querySelectorAll('.word-chip');
    chips.forEach(chip => {
      const word = chip.getAttribute('data-word');
      const isCollected = this.collectedWords.has(word);

      chip.classList.toggle('is-collected', isCollected);
      if (isCollected) {
        chip.title = '已收錄至筆記本';
      }

      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleChipClick(chip, word);
      });
    });

    this.sheetEl.classList.add('is-open');
    audio.playSFX('paper_slide');
  }

  hide() {
    if (!this.sheetEl.classList.contains('is-open')) return;
    this.sheetEl.classList.remove('is-open');
    this.onClose(this.currentHotspot);
  }

  handleChipClick(chipEl, word) {
    if (this.collectedWords.has(word)) {
      audio.playSFX('paper_slide');
      return;
    }

    // Mark as collected
    this.collectedWords.add(word);
    chipEl.classList.add('is-collected');
    audio.playSFX('word_collect');

    // Trigger fly animation
    this.animateFlyingWord(chipEl, word);

    // Callback to parent app
    this.onWordCollect(word, this.currentHotspot);
  }

  animateFlyingWord(sourceEl, word) {
    const rect = sourceEl.getBoundingClientRect();

    const flyer = document.createElement('div');
    flyer.className = 'flying-word-chip';
    flyer.textContent = word;
    flyer.style.position = 'fixed';
    flyer.style.left = `${rect.left}px`;
    flyer.style.top = `${rect.top}px`;
    flyer.style.zIndex = '9999';
    flyer.style.pointerEvents = 'none';
    flyer.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease';
    flyer.style.transform = 'translate(0, 0) scale(1)';
    flyer.style.opacity = '1';
    document.body.appendChild(flyer);

    requestAnimationFrame(() => {
      flyer.style.transform = 'translate(0, -28px) scale(1.1)';
      flyer.style.opacity = '0';
    });

    setTimeout(() => {
      if (flyer.parentNode) {
        flyer.parentNode.removeChild(flyer);
      }
    }, 420);
  }
}
