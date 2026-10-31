import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  INITIAL_STATE,
  YEAR_META,
  SEASONS,
  CHARACTERS,
  PORTS,
  GOODS,
  ROUTES,
  VOYAGE_EVENTS,
  PORT_LETTERS,
  ENDINGS,
  getRoute,
  getGoodPrice,
  getTotalCargoCount,
  grantCargo,
  getCargoValuation
} from "../src/data.js";

import {
  cloneInitialState,
  buyGood,
  sellGood,
  payDebtAmount,
  settleYearEnd,
  simulateCarefulPlayer
} from "../src/game.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

test("1. All ports, goods, routes, and price tables have valid positive numbers and no NaN", () => {
  const portIds = Object.keys(PORTS);
  assert.deepEqual(
    portIds.sort(),
    ["guangzhou", "macau", "malacca", "manila", "nagasaki"],
    "Must define all 5 required historical ports"
  );

  assert.equal(GOODS.length, 7, "Must define all 7 trade goods");

  const state = cloneInitialState();

  for (const season of ["SW", "NE"]) {
    state.season = season;
    for (const pId of portIds) {
      for (const good of GOODS) {
        const price = getGoodPrice(state, pId, good.id);
        assert.ok(Number.isFinite(price.buy) && price.buy > 0, `Invalid buy price at ${pId} for ${good.id}`);
        assert.ok(Number.isFinite(price.sell) && price.sell > 0, `Invalid sell price at ${pId} for ${good.id}`);
        assert.ok(price.buy > price.sell, `Buy price (${price.buy}) must exceed sell price (${price.sell}) at ${pId}/${good.id}`);
      }
    }
  }

  // Verify all 20 directed port-to-port pairs have valid route definitions
  let pairCount = 0;
  for (const from of portIds) {
    for (const to of portIds) {
      if (from === to) continue;
      pairCount += 1;
      for (const season of ["SW", "NE"]) {
        const r = getRoute(from, to, season);
        assert.ok(r, `Missing route ${from} -> ${to}`);
        assert.ok(Number.isFinite(r.distLi) && r.distLi > 0, `Invalid distance ${from} -> ${to}`);
        assert.ok(Number.isFinite(r.expectedDays) && r.expectedDays > 0, `Invalid expectedDays ${from} -> ${to}`);
        assert.ok(["順風", "側風", "逆風", "平風"].includes(r.windFit), `Invalid windFit ${r.windFit}`);
      }
    }
  }
  assert.equal(pairCount, 20, "All 20 directed routes between 5 ports must be present");
  assert.equal(ROUTES.length, 20);
});

test("2. Every art, font, and audio asset referenced in data & HTML/CSS exists on disk as non-empty file with relative path", () => {
  const assetPaths = new Set([
    "assets/art/title_key.webp",
    "assets/art/chart_table.webp",
    "assets/art/cover.webp",
    "assets/art/thumb.webp",
    "assets/ui/ledger_spread.webp",
    "assets/ui/letter_paper.webp",
    "assets/ui/ship_token.webp",
    "assets/events/guild_hall.webp",
    "assets/audio/sea.ogg",
    "assets/audio/harbour.ogg",
    "assets/audio/creak.ogg",
    "assets/audio/coins.ogg",
    "assets/audio/paper.ogg",
    "assets/audio/bell.ogg",
    "assets/fonts/MaShanZheng-Regular.woff2",
    "assets/fonts/Cormorant-Medium.ttf",
    "assets/fonts/Cormorant-MediumItalic.ttf",
    "assets/fonts/noto/noto-serif-tc.css"
  ]);

  for (const p of Object.values(PORTS)) assetPaths.add(p.art);
  for (const g of GOODS) assetPaths.add(g.art);
  for (const c of Object.values(CHARACTERS)) assetPaths.add(c.art);
  for (const ev of VOYAGE_EVENTS) assetPaths.add(ev.art);
  for (const end of Object.values(ENDINGS)) assetPaths.add(end.art);

  for (const relPath of assetPaths) {
    assert.ok(!relPath.startsWith("/"), `Asset path must be relative, got: ${relPath}`);
    const fullPath = path.join(ROOT, relPath);
    assert.ok(fs.existsSync(fullPath), `Missing asset file on disk: ${relPath}`);
    const stat = fs.statSync(fullPath);
    assert.ok(stat.size > 100, `Asset file is empty or too small: ${relPath} (${stat.size} bytes)`);
  }
});

test("3. Buy/sell and cargo-hold math never produces negative silver, negative cargo, or NaN", () => {
  const state = cloneInitialState();
  state.port = "guangzhou";
  const initialSilver = state.silver;
  const initialSilk = state.cargo.raw_silk;

  // Buy raw silk within budget and capacity
  const buyRes = buyGood(state, "raw_silk", 10);
  assert.equal(buyRes.ok, true);
  assert.equal(state.cargo.raw_silk, initialSilk + 10);
  assert.ok(state.silver < initialSilver && state.silver >= 0);
  assert.ok(Number.isFinite(state.silver));

  // Attempting to buy 9999 units caps to affordable & hold capacity without negative silver
  const hugeBuy = buyGood(state, "porcelain", 9999);
  assert.ok(state.silver >= 0 && Number.isFinite(state.silver));
  assert.ok(getTotalCargoCount(state.cargo) <= state.cargoCap);
  assert.ok(hugeBuy.qty >= 0);

  // Attempting to sell more than held caps to held amount and never goes negative
  const heldSilk = state.cargo.raw_silk;
  const sellRes = sellGood(state, "raw_silk", heldSilk + 50);
  assert.equal(sellRes.ok, true);
  assert.equal(sellRes.qty, heldSilk);
  assert.equal(state.cargo.raw_silk, 0);
  assert.equal(state.cargoCostBasis.raw_silk, 0);
  assert.ok(state.silver > 0 && Number.isFinite(state.silver));

  // Selling when cargo is 0 fails cleanly without mutating state
  const emptySell = sellGood(state, "raw_silk", 5);
  assert.equal(emptySell.ok, false);
  assert.equal(state.cargo.raw_silk, 0);
});

test("4. Voyage events & port letters execute cleanly without NaN or invalid state", () => {
  for (const ev of VOYAGE_EVENTS) {
    assert.ok(ev.choices.length >= 2, `Event ${ev.id} must have at least 2 choices`);
    for (const ch of ev.choices) {
      const s = cloneInitialState();
      const text = ch.resolve(s, 0.25);
      assert.equal(typeof text, "string");
      assert.ok(text.length > 5);
      assert.ok(Number.isFinite(s.silver) && s.silver >= 0, `Event ${ev.id} produced invalid silver`);
      assert.ok(Number.isFinite(s.hull) && s.hull >= 0, `Event ${ev.id} produced invalid hull`);
    }
  }

  for (const letter of PORT_LETTERS) {
    assert.ok(letter.choices.length >= 2, `Letter ${letter.id} must have choices`);
    for (const ch of letter.choices) {
      const s = cloneInitialState();
      const msg = ch.effect(s);
      assert.equal(typeof msg, "string");
      assert.ok(Number.isFinite(s.silver) && s.silver >= 0);
    }
  }
});

test("5. Simulated careful player repays the 3,600-tael debt within 3 years", () => {
  const sim = simulateCarefulPlayer(1600);
  assert.equal(sim.state.debt, 0, `Expected careful player to repay full 3,600-tael debt, remaining: ${sim.state.debt}`);
  assert.equal(sim.result.finished, true, "Expected simulation to finish campaign victoriously");
  assert.ok(
    ["ending_fortune", "ending_survival", "ending_truth"].includes(sim.result.endingId),
    `Expected victorious ending, got ${sim.result.endingId}`
  );
  assert.ok(sim.state.silver >= 0 && Number.isFinite(sim.state.silver));
});

test("6. Round 1 fixes: hold cap on narrative grants, broke smuggler refusal, 3-clue gate on brother letter, storm 5-unit drop", () => {
  // 6a. Narrative grants respect 60-擔 cargoCap
  const fullState = cloneInitialState();
  fullState.cargo.raw_silk = 56; // 56 raw_silk + 4 porcelain = 60/60 full hold
  assert.equal(getTotalCargoCount(fullState.cargo), 60);

  const gzLetter = PORT_LETTERS.find(l => l.id === "let_guild_y1");
  gzLetter.choices[0].effect(fullState);
  assert.equal(getTotalCargoCount(fullState.cargo), 60, "Guangzhou letter must not exceed 60-擔 hold");

  const malLetter = PORT_LETTERS.find(l => l.id === "let_malacca_spice");
  malLetter.choices[0].effect(fullState);
  assert.equal(getTotalCargoCount(fullState.cargo), 60, "Malacca letter must not exceed 60-擔 hold");

  const wreckEv = VOYAGE_EVENTS.find(e => e.id === "ev_shipwreck");
  wreckEv.choices[1].resolve(fullState);
  assert.equal(getTotalCargoCount(fullState.cargo), 60, "Shipwreck salvage must not exceed 60-擔 hold");

  // 6b. Smuggler choice 0 with < 120 silver refuses without paying the player or adding cargo
  const brokeState = cloneInitialState();
  brokeState.silver = 50;
  const beforeCargo = getTotalCargoCount(brokeState.cargo);
  const smugglerEv = VOYAGE_EVENTS.find(e => e.id === "ev_smuggler");
  smugglerEv.choices[0].resolve(brokeState);
  assert.equal(brokeState.silver, 50, "Broke smuggler option must not give silver to player");
  assert.equal(getTotalCargoCount(brokeState.cargo), beforeCargo, "Broke smuggler option must not add cargo");

  // 6c. Jesuit letter only grants clue_jesuit_cipher; Brother rescue letter requires all 3 clues
  const clueState = cloneInitialState();
  const jesuitLetter = PORT_LETTERS.find(l => l.id === "let_jesuit_cipher_y2");
  jesuitLetter.choices[0].effect(clueState);
  assert.deepEqual(clueState.clues, ["clue_jesuit_cipher"]);

  const brotherLetter = PORT_LETTERS.find(l => l.id === "let_brother_rescue_y2");
  assert.equal(brotherLetter.condition(clueState), false, "Brother rescue letter must be locked with only 1 clue");
  clueState.clues.push("clue_logbook", "clue_manila_draft");
  assert.equal(brotherLetter.condition(clueState), true, "Brother rescue letter unlocks once all 3 clues are found");

  // 6d. Storm choice 0 drops up to 5 units matching label
  const stormState = cloneInitialState();
  stormState.cargo.raw_silk = 10;
  const stormEv = VOYAGE_EVENTS.find(e => e.id === "ev_storm");
  stormEv.choices[0].resolve(stormState);
  assert.equal(stormState.cargo.raw_silk, 5, "Storm jettison choice must drop 5 units when >=5 are held");

  // 6e. Pirate bribe choice 1 removes up to 2 porcelain in addition to 80 silver
  const pirateState = cloneInitialState();
  pirateState.cargo.porcelain = 4;
  const pirateEv = VOYAGE_EVENTS.find(e => e.id === "ev_pirates");
  pirateEv.choices[1].resolve(pirateState);
  assert.equal(pirateState.cargo.porcelain, 2, "Pirate bribe choice must deduct 2 porcelain when held");
});

