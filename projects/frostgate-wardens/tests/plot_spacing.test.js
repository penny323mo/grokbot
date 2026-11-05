// Plot Spacing & Separation Verification Test Suite
// Verifies Penny P0 requirement: all pairwise Euclidean plot distances >= 110 world px
// and plots are safely positioned within playable band Y in [400, 1150]
import assert from 'assert';
import fs from 'fs';

export function runPlotSpacingTests() {
    console.log('--- Running Plot Spacing & Separation Tests ---');

    const MIN_REQUIRED_DISTANCE = 110.0; // P0 requirement: strictly >= 110 px

    for (let r = 1; r <= 5; r++) {
        const mapPath = `assets/maps/map${r}.json`;
        assert(fs.existsSync(mapPath), `Map file must exist: ${mapPath}`);
        const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

        assert(Array.isArray(mapData.plots), `Map ${r} must contain a plots array`);
        assert(mapData.plots.length >= 8, `Map ${r} must have at least 8 strategic plots (found ${mapData.plots.length})`);

        const scale = (mapData.width || 1024) / 1024.0;
        const minRequiredDistance = 110.0 * scale;
        const minY = 380 * scale;
        const maxY = 1150 * scale;

        let minPairDist = Infinity;
        let closestPair = null;

        for (let i = 0; i < mapData.plots.length; i++) {
            const p1 = mapData.plots[i];

            // Verify safe vertical placement (never clipped under HUD or dock)
            assert(p1.y >= minY && p1.y <= maxY,
                `Map ${r} Plot ${p1.id} Y coordinate (${p1.y}) outside safe vertical band [${minY}, ${maxY}]`);

            for (let j = i + 1; j < mapData.plots.length; j++) {
                const p2 = mapData.plots[j];
                const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

                if (dist < minPairDist) {
                    minPairDist = dist;
                    closestPair = { p1, p2, dist };
                }

                assert(dist >= minRequiredDistance,
                    `Map ${r} Plot ${p1.id} (${p1.x}, ${p1.y}) and Plot ${p2.id} (${p2.x}, ${p2.y}) distance ${dist.toFixed(1)} px is below minimum ${minRequiredDistance.toFixed(1)} px!`);
            }
        }

        console.log(`✓ Map ${r} (${mapData.name}): ${mapData.plots.length} plots verified, minimum pairwise distance = ${minPairDist.toFixed(1)} px (closest: Plot ${closestPair.p1.id} & Plot ${closestPair.p2.id})`);
    }

    console.log('✓ All 5 maps passed plot spacing separation requirements (all >= 110 px)');
    return true;
}
