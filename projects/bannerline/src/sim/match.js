import { writeOrder } from './ai.js';
import { FIRST_SEND, RULES } from './balance.js';
import { canStartCapture, captureResult, matchOutcome, stepCapture } from './capture.js';
import { clashTick, splitSurvivors } from './combat.js';
import { applyRegen } from './economy.js';
import { GRAPH, NODES } from './mapdata.js';
import { difficultyById, mapById, scaleFirstSend } from './maps.js';
import { findPath } from './path.js';

function blankBuilding(spec, diff) {
  const scale = spec.owner === 'enemy' ? (diff.regenScale > 0 ? diff.regenScale : 1) : 1;
  let regen = spec.regen * scale;
  if (spec.owner === 'enemy' && spec.kind === 'hq' && diff.hqRegen > 0) regen += diff.hqRegen;
  let count = spec.count;
  let cap = spec.cap;
  if (spec.owner === 'enemy' && spec.kind === 'barracks' && diff.barBonus > 0) {
    count = Math.min(spec.cap, spec.count + diff.barBonus);
  }
  if (spec.owner === 'enemy' && spec.kind === 'hq' && diff.hqBonus > 0) {
    count = spec.count + diff.hqBonus;
    cap = Math.max(spec.cap, count);
  }
  return {
    id: spec.id,
    kind: spec.kind,
    owner: spec.owner,
    node: spec.node,
    count,
    cap,
    regen,
    baseRegen: spec.regen,
    bank: 0,
    capture: 0,
    upgrades: { haste: 0, bulwark: 0 },
  };
}

export function createMatch(opts = {}) {
  const map = mapById(opts.mapId || 'crossing');
  const diff = difficultyById(opts.difficulty || 'normal');
  const buildings = map.buildings.map((spec) => blankBuilding(spec, diff));
  const nextSendAt = {};
  for (let i = 0; i < buildings.length; i++) {
    const b = buildings[i];
    if (b.owner !== 'enemy') continue;
    const base = FIRST_SEND[b.id] ?? (b.kind === 'hq' ? 22 : 16);
    nextSendAt[b.id] = scaleFirstSend(base, diff);
  }
  return {
    t: 0,
    status: opts.status || 'playing',
    ai: opts.ai !== false,
    clashAcc: 0,
    nextSquadId: 1,
    nextSendAt,
    buildings,
    squads: [],
    events: [],
    map,
    nodes: map.nodes,
    graph: map.graph,
    personality: map.personality || 'balanced',
    difficulty: diff.id,
    sendMin: RULES.enemySendMin * diff.sendMinScale,
    sendPeriod: RULES.enemySendPeriod * diff.periodScale,
    reactDelay: diff.reactDelay,
    hqGrace: diff.hqGrace > 0 ? diff.hqGrace : 0,
    marchCap: diff.marchCap > 0 ? diff.marchCap : 0,
    reliefKeep: diff.reliefKeep > 0 ? diff.reliefKeep : 0,
    holdWall: !!diff.holdWall,
    riposte: diff.riposte > 0 ? diff.riposte : 0,
    counterKeep: diff.counterKeep > 0 ? diff.counterKeep : 0,
    waveKeep: diff.waveKeep > 0 ? diff.waveKeep : 0,
    maxRelief: diff.maxRelief > 0 ? diff.maxRelief : 0,
    reliefCap: diff.reliefCap > 0 ? diff.reliefCap : 12,
    counterCap: diff.counterCap > 0 ? diff.counterCap : 10,
    alarmAt: null,
    answered: {},
    opened: {},
    waveTurn: {},
    reliefCount: {},
  };
}

function nodesOf(state) {
  return (state && state.nodes) || NODES;
}

function graphOf(state) {
  return (state && state.graph) || GRAPH;
}

export function buildingById(state, id) {
  for (let i = 0; i < state.buildings.length; i++) {
    if (state.buildings[i].id === id) return state.buildings[i];
  }
  return null;
}

export function squadById(state, id) {
  if (!state) return null;
  for (let i = 0; i < state.squads.length; i++) {
    if (state.squads[i].id === id) return state.squads[i];
  }
  return null;
}

/**
 * Send a squad that is already on the map toward a building.
 * The new path starts on the segment the squad is walking, so it does not
 * snap back to the node it has left.
 */
export function retargetSquad(state, squadId, targetId) {
  if (!state || state.status !== 'playing') return { ok: false, reason: 'over' };
  const squad = squadById(state, squadId);
  const target = buildingById(state, targetId);
  if (!squad || squad.owner !== 'player' || squad.count <= 0) return { ok: false, reason: 'bad-squad' };
  if (!target) return { ok: false, reason: 'bad-target' };
  const path = squad.path || [];
  if (!path.length) return { ok: false, reason: 'no-path' };
  const atEnd = squad.seg >= path.length - 1;
  const behind = atEnd ? path[path.length - 1] : path[squad.seg];
  const next = atEnd ? null : path[squad.seg + 1];
  let rebuilt;
  const graph = graphOf(state);
  if (!next) {
    rebuilt = findPath(behind, target.node, graph);
  } else {
    const rest = findPath(next, target.node, graph);
    if (!rest) return { ok: false, reason: 'no-path' };
    rebuilt = rest[0] === behind ? rest : [behind, ...rest];
  }
  if (!rebuilt || rebuilt.length < 2) return { ok: false, reason: 'same' };
  squad.targetId = target.id;
  squad.path = rebuilt;
  squad.seg = 0;
  squad.mode = 'march';
  state.events.push({ type: 'retarget', squadId, targetId, owner: squad.owner });
  return { ok: true };
}

export function sideStrength(state, owner) {
  let n = 0;
  for (let i = 0; i < state.buildings.length; i++) {
    const b = state.buildings[i];
    if (b.owner === owner) n += b.count;
  }
  for (let i = 0; i < state.squads.length; i++) {
    const s = state.squads[i];
    if (s.owner === owner) n += s.count;
  }
  return n;
}

/**
 * Garrison left behind by a player order.
 * A fifth of the stack, at least one soldier when there are two or more,
 * and never more than 6 — a full barracks of 54 must still march more than
 * the 44 troops in the enemy headquarters.
 */
export function playerHold(building) {
  const count = Math.max(0, Math.floor(building.count || 0));
  if (count <= 1) return 0;
  const fraction = Math.max(1, Math.floor(count * 0.2));
  return Math.min(fraction, 6, count - 1);
}

export function sendSquad(state, fromId, targetId, keep = 0) {
  if (!state || state.status !== 'playing') return { ok: false, reason: 'over' };
  const from = buildingById(state, fromId);
  const target = buildingById(state, targetId);
  if (!from || !target || from.id === target.id) return { ok: false, reason: 'bad-target' };
  const hold = Math.max(0, Math.floor(keep));
  if (from.count - hold < 1) return { ok: false, reason: 'empty' };
  const path = findPath(from.node, target.node, graphOf(state));
  if (!path || path.length < 2) return { ok: false, reason: 'no-path' };
  const count = from.count - hold;
  from.count = hold;
  from.bank = 0;
  const start = nodesOf(state)[path[0]];
  const squad = {
    id: `sq${state.nextSquadId++}`,
    owner: from.owner,
    count,
    targetId: target.id,
    path,
    seg: 0,
    x: start.x,
    z: start.z,
    mode: 'march',
  };
  state.squads.push(squad);
  state.events.push({ type: 'send', owner: from.owner, count, fromId, targetId });
  return { ok: true, count, id: squad.id };
}

function moveSquad(squad, dt, nodes) {
  let left = RULES.marchSpeed * dt;
  while (left > 0 && squad.seg < squad.path.length - 1) {
    const b = nodes[squad.path[squad.seg + 1]];
    const dx = b.x - squad.x;
    const dz = b.z - squad.z;
    const dist = Math.hypot(dx, dz);
    if (dist <= 1e-6) {
      squad.x = b.x;
      squad.z = b.z;
      squad.seg += 1;
      continue;
    }
    if (dist <= left + 1e-8) {
      squad.x = b.x;
      squad.z = b.z;
      left -= dist;
      squad.seg += 1;
    } else {
      const inv = 1 / dist;
      squad.x += dx * inv * left;
      squad.z += dz * inv * left;
      left = 0;
    }
  }
}

function pathTravel(path, nodes) {
  let d = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = nodes[path[i]];
    const b = nodes[path[i + 1]];
    d += Math.hypot(a.x - b.x, a.z - b.z);
  }
  return d;
}

const threatSlot = { id: null };
const orderSlot = { targetId: '', keep: 0, relief: false, counter: false };
const targetScratch = [];
for (let ti = 0; ti < 12; ti++) {
  targetScratch.push({ id: '', kind: '', count: 0, travel: 0 });
}

function scanThreat(state) {
  threatSlot.id = null;
  threatSlot.dist = Infinity;
  let best = Infinity;
  let under = false;
  const nodes = nodesOf(state);
  for (let i = 0; i < state.squads.length; i++) {
    const s = state.squads[i];
    if (s.owner !== 'player' || s.count <= 0 || !s.targetId) continue;
    const b = buildingById(state, s.targetId);
    if (!b || b.owner !== 'enemy') continue;
    under = true;
    const dest = nodes[b.node];
    const d = Math.hypot(s.x - dest.x, s.z - dest.z);
    if (d < best) {
      best = d;
      threatSlot.id = b.id;
      threatSlot.dist = d;
    }
  }
  return under;
}

function fillTargets(state, fromNode) {
  const nodes = nodesOf(state);
  const graph = graphOf(state);
  let n = 0;
  for (let i = 0; i < state.buildings.length && n < targetScratch.length; i++) {
    const t = state.buildings[i];
    if (t.owner !== 'player') continue;
    const path = findPath(fromNode, t.node, graph);
    if (!path) continue;
    const slot = targetScratch[n];
    slot.id = t.id;
    slot.kind = t.kind;
    slot.count = t.count;
    slot.travel = path.length < 2 ? 0 : pathTravel(path, nodes);
    n += 1;
  }
  return n;
}

function planEnemy(state) {
  if (!state.ai) return;
  const under = scanThreat(state);
  if (under) {
    if (state.alarmAt == null) state.alarmAt = state.t;
  } else if (state.alarmAt != null) {
    // Drop the alarm, but keep `answered`. A gap between waves must not
    // grant a second reaction before the riposte. nextSendAt is the cooldown.
    state.alarmAt = null;
  }
  const threatened = buildingById(state, threatSlot.id);
  const pressing = under && threatSlot.dist <= RULES.arriveRadius;
  const opened = state.opened || (state.opened = {});
  let relieverId = null;
  if (state.holdWall && under && threatened && threatened.owner === 'enemy') {
    const nodes = nodesOf(state);
    const dest = nodes[threatened.node];
    let bestD = Infinity;
    if (dest) {
      for (let k = 0; k < state.buildings.length; k++) {
        const other = state.buildings[k];
        if (other.owner !== 'enemy' || other.id === threatened.id || other.count < 2) continue;
        const p = nodes[other.node];
        if (!p) continue;
        const d = (p.x - dest.x) * (p.x - dest.x) + (p.z - dest.z) * (p.z - dest.z);
        if (d < bestD) {
          bestD = d;
          relieverId = other.id;
        }
      }
    }
  }
  for (let i = 0; i < state.buildings.length; i++) {
    const b = state.buildings[i];
    if (b.owner !== 'enemy') continue;
    const targetCount = fillTargets(state, b.node);
    const ready = writeOrder({
      t: state.t,
      nextSendAt: state.nextSendAt[b.id] ?? 0,
      underAttack: under,
      alarmAt: state.alarmAt,
      reactDelay: state.reactDelay,
      answered: !!state.answered[b.id],
      count: b.count,
      kind: b.kind,
      buildingId: b.id,
      personality: state.personality,
      sendMin: state.sendMin,
      threatenedId: threatSlot.id,
      ownsThreatened: !!(threatened && threatened.owner === 'enemy'),
      targets: targetScratch,
      targetCount,
      opened: !!opened[b.id],
      pressing,
      hqGrace: state.hqGrace || 0,
      marchCap: state.marchCap || 0,
      reliefKeep: state.reliefKeep || 0,
      holdWall: !!state.holdWall,
      counterKeep: state.counterKeep || 0,
      waveKeep: state.waveKeep || 0,
      wave: state.waveTurn[b.id] || 0,
      reliefCap: state.reliefCap || 0,
      counterCap: state.counterCap || 0,
      riposte: state.riposte || 0,
      threatenedKind: threatened ? threatened.kind : '',
      // Even turns reinforce the building under attack. Odd turns counter.
      // The first answer is a reinforcement, so a barracks rush meets troops.
      relieve: !!(
        relieverId
        && relieverId === b.id
        && threatened
        && threatened.owner === 'enemy'
        && threatened.kind === 'barracks'
        && threatened.count >= 12
        && state.maxRelief > 0
        && (state.reliefCount[b.id] || 0) < state.maxRelief
        && ((state.waveTurn[b.id] || 0) % 2 === 0)
      ),
    }, orderSlot);
    if (!ready) continue;
    const res = sendSquad(state, b.id, orderSlot.targetId, orderSlot.keep);
    if (!res.ok) continue;
    opened[b.id] = true;
    if (orderSlot.relief || orderSlot.counter) {
      state.waveTurn[b.id] = (state.waveTurn[b.id] || 0) + 1;
    }
    if (orderSlot.relief) state.reliefCount[b.id] = (state.reliefCount[b.id] || 0) + 1;
    let delay = state.sendPeriod;
    if ((orderSlot.relief || orderSlot.counter) && state.riposte > 0) delay = state.riposte;
    state.nextSendAt[b.id] = state.t + delay;
    if (under) state.answered[b.id] = true;
  }
}

function collectPairs(state) {
  const squads = state.squads;
  const paired = new Set();
  const pairs = [];
  for (let i = 0; i < squads.length; i++) {
    const a = squads[i];
    if (a.count <= 0 || paired.has(a.id)) continue;
    let best = null;
    let bestD = RULES.contactRadius;
    for (let j = 0; j < squads.length; j++) {
      if (i === j) continue;
      const b = squads[j];
      if (b.count <= 0 || paired.has(b.id) || b.owner === a.owner) continue;
      const d = Math.hypot(a.x - b.x, a.z - b.z);
      if (d <= bestD) {
        bestD = d;
        best = b;
      }
    }
    if (best) {
      paired.add(a.id);
      paired.add(best.id);
      pairs.push([a, best]);
    }
  }
  return { pairs, paired };
}

function assignModes(state, paired) {
  for (let i = 0; i < state.squads.length; i++) {
    const s = state.squads[i];
    if (s.count <= 0) continue;
    if (paired.has(s.id)) {
      s.mode = 'fight';
      continue;
    }
    const target = buildingById(state, s.targetId);
    if (!target) {
      s.mode = 'march';
      continue;
    }
    const dest = nodesOf(state)[target.node];
    const dist = Math.hypot(s.x - dest.x, s.z - dest.z);
    const finished = s.seg >= s.path.length - 1;
    if (finished && dist <= RULES.arriveRadius) {
      if (target.owner === s.owner) {
        const room = Math.max(0, target.cap - target.count);
        const take = Math.min(s.count, room);
        if (take > 0) {
          target.count += take;
          s.count -= take;
          state.events.push({ type: 'reinforce', buildingId: target.id, owner: s.owner });
        }
        if (s.count > 0) {
          s.x = dest.x;
          s.z = dest.z;
          s.mode = 'march';
        }
      } else {
        s.mode = 'siege';
        s.x = dest.x;
        s.z = dest.z;
      }
    } else {
      s.mode = 'march';
    }
  }
}

function resolveFights(state, pairs) {
  let any = false;
  for (let i = 0; i < pairs.length; i++) {
    const a = pairs[i][0];
    const b = pairs[i][1];
    if (a.count <= 0 || b.count <= 0) continue;
    const r = clashTick(a.count, b.count, RULES.clashLoss);
    a.count = r.a;
    b.count = r.b;
    any = true;
  }

  const groups = new Map();
  for (let i = 0; i < state.squads.length; i++) {
    const s = state.squads[i];
    if (s.mode !== 'siege' || s.count <= 0) continue;
    let list = groups.get(s.targetId);
    if (!list) {
      list = [];
      groups.set(s.targetId, list);
    }
    list.push(s);
  }

  for (const [bid, attackers] of groups) {
    const bld = buildingById(state, bid);
    if (!bld) continue;
    if (attackers.every((s) => s.owner === bld.owner)) continue;
    const enemy = attackers.filter((s) => s.owner !== bld.owner && s.count > 0);
    if (!enemy.length) continue;
    const counts = enemy.map((s) => s.count);
    const sum = counts.reduce((n, c) => n + c, 0);
    const r = clashTick(sum, bld.count, RULES.clashLoss);
    bld.count = r.b;
    const shares = splitSurvivors(counts, r.a);
    for (let i = 0; i < enemy.length; i++) enemy[i].count = shares[i];
    if (bld.count > 0) bld.capture = 0;
    any = true;
  }
  if (any) state.events.push({ type: 'clash' });
}

function advanceCaptures(state, dt) {
  for (let i = 0; i < state.buildings.length; i++) {
    const b = state.buildings[i];
    let attackerCount = 0;
    let attackerOwner = null;
    const holders = [];
    for (let s = 0; s < state.squads.length; s++) {
      const sq = state.squads[s];
      if (sq.mode !== 'siege' || sq.targetId !== b.id || sq.count <= 0) continue;
      if (sq.owner === b.owner) continue;
      attackerCount += sq.count;
      attackerOwner = sq.owner;
      holders.push(sq);
    }
    const allowed = canStartCapture({
      garrison: b.count,
      attackerCount,
      attackerOwner,
      buildingOwner: b.owner,
    });
    const step = stepCapture(b.capture, dt, RULES.captureSeconds, allowed);
    b.capture = step.progress;
    if (!step.done || !attackerOwner) continue;
    const flipped = captureResult(attackerOwner, attackerCount);
    b.owner = flipped.owner;
    b.count = flipped.count;
    b.capture = 0;
    b.bank = 0;
    for (let h = 0; h < holders.length; h++) holders[h].count = 0;
    state.events.push({ type: 'capture', buildingId: b.id, owner: attackerOwner });
  }
}

function checkOutcome(state) {
  const playerHq = buildingById(state, 'player-hq');
  const enemyHq = buildingById(state, 'enemy-hq');
  const outcome = matchOutcome(playerHq && playerHq.owner, enemyHq && enemyHq.owner);
  if (outcome && state.status === 'playing') {
    state.status = outcome;
    state.events.push({ type: outcome });
  }
}

function stepOnce(state, dt) {
  if (state.status !== 'playing') return;

  for (let i = 0; i < state.buildings.length; i++) {
    const b = state.buildings[i];
    if (!(b.regen > 0) || (b.kind !== 'barracks' && b.kind !== 'hq')) continue;
    let sieged = false;
    for (let s = 0; s < state.squads.length; s++) {
      const sq = state.squads[s];
      if (sq.mode === 'siege' && sq.targetId === b.id && sq.owner !== b.owner && sq.count > 0) {
        sieged = true;
        break;
      }
    }
    if (sieged) continue;
    const before = b.count;
    const next = applyRegen(b.count, b.cap, b.bank, b.regen, dt);
    b.count = next.count;
    b.bank = next.bank;
    if (b.count > before) state.events.push({ type: 'spawn', buildingId: b.id, owner: b.owner });
  }

  planEnemy(state);

  const nodes = nodesOf(state);
  for (let i = 0; i < state.squads.length; i++) {
    const s = state.squads[i];
    if (s.mode === 'march' && s.count > 0) moveSquad(s, dt, nodes);
  }

  const { pairs, paired } = collectPairs(state);
  assignModes(state, paired);

  state.clashAcc += dt;
  while (state.clashAcc >= RULES.clashEvery) {
    state.clashAcc -= RULES.clashEvery;
    resolveFights(state, pairs);
  }

  advanceCaptures(state, dt);

  if (state.squads.some((s) => s.count <= 0)) {
    state.squads = state.squads.filter((s) => s.count > 0);
  }

  checkOutcome(state);
}

export function stepMatch(state, dt, opts = {}) {
  if (!state || state.status !== 'playing') return state;
  if (!Number.isFinite(dt) || dt <= 0) return state;
  if (opts.ai === false) state.ai = false;
  if (opts.ai === true) state.ai = true;
  state.events.length = 0;
  let left = dt;
  const hmax = RULES.substep;
  while (left > 1e-8 && state.status === 'playing') {
    const h = Math.min(hmax, left);
    stepOnce(state, h);
    state.t += h;
    left -= h;
  }
  return state;
}
