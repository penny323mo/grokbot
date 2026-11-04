// UI Controller and Event Routing for Frostgate Wardens
import { TOWERS, ENEMIES, HERO, PALETTE, CANTONESE_TUTORIAL, VICTORY_LINES, DEFEAT_LINES } from './data.js';
import { sounds } from './audio.js';
import { saveStore } from './save.js';

export class UIController {
    constructor(game, camera, renderer) {
        this.game = game;
        this.camera = camera;
        this.renderer = renderer;
        this.abortController = new AbortController();

        this.selectedPlotId = null;
        this.previewTowerType = 'crossbow';
        this.selectedTower = null;

        // Hero ability state
        this.targetingAbility = null; // 'blizzard', 'reinforcements', 'beacon'
        this.abilityTargetPos = null;

        // Tutorial state: only active on Region 1 if not previously completed
        this.tutorialStep = saveStore.data.tutorialStep || 0;
        this.tutorialActive = (this.game.map.region === 1) && !saveStore.data.tutorialCompleted;

        this.initDom();
        this.bindEvents();

        if (!this.tutorialActive) {
            this.dom.tutorialOverlay.classList.add('hidden');
        } else {
            this.showCurrentTutorialStep();
        }

        this.game.onWaveComplete = () => {
            this.updateNextWavePreview();
        };

        if (this.camera) {
            this.camera.onMove = () => {
                if (this.tutorialActive && this.tutorialStep === 0) {
                    this.advanceTutorial();
                }
            };
        }
    }

    destroy() {
        this.abortController.abort();
    }

    initDom() {
        this.dom = {
            hudHp: document.getElementById('hud-hp'),
            hudGold: document.getElementById('hud-gold'),
            hudWave: document.getElementById('hud-wave'),
            btnSpeed: document.getElementById('btn-speed'),
            btnPause: document.getElementById('btn-pause'),
            btnModalMute: document.getElementById('btn-modal-mute'),

            // Docks
            dockDefault: document.getElementById('dock-default'),
            dockBuild: document.getElementById('dock-build'),
            dockTower: document.getElementById('dock-tower'),
            dockAbility: document.getElementById('dock-ability'),

            // Wave controls
            btnStartWave: document.getElementById('btn-start-wave'),
            wavePreviewList: document.getElementById('wave-preview-list'),
            earlyCallHint: document.getElementById('early-call-hint'),

            // Hero buttons
            heroHpBar: document.getElementById('hero-hp-bar'),
            heroBarks: document.getElementById('hero-bark'),
            btnAbilityBlizzard: document.getElementById('btn-ab-blizzard'),
            btnAbilityReinf: document.getElementById('btn-ab-reinf'),
            btnAbilityBeacon: document.getElementById('btn-ab-beacon'),

            // Build Dock
            towerSelectRow: document.getElementById('tower-select-row'),
            buildTowerName: document.getElementById('build-tower-name'),
            buildTowerDesc: document.getElementById('build-tower-desc'),
            btnConfirmBuild: document.getElementById('btn-confirm-build'),
            btnCancelBuild: document.getElementById('btn-cancel-build'),

            // Tower Inspect Dock
            inspectTowerName: document.getElementById('inspect-tower-name'),
            inspectTowerStats: document.getElementById('inspect-tower-stats'),
            upgradeContainer: document.getElementById('upgrade-container'),
            btnSellTower: document.getElementById('btn-sell-tower'),
            btnCloseTower: document.getElementById('btn-close-tower'),

            // Ability Dock
            abilityName: document.getElementById('ability-name'),
            abilityDesc: document.getElementById('ability-desc'),
            btnConfirmAbility: document.getElementById('btn-confirm-ability'),
            btnCancelAbility: document.getElementById('btn-cancel-ability'),

            // Tutorial Banner
            tutorialOverlay: document.getElementById('tutorial-overlay'),
            tutorialText: document.getElementById('tutorial-text'),
            btnSkipTutorial: document.getElementById('btn-skip-tutorial'),

            // Modals
            modalPause: document.getElementById('modal-pause'),
            modalVictory: document.getElementById('modal-victory'),
            modalDefeat: document.getElementById('modal-defeat'),
            modalCredits: document.getElementById('modal-credits')
        };
    }

    bindEvents() {
        const d = this.dom;
        const signal = this.abortController.signal;

        // Speed toggle
        d.btnSpeed.addEventListener('click', () => {
            sounds.unlock();
            const speeds = [1, 2, 3];
            const nextIdx = (speeds.indexOf(this.game.speed) + 1) % speeds.length;
            this.game.speed = speeds[nextIdx];
            d.btnSpeed.textContent = `${this.game.speed}×`;
            saveStore.setSpeed(this.game.speed);

            if (this.tutorialActive && CANTONESE_TUTORIAL[this.tutorialStep]?.id === 'speed_pause') {
                this.advanceTutorial();
            }
        }, { signal });

        // Pause
        d.btnPause.addEventListener('click', () => {
            sounds.unlock();
            this.game.paused = true;
            sounds.pause();
            if (d.btnModalMute) {
                d.btnModalMute.textContent = sounds.muted ? '音效：靜音' : '音效：開啟';
            }
            d.modalPause.classList.remove('hidden');
        }, { signal });

        const btnResume = document.getElementById('btn-resume');
        if (btnResume) {
            btnResume.addEventListener('click', () => {
                this.game.paused = false;
                sounds.resume();
                d.modalPause.classList.add('hidden');
            }, { signal });
        }

        // Mute toggle inside Pause modal
        if (d.btnModalMute) {
            d.btnModalMute.addEventListener('click', () => {
                const isMuted = sounds.toggleMute();
                d.btnModalMute.textContent = isMuted ? '音效：靜音' : '音效：開啟';
            }, { signal });
        }

        // Start Wave
        d.btnStartWave.addEventListener('click', () => {
            sounds.unlock();
            this.game.startWave();
            this.updateNextWavePreview();
            if (this.camera) this.camera.autoFrame(400);

            if (this.tutorialActive && CANTONESE_TUTORIAL[this.tutorialStep]?.id === 'start_wave') {
                this.advanceTutorial();
            }
        }, { signal });

        // Build Confirmation
        d.btnConfirmBuild.addEventListener('click', () => {
            if (this.selectedPlotId !== null && this.previewTowerType) {
                const ok = this.game.buildTower(this.selectedPlotId, this.previewTowerType);
                if (ok) {
                    this.closeDocks();

                    if (this.tutorialActive && CANTONESE_TUTORIAL[this.tutorialStep]?.id === 'build_crossbow') {
                        this.advanceTutorial();
                    }
                }
            }
        }, { signal });

        d.btnCancelBuild.addEventListener('click', () => {
            this.closeDocks();
        }, { signal });

        // Sell Tower
        d.btnSellTower.addEventListener('click', () => {
            if (this.selectedPlotId !== null) {
                this.game.sellTower(this.selectedPlotId);
                this.closeDocks();
            }
        }, { signal });

        d.btnCloseTower.addEventListener('click', () => {
            this.closeDocks();
        }, { signal });

        // Hero Abilities triggers
        d.btnAbilityBlizzard.addEventListener('click', () => this.startAbilityTargeting('blizzard'), { signal });
        d.btnAbilityReinf.addEventListener('click', () => this.startAbilityTargeting('reinforcements'), { signal });
        d.btnAbilityBeacon.addEventListener('click', () => this.startAbilityTargeting('beacon'), { signal });

        d.btnConfirmAbility.addEventListener('click', () => {
            if (this.targetingAbility && this.abilityTargetPos) {
                const ok = this.game.castHeroAbility(this.targetingAbility, this.abilityTargetPos.x, this.abilityTargetPos.y);
                if (ok) {
                    this.targetingAbility = null;
                    this.abilityTargetPos = null;
                    this.closeDocks();

                    if (this.tutorialActive && CANTONESE_TUTORIAL[this.tutorialStep]?.id === 'hero_ability') {
                        this.advanceTutorial();
                    }
                }
            }
        }, { signal });

        d.btnCancelAbility.addEventListener('click', () => {
            this.targetingAbility = null;
            this.abilityTargetPos = null;
            this.closeDocks();
        }, { signal });

        // Skip Tutorial
        d.btnSkipTutorial.addEventListener('click', () => {
            this.completeTutorial();
        }, { signal });

        // Canvas Touch / Click Routing
        this.bindCanvasInput();

        // Populate Build Tower Buttons
        this.renderTowerOptions();
    }

    bindCanvasInput() {
        const cvs = this.renderer.canvas;
        const signal = this.abortController.signal;

        const handleTap = (screenX, screenY) => {
            sounds.unlock();

            // Double tap check
            if (this.camera.checkDoubleTap(screenX, screenY)) {
                return;
            }

            const world = this.camera.screenToWorld(screenX, screenY);

            // 1. If currently targeting a Hero Ability
            if (this.targetingAbility) {
                // Set target position for ability preview
                this.abilityTargetPos = { x: world.x, y: world.y };
                this.dom.btnConfirmAbility.disabled = false;
                return;
            }

            // 2. Plot Snapping (within ~40px in screen space)
            let nearestPlot = null;
            let minDist = 44 / this.camera.zoom;

            for (const p of this.game.map.plots) {
                const d = Math.hypot(p.x - world.x, p.y - world.y);
                if (d < minDist) {
                    minDist = d;
                    nearestPlot = p;
                }
            }

            if (nearestPlot) {
                this.onPlotTapped(nearestPlot.id);
                return;
            }

            // 3. Check Hero tap (select hero or command hero to move)
            const dHero = Math.hypot(this.game.hero.x - world.x, this.game.hero.y - world.y);
            if (dHero < 45) {
                // Erika bark
                const barks = HERO.barks;
                const bark = barks[Math.floor(Math.random() * barks.length)];
                this.game.addFloatingText(this.game.hero.x, this.game.hero.y - 70, bark, PALETTE.saffron);
                return;
            }

            // 4. Tap on road to move hero
            const nearestRoad = this.game.getNearestRoadPoint(world.x, world.y);
            const dRoad = Math.hypot(nearestRoad.x - world.x, nearestRoad.y - world.y);
            if (dRoad < 70) {
                this.game.hero.targetX = world.x;
                this.game.hero.targetY = world.y;
                sounds.playBow();
                this.game.addFloatingText(world.x, world.y - 20, '前進守備!', PALETTE.glacierTeal);
                return;
            }

            // Otherwise tap on empty space: close docks
            this.closeDocks();
        };

        // Touch events
        cvs.addEventListener('touchstart', (e) => {
            if (e.cancelable) e.preventDefault();
            this.camera.onTouchStart(e);
        }, { passive: false, signal });

        cvs.addEventListener('touchmove', (e) => {
            if (e.cancelable) e.preventDefault();
            this.camera.onTouchMove(e);
        }, { passive: false, signal });

        cvs.addEventListener('touchend', (e) => {
            if (e.cancelable) e.preventDefault();
            const wasTap = this.camera.onTouchEnd(e);
            if (wasTap && e.changedTouches.length > 0) {
                const t = e.changedTouches[0];
                const rect = cvs.getBoundingClientRect();
                handleTap(t.clientX - rect.left, t.clientY - rect.top);
            }
        }, { passive: false, signal });

        // Mouse fallbacks for desktop browser testing
        let mouseDown = false;
        let mouseStart = { x: 0, y: 0 };
        let mouseMoved = false;

        cvs.addEventListener('mousedown', (e) => {
            mouseDown = true;
            mouseMoved = false;
            mouseStart = { x: e.clientX, y: e.clientY };
            this.camera.onTouchStart({
                touches: [{ clientX: e.clientX, clientY: e.clientY }]
            });
        }, { signal });

        window.addEventListener('mousemove', (e) => {
            if (!mouseDown) return;
            if (Math.hypot(e.clientX - mouseStart.x, e.clientY - mouseStart.y) > 6) {
                mouseMoved = true;
            }
            this.camera.onTouchMove({
                touches: [{ clientX: e.clientX, clientY: e.clientY }]
            });
        }, { signal });

        window.addEventListener('mouseup', (e) => {
            if (!mouseDown) return;
            mouseDown = false;
            this.camera.onTouchEnd({ touches: [] });
            if (!mouseMoved) {
                const rect = cvs.getBoundingClientRect();
                handleTap(e.clientX - rect.left, e.clientY - rect.top);
            }
        }, { signal });
    }

    onPlotTapped(plotId) {
        this.selectedPlotId = plotId;
        const tower = this.game.towers.find(t => t.plotId === plotId);

        if (tower) {
            // Built Tower: Open Inspect/Upgrade dock
            this.showTowerInspectDock(tower);
            if (this.tutorialActive && CANTONESE_TUTORIAL[this.tutorialStep]?.id === 'inspect_tower') {
                this.advanceTutorial();
            }
        } else {
            // Empty Plot: Open Build dock
            this.showBuildDock();
            if (this.tutorialActive && CANTONESE_TUTORIAL[this.tutorialStep]?.id === 'build_crossbow') {
                // Focus crossbow
                this.selectTowerType('crossbow');
            }
        }
    }

    showBuildDock() {
        this.dom.dockDefault.classList.add('hidden');
        this.dom.dockTower.classList.add('hidden');
        this.dom.dockAbility.classList.add('hidden');
        this.dom.dockBuild.classList.remove('hidden');

        this.selectTowerType(this.previewTowerType || 'crossbow');
    }

    renderTowerOptions() {
        const row = this.dom.towerSelectRow;
        row.innerHTML = '';

        for (const key in TOWERS) {
            const tDef = TOWERS[key];
            const btn = document.createElement('button');
            btn.className = `btn-tower-pick ${this.previewTowerType === key ? 'active' : ''}`;
            btn.dataset.type = key;
            btn.innerHTML = `
                <img src="${tDef.icon}" class="tower-pick-icon" alt="${tDef.name}">
                <div class="tower-pick-name">${tDef.name}</div>
                <div class="tower-pick-cost">${tDef.cost}G</div>
            `;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectTowerType(key);
            });
            row.appendChild(btn);
        }
    }

    selectTowerType(typeKey) {
        this.previewTowerType = typeKey;
        const tDef = TOWERS[typeKey];
        if (!tDef) return;

        // Update active class
        const buttons = this.dom.towerSelectRow.querySelectorAll('.btn-tower-pick');
        buttons.forEach(b => {
            b.classList.toggle('active', b.dataset.type === typeKey);
        });

        // Update details
        this.dom.buildTowerName.textContent = tDef.name;
        this.dom.buildTowerDesc.textContent = `${tDef.desc} (射程 ${tDef.levels['1'].range} / 攻速 ${tDef.levels['1'].rate}s)`;
        this.dom.btnConfirmBuild.textContent = `建造 (${tDef.cost}G)`;
        this.dom.btnConfirmBuild.disabled = this.game.gold < tDef.cost;
    }

    showTowerInspectDock(tower) {
        this.dom.dockDefault.classList.add('hidden');
        this.dom.dockBuild.classList.add('hidden');
        this.dom.dockAbility.classList.add('hidden');
        this.dom.dockTower.classList.remove('hidden');

        const tDef = TOWERS[tower.type];
        const curLvl = tDef.levels[tower.level];

        this.dom.inspectTowerName.textContent = `${curLvl.name} (等級 ${tower.level})`;

        if (tower.type === 'bell') {
            const buffDmgPct = Math.round((curLvl.buffDamage || 0) * 100);
            const buffSpdPct = Math.round((curLvl.buffRate || 0) * 100);
            const stun = curLvl.stunDuration ? `${curLvl.stunDuration}s` : '無';
            const range = Math.round((curLvl.range || 180) * tower.buffRange);
            this.dom.inspectTowerStats.textContent = `威力 +${buffDmgPct}% | 攻速 +${buffSpdPct}% | 射程 ${range} | 震眩 ${stun}`;
        } else if (tower.type === 'guard') {
            const count = curLvl.guardCount || 2;
            const gHp = curLvl.guardHp || 120;
            const gAtk = curLvl.guardAtk || 14;
            const gRespawn = curLvl.respawnTime || 8;
            this.dom.inspectTowerStats.textContent = `守衛 ${count}名 | 生命 ${gHp} | 攻擊 ${gAtk} | 重生 ${gRespawn}s`;
        } else {
            const dmg = Math.round((curLvl.damage || 0) * tower.buffDmg);
            const range = Math.round((curLvl.range || 0) * tower.buffRange);
            const rate = curLvl.rate || 1.0;
            const dps = rate > 0 ? (dmg / rate).toFixed(1) : dmg;
            this.dom.inspectTowerStats.textContent = `傷害 ${dmg} | 射程 ${range} | 攻速 ${rate}s | DPS ${dps}`;
        }

        // Sell refund
        let totalCost = tDef.cost;
        if (tower.level === '2' || tower.level === '3a' || tower.level === '3b') {
            totalCost += tDef.levels['1'].upgradeCost;
        }
        if (tower.level === '3a' || tower.level === '3b') {
            totalCost += tDef.levels['2'].upgradeCost;
        }
        const refund = Math.floor(totalCost * 0.7);
        this.dom.btnSellTower.textContent = `變賣 (+${refund}G)`;

        // Upgrade Container
        const container = this.dom.upgradeContainer;
        container.innerHTML = '';

        if (tower.level === '1') {
            const nextDef = tDef.levels['2'];
            const upBtn = document.createElement('button');
            upBtn.className = 'btn-action btn-saffron';
            upBtn.textContent = `升級為 ${nextDef.name} (${curLvl.upgradeCost}G)`;
            upBtn.disabled = this.game.gold < curLvl.upgradeCost;
            upBtn.addEventListener('click', () => {
                const ok = this.game.upgradeTower(tower.plotId);
                if (ok) this.showTowerInspectDock(tower);
            });
            container.appendChild(upBtn);
        } else if (tower.level === '2') {
            // Branch Choice!
            const branchRow = document.createElement('div');
            branchRow.className = 'branch-choice-row';

            const bA = tDef.levels['3a'];
            const btnA = document.createElement('button');
            btnA.className = 'btn-branch';
            btnA.innerHTML = `<strong>【${bA.branchName}】${bA.name}</strong><br><small>${bA.desc}</small><br><strong>${curLvl.upgradeCost}G</strong>`;
            btnA.disabled = this.game.gold < curLvl.upgradeCost;
            btnA.addEventListener('click', () => {
                const ok = this.game.upgradeTower(tower.plotId, '3a');
                if (ok) this.showTowerInspectDock(tower);
            });

            const bB = tDef.levels['3b'];
            const btnB = document.createElement('button');
            btnB.className = 'btn-branch';
            btnB.innerHTML = `<strong>【${bB.branchName}】${bB.name}</strong><br><small>${bB.desc}</small><br><strong>${curLvl.upgradeCost}G</strong>`;
            btnB.disabled = this.game.gold < curLvl.upgradeCost;
            btnB.addEventListener('click', () => {
                const ok = this.game.upgradeTower(tower.plotId, '3b');
                if (ok) this.showTowerInspectDock(tower);
            });

            branchRow.appendChild(btnA);
            branchRow.appendChild(btnB);
            container.appendChild(branchRow);
        } else {
            const maxLabel = document.createElement('div');
            maxLabel.className = 'max-level-badge';
            maxLabel.textContent = '★ 已達終極形態';
            container.appendChild(maxLabel);
        }
    }

    startAbilityTargeting(abilityId) {
        sounds.unlock();
        const abDef = HERO.abilities.find(a => a.id === abilityId);
        if (!abDef) return;

        if (this.game.hero.abilities[abilityId].cdRemaining > 0) {
            this.game.addFloatingText(this.game.hero.x, this.game.hero.y - 40, '冷卻中!', PALETTE.saffron);
            return;
        }
        if (this.game.gold < abDef.cost) {
            this.game.addFloatingText(this.game.hero.x, this.game.hero.y - 40, '金幣不足!', PALETTE.emberCoral);
            return;
        }

        this.targetingAbility = abilityId;
        // Default target at hero position or nearest road
        this.abilityTargetPos = { x: this.game.hero.x, y: this.game.hero.y };

        this.dom.dockDefault.classList.add('hidden');
        this.dom.dockBuild.classList.add('hidden');
        this.dom.dockTower.classList.add('hidden');
        this.dom.dockAbility.classList.remove('hidden');

        this.dom.abilityName.textContent = `【${abDef.name}】點選路面施放目標`;
        this.dom.abilityDesc.textContent = `${abDef.desc} (消耗 ${abDef.cost}G)`;
        this.dom.btnConfirmAbility.textContent = `施放 (${abDef.cost}G)`;
        this.dom.btnConfirmAbility.disabled = false;
    }

    closeDocks() {
        this.selectedPlotId = null;
        this.targetingAbility = null;
        this.abilityTargetPos = null;

        this.dom.dockBuild.classList.add('hidden');
        this.dom.dockTower.classList.add('hidden');
        this.dom.dockAbility.classList.add('hidden');
        this.dom.dockDefault.classList.remove('hidden');
    }

    updateNextWavePreview() {
        const previewRow = this.dom.wavePreviewList;
        previewRow.innerHTML = '';

        if (this.game.waveState === 'finished' || this.game.currentWave >= this.game.waves.length) {
            previewRow.innerHTML = '<span class="preview-tag" style="font-size:14px; color:var(--glacier-teal);">已全數擊退</span>';
            this.dom.earlyCallHint.style.display = 'none';
            return;
        }

        const previewWaveIdx = (this.game.waveState === 'spawning' || this.game.waveState === 'active')
            ? this.game.currentWave + 1
            : this.game.currentWave;

        if (previewWaveIdx >= this.game.waves.length) {
            previewRow.innerHTML = '<span class="preview-tag" style="font-size:14px; color:var(--saffron);">最後決戰中</span>';
            this.dom.earlyCallHint.style.display = 'none';
            return;
        }

        const wave = this.game.waves[previewWaveIdx];
        const counts = {};
        for (const sp of wave.spawns) {
            counts[sp.type] = (counts[sp.type] || 0) + sp.count;
        }

        for (const typeKey in counts) {
            const eDef = ENEMIES[typeKey];
            const item = document.createElement('div');
            item.className = 'preview-item';
            item.innerHTML = `
                <img src="${eDef.sprite}" class="preview-icon" alt="${eDef.name}">
                <span class="preview-badge" style="font-size:14px;">${eDef.name} ×${counts[typeKey]}</span>
                <span class="preview-tag tag-${typeKey}" style="font-size:14px;">${eDef.tag}</span>
            `;
            previewRow.appendChild(item);
        }

        this.dom.earlyCallHint.style.display = this.game.waveState === 'active' ? 'block' : 'none';
    }

    advanceTutorial() {
        this.tutorialStep++;
        saveStore.setTutorialStep(this.tutorialStep);
        if (this.tutorialStep >= CANTONESE_TUTORIAL.length) {
            this.completeTutorial();
        } else {
            this.showCurrentTutorialStep();
        }
    }

    completeTutorial() {
        this.tutorialActive = false;
        saveStore.setTutorialCompleted();
        this.dom.tutorialOverlay.classList.add('hidden');
        this.updateTutorialGlow(null);
        if (this.renderer) {
            this.renderer.tutorialPointer = null;
        }
    }

    showCurrentTutorialStep() {
        if (!this.tutorialActive) {
            this.dom.tutorialOverlay.classList.add('hidden');
            return;
        }
        const step = CANTONESE_TUTORIAL[this.tutorialStep];
        if (!step) {
            this.completeTutorial();
            return;
        }

        this.dom.tutorialOverlay.classList.remove('hidden');
        this.dom.tutorialText.textContent = step.text;
    }

    update(dt) {
        const g = this.game;
        const d = this.dom;

        // Update HUD
        d.hudHp.textContent = g.castleHp;
        d.hudGold.textContent = g.gold;
        d.hudWave.textContent = `${Math.min(g.waves.length, g.currentWave + 1)}/${g.waves.length}`;

        // Hero HP & Ability cooldown rings (gated by unlocked region)
        const hRatio = Math.max(0, g.hero.hp / g.hero.maxHp);
        d.heroHpBar.style.width = `${Math.round(hRatio * 100)}%`;

        const reg = g.map.region || 1;
        d.btnAbilityBlizzard.style.display = 'flex';
        d.btnAbilityReinf.style.display = reg >= 2 ? 'flex' : 'none';
        d.btnAbilityBeacon.style.display = reg >= 3 ? 'flex' : 'none';

        this.updateAbilityButton(d.btnAbilityBlizzard, 'blizzard', 45, 18);
        if (reg >= 2) this.updateAbilityButton(d.btnAbilityReinf, 'reinforcements', 30, 15);
        if (reg >= 3) this.updateAbilityButton(d.btnAbilityBeacon, 'beacon', 60, 25);

        // Build button enabled state in build dock
        if (this.selectedPlotId !== null && this.previewTowerType) {
            const tDef = TOWERS[this.previewTowerType];
            d.btnConfirmBuild.disabled = g.gold < tDef.cost;
        }

        // Start Wave button state
        d.btnStartWave.disabled = g.waveState === 'spawning' || g.waveState === 'finished';
        if (g.waveState === 'active') {
            d.btnStartWave.textContent = '搶先開波 (+15G)';
        } else {
            d.btnStartWave.textContent = '開始波次';
        }

        // Tutorial highlight position and pulsating glow
        if (this.tutorialActive) {
            const cur = CANTONESE_TUTORIAL[this.tutorialStep];
            if (cur && (cur.target === 'plot_0' || cur.target === 'built_tower')) {
                const plot0 = g.map.plots[0];
                this.renderer.tutorialPointer = { x: plot0.x, y: plot0.y, radius: 45 };
            } else {
                this.renderer.tutorialPointer = null;
            }
            this.updateTutorialGlow(cur);
        } else {
            this.renderer.tutorialPointer = null;
            this.updateTutorialGlow(null);
        }
    }

    updateTutorialGlow(curStep) {
        const glowTargets = [
            this.dom.btnStartWave,
            this.dom.btnAbilityBlizzard,
            this.dom.btnSpeed
        ];
        glowTargets.forEach(el => el?.classList.remove('tutorial-target-glow'));

        if (!curStep) return;
        if (curStep.id === 'start_wave') {
            this.dom.btnStartWave?.classList.add('tutorial-target-glow');
        } else if (curStep.id === 'hero_ability') {
            this.dom.btnAbilityBlizzard?.classList.add('tutorial-target-glow');
        } else if (curStep.id === 'speed_pause') {
            this.dom.btnSpeed?.classList.add('tutorial-target-glow');
        }
    }

    updateAbilityButton(btn, abilityId, cost, maxCd) {
        const cd = this.game.hero.abilities[abilityId]?.cdRemaining || 0;
        const cdOverlay = btn.querySelector('.cd-overlay');
        const costBadge = btn.querySelector('.ability-cost');

        costBadge.textContent = `${cost}G`;
        if (cd > 0) {
            btn.classList.add('on-cd');
            const pct = Math.round((cd / maxCd) * 100);
            cdOverlay.style.height = `${pct}%`;
        } else {
            btn.classList.remove('on-cd');
            cdOverlay.style.height = '0%';
        }
        btn.disabled = cd > 0 || this.game.gold < cost;
    }

    showVictoryModal(stars) {
        this.completeTutorial();
        sounds.playVictory();
        this.updateNextWavePreview();
        const d = this.dom;
        d.modalVictory.classList.remove('hidden');

        const starsEl = document.getElementById('victory-stars');
        starsEl.innerHTML = '';
        for (let s = 1; s <= 3; s++) {
            const star = document.createElement('span');
            star.className = `star-icon ${s <= stars ? 'active' : ''}`;
            star.textContent = '★';
            starsEl.appendChild(star);
        }

        const quoteEl = document.getElementById('victory-quote');
        quoteEl.textContent = VICTORY_LINES[Math.floor(Math.random() * VICTORY_LINES.length)];

        saveStore.recordVictory(this.game.map.region, stars);
    }

    showDefeatModal() {
        sounds.playDefeat();
        const d = this.dom;
        d.modalDefeat.classList.remove('hidden');

        const quoteEl = document.getElementById('defeat-quote');
        quoteEl.textContent = DEFEAT_LINES[Math.floor(Math.random() * DEFEAT_LINES.length)];
    }
}
