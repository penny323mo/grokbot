/**
 * 濠江疑案 · Harbour Casebook
 * 總機通訊與卷宗設置渲染器 (Diegetic Phone & Settings Menu)
 * 模擬 1962 探署轉接話筒與卷宗設置，含音量、字級、重設與 grokbot 外部導航
 */

import { storage } from '../engine/storage.js';
import { audio } from '../engine/audio.js';
import { ICONS } from '../utils/icons.js';

export class PhoneMenu {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.onBackToDesk = options.onBackToDesk || (() => {});
    this.onResetGame = options.onResetGame || (() => {});
  }

  render() {
    const settings = storage.getSettings();

    this.container.innerHTML = `
      <div class="menu-screen-wrapper">
        <header class="menu-top-bar">
          <button class="btn-desk-nav btn-back-to-desk" id="btn-menu-back-desk">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>放下話筒 · 返回案頭</span>
          </button>
          <div class="menu-title-group">
            <span class="menu-badge">1962 探署內線總機</span>
            <h2 class="menu-headline">通訊電話與卷宗設置</h2>
          </div>
        </header>

        <div class="menu-scroll-area">
          <div class="phone-dispatch-card">
            <div class="phone-card-header">
              <div class="phone-receiver-icon">${ICONS.phone(28, '#9A3B2C')}</div>
              <div class="phone-header-text">
                <h3 class="phone-title">探署總機 · 案件調度臺</h3>
                <p class="phone-subtitle">TELEFONE CENTRAL DA POLÍCIA JUDICIÁRIA</p>
              </div>
            </div>

            <!-- Audio Settings Group -->
            <div class="settings-group">
              <h4 class="settings-group-title">
                <span class="setting-group-dot"></span> 配樂與環境音效
              </h4>

              <div class="setting-item">
                <span class="setting-label">背景音樂 (BGM)</span>
                <label class="switch">
                  <input type="checkbox" id="menu-check-music" ${!settings.musicMuted ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
              </div>

              <div class="setting-slider-item">
                <span class="setting-sublabel">音樂音量</span>
                <input type="range" id="menu-slider-music" min="0" max="1" step="0.05" value="${settings.musicVolume !== undefined ? settings.musicVolume : 0.7}" class="archival-slider">
              </div>

              <div class="setting-item">
                <span class="setting-label">物證音效 (SFX)</span>
                <label class="switch">
                  <input type="checkbox" id="menu-check-sfx" ${!settings.sfxMuted ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
              </div>

              <div class="setting-slider-item">
                <span class="setting-sublabel">音效音量</span>
                <input type="range" id="menu-slider-sfx" min="0" max="1" step="0.05" value="${settings.sfxVolume !== undefined ? settings.sfxVolume : 0.8}" class="archival-slider">
              </div>
            </div>

            <!-- Text Size Group -->
            <div class="settings-group">
              <h4 class="settings-group-title">
                <span class="setting-group-dot"></span> 卷宗字級偏好
              </h4>
              <div class="setting-item">
                <span class="setting-label">文字顯示大小</span>
                <div class="text-size-toggle">
                  <button class="btn-text-size ${settings.textSize !== 'large' ? 'is-active' : ''}" data-size="normal">標準</button>
                  <button class="btn-text-size ${settings.textSize === 'large' ? 'is-active' : ''}" data-size="large">大字</button>
                </div>
              </div>
            </div>

            <!-- External Navigation to Grokbot -->
            <div class="settings-group">
              <h4 class="settings-group-title">
                <span class="setting-group-dot"></span> 外部線路轉接
              </h4>
              <a href="https://penny323mo.github.io/grokbot/" class="btn-menu-grokbot" target="_blank" rel="noopener noreferrer">
                <span class="menu-link-icon">←</span> 返回 grokbot 主站
              </a>
            </div>

            <!-- Progress Reset -->
            <div class="settings-group danger-zone">
              <h4 class="settings-group-title">
                <span class="setting-group-dot"></span> 銷毀當前檔案
              </h4>
              <p class="reset-desc">清空本機所有已收集物證、填詞記錄與案件解鎖進度，重新開始調查。</p>
              <button class="btn-danger-reset" id="menu-btn-reset-progress">
                清空本機存檔重新開始
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Back to desk
    const backBtn = this.container.querySelector('#btn-menu-back-desk');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        audio.playSFX('paper_slide');
        this.onBackToDesk();
      });
    }

    // Audio controls
    const checkMusic = this.container.querySelector('#menu-check-music');
    const checkSfx = this.container.querySelector('#menu-check-sfx');
    const sliderMusic = this.container.querySelector('#menu-slider-music');
    const sliderSfx = this.container.querySelector('#menu-slider-sfx');

    if (checkMusic) {
      checkMusic.addEventListener('change', () => {
        audio.setMusicMuted(!checkMusic.checked);
      });
    }

    if (checkSfx) {
      checkSfx.addEventListener('change', () => {
        audio.setSfxMuted(!checkSfx.checked);
      });
    }

    if (sliderMusic) {
      sliderMusic.addEventListener('input', () => {
        const val = parseFloat(sliderMusic.value);
        audio.setMusicVolume(val);
      });
    }

    if (sliderSfx) {
      sliderSfx.addEventListener('input', () => {
        const val = parseFloat(sliderSfx.value);
        storage.updateSettings({ sfxVolume: val });
      });
    }

    // Text size
    this.container.querySelectorAll('.btn-text-size').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.btn-text-size').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const size = btn.getAttribute('data-size');
        storage.updateSettings({ textSize: size });
        document.documentElement.classList.toggle('text-large', size === 'large');
      });
    });

    // Reset progress
    const resetBtn = this.container.querySelector('#menu-btn-reset-progress');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (window.confirm('確定要銷毀所有偵查紀錄與推理筆記嗎？此操作不可逆。')) {
          storage.resetAll();
          audio.playSFX('stamp_thud');
          alert('案卷存檔已清空，即將返回主標題。');
          this.onResetGame();
        }
      });
    }
  }
}
