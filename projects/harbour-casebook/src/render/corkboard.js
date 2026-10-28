/**
 * 濠江疑案 · Harbour Casebook
 * 軟木板人物關係牆渲染器 (Diegetic Corkboard & Polaroid Name Tapes)
 * 渲染於 assets/art/corkboard.webp 上：大頭針固定相片、膠布名條、手寫便條、無方形頂欄與虛線框
 */

import { PORTRAITS } from '../data/portraits.js';
import { checkWhosWho, CHECK_STATUS } from '../engine/deduction.js';
import { storage } from '../engine/storage.js';
import { audio } from '../engine/audio.js';
import { ICONS } from '../utils/icons.js';

export class Corkboard {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.caseData = null;
    this.onWhoSolved = options.onWhoSolved || (() => {});
    this.onBackToDesk = options.onBackToDesk || (() => {});
    this.activeCharId = null;

    this.initPickerModal();
  }

  initPickerModal() {
    this.pickerModal = document.createElement('div');
    this.pickerModal.className = 'word-picker-modal cork-picker-modal';
    this.pickerModal.innerHTML = `
      <div class="picker-backdrop"></div>
      <div class="picker-panel loose-fan-tray" role="dialog" aria-label="涉案姓名籤條">
        <div class="picker-body">
          <div class="picker-slips-fan" id="cork-picker-grid"></div>
        </div>
      </div>
    `;
    document.body.appendChild(this.pickerModal);

    this.pickerBackdrop = this.pickerModal.querySelector('.picker-backdrop');
    this.pickerGrid = this.pickerModal.querySelector('#cork-picker-grid');

    this.pickerBackdrop.addEventListener('click', () => this.hidePicker());
  }

  showPicker(charId) {
    if (!this.caseData) return;
    this.activeCharId = charId;
    const peopleList = this.caseData.wordBank.people || [];
    const currentGuess = storage.getWhoGuesses(this.caseData.id)[charId];

    this.pickerGrid.innerHTML = peopleList.map((name, idx) => {
      const isSelected = name === currentGuess;
      return `
        <button class="picker-word-btn ${isSelected ? 'is-selected' : ''}" data-word="${name}" type="button">
          <span class="card-serial">№ 0${idx + 1}</span>
          <span class="word-text">${name}</span>
        </button>
      `;
    }).join('');

    this.pickerGrid.querySelectorAll('.picker-word-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const word = btn.getAttribute('data-word');
        this.fillSlot(this.activeCharId, word);
        this.hidePicker();
      });
    });

    this.pickerModal.classList.add('is-open');
    audio.playSFX('paper_slide');
  }

  hidePicker() {
    this.pickerModal.classList.remove('is-open');
    this.activeCharId = null;
  }

  render(caseData) {
    this.caseData = caseData;
    const caseId = caseData.id;
    const isWhoSolved = storage.isWhoSolved(caseId);
    const whoGuesses = storage.getWhoGuesses(caseId);
    const labels = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

    const chars = caseData.characters || [];

    let html = `
      <div class="corkboard-screen-wrapper">
        <!-- Floating Diegetic Tags, No Solid Top Bar -->
        <div class="corkboard-top-controls">
          <button class="cork-pinned-return-tag btn-back-to-desk" id="btn-cork-back-desk" type="button" aria-label="返回案頭">
            <span class="tag-pushpin"></span>
            <span class="tag-label">← 返回案頭</span>
          </button>
          <div class="cork-pinned-header-tag">
            <span class="cork-header-text">〈${caseData.symbol}〉 ${caseData.title} · 人物指認牆</span>
          </div>
        </div>

        <div class="corkboard-scroll-area">
          <div class="corkboard-folio">
            <!-- Small Vintage Pinned Memo Scrap -->
            <div class="corkboard-pinned-memo-scrap">
              <span class="memo-brass-tack"></span>
              <div class="memo-scrap-content">
                <span class="memo-tag-line">POLÍCIA DE MACAU · 涉案指認板</span>
                <p class="cork-instruction">
                  依證詞物證點擊相片下方膠布名條指認姓名。
                </p>
              </div>
            </div>

            <!-- Polaroid Grid with Blank Name-Tape Strips -->
            <div class="corkboard-pins-grid">
              ${chars.map((charId, idx) => {
                const char = PORTRAITS[charId];
                if (!char) return '';
                const guess = whoGuesses[charId];
                const isFilled = !!guess;
                const neutralLabel = `人物${labels[idx] || (idx + 1)}`;
                const displayName = isWhoSolved ? char.name : (guess || '──────');

                return `
                  <div class="cork-polaroid-card ${isFilled ? 'is-filled' : ''} ${isWhoSolved ? 'is-solved' : ''}" data-char-id="${char.id}">
                    <div class="cork-pin" aria-hidden="true"></div>
                    <div class="cork-photo-frame">
                      <img class="cork-portrait-img" src="${char.img}" alt="${neutralLabel}" loading="lazy" />
                    </div>
                    <div class="cork-card-caption">
                      <span class="cork-code-label">${neutralLabel}</span>
                      
                      <!-- Blank Name-Tape Strip (No dashed button) -->
                      <button class="cork-name-slot cork-name-tape ${isFilled ? 'has-value' : 'is-empty'}" data-char-id="${char.id}" ${isWhoSolved ? 'disabled' : ''} type="button" aria-label="指認 ${neutralLabel} 姓名">
                        <span class="tape-edge left"></span>
                        <span class="slot-text">${displayName}</span>
                        <span class="tape-edge right"></span>
                      </button>

                      ${isWhoSolved ? `<div class="cork-solved-chip">${char.role || ''}</div>` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Verification Rubber Stamp -->
            <div class="corkboard-action-section">
              <div id="corkboard-feedback" class="cork-feedback-banner"></div>
              ${!isWhoSolved ? `
                <button class="btn-check-corkboard-stamp" id="btn-cork-check" type="button">
                  <span class="stamp-text">【 鈐印核實人物名冊 】</span>
                </button>
              ` : `
                <div class="cork-solved-stamp">
                  <span class="stamp-seal-text">【 司法警察司 · 人物全數歸位 】</span>
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.bindEvents();
  }

  bindEvents() {
    const backBtn = this.container.querySelector('#btn-cork-back-desk');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        audio.playSFX('paper_slide');
        this.onBackToDesk();
      });
    }

    this.container.querySelectorAll('.cork-name-slot').forEach(slot => {
      slot.addEventListener('click', (e) => {
        e.stopPropagation();
        const charId = slot.getAttribute('data-char-id');
        this.showPicker(charId);
      });
    });

    const checkBtn = this.container.querySelector('#btn-cork-check');
    if (checkBtn) {
      checkBtn.addEventListener('click', () => {
        this.handleCheck();
      });
    }
  }

  fillSlot(charId, word) {
    if (!this.caseData) return;
    storage.setWhoGuess(this.caseData.id, charId, word);
    audio.playSFX('pen_scratch');
    this.render(this.caseData);
  }

  handleCheck() {
    if (!this.caseData) return;
    const caseId = this.caseData.id;
    const guesses = storage.getWhoGuesses(caseId);

    const result = checkWhosWho(this.caseData.whosWho, guesses);
    const feedbackEl = document.getElementById('corkboard-feedback');

    if (result.status === CHECK_STATUS.INCOMPLETE) {
      feedbackEl.className = 'cork-feedback-banner is-incomplete';
      feedbackEl.innerHTML = `<span>還有人物尚未填寫姓名，請核對案卷線索。</span>`;
      audio.playSFX('error_tick');
    } else if (result.status === CHECK_STATUS.CORRECT) {
      storage.setWhoSolved(caseId, true);
      audio.playSFX('stamp_thud');
      this.render(this.caseData);
      this.onWhoSolved(this.caseData);
    } else if (result.status === CHECK_STATUS.FEW_ERRORS) {
      feedbackEl.className = 'cork-feedback-banner is-few-errors';
      feedbackEl.innerHTML = `<span>【初步指認】名冊中有 <strong>2 處或以下</strong> 姓名有誤，已極為接近。</span>`;
      audio.playSFX('error_tick');
    } else {
      feedbackEl.className = 'cork-feedback-banner is-many-errors';
      feedbackEl.innerHTML = `<span>【指認有誤】名冊中有多處錯誤，請比對口供與證言。</span>`;
      audio.playSFX('error_tick');
    }
  }
}
