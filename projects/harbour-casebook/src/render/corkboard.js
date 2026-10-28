/**
 * 濠江疑案 · Harbour Casebook
 * 軟木板人物關係牆渲染器 (Diegetic Corkboard Renderer)
 * 渲染於 assets/art/corkboard.webp 上，展示圖釘照片、人物甲/乙/丙代稱與歸位核對
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
      <div class="picker-panel" role="dialog" aria-labelledby="cork-picker-title">
        <div class="picker-header">
          <div class="picker-title-group">
            <span class="picker-tag">涉案人名</span>
            <h4 class="picker-title" id="cork-picker-title">指認人物姓名</h4>
          </div>
          <button class="picker-close-btn" aria-label="取消選詞">&times;</button>
        </div>
        <div class="picker-body">
          <div class="picker-words-grid" id="cork-picker-grid"></div>
        </div>
        <div class="picker-footer">
          <button class="picker-clear-btn" id="cork-picker-clear">清空此格</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.pickerModal);

    this.pickerBackdrop = this.pickerModal.querySelector('.picker-backdrop');
    this.pickerCloseBtn = this.pickerModal.querySelector('.picker-close-btn');
    this.pickerClearBtn = this.pickerModal.querySelector('#cork-picker-clear');
    this.pickerGrid = this.pickerModal.querySelector('#cork-picker-grid');

    this.pickerBackdrop.addEventListener('click', () => this.hidePicker());
    this.pickerCloseBtn.addEventListener('click', () => this.hidePicker());
    this.pickerClearBtn.addEventListener('click', () => {
      if (this.activeCharId && this.caseData) {
        this.fillSlot(this.activeCharId, null);
        this.hidePicker();
      }
    });
  }

  showPicker(charId) {
    if (!this.caseData) return;
    this.activeCharId = charId;
    const peopleList = this.caseData.wordBank.people || [];
    const currentGuess = storage.getWhoGuesses(this.caseData.id)[charId];

    this.pickerGrid.innerHTML = peopleList.map(name => {
      const isSelected = name === currentGuess;
      return `
        <button class="picker-word-btn ${isSelected ? 'is-selected' : ''}" data-word="${name}">
          ${name}
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
        <header class="corkboard-top-bar">
          <button class="btn-desk-nav btn-back-to-desk" id="btn-cork-back-desk">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>返回案頭</span>
          </button>
          <div class="corkboard-title-group">
            <span class="corkboard-badge">CASE 0${caseData.id} 涉案人物</span>
            <h2 class="corkboard-headline">軟木板 · 人物歸位</h2>
          </div>
          <div class="corkboard-status-badge">
            ${isWhoSolved 
              ? `<span class="badge-who-done">${ICONS.check(14, '#4F6F5F')} 已歸位</span>`
              : `<span class="badge-who-pending">待指認</span>`
            }
          </div>
        </header>

        <div class="corkboard-scroll-area">
          <div class="corkboard-folio">
            <div class="corkboard-note-card">
              <p class="cork-instruction">
                每張黑白檔案照片均以大頭針釘於牆上。依據供詞、信件與物證，點擊照片下方名牌指認各人真實姓名。未結案前，均以「人物甲、人物乙…」稱之。
              </p>
            </div>

            <div class="corkboard-pins-grid">
              ${chars.map((charId, idx) => {
                const char = PORTRAITS[charId];
                if (!char) return '';
                const guess = whoGuesses[charId];
                const isFilled = !!guess;
                const neutralLabel = `人物${labels[idx] || (idx + 1)}`;
                const displayName = isWhoSolved ? char.name : (guess || '點擊指認姓名');

                return `
                  <div class="cork-polaroid-card ${isFilled ? 'is-filled' : ''} ${isWhoSolved ? 'is-solved' : ''}" data-char-id="${char.id}">
                    <div class="cork-pin" aria-hidden="true"></div>
                    <div class="cork-photo-frame">
                      <img class="cork-portrait-img" src="${char.img}" alt="${neutralLabel}" loading="lazy" />
                    </div>
                    <div class="cork-card-caption">
                      <span class="cork-code-label">${neutralLabel}</span>
                      <button class="cork-name-slot ${isFilled ? 'has-value' : 'is-empty'}" data-char-id="${char.id}" ${isWhoSolved ? 'disabled' : ''}>
                        <span class="slot-text">${displayName}</span>
                        ${!isWhoSolved ? `<span class="slot-caret">▾</span>` : ''}
                      </button>
                      ${isWhoSolved ? `<div class="cork-solved-chip">${char.role || ''}</div>` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <div class="corkboard-action-section">
              <div id="corkboard-feedback" class="cork-feedback-banner"></div>
              ${!isWhoSolved ? `
                <button class="btn-check-corkboard" id="btn-cork-check">
                  ${ICONS.scale(16, 'currentColor')} 核對人物名冊
                </button>
              ` : `
                <div class="cork-solved-stamp">
                  <span class="stamp-seal-text">【人物全數歸位】</span>
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
    // Back to desk
    const backBtn = this.container.querySelector('#btn-cork-back-desk');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        audio.playSFX('paper_slide');
        this.onBackToDesk();
      });
    }

    // Name slot click -> open picker
    this.container.querySelectorAll('.cork-name-slot:not([disabled])').forEach(slot => {
      slot.addEventListener('click', (e) => {
        e.stopPropagation();
        const charId = slot.getAttribute('data-char-id');
        this.showPicker(charId);
      });
    });

    // Check button
    const checkBtn = this.container.querySelector('#btn-cork-check');
    if (checkBtn) {
      checkBtn.addEventListener('click', () => {
        this.validateWho();
      });
    }
  }

  validateWho() {
    if (!this.caseData) return;
    const result = checkWhosWho(this.caseData, storage.getWhoGuesses(this.caseData.id));
    const fbEl = this.container.querySelector('#corkboard-feedback');
    if (!fbEl) return;

    fbEl.className = 'cork-feedback-banner is-visible';

    if (result.status === CHECK_STATUS.INCOMPLETE) {
      audio.playSFX('error_tick');
      fbEl.classList.add('status-incomplete');
      fbEl.innerHTML = `<strong>尚未填妥：</strong>請先為每位人物選定身分再行核對。`;
    } else if (result.status === CHECK_STATUS.ALL_CORRECT) {
      audio.playSFX('stamp_thud');
      fbEl.classList.add('status-correct');
      fbEl.innerHTML = `<strong>全數正確！</strong>所有涉案人物之真實姓名已完全吻合。`;
      storage.setWhoSolved(this.caseData.id, true);
      this.onWhoSolved(this.caseData);
      setTimeout(() => this.render(this.caseData), 600);
    } else if (result.status === CHECK_STATUS.PARTIAL) {
      audio.playSFX('error_tick');
      fbEl.classList.add('status-partial');
      fbEl.innerHTML = `<strong>接近真相：</strong>目前有 2 處或以下錯誤，請再加審思。`;
    } else {
      audio.playSFX('error_tick');
      fbEl.classList.add('status-incorrect');
      fbEl.innerHTML = `<strong>身分不符：</strong>多處指認有誤，請詳查口供與物證。`;
    }
  }

  fillSlot(charId, value) {
    if (!this.caseData) return;
    storage.setWhoGuess(this.caseData.id, charId, value);
    audio.playSFX('pen_scratch');
    this.render(this.caseData);
  }
}
