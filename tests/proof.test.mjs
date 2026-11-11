import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { derive, exampleRows, canonical } from "../src/proof.js";
const input = (k) =>
  JSON.parse(
    fs.readFileSync(new URL("../examples/" + k + ".json", import.meta.url)),
  );
test("state splitting preserves behavior without graph isomorphism", () => {
  const p = input("preserved"),
    r = derive(p, exampleRows(p, "preserved"));
  assert.equal(r.outcome, "EQUIVALENT");
  assert(r.relation.some(([a, b]) => a === "1" && b === "1"));
  assert(r.relation.some(([a, b]) => a === "1" && b === "2"));
  assert.equal(p.left.states.length, 3);
  assert.equal(p.right.states.length, 4);
});
test("same traces cannot conceal an earlier loss of choice", () => {
  const p = input("early-fork"),
    r = derive(p, exampleRows(p, "early-fork"));
  assert.equal(r.outcome, "DISTINGUISHABLE");
  const first = r.rounds[1].removed;
  assert(first.some((x) => canonical(x.pair) === '["1","1"]'));
  assert(first.some((x) => canonical(x.pair) === '["1","2"]'));
  const root = r.rounds[2].removed.find(
    (x) => canonical(x.pair) === '["0","0"]',
  );
  assert(root);
  assert.deepEqual(root.responses, [
    ["1", "1"],
    ["1", "2"],
  ]);
});
test("every negative response references a strictly earlier removed pair", () => {
  const p = input("early-fork"),
    r = derive(p, exampleRows(p, "early-fork")),
    ranks = new Map();
  for (const round of r.rounds) {
    for (const w of round.removed) {
      for (const child of w.responses || [])
        assert(ranks.has(canonical(child)));
    }
    for (const w of round.removed)
      ranks.set(canonical(w.pair), Number(round.round));
  }
});
test("unknown transition semantics block adoption rather than inventing disabled edges", () => {
  const p = input("unclear"),
    r = derive(p, exampleRows(p, "unclear"));
  assert.equal(r.outcome, "REVIEW");
  assert.deepEqual(r.unknown_rows, ["5"]);
  assert.equal(r.rounds.length, 0);
});
test("visible observations distinguish even two terminal states", () => {
  const p = input("preserved");
  p.right.states[3].observation = "error";
  const r = derive(p, exampleRows(p, "preserved"));
  assert.equal(r.outcome, "DISTINGUISHABLE");
  assert(r.rounds[0].removed.some((x) => canonical(x.pair) === '["2","3"]'));
});
