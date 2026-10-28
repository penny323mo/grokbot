/**
 * 濠江疑案 · Harbour Casebook
 * 現場物證勘驗底板 (Bottom Sheet Clue Inspector)
 * 限制最大高度 45%，點擊下劃線詞語收集並帶有飛入筆記本動畫與音效
 */

import { audio } from '../engine/audio.js';

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
      <div class="bottom-sheet-content" role="dialog" aria-labelledby="sheet-title">
        <div class="sheet-handle-bar">
          <span class="sheet-drag-pill"></span>
        </div>
        <div class="sheet-header">
          <div class="sheet-title-group">
            <span class="sheet-icon-magnifier">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <h3 id="sheet-title" class="sheet-title">勘驗物證</h3>
          </div>
          <button class="sheet-close-btn" aria-label="關閉勘驗底板">&times;</button>
        </div>
        <div class="sheet-body">
          <div class="sheet-description" id="sheet-desc"></div>
          <div class="sheet-hint-tip">
            <span class="sheet-tip-dot"></span>
            點擊<strong>帶墨線詞語</strong>即可收錄至推理筆記
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
      // Gentle tick if already collected
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
      // Float up gently in place and fade out into harvested state
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
