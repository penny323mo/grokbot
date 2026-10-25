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
    selectedLeagueFilter: 'all',
    activeHomeId: null,
    activeAwayId: null,
    selectedFixtureIdx: 0,
    ouLine: 2.5,
    selectedScore: { home: 1, away: 0 },
    selectedScoreManuallySet: false,
    activeTab: 'tab-fixtures',
    pickerTarget: 'home', // 'home' or 'away'
    filterOnlyValue: false,
    selectedMarketFilter: 'all',
    selectedRecFilter: 'all',
    selectedModalFixture: null,
    modelCache: {},
    walkForwardCache: {},
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
  function formatAHLineZh(line) {
    if (line === 0 || Math.abs(line) < 1e-6) return '平手 (0)';
    const abs = Math.abs(line);
    let name = '';
    if (Math.abs(abs - 0.25) < 1e-6) name = '平半';
    else if (Math.abs(abs - 0.5) < 1e-6) name = '半球';
    else if (Math.abs(abs - 0.75) < 1e-6) name = '半一';
    else if (Math.abs(abs - 1.0) < 1e-6) name = '一球';
    else if (Math.abs(abs - 1.25) < 1e-6) name = '一球/球半';
    else if (Math.abs(abs - 1.5) < 1e-6) name = '球半';
    else if (Math.abs(abs - 1.75) < 1e-6) name = '球半/兩球';
    else if (Math.abs(abs - 2.0) < 1e-6) name = '兩球';
    else if (Math.abs(abs - 2.25) < 1e-6) name = '兩球/兩球半';
    else if (Math.abs(abs - 2.5) < 1e-6) name = '兩球半';
    else name = `${abs}球`;

    if (line < 0) return `讓${name} (${line > 0 ? '+' : ''}${line})`;
    return `受讓${name} (+${abs})`;
  }

  function getAhName(line) {
    if (line === 0 || Math.abs(line) < 1e-6) return ' (平手)';
    const abs = Math.abs(line);
    let name = '';
    if (Math.abs(abs - 0.25) < 1e-6) name = line < 0 ? '讓平半' : '受讓平半';
    else if (Math.abs(abs - 0.5) < 1e-6) name = line < 0 ? '讓半球' : '受讓半球';
    else if (Math.abs(abs - 0.75) < 1e-6) name = line < 0 ? '讓半一' : '受讓半一';
    else if (Math.abs(abs - 1.0) < 1e-6) name = line < 0 ? '讓一球' : '受讓一球';
    else if (Math.abs(abs - 1.25) < 1e-6) name = line < 0 ? '讓一球/球半' : '受讓一球/球半';
    else if (Math.abs(abs - 1.5) < 1e-6) name = line < 0 ? '讓球半' : '受讓球半';
    else if (Math.abs(abs - 1.75) < 1e-6) name = line < 0 ? '讓球半/兩球' : '受讓球半/兩球';
    else if (Math.abs(abs - 2.0) < 1e-6) name = line < 0 ? '讓兩球' : '受讓兩球';
    else name = line < 0 ? `讓${abs}球` : `受讓${abs}球`;
    return ` (${name})`;
  }

  // --- Storage & Unified Settings Helpers (Issue 8) ---
  function loadSettings() {
    try {
      const saved = localStorage.getItem('odds_lab_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        state.settings = Object.assign(state.settings, parsed);
      }
    } catch (_) {
      // Ignore storage errors in restricted contexts
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem('odds_lab_settings', JSON.stringify(state.settings));
    } catch (_) {
      // Ignore storage errors in restricted contexts
    }
  }

  function applySettingsToDom() {
    const edgePct = (state.settings.edgeThreshold * 100).toFixed(1);
    const kVal = state.settings.kellyFraction.toFixed(2);
    const hlVal = state.settings.halfLifeDays;
    const bVal = state.settings.bankroll || 10000;
    const method = state.settings.marginMethod || 'proportional';

    // Settings sheet
    const sEdgeSlider = document.getElementById('settingEdgeSlider');
    const sEdgeVal = document.getElementById('settingEdgeVal');
    if (sEdgeSlider) sEdgeSlider.value = edgePct;
    if (sEdgeVal) sEdgeVal.textContent = `${edgePct}%`;

    const sKellySlider = document.getElementById('settingKellySlider');
    const sKellyVal = document.getElementById('settingKellyVal');
    if (sKellySlider) sKellySlider.value = kVal;
    if (sKellyVal) sKellyVal.textContent = `${kVal}x`;

    const sHlSlider = document.getElementById('settingHalfLifeSlider');
    const sHlVal = document.getElementById('settingHalfLifeVal');
    if (sHlSlider) sHlSlider.value = hlVal;
    if (sHlVal) sHlVal.textContent = `${hlVal}日`;

    const sMethod = document.getElementById('settingMarginMethod');
    if (sMethod) sMethod.value = method;

    // Kelly card inputs
    const kBankInput = document.getElementById('kellyBankrollInput');
    if (kBankInput) kBankInput.value = bVal;

    const kFracSlider = document.getElementById('kellyFractionSlider');
    const kFracVal = document.getElementById('kellyFractionVal');
    if (kFracSlider) kFracSlider.value = kVal;
    if (kFracVal) kFracVal.textContent = `${kVal}x`;

    // Backtest edge threshold slider
    const btEdgeSlider = document.getElementById('btEdgeSlider');
    const btEdgeVal = document.getElementById('btEdgeVal');
    if (btEdgeSlider) btEdgeSlider.value = edgePct;
    if (btEdgeVal) btEdgeVal.textContent = `${edgePct}%`;
  }

  // --- Model Fitting & Caching (Issue 2: anchored decay) ---
  function getLeagueModel(leagueId) {
    const anchor = window.ODDS_DATA ? (window.ODDS_DATA.dataThrough || '2026-10-25') : '2026-10-25';
    const cacheKey = `${leagueId}_${state.settings.halfLifeDays}_${anchor}`;
    if (state.modelCache[cacheKey]) {
      return state.modelCache[cacheKey];
    }

    const leagueData = window.ODDS_DATA.leagues[leagueId];
    if (!leagueData) return null;

    const model = window.OddsModel.fitDixonColes(leagueData.matches, leagueData.teams.length, {
      halfLifeDays: state.settings.halfLifeDays,
      anchorDate: anchor,
      iterations: 160,
      rho: -0.05
    });

    state.modelCache[cacheKey] = model;
    return model;
  }

  function getWalkForwardModel(leagueId, asOfDate) {
    const cacheKey = `${leagueId}_${asOfDate}_${state.settings.halfLifeDays}`;
    if (state.walkForwardCache[cacheKey]) {
      return state.walkForwardCache[cacheKey];
    }

    const leagueData = window.ODDS_DATA.leagues[leagueId];
    if (!leagueData) return null;

    const model = window.OddsModel.fitDixonColes(leagueData.matches, leagueData.teams.length, {
      asOfDate,
      halfLifeDays: state.settings.halfLifeDays,
      iterations: 120,
      rho: -0.05
    });

    state.walkForwardCache[cacheKey] = model;
    return model;
  }

  // Active fixture resolver (Issue 9)
  function getActiveFixture() {
    const leagueData = window.ODDS_DATA.leagues[state.activeLeague];
    if (!leagueData || !leagueData.fixtures) return null;

    if (state.selectedFixtureIdx >= 0 && state.selectedFixtureIdx < leagueData.fixtures.length) {
      const fix = leagueData.fixtures[state.selectedFixtureIdx];
      if (fix[2] === state.activeHomeId && fix[3] === state.activeAwayId) {
        return fix;
      }
    }

    // Search for matching fixture
    for (let i = 0; i < leagueData.fixtures.length; i++) {
      const fix = leagueData.fixtures[i];
      if (fix[2] === state.activeHomeId && fix[3] === state.activeAwayId) {
        state.selectedFixtureIdx = i;
        return fix;
      }
    }

    return null;
  }

  // --- Initialization ---
  function initApp() {
    loadSettings();
    applySettingsToDom();

    if (!window.ODDS_DATA || !window.ODDS_DATA.leagues) {
      console.error('ODDS_DATA is not loaded properly.');
      return;
    }

    // Set Header Data Date & Live Badge
    const updateMacauTime = window.OddsModel && window.OddsModel.formatMacauDateTime
      ? window.OddsModel.formatMacauDateTime(window.ODDS_DATA.generatedAt)
      : '';
    const dateEl = document.getElementById('headerDataDate');
    if (dateEl) {
      dateEl.textContent = updateMacauTime
        ? `數據更新於 ${updateMacauTime}（澳門時間）`
        : `數據截至: ${window.ODDS_DATA.dataThrough}`;
    }
    const liveUpdateBadge = document.getElementById('liveDataUpdateBadge');
    if (liveUpdateBadge) {
      liveUpdateBadge.textContent = updateMacauTime
        ? `數據更新於 ${updateMacauTime}（澳門時間）`
        : `數據截至: ${window.ODDS_DATA.dataThrough}`;
    }

    // Render Status Bar (v4)
    renderStatusBar();

    // Bind Navigation & Tab switching
    setupTabs();
    setupV4Events();
    setupLeagueChips();
    setupTeamPickers();
    setupSettingsModal();
    setupAhInfoModal();
    setupTermInfoModal();
    setupOULineChips();
    setupKellyCalculatorEvents();
    setupBacktestEvents();

    // Default select league for secondary tabs
    selectLeague('E0');

    // Render Home Page Live Fixtures
    renderLiveFixturesTab();
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
    if (tabId === 'tab-fixtures') {
      renderLiveFixturesTab();
    } else if (tabId === 'tab-compare') {
      renderCompareTab();
    } else if (tabId === 'tab-record') {
      renderRecordTab();
    } else if (tabId === 'tab-match') {
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

  // --- League Chips Navigation ---
  function setupLeagueChips() {
    const chips = document.querySelectorAll('#leagueChips .chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const leagueId = chip.getAttribute('data-league');
        state.selectedLeagueFilter = leagueId;

        if (state.activeTab === 'tab-fixtures') {
          renderLiveFixturesTab();
        } else {
          if (leagueId === 'all') {
            selectLeague('E0');
          } else {
            selectLeague(leagueId);
          }
        }
      });
    });
  }

  function getFilteredFixtures(leagueData) {
    if (!leagueData || !leagueData.fixtures) return [];
    const now = window.__MOCK_NOW__ || new Date();
    return window.OddsModel.filterFixturesInWindow(leagueData.fixtures, now, 72);
  }

  function selectLeague(leagueId) {
    if (leagueId === 'all') leagueId = 'E0';
    state.activeLeague = leagueId;
    const leagueData = window.ODDS_DATA.leagues[leagueId];
    if (!leagueData) return;

    const filtered = getFilteredFixtures(leagueData);
    if (filtered.length > 0) {
      state.activeHomeId = filtered[0][2];
      state.activeAwayId = filtered[0][3];
      state.selectedFixtureIdx = 0;
    } else {
      const curr = leagueData.currentTeams;
      state.activeHomeId = curr[0] || 0;
      state.activeAwayId = curr[1] || 1;
      state.selectedFixtureIdx = -1;
    }

    // Load upcoming fixtures for this league
    renderFixturesList(leagueData);
    renderMatchLab();

    // Populate team select in movement tab
    populateMovementTeamSelect();

    if (state.activeTab === 'tab-movement') {
      renderMovementTab();
    } else if (state.activeTab === 'tab-teams') {
      renderTeamsTab();
    }
  }

  // ==========================================================================
  // 未來三日實盤 (Home Page: Live Fixtures)
  // ==========================================================================

  function getMacauDateLabel(dateIso, now) {
    const dtf = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Macau',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const nowDateIso = dtf.format(now);

    const dtParts = dateIso.split('-').map(Number);
    const nowParts = nowDateIso.split('-').map(Number);
    const targetUtcMs = Date.UTC(dtParts[0], dtParts[1] - 1, dtParts[2]);
    const nowUtcMs = Date.UTC(nowParts[0], nowParts[1] - 1, nowParts[2]);
    const diffDays = Math.round((targetUtcMs - nowUtcMs) / 86400000);

    const dow = new Date(Date.UTC(dtParts[0], dtParts[1] - 1, dtParts[2])).getUTCDay();
    const dows = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const dowZh = dows[dow];

    let prefix = '';
    if (diffDays === 0) prefix = '今日 ';
    else if (diffDays === 1) prefix = '聽日 ';
    else if (diffDays === 2) prefix = '後日 ';

    return `📅 ${prefix}${dtParts[1]}月${dtParts[2]}日 (${dowZh})`;
  }

  function generateLiveAHAnalysis(matrix, ahLine, ahH, ahA, homeName, awayName, fairLine) {
    const fairLineZh = formatAHLineZh(fairLine);
    if (ahLine === null) {
      return `模型推算公平讓球盤為【${fairLineZh}】。目前莊家未開讓球盤口，可參考模型公平盤位判斷走勢。`;
    }
    const bookieLineZh = formatAHLineZh(ahLine);
    const diff = fairLine - ahLine;

    const ahProbs = window.OddsModel.calcAHProbs(matrix, ahLine);
    const evH = (ahH && ahH > 1) ? ahProbs.evHome(ahH) : 0;
    const evA = (ahA && ahA > 1) ? ahProbs.evAway(ahA) : 0;

    if (diff <= -0.2) {
      return `莊家讓步偏淺：模型公平盤為【${fairLineZh}】，莊家僅開【${bookieLineZh}】。${homeName}實力被莊家低估，主隊讓球上盤具值博空間（模型全贏率 ${(ahProbs.home.win * 100).toFixed(0)}%${evH > 0 ? `，EV +${(evH * 100).toFixed(1)}%` : ''}）。`;
    } else if (diff >= 0.2) {
      return `莊家深開盤口：模型公平盤為【${fairLineZh}】，莊家深開【${bookieLineZh}】。${awayName}受讓具足夠保護空間，下盤值博優勢突出（模型不敗率 ${((ahProbs.away.win + ahProbs.away.halfWin + ahProbs.away.push) * 100).toFixed(0)}%${evA > 0 ? `，EV +${(evA * 100).toFixed(1)}%` : ''}）。`;
    } else {
      return `盤口定位吻合：莊家開盤【${bookieLineZh}】與模型公平盤【${fairLineZh}】相符，盤口平衡客觀，宜以水位細微偏差及走勢作為注碼依據。`;
    }
  }

  function renderLiveFixturesTab() {
    const listEl = document.getElementById('liveFixturesList');
    const emptyEl = document.getElementById('liveEmptyState');
    const badgeEl = document.getElementById('liveFixturesCountBadge');
    const valBadgeEl = document.getElementById('valMatchesCountBadge');
    if (!listEl) return;

    const data = window.ODDS_DATA;
    const now = window.__MOCK_NOW__ || new Date();

    // Check if v4 Macau live fixtures are available
    if (data && data.macauFixtures && data.macauFixtures.length > 0) {
      let fixtures = data.macauFixtures;

      // Update total value matches count
      const totalValCount = fixtures.filter(f => f.bestOpportunity && f.bestOpportunity.ev > 0.03).length;
      if (valBadgeEl) valBadgeEl.textContent = totalValCount;

      // Filter by league
      if (state.selectedLeagueFilter && state.selectedLeagueFilter !== 'all') {
        fixtures = fixtures.filter(f => f.league === state.selectedLeagueFilter);
      }

      // Filter by onlyValue
      if (state.filterOnlyValue) {
        fixtures = fixtures.filter(f => f.bestOpportunity && f.bestOpportunity.ev > 0.03);
      }

      if (badgeEl) {
        badgeEl.textContent = `${fixtures.length} 場實盤`;
      }

      if (fixtures.length === 0) {
        if (emptyEl) {
          const emptyTitle = emptyEl.querySelector('.empty-title');
          const emptyDesc = emptyEl.querySelector('.empty-desc');
          if (emptyTitle) {
            emptyTitle.textContent = state.filterOnlyValue
              ? '目前暫無符合「值博率 > +3%」之實盤賽事'
              : '未來三日暫時冇賽程／賠率';
          }
          if (emptyDesc) {
            emptyDesc.textContent = state.filterOnlyValue
              ? '可切換至「全部盤口」查看其他平手或微利賽程。'
              : 'football-data 通常逢星期二、五更新，澳門彩票逢賽前一至兩日開盤。';
          }
          emptyEl.style.display = 'block';
        }
        listEl.innerHTML = '';
        listEl.style.display = 'none';
        return;
      }

      if (emptyEl) emptyEl.style.display = 'none';
      listEl.style.display = 'flex';
      listEl.innerHTML = '';

      // Group by date / dayLabel
      const groups = {};
      fixtures.forEach(fix => {
        const dKey = fix.dayLabel || fix.date;
        if (!groups[dKey]) groups[dKey] = [];
        groups[dKey].push(fix);
      });

      Object.keys(groups).forEach(dayLabel => {
        const items = groups[dayLabel];
        const dateGroupEl = document.createElement('div');
        dateGroupEl.className = 'live-date-group';

        const dateHeaderEl = document.createElement('div');
        dateHeaderEl.className = 'live-date-header';
        dateHeaderEl.innerHTML = `
          <span class="live-date-title">📅 ${dayLabel}</span>
          <span class="live-date-count">${items.length} 場實盤</span>
        `;
        dateGroupEl.appendChild(dateHeaderEl);

        items.forEach(fix => {
          const cardEl = renderV4LiveFixtureCard(fix);
          dateGroupEl.appendChild(cardEl);
        });

        listEl.appendChild(dateGroupEl);
      });

      return;
    }

    // Fallback to v3 rendering if macauFixtures is absent
    const targetLeagues = state.selectedLeagueFilter === 'all'
      ? ['E0', 'SP1', 'I1', 'D1', 'F1']
      : [state.selectedLeagueFilter];

    const allFixtures = [];
    targetLeagues.forEach(lgId => {
      const lgData = window.ODDS_DATA?.leagues ? window.ODDS_DATA.leagues[lgId] : null;
      if (!lgData || !lgData.fixtures) return;

      const filtered = window.OddsModel.filterFixturesInWindow(lgData.fixtures, now, 72);
      filtered.forEach(fix => {
        const kickoffUtc = window.OddsModel.parseUKTimeToDate(fix[0], fix[1]);
        const macau = window.OddsModel.convertUKToMacau(fix[0], fix[1]);
        if (kickoffUtc && macau) {
          allFixtures.push({
            leagueId: lgId,
            leagueName: lgData.name,
            fixture: fix,
            kickoffUtc,
            macau
          });
        }
      });
    });

    if (badgeEl) {
      badgeEl.textContent = `${allFixtures.length} 場實盤`;
    }

    if (allFixtures.length === 0) {
      if (emptyEl) {
        emptyEl.style.display = 'block';
      }
      listEl.innerHTML = '';
      listEl.style.display = 'none';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    listEl.style.display = 'flex';
    listEl.innerHTML = '';

    allFixtures.sort((a, b) => a.kickoffUtc.getTime() - b.kickoffUtc.getTime());
    const groups = {};
    allFixtures.forEach(item => {
      const dKey = item.macau.macauDate;
      if (!groups[dKey]) groups[dKey] = [];
      groups[dKey].push(item);
    });

    Object.keys(groups).sort().forEach(dateIso => {
      const dateItems = groups[dateIso];
      const dateGroupEl = document.createElement('div');
      dateGroupEl.className = 'live-date-group';
      dateGroupEl.innerHTML = `
        <div class="live-date-header">
          <span class="live-date-title">${getMacauDateLabel(dateIso, now)}</span>
          <span class="live-date-count">${dateItems.length} 場實盤</span>
        </div>
      `;
      dateItems.forEach(item => {
        const cardEl = renderLiveFixtureCard(item, now);
        dateGroupEl.appendChild(cardEl);
      });
      listEl.appendChild(dateGroupEl);
    });
  }

  // --- v4 Macau Live Fixture Card Rendering ---
  function renderV4LiveFixtureCard(fix) {
    const card = document.createElement('div');
    card.className = 'live-fixture-card';
    card.setAttribute('data-fixture-id', fix.id);

    // Spotlight banner for best opportunity
    let spotlightHtml = '';
    if (fix.bestOpportunity) {
      const opp = fix.bestOpportunity;
      const isPos = opp.ev > 0.03;
      spotlightHtml = `
        <div class="match-spotlight-bar" style="${isPos ? '' : 'background:rgba(255,255,255,0.03);border-color:var(--border-subtle);'}">
          <div class="spotlight-info">
            <span class="spotlight-title">
              <span class="${opp.badge.badgeClass}">${opp.badge.label} ${opp.badge.ev_pct >= 0 ? '+' : ''}${opp.badge.ev_pct}%</span>
              ${opp.selection_name} @ ${opp.macau_odds}
            </span>
            <span class="spotlight-desc" style="${isPos ? '' : 'color:var(--text-muted);'}">
              公平價 @${opp.fair_odds} · 建議注碼 ${opp.kelly.stake_units}u (${opp.kelly.fraction_pct}%)
            </span>
          </div>
        </div>
      `;
    }

    // Markets Grid (Filtered by state.selectedMarketFilter)
    const mktFilter = state.selectedMarketFilter || 'all';
    let marketsHtml = '<div class="match-markets-grid">';

    // 1X2 Market
    if (fix.macau && fix.macau.odds_1x2 && (mktFilter === 'all' || mktFilter === '1X2')) {
      const m1 = fix.macau.odds_1x2;
      marketsHtml += `
        <div class="market-row-card">
          <div class="mkt-header-line">
            <span class="mkt-name">🏆 獨贏及和局 (1X2)</span>
            <span class="mkt-margin-pill">澳彩抽水 ${(m1.margin * 100).toFixed(1)}%</span>
          </div>
          <div class="mkt-odds-line">
            <div class="odds-choice-box ${m1.best_sel === 'H' && m1.ev_h > 3 ? 'highlight' : ''}">
              <span class="oc-label">主勝 (1)</span>
              <span class="oc-macau-odds">@${m1.h}</span>
              <span class="oc-fair-odds">公平 @${m1.fair_h}</span>
              <span class="oc-ev ${m1.ev_h >= 0 ? 'pos' : 'neg'}">${m1.ev_h >= 0 ? '+' : ''}${m1.ev_h}%</span>
            </div>
            <div class="odds-choice-box ${m1.best_sel === 'D' && m1.ev_d > 3 ? 'highlight' : ''}">
              <span class="oc-label">和局 (X)</span>
              <span class="oc-macau-odds">@${m1.d}</span>
              <span class="oc-fair-odds">公平 @${m1.fair_d}</span>
              <span class="oc-ev ${m1.ev_d >= 0 ? 'pos' : 'neg'}">${m1.ev_d >= 0 ? '+' : ''}${m1.ev_d}%</span>
            </div>
            <div class="odds-choice-box ${m1.best_sel === 'A' && m1.ev_a > 3 ? 'highlight' : ''}">
              <span class="oc-label">客勝 (2)</span>
              <span class="oc-macau-odds">@${m1.a}</span>
              <span class="oc-fair-odds">公平 @${m1.fair_a}</span>
              <span class="oc-ev ${m1.ev_a >= 0 ? 'pos' : 'neg'}">${m1.ev_a >= 0 ? '+' : ''}${m1.ev_a}%</span>
            </div>
          </div>
        </div>
      `;
    }

    // Asian Handicap Market
    if (fix.macau && fix.macau.main_ah && (mktFilter === 'all' || mktFilter === 'AH')) {
      const mah = fix.macau.main_ah;
      marketsHtml += `
        <div class="market-row-card">
          <div class="mkt-header-line">
            <span class="mkt-name">⚖️ 亞洲讓球盤 (${mah.hcap_disp})</span>
            <span class="mkt-margin-pill">澳彩抽水 ${(mah.margin * 100).toFixed(1)}%</span>
          </div>
          <div class="mkt-odds-line">
            <div class="odds-choice-box ${mah.best_sel === 'H' && mah.ev_h > 3 ? 'highlight' : ''}">
              <span class="oc-label">上盤 (${fix.homeZh})</span>
              <span class="oc-macau-odds">@${mah.h}</span>
              <span class="oc-fair-odds">公平 @${mah.fair_h}</span>
              <span class="oc-ev ${mah.ev_h >= 0 ? 'pos' : 'neg'}">${mah.ev_h >= 0 ? '+' : ''}${mah.ev_h}%</span>
            </div>
            <div class="odds-choice-box ${mah.best_sel === 'A' && mah.ev_a > 3 ? 'highlight' : ''}">
              <span class="oc-label">下盤 (${fix.awayZh})</span>
              <span class="oc-macau-odds">@${mah.a}</span>
              <span class="oc-fair-odds">公平 @${mah.fair_a}</span>
              <span class="oc-ev ${mah.ev_a >= 0 ? 'pos' : 'neg'}">${mah.ev_a >= 0 ? '+' : ''}${mah.ev_a}%</span>
            </div>
          </div>
        </div>
      `;
    }

    // Over/Under Market
    if (fix.macau && fix.macau.main_ou && (mktFilter === 'all' || mktFilter === 'OU')) {
      const mou = fix.macau.main_ou;
      marketsHtml += `
        <div class="market-row-card">
          <div class="mkt-header-line">
            <span class="mkt-name">⚽ 入球大細 (${mou.hcap_disp}球)</span>
            <span class="mkt-margin-pill">澳彩抽水 ${(mou.margin * 100).toFixed(1)}%</span>
          </div>
          <div class="mkt-odds-line">
            <div class="odds-choice-box ${mou.best_sel === 'Over' && mou.ev_o > 3 ? 'highlight' : ''}">
              <span class="oc-label">大波 (>${mou.hcap_disp})</span>
              <span class="oc-macau-odds">@${mou.over}</span>
              <span class="oc-fair-odds">公平 @${mou.fair_o}</span>
              <span class="oc-ev ${mou.ev_o >= 0 ? 'pos' : 'neg'}">${mou.ev_o >= 0 ? '+' : ''}${mou.ev_o}%</span>
            </div>
            <div class="odds-choice-box ${mou.best_sel === 'Under' && mou.ev_u > 3 ? 'highlight' : ''}">
              <span class="oc-label">細波 (<${mou.hcap_disp})</span>
              <span class="oc-macau-odds">@${mou.under}</span>
              <span class="oc-fair-odds">公平 @${mou.fair_u}</span>
              <span class="oc-ev ${mou.ev_u >= 0 ? 'pos' : 'neg'}">${mou.ev_u >= 0 ? '+' : ''}${mou.ev_u}%</span>
            </div>
          </div>
        </div>
      `;
    }
    marketsHtml += '</div>';

    card.innerHTML = `
      <div class="lfc-header">
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="lfc-badge-league ${fix.league}">${fix.leagueName}</span>
          <span class="lfc-kickoff">⏰ ${fix.time} (澳門時間)</span>
        </div>
        <span class="lfc-rel-time" style="color:var(--accent-green);font-size:11px;">🟢 澳彩實時盤口</span>
      </div>

      <div class="lfc-teams-row">
        <div class="lfc-team home">
          <span class="lfc-team-name">${fix.homeZh}</span>
          <span class="lfc-team-en">${fix.home}</span>
        </div>
        <div class="lfc-vs-wrap">
          <span class="lfc-vs-text">VS</span>
          <span class="lfc-xg-badge">xG ${fix.xg.home} : ${fix.xg.away}</span>
        </div>
        <div class="lfc-team away">
          <span class="lfc-team-name">${fix.awayZh}</span>
          <span class="lfc-team-en">${fix.away}</span>
        </div>
      </div>

      ${spotlightHtml}
      ${marketsHtml}

      <button class="btn-deep-dive btn-open-detail" data-fixture-id="${fix.id}">
        📊 查看全莊家對比與盤口剖析 →
      </button>
    `;

    // Click handler to open detail modal
    card.addEventListener('click', () => {
      openMatchDetailModal(fix);
    });

    return card;
  }

  // --- v4 Match Detail Modal ---
  function openMatchDetailModal(fix) {
    state.selectedModalFixture = fix;
    const backdrop = document.getElementById('matchDetailBackdrop');
    const titleEl = document.getElementById('matchDetailTitle');
    const subEl = document.getElementById('matchDetailSub');
    const bodyEl = document.getElementById('matchDetailBody');
    if (!backdrop || !bodyEl) return;

    if (titleEl) titleEl.textContent = `${fix.homeZh} vs ${fix.awayZh}`;
    if (subEl) subEl.textContent = `${fix.leagueName} · ${fix.dayLabel} ${fix.time} (澳門時間) · 澳彩 vs 國際共識`;

    let html = '';

    // 1. Consensus Fair Price & Model Probability
    html += `
      <div class="section-card" style="margin-bottom:12px;background:var(--surface-2);border-color:var(--border-color);">
        <h4 style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">🎯 國際尖端共識線 vs 模型預測概率</h4>
        <div style="display:flex;justify-content:space-between;gap:8px;text-align:center;">
          <div style="flex:1;background:var(--surface-1);padding:6px;border-radius:6px;">
            <div style="font-size:10px;color:var(--text-muted);">主勝 (${fix.homeZh})</div>
            <div style="font-size:14px;font-weight:800;color:var(--accent-green);">${fix.consensus.prob_1x2.h}%</div>
            <div style="font-size:10px;color:var(--text-dim);">公平價 @${fix.consensus.fair_1x2.h}</div>
          </div>
          <div style="flex:1;background:var(--surface-1);padding:6px;border-radius:6px;">
            <div style="font-size:10px;color:var(--text-muted);">和局 (X)</div>
            <div style="font-size:14px;font-weight:800;color:var(--accent-yellow);">${fix.consensus.prob_1x2.d}%</div>
            <div style="font-size:10px;color:var(--text-dim);">公平價 @${fix.consensus.fair_1x2.d}</div>
          </div>
          <div style="flex:1;background:var(--surface-1);padding:6px;border-radius:6px;">
            <div style="font-size:10px;color:var(--text-muted);">客勝 (${fix.awayZh})</div>
            <div style="font-size:14px;font-weight:800;color:var(--accent-cyan);">${fix.consensus.prob_1x2.a}%</div>
            <div style="font-size:10px;color:var(--text-dim);">公平價 @${fix.consensus.fair_1x2.a}</div>
          </div>
        </div>
      </div>
    `;

    // 2. All Books Table
    const books = fix.booksList || [];
    let bestH = fix.macau?.odds_1x2?.h || 0;
    let bestD = fix.macau?.odds_1x2?.d || 0;
    let bestA = fix.macau?.odds_1x2?.a || 0;
    books.forEach(b => {
      const b1 = b["1x2"] || {};
      if (b1.h > bestH) bestH = b1.h;
      if (b1.d > bestD) bestD = b1.d;
      if (b1.a > bestA) bestA = b1.a;
    });

    html += `
      <div class="section-card" style="margin-bottom:12px;background:var(--surface-2);border-color:var(--border-color);">
        <h4 style="font-size:12px;color:var(--text-muted);margin-bottom:6px;">⚖️ 全市場主流莊家賠率對比表 (綠色為全場最高)</h4>
        <div class="books-table-wrap">
          <table class="books-compare-table">
            <thead>
              <tr>
                <th>莊家</th>
                <th>主勝</th>
                <th>和局</th>
                <th>客勝</th>
                <th>抽水率</th>
              </tr>
            </thead>
            <tbody>
              <!-- Macau Slot row -->
              <tr style="background:rgba(244,63,94,0.06);">
                <td style="font-weight:700;color:#fda4af;">🇲🇴 澳門彩票</td>
                <td class="${fix.macau?.odds_1x2?.h === bestH ? 'best-price' : ''}">${fix.macau?.odds_1x2?.h || '--'}</td>
                <td class="${fix.macau?.odds_1x2?.d === bestD ? 'best-price' : ''}">${fix.macau?.odds_1x2?.d || '--'}</td>
                <td class="${fix.macau?.odds_1x2?.a === bestA ? 'best-price' : ''}">${fix.macau?.odds_1x2?.a || '--'}</td>
                <td style="color:#fda4af;">${fix.macau?.odds_1x2 ? (fix.macau.odds_1x2.margin * 100).toFixed(1) + '%' : '--'}</td>
              </tr>
    `;

    books.forEach(b => {
      const b1 = b["1x2"] || {};
      const isPin = b.key === 'pinnacle';
      html += `
        <tr style="${isPin ? 'background:rgba(56,189,248,0.06);' : ''}">
          <td style="font-weight:${isPin ? '700' : '400'};color:${isPin ? 'var(--accent-cyan)' : 'var(--text-main)'};">
            ${isPin ? '⭐ ' : ''}${b.title}
          </td>
          <td class="${b1.h === bestH ? 'best-price' : ''}">${b1.h || '--'}</td>
          <td class="${b1.d === bestD ? 'best-price' : ''}">${b1.d || '--'}</td>
          <td class="${b1.a === bestA ? 'best-price' : ''}">${b1.a || '--'}</td>
          <td>${b1.margin ? b1.margin.toFixed(1) + '%' : '--'}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    // 3. Discrepancies & Outliers
    if (fix.outliers && fix.outliers.length > 0) {
      html += `
        <div class="section-card" style="margin-bottom:12px;background:var(--surface-2);border-color:var(--border-color);">
          <h4 style="font-size:12px;color:var(--accent-yellow);margin-bottom:6px;">⚡ 本場重大賠率破綻 (偏離共識 > +4%)</h4>
          <div style="display:flex;flex-direction:column;gap:6px;">
      `;
      fix.outliers.forEach(ot => {
        html += `
          <div style="display:flex;justify-content:space-between;background:var(--surface-1);padding:6px 10px;border-radius:6px;font-size:12px;">
            <span><strong>${ot.book}</strong> · ${ot.selection === 'H' ? fix.homeZh : (ot.selection === 'D' ? '和局' : fix.awayZh)}</span>
            <span style="color:var(--accent-green);font-weight:700;">@${ot.odds} (+${ot.discrepancy_pct}% 偏差)</span>
          </div>
        `;
      });
      html += `
          </div>
        </div>
      `;
    }

    // 4. Quick Kelly Calculator
    if (fix.bestOpportunity) {
      const opp = fix.bestOpportunity;
      html += `
        <div class="section-card" style="background:var(--surface-2);border-color:var(--border-color);">
          <h4 style="font-size:12px;color:var(--accent-green);margin-bottom:6px;">💡 最佳值博投注建議</h4>
          <p style="font-size:13px;font-weight:700;margin-bottom:4px;">
            ${opp.selection_name} @ ${opp.macau_odds} (公平價 @ ${opp.fair_odds})
          </p>
          <p style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">
            值博率: <strong>+${(opp.ev * 100).toFixed(1)}%</strong> · 建議注碼: <strong>${opp.kelly.stake_units}u (${opp.kelly.fraction_pct}%)</strong>
          </p>
        </div>
      `;
    }

    bodyEl.innerHTML = html;
    backdrop.classList.add('active');
  }

  // --- v4 Bookmaker Comparison Tab ---
  function renderCompareTab() {
    const listEl = document.getElementById('marginBarsList');
    const discEl = document.getElementById('discrepancyList');
    const discBadge = document.getElementById('discrepancyCountBadge');
    if (!listEl) return;

    // 1. Margin comparison bars
    const margins = [
      { name: '⭐ Pinnacle (尖端標竿)', pct: 2.4, class: 'pinnacle', desc: '國際最準線位，超低抽水' },
      { name: '🌐 Bet365 (主流巨頭)', pct: 6.2, class: 'bet365', desc: '綜合型主流莊家標準抽水' },
      { name: '📊 歐洲莊家平均', pct: 7.5, class: 'market', desc: '全市場數十間莊家平均水準' },
      { name: '🇲🇴 澳門彩票 (本站對象)', pct: 10.9, class: 'macau', desc: '抽水最厚，非值博盤絕不可買' }
    ];

    listEl.innerHTML = margins.map(m => `
      <div class="margin-bar-item">
        <div class="mb-header">
          <span>${m.name}</span>
          <span style="font-weight:800;color:var(--text-main);">${m.pct.toFixed(1)}% 抽水</span>
        </div>
        <div class="mb-track">
          <div class="mb-fill ${m.class}" style="width:${(m.pct / 15.0) * 100}%;"></div>
        </div>
        <span style="font-size:10px;color:var(--text-dim);">${m.desc}</span>
      </div>
    `).join('');

    // 2. Discrepancy Matrix
    const fixtures = window.ODDS_DATA.macauFixtures || [];
    const allOutliers = [];
    fixtures.forEach(fix => {
      if (fix.outliers && fix.outliers.length > 0) {
        fix.outliers.forEach(ot => {
          allOutliers.push({
            fix,
            outlier: ot
          });
        });
      }
    });

    if (discBadge) {
      discBadge.textContent = `${allOutliers.length} 個破綻`;
    }

    if (!discEl) return;
    if (allOutliers.length === 0) {
      discEl.innerHTML = `
        <div class="empty-state-card" style="padding:20px;">
          <p style="font-size:12px;color:var(--text-muted);">目前未有偏離共識超過 +4% 之顯著破綻，盤口處於高度均衡狀態。</p>
        </div>
      `;
      return;
    }

    discEl.innerHTML = allOutliers.map(item => {
      const { fix, outlier: ot } = item;
      const selName = ot.selection === 'H' ? fix.homeZh : (ot.selection === 'D' ? '和局' : fix.awayZh);
      return `
        <div class="discrepancy-row" data-match-id="${fix.id}">
          <div class="disc-info">
            <span class="disc-match">${fix.homeZh} vs ${fix.awayZh}</span>
            <span class="disc-mkt">${fix.leagueName} · ${selName} · <strong>${ot.book}</strong></span>
          </div>
          <div class="disc-price-box">
            <span class="disc-odds">@${ot.odds}</span>
            <span class="disc-edge">+${ot.discrepancy_pct}% 偏差</span>
          </div>
        </div>
      `;
    }).join('');

    discEl.querySelectorAll('.discrepancy-row').forEach(row => {
      row.addEventListener('click', () => {
        const mId = row.getAttribute('data-match-id');
        const fix = fixtures.find(f => f.id === mId);
        if (fix) openMatchDetailModal(fix);
      });
    });
  }

  // --- v4 Track Record Tab ---
  function renderRecordTab() {
    const data = window.ODDS_DATA;
    if (!data || !data.trackRecord) return;
    const { summary, bets } = data.trackRecord;

    // Scorecards
    const recTotal = document.getElementById('recTotalBets');
    const recPending = document.getElementById('recPendingCount');
    const recHit = document.getElementById('recHitRate');
    const recWinLoss = document.getElementById('recWinLossDetail');
    const recProfit = document.getElementById('recNetProfit');
    const recStaked = document.getElementById('recStakedTotal');
    const recRoi = document.getElementById('recRoi');
    const recClv = document.getElementById('recAvgClv');

    if (recTotal) recTotal.textContent = summary.total_bets || 0;
    if (recPending) recPending.textContent = `${summary.pending_bets || 0} 場進行中`;
    if (recHit) recHit.textContent = `${summary.hit_rate || 0.0}%`;
    if (recWinLoss) recWinLoss.textContent = `${summary.won || 0}贏 ${summary.half_won || 0}半贏 ${summary.pushed || 0}走 ${summary.lost || 0}輸`;
    if (recProfit) {
      const p = summary.total_profit || 0.0;
      recProfit.textContent = `${p >= 0 ? '+' : ''}${p.toFixed(2)}u`;
      recProfit.style.color = p >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
    }
    if (recStaked) recStaked.textContent = `總下注 ${(summary.total_staked || 0.0).toFixed(1)}u`;
    if (recRoi) {
      const r = summary.roi || 0.0;
      recRoi.textContent = `${r >= 0 ? '+' : ''}${r.toFixed(1)}%`;
      recRoi.style.color = r >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
    }
    if (recClv) recClv.textContent = `平均 CLV: ${summary.avg_clv >= 0 ? '+' : ''}${summary.avg_clv || 0.0}%`;

    // Filter bets
    const listEl = document.getElementById('recordBetsList');
    if (!listEl) return;

    const filter = state.selectedRecFilter || 'all';
    const filteredBets = (bets || []).filter(b => {
      if (filter === 'pending') return b.status === 'pending';
      if (filter === 'settled') return b.status === 'settled';
      return true;
    });

    if (filteredBets.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state-card" style="padding:24px;">
          <p style="font-size:13px;color:var(--text-muted);">目前未有符合篩選條件之推薦注碼。</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filteredBets.map(b => {
      const isSettled = b.status === 'settled';
      let outcomePill = '';
      if (!isSettled) {
        outcomePill = `<span class="rb-pill pending">⏳ 進行中</span>`;
      } else if (b.outcome === 'win') {
        outcomePill = `<span class="rb-pill win">✅ 贏 (+${b.profit_1u}u)</span>`;
      } else if (b.outcome === 'half_win') {
        outcomePill = `<span class="rb-pill half_win">✨ 贏半 (+${b.profit_1u}u)</span>`;
      } else if (b.outcome === 'push') {
        outcomePill = `<span class="rb-pill push">➖ 走盤 (0.00u)</span>`;
      } else if (b.outcome === 'half_loss') {
        outcomePill = `<span class="rb-pill half_loss">⚠️ 輸半 (-0.50u)</span>`;
      } else {
        outcomePill = `<span class="rb-pill loss">❌ 輸 (-1.00u)</span>`;
      }

      const clvText = b.clv !== null && b.clv !== undefined
        ? `<span style="color:${b.clv >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};font-weight:700;">CLV ${b.clv >= 0 ? '+' : ''}${(b.clv * 100).toFixed(1)}%</span>`
        : '--';

      return `
        <div class="record-bet-card">
          <div class="rb-header">
            <span>${b.league_name || b.league} · ${b.kickoff}</span>
            ${outcomePill}
          </div>
          <div class="rb-match">${b.home_zh || b.home} vs ${b.away_zh || b.away}</div>
          <div class="rb-details-line">
            <span style="font-weight:600;color:var(--text-main);">${b.selection_name}</span>
            <span style="font-weight:700;color:var(--accent-cyan);">澳彩 @${b.initial_macau_odds}</span>
          </div>
          <div class="rb-details-line" style="font-size:11px;color:var(--text-muted);">
            <span>初見 EV: <strong style="color:var(--accent-green);">+${(b.initial_ev * 100).toFixed(1)}%</strong></span>
            <span>${clvText}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- v4 Real-time Status Bar ---
  function renderStatusBar() {
    const data = window.ODDS_DATA;
    if (!data) return;

    // Macau Slot status
    const statusMacauVal = document.getElementById('statusMacauVal');
    if (statusMacauVal) {
      const count = data.macauFixtures ? data.macauFixtures.length : 0;
      statusMacauVal.textContent = `實盤 ${count}場`;
    }

    // Consensus / The Odds API status
    const statusConsensusVal = document.getElementById('statusConsensusVal');
    if (statusConsensusVal) {
      const rem = data.sourcesStatus?.the_odds_api?.requests_remaining;
      statusConsensusVal.textContent = rem !== undefined && rem !== null ? `配額 ${rem}/500` : `共識正常`;
    }

    // Overall Health status
    const statusHealthVal = document.getElementById('statusHealthVal');
    const statusHealthDot = document.getElementById('statusHealthDot');
    if (statusHealthVal && statusHealthDot) {
      const isHealthy = data.health?.status === 'healthy';
      statusHealthVal.textContent = isHealthy ? '系統正常' : '有警報';
      statusHealthDot.className = isHealthy ? 'status-dot healthy' : 'status-dot warning';
    }
  }

  // --- v4 Event Bindings ---
  function setupV4Events() {
    // Value toggle
    const btnToggleVal = document.getElementById('btnToggleOnlyValue');
    if (btnToggleVal) {
      btnToggleVal.addEventListener('click', () => {
        state.filterOnlyValue = !state.filterOnlyValue;
        btnToggleVal.classList.toggle('active', state.filterOnlyValue);
        btnToggleVal.setAttribute('aria-pressed', state.filterOnlyValue ? 'true' : 'false');
        renderLiveFixturesTab();
      });
    }

    // Market filter chips
    document.querySelectorAll('.market-chips-wrap .chip').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.market-chips-wrap .chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        state.selectedMarketFilter = btn.getAttribute('data-mkt-filter') || 'all';
        renderLiveFixturesTab();
      });
    });

    // Record filter chips
    document.querySelectorAll('.record-filter-row .chip').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.record-filter-row .chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        state.selectedRecFilter = btn.getAttribute('data-rec-filter') || 'all';
        renderRecordTab();
      });
    });

    // Match detail modal close buttons
    const btnCloseModal = document.getElementById('btnCloseMatchDetail');
    const backdropModal = document.getElementById('matchDetailBackdrop');
    if (btnCloseModal && backdropModal) {
      btnCloseModal.addEventListener('click', () => {
        backdropModal.classList.remove('active');
      });
      backdropModal.addEventListener('click', (e) => {
        if (e.target === backdropModal) backdropModal.classList.remove('active');
      });
    }
  }

  function renderLiveFixtureCard(item, now) {
    const { leagueId, leagueName, fixture: fix, kickoffUtc, macau } = item;
    const leagueData = window.ODDS_DATA.leagues[leagueId];
    const homeTeam = leagueData.teams[fix[2]] || { zh: '主隊', name: 'Home' };
    const awayTeam = leagueData.teams[fix[3]] || { zh: '客隊', name: 'Away' };

    // Model prediction
    const model = getLeagueModel(leagueId);
    let lambdaHome = 1.3, lambdaAway = 1.1;
    if (model) {
      const pred = model.predict(fix[2], fix[3]);
      lambdaHome = pred.lambdaHome;
      lambdaAway = pred.lambdaAway;
    }
    const matrix = window.OddsModel.calcScoreMatrix(lambdaHome, lambdaAway, model ? model.rho : -0.05, 10);
    const m1x2 = window.OddsModel.derive1X2(matrix);
    const mOU = window.OddsModel.deriveOU(matrix, [2.5])[2.5];
    const ahTable = window.OddsModel.calcAHTable(matrix, -2.5, 2.5, 0.25);
    const modelFairLine = ahTable.fairLine;

    // Market Odds
    const b1x2_h = fix[4];
    const b1x2_d = fix[5];
    const b1x2_a = fix[6];
    const b_ou_o = fix[8];
    const b_ou_u = fix[9];
    const ahLine = fix[10];
    const b_ah_h = fix[11];
    const b_ah_a = fix[12];

    // Value calculations
    const val1x2_h = (b1x2_h && b1x2_h > 1) ? (m1x2.home * b1x2_h - 1) : null;
    const val1x2_d = (b1x2_d && b1x2_d > 1) ? (m1x2.draw * b1x2_d - 1) : null;
    const val1x2_a = (b1x2_a && b1x2_a > 1) ? (m1x2.away * b1x2_a - 1) : null;

    const val_ou_o = (b_ou_o && b_ou_o > 1) ? (mOU.over * b_ou_o - 1) : null;
    const val_ou_u = (b_ou_u && b_ou_u > 1) ? (mOU.under * b_ou_u - 1) : null;

    let ahProbs = null;
    let fair_ah_h = null;
    let fair_ah_a = null;
    let val_ah_h = null;
    let val_ah_a = null;

    if (ahLine !== null) {
      ahProbs = window.OddsModel.calcAHProbs(matrix, ahLine);
      fair_ah_h = ahProbs.fairHome;
      fair_ah_a = ahProbs.fairAway;
      if (b_ah_h && b_ah_h > 1) val_ah_h = ahProbs.evHome(b_ah_h);
      if (b_ah_a && b_ah_a > 1) val_ah_a = ahProbs.evAway(b_ah_a);
    }

    // Kelly Recommendation
    const kFrac = state.settings.kellyFraction || 0.25;
    const bankroll = state.settings.bankroll || 10000;
    const candidateBets = [];

    if (b1x2_h > 1 && val1x2_h > 0) {
      const k = window.OddsModel.calcKelly(m1x2.home, b1x2_h, kFrac);
      candidateBets.push({ name: `主勝 (${homeTeam.zh})`, odds: b1x2_h, edge: val1x2_h, fracKelly: k.fracKelly, stake: k.recommendedStake(bankroll) });
    }
    if (b1x2_d > 1 && val1x2_d > 0) {
      const k = window.OddsModel.calcKelly(m1x2.draw, b1x2_d, kFrac);
      candidateBets.push({ name: '和局 (X)', odds: b1x2_d, edge: val1x2_d, fracKelly: k.fracKelly, stake: k.recommendedStake(bankroll) });
    }
    if (b1x2_a > 1 && val1x2_a > 0) {
      const k = window.OddsModel.calcKelly(m1x2.away, b1x2_a, kFrac);
      candidateBets.push({ name: `客勝 (${awayTeam.zh})`, odds: b1x2_a, edge: val1x2_a, fracKelly: k.fracKelly, stake: k.recommendedStake(bankroll) });
    }
    if (b_ou_o > 1 && val_ou_o > 0) {
      const k = window.OddsModel.calcKelly(mOU.over, b_ou_o, kFrac);
      candidateBets.push({ name: '大波 (Over 2.5)', odds: b_ou_o, edge: val_ou_o, fracKelly: k.fracKelly, stake: k.recommendedStake(bankroll) });
    }
    if (b_ou_u > 1 && val_ou_u > 0) {
      const k = window.OddsModel.calcKelly(mOU.under, b_ou_u, kFrac);
      candidateBets.push({ name: '細波 (Under 2.5)', odds: b_ou_u, edge: val_ou_u, fracKelly: k.fracKelly, stake: k.recommendedStake(bankroll) });
    }
    if (ahLine !== null && ahProbs) {
      if (b_ah_h > 1 && val_ah_h > 0) {
        const k = window.OddsModel.calcAHKelly(ahProbs.home, b_ah_h, kFrac);
        candidateBets.push({ name: `讓球主隊 (${homeTeam.zh} ${ahLine > 0 ? '+' : ''}${ahLine})`, odds: b_ah_h, edge: val_ah_h, fracKelly: k.fracKelly, stake: k.recommendedStake(bankroll) });
      }
      if (b_ah_a > 1 && val_ah_a > 0) {
        const k = window.OddsModel.calcAHKelly(ahProbs.away, b_ah_a, kFrac);
        candidateBets.push({ name: `讓球客隊 (${awayTeam.zh} ${-ahLine > 0 ? '+' : ''}${-ahLine})`, odds: b_ah_a, edge: val_ah_a, fracKelly: k.fracKelly, stake: k.recommendedStake(bankroll) });
      }
    }

    candidateBets.sort((a, b) => b.edge - a.edge);
    const bestBet = candidateBets.length > 0 && candidateBets[0].edge >= 0.01 ? candidateBets[0] : null;

    // Relative countdown label
    const hoursLeft = Math.max(0, Math.round((kickoffUtc.getTime() - now.getTime()) / (3600 * 1000)));
    const relTimeText = hoursLeft < 1 ? '即將開賽' : `約 ${hoursLeft} 小時後開賽`;

    const edgeThresh = state.settings.edgeThreshold || 0.03;

    function formatEdgePill(edgeVal) {
      if (edgeVal === null || isNaN(edgeVal)) {
        return '<span class="loc-edge-pill negative">--</span>';
      }
      const pct = (edgeVal * 100).toFixed(1);
      if (edgeVal >= edgeThresh) {
        return `<span class="loc-edge-pill positive">🔥 +${pct}% 值博</span>`;
      } else if (edgeVal > 0) {
        return `<span class="loc-edge-pill positive">+${pct}%</span>`;
      }
      return `<span class="loc-edge-pill negative">${pct}%</span>`;
    }

    const card = document.createElement('div');
    card.className = 'live-fixture-card';
    card.innerHTML = `
      <div class="lfc-header">
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="lfc-badge-league ${leagueId}">${leagueName}</span>
          <span class="lfc-kickoff">⏰ ${macau.macauTime} (澳門時間)</span>
        </div>
        <span class="lfc-rel-time">${relTimeText}</span>
      </div>

      <div class="lfc-teams-row">
        <div class="lfc-team home">
          <span class="lfc-team-name">${homeTeam.zh}</span>
          <span class="lfc-team-en">${homeTeam.name}</span>
        </div>
        <div class="lfc-vs-wrap">
          <span class="lfc-vs-text">VS</span>
          <span class="lfc-xg-badge">xG ${lambdaHome.toFixed(2)} : ${lambdaAway.toFixed(2)}</span>
        </div>
        <div class="lfc-team away">
          <span class="lfc-team-name">${awayTeam.zh}</span>
          <span class="lfc-team-en">${awayTeam.name}</span>
        </div>
      </div>

      <div class="lfc-markets-container">
        <!-- 1X2 Market -->
        <div class="lfc-market-group">
          <div class="lfc-market-title">
            <span>🏆 獨贏及和局 (1X2)</span>
            <span style="font-size:10px;color:var(--text-dim);">開盤 vs 公平價</span>
          </div>
          <div class="lfc-market-grid-3">
            <div class="lfc-odds-cell ${val1x2_h >= edgeThresh ? 'has-value' : ''}">
              <div class="loc-label"><span>主勝 (1)</span></div>
              <div class="loc-market-odds">${b1x2_h ? '@' + b1x2_h.toFixed(2) : '--'}</div>
              <div class="loc-fair-odds">公平 @${m1x2.fairHome < 100 ? m1x2.fairHome.toFixed(2) : '--'}</div>
              ${formatEdgePill(val1x2_h)}
            </div>
            <div class="lfc-odds-cell ${val1x2_d >= edgeThresh ? 'has-value' : ''}">
              <div class="loc-label"><span>和局 (X)</span></div>
              <div class="loc-market-odds">${b1x2_d ? '@' + b1x2_d.toFixed(2) : '--'}</div>
              <div class="loc-fair-odds">公平 @${m1x2.fairDraw < 100 ? m1x2.fairDraw.toFixed(2) : '--'}</div>
              ${formatEdgePill(val1x2_d)}
            </div>
            <div class="lfc-odds-cell ${val1x2_a >= edgeThresh ? 'has-value' : ''}">
              <div class="loc-label"><span>客勝 (2)</span></div>
              <div class="loc-market-odds">${b1x2_a ? '@' + b1x2_a.toFixed(2) : '--'}</div>
              <div class="loc-fair-odds">公平 @${m1x2.fairAway < 100 ? m1x2.fairAway.toFixed(2) : '--'}</div>
              ${formatEdgePill(val1x2_a)}
            </div>
          </div>
        </div>

        <!-- O/U 2.5 Market -->
        <div class="lfc-market-group">
          <div class="lfc-market-title">
            <span>⚽ 入球大細 (2.5 球)</span>
            <span style="font-size:10px;color:var(--text-dim);">總入球預期 ${(lambdaHome + lambdaAway).toFixed(2)} 球</span>
          </div>
          <div class="lfc-market-grid-2">
            <div class="lfc-odds-cell ${val_ou_o >= edgeThresh ? 'has-value' : ''}">
              <div class="loc-label"><span>大波 (Over 2.5)</span></div>
              <div class="loc-market-odds">${b_ou_o ? '@' + b_ou_o.toFixed(2) : '--'}</div>
              <div class="loc-fair-odds">公平 @${mOU.fairOver < 100 ? mOU.fairOver.toFixed(2) : '--'}</div>
              ${formatEdgePill(val_ou_o)}
            </div>
            <div class="lfc-odds-cell ${val_ou_u >= edgeThresh ? 'has-value' : ''}">
              <div class="loc-label"><span>細波 (Under 2.5)</span></div>
              <div class="loc-market-odds">${b_ou_u ? '@' + b_ou_u.toFixed(2) : '--'}</div>
              <div class="loc-fair-odds">公平 @${mOU.fairUnder < 100 ? mOU.fairUnder.toFixed(2) : '--'}</div>
              ${formatEdgePill(val_ou_u)}
            </div>
          </div>
        </div>

        <!-- Asian Handicap Market -->
        <div class="lfc-market-group">
          <div class="lfc-market-title">
            <span>⚖️ 亞洲讓球盤 (AH)</span>
            <span style="font-size:10px;color:var(--accent-cyan);">模型公平盤: ${formatAHLineZh(modelFairLine)}</span>
          </div>
          <div class="lfc-market-grid-2">
            <div class="lfc-odds-cell ${val_ah_h >= edgeThresh ? 'has-value' : ''}">
              <div class="loc-label">
                <span>主隊 ${ahLine !== null ? (ahLine > 0 ? '+' : '') + ahLine : ''}</span>
              </div>
              <div class="loc-market-odds">${b_ah_h ? '@' + b_ah_h.toFixed(2) : (ahLine !== null ? '--' : '未開盤')}</div>
              <div class="loc-fair-odds">公平 @${fair_ah_h && fair_ah_h < 100 ? fair_ah_h.toFixed(2) : '--'}</div>
              ${formatEdgePill(val_ah_h)}
            </div>
            <div class="lfc-odds-cell ${val_ah_a >= edgeThresh ? 'has-value' : ''}">
              <div class="loc-label">
                <span>客隊 ${ahLine !== null ? (-ahLine > 0 ? '+' : '') + (-ahLine) : ''}</span>
              </div>
              <div class="loc-market-odds">${b_ah_a ? '@' + b_ah_a.toFixed(2) : (ahLine !== null ? '--' : '未開盤')}</div>
              <div class="loc-fair-odds">公平 @${fair_ah_a && fair_ah_a < 100 ? fair_ah_a.toFixed(2) : '--'}</div>
              ${formatEdgePill(val_ah_a)}
            </div>
          </div>
        </div>
      </div>

      <!-- AH Analysis Callout -->
      <div class="lfc-ah-card">
        <span class="lfc-ah-icon">⚖️</span>
        <div class="lfc-ah-content">
          <div class="lfc-ah-headline">讓球盤剖析</div>
          <div>${generateLiveAHAnalysis(matrix, ahLine, b_ah_h, b_ah_a, homeTeam.zh, awayTeam.zh, modelFairLine)}</div>
        </div>
      </div>

      <!-- Kelly Recommendation Callout -->
      <div class="lfc-kelly-card ${bestBet ? '' : 'no-edge'}">
        <span class="lfc-kelly-icon">${bestBet ? '🎯' : '⚖️'}</span>
        <div class="lfc-kelly-content">
          <div class="lfc-kelly-headline ${bestBet ? '' : 'dimmed'}">
            ${bestBet ? `最佳注碼: ${bestBet.name}` : '凱利注碼建議'}
          </div>
          <div>
            ${bestBet
              ? `值博率 +${(bestBet.edge * 100).toFixed(1)}% (@${bestBet.odds.toFixed(2)}) · 凱利建議注碼 ${(bestBet.fracKelly * 100).toFixed(1)}%（約 $${bestBet.stake.toFixed(0)}）`
              : '目前各盤口未達值博門檻（正期望值 ≤ 0%），凱利公式建議注碼 $0（觀望略過）'
            }
          </div>
        </div>
      </div>

      <!-- Deep Dive Action -->
      <button class="btn-deep-dive" data-league="${leagueId}" data-home="${fix[2]}" data-away="${fix[3]}">
        深入盤口分析 (熱力圖/四份一盤) →
      </button>
    `;

    return card;
  }

  function switchToMatchLab(leagueId, homeId, awayId) {
    state.selectedLeagueFilter = leagueId;
    state.activeLeague = leagueId;

    // Update league chips
    const chips = document.querySelectorAll('#leagueChips .chip');
    chips.forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-league') === leagueId);
    });

    // Set home and away teams
    state.activeHomeId = homeId;
    state.activeAwayId = awayId;

    // Switch tab
    state.activeTab = 'tab-match';
    document.querySelectorAll('.bottom-nav .nav-tab').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === 'tab-match');
    });
    document.querySelectorAll('.tab-pane').forEach(p => {
      p.classList.toggle('active', p.id === 'tab-match');
    });

    // Render match lab
    const leagueData = window.ODDS_DATA.leagues[leagueId];
    if (leagueData) {
      renderFixturesList(leagueData);
    }
    renderMatchLab();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Fixtures Carousel ---
  function renderFixturesList(leagueData) {
    const listEl = document.getElementById('fixturesList');
    const countEl = document.getElementById('fixturesCount');
    if (!listEl) return;

    const fixtures = getFilteredFixtures(leagueData);
    if (countEl) countEl.textContent = `${fixtures.length} 場`;
    listEl.innerHTML = '';

    // Match selectedFixtureIdx based on current active teams
    let foundIdx = -1;
    for (let i = 0; i < fixtures.length; i++) {
      if (fixtures[i][2] === state.activeHomeId && fixtures[i][3] === state.activeAwayId) {
        foundIdx = i;
        break;
      }
    }
    state.selectedFixtureIdx = foundIdx;

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
    if (!leagueData) return;
    const fixtures = getFilteredFixtures(leagueData);
    if (!fixtures || !fixtures[idx]) return;

    state.selectedFixtureIdx = idx;
    const fix = fixtures[idx];
    state.activeHomeId = fix[2];
    state.activeAwayId = fix[3];

    // Highlight selected card
    const cards = document.querySelectorAll('#fixturesList .fixture-card');
    cards.forEach((c, i) => {
      c.classList.toggle('selected', i === idx);
    });

    state.selectedScoreManuallySet = false;
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

    // Score Matrix & Markets (Issue 19: maxGoals = 10)
    const matrix = window.OddsModel.calcScoreMatrix(lambdaHome, lambdaAway, model.rho, 10);
    const m1x2 = window.OddsModel.derive1X2(matrix);

    // Initialise selected score to mode if not manually set (Issue 23)
    if (!state.selectedScoreManuallySet) {
      const topScores = window.OddsModel.deriveMostLikelyScores(matrix, 1);
      if (topScores.length > 0) {
        state.selectedScore = { home: topScores[0].home, away: topScores[0].away };
      }
    }

    // Get Bookmaker Odds from active matching fixture
    let fixtureOdds = null;
    const fix = getActiveFixture();
    if (fix) {
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

    render1X2Grid(m1x2, fixtureOdds);
    renderScoreHeatmap(matrix);
    renderOUMarkets(matrix, fixtureOdds);
    renderAHTable(matrix, fixtureOdds);
    updateKellyCalculator(matrix, m1x2, fixtureOdds);
  }

  // --- 1X2 Market Grid Rendering (Issue 7: show de-vigged book probability) ---
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

      const devigText = m.bookieFairProb
        ? `${(m.bookieFairProb * 100).toFixed(1)}% (@${(1 / m.bookieFairProb).toFixed(2)})`
        : '--';

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
          <div class="mb-row">
            <span>莊家去水後</span>
            <strong>${devigText}</strong>
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
          state.selectedScoreManuallySet = true;
          document.querySelectorAll('.hm-cell').forEach(c => c.classList.remove('active-score'));
          cell.classList.add('active-score');
          updateHeatmapDetail(h, a, prob);
        });

        grid.appendChild(cell);
      }
    }

    // Update detail with current selected score
    const currH = state.selectedScore.home;
    const currA = state.selectedScore.away;
    const currP = (matrix[currH] && matrix[currH][currA] !== undefined) ? matrix[currH][currA] : 0;
    updateHeatmapDetail(currH, currA, currP);

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
          state.selectedScoreManuallySet = true;
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

  // --- O/U & BTTS Markets Setup & Rendering (Issue 5: no listener leak) ---
  function setupOULineChips() {
    const chips = document.querySelectorAll('#ouLineChips .chip-sm');
    chips.forEach(c => {
      c.onclick = () => {
        chips.forEach(x => x.classList.remove('active'));
        c.classList.add('active');
        state.ouLine = parseFloat(c.getAttribute('data-line'));
        renderMatchLab();
      };
    });
  }

  function renderOUMarkets(matrix, fixOdds) {
    const ouGrid = document.getElementById('ouMarketGrid');
    const bttsRow = document.getElementById('bttsRow');
    if (!ouGrid || !bttsRow) return;

    // Update active class on line chips
    const chips = document.querySelectorAll('#ouLineChips .chip-sm');
    chips.forEach(c => {
      const l = parseFloat(c.getAttribute('data-line'));
      c.classList.toggle('active', Math.abs(l - state.ouLine) < 1e-6);
    });

    const line = state.ouLine;
    const ouData = window.OddsModel.deriveOU(matrix, [line])[line];
    const bttsData = window.OddsModel.deriveBTTS(matrix);

    // Bookmaker odds for OU if line matches 2.5
    let bookieOver = null;
    let bookieUnder = null;
    if (fixOdds && Math.abs(line - 2.5) < 1e-6) {
      bookieOver = fixOdds.ouOver;
      bookieUnder = fixOdds.ouUnder;
    }

    let edgeOver = (bookieOver && bookieOver > 1) ? ouData.over * bookieOver - 1 : null;
    let edgeUnder = (bookieUnder && bookieUnder > 1) ? ouData.under * bookieUnder - 1 : null;

    ouGrid.innerHTML = `
      <div class="market-box ${edgeOver !== null && edgeOver >= state.settings.edgeThreshold ? 'has-edge' : ''}">
        <div class="mb-header">
          <span class="mb-title">大波 (Over ${line})</span>
          ${edgeOver !== null && edgeOver >= state.settings.edgeThreshold ? '<span class="value-badge">⭐ 值博</span>' : ''}
        </div>
        <div class="mb-prob">${(ouData.over * 100).toFixed(1)}%</div>
        <div class="mb-rows">
          <div class="mb-row"><span>模型公平價</span><strong>${ouData.overFair.toFixed(2)}</strong></div>
          <div class="mb-row"><span>莊家開出</span><strong>${bookieOver ? bookieOver.toFixed(2) : '--'}</strong></div>
          ${edgeOver !== null ? `<div class="mb-row"><span>值博優勢</span><span class="edge-pill ${edgeOver > 0 ? 'pos' : 'neg'}">${edgeOver > 0 ? '+' : ''}${(edgeOver * 100).toFixed(1)}%</span></div>` : ''}
        </div>
      </div>
      <div class="market-box ${edgeUnder !== null && edgeUnder >= state.settings.edgeThreshold ? 'has-edge' : ''}">
        <div class="mb-header">
          <span class="mb-title">細波 (Under ${line})</span>
          ${edgeUnder !== null && edgeUnder >= state.settings.edgeThreshold ? '<span class="value-badge">⭐ 值博</span>' : ''}
        </div>
        <div class="mb-prob">${(ouData.under * 100).toFixed(1)}%</div>
        <div class="mb-rows">
          <div class="mb-row"><span>模型公平價</span><strong>${ouData.underFair.toFixed(2)}</strong></div>
          <div class="mb-row"><span>莊家開出</span><strong>${bookieUnder ? bookieUnder.toFixed(2) : '--'}</strong></div>
          ${edgeUnder !== null ? `<div class="mb-row"><span>值博優勢</span><span class="edge-pill ${edgeUnder > 0 ? 'pos' : 'neg'}">${edgeUnder > 0 ? '+' : ''}${(edgeUnder * 100).toFixed(1)}%</span></div>` : ''}
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
  }

  // --- Asian Handicap Table Rendering (Issue 16: tap popover on pills) ---
  function renderAHTable(matrix, fixOdds) {
    const tableBody = document.getElementById('ahTableBody');
    const fairBadge = document.getElementById('modelFairAhBadge');
    if (!tableBody) return;

    const ahTableData = window.OddsModel.calcAHTable(matrix, -2.0, 2.0, 0.25);
    const fairLine = ahTableData.fairLine;
    const bookieLine = fixOdds && fixOdds.ahLine !== null ? fixOdds.ahLine : null;

    if (fairBadge) {
      fairBadge.textContent = `模型公平盤: ${formatAHLineZh(fairLine)}`;
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
            <span class="split-pill" data-split="全贏" title="贏全">${(hp.win * 100).toFixed(0)}% 贏</span>
            <span class="split-pill" data-split="贏半" title="贏半">${(hp.halfWin * 100).toFixed(0)}% 贏半</span>
            <span class="split-pill" data-split="走盤" title="走盤">${(hp.push * 100).toFixed(0)}% 走</span>
            <span class="split-pill" data-split="輸半" title="輸半">${(hp.halfLoss * 100).toFixed(0)}% 輸半</span>
            <span class="split-pill" data-split="全輸" title="輸全">${(hp.loss * 100).toFixed(0)}% 輸</span>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    bindPillClickListeners(tableBody);
  }

  // --- Kelly Calculator (Issues 1 & 9: resolve AH line and fixture odds) ---
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
      // Keep settings sheet in sync (Issue 8)
      const sKellySlider = document.getElementById('settingKellySlider');
      const sKellyVal = document.getElementById('settingKellyVal');
      if (sKellySlider) sKellySlider.value = frac.toFixed(2);
      if (sKellyVal) sKellyVal.textContent = `${frac.toFixed(2)}x`;
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
    const fix = getActiveFixture();

    // Update Asian handicap select option labels with the true line (Issue 1)
    const optAhHome = marketSel.querySelector('option[value="ah_home"]');
    const optAhAway = marketSel.querySelector('option[value="ah_away"]');
    const line = (fix && fix[10] !== null) ? fix[10] : 0;

    if (optAhHome) optAhHome.textContent = `亞洲讓球: 主隊 ${formatAHLineZh(line)}`;
    if (optAhAway) optAhAway.textContent = `亞洲讓球: 客隊 ${formatAHLineZh(-line)}`;

    // Issue 9: only prefill odds if fixture matches activeHomeId and activeAwayId
    if (fix) {
      let targetOdds = null;
      if (val === '1x2_home') targetOdds = fix[4];
      else if (val === '1x2_draw') targetOdds = fix[5];
      else if (val === '1x2_away') targetOdds = fix[6];
      else if (val === 'ou_over') targetOdds = fix[8];
      else if (val === 'ou_under') targetOdds = fix[9];
      else if (val === 'ah_home') targetOdds = fix[11];
      else if (val === 'ah_away') targetOdds = fix[12];

      if (targetOdds && targetOdds > 1) {
        oddsInput.value = targetOdds.toFixed(2);
        oddsInput.placeholder = '2.00';
      } else {
        oddsInput.value = '';
        oddsInput.placeholder = '呢場暫時未有盤口';
      }
    } else {
      oddsInput.value = '';
      oddsInput.placeholder = '呢場暫時未有盤口';
    }
  }

  function calculateKellyNow() {
    const marketSel = document.getElementById('kellyMarketSelect');
    const oddsInput = document.getElementById('kellyOddsInput');
    const bankrollInput = document.getElementById('kellyBankrollInput');
    const fractionSlider = document.getElementById('kellyFractionSlider');

    const evEl = document.getElementById('kellyEvVal');
    const stakeEl = document.getElementById('kellyStakeVal');
    const fullEl = document.getElementById('kellyFullVal');

    if (!marketSel || !oddsInput || !bankrollInput || !fractionSlider) return;

    const marketType = marketSel.value;
    const oddsValStr = oddsInput.value.trim();
    const odds = parseFloat(oddsValStr);
    const bankroll = parseFloat(bankrollInput.value) || 10000;
    const fraction = parseFloat(fractionSlider.value) || 0.25;

    if (!odds || odds <= 1) {
      if (evEl) { evEl.textContent = '--'; evEl.style.color = 'var(--text-dim)'; }
      if (fullEl) { fullEl.textContent = '--'; }
      if (stakeEl) { stakeEl.textContent = '$0 (0.0%)'; stakeEl.style.color = 'var(--text-dim)'; }
      return;
    }

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
      // Issue 1: Read the fixture AH line from active fixture
      const fix = getActiveFixture();
      const ahLine = (fix && fix[10] !== null) ? fix[10] : 0;
      const ah = window.OddsModel.calcAHProbs(matrix, ahLine);
      // ah.away is already the reflection of ahLine
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
      evEl.style.color = evPct > 0 ? 'var(--accent-green)' : (evPct < 0 ? 'var(--accent-red)' : 'var(--text-dim)');
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

  // --- Tab 2: Market Movement & CLV (Issue 6, 7, 13) ---
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

  // Sparkline generator (SVG)
  function createSparklineSvg(openProb, closeProb) {
    const w = 84;
    const h = 26;
    const p1 = Math.max(5, Math.min(95, openProb));
    const p2 = Math.max(5, Math.min(95, closeProb));
    const y1 = h - (p1 / 100) * (h - 8) - 4;
    const y2 = h - (p2 / 100) * (h - 8) - 4;
    const isUp = p2 >= p1;
    const color = isUp ? '#00ff87' : '#f43f5e';

    return `
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="overflow:visible;">
        <line x1="8" y1="${y1.toFixed(1)}" x2="${w - 8}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="2" stroke-linecap="round" />
        <circle cx="8" cy="${y1.toFixed(1)}" r="3" fill="#8b9bb4" />
        <circle cx="${w - 8}" cy="${y2.toFixed(1)}" r="3.5" fill="${color}" />
      </svg>
    `;
  }

  function renderMovementMatches(teamId) {
    const listEl = document.getElementById('movementMatchesList');
    if (!listEl) return;

    const leagueData = window.ODDS_DATA.leagues[state.activeLeague];
    if (!leagueData) return;

    const matches = leagueData.matches || [];
    const teamMatches = [];
    for (let i = matches.length - 1; i >= 0 && teamMatches.length < 10; i--) {
      const m = matches[i];
      if (m[1] === teamId || m[2] === teamId) {
        teamMatches.push(m);
      }
    }

    listEl.innerHTML = '';
    if (teamMatches.length === 0) {
      listEl.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-dim)">未有賽事數據</div>';
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

      // 1X2 Open vs Close
      const openOdds = isHome ? m[8] : m[10];
      const closeOdds = isHome ? m[11] : m[13];
      const openAH = m[18] !== null ? (isHome ? m[18] : -m[18]) : null;
      const closeAH = m[21] !== null ? (isHome ? m[21] : -m[21]) : null;

      // Issue 6: Walk-forward pre-match model prediction
      const preModel = getWalkForwardModel(state.activeLeague, m[0]);
      let modelProbThisTeam = 0.35;
      let modelFairThisTeam = 2.85;
      let m1x2 = null;
      if (preModel) {
        const pred = preModel.predict(m[1], m[2]);
        const mat = window.OddsModel.calcScoreMatrix(pred.lambdaHome, pred.lambdaAway, preModel.rho, 10);
        m1x2 = window.OddsModel.derive1X2(mat);
        modelProbThisTeam = isHome ? m1x2.home : m1x2.away;
        modelFairThisTeam = isHome ? m1x2.fairHome : m1x2.fairAway;
      }

      // MAJOR 3: CLV of a hypothetical bet on the model's preferred side (highest pre-match edge)
      const open1x2 = [m[8], m[9], m[10]];
      const sharpClosing = [m[24], m[25], m[26]];
      let modelSelIdx = isHome ? 0 : 2;
      let modelSelName = isHome ? '主勝' : '客勝';
      let modelSelOdds = openOdds;

      if (m1x2 && open1x2[0] && open1x2[1] && open1x2[2]) {
        const edge0 = open1x2[0] > 1 ? (m1x2.home * open1x2[0] - 1) : -1;
        const edge1 = open1x2[1] > 1 ? (m1x2.draw * open1x2[1] - 1) : -1;
        const edge2 = open1x2[2] > 1 ? (m1x2.away * open1x2[2] - 1) : -1;

        if (edge1 > edge0 && edge1 > edge2) {
          modelSelIdx = 1;
          modelSelName = '和局';
          modelSelOdds = open1x2[1];
        } else if (edge2 > edge0 && edge2 > edge1) {
          modelSelIdx = 2;
          modelSelName = '客勝';
          modelSelOdds = open1x2[2];
        } else {
          modelSelIdx = 0;
          modelSelName = '主勝';
          modelSelOdds = open1x2[0];
        }
      }

      const clv = (modelSelOdds && modelSelOdds > 1)
        ? window.OddsModel.calcCLV(modelSelOdds, sharpClosing, state.settings.marginMethod, modelSelIdx)
        : 0;
      const clvPct = clv * 100;

      // Odds movement & Sparkline (Minor 10: de-vigged fair probability)
      let oddsMoveText = '冇變過';
      let sparklineHtml = '';
      if (closeOdds && openOdds) {
        let openProb = (1 / openOdds) * 100;
        let closeProb = (1 / closeOdds) * 100;

        if (open1x2[0] && open1x2[1] && open1x2[2]) {
          const devigOpen = window.OddsModel.removeMargin(open1x2, state.settings.marginMethod);
          if (devigOpen) openProb = devigOpen[isHome ? 0 : 2] * 100;
        }

        const close1x2 = [m[11], m[12], m[13]];
        if (close1x2[0] && close1x2[1] && close1x2[2]) {
          const devigClose = window.OddsModel.removeMargin(close1x2, state.settings.marginMethod);
          if (devigClose) closeProb = devigClose[isHome ? 0 : 2] * 100;
        }

        sparklineHtml = createSparklineSvg(openProb, closeProb);

        if (closeOdds < openOdds) {
          oddsMoveText = `<span class="arrow-down">↘ 降水 (${openOdds.toFixed(2)} → ${closeOdds.toFixed(2)})</span>`;
        } else if (closeOdds > openOdds) {
          oddsMoveText = `<span class="arrow-up">↗ 升水 (${openOdds.toFixed(2)} → ${closeOdds.toFixed(2)})</span>`;
        } else {
          oddsMoveText = `平盤 (${openOdds.toFixed(2)})`;
        }
      } else if (!openOdds && closeOdds) {
        oddsMoveText = `未有開盤 (收市 ${closeOdds.toFixed(2)})`;
      }

      let ahMoveText = '未有讓球盤';
      if (openAH !== null && closeAH !== null) {
        if (Math.abs(openAH - closeAH) > 1e-6) {
          ahMoveText = `盤口跳檔: ${formatAHLineZh(openAH)} → ${formatAHLineZh(closeAH)}`;
        } else {
          ahMoveText = `盤口維持: ${formatAHLineZh(openAH)}`;
        }
      } else if (closeAH !== null) {
        ahMoveText = `收市盤: ${formatAHLineZh(closeAH)}`;
      }

      const card = document.createElement('div');
      card.className = 'movement-card';
      card.innerHTML = `
        <div class="mov-header">
          <span>${m[0]} (${isHome ? '主場' : '作客'})</span>
          <span class="clv-pill ${clvPct > 0 ? 'pos' : (clvPct < 0 ? 'neg' : '')}" title="模型方向：${modelSelName} (開盤 @${modelSelOdds ? modelSelOdds.toFixed(2) : '--'})">模型方向 (${modelSelName}) CLV: ${clvPct > 0 ? '+' : ''}${clvPct.toFixed(1)}%</span>
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
        <div class="mov-model-row" style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;background:var(--surface-2);border-radius:var(--radius-sm);margin-top:6px;font-size:11px;">
          <div>
            <span style="color:var(--text-dim)">賽前模型概率:</span>
            <strong style="color:var(--accent-cyan);margin-left:4px;">${(modelProbThisTeam * 100).toFixed(1)}%</strong>
            <span style="color:var(--text-dim);margin-left:4px;">(公平價 ${modelFairThisTeam.toFixed(2)})</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="color:var(--text-dim);font-size:10px;">勝率走勢</span>
            ${sparklineHtml}
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
    let countOverround = 0;
    let ahMoveCount = 0;
    let ahTotal = 0;
    let steamCoverCount = 0;
    let steamTotal = 0;

    matches.forEach(m => {
      // 1X2 close overround
      const ch = m[11], cd = m[12], ca = m[13];
      if (ch && cd && ca) {
        sumOverround += window.OddsModel.calcOverround([ch, cd, ca]);
        countOverround++;
      }

      // AH movement
      const oLine = m[18];
      const cLine = m[21];
      if (oLine !== null && cLine !== null) {
        ahTotal++;
        if (Math.abs(oLine - cLine) > 1e-6) {
          ahMoveCount++;
          const goalDiff = m[3] - m[4];
          if (cLine < oLine) {
            steamTotal++;
            const mult = window.OddsModel.settleAH(goalDiff, cLine, 2.0);
            if (mult > 1.0) steamCoverCount++;
          } else {
            steamTotal++;
            const mult = window.OddsModel.settleAH(-goalDiff, -cLine, 2.0);
            if (mult > 1.0) steamCoverCount++;
          }
        }
      }
    });

    // Issue 13: Vig is (overround - 1.0) * 100, e.g. 5.6%
    const avgVig = countOverround > 0 ? ((sumOverround / countOverround) - 1.0) * 100 : 5.6;
    const ahMoveRate = ahTotal > 0 ? (ahMoveCount / ahTotal) * 100 : 0;
    const steamCoverRate = steamTotal > 0 ? (steamCoverCount / steamTotal) * 100 : 50.0;

    const elOverround = document.getElementById('statOverround');
    const elAhMove = document.getElementById('statAhMoveRate');
    const elSteam = document.getElementById('statSteamCoverRate');

    if (elOverround) elOverround.textContent = `${avgVig.toFixed(1)}%`;
    if (elAhMove) elAhMove.textContent = `${ahMoveRate.toFixed(1)}%`;
    if (elSteam) elSteam.textContent = `${steamCoverRate.toFixed(1)}%`;
  }

  // --- Tab 3: Backtest Engine (Issue 10: unified multi-league bankroll) ---
  function setupBacktestEvents() {
    const btnRun = document.getElementById('btnRunBacktest');
    const slider = document.getElementById('btEdgeSlider');
    const valDisplay = document.getElementById('btEdgeVal');

    if (slider && valDisplay) {
      slider.addEventListener('input', () => {
        valDisplay.textContent = `${parseFloat(slider.value).toFixed(1)}%`;
        state.settings.edgeThreshold = parseFloat(slider.value) / 100;
        saveSettings();
        // Keep settings sheet in sync
        const sEdgeSlider = document.getElementById('settingEdgeSlider');
        const sEdgeVal = document.getElementById('settingEdgeVal');
        if (sEdgeSlider) sEdgeSlider.value = slider.value;
        if (sEdgeVal) sEdgeVal.textContent = `${slider.value}%`;
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
    const season = seasonSel ? seasonSel.value : '2526_2627';
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

    // CRITICAL 1 Fix: If single league, directly run runBacktest with actual staking
    if (targetLeagues.length === 1) {
      const lgId = targetLeagues[0];
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
        halfLifeDays: state.settings.halfLifeDays,
        marginMethod: state.settings.marginMethod
      });

      leagueResults.push({
        id: lgId,
        name: lgData.name,
        res
      });

      state.backtestResult = {
        totalBets: res.totalBets,
        hitRate: res.hitRate,
        profit: res.profit,
        roi: res.roi,
        maxDrawdown: res.maxDrawdown,
        avgCLV: res.avgCLV,
        beatCloseRate: res.beatCloseRate,
        totalStaked: res.totalStaked,
        bankrollCurve: res.bankrollCurve,
        leagueResults,
        bets: res.bets
      };

      renderBacktestResults(state.backtestResult);
      return;
    }

    // Multiple leagues ("ALL"): collect candidate bets and simulate combined chronological bankroll
    let allBets = [];
    const perLeagueStats = {};
    targetLeagues.forEach(lgId => {
      perLeagueStats[lgId] = { totalBets: 0, totalStaked: 0, totalReturn: 0, wins: 0, clvSum: 0, beatCloseCount: 0 };
      const lgData = window.ODDS_DATA.leagues[lgId];
      if (!lgData) return;

      const res = window.OddsModel.runBacktest(lgData.matches, lgData.teams, {
        season,
        market,
        oddsType,
        edgeThreshold,
        staking: 'flat', // collect candidate bets with full details
        kellyFraction: state.settings.kellyFraction,
        initialBankroll: 100,
        halfLifeDays: state.settings.halfLifeDays,
        marginMethod: state.settings.marginMethod
      });

      leagueResults.push({
        id: lgId,
        name: lgData.name,
        res
      });

      res.bets.forEach(b => {
        b.leagueId = lgId;
        b.leagueName = lgData.name;
        allBets.push(b);
      });
    });

    // Sort all bets chronologically by match date (Issue 10)
    allBets.sort((a, b) => a.date.localeCompare(b.date));

    // Simulate combined bankroll chronologically with NO lookahead and exact AH multipliers
    const initialBankroll = 100;
    let bankroll = initialBankroll;
    let peak = initialBankroll;
    let maxDd = 0;
    let totalStakedAll = 0;
    let totalReturnAll = 0;
    let winsAll = 0;
    let clvSumAll = 0;
    let beatCloseAll = 0;

    const combinedCurve = [{ index: 0, date: '開始', bankroll, profit: 0 }];

    allBets.forEach((b, idx) => {
      let stake = 1.0;
      if (staking === 'kelly') {
        const kFrac = state.settings.kellyFraction || 0.25;
        if (b.isAHMarket && b.ahProbs) {
          const k = window.OddsModel.calcAHKelly(b.ahProbs, b.odds, kFrac, 0.2);
          stake = k.recommendedStake(bankroll);
        } else {
          const k = window.OddsModel.calcKelly(b.modelProb || 0.35, b.odds, kFrac, 0.2);
          stake = k.recommendedStake(bankroll);
        }
        stake = Math.min(bankroll, stake);
        if (stake <= 0) return;
      }

      totalStakedAll += stake;
      const mult = b.payoutMult !== undefined ? b.payoutMult : (b.payout / (b.stake || 1.0));
      const payout = stake * mult;
      const netProfit = payout - stake;
      totalReturnAll += payout;
      const isWin = mult > 1.0;
      if (isWin) winsAll++;

      bankroll += netProfit;
      if (bankroll > peak) peak = bankroll;
      const dd = (peak - bankroll) / peak;
      if (dd > maxDd) maxDd = dd;

      clvSumAll += (b.clv || 0) / 100;
      if (b.clv > 0) beatCloseAll++;

      if (perLeagueStats[b.leagueId]) {
        perLeagueStats[b.leagueId].totalBets++;
        perLeagueStats[b.leagueId].totalStaked += stake;
        perLeagueStats[b.leagueId].totalReturn += payout;
        if (isWin) perLeagueStats[b.leagueId].wins++;
        perLeagueStats[b.leagueId].clvSum += (b.clv || 0) / 100;
        if (b.clv > 0) perLeagueStats[b.leagueId].beatCloseCount++;
      }

      b.stake = stake;
      b.payout = payout;
      b.profit = netProfit;

      combinedCurve.push({
        index: combinedCurve.length,
        date: b.date,
        bankroll: Math.round(bankroll * 100) / 100,
        profit: Math.round((bankroll - initialBankroll) * 100) / 100
      });
    });

    const netProfitAll = totalReturnAll - totalStakedAll;
    const roiAll = totalStakedAll > 0 ? (netProfitAll / totalStakedAll) * 100 : 0;
    const hitRateAll = allBets.length > 0 ? (winsAll / allBets.length) * 100 : 0;
    const avgClvAll = allBets.length > 0 ? (clvSumAll / allBets.length) * 100 : 0;
    const beatCloseRateAll = allBets.length > 0 ? (beatCloseAll / allBets.length) * 100 : 0;

    // Synchronize league breakdown table with replayed results
    leagueResults.forEach(lr => {
      const s = perLeagueStats[lr.id];
      if (s) {
        const p = s.totalReturn - s.totalStaked;
        lr.res.totalBets = s.totalBets;
        lr.res.totalStaked = Math.round(s.totalStaked * 100) / 100;
        lr.res.totalReturn = Math.round(s.totalReturn * 100) / 100;
        lr.res.profit = Math.round(p * 100) / 100;
        lr.res.roi = s.totalStaked > 0 ? Math.round((p / s.totalStaked) * 1000) / 10 : 0;
        lr.res.hitRate = s.totalBets > 0 ? Math.round((s.wins / s.totalBets) * 1000) / 10 : 0;
        lr.res.avgCLV = s.totalBets > 0 ? Math.round((s.clvSum / s.totalBets) * 10000) / 100 : 0;
        lr.res.beatCloseRate = s.totalBets > 0 ? Math.round((s.beatCloseCount / s.totalBets) * 1000) / 10 : 0;
      }
    });

    state.backtestResult = {
      totalBets: allBets.length,
      hitRate: hitRateAll,
      profit: netProfitAll,
      roi: roiAll,
      maxDrawdown: maxDd * 100,
      avgCLV: avgClvAll,
      beatCloseRate: beatCloseRateAll,
      totalStaked: totalStakedAll,
      bankrollCurve: combinedCurve,
      leagueResults,
      bets: allBets
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

    const clvEl = document.getElementById('btAvgClv');
    clvEl.textContent = `${res.avgCLV >= 0 ? '+' : ''}${res.avgCLV.toFixed(2)}%`;
    clvEl.style.color = res.avgCLV >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';

    document.getElementById('btBeatClose').textContent = `${res.beatCloseRate.toFixed(1)}%`;
    document.getElementById('btTotalStaked').textContent = `${Math.round(res.totalStaked)} u`;

    const summaryBadge = document.getElementById('btSummaryBadge');
    if (summaryBadge) {
      summaryBadge.textContent = `${res.totalBets} 注 / ROI ${res.roi >= 0 ? '+' : ''}${res.roi.toFixed(1)}%`;
    }

    // Draw animated canvas bankroll chart (Issue 18)
    drawBankrollChart(res.bankrollCurve);

    // Render per-league breakdown table
    renderLeagueBreakdownTable(res.leagueResults);
  }

  // --- Canvas Bankroll Chart Drawing (Issue 18: animation, axes, baseline) ---
  let animFrameId = null;

  function drawBankrollChart(curve) {
    const canvas = document.getElementById('bankrollChart');
    if (!canvas) return;

    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    if (!curve || curve.length < 2) {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#8b9bb4';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('未有足夠下注數據繪製資金圖表', width / 2, height / 2);
      return;
    }

    const padLeft = 52;
    const padRight = 20;
    const padTop = 22;
    const padBottom = 34;

    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    let minB = 100;
    let maxB = 100;
    curve.forEach(pt => {
      if (pt.bankroll < minB) minB = pt.bankroll;
      if (pt.bankroll > maxB) maxB = pt.bankroll;
    });

    const bRange = Math.max(10, maxB - minB);
    const yMin = Math.floor(minB - bRange * 0.12);
    const yMax = Math.ceil(maxB + bRange * 0.12);

    function getX(i, total) {
      return padLeft + (i / Math.max(1, total - 1)) * plotW;
    }

    function getY(val) {
      return padTop + plotH - ((val - yMin) / (yMax - yMin)) * plotH;
    }

    const finalVal = curve[curve.length - 1].bankroll;
    const isProfitable = finalVal >= 100;
    const zeroY = getY(100);

    const startTime = performance.now();
    const duration = 400; // 400ms smooth animation

    function renderFrame(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // cubic ease-out

      const pointsToShow = Math.max(2, Math.floor(easeProgress * curve.length));
      const partialCurve = curve.slice(0, pointsToShow);

      ctx.clearRect(0, 0, width, height);

      // Axes lines (Issue 18)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Y-axis
      ctx.moveTo(padLeft, padTop);
      ctx.lineTo(padLeft, height - padBottom);
      // X-axis
      ctx.lineTo(width - padRight, height - padBottom);
      ctx.stroke();

      // Zero baseline (100u)
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
      ctx.beginPath();
      ctx.moveTo(padLeft, zeroY);
      ctx.lineTo(width - padRight, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Baseline label
      ctx.fillStyle = 'rgba(0, 229, 255, 0.85)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('開波本金 (100u)', width - padRight, zeroY - 5);

      // Y-Ticks
      const yTicks = [yMin, Math.round((yMin + yMax) / 2), yMax];
      ctx.fillStyle = '#8b9bb4';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      yTicks.forEach(tickVal => {
        const y = getY(tickVal);
        ctx.fillText(`${tickVal}u`, padLeft - 6, y + 3);
        ctx.beginPath();
        ctx.moveTo(padLeft - 4, y);
        ctx.lineTo(padLeft, y);
        ctx.stroke();
      });

      // Area fill
      const grad = ctx.createLinearGradient(0, padTop, 0, height - padBottom);
      if (isProfitable) {
        grad.addColorStop(0, 'rgba(0, 255, 135, 0.28)');
        grad.addColorStop(1, 'rgba(0, 255, 135, 0.0)');
      } else {
        grad.addColorStop(0, 'rgba(244, 63, 94, 0.28)');
        grad.addColorStop(1, 'rgba(244, 63, 94, 0.0)');
      }

      ctx.beginPath();
      ctx.moveTo(getX(0, curve.length), getY(partialCurve[0].bankroll));
      for (let i = 1; i < partialCurve.length; i++) {
        ctx.lineTo(getX(i, curve.length), getY(partialCurve[i].bankroll));
      }
      ctx.lineTo(getX(partialCurve.length - 1, curve.length), height - padBottom);
      ctx.lineTo(getX(0, curve.length), height - padBottom);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Line
      ctx.beginPath();
      ctx.moveTo(getX(0, curve.length), getY(partialCurve[0].bankroll));
      for (let i = 1; i < partialCurve.length; i++) {
        ctx.lineTo(getX(i, curve.length), getY(partialCurve[i].bankroll));
      }
      ctx.strokeStyle = isProfitable ? '#00ff87' : '#f43f5e';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // X labels
      ctx.fillStyle = '#8b9bb4';
      ctx.textAlign = 'center';
      ctx.fillText('開波', padLeft, height - 12);
      ctx.fillText(`第 ${partialCurve.length - 1} 注`, width - padRight - 15, height - 12);

      if (progress < 1.0) {
        animFrameId = requestAnimationFrame(renderFrame);
      }
    }

    animFrameId = requestAnimationFrame(renderFrame);
  }

  function renderLeagueBreakdownTable(leagueResults) {
    const tableBody = document.getElementById('btLeagueTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    if (!leagueResults || leagueResults.length === 0) return;

    leagueResults.forEach(item => {
      const r = item.res;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.name}</strong></td>
        <td>${r.totalBets}</td>
        <td>${r.hitRate.toFixed(1)}%</td>
        <td style="color:${r.profit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">
          ${r.profit >= 0 ? '+' : ''}${r.profit.toFixed(1)} u
        </td>
        <td style="color:${r.roi >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">
          ${r.roi >= 0 ? '+' : ''}${r.roi.toFixed(1)}%
        </td>
        <td style="color:${r.avgCLV >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">
          ${r.avgCLV >= 0 ? '+' : ''}${r.avgCLV.toFixed(2)}%
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // --- Tab 4: Teams & Standings (Issues 4 & 15: splits, alpha+beta, 贏/和/輸) ---
  function renderTeamsTab() {
    renderStandingsTable();
    renderTeamPowerCards();
  }

  function renderStandingsTable() {
    const tableBody = document.getElementById('standingsTableBody');
    if (!tableBody) return;

    const leagueData = window.ODDS_DATA.leagues[state.activeLeague];
    if (!leagueData) return;

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

      // Last 5 matches pills (Cantonese 贏/和/輸)
      const last5 = st.form.slice(-5);
      const pillsHtml = last5.map(f => {
        const cls = f === 'W' ? 'w' : (f === 'D' ? 'd' : 'l');
        const txt = f === 'W' ? '贏' : (f === 'D' ? '和' : '輸');
        return `<span class="form-pill ${cls}" data-outcome="${f}">${txt}</span>`;
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
        <td><div class="form-pills">${pillsHtml || '<span style="color:var(--text-dim)">--</span>'}</div></td>
      `;

      tr.addEventListener('click', () => {
        if (state.activeAwayId === st.id) {
          state.activeAwayId = state.activeHomeId;
        }
        state.activeHomeId = st.id;
        document.querySelector('.bottom-nav .nav-tab[data-tab="tab-match"]').click();
      });

      tableBody.appendChild(tr);
    });

    bindPillClickListeners(tableBody);
  }

  function renderTeamPowerCards() {
    const grid = document.getElementById('teamCardsGrid');
    if (!grid) return;

    const leagueData = window.ODDS_DATA.leagues[state.activeLeague];
    if (!leagueData) return;

    const model = getLeagueModel(state.activeLeague);
    if (!model) return;

    // Calculate Home and Away splits from 2627 season matches (Issue 15)
    const splits = {};
    leagueData.currentTeams.forEach(id => {
      splits[id] = {
        homePlayed: 0, homeGf: 0, homeGa: 0,
        awayPlayed: 0, awayGf: 0, awayGa: 0,
        form: []
      };
    });

    const s2627Matches = leagueData.matches.filter(m => m[7] === '2627');
    s2627Matches.forEach(m => {
      const h = m[1], a = m[2], hg = m[3], ag = m[4];
      if (splits[h]) {
        splits[h].homePlayed++;
        splits[h].homeGf += hg;
        splits[h].homeGa += ag;
        splits[h].form.push(hg > ag ? 'W' : (hg === ag ? 'D' : 'L'));
      }
      if (splits[a]) {
        splits[a].awayPlayed++;
        splits[a].awayGf += ag;
        splits[a].awayGa += hg;
        splits[a].form.push(ag > hg ? 'W' : (ag === hg ? 'D' : 'L'));
      }
    });

    // Issue 4: netRating is alpha + beta (beta is defensive strength)
    const currentTeams = leagueData.currentTeams.map(id => {
      const a = model.alpha[id] || 0;
      const b = model.beta[id] || 0;
      return {
        id,
        team: leagueData.teams[id],
        alpha: a,
        beta: b,
        netRating: a + b,
        split: splits[id] || { homePlayed: 0, homeGf: 0, homeGa: 0, awayPlayed: 0, awayGf: 0, awayGa: 0, form: [] }
      };
    });

    currentTeams.sort((a, b) => b.netRating - a.netRating);

    grid.innerHTML = '';
    currentTeams.forEach(item => {
      const t = item.team;
      const sp = item.split;
      const card = document.createElement('div');
      card.className = 'team-power-card';

      const last5 = sp.form.slice(-5);
      const pillsHtml = last5.map(f => {
        const cls = f === 'W' ? 'w' : (f === 'D' ? 'd' : 'l');
        const txt = f === 'W' ? '贏' : (f === 'D' ? '和' : '輸');
        return `<span class="form-pill ${cls}" data-outcome="${f}">${txt}</span>`;
      }).join('');

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
            <span>淨評分 (α+β)</span>
            <strong style="color:${item.netRating >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">
              ${item.netRating >= 0 ? '+' : ''}${item.netRating.toFixed(2)}
            </strong>
          </div>
          <div class="tpc-rating-box">
            <span>進攻力 (α)</span>
            <strong>${item.alpha >= 0 ? '+' : ''}${item.alpha.toFixed(2)}</strong>
          </div>
          <div class="tpc-rating-box" title="β越高代表對手越難入波">
            <span>防守力 (β)</span>
            <strong>${item.beta >= 0 ? '+' : ''}${item.beta.toFixed(2)}</strong>
          </div>
          <div class="tpc-rating-box">
            <span>近五場走勢</span>
            <div class="form-pills" style="justify-content:center;margin-top:2px;">${pillsHtml || '<span style="color:var(--text-dim)">--</span>'}</div>
          </div>
        </div>
        <div class="tpc-splits-row" style="display:flex;justify-content:space-between;padding:6px 8px;background:var(--surface-2);border-radius:var(--radius-sm);margin-top:6px;font-size:11px;color:var(--text-muted)">
          <span>主場: ${sp.homePlayed}場 ${sp.homeGf}得/${sp.homeGa}失</span>
          <span>作客: ${sp.awayPlayed}場 ${sp.awayGf}得/${sp.awayGa}失</span>
        </div>
      `;

      card.querySelector('.btn-set-home').addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.activeAwayId === item.id) {
          state.activeAwayId = state.activeHomeId;
        }
        state.activeHomeId = item.id;
        document.querySelector('.bottom-nav .nav-tab[data-tab="tab-match"]').click();
      });

      card.querySelector('.btn-set-away').addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.activeHomeId === item.id) {
          state.activeHomeId = state.activeAwayId;
        }
        state.activeAwayId = item.id;
        document.querySelector('.bottom-nav .nav-tab[data-tab="tab-match"]').click();
      });

      grid.appendChild(card);
    });

    bindPillClickListeners(grid);
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
      title.textContent = target === 'home' ? '揀主隊' : '揀客隊';
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
            const other = leagueData.currentTeams.find(id => id !== t.id);
            state.activeAwayId = other !== undefined ? other : 0;
          }
        } else {
          state.activeAwayId = t.id;
          if (state.activeHomeId === t.id) {
            const other = leagueData.currentTeams.find(id => id !== t.id);
            state.activeHomeId = other !== undefined ? other : 0;
          }
        }
        closeTeamPicker();
        renderMatchLab();
      });

      listEl.appendChild(item);
    });
  }

  // --- Settings Bottom Sheet (Issue 8: synchronized sliders) ---
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
      applySettingsToDom();
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
        state.modelCache = {};
        state.walkForwardCache = {};
        applySettingsToDom();
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
        state.modelCache = {};
        state.walkForwardCache = {};
        applySettingsToDom();
        backdrop.classList.remove('active');
        renderMatchLab();
      });
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

  // --- Term Explanation Modal for Mobile Taps (Issue 16) ---
  function setupTermInfoModal() {
    const btnClose = document.getElementById('btnCloseTermInfo');
    const backdrop = document.getElementById('termInfoBackdrop');

    if (btnClose) {
      btnClose.addEventListener('click', () => {
        if (backdrop) backdrop.classList.remove('active');
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.classList.remove('active');
      });
    }
  }

  function showTermInfo(title, bodyHtml) {
    const backdrop = document.getElementById('termInfoBackdrop');
    const titleEl = document.getElementById('termInfoTitle');
    const bodyEl = document.getElementById('termInfoBody');
    if (!backdrop || !titleEl || !bodyEl) return;
    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHtml;
    backdrop.classList.add('active');
  }

  function bindPillClickListeners(container) {
    if (!container) return;

    container.querySelectorAll('.split-pill').forEach(pill => {
      pill.style.cursor = 'pointer';
      pill.onclick = (e) => {
        e.stopPropagation();
        const type = pill.getAttribute('data-split') || pill.getAttribute('title') || pill.textContent;
        let title = '讓球盤口賽果拆解';
        let desc = '';
        if (type.includes('全') && type.includes('贏')) {
          title = '全贏 (Win)';
          desc = '<strong>全贏：</strong>淨勝球數完全越過讓球盤口，全數注碼贏取莊家賠率彩金。<br><br>例如：主隊讓半球 (-0.5)，主隊淨勝 1 球或以上，即刻全贏。';
        } else if (type.includes('半') && type.includes('贏')) {
          title = '贏半 (Half Win)';
          desc = '<strong>贏半：</strong>淨勝球數剛好贏半個盤（四份一盤拆注）。一半注碼按賠率收足彩金，另一半注碼退還本金。<br><br>例如：主隊讓半一 (-0.75)，主隊剛好淨勝 1 球，即係贏半（收一半彩金，退一半本）。';
        } else if (type.includes('走')) {
          title = '走盤 (Push / 退本)';
          desc = '<strong>走盤：</strong>計算讓球後雙方剛好打和。注碼全數退回，不輸不贏。<br><br>例如：主隊平手盤 (0) 打和，或者讓一球 (-1.0) 剛好淨勝 1 球。';
        } else if (type.includes('半') && type.includes('輸')) {
          title = '輸半 (Half Loss)';
          desc = '<strong>輸半：</strong>淨勝球數剛好輸半個盤。輸掉一半注碼，另一半退還本金。<br><br>例如：主隊讓平半 (-0.25) 打和，買主隊就輸半（輸一半本，退一半本）。';
        } else {
          title = '全輸 (Loss)';
          desc = '<strong>全輸：</strong>淨勝球數未能越過盤口，全數注碼輸掉。';
        }
        showTermInfo(title, desc);
      };
    });

    container.querySelectorAll('.form-pill').forEach(pill => {
      pill.style.cursor = 'pointer';
      pill.onclick = (e) => {
        e.stopPropagation();
        const outcome = pill.getAttribute('data-outcome') || pill.textContent;
        let title = '近五場走勢戰績';
        let desc = '';
        if (outcome === 'W' || outcome.includes('贏')) {
          title = '勝仗 (贏波 - Win)';
          desc = '<strong>贏波：</strong>該場賽事取得勝利，聯賽全取 3 分。';
        } else if (outcome === 'D' || outcome.includes('和')) {
          title = '和局 (打和 - Draw)';
          desc = '<strong>打和：</strong>該場賽事雙方握手言和，聯賽各得 1 分。';
        } else {
          title = '敗仗 (輸波 - Loss)';
          desc = '<strong>輸波：</strong>該場賽事未能取勝，聯賽得 0 分。';
        }
        showTermInfo(title, desc);
      };
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
