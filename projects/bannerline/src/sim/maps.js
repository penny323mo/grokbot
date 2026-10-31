import crossing from '../maps/crossing.json' with { type: 'json' };
import longRoad from '../maps/long-road.json' with { type: 'json' };
import twoLanes from '../maps/two-lanes.json' with { type: 'json' };
import { findPath } from './path.js';

export const MAP_LIST = [crossing, longRoad, twoLanes];

const PERSONALITIES = { cautious: true, balanced: true, aggressive: true };

export const DIFFICULTIES = {
  easy: {
    id: 'easy',
    label: '易',
    sendMinScale: 0.7,
    periodScale: 1.55,
    regenScale: 0.6,
    reactDelay: 3.6,
    firstShift: 0,
    hqGrace: 36,
    marchCap: 8,
  },
  normal: {
    id: 'normal',
    label: '中',
    sendMinScale: 1,
    periodScale: 1,
    regenScale: 1,
    reactDelay: 0.45,
    firstShift: 0,
    hqGrace: 20,
    marchCap: 0,
    // The threatened barracks holds. One neighbour reinforces it, then
    // counters. After that pair the headquarters keeps its pile. The caps
    // are the troops that march, so a deep stack still sends a readable squad.
    reliefKeep: 0.3,
    counterKeep: 0.3,
    holdWall: true,
    riposte: 6,
    hqRegen: 0.1,
    waveKeep: 0.58,
    maxRelief: 1,
    // The barracks opens on the map count. Ten extra headquarters troops are the
    // smallest pile that still stops one full barracks when the defence is off.
    barBonus: 0,
    hqBonus: 10,
    reliefCap: 24,
    counterCap: 16,
  },
  hard: {
    id: 'hard',
    label: '難',
    sendMinScale: 0.85,
    periodScale: 0.9,
    regenScale: 1.08,
    reactDelay: 0.35,
    firstShift: -6,
    hqGrace: 12,
    marchCap: 0,
    reliefKeep: 0.3,
    counterKeep: 0.3,
    holdWall: true,
    riposte: 12,
    hqRegen: 0.08,
    waveKeep: 0.68,
    maxRelief: 1,
    barBonus: 12,
    hqBonus: 18,
    reliefCap: 26,
    counterCap: 16,
  },
};

export function mapById(id) {
  for (let i = 0; i < MAP_LIST.length; i++) {
    if (MAP_LIST[i].id === id) return MAP_LIST[i];
  }
  return crossing;
}

export function difficultyById(id) {
  return DIFFICULTIES[id] || DIFFICULTIES.normal;
}

/** Normal difficulty keeps the classic first-send times. */
export function scaleFirstSend(base, diff) {
  const shift = diff && diff.firstShift ? diff.firstShift : 0;
  return Math.max(4, base + shift);
}

export function validateMap(map) {
  const errors = [];
  if (!map || typeof map !== 'object') return ['missing'];
  if (!map.id) errors.push('id');
  if (!map.name) errors.push('name');
  if (!PERSONALITIES[map.personality]) errors.push('personality');
  const nodes = map.nodes || {};
  const nodeIds = Object.keys(nodes);
  if (nodeIds.length < 2) errors.push('nodes');
  for (let i = 0; i < nodeIds.length; i++) {
    const n = nodes[nodeIds[i]];
    if (!n || !Number.isFinite(n.x) || !Number.isFinite(n.z)) errors.push(`node ${nodeIds[i]}`);
  }
  const graph = map.graph || {};
  const keys = Object.keys(graph);
  for (let i = 0; i < keys.length; i++) {
    if (!nodes[keys[i]]) errors.push(`graph ${keys[i]}`);
    const nexts = graph[keys[i]] || [];
    for (let j = 0; j < nexts.length; j++) {
      if (!nodes[nexts[j]]) errors.push(`edge ${keys[i]}->${nexts[j]}`);
    }
  }
  const buildings = map.buildings || [];
  if (buildings.length < 2) errors.push('buildings');
  let playerHq = false;
  let enemyHq = false;
  const ids = {};
  for (let i = 0; i < buildings.length; i++) {
    const b = buildings[i];
    if (!b.id || ids[b.id]) errors.push(`building id ${b && b.id}`);
    ids[b.id] = true;
    if (!nodes[b.node]) errors.push(`building node ${b.id}`);
    if (b.kind !== 'hq' && b.kind !== 'barracks') errors.push(`kind ${b.id}`);
    if (b.owner !== 'player' && b.owner !== 'enemy') errors.push(`owner ${b.id}`);
    if (!(b.cap > 0) || b.count < 0 || b.count > b.cap || !Number.isFinite(b.regen) || b.regen < 0) {
      errors.push(`stats ${b.id}`);
    }
    if (b.id === 'player-hq' && b.kind === 'hq' && b.owner === 'player') playerHq = true;
    if (b.id === 'enemy-hq' && b.kind === 'hq' && b.owner === 'enemy') enemyHq = true;
  }
  if (!playerHq) errors.push('player-hq');
  if (!enemyHq) errors.push('enemy-hq');
  for (let i = 0; i < buildings.length; i++) {
    for (let j = i + 1; j < buildings.length; j++) {
      const path = findPath(buildings[i].node, buildings[j].node, graph);
      if (!path || path.length < 2) errors.push(`path ${buildings[i].id}->${buildings[j].id}`);
    }
  }
  const zones = map.zones || [];
  for (let i = 0; i < zones.length; i++) {
    const z = zones[i];
    if (!ids[z.buildingId]) errors.push(`zone ${z.buildingId}`);
    if (!(z.rx > 0) || !(z.rz > 0)) errors.push(`zone size ${z.buildingId}`);
  }
  const road = map.road || [];
  for (let i = 0; i < road.length; i++) {
    if (!nodes[road[i]]) errors.push(`road ${road[i]}`);
  }
  return errors;
}
