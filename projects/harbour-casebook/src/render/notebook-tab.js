/**
 * 濠江疑案 · Harbour Casebook
 * 偵查筆記本 (Notebook View)
 * 依照 SPEC §6 呈現「現場 / 筆記 / 推理 / 選單」四頁籤之一
 * 將已收錄詞條依人名、物證、動機、地點、兇器、時間等分類歸納
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
  constructor(containerEl) {
    this.container = containerEl;
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
        <div class="notebook-cat-block">
          <div class="notebook-cat-header">
            <div class="notebook-cat-title-wrap">
              <span class="cat-color-dot" style="background-color: ${meta.color};"></span>
              <h4 class="notebook-cat-title">${meta.name}</h4>
              <span class="notebook-cat-count">${collectedInCat.length}/${list.length}</span>
            </div>
            <span class="notebook-cat-desc">${meta.desc}</span>
          </div>

          <div class="notebook-chips-wrap">
            ${collectedInCat.map(word => `
              <div class="notebook-word-chip is-harvested">
                <span class="chip-dot">${ICONS.check(12, '#4F6F5F')}</span>
                <span class="chip-text">${word}</span>
              </div>
            `).join('')}

            ${Array.from({ length: uncollectedCount }).map(() => `
              <div class="notebook-word-chip is-missing">
                <span class="chip-dot">${ICONS.lock(10, 'currentColor')}</span>
                <span class="chip-text">＿＿＿＿</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    this.container.innerHTML = `
      <div class="notebook-scroll-area">
        <!-- Notebook Top Header -->
        <header class="notebook-header">
          <div class="notebook-title-group">
            <span class="notebook-badge">CASE 0${caseData.id} 偵查筆錄</span>
            <h2 class="notebook-main-title">濠江搜證筆記</h2>
            <p class="notebook-summary">現場勘驗詞彙歸檔：已收錄 ${collectedCount} 條，尚餘 ${totalWords - collectedCount} 條線索隱於現場。</p>
          </div>
        </header>

        <!-- Categories List -->
        <div class="notebook-categories-grid">
          ${categoriesHtml}
        </div>
      </div>
    `;
  }
}
