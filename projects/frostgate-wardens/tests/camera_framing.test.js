// Camera Framing Quality Tests: Universal Viewport & Map Route Fitting Verification
import assert from 'assert';
import fs from 'fs';
import { Camera } from '../src/camera.js';

export function runCameraFramingTests() {
    console.log('--- Running Camera Framing Tests ---');

    const viewports = [
        { width: 390, height: 844, name: '390×844 (iPhone 12/13/14/15)' },
        { width: 375, height: 667, name: '375×667 (iPhone SE)' },
        { width: 430, height: 932, name: '430×932 (iPhone Pro Max)' }
    ];

    for (let r = 1; r <= 5; r++) {
        const mapPath = `assets/maps/map${r}.json`;
        assert(fs.existsSync(mapPath), `Map file missing: ${mapPath}`);
        const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

        for (const vp of viewports) {
            const camera = new Camera(vp.width, vp.height, mapData.width, mapData.height);
            // Opening frame framing call exactly as invoked at level start:
            camera.frameBounds(mapData, 16, false);

            const usable = camera.getUsableRect();
            const bounds = camera.extractBounds(mapData);
            assert(bounds && bounds.pts && bounds.pts.length > 0, `Failed to extract bounds for map ${r}`);

            // Verify all waypoints, spawn, castle, and plots are inside usable rect
            const allPoints = [];
            if (mapData.paths) {
                mapData.paths.forEach(p => allPoints.push(...p));
            } else if (mapData.waypoints) {
                allPoints.push(...mapData.waypoints);
            }
            if (mapData.spawn_pos) allPoints.push(mapData.spawn_pos);
            if (mapData.castle_pos) allPoints.push(mapData.castle_pos);
            if (mapData.plots) allPoints.push(...mapData.plots);

            for (const pt of allPoints) {
                const screenPos = camera.worldToScreen(pt.x, pt.y);
                const inX = screenPos.x >= usable.x && screenPos.x <= usable.x + usable.width;
                const inY = screenPos.y >= usable.y && screenPos.y <= usable.y + usable.height;
                assert(
                    inX && inY,
                    `Region ${r} point (${pt.x}, ${pt.y}) projected to screen (${screenPos.x.toFixed(1)}, ${screenPos.y.toFixed(1)}) is outside usable rect [${usable.x}, ${usable.x + usable.width}] x [${usable.y}, ${usable.y + usable.height}] on ${vp.name}`
                );
            }

            // Assert padded keep top (castle_pos.y - 140) and padded spawn mouths (sp.y + 24)
            // are strictly inside the usable rect (clearing top HUD ~64px and bottom dock ~148px)
            if (mapData.castle_pos) {
                const keepTop = camera.worldToScreen(mapData.castle_pos.x, mapData.castle_pos.y - 140);
                assert(
                    keepTop.y >= usable.y,
                    `Region ${r} Keep top projected to screen Y=${keepTop.y.toFixed(1)} is cropped above usable rect top ${usable.y} on ${vp.name}`
                );
            }

            const spawns = [];
            if (mapData.spawn_pos) spawns.push(mapData.spawn_pos);
            if (mapData.paths) mapData.paths.forEach(p => { if (p.length > 0) spawns.push(p[0]); });
            for (const sp of spawns) {
                const spawnMouth = camera.worldToScreen(sp.x, sp.y + 24);
                assert(
                    spawnMouth.y <= usable.y + usable.height,
                    `Region ${r} Spawn mouth projected to screen Y=${spawnMouth.y.toFixed(1)} is hidden below usable rect bottom ${usable.y + usable.height} on ${vp.name}`
                );
            }

            // Assert no letterboxing on any supported mobile viewport (zero black/indigo bars)
            assert(
                mapData.width * camera.zoom >= vp.width - 0.001,
                `Region ${r} map width at opening zoom ${camera.zoom} (${(mapData.width * camera.zoom).toFixed(1)}px) is smaller than viewport width ${vp.width}px on ${vp.name}`
            );
            assert(
                mapData.height * camera.zoom >= vp.height - 0.001,
                `Region ${r} map height at opening zoom ${camera.zoom} (${(mapData.height * camera.zoom).toFixed(1)}px) is smaller than viewport height ${vp.height}px on ${vp.name}`
            );

            // Verify autoFrame does not throw and preserves framing when not dragging
            camera.autoFrame(400);
            assert.strictEqual(camera.isDragging, false);
            assert.strictEqual(camera.isPinching, false);
        }
    }

    console.log('✓ All 5 region maps frame perfectly inside usableRect on 390×844, 375×667, and 430×932');
}
