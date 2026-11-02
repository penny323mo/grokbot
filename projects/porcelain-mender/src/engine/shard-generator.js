// src/engine/shard-generator.js - Procedural crack and shard generator for porcelain pieces

/**
 * Simple pseudo-random number generator seeded with a string or number
 */
export function createRNG(seedStr = 'porcelain') {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * Computes polygon area using Shoelace formula
 */
export function computePolygonArea(points) {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i][0] * points[j][1];
    area -= points[j][0] * points[i][1];
  }
  return Math.abs(area) / 2;
}

/**
 * Computes polygon centroid
 */
export function computeCentroid(points) {
  let cx = 0, cy = 0;
  const n = points.length;
  let signedArea = 0;

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let sumX = 0, sumY = 0;

  for (let i = 0; i < n; i++) {
    const x = points[i][0];
    const y = points[i][1];
    sumX += x;
    sumY += y;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;

    const j = (i + 1) % n;
    const a = points[i][0] * points[j][1] - points[j][0] * points[i][1];
    signedArea += a;
    cx += (points[i][0] + points[j][0]) * a;
    cy += (points[i][1] + points[j][1]) * a;
  }
  signedArea *= 0.5;

  if (Math.abs(signedArea) < 1e-4) {
    return [sumX / n, sumY / n];
  }

  cx = cx / (6 * signedArea);
  cy = cy / (6 * signedArea);

  // Reject centroid outside polygon bounding box
  if (isNaN(cx) || isNaN(cy) || cx < minX || cx > maxX || cy < minY || cy > maxY) {
    return [sumX / n, sumY / n];
  }

  return [cx, cy];
}

/**
 * Add realistic jitter/jaggedness along a line segment between p1 and p2
 */
function subdivideJagged(p1, p2, depth, rng, jitterScale) {
  if (depth <= 0) return [p1, p2];
  const midX = (p1[0] + p2[0]) / 2;
  const midY = (p1[1] + p2[1]) / 2;
  
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const len = Math.hypot(dx, dy);
  if (len < 5) return [p1, p2];

  // Normal vector
  const nx = -dy / len;
  const ny = dx / len;
  const jitter = (rng() - 0.5) * jitterScale * len * 0.25;

  const displaced = [midX + nx * jitter, midY + ny * jitter];

  const left = subdivideJagged(p1, displaced, depth - 1, rng, jitterScale);
  const right = subdivideJagged(displaced, p2, depth - 1, rng, jitterScale);
  return left.slice(0, -1).concat(right);
}

/**
 * Generates outer rim arc points between startAngle and endAngle
 */
function getArcPoints(cx, cy, R, startAngle, endAngle, steps = 12) {
  let diff = endAngle - startAngle;
  while (diff <= 0) diff += Math.PI * 2;
  const pts = [];
  for (let s = 0; s <= steps; s++) {
    const a = startAngle + (diff * s) / steps;
    pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
  }
  return pts;
}

/**
 * Generates N irregular shards along an organic transverse fracture spine with branching cracks.
 * Guarantees NO pie spokes, NO gaps, NO overlapping slivers, and 100% solvable assembly.
 */
export function generateShardsForPiece(pieceConfig, canvasWidth = 360, canvasHeight = 360) {
  const { id, shardsCount = 4 } = pieceConfig;
  const rng = createRNG(id + '_shards_spine');

  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;
  const R = Math.min(canvasWidth, canvasHeight) * 0.43; // disk radius

  // Main transverse fracture axis across the plate
  const thetaStart = rng() * Math.PI * 2;
  let thetaEnd = thetaStart + Math.PI + (rng() - 0.5) * 0.35;
  if (thetaEnd <= thetaStart) thetaEnd += Math.PI * 2;

  const pA = [cx + Math.cos(thetaStart) * R, cy + Math.sin(thetaStart) * R];
  const pB = [cx + Math.cos(thetaEnd) * R, cy + Math.sin(thetaEnd) * R];

  // Number of shards on Side 1 and Side 2
  const k1 = Math.ceil(shardsCount / 2);
  const k2 = shardsCount - k1;

  // Generate main jagged spine across the dish
  const mainSpine = subdivideJagged(pA, pB, 3, rng, 0.3);

  // Side 1 branches (k1 - 1 branches)
  const side1Junctions = [];
  for (let i = 1; i < k1; i++) {
    const t = i / k1 + (rng() - 0.5) * (0.2 / k1);
    const idx = Math.max(1, Math.min(mainSpine.length - 2, Math.floor(t * mainSpine.length)));
    side1Junctions.push({ idx, point: mainSpine[idx], t });
  }
  side1Junctions.sort((a, b) => a.idx - b.idx);

  // Side 2 branches (k2 - 1 branches)
  const side2Junctions = [];
  for (let i = 1; i < k2; i++) {
    const t = 1 - (i / k2) + (rng() - 0.5) * (0.2 / k2);
    const idx = Math.max(1, Math.min(mainSpine.length - 2, Math.floor(t * mainSpine.length)));
    side2Junctions.push({ idx, point: mainSpine[idx], t });
  }
  side2Junctions.sort((a, b) => b.idx - a.idx); // Descending order from pB to pA

  // Rim points and branches for Side 1
  const arcLen1 = thetaEnd - thetaStart;
  const rimPoints1 = [pA];
  const side1Branches = [];
  for (let i = 0; i < side1Junctions.length; i++) {
    const angle = thetaStart + (arcLen1 * (i + 1)) / k1 + (rng() - 0.5) * (arcLen1 * 0.1 / k1);
    const q = [cx + Math.cos(angle) * R, cy + Math.sin(angle) * R];
    rimPoints1.push(q);
    const branchPts = subdivideJagged(side1Junctions[i].point, q, 2, rng, 0.25);
    side1Branches.push({ junctionIdx: side1Junctions[i].idx, branchPts, angle });
  }
  rimPoints1.push(pB);

  // Rim points and branches for Side 2
  const thetaStart2 = thetaStart + Math.PI * 2;
  const arcLen2 = thetaStart2 - thetaEnd;
  const rimPoints2 = [pB];
  const side2Branches = [];
  for (let i = 0; i < side2Junctions.length; i++) {
    const angle = thetaEnd + (arcLen2 * (i + 1)) / k2 + (rng() - 0.5) * (arcLen2 * 0.1 / k2);
    const q = [cx + Math.cos(angle) * R, cy + Math.sin(angle) * R];
    rimPoints2.push(q);
    const branchPts = subdivideJagged(side2Junctions[i].point, q, 2, rng, 0.25);
    side2Branches.push({ junctionIdx: side2Junctions[i].idx, branchPts, angle });
  }
  rimPoints2.push(pA);

  const rawShardsPolys = [];
  const crackEdges = [];

  // Register all spine segments between junction points as distinct crack edges
  const allSpineIndices = [0, ...side1Junctions.map(j => j.idx), ...side2Junctions.map(j => j.idx), mainSpine.length - 1];
  allSpineIndices.sort((a, b) => a - b);
  // Deduplicate
  const uniqueSpineIndices = allSpineIndices.filter((idx, i, arr) => i === 0 || idx > arr[i - 1]);

  for (let i = 0; i < uniqueSpineIndices.length - 1; i++) {
    const startIdx = uniqueSpineIndices[i];
    const endIdx = uniqueSpineIndices[i + 1];
    crackEdges.push({
      id: `crack_spine_seg_${i}`,
      points: mainSpine.slice(startIdx, endIdx + 1)
    });
  }

  // Build Side 1 shard polygons
  let prevSpineIdx = 0;
  for (let s = 0; s < k1; s++) {
    const poly = [];
    const nextSpineIdx = s < side1Branches.length ? side1Branches[s].junctionIdx : mainSpine.length - 1;

    for (let j = prevSpineIdx; j <= nextSpineIdx; j++) {
      poly.push([...mainSpine[j]]);
    }

    if (s < side1Branches.length) {
      const bPts = side1Branches[s].branchPts;
      for (let j = 1; j < bPts.length; j++) {
        poly.push([...bPts[j]]);
      }
      crackEdges.push({
        id: `crack_s1_branch_${s}`,
        points: bPts
      });
    }

    const startA = s < side1Branches.length ? side1Branches[s].angle : thetaEnd;
    const endA = s > 0 ? side1Branches[s - 1].angle : thetaStart;
    const arc = getArcPoints(cx, cy, R, endA, startA, 12).reverse();
    for (let j = 1; j < arc.length - 1; j++) {
      poly.push([...arc[j]]);
    }

    if (s > 0) {
      const prevBPts = [...side1Branches[s - 1].branchPts].reverse();
      for (let j = 0; j < prevBPts.length - 1; j++) {
        poly.push([...prevBPts[j]]);
      }
    }

    rawShardsPolys.push(poly);
    prevSpineIdx = nextSpineIdx;
  }

  // Build Side 2 shard polygons
  let prevSpineIdx2 = mainSpine.length - 1;
  for (let s = 0; s < k2; s++) {
    const poly = [];
    const nextSpineIdx = s < side2Branches.length ? side2Branches[s].junctionIdx : 0;

    for (let j = prevSpineIdx2; j >= nextSpineIdx; j--) {
      poly.push([...mainSpine[j]]);
    }

    if (s < side2Branches.length) {
      const bPts = side2Branches[s].branchPts;
      for (let j = 1; j < bPts.length; j++) {
        poly.push([...bPts[j]]);
      }
      crackEdges.push({
        id: `crack_s2_branch_${s}`,
        points: bPts
      });
    }

    const startA = s < side2Branches.length ? side2Branches[s].angle : thetaStart2;
    const endA = s > 0 ? side2Branches[s - 1].angle : thetaEnd;
    const arc = getArcPoints(cx, cy, R, endA, startA, 12).reverse();
    for (let j = 1; j < arc.length - 1; j++) {
      poly.push([...arc[j]]);
    }

    if (s > 0) {
      const prevBPts = [...side2Branches[s - 1].branchPts].reverse();
      for (let j = 0; j < prevBPts.length - 1; j++) {
        poly.push([...prevBPts[j]]);
      }
    }

    rawShardsPolys.push(poly);
    prevSpineIdx2 = nextSpineIdx;
  }

  // Convert polygons into shards with bounds and scattered layout
  const shards = [];
  for (let i = 0; i < rawShardsPolys.length; i++) {
    const poly = rawShardsPolys[i];
    const area = computePolygonArea(poly);
    const centroid = computeCentroid(poly);

    // Initial scattered positions on felt pad (distributed around edges of workbench)
    const scatterAngle = (i / rawShardsPolys.length) * Math.PI * 2 + rng() * 0.4;
    const scatterDist = R * (1.15 + rng() * 0.35);
    const scatteredPos = [
      cx + Math.cos(scatterAngle) * scatterDist,
      cy + Math.sin(scatterAngle) * scatterDist
    ];

    // Compute polygon bounding box
    let sMinX = Infinity, sMaxX = -Infinity;
    let sMinY = Infinity, sMaxY = -Infinity;
    poly.forEach(p => {
      if (p[0] < sMinX) sMinX = p[0];
      if (p[0] > sMaxX) sMaxX = p[0];
      if (p[1] < sMinY) sMinY = p[1];
      if (p[1] > sMaxY) sMaxY = p[1];
    });

    let offX = scatteredPos[0] - centroid[0];
    let offY = scatteredPos[1] - centroid[1];

    // Strictly clamp scatter so shard lies within [margin, canvas - margin]
    const margin = 24;
    offX = Math.max(margin - sMinX, Math.min(canvasWidth - margin - sMaxX, offX));
    offY = Math.max(margin - sMinY, Math.min(canvasHeight - margin - sMaxY, offY));

    shards.push({
      id: `shard_${i}`,
      shardIndex: i,
      polygon: poly,
      area,
      centroid,
      targetSlot: [0, 0],
      currentPos: [offX, offY],
      cleaned: false,
      placed: false,
      snapThreshold: 28
    });
  }

  const totalPieceArea = Math.PI * R * R;

  return {
    pieceId: id,
    radius: R,
    center: [cx, cy],
    totalPieceArea,
    shards,
    crackEdges
  };
}
