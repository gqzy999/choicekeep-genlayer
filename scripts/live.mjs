import fs from "node:fs";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import assert from "node:assert/strict";
import {
  createAccount,
  generatePrivateKey,
  createClient,
  abi,
} from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import {
  installTransport,
  leader,
  finalized,
  succeeded,
} from "../src/transport.js";
import { canonical, checkProof } from "../src/proof.js";
installTransport();
const sha = (x) => createHash("sha256").update(x).digest("hex"),
  j = (x) =>
    JSON.stringify(x, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2),
  file = ".private/chain.json",
  source = fs.readFileSync("contracts/choicekeep.py", "utf8");
fs.mkdirSync(".private", { recursive: true, mode: 0o700 });
const s = fs.existsSync(file)
  ? JSON.parse(fs.readFileSync(file))
  : {
      key: generatePrivateKey(),
      sourceSha256: sha(source),
      steps: {},
      records: {},
    };
assert.equal(s.sourceSha256, sha(source), "Frozen source changed");
if (s.complete)
  throw Error(
    "This run is complete. Existing valid transactions must not be repeated.",
  );
const account = createAccount(s.key),
  client = createClient({ chain: studionet, account });
s.owner = account.address.toLowerCase();
function save() {
  fs.writeFileSync(file, j(s), { mode: 0o600 });
  const { key, ...pub } = s;
  fs.writeFileSync(
    "evidence/live.json",
    j({
      ...pub,
      network: { chainId: 61999, rpc: "https://studio.genlayer.com/api" },
      fixture:
        "Two synthetic finite workflow specifications, one disposable SDK signer. No physical identity, runtime execution or verified external-system conformance is claimed.",
    }),
  );
}
async function read(tag, c = client) {
  return JSON.parse(
    await c.readContract({
      address: s.address,
      functionName: "get_case",
      args: [s.owner, tag],
      transactionHashVariant: "latest-final",
    }),
  );
}
async function transaction(label, method, args = [], guard = "", tag = "") {
  let t = s.steps[label];
  if (t?.done) return;
  if (!t) {
    assert.equal(Number(await client.getChainId()), 61999);
    const gasPrice = await client.request({
      method: "eth_gasPrice",
      params: [],
    });
    assert.equal(BigInt(gasPrice), 0n);
    t = s.steps[label] = {
      method,
      args,
      guard,
      preflight: {
        chainId: 61999,
        gasPrice: String(gasPrice),
        value: "0",
        leaderOnly: false,
      },
      before: guard ? await read(tag) : null,
      sendStarted: true,
    };
    save();
    t.hash =
      method === "deploy"
        ? await client.deployContract({
            code: source,
            args: [],
            leaderOnly: false,
          })
        : await client.writeContract({
            address: s.address,
            functionName: method,
            args,
            value: 0n,
            leaderOnly: false,
          });
    assert.equal(typeof t.hash, "string");
    save();
    console.log(label, t.hash);
  }
  assert(t.hash, "Submission uncertain: inspect manually; do not resend.");
  let tx;
  for (let i = 0; i < 180; i++) {
    try {
      tx = await client.getTransaction({ hash: t.hash });
    } catch (e) {
      console.log("Receipt transport retry for saved hash", label);
      continue;
    }
    if (finalized(tx)) break;
    if (
      [
        8,
        "CANCELED",
        "UNDETERMINED",
        "LEADER_TIMEOUT",
        "VALIDATORS_TIMEOUT",
      ].includes(tx?.status)
    ) {
      t.receipt = tx;
      save();
      throw Error("Consensus stopped " + label);
    }
    if (i % 12 === 0) console.log(label, "tracking status", tx?.status);
    await new Promise((r) => setTimeout(r, 4000));
  }
  assert(finalized(tx), "Known hash still pending; resume saved hash only");
  t.receipt = tx;
  save();
  assert.equal(tx.from_address.toLowerCase(), s.owner);
  assert.equal(BigInt(tx.value || 0), 0n);
  if (method !== "deploy") {
    assert.equal(tx.to_address.toLowerCase(), s.address);
    const data =
      typeof tx.data.calldata === "string"
        ? tx.data.calldata
        : tx.data.calldata.base64;
    const decoded = abi.calldata.decode(
      Uint8Array.from(Buffer.from(data, "base64")),
    );
    assert.equal(decoded.get("method"), method);
    assert.equal(canonical(decoded.get("args") || []), canonical(args));
  }
  if (guard) {
    assert.equal(leader(tx)?.execution_result, "ERROR");
    t.after = await read(tag);
    assert.equal(canonical(t.before), canonical(t.after));
  } else assert(succeeded(tx), "Execution/consensus failed: " + label);
  if (method === "deploy") {
    s.address = tx.data.contract_address.toLowerCase();
    save();
    assert.equal(await client.getContractCode(s.address), source);
    assert.equal(
      await client.readContract({
        address: s.address,
        functionName: "get_protocol",
        args: [],
        transactionHashVariant: "latest-final",
      }),
      "choicekeep-1",
    );
    const d = {
      chainId: 61999,
      rpc: "https://studio.genlayer.com/api",
      address: s.address,
      owner: s.owner,
      protocol: "choicekeep-1",
      sourceSha256: s.sourceSha256,
      deploymentTransaction: t.hash,
      examples: ["early-fork", "preserved"],
    };
    fs.writeFileSync("public/deployment.json", j(d));
    fs.writeFileSync("evidence/deployment.json", j(d));
  }
  t.done = true;
  save();
  console.log(
    label,
    guard ? "FINALIZED ERROR / unchanged" : "FINALIZED SUCCESS",
  );
}
if (!s.schema) {
  s.schema = await client.getContractSchemaForCode(source);
  save();
  console.log("Studio schema compiled");
}
await transaction("deploy", "deploy");
for (const [tag, want] of [
  ["early-fork", "DISTINGUISHABLE"],
  ["preserved", "EQUIVALENT"],
]) {
  await transaction(tag + "-register", "register", [
    tag,
    JSON.stringify(JSON.parse(fs.readFileSync("examples/" + tag + ".json"))),
  ]);
  await transaction(tag + "-compare", "compare", [s.owner, tag]);
  const r = await read(tag);
  checkProof(r);
  assert.equal(r.state, want);
  s.records[tag] = r;
  save();
}
await transaction(
  "reject-non-equivalent",
  "adopt",
  ["early-fork", s.records["early-fork"].certificate],
  "NOT_EQUIVALENT",
  "early-fork",
);
await transaction(
  "reject-stale-certificate",
  "adopt",
  ["preserved", "0".repeat(64)],
  "STALE_CERTIFICATE",
  "preserved",
);
await transaction("adopt-preserved", "adopt", [
  "preserved",
  s.records.preserved.certificate,
]);
s.records.preserved = await read("preserved");
assert.equal(s.records.preserved.state, "ADOPTED");
const independent = createClient({ chain: studionet });
s.independentReadback = [];
for (const tag of ["early-fork", "preserved"]) {
  const r = await read(tag, independent);
  assert.equal(canonical(r), canonical(s.records[tag]));
  s.independentReadback.push(r);
}
s.complete = true;
save();
const receipts = Object.fromEntries(
  Object.entries(s.steps).map(([k, v]) => [k, v.receipt]),
);
fs.writeFileSync("evidence/receipts.json.gz", gzipSync(j(receipts)));
const { key, ...pub } = s;
pub.steps = Object.fromEntries(
  Object.entries(s.steps).map(([k, v]) => {
    const { receipt, ...rest } = v;
    return [
      k,
      {
        ...rest,
        receipt: {
          hash: receipt.hash,
          status: receipt.status,
          result: receipt.result,
          execution: leader(receipt)?.execution_result,
          votes: receipt.consensus_data?.votes,
          validatorCount: receipt.consensus_data?.validators?.length,
        },
      },
    ];
  }),
);
fs.writeFileSync(
  "evidence/live.json",
  j({
    ...pub,
    network: { chainId: 61999, rpc: "https://studio.genlayer.com/api" },
    fixture:
      "Synthetic declared workflows; one operator-controlled disposable SDK account. Zero-value transactions; zero gas price checked before each send. Complete SDK receipts archived separately.",
  }),
);
console.log("COMPLETE", s.address);
