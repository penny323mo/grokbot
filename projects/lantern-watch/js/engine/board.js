/**
 * js/engine/board.js
 * 5x6 Grid tactics math, terrain layout generation, adjacency, push/collision physics.
 */

import { GRID_COLS, GRID_ROWS, LANTERN_COORDINATES, TERRAINS } from "./constants.js";

export class Board {
  constructor(cols = GRID_COLS, rows = GRID_ROWS) {
    this.cols = cols;
    this.rows = rows;
    this.tiles = [];
    this.initTiles();
  }

  initTiles(terrainPreset = "default", rng = null) {
    this.tiles = [];
    for (let y = 0; y < this.rows; y++) {
      const row = [];
      for (let x = 0; x < this.cols; x++) {
        row.push({
          x,
          y,
          terrain: TERRAINS.GRASS,
          unit: null,        // Pointer to guardian or enemy
          lanternId: null,   // Set if this is a lantern post
          trap: null,        // e.g. bamboo trap
          bun: null          // e.g. bear baker bun
        });
      }
      this.tiles.push(row);
    }

    // Assign lantern coordinates
    for (const l of LANTERN_COORDINATES) {
      if (this.isValid(l.x, l.y)) {
        this.tiles[l.y][l.x].lanternId = l.id;
        this.tiles[l.y][l.x].terrain = TERRAINS.LANTERN_POST;
      }
    }

    // Place thematic terrain features if RNG provided
    if (rng) {
      this.populateTerrains(rng);
    }
  }

  populateTerrains(rng) {
    // Row 1 to 4: scatter 1-2 water tiles and 1-2 bamboo groves
    const candidateTiles = [];
    for (let y = 1; y < this.rows - 1; y++) {
      for (let x = 0; x < this.cols; x++) {
        candidateTiles.push({ x, y });
      }
    }
    const shuffled = rng.shuffle(candidateTiles);

    // Place 1-2 water pools
    const waterCount = rng.nextInt(1, 2);
    for (let i = 0; i < waterCount; i++) {
      const t = shuffled[i];
      this.tiles[t.y][t.x].terrain = TERRAINS.WATER;
    }

    // Place 1-2 bamboo groves
    const bambooCount = rng.nextInt(1, 2);
    for (let i = waterCount; i < waterCount + bambooCount; i++) {
      const t = shuffled[i];
      this.tiles[t.y][t.x].terrain = TERRAINS.BAMBOO;
    }

    // 1 Stone lantern post in mid-field (Row 2 or 3)
    if (shuffled.length > waterCount + bambooCount) {
      const postTile = shuffled[waterCount + bambooCount];
      this.tiles[postTile.y][postTile.x].terrain = TERRAINS.LANTERN_POST;
    }
  }

  isValid(x, y) {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
  }

  getTile(x, y) {
    if (!this.isValid(x, y)) return null;
    return this.tiles[y][x];
  }

  getUnitAt(x, y) {
    const tile = this.getTile(x, y);
    return tile ? tile.unit : null;
  }

  isEmpty(x, y) {
    const tile = this.getTile(x, y);
    return tile !== null && tile.unit === null && !tile.lanternId;
  }

  isFriendlyZone(y) {
    // Rows 3, 4, 5 are friendly town side
    return y >= 3;
  }

  isLanternTile(x, y) {
    const tile = this.getTile(x, y);
    return tile !== null && tile.lanternId !== null;
  }

  static getDistance(a, b) {
    // Manhattan distance
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  getOrthogonalNeighbors(x, y) {
    const dirs = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 }
    ];
    const neighbors = [];
    for (const d of dirs) {
      const nx = x + d.x;
      const ny = y + d.y;
      if (this.isValid(nx, ny)) {
        neighbors.push(this.tiles[ny][nx]);
      }
    }
    return neighbors;
  }

  getAdjacentUnits(x, y, filterFn = null) {
    const neighbors = this.getOrthogonalNeighbors(x, y);
    const units = [];
    for (const n of neighbors) {
      if (n.unit) {
        if (!filterFn || filterFn(n.unit)) {
          units.push(n.unit);
        }
      }
    }
    return units;
  }

  /**
   * Pushes a unit in direction (dx, dy) up to `distance` tiles.
   * Handles collision with other units, walls, lanterns, and water tiles.
   * Returns a log of effects: { moved: boolean, steps: number, collisionTarget: unit|wall, damageEvents: [] }
   */
  pushUnit(unit, dx, dy, distance = 1, options = {}) {
    if (!unit) return { moved: false, steps: 0 };
    // Normalize step
    const stepX = Math.sign(dx);
    const stepY = Math.sign(dy);
    if (stepX === 0 && stepY === 0) return { moved: false, steps: 0 };

    let currentX = unit.x;
    let currentY = unit.y;
    let stepsMoved = 0;
    let collision = null;
    const damageEvents = [];
    const bonusCollisionDmg = options.bonusCollisionDmg || 0;
    const spiritBellBonus = options.spiritBellBonus || 0;

    for (let i = 0; i < distance; i++) {
      const nextX = currentX + stepX;
      const nextY = currentY + stepY;

      // Check boundary collision
      if (!this.isValid(nextX, nextY)) {
        collision = { type: "boundary", x: nextX, y: nextY };
        const dmg = 2 + bonusCollisionDmg;
        damageEvents.push({ unit, damage: dmg, reason: "wall_collision" });
        break;
      }

      const nextTile = this.getTile(nextX, nextY);

      // Check unit collision
      if (nextTile.unit) {
        collision = { type: "unit", target: nextTile.unit, x: nextX, y: nextY };
        const dmg = 2 + bonusCollisionDmg;
        damageEvents.push({ unit, damage: dmg, reason: "unit_collision" });
        damageEvents.push({ unit: nextTile.unit, damage: dmg, reason: "bumped" });
        break;
      }

      // Move into next tile
      this.tiles[currentY][currentX].unit = null;
      currentX = nextX;
      currentY = nextY;
      this.tiles[currentY][currentX].unit = unit;
      unit.x = currentX;
      unit.y = currentY;
      stepsMoved++;

      // Check water shock
      if (nextTile.terrain === TERRAINS.WATER) {
        const waterDmg = 2 + bonusCollisionDmg + spiritBellBonus;
        damageEvents.push({ unit, damage: waterDmg, reason: "water_shock" });
      }

      // Check trap
      if (nextTile.trap) {
        damageEvents.push({ unit, damage: nextTile.trap.damage || 5, reason: "trap_triggered" });
        unit.isRooted = true;
        nextTile.trap = null;
        break; // Stop at trap
      }
    }

    return {
      moved: stepsMoved > 0,
      steps: stepsMoved,
      collision,
      damageEvents,
      finalPos: { x: currentX, y: currentY }
    };
  }

  /**
   * Line targeting helper (e.g. dragon breath, lantern flare)
   */
  getLineTiles(startX, startY, dirX, dirY, maxRange = 5) {
    const tiles = [];
    let curX = startX;
    let curY = startY;
    for (let i = 0; i < maxRange; i++) {
      curX += dirX;
      curY += dirY;
      if (!this.isValid(curX, curY)) break;
      tiles.push(this.tiles[curY][curX]);
    }
    return tiles;
  }
}
