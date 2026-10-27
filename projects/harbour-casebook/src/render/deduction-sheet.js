/**
 * 濠江疑案 · Harbour Casebook
 * 推理填詞卷與印章渲染器 (Deduction Sheet & Word Picker)
 * 嚴格符合 2 點擊直達填入、Golden Idol 部分回饋、人物譜核對與結案紅印
 */

import { checkSection, isAllSectionsSolved, checkWhosWho, CHECK_STATUS } from '../engine/deduction.js';
import { storage } from '../engine/storage.js';
import { audio } from '../engine/audio.js';
import { PORTRAITS } from '../data/portraits.js';
import { ICONS } from '../utils/icons.js';

const CATEGORY_NAMES = {
  people: '人名',
  objects: '物證',
  motives: '作案動機',
  places: '涉案地點',
  weapons: '行兇兇器',
  times: '關鍵時刻',
  methods: '致命手法',
  poisons: '毒物種類'
};

export class DeductionSheet {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.caseData = null;
    this.onCaseSolved = options.onCaseSolved || (() => {});
    this.onViewEpilogue = options.onViewEpilogue || (() => {});
    this.onSlotFill = options.onSlotFill || (() => {});

    // Active slot being filled
    this.activeSlot = null; // { mode: 'section'|'who', sectionId, slotKey, slotType, slotLabel, portraitId }
    this.activePickerEl = null;

    this.initPickerModal();
  }

  initPickerModal() {
    this.pickerModal = document.createElement('div');
    this.pickerModal.className = 'word-picker-modal';
    this.pickerModal.innerHTML = `
      <div class="picker-backdrop"></div>
      <div class="picker-panel" role="dialog" aria-labelledby="picker-title">
        <div class="picker-header">
          <div class="picker-title-group">
            <span class="picker-tag" id="picker-type-tag">人名</span>
            <h4 class="picker-title" id="picker-title">選取詞語填入</h4>
          </div>
          <button class="picker-close-btn" aria-label="取消選詞">&times;</button>
        </div>
        <div class="picker-body">
          <div class="picker-words-grid" id="picker-grid"></div>
        </div>
        <div class="picker-footer">
          <button class="picker-clear-btn" id="picker-clear">清空此格</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.pickerModal);

    this.pickerBackdrop = this.pickerModal.querySelector('.picker-backdrop');
    this.pickerCloseBtn = this.pickerModal.querySelector('.picker-close-btn');
    this.pickerClearBtn = this.pickerModal.querySelector('#picker-clear');
    this.pickerGrid = this.pickerModal.querySelector('#picker-grid');
    this.pickerTypeTag = this.pickerModal.querySelector('#picker-type-tag');
    this.pickerTitle = this.pickerModal.querySelector('#picker-title');

    this.pickerBackdrop.addEventListener('click', () => this.hideWordPicker());
    this.pickerCloseBtn.addEventListener('click', () => this.hideWordPicker());
    this.pickerClearBtn.addEventListener('click', () => {
      if (this.activeSlot) {
        if (this.activeSlot.mode === 'who') {
          this.fillWhoSlot(this.activeSlot.portraitId, null);
        } else {
          this.fillSlot(this.activeSlot.sectionId, this.activeSlot.slotKey, null);
        }
        this.hideWordPicker();
      }
    });
  }

  render(caseData) {
    this.caseData = caseData;
    const caseState = storage.getCaseState(caseData.id);
    const isCaseSolved = storage.isCaseSolved(caseData.id);

    let html = `
      <div class="deduction-scroll-area">
        <!-- Case Top Header -->
        <header class="deduction-header">
          <div class="deduction-seal-badge">
            <span class="seal-symbol">${caseData.symbol}</span>
            <span class="case-number">CASE 0${caseData.id}</span>
          </div>
          <div class="deduction-title-text">
            <h2 class="deduction-case-title">〈${caseData.symbol}〉 ${caseData.title}</h2>
            <p class="deduction-case-subtitle">${caseData.date} · ${caseData.location}</p>
          </div>
        </header>

        <!-- Incident Summary Card -->
        <div class="incident-summary-card">
          <div class="archival-stamp-header">
            <span class="archival-dot"></span> 案發陳述 · 待決疑雲
          </div>
          <p class="incident-intro-text">${caseData.incidentIntro}</p>
        </div>

        <!-- Who's Who Character Portraits Matching Matrix -->
        ${this.renderWhosWhoSection(caseData)}

        <!-- Deduction Sentence Sections -->
        <div class="sections-list">
    `;

    caseData.deductionSections.forEach((sec, idx) => {
      const isSolved = storage.isSectionSolved(caseData.id, sec.id);
      const filled = caseState.filledSlots[sec.id] || {};

      html += `
        <article class="deduction-section-card ${isSolved ? 'is-solved' : ''}" data-section-id="${sec.id}">
          <div class="section-card-header">
            <div class="section-header-left">
              <span class="section-index-tag">${idx + 1}</span>
              <h3 class="section-title">${sec.title}</h3>
            </div>
            ${isSolved ? `<span class="section-lock-badge">${ICONS.check(14, '#4F6F5F')} 已結核</span>` : ''}
          </div>
          <p class="section-desc">${sec.desc}</p>

          <!-- Sentence Template with Clickable Blanks -->
          <div class="section-sentence-box">
            ${this.renderTemplateWithBlanks(sec, filled, isSolved)}
          </div>

          <!-- Section Feedback Message Banner -->
          <div class="section-feedback-banner" id="feedback-${sec.id}"></div>

          <!-- Section Footer Actions (Check Button & Hint Trigger) -->
          <div class="section-footer-actions">
            ${!isSolved ? `
              <button class="btn-check-section" data-section-id="${sec.id}">
                ${ICONS.scale(16, '#FAF6EE')} 驗證此節推理
              </button>
            ` : `
              <div class="section-solved-stamp">
                <span class="solved-ink-text">【核實定案】</span>
              </div>
            `}
            <button class="btn-hint-trigger" data-section-id="${sec.id}" title="案件錦囊提示">
              ${ICONS.lamp(16, 'currentColor')} 錦囊提示
            </button>
          </div>
        </article>
      `;
    });

    const isSectionsAllSolved = isAllSectionsSolved(caseData, caseState.solvedSections);
    const isWhoSolved = !caseData.whosWho || caseData.whosWho.length === 0 || storage.isWhoSolved(caseData.id);
    const isFullySolved = isCaseSolved || (isSectionsAllSolved && isWhoSolved);

    html += `
        </div>

        <!-- Case Resolution Block (Red Seal & Epilogue Button) -->
        <div class="case-resolution-zone ${isFullySolved ? 'is-visible' : ''}">
          <div class="big-vermilion-seal">
            <div class="seal-inner-circle">
              <span class="seal-word-top">濠江</span>
              <span class="seal-word-main">結案</span>
              <span class="seal-word-bottom">警務局印</span>
            </div>
          </div>
          <div class="resolution-actions">
            <h3 class="resolution-title">全案推理告破！</h3>
            <p class="resolution-desc">所有疑點均已釐清，物證與證言已嚴絲合縫形成完整證據鏈。</p>
            <button class="btn-view-epilogue" id="btn-open-epilogue">
              ${ICONS.scroll(18, '#FAF6EE')} 閱讀「破案始末」真相
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.bindDOMEvents();
  }

  renderWhosWhoSection(caseData) {
    if (!caseData.characters || caseData.characters.length === 0) return '';
    const isWhoSolved = storage.isWhoSolved(caseData.id);
    const whoGuesses = storage.getWhoGuesses(caseData.id);
    const labels = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

    return `
      <div class="whos-who-section ${isWhoSolved ? 'is-who-solved' : ''}">
        <div class="whos-who-header">
          <div class="whos-who-header-left">
            <span class="whos-who-tag">人物譜</span>
            <h4 class="whos-who-title">涉案人物歸位辨識</h4>
          </div>
          ${isWhoSolved ? `<span class="who-solved-badge">${ICONS.check(14, '#4F6F5F')} 人物已全數歸位</span>` : `
            <button class="btn-check-who" id="btn-check-who">
              ${ICONS.scale(14, 'currentColor')} 核對人物
            </button>
          `}
        </div>
        <p class="whos-who-desc">依據現場供詞與物證，點擊肖像下方空白指認各人真實姓名：</p>
        <div class="portraits-horizontal-scroll">
          ${caseData.characters.map((charId, idx) => {
            const char = PORTRAITS[charId];
            if (!char) return '';
            const guess = whoGuesses[charId];
            const isFilled = !!guess;
            const neutralLabel = `人物${labels[idx] || (idx + 1)}`;

            return `
              <div class="portrait-card" data-char-id="${char.id}">
                <div class="portrait-avatar" title="${isWhoSolved ? char.name : '點擊檢視肖像檔案'}">
                  ${char.svg}
                </div>
                <div class="portrait-slot-wrap">
                  ${isWhoSolved ? `
                    <span class="who-confirmed-name">${char.name}</span>
                  ` : `
                    <button class="who-blank ${isFilled ? 'is-filled' : 'is-empty'}" data-portrait-id="${char.id}" data-portrait-label="${neutralLabel}">
                      <span class="blank-inner">${isFilled ? guess : '＿＿姓名＿＿'}</span>
                    </button>
                  `}
                </div>
                <div class="portrait-title">${isWhoSolved ? char.title : neutralLabel}</div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="who-feedback-banner" id="who-feedback"></div>
      </div>
    `;
  }

  /**
   * CRITICAL FIX: Single-line string for each blank button so no newlines ever break into HTML tag!
   */
  renderTemplateWithBlanks(section, filledSlots, isSolved) {
    let output = section.template;

    section.slots.forEach(slot => {
      const val = filledSlots[slot.key];
      const isFilled = !!val;
      // Single contiguous HTML string with no internal newlines:
      const blankHtml = `<button class="deduction-blank ${isFilled ? 'is-filled' : 'is-empty'} ${isSolved ? 'is-locked' : ''}" data-section-id="${section.id}" data-slot-key="${slot.key}" data-slot-type="${slot.type}" data-slot-label="${slot.label}" ${isSolved ? 'disabled' : ''}><span class="blank-inner">${isFilled ? val : `＿＿${slot.label}＿＿`}</span></button>`;
      output = output.replace(new RegExp(`\\{${slot.key}\\}`, 'g'), blankHtml);
    });

    return output.replace(/\n/g, '<br/>');
  }

  bindDOMEvents() {
    // Blank click -> open word picker
    this.container.querySelectorAll('.deduction-blank:not(.is-locked)').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sectionId = btn.getAttribute('data-section-id');
        const slotKey = btn.getAttribute('data-slot-key');
        const slotType = btn.getAttribute('data-slot-type');
        const slotLabel = btn.getAttribute('data-slot-label');
        this.openWordPicker('section', { sectionId, slotKey, slotType, slotLabel });
      });
    });

    // Who's Who blank click -> open word picker for people
    this.container.querySelectorAll('.who-blank').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const portraitId = btn.getAttribute('data-portrait-id');
        const portraitLabel = btn.getAttribute('data-portrait-label') || '涉案人物';
        this.openWordPicker('who', {
          portraitId,
          slotType: 'people',
          slotLabel: portraitLabel
        });
      });
    });

    // Check Who's Who button
    const checkWhoBtn = this.container.querySelector('#btn-check-who');
    if (checkWhoBtn) {
      checkWhoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleCheckWhosWho();
      });
    }

    // Check section button
    this.container.querySelectorAll('.btn-check-section').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sectionId = btn.getAttribute('data-section-id');
        this.handleCheckSection(sectionId);
      });
    });

    // Hint button
    this.container.querySelectorAll('.btn-hint-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sectionId = btn.getAttribute('data-section-id');
        this.handleShowHint(sectionId);
      });
    });

    // Epilogue button
    const epilogueBtn = this.container.querySelector('#btn-open-epilogue');
    if (epilogueBtn) {
      epilogueBtn.addEventListener('click', () => {
        this.onViewEpilogue(this.caseData);
      });
    }

    // Portrait card avatar tap for character bio modal
    this.container.querySelectorAll('.portrait-avatar').forEach(avatar => {
      avatar.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = avatar.closest('.portrait-card');
        const charId = card?.getAttribute('data-char-id');
        if (charId) this.showCharacterBio(charId);
      });
    });
  }

  openWordPicker(mode, params) {
    this.activeSlot = { mode, ...params };
    const caseState = storage.getCaseState(this.caseData.id);
    const collectedWords = new Set(caseState.collectedWords || []);
    const categoryName = CATEGORY_NAMES[params.slotType] || params.slotType;

    this.pickerTypeTag.textContent = categoryName;
    if (mode === 'who') {
      this.pickerTitle.textContent = `選取【${params.slotLabel}】姓名`;
    } else {
      this.pickerTitle.textContent = `選取【${params.slotLabel}】`;
    }

    // Retrieve all words in case wordBank of this type
    const allBankWords = this.caseData.wordBank[params.slotType] || [];

    this.pickerGrid.innerHTML = '';

    if (allBankWords.length === 0) {
      this.pickerGrid.innerHTML = `<div class="empty-picker-msg">暫無可選詞語</div>`;
    } else {
      let currentVal = null;
      if (mode === 'who') {
        currentVal = storage.getWhoGuesses(this.caseData.id)[params.portraitId];
      } else {
        currentVal = caseState.filledSlots[params.sectionId]?.[params.slotKey];
      }

      allBankWords.forEach(word => {
        const isCollected = collectedWords.has(word);
        const isCurrentlySelected = currentVal === word;

        const wordBtn = document.createElement('button');
        wordBtn.className = `picker-word-item ${isCollected ? 'is-collected' : 'is-uncollected'} ${isCurrentlySelected ? 'is-active' : ''}`;
        wordBtn.innerHTML = `
          <span class="word-text">${word}</span>
          ${isCollected ? `<span class="collected-check">${ICONS.check(14, '#4F6F5F')}</span>` : `<span class="uncollected-lock">${ICONS.lock(12, 'currentColor')}</span>`}
        `;

        wordBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!isCollected) {
            audio.playSFX('error_tick');
            wordBtn.classList.add('shake-anim');
            setTimeout(() => wordBtn.classList.remove('shake-anim'), 300);
            return;
          }

          // 2-tap fill action!
          if (mode === 'who') {
            this.fillWhoSlot(params.portraitId, word);
          } else {
            this.fillSlot(params.sectionId, params.slotKey, word);
          }
          this.hideWordPicker();
        });

        this.pickerGrid.appendChild(wordBtn);
      });
    }

    this.pickerModal.classList.add('is-open');
    audio.playSFX('paper_slide');
  }

  hideWordPicker() {
    this.pickerModal.classList.remove('is-open');
    this.activeSlot = null;
  }

  fillSlot(sectionId, slotKey, word) {
    storage.setSlotValue(this.caseData.id, sectionId, slotKey, word);
    audio.playSFX('pen_scratch');
    if (this.onSlotFill) this.onSlotFill();
    this.render(this.caseData);
  }

  fillWhoSlot(portraitId, name) {
    storage.setWhoGuess(this.caseData.id, portraitId, name);
    audio.playSFX('pen_scratch');
    if (this.onSlotFill) this.onSlotFill();
    this.render(this.caseData);
  }

  handleCheckWhosWho() {
    const whoGuesses = storage.getWhoGuesses(this.caseData.id);
    const result = checkWhosWho(this.caseData.whosWho, whoGuesses);

    const banner = this.container.querySelector('#who-feedback');
    if (!banner) return;

    if (result.status === CHECK_STATUS.CORRECT) {
      audio.playSFX('stamp_thud');
      storage.setWhoSolved(this.caseData.id, true);
      banner.className = 'who-feedback-banner feedback-correct';
      banner.innerHTML = `
        <div class="feedback-content">
          <span class="feedback-icon">${ICONS.check(16, '#4F6F5F')}</span>
          <span class="feedback-text">${result.message}</span>
        </div>
      `;

      // Gate check: has all sections also been solved?
      const caseState = storage.getCaseState(this.caseData.id);
      const allSectionsSolved = isAllSectionsSolved(this.caseData, caseState.solvedSections);
      if (allSectionsSolved) {
        storage.markCaseSolved(this.caseData.id);
        setTimeout(() => this.triggerBigSolveCelebration(), 500);
      } else {
        setTimeout(() => this.render(this.caseData), 600);
      }
    } else if (result.status === CHECK_STATUS.PARTIAL) {
      audio.playSFX('paper_slide');
      banner.className = 'who-feedback-banner feedback-partial';
      banner.innerHTML = `
        <div class="feedback-content">
          <span class="feedback-icon">${ICONS.search(16, '#7D5A00')}</span>
          <span class="feedback-text">${result.message}</span>
        </div>
      `;
    } else {
      audio.playSFX('error_tick');
      banner.className = 'who-feedback-banner feedback-many_errors';
      banner.innerHTML = `
        <div class="feedback-content">
          <span class="feedback-icon">${ICONS.alert(16, '#9A3B2C')}</span>
          <span class="feedback-text">${result.message}</span>
        </div>
      `;
    }
  }

  handleCheckSection(sectionId) {
    const sec = this.caseData.deductionSections.find(s => s.id === sectionId);
    if (!sec) return;

    const caseState = storage.getCaseState(this.caseData.id);
    const filled = caseState.filledSlots[sectionId] || {};
    const result = checkSection(sec, filled);

    const banner = this.container.querySelector(`#feedback-${sectionId}`);
    if (!banner) return;

    banner.className = `section-feedback-banner feedback-${result.status.toLowerCase()}`;
    const icon = result.status === CHECK_STATUS.CORRECT
      ? ICONS.check(16, '#4F6F5F')
      : (result.status === CHECK_STATUS.PARTIAL ? ICONS.search(16, '#7D5A00') : ICONS.alert(16, '#9A3B2C'));

    banner.innerHTML = `
      <div class="feedback-content">
        <span class="feedback-icon">${icon}</span>
        <span class="feedback-text">${result.message}</span>
      </div>
    `;

    if (result.status === CHECK_STATUS.CORRECT) {
      audio.playSFX('stamp_thud');
      storage.markSectionSolved(this.caseData.id, sectionId);

      // Gate check: ALL sections solved AND Who's Who solved!
      const updatedCaseState = storage.getCaseState(this.caseData.id);
      const allSectionsSolved = isAllSectionsSolved(this.caseData, updatedCaseState.solvedSections);
      const isWhoSolved = !this.caseData.whosWho || this.caseData.whosWho.length === 0 || storage.isWhoSolved(this.caseData.id);

      if (allSectionsSolved && isWhoSolved) {
        storage.markCaseSolved(this.caseData.id);
        this.triggerBigSolveCelebration();
      } else {
        setTimeout(() => this.render(this.caseData), 600);
      }
    } else if (result.status === CHECK_STATUS.PARTIAL) {
      audio.playSFX('paper_slide');
    } else {
      audio.playSFX('error_tick');
    }
  }

  triggerBigSolveCelebration() {
    this.render(this.caseData);
    audio.playSFX('stamp_thud');

    const zone = this.container.querySelector('.case-resolution-zone');
    if (zone) {
      zone.scrollIntoView({ behavior: 'smooth' });
    }

    if (this.onCaseSolved) {
      this.onCaseSolved(this.caseData);
    }
  }

  handleShowHint(sectionId) {
    const sec = this.caseData.deductionSections.find(s => s.id === sectionId);
    if (!sec || !sec.hints || sec.hints.length === 0) return;

    storage.incrementHintUsed(this.caseData.id);
    audio.playSFX('hint_chime');

    const banner = this.container.querySelector(`#feedback-${sectionId}`);
    if (!banner) return;

    const caseState = storage.getCaseState(this.caseData.id);
    const hintIdx = Math.min(sec.hints.length - 1, (caseState.hintsUsed || 1) - 1);
    const hintText = sec.hints[hintIdx];

    banner.className = 'section-feedback-banner feedback-hint';
    banner.innerHTML = `
      <div class="feedback-content">
        <span class="feedback-icon">${ICONS.lamp(16, '#244156')}</span>
        <div class="feedback-hint-body">
          <strong>案件錦囊（層級 ${hintIdx + 1}/3）：</strong>
          <p>${hintText}</p>
        </div>
      </div>
    `;
  }

  showCharacterBio(charId) {
    const char = PORTRAITS[charId];
    if (!char) return;

    audio.playSFX('paper_slide');
    const isWhoSolved = storage.isWhoSolved(this.caseData.id);
    const modal = document.createElement('div');
    modal.className = 'bio-modal-overlay';

    if (!isWhoSolved) {
      modal.innerHTML = `
        <div class="bio-modal-content">
          <div class="bio-avatar-frame">${char.svg}</div>
          <div class="bio-text-group">
            <h3 class="bio-name">涉案人物 · 身份待查</h3>
            <div class="bio-meta">澳督府警務局 · 1962 卷宗肖像</div>
            <p class="bio-desc">此人容貌特徵已由刑偵畫師繪入卷宗。因現場人證供詞互有出入，真實姓名與涉案身份尚待查明。請在人物譜填入姓名並完成核對。</p>
          </div>
          <button class="bio-close-btn">返回推理</button>
        </div>
      `;
    } else {
      modal.innerHTML = `
        <div class="bio-modal-content">
          <div class="bio-avatar-frame">${char.svg}</div>
          <div class="bio-text-group">
            <h3 class="bio-name">${char.name}</h3>
            <div class="bio-meta">${char.age} · ${char.title}</div>
            <p class="bio-desc">${char.desc}</p>
          </div>
          <button class="bio-close-btn">確認卷宗</button>
        </div>
      `;
    }
    document.body.appendChild(modal);

    const close = () => {
      if (modal.parentNode) modal.parentNode.removeChild(modal);
    };
    modal.querySelector('.bio-close-btn').addEventListener('click', close);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });
  }
}
