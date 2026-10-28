/**
 * 濠江疑案 · Harbour Casebook
 * 案頭物證手記 (Diegetic Notebook View)
 * 點擊案頭皮質筆記本進入，將已收錄詞條依人名、物證、動機、地點、兇器、時間等分類歸納
 */

import { storage } from '../engine/storage.js';
import { ICONS } from '../utils/icons.js';

const CATEGORY_META = {
  people: { name: '人名證供', desc: '已訊問或指認之涉案人物', color: '#1F1B16' },
  objects: { name: '搜獲物證', desc: '案發現場起獲之隨身物與票據', color: '#8C3A27' },
  motives: { name: '作案動機', desc: '推敲之殺人或走私深層利益', color: '#9A3B2C' },
  places: { name: '涉案地點', desc: '案發與走私流轉之關鍵場所', color: '#4F6F5F' },
  weapons: { name: '行兇兇器', desc: '致傷致死之工具物證', color: '#6B2C24' },
  times: { name: '關鍵時刻', desc: '潮汐更牌與懷錶停留時間', color: '#3A5A6D' },
  methods: { name: '致命手法', desc: '受害人之直接受害手段', color: '#5B4333' },
  poisons: { name: '毒物種類', desc: '化驗搜得之劇毒藥物', color: '#7A2E44' }
};

export class NotebookTab {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.onBackToDesk = options.onBackToDesk || (() => {});
  }

  render(caseData) {
    const caseState = storage.getCaseState(caseData.id);
    const collectedWords = new Set(caseState.collectedWords || []);

    // Calculate total bank words
    let totalWords = 0;
    Object.values(caseData.wordBank).forEach(list => totalWords += list.length);
    const collectedCount = collectedWords.size;

    let categoriesHtml = '';

    Object.entries(caseData.wordBank).forEach(([catKey, list]) => {
      const meta = CATEGORY_META[catKey] || { name: catKey, desc: '', color: '#1F1B16' };
      const collectedInCat = list.filter(w => collectedWords.has(w));
      const uncollectedCount = list.length - collectedInCat.length;

      categoriesHtml += `
        <div class="notebook-cat-block notebook-ruled-section">
          <div class="notebook-cat-header">
            <div class="notebook-cat-title-wrap">
              <span class="notebook-ink-doodle">§</span>
              <h4 class="notebook-cat-title">${meta.name}</h4>
              <span class="notebook-cat-count">${collectedInCat.length}/${list.length}</span>
            </div>
            <span class="notebook-cat-desc">${meta.desc}</span>
          </div>

          <div class="notebook-jottings-flow">
            ${collectedInCat.map(word => `
              <span class="notebook-ink-word">
                <span class="ink-tick">✓</span> ${word}
              </span>
            `).join('')}

            ${Array.from({ length: uncollectedCount }).map(() => `
              <span class="notebook-blank-word">
                <span class="pencil-slot">＿＿＿＿</span>
              </span>
            `).join('')}
          </div>
        </div>
      `;
    });

    this.container.innerHTML = `
      <div class="notebook-screen-wrapper">
        <!-- Leather Bookmark Ribbon at Top (Diegetic Return Tag, No Boxed Top Bar) -->
        <div class="notebook-top-controls">
          <button class="notebook-leather-bookmark btn-back-to-desk" id="btn-notebook-back-desk" type="button" aria-label="闔上手記返回案頭">
            <span class="bookmark-ribbon"></span>
            <span class="bookmark-text">闔上手記 · 返回案頭</span>
          </button>
          <div class="notebook-docket-tag">
            <span class="docket-text">〈${caseData.symbol}〉 刑事物證手記</span>
          </div>
        </div>

        <div class="notebook-scroll-area">
          <div class="notebook-paper-folio">
            <!-- Categories List -->
            <div class="notebook-categories-grid">
              ${categoriesHtml}
            </div>
          </div>
        </div>
      </div>
    `;

    const backBtn = this.container.querySelector('#btn-notebook-back-desk');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.onBackToDesk();
      });
    }
  }
}
