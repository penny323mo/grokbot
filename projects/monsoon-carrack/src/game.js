// Core Game Engine, State Machine & Diegetic UI Renderer for 季風帆影 · Monsoon Carrack
import {
  SAVE_KEY,
  INITIAL_STATE,
  YEAR_META,
  SEASONS,
  CHARACTERS,
  PORTS,
  GOODS,
  VOYAGE_EVENTS,
  PORT_LETTERS,
  ENDINGS,
  getRoute,
  getGoodPrice,
  getTotalCargoCount,
  grantCargo,
  getCargoValuation
} from "./data.js";
import { sound } from "./audio.js";

export function cloneInitialState() {
  return JSON.parse(JSON.stringify(INITIAL_STATE));
}

// Pure state manipulation helpers (exported for Node tests & browser UI)
export function buyGood(state, goodId, quantity) {
  const qty = Math.max(0, Math.floor(Number(quantity) || 0));
  if (qty <= 0) return { ok: false, reason: "數量須大於零" };
  const good = GOODS.find(g => g.id === goodId);
  if (!good) return { ok: false, reason: "未知貨品" };

  const currentCargo = getTotalCargoCount(state.cargo);
  const freeSpace = Math.max(0, state.cargoCap - currentCargo);
  const actualQty = Math.min(qty, freeSpace);
  if (actualQty <= 0) return { ok: false, reason: "底艙已滿，請先騰出艙位" };

  const { buy } = getGoodPrice(state, state.port, goodId);
  const maxAffordable = Math.floor(state.silver / buy);
  const finalQty = Math.min(actualQty, maxAffordable);
  if (finalQty <= 0) return { ok: false, reason: "紋銀不足" };

  const totalCost = finalQty * buy;
  state.silver -= totalCost;
  grantCargo(state, goodId, finalQty, totalCost);

  // Nudge local market price up slightly on heavy buying
  const pKey = `${state.port}_${goodId}`;
  state.marketPressure[pKey] = Math.min(14, ((state.marketPressure && state.marketPressure[pKey]) || 0) + Math.ceil(finalQty / 3));

  return {
    ok: true,
    qty: finalQty,
    unitPrice: buy,
    totalCost,
    message: `買入【${good.name}】${finalQty} ${good.unit}，共付紋銀 ${totalCost} 兩。`
  };
}

export function sellGood(state, goodId, quantity) {
  const qty = Math.max(0, Math.floor(Number(quantity) || 0));
  if (qty <= 0) return { ok: false, reason: "數量須大於零" };
  const good = GOODS.find(g => g.id === goodId);
  if (!good) return { ok: false, reason: "未知貨品" };

  const held = (state.cargo && state.cargo[goodId]) || 0;
  const finalQty = Math.min(qty, held);
  if (finalQty <= 0) return { ok: false, reason: "艙內無此存貨" };

  const { sell } = getGoodPrice(state, state.port, goodId);
  const revenue = finalQty * sell;
  const oldBasis = (state.cargoCostBasis && state.cargoCostBasis[goodId]) || 0;
  const unitBasis = held > 0 ? oldBasis / held : 0;
  const profit = Math.round(revenue - unitBasis * finalQty);

  state.silver += revenue;
  state.cargo[goodId] = held - finalQty;
  state.cargoCostBasis[goodId] = Math.max(0, Math.round(oldBasis - unitBasis * finalQty));

  // Nudge local price down slightly on heavy selling, boost local merchant reputation
  const pKey = `${state.port}_${goodId}`;
  state.marketPressure[pKey] = Math.max(-12, ((state.marketPressure && state.marketPressure[pKey]) || 0) - Math.ceil(finalQty / 3));
  state.reputation[state.port] = Math.min(100, (state.reputation[state.port] || 50) + (finalQty >= 4 ? 2 : 1));

  return {
    ok: true,
    qty: finalQty,
    unitPrice: sell,
    revenue,
    profit,
    message: `售出【${good.name}】${finalQty} ${good.unit}，得銀 ${revenue} 兩（${profit >= 0 ? `淨賺 +${profit}` : `折損 ${profit}`} 兩）。`
  };
}

export function pickVoyageEvents(state, route, count = 2, rng = Math.random) {
  const pool = VOYAGE_EVENTS.map(ev => {
    const w = typeof ev.weight === "function" ? ev.weight(route, state.season, state) : 1;
    const unseenBonus = state.seenEvents && !state.seenEvents.includes(ev.id) ? 2 : 0;
    return { ev, weight: Math.max(1, w + unseenBonus) };
  });

  const picked = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const totalW = pool.reduce((s, item) => s + item.weight, 0);
    let r = rng() * totalW;
    let idx = 0;
    for (let j = 0; j < pool.length; j++) {
      r -= pool[j].weight;
      if (r <= 0) {
        idx = j;
        break;
      }
    }
    picked.push(pool[idx].ev);
    pool.splice(idx, 1);
  }
  return picked;
}

export function payDebtAmount(state, amount) {
  const pay = Math.max(0, Math.min(Math.floor(amount), state.silver, state.debt));
  if (pay <= 0) return { ok: false, paid: 0 };
  state.silver -= pay;
  state.debt -= pay;
  state.paidThisYear = (state.paidThisYear || 0) + pay;
  state.reputation.guangzhou = Math.min(100, (state.reputation.guangzhou || 50) + Math.min(8, Math.ceil(pay / 150)));
  return { ok: true, paid: pay };
}

export function settleYearEnd(state) {
  const meta = YEAR_META[state.year] || YEAR_META[3];
  const requiredRemaining = Math.max(0, meta.instalmentDue - (state.paidThisYear || 0));
  let paidNow = 0;
  let liquidatedSilver = 0;

  if (requiredRemaining > 0) {
    const fromSilver = Math.min(state.silver, requiredRemaining);
    state.silver -= fromSilver;
    state.debt = Math.max(0, state.debt - fromSilver);
    paidNow += fromSilver;

    let stillShort = requiredRemaining - fromSilver;
    // Emergency cargo liquidation if cash silver is slightly short
    if (stillShort > 0) {
      for (const g of GOODS) {
        while (state.cargo[g.id] > 0 && stillShort > 0) {
          const { sell } = getGoodPrice(state, state.port, g.id);
          const oldQty = state.cargo[g.id];
          state.cargo[g.id] -= 1;
          state.cargoCostBasis[g.id] = Math.round((state.cargoCostBasis[g.id] || 0) * (state.cargo[g.id] / oldQty));
          liquidatedSilver += sell;
          const apply = Math.min(sell, stillShort);
          const leftover = sell - apply;
          state.debt = Math.max(0, state.debt - apply);
          state.silver += leftover;
          paidNow += apply;
          stillShort -= apply;
        }
      }
    }

    if (stillShort > 0) {
      // Failed mandatory guild deadline -> Ruin ending
      state.chronicle.push({
        year: state.year,
        season: "NE",
        text: `${meta.mingYear}歲末，同順堂催收銀契，尚欠 ${stillShort} 兩無力清償，《黑潮號》遭封船抵債。`
      });
      return {
        ruined: true,
        endingId: "ending_ruin",
        summary: `歲末決算尚欠同順堂 ${stillShort} 兩銀款，廣州官差與行商登船貼封。`
      };
    }
  }

  state.chronicle.push({
    year: state.year,
    season: "NE",
    text: `${meta.mingYear}歲末，向廣州同順堂交割本年銀款（累計餘欠 ${state.debt} 兩）${liquidatedSilver > 0 ? `，期間折價變賣艙貨湊銀 ${liquidatedSilver} 兩` : ""}。`
  });

  // Check if Year 3 finished or debt completely paid at Year 3
  if (state.year >= 3 || state.debt <= 0) {
    if (state.debt <= 0) {
      const netWorth = state.silver + getCargoValuation(state, state.port);
      let endingId = "ending_survival";
      if (state.brotherFound && state.clues.length >= 3) {
        endingId = "ending_truth";
      } else if (netWorth >= 1800) {
        endingId = "ending_fortune";
      }
      return {
        finished: true,
        endingId,
        summary: `三千六百兩銀契本息全數清償！現存紋銀 ${state.silver} 兩，船貨估值 ${getCargoValuation(state, state.port)} 兩。`
      };
    }
    return {
      ruined: true,
      endingId: "ending_ruin",
      summary: `三載期滿，尚欠同順堂 ${state.debt} 兩未清，《黑潮號》折檣抵債。`
    };
  }

  // Advance to next year SW monsoon
  state.year += 1;
  state.season = "SW";
  state.daysLeft = 120;
  state.paidThisYear = 0;
  // Decay market pressure between years
  for (const k of Object.keys(state.marketPressure)) {
    state.marketPressure[k] = Math.trunc(state.marketPressure[k] * 0.35);
  }

  return {
    ruined: false,
    finished: false,
    paidNow,
    liquidatedSilver,
    summary: `${meta.mingYear}期款交割完畢！現餘總欠款 ${state.debt} 兩。春雷初動，${YEAR_META[state.year].mingYear}西南季風航季開啟。`
  };
}

// Scripted "careful player" simulation for automated verification in tests/integrity.test.js
export function simulateCarefulPlayer(seed = 1600) {
  let s = seed >>> 0;
  const rng = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };

  const state = cloneInitialState();
  const log = [];

  const stepSeasonVoyage = (targetPort, buyList = []) => {
    // Sell all current cargo at current port if profitable
    for (const g of GOODS) {
      const held = state.cargo[g.id] || 0;
      if (held > 0) {
        const { sell } = getGoodPrice(state, state.port, g.id);
        const avgCost = (state.cargoCostBasis[g.id] || 0) / held;
        if (sell > avgCost * 1.05) {
          sellGood(state, g.id, held);
        }
      }
    }

    // Read available letter at port if any
    const letter = PORT_LETTERS.find(
      l =>
        l.port === state.port &&
        l.minYear <= state.year &&
        !state.readLetters.includes(l.id) &&
        (!l.requiresClues || l.requiresClues.every(c => state.clues.includes(c))) &&
        (!l.condition || l.condition(state))
    );
    if (letter) {
      state.readLetters.push(letter.id);
      letter.choices[0].effect(state);
    }

    // Repair & provision
    if (state.hull < 85 && state.silver > 60) {
      const rep = Math.min(100 - state.hull, 25);
      state.silver -= rep * PORTS[state.port].repairCostPerPt;
      state.hull += rep;
    }
    if (state.provisions < 75 && state.silver > 30) {
      state.silver -= 24;
      state.provisions = Math.min(100, state.provisions + 30);
    }

    // Buy planned goods keeping 90 taels reserve for voyage events
    for (const item of buyList) {
      const { buy } = getGoodPrice(state, state.port, item.goodId);
      const spendable = Math.max(0, state.silver - 90);
      const maxBuy = Math.min(item.maxQty || 45, Math.floor(spendable / buy));
      if (maxBuy > 0) {
        buyGood(state, item.goodId, maxBuy);
      }
    }

    // Sail to targetPort
    const route = getRoute(state.port, targetPort, state.season);
    state.daysLeft = Math.max(0, state.daysLeft - route.expectedDays);
    state.provisions = Math.max(10, state.provisions - Math.round(route.expectedDays * 0.45));
    state.totalVoyages += 1;

    // Resolve 1 event conservatively
    const [ev] = pickVoyageEvents(state, route, 1, rng);
    if (ev) {
      if (!state.seenEvents.includes(ev.id)) state.seenEvents.push(ev.id);
      const choice = ev.choices[0];
      choice.resolve(state, rng());
    }

    state.port = targetPort;
    // Sell everything on arrival
    for (const g of GOODS) {
      if (state.cargo[g.id] > 0) {
        sellGood(state, g.id, state.cargo[g.id]);
      }
    }
    log.push(`Y${state.year}-${state.season}: arrived ${targetPort}, silver=${state.silver}, debt=${state.debt}`);
  };

  for (let yr = 1; yr <= 3; yr++) {
    // SW Season: Macau -> Guangzhou (load raw_silk & silk_fabric) -> Nagasaki (sell silk for huge silver)
    stepSeasonVoyage("guangzhou", [{ goodId: "pepper", maxQty: 10 }]);
    stepSeasonVoyage("nagasaki", [
      { goodId: "raw_silk", maxQty: 38 },
      { goodId: "silk_fabric", maxQty: 20 },
      { goodId: "musk", maxQty: 8 }
    ]);

    // Transition SW -> NE
    state.season = "NE";
    state.daysLeft = 120;

    // NE Season: Nagasaki (load cheap silver) -> Manila (sell silk/porcelain, load silver) -> Guangzhou (sell silver at 1.38x)
    stepSeasonVoyage("manila", [{ goodId: "silver", maxQty: 45 }]);
    stepSeasonVoyage("guangzhou", [
      { goodId: "silver", maxQty: 45 },
      { goodId: "sappanwood", maxQty: 15 }
    ]);

    // Pay down annual instalment (or extra if rich)
    const meta = YEAR_META[state.year];
    const payTarget = yr < 3 ? meta.instalmentDue : state.debt;
    payDebtAmount(state, Math.min(state.silver - 120, Math.max(payTarget, state.debt)));

    const res = settleYearEnd(state);
    if (res.ruined || res.finished) {
      return { state, result: res, log };
    }
  }

  return { state, result: { finished: state.debt <= 0, endingId: state.debt <= 0 ? "ending_fortune" : "ending_ruin" }, log };
}

// ============================================================================
// Browser Diegetic UI Controller
// ============================================================================

class MonsoonCarrackApp {
  constructor(root) {
    this.root = root;
    this.state = cloneInitialState();
    this.phase = "title"; // "title" | "port" | "chart" | "voyage" | "ledger" | "yearend" | "ending"
    this.portSubview = "overview"; // "overview" | "market" | "dock" | "letters"
    this.marketMode = "buy"; // "buy" | "sell"
    this.selectedGoodId = "raw_silk";
    this.tradeQty = 5;
    this.selectedDestPort = "nagasaki";
    this.toastMessage = "";
    this.activeVoyage = null; // { route, events, stepIndex, lastOutcome }
    this.yearEndReport = null;
    this.endingData = null;
    this.showCreditsModal = false;

    this.bindGlobalEvents();
    this.render();
  }

  hasSavedGame() {
    try {
      return Boolean(localStorage.getItem(SAVE_KEY));
    } catch (_) {
      return false;
    }
  }

  saveGame() {
    try {
      const payload = {
        state: this.state,
        phase: this.phase === "title" ? "port" : this.phase,
        portSubview: this.portSubview,
        selectedDestPort: this.selectedDestPort,
        endingData: this.endingData
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    } catch (_) {}
  }

  loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.state || !PORTS[parsed.state.port]) return false;
      this.state = {
        ...cloneInitialState(),
        ...parsed.state,
        cargo: { ...cloneInitialState().cargo, ...(parsed.state.cargo || {}) },
        cargoCostBasis: { ...cloneInitialState().cargoCostBasis, ...(parsed.state.cargoCostBasis || {}) },
        reputation: { ...cloneInitialState().reputation, ...(parsed.state.reputation || {}) }
      };
      this.phase = parsed.phase || "port";
      if (this.phase === "voyage" || this.phase === "yearend") {
        this.phase = "port";
      }
      if (this.phase === "ending" && !parsed.endingData) {
        this.phase = "port";
      }
      this.portSubview = parsed.portSubview || "overview";
      this.selectedDestPort = parsed.selectedDestPort || (this.state.port === "macau" ? "nagasaki" : "macau");
      this.endingData = parsed.endingData || null;
      return true;
    } catch (_) {
      return false;
    }
  }

  startNewGame() {
    sound.unlock();
    sound.play("bell", 0.65);
    sound.setAmbient("harbour");
    this.state = cloneInitialState();
    this.phase = "port";
    this.portSubview = "overview";
    this.selectedGoodId = "raw_silk";
    this.tradeQty = 5;
    this.selectedDestPort = "guangzhou";
    this.toastMessage = "萬曆二十八年孟夏，你接掌《黑潮號》印信。可先往【市集】或【書信】查看家書，再赴廣州或長崎貿易。";
    this.saveGame();
    this.render();
  }

  continueGame() {
    sound.unlock();
    sound.play("paper", 0.65);
    if (!this.loadGame()) {
      this.startNewGame();
      return;
    }
    sound.setAmbient(this.phase === "voyage" ? "sea" : "harbour");
    this.render();
  }

  setToast(msg) {
    this.toastMessage = msg;
  }

  getUnreadLettersAtPort(portId = this.state.port) {
    return PORT_LETTERS.filter(
      l =>
        l.port === portId &&
        l.minYear <= this.state.year &&
        !this.state.readLetters.includes(l.id) &&
        (!l.requiresClues || l.requiresClues.every(c => this.state.clues.includes(c))) &&
        (!l.condition || l.condition(this.state))
    );
  }

  advanceSeasonOrYear() {
    if (this.state.season === "SW") {
      this.state.season = "NE";
      this.state.daysLeft = 120;
      this.state.chronicle.push({
        year: this.state.year,
        season: "NE",
        text: `${YEAR_META[this.state.year].mingYear}孟冬，東北季風起，北風南下，海舶紛紛由日本滿載丁銀南歸。`
      });
      this.phase = "port";
      this.portSubview = "overview";
      this.setToast("秋去冬來，【東北季風】航季開啟！順風宜由長崎歸澳，或下馬尼拉、麻六甲。");
      sound.play("bell", 0.55);
      this.saveGame();
      this.render();
    } else {
      // End of NE season -> Year-End Guild Settlement
      const res = settleYearEnd(this.state);
      sound.play("bell", 0.7);
      if (res.ruined || res.finished) {
        this.endingData = ENDINGS[res.endingId] || ENDINGS.ending_survival;
        this.phase = "ending";
      } else {
        this.yearEndReport = res;
        this.phase = "yearend";
      }
      this.saveGame();
      this.render();
    }
  }

  beginVoyage(destPortId) {
    if (!destPortId || destPortId === this.state.port || !PORTS[destPortId]) return;
    const route = getRoute(this.state.port, destPortId, this.state.season);

    if (this.state.daysLeft < route.expectedDays) {
      const fittingPorts = Object.keys(PORTS).filter(
        pid =>
          pid !== this.state.port &&
          getRoute(this.state.port, pid, this.state.season).expectedDays <= this.state.daysLeft
      );
      if (fittingPorts.length > 0) {
        const names = fittingPorts.map(pid => PORTS[pid].name).join("、");
        this.setToast(
          `本季尚餘 ${this.state.daysLeft} 日，不足以遠航${PORTS[destPortId].name}（預計需 ${route.expectedDays} 日）；可改選較近航線（${names}）或返埠結算。`
        );
        this.render();
        return;
      }
      this.advanceSeasonOrYear();
      return;
    }

    if (this.state.hull <= 12) {
      this.setToast("船體受損過重（低於 12%），請先於【船塢】修補龍骨方可出洋！");
      this.phase = "port";
      this.portSubview = "dock";
      this.render();
      return;
    }
    if (this.state.provisions < 15) {
      this.setToast("船上淡水乾糧不足，請先於【船塢】添置糧水！");
      this.phase = "port";
      this.portSubview = "dock";
      this.render();
      return;
    }

    const numEvents = route.distLi <= 400 ? 1 : 2;
    const events = pickVoyageEvents(this.state, route, numEvents);

    this.activeVoyage = {
      fromPort: this.state.port,
      toPort: destPortId,
      route,
      events,
      stepIndex: 0,
      lastOutcome: null
    };

    sound.play("creak", 0.75);
    sound.setAmbient("sea");
    this.phase = "voyage";
    this.render();
  }

  chooseVoyageOption(choiceIndex) {
    const v = this.activeVoyage;
    if (!v) return;
    const ev = v.events[v.stepIndex];
    if (!ev) return;
    const choice = ev.choices[choiceIndex] || ev.choices[0];
    if (!this.state.seenEvents.includes(ev.id)) {
      this.state.seenEvents.push(ev.id);
    }
    const roll = Math.random();
    const outcomeText = choice.resolve(this.state, roll);
    v.lastOutcome = {
      eventTitle: ev.title,
      choiceLabel: choice.label,
      outcomeText
    };
    sound.play("paper", 0.65);
    this.render();
  }

  advanceVoyageStep() {
    const v = this.activeVoyage;
    if (!v) return;

    if (v.stepIndex < v.events.length - 1) {
      v.stepIndex += 1;
      v.lastOutcome = null;
      sound.play("creak", 0.6);
      this.render();
      return;
    }

    // Complete voyage arrival
    const { route, toPort } = v;
    this.state.port = toPort;
    this.state.totalVoyages += 1;
    this.state.daysLeft = Math.max(0, this.state.daysLeft - route.expectedDays);
    const provDrain = Math.max(6, Math.round(route.expectedDays * 0.42));
    this.state.provisions = Math.max(5, this.state.provisions - provDrain);

    const destName = PORTS[toPort].name;
    this.state.chronicle.push({
      year: this.state.year,
      season: this.state.season,
      text: `${YEAR_META[this.state.year].mingYear}${SEASONS[this.state.season].name}，自${PORTS[v.fromPort].name}航抵${destName}（歷時 ${route.expectedDays} 日，${route.windFit}）。`
    });

    this.activeVoyage = null;
    this.phase = "port";
    this.portSubview = "overview";
    // Pick a sensible next default destination on the chart
    this.selectedDestPort = toPort === "macau" ? "guangzhou" : "macau";
    sound.play("bell", 0.6);
    sound.setAmbient("harbour");

    // If season days exhausted on arrival, transition season/year immediately
    if (this.state.daysLeft <= 0) {
      this.advanceSeasonOrYear();
      return;
    }

    this.setToast(`《黑潮號》平安抵達【${destName}】！本季尚餘 ${this.state.daysLeft} 日航期。`);
    this.saveGame();
    this.render();
  }

  bindGlobalEvents() {
    this.root.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      e.preventDefault();
      sound.unlock();
      const action = btn.getAttribute("data-action");
      this.handleAction(action, btn);
    });
  }

  handleAction(action, el) {
    switch (action) {
      case "new-game":
        this.startNewGame();
        break;
      case "continue-game":
        this.continueGame();
        break;
      case "toggle-credits":
        sound.play("paper", 0.5);
        this.showCreditsModal = !this.showCreditsModal;
        this.render();
        break;
      case "toggle-mute":
        sound.toggleMute();
        this.render();
        break;
      case "go-title":
        sound.play("paper", 0.5);
        this.phase = "title";
        this.render();
        break;
      case "open-port-subview": {
        const sub = el.getAttribute("data-subview") || "overview";
        sound.play("paper", 0.55);
        this.phase = "port";
        this.portSubview = sub;
        this.render();
        break;
      }
      case "open-chart": {
        sound.play("paper", 0.6);
        this.phase = "chart";
        if (!this.selectedDestPort || this.selectedDestPort === this.state.port) {
          this.selectedDestPort = this.state.port === "macau" ? "nagasaki" : "macau";
        }
        this.render();
        break;
      }
      case "open-ledger":
        sound.play("paper", 0.6);
        this.phase = "ledger";
        this.render();
        break;
      case "select-good": {
        const gid = el.getAttribute("data-good");
        if (gid) {
          this.selectedGoodId = gid;
          sound.play("paper", 0.45);
          this.render();
        }
        break;
      }
      case "step-qty": {
        const delta = parseInt(el.getAttribute("data-delta") || "0", 10);
        this.tradeQty = Math.max(1, Math.min(60, this.tradeQty + delta));
        this.render();
        break;
      }
      case "preset-qty": {
        const mode = el.getAttribute("data-preset");
        const freeSpace = Math.max(0, this.state.cargoCap - getTotalCargoCount(this.state.cargo));
        const { buy } = getGoodPrice(this.state, this.state.port, this.selectedGoodId);
        const maxBuy = Math.max(1, Math.min(freeSpace, Math.floor(this.state.silver / buy)));
        const held = this.state.cargo[this.selectedGoodId] || 0;
        if (mode === "max-buy") {
          this.tradeQty = maxBuy;
        } else if (mode === "half-buy") {
          this.tradeQty = Math.max(1, Math.floor(maxBuy / 2));
        } else if (mode === "all-sell") {
          this.tradeQty = Math.max(1, held);
        }
        this.render();
        break;
      }
      case "buy-good": {
        const gid = el.getAttribute("data-good") || this.selectedGoodId;
        const res = buyGood(this.state, gid, this.tradeQty);
        if (res.ok) {
          sound.play("coins", 0.7);
          this.setToast(res.message);
          this.saveGame();
        } else {
          this.setToast(`無法買入：${res.reason}`);
        }
        this.render();
        break;
      }
      case "sell-good": {
        const gid = el.getAttribute("data-good") || this.selectedGoodId;
        const qty = el.getAttribute("data-qty") ? parseInt(el.getAttribute("data-qty"), 10) : this.tradeQty;
        const res = sellGood(this.state, gid, qty);
        if (res.ok) {
          sound.play("coins", 0.75);
          this.setToast(res.message);
          this.saveGame();
        } else {
          this.setToast(`無法售出：${res.reason}`);
        }
        this.render();
        break;
      }
      case "sell-all-cargo": {
        let totalRev = 0;
        let soldUnits = 0;
        for (const g of GOODS) {
          const held = this.state.cargo[g.id] || 0;
          if (held > 0) {
            const r = sellGood(this.state, g.id, held);
            if (r.ok) {
              totalRev += r.revenue;
              soldUnits += r.qty;
            }
          }
        }
        if (soldUnits > 0) {
          sound.play("coins", 0.8);
          this.setToast(`一鍵清倉售出 ${soldUnits} 件貨物，共得紋銀 ${totalRev} 兩！`);
          this.saveGame();
        } else {
          this.setToast("目前底艙並無貨物可售。");
        }
        this.render();
        break;
      }
      case "dock-repair": {
        const p = PORTS[this.state.port];
        const missing = this.state.maxHull - this.state.hull;
        if (missing <= 0) {
          this.setToast("《黑潮號》船體完好無損，無需修補。");
          this.render();
          return;
        }
        const canPts = Math.min(missing, Math.floor(this.state.silver / p.repairCostPerPt));
        if (canPts <= 0) {
          this.setToast("紋銀不足以支付船塢修補工料費。");
          this.render();
          return;
        }
        const cost = canPts * p.repairCostPerPt;
        this.state.silver -= cost;
        this.state.hull += canPts;
        sound.play("creak", 0.7);
        this.setToast(`船塢匠人以鐵力木與桐油修補船殼（船體 +${canPts}%，耗銀 ${cost} 兩）。`);
        this.saveGame();
        this.render();
        break;
      }
      case "dock-provisions": {
        const p = PORTS[this.state.port];
        if (this.state.provisions >= 100) {
          this.setToast("底艙淡水與乾糧已滿。");
          this.render();
          return;
        }
        if (this.state.silver < p.provisionCostPer10) {
          this.setToast("紋銀不足以添置糧水。");
          this.render();
          return;
        }
        const steps = Math.min(Math.ceil((100 - this.state.provisions) / 20), Math.floor(this.state.silver / p.provisionCostPer10));
        const cost = steps * p.provisionCostPer10;
        this.state.silver -= cost;
        this.state.provisions = Math.min(100, this.state.provisions + steps * 20);
        sound.play("coins", 0.6);
        this.setToast(`添置淡水、鹹魚與船餅（糧水升至 ${this.state.provisions}%，耗銀 ${cost} 兩）。`);
        this.saveGame();
        this.render();
        break;
      }
      case "dock-crew": {
        const p = PORTS[this.state.port];
        if (this.state.crew >= this.state.maxCrew) {
          this.setToast("水手額滿，且士氣飽滿。");
          this.render();
          return;
        }
        const hire = Math.min(5, this.state.maxCrew - this.state.crew, Math.floor(this.state.silver / p.hireCostPerCrew));
        if (hire <= 0) {
          this.setToast("紋銀不足以招募水手。");
          this.render();
          return;
        }
        const cost = hire * p.hireCostPerCrew;
        this.state.silver -= cost;
        this.state.crew += hire;
        this.state.morale = Math.min(100, this.state.morale + 4);
        sound.play("coins", 0.6);
        this.setToast(`招募 ${hire} 名熟習海務嘅老水手登船（耗銀 ${cost} 兩）。`);
        this.saveGame();
        this.render();
        break;
      }
      case "dock-feast": {
        if (this.state.silver < 30) {
          this.setToast("犒賞全船水手需紋銀 30 兩。");
          this.render();
          return;
        }
        this.state.silver -= 30;
        this.state.morale = Math.min(100, this.state.morale + 18);
        sound.play("bell", 0.6);
        this.setToast("喺碼頭酒肆設宴犒賞全船水手，士氣大振（士氣 +18，耗銀 30 兩）！");
        this.saveGame();
        this.render();
        break;
      }
      case "letter-choice": {
        const lid = el.getAttribute("data-letter");
        const cidx = parseInt(el.getAttribute("data-choice") || "0", 10);
        const letter = PORT_LETTERS.find(l => l.id === lid);
        const canRead =
          letter &&
          !this.state.readLetters.includes(letter.id) &&
          (!letter.requiresClues || letter.requiresClues.every(c => this.state.clues.includes(c))) &&
          (!letter.condition || letter.condition(this.state));
        if (canRead) {
          this.state.readLetters.push(letter.id);
          const ch = letter.choices[cidx] || letter.choices[0];
          const msg = ch.effect(this.state);
          this.state.chronicle.push({
            year: this.state.year,
            season: this.state.season,
            text: `於${PORTS[this.state.port].name}展讀《${letter.title}》：${msg}`
          });
          sound.play("paper", 0.7);
          this.setToast(msg);
          this.saveGame();
          this.render();
        }
        break;
      }
      case "select-dest-port": {
        const pid = el.getAttribute("data-port");
        if (pid && pid !== this.state.port) {
          this.selectedDestPort = pid;
          sound.play("paper", 0.5);
          this.render();
        }
        break;
      }
      case "confirm-sail":
        this.beginVoyage(this.selectedDestPort);
        break;
      case "voyage-choice": {
        const idx = parseInt(el.getAttribute("data-choice") || "0", 10);
        this.chooseVoyageOption(idx);
        break;
      }
      case "voyage-next":
        this.advanceVoyageStep();
        break;
      case "pay-debt": {
        const amt = parseInt(el.getAttribute("data-amount") || "300", 10);
        const res = payDebtAmount(this.state, amt);
        if (res.ok) {
          sound.play("coins", 0.8);
          this.setToast(`向廣州同順堂交割銀契 ${res.paid} 兩！現餘總欠款 ${this.state.debt} 兩。`);
          if (this.state.debt <= 0) {
            const netWorth = this.state.silver + getCargoValuation(this.state, this.state.port);
            const eid = (this.state.brotherFound && this.state.clues.length >= 3)
              ? "ending_truth"
              : (netWorth >= 1800 ? "ending_fortune" : "ending_survival");
            this.endingData = ENDINGS[eid];
            this.phase = "ending";
          }
          this.saveGame();
        } else {
          this.setToast("紋銀不足或已無欠款。");
        }
        this.render();
        break;
      }
      case "end-season":
        this.advanceSeasonOrYear();
        break;
      case "close-yearend":
        sound.play("paper", 0.6);
        this.yearEndReport = null;
        this.phase = "port";
        this.portSubview = "overview";
        this.render();
        break;
      default:
        break;
    }
  }

  // ==========================================================================
  // Render Templates
  // ==========================================================================

  renderTopRibbon() {
    const s = this.state;
    const meta = YEAR_META[s.year] || YEAR_META[1];
    const seasonInfo = SEASONS[s.season];
    const cargoUsed = getTotalCargoCount(s.cargo);
    const dueLeft = Math.max(0, meta.instalmentDue - (s.paidThisYear || 0));

    return `
      <header class="top-ribbon" role="banner">
        <div class="ribbon-row ribbon-top">
          <div class="ribbon-date">
            <span class="ming-year">${meta.mingYear}</span>
            <span class="season-pill season-${s.season.toLowerCase()}">${seasonInfo.name} · 餘 ${s.daysLeft} 日</span>
          </div>
          <div class="ribbon-actions">
            <button type="button" class="stamp-mini" data-action="open-ledger" aria-label="打開賬冊">賬冊</button>
            <button type="button" class="stamp-mini" data-action="toggle-mute" aria-label="切換音效">${sound.muted ? "靜" : "音"}</button>
            <button type="button" class="stamp-mini" data-action="go-title" aria-label="返回卷首">卷首</button>
          </div>
        </div>
        <div class="ribbon-row ribbon-stats">
          <div class="stat-cell">
            <span class="stat-label">紋銀</span>
            <strong class="stat-val gold-text">${s.silver} 兩</strong>
          </div>
          <div class="stat-cell">
            <span class="stat-label">同順堂欠契</span>
            <strong class="stat-val vermilion-text">${s.debt} 兩 <small>(本年尚欠 ${dueLeft})</small></strong>
          </div>
          <div class="stat-cell">
            <span class="stat-label">底艙</span>
            <strong class="stat-val">${cargoUsed}/${s.cargoCap} 擔</strong>
          </div>
          <div class="stat-cell">
            <span class="stat-label">船體/糧水</span>
            <strong class="stat-val">${s.hull}% / ${s.provisions}%</strong>
          </div>
        </div>
      </header>
    `;
  }

  renderTitleScreen() {
    const hasSave = this.hasSavedGame();
    return `
      <main class="screen title-screen">
        <img class="bg-art" src="assets/art/title_key.webp" alt="南蠻黑船入澳屏風畫">
        <div class="title-scrim"></div>

        <section class="title-cloud-plaques">
          <div class="title-era-tag">萬曆二十八年 · 公元一六〇〇年 · 澳門南灣</div>
          <h1 class="brush-title">季風帆影</h1>
          <p class="latin-sub">MONSOON CARRACK · NAU DO TRATO DE MACAU</p>

          <div class="title-premise-scroll paper-surface">
            <p>兄長沈仲明所駕黑船《望海號》失蹤呂宋外海，留低廣州十三行<strong>三千六百兩</strong>船契巨債。你奉母命接掌<strong>《黑潮號》</strong>，趁冬夏兩道季風往返<strong>長崎、馬尼拉、麻六甲與廣州</strong>——以湖絲易丁銀、以青花博烏椒，喺三年大限前贖回祖業，查明兄長生死真相。</p>
          </div>
        </section>

        <nav class="title-signboards" aria-label="主選單">
          ${hasSave ? `
            <button type="button" class="signboard-btn primary-sign" data-action="continue-game">
              <span class="sign-main">續航 · 啟封舊檔</span>
              <span class="sign-sub">Continuar Viagem · 接續未完航程</span>
            </button>
          ` : ""}
          <button type="button" class="signboard-btn ${hasSave ? "" : "primary-sign"}" data-action="new-game">
            <span class="sign-main">新船主 · 奉印登船</span>
            <span class="sign-sub">Nova Carreira · 萬曆二十八年孟夏起錨</span>
          </button>
          <button type="button" class="signboard-btn secondary-sign" data-action="toggle-credits">
            <span class="sign-main">船主手記 · 典故與鳴謝</span>
            <span class="sign-sub">Crónica Histórica & Créditos</span>
          </button>
        </nav>

        ${this.showCreditsModal ? `
          <aside class="modal-backdrop" role="dialog" aria-modal="true" aria-label="船主手記與鳴謝">
            <div class="manuscript-modal paper-surface">
              <h2 class="modal-brush-heading">船主手記 · 南蠻黑船考</h2>
              <div class="modal-body-scroll">
                <p><strong>【歷史背景】</strong>明萬曆年間（約 1600 年），澳門為中日「黑船貿易」（Nau do Trato / <em>Kurofune</em>）樞紐。船主每年春季赴廣州採辦湖州生絲與青花瓷，五月趁<strong>西南季風</strong>北航日本長崎易取灰吹丁銀，冬春再乘<strong>東北季風</strong>返航澳門，或轉赴馬尼拉換取美洲鷹洋、赴麻六甲採辦南洋烏椒與蘇木。</p>
                <p><strong>【行船要訣】</strong>一載分為「西南季風」與「東北季風」兩季。順風出航省時穩妥，逆風強航則易遇颶母與無風帶。每歲年末（東北季風結束時），廣州十三行同順堂將催收分期銀款（首年 900 兩、次年 1,200 兩、三年結清 3,600 兩）。</p>
                <p><strong>【美術與音效鳴謝】</strong>本作為歷史題材單機敘事策略遊戲，角色與劇情純屬虛構。視覺致敬十七世紀狩野內膳《南蠻屏風》金雲重彩與航海圖冊；字體採用自託管思源宋體（Noto Serif TC）、馬善政毛筆體與 Cormorant Garamond；音效採 CC0 授權合成之海浪、船木、銀幣、書頁與銅鐘聲。</p>
              </div>
              <button type="button" class="seal-btn" data-action="toggle-credits">合上書卷</button>
            </div>
          </aside>
        ` : ""}
      </main>
    `;
  }

  renderPortScreen() {
    const s = this.state;
    const port = PORTS[s.port] || PORTS.macau;
    const unreadLetters = this.getUnreadLettersAtPort(s.port);

    return `
      <main class="screen port-screen">
        ${this.renderTopRibbon()}

        <div class="port-stage">
          <div class="port-vignette-frame">
            <img class="port-vignette-img" src="${port.art}" alt="${port.name}屏風畫">
            <div class="port-vignette-overlay"></div>
            <div class="port-plaque">
              <div class="port-plaque-titles">
                <h1 class="port-title-cn">${port.name}</h1>
                <span class="port-title-sub">${port.sub}</span>
                <span class="port-title-latin">${port.latin}</span>
              </div>
              <div class="port-rep-stamp">
                <span>埠頭聲望</span>
                <strong>${s.reputation[s.port] || 50}</strong>
              </div>
            </div>
          </div>

          <nav class="port-signboard-tabs" aria-label="埠頭行務">
            <button type="button" class="port-tab ${this.portSubview === "overview" ? "is-active" : ""}" data-action="open-port-subview" data-subview="overview">
              <span class="tab-cn">埠頭總覽</span>
              <span class="tab-en">Porto</span>
            </button>
            <button type="button" class="port-tab ${this.portSubview === "market" ? "is-active" : ""}" data-action="open-port-subview" data-subview="market">
              <span class="tab-cn">市集牙行</span>
              <span class="tab-en">Mercado</span>
            </button>
            <button type="button" class="port-tab ${this.portSubview === "dock" ? "is-active" : ""}" data-action="open-port-subview" data-subview="dock">
              <span class="tab-cn">船塢修造</span>
              <span class="tab-en">Estaleiro</span>
            </button>
            <button type="button" class="port-tab ${this.portSubview === "letters" ? "is-active" : ""}" data-action="open-port-subview" data-subview="letters">
              <span class="tab-cn">書信密函${unreadLetters.length > 0 ? ` (${unreadLetters.length})` : ""}</span>
              <span class="tab-en">Cartas</span>
            </button>
            <button type="button" class="port-tab sail-tab" data-action="open-chart">
              <span class="tab-cn">啟航針路</span>
              <span class="tab-en">Carta</span>
            </button>
          </nav>

          ${this.toastMessage ? `
            <div class="note-toast paper-strip" role="status">
              <span class="seal-dot">印</span>
              <span class="toast-text">${this.toastMessage}</span>
            </div>
          ` : ""}

          <section class="port-content-scroll">
            ${this.portSubview === "market"
              ? this.renderMarketSubview(port)
              : this.portSubview === "dock"
              ? this.renderDockSubview(port)
              : this.portSubview === "letters"
              ? this.renderLettersSubview(port, unreadLetters)
              : this.renderPortOverviewSubview(port, unreadLetters)}
          </section>
        </div>
      </main>
    `;
  }

  renderPortOverviewSubview(port, unreadLetters) {
    const s = this.state;
    const seasonInfo = SEASONS[s.season];
    const meta = YEAR_META[s.year] || YEAR_META[1];
    const dueLeft = Math.max(0, meta.instalmentDue - (s.paidThisYear || 0));

    // Find top cheap goods to buy here and top dear goods to sell here
    const priced = GOODS.map(g => ({ good: g, ...getGoodPrice(s, s.port, g.id) }));
    const cheapList = priced.filter(p => p.tagClass === "cheap").map(p => `${p.good.shortName}(${p.buy}兩)`).join("、") || "各貨平穩";
    const dearList = priced.filter(p => p.tagClass === "dear").map(p => `${p.good.shortName}(${p.sell}兩)`).join("、") || "常價交割";

    return `
      <div class="paper-surface overview-card">
        <p class="port-desc-text">${port.desc}</p>

        <div class="monsoon-banner-box">
          <div class="monsoon-head">
            <strong>當令風候：${seasonInfo.name}（${seasonInfo.sub}）</strong>
            <span class="latin-inline">${seasonInfo.latin}</span>
          </div>
          <p class="monsoon-sub">${seasonInfo.windSummary}</p>
        </div>

        <div class="market-digest-grid">
          <div class="digest-box cheap-box">
            <span class="digest-label">本埠低價宜買</span>
            <strong class="digest-val">${cheapList}</strong>
          </div>
          <div class="digest-box dear-box">
            <span class="digest-label">本埠高價宜賣</span>
            <strong class="digest-val">${dearList}</strong>
          </div>
        </div>

        ${s.activeRumour ? `
          <div class="rumour-slip">
            <span class="rumour-badge">行情風聲</span>
            <span>${s.activeRumour.title}</span>
          </div>
        ` : ""}

        <div class="overview-action-grid">
          <button type="button" class="scroll-action-btn" data-action="open-port-subview" data-subview="market">
            <span class="action-title">入【市集】買賣絲銀百貨</span>
            <span class="action-sub">底艙存貨 ${getTotalCargoCount(s.cargo)}/${s.cargoCap} 擔 · 現銀 ${s.silver} 兩</span>
          </button>

          ${unreadLetters.length > 0 ? `
            <button type="button" class="scroll-action-btn highlight-btn" data-action="open-port-subview" data-subview="letters">
              <span class="action-title">拆閱【書信】新到密函（${unreadLetters.length} 封）</span>
              <span class="action-sub">${unreadLetters[0].title} · 關乎銀契與兄長下落</span>
            </button>
          ` : `
            <button type="button" class="scroll-action-btn" data-action="open-port-subview" data-subview="dock">
              <span class="action-title">赴【船塢】修船添置糧水</span>
              <span class="action-sub">船體 ${s.hull}% · 水手 ${s.crew} 人 · 糧水 ${s.provisions}%</span>
            </button>
          `}

          <button type="button" class="scroll-action-btn primary-scroll-btn" data-action="open-chart">
            <span class="action-title">展【海圖】選港揚帆起錨</span>
            <span class="action-sub">趁${seasonInfo.name}出洋貿易 · 尚餘 ${s.daysLeft} 日航期</span>
          </button>

          <button type="button" class="scroll-action-btn" data-action="end-season">
            <span class="action-title">${s.season === "SW" ? "歇夏候風 · 轉入【東北季風】" : `歲末結算 · 交割同順堂期款（尚欠 ${dueLeft} 兩）`}</span>
            <span class="action-sub">${s.season === "SW" ? "結束夏秋航季，迎接冬春北風" : "進入年終同順堂查賬與紀年錄"}</span>
          </button>
        </div>
      </div>
    `;
  }

  renderMarketSubview(port) {
    const s = this.state;
    const selGood = GOODS.find(g => g.id === this.selectedGoodId) || GOODS[0];
    const selPrice = getGoodPrice(s, s.port, selGood.id);
    const heldSel = s.cargo[selGood.id] || 0;
    const avgCostSel = heldSel > 0 ? Math.round((s.cargoCostBasis[selGood.id] || 0) / heldSel) : 0;
    const totalHeldAll = getTotalCargoCount(s.cargo);

    return `
      <div class="paper-surface market-panel">
        <div class="market-header-row">
          <div>
            <h2 class="panel-heading">${port.name}南北牙行 · 貨殖牌價</h2>
            <p class="panel-sub">點選貨品查看行情，以銅印按鈕調整買賣數量</p>
          </div>
          ${totalHeldAll > 0 ? `
            <button type="button" class="stamp-action-btn vermilion-stamp" data-action="sell-all-cargo">
              一鍵清倉 (${getCargoValuation(s, s.port)}兩)
            </button>
          ` : ""}
        </div>

        <div class="goods-list" role="listbox" aria-label="七種貿易貨品">
          ${GOODS.map(g => {
            const p = getGoodPrice(s, s.port, g.id);
            const held = s.cargo[g.id] || 0;
            const isSel = g.id === selGood.id;
            return `
              <button type="button" class="good-row ${isSel ? "is-selected" : ""}" data-action="select-good" data-good="${g.id}" role="option" aria-selected="${isSel}">
                <img class="good-thumb" src="${g.art}" alt="${g.name}">
                <div class="good-info">
                  <div class="good-title-line">
                    <strong class="good-name">${g.name}</strong>
                    <span class="price-tag tag-${p.tagClass}">${p.tag}</span>
                  </div>
                  <div class="good-meta-line">
                    <span>買入 <strong>${p.buy}</strong> 兩</span>
                    <span>賣出 <strong>${p.sell}</strong> 兩</span>
                    <span class="held-badge ${held > 0 ? "has-stock" : ""}">存倉 ${held} ${g.unit}</span>
                  </div>
                </div>
              </button>
            `;
          }).join("")}
        </div>

        <div class="trade-desk">
          <div class="trade-desk-top">
            <img class="trade-desk-art" src="${selGood.art}" alt="${selGood.name}">
            <div class="trade-desk-summary">
              <div class="desk-title-line">
                <h3>${selGood.name} <small>(${selGood.latin})</small></h3>
              </div>
              <p class="desk-desc">${selGood.desc}</p>
              <div class="desk-price-line">
                <span>本埠買價：<strong>${selPrice.buy} 兩/${selGood.unit}</strong></span>
                <span>本埠賣價：<strong>${selPrice.sell} 兩/${selGood.unit}</strong></span>
                ${heldSel > 0 ? `<span>在艙均價：${avgCostSel} 兩</span>` : ""}
              </div>
            </div>
          </div>

          <div class="stepper-bar">
            <button type="button" class="stepper-btn" data-action="step-qty" data-delta="-5" aria-label="減五">−5</button>
            <button type="button" class="stepper-btn" data-action="step-qty" data-delta="-1" aria-label="減一">−</button>
            <div class="stepper-readout">
              <span class="qty-num">${this.tradeQty}</span>
              <span class="qty-unit">${selGood.unit}</span>
            </div>
            <button type="button" class="stepper-btn" data-action="step-qty" data-delta="1" aria-label="加一">+</button>
            <button type="button" class="stepper-btn" data-action="step-qty" data-delta="5" aria-label="加五">+5</button>
            <button type="button" class="stamp-preset" data-action="preset-qty" data-preset="half-buy">一半</button>
            <button type="button" class="stamp-preset" data-action="preset-qty" data-preset="max-buy">全部</button>
          </div>

          <div class="trade-commit-row">
            <button type="button" class="trade-commit-btn buy-btn" data-action="buy-good" data-good="${selGood.id}">
              <span>買入 ${this.tradeQty} ${selGood.unit}</span>
              <small>共 ${this.tradeQty * selPrice.buy} 兩</small>
            </button>
            <button type="button" class="trade-commit-btn sell-btn" data-action="sell-good" data-good="${selGood.id}" ${heldSel <= 0 ? "disabled" : ""}>
              <span>賣出 ${Math.min(this.tradeQty, Math.max(1, heldSel))} ${selGood.unit}</span>
              <small>${heldSel > 0 ? `得 ${Math.min(this.tradeQty, heldSel) * selPrice.sell} 兩` : "無存貨"}</small>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderDockSubview(port) {
    const s = this.state;
    const missingHull = s.maxHull - s.hull;
    const repairCost = missingHull * port.repairCostPerPt;

    return `
      <div class="paper-surface dock-panel">
        <h2 class="panel-heading">${port.name}船塢與水手行館</h2>
        <p class="panel-sub">修葺《黑潮號》鐵力木船殼、添置淡水乾糧、招募老練水手</p>

        <div class="dock-cards">
          <div class="dock-item">
            <div class="dock-item-info">
              <strong>修補黑船龍骨與帆索（目前 ${s.hull}/${s.maxHull}%）</strong>
              <p>每修補 1% 船體需工料銀 ${port.repairCostPerPt} 兩。船體過低遇颶風極易折檣沉沒。</p>
            </div>
            <button type="button" class="seal-btn" data-action="dock-repair" ${missingHull <= 0 ? "disabled" : ""}>
              ${missingHull > 0 ? `修滿 (${repairCost} 兩)` : "船體完好"}
            </button>
          </div>

          <div class="dock-item">
            <div class="dock-item-info">
              <strong>添置淡水、柑橘與船餅（目前 ${s.provisions}/100%）</strong>
              <p>每補充 20% 糧水需銀 ${port.provisionCostPer10} 兩。遠航麻六甲或長崎必備充足糧水。</p>
            </div>
            <button type="button" class="seal-btn" data-action="dock-provisions" ${s.provisions >= 100 ? "disabled" : ""}>
              ${s.provisions < 100 ? `添置糧水 (${port.provisionCostPer10} 兩起)` : "糧水已滿"}
            </button>
          </div>

          <div class="dock-item">
            <div class="dock-item-info">
              <strong>招募熟習針路水手（目前 ${s.crew}/${s.maxCrew} 人）</strong>
              <p>每名水手安家銀 ${port.hireCostPerCrew} 兩，每次招募最多 5 人。</p>
            </div>
            <button type="button" class="seal-btn" data-action="dock-crew" ${s.crew >= s.maxCrew ? "disabled" : ""}>
              ${s.crew < s.maxCrew ? `招募水手 (${port.hireCostPerCrew * Math.min(5, s.maxCrew - s.crew)} 兩)` : "水手額滿"}
            </button>
          </div>

          <div class="dock-item">
            <div class="dock-item-info">
              <strong>碼頭酒肆設宴犒賞（目前士氣 ${s.morale}/100）</strong>
              <p>開美酒佳餚酬謝阿海叔與全船水手，大幅提振士氣 (+18)。</p>
            </div>
            <button type="button" class="seal-btn" data-action="dock-feast">
              設宴犒賞 (30 兩)
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderLettersSubview(port, unreadLetters) {
    const s = this.state;
    const activeLetter = unreadLetters[0] || null;
    const senderChar = activeLetter ? (CHARACTERS[activeLetter.sender] || CHARACTERS.mother) : CHARACTERS.first_mate;

    const clueLabels = [
      { id: "clue_logbook", name: "壹 ·《望海號》染血航海日誌（羅盤遭人暗算）" },
      { id: "clue_manila_draft", name: "貳 · 馬尼拉王室商務署密檔（裴雷拉私售望海號湖絲）" },
      { id: "clue_jesuit_cipher", name: "叁 · 聖保祿星盤拉丁暗碼（北緯十九度擔杆外澳座標）" },
      { id: "clue_wreck_brother", name: "肆 · 孤島石室尋回兄長沈仲明與原件銀契" }
    ];

    return `
      <div class="letters-panel">
        ${activeLetter ? `
          <article class="letter-sheet" style="background-image: url('assets/ui/letter_paper.webp');">
            <div class="letter-header">
              <img class="sender-portrait" src="${senderChar.art}" alt="${senderChar.name}">
              <div class="sender-meta">
                <span class="letter-stamp-tag">${activeLetter.stamp}</span>
                <h2 class="letter-title">${activeLetter.title}</h2>
                <span class="sender-name">${senderChar.name} · ${senderChar.title}</span>
              </div>
            </div>
            <p class="letter-body-text">${activeLetter.body}</p>
            <div class="letter-choices">
              ${activeLetter.choices.map((ch, idx) => `
                <button type="button" class="letter-choice-btn" data-action="letter-choice" data-letter="${activeLetter.id}" data-choice="${idx}">
                  ${ch.label}
                </button>
              `).join("")}
            </div>
          </article>
        ` : `
          <div class="paper-surface empty-letter-box">
            <div class="letter-header">
              <img class="sender-portrait" src="${CHARACTERS.first_mate.art}" alt="阿海叔">
              <div class="sender-meta">
                <h2 class="letter-title">${port.name}信使驛站</h2>
                <p class="panel-sub">「船主，本埠暫時未有新到書信。不妨開船前往其他埠頭（澳門、廣州、長崎、馬尼拉、麻六甲）查訪消息。」</p>
              </div>
            </div>
          </div>
        `}

        <div class="paper-surface clue-tracker-box">
          <h3 class="panel-heading">《望海號》與兄長失蹤案 · 查訪卷宗（${s.clues.length}/4）</h3>
          <ul class="clue-list">
            ${clueLabels.map(c => {
              const found = s.clues.includes(c.id);
              return `<li class="${found ? "clue-found" : "clue-missing"}">${found ? "【已獲鐵證】" : "【待查線索】"}${c.name}</li>`;
            }).join("")}
          </ul>
        </div>
      </div>
    `;
  }

  renderChartScreen() {
    const s = this.state;
    const curPort = PORTS[s.port] || PORTS.macau;
    const destPort = PORTS[this.selectedDestPort] || PORTS.nagasaki;
    const route = getRoute(s.port, destPort.id, s.season);

    // Best trade hint for destPort
    const destGoods = GOODS.map(g => ({ g, ...getGoodPrice(s, destPort.id, g.id) }));
    const highDemand = destGoods.filter(x => x.tagClass === "dear").map(x => x.g.shortName).join("、") || "百貨常價";
    const lowSupply = destGoods.filter(x => x.tagClass === "cheap").map(x => x.g.shortName).join("、") || "無特產";

    return `
      <main class="screen chart-screen">
        ${this.renderTopRibbon()}

        <div class="chart-stage">
          <div class="portolan-map-wrap">
            <img class="portolan-bg" src="assets/art/chart_table.webp" alt="航海海圖桌">

            ${Object.values(PORTS).map(p => {
              const isCurrent = p.id === s.port;
              const isSelected = p.id === destPort.id && !isCurrent;
              return `
                <button
                  type="button"
                  class="map-port-pin ${isCurrent ? "is-current-port" : ""} ${isSelected ? "is-selected-port" : ""}"
                  style="left: ${p.mapX}%; top: ${p.mapY}%;"
                  data-action="${isCurrent ? "" : "select-dest-port"}"
                  data-port="${p.id}"
                  aria-label="${isCurrent ? `目前所在：${p.name}` : `選擇航向：${p.name}`}"
                >
                  ${isCurrent ? `<img class="ship-token-pin" src="assets/ui/ship_token.webp" alt="黑潮號位置">` : `<span class="pin-wax-dot"></span>`}
                  <span class="pin-label">${p.name}</span>
                </button>
              `;
            }).join("")}
          </div>

          ${this.toastMessage ? `
            <div class="note-toast paper-strip" role="status">
              <span class="seal-dot">印</span>
              <span class="toast-text">${this.toastMessage}</span>
            </div>
          ` : ""}

          <section class="chart-note-slip paper-surface" aria-label="針路簽條">
            <div class="slip-header">
              <div>
                <span class="slip-route-tag">針路勘合 · ${curPort.name} → ${destPort.name}</span>
                <h2 class="slip-title">${destPort.name} <small>${destPort.latin}</small></h2>
              </div>
              <span class="wind-fit-badge wind-${route.windFit === "順風" ? "good" : route.windFit === "逆風" ? "bad" : "neutral"}">
                ${route.windFit} (${SEASONS[s.season].name})
              </span>
            </div>

            <div class="slip-metrics">
              <div><span>水程距離</span><strong>${route.distLi} 里</strong></div>
              <div><span>預計航期</span><strong>約 ${route.expectedDays} 日</strong></div>
              <div><span>海況風險</span><strong>${route.riskLabel}</strong></div>
            </div>

            <p class="slip-note">${route.note}</p>
            <p class="slip-trade-hint">
              <strong>${destPort.name}行情：</strong>高價渴求【${highDemand}】；產地低價【${lowSupply}】
            </p>

            <div class="slip-actions">
              <button type="button" class="signboard-btn secondary-sign" data-action="open-port-subview" data-subview="overview">
                <span class="sign-main">返回${curPort.name}埠頭</span>
              </button>
              <button type="button" class="signboard-btn primary-sign" data-action="confirm-sail">
                <span class="sign-main">揚帆起錨 · 啟航${destPort.name}</span>
              </button>
            </div>
          </section>
        </div>
      </main>
    `;
  }

  renderVoyageScreen() {
    const v = this.activeVoyage;
    if (!v) return this.renderPortScreen();
    const ev = v.events[v.stepIndex] || VOYAGE_EVENTS[0];
    const speaker = CHARACTERS[ev.speaker] || CHARACTERS.first_mate;
    const fromPort = PORTS[v.fromPort];
    const toPort = PORTS[v.toPort];

    return `
      <main class="screen voyage-screen">
        ${this.renderTopRibbon()}

        <div class="voyage-stage">
          <div class="voyage-progress-banner paper-strip">
            <img class="mini-ship-token" src="assets/ui/ship_token.webp" alt="黑潮號">
            <div class="voyage-route-info">
              <strong>${fromPort.name} → ${toPort.name} · 航程第 ${v.stepIndex + 1}/${v.events.length} 段</strong>
              <span>${v.route.windFit} · 水程 ${v.route.distLi} 里</span>
            </div>
          </div>

          <div class="event-vignette-frame">
            <img class="event-vignette-img" src="${ev.art}" alt="${ev.title}">
            <div class="event-vignette-caption">
              <h1 class="event-title-cn">${ev.title}</h1>
            </div>
          </div>

          <section class="voyage-card paper-surface">
            <div class="speaker-row">
              <img class="speaker-avatar" src="${speaker.art}" alt="${speaker.name}">
              <div class="speaker-bubble">
                <div class="speaker-name-tag">${speaker.name} · ${speaker.title}</div>
                <p class="event-narrative-text">${ev.text}</p>
              </div>
            </div>

            ${v.lastOutcome ? `
              <div class="outcome-scroll">
                <div class="outcome-choice-echo">決斷：${v.lastOutcome.choiceLabel}</div>
                <p class="outcome-result-text">${v.lastOutcome.outcomeText}</p>
                <button type="button" class="signboard-btn primary-sign full-width-btn" data-action="voyage-next">
                  <span class="sign-main">${v.stepIndex < v.events.length - 1 ? "繼續破浪前行" : `望見${toPort.name}燈火 · 進港拋錨`}</span>
                </button>
              </div>
            ` : `
              <div class="voyage-choices">
                ${ev.choices.map((ch, idx) => `
                  <button type="button" class="voyage-choice-btn" data-action="voyage-choice" data-choice="${idx}">
                    <span class="choice-main">${ch.label}</span>
                    <span class="choice-sub">${ch.sub}</span>
                  </button>
                `).join("")}
              </div>
            `}
          </section>
        </div>
      </main>
    `;
  }

  renderLedgerScreen() {
    const s = this.state;
    const meta = YEAR_META[s.year] || YEAR_META[1];
    const dueLeft = Math.max(0, meta.instalmentDue - (s.paidThisYear || 0));
    const cargoVal = getCargoValuation(s, s.port);
    const netWorth = s.silver + cargoVal - s.debt;

    return `
      <main class="screen ledger-screen">
        ${this.renderTopRibbon()}

        <div class="ledger-stage" style="background-image: url('assets/ui/ledger_spread.webp');">
          <div class="ledger-scroll-container">
            <div class="ledger-header-row">
              <div>
                <span class="ledger-sub-label">沈氏黑船字號 · 總會計簿</span>
                <h1 class="ledger-title">《黑潮號》絲銀總賬冊</h1>
              </div>
              <button type="button" class="seal-btn" data-action="open-port-subview" data-subview="overview">合上賬冊</button>
            </div>

            <section class="ledger-page">
              <h2 class="ledger-section-title">壹 · 銀兩、船契與本年大限</h2>
              <div class="ledger-kv-grid">
                <div class="kv-box"><span>庫存現銀</span><strong>${s.silver} 兩</strong></div>
                <div class="kv-box"><span>艙貨估值</span><strong>${cargoVal} 兩</strong></div>
                <div class="kv-box"><span>同順堂總欠契</span><strong class="vermilion-text">${s.debt} 兩</strong></div>
                <div class="kv-box"><span>本年尚須交割</span><strong>${dueLeft} 兩</strong></div>
                <div class="kv-box"><span>淨資產結餘</span><strong>${netWorth >= 0 ? `+${netWorth}` : netWorth} 兩</strong></div>
                <div class="kv-box"><span>累計遠航</span><strong>${s.totalVoyages} 次</strong></div>
              </div>

              ${s.debt > 0 ? `
                <div class="debt-pay-row">
                  <button type="button" class="stamp-action-btn" data-action="pay-debt" data-amount="300" ${s.silver < 300 ? "disabled" : ""}>
                    預付三百兩
                  </button>
                  ${dueLeft > 0 ? `
                    <button type="button" class="stamp-action-btn" data-action="pay-debt" data-amount="${dueLeft}" ${s.silver < dueLeft ? "disabled" : ""}>
                      清償本期 (${dueLeft}兩)
                    </button>
                  ` : ""}
                  <button type="button" class="stamp-action-btn vermilion-stamp" data-action="pay-debt" data-amount="${s.debt}" ${s.silver < s.debt ? "disabled" : ""}>
                    全數贖契 (${s.debt}兩)
                  </button>
                </div>
              ` : ""}
            </section>

            <section class="ledger-page">
              <h2 class="ledger-section-title">貳 · 底艙盤點與五埠聲望</h2>
              <div class="ledger-cargo-table">
                ${GOODS.map(g => {
                  const qty = s.cargo[g.id] || 0;
                  const basis = s.cargoCostBasis[g.id] || 0;
                  const { sell } = getGoodPrice(s, s.port, g.id);
                  return `
                    <div class="ledger-cargo-cell ${qty > 0 ? "has-qty" : ""}">
                      <span>${g.name}</span>
                      <strong>${qty} ${g.unit}</strong>
                      <small>${qty > 0 ? `值 ${qty * sell} 兩 (本 ${basis})` : "空"}</small>
                    </div>
                  `;
                }).join("")}
              </div>

              <div class="rep-row">
                ${Object.values(PORTS).map(p => `
                  <div class="rep-badge">
                    <span>${p.name}</span>
                    <strong>${s.reputation[p.id] || 50}</strong>
                  </div>
                `).join("")}
              </div>
            </section>

            <section class="ledger-page">
              <h2 class="ledger-section-title">叁 · 航海紀年錄（Chronica）</h2>
              <ul class="chronicle-list">
                ${s.chronicle.slice().reverse().map(c => `
                  <li>
                    <span class="chron-tag">${YEAR_META[c.year]?.mingYear || "萬曆"} · ${SEASONS[c.season]?.name || ""}</span>
                    <p>${c.text}</p>
                  </li>
                `).join("")}
              </ul>
            </section>
          </div>
        </div>
      </main>
    `;
  }

  renderYearEndScreen() {
    const r = this.yearEndReport;
    const gm = CHARACTERS.guild_master;
    return `
      <main class="screen yearend-screen">
        ${this.renderTopRibbon()}

        <div class="voyage-stage">
          <div class="event-vignette-frame">
            <img class="event-vignette-img" src="assets/events/guild_hall.webp" alt="廣州十三行同順堂歲末查賬">
            <div class="event-vignette-caption">
              <h1 class="event-title-cn">歲末交割 · 同順堂核契</h1>
            </div>
          </div>

          <section class="voyage-card paper-surface">
            <div class="speaker-row">
              <img class="speaker-avatar" src="${gm.art}" alt="${gm.name}">
              <div class="speaker-bubble">
                <div class="speaker-name-tag">${gm.name} · ${gm.title}</div>
                <p class="event-narrative-text">「季安賢姪，算盤珠一響，一年又過去了。你今年按期交割銀款，同順堂上下都睇見你嘅本事。開春之後西南風再起，望你再接再厲！」</p>
              </div>
            </div>

            <div class="outcome-scroll">
              <p class="outcome-result-text">${r ? r.summary : "年度銀契交割完成。"}</p>
              <button type="button" class="signboard-btn primary-sign full-width-btn" data-action="close-yearend">
                <span class="sign-main">領取朱印收條 · 迎接新歲西南季風</span>
              </button>
            </div>
          </section>
        </div>
      </main>
    `;
  }

  renderEndingScreen() {
    const end = this.endingData || ENDINGS.ending_survival;
    const s = this.state;
    const netWorth = s.silver + getCargoValuation(s, s.port);

    return `
      <main class="screen ending-screen">
        <div class="ending-stage">
          <div class="ending-art-frame">
            <img class="ending-art-img" src="${end.art}" alt="${end.title}">
            <div class="ending-badge-overlay">
              <span class="ending-seal-badge">${end.badge}</span>
              <h1 class="ending-brush-title">${end.title}</h1>
              <span class="ending-latin">${end.latin}</span>
            </div>
          </div>

          <section class="ending-scroll paper-surface">
            <p class="ending-summary">${end.summary}</p>
            <p class="ending-epilogue">${end.epilogue}</p>

            <div class="ending-stats-row">
              <div><span>終局紋銀與貨值</span><strong>${netWorth} 兩</strong></div>
              <div><span>剩餘同順堂欠契</span><strong>${s.debt} 兩</strong></div>
              <div><span>遠航次數</span><strong>${s.totalVoyages} 航次</strong></div>
              <div><span>尋獲望海號線索</span><strong>${s.clues.length} / 4</strong></div>
            </div>

            <div class="ending-actions">
              <button type="button" class="signboard-btn primary-sign full-width-btn" data-action="new-game">
                <span class="sign-main">再起風帆 · 開啟新航程</span>
              </button>
              <button type="button" class="signboard-btn secondary-sign full-width-btn" data-action="go-title">
                <span class="sign-main">返回卷首屏風</span>
              </button>
            </div>
          </section>
        </div>
      </main>
    `;
  }

  render() {
    if (!this.root) return;
    let html = "";
    if (this.phase === "title") {
      html = this.renderTitleScreen();
    } else if (this.phase === "chart") {
      html = this.renderChartScreen();
    } else if (this.phase === "voyage") {
      html = this.renderVoyageScreen();
    } else if (this.phase === "ledger") {
      html = this.renderLedgerScreen();
    } else if (this.phase === "yearend") {
      html = this.renderYearEndScreen();
    } else if (this.phase === "ending") {
      html = this.renderEndingScreen();
    } else {
      html = this.renderPortScreen();
    }
    this.root.innerHTML = html;
  }
}

// Mount in browser environment
if (typeof window !== "undefined" && typeof document !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("app");
    if (root) {
      window.__MONSOON_APP__ = new MonsoonCarrackApp(root);
    }
  });
}
