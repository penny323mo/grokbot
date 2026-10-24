/**
 * Verification test for v2 Round 3 fixes:
 * 1. Fresh player swipe shooting in 單場快速對決 with tutorial overlay active
 *    (Dispatches real CDP mouse events at x=195, y=780 -> y=520)
 * 2. Title screen CTA "世界盃淘汰賽 (16隊爭霸)" -> team select modal -> bracket screen
 * 3. End screen star breakdown field names (no undefined+undefined)
 * 4. 0 console errors
 */

import http from 'http';

async function run() {
  console.log('--- Starting Round 3 Fix Verification ---');

  const listRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await listRes.json();
  const pageTarget = targets.find(t => t.type === 'page' && (t.url.includes('8765') || t.title.includes('12碼讀心戰')));

  if (!pageTarget) throw new Error('Could not find active game page in Chrome targets');

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let msgId = 1;
  const pending = new Map();
  const pageErrors = [];

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.exceptionThrown') {
      console.error('Browser Exception:', data.params.exceptionDetails);
      pageErrors.push(data.params.exceptionDetails);
    }
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise(r => ws.onopen = r);

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res && res.result && res.result.value;
  }

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
    fitWindow: false
  });

  // 1. Fresh state: clear localStorage and reload
  console.log('1. Clearing storage and reloading fresh page at 390x844...');
  await evaluate(`localStorage.clear()`);
  await send('Page.reload', { ignoreCache: true });
  await new Promise(r => setTimeout(r, 1200));

  const totalShotsInitial = await evaluate(`window.BTB_GAME && window.BTB_GAME.model ? window.BTB_GAME.model.totalShots : -1`);
  console.log('  Initial totalShots:', totalShotsInitial);
  if (totalShotsInitial !== 0) throw new Error('Expected fresh game with 0 totalShots');

  // 2. Test World Cup Title CTA flow
  console.log('2. Testing World Cup Title CTA: Title -> Team Select -> Bracket...');
  await evaluate(`document.getElementById('btn-start-tournament').click()`);
  await new Promise(r => setTimeout(r, 300));

  const modalState = await evaluate(`(() => {
    const m = document.getElementById('modal-team-select');
    const computed = window.getComputedStyle(m);
    return {
      classList: Array.from(m.classList),
      displayStyle: m.style.display,
      computedDisplay: computed.display,
      computedPointerEvents: computed.pointerEvents
    };
  })()`);
  console.log('  Team Select Modal state:', JSON.stringify(modalState));
  if (!modalState.classList.includes('active') || modalState.computedDisplay !== 'flex') {
    throw new Error('Team Select modal failed to display!');
  }

  // Select team HKG and click confirm
  console.log('  Selecting team HKG and confirming...');
  await evaluate(`
    const item = document.querySelector('.team-pick-item[data-team-id="HKG"]');
    if (item) item.click();
    document.getElementById('btn-confirm-team').click();
  `);
  await new Promise(r => setTimeout(r, 400));

  const tourneyState = await evaluate(`(() => {
    const s = document.getElementById('screen-tournament');
    const matchCards = document.querySelectorAll('.bracket-match-row').length;
    return {
      active: s.classList.contains('active'),
      matchCards,
      playerTeam: document.getElementById('tourney-player-team-name').textContent,
      oppTeam: document.getElementById('tourney-opp-name').textContent,
      roundTitle: document.getElementById('tourney-round-title').textContent
    };
  })()`);
  console.log('  Tournament Bracket state:', JSON.stringify(tourneyState));
  if (!tourneyState.active || tourneyState.matchCards !== 8) {
    throw new Error('Tournament bracket not properly displayed with 8 R16 matches!');
  }

  // Return to title
  await evaluate(`document.getElementById('btn-tourney-home').click()`);
  await new Promise(r => setTimeout(r, 300));

  // 3. Test Quick Match & Real CDP Mouse Swipe with Tutorial Overlay Active
  console.log('3. Testing Quick Match real mouse swipe on fresh profile (tutorial active)...');
  await evaluate(`document.getElementById('btn-start-game').click()`);
  await new Promise(r => setTimeout(r, 600));

  const matchScreenState = await evaluate(`(() => {
    const match = document.getElementById('screen-match');
    const tut = document.getElementById('tutorial-overlay');
    const computedMatch = window.getComputedStyle(match);
    const computedTut = window.getComputedStyle(tut);
    return {
      matchActive: match.classList.contains('active'),
      tutActive: tut.classList.contains('active'),
      matchOverflow: computedMatch.overflow,
      matchPointerEvents: computedMatch.pointerEvents,
      tutDisplay: computedTut.display,
      tutPointerEvents: computedTut.pointerEvents
    };
  })()`);
  console.log('  Match & Tutorial state:', JSON.stringify(matchScreenState));

  if (!matchScreenState.matchActive) throw new Error('Match screen not active');
  if (matchScreenState.tutDisplay !== 'flex') throw new Error('Tutorial overlay should be display: flex on fresh profile');

  // Verify hit testing: elementFromPoint at (195, 780)
  const hitElement = await evaluate(`(() => {
    const el = document.elementFromPoint(195, 780);
    return {
      tagName: el ? el.tagName : null,
      id: el ? el.id : null,
      className: el ? el.className : null
    };
  })()`);
  console.log('  elementFromPoint(195, 780):', JSON.stringify(hitElement));
  if (hitElement.id !== 'scene') {
    throw new Error(`Expected canvas #scene to receive pointer hit, but got: ${JSON.stringify(hitElement)}`);
  }

  // Dispatch real CDP mouse swipe from (195, 780) -> (195, 500)
  console.log('  Dispatching CDP mouse swipe from (195, 780) -> (195, 500)...');
  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: 195,
    y: 780,
    button: 'left',
    clickCount: 1
  });

  const steps = [
    { x: 195, y: 740 },
    { x: 195, y: 690 },
    { x: 195, y: 640 },
    { x: 195, y: 580 },
    { x: 195, y: 510 }
  ];

  for (const step of steps) {
    await new Promise(r => setTimeout(r, 20));
    await send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: step.x,
      y: step.y,
      button: 'left'
    });
  }

  await new Promise(r => setTimeout(r, 20));
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: 195,
    y: 500,
    button: 'left'
  });

  console.log('  Swipe dispatched. Waiting for shot physics to simulate and resolve...');
  let shotFired = false;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 100));
    const state = await evaluate(`(() => {
      return {
        totalShots: window.BTB_GAME.model ? window.BTB_GAME.model.totalShots : 0,
        isBallInFlight: window.BTB_GAME.isBallInFlight,
        playerKicksCount: window.BTB_GAME.playerKicks.length
      };
    })()`);
    if (state.totalShots > 0 || state.isBallInFlight || state.playerKicksCount > 0) {
      shotFired = true;
      console.log(`  Shot detected at step ${i}:`, JSON.stringify(state));
      break;
    }
  }

  if (!shotFired) {
    throw new Error('Swipe failed to trigger a shot! totalShots is still 0!');
  }

  // Wait for shot to complete and resolve
  console.log('  Waiting for shot resolution (goal/saved)...');
  await new Promise(r => setTimeout(r, 2000));

  const resolutionState = await evaluate(`(() => {
    return {
      playerKicks: window.BTB_GAME.playerKicks,
      playerScore: window.BTB_GAME.playerScore,
      currentTurn: window.BTB_GAME.currentTurn,
      round: window.BTB_GAME.round
    };
  })()`);
  console.log('  Resolution state:', JSON.stringify(resolutionState));
  if (resolutionState.playerKicks.length === 0) {
    throw new Error('Expected at least 1 kick in playerKicks!');
  }

  // 4. Test End Screen & Stars Breakdown Field Names
  console.log('4. Testing End Screen Star Breakdown Field Names...');
  await evaluate(`
    window.BTB_GAME.playerScore = 3;
    window.BTB_GAME.cpuScore = 1;
    window.BTB_GAME.finishMatch();
  `);
  await new Promise(r => setTimeout(r, 400));

  const endScreenState = await evaluate(`(() => {
    const end = document.getElementById('screen-end');
    const breakdownHtml = document.getElementById('end-stars-breakdown').innerHTML;
    const items = Array.from(document.querySelectorAll('.star-breakdown-row')).map(el => ({
      text: el.textContent
    }));
    return {
      active: end.classList.contains('active'),
      breakdownHtml,
      items,
      hasUndefined: breakdownHtml.includes('undefined')
    };
  })()`);
  console.log('  End Screen Breakdown items:', JSON.stringify(endScreenState.items));
  console.log('  Contains undefined:', endScreenState.hasUndefined);

  if (endScreenState.hasUndefined) {
    throw new Error('End screen stars breakdown contains "undefined" literal!');
  }
  if (endScreenState.items.length === 0) {
    throw new Error('Expected at least 1 star breakdown item!');
  }

  console.log('5. Checking for any browser exceptions during test...');
  console.log('  Total page exceptions:', pageErrors.length);
  if (pageErrors.length > 0) {
    throw new Error(`Encountered ${pageErrors.length} browser errors during test`);
  }

  console.log('--- ALL VERIFICATION CHECKS PASSED SUCCESSFULLY! ---');
  process.exit(0);
}

run().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
