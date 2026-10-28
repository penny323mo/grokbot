/**
 * 濠江疑案 · Harbour Casebook
 * 案頭總覽中心渲染器 (Diegetic Desk Hub Controller)
 * 渲染於 assets/art/desk_hub.webp 上，展示檯燈微光、膠片顆粒與實物點擊熱區
 */

import { storage } from '../engine/storage.js';
import { audio } from '../engine/audio.js';
import { ICONS } from '../utils/icons.js';

export class DeskHub {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.onNavigate = options.onNavigate || (() => {});
  }

  render(caseData) {
    const caseId = caseData ? caseData.id : 1;
    const caseState = storage.getCaseState(caseId);
    const isCaseSolved = storage.isCaseSolved(caseId);
    const collectedCount = (caseState.collectedWords || []).length;
    const solvedSecs = (caseState.solvedSections || []).length;
    const totalSecs = caseData ? caseData.deductionSections.length : 2;
    const isWhoSolved = storage.isWhoSolved(caseId);

    this.container.innerHTML = `
      <div class="desk-hub-stage">
        <!-- Background Desk Painting Layer -->
        <div class="desk-hub-art-wrap">
          <img src="assets/art/desk_hub.webp" class="desk-hub-img" alt="1962 澳門探長案頭" />
        </div>

        <!-- Atmospheric Overlays: Lamp Vignette, Film Grain, Lamp Flicker -->
        <div class="desk-atmosphere-layer" aria-hidden="true">
          <div class="desk-lamp-glow"></div>
          <div class="desk-lamp-vignette" style="background-image: url('assets/ui/lamp_vignette.webp');"></div>
          <div class="desk-film-grain" style="background-image: url('assets/ui/film_grain.webp');"></div>
        </div>

        <!-- Top Desk Bar -->
        <header class="desk-header-bar">
          <div class="desk-case-indicator">
            <span class="desk-date-tag">1962 · 澳門內港探署</span>
            <h1 class="desk-case-title">〈${caseData ? caseData.symbol : '押'}〉 ${caseData ? caseData.title : '當舖驚魂'}</h1>
          </div>
          <div class="desk-header-actions">
            <button class="btn-desk-board-folder" id="btn-desk-open-board" title="案件目錄卷宗夾">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>案件目錄</span>
            </button>
          </div>
        </header>

        <!-- Interactive Physical Props on Desk (Golden Idol / Obra Dinn style: pin on object, no stickers/emoji) -->
        <nav class="desk-props-layer" aria-label="案頭偵查道具">
          
          <!-- 1. Casebook Center (Left Page): 現場手繪 / 勘驗現場 -->
          <button class="desk-prop-target prop-casebook" id="prop-casebook" style="left: 36%; top: 56%;" aria-label="勘驗現場手繪案卷">
            <div class="desk-prop-pin-ring"></div>
          </button>

          <!-- 2. Police Report / Deduction (Right Page): 推理結案報告 -->
          <button class="desk-prop-target prop-deduction" id="prop-deduction" style="left: 64%; top: 56%;" aria-label="破案審查與推理報告">
            <div class="desk-prop-pin-ring ${isCaseSolved ? 'is-solved' : ''}"></div>
          </button>

          <!-- 3. Corkboard on Wall: 涉案人物關係牆 -->
          <button class="desk-prop-target prop-corkboard" id="prop-corkboard" style="left: 18%; top: 28%;" aria-label="涉案人物關係牆">
            <div class="desk-prop-pin-ring ${isWhoSolved ? 'is-solved' : ''}"></div>
          </button>

          <!-- 4. Leather Notebook (Bottom Left): 物證詞語庫 (Leather Cover) -->
          <button class="desk-prop-target prop-notebook" id="prop-notebook" style="left: 18%; top: 83%;" aria-label="案頭物證手記">
            <div class="desk-prop-pin-ring"></div>
          </button>

          <!-- 5. Magnifier (Bottom Right): 現場放大鏡捷徑 (Glass Rim / Lens Center) -->
          <button class="desk-prop-target prop-magnifier" id="prop-magnifier" style="left: 68%; top: 85%;" aria-label="手持放大鏡">
            <div class="desk-prop-pin-ring"></div>
          </button>

          <!-- 6. Rotary Telephone (Right): 總機選單 / 設置 / grokbot -->
          <button class="desk-prop-target prop-phone" id="prop-phone" style="left: 82%; top: 46%;" aria-label="探署總機電話">
            <div class="desk-prop-pin-ring"></div>
          </button>

          <!-- 7. Desk Lamp (Left): 檯燈罩 (Shade / Glow) -->
          <button class="desk-prop-target prop-lamp" id="prop-lamp" style="left: 14%; top: 24%;" aria-label="檯燈調光">
            <div class="desk-prop-pin-ring is-subtle"></div>
          </button>
        </nav>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // 1. Scene via Casebook
    const casebookBtn = this.container.querySelector('#prop-casebook');
    if (casebookBtn) {
      casebookBtn.addEventListener('click', () => {
        audio.playSFX('paper_slide');
        this.onNavigate('scene');
      });
    }

    // 2. Scene via Magnifier
    const magBtn = this.container.querySelector('#prop-magnifier');
    if (magBtn) {
      magBtn.addEventListener('click', () => {
        audio.playSFX('paper_slide');
        this.onNavigate('scene');
      });
    }

    // 3. Deduction Report
    const dedBtn = this.container.querySelector('#prop-deduction');
    if (dedBtn) {
      dedBtn.addEventListener('click', () => {
        audio.playSFX('paper_slide');
        this.onNavigate('deduction');
      });
    }

    // 4. Corkboard (Who's Who)
    const corkBtn = this.container.querySelector('#prop-corkboard');
    if (corkBtn) {
      corkBtn.addEventListener('click', () => {
        audio.playSFX('paper_slide');
        this.onNavigate('cork');
      });
    }

    // 5. Notebook (Collected Words)
    const noteBtn = this.container.querySelector('#prop-notebook');
    if (noteBtn) {
      noteBtn.addEventListener('click', () => {
        audio.playSFX('paper_slide');
        this.onNavigate('notebook');
      });
    }

    // 6. Rotary Phone (Menu / Grokbot)
    const phoneBtn = this.container.querySelector('#prop-phone');
    if (phoneBtn) {
      phoneBtn.addEventListener('click', () => {
        audio.playSFX('paper_slide');
        this.onNavigate('menu');
      });
    }

    // 7. Desk Lamp (Light toggle / subtle SFX)
    const lampBtn = this.container.querySelector('#prop-lamp');
    if (lampBtn) {
      lampBtn.addEventListener('click', () => {
        audio.playSFX('hint_chime');
        const glow = this.container.querySelector('.desk-lamp-glow');
        if (glow) {
          glow.classList.toggle('lamp-bright');
        }
      });
    }

    // 8. Board folder
    const boardBtn = this.container.querySelector('#btn-desk-open-board');
    if (boardBtn) {
      boardBtn.addEventListener('click', () => {
        audio.playSFX('paper_slide');
        this.onNavigate('board');
      });
    }
  }
}
