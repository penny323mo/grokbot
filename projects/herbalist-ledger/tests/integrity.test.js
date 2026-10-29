import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { herbs, drawerOrder, regions } from "../src/herbs.js";
import { customers, days, puzzles, people, letters, endings, disclaimer } from "../src/story.js";
import { customerSolution, puzzleLineSolution, walkStrings, ledgerOpen, phaseAfterCipher } from "../src/logic.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const simplified = "药柜门这过来个对时国学体东车问间后发经长风云电为与无头实点开关从还进远边条医仅让儿书图现产处鱼鸡广气叶";

test("twenty-four herbs, one plate and one entry each", () => {
  assert.equal(herbs.length, 24);
  assert.equal(new Set(herbs.map((herb) => herb.id)).size, 24);
  assert.equal(new Set(herbs.map((herb) => herb.name)).size, 24);
  assert.deepEqual([...drawerOrder].sort(), herbs.map((herb) => herb.id).sort());
  for (const herb of herbs) {
    assert.ok(herb.latin.includes(" "), herb.id);
    assert.ok(herb.appearance && herb.nature && herb.origin && herb.similar && herb.caution && herb.note, herb.id);
    assert.ok(herb.tokens.length >= 3, herb.id);
    assert.ok(regions.some((region) => region.id === herb.region), herb.id);
    const plate = path.join(root, "assets/herbs", `${herb.id}.webp`);
    assert.equal(fs.existsSync(plate), true, plate);
  }
});

test("every customer is uniquely solvable and does not name the herb", () => {
  assert.ok(customers.length >= 18 && customers.length <= 21);
  assert.equal(new Set(customers.map((customer) => customer.id)).size, customers.length);
  for (const day of days) {
    const group = customers.filter((customer) => customer.day === day.n);
    assert.equal(group.length, 3, `day ${day.n}`);
  }
  for (const customer of customers) {
    const hit = customerSolution(herbs, customer);
    assert.ok(hit, customer.id);
    assert.equal(hit.id, customer.correct, customer.id);
    assert.ok(people[customer.person], customer.person);
    assert.ok(customer.near.length >= 1);
    for (const id of customer.near) {
      assert.notEqual(id, customer.correct);
      assert.ok(herbs.some((herb) => herb.id === id));
    }
    const asked = [...customer.lines, ...customer.clues, customer.bad, customer.nearMiss].join("\n");
    for (const herb of herbs) {
      assert.equal(asked.includes(herb.name), false, `${customer.id} leaks ${herb.name}`);
    }
    assert.equal(customer.ok.includes(hit.name), true, `${customer.id} confirm`);
  }
});

test("ledger puzzles are ordered and uniquely solvable", () => {
  assert.equal(puzzles.length, 3);
  for (const puzzle of puzzles) {
    assert.ok(puzzle.lines.length >= 3);
    puzzle.lines.forEach((line, index) => {
      const hit = puzzleLineSolution(herbs, line);
      assert.ok(hit, `${puzzle.id}:${index}`);
      assert.equal(hit.id, line.answer);
      for (const herb of herbs) {
        assert.equal(line.text.includes(herb.name), false, line.text);
        if (puzzle.hints[index]) assert.equal(puzzle.hints[index].includes(herb.name), false);
      }
    });
    const sequence = puzzle.lines.map((line) => line.answer);
    assert.equal(new Set(sequence).size, sequence.length);
  }
});

test("no doses and no simplified shop words", () => {
  const game = fs.readFileSync(path.join(root, "src/game.js"), "utf8");
  const blob = `${walkStrings({ herbs, customers, days, puzzles, letters, endings, disclaimer }).join("\n")}\n${game}`;
  assert.equal(/(\d+\s*(克|毫克|公分|錢|毫升))|(日服|煎服|沖服|冲服|內服|用量|劑量)/.test(blob), false);
  for (const ch of simplified) {
    assert.equal(blob.includes(ch), false, `simplified ${ch}`);
  }
});

test("today's ledger cipher stays shut until evening", () => {
  const puzzle = puzzles.find((item) => item.day === 2);
  assert.equal(ledgerOpen(puzzle, 2, "desk", {}), false);
  assert.equal(ledgerOpen(puzzle, 2, "talk", {}), false);
  assert.equal(ledgerOpen(puzzle, 2, "evening", {}), true);
  assert.equal(ledgerOpen(puzzle, 2, "desk", { p1: true }), true);
  assert.equal(ledgerOpen(puzzle, 3, "desk", {}), true);
  assert.equal(ledgerOpen(puzzles.find((item) => item.id === "p2"), 4, "desk", {}), false);
  assert.equal(ledgerOpen(puzzle, puzzle.day, "returns", {}), false);
});

test("a cipher opened from the return queue comes back to that queue", () => {
  assert.equal(phaseAfterCipher("returns"), "returns");
  assert.equal(phaseAfterCipher("returns", true), "returns");
  assert.equal(phaseAfterCipher("desk"), "desk");
  assert.equal(phaseAfterCipher("talk"), "talk");
  assert.equal(phaseAfterCipher("finale"), "finale");
  assert.equal(phaseAfterCipher("finaleChoice", true), "finaleChoice");
  assert.equal(phaseAfterCipher(null), null);
  assert.equal(phaseAfterCipher("evening"), "evening");
  assert.equal(phaseAfterCipher("evening", true), null);
});

test("portraits, audio, and local relative entry", () => {
  for (const person of Object.values(people)) {
    assert.equal(fs.existsSync(path.join(root, person.src)), true, person.src);
  }
  for (const file of ["rain.ogg", "bell.ogg", "paper.ogg", "drawer.ogg", "scale.ogg"]) {
    assert.equal(fs.existsSync(path.join(root, "assets/audio", file)), true, file);
  }
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.equal(html.includes("https://"), false);
  assert.equal(html.includes('src="/'), false);
  assert.match(html, /src="src\/game\.js"/);
  assert.match(html, /lang="zh-Hant"/);
});
