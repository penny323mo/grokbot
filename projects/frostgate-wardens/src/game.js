// Frostgate Wardens Core Gameplay Engine
import { TOWERS, ENEMIES, HERO } from './data.js';
import { sounds } from './audio.js';

export class GameEngine {
    constructor(mapData, wavesData) {
        this.map = mapData;
        this.waves = wavesData;
        this.scale = (this.map && this.map.width) ? (this.map.width / 1024.0) : 1.0;

        this.castleHp = 20;
        this.maxCastleHp = 20;
        this.gold = 350;
        this.currentWave = 0; // 0-indexed
        this.waveState = 'waiting'; // 'waiting', 'spawning', 'active', 'finished'
        this.speed = 1;
        this.paused = false;

        this.towers = []; // { id, plotId, type, level, x, y, cooldown, target, buffDmg, buffRate }
        this.enemies = []; // { id, type, x, y, hp, maxHp, wpIdx, dist, slowTimer, slowFactor, freezeTimer, stunTimer, ... }
        this.guards = []; // { id, towerId, x, y, hp, maxHp, atk, target, respawnTimer, isHeroSummon }
        this.projectiles = []; // { type, x, y, tx, ty, target, speed, damage, splash, ... }
        this.particles = []; // { x, y, vx, vy, life, maxLife, color, size }
        this.floatingTexts = []; // { x, y, text, color, life, maxLife }
        this.areasOfEffect = []; // { type, x, y, radius, duration, timer, dps, ... }

        // Hero entity
        const startWp = this.map.waypoints[3] || this.map.waypoints[0];
        this.hero = {
            name: HERO.name,
            x: startWp.x,
            y: startWp.y,
            targetX: startWp.x,
            targetY: startWp.y,
            hp: HERO.hp,
            maxHp: HERO.hp,
            atk: HERO.atk,
            speed: HERO.speed * this.scale,
            attackRate: HERO.attackRate,
            cooldown: 0,
            target: null,
            abilities: {
                blizzard: { cdRemaining: 0 },
                reinforcements: { cdRemaining: 0 },
                beacon: { cdRemaining: 0 }
            }
        };

        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.nextEnemyId = 1;
        this.nextTowerId = 1;

        this.onGameOver = null;
        this.onVictory = null;
        this.onWaveComplete = null;
    }

    startWave() {
        if (this.waveState !== 'waiting' && this.waveState !== 'active') return;

        if (this.waveState === 'active') {
            // Early call bonus: check if there is a next wave to call!
            if (this.currentWave + 1 >= this.waves.length) return;

            this.currentWave++;
            const earlyBonus = 15;
            this.gold += earlyBonus;
            sounds.playCoin();
            this.addFloatingText(this.map.spawn_pos.x, this.map.spawn_pos.y - 40, `搶先開波 +${earlyBonus}G`, '#E8B04A');

            const nextWaveDef = this.waves[this.currentWave];
            for (const item of nextWaveDef.spawns) {
                const startDelay = item.delay || 0;
                for (let i = 0; i < item.count; i++) {
                    this.spawnQueue.push({
                        time: this.spawnTimer + startDelay + i * item.interval,
                        type: item.type
                    });
                }
            }
            this.spawnQueue.sort((a, b) => a.time - b.time);
            this.waveState = 'spawning';
            if (this.onEarlyCall) this.onEarlyCall(this.currentWave);
            return;
        }

        if (this.currentWave >= this.waves.length) return;

        const waveDef = this.waves[this.currentWave];
        this.spawnQueue = [];

        // Build spawn schedule
        for (const item of waveDef.spawns) {
            const startDelay = item.delay || 0;
            for (let i = 0; i < item.count; i++) {
                this.spawnQueue.push({
                    time: startDelay + i * item.interval,
                    type: item.type
                });
            }
        }
        // Sort by time
        this.spawnQueue.sort((a, b) => a.time - b.time);

        this.spawnTimer = 0;
        this.waveState = 'spawning';
    }

    update(dtRaw) {
        if (this.paused) return;
        const dt = Math.min(0.1, dtRaw) * this.speed;

        // 1. Spawning
        if (this.waveState === 'spawning') {
            this.spawnTimer += dt;
            while (this.spawnQueue.length > 0 && this.spawnTimer >= this.spawnQueue[0].time) {
                const item = this.spawnQueue.shift();
                this.spawnEnemy(item.type);
            }
            if (this.spawnQueue.length === 0) {
                this.waveState = 'active';
            }
        }

        // 2. Wave Completion check
        if (this.waveState === 'active' && this.enemies.length === 0 && this.spawnQueue.length === 0) {
            this.currentWave++;
            sounds.playCoin();
            this.gold += 30; // End-of-wave completion bounty
            this.addFloatingText(this.map.castle_pos.x, this.map.castle_pos.y + 30, `波次完成 +30G`, '#E8B04A');

            if (this.currentWave >= this.waves.length) {
                this.waveState = 'finished';
                if (this.onVictory) this.onVictory(this.calculateStars());
            } else {
                this.waveState = 'waiting';
                if (this.onWaveComplete) this.onWaveComplete(this.currentWave);
            }
        }

        // 3. Bell Tower Buffs update
        this.updateTowerBuffs();

        // 4. Update Towers & Attacks
        this.updateTowers(dt);

        // 5. Update Enemies
        this.updateEnemies(dt);

        // 6. Update Guards & Hero
        this.updateGuards(dt);
        this.updateHero(dt);

        // 7. Update Projectiles
        this.updateProjectiles(dt);

        // 8. Update Areas of Effect
        this.updateAoEs(dt);

        // 9. Update Particles & Text
        this.updateParticles(dt);
    }

    spawnEnemy(typeKey) {
        const tpl = ENEMIES[typeKey];
        if (!tpl) return;

        let path = this.map.waypoints;
        let pathIdx = 0;
        if (this.map.paths && this.map.paths.length > 1) {
            pathIdx = (this.spawnCount || 0) % this.map.paths.length;
            this.spawnCount = (this.spawnCount || 0) + 1;
            path = this.map.paths[pathIdx];
        }

        const wp0 = path[0];
        const enemy = {
            id: this.nextEnemyId++,
            type: typeKey,
            tpl: tpl,
            path: path,
            pathIdx: pathIdx,
            x: wp0.x,
            y: wp0.y,
            hp: tpl.hp,
            maxHp: tpl.hp,
            speed: tpl.speed * this.scale,
            armor: tpl.armor,
            isAir: tpl.isAir,
            gold: tpl.gold,
            size: tpl.size * this.scale,
            wpIdx: 0,
            distTravelled: 0,
            slowTimer: 0,
            slowFactor: 0,
            freezeTimer: 0,
            stunTimer: 0,
            bleedTimer: 0,
            bleedDps: 0,
            engagedBy: null, // Guard or Hero blocking them
            animFrame: 0,
            animTimer: 0,
            facingLeft: false
        };
        this.enemies.push(enemy);
    }

    updateTowerBuffs() {
        // Reset buffs on towers
        for (const t of this.towers) {
            t.buffDmg = 1.0;
            t.buffRate = 1.0;
            t.buffRange = 1.0;
        }

        // Apply Bell Tower buffs
        for (const bell of this.towers) {
            if (bell.type !== 'bell') continue;
            const lvlDef = TOWERS.bell.levels[bell.level];
            const range = lvlDef.range * this.scale;

            for (const t of this.towers) {
                if (t === bell || t.type === 'bell') continue;
                const d = Math.hypot(t.x - bell.x, t.y - bell.y);
                if (d <= range) {
                    t.buffDmg += (lvlDef.buffDamage || 0);
                    t.buffRate += (lvlDef.buffRate || 0);
                    t.buffRange += (lvlDef.buffRange || 0);
                }
            }
        }
    }

    updateTowers(dt) {
        for (const t of this.towers) {
            const tDef = TOWERS[t.type];
            const lDef = tDef.levels[t.level];

            t.cooldown -= dt * t.buffRate;

            // Bell periodic stun pulse
            if (t.type === 'bell') {
                if (t.cooldown <= 0) {
                    t.cooldown = lDef.stunInterval;
                    sounds.playBell();
                    // Pulse AoE stun
                    this.areasOfEffect.push({
                        type: 'bell_pulse',
                        x: t.x,
                        y: t.y,
                        radius: lDef.range * this.scale,
                        maxRadius: lDef.range * this.scale,
                        duration: 0.6,
                        timer: 0.6
                    });
                    for (const e of this.enemies) {
                        const d = Math.hypot(e.x - t.x, e.y - t.y);
                        if (d <= lDef.range * this.scale) {
                            e.stunTimer = Math.max(e.stunTimer, lDef.stunDuration);
                            if (lDef.shockDmg) {
                                this.damageEnemy(e, lDef.shockDmg, false);
                            }
                        }
                    }
                }
                continue;
            }

            // Guard Post: manages guard units
            if (t.type === 'guard') {
                // Check if guards need respawn
                const aliveGuards = this.guards.filter(g => g.towerId === t.id && g.hp > 0);
                if (aliveGuards.length < lDef.guardCount) {
                    t.respawnTimer = (t.respawnTimer || 0) + dt;
                    if (t.respawnTimer >= lDef.respawnTime) {
                        t.respawnTimer = 0;
                        // Spawn guard near rally point
                        const rally = t.rallyPoint || this.getNearestRoadPoint(t.x, t.y);
                        this.guards.push({
                            id: Math.random(),
                            towerId: t.id,
                            x: t.x,
                            y: t.y,
                            rallyX: rally.x + (Math.random() - 0.5) * 30 * this.scale,
                            rallyY: rally.y + (Math.random() - 0.5) * 30 * this.scale,
                            hp: lDef.guardHp,
                            maxHp: lDef.guardHp,
                            atk: lDef.guardAtk,
                            blockDmg: lDef.blockDamage || 0,
                            bleed: lDef.bleed || 0,
                            cooldown: 0,
                            target: null
                        });
                    }
                } else {
                    t.respawnTimer = 0;
                }
                continue;
            }

            // Offensive towers: Crossbow, Mortar, Frost
            if (t.cooldown > 0) continue;

            const effRange = lDef.range * this.scale * t.buffRange;
            const target = this.findTarget(t.x, t.y, effRange, tDef.targetsAir, tDef.targetsGround);
            if (!target) continue;

            t.cooldown = lDef.rate;

            if (t.type === 'crossbow') {
                sounds.playBow();
                const burst = lDef.burst || 1;
                for (let b = 0; b < burst; b++) {
                    this.projectiles.push({
                        type: 'bolt',
                        x: t.x,
                        y: t.y - 20 * this.scale,
                        tx: target.x,
                        ty: target.y,
                        target: target,
                        speed: 700 * this.scale,
                        damage: lDef.damage * t.buffDmg,
                        pierceArmor: lDef.pierceArmor || 0,
                        delay: b * 0.12
                    });
                }
            } else if (t.type === 'mortar') {
                sounds.playMortar();
                this.projectiles.push({
                    type: 'mortar_stone',
                    x: t.x,
                    y: t.y - 15 * this.scale,
                    tx: target.x,
                    ty: target.y,
                    startX: t.x,
                    startY: t.y - 15 * this.scale,
                    target: target,
                    speed: 350 * this.scale,
                    progress: 0,
                    totalDist: Math.hypot(target.x - t.x, target.y - t.y),
                    damage: lDef.damage * t.buffDmg,
                    splash: (lDef.splash || 0) * this.scale,
                    stun: lDef.stun || 0,
                    clusterCount: lDef.clusterCount || 0,
                    clusterDmg: lDef.clusterDmg || 0
                });
            } else if (t.type === 'frost') {
                sounds.playFrost();
                this.projectiles.push({
                    type: 'frost_shard',
                    x: t.x,
                    y: t.y - 30 * this.scale,
                    target: target,
                    speed: 550 * this.scale,
                    damage: lDef.damage * t.buffDmg,
                    slow: lDef.slow,
                    slowDuration: lDef.slowDuration,
                    chain: lDef.chain || 0,
                    freezeChance: lDef.freezeChance || 0
                });
            }
        }
    }

    findTarget(x, y, range, canAir, canGround) {
        let best = null;
        let maxDist = -1;

        for (const e of this.enemies) {
            if (e.hp <= 0) continue;
            if (e.isAir && !canAir) continue;
            if (!e.isAir && !canGround) continue;

            const d = Math.hypot(e.x - x, e.y - y);
            if (d <= range) {
                // Target furthest along path
                if (e.distTravelled > maxDist) {
                    maxDist = e.distTravelled;
                    best = e;
                }
            }
        }
        return best;
    }

    updateEnemies(dt) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            const waypoints = e.path || this.map.waypoints;

            // Timers
            if (e.freezeTimer > 0) {
                e.freezeTimer -= dt;
                continue; // Can't move while frozen
            }
            if (e.stunTimer > 0) {
                e.stunTimer -= dt;
                continue;
            }
            if (e.slowTimer > 0) {
                e.slowTimer -= dt;
                if (e.slowTimer <= 0) e.slowFactor = 0;
            }
            if (e.bleedTimer > 0) {
                e.bleedTimer -= dt;
                this.damageEnemy(e, e.bleedDps * dt, false);
                if (e.hp <= 0) continue;
            }

            // Healer aura logic
            if (e.tpl.healRadius && e.hp > 0) {
                for (const other of this.enemies) {
                    if (other === e || other.hp <= 0 || other.hp >= other.maxHp) continue;
                    if (Math.hypot(other.x - e.x, other.y - e.y) <= e.tpl.healRadius * this.scale) {
                        other.hp = Math.min(other.maxHp, other.hp + (e.tpl.healDps || 20) * dt);
                    }
                }
            }

            // If engaged in melee with guard or hero, stop moving along path
            if (e.engagedBy && e.engagedBy.hp > 0) {
                // Battle anim
                e.animTimer += dt * 3;
                e.animFrame = Math.floor(e.animTimer) % 2;
                continue;
            } else {
                e.engagedBy = null;
            }

            // Path movement
            let curSpeed = e.speed * (1.0 - e.slowFactor);
            let moveDist = curSpeed * dt;

            e.animTimer += dt * (curSpeed / (18 * this.scale));
            const walkLen = (e.tpl.spriteWalk && e.tpl.spriteWalk.length) || 4;
            e.animFrame = Math.floor(e.animTimer) % walkLen;

            while (moveDist > 0 && e.wpIdx < waypoints.length - 1) {
                const targetWp = waypoints[e.wpIdx + 1];
                const dx = targetWp.x - e.x;
                const dy = targetWp.y - e.y;
                if (dx < -0.1) e.facingLeft = true;
                else if (dx > 0.1) e.facingLeft = false;

                const distToWp = Math.hypot(dx, dy);

                if (moveDist >= distToWp) {
                    e.x = targetWp.x;
                    e.y = targetWp.y;
                    moveDist -= distToWp;
                    e.distTravelled += distToWp;
                    e.wpIdx++;
                } else {
                    const ratio = moveDist / distToWp;
                    e.x += dx * ratio;
                    e.y += dy * ratio;
                    e.distTravelled += moveDist;
                    moveDist = 0;
                }
            }

            // Reached Castle Goal!
            if (e.wpIdx >= waypoints.length - 1) {
                const leakDmg = e.tpl?.leakDamage || (e.type.startsWith('boss_') ? 6 : 1);
                this.castleHp = Math.max(0, this.castleHp - leakDmg);
                this.enemies.splice(i, 1);
                this.addFloatingText(this.map.castle_pos.x, this.map.castle_pos.y, `-${leakDmg} 城堡耐久`, '#E2563A');

                if (this.castleHp <= 0) {
                    this.waveState = 'finished';
                    sounds.playDefeat();
                    if (this.onGameOver) this.onGameOver();
                } else {
                    sounds.playLeak();
                }
            }
        }
    }

    damageEnemy(e, rawDmg, isPhysical = true, pierceArmor = 0) {
        let effArmor = isPhysical ? Math.max(0, e.armor * (1.0 - pierceArmor)) : 0;
        let actualDmg = Math.max(1, rawDmg * (1.0 - effArmor));

        e.hp -= actualDmg;
        this.addFloatingText(e.x + (Math.random() - 0.5) * 20, e.y - 15, `-${Math.round(actualDmg)}`, isPhysical ? '#F4EFE2' : '#2F8F9D');

        if (e.hp <= 0) {
            this.gold += e.gold;
            sounds.playCoin();
            this.addFloatingText(e.x, e.y - 30, `+${e.gold}G`, '#E8B04A');
            // Death particles
            for (let p = 0; p < 8; p++) {
                this.particles.push({
                    x: e.x,
                    y: e.y,
                    vx: (Math.random() - 0.5) * 80,
                    vy: (Math.random() - 0.5) * 80,
                    life: 0.5,
                    maxLife: 0.5,
                    color: '#E2563A',
                    size: 3 + Math.random() * 3
                });
            }
            // Remove
            const idx = this.enemies.indexOf(e);
            if (idx !== -1) this.enemies.splice(idx, 1);
        }
    }

    updateGuards(dt) {
        for (let i = this.guards.length - 1; i >= 0; i--) {
            const g = this.guards[i];
            if (g.hp <= 0) {
                this.guards.splice(i, 1);
                continue;
            }

            // Move towards rally point
            const dRally = Math.hypot(g.rallyX - g.x, g.rallyY - g.y);
            if (dRally > 5 && !g.target) {
                const move = Math.min(dRally, 60 * dt);
                g.x += (g.rallyX - g.x) / dRally * move;
                g.y += (g.rallyY - g.y) / dRally * move;
            }

            // Find target or fight current target
            if (!g.target || g.target.hp <= 0) {
                g.target = null;
                for (const e of this.enemies) {
                    if (e.isAir || e.hp <= 0) continue;
                    const d = Math.hypot(e.x - g.x, e.y - g.y);
                    if (d <= 40 * this.scale && !e.engagedBy) {
                        g.target = e;
                        e.engagedBy = g;
                        break;
                    }
                }
            }

            if (g.target && g.target.hp > 0) {
                g.cooldown = (g.cooldown || 0) - dt;
                if (g.cooldown <= 0) {
                    g.cooldown = 1.0;
                    this.damageEnemy(g.target, g.atk, true);
                    if (g.bleed && g.target) {
                        g.target.bleedTimer = 3.0;
                        g.target.bleedDps = g.bleed;
                    }
                    // Enemy retaliation
                    if (g.target && g.target.hp > 0) {
                        const incoming = 15 * (1.0 - (g.blockDmg || 0));
                        g.hp -= incoming;
                        this.addFloatingText(g.x, g.y - 15, `-${Math.round(incoming)}`, '#E2563A');
                    }
                }
            }
        }
    }

    updateHero(dt) {
        const h = this.hero;

        // Move towards target
        const dTarget = Math.hypot(h.targetX - h.x, h.targetY - h.y);
        if (dTarget > 6 * this.scale) {
            const move = Math.min(dTarget, h.speed * dt);
            h.x += (h.targetX - h.x) / dTarget * move;
            h.y += (h.targetY - h.y) / dTarget * move;
        }

        // Ability cooldowns
        for (const k in h.abilities) {
            if (h.abilities[k].cdRemaining > 0) {
                h.abilities[k].cdRemaining = Math.max(0, h.abilities[k].cdRemaining - dt);
            }
        }

        // Melee combat with nearby enemy
        h.cooldown -= dt;
        if (!h.target || h.target.hp <= 0) {
            h.target = null;
            for (const e of this.enemies) {
                if (e.isAir || e.hp <= 0) continue;
                const d = Math.hypot(e.x - h.x, e.y - h.y);
                if (d <= HERO.range * this.scale) {
                    h.target = e;
                    e.engagedBy = h;
                    break;
                }
            }
        }

        if (h.target && h.target.hp > 0) {
            if (h.cooldown <= 0) {
                h.cooldown = h.attackRate;
                this.damageEnemy(h.target, h.atk, true);
                // Retaliation
                h.hp -= 8;
                if (h.hp < h.maxHp) {
                    h.hp = Math.min(h.maxHp, h.hp + 2 * dt); // slow regen
                }
            }
        }
    }

    castHeroAbility(abilityId, targetX, targetY) {
        const h = this.hero;
        const abDef = HERO.abilities.find(a => a.id === abilityId);
        if (!abDef) return false;

        if (h.abilities[abilityId].cdRemaining > 0) return false;
        if (this.gold < abDef.cost) return false;

        this.gold -= abDef.cost;
        h.abilities[abilityId].cdRemaining = abDef.cooldown;
        sounds.playHero();

        if (abilityId === 'blizzard') {
            this.areasOfEffect.push({
                type: 'blizzard',
                x: targetX,
                y: targetY,
                radius: abDef.radius * this.scale,
                duration: abDef.duration,
                timer: abDef.duration,
                dps: abDef.dps,
                slow: abDef.slow
            });
            this.addFloatingText(targetX, targetY, `暴雪降臨!`, '#2F8F9D');
        } else if (abilityId === 'reinforcements') {
            for (let i = 0; i < abDef.guardCount; i++) {
                const ox = (i - 1) * 24 * this.scale;
                this.guards.push({
                    id: Math.random(),
                    towerId: null,
                    isHeroSummon: true,
                    x: h.x,
                    y: h.y,
                    rallyX: targetX + ox,
                    rallyY: targetY,
                    hp: abDef.guardHp,
                    maxHp: abDef.guardHp,
                    atk: abDef.guardAtk,
                    cooldown: 0,
                    target: null,
                    expireTimer: abDef.duration
                });
            }
            this.addFloatingText(targetX, targetY, `禁衛增援!`, '#E8B04A');
        } else if (abilityId === 'beacon') {
            // Burst AoE damage line/circle + heal
            this.areasOfEffect.push({
                type: 'beacon_strike',
                x: targetX,
                y: targetY,
                radius: abDef.radius * this.scale,
                duration: 1.0,
                timer: 1.0
            });
            for (const e of this.enemies) {
                const d = Math.hypot(e.x - targetX, e.y - targetY);
                if (d <= abDef.radius * this.scale) {
                    this.damageEnemy(e, abDef.burstDamage, false);
                }
            }
            this.castleHp = Math.min(this.maxCastleHp, this.castleHp + abDef.castleHeal);
            this.addFloatingText(targetX, targetY, `烽火天降! 城堡+${abDef.castleHeal}`, '#DDEBF2');
        }
        return true;
    }

    updateProjectiles(dt) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];

            if (p.delay && p.delay > 0) {
                p.delay -= dt;
                continue;
            }

            if (p.type === 'bolt') {
                const tx = p.target && p.target.hp > 0 ? p.target.x : p.tx;
                const ty = p.target && p.target.hp > 0 ? p.target.y : p.ty;
                const dx = tx - p.x;
                const dy = ty - p.y;
                const dist = Math.hypot(dx, dy);
                const step = p.speed * dt;

                if (dist <= step || dist < 12 * this.scale) {
                    if (p.target && p.target.hp > 0) {
                        this.damageEnemy(p.target, p.damage, true, p.pierceArmor);
                    }
                    this.projectiles.splice(i, 1);
                } else {
                    p.x += (dx / dist) * step;
                    p.y += (dy / dist) * step;
                }
            } else if (p.type === 'mortar_stone') {
                p.progress += (p.speed * dt) / p.totalDist;
                p.x = p.startX + (p.tx - p.startX) * p.progress;
                p.y = p.startY + (p.ty - p.startY) * p.progress;

                if (p.progress >= 1.0) {
                    // Explode!
                    this.areasOfEffect.push({
                        type: 'mortar_crater',
                        x: p.tx,
                        y: p.ty,
                        radius: p.splash,
                        duration: 0.4,
                        timer: 0.4
                    });
                    for (const e of this.enemies) {
                        if (e.isAir) continue;
                        const d = Math.hypot(e.x - p.tx, e.y - p.ty);
                        if (d <= p.splash) {
                            const falloff = 1.0 - (d / p.splash) * 0.4;
                            this.damageEnemy(e, p.damage * falloff, true);
                            if (p.stun > 0) {
                                e.stunTimer = Math.max(e.stunTimer, p.stun);
                            }
                        }
                    }
                    // Cluster bomblets
                    if (p.clusterCount > 0) {
                        for (let c = 0; c < p.clusterCount; c++) {
                            const ang = (c / p.clusterCount) * Math.PI * 2;
                            const cx = p.tx + Math.cos(ang) * 45 * this.scale;
                            const cy = p.ty + Math.sin(ang) * 45 * this.scale;
                            for (const e of this.enemies) {
                                if (e.isAir) continue;
                                if (Math.hypot(e.x - cx, e.y - cy) <= 45 * this.scale) {
                                    this.damageEnemy(e, p.clusterDmg, true);
                                }
                            }
                        }
                    }
                    this.projectiles.splice(i, 1);
                }
            } else if (p.type === 'frost_shard') {
                const tx = p.target && p.target.hp > 0 ? p.target.x : p.target.x;
                const ty = p.target && p.target.hp > 0 ? p.target.y : p.target.y;
                const dx = tx - p.x;
                const dy = ty - p.y;
                const dist = Math.hypot(dx, dy);
                const step = p.speed * dt;

                if (dist <= step || dist < 12 * this.scale) {
                    if (p.target && p.target.hp > 0) {
                        this.damageEnemy(p.target, p.damage, false);
                        p.target.slowFactor = Math.max(p.target.slowFactor, p.slow);
                        p.target.slowTimer = Math.max(p.target.slowTimer, p.slowDuration);
                        if (p.freezeChance && Math.random() < p.freezeChance) {
                            p.target.freezeTimer = 1.5;
                            this.addFloatingText(p.target.x, p.target.y - 20, `冰封!`, '#DDEBF2');
                        }
                    }
                    this.projectiles.splice(i, 1);
                } else {
                    p.x += (dx / dist) * step;
                    p.y += (dy / dist) * step;
                }
            }
        }
    }

    updateAoEs(dt) {
        for (let i = this.areasOfEffect.length - 1; i >= 0; i--) {
            const aoe = this.areasOfEffect[i];
            aoe.timer -= dt;

            if (aoe.type === 'blizzard') {
                for (const e of this.enemies) {
                    const d = Math.hypot(e.x - aoe.x, e.y - aoe.y);
                    if (d <= aoe.radius) {
                        e.slowFactor = Math.max(e.slowFactor, aoe.slow);
                        e.slowTimer = 0.5;
                        this.damageEnemy(e, aoe.dps * dt, false);
                    }
                }
            }

            if (aoe.timer <= 0) {
                this.areasOfEffect.splice(i, 1);
            }
        }
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.life -= dt;
            ft.y -= 25 * dt; // float upwards
            if (ft.life <= 0) this.floatingTexts.splice(i, 1);
        }
    }

    addFloatingText(x, y, text, color = '#FFFFFF') {
        this.floatingTexts.push({
            x: x,
            y: y,
            text: text,
            color: color,
            life: 1.0,
            maxLife: 1.0
        });
    }

    getNearestRoadPoint(x, y) {
        let best = this.map.waypoints[0];
        let minDist = 999999;
        for (const wp of this.map.waypoints) {
            const d = Math.hypot(wp.x - x, wp.y - y);
            if (d < minDist) {
                minDist = d;
                best = wp;
            }
        }
        return best;
    }

    buildTower(plotId, towerType) {
        const plot = this.map.plots.find(p => p.id === plotId);
        if (!plot) return false;

        // Check if already occupied
        if (this.towers.some(t => t.plotId === plotId)) return false;

        const tDef = TOWERS[towerType];
        if (!tDef || this.gold < tDef.cost) return false;

        this.gold -= tDef.cost;
        sounds.playBuild();

        const tower = {
            id: this.nextTowerId++,
            plotId: plotId,
            type: towerType,
            level: '1',
            x: plot.x,
            y: plot.y,
            cooldown: 0,
            target: null,
            buffDmg: 1.0,
            buffRate: 1.0,
            buffRange: 1.0
        };
        this.towers.push(tower);

        if (towerType === 'guard') {
            const lDef = tDef.levels['1'];
            const rally = this.getNearestRoadPoint(tower.x, tower.y);
            tower.rallyPoint = rally;
            tower.respawnTimer = 0;
            for (let g = 0; g < lDef.guardCount; g++) {
                this.guards.push({
                    id: Math.random(),
                    towerId: tower.id,
                    x: tower.x,
                    y: tower.y,
                    rallyX: rally.x + (g - (lDef.guardCount - 1) / 2) * 20,
                    rallyY: rally.y + (Math.random() - 0.5) * 15,
                    hp: lDef.guardHp,
                    maxHp: lDef.guardHp,
                    atk: lDef.guardAtk,
                    blockDmg: lDef.blockDamage || 0,
                    bleed: lDef.bleed || 0,
                    cooldown: 0,
                    target: null
                });
            }
        }
        return tower;
    }

    upgradeTower(plotId, branch = null) {
        const t = this.towers.find(t => t.plotId === plotId);
        if (!t) return false;

        const tDef = TOWERS[t.type];
        const curLvlDef = tDef.levels[t.level];

        let nextLvl = null;
        if (t.level === '1') {
            nextLvl = '2';
        } else if (t.level === '2') {
            nextLvl = branch || '3a'; // 3a or 3b
        } else {
            return false; // Already max level
        }

        const cost = curLvlDef.upgradeCost;
        if (this.gold < cost) return false;

        this.gold -= cost;
        sounds.playBuild();
        t.level = nextLvl;

        if (t.type === 'guard') {
            const newLvlDef = tDef.levels[nextLvl];
            const rally = t.rallyPoint || this.getNearestRoadPoint(t.x, t.y);
            const living = this.guards.filter(g => g.towerId === t.id && g.hp > 0);
            for (const g of living) {
                g.maxHp = newLvlDef.guardHp;
                g.hp = newLvlDef.guardHp; // heal on upgrade
                g.atk = newLvlDef.guardAtk;
                g.blockDmg = newLvlDef.blockDamage || 0;
                g.bleed = newLvlDef.bleed || 0;
            }
            while (living.length < newLvlDef.guardCount) {
                const newG = {
                    id: Math.random(),
                    towerId: t.id,
                    x: t.x,
                    y: t.y,
                    rallyX: rally.x + (Math.random() - 0.5) * 30,
                    rallyY: rally.y + (Math.random() - 0.5) * 30,
                    hp: newLvlDef.guardHp,
                    maxHp: newLvlDef.guardHp,
                    atk: newLvlDef.guardAtk,
                    blockDmg: newLvlDef.blockDamage || 0,
                    bleed: newLvlDef.bleed || 0,
                    cooldown: 0,
                    target: null
                };
                this.guards.push(newG);
                living.push(newG);
            }
        }
        return true;
    }

    sellTower(plotId) {
        const idx = this.towers.findIndex(t => t.plotId === plotId);
        if (idx === -1) return false;

        const t = this.towers[idx];
        const tDef = TOWERS[t.type];

        // Total investment
        let totalCost = tDef.cost;
        if (t.level === '2' || t.level === '3a' || t.level === '3b') {
            totalCost += tDef.levels['1'].upgradeCost;
        }
        if (t.level === '3a' || t.level === '3b') {
            totalCost += tDef.levels['2'].upgradeCost;
        }

        const refund = Math.floor(totalCost * 0.7);
        this.gold += refund;
        sounds.playCoin();
        this.addFloatingText(t.x, t.y, `變賣 +${refund}G`, '#E8B04A');

        // Remove any guards linked to this tower
        this.guards = this.guards.filter(g => g.towerId !== t.id);
        this.towers.splice(idx, 1);
        return true;
    }

    calculateStars() {
        if (this.castleHp >= 18) return 3;
        if (this.castleHp >= 10) return 2;
        if (this.castleHp >= 1) return 1;
        return 0;
    }
}
