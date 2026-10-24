/**
 * js/app.js - Main Application Logic for Odds Lab (盤口實驗室)
 * Manages UI interactions, data rendering, Dixon-Coles model integration,
 * score heatmap, Asian handicap tables, Kelly calculator,
 * CLV movement tracking, walk-forward backtest canvas chart, and bottom sheets.
 */

(function () {
  'use strict';

  // --- Global Application State ---
  const state = {
    activeLeague: 'E0',
    activeHomeId: null,
    activeAwayId: null,
    selectedFixtureIdx: 0,
    ouLine: 2.5,
    selectedScore: { home: 1, away: 0 },
    activeTab: 'tab-match',
    pickerTarget: 'home', // 'home' or 'away'
    modelCache: {},
    backtestResult: null,
    settings: {
      edgeThreshold: 0.03, // 3%
      kellyFraction: 0.25,
      halfLifeDays: 180,
      marginMethod: 'proportional',
      bankroll: 10000
    }
  };

  // Asian handicap Cantonese line terminology
  const AH_LINE_NAMES = {
    '0': '平手',
    '-0.25': '讓平半',
    '0.25': '受讓平半',
    '-0.5': '讓半球',
    '0.5': '受讓半球',
    '-0.75': '讓半一',
    '0.75': '受讓半一',
    '-1': '讓一球',
    '-1.0': '讓一球',
    '1': '受讓一球',
    '1.0': '受讓一球',
    '-1.25': '讓一球球半',
    '1.25': '受讓一球球半',
    '-1.5': '讓球半',
    '1.5': '受讓球半',
    '-1.75': '讓球半二球',
    '1.75': '受讓球半二球',
    '-2': '讓兩球',
    '-2.0': '讓兩球',
    '2': '受讓兩球',
    '2.0': '受讓兩球'
  };

  function getAhName(line) {
    const key = String(line);
    return AH_LINE_NAMES[key] ? ` (${AH_LINE_NAMES[key]})` : '';
  }

  // --- Storage Helpers ---
  function loadSettings() {
    try {
      const saved = localStorage.getItem('odds_lab_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        state.settings = Object.assign(state.settings, parsed);
      }
    } catch (e) {
      console.warn('Could not load settings from localStorage', e);
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem('odds_lab_settings', JSON.stringify(state.settings));
    } catch (e) {
      console.warn('Could not save settings to localStorage', e);
    }
  }

  // --- Model Fitting & Caching ---
  function getLeagueModel(leagueId) {
    const cacheKey = `${leagueId}_${state.settings.halfLifeDays}`;
    if (state.modelCache[cacheKey]) {
      return state.modelCache[cacheKey];
    }

    const leagueData = window.ODDS_DATA.leagues[leagueId];
    if (!leagueData) return null;

    const model = window.OddsModel.fitDixonColes(leagueData.matches, leagueData.teams.length, {
      halfLifeDays: state.settings.halfLifeDays,
      iterations: 60,
      rho: -0.05
    });

    state.modelCache[cacheKey] = model;
    return model;
  }

  // --- Initialization ---
  function initApp() {
    loadSettings();
    updateSettingsUI();

    if (!window.ODDS_DATA || !window.ODDS_DATA.leagues) {
      console.error('ODDS_DATA is not loaded properly.');
      return;
    }

    // Set Header Data Through Date
    const dateEl = document.getElementById('headerDataDate');
    if (dateEl && window.ODDS_DATA.dataThrough) {
      dateEl.textContent = `數據截至: ${window.ODDS_DATA.dataThrough}`;
    }

    // Bind Navigation & Tab switching
    setupTabs();
    setupLeagueChips();
    setupTeamPickers();
    setupSettingsModal();
    setupAhInfoModal();
    setupKellyCalculatorEvents();
    setupBacktestEvents();

    // Default select league and initial match
    selectLeague('E0');
  }

  // --- Tab Navigation ---
  function setupTabs() {
    const navTabs = document.querySelectorAll('.bottom-nav .nav-tab');
    navTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        if (!targetTab) return;

        navTabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        const pane = document.getElementById(targetTab);
        if (pane) pane.classList.add('active');

        state.activeTab = targetTab;
        onTabActivated(targetTab);
      });
    });
  }

  function onTabActivated(tabId) {
    if (tabId === 'tab-match') {
      renderMatchLab();
    } else if (tabId === 'tab-movement') {
      renderMovementTab();
    } else if (tabId === 'tab-backtest') {
      if (!state.backtestResult) {
        runCurrentBacktest();
      }
    } else if (tabId === 'tab-teams') {
      renderTeamsTab();
    }
  }

  // --- League Chips ---
  function setupLeagueChips() {
    const chips = document.querySelectorAll('#leagueChips .chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const leagueId = chip.getAttribute('data-league');
        selectLeague(leagueId);
      });
    });
  }

  function selectLeague(leagueId) {
    state.activeLeague = leagueId;
    const leagueData = window.ODDS_DATA.leagues[leagueId];
    if (!leagueData) return;

    // Load upcoming fixtures for this league
    renderFixturesList(leagueData);

    // Pick first upcoming fixture or default first two current teams
    if (leagueData.fixtures && leagueData.fixtures.length > 0) {
      loadFixture(0);
    } else {
      const curr = leagueData.currentTeams;
      state.activeHomeId = curr[0] || 0;
      state.activeAwayId = curr[1] || 1;
      state.selectedFixtureIdx = -1;
      renderMatchLab();
    }

    // Populate team select in movement tab
    populateMovementTeamSelect();

    if (state.activeTab === 'tab-movement') {
      renderMovementTab();
    } else if (state.activeTab === 'tab-teams') {
      renderTeamsTab();
    }
  }

  // --- Fixtures Carousel ---
  function renderFixturesList(leagueData) {
    const listEl = document.getElementById('fixturesList');
    const countEl = document.getElementById('fixturesCount');
    if (!listEl) return;

    const fixtures = leagueData.fixtures || [];
    if (countEl) countEl.textContent = `${fixtures.length} 場`;
    listEl.innerHTML = '';

    fixtures.forEach((fix, idx) => {
      const hTeam = leagueData.teams[fix[2]];
      const aTeam = leagueData.teams[fix[3]];
      const hName = hTeam ? hTeam.zh : '主隊';
      const aName = aTeam ? aTeam.zh : '客隊';
      const ahLine = fix[10] !== null ? fix[10] : '--';

      const card = document.createElement('div');
      card.className = `fixture-card ${idx === state.selectedFixtureIdx ? 'selected' : ''}`;
      card.innerHTML = `
        <div class="fix-time">${fix[0].slice(5)} ${fix[1] || ''}</div>
        <div class="fix-teams">${hName} vs ${aName}</div>
        <div class="fix-odds">
          <span>讓球: ${ahLine > 0 ? '+' : ''}${ahLine}</span>
          <span>1X2: ${fix[4] || '--'}</span>
        </div>
      `;
      card.addEventListener('click', () => {
        loadFixture(idx);
      });
      listEl.appendChild(card);
    });
  }

  function loadFixture(idx) {
    const leagueData = window.ODDS_DATA.leagues[state.activeLeague];
    if (!leagueData || !leagueData.fixtures || !leagueData.fixtures[idx]) return;

    state.selectedFixtureIdx = idx;
    const fix = leagueData.fixtures[idx];
    state.activeHomeId = fix[2];
    state.activeAwayId = fix[3];

    // Highlight selected card
    const cards = document.querySelectorAll('#fixturesList .fixture-card');
    cards.forEach((c, i) => {
      c.classList.toggle('selected', i === idx);
    });

    renderMatchLab();
  }

  // --- Match Lab (Tab 1) Rendering ---
  function renderMatchLab() {
    const leagueData = window.ODDS_DATA.leagues[state.activeLeague];
    if (!leagueData) return;

    const homeTeam = leagueData.teams[state.activeHomeId] || { zh: '主隊', name: 'Home' };
    const awayTeam = leagueData.teams[state.activeAwayId] || { zh: '客隊', name: 'Away' };

    // Update Team Names
    const hNameEl = document.getElementById('homeTeamName');
    const hEnEl = document.getElementById('homeTeamEn');
    const aNameEl = document.getElementById('awayTeamName');
    const aEnEl = document.getElementById('awayTeamEn');
    if (hNameEl) hNameEl.textContent = homeTeam.zh;
    if (hEnEl) hEnEl.textContent = homeTeam.name;
    if (aNameEl) aNameEl.textContent = awayTeam.zh;
    if (aEnEl) aEnEl.textContent = awayTeam.name;

    // Get model prediction
    const model = getLeagueModel(state.activeLeague);
    if (!model) return;

    const { lambdaHome, lambdaAway } = model.predict(state.activeHomeId, state.activeAwayId);

    // Update xG Gauge
    const hXgEl = document.getElementById('homeXgVal');
    const aXgEl = document.getElementById('awayXgVal');
    const xgSumEl = document.getElementById('xgSumText');
    const hBarEl = document.getElementById('homeXgBar');
    const aBarEl = document.getElementById('awayXgBar');

    const sumXg = lambdaHome + lambdaAway;
    if (hXgEl) hXgEl.textContent = lambdaHome.toFixed(2);
    if (aXgEl) aXgEl.textContent = lambdaAway.toFixed(2);
    if (xgSumEl) xgSumEl.textContent = `總計 ${sumXg.toFixed(2)} 球`;

    if (hBarEl && aBarEl && sumXg > 0) {
      const hPct = (lambdaHome / sumXg) * 100;
      hBarEl.style.width = `${hPct.toFixed(1)}%`;
      aBarEl.style.width = `${(100 - hPct).toFixed(1)}%`;
    }

    // Score Matrix & Markets
    const matrix = window.OddsModel.calcScoreMatrix(lambdaHome, lambdaAway, model.rho, 10);
    const m1x2 = window.OddsModel.derive1X2(matrix);

    // Get Bookmaker Odds from active fixture if available
    let fixtureOdds = null;
    if (state.selectedFixtureIdx >= 0 && leagueData.fixtures && leagueData.fixtures[state.selectedFixtureIdx]) {
      const fix = leagueData.fixtures[state.selectedFixtureIdx];
      if (fix[2] === state.activeHomeId && fix[3] === state.activeAwayId) {
        fixtureOdds = {
          h1x2: fix[4],
          d1x2: fix[5],
          a1x2: fix[6],
          ouLine: fix[7],
          ouOver: fix[8],
          ouUnder: fix[9],
          ahLine: fix[10],
          ahH: fix[11],
          ahA: fix[12]
        };
      }
    }

    render1X2Grid(m1x2, fixtureOdds);
    renderScoreHeatmap(matrix);
    renderOUMarkets(matrix, fixtureOdds);
    renderAHTable(matrix, fixtureOdds);
    updateKellyCalculator(matrix, m1x2, fixtureOdds);
  }

  // --- 1X2 Market Grid Rendering ---
  function render1X2Grid(m1x2, fixOdds) {
    const grid = document.getElementById('market1x2Grid');
    if (!grid) return;

    let bookieFairProbs = [null, null, null];
    if (fixOdds && fixOdds.h1x2 && fixOdds.d1x2 && fixOdds.a1x2) {
      bookieFairProbs = window.OddsModel.removeMargin(
        [fixOdds.h1x2, fixOdds.d1x2, fixOdds.a1x2],
        state.settings.marginMethod
      );
    }

    const markets = [
      {
        title: '主勝 (1)',
        modelProb: m1x2.home,
        fairOdds: m1x2.fairHome,
        bookieOdds: fixOdds ? fixOdds.h1x2 : null,
        bookieFairProb: bookieFairProbs[0]
      },
      {
        title: '和局 (X)',
        modelProb: m1x2.draw,
        fairOdds: m1x2.fairDraw,
        bookieOdds: fixOdds ? fixOdds.d1x2 : null,
        bookieFairProb: bookieFairProbs[1]
      },
      {
        title: '客勝 (2)',
        modelProb: m1x2.away,
        fairOdds: m1x2.fairAway,
        bookieOdds: fixOdds ? fixOdds.a1x2 : null,
        bookieFairProb: bookieFairProbs[2]
      }
    ];

    grid.innerHTML = '';
    markets.forEach(m => {
      let edge = null;
      let hasValue = false;
      if (m.bookieOdds && m.bookieOdds > 1) {
        edge = m.modelProb * m.bookieOdds - 1;
        hasValue = edge >= state.settings.edgeThreshold;
      }

      const box = document.createElement('div');
      box.className = `market-box ${hasValue ? 'has-edge' : ''}`;
      box.innerHTML = `
        <div class="mb-header">
          <span class="mb-title">${m.title}</span>
          ${hasValue ? '<span class="value-badge">⭐ 值博</span>' : ''}
        </div>
        <div class="mb-prob">${(m.modelProb * 100).toFixed(1)}%</div>
        <div class="mb-prob-bar">
          <div class="mb-prob-fill" style="width: ${(m.modelProb * 100).toFixed(1)}%"></div>
        </div>
        <div class="mb-rows">
          <div class="mb-row">
            <span>模型公平價</span>
            <strong>${m.fairOdds.toFixed(2)}</strong>
          </div>
          <div class="mb-row">
            <span>莊家開出</span>
            <strong>${m.bookieOdds ? m.bookieOdds.toFixed(2) : '--'}</strong>
          </div>
          ${edge !== null ? `
          <div class="mb-row">
            <span>值博優勢</span>
            <span class="edge-pill ${edge > 0 ? 'pos' : 'neg'}">${edge > 0 ? '+' : ''}${(edge * 100).toFixed(1)}%</span>
          </div>` : ''}
        </div>
      `;
      grid.appendChild(box);
    });
  }

  // --- Score Heatmap (7x7) ---
  function renderScoreHeatmap(matrix) {
    const grid = document.getElementById('scoreHeatmap');
    if (!grid) return;

    grid.innerHTML = '';

    // Find max probability in 0..6 grid for color scaling
    let maxP = 0.0001;
    let mostLikelyScore = { h: 1, a: 0, p: 0 };
    for (let h = 0; h <= 6; h++) {
      for (let a = 0; a <= 6; a++) {
        const p = matrix[h][a];
        if (p > maxP) maxP = p;
        if (p > mostLikelyScore.p) {
          mostLikelyScore = { h, a, p };
        }
      }
    }

    // Render cells in row-major order: Y=Home (6 down to 0), X=Away (0 to 6)
    for (let h = 6; h >= 0; h--) {
      for (let a = 0; a <= 6; a++) {
        const prob = matrix[h][a];
        const ratio = Math.min(1.0, prob / maxP);

        // Dynamic background with neon green hue
        const alpha = Math.max(0.06, ratio * 0.75);
        const bgColor = `rgba(0, 255, 135, ${alpha.toFixed(3)})`;
        const isMostLikely = h === mostLikelyScore.h && a === mostLikelyScore.a;
        const isSelected = h === state.selectedScore.home && a === state.selectedScore.away;

        const cell = document.createElement('div');
        cell.className = `hm-cell ${isMostLikely ? 'most-likely' : ''} ${isSelected ? 'active-score' : ''}`;
        cell.style.backgroundColor = bgColor;
        cell.innerHTML = `
          <span class="hm-score-txt">${h}-${a}</span>
          <span class="hm-prob-txt">${(prob * 100).toFixed(1)}%</span>
        `;

        cell.addEventListener('click', () => {
          state.selectedScore = { home: h, away: a };
          document.querySelectorAll('.hm-cell').forEach(c => c.classList.remove('active-score'));
          cell.classList.add('active-score');
          updateHeatmapDetail(h, a, prob);
        });

        grid.appendChild(cell);
      }
    }

    // Default select most likely score if no current selection
    updateHeatmapDetail(state.selectedScore.home, state.selectedScore.away, matrix[state.selectedScore.home][state.selectedScore.away]);

    // Render Top 3 Most Likely Scores
    const topScoresEl = document.getElementById('hmTopScores');
    if (topScoresEl) {
      const topScores = window.OddsModel.deriveMostLikelyScores(matrix, 3);
      topScoresEl.innerHTML = '<span style="font-size:11px;color:var(--text-dim);margin-right:4px;">高概率波膽:</span>';
      topScores.forEach(item => {
        const pill = document.createElement('button');
        pill.className = 'top-score-pill';
        pill.innerHTML = `<strong>${item.score}</strong> (${(item.prob * 100).toFixed(1)}% @${item.fairOdds.toFixed(1)})`;
        pill.addEventListener('click', () => {
          state.selectedScore = { home: item.home, away: item.away };
          renderScoreHeatmap(matrix);
        });
        topScoresEl.appendChild(pill);
      });
    }
  }

  function updateHeatmapDetail(h, a, prob) {
    const scoreEl = document.getElementById('hmDetailScore');
    const probEl = document.getElementById('hmDetailProb');
    const oddsEl = document.getElementById('hmDetailOdds');

    if (scoreEl) scoreEl.textContent = `比分 ${h} - ${a}`;
    if (probEl) probEl.textContent = `${(prob * 100).toFixed(2)}%`;
    if (oddsEl) oddsEl.textContent = (prob > 0 ? (1 / prob).toFixed(2) : '--');
  }

  // --- O/U & BTTS Markets Rendering ---
  function renderOUMarkets(matrix, fixOdds) {
    const ouGrid = document.getElementById('ouMarketGrid');
    const bttsRow = document.getElementById('bttsRow');
    if (!ouGrid || !bttsRow) return;

    const line = state.ouLine;
    const ouData = window.OddsModel.deriveOU(matrix, [line])[line];
    const bttsData = window.OddsModel.deriveBTTS(matrix);

    // Bookmaker odds for OU if line matches 2.5
    let bookieOver = null;
    let bookieUnder = null;
    if (fixOdds && line === 2.5) {
      bookieOver = fixOdds.ouOver;
      bookieUnder = fixOdds.ouUnder;
    }

    let edgeOver = (bookieOver && bookieOver > 1) ? ouData.over * bookieOver - 1 : null;
    let edgeUnder = (bookieUnder && bookieUnder > 1) ? ouData.under * bookieUnder - 1 : null;

    ouGrid.innerHTML = `
      <div class="market-box ${edgeOver >= state.settings.edgeThreshold ? 'has-edge' : ''}">
        <div class="mb-header">
          <span class="mb-title">大波 (Over ${line})</span>
          ${edgeOver >= state.settings.edgeThreshold ? '<span class="value-badge">⭐ 值博</span>' : ''}
        </div>
        <div class="mb-prob">${(ouData.over * 100).toFixed(1)}%</div>
        <div class="mb-rows">
          <div class="mb-row"><span>模型公平價</span><strong>${ouData.overFair.toFixed(2)}</strong></div>
          <div class="mb-row"><span>莊家開出</span><strong>${bookieOver ? bookieOver.toFixed(2) : '--'}</strong></div>
          ${edgeOver !== null ? `<div class="mb-row"><span>值博率</span><span class="edge-pill ${edgeOver > 0 ? 'pos' : 'neg'}">${edgeOver > 0 ? '+' : ''}${(edgeOver * 100).toFixed(1)}%</span></div>` : ''}
        </div>
      </div>
      <div class="market-box ${edgeUnder >= state.settings.edgeThreshold ? 'has-edge' : ''}">
        <div class="mb-header">
          <span class="mb-title">細波 (Under ${line})</span>
          ${edgeUnder >= state.settings.edgeThreshold ? '<span class="value-badge">⭐ 值博</span>' : ''}
        </div>
        <div class="mb-prob">${(ouData.under * 100).toFixed(1)}%</div>
        <div class="mb-rows">
          <div class="mb-row"><span>模型公平價</span><strong>${ouData.underFair.toFixed(2)}</strong></div>
          <div class="mb-row"><span>莊家開出</span><strong>${bookieUnder ? bookieUnder.toFixed(2) : '--'}</strong></div>
          ${edgeUnder !== null ? `<div class="mb-row"><span>值博率</span><span class="edge-pill ${edgeUnder > 0 ? 'pos' : 'neg'}">${edgeUnder > 0 ? '+' : ''}${(edgeUnder * 100).toFixed(1)}%</span></div>` : ''}
        </div>
      </div>
    `;

    bttsRow.innerHTML = `
      <div class="market-box">
        <div class="mb-header"><span class="mb-title">兩隊入球: 是 (Yes)</span></div>
        <div class="mb-prob">${(bttsData.yes * 100).toFixed(1)}%</div>
        <div class="mb-rows">
          <div class="mb-row"><span>模型公平價</span><strong>${bttsData.yesFair.toFixed(2)}</strong></div>
        </div>
      </div>
      <div class="market-box">
        <div class="mb-header"><span class="mb-title">兩隊入球: 否 (No)</span></div>
        <div class="mb-prob">${(bttsData.no * 100).toFixed(1)}%</div>
        <div class="mb-rows">
          <div class="mb-row"><span>模型公平價</span><strong>${bttsData.noFair.toFixed(2)}</strong></div>
        </div>
      </div>
    `;

    // Bind line selector chips
    const chips = document.querySelectorAll('#ouLineChips .chip-sm');
    chips.forEach(c => {
      c.addEventListener('click', () => {
        chips.forEach(x => x.classList.remove('active'));
        c.classList.add('active');
        state.ouLine = parseFloat(c.getAttribute('data-line'));
        renderOUMarkets(matrix, fixOdds);
      });
    });
  }

  // --- Asian Handicap Table Rendering ---
  function renderAHTable(matrix, fixOdds) {
    const tableBody = document.getElementById('ahTableBody');
    const fairBadge = document.getElementById('modelFairAhBadge');
    if (!tableBody) return;

    const ahTableData = window.OddsModel.calcAHTable(matrix, -2.0, 2.0, 0.25);
    const fairLine = ahTableData.fairLine;
    const bookieLine = fixOdds && fixOdds.ahLine !== null ? fixOdds.ahLine : null;

    if (fairBadge) {
      const fairName = getAhName(fairLine);
      fairBadge.textContent = `模型公平盤: ${fairLine > 0 ? '+' : ''}${fairLine}${fairName}`;
    }

    tableBody.innerHTML = '';
    ahTableData.rows.forEach(row => {
      const isFair = Math.abs(row.line - fairLine) < 1e-6;
      const isBookie = bookieLine !== null && Math.abs(row.line - bookieLine) < 1e-6;

      const hp = row.home;
      const tr = document.createElement('tr');
      if (isFair) tr.classList.add('fair-line-row');
      if (isBookie) tr.classList.add('bookie-line-row');

      const lineFormatted = row.line > 0 ? `+${row.line.toFixed(2)}` : row.line.toFixed(2);
      const name = getAhName(row.line);

      tr.innerHTML = `
        <td class="ah-line-tag">
          ${lineFormatted}${name}
          ${isFair ? '<span class="ah-tag-badge model">公平盤</span>' : ''}
          ${isBookie ? '<span class="ah-tag-badge bookie">莊家開盤</span>' : ''}
        </td>
        <td class="th-price"><strong>${row.fairHome < 100 ? row.fairHome.toFixed(2) : '--'}</strong></td>
        <td class="th-price"><strong>${row.fairAway < 100 ? row.fairAway.toFixed(2) : '--'}</strong></td>
        <td>
          <div class="split-pill-row">
            <span class="split-pill" title="贏全">${(hp.win * 100).toFixed(0)}%</span>
            <span class="split-pill" title="贏半">${(hp.halfWin * 100).toFixed(0)}%</span>
            <span class="split-pill" title="走盤">${(hp.push * 100).toFixed(0)}%</span>
            <span class="split-pill" title="輸半">${(hp.halfLoss * 100).toFixed(0)}%</span>
            <span class="split-pill" title="輸全">${(hp.loss * 100).toFixed(0)}%</span>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // --- Kelly Calculator ---
  function setupKellyCalculatorEvents() {
    const marketSel = document.getElementById('kellyMarketSelect');
    const oddsInput = document.getElementById('kellyOddsInput');
    const bankrollInput = document.getElementById('kellyBankrollInput');
    const fractionSlider = document.getElementById('kellyFractionSlider');

    const updateCalc = () => {
      calculateKellyNow();
    };

    if (marketSel) marketSel.addEventListener('change', () => {
      autoPrefillKellyOdds();
      updateCalc();
    });
    if (oddsInput) oddsInput.addEventListener('input', updateCalc);
    if (bankrollInput) bankrollInput.addEventListener('input', () => {
      state.settings.bankroll = parseFloat(bankrollInput.value) || 10000;
      saveSettings();
      updateCalc();
    });
    if (fractionSlider) fractionSlider.addEventListener('input', () => {
      const frac = parseFloat(fractionSlider.value);
      const fracEl = document.getElementById('kellyFractionVal');
      if (fracEl) fracEl.textContent = `${frac.toFixed(2)}x`;
      state.settings.kellyFraction = frac;
      saveSettings();
      updateCalc();
    });
  }

  function updateKellyCalculator(matrix, m1x2, fixOdds) {
    autoPrefillKellyOdds();
    calculateKellyNow();
  }

  function autoPrefillKellyOdds() {
    const marketSel = document.getElementById('kellyMarketSelect');
    const oddsInput = document.getElementById('kellyOddsInput');
    if (!marketSel || !oddsInput) return;

    const val = marketSel.value;
    const leagueData = window.ODDS_DATA.leagues[state.activeLeague];
    const fix = (leagueData && state.selectedFixtureIdx >= 0) ? leagueData.fixtures[state.selectedFixtureIdx] : null;

    let targetOdds = 2.00;
    if (fix) {
      if (val === '1x2_home') targetOdds = fix[4] || 2.0;
      else if (val === '1x2_draw') targetOdds = fix[5] || 3.2;
      else if (val === '1x2_away') targetOdds = fix[6] || 3.5;
      else if (val === 'ou_over') targetOdds = fix[8] || 1.95;
      else if (val === 'ou_under') targetOdds = fix[9] || 1.95;
      else if (val === 'ah_home') targetOdds = fix[11] || 1.90;
      else if (val === 'ah_away') targetOdds = fix[12] || 1.90;
    }
    oddsInput.value = targetOdds.toFixed(2);
  }

  function calculateKellyNow() {
    const marketSel = document.getElementById('kellyMarketSelect');
    const oddsInput = document.getElementById('kellyOddsInput');
    const bankrollInput = document.getElementById('kellyBankrollInput');
    const fractionSlider = document.getElementById('kellyFractionSlider');

    const evEl = document.getElementById('kellyEvVal');
    const stakeEl = document.getElementById('kellyStakeVal');
    const fullEl = document.getElementById('kellyFullVal');

    if (!marketSel || !oddsInput || !bankrollInput) return;

    const marketType = marketSel.value;
    const odds = parseFloat(oddsInput.value) || 2.00;
    const bankroll = parseFloat(bankrollInput.value) || 10000;
    const fraction = parseFloat(fractionSlider.value) || 0.25;

    // Get current model predictions
    const model = getLeagueModel(state.activeLeague);
    if (!model) return;

    const { lambdaHome, lambdaAway } = model.predict(state.activeHomeId, state.activeAwayId);
    const matrix = window.OddsModel.calcScoreMatrix(lambdaHome, lambdaAway, model.rho, 10);
    const m1x2 = window.OddsModel.derive1X2(matrix);
    const ouData = window.OddsModel.deriveOU(matrix, [2.5])[2.5];

    let prob = 0.5;
    let isAH = false;
    let ahProbs = null;

    if (marketType === '1x2_home') prob = m1x2.home;
    else if (marketType === '1x2_draw') prob = m1x2.draw;
    else if (marketType === '1x2_away') prob = m1x2.away;
    else if (marketType === 'ou_over') prob = ouData.over;
    else if (marketType === 'ou_under') prob = ouData.under;
    else if (marketType.startsWith('ah_')) {
      isAH = true;
      const ahLine = 0; // default 0 if no fixture
      const ah = window.OddsModel.calcAHProbs(matrix, ahLine);
      ahProbs = marketType === 'ah_home' ? ah.home : ah.away;
    }

    let kellyRes = null;
    if (isAH && ahProbs) {
      kellyRes = window.OddsModel.calcAHKelly(ahProbs, odds, fraction, 0.5);
    } else {
      kellyRes = window.OddsModel.calcKelly(prob, odds, fraction, 0.5);
    }

    if (evEl) {
      const evPct = kellyRes.edge * 100;
      evEl.textContent = `${evPct > 0 ? '+' : ''}${evPct.toFixed(1)}%`;
      evEl.style.color = evPct > 0 ? 'var(--accent-green)' : 'var(--text-dim)';
    }

    if (fullEl) {
      fullEl.textContent = `${(kellyRes.fullKelly * 100).toFixed(1)}%`;
    }

    if (stakeEl) {
      const stake = kellyRes.recommendedStake(bankroll);
      const stakePct = bankroll > 0 ? (stake / bankroll) * 100 : 0;
      stakeEl.textContent = `$${stake.toLocaleString()} (${stakePct.toFixed(1)}%)`;
      stakeEl.style.color = stake > 0 ? 'var(--accent-green)' : 'var(--text-dim)';
    }
  }

  // --- Tab 2: Market Movement & CLV ---
  function populateMovementTeamSelect() {
    const sel = document.getElementById('movementTeamSelect');
    if (!sel) return;

    const leagueData = window.ODDS_DATA.leagues[state.activeLeague];
    if (!leagueData) return;

    sel.innerHTML = '';
    const currentTeams = leagueData.currentTeams.map(id => leagueData.teams[id]);
    currentTeams.sort((a, b) => a.zh.localeCompare(b.zh, 'zh-HK'));

    currentTeams.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.zh} (${t.name})`;
      if (t.id === state.activeHomeId) opt.selected = true;
      sel.appendChild(opt);
    });

    sel.onchange = () => {
      renderMovementMatches(parseInt(sel.value));
    };
  }

  function renderMovementTab() {
    const sel = document.getElementById('movementTeamSelect');
    const teamId = sel ? parseInt(sel.value) : state.activeHomeId;
    renderMovementMatches(teamId);
    renderLeagueEfficiencyStats();
  }

  function renderMovementMatches(teamId) {
    const listEl = document.getElementById('movementMatchesList');
    if (!listEl) return;

    const leagueData = window.ODDS_DATA.leagues[state.activeLeague];
    if (!leagueData) return;

    const matches = leagueData.matches || [];
    // Find last 10 matches involving teamId
    const teamMatches = [];
    for (let i = matches.length - 1; i >= 0 && teamMatches.length < 10; i--) {
      const m = matches[i];
      if (m[1] === teamId || m[2] === teamId) {
        teamMatches.push(m);
      }
    }

    listEl.innerHTML = '';
    if (teamMatches.length === 0) {
      listEl.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-dim)">暫無比賽數據</div>';
      return;
    }

    teamMatches.forEach(m => {
      const isHome = m[1] === teamId;
      const oppId = isHome ? m[2] : m[1];
      const oppTeam = leagueData.teams[oppId] || { zh: '對手' };
      const thisTeam = leagueData.teams[teamId] || { zh: '本隊' };

      const fthg = m[3];
      const ftag = m[4];
      const thisGoals = isHome ? fthg : ftag;
      const oppGoals = isHome ? ftag : fthg;

      let resultTag = 'draw';
      let resultText = '和';
      if (thisGoals > oppGoals) { resultTag = 'win'; resultText = '贏'; }
      else if (thisGoals < oppGoals) { resultTag = 'loss'; resultText = '輸'; }

      // 1X2 Open vs Close for this team
      const openOdds = isHome ? m[8] : m[10];
      const closeOdds = isHome ? m[11] : m[13];
      const openAH = m[18] !== null ? (isHome ? m[18] : -m[18]) : null;
      const closeAH = m[21] !== null ? (isHome ? m[21] : -m[21]) : null;

      // CLV calculation: compare taken opening odds with closing sharp fair odds
      const sharpClosing = [m[24], m[25], m[26]];
      const selIdx = isHome ? 0 : 2;
      const clv = window.OddsModel.calcCLV(openOdds, sharpClosing, 'proportional', selIdx);
      const clvPct = clv * 100;

      // Movement arrow
      let oddsMoveText = '無變動';
      if (closeOdds && openOdds) {
        if (closeOdds < openOdds) {
          oddsMoveText = `<span class="arrow-down">↘ 降水 (${openOdds.toFixed(2)} → ${closeOdds.toFixed(2)})</span>`;
        } else if (closeOdds > openOdds) {
          oddsMoveText = `<span class="arrow-up">↗ 升水 (${openOdds.toFixed(2)} → ${closeOdds.toFixed(2)})</span>`;
        } else {
          oddsMoveText = `平盤 (${openOdds.toFixed(2)})`;
        }
      }

      let ahMoveText = '--';
      if (openAH !== null && closeAH !== null) {
        if (openAH !== closeAH) {
          ahMoveText = `盤口跳檔: ${openAH > 0 ? '+' : ''}${openAH} → ${closeAH > 0 ? '+' : ''}${closeAH}`;
        } else {
          ahMoveText = `盤口維持: ${openAH > 0 ? '+' : ''}${openAH}`;
        }
      }

      const card = document.createElement('div');
      card.className = 'movement-card';
      card.innerHTML = `
        <div class="mov-header">
          <span>${m[0]} (${isHome ? '主場' : '作客'})</span>
          <span class="clv-pill ${clvPct > 0 ? 'pos' : 'neg'}">CLV: ${clvPct > 0 ? '+' : ''}${clvPct.toFixed(1)}%</span>
        </div>
        <div class="mov-teams-row">
          <span>${isHome ? thisTeam.zh : oppTeam.zh} ${fthg} - ${ftag} ${isHome ? oppTeam.zh : thisTeam.zh}</span>
          <span class="mov-score-badge ${resultTag}">${resultText}</span>
        </div>
        <div class="mov-stats-grid">
          <div class="mov-stat-col">
            <span>獨贏水位走勢</span>
            <strong>${oddsMoveText}</strong>
          </div>
          <div class="mov-stat-col">
            <span>讓球盤口變化</span>
            <strong>${ahMoveText}</strong>
          </div>
        </div>
      `;
      listEl.appendChild(card);
    });
  }

  function renderLeagueEfficiencyStats() {
    const leagueData = window.ODDS_DATA.leagues[state.activeLeague];
    if (!leagueData) return;

    const matches = leagueData.matches || [];
    let sumOverround = 0;
    let ahMoveCount = 0;
    let ahTotal = 0;
    let steamCoverCount = 0;
    let steamTotal = 0;

    matches.forEach(m => {
      // 1X2 close overround
      const ch = m[11], cd = m[12], ca = m[13];
      if (ch && cd && ca) {
        sumOverround += window.OddsModel.calcOverround([ch, cd, ca]);
      }

      // AH movement
      const oLine = m[18];
      const cLine = m[21];
      if (oLine !== null && cLine !== null) {
        ahTotal++;
        if (Math.abs(oLine - cLine) > 1e-6) {
          ahMoveCount++;
          // check which side moved toward
          const goalDiff = m[3] - m[4];
          if (cLine < oLine) {
            // moved toward Home (Home gives more)
            steamTotal++;
            const mult = window.OddsModel.settleAH(goalDiff, cLine, 2.0);
            if (mult > 1.0) steamCoverCount++;
          } else {
            // moved toward Away
            steamTotal++;
            const mult = window.OddsModel.settleAH(-goalDiff, -cLine, 2.0);
            if (mult > 1.0) steamCoverCount++;
          }
        }
      }
    });

    const avgOverround = matches.length > 0 ? (sumOverround / matches.length) * 100 : 105.0;
    const ahMoveRate = ahTotal > 0 ? (ahMoveCount / ahTotal) * 100 : 0;
    const steamCoverRate = steamTotal > 0 ? (steamCoverCount / steamTotal) * 100 : 50.0;

    const elOverround = document.getElementById('statOverround');
    const elAhMove = document.getElementById('statAhMoveRate');
    const elSteam = document.getElementById('statSteamCoverRate');

    if (elOverround) elOverround.textContent = `${avgOverround.toFixed(1)}%`;
    if (elAhMove) elAhMove.textContent = `${ahMoveRate.toFixed(1)}%`;
    if (elSteam) elSteam.textContent = `${steamCoverRate.toFixed(1)}%`;
  }

  // --- Tab 3: Backtest Engine ---
  function setupBacktestEvents() {
    const btnRun = document.getElementById('btnRunBacktest');
    const slider = document.getElementById('btEdgeSlider');
    const valDisplay = document.getElementById('btEdgeVal');

    if (slider && valDisplay) {
      slider.addEventListener('input', () => {
        valDisplay.textContent = `${parseFloat(slider.value).toFixed(1)}%`;
      });
    }

    if (btnRun) {
      btnRun.addEventListener('click', () => {
        runCurrentBacktest();
      });
    }
  }

  function runCurrentBacktest() {
    const leagueSel = document.getElementById('btLeagueSelect');
    const seasonSel = document.getElementById('btSeasonSelect');
    const marketSel = document.getElementById('btMarketSelect');
    const oddsSel = document.getElementById('btOddsTypeSelect');
    const stakingSel = document.getElementById('btStakingSelect');
    const slider = document.getElementById('btEdgeSlider');

    const leagueChoice = leagueSel ? leagueSel.value : 'CURRENT';
    const season = seasonSel ? seasonSel.value : '2526';
    const market = marketSel ? marketSel.value : '1x2';
    const oddsType = oddsSel ? oddsSel.value : 'open';
    const staking = stakingSel ? stakingSel.value : 'flat';
    const edgeThreshold = slider ? parseFloat(slider.value) / 100 : 0.03;

    let targetLeagues = [];
    if (leagueChoice === 'ALL') {
      targetLeagues = ['E0', 'SP1', 'I1', 'D1', 'F1'];
    } else if (leagueChoice === 'CURRENT') {
      targetLeagues = [state.activeLeague];
    } else {
      targetLeagues = [leagueChoice];
    }

    const leagueResults = [];
    let combinedBets = [];
    let combinedCurve = [{ index: 0, bankroll: 100, profit: 0 }];
    let currentBankroll = 100;
    let totalStakedAll = 0;
    let totalReturnAll = 0;
    let totalWinsAll = 0;
    let clvSumAll = 0;
    let beatCloseAll = 0;
    let peak = 100;
    let maxDd = 0;

    targetLeagues.forEach(lgId => {
      const lgData = window.ODDS_DATA.leagues[lgId];
      if (!lgData) return;

      const res = window.OddsModel.runBacktest(lgData.matches, lgData.teams, {
        season,
        market,
        oddsType,
        edgeThreshold,
        staking,
        kellyFraction: state.settings.kellyFraction,
        initialBankroll: 100,
        halfLifeDays: state.settings.halfLifeDays
      });

      leagueResults.push({
        id: lgId,
        name: lgData.name,
        res
      });

      totalStakedAll += res.totalStaked;
      totalReturnAll += res.totalReturn;
      totalWinsAll += res.wins;

      res.bets.forEach(b => {
        combinedBets.push(b);
        currentBankroll += b.profit;
        if (currentBankroll > peak) peak = currentBankroll;
        const dd = (peak - currentBankroll) / peak;
        if (dd > maxDd) maxDd = dd;

        clvSumAll += b.clv / 100;
        if (b.clv > 0) beatCloseAll++;

        combinedCurve.push({
          index: combinedBets.length,
          bankroll: Math.round(currentBankroll * 100) / 100,
          profit: Math.round((currentBankroll - 100) * 100) / 100
        });
      });
    });

    const netProfitAll = totalReturnAll - totalStakedAll;
    const roiAll = totalStakedAll > 0 ? (netProfitAll / totalStakedAll) * 100 : 0;
    const hitRateAll = combinedBets.length > 0 ? (totalWinsAll / combinedBets.length) * 100 : 0;
    const avgClvAll = combinedBets.length > 0 ? (clvSumAll / combinedBets.length) * 100 : 0;
    const beatCloseRateAll = combinedBets.length > 0 ? (beatCloseAll / combinedBets.length) * 100 : 0;

    state.backtestResult = {
      totalBets: combinedBets.length,
      hitRate: hitRateAll,
      profit: netProfitAll,
      roi: roiAll,
      maxDrawdown: maxDd * 100,
      avgCLV: avgClvAll,
      beatCloseRate: beatCloseRateAll,
      totalStaked: totalStakedAll,
      bankrollCurve: combinedCurve,
      leagueResults
    };

    renderBacktestResults(state.backtestResult);
  }

  function renderBacktestResults(res) {
    document.getElementById('btTotalBets').textContent = res.totalBets;
    document.getElementById('btHitRate').textContent = `${res.hitRate.toFixed(1)}%`;

    const profitEl = document.getElementById('btProfit');
    profitEl.textContent = `${res.profit >= 0 ? '+' : ''}${res.profit.toFixed(1)} u`;
    profitEl.style.color = res.profit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';

    const roiEl = document.getElementById('btRoi');
    roiEl.textContent = `${res.roi >= 0 ? '+' : ''}${res.roi.toFixed(1)}%`;
    roiEl.style.color = res.roi >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';

    document.getElementById('btMaxDd').textContent = `${res.maxDrawdown.toFixed(1)}%`;
    document.getElementById('btAvgClv').textContent = `${res.avgCLV >= 0 ? '+' : ''}${res.avgCLV.toFixed(1)}%`;
    document.getElementById('btBeatClose').textContent = `${res.beatCloseRate.toFixed(1)}%`;
    document.getElementById('btTotalStaked').textContent = `${res.totalStaked.toFixed(1)} u`;

    const summaryBadge = document.getElementById('btSummaryBadge');
    if (summaryBadge) {
      summaryBadge.textContent = `${res.totalBets} 注 / ROI ${res.roi >= 0 ? '+' : ''}${res.roi.toFixed(1)}%`;
    }

    // Render Canvas Bankroll Chart
    drawBankrollChart(res.bankrollCurve);

    // Render League Breakdown Table
    const tableBody = document.getElementById('btLeagueTableBody');
    if (tableBody) {
      tableBody.innerHTML = '';
      res.leagueResults.forEach(lr => {
        const r = lr.res;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${lr.name}</strong></td>
          <td>${r.totalBets}</td>
          <td>${r.hitRate.toFixed(1)}%</td>
          <td style="color:${r.profit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">
            ${r.profit >= 0 ? '+' : ''}${r.profit.toFixed(1)} u
          </td>
          <td style="color:${r.roi >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">
            ${r.roi >= 0 ? '+' : ''}${r.roi.toFixed(1)}%
          </td>
          <td>${r.avgCLV >= 0 ? '+' : ''}${r.avgCLV.toFixed(1)}%</td>
        `;
        tableBody.appendChild(tr);
      });
    }
  }

  // --- Canvas Bankroll Chart Drawing ---
  function drawBankrollChart(curve) {
    const canvas = document.getElementById('bankrollChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (!curve || curve.length < 2) {
      ctx.fillStyle = '#8b9bb4';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('無足夠下注數據繪製資金圖表', width / 2, height / 2);
      return;
    }

    const padLeft = 45;
    const padRight = 20;
    const padTop = 20;
    const padBottom = 30;

    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    // Find min and max bankroll
    let minB = 100;
    let maxB = 100;
    curve.forEach(pt => {
      if (pt.bankroll < minB) minB = pt.bankroll;
      if (pt.bankroll > maxB) maxB = pt.bankroll;
    });

    const bRange = Math.max(10, maxB - minB);
    const yMin = minB - bRange * 0.1;
    const yMax = maxB + bRange * 0.1;

    function getX(i) {
      return padLeft + (i / (curve.length - 1)) * plotW;
    }

    function getY(val) {
      return padTop + plotH - ((val - yMin) / (yMax - yMin)) * plotH;
    }

    // Draw Zero / Baseline (100 units)
    const zeroY = getY(100);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padLeft, zeroY);
    ctx.lineTo(width - padRight, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Baseline Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('100u', padLeft - 6, zeroY + 3);

    // Gradient Area Fill under Bankroll Line
    const finalVal = curve[curve.length - 1].bankroll;
    const isProfitable = finalVal >= 100;

    const grad = ctx.createLinearGradient(0, padTop, 0, height - padBottom);
    if (isProfitable) {
      grad.addColorStop(0, 'rgba(0, 255, 135, 0.28)');
      grad.addColorStop(1, 'rgba(0, 255, 135, 0.0)');
    } else {
      grad.addColorStop(0, 'rgba(244, 63, 94, 0.28)');
      grad.addColorStop(1, 'rgba(244, 63, 94, 0.0)');
    }

    ctx.beginPath();
    ctx.moveTo(getX(0), getY(curve[0].bankroll));
    for (let i = 1; i < curve.length; i++) {
      ctx.lineTo(getX(i), getY(curve[i].bankroll));
    }
    ctx.lineTo(getX(curve.length - 1), height - padBottom);
    ctx.lineTo(getX(0), height - padBottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Bankroll Line
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(curve[0].bankroll));
    for (let i = 1; i < curve.length; i++) {
      ctx.lineTo(getX(i), getY(curve[i].bankroll));
    }
    ctx.strokeStyle = isProfitable ? '#00ff87' : '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Y Axis Labels
    ctx.fillStyle = '#8b9bb4';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${yMax.toFixed(0)}u`, padLeft - 6, padTop + 10);
    ctx.fillText(`${yMin.toFixed(0)}u`, padLeft - 6, height - padBottom);

    // X Axis Labels
    ctx.textAlign = 'center';
    ctx.fillText('0', padLeft, height - 10);
    ctx.fillText(`${curve.length - 1} 注`, width - padRight, height - 10);
  }

  // --- Tab 4: Teams & Standings ---
  function renderTeamsTab() {
    renderStandingsTable();
    renderTeamPowerCards();
  }

  function renderStandingsTable() {
    const tableBody = document.getElementById('standingsTableBody');
    if (!tableBody) return;

    const leagueData = window.ODDS_DATA.leagues[state.activeLeague];
    if (!leagueData) return;

    // Compute Standings from 2026-27 season matches
    const currentTeamIds = leagueData.currentTeams;
    const statsMap = {};
    currentTeamIds.forEach(id => {
      statsMap[id] = {
        id,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        gf: 0,
        ga: 0,
        pts: 0,
        form: []
      };
    });

    const s2627Matches = leagueData.matches.filter(m => m[7] === '2627');
    s2627Matches.forEach(m => {
      const h = m[1];
      const a = m[2];
      const hg = m[3];
      const ag = m[4];

      if (statsMap[h]) {
        statsMap[h].played++;
        statsMap[h].gf += hg;
        statsMap[h].ga += ag;
        if (hg > ag) {
          statsMap[h].wins++;
          statsMap[h].pts += 3;
          statsMap[h].form.push('W');
        } else if (hg === ag) {
          statsMap[h].draws++;
          statsMap[h].pts += 1;
          statsMap[h].form.push('D');
        } else {
          statsMap[h].losses++;
          statsMap[h].form.push('L');
        }
      }

      if (statsMap[a]) {
        statsMap[a].played++;
        statsMap[a].gf += ag;
        statsMap[a].ga += hg;
        if (ag > hg) {
          statsMap[a].wins++;
          statsMap[a].pts += 3;
          statsMap[a].form.push('W');
        } else if (ag === hg) {
          statsMap[a].draws++;
          statsMap[a].pts += 1;
          statsMap[a].form.push('D');
        } else {
          statsMap[a].losses++;
          statsMap[a].form.push('L');
        }
      }
    });

    const standings = Object.values(statsMap);
    standings.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      const gdB = b.gf - b.ga;
      const gdA = a.gf - a.ga;
      if (gdB !== gdA) return gdB - gdA;
      return b.gf - a.gf;
    });

    tableBody.innerHTML = '';
    standings.forEach((st, idx) => {
      const team = leagueData.teams[st.id] || { zh: '球隊' };
      const gd = st.gf - st.ga;

      // Last 5 matches pills
      const last5 = st.form.slice(-5);
      const pillsHtml = last5.map(f => {
        const cls = f === 'W' ? 'w' : (f === 'D' ? 'd' : 'l');
        const txt = f === 'W' ? '勝' : (f === 'D' ? '和' : '負');
        return `<span class="form-pill ${cls}" title="${txt}">${txt}</span>`;
      }).join('');

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="td-rank">${idx + 1}</td>
        <td class="td-team">${team.zh}</td>
        <td>${st.played}</td>
        <td>${st.wins}</td>
        <td>${st.draws}</td>
        <td>${st.losses}</td>
        <td>${st.gf}</td>
        <td>${st.ga}</td>
        <td>${gd > 0 ? '+' : ''}${gd}</td>
        <td><strong>${st.pts}</strong></td>
        <td><div class="form-pills">${pillsHtml}</div></td>
      `;

      tr.addEventListener('click', () => {
        // Quick assign as home team and navigate to Tab 1
        state.activeHomeId = st.id;
        document.querySelector('.bottom-nav .nav-tab[data-tab="tab-match"]').click();
      });

      tableBody.appendChild(tr);
    });
  }

  function renderTeamPowerCards() {
    const grid = document.getElementById('teamCardsGrid');
    if (!grid) return;

    const leagueData = window.ODDS_DATA.leagues[state.activeLeague];
    if (!leagueData) return;

    const model = getLeagueModel(state.activeLeague);
    if (!model) return;

    const currentTeams = leagueData.currentTeams.map(id => {
      return {
        id,
        team: leagueData.teams[id],
        alpha: model.alpha[id] || 0,
        beta: model.beta[id] || 0,
        netRating: (model.alpha[id] || 0) - (model.beta[id] || 0)
      };
    });

    currentTeams.sort((a, b) => b.netRating - a.netRating);

    grid.innerHTML = '';
    currentTeams.forEach(item => {
      const t = item.team;
      const card = document.createElement('div');
      card.className = 'team-power-card';

      card.innerHTML = `
        <div class="tpc-header">
          <span class="tpc-name">${t.zh} <small style="font-size:11px;color:var(--text-dim)">(${t.name})</small></span>
          <div class="tpc-actions">
            <button class="tpc-btn btn-set-home">設為主隊</button>
            <button class="tpc-btn btn-set-away">設為客隊</button>
          </div>
        </div>
        <div class="tpc-ratings">
          <div class="tpc-rating-box">
            <span>淨評分</span>
            <strong style="color:${item.netRating >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">
              ${item.netRating >= 0 ? '+' : ''}${item.netRating.toFixed(2)}
            </strong>
          </div>
          <div class="tpc-rating-box">
            <span>進攻力 (α)</span>
            <strong>${item.alpha >= 0 ? '+' : ''}${item.alpha.toFixed(2)}</strong>
          </div>
          <div class="tpc-rating-box">
            <span>防守力 (β)</span>
            <strong>${item.beta >= 0 ? '+' : ''}${item.beta.toFixed(2)}</strong>
          </div>
          <div class="tpc-rating-box">
            <span>預期得球</span>
            <strong>${Math.exp(model.mu + item.alpha).toFixed(2)}</strong>
          </div>
        </div>
      `;

      card.querySelector('.btn-set-home').addEventListener('click', (e) => {
        e.stopPropagation();
        state.activeHomeId = item.id;
        document.querySelector('.bottom-nav .nav-tab[data-tab="tab-match"]').click();
      });

      card.querySelector('.btn-set-away').addEventListener('click', (e) => {
        e.stopPropagation();
        state.activeAwayId = item.id;
        document.querySelector('.bottom-nav .nav-tab[data-tab="tab-match"]').click();
      });

      grid.appendChild(card);
    });
  }

  // --- Team Picker Bottom Sheet ---
  function setupTeamPickers() {
    const btnPickHome = document.getElementById('btnPickHome');
    const btnPickAway = document.getElementById('btnPickAway');
    const btnSwap = document.getElementById('btnSwapTeams');
    const backdrop = document.getElementById('teamPickerBackdrop');
    const btnClose = document.getElementById('btnCloseTeamPicker');
    const searchInput = document.getElementById('teamSearchInput');

    if (btnPickHome) {
      btnPickHome.addEventListener('click', () => {
        openTeamPicker('home');
      });
    }

    if (btnPickAway) {
      btnPickAway.addEventListener('click', () => {
        openTeamPicker('away');
      });
    }

    if (btnSwap) {
      btnSwap.addEventListener('click', () => {
        const tmp = state.activeHomeId;
        state.activeHomeId = state.activeAwayId;
        state.activeAwayId = tmp;
        renderMatchLab();
      });
    }

    if (btnClose) {
      btnClose.addEventListener('click', closeTeamPicker);
    }

    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeTeamPicker();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        renderTeamPickerList(searchInput.value.trim().toLowerCase());
      });
    }
  }

  function openTeamPicker(target) {
    state.pickerTarget = target;
    const title = document.getElementById('teamPickerTitle');
    if (title) {
      title.textContent = target === 'home' ? '選擇主隊' : '選擇客隊';
    }

    const searchInput = document.getElementById('teamSearchInput');
    if (searchInput) searchInput.value = '';

    renderTeamPickerList('');

    const backdrop = document.getElementById('teamPickerBackdrop');
    if (backdrop) {
      backdrop.classList.add('active');
    }
  }

  function closeTeamPicker() {
    const backdrop = document.getElementById('teamPickerBackdrop');
    if (backdrop) {
      backdrop.classList.remove('active');
    }
  }

  function renderTeamPickerList(filterText) {
    const listEl = document.getElementById('teamPickerList');
    if (!listEl) return;

    const leagueData = window.ODDS_DATA.leagues[state.activeLeague];
    if (!leagueData) return;

    const currentTeams = leagueData.currentTeams.map(id => leagueData.teams[id]);
    currentTeams.sort((a, b) => a.zh.localeCompare(b.zh, 'zh-HK'));

    listEl.innerHTML = '';
    currentTeams.forEach(t => {
      if (filterText) {
        const matchZh = t.zh.toLowerCase().includes(filterText);
        const matchEn = t.name.toLowerCase().includes(filterText);
        if (!matchZh && !matchEn) return;
      }

      const item = document.createElement('div');
      item.className = 'team-picker-item';
      item.innerHTML = `
        <span class="tpi-zh">${t.zh}</span>
        <span class="tpi-en">${t.name}</span>
      `;

      item.addEventListener('click', () => {
        if (state.pickerTarget === 'home') {
          state.activeHomeId = t.id;
          if (state.activeAwayId === t.id) {
            // Pick an alternative for away
            const other = leagueData.currentTeams.find(id => id !== t.id);
            state.activeAwayId = other || 0;
          }
        } else {
          state.activeAwayId = t.id;
          if (state.activeHomeId === t.id) {
            const other = leagueData.currentTeams.find(id => id !== t.id);
            state.activeHomeId = other || 0;
          }
        }
        closeTeamPicker();
        renderMatchLab();
      });

      listEl.appendChild(item);
    });
  }

  // --- Settings Bottom Sheet ---
  function setupSettingsModal() {
    const btnOpen = document.getElementById('btnOpenSettings');
    const btnClose = document.getElementById('btnCloseSettings');
    const backdrop = document.getElementById('settingsBackdrop');
    const btnReset = document.getElementById('btnResetSettings');
    const btnSave = document.getElementById('btnSaveSettings');

    const edgeSlider = document.getElementById('settingEdgeSlider');
    const edgeVal = document.getElementById('settingEdgeVal');
    const kellySlider = document.getElementById('settingKellySlider');
    const kellyVal = document.getElementById('settingKellyVal');
    const halfLifeSlider = document.getElementById('settingHalfLifeSlider');
    const halfLifeVal = document.getElementById('settingHalfLifeVal');

    if (btnOpen) btnOpen.addEventListener('click', () => {
      updateSettingsUI();
      backdrop.classList.add('active');
    });

    if (btnClose) btnClose.addEventListener('click', () => {
      backdrop.classList.remove('active');
    });

    if (backdrop) backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.classList.remove('active');
    });

    if (edgeSlider && edgeVal) {
      edgeSlider.addEventListener('input', () => {
        edgeVal.textContent = `${parseFloat(edgeSlider.value).toFixed(1)}%`;
      });
    }

    if (kellySlider && kellyVal) {
      kellySlider.addEventListener('input', () => {
        kellyVal.textContent = `${parseFloat(kellySlider.value).toFixed(2)}x`;
      });
    }

    if (halfLifeSlider && halfLifeVal) {
      halfLifeSlider.addEventListener('input', () => {
        halfLifeVal.textContent = `${parseInt(halfLifeSlider.value, 10)}日`;
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        state.settings = {
          edgeThreshold: 0.03,
          kellyFraction: 0.25,
          halfLifeDays: 180,
          marginMethod: 'proportional',
          bankroll: 10000
        };
        saveSettings();
        state.modelCache = {}; // clear model cache
        updateSettingsUI();
        backdrop.classList.remove('active');
        renderMatchLab();
      });
    }

    if (btnSave) {
      btnSave.addEventListener('click', () => {
        if (edgeSlider) state.settings.edgeThreshold = parseFloat(edgeSlider.value) / 100;
        if (kellySlider) state.settings.kellyFraction = parseFloat(kellySlider.value);
        if (halfLifeSlider) state.settings.halfLifeDays = parseInt(halfLifeSlider.value, 10);

        const methodSel = document.getElementById('settingMarginMethod');
        if (methodSel) state.settings.marginMethod = methodSel.value;

        saveSettings();
        state.modelCache = {}; // clear cache so new half-life takes effect
        backdrop.classList.remove('active');
        renderMatchLab();
      });
    }
  }

  function updateSettingsUI() {
    const edgeSlider = document.getElementById('settingEdgeSlider');
    const edgeVal = document.getElementById('settingEdgeVal');
    const kellySlider = document.getElementById('settingKellySlider');
    const kellyVal = document.getElementById('settingKellyVal');
    const halfLifeSlider = document.getElementById('settingHalfLifeSlider');
    const halfLifeVal = document.getElementById('settingHalfLifeVal');
    const methodSel = document.getElementById('settingMarginMethod');

    if (edgeSlider && edgeVal) {
      const pct = (state.settings.edgeThreshold * 100).toFixed(1);
      edgeSlider.value = pct;
      edgeVal.textContent = `${pct}%`;
    }

    if (kellySlider && kellyVal) {
      kellySlider.value = state.settings.kellyFraction.toFixed(2);
      kellyVal.textContent = `${state.settings.kellyFraction.toFixed(2)}x`;
    }

    if (halfLifeSlider && halfLifeVal) {
      halfLifeSlider.value = state.settings.halfLifeDays;
      halfLifeVal.textContent = `${state.settings.halfLifeDays}日`;
    }

    if (methodSel) {
      methodSel.value = state.settings.marginMethod;
    }
  }

  // --- Asian Handicap Info Modal ---
  function setupAhInfoModal() {
    const btnInfo = document.getElementById('btnAhInfo');
    const btnClose = document.getElementById('btnCloseAhInfo');
    const backdrop = document.getElementById('ahInfoBackdrop');

    if (btnInfo) {
      btnInfo.addEventListener('click', () => {
        backdrop.classList.add('active');
      });
    }

    if (btnClose) {
      btnClose.addEventListener('click', () => {
        backdrop.classList.remove('active');
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.classList.remove('active');
      });
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
