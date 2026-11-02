// src/main.js - Main Application Controller for 鋦瓷記 (1957 Hong Kong)

import { JOBS_DATA, ENDINGS_DATA } from './data/jobs.js';
import { generateShardsForPiece, computePolygonArea } from './engine/shard-generator.js';
import { evaluateStaples } from './engine/staple-system.js';
import { Economy } from './engine/economy.js';
import { sounds } from './engine/audio.js';

const STORAGE_KEY = 'porcelain_mender_save_v1';

class GameApp {
  constructor() {
    this.economy = new Economy();
    this.currentDay = 1;
    this.currentJob = null;
    this.currentStage = 1; // 1: Customer, 2: Clean, 3: Reassemble, 4: Mark, 5: Drill, 6: Set Staples, 7: Settle
    this.maxDayReached = 1;

    // Crafting state
    this.puzzleData = null;
    this.pieceImage = null;
    this.stapleImage = null;
    this.selectedShardIndex = -1;
    this.placedStaples = []; // [{ x, y, angle }]
    this.evaluation = null;
    this.chosenPrice = 0;
    this.isCharity = false;

    // Drill state
    this.drillProgress = 0;
    this.drillTargetCount = 3;
    this.bowOscillation = 0;
    this.bowDirection = 1;
    this.bowTimer = null;

    // Canvas elements
    this.canvas = document.getElementById('craft-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.init();
  }

  init() {
    this.loadSave();
    this.bindEvents();
    this.preloadImages();
    this.updateTitleScreenButtons();
    this.updateHUD();
  }

  preloadImages() {
    this.stapleImage = new Image();
    this.stapleImage.src = './assets/art/staple_brass.webp';
  }

  loadSave() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.economy) this.economy = new Economy(data.economy);
        if (data.currentDay) this.currentDay = Math.min(12, Math.max(1, data.currentDay));
        if (data.maxDayReached) this.maxDayReached = Math.max(this.currentDay, data.maxDayReached);
      }
    } catch (e) {
      console.warn('Failed to parse save:', e);
    }
  }

  saveGame() {
    try {
      const data = {
        economy: this.economy.toJSON(),
        currentDay: this.currentDay,
        maxDayReached: Math.max(this.currentDay, this.maxDayReached)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.updateTitleScreenButtons();
    } catch (e) {
      console.warn('Failed to write save:', e);
    }
  }

  updateTitleScreenButtons() {
    const btnContinue = document.getElementById('btn-continue-game');
    if (btnContinue) {
      if (this.currentDay > 1 || this.economy.ledger.length > 0) {
        btnContinue.style.display = 'flex';
        btnContinue.textContent = `續做（第 ${this.toChineseNumeral(this.currentDay)} 日）`;
      } else {
        btnContinue.style.display = 'none';
      }
    }
  }

  bindEvents() {
    // Title buttons
    document.getElementById('btn-start-game')?.addEventListener('click', () => {
      sounds.init();
      sounds.startAmbience(this.currentDay === 7);
      this.currentDay = 1;
      this.economy = new Economy();
      this.saveGame();
      this.startDay(1);
    });

    document.getElementById('btn-continue-game')?.addEventListener('click', () => {
      sounds.init();
      sounds.startAmbience(this.currentDay === 7);
      this.startDay(this.currentDay);
    });

    document.getElementById('btn-open-chapters')?.addEventListener('click', () => {
      this.openModal('modal-chapters');
      this.renderChaptersNav();
    });

    document.getElementById('btn-open-credits')?.addEventListener('click', () => {
      this.openModal('modal-credits');
    });

    // Topbar widgets
    document.getElementById('widget-ledger-btn')?.addEventListener('click', () => {
      this.openModal('modal-ledger');
      this.renderLedgerRecords();
    });

    document.getElementById('widget-mute-btn')?.addEventListener('click', () => {
      sounds.init();
      const isMuted = sounds.toggleMute();
      const muteIcon = document.getElementById('mute-icon');
      if (muteIcon) muteIcon.textContent = isMuted ? '靜' : '聲';
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-layer');
        if (modal) modal.classList.remove('active');
      });
    });

    // Stage 1 Dialogue Actions
    document.getElementById('btn-inquire-story')?.addEventListener('click', () => {
      this.handleInquiry();
    });

    // Stage Controls
    document.getElementById('btn-rotate-shard')?.addEventListener('click', () => {
      this.rotateSelectedShard();
    });

    document.getElementById('btn-proceed-stage')?.addEventListener('click', () => {
      if (this.isSecondaryJob) return;
      this.advanceCraftStage();
    });

    document.getElementById('btn-wipe-paste')?.addEventListener('click', () => {
      this.executeWipePaste();
    });

    document.getElementById('btn-water-test')?.addEventListener('click', () => {
      this.executeWaterTest();
    });

    // Bow drill rhythm button
    document.getElementById('btn-drill-stroke')?.addEventListener('click', () => {
      this.handleBowDrillStroke();
    });

    // Settlement continue button
    document.getElementById('btn-next-day')?.addEventListener('click', () => {
      this.finishDayAndProceed();
    });

    // Restart game from ending modal
    document.getElementById('btn-restart-game')?.addEventListener('click', () => {
      document.getElementById('modal-ending')?.classList.remove('active');
      this.currentDay = 1;
      this.economy = new Economy();
      this.saveGame();
      this.showScreen('screen-title');
    });

    // Canvas interactions (Touch and Pointer)
    if (this.canvas) {
      this.canvas.addEventListener('pointerdown', (e) => this.handleCanvasPointer(e));
    }
  }

  showScreen(screenId) {
    document.querySelectorAll('.game-screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
    if (modalId === 'modal-chapters') this.renderChaptersNav();
    if (modalId === 'modal-ledger') this.renderLedgerRecords();
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  updateHUD() {
    const elDay = document.getElementById('calendar-day-text');
    const elLunar = document.getElementById('calendar-lunar-text');
    const elStaples = document.getElementById('stat-staples-count');
    const elCash = document.getElementById('stat-cash-amount');

    if (elDay) elDay.textContent = `第${this.toChineseNumeral(this.currentDay)}日`;
    if (elLunar) elLunar.textContent = this.currentDay === 6 || this.currentDay === 12 ? '交租日' : '油麻地';
    if (elStaples) elStaples.textContent = this.economy.staples;
    if (elCash) elCash.textContent = `$${this.economy.cash.toFixed(1)}`;
  }

  toChineseNumeral(n) {
    const nums = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
    return nums[n] || n;
  }

  startDay(dayNum) {
    this.currentDay = Math.min(12, Math.max(1, dayNum));
    this.maxDayReached = Math.max(this.maxDayReached, this.currentDay);
    this.currentJob = JOBS_DATA[this.currentDay - 1];
    this.currentStage = 1;
    this.placedStaples = [];
    this.hammeredStaples = [];
    this.chippedCracks = [];
    this.selectedShardIndex = -1;
    this.secondaryJobCompleted = false;
    this.saveGame();
    this.updateHUD();

    this.showScreen('screen-game');
    this.setupCustomerStage();
  }

  setupCustomerStage() {
    const job = this.currentJob;
    document.getElementById('stage-customer').style.display = 'flex';
    document.getElementById('stage-workbench').style.display = 'none';
    document.getElementById('stage-settlement').style.display = 'none';

    // Populate day vignette banner
    const elVignetteImg = document.getElementById('day-vignette-img');
    const elVignetteTitle = document.getElementById('day-vignette-title');
    const elVignetteDesc = document.getElementById('day-vignette-desc');
    if (elVignetteImg) elVignetteImg.src = job.sceneVignette || './assets/scenes/temple_street.webp';
    if (elVignetteTitle) elVignetteTitle.textContent = job.title;
    if (elVignetteDesc) elVignetteDesc.textContent = job.sceneDesc || '一九五七年 · 油麻地廟街';

    // Populate customer meta
    const elPortrait = document.getElementById('cust-portrait');
    if (elPortrait) elPortrait.src = job.customer.portrait;
    document.getElementById('cust-name').textContent = job.customer.name;
    document.getElementById('cust-role').textContent = job.customer.role;
    document.getElementById('cust-piece-name').textContent = job.piece.name;

    // Populate dialogue with character avatars
    const box = document.getElementById('dialogue-box');
    box.innerHTML = '';
    job.introDialogue.forEach(line => {
      const div = document.createElement('div');
      div.className = 'dialogue-line';
      const avatarSrc = line.speaker === '葉伯' ? './assets/people/yip_self.webp' : job.customer.portrait;
      div.innerHTML = `<img src="${avatarSrc}" alt="${line.speaker}" class="dialogue-avatar"><div class="dialogue-content"><span class="dialogue-speaker">${line.speaker}：</span><span class="dialogue-text">${line.text}</span></div>`;
      box.appendChild(div);
    });

    // Inquiry button
    const btnInq = document.getElementById('btn-inquire-story');
    btnInq.style.display = 'block';
    btnInq.textContent = `話說當年：${job.inquiryTopic}`;

    // Pricing options
    const pBox = document.getElementById('pricing-options');
    pBox.innerHTML = '';
    job.pricing.options.forEach(opt => {
      const b = document.createElement('button');
      b.className = 'price-option-btn';
      b.textContent = opt.label;
      b.addEventListener('click', () => {
        this.chosenPrice = opt.price;
        this.isCharity = opt.type === 'cheap' && opt.price === 0;
        
        // Add customer reply to dialogue
        const repLine = document.createElement('div');
        repLine.className = 'dialogue-line';
        repLine.innerHTML = `<img src="${job.customer.portrait}" alt="${job.customer.name}" class="dialogue-avatar"><div class="dialogue-content"><span class="dialogue-speaker">${job.customer.name}：</span><span class="dialogue-text">${opt.customerReply}</span></div>`;
        box.appendChild(repLine);
        box.scrollTop = box.scrollHeight;

        // Transition to workbench after small pause
        setTimeout(() => {
          this.startWorkbenchStage();
        }, 600);
      });
      pBox.appendChild(b);
    });
  }

  handleInquiry() {
    const job = this.currentJob;
    const box = document.getElementById('dialogue-box');
    job.inquiryDialogue.forEach(line => {
      const div = document.createElement('div');
      div.className = 'dialogue-line';
      const avatarSrc = line.speaker === '葉伯' ? './assets/people/yip_self.webp' : job.customer.portrait;
      div.innerHTML = `<img src="${avatarSrc}" alt="${line.speaker}" class="dialogue-avatar"><div class="dialogue-content"><span class="dialogue-speaker">${line.speaker}：</span><span class="dialogue-text">${line.text}</span></div>`;
      box.appendChild(div);
    });
    box.scrollTop = box.scrollHeight;
    document.getElementById('btn-inquire-story').style.display = 'none';
  }

  startWorkbenchStage() {
    document.getElementById('stage-customer').style.display = 'none';
    document.getElementById('stage-workbench').style.display = 'flex';
    document.getElementById('stage-settlement').style.display = 'none';

    // Strictly clear all stage buttons and clear any inherited onclick handlers
    const proceedBtn = document.getElementById('btn-proceed-stage');
    if (proceedBtn) {
      proceedBtn.onclick = null;
      proceedBtn.style.display = 'none';
      proceedBtn.textContent = '下一步';
    }
    const wipeBtn = document.getElementById('btn-wipe-paste');
    if (wipeBtn) wipeBtn.style.display = 'none';
    const waterBtn = document.getElementById('btn-water-test');
    if (waterBtn) {
      waterBtn.onclick = null;
      waterBtn.style.display = 'none';
    }
    const rotateBtn = document.getElementById('btn-rotate-shard');
    if (rotateBtn) rotateBtn.style.display = 'none';

    this.pasteWiped = false;
    this.waterPourProgress = 0;
    this.isSecondaryJob = false;
    this.placedStaples = [];
    this.hammeredStaples = [];
    this.chippedCracks = [];
    this.selectedShardIndex = -1;

    // Generate puzzle shards
    this.puzzleData = generateShardsForPiece(this.currentJob.piece, 720, 720);

    // Load piece image
    this.pieceImage = new Image();
    this.pieceImage.src = this.currentJob.piece.asset;
    this.pieceImage.onload = () => {
      this.currentStage = 2; // Sort & Clean
      this.updateWorkbenchHUD('選片拭灰：輕按散落瓷片，拂去陳年塵灰');
      this.renderCanvas();
    };
  }

  updateWorkbenchHUD(text) {
    const el = document.getElementById('workbench-hud');
    if (el) el.textContent = text;
  }

  // Canvas drawing & rendering
  renderCanvas() {
    if (!this.ctx || !this.puzzleData) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // If in secondary quick repair (e.g. spoon) on the bench:
    if (this.isSecondaryJob) {
      // Draw workbench dark green felt background
      ctx.fillStyle = '#223022';
      ctx.fillRect(0, 0, w, h);

      // Felt stitched border
      ctx.strokeStyle = '#324532';
      ctx.lineWidth = 14;
      ctx.strokeRect(10, 10, w - 20, h - 20);

      // Draw Spoon image
      const spoonImg = this.spoonImage;
      if (spoonImg && spoonImg.complete) {
        ctx.save();
        ctx.translate(w / 2, h / 2);
        const spSize = 540;
        ctx.drawImage(spoonImg, -spSize / 2, -spSize / 2, spSize, spSize);
        ctx.restore();
      }

      // Draw crack fracture line across spoon neck
      const neckX = w / 2 - 10;
      const neckY = h / 2 + 15;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(neckX - 65, neckY - 22);
      ctx.quadraticCurveTo(neckX, neckY, neckX + 65, neckY + 18);
      ctx.strokeStyle = 'rgba(65, 42, 25, 0.85)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Slurry paste seal if stapled
      if (this.secondaryStaplesPlaced >= 1) {
        ctx.strokeStyle = 'rgba(110, 85, 60, 0.7)';
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.strokeStyle = '#C4B49A';
        ctx.lineWidth = 6;
        ctx.stroke();
      }
      ctx.restore();

      // Staple positions on spoon neck
      const spoonStaples = [
        { x: neckX - 25, y: neckY - 12, angle: 0.35 },
        { x: neckX + 22, y: neckY + 6, angle: 0.30 }
      ];

      // Draw drilled holes or placed staples
      spoonStaples.forEach((st, idx) => {
        if (idx < this.secondaryStaplesPlaced) {
          // Clamped brass staple
          ctx.save();
          ctx.translate(st.x, st.y);
          ctx.rotate(st.angle);
          if (this.stapleImage && this.stapleImage.complete) {
            const sw = 72;
            const sh = 40;
            ctx.drawImage(this.stapleImage, -sw / 2, -sh / 2, sw, sh);
          } else {
            ctx.strokeStyle = '#B08A3E';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(-18, 0);
            ctx.lineTo(18, 0);
            ctx.stroke();
          }
          ctx.restore();
        } else {
          // Drilled guide holes
          ctx.save();
          ctx.translate(st.x, st.y);
          ctx.rotate(st.angle);
          ctx.fillStyle = '#1A1815';
          ctx.beginPath();
          ctx.arc(-14, 0, 4, 0, Math.PI * 2);
          ctx.arc(14, 0, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#B08A3E';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        }
      });
      return;
    }

    // 1. Draw felt pad outline in center
    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, this.puzzleData.radius + 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(176, 138, 62, 0.4)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.stroke();
    ctx.restore();

    // 2. Draw ghost silhouette of piece in center (Stages 2 & 3)
    if (this.currentStage <= 3) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, this.puzzleData.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 228, 204, 0.15)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(239, 228, 204, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw each shard
    this.puzzleData.shards.forEach((shard, index) => {
      ctx.save();

      const isPlaced = shard.placed;
      const offsetX = isPlaced ? 0 : shard.currentPos[0];
      const offsetY = isPlaced ? 0 : shard.currentPos[1];
      const isSelected = this.selectedShardIndex === index && !isPlaced;

      ctx.translate(offsetX, offsetY);

      // Clip to shard polygon
      ctx.beginPath();
      shard.polygon.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      });
      ctx.closePath();
      ctx.clip();

      // Draw the piece image through the clip
      if (this.pieceImage && this.pieceImage.complete) {
        ctx.drawImage(this.pieceImage, 0, 0, w, h);
      } else {
        ctx.fillStyle = '#CFC3A8';
        ctx.fill();
      }

      // If not cleaned, overlay dirt mask
      if (!shard.cleaned && this.currentStage === 2) {
        ctx.fillStyle = 'rgba(70, 55, 40, 0.55)';
        ctx.fill();
      }

      ctx.restore();

      // Outline the shard
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.beginPath();
      shard.polygon.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      });
      ctx.closePath();

      if (isSelected) {
        ctx.strokeStyle = '#E2A04A';
        ctx.lineWidth = 5;
        ctx.shadowColor = '#E2A04A';
        ctx.shadowBlur = 12;
      } else {
        ctx.strokeStyle = isPlaced ? 'rgba(47, 79, 127, 0.5)' : 'rgba(28, 26, 23, 0.7)';
        ctx.lineWidth = isPlaced ? 1.5 : 2.5;
      }
      ctx.stroke();
      ctx.restore();
    });

    // 4. In Stage 4 & 5 & 6 & 7: Draw crack guide lines & Rice paste seals
    if (this.currentStage >= 4) {
      this.puzzleData.crackEdges.forEach(edge => {
        ctx.save();
        ctx.beginPath();
        edge.points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p[0], p[1]);
          else ctx.lineTo(p[0], p[1]);
        });

        if (this.pasteWiped) {
          // Authentic warm slurry seam seal (#C4B49A) with darker edge so it reads on both blue and white
          ctx.strokeStyle = 'rgba(105, 80, 55, 0.75)';
          ctx.lineWidth = 10;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();

          ctx.strokeStyle = '#C4B49A';
          ctx.lineWidth = 7.5;
          ctx.stroke();

          ctx.strokeStyle = '#DDD2BE';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        } else if (this.currentStage >= 6) {
          ctx.strokeStyle = 'rgba(90, 59, 38, 0.35)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          ctx.strokeStyle = 'rgba(90, 59, 38, 0.8)';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
        ctx.restore();
      });

      // Draw prominent physical porcelain glaze chips if chipped during bow drill
      if (this.chippedCracks && this.chippedCracks.length > 0) {
        this.chippedCracks.forEach(c => {
          ctx.save();
          ctx.translate(c.x, c.y);
          // Dark exposed terracotta biscuit
          ctx.beginPath();
          ctx.arc(0, 0, c.radius || 15, 0, Math.PI * 2);
          ctx.fillStyle = '#3A271D';
          ctx.fill();
          // Broken white glaze rim
          ctx.strokeStyle = '#FBF8F0';
          ctx.lineWidth = 6;
          ctx.stroke();
          // Radiating stress fractures
          ctx.strokeStyle = 'rgba(180, 40, 25, 0.95)';
          ctx.lineWidth = 3;
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 2) {
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * ((c.radius || 15) * 0.4), Math.sin(a) * ((c.radius || 15) * 0.4));
            ctx.lineTo(Math.cos(a) * ((c.radius || 15) * 1.5), Math.sin(a) * ((c.radius || 15) * 1.5));
            ctx.stroke();
          }
          ctx.restore();
        });
      }
    }

    // 5. In Stage 4: Draw pencil marks for staples
    if (this.currentStage === 4) {
      this.placedStaples.forEach(s => {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle);
        ctx.strokeStyle = 'rgba(28, 26, 23, 0.85)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(18, 0);
        ctx.stroke();
        // Dot at ends
        ctx.fillStyle = '#1C1A17';
        ctx.beginPath();
        ctx.arc(-18, 0, 3.5, 0, Math.PI * 2);
        ctx.arc(18, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    // 6. In Stage 5 & unhammered staples in Stage 6: Draw drilled hole pairs
    if (this.currentStage === 5 || this.currentStage === 6) {
      this.placedStaples.forEach((s, idx) => {
        // If already hammered in Stage 6, don't draw bare hole
        if (this.currentStage === 6 && this.hammeredStaples && this.hammeredStaples.includes(idx)) return;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle);
        ctx.fillStyle = '#1A1815';
        ctx.beginPath();
        ctx.arc(-18, 0, 4.5, 0, Math.PI * 2);
        ctx.arc(18, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#B08A3E';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      });
    }

    // 7. In Stage 6 & 7: Draw composited brass staples bridging across crack!
    if (this.currentStage >= 6) {
      this.placedStaples.forEach((s, idx) => {
        // In stage 6, only draw if hammered!
        if (this.currentStage === 6 && (!this.hammeredStaples || !this.hammeredStaples.includes(idx))) {
          return;
        }

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle);
        if (this.stapleImage && this.stapleImage.complete) {
          const sw = 96;
          const sh = 54;
          ctx.drawImage(this.stapleImage, -sw / 2, -sh / 2, sw, sh);
        } else {
          // Fallback realistic metallic staple
          ctx.strokeStyle = '#B08A3E';
          ctx.lineWidth = 7;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-25, 0);
          ctx.lineTo(25, 0);
          ctx.stroke();
          // Claws into holes
          ctx.beginPath();
          ctx.moveTo(-25, 0);
          ctx.lineTo(-25, 12);
          ctx.moveTo(25, 0);
          ctx.lineTo(25, 12);
          ctx.stroke();
        }
        ctx.restore();
      });
    }

    // 8. In Stage 6 & 7: Physical Water Pour on the dish!
    if (this.waterPourProgress && this.waterPourProgress > 0) {
      const cx = w / 2;
      const cy = h / 2;
      const R = this.puzzleData.radius * 0.88;
      const currentR = R * Math.min(1, this.waterPourProgress);

      ctx.save();
      // Clip inside dish rim
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      // Single clean water pool rising from dish foot to rim (NO concentric bullseye rings!)
      const waterGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, currentR);
      waterGrad.addColorStop(0, 'rgba(125, 185, 235, 0.45)');
      waterGrad.addColorStop(0.75, 'rgba(80, 145, 210, 0.38)');
      waterGrad.addColorStop(1, 'rgba(50, 115, 185, 0.48)');
      ctx.fillStyle = waterGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, currentR, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // If leaky, draw prominent wet seepage pool and drops that sit on the felt outside the dish for the whole pour!
      if (this.evaluation && !this.evaluation.watertight) {
        ctx.save();
        // Wet seepage stain soak on dark green felt
        const puddleAngles = [0.20, 0.28, 0.36, 0.68, 0.76];
        ctx.fillStyle = 'rgba(20, 38, 55, 0.60)';
        puddleAngles.forEach(pa => {
          const px = cx + Math.cos(pa * Math.PI * 2) * (R + 16);
          const py = cy + Math.sin(pa * Math.PI * 2) * (R + 16);
          ctx.beginPath();
          ctx.ellipse(px, py, 22, 12, pa * Math.PI * 2, 0, Math.PI * 2);
          ctx.fill();
        });

        // Visible wet droplets sitting outside the rim on felt
        const dripAngles = [0.18, 0.23, 0.28, 0.34, 0.67, 0.72, 0.78];
        dripAngles.forEach((da, idx) => {
          const dist = R + 14 + (idx % 3) * 12;
          const dx = cx + Math.cos(da * Math.PI * 2) * dist;
          const dy = cy + Math.sin(da * Math.PI * 2) * dist;
          // Drop shadow
          ctx.fillStyle = 'rgba(15, 30, 48, 0.7)';
          ctx.beginPath();
          ctx.arc(dx + 1.5, dy + 1.5, 8.5, 0, Math.PI * 2);
          ctx.fill();
          // Water bead
          ctx.fillStyle = 'rgba(80, 155, 230, 0.88)';
          ctx.beginPath();
          ctx.arc(dx, dy, 8, 0, Math.PI * 2);
          ctx.fill();
          // Crisp specular reflection highlight
          ctx.fillStyle = 'rgba(235, 248, 255, 0.95)';
          ctx.beginPath();
          ctx.arc(dx - 2.5, dy - 2.5, 3, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }
    }
  }

  // Pointer interactions on Canvas
  handleCanvasPointer(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (this.isSecondaryJob) {
      this.stepSecondaryJob();
      return;
    }

    if (this.currentStage === 2) {
      // Stage 2: Clean Shard
      this.handleCleanTap(x, y);
    } else if (this.currentStage === 3) {
      // Stage 3: Reassemble
      this.handleReassembleTap(x, y);
    } else if (this.currentStage === 4) {
      // Stage 4: Mark Staples along cracks
      this.handleMarkStapleTap(x, y);
    } else if (this.currentStage === 6) {
      // Stage 6: Hammer staples
      this.handleHammerStapleTap(x, y);
    }
  }

  handleCleanTap(x, y) {
    const shards = this.puzzleData.shards;
    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      if (s.cleaned) continue;

      const px = x - s.currentPos[0];
      const py = y - s.currentPos[1];
      if (this.isPointInsidePolygon([px, py], s.polygon)) {
        s.cleaned = true;
        sounds.playClothWipe();
        this.renderCanvas();

        const allClean = shards.every(sh => sh.cleaned);
        if (allClean) {
          sounds.playPorcelainClink(1.2);
          this.updateWorkbenchHUD('瓷片均已拭淨！點擊下方按鈕開始拼合對位');
          const btn = document.getElementById('btn-proceed-stage');
          btn.style.display = 'flex';
          btn.textContent = '下一步：拼合對位';
        }
        return;
      }
    }
  }

  handleReassembleTap(x, y) {
    const shards = this.puzzleData.shards;
    const snapPx = 56; // 28px in 360 space = 56px in 720 space

    // If no shard currently selected: try to select an unplaced shard
    if (this.selectedShardIndex === -1) {
      for (let i = 0; i < shards.length; i++) {
        const s = shards[i];
        if (s.placed) continue;

        const px = x - s.currentPos[0];
        const py = y - s.currentPos[1];
        if (this.isPointInsidePolygon([px, py], s.polygon)) {
          this.selectedShardIndex = i;
          if (!s.originalPolygon) {
            s.originalPolygon = s.polygon.map(p => [...p]);
            s.rotation = 0;
          }
          sounds.playPorcelainClink(1.1);
          document.getElementById('btn-rotate-shard').style.display = 'flex';
          this.updateWorkbenchHUD(`已選中第 ${i + 1} 塊瓷片。可點「⟲ 轉向」微調，或按中央凹槽就位`);
          this.renderCanvas();
          return;
        }
      }
    } else {
      // A shard is selected: player tapped target destination
      const s = shards[this.selectedShardIndex];

      // Distance from centroid to destination slot [0, 0]
      const targetCentroidX = s.centroid[0];
      const targetCentroidY = s.centroid[1];
      const tapDistance = Math.hypot(x - targetCentroidX, y - targetCentroidY);

      if (tapDistance <= snapPx || Math.hypot(x - s.centroid[0], y - s.centroid[1]) <= s.snapThreshold * 2.5) {
        // Shard must be aligned at 0° (or multiple of 360°) to fit into the dish slot
        const rot = ((s.rotation || 0) % 360 + 360) % 360;
        if (rot !== 0) {
          sounds.playPorcelainClink(0.7);
          this.updateWorkbenchHUD(`角度未啱（現旋轉咗 ${rot}°），請按「⟲ 轉向」轉正後再安放！`);
          return;
        }

        s.currentPos = [0, 0];
        s.placed = true;
        this.selectedShardIndex = -1;
        document.getElementById('btn-rotate-shard').style.display = 'none';
        sounds.playPorcelainClink(1.0);
        this.renderCanvas();

        const allPlaced = shards.every(sh => sh.placed);
        if (allPlaced) {
          sounds.playPorcelainClink(1.4);
          this.updateWorkbenchHUD('器物拼合齊整！下一步劃線定位鋦釘');
          const btn = document.getElementById('btn-proceed-stage');
          btn.style.display = 'flex';
          btn.textContent = '下一步：畫線劃位';
        } else {
          this.updateWorkbenchHUD('扣合穩固！請繼續點選其餘碎片拼合');
        }
      } else {
        // Wrong slot / outside: soft bounce back
        sounds.playPorcelainClink(0.7);
        this.updateWorkbenchHUD('位置未對準，碎片輕輕退回');
        this.selectedShardIndex = -1;
        document.getElementById('btn-rotate-shard').style.display = 'none';
        this.renderCanvas();
      }
    }
  }

  rotateSelectedShard() {
    if (this.selectedShardIndex === -1) return;
    const s = this.puzzleData.shards[this.selectedShardIndex];
    if (!s) return;

    if (!s.originalPolygon) {
      s.originalPolygon = s.polygon.map(p => [...p]);
      s.rotation = 0;
    }

    const cx = s.centroid[0];
    const cy = s.centroid[1];
    // Rotate 90 degrees around centroid
    s.polygon = s.polygon.map(([px, py]) => [cx - (py - cy), cy + (px - cx)]);
    s.rotation = ((s.rotation || 0) + 90) % 360;

    sounds.playPorcelainClink(1.15);
    this.updateWorkbenchHUD(`已旋轉瓷片（${s.rotation}°）。輕按中央凹槽就位`);
    this.renderCanvas();
  }

  handleMarkStapleTap(x, y) {
    // Check if clicked near an existing staple to remove it
    for (let i = 0; i < this.placedStaples.length; i++) {
      const s = this.placedStaples[i];
      if (Math.hypot(x - s.x, y - s.y) < 22) {
        this.placedStaples.splice(i, 1);
        sounds.playPorcelainClink(0.9);
        this.renderCanvas();
        this.updateStapleGuideHUD();
        return;
      }
    }

    // Find nearest crack edge
    let nearestDist = Infinity;
    let bestPoint = null;
    let bestAngle = 0;

    this.puzzleData.crackEdges.forEach(edge => {
      for (let i = 0; i < edge.points.length - 1; i++) {
        const p1 = edge.points[i];
        const p2 = edge.points[i + 1];
        const d = this.distToSegment([x, y], p1, p2);
        if (d < nearestDist) {
          nearestDist = d;
          bestPoint = [x, y];
          // Tangent angle
          const dx = p2[0] - p1[0];
          const dy = p2[1] - p1[1];
          // Staple is perpendicular to crack!
          bestAngle = Math.atan2(dy, dx) + Math.PI / 2;
        }
      }
    });

    if (nearestDist < 45 && bestPoint) {
      if (this.placedStaples.length >= this.economy.staples) {
        this.updateWorkbenchHUD('黃銅鋦釘罐已空！請節制劃位');
        return;
      }

      this.placedStaples.push({
        x: bestPoint[0],
        y: bestPoint[1],
        angle: bestAngle
      });
      sounds.playPorcelainClink(1.3);
      this.renderCanvas();
      this.updateStapleGuideHUD();
    }
  }

  updateStapleGuideHUD() {
    const job = this.currentJob;
    const count = this.placedStaples.length;
    const btn = document.getElementById('btn-proceed-stage');
    btn.style.display = 'flex';
    btn.textContent = '確認劃位 · 準備打眼';

    if (count < job.piece.minStaples) {
      this.updateWorkbenchHUD(`已劃 ${count} 處（至少需 ${job.piece.minStaples} 枚，否則試水漏水）`);
    } else if (count > job.piece.maxStaples) {
      this.updateWorkbenchHUD(`已劃 ${count} 處（鋦釘過密，最多建議 ${job.piece.maxStaples} 枚）`);
    } else {
      this.updateWorkbenchHUD(`已劃 ${count} 處 · 疏密得宜（推薦 ${job.piece.optimalStaples} 枚）`);
    }
  }

  advanceCraftStage() {
    if (this.isSecondaryJob) return;
    const btn = document.getElementById('btn-proceed-stage');
    btn.style.display = 'none';

    if (this.currentStage === 2) {
      this.currentStage = 3;
      this.updateWorkbenchHUD('拼合對位：點擊碎瓷，再按中央凹槽就位（容差28px）');
      this.renderCanvas();
    } else if (this.currentStage === 3) {
      this.currentStage = 4;
      this.updateWorkbenchHUD(`畫線劃位：沿裂紋點擊標記鋦釘（建議 ${this.currentJob.piece.optimalStaples} 枚）`);
      this.renderCanvas();
    } else if (this.currentStage === 4) {
      // Evaluate staples
      this.evaluation = evaluateStaples(this.currentJob.piece, this.placedStaples, this.puzzleData.crackEdges);
      this.currentStage = 5;
      this.startBowDrillStage();
    }
  }

  // Stage 5: Bow Drill Rhythm
  startBowDrillStage() {
    document.getElementById('bow-drill-panel').style.display = 'flex';
    this.updateWorkbenchHUD('皮弓拉鑽：金剛鑽點對準孔位，當遊標居中時點擊拉弓');
    this.drillProgress = 0;
    this.drillTargetCount = Math.max(3, this.placedStaples.length);
    this.chippedCracks = [];

    this.bowOscillation = 10;
    this.bowDirection = 1;

    if (this.bowTimer) clearInterval(this.bowTimer);
    // Slow down step to 1.6% every 20ms for dwell time >= 220ms
    this.bowTimer = setInterval(() => {
      this.bowOscillation += this.bowDirection * 1.6;
      if (this.bowOscillation >= 90) {
        this.bowOscillation = 90;
        this.bowDirection = -1;
      } else if (this.bowOscillation <= 10) {
        this.bowOscillation = 10;
        this.bowDirection = 1;
      }
      const cursor = document.getElementById('bow-cursor');
      if (cursor) cursor.style.left = `${this.bowOscillation}%`;
    }, 20);

    this.renderCanvas();
  }

  handleBowDrillStroke() {
    // Sweet spot centered around 36% to 64% (dwell time > 220ms)
    const inSweetSpot = this.bowOscillation >= 36 && this.bowOscillation <= 64;
    sounds.playBowStroke();

    if (inSweetSpot) {
      this.drillProgress++;
      sounds.playPorcelainClink(1.25);
      this.updateWorkbenchHUD(`鑽孔得宜（${this.drillProgress} / ${this.drillTargetCount}）· 毫釐不差！`);
    } else {
      // Early or late stroke causes severe chipping penalty: fails watertight test!
      sounds.playPorcelainClink(0.4);
      if (this.evaluation) {
        this.evaluation.watertight = false;
        this.evaluation.rating = 'leaky';
        this.evaluation.score = Math.min(60, (this.evaluation.score || 85) - 30);
      }
      const curStaple = this.placedStaples[Math.min(this.drillProgress, this.placedStaples.length - 1)];
      // Offset along crack line so chip sits beside staple, never under it
      const crackAngle = curStaple ? curStaple.angle - Math.PI / 2 : 0;
      const chipOffsetDist = 38;
      const chipX = curStaple ? curStaple.x + Math.cos(crackAngle) * chipOffsetDist : this.canvas.width / 2;
      const chipY = curStaple ? curStaple.y + Math.sin(crackAngle) * chipOffsetDist : this.canvas.height / 2;
      this.chippedCracks.push({
        x: chipX,
        y: chipY,
        radius: 15 + Math.random() * 8,
        angle: curStaple ? curStaple.angle : 0
      });
      this.updateWorkbenchHUD(`【失手崩瓷】拉弓過急，鑽頭崩裂胎骨釉面（防漏失效，水試必滲）！`);
      this.renderCanvas();
    }

    if (this.drillProgress >= this.drillTargetCount) {
      if (this.bowTimer) clearInterval(this.bowTimer);
      document.getElementById('bow-drill-panel').style.display = 'none';
      sounds.playPorcelainClink(1.5);
      this.startStapleSettingStage();
    }
  }

  // Stage 6: Hammering staples & Water test
  startStapleSettingStage() {
    this.currentStage = 6;
    this.hammeredStaples = [];
    this.pasteWiped = false;
    this.waterPourProgress = 0;
    this.updateWorkbenchHUD(`上鋦釘：輕敲打眼處，逐枚嵌敲黃銅螞蝗釘（已嵌 0 / ${this.placedStaples.length}）`);
    this.renderCanvas();

    const proceedBtn = document.getElementById('btn-proceed-stage');
    if (proceedBtn) {
      proceedBtn.style.display = 'flex';
      proceedBtn.textContent = '敲緊全部鋦釘';
      proceedBtn.onclick = () => {
        this.autoHammerAllStaples();
      };
    }
  }

  autoHammerAllStaples() {
    const unhammered = this.placedStaples.length - this.hammeredStaples.length;
    if (unhammered > 0) {
      this.economy.consumeStaples(unhammered);
      this.hammeredStaples = this.placedStaples.map((_, i) => i);
      this.updateHUD();
      sounds.playHammerTap();
      this.renderCanvas();
    }
    this.onAllStaplesHammered();
  }

  handleHammerStapleTap(x, y) {
    let nearestIdx = -1;
    let nearestDist = Infinity;

    for (let i = 0; i < this.placedStaples.length; i++) {
      if (this.hammeredStaples.includes(i)) continue;
      const s = this.placedStaples[i];
      const d = Math.hypot(x - s.x, y - s.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }

    if (nearestIdx !== -1 && nearestDist < 54) {
      this.hammeredStaples.push(nearestIdx);
      this.economy.consumeStaples(1);
      this.updateHUD();
      sounds.playHammerTap();
      this.renderCanvas();

      if (this.hammeredStaples.length >= this.placedStaples.length) {
        this.onAllStaplesHammered();
      } else {
        this.updateWorkbenchHUD(`嵌合黃銅釘（${this.hammeredStaples.length} / ${this.placedStaples.length}）· 釘爪咬緊瓷壁！`);
      }
    } else {
      sounds.playHammerTap();
    }
  }

  onAllStaplesHammered() {
    sounds.playPorcelainClink(1.4);
    this.updateWorkbenchHUD('黃銅釘均已打實咬緊！點擊「抹糯米灰封口」將細白米漿刮入縫隙');
    const proceedBtn = document.getElementById('btn-proceed-stage');
    if (proceedBtn) {
      proceedBtn.onclick = null;
      proceedBtn.style.display = 'none';
    }
    const wipeBtn = document.getElementById('btn-wipe-paste');
    if (wipeBtn) wipeBtn.style.display = 'flex';
  }

  executeWipePaste() {
    sounds.playClothWipe();
    this.pasteWiped = true;
    this.renderCanvas();

    const wipeBtn = document.getElementById('btn-wipe-paste');
    if (wipeBtn) wipeBtn.style.display = 'none';

    const waterBtn = document.getElementById('btn-water-test');
    if (waterBtn) waterBtn.style.display = 'flex';

    this.updateWorkbenchHUD('糯米灰已封妥裂縫！點擊「注入清水試漏」驗證防漏');
  }

  executeWaterTest() {
    const waterBtn = document.getElementById('btn-water-test');
    if (waterBtn) waterBtn.style.display = 'none';

    sounds.playWaterPour(1.4);
    this.updateWorkbenchHUD('注入清水……水波蕩漾滿盞');

    // Physical pour animation on canvas
    const startTime = performance.now();
    const duration = 1200;

    const animatePour = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      this.waterPourProgress = progress;
      this.renderCanvas();

      if (progress < 1) {
        requestAnimationFrame(animatePour);
      } else {
        // Pour finished, display evaluation result
        setTimeout(() => {
          if (this.evaluation.watertight) {
            sounds.playPorcelainClink(1.6);
            this.updateWorkbenchHUD('【試水圓滿】滴水不漏！器身如初！');
          } else {
            sounds.playPorcelainClink(0.7);
            this.updateWorkbenchHUD('【試水微滲】接合稍寬或崩瓷，水滲出盤沿！');
          }

          setTimeout(() => {
            this.showSettlementStage();
          }, 1400);
        }, 300);
      }
    };

    requestAnimationFrame(animatePour);
  }

  showSettlementStage() {
    this.currentStage = 7;
    document.getElementById('stage-customer').style.display = 'none';
    document.getElementById('stage-workbench').style.display = 'none';
    document.getElementById('stage-settlement').style.display = 'flex';

    // Reset sidejob row on settlement panel
    const sideRow = document.getElementById('settle-sidejob-row');
    if (sideRow) sideRow.style.display = 'none';

    // Record complete daily settlement in economy: opening + earned - daily living (- rent if due)
    const res = this.economy.recordDailySettlement(this.chosenPrice, this.evaluation, this.isCharity);
    this.updateHUD();

    // Fill settlement dialog
    const quoteEl = document.getElementById('settlement-quote');
    const quoteText = this.currentJob.completionDialogue[this.evaluation.rating] || this.currentJob.completionDialogue.good;
    quoteEl.textContent = quoteText;

    document.getElementById('settle-income').textContent = `+$${res.earned.toFixed(1)}${res.tip > 0 ? ` (含打賞 $${res.tip.toFixed(1)})` : ''}`;
    document.getElementById('settle-staples-used').textContent = `-${this.placedStaples.length} 枚`;
    document.getElementById('settle-balance').textContent = `$${this.economy.cash.toFixed(1)}`;

    const rentRow = document.getElementById('settle-rent-row');
    if (this.currentDay === 6 || this.currentDay === 12) {
      rentRow.style.display = 'flex';
      document.getElementById('settle-rent-amount').textContent = `-$${this.economy.rentAmount.toFixed(1)}`;
    } else {
      rentRow.style.display = 'none';
    }

    // Secondary job button for market days (Day 1 & Day 7)
    const secBtn = document.getElementById('btn-secondary-job');
    if (secBtn) {
      if (this.currentJob.secondaryJob && !this.secondaryJobCompleted) {
        secBtn.style.display = 'flex';
        secBtn.disabled = false;
        secBtn.style.opacity = '1';
        secBtn.textContent = `【街坊急修】${this.currentJob.secondaryJob.title}（+$${this.currentJob.secondaryJob.reward.toFixed(1)}）`;
        secBtn.onclick = () => {
          this.handleSecondaryJob();
        };
      } else {
        secBtn.style.display = 'none';
      }
    }
  }

  handleSecondaryJob() {
    const sec = this.currentJob.secondaryJob;
    if (!sec || this.secondaryJobCompleted) return;

    // Open workbench for the secondary spoon repair on the bench!
    this.isSecondaryJob = true;
    this.secondaryStaplesPlaced = 0;
    this.secondaryTargetStaples = sec.staples || 2;

    // Switch panels
    document.getElementById('stage-settlement').style.display = 'none';
    document.getElementById('stage-workbench').style.display = 'flex';

    // Hide unused workbench controls
    const rotBtn = document.getElementById('btn-rotate-shard');
    if (rotBtn) rotBtn.style.display = 'none';
    const wipeBtn = document.getElementById('btn-wipe-paste');
    if (wipeBtn) wipeBtn.style.display = 'none';
    const waterBtn = document.getElementById('btn-water-test');
    if (waterBtn) waterBtn.style.display = 'none';
    const drillPanel = document.getElementById('bow-drill-panel');
    if (drillPanel) drillPanel.style.display = 'none';

    // Load spoon image if not loaded
    if (!this.spoonImage) {
      this.spoonImage = new Image();
      this.spoonImage.src = 'assets/plates/spoon_porcelain_shou.webp';
      this.spoonImage.onload = () => this.renderCanvas();
    }

    // Configure proceed button
    const proceedBtn = document.getElementById('btn-proceed-stage');
    if (proceedBtn) {
      proceedBtn.style.display = 'flex';
      proceedBtn.textContent = `嵌敲鋦釘（0 / ${this.secondaryTargetStaples}）`;
      proceedBtn.onclick = () => {
        this.stepSecondaryJob();
      };
    }

    this.updateWorkbenchHUD(`街坊急修 · ${sec.title}：輕敲匙柄裂縫處，嵌敲黃銅釘（0 / ${this.secondaryTargetStaples}）`);
    this.renderCanvas();
  }

  stepSecondaryJob() {
    const sec = this.currentJob.secondaryJob;
    if (!sec || !this.isSecondaryJob) return;

    if (this.secondaryStaplesPlaced < this.secondaryTargetStaples) {
      this.secondaryStaplesPlaced++;
      sounds.playHammerTap();
      setTimeout(() => sounds.playPorcelainClink(1.3), 120);

      this.renderCanvas();

      const proceedBtn = document.getElementById('btn-proceed-stage');
      if (this.secondaryStaplesPlaced < this.secondaryTargetStaples) {
        if (proceedBtn) proceedBtn.textContent = `嵌敲鋦釘（${this.secondaryStaplesPlaced} / ${this.secondaryTargetStaples}）`;
        this.updateWorkbenchHUD(`街坊急修 · ${sec.title}：輕敲匙柄裂縫處，嵌敲黃銅釘（${this.secondaryStaplesPlaced} / ${this.secondaryTargetStaples}）`);
      } else {
        if (proceedBtn) proceedBtn.textContent = `完成急修 · 返回結算`;
        this.updateWorkbenchHUD(`【急修妥當】${sec.title}已牢牢鋦穩！點擊按鈕返回結算入賬`);
      }
    } else {
      // Completed, return to settlement
      this.finishSecondaryJob();
    }
  }

  finishSecondaryJob() {
    const sec = this.currentJob.secondaryJob;
    if (!sec) return;

    this.isSecondaryJob = false;
    this.secondaryJobCompleted = true;

    // Deduct staples and record reward
    const staplesUsed = sec.staples || 2;
    this.economy.consumeStaples(staplesUsed);

    const reward = Number(sec.reward) || 1.0;
    this.economy.cash = Math.round((this.economy.cash + reward) * 100) / 100;
    this.economy.reputation = Math.min(100, this.economy.reputation + 4);
    this.economy.ledger.push({
      day: this.currentDay,
      type: 'income',
      description: `急修${sec.title}`,
      amount: reward,
      balance: this.economy.cash
    });
    this.updateHUD();

    // Reset proceedBtn
    const proceedBtn = document.getElementById('btn-proceed-stage');
    if (proceedBtn) proceedBtn.onclick = null;

    // Switch back to settlement stage
    document.getElementById('stage-workbench').style.display = 'none';
    document.getElementById('stage-settlement').style.display = 'flex';

    // Update settlement breakdown:
    // 1. Staples line shows total used: e.g. -6 枚
    const totalStaplesUsed = this.placedStaples.length + staplesUsed;
    document.getElementById('settle-staples-used').textContent = `-${totalStaplesUsed} 枚`;

    // 2. Side-job row
    const sideRow = document.getElementById('settle-sidejob-row');
    if (sideRow) {
      sideRow.style.display = 'flex';
      const lbl = document.getElementById('settle-sidejob-label');
      if (lbl) lbl.textContent = `街坊急修（${sec.title}）：`;
      const amt = document.getElementById('settle-sidejob-amount');
      if (amt) amt.textContent = `+$${reward.toFixed(1)}`;
    }

    // 3. Balance
    document.getElementById('settle-balance').textContent = `$${this.economy.cash.toFixed(1)}`;

    // 4. Secondary button disabled
    const secBtn = document.getElementById('btn-secondary-job');
    if (secBtn) {
      secBtn.disabled = true;
      secBtn.style.opacity = '0.6';
      secBtn.textContent = `已順手修妥${sec.title}（+$${reward.toFixed(1)}已入賬）`;
    }
  }

  finishDayAndProceed() {
    const endResult = this.economy.endDay();
    this.updateHUD();

    if (this.currentDay >= 12) {
      // Determine Ending
      this.triggerEnding();
      return;
    }

    this.currentDay++;
    this.saveGame();
    this.startDay(this.currentDay);
  }

  triggerEnding() {
    let endingKey = 'peaceful';
    if (this.economy.reputation >= 70 && this.economy.cash >= 10) {
      endingKey = 'reunion';
    } else if (this.economy.reputation >= 55) {
      endingKey = 'apprentice';
    } else if (this.economy.cash >= 12) {
      endingKey = 'community';
    }

    const ending = ENDINGS_DATA[endingKey] || ENDINGS_DATA.reunion;
    document.getElementById('ending-modal-title').textContent = ending.title;
    document.getElementById('ending-vignette-img').src = ending.vignette;
    document.getElementById('ending-modal-text').textContent = ending.description;

    this.openModal('modal-ending');
  }

  renderLedgerRecords() {
    const tbody = document.getElementById('ledger-records-body');
    tbody.innerHTML = '';
    // Show in chronological order (oldest to newest)
    const records = [...this.economy.ledger];

    if (records.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="4" style="text-align:center; color:#888;">今日開檔，尚無流水記錄</td>`;
      tbody.appendChild(tr);
      return;
    }

    records.forEach(r => {
      const tr = document.createElement('tr');
      const isPositive = r.amount > 0;
      const amtClass = isPositive ? 'amount-income' : 'amount-expense';
      const amtStr = isPositive ? `+$${r.amount.toFixed(1)}` : (r.amount === 0 ? '$0.0' : `-$${Math.abs(r.amount).toFixed(1)}`);
      tr.innerHTML = `
        <td>第${r.day}日</td>
        <td>${r.description}</td>
        <td class="${amtClass}">${amtStr}</td>
        <td>$${r.balance.toFixed(1)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  renderChaptersNav() {
    // Dynamic letter display based on story progress
    const letterEl = document.getElementById('letter-content-display');
    if (letterEl) {
      if (this.maxDayReached >= 12) {
        letterEl.textContent = `父親大人敬啟：
特大喜訊！省港過境探親路條經已批下！
兒與女婿定於下月初攜妹過境澳門，已托九叔在拱北關閘接應。
信中所附乃父親當年遺於老家之紫銅小錘。
修瓷一世，殘器終得合璧；骨肉八載，長河終有歸舟。
父親珍重，關閘相見在即！

女 阿娟 淚筆
一九五七年冬`;
      } else if (this.maxDayReached >= 8) {
        letterEl.textContent = `父親大人膝下：
兒在汕頭安好，見字如面。
九叔帶回父親平安口信，兒喜極而泣。
家中一切粗安，妹已在小學入讀二年級，功課甚好。
隨信托九叔奉上昔年家中所用青花瓷匙。
匙頸雖斷，但兒知父親神乎其技，必能合璧。
見匙如見父面，願雙親安泰，骨肉有期。

女 阿娟 拜上
一九五七年深秋`;
      } else {
        letterEl.textContent = `阿娟吾兒見字：
為父在香江油麻地廟街立檔，金剛鑽尚利，每日修得三五件粗細瓷器。
街坊念舊厚道，溫飽粗安，切莫掛懷。
香江海風甚鹹，每逢夜市散去，望向北面韓江方向，不知汝妹讀書何如。
若有同鄉水客北上，定附匯幾兩銀子。
盼骨肉早日團聚。

父 秉衡 手書於油麻地廟街雨棚
一九五七年秋`;
      }
    }

    const list = document.getElementById('chapters-nav-list');
    list.innerHTML = '';
    for (let d = 1; d <= 12; d++) {
      const btn = document.createElement('button');
      btn.className = 'wood-btn secondary';
      btn.style.minWidth = '44px';
      btn.style.minHeight = '44px';
      btn.style.padding = '6px 12px';
      btn.style.fontSize = '15px';
      btn.textContent = `第${this.toChineseNumeral(d)}日`;

      if (d <= this.maxDayReached) {
        btn.addEventListener('click', () => {
          this.closeModal('modal-chapters');
          this.startDay(d);
        });
      } else {
        btn.disabled = true;
        btn.style.opacity = '0.4';
      }
      list.appendChild(btn);
    }
  }

  // Geometry helper: Point in Polygon test (Ray casting)
  isPointInsidePolygon(point, polygon) {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // Geometry helper: Distance from point to line segment
  distToSegment(p, p1, p2) {
    const l2 = Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2);
    if (l2 === 0) return Math.hypot(p[0] - p1[0], p[1] - p1[1]);
    let t = ((p[0] - p1[0]) * (p2[0] - p1[0]) + (p[1] - p1[1]) * (p2[1] - p1[1])) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = p1[0] + t * (p2[0] - p1[0]);
    const projY = p1[1] + t * (p2[1] - p1[1]);
    return Math.hypot(p[0] - projX, p[1] - projY);
  }
}

// Start application on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new GameApp();
});
