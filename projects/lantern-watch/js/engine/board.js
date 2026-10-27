/**
 * js/engine/board.js
 * Board representation (10x13), terrain queries, distance, and lantern lighting.
 */

import { TERRAIN_INFO } from '../data/maps.js';

export const COLS = 10;
export const ROWS = 13;

export class Board {
  constructor(terrainStrings = []) {
    this.cols = COLS;
    this.rows = ROWS;
    this.terrain = terrainStrings;
    this.lanterns = []; // [{ x, y, radius, turnsLeft }]
  }

  loadMap(terrainStrings, lanterns = []) {
    this.terrain = [...terrainStrings];
    this.lanterns = lanterns.map(l => ({ ...l, turnsLeft: l.turnsLeft ?? 999 }));
  }

  inBounds(x, y) {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
  }

  getTerrainChar(x, y) {
    if (!this.inBounds(x, y)) return '#';
    return this.terrain[y]?.[x] || '.';
  }

  setTerrainChar(x, y, char) {
    if (!this.inBounds(x, y)) return;
    const row = this.terrain[y];
    if (typeof row === 'string') {
      this.terrain[y] = row.substring(0, x) + char + row.substring(x + 1);
    }
  }

  getTerrain(x, y) {
    const ch = this.getTerrainChar(x, y);
    return TERRAIN_INFO[ch] || TERRAIN_INFO['.'];
  }

  isImpassable(x, y, isFlyer = false) {
    if (!this.inBounds(x, y)) return true;
    if (isFlyer) return false;
    const t = this.getTerrain(x, y);
    return !!t.impassable;
  }

  getMoveCost(x, y, isFlyer = false) {
    if (!this.inBounds(x, y)) return 99;
    if (isFlyer) return 1;
    const t = this.getTerrain(x, y);
    return t.moveCost;
  }

  getNeighbors(x, y) {
    const dirs = [
      { x: x, y: y - 1 },
      { x: x + 1, y: y },
      { x: x, y: y + 1 },
      { x: x - 1, y: y }
    ];
    return dirs.filter(d => this.inBounds(d.x, d.y));
  }

  static manhattan(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  static chebyshev(x1, y1, x2, y2) {
    return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
  }

  /**
   * Generates line tiles extending in cardinal direction (dx, dy)
   */
  static getLineTiles(originX, originY, dx, dy, length = 3) {
    const tiles = [];
    for (let i = 1; i <= length; i++) {
      const tx = originX + dx * i;
      const ty = originY + dy * i;
      if (tx >= 0 && tx < COLS && ty >= 0 && ty < ROWS) {
        tiles.push({ x: tx, y: ty });
      }
    }
    return tiles;
  }

  /**
   * Generates cone/fan tiles extending in cardinal direction (dx, dy):
   * 1 tile in front, 3 tiles in the second row
   */
  static getConeTiles(originX, originY, dx, dy) {
    const tiles = [];
    // Row 1 (distance 1, 1 tile)
    const t1x = originX + dx;
    const t1y = originY + dy;
    if (t1x >= 0 && t1x < COLS && t1y >= 0 && t1y < ROWS) {
      tiles.push({ x: t1x, y: t1y });
    }
    // Row 2 (distance 2, 3 tiles wide)
    if (dx !== 0) {
      const cx = originX + 2 * dx;
      for (const cy of [originY - 1, originY, originY + 1]) {
        if (cx >= 0 && cx < COLS && cy >= 0 && cy < ROWS) {
          tiles.push({ x: cx, y: cy });
        }
      }
    } else {
      const cy = originY + 2 * dy;
      for (const cx of [originX - 1, originX, originX + 1]) {
        if (cx >= 0 && cx < COLS && cy >= 0 && cy < ROWS) {
          tiles.push({ x: cx, y: cy });
        }
      }
    }
    return tiles;
  }

  /**
   * Adds a placed lantern (e.g. from lantern_crafter skill)
   */
  addPlacedLantern(x, y, radius = 2, turnsLeft = 3) {
    this.lanterns.push({ x, y, radius, turnsLeft, placed: true });
  }

  tickLanterns() {
    this.lanterns.forEach(l => {
      if (l.turnsLeft < 999) l.turnsLeft--;
    });
    this.lanterns = this.lanterns.filter(l => l.turnsLeft > 0);
  }

  /**
   * Checks whether a tile is within light of any active lantern
   */
  isTileLit(x, y) {
    for (const l of this.lanterns) {
      if (Board.chebyshev(x, y, l.x, l.y) <= l.radius) {
        return true;
      }
    }
    return false;
  }
}
