// Canvas Renderer with Isometric Depth Sorting and Clay Styling
import { TOWERS, ENEMIES, HERO, PALETTE } from './data.js';

export class CanvasRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.images = {};
        this.loaded = false;
    }

    async preloadAssets(regionId = 1) {
        const imagePaths = [
            'assets/towers/plot.png',
        ];

        // All 5 maps preloaded for fast switching
        for (let m = 1; m <= 5; m++) {
            imagePaths.push(`assets/maps/map${m}.webp`);
        }

        // Hero 4-frame walk cycle
        for (let f = 0; f < 4; f++) {
            imagePaths.push(`assets/hero/hero_${f}.png`);
        }

        // All 7 regular enemies x 4 frames
        const enemyKeys = ['runner', 'armoured', 'tank', 'flyer', 'healer', 'swarm', 'fast'];
        for (const ek of enemyKeys) {
            for (let f = 0; f < 4; f++) {
                imagePaths.push(`assets/enemies/${ek}_${f}.png`);
            }
        }

        // All 5 bosses x 4 frames + static
        for (let b = 1; b <= 5; b++) {
            imagePaths.push(`assets/bosses/boss_${b}.png`);
            for (let f = 0; f < 4; f++) {
                imagePaths.push(`assets/bosses/boss_${b}_${f}.png`);
            }
        }

        // All 20 tower variations
        for (const tKey in TOWERS) {
            const tDef = TOWERS[tKey];
            for (const lvl in tDef.levels) {
                imagePaths.push(tDef.levels[lvl].sprite);
            }
        }

        const promises = imagePaths.map(src => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    this.images[src] = img;
                    resolve();
                };
                img.onerror = () => {
                    console.warn('Failed to load image:', src);
                    resolve(); // gracefully continue
                };
                img.src = src;
            });
        });

        await Promise.all(promises);
        this.loaded = true;
    }

    render(game, camera, uiState) {
        const ctx = this.ctx;
        const cvs = this.canvas;

        // Clear canvas with deep indigo
        ctx.fillStyle = PALETTE.deepIndigo;
        ctx.fillRect(0, 0, cvs.width, cvs.height);

        ctx.save();
        // Apply camera zoom and pan
        ctx.translate(camera.x, camera.y);
        ctx.scale(camera.zoom, camera.zoom);

        // 1. Draw Map Background
        const mapImg = this.images[`assets/maps/map${game.map.region || 1}.webp`];
        if (mapImg) {
            ctx.drawImage(mapImg, 0, 0, game.map.width, game.map.height);
        }

        // 1.5 Draw Spawn Portals & Animated Entry Chevrons
        const spawnPoints = [];
        if (game.map.paths && game.map.paths.length > 0) {
            for (const path of game.map.paths) {
                if (path.length >= 2) {
                    spawnPoints.push({
                        x: path[0].x,
                        y: path[0].y,
                        nextX: path[1].x,
                        nextY: path[1].y
                    });
                }
            }
        } else if (game.map.waypoints && game.map.waypoints.length >= 2) {
            spawnPoints.push({
                x: game.map.waypoints[0].x,
                y: game.map.waypoints[0].y,
                nextX: game.map.waypoints[1].x,
                nextY: game.map.waypoints[1].y
            });
        }

        const now = performance.now();
        const pulse = 0.88 + 0.12 * Math.sin(now * 0.005);
        const chevronOffset = (now * 0.025) % 22;

        for (const sp of spawnPoints) {
            ctx.save();
            ctx.translate(sp.x, sp.y);
            // Outer glowing runic portal
            ctx.fillStyle = 'rgba(226, 86, 58, 0.22)';
            ctx.strokeStyle = PALETTE.emberCoral;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.ellipse(0, 0, 34 * pulse, 20 * pulse, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Inner dashed saffron circle
            ctx.strokeStyle = PALETTE.saffron;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.ellipse(0, 0, 22 * pulse, 13 * pulse, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Directional marching chevron
            const dx = sp.nextX - sp.x;
            const dy = sp.nextY - sp.y;
            const angle = Math.atan2(dy, dx);
            ctx.rotate(angle);

            const cDist = 10 + chevronOffset;
            ctx.fillStyle = PALETTE.saffron;
            ctx.strokeStyle = PALETTE.deepIndigo;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cDist + 9, 0);
            ctx.lineTo(cDist - 3, -8);
            ctx.lineTo(cDist, 0);
            ctx.lineTo(cDist - 3, 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.restore();
        }

        // 2. Draw Plot Bases
        const plotImg = this.images['assets/towers/plot.png'];
        for (const plot of game.map.plots) {
            const isSelected = uiState.selectedPlotId === plot.id;
            const hasTower = game.towers.some(t => t.plotId === plot.id);

            if (!hasTower && plotImg) {
                // Plot base 128x128
                ctx.drawImage(plotImg, plot.x - 48, plot.y - 48, 96, 96);
            }

            // Highlight ring around selected plot
            if (isSelected) {
                ctx.save();
                ctx.strokeStyle = PALETTE.saffron;
                ctx.lineWidth = 3;
                ctx.setLineDash([6, 4]);
                ctx.beginPath();
                ctx.ellipse(plot.x, plot.y, 44, 28, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        }

        // 3. Draw Range Ring and Ghost Preview
        if (uiState.selectedPlotId !== null) {
            const plot = game.map.plots.find(p => p.id === uiState.selectedPlotId);
            const tower = game.towers.find(t => t.plotId === uiState.selectedPlotId);

            let range = 0;
            if (tower) {
                const tDef = TOWERS[tower.type];
                range = tDef.levels[tower.level].range * tower.buffRange;
            } else if (uiState.previewTowerType) {
                const tDef = TOWERS[uiState.previewTowerType];
                range = tDef.levels['1'].range;
            }

            if (plot && range > 0) {
                ctx.save();
                ctx.fillStyle = 'rgba(232, 176, 74, 0.12)';
                ctx.strokeStyle = PALETTE.saffron;
                ctx.lineWidth = 2;
                ctx.beginPath();
                // Range circle drawn as isometric ellipse (compressed vertically by ~0.7)
                ctx.ellipse(plot.x, plot.y, range, range * 0.72, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }

            // Ghost sprite
            if (!tower && uiState.previewTowerType && plot) {
                const tDef = TOWERS[uiState.previewTowerType];
                const ghostImg = this.images[tDef.levels['1'].sprite];
                if (ghostImg) {
                    ctx.save();
                    ctx.globalAlpha = 0.65;
                    ctx.drawImage(ghostImg, plot.x - 52, plot.y - 78, 104, 104);
                    ctx.restore();
                }
            }
        }

        // Hero ability target preview ring
        if (uiState.targetingAbility) {
            const abDef = HERO.abilities.find(a => a.id === uiState.targetingAbility);
            if (abDef && uiState.abilityTargetPos) {
                ctx.save();
                ctx.fillStyle = 'rgba(47, 143, 157, 0.22)';
                ctx.strokeStyle = PALETTE.glacierTeal;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.ellipse(uiState.abilityTargetPos.x, uiState.abilityTargetPos.y, abDef.radius, abDef.radius * 0.72, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
        }

        // 4. Collect all Depth-Sorted Entities (Y-sort)
        const renderList = [];

        // Towers
        for (const t of game.towers) {
            renderList.push({
                y: t.y,
                type: 'tower',
                data: t
            });
        }

        // Guards
        for (const g of game.guards) {
            renderList.push({
                y: g.y,
                type: 'guard',
                data: g
            });
        }

        // Hero
        renderList.push({
            y: game.hero.y,
            type: 'hero',
            data: game.hero
        });

        // Enemies
        for (const e of game.enemies) {
            renderList.push({
                y: e.y,
                type: 'enemy',
                data: e
            });
        }

        // Sort by Y ascending
        renderList.sort((a, b) => a.y - b.y);

        // Draw sorted entities
        for (const item of renderList) {
            if (item.type === 'tower') {
                this.drawTower(ctx, item.data);
            } else if (item.type === 'guard') {
                this.drawGuard(ctx, item.data);
            } else if (item.type === 'hero') {
                this.drawHero(ctx, item.data);
            } else if (item.type === 'enemy') {
                this.drawEnemy(ctx, item.data);
            }
        }

        // 5. Draw Projectiles
        this.drawProjectiles(ctx, game.projectiles);

        // 6. Draw AoE effects (Blizzard vortex, Bell shockwave)
        this.drawAoEs(ctx, game.areasOfEffect);

        // 7. Draw Particles
        for (const p of game.particles) {
            ctx.save();
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
            ctx.restore();
        }

        // 8. Draw Floating Texts
        for (const ft of game.floatingTexts) {
            ctx.save();
            ctx.font = 'bold 16px "PingFang TC", "Noto Sans TC", sans-serif';
            ctx.fillStyle = ft.color;
            ctx.strokeStyle = PALETTE.ink;
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';
            ctx.globalAlpha = ft.life / ft.maxLife;
            ctx.strokeText(ft.text, ft.x, ft.y);
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }

        // 9. Draw Tutorial Guide Ring
        if (uiState.tutorialPointer) {
            const tp = uiState.tutorialPointer;
            ctx.save();
            ctx.strokeStyle = PALETTE.saffron;
            ctx.lineWidth = 3.5;
            const pulse = (Math.sin(performance.now() * 0.006) + 1) * 0.5;
            const r = tp.radius + pulse * 8;
            ctx.beginPath();
            ctx.ellipse(tp.x, tp.y, r, r * 0.75, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Saffron pointer dot
            ctx.fillStyle = PALETTE.saffron;
            ctx.beginPath();
            ctx.arc(tp.x, tp.y - r * 0.75 - 12, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.restore();
    }

    drawTower(ctx, t) {
        const tDef = TOWERS[t.type];
        const lvlDef = tDef.levels[t.level];
        const img = this.images[lvlDef.sprite];

        // Soft ground contact shadow for the tower base
        ctx.save();
        ctx.fillStyle = 'rgba(20, 24, 58, 0.45)';
        ctx.beginPath();
        ctx.ellipse(t.x, t.y + 6, 38, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (img) {
            // Sprites are 160x160, anchored near base center
            ctx.drawImage(img, t.x - 52, t.y - 78, 104, 104);
        }

        // High-contrast, beautifully legible level crest badge on the base
        ctx.save();
        const isMax = t.level === '3a' || t.level === '3b';
        const isLvl2 = t.level === '2';
        const lvlStr = t.level === '3a' ? '★3A' : t.level === '3b' ? '★3B' : `★${t.level}`;

        const bw = isMax ? 36 : 28;
        const bh = 17;
        const bx = t.x - bw / 2;
        const by = t.y + 4;

        ctx.fillStyle = isMax ? PALETTE.saffron : (isLvl2 ? '#8E9AAF' : '#5C4033');
        ctx.strokeStyle = isMax ? PALETTE.deepIndigo : '#2B2D42';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isMax ? PALETTE.deepIndigo : PALETTE.ivory;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(lvlStr, t.x, by + bh / 2 + 1);
        ctx.restore();
    }

    drawEnemy(ctx, e) {
        const frames = e.tpl.spriteWalk || [e.tpl.sprite];
        const frameIdx = Math.floor(e.animFrame) % frames.length;
        const spriteSrc = frames[frameIdx] || e.tpl.sprite;
        const img = this.images[spriteSrc] || this.images[e.tpl.sprite];

        const isBoss = e.type.startsWith('boss_');

        // Draw contact shadow on ground for all enemies
        ctx.save();
        ctx.fillStyle = e.isAir ? 'rgba(20, 24, 58, 0.35)' : 'rgba(20, 24, 58, 0.5)';
        ctx.beginPath();
        const shadowRx = e.size * (e.isAir ? 1.0 : 0.85);
        const shadowRy = e.size * (e.isAir ? 0.45 : 0.4);
        const shadowY = e.isAir ? e.y + 6 : e.y + 2;
        ctx.ellipse(e.x, shadowY, shadowRx, shadowRy, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        const sz = e.size * 3.6;
        const drawY = e.isAir ? e.y - sz - 15 : e.y - sz + 12;

        if (img) {
            ctx.save();
            if (e.facingLeft) {
                ctx.translate(e.x, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(img, -sz / 2, drawY, sz, sz);
            } else {
                ctx.drawImage(img, e.x - sz / 2, drawY, sz, sz);
            }
            ctx.restore();
        }

        // Healer green pulse aura
        if (e.tpl.healRadius) {
            ctx.save();
            ctx.strokeStyle = 'rgba(47, 143, 157, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(e.x, e.y, e.tpl.healRadius, e.tpl.healRadius * 0.7, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Status effects: Ice blue tint if frozen/slowed
        if (e.freezeTimer > 0) {
            ctx.save();
            ctx.strokeStyle = PALETTE.ice;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.ellipse(e.x, drawY + sz * 0.5, sz * 0.45, sz * 0.55, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Health Bar
        const barW = isBoss ? Math.max(54, e.size * 2.2) : Math.max(34, e.size * 1.5);
        const barH = isBoss ? 6 : 4;
        const barX = e.x - barW / 2;
        const barY = drawY - 8;
        const hpRatio = Math.max(0, e.hp / e.maxHp);

        ctx.save();
        ctx.fillStyle = PALETTE.deepIndigo;
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
        ctx.fillStyle = isBoss ? PALETTE.saffron : (hpRatio > 0.4 ? PALETTE.emberCoral : PALETTE.emberDark);
        ctx.fillRect(barX, barY, barW * hpRatio, barH);

        if (isBoss) {
            ctx.font = 'bold 12px "PingFang TC", sans-serif';
            ctx.fillStyle = PALETTE.saffron;
            ctx.textAlign = 'center';
            ctx.fillText(`【首領】${e.tpl.name}`, e.x, barY - 5);
        }
        ctx.restore();
    }

    drawGuard(ctx, g) {
        // Guard miniature
        ctx.save();
        // Shadow
        ctx.fillStyle = 'rgba(20, 24, 58, 0.4)';
        ctx.beginPath();
        ctx.ellipse(g.x, g.y + 2, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mini armored warden guard body
        ctx.fillStyle = g.isHeroSummon ? PALETTE.saffron : PALETTE.slateBlue;
        ctx.fillRect(g.x - 5, g.y - 16, 10, 14);
        ctx.fillStyle = PALETTE.stone;
        ctx.fillRect(g.x - 4, g.y - 21, 8, 6); // helmet

        // Health bar
        const hpRatio = Math.max(0, g.hp / g.maxHp);
        ctx.fillStyle = PALETTE.deepIndigo;
        ctx.fillRect(g.x - 10, g.y - 26, 20, 3);
        ctx.fillStyle = PALETTE.glacierTeal;
        ctx.fillRect(g.x - 9, g.y - 25, 18 * hpRatio, 1.8);
        ctx.restore();
    }

    drawHero(ctx, h) {
        const frame = Math.floor(performance.now() * 0.005) % 4;
        const spriteSrc = `assets/hero/hero_${frame}.png`;
        const img = this.images[spriteSrc] || this.images['assets/hero/hero_0.png'];

        // Glowing heroic aura ring under hero feet
        ctx.save();
        ctx.fillStyle = 'rgba(47, 143, 157, 0.28)';
        ctx.strokeStyle = PALETTE.saffron;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(h.x, h.y + 2, 28, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        if (img) {
            ctx.save();
            const hsz = 110;
            if (h.facingLeft) {
                ctx.translate(h.x, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(img, -hsz / 2, h.y - hsz + 15, hsz, hsz);
            } else {
                ctx.drawImage(img, h.x - hsz / 2, h.y - hsz + 15, hsz, hsz);
            }
            ctx.restore();
        }

        // Health bar + Erika label
        const barW = 38;
        const barH = 5;
        const barX = h.x - barW / 2;
        const barY = h.y - 100;
        const hpRatio = Math.max(0, h.hp / h.maxHp);

        ctx.save();
        ctx.fillStyle = PALETTE.deepIndigo;
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
        ctx.fillStyle = PALETTE.glacierTeal;
        ctx.fillRect(barX, barY, barW * hpRatio, barH);

        // Hero name tag
        ctx.font = 'bold 11px "PingFang TC", sans-serif';
        ctx.fillStyle = PALETTE.saffron;
        ctx.textAlign = 'center';
        ctx.fillText(HERO.name, h.x, barY - 4);
        ctx.restore();
    }

    drawProjectiles(ctx, projectiles) {
        for (const p of projectiles) {
            if (p.delay && p.delay > 0) continue;

            if (p.type === 'bolt') {
                ctx.save();
                ctx.fillStyle = PALETTE.glacierTeal;
                ctx.strokeStyle = PALETTE.ivory;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            } else if (p.type === 'mortar_stone') {
                // Parabolic arc height
                const arcHeight = Math.sin(p.progress * Math.PI) * 75;
                const visualY = p.y - arcHeight;

                // Shadow on ground
                ctx.save();
                ctx.fillStyle = 'rgba(20, 24, 58, 0.35)';
                ctx.beginPath();
                ctx.ellipse(p.x, p.y, 8, 4, 0, 0, Math.PI * 2);
                ctx.fill();

                // Flying basalt boulder
                ctx.fillStyle = PALETTE.stone;
                ctx.beginPath();
                ctx.arc(p.x, visualY, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } else if (p.type === 'frost_shard') {
                ctx.save();
                ctx.fillStyle = PALETTE.ice;
                ctx.strokeStyle = PALETTE.glacierTeal;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    drawAoEs(ctx, aoes) {
        for (const aoe of aoes) {
            const alpha = aoe.timer / aoe.duration;
            if (aoe.type === 'blizzard') {
                ctx.save();
                ctx.fillStyle = `rgba(47, 143, 157, ${alpha * 0.28})`;
                ctx.strokeStyle = PALETTE.glacierTeal;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(aoe.x, aoe.y, aoe.radius, aoe.radius * 0.72, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Swirling ice snow crystals
                for (let k = 0; k < 6; k++) {
                    const ang = performance.now() * 0.003 + (k * Math.PI / 3);
                    const rx = aoe.x + Math.cos(ang) * (aoe.radius * 0.65);
                    const ry = aoe.y + Math.sin(ang) * (aoe.radius * 0.45);
                    ctx.fillStyle = PALETTE.ice;
                    ctx.fillRect(rx - 2, ry - 2, 4, 4);
                }
                ctx.restore();
            } else if (aoe.type === 'bell_pulse') {
                ctx.save();
                const curR = aoe.radius * (1.0 - alpha);
                ctx.strokeStyle = PALETTE.saffron;
                ctx.lineWidth = 3;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.ellipse(aoe.x, aoe.y, curR, curR * 0.72, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            } else if (aoe.type === 'beacon_strike') {
                ctx.save();
                ctx.fillStyle = `rgba(221, 235, 242, ${alpha * 0.5})`;
                ctx.strokeStyle = PALETTE.saffron;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.ellipse(aoe.x, aoe.y, aoe.radius * (1.1 - alpha*0.1), aoe.radius * 0.72, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            } else if (aoe.type === 'mortar_crater') {
                ctx.save();
                ctx.fillStyle = `rgba(226, 86, 58, ${alpha * 0.4})`;
                ctx.beginPath();
                ctx.ellipse(aoe.x, aoe.y, aoe.radius, aoe.radius * 0.7, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
    }
}
