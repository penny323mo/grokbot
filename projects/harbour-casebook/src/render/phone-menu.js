/**
 * 濠江疑案 · Harbour Casebook
 * 總機通訊與調度盤渲染器 (Diegetic Bakelite Phone & Brass Switchboard)
 * 1962 年澳門探署總機：黑色膠木話機架、黃銅面板、旋鈕、插孔與撥桿，無任何現代網頁卡片或方形按鈕
 */

import { storage } from '../engine/storage.js';
import { audio } from '../engine/audio.js';

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
        <!-- 1. Telephone Receiver Cradle at Top (Hang up = tap cradle) -->
        <header class="menu-top-cradle-bar">
          <button class="telephone-receiver-cradle btn-back-to-desk" id="btn-menu-back-desk" type="button" aria-label="放下話筒返回案頭">
            <div class="cradle-forks">
              <span class="fork-prong left"></span>
              <div class="cradle-handset-bar">
                <span class="cradle-hangup-text">〔 掛斷話筒 · 歸位案頭 〕</span>
              </div>
              <span class="fork-prong right"></span>
            </div>
          </button>
        </header>

        <div class="menu-scroll-area">
          <div class="bakelite-telephone-cabinet">
            <!-- 2. Contiguous Brass Switchboard Instrument Panel -->
            <div class="switchboard-brass-plate">
              <div class="switchboard-plate-header">
                <div class="switchboard-screws">
                  <span class="screw top-left"></span>
                  <span class="screw top-right"></span>
                </div>
                <div class="switchboard-plate-engraving">
                  <span class="plate-code">QUADRO DE COMUTAÇÃO TELEFÓNICA · 1962</span>
                  <h2 class="plate-title">澳門探署總機 · 案件調度盤</h2>
                </div>
              </div>

              <!-- Audio Controls: Brass Rotaries & Jack Plug Toggles -->
              <div class="switchboard-plate-section">
                <div class="engraved-section-rule">
                  <span>〔 電訊音頻調校 〕</span>
                </div>

                <!-- BGM: Brass Rotary Knob + Jack Plug Toggle -->
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
                      <button class="switchboard-jack-toggle ${!settings.musicMuted ? 'is-connected' : ''}" id="menu-toggle-music" type="button" aria-pressed="${!settings.musicMuted}">
                        <span class="jack-socket-ring"><span class="jack-plug-core"></span></span>
                        <span class="jack-status-text" id="music-toggle-mark">${!settings.musicMuted ? '接通 ⫚ 樂韻已連線' : '切斷 ⫛ 樂韻靜音'}</span>
                      </button>
                      <span class="knob-reading-text" id="music-reading-text">檔位：${getLevelText(musicLevel)}</span>
                    </div>
                  </div>
                </div>

                <!-- SFX: Brass Rotary Knob + Jack Plug Toggle -->
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
                      <button class="switchboard-jack-toggle ${!settings.sfxMuted ? 'is-connected' : ''}" id="menu-toggle-sfx" type="button" aria-pressed="${!settings.sfxMuted}">
                        <span class="jack-socket-ring"><span class="jack-plug-core"></span></span>
                        <span class="jack-status-text" id="sfx-toggle-mark">${!settings.sfxMuted ? '接通 ⫚ 物證音效開' : '切斷 ⫛ 物證音效關'}</span>
                      </button>
                      <span class="knob-reading-text" id="sfx-reading-text">檔位：${getLevelText(sfxLevel)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Text Size: Physical Lever Switch -->
              <div class="switchboard-plate-section">
                <div class="engraved-section-rule">
                  <span>〔 打字機字規 〕</span>
                </div>
                <div class="switchboard-control-block">
                  <div class="switchboard-line-label">
                    <span class="line-dot"></span>
                    <span class="line-title">公文字號規格</span>
                  </div>
                  <div class="switchboard-lever-switch-row">
                    <button class="btn-text-size lever-option ${settings.textSize !== 'large' ? 'is-active' : ''}" data-size="normal" type="button">
                      <span class="lever-indicator"></span>
                      <span class="lever-label">五號標準</span>
                    </button>
                    <span class="lever-throw-bar"></span>
                    <button class="btn-text-size lever-option ${settings.textSize === 'large' ? 'is-active' : ''}" data-size="large" type="button">
                      <span class="lever-indicator"></span>
                      <span class="lever-label">四號大字</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- External Navigation Link: Brass Patch Terminal -->
              <div class="switchboard-plate-section">
                <div class="engraved-section-rule">
                  <span>〔 外部專線轉接 〕</span>
                </div>
                <div class="switchboard-patch-socket-block">
                  <a href="https://penny323mo.github.io/grokbot/" class="switchboard-patch-cable" target="_blank" rel="noopener noreferrer">
                    <span class="patch-cable-plug"></span>
                    <span class="patch-cable-label">直撥專線 · grokbot 總部通訊 →</span>
                  </a>
                </div>
              </div>

              <!-- Reset Section: Emergency Seal -->
              <div class="switchboard-plate-section danger-section">
                <div class="engraved-section-rule danger-rule">
                  <span>〔 卷宗重置室 〕</span>
                </div>
                <p class="reset-desc">將當前所有已查明線索、物證筆記與破案紀錄銷毀碎紙，重歸第一案立案。</p>
                <div class="emergency-seal-wrapper">
                  <button class="btn-switchboard-reset-trip" id="menu-btn-reset-progress" type="button">
                    <span class="emergency-wire"></span>
                    <span class="emergency-text">扯斷鉛封 · 銷毀立案存根</span>
                  </button>
                </div>
                <div class="switchboard-screws bottom-screws">
                  <span class="screw bottom-left"></span>
                  <span class="screw bottom-right"></span>
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
    // Back to desk via receiver cradle
    const backBtn = this.container.querySelector('#btn-menu-back-desk');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        audio.playSFX('phone_receiver');
        this.onBackToDesk();
      });
    }

    // Audio controls: jack-plug toggles
    const toggleMusic = this.container.querySelector('#menu-toggle-music');
    const toggleSfx = this.container.querySelector('#menu-toggle-sfx');

    if (toggleMusic) {
      toggleMusic.addEventListener('click', () => {
        const settings = storage.getSettings();
        const nextMuted = !settings.musicMuted;
        audio.setMusicMuted(nextMuted);
        toggleMusic.classList.toggle('is-connected', !nextMuted);
        toggleMusic.setAttribute('aria-pressed', (!nextMuted).toString());
        const mark = document.getElementById('music-toggle-mark');
        if (mark) mark.textContent = !nextMuted ? '接通 ⫚ 樂韻已連線' : '切斷 ⫛ 樂韻靜音';
        audio.playSFX('pen_scratch');
      });
    }

    if (toggleSfx) {
      toggleSfx.addEventListener('click', () => {
        const settings = storage.getSettings();
        const nextMuted = !settings.sfxMuted;
        audio.setSfxMuted(nextMuted);
        toggleSfx.classList.toggle('is-connected', !nextMuted);
        toggleSfx.setAttribute('aria-pressed', (!nextMuted).toString());
        const mark = document.getElementById('sfx-toggle-mark');
        if (mark) mark.textContent = !nextMuted ? '接通 ⫚ 物證音效開' : '切斷 ⫛ 物證音效關';
        audio.playSFX('pen_scratch');
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

    // Text size: lever switch
    this.container.querySelectorAll('.btn-text-size').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.btn-text-size').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const size = btn.getAttribute('data-size');
        storage.updateSettings({ textSize: size });
        document.documentElement.classList.toggle('text-large', size === 'large');
        audio.playSFX('pen_scratch');
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
