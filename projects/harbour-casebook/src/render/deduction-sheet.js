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
    this.onBackToDesk = options.onBackToDesk || (() => {});
    this.onGoToScene = options.onGoToScene || (() => {});
    this.onGoToCorkboard = options.onGoToCorkboard || (() => {});

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
      <div class="picker-panel loose-fan-tray" role="dialog" aria-label="案卷卡片">
        <div class="picker-body">
          <div class="picker-cards-fan" id="picker-grid"></div>
        </div>
      </div>
    `;
    document.body.appendChild(this.pickerModal);

    this.pickerBackdrop = this.pickerModal.querySelector('.picker-backdrop');
    this.pickerCloseBtn = this.pickerModal.querySelector('.picker-close-btn');
    this.pickerGrid = this.pickerModal.querySelector('#picker-grid');
    this.pickerTypeTag = this.pickerModal.querySelector('#picker-type-tag');
    this.pickerTitle = this.pickerModal.querySelector('#picker-title');

    this.pickerBackdrop.addEventListener('click', () => this.hideWordPicker());
    if (this.pickerCloseBtn) {
      this.pickerCloseBtn.addEventListener('click', () => this.hideWordPicker());
    }
  }

  render(caseData) {
    if (caseData) this.caseData = caseData;
    if (!this.caseData) return;
    const currentCase = this.caseData;
    const caseState = storage.getCaseState(currentCase.id);
    const isCaseSolved = storage.isCaseSolved(currentCase.id);
    const isWhoComplete = storage.isWhoSolved(currentCase.id);
    const isSectionsAllSolved = isAllSectionsSolved(currentCase, caseState.solvedSections);
    const isWhoSolved = !currentCase.whosWho || currentCase.whosWho.length === 0 || isWhoComplete;
    const isFullySolved = isCaseSolved || (isSectionsAllSolved && isWhoSolved);

    if (isFullySolved) {
      this.container.innerHTML = `
        <div class="deduction-screen-wrapper is-case-resolved">
          <div class="case-resolution-zone is-visible">
            <div class="docket-closure-banner">
              <div class="docket-colonial-stamp">
                <span class="docket-pt">GOVERNO DE MACAU · COMISSARIADO DA POLÍCIA JUDICIÁRIA</span>
                <span class="docket-zh">澳門司法警察司 · 刑事偵查卷宗 · 審查完結歸檔</span>
              </div>
              <div class="docket-ref-line">
                <span>PROC. CRIME N.º 62/1962</span>
                <span>CONFIDENCIAL · 機密存檔</span>
              </div>
            </div>

            <!-- Official Red Vermilion Case Seal -->
            <button class="btn-dossier-seal-trigger" id="btn-open-epilogue" aria-label="全案告破，點擊硃砂大印開閱破案始末">
              <div class="stamp-seal-ceremony-wrapper">
                <img class="seal-jiean-img animate-stamp" src="assets/ui/seal_jiean_sm.webp" alt="結案硃砂印" />
                <div class="stamp-ink-splatter"></div>
              </div>
              <div class="stamp-action-callout">
                <span class="stamp-callout-primary">硃砂印落 · 全案告破</span>
              </div>
            </button>
          </div>
        </div>
      `;
      this.bindDOMEvents();
      return;
    }

    let html = `
      <div class="deduction-screen-wrapper ${isFullySolved ? 'is-case-resolved' : ''}">
        <!-- Folio Paper Edge Tabs (Diegetic Tabs, No Boxed Top Bar) -->
        <div class="folio-edge-tabs-strip">
          <button class="folio-paper-tab tab-back-desk btn-back-to-desk" id="btn-deduction-back-desk" type="button" aria-label="返回案頭">
            <span class="tab-label">← 案頭</span>
          </button>
          <button class="folio-paper-tab tab-go-scene btn-jump-scene" id="btn-deduction-go-scene" type="button" aria-label="勘驗現場">
            <span class="tab-label">現場 →</span>
          </button>
        </div>

        <div class="deduction-scroll-area">
          <div class="deduction-police-report-folio">
            <!-- Official Portuguese Colonial Crest / Header -->
            <div class="police-report-official-head">
              <div class="official-crest-seal">
                <span class="crest-pt">GOVERNO DE MACAU · COMISSARIADO DA POLÍCIA JUDICIÁRIA</span>
                <span class="crest-zh">澳門司法警察司 · 刑事偵查破案審查表</span>
              </div>
              <span class="official-docket-no">PROC. CRIME N.º 62/1962</span>
            </div>

            <!-- Case Top Header -->
            <div class="deduction-header">
              <div class="deduction-seal-badge">
                <span class="seal-symbol">${caseData.symbol}</span>
                <span class="case-number">CASE 0${caseData.id}</span>
              </div>
              <div class="deduction-title-text">
                <h2 class="deduction-case-title">〈${caseData.symbol}〉 <span style="white-space: nowrap;">${caseData.title}</span></h2>
                <p class="deduction-case-subtitle">${caseData.date} · <span style="white-space: nowrap;">${caseData.location}</span></p>
              </div>
            </div>

            <!-- Incident Narrative (Typed Directly on Paper, No Border Box) -->
            <div class="report-narrative-paragraph">
              <div class="narrative-heading-line">
                <span class="narrative-bullet">■</span>
                <span class="narrative-heading">案發陳述 · 待決疑雲</span>
              </div>
              <p class="narrative-body-text">${caseData.incidentIntro}</p>
            </div>

            <!-- Paper-Clipped Character Strip (No Border Box) -->
            <div class="report-clipped-strip" id="btn-deduction-open-cork" role="button" tabindex="0" aria-label="檢視涉案人物關係名冊">
              <span class="paperclip-bracket">${ICONS.clip(16, '#7A6246')}</span>
              <div class="clipped-strip-text">
                <span class="clipped-tag">涉案人物名冊：</span>
                <span class="clipped-state">${isWhoComplete ? '全數人物已指認歸位 ✓' : '前往軟木板查驗姓名 →'}</span>
              </div>
            </div>

            <div class="archival-ink-rule-divider"></div>

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
                ${ICONS.scale(16, '#9A3B2C')} 鈐印核實此節
              </button>
            ` : `
              <div class="section-solved-stamp">
                <span class="solved-ink-text">司法警察司 · 查結定案</span>
              </div>
            `}
            <button class="btn-hint-trigger" data-section-id="${sec.id}" title="案件錦囊提示">
              ${ICONS.lamp(16, 'currentColor')} 卷宗錦囊
            </button>
          </div>
        </article>
      `;
    });

    html += `
        </div>

            <!-- Case Resolution Docket Closing Sheet (Diegetic 1962 Macau Police Closure) -->
            <div class="case-resolution-zone ${isFullySolved ? 'is-visible' : ''}">
              <div class="docket-closure-banner">
                <div class="docket-colonial-stamp">
                  <span class="docket-pt">GOVERNO DE MACAU · COMISSARIADO DA POLÍCIA JUDICIÁRIA</span>
                  <span class="docket-zh">澳門司法警察司 · 刑事偵查卷宗 · 審查完結歸檔</span>
                </div>
                <div class="docket-ref-line">
                  <span>PROC. CRIME N.º 62/1962</span>
                  <span>ARCHIVO CONFIDENCIAL · 機密存檔</span>
                </div>
              </div>

              <button class="btn-dossier-seal-trigger" id="btn-open-epilogue" aria-label="全案告破，點擊硃砂大印開閱破案始末">
                <div class="stamp-seal-ceremony-wrapper">
                  <img class="seal-jiean-img animate-stamp" src="assets/ui/seal_jiean_sm.webp" alt="結案硃砂印" />
                  <div class="stamp-ink-splatter"></div>
                </div>
                <div class="stamp-action-callout">
                  <span class="stamp-callout-primary">硃砂印落 · 全案告破</span>
                  <span class="stamp-callout-secondary">點擊硃砂大印 · 開閱《濠江紀實報》真相號外</span>
                </div>
              </button>
            </div>
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
                  <img class="portrait-img" src="${char.img}" alt="${isWhoSolved ? char.name : neutralLabel}" loading="lazy" />
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
    // Back to desk
    const backDeskBtn = this.container.querySelector('#btn-deduction-back-desk');
    if (backDeskBtn) {
      backDeskBtn.addEventListener('click', () => {
        audio.playSFX('paper_slide');
        this.onBackToDesk();
      });
    }

    // Jump to scene
    const goSceneBtn = this.container.querySelector('#btn-deduction-go-scene');
    if (goSceneBtn) {
      goSceneBtn.addEventListener('click', () => {
        audio.playSFX('paper_slide');
        this.onGoToScene();
      });
    }

    // Open corkboard shortcut
    const openCorkBtn = this.container.querySelector('#btn-deduction-open-cork');
    if (openCorkBtn) {
      openCorkBtn.addEventListener('click', () => {
        audio.playSFX('paper_slide');
        this.onGoToCorkboard();
      });
    }

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

    // Keep sentence readable: park cards under active blank by scrolling card into upper view
    if (mode === 'section' && params.sectionId) {
      const card = this.container.querySelector(`.deduction-section-card[data-section-id="${params.sectionId}"]`);
      const scrollArea = this.container.querySelector('.deduction-scroll-area');
      if (card && scrollArea) {
        const cardRect = card.getBoundingClientRect();
        const scrollRect = scrollArea.getBoundingClientRect();
        const targetScrollTop = scrollArea.scrollTop + (cardRect.top - scrollRect.top) - 64;
        scrollArea.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'auto' });
      }
    }

    if (this.pickerTypeTag) this.pickerTypeTag.textContent = categoryName;
    if (this.pickerTitle) {
      if (mode === 'who') {
        this.pickerTitle.textContent = `選取「${params.slotLabel}」姓名`;
      } else {
        this.pickerTitle.textContent = `選取「${params.slotLabel}」`;
      }
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
    audio.playSFX('typewriter');
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
        const scrollArea = this.container.querySelector('.deduction-scroll-area');
        const prevScrollTop = scrollArea ? scrollArea.scrollTop : 0;
        setTimeout(() => {
          this.render(this.caseData);
          const newScrollArea = this.container.querySelector('.deduction-scroll-area');
          if (newScrollArea) {
            newScrollArea.scrollTop = prevScrollTop;
          }
        }, 500);
      }
    } else if (result.status === CHECK_STATUS.PARTIAL) {
      audio.playSFX('paper_slide');
    } else {
      audio.playSFX('tension_sting');
    }
  }

  triggerBigSolveCelebration() {
    this.render(this.caseData);
    audio.playSFX('stamp_thud');
    audio.playSFX('solve_sting');

    // Create cinematic full-screen solve ceremony
    const ceremony = document.createElement('div');
    ceremony.className = 'solve-ceremony-overlay';
    ceremony.innerHTML = `
      <div class="ceremony-backdrop"></div>
      <div class="ceremony-content">
        <div class="ceremony-seal-wrap">
          <img class="ceremony-seal-img" src="assets/ui/seal_jiean_sm.webp" alt="結案" />
          <div class="ceremony-splatter"></div>
        </div>
        <h2 class="ceremony-headline">全案告破 · 結案落定</h2>
        <p class="ceremony-subtext">GOVERNO DE MACAU · 司法警察司存檔</p>
      </div>
    `;
    document.body.appendChild(ceremony);

    setTimeout(() => {
      ceremony.classList.add('is-fade-out');
      setTimeout(() => {
        if (ceremony.parentNode) ceremony.parentNode.removeChild(ceremony);
      }, 500);
    }, 1800);

    const zone = this.container.querySelector('.case-resolution-zone');
    if (zone) {
      setTimeout(() => {
        zone.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }

    if (this.onCaseSolved) {
      this.onCaseSolved(this.caseData);
    }
  }

  handleShowHint(sectionId) {
    const sec = this.caseData.deductionSections.find(s => s.id === sectionId);
    if (!sec || !sec.hints || sec.hints.length === 0) return;

    const count = storage.incrementSectionHintUsed(this.caseData.id, sectionId);
    audio.playSFX('hint_chime');

    const banner = this.container.querySelector(`#feedback-${sectionId}`);
    if (!banner) return;

    const hintIdx = Math.min(sec.hints.length - 1, count - 1);
    const hintText = sec.hints[hintIdx];

    banner.className = 'section-feedback-banner feedback-hint';
    banner.innerHTML = `
      <div class="feedback-content">
        <span class="feedback-icon">${ICONS.lamp(16, '#244156')}</span>
        <div class="feedback-hint-body">
          <strong>案件錦囊（層級 ${hintIdx + 1}/${sec.hints.length}）：</strong>
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
          <div class="bio-avatar-frame">
            <img class="portrait-img bio-portrait-img" src="${char.img}" alt="涉案人物" />
          </div>
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
          <div class="bio-avatar-frame">
            <img class="portrait-img bio-portrait-img" src="${char.img}" alt="${char.name}" />
          </div>
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
