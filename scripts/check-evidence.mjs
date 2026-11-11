import fs from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { canonical, signature, checkProof, fixtures } from "../src/proof.js";
import { leader, succeeded } from "../src/transport.js";
const sha = (x) => createHash("sha256").update(x).digest("hex"),
  d = JSON.parse(fs.readFileSync("evidence/deployment.json")),
  r = JSON.parse(fs.readFileSync("evidence/early-fork-observed.json")),
  tx = JSON.parse(fs.readFileSync("evidence/compare-observed.json"));
assert.equal(sha(fs.readFileSync("contracts/choicekeep.py")), d.sourceSha256);
assert.equal(d.chainId, 61999);
assert.equal(r.protocol, d.protocol);
assert.equal(r.owner, d.owner);
assert.equal(r.state, "DISTINGUISHABLE");
assert.equal(r.input_hash, sha(canonical(r.spec)));
assert.equal(
  canonical(r.accepted.rows.map((x) => x.moves)),
  canonical(fixtures["early-fork"]),
);
checkProof(r);
assert.equal(
  r.certificate,
  sha(
    canonical({
      protocol: r.protocol,
      input_hash: r.input_hash,
      signature: signature(r.accepted),
      proof: r.proof,
    }),
  ),
);
assert(succeeded(tx));
assert.equal(tx.to_address.toLowerCase(), d.address);
assert.equal(tx.from_address.toLowerCase(), r.owner);
assert.equal(BigInt(tx.value || 0), 0n);
const votes = Object.values(tx.consensus_data.votes);
assert(votes.filter((x) => x === "agree").length >= 3);
assert.equal(leader(tx).execution_result, "SUCCESS");
console.log(
  "Frozen source, complete transition vector, proof, certificate and finalized majority receipt verified offline.",
);

// The full integration archive adds positive adoption and fail-closed guards.
const live = JSON.parse(fs.readFileSync("evidence/live.json"));
assert.equal(live.complete, true);
assert.equal(live.address, d.address);
assert.equal(live.owner, d.owner);
assert.equal(live.sourceSha256, d.sourceSha256);
const { gunzipSync } = await import("node:zlib");
const { abi } = await import("genlayer-js");
const archive = JSON.parse(
  gunzipSync(fs.readFileSync("evidence/receipts.json.gz")),
);
assert.equal(Object.keys(live.steps).length, 8);
assert.equal(Object.keys(archive).length, 8);
assert.equal(new Set(Object.values(archive).map((x) => x.hash)).size, 8);
const flow = JSON.parse(fs.readFileSync("evidence/flow.json"));
assert.equal(
  flow.receiptArchiveSha256,
  sha(fs.readFileSync("evidence/receipts.json.gz")),
);
for (const [name, step] of Object.entries(live.steps)) {
  const receipt = archive[name];
  assert.equal(receipt.hash, step.hash);
  assert.equal(receipt.status, 7);
  assert.equal(receipt.result, 6);
  assert.equal(receipt.from_address.toLowerCase(), d.owner);
  assert.equal(BigInt(receipt.value || 0), 0n);
  assert.equal(step.preflight.chainId, 61999);
  assert.equal(BigInt(step.preflight.gasPrice), 0n);
  assert.equal(step.preflight.leaderOnly, false);
  assert.equal(step.done, true);
  if (step.method === "deploy") {
    assert.equal(receipt.data.contract_address.toLowerCase(), d.address);
  } else {
    assert.equal(receipt.to_address.toLowerCase(), d.address);
    const data =
      typeof receipt.data.calldata === "string"
        ? receipt.data.calldata
        : receipt.data.calldata.base64;
    const call = abi.calldata.decode(
      Uint8Array.from(Buffer.from(data, "base64")),
    );
    assert.equal(call.get("method"), step.method);
    assert.equal(canonical(call.get("args") || []), canonical(step.args));
  }
  if (step.guard) {
    assert.equal(leader(receipt).execution_result, "ERROR");
    assert.equal(canonical(step.before), canonical(step.after));
    assert.equal(
      step.before.state,
      name === "reject-non-equivalent" ? "DISTINGUISHABLE" : "EQUIVALENT",
    );
  } else assert(succeeded(receipt));
}
for (const [tag, expected] of [
  ["early-fork", "DISTINGUISHABLE"],
  ["preserved", "ADOPTED"],
]) {
  const record = live.records[tag];
  assert.equal(record.state, expected);
  assert.equal(record.input_hash, sha(canonical(record.spec)));
  assert.equal(
    canonical(record.accepted.rows.map((row) => row.moves)),
    canonical(fixtures[tag]),
  );
  checkProof(record);
  assert.equal(
    record.certificate,
    sha(
      canonical({
        protocol: record.protocol,
        input_hash: record.input_hash,
        signature: signature(record.accepted),
        proof: record.proof,
      }),
    ),
  );
  assert.equal(
    canonical(record),
    canonical(live.independentReadback.find((x) => x.tag === tag)),
  );
}
assert.equal(live.records.preserved.proof.outcome, "EQUIVALENT");
assert.equal(live.records.preserved.adoption.by, d.owner);
assert.equal(
  live.records.preserved.adoption.certificate,
  live.records.preserved.certificate,
);
assert.equal(
  live.records.preserved.adoption.reference,
  live.records.preserved.spec.left.name,
);
assert.equal(
  live.records.preserved.adoption.replacement,
  live.records.preserved.spec.right.name,
);
console.log(
  "Eight unique finalized receipts, two unchanged guard snapshots and two independent final records verified offline.",
);
