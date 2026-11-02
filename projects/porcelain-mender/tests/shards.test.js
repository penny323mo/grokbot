// tests/shards.test.js
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateShardsForPiece, computePolygonArea } from '../src/engine/shard-generator.js';
import { JOBS_DATA } from '../src/data/jobs.js';

describe('Shard Generator & Puzzle Solvability', () => {
  test('Generates solvable shards for all campaign jobs', () => {
    JOBS_DATA.forEach(job => {
      const result = generateShardsForPiece(job.piece, 390, 390);
      assert.strictEqual(result.shards.length, job.piece.shardsCount, `Shard count mismatch for ${job.id}`);
      assert.ok(result.crackEdges.length >= job.piece.shardsCount, `Crack edges missing for ${job.id}`);

      // Every shard has valid geometry
      let totalShardArea = 0;
      result.shards.forEach((shard, idx) => {
        assert.ok(shard.polygon.length >= 6, `Shard ${idx} polygon too simple`);
        assert.ok(shard.area > 500, `Shard ${idx} has degenerate area: ${shard.area}`);
        assert.ok(!isNaN(shard.centroid[0]) && !isNaN(shard.centroid[1]), `Centroid NaN in shard ${idx}`);

        // Centroid must lie strictly inside polygon bounding box
        let bMinX = Infinity, bMaxX = -Infinity, bMinY = Infinity, bMaxY = -Infinity;
        shard.polygon.forEach(p => {
          if (p[0] < bMinX) bMinX = p[0];
          if (p[0] > bMaxX) bMaxX = p[0];
          if (p[1] < bMinY) bMinY = p[1];
          if (p[1] > bMaxY) bMaxY = p[1];
        });
        assert.ok(
          shard.centroid[0] >= bMinX && shard.centroid[0] <= bMaxX &&
          shard.centroid[1] >= bMinY && shard.centroid[1] <= bMaxY,
          `Centroid outside bbox for ${job.id} shard ${idx}: centroid ${shard.centroid}, bbox [${bMinX}, ${bMaxX}, ${bMinY}, ${bMaxY}]`
        );

        totalShardArea += shard.area;
      });

      // Verification of complete coverage: sum of areas should match circular piece area
      const diffRatio = Math.abs(totalShardArea - result.totalPieceArea) / result.totalPieceArea;
      assert.ok(diffRatio < 0.03, `Coverage gap or overlap detected for ${job.id}: diff ratio ${diffRatio}`);
    });
  });

  test('All scattered shards lie inside the canvas with >= 24px margin', () => {
    const canvasWidth = 720;
    const canvasHeight = 720;
    const margin = 24;

    JOBS_DATA.forEach(job => {
      const result = generateShardsForPiece(job.piece, canvasWidth, canvasHeight);
      result.shards.forEach((shard, idx) => {
        let sMinX = Infinity, sMaxX = -Infinity, sMinY = Infinity, sMaxY = -Infinity;
        shard.polygon.forEach(p => {
          const x = p[0] + shard.currentPos[0];
          const y = p[1] + shard.currentPos[1];
          if (x < sMinX) sMinX = x;
          if (x > sMaxX) sMaxX = x;
          if (y < sMinY) sMinY = y;
          if (y > sMaxY) sMaxY = y;
        });

        assert.ok(
          sMinX >= margin,
          `Shard ${idx} of ${job.id} overflows left: sMinX=${sMinX} < ${margin}`
        );
        assert.ok(
          sMaxX <= canvasWidth - margin,
          `Shard ${idx} of ${job.id} overflows right: sMaxX=${sMaxX} > ${canvasWidth - margin}`
        );
        assert.ok(
          sMinY >= margin,
          `Shard ${idx} of ${job.id} overflows top: sMinY=${sMinY} < ${margin}`
        );
        assert.ok(
          sMaxY <= canvasHeight - margin,
          `Shard ${idx} of ${job.id} overflows bottom: sMaxY=${sMaxY} > ${canvasHeight - margin}`
        );
      });
    });
  });

  test('Snapping rules conform to SPEC (28px auto-snap)', () => {
    const job = JOBS_DATA[0];
    const { shards } = generateShardsForPiece(job.piece, 390, 390);
    const s = shards[0];

    // Target position is [0, 0] offset
    const closeDistance = 22; // < 28px
    const isClose = Math.hypot(closeDistance, 0) <= s.snapThreshold;
    assert.strictEqual(isClose, true, 'Placement within 28px should snap');

    const farDistance = 35; // > 28px
    const isFar = Math.hypot(farDistance, 0) <= s.snapThreshold;
    assert.strictEqual(isFar, false, 'Placement beyond 28px should NOT snap');
  });
});
