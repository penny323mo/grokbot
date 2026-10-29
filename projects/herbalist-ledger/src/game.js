import { herbs, drawerOrder, herbById, regions } from "./herbs.js";
import { customers, days, puzzles, letters, people, endings, disclaimer } from "./story.js";
import { ledgerOpen, phaseAfterCipher } from "./logic.js";
import { unlock, play, setMute, isMuted, toggleMute } from "./audio.js";

const SAVE = "baicaotang-ledger-v1";
const ARCHIVE = "baicaotang-ledger-archive";

const app = document.querySelector("#app");

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

function fresh() {
  return {
    v: 1,
    phase: "title",
    day: 1,
    ci: 0,
    line: 0,
    labels: {},
    selected: null,
    placed: false,
    overlay: null,
    plate: null,
    silver: 0,
    rep: 0,
    log: [],
    returns: [],
    ri: 0,
    solved: {},
    tries: {},
    flags: {},
    ownedLetters: [],
    readLetters: {},
    weighed: {},
    glassOn: false,
    knownRegion: {},
    bookPage: 0,
    labelDrawer: null,
    picks: [],
    puzzleId: null,
    puzzleMsg: "",
    puzzleReturn: null,
    last: null,
    ending: null,
    cleared: false,
    checkpoints: {},
    confirmNew: false,
    mapMsg: "",
    scaleMsg: "",
    note: "",
    reward: null,
    chapterFrom: null,
  };
}

let state = fresh();
let atMenu = true;

function dayInfo(n = state.day) {
  return days.find((day) => day.n === n);
}

function todayCustomers() {
  return customers.filter((customer) => customer.day === state.day);
}

function current() {
  return todayCustomers()[state.ci] || null;
}

function tools() {
  const day = state.day;
  return {
    glass: day >= 2,
    scale: day >= 3,
    map: day >= 4,
    letters: day >= 5,
    ledger: day >= 2,
  };
}

function labelOf(index) {
  return state.labels[String(index)] || "";
}

function knownName(herbId) {
  const index = drawerOrder.indexOf(herbId);
  if (index >= 0 && labelOf(index) === herbId) return herbById(herbId).name;
  return "";
}

function handName() {
  if (!state.selected) return "未揀";
  return knownName(state.selected) || "未寫名";
}

function slotLabel(herbId) {
  const name = knownName(herbId);
  if (name) return name;
  const herb = herbById(herbId);
  const index = drawerOrder.indexOf(herbId);
  const hint = herb.naked?.[0] || herb.smell;
  return `第${index + 1}格 · ${hint}`;
}

function resultCustomer() {
  if (state.last?.fromReturn) {
    return customers.find((entry) => entry.id === state.last.returnId) || current();
  }
  return current();
}

function resultTail(last) {
  if (last.fromReturn) {
    return last.ok ? "聲名補回一筆。櫃面寫上了。" : "仍然唔係。佢還在櫃前，可以再揀。";
  }
  return last.ok ? "櫃面多咗兩毫銀。" : "聲名淡咗一筆。佢可能聽日返嚟。";
}

function beginAfterReturns() {
  state.selected = null;
  state.overlay = null;
  state.placed = false;
  if (!state.returns.length && state.day >= 7 && state.ci >= todayCustomers().length) {
    state.phase = "finale";
    state.line = 0;
    return;
  }
  if (!state.returns.length) {
    state.phase = "talk";
    state.line = 0;
    return;
  }
  state.phase = "returns";
  if (state.ri >= state.returns.length) state.ri = 0;
}

function archive() {
  try {
    const raw = localStorage.getItem(ARCHIVE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function save() {
  localStorage.setItem(SAVE, JSON.stringify(state));
  localStorage.setItem(`${SAVE}-mute`, isMuted() ? "1" : "0");
}

function snapshotDay() {
  const { checkpoints, ...rest } = state;
  state.checkpoints[state.day] = structuredClone(rest);
}

function grantLetter(id) {
  if (id && !state.ownedLetters.includes(id)) state.ownedLetters.push(id);
}

function boot() {
  try {
    const raw = localStorage.getItem(SAVE);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.v === 1) state = { ...fresh(), ...data };
    }
  } catch {
    state = fresh();
  }
  setMute(localStorage.getItem(`${SAVE}-mute`) === "1");
  render();
}

function beginNew() {
  const kept = archive();
  state = fresh();
  state.phase = "intro";
  atMenu = false;
  snapshotDay();
  if (kept?.cleared) localStorage.setItem(ARCHIVE, JSON.stringify(kept));
  save();
  play("bell");
  render();
}

function loadChapter(n) {
  const saved = archive();
  const source = saved?.checkpoints?.[n] || state.checkpoints[n];
  if (!source) return;
  const kept = saved?.checkpoints || state.checkpoints;
  state = { ...fresh(), ...structuredClone(source) };
  state.checkpoints = kept;
  state.cleared = true;
  state.phase = "intro";
  state.overlay = null;
  state.confirmNew = false;
  state.chapterFrom = null;
  atMenu = false;
  save();
  render();
}

function dismissIntro() {
  if (state.returns.length) {
    state.phase = "returns";
    state.ri = 0;
    state.selected = null;
  } else {
    state.phase = "talk";
    state.line = 0;
  }
  save();
  render();
}

function advanceTalk() {
  const customer = current();
  if (!customer) return;
  if (state.line < customer.lines.length - 1) {
    state.line += 1;
    play("paper");
  } else {
    state.phase = "desk";
    play("paper");
  }
  save();
  render();
}

function give(fromReturn) {
  if (!state.selected) return;
  const customer = fromReturn
    ? customers.find((entry) => entry.id === state.returns[state.ri]?.id)
    : current();
  if (!customer) return;
  const ok = state.selected === customer.correct;
  const near = customer.near.includes(state.selected);
  if (ok) {
    if (!fromReturn) state.silver += 2;
    state.rep += 1;
    const index = drawerOrder.indexOf(customer.correct);
    if (fromReturn && index >= 0) state.labels[String(index)] = customer.correct;
    state.last = {
      ok,
      near,
      text: customer.ok,
      offer: fromReturn ? null : index,
      fromReturn: !!fromReturn,
      returnId: fromReturn ? customer.id : null,
    };
  } else {
    if (!fromReturn) {
      state.rep -= 1;
      state.returns.push({ id: customer.id });
      if (customer.id === "d3c") state.flags.maWrong = true;
    }
    state.last = {
      ok: false,
      near,
      text: near ? customer.nearMiss : customer.bad,
      offer: null,
      fromReturn: !!fromReturn,
      returnId: fromReturn ? customer.id : null,
    };
  }
  if (!fromReturn) {
    state.log.push({ day: state.day, id: customer.id, herb: state.selected, ok });
    if (customer.id === "d3c") grantLetter("pawn");
    if (customer.id === "d3b") grantLetter("xiu");
  }
  state.phase = "result";
  state.overlay = null;
  state.placed = false;
  state.selected = null;
  play(ok ? "bell" : "paper");
  save();
  render();
}

function afterResult() {
  if (state.last?.offer != null && state.pendingLabel) {
    state.labels[String(state.last.offer)] = drawerOrder[state.last.offer];
  }
  state.pendingLabel = false;
  const fromReturn = !!state.last?.fromReturn;
  const returnOk = fromReturn && state.last.ok;
  const returnId = state.last?.returnId;
  state.selected = null;
  state.last = null;
  if (fromReturn) {
    if (returnOk) {
      const index = state.returns.findIndex((item) => item.id === returnId);
      if (index >= 0) state.returns.splice(index, 1);
    }
    beginAfterReturns();
    save();
    render();
    return;
  }
  state.ci += 1;
  if (state.ci >= todayCustomers().length) state.phase = "evening";
  else {
    state.phase = "talk";
    state.line = 0;
  }
  save();
  render();
}

function leaveEvening() {
  const puzzle = puzzles.find((item) => item.day === state.day && !state.solved[item.id]);
  if (puzzle) {
    state.phase = "puzzle";
    state.puzzleId = puzzle.id;
    state.picks = [];
    state.puzzleMsg = "";
    state.puzzleReturn = null;
    save();
    render();
    return;
  }
  advanceDay();
}

function applyAdvance() {
  if (state.day >= 7) {
    state.overlay = null;
    state.selected = null;
    state.placed = false;
    if (state.returns.length) {
      state.phase = "returns";
      state.ri = 0;
      state.line = 0;
    } else {
      state.phase = "finale";
      state.line = 0;
    }
    return;
  }
  state.day += 1;
  state.ci = 0;
  state.line = 0;
  state.selected = null;
  state.phase = "intro";
  state.overlay = null;
  if (state.day === 5) grantLetter("dowry");
  snapshotDay();
  play("bell");
}

function advanceDay() {
  applyAdvance();
  save();
  render();
}

function activePuzzle() {
  return puzzles.find((item) => item.id === state.puzzleId) || null;
}

function submitPuzzle() {
  const puzzle = activePuzzle();
  if (!puzzle) return;
  if (state.picks.length !== puzzle.lines.length) {
    state.puzzleMsg = "未排滿。";
    render();
    return;
  }
  const bad = puzzle.lines.findIndex((line, index) => state.picks[index] !== line.answer);
  if (bad === -1) {
    state.solved[puzzle.id] = true;
    grantLetter(puzzle.letter);
    state.reward = puzzle;
    state.phase = "reward";
    state.overlay = null;
    play("bell");
  } else {
    state.tries[puzzle.id] = (state.tries[puzzle.id] || 0) + 1;
    state.puzzleMsg = `第${["一", "二", "三", "四"][bad]}句氣味不合。`;
    if (state.tries[puzzle.id] >= 3 && puzzle.hints[bad]) state.puzzleMsg += puzzle.hints[bad];
    play("paper");
  }
  save();
  render();
}

function finishReward() {
  const back = phaseAfterCipher(state.puzzleReturn, true);
  state.reward = null;
  state.puzzleReturn = null;
  if (back) {
    state.phase = back;
    save();
    render();
    return;
  }
  advanceDay();
}

function openPuzzle(id, back) {
  state.puzzleId = id;
  state.picks = [];
  state.puzzleMsg = "";
  state.puzzleReturn = back;
  state.phase = "puzzle";
  state.overlay = null;
  save();
  render();
}

function exitPuzzle() {
  const back = phaseAfterCipher(state.puzzleReturn);
  state.puzzleReturn = null;
  if (back) state.phase = back;
  else applyAdvance();
  save();
  render();
}

function finaleLines() {
  const lines = ["梁掌櫃，當票在此。後巷天井，今日要過戶到陳記。"];
  if (state.flags.maWrong) lines.push("尋日一味都未辨準。舖頭如此，字更該簽。");
  else lines.push("你阿爺的名字在票上。辛未春，期限到了。");
  lines.push("你若有話說，趁墨未乾。");
  return lines;
}

function finishGame(kind) {
  const solvedBoth = state.solved.p2 && state.solved.p3;
  const solvedOne = state.solved.p2 || state.solved.p3;
  let ending = "word";
  if (kind === "witness" && !solvedOne) ending = "word";
  else if (solvedBoth) ending = "full";
  else if (solvedOne || kind !== "witness") ending = solvedOne ? "papers" : "word";
  state.ending = ending;
  state.cleared = true;
  state.phase = "ending";
  state.overlay = null;
  grantLetter("final");
  localStorage.setItem(ARCHIVE, JSON.stringify({ cleared: true, checkpoints: state.checkpoints }));
  play("bell");
  save();
  render();
}

function applyLabel() {
  if (state.labelDrawer == null) return;
  const page = herbs[state.bookPage - 1];
  const real = drawerOrder[state.labelDrawer];
  if (page && page.id === real) {
    state.labels[String(state.labelDrawer)] = page.id;
    state.note = "對上了。標籤寫好。";
    play("paper");
  } else {
    state.note = "呢一頁對唔上呢格。再對切面、氣味、產地。";
  }
  save();
  render();
}

function guessRegion(id) {
  if (!state.selected) {
    state.mapMsg = "先喺櫃度攞一味出嚟，再對產地。";
  } else if (herbById(state.selected).region === id) {
    state.knownRegion[state.selected] = true;
    state.mapMsg = `啱。${knownName(state.selected) || "呢味"}係呢一帶。`;
    play("bell");
  } else {
    state.mapMsg = "唔係呢帶。";
    play("paper");
  }
  save();
  render();
}

function closeOverlay() {
  if (state.overlay === "plate") state.overlay = "cabinet";
  else if (state.overlay === "book" && state.labelDrawer != null) {
    state.overlay = "plate";
    state.plate = state.labelDrawer;
  } else {
    state.overlay = null;
    if (state.overlay == null) state.labelDrawer = null;
  }
  render();
}

function act(name, node) {
  unlock();
  if (name === "mute") {
    toggleMute();
    save();
    render();
    return;
  }
  if (name === "new") {
    if (localStorage.getItem(SAVE) && !state.confirmNew) {
      state.confirmNew = true;
      render();
      return;
    }
    beginNew();
    return;
  }
  if (name === "cancel-new") {
    state.confirmNew = false;
    render();
    return;
  }
  if (name === "continue") {
    state.confirmNew = false;
    atMenu = false;
    if (state.phase === "chapters" && state.chapterFrom) state.phase = state.chapterFrom;
    state.chapterFrom = null;
    if (!state.phase || state.phase === "title" || state.phase === "chapters") state.phase = "intro";
    play("bell");
    render();
    return;
  }
  if (name === "credits") {
    state.overlay = state.overlay === "credits" ? null : "credits";
    render();
    return;
  }
  if (name === "chapters") {
    if (state.phase !== "chapters") state.chapterFrom = state.phase;
    atMenu = false;
    state.phase = "chapters";
    state.overlay = null;
    save();
    render();
    return;
  }
  if (name === "title") {
    if (state.phase === "chapters" && state.chapterFrom) {
      state.phase = state.chapterFrom;
      state.chapterFrom = null;
    }
    atMenu = true;
    state.overlay = null;
    state.confirmNew = false;
    save();
    render();
    return;
  }
  if (name === "chapter") {
    loadChapter(Number(node.dataset.n));
    return;
  }
  if (name === "intro") {
    dismissIntro();
    return;
  }
  if (name === "talk") {
    advanceTalk();
    return;
  }
  if (name === "finale-talk") {
    const lines = finaleLines();
    if (state.line < lines.length - 1) state.line += 1;
    else state.phase = "finaleChoice";
    play("paper");
    save();
    render();
    return;
  }
  if (name === "cabinet" || name === "arm-glass") {
    if (name === "arm-glass") state.glassOn = true;
    state.overlay = "cabinet";
    play("drawer");
    render();
    return;
  }
  if (name === "drawer") {
    state.plate = Number(node.dataset.i);
    state.selected = drawerOrder[state.plate];
    state.overlay = "plate";
    play("drawer");
    render();
    return;
  }
  if (name === "close") {
    closeOverlay();
    return;
  }
  if (name === "take") {
    state.selected = drawerOrder[state.plate];
    state.placed = false;
    state.overlay = "wrap";
    play("paper");
    save();
    render();
    return;
  }
  if (name === "place") {
    state.placed = true;
    play("paper");
    save();
    render();
    return;
  }
  if (name === "give") {
    give(state.phase === "returns");
    return;
  }
  if (name === "next") {
    afterResult();
    return;
  }
  if (name === "write-label") {
    state.pendingLabel = true;
    afterResult();
    return;
  }
  if (name === "book") {
    state.overlay = "book";
    state.note = "";
    play("paper");
    render();
    return;
  }
  if (name === "label-mode") {
    state.labelDrawer = state.plate;
    state.overlay = "book";
    state.bookPage = 0;
    state.note = "翻到你認定嘅一頁，再寫標籤。";
    render();
    return;
  }
  if (name === "page") {
    state.bookPage = Number(node.dataset.page);
    state.note = "";
    render();
    return;
  }
  if (name === "prev") {
    state.bookPage = Math.max(0, state.bookPage - 1);
    state.note = "";
    render();
    return;
  }
  if (name === "next-page") {
    state.bookPage = Math.min(herbs.length, state.bookPage + 1);
    state.note = "";
    render();
    return;
  }
  if (name === "use-label") {
    applyLabel();
    return;
  }
  if (name === "glass") {
    state.glassOn = !state.glassOn;
    render();
    return;
  }
  if (name === "scale") {
    state.overlay = "scale";
    state.scaleMsg = state.selected ? "" : "先喺櫃度攞一味放上嚟。";
    render();
    return;
  }
  if (name === "weigh") {
    if (!state.selected) state.scaleMsg = "手上未有藥。";
    else {
      state.weighed[state.selected] = true;
      state.scaleMsg = "";
      play("scale");
    }
    save();
    render();
    return;
  }
  if (name === "map") {
    state.overlay = "map";
    state.mapMsg = "";
    render();
    return;
  }
  if (name === "region") {
    guessRegion(node.dataset.id);
    return;
  }
  if (name === "letters") {
    state.overlay = "letters";
    state.reading = null;
    render();
    return;
  }
  if (name === "read") {
    state.reading = node.dataset.id;
    state.readLetters[node.dataset.id] = true;
    play("paper");
    save();
    render();
    return;
  }
  if (name === "ledger") {
    state.overlay = "ledger";
    render();
    return;
  }
  if (name === "open-puzzle") {
    openPuzzle(node.dataset.id, state.phase);
    return;
  }
  if (name === "pick") {
    const id = drawerOrder[state.plate];
    const puzzle = activePuzzle();
    if (puzzle && !state.picks.includes(id) && state.picks.length < puzzle.lines.length) {
      state.picks.push(id);
      play("paper");
      save();
    }
    render();
    return;
  }
  if (name === "unpick") {
    state.picks.splice(Number(node.dataset.i), 1);
    save();
    render();
    return;
  }
  if (name === "submit") {
    submitPuzzle();
    return;
  }
  if (name === "skip-puzzle") {
    exitPuzzle();
    return;
  }
  if (name === "reward") {
    finishReward();
    return;
  }
  if (name === "evening") {
    leaveEvening();
    return;
  }
  if (name === "skip-return") {
    state.returns.splice(state.ri, 1);
    beginAfterReturns();
    save();
    render();
    return;
  }
  if (name === "wrap") {
    if (!state.selected) {
      state.overlay = "cabinet";
      render();
      return;
    }
    state.overlay = "wrap";
    play("paper");
    render();
    return;
  }
  if (name === "prove") {
    finishGame(node.dataset.kind);
  }
}

function personHTML(id) {
  const person = people[id];
  return `<div class="who"><img src="${esc(person.src)}" alt="${esc(person.name)}"><div><div class="pname">${esc(person.name)}</div><div class="prole">${esc(person.role)}</div></div></div>`;
}

function deskHTML() {
  const kit = tools();
  const buttons = [
    ["cabinet", "百子櫃"],
    ["book", "藥典"],
  ];
  if (kit.glass) buttons.push(["glass-desk", "放大鏡"]);
  if (kit.scale) buttons.push(["scale", "戥子"]);
  if (kit.map) buttons.push(["map", "地圖"]);
  if (kit.letters) buttons.push(["letters", "書信"]);
  if (kit.ledger) buttons.push(["ledger", "帳簿"]);
  buttons.push(["wrap", "包藥"]);
  return `<nav class="desk">${buttons
    .map(([id, label]) => {
      const actName = id;
      const extra = "";
      if (id === "glass-desk") {
        return `<button class="wood-btn" data-act="arm-glass">放大鏡</button>`;
      }
      const dot = id === "letters" && state.ownedLetters.some((key) => !state.readLetters[key]) ? " ·" : "";
      return `<button class="wood-btn" data-act="${actName}">${label}${dot}</button>`;
    })
    .join("")}</nav>`;
}

function counterHTML(body, showDesk = true) {
  const info = dayInfo();
  return `<section class="screen">
    <header class="daybar"><span>${esc(info.date)}</span><span>${esc(info.title)}</span><span>毫銀 ${state.silver} · 譽 ${state.rep}</span></header>
    <div class="scene">
      <img class="bg" src="assets/art/counter_bg.webp" alt="">
      <div class="veil"></div>
      <div class="stack">${body}</div>
    </div>
    ${showDesk ? deskHTML() : ""}
  </section>`;
}

function renderTitle() {
  const saved = !!localStorage.getItem(SAVE) && state.phase !== "title" ? false : !!localStorage.getItem(SAVE);
  const hasArchive = !!archive()?.cleared || state.cleared;
  const continueBtn = localStorage.getItem(SAVE) ? `<button class="paper-btn" data-act="continue">繼續</button>` : "";
  const chapterBtn = hasArchive ? `<button class="paper-btn" data-act="chapters">章回</button>` : "";
  const confirm = state.confirmNew
    ? `<button class="paper-btn" data-act="new">真係新開</button><button class="paper-btn" data-act="cancel-new">唔使</button>`
    : `<button class="paper-btn" data-act="new">新開舖</button>`;
  return `<section class="screen">
    <img class="bg" src="assets/art/title_key.webp" alt="">
    <div class="seal" aria-hidden="true">梁</div>
    <div class="title-block">
      <h1>百草堂</h1>
      <p class="en">The Herbalist's Ledger</p>
      <p class="where">辛未 · 西關</p>
    </div>
    <div class="hero-ui">
      ${confirm}
      ${continueBtn}
      ${chapterBtn}
      <button class="paper-btn" data-act="credits">誌謝</button>
      <p class="paper disclaimer">${esc(disclaimer)}</p>
    </div>
  </section>`;
}

function renderIntro() {
  const info = dayInfo();
  return `<section class="screen">
    <img class="bg" src="${esc(info.art)}" alt="">
    <div class="daycard">
      <div class="paper sheet">
        <p class="latin" style="margin:0">${esc(info.date)}</p>
        <h2>${esc(info.title)}</h2>
        <p>${esc(info.dawn)}</p>
        <button class="wood-btn" data-act="intro" style="width:100%">開門</button>
      </div>
    </div>
  </section>`;
}

function renderMissingCustomer() {
  if (state.day >= 7) beginAfterReturns();
  else {
    state.phase = "evening";
    state.line = 0;
    state.overlay = null;
  }
  if (state.phase === "desk" || state.phase === "talk") {
    state.phase = state.day >= 7 ? "finale" : "evening";
    state.line = 0;
  }
  save();
  return renderMain();
}

function renderTalk() {
  const customer = current();
  if (!customer) return renderMissingCustomer();
  const shown = customer.lines.slice(0, state.line + 1).map((line) => `<p>${esc(line)}</p>`).join("");
  const body = `${personHTML(customer.person)}<article class="paper slip">${shown}<p><button class="wood-btn" data-act="talk">聽落去</button></p></article>`;
  return counterHTML(body);
}

function renderDesk() {
  const customer = current();
  if (!customer) return renderMissingCustomer();
  const clues = customer.clues.map((clue) => `<li>${esc(clue)}</li>`).join("");
  const body = `${personHTML(customer.person)}
    <article class="paper slip"><p>${esc(customer.lines[customer.lines.length - 1])}</p></article>
    <ul class="paper clues">${clues}</ul>`;
  return counterHTML(body);
}

function renderResult() {
  const last = state.last;
  const customer = last ? resultCustomer() : null;
  if (!last || !customer || !people[customer.person]) return renderMissingCustomer();
  const tail = resultTail(last);
  const labelBtn =
    last.offer != null && labelOf(last.offer) !== drawerOrder[last.offer]
      ? `<button class="wood-btn" data-act="write-label">寫上櫃面</button>`
      : "";
  const body = `${personHTML(customer.person)}<article class="paper slip"><p>${esc(last.text)}</p><p>${esc(tail)}</p><p><button class="wood-btn" data-act="next">送客</button> ${labelBtn}</p></article>`;
  return counterHTML(body, false);
}

function renderReturns() {
  let dropped = false;
  while (state.returns.length) {
    if (state.ri >= state.returns.length || state.ri < 0) state.ri = 0;
    const item = state.returns[state.ri];
    const customer = item && customers.find((entry) => entry.id === item.id);
    const person = customer && people[customer.person];
    if (item && customer && person) {
      if (dropped) save();
      const body = `${personHTML(customer.person)}
    <article class="paper slip">
      <p>${esc(customer.name || person.name)}返嚟話：尋日嗰包似乎唔係。你若對到，可以補回。</p>
      <p>手上：${esc(handName())}</p>
      <p><button class="wood-btn" data-act="cabinet">開櫃補藥</button> <button class="wood-btn" data-act="skip-return">由得佢</button></p>
    </article>`;
      return counterHTML(body, true);
    }
    state.returns.splice(state.ri, 1);
    dropped = true;
  }
  return renderMissingCustomer();
}

function renderEvening() {
  const info = dayInfo();
  return `<section class="screen">
    <img class="bg" src="assets/ui/ledger.webp" alt="" style="object-fit:cover">
    <div class="daycard"><div class="paper sheet">
      <h2>夜</h2>
      <p>${esc(info.evening)}</p>
      <button class="wood-btn" data-act="evening" style="width:100%">${puzzles.some((item) => item.day === state.day && !state.solved[item.id]) ? "對住暗號" : "熄燈"}</button>
    </div></div>
  </section>`;
}

function renderPuzzle() {
  const puzzle = activePuzzle();
  if (!puzzle) {
    const back = phaseAfterCipher(state.puzzleReturn);
    state.puzzleReturn = null;
    if (back && back !== "puzzle") state.phase = back;
    else applyAdvance();
    save();
    return renderMain();
  }
  const lines = puzzle.lines.map((line, index) => `<p>${index + 1}. ${esc(line.text)}</p>`).join("");
  const slots = state.picks
    .map((id, index) => `<button class="slot" data-act="unpick" data-i="${index}">${esc(slotLabel(id))}</button>`)
    .join("");
  const skip = state.puzzleReturn
    ? `<button class="ghost-btn" data-act="skip-puzzle">返回</button>`
    : `<button class="ghost-btn" data-act="skip-puzzle">今晚先放低</button>`;
  return `<section class="screen" style="background:#2a1812">
    <header class="bar"><h2>${esc(puzzle.title)}</h2><button class="ghost-btn" data-act="mute">${isMuted() ? "聲" : "靜"}</button></header>
    <div class="scroll"><article class="paper letter">${lines}<p>${esc(puzzle.intro)}</p></article>
      <div class="slots">${slots || "<span class='slot'>未揀</span>"}</div>
      <p class="msg">${esc(state.puzzleMsg)}</p>
    </div>
    <div class="row">
      <button class="wood-btn" data-act="cabinet">去百子櫃</button>
      <button class="wood-btn" data-act="submit">對一對</button>
      ${skip}
    </div>
  </section>`;
}

function renderReward() {
  const puzzle = state.reward;
  return `<section class="screen" style="background:#2a1812">
    <div class="scroll"><article class="paper letter">
      <p class="from">${esc(puzzle.rewardTitle)}</p>
      <h3 class="brush" style="font-size:28px">${esc(puzzle.title)}</h3>
      <p class="brush" style="font-size:22px">${esc(puzzle.reward)}</p>
      <button class="wood-btn" data-act="reward">收好</button>
    </article></div>
  </section>`;
}

function renderFinale() {
  const lines = finaleLines().slice(0, state.line + 1).map((line) => `<p>${esc(line)}</p>`).join("");
  const body = `${personHTML("ma")}<article class="paper slip">${lines}<p><button class="wood-btn" data-act="finale-talk">聽落去</button></p></article>`;
  return counterHTML(body, false);
}

function renderFinaleChoice() {
  const p2 = !!state.solved.p2;
  const p3 = !!state.solved.p3;
  const buttons = [
    p2 ? `<button class="paper-btn" data-act="prove" data-kind="receipt">出示贖回收據</button>` : "",
    p3 ? `<button class="paper-btn" data-act="prove" data-kind="tin">打開陳皮罐</button>` : "",
    `<button class="paper-btn" data-act="prove" data-kind="witness">請嬋姐作證</button>`,
    `<button class="wood-btn" data-act="ledger">先翻帳簿</button>`,
  ].join("");
  const body = `${personHTML("ma")}<article class="paper slip"><p>墨未乾。你可以拿出已經對到的東西，或者請隔籬嬋姐出聲。</p><div class="choice">${buttons}</div></article>`;
  return counterHTML(body, false);
}

function renderEnding() {
  const ending = endings[state.ending] || endings.word;
  const letter = letters.final;
  const right = state.log.filter((item) => item.ok).length;
  return `<section class="screen" style="background:#2a1812">
    <div class="scroll ending">
      <article class="paper letter">
        <p class="latin" style="margin:0">辛未 · 清明</p>
        <h3 class="brush" style="font-size:36px">${esc(ending.title)}</h3>
        <p>${esc(ending.lead)}</p>
        <p>${esc(ending.body)}</p>
        <h4>給晚桐</h4>
        <p class="brush" style="font-size:22px">${esc(letter.body).replaceAll("\n", "<br>")}</p>
        <p>七日之中，辨中 ${right} 味。毫銀 ${state.silver}。譽 ${state.rep}。櫃上已寫 ${Object.keys(state.labels).length} 格。</p>
        <div class="choice">
          <button class="paper-btn" data-act="chapters">章回</button>
          <button class="paper-btn" data-act="title">回門面</button>
        </div>
      </article>
    </div>
  </section>`;
}

function renderChapters() {
  const saved = archive();
  const map = saved?.checkpoints || state.checkpoints;
  const buttons = days
    .map((day) => {
      const ready = !!map[day.n];
      return `<button class="paper-btn" data-act="chapter" data-n="${day.n}" ${ready ? "" : "disabled"}>${esc(day.date)} · ${esc(day.title)}</button>`;
    })
    .join("");
  return `<section class="screen" style="background:#2a1812"><div class="scroll"><div class="letter choice">${buttons}<button class="ghost-btn" data-act="title">回門面</button></div></div></section>`;
}

function renderCabinet() {
  const cells = drawerOrder
    .map((id, index) => {
      const label = labelOf(index);
      const name = label ? herbById(label).name : "";
      return `<button class="drawer ${name ? "labelled" : ""}" data-act="drawer" data-i="${index}"><em>${esc(name || "　")}</em></button>`;
    })
    .join("");
  return `<div class="overlay"><header class="bar"><h2>百子櫃</h2><button class="ghost-btn" data-act="close">返回</button></header><div class="drawers">${cells}</div></div>`;
}

function renderPlate() {
  const id = drawerOrder[state.plate];
  const herb = herbById(id);
  const kit = tools();
  const glass = state.glassOn && kit.glass
    ? herb.glass.map((line) => `<p>鏡下：${esc(line)}</p>`).join("")
    : kit.glass
      ? `<p>鏡還未揭開。</p>`
      : `<p>放大鏡尚未從燈下取出。</p>`;
  const weight = state.weighed[id] ? `<p>戥子：${esc(herb.weightText)}</p>` : "";
  const puzzle = state.phase === "puzzle" ? `<button class="wood-btn" data-act="pick">記入帳簿</button>` : "";
  const named = labelOf(state.plate) === id ? herb.name : "未識";
  return `<div class="overlay"><header class="bar"><h2>${esc(named)}</h2><button class="ghost-btn" data-act="close">返回</button></header>
    <div class="plate-wrap scroll">
      <img class="plate-fig" draggable="false" data-drag="plate" src="assets/herbs/${esc(id)}.webp" alt="${esc(named)}">
      <div class="paper traits">${herb.naked.map((line) => `<p>${esc(line)}</p>`).join("")}${glass}${weight}</div>
      <div class="smell">氣味紙：${esc(herb.smell)}　手感：${esc(herb.texture)}</div>
    </div>
    <div class="row">
      ${kit.glass ? `<button class="wood-btn" data-act="glass">${state.glassOn ? "收起鏡" : "揭開放大鏡"}</button>` : ""}
      <button class="wood-btn" data-act="take">攞去包</button>
      <button class="wood-btn" data-act="label-mode">對藥典寫標</button>
      ${puzzle}
    </div></div>`;
}

function renderBook() {
  const page = state.bookPage;
  let inner;
  if (page <= 0) {
    const list = herbs
      .map(
        (herb, index) =>
          `<button data-act="page" data-page="${index + 1}">${esc(herb.name)} <span class="latin">${esc(herb.latin)}</span></button>`,
      )
      .join("");
    inner = `<h3>藥典</h3><p>性味是舊時的分類用語。這本書用來辨形、辨氣、辨產地，不指示任何人服食，也不寫分量。</p><div class="index-list">${list}</div>`;
  } else {
    const herb = herbs[page - 1];
    inner = `<p class="latin" style="margin:0">${esc(herb.latin)}</p>
      <h3>${esc(herb.name)}</h3>
      <p>又名 ${esc(herb.aliases)}</p>
      <h4>形狀</h4><p>${esc(herb.appearance)}</p>
      <h4>性味</h4><p>${esc(herb.nature)}</p>
      <h4>產地</h4><p>${esc(herb.origin)}</p>
      <h4>易混</h4><p>${esc(herb.similar)}</p>
      <h4>叮囑</h4><p>${esc(herb.caution)}</p>
      <h4>阿爺筆跡</h4><p class="brush" style="font-size:22px">${esc(herb.note)}</p>
      <img src="assets/herbs/${esc(herb.id)}.webp" alt="" style="width:100%;margin-top:8px;border:4px solid #eadbbe">
      ${state.labelDrawer != null ? `<p><button class="wood-btn" data-act="use-label">用呢一頁做標籤</button></p>` : ""}`;
  }
  return `<div class="overlay book"><header class="bar"><button class="ghost-btn" data-act="prev">上頁</button><h2>藥典</h2><button class="ghost-btn" data-act="close">合上</button></header>
    <div class="scroll"><article class="paper book-page">${inner}</article><p class="msg">${esc(state.note)}</p></div>
    <div class="row"><button class="wood-btn" data-act="next-page">下頁</button></div></div>`;
}

function renderScale() {
  const herb = state.selected ? herbById(state.selected) : null;
  const text = herb && state.weighed[herb.id] ? herb.weightText : "星未定。";
  return `<div class="overlay"><header class="bar"><h2>戥子</h2><button class="ghost-btn" data-act="close">返回</button></header>
    <div class="scroll"><article class="paper letter"><p>手上：${esc(handName())}</p><p class="brush" style="font-size:42px">${esc(text)}</p><p>${esc(state.scaleMsg)}</p>
    <button class="wood-btn" data-act="weigh">放上戥子</button></article></div></div>`;
}

function renderMap() {
  const list = regions
    .map(
      (region) =>
        `<button class="paper-btn" data-act="region" data-id="${region.id}">${esc(region.name)}<small>${esc(region.hint)}</small></button>`,
    )
    .join("");
  const known = state.selected && state.knownRegion[state.selected] ? `<p class="stamp">已核</p>` : "";
  return `<div class="overlay"><header class="bar"><h2>舊圖</h2><button class="ghost-btn" data-act="close">捲起</button></header>
    <div class="scroll" style="background:#cbb892 url('assets/ui/map.webp') center/cover">
      <article class="paper letter"><p>手上：${esc(handName())}。揀一個地方對一對。</p>${known}<p>${esc(state.mapMsg)}</p></article>
      <div class="region-list">${list}</div>
    </div></div>`;
}

function renderLetters() {
  if (state.reading && letters[state.reading]) {
    const letter = letters[state.reading];
    return `<div class="overlay"><header class="bar"><h2>書信</h2><button class="ghost-btn" data-act="letters">返回</button></header>
      <div class="scroll"><article class="paper letter"><p class="from">${esc(letter.from)} · ${esc(letter.title)}</p><p>${esc(letter.body).replaceAll("\n", "<br>")}</p></article></div></div>`;
  }
  const list = state.ownedLetters.length
    ? state.ownedLetters
        .map((id) => {
          const letter = letters[id];
          if (!letter) return "";
          return `<button class="paper-btn" data-act="read" data-id="${id}">${esc(letter.title)}<small style="display:block">${esc(letter.from)}</small></button>`;
        })
        .join("")
    : `<p class="paper letter">未有信。</p>`;
  return `<div class="overlay"><header class="bar"><h2>書信</h2><button class="ghost-btn" data-act="close">返回</button></header><div class="scroll region-list">${list}</div></div>`;
}

function renderLedger() {
  const list = puzzles
    .map((puzzle) => {
      if (!ledgerOpen(puzzle, state.day, state.phase, state.solved)) return "";
      const mark = state.solved[puzzle.id] ? "已對" : "未對";
      return `<button class="paper-btn" data-act="open-puzzle" data-id="${puzzle.id}">${esc(puzzle.title)} · ${mark}</button>`;
    })
    .join("");
  const log = state.log
    .map((item) => {
      const customer = customers.find((entry) => entry.id === item.id);
      const person = customer ? people[customer.person] : null;
      if (!person) return "";
      return `<p>${esc(person.name)}：${item.ok ? "辨中" : "未中"}</p>`;
    })
    .join("");
  return `<div class="overlay"><header class="bar"><h2>帳簿</h2><button class="ghost-btn" data-act="close">合上</button></header>
    <div class="scroll"><div class="region-list">${list || "<p class='paper letter'>邊注尚未顯出。</p>"}<article class="paper letter"><h3>舖誌</h3>${log || "<p>尚未有客。</p>"}</article></div></div></div>`;
}

function renderWrap() {
  const id = state.selected;
  const chip = !state.placed && id
    ? `<img class="hand-chip" draggable="false" data-drag="hand" src="assets/herbs/${esc(id)}.webp" alt="">`
    : "";
  const fig = state.placed && id
    ? `<img src="assets/herbs/${esc(id)}.webp" alt="" style="width:46%;max-height:28dvh;object-fit:contain">`
    : `<p>未放上</p>`;
  return `<div class="overlay"><header class="bar"><h2>包藥</h2><button class="ghost-btn" data-act="close">返回</button></header>
    <div class="scroll wrap-stage">
      ${chip}
      <div data-drop="1" class="paper drop-sheet">
        ${fig}
        <p>手上：${esc(handName())}</p>
      </div>
    </div>
    <div class="row">
      <button class="wood-btn" data-act="place">放上紙</button>
      <button class="wood-btn" data-act="give" ${state.placed ? "" : "disabled"}>縛繩交出去</button>
    </div></div>`;
}

function renderCredits() {
  return `<div class="overlay"><header class="bar"><h2>誌謝</h2><button class="ghost-btn" data-act="credits">返回</button></header>
    <div class="scroll"><article class="paper letter">
      <p>${esc(disclaimer)}</p>
      <p>藥材名實參考常見道地與性狀：切面、氣味、產地用來辨認，不寫服法與分量。苦杏仁一條只記舊籍「有小毒」，提醒玩家這是故事。</p>
      <p>畫：舖內、櫃面與黃芪、嬋姐為開局原畫。其餘標本、人物、日課圖以同一路水墨淡彩續成。</p>
      <p>字：思源宋體 Noto Serif TC、馬善政楷、Cormorant Garamond，皆為 SIL Open Font License。</p>
      <p>聲：雨巷、櫃響、紙聲、戥子、門鐘為本作為遊戲合成的原聲，以 CC0 釋出。雨聲循環作環境，其餘為短音效。</p>
      <p>故事人物、當票與表哥皆屬虛構。西關、新會、岷縣、灌縣只作一九三一年的地圖。</p>
    </article></div></div>`;
}

function renderOverlay() {
  switch (state.overlay) {
    case "cabinet":
      return renderCabinet();
    case "plate":
      return renderPlate();
    case "book":
      return renderBook();
    case "scale":
      return renderScale();
    case "map":
      return renderMap();
    case "letters":
      return renderLetters();
    case "ledger":
      return renderLedger();
    case "wrap":
      return renderWrap();
    case "credits":
      return renderCredits();
    default:
      return "";
  }
}

function renderMain() {
  switch (state.phase) {
    case "intro":
      return renderIntro();
    case "talk":
      return renderTalk();
    case "desk":
      return renderDesk();
    case "result":
      return renderResult();
    case "returns":
      return state.returns.length ? renderReturns() : renderTalk();
    case "evening":
      return renderEvening();
    case "puzzle":
      return renderPuzzle();
    case "reward":
      return renderReward();
    case "finale":
      return renderFinale();
    case "finaleChoice":
      return renderFinaleChoice();
    case "ending":
      return renderEnding();
    case "chapters":
      return renderChapters();
    default:
      return renderTitle();
  }
}

let dragStop = null;
const PLATE_DRAG = 64;

function bindDrag() {
  if (dragStop) dragStop();
  const zone = app.querySelector("[data-drop]");
  const chips = [...app.querySelectorAll("[data-drag]")];
  if (!chips.length) {
    dragStop = null;
    return;
  }
  let held = null;
  const track = (node, clientX, clientY) => {
    const dx = clientX - Number(node.dataset.x);
    const dy = clientY - Number(node.dataset.y);
    node.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  const takePlate = (node) => {
    if (state.plate == null) return;
    node.style.transform = "";
    state.selected = drawerOrder[state.plate];
    state.placed = false;
    state.overlay = "wrap";
    play("paper");
    save();
    render();
  };
  const finish = (clientX, clientY) => {
    if (!held) return;
    const node = held;
    held = null;
    const dx = clientX - Number(node.dataset.x);
    const dy = clientY - Number(node.dataset.y);
    node.style.transform = "";
    if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return;
    if (clientX === 0 && clientY === 0) return;
    const distance = Math.hypot(dx, dy);
    if (node.dataset.drag === "plate") {
      if (distance <= PLATE_DRAG || Math.abs(dy) >= Math.abs(dx)) return;
      takePlate(node);
      return;
    }
    if (distance <= 18) return;
    if (!zone || state.placed || !state.selected) return;
    const rect = zone.getBoundingClientRect();
    const inside =
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom;
    if (!inside) return;
    state.placed = true;
    play("paper");
    save();
    render();
  };
  const onDown = (event) => {
    if (event.button != null && event.button !== 0) return;
    const node = event.currentTarget;
    held = node;
    node.dataset.x = String(event.clientX);
    node.dataset.y = String(event.clientY);
    // A plate gesture must stay a scroll until it is clearly sideways.
    if (node.dataset.drag !== "plate") event.preventDefault();
  };
  const onMove = (event) => {
    if (!held) return;
    const dx = event.clientX - Number(held.dataset.x);
    const dy = event.clientY - Number(held.dataset.y);
    if (held.dataset.drag === "plate") {
      if (Math.hypot(dx, dy) <= PLATE_DRAG) return;
      if (Math.abs(dy) >= Math.abs(dx)) {
        held.style.transform = "";
        held = null;
        return;
      }
      if (event.cancelable) event.preventDefault();
    }
    track(held, event.clientX, event.clientY);
  };
  const onCancel = () => {
    if (!held || held.dataset.drag !== "plate") return;
    held.style.transform = "";
    held = null;
  };
  // Chrome can still start a native image drag and report the release on dragend.
  const onDragOver = (event) => {
    if (!held || held.dataset.drag === "plate") return;
    track(held, event.clientX, event.clientY);
  };
  const onUp = (event) => finish(event.clientX, event.clientY);
  const onDragEnd = (event) => {
    if (held?.dataset.drag === "plate") return;
    finish(event.clientX, event.clientY);
  };
  for (const node of chips) node.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onCancel);
  window.addEventListener("dragover", onDragOver);
  window.addEventListener("dragend", onDragEnd);
  dragStop = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onCancel);
    window.removeEventListener("dragover", onDragOver);
    window.removeEventListener("dragend", onDragEnd);
    for (const node of chips) node.removeEventListener("pointerdown", onDown);
  };
}

function render() {
  app.innerHTML = (atMenu ? renderTitle() : renderMain()) + (atMenu && state.overlay !== "credits" ? "" : renderOverlay());
  if (atMenu && state.overlay === "credits") {
    /* credits already included */
  }
  const mute = app.querySelector(".daybar");
  if (mute && !app.querySelector("[data-act='mute']")) {
    const button = document.createElement("button");
    button.dataset.act = "mute";
    button.textContent = isMuted() ? "聲" : "靜";
    button.style.cssText = "background:transparent;color:#eadbbe;min-height:44px;min-width:44px";
    mute.appendChild(button);
  }
  bindDrag();
}

document.addEventListener("click", (event) => {
  const node = event.target.closest("[data-act]");
  if (!node || node.disabled) return;
  act(node.dataset.act, node);
});

boot();
