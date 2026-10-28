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
    const musicVol = settings.musicVolume !== undefined ? settings.musicVolume : 0.7;
    const sfxVol = settings.sfxVolume !== undefined ? settings.sfxVolume : 0.8;

    const getLevel = (v) => {
      if (v <= 0.35) return 1;
      if (v <= 0.6) return 2;
      if (v <= 0.85) return 3;
      return 4;
    };
    const getAngle = (lvl) => {
      return (lvl - 1) * 45 - 45; // 1: -45deg, 2: 0deg, 3: 45deg, 4: 90deg
    };
    const getLevelText = (lvl) => {
      return ['· Ⅰ 微 ·', '· Ⅱ 常 ·', '· Ⅲ 響 ·', '· Ⅳ 極 ·'][lvl - 1] || '· Ⅲ 響 ·';
    };

    const musicLevel = getLevel(musicVol);
    const sfxLevel = getLevel(sfxVol);

    this.container.innerHTML = `
      <div class="menu-screen-wrapper">
        <header class="menu-top-bar">
          <button class="drawer-manila-tab btn-back-to-desk" id="btn-menu-back-desk">
            【放下話筒 · 返回案頭】
          </button>
        </header>

        <div class="menu-scroll-area">
          <div class="switchboard-wood-cabinet">
            <!-- Single Painted 1962 Switchboard Brass Plate -->
            <div class="switchboard-brass-plate">
              <div class="switchboard-plate-header">
                <div class="switchboard-screws">
                  <span class="screw top-left"></span>
                  <span class="screw top-right"></span>
                </div>
                <div class="switchboard-plate-engraving">
                  <span class="plate-code">QUADRO DE COMUTAÇÃO TELEFÓNICA · 1962</span>
                  <h3 class="plate-title">澳門探署總機 · 案件調度盤</h3>
                </div>
              </div>

              <!-- Audio Controls on Plate -->
              <div class="switchboard-plate-section">
                <div class="engraved-section-rule">
                  <span>〔 電訊音頻調校 〕</span>
                </div>

                <!-- BGM Control: 1 Painted Brass Rotary Knob + Punchcard Toggle -->
                <div class="switchboard-control-block">
                  <div class="switchboard-line-label">
                    <span class="line-dot"></span>
                    <span class="line-title">留聲樂韻</span>
                  </div>
                  <div class="switchboard-knob-row">
                    <div class="knob-face-wrapper">
                      <div class="knob-engraved-dial">
                        <span class="dial-mark mark-1">Ⅰ</span>
                        <span class="dial-mark mark-2">Ⅱ</span>
                        <span class="dial-mark mark-3">Ⅲ</span>
                        <span class="dial-mark mark-4">Ⅳ</span>
                      </div>
                      <button type="button" class="switchboard-brass-rotary" id="knob-music-rotary" aria-label="留聲樂韻旋鈕" data-level="${musicLevel}">
                        <div class="knob-cylinder" id="cylinder-music" style="transform: rotate(${getAngle(musicLevel)}deg);">
                          <span class="knob-indicator-line"></span>
                          <span class="knob-brass-core"></span>
                        </div>
                      </button>
                    </div>
                    <div class="knob-status-column">
                      <button class="switchboard-punchcard-toggle ${!settings.musicMuted ? 'is-enabled' : ''}" id="menu-toggle-music" type="button" aria-pressed="${!settings.musicMuted}">
                        <span class="punchcard-mark" id="music-toggle-mark">${!settings.musicMuted ? '[✓] 樂韻接通' : '[  ] 樂韻中斷'}</span>
                      </button>
                      <span class="knob-reading-text" id="music-reading-text">檔位：${getLevelText(musicLevel)}</span>
                    </div>
                  </div>
                </div>

                <!-- SFX Control: 1 Painted Brass Rotary Knob + Punchcard Toggle -->
                <div class="switchboard-control-block">
                  <div class="switchboard-line-label">
                    <span class="line-dot"></span>
                    <span class="line-title">現場物證音效</span>
                  </div>
                  <div class="switchboard-knob-row">
                    <div class="knob-face-wrapper">
                      <div class="knob-engraved-dial">
                        <span class="dial-mark mark-1">Ⅰ</span>
                        <span class="dial-mark mark-2">Ⅱ</span>
                        <span class="dial-mark mark-3">Ⅲ</span>
                        <span class="dial-mark mark-4">Ⅳ</span>
                      </div>
                      <button type="button" class="switchboard-brass-rotary" id="knob-sfx-rotary" aria-label="物證音效旋鈕" data-level="${sfxLevel}">
                        <div class="knob-cylinder" id="cylinder-sfx" style="transform: rotate(${getAngle(sfxLevel)}deg);">
                          <span class="knob-indicator-line"></span>
                          <span class="knob-brass-core"></span>
                        </div>
                      </button>
                    </div>
                    <div class="knob-status-column">
                      <button class="switchboard-punchcard-toggle ${!settings.sfxMuted ? 'is-enabled' : ''}" id="menu-toggle-sfx" type="button" aria-pressed="${!settings.sfxMuted}">
                        <span class="punchcard-mark" id="sfx-toggle-mark">${!settings.sfxMuted ? '[✓] 雜音開啟' : '[  ] 雜音中斷'}</span>
                      </button>
                      <span class="knob-reading-text" id="sfx-reading-text">檔位：${getLevelText(sfxLevel)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Text Size Section -->
              <div class="switchboard-plate-section">
                <div class="engraved-section-rule">
                  <span>〔 打字機字規 〕</span>
                </div>
                <div class="switchboard-control-block">
                  <div class="switchboard-line-label">
                    <span class="line-dot"></span>
                    <span class="line-title">公文字號規格</span>
                  </div>
                  <div class="switchboard-btn-group">
                    <button class="btn-text-size ${settings.textSize !== 'large' ? 'is-active' : ''}" data-size="normal">〔五號標字〕</button>
                    <button class="btn-text-size ${settings.textSize === 'large' ? 'is-active' : ''}" data-size="large">〔四號大字〕</button>
                  </div>
                </div>
              </div>

              <!-- External Navigation Link -->
              <div class="switchboard-plate-section">
                <div class="engraved-section-rule">
                  <span>〔 外部專線轉接 〕</span>
                </div>
                <a href="https://penny323mo.github.io/grokbot/" class="btn-switchboard-grokbot" target="_blank" rel="noopener noreferrer">
                  【 直撥 grokbot 總部專線 → 】
                </a>
              </div>

              <!-- Danger Reset Section -->
              <div class="switchboard-plate-section danger-section">
                <div class="engraved-section-rule danger-rule">
                  <span>〔 卷宗重置室 〕</span>
                </div>
                <p class="reset-desc">將當前所有已查明線索、物證筆記與破案紀錄銷毀碎紙，重歸第一案立案。</p>
                <button class="btn-switchboard-reset" id="menu-btn-reset-progress">
                  【 碎紙銷毀 · 重新立案 】
                </button>
                <div class="switchboard-screws bottom-screws">
                  <span class="screw bottom-left"></span>
                  <span class="screw bottom-right"></span>
                </div>
              </div>
            </div>
          </div>
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

    // Audio controls: punch-card toggles
    const toggleMusic = this.container.querySelector('#menu-toggle-music');
    const toggleSfx = this.container.querySelector('#menu-toggle-sfx');
    const sliderMusic = this.container.querySelector('#menu-slider-music');
    const sliderSfx = this.container.querySelector('#menu-slider-sfx');

    if (toggleMusic) {
      toggleMusic.addEventListener('click', () => {
        const settings = storage.getSettings();
        const nextMuted = !settings.musicMuted;
        audio.setMusicMuted(nextMuted);
        toggleMusic.classList.toggle('is-enabled', !nextMuted);
        const mark = document.getElementById('music-toggle-mark');
        if (mark) mark.textContent = !nextMuted ? '[✓] 樂韻接通' : '[  ] 樂韻中斷';
      });
    }

    if (toggleSfx) {
      toggleSfx.addEventListener('click', () => {
        const settings = storage.getSettings();
        const nextMuted = !settings.sfxMuted;
        audio.setSfxMuted(nextMuted);
        toggleSfx.classList.toggle('is-enabled', !nextMuted);
        const mark = document.getElementById('sfx-toggle-mark');
        if (mark) mark.textContent = !nextMuted ? '[✓] 雜音開啟' : '[  ] 雜音中斷';
      });
    }

    // Rotary brass knobs for volume
    const levels = [0.25, 0.50, 0.75, 1.0];
    const levelTexts = ['· Ⅰ 微 ·', '· Ⅱ 常 ·', '· Ⅲ 響 ·', '· Ⅳ 極 ·'];

    const knobMusic = this.container.querySelector('#knob-music-rotary');
    if (knobMusic) {
      knobMusic.addEventListener('click', () => {
        let cur = parseInt(knobMusic.getAttribute('data-level') || '3', 10);
        let nxt = cur >= 4 ? 1 : cur + 1;
        const val = levels[nxt - 1];
        knobMusic.setAttribute('data-level', nxt);
        const cyl = document.getElementById('cylinder-music');
        if (cyl) cyl.style.transform = `rotate(${(nxt - 1) * 45 - 45}deg)`;
        const label = document.getElementById('music-reading-text');
        if (label) label.textContent = `檔位：${levelTexts[nxt - 1]}`;
        audio.setMusicVolume(val);
        audio.playSFX('pen_scratch');
      });
    }

    const knobSfx = this.container.querySelector('#knob-sfx-rotary');
    if (knobSfx) {
      knobSfx.addEventListener('click', () => {
        let cur = parseInt(knobSfx.getAttribute('data-level') || '3', 10);
        let nxt = cur >= 4 ? 1 : cur + 1;
        const val = levels[nxt - 1];
        knobSfx.setAttribute('data-level', nxt);
        const cyl = document.getElementById('cylinder-sfx');
        if (cyl) cyl.style.transform = `rotate(${(nxt - 1) * 45 - 45}deg)`;
        const label = document.getElementById('sfx-reading-text');
        if (label) label.textContent = `檔位：${levelTexts[nxt - 1]}`;
        storage.updateSettings({ sfxVolume: val });
        audio.playSFX('pen_scratch');
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
