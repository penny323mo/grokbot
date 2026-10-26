const { spawn } = require('child_process');
const path = require('path');
const puppeteer = require('/workspace/nightly/shotkit/node_modules/puppeteer-core');

const PORT = 8899;
const URL = `http://127.0.0.1:${PORT}/index.html`;

async function run() {
  console.log('Starting local HTTP server...');
  const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
    cwd: __dirname,
    stdio: 'ignore'
  });

  // Wait 500ms for server to start
  await new Promise(r => setTimeout(r, 500));

  let browser;
  try {
    console.log('Launching headless Chrome...');
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--headless=new']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

    const errors = [];
    const warnings = [];

    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        errors.push(text);
        console.error('Browser console error:', text);
      } else if (type === 'warning') {
        warnings.push(text);
        console.warn('Browser console warning:', text);
      }
    });

    page.on('pageerror', err => {
      errors.push(err.message);
      console.error('Page error:', err.message);
    });

    console.log(`Navigating to ${URL}...`);
    await page.goto(URL, { waitUntil: 'networkidle0' });

    // 1. Verify page title and header
    const title = await page.title();
    console.log('Page title:', title);
    if (!title.includes('盤口實驗室')) {
      throw new Error(`Unexpected page title: ${title}`);
    }

    // 2. Verify NO horizontal scrolling at 390px
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    console.log(`Viewport check: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);
    if (scrollWidth > clientWidth) {
      throw new Error(`Horizontal scroll detected: scrollWidth (${scrollWidth}) > clientWidth (${clientWidth})`);
    }

    // 3. Tab 1 (對賽分析) Verification
    const homeTeam = await page.$eval('#homeTeamName', el => el.textContent.trim());
    const awayTeam = await page.$eval('#awayTeamName', el => el.textContent.trim());
    console.log(`Matchup displayed: ${homeTeam} vs ${awayTeam}`);
    if (!homeTeam || homeTeam === '--' || !awayTeam || awayTeam === '--') {
      throw new Error('Team names not loaded');
    }

    // Check AH table rows
    const ahRows = await page.$$eval('#ahTableBody tr', rows => rows.length);
    console.log(`AH Table rows: ${ahRows}`);
    if (ahRows < 10) {
      throw new Error(`Expected at least 10 AH table rows, got ${ahRows}`);
    }

    // Check Heatmap 7x7 cells
    const hmCells = await page.$$eval('#scoreHeatmap .hm-cell', cells => cells.length);
    console.log(`Score Heatmap cells: ${hmCells}`);
    if (hmCells !== 49) {
      throw new Error(`Expected 49 heatmap cells (7x7), got ${hmCells}`);
    }

    // Tap a heatmap cell and verify detail updates
    await page.click('#scoreHeatmap .hm-cell:nth-child(25)');
    const detailScore = await page.$eval('#hmDetailScore', el => el.textContent.trim());
    console.log('Tapped heatmap cell detail:', detailScore);

    // Swap teams test
    await page.click('#btnSwapTeams');
    const newHomeTeam = await page.$eval('#homeTeamName', el => el.textContent.trim());
    if (newHomeTeam !== awayTeam) {
      throw new Error(`Swap teams failed: expected ${awayTeam}, got ${newHomeTeam}`);
    }
    // Swap back
    await page.click('#btnSwapTeams');

    // Click 2nd fixture in strip
    const fixtureCards = await page.$$('#fixturesList .fixture-card');
    if (fixtureCards.length > 1) {
      await fixtureCards[1].click();
      await new Promise(r => setTimeout(r, 100));
      console.log('Clicked 2nd upcoming fixture');
    }

    // Screenshot Tab 1
    await page.screenshot({ path: path.join(__dirname, 'screenshots', 'iphone390_match.png') });

    // 4. Test Tab 2: 盤口走勢 (Movement & CLV)
    console.log('Testing Tab 2 (盤口走勢)...');
    await page.click('.bottom-nav .nav-tab[data-tab="tab-movement"]');
    await new Promise(r => setTimeout(r, 200));

    const movCards = await page.$$eval('#movementMatchesList .movement-card', c => c.length);
    console.log(`Movement match cards: ${movCards}`);
    if (movCards === 0) {
      throw new Error('No movement cards rendered');
    }

    const overroundText = await page.$eval('#statOverround', el => el.textContent.trim());
    console.log('League average overround:', overroundText);

    // 5. Test Tab 3: 回測 (Walk-forward Backtest)
    console.log('Testing Tab 3 (回測)...');
    await page.click('.bottom-nav .nav-tab[data-tab="tab-backtest"]');
    await new Promise(r => setTimeout(r, 200));

    // Run backtest
    await page.click('#btnRunBacktest');
    await new Promise(r => setTimeout(r, 400));

    const totalBets = await page.$eval('#btTotalBets', el => el.textContent.trim());
    const profitText = await page.$eval('#btProfit', el => el.textContent.trim());
    const roiText = await page.$eval('#btRoi', el => el.textContent.trim());
    console.log(`Backtest results: totalBets=${totalBets}, profit=${profitText}, roi=${roiText}`);

    if (parseInt(totalBets, 10) <= 0) {
      throw new Error('Backtest produced 0 bets');
    }

    // Screenshot Tab 3
    await page.screenshot({ path: path.join(__dirname, 'screenshots', 'iphone390_backtest.png') });

    // 6. Test Tab 4: 球隊戰力 (Teams & Standings)
    console.log('Testing Tab 4 (球隊戰力)...');
    await page.click('.bottom-nav .nav-tab[data-tab="tab-teams"]');
    await new Promise(r => setTimeout(r, 200));

    const standingsRows = await page.$$eval('#standingsTableBody tr', r => r.length);
    console.log(`Standings rows: ${standingsRows}`);
    if (standingsRows < 18) {
      throw new Error(`Expected at least 18 standings rows, got ${standingsRows}`);
    }

    const teamCards = await page.$$eval('#teamCardsGrid .team-power-card', c => c.length);
    console.log(`Team power cards: ${teamCards}`);
    if (teamCards < 18) {
      throw new Error(`Expected at least 18 team cards, got ${teamCards}`);
    }

    // 7. Test Settings Sheet
    console.log('Testing Settings sheet...');
    await page.click('#btnOpenSettings');
    await new Promise(r => setTimeout(r, 200));
    const isSettingsOpen = await page.$eval('#settingsBackdrop', el => el.classList.contains('active'));
    if (!isSettingsOpen) throw new Error('Settings backdrop did not activate');
    await page.click('#btnCloseSettings');
    await new Promise(r => setTimeout(r, 200));

    // 8. Test AH Info Sheet
    console.log('Testing AH Info modal...');
    await page.click('.bottom-nav .nav-tab[data-tab="tab-match"]');
    await new Promise(r => setTimeout(r, 200));
    await page.evaluate(() => document.getElementById('btnAhInfo').scrollIntoView({ block: 'center' }));
    await new Promise(r => setTimeout(r, 100));
    await page.click('#btnAhInfo');
    await new Promise(r => setTimeout(r, 200));
    const isAhOpen = await page.$eval('#ahInfoBackdrop', el => el.classList.contains('active'));
    if (!isAhOpen) throw new Error('AH info backdrop did not activate');
    await page.click('#btnCloseAhInfo');
    await new Promise(r => setTimeout(r, 200));

    // 9. Test League Switching (SP1, I1, D1, F1)
    for (const lg of ['SP1', 'I1', 'D1', 'F1']) {
      console.log(`Testing League switch to ${lg}...`);
      await page.click(`#leagueChips .chip[data-league="${lg}"]`);
      await new Promise(r => setTimeout(r, 150));
      const newH = await page.$eval('#homeTeamName', el => el.textContent.trim());
      console.log(`League ${lg} active matchup home: ${newH}`);
      if (!newH || newH === '--') throw new Error(`League ${lg} failed to load matchup`);
    }

    // Check errors and warnings
    console.log(`Console check: errors=${errors.length}, warnings=${warnings.length}`);
    if (errors.length > 0) {
      throw new Error(`Found ${errors.length} browser errors: ${errors.join('; ')}`);
    }

    console.log('✅ ALL E2E AND BROWSER VERIFICATIONS PASSED PERFECTLY!');
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

run().catch(err => {
  console.error('❌ E2E Test Failed:', err);
  process.exit(1);
});
