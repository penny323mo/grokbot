const puppeteer = require('/workspace/nightly/shotkit/node_modules/puppeteer-core');
const fs = require('fs');
const http = require('http');
const path = require('path');

(async () => {
    const outDir = 'screenshots/review-round-12';
    fs.mkdirSync(outDir, { recursive: true });

    // 1. Static file server
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.jpg': 'image/jpeg'
    };
    const server = http.createServer((req, res) => {
        let reqPath = req.url.split('?')[0];
        if (reqPath === '/') reqPath = '/index.html';
        const filePath = path.join(process.cwd(), reqPath);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath);
            res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
            fs.createReadStream(filePath).pipe(res);
        } else {
            res.writeHead(404);
            res.end('404');
        }
    });

    await new Promise(resolve => server.listen(8085, resolve));
    console.log('Static server listening on port 8085');

    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--autoplay-policy=no-user-gesture-required'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
    });

    let consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    console.log('Navigating to title screen...');
    await page.goto('http://localhost:8085/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: `${outDir}/390-title-screen.png` });

    console.log('\n--- Verifying All 5 Regions Opening Camera & Battle Presentation (390×844) ---');
    for (let r = 1; r <= 5; r++) {
        console.log(`\nTesting Region ${r} on 390×844...`);
        await page.evaluate(async (reg) => {
            if (window.startRegion) await window.startRegion(reg, false);
        }, r);
        await new Promise(r => setTimeout(r, 1200));

        // (a) Opening Camera (strictly before any panning)
        await page.screenshot({ path: `${outDir}/390-r${r}-01-opening.png` });

        const framing = await page.evaluate(() => {
            const cam = window.camera;
            const game = window.game;
            const map = game.map;

            const spireY = map.keep_tip ? map.keep_tip.y : map.castle_pos.y - 280;
            const keepTopScreen = cam.worldToScreen(map.castle_pos.x, spireY);
            const castleScreen = cam.worldToScreen(map.castle_pos.x, map.castle_pos.y);

            const spawns = map.spawns || [map.spawn_pos];
            const spawnScreens = spawns.map(sp => cam.worldToScreen(sp.x, sp.y + 24));

            const renderedW = map.width * cam.zoom;
            const renderedH = map.height * cam.zoom;
            const letterboxed = renderedW < cam.vw - 0.001 || renderedH < cam.vh - 0.001;

            return {
                spireTopY: keepTopScreen.y,
                castleY: castleScreen.y,
                spawnYs: spawnScreens.map(s => s.y),
                zoom: cam.zoom,
                letterboxed,
                hudHeight: cam.hudHeight,
                dockHeight: cam.dockHeight,
                viewportH: cam.vh,
                dockTopY: cam.vh - cam.dockHeight
            };
        });

        console.log(`Region ${r} (390×844) Spire Y=${framing.spireTopY.toFixed(1)}px (HUD=${framing.hudHeight}px), Spawn Y=[${framing.spawnYs.map(y=>y.toFixed(1)).join(', ')}] (Dock=${framing.dockTopY.toFixed(1)}px), Letterboxed=${framing.letterboxed}`);

        // On Region 1: Build two adjacent towers on consecutive plots (Plot 0 and Plot 1)
        // and build a guard post to verify clay guard units!
        if (r === 1) {
            console.log('Building two adjacent towers and guard post...');
            await page.evaluate(() => {
                const game = window.game;
                game.buildTower(0, 'crossbow');
                game.buildTower(1, 'mortar');
                game.buildTower(2, 'guard');
            });
            await new Promise(r => setTimeout(r, 600));
            await page.screenshot({ path: `${outDir}/390-r1-adjacent-towers-and-guards.png` });
            console.log('✓ Captured 390-r1-adjacent-towers-and-guards.png');
        }

        await page.evaluate(() => {
            if (window.returnToTitleScreen) window.returnToTitleScreen();
        });
        await new Promise(r => setTimeout(r, 400));
    }

    console.log('\n--- Verifying Compact Viewport (375×667) ---');
    await page.setViewport({
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
    });
    await new Promise(r => setTimeout(r, 400));

    for (let r = 1; r <= 5; r++) {
        await page.evaluate(async (reg) => {
            if (window.startRegion) await window.startRegion(reg, false);
        }, r);
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: `${outDir}/375-r${r}-01-opening.png` });
        await page.evaluate(() => {
            if (window.returnToTitleScreen) window.returnToTitleScreen();
        });
        await new Promise(r => setTimeout(r, 400));
    }

    console.log('\n=== VERIFICATION SUMMARY ===');
    console.log('Console Errors:', consoleErrors.length === 0 ? '0 (CLEAN)' : consoleErrors);
    await browser.close();
    server.close();
    console.log('Done!');
})();
