/**
 * 12碼讀心戰 (Penalty Mind Game v2) - Share Card Generator & Web Share Manager
 * Renders high-resolution Canvas share cards (score, predictability gauge,
 * mini 6-zone heatmap, national teams, stars) with native navigator.share or download fallback.
 */

export class ShareCardManager {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 780;
    this.canvas.height = 1200;
    this.ctx = this.canvas.getContext('2d');
  }

  /**
   * Render the visual share card onto canvas
   * @param {Object} data - Match and tournament results
   * @returns {HTMLCanvasElement}
   */
  renderCard(data = {}) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    const isChampion = !!data.isChampion;
    const isWin = data.playerScore > data.cpuScore;

    // 1. Background gradient (Night stadium)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#060c1e');
    bgGrad.addColorStop(0.35, '#0d1b3e');
    bgGrad.addColorStop(0.7, '#081028');
    bgGrad.addColorStop(1, '#050914');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Decorative Pitch Markings (Turf arc and spot)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.45, 180, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(w / 2, h * 0.45, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();

    // 2. Glowing Outer Border
    ctx.strokeStyle = isChampion ? '#fbbf24' : (isWin ? '#00e5ff' : '#64748b');
    ctx.lineWidth = 8;
    ctx.strokeRect(16, 16, w - 32, h - 32);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(26, 26, w - 52, h - 52);

    // 3. Top Banner & Brand
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillText('⚽ 12碼讀心戰 · PENALTY MIND GAME', w / 2, 68);

    if (isChampion) {
      // Golden Crown Banner
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 38px system-ui, -apple-system, sans-serif';
      ctx.fillText('🏆 世界盃總冠軍 · WORLD CHAMPIONS 🏆', w / 2, 125);
    } else {
      ctx.fillStyle = isWin ? '#38bdf8' : '#e2e8f0';
      ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
      const roundTitle = data.roundTitle || (isWin ? '點球大戰 · 獲勝晉級！' : '點球大戰 · 雖敗猶榮！');
      ctx.fillText(roundTitle, w / 2, 120);
    }

    // 4. Teams & Score Box
    const boxY = 160;
    const boxH = 175;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.roundRect(45, boxY, w - 90, boxH, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Home Team (Player)
    ctx.textAlign = 'center';
    ctx.font = '52px system-ui, -apple-system, sans-serif';
    ctx.fillText(data.playerFlag || '🇭🇰', 165, boxY + 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
    ctx.fillText(data.playerName || '香港代表隊', 165, boxY + 115);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '18px system-ui, -apple-system, sans-serif';
    ctx.fillText('你 (主射/把關)', 165, boxY + 145);

    // Score in middle
    ctx.fillStyle = isWin ? '#4ade80' : '#f87171';
    ctx.font = '900 64px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${data.playerScore || 0} - ${data.cpuScore || 0}`, w / 2, boxY + 105);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    ctx.fillText('十二碼點球', w / 2, boxY + 145);

    // Away Team (Opponent)
    ctx.font = '52px system-ui, -apple-system, sans-serif';
    ctx.fillText(data.cpuFlag || '🤖', w - 165, boxY + 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
    ctx.fillText(data.cpuName || '電腦門將', w - 165, boxY + 115);

    ctx.fillStyle = '#a855f7';
    ctx.font = '18px system-ui, -apple-system, sans-serif';
    ctx.fillText(data.cpuPersonality || 'AI 門將', w - 165, boxY + 145);

    // 5. Stars Earned Badge
    if (data.starsEarned > 0) {
      const starText = '⭐'.repeat(Math.min(5, data.starsEarned)) + `  +${data.starsEarned} 星星獎勵`;
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillText(starText, w / 2, boxY + boxH + 42);
    }

    // 6. Predictability Gauge Card
    const gaugeY = 425;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.beginPath();
    ctx.roundRect(45, gaugeY, w - 90, 160, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.fillText('🎯 心理戰可預測度 (Shannon 熵值)', 75, gaugeY + 40);

    const predNum = data.predictability !== null && data.predictability !== undefined
      ? `${data.predictability}%`
      : '數據不足';

    ctx.fillStyle = (data.predictability < 35) ? '#4ade80' : ((data.predictability < 60) ? '#facc15' : '#f87171');
    ctx.font = '900 52px system-ui, -apple-system, sans-serif';
    ctx.fillText(predNum, 75, gaugeY + 105);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
    ctx.fillText(data.predictabilityTag || '難以捉摸', w - 75, gaugeY + 75);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '17px system-ui, -apple-system, sans-serif';
    ctx.fillText(data.predictabilityDesc || '門將完全估你唔到！', w - 75, gaugeY + 115);

    // 7. Mini 6-Zone Heatmap
    const heatY = 620;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.fillText('🔥 累計射門落點熱力圖 (6 區)', 75, heatY);

    const zones = [
      { id: 'TL', label: '左上', x: 45, y: heatY + 18, w: 220, h: 90 },
      { id: 'TM', label: '中上', x: 280, y: heatY + 18, w: 220, h: 90 },
      { id: 'TR', label: '右上', x: 515, y: heatY + 18, w: 220, h: 90 },
      { id: 'BL', label: '左下', x: 45, y: heatY + 120, w: 220, h: 90 },
      { id: 'BM', label: '中下', x: 280, y: heatY + 120, w: 220, h: 90 },
      { id: 'BR', label: '右下', x: 515, y: heatY + 120, w: 220, h: 90 }
    ];

    const hmData = data.heatmapData || {};

    zones.forEach(z => {
      const item = hmData[z.id] || { count: 0, percent: 16 };
      const alpha = Math.min(0.85, 0.15 + (item.percent / 100) * 0.7);

      ctx.fillStyle = `rgba(0, 229, 255, ${alpha})`;
      ctx.beginPath();
      ctx.roundRect(z.x, z.y, z.w, z.h, 10);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.fillText(z.label, z.x + z.w / 2, z.y + 35);

      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(`${item.percent}%`, z.x + z.w / 2, z.y + 68);
    });

    // 8. Match Highlights Dual Chips
    const statChipY = 870;
    ctx.fillStyle = 'rgba(30, 41, 59, 0.75)';
    ctx.beginPath();
    ctx.roundRect(45, statChipY, 330, 80, 14);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px system-ui, -apple-system, sans-serif';
    ctx.fillText('🧤 門將神撲防禦', 210, statChipY + 32);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${data.savesCount || 0} 球撲救`, 210, statChipY + 64);

    ctx.fillStyle = 'rgba(30, 41, 59, 0.75)';
    ctx.beginPath();
    ctx.roundRect(405, statChipY, 330, 80, 14);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px system-ui, -apple-system, sans-serif';
    ctx.fillText('⚽ 點球命中率', 570, statChipY + 32);
    const pKicks = data.playerKicksCount || 5;
    const pRate = pKicks > 0 ? Math.round(((data.playerScore || 0) / pKicks) * 100) : 0;
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${pRate}% (${data.playerScore || 0}/${pKicks})`, 570, statChipY + 64);

    // 9. Call to action & footer quote
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    const ctaQuote = isChampion
      ? '「我喺《12碼讀心戰》射爆門將，捧走世界盃！你敢唔敢入嚟挑戰？」'
      : '「同 AI 門將鬥智鬥勇！識破虛晃、狂轟死角！」';
    ctx.fillText(ctaQuote, w / 2, 1010);

    ctx.fillStyle = '#64748b';
    ctx.font = '18px system-ui, -apple-system, sans-serif';
    ctx.fillText('3D WebGL 擬真物理 · 廣東話語音 · 離線即玩', w / 2, 1055);

    // Bottom Decorative LED strip
    const ledGrad = ctx.createLinearGradient(45, 0, w - 45, 0);
    ledGrad.addColorStop(0, '#00e5ff');
    ledGrad.addColorStop(0.5, '#fbbf24');
    ledGrad.addColorStop(1, '#a855f7');
    ctx.fillStyle = ledGrad;
    ctx.fillRect(45, 1100, w - 90, 6);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.fillText('PENALTY MIND GAME v2 · HONG KONG INDIE GAME', w / 2, 1145);

    return this.canvas;
  }

  renderCardToDataURL(data = {}) {
    this.renderCard(data);
    return this.canvas.toDataURL('image/png');
  }

  /**
   * Trigger native share sheet or download fallback
   * @param {Object} matchData
   * @param {Function} [onComplete]
   */
  async shareMatch(matchData, onComplete) {
    this.renderCard(matchData);

    const title = matchData.isChampion ? '🏆 我奪得世界盃冠軍！【12碼讀心戰】' : '⚽ 我在【12碼讀心戰】的戰績！';
    const text = `我喺《12碼讀心戰》踢出 ${matchData.playerScore} - ${matchData.cpuScore} 比數！可預測度僅 ${matchData.predictability || 30}%，你夠唔夠膽挑戰？`;

    try {
      if (typeof navigator !== 'undefined' && navigator.share && this.canvas.toBlob) {
        const blob = await new Promise(r => this.canvas.toBlob(r, 'image/png'));
        if (blob) {
          const file = new File([blob], 'penalty-mind-game.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title,
              text,
              files: [file]
            });
            if (onComplete) onComplete({ success: true, method: 'native_share' });
            return;
          }
        }
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        if (onComplete) onComplete({ success: false, reason: 'user_aborted' });
        return;
      }
      console.warn('Native share failed or unsupported, fallback to modal / download:', e);
    }

    // Fallback: Download file and show popup image modal
    this.triggerDownload('penalty-mind-game-record.png');
    this.showImageModal();
    if (onComplete) onComplete({ success: true, method: 'download_modal' });
  }

  triggerDownload(filename = 'penalty-mind-game-record.png') {
    try {
      const dataUrl = this.canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.warn('Canvas download failed:', e);
    }
  }

  showImageModal() {
    let modal = document.getElementById('share-card-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'share-card-modal';
      modal.className = 'share-modal-overlay';
      modal.innerHTML = `
        <div class="share-modal-card">
          <div class="share-modal-header">
            <h3>📸 賽後專屬戰績卡</h3>
            <button id="btn-close-share-modal" class="share-close-btn">&times;</button>
          </div>
          <div class="share-modal-body">
            <p class="share-tip">💡 已為你自動下載圖片！手機用戶亦可長按圖片直接儲存或分享：</p>
            <div class="share-img-container">
              <img id="share-card-preview" alt="賽後戰績卡">
            </div>
          </div>
          <div class="share-modal-footer">
            <button id="btn-modal-dl-again" class="btn-primary" style="width: 100%;">
              <span>⬇️ 再次下載圖片</span>
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const closeBtn = document.getElementById('btn-close-share-modal');
      if (closeBtn) closeBtn.onclick = () => { modal.style.display = 'none'; };
      modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

      const dlBtn = document.getElementById('btn-modal-dl-again');
      if (dlBtn) dlBtn.onclick = () => this.triggerDownload();
    }

    const preview = document.getElementById('share-card-preview');
    if (preview) {
      preview.src = this.canvas.toDataURL('image/png');
    }
    modal.style.display = 'flex';
  }
}
