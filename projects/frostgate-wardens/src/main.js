// Main Application Entry Point with Multi-Region and Endless Support
import { GameEngine } from './game.js';
import { Camera } from './camera.js';
import { CanvasRenderer } from './renderer.js';
import { UIController } from './ui.js';
import { getRegionWaves } from './data.js';
import { saveStore } from './save.js';
import { sounds } from './audio.js';

let activeGame = null;
let activeUI = null;
let renderer = null;
let camera = null;

async function bootstrap() {
    const canvas = document.getElementById('game-canvas');
    const loadingScreen = document.getElementById('loading-screen');
    const titleScreen = document.getElementById('title-screen');

    // Setup Canvas Resolution (DPR <= 2 per SPEC)
    const resizeCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
        if (camera) {
            camera.setViewport(rect.width, rect.height);
        }
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    renderer = new CanvasRenderer(canvas);
    await renderer.preloadAssets(1);

    // Hide loader
    loadingScreen.classList.add('hidden');

    // Update Region Cards from Save Store
    updateRegionCardsUI();

    const startRegion = async (regionId, isEndless = false) => {
        if (activeUI) {
            activeUI.destroy();
            activeUI = null;
        }

        titleScreen.classList.add('hidden');
        sounds.unlock();

        // Fetch Region Map JSON
        const mapResp = await fetch(`assets/maps/map${regionId}.json`);
        const mapData = await mapResp.json();

        const rect = canvas.getBoundingClientRect();
        camera = new Camera(rect.width, rect.height, mapData.width, mapData.height);
        camera.frameBounds(mapData, 16, false);
        window.camera = camera;

        let waves = isEndless ? generateEndlessWaves() : getRegionWaves(regionId);

        activeGame = new GameEngine(mapData, waves);
        activeGame.isEndless = isEndless;
        activeGame.region = regionId;

        activeUI = new UIController(activeGame, camera, renderer);
        window.game = activeGame;
        window.ui = activeUI;

        // Victory & Defeat handlers
        activeGame.onVictory = (stars) => {
            saveStore.recordVictory(regionId, stars);
            activeUI.showVictoryModal(stars);
            updateRegionCardsUI();
        };

        activeGame.onGameOver = () => {
            if (isEndless) {
                saveStore.recordEndlessWave(activeGame.currentWave + 1);
            }
            activeUI.showDefeatModal();
        };

        activeUI.updateNextWavePreview();
        if (regionId === 1 && !saveStore.data.tutorialCompleted) {
            activeUI.showCurrentTutorialStep();
        } else {
            activeUI.completeTutorial();
        }
    };

    // Bind Region card clicks
    for (let r = 1; r <= 5; r++) {
        const card = document.querySelector(`.region-card[data-region="${r}"]`);
        if (card) {
            card.addEventListener('click', () => {
                if (saveStore.isRegionUnlocked(r)) {
                    startRegion(r, false);
                }
            });
        }
    }

    // Endless Mode: Open Map Picker
    const regionNames = {
        1: '第 1 區域：霜門山道',
        2: '第 2 區域：凍湖冰橋',
        3: '第 3 區域：冷杉林道',
        4: '第 4 區域：焰口邊境',
        5: '第 5 區域：北辰堡'
    };

    document.getElementById('btn-endless-mode').addEventListener('click', () => {
        const picker = document.getElementById('modal-endless-picker');
        const list = document.getElementById('endless-map-list');
        list.innerHTML = '';
        for (let r = 1; r <= 5; r++) {
            if (saveStore.isRegionUnlocked(r)) {
                const btn = document.createElement('button');
                btn.className = 'btn-action btn-saffron';
                btn.textContent = `${regionNames[r]} · 無盡防守`;
                btn.style.minHeight = '44px';
                btn.style.fontSize = '14px';
                btn.addEventListener('click', () => {
                    picker.classList.add('hidden');
                    startRegion(r, true);
                });
                list.appendChild(btn);
            }
        }
        picker.classList.remove('hidden');
    });

    document.getElementById('btn-close-endless-picker').addEventListener('click', () => {
        document.getElementById('modal-endless-picker').classList.add('hidden');
    });

    // Credits modal
    document.getElementById('btn-open-credits').addEventListener('click', () => {
        document.getElementById('modal-credits').classList.remove('hidden');
    });
    document.getElementById('btn-close-credits').addEventListener('click', () => {
        document.getElementById('modal-credits').classList.add('hidden');
    });

    // In-game modal buttons
    document.getElementById('btn-restart').addEventListener('click', () => {
        if (activeGame) {
            const reg = activeGame.map.region || 1;
            const isEnd = !!activeGame.isEndless;
            document.getElementById('modal-pause').classList.add('hidden');
            sounds.resume();
            startRegion(reg, isEnd);
        }
    });

    document.getElementById('btn-quit-map').addEventListener('click', () => {
        returnToTitleScreen();
    });
    document.getElementById('btn-defeat-quit').addEventListener('click', () => {
        returnToTitleScreen();
    });
    document.getElementById('btn-defeat-retry').addEventListener('click', () => {
        if (activeGame) {
            const reg = activeGame.map.region || 1;
            const isEnd = !!activeGame.isEndless;
            document.getElementById('modal-defeat').classList.add('hidden');
            startRegion(reg, isEnd);
        }
    });
    document.getElementById('btn-victory-replay').addEventListener('click', () => {
        if (activeGame) {
            const reg = activeGame.map.region || 1;
            const isEnd = !!activeGame.isEndless;
            document.getElementById('modal-victory').classList.add('hidden');
            startRegion(reg, isEnd);
        }
    });
    document.getElementById('btn-next-level').addEventListener('click', () => {
        const curR = activeGame ? activeGame.map.region : 1;
        document.getElementById('modal-victory').classList.add('hidden');
        if (curR < 5) {
            startRegion(curR + 1, false);
        } else {
            returnToTitleScreen();
        }
    });

    function returnToTitleScreen() {
        if (activeUI) {
            activeUI.destroy();
            activeUI = null;
        }
        sounds.resume();
        document.getElementById('modal-pause').classList.add('hidden');
        document.getElementById('modal-victory').classList.add('hidden');
        document.getElementById('modal-defeat').classList.add('hidden');
        titleScreen.classList.remove('hidden');
        const app = document.getElementById('app-container');
        if (app) app.scrollLeft = 0;
        window.scrollTo(0, 0);
        updateRegionCardsUI();
        activeGame = null;
    }

    window.startRegion = startRegion;
    window.returnToTitleScreen = returnToTitleScreen;
    window.updateRegionCardsUI = updateRegionCardsUI;

    // Game Loop
    let lastTime = performance.now();
    function gameLoop(now) {
        const dt = (now - lastTime) / 1000.0;
        lastTime = now;

        if (camera) camera.update(dt);

        if (activeGame && activeUI && camera) {
            activeGame.update(dt);
            activeUI.update(dt);

            const dpr = Math.min(2, window.devicePixelRatio || 1);
            renderer.ctx.save();
            renderer.ctx.scale(dpr, dpr);
            renderer.render(activeGame, camera, {
                selectedPlotId: activeUI.selectedPlotId,
                previewTowerType: activeUI.previewTowerType,
                targetingAbility: activeUI.targetingAbility,
                abilityTargetPos: activeUI.abilityTargetPos,
                tutorialPointer: renderer.tutorialPointer
            });
            renderer.ctx.restore();
        }

        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);
}

function updateRegionCardsUI() {
    for (let r = 1; r <= 5; r++) {
        const card = document.querySelector(`.region-card[data-region="${r}"]`);
        if (!card) continue;

        const isUnlocked = saveStore.isRegionUnlocked(r);
        const stars = saveStore.getStars(r);

        card.classList.toggle('locked', !isUnlocked);
        const starEl = card.querySelector('.region-stars');
        if (starEl) {
            if (isUnlocked) {
                let starStr = '';
                for (let s = 1; s <= 3; s++) starStr += (s <= stars ? '★' : '☆');
                starEl.textContent = starStr;
            } else {
                starEl.innerHTML = '<span class="locked-badge"><img src="assets/ui/icon_lock.png" width="22" height="22" alt="未解鎖" style="vertical-align:middle; display:inline-block; margin-right:3px;">未解鎖</span>';
            }
        }
    }

    const endlessBtn = document.getElementById('btn-endless-mode');
    if (endlessBtn) {
        if (saveStore.data.bestEndlessWave > 0) {
            endlessBtn.textContent = `無盡防守 (最佳: 第${saveStore.data.bestEndlessWave}波)`;
        } else {
            endlessBtn.textContent = '無盡防守';
        }
    }
}

function seededRandom(seed) {
    let s = Math.abs(seed) % 2147483647;
    if (s <= 0) s = 1;
    return function() {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

function generateEndlessWaves() {
    const waves = [];
    const pool = ['runner', 'armoured', 'tank', 'flyer', 'healer', 'swarm', 'fast'];
    const bossPool = ['boss_1', 'boss_2', 'boss_3', 'boss_4', 'boss_5'];

    for (let w = 1; w <= 60; w++) {
        const rng = seededRandom(w * 7919 + 1337);
        const isBossWave = (w % 5 === 0);
        const spawns = [];

        // Mix 2-4 enemy types picked with seeded randomness
        const typeCount = Math.min(pool.length, 2 + Math.floor(w / 6));
        const availablePool = [...pool].sort(() => rng() - 0.5);
        for (let i = 0; i < typeCount; i++) {
            const t = availablePool[i];
            const baseCount = 5 + Math.floor(w * 1.4);
            const count = t === 'swarm' ? baseCount * 2 : (t === 'tank' ? Math.max(2, Math.floor(baseCount * 0.35)) : baseCount);
            spawns.push({
                type: t,
                count: count,
                interval: Math.max(0.4, 1.4 - w * 0.015),
                delay: i * 2.5
            });
        }

        if (isBossWave) {
            const bossIdx = Math.floor(rng() * Math.min(bossPool.length, 1 + Math.floor(w / 8)));
            const b = bossPool[bossIdx];
            spawns.push({
                type: b,
                count: 1,
                interval: 1.0,
                delay: 6.0
            });
        }

        waves.push({
            intro: isBossWave ? `【無盡頭目波次】第 ${w} 波！` : `無盡第 ${w} 波攻勢`,
            spawns: spawns
        });
    }
    return waves;
}

window.addEventListener('DOMContentLoaded', bootstrap);
