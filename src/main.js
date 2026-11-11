import "./style.css";
import { escape as e, derive, exampleRows } from "./proof.js";
import * as chain from "./chain.js";
const examples = Object.fromEntries(
  await Promise.all(
    ["early-fork", "preserved", "unclear"].map(async (k) => [
      k,
      await fetch(`./examples/${k}.json`).then((r) => r.json()),
    ]),
  ),
);
let key = "early-fork",
  record = null,
  round = 0,
  pair = ["0", "0"],
  sourceOK = false,
  busy = false,
  lastHash = "";
document.querySelector("#app").innerHTML =
  `<header><a class="brand" href="./"><b>↔</b> ChoiceKeep</a><span>WORKFLOW COMPARISON DESK</span><a href="https://github.com/gqzy999/choicekeep-genlayer">Source ↗</a></header><main><section class="toolbar"><div><p class="eyebrow">CHOICES ARE PART OF THE CONTRACT</p><h1>Same ending.<br>Same choices along the way?</h1></div><div class="intro">A replacement can preserve every complete path and still take away your next move. Compare the choices available at every step.</div></section><section class="controls"><label>Comparison<select id="example"><option value="early-fork">Premature fork · choices lost</option><option value="preserved">Two review lanes · choices kept</option><option value="unclear">Unspecified action · review required</option></select></label><div><span id="mode" class="badge">AUTHORED ILLUSTRATION</span><p id="result"></p></div><button id="load">Read verified chain example ↗</button></section><div class="desk"><section class="machine" id="left"></section><section class="relation"><div class="panelhead"><span>THE RELATION</span><span id="count"></span></div><h2>Which states can still<br>stand in for each other?</h2><div id="matrix"></div><div class="replay"><label for="round">Elimination round <b id="roundlabel"></b></label><input type="range" id="round" min="0" value="0"><p>Each round removes pairs with an unmatched move. All possible replies must have failed in an earlier round.</p></div><div id="witness"></div></section><section class="machine" id="right"></section></div><section class="lower"><details open><summary>Declared workflow rules <span>edit before registering</span></summary><p>First state is initial. Observations are exact, declared labels. Describe every action explicitly; multiple successors mean alternatives, not a sequence.</p><textarea id="payload" spellcheck="false" aria-label="Workflow specification JSON"></textarea><button id="reset">Restore selected example</button></details><section class="chain"><p class="eyebrow">STABLE STUDIONET · 61999</p><h2>Make the comparison shared.</h2><p>Register immutable rules, request consensus, then adopt only a choice-preserving replacement. Zero-value transactions; the page checks zero gas price before sending.</p><div class="wallet"><select id="wallet" aria-label="Available injected wallet"></select><button id="connect">Connect wallet</button><button id="temporary">Browser temporary evaluation account</button></div><p id="account">Temporary accounts sign real transactions. Keys stay in this tab's memory and disappear on reload; use a wallet to retain adoption control.</p><label>Record owner<input id="owner" value="${chain.deployment.owner}"></label><label>Case ID<input id="tag" value="early-fork" maxlength="40"></label><div class="actions"><button id="register">1 Register rules</button><button id="compare">2 Compare</button><button id="adopt">3 Adopt</button><button id="read">Read record</button></div><p id="trust">Checking deployed source and protocol…</p><p id="notice" role="status" aria-live="polite"></p><a id="tx" hidden target="_blank" rel="noreferrer">Open transaction ↗</a><div class="actions"><button id="resume">Resume saved transaction</button><button id="export">Export displayed record</button></div><a target="_blank" rel="noreferrer" href="${chain.explorer}/address/${chain.deployment.address}">Deployed contract ↗</a></section></section><footer><b>Bounded proof, declared model.</b> Strong bisimulation for 2–4 states per side and 1–3 shared actions. No timing, hidden steps, fairness or external-system verification. Consensus can agree on an incorrect interpretation. <a href="https://github.com/gqzy999/choicekeep-genlayer/blob/main/MECHANISM.md">Read the mechanism ↗</a></footer></main>`;
const $ = (s) => document.querySelector(s),
  payload = () => JSON.parse($("#payload").value),
  status = (s, h) => {
    $("#notice").textContent = s;
    if (h) {
      lastHash = h;
      $("#tx").hidden = false;
      $("#tx").href = chain.explorer + "/tx/" + h;
      $("#tx").textContent = "Transaction " + h.slice(0, 12) + "… ↗";
    }
  };
function view() {
  const p = record?.spec || examples[key],
    a = record?.accepted || exampleRows(p, key),
    proof = record?.proof || derive(p, a);
  $("#mode").textContent = record
    ? "VERIFIED FINALIZED RECORD"
    : "AUTHORED ILLUSTRATION · NO CHAIN RESULT";
  $("#result").textContent = (record?.state || proof.outcome).replaceAll(
    "_",
    " ",
  );
  for (const [side, offset] of [
    ["left", 0],
    ["right", p.left.states.length],
  ]) {
    $("#" + side).innerHTML =
      `<div class="panelhead">${side === "left" ? "REFERENCE" : "REPLACEMENT"}<span>${p[side].states.length} states</span></div><h2>${e(p[side].name)}</h2>` +
      p[side].states
        .map(
          (s, i) =>
            `<article><div class="node"><b>${i === 0 ? "↪ " : ""}${e(s.name)}</b><small>${e(s.observation)}</small></div><div class="edges">${a.rows[offset + i].kind === "UNKNOWN" ? "<em>Behavior unspecified</em>" : p.actions.map((action, j) => `<p><span>${e(action)}</span> → ${a.rows[offset + i].moves[j].map((t) => e(p[side].states[Number(t)].name)).join(" / ") || "<i>disabled</i>"}</p>`).join("")}</div></article>`,
        )
        .join("");
  }
  round = Math.min(round, Math.max(0, proof.rounds.length - 1));
  $("#round").max = Math.max(0, proof.rounds.length - 1);
  $("#round").value = round;
  $("#roundlabel").textContent = round;
  const rel = proof.rounds[round]?.remaining || [];
  $("#count").textContent = rel.length + " pairs remain";
  $("#matrix").innerHTML =
    `<table><caption>Reference rows · replacement columns</caption><thead><tr><th></th>${p.right.states.map((s) => `<th>${e(s.name)}</th>`).join("")}</tr></thead><tbody>${p.left.states
      .map(
        (s, i) =>
          `<tr><th>${e(s.name)}</th>${p.right.states
            .map((_, j) => {
              const kept = rel.some(
                (x) => x[0] === String(i) && x[1] === String(j),
              );
              return `<td><button class="cell ${kept ? "kept" : "removed"} ${pair[0] === String(i) && pair[1] === String(j) ? "selected" : ""}" data-pair="${i},${j}" aria-label="Pair ${e(s.name)} and ${e(p.right.states[j].name)}">${kept ? "●" : "×"}</button></td>`;
            })
            .join("")}</tr>`,
      )
      .join("")}</tbody></table>`;
  const removal = proof.rounds
    .slice(0, round + 1)
    .flatMap((r) => r.removed.map((w) => ({ ...w, round: r.round })))
    .find((w) => w.pair.join() === pair.join());
  $("#witness").innerHTML =
    proof.outcome === "REVIEW"
      ? "<h3>Pause for clarification</h3><p>At least one action is not completely specified. No adoption certificate is allowed.</p>"
      : !removal
        ? "<h3>This pair survives so far.</h3><p>This pair has not been removed through this round. Later rounds may still expose a mismatch.</p>"
        : removal.why === "OBSERVATION"
          ? "<h3>Different visible observations.</h3><p>These states cannot stand in for one another, even before checking moves.</p>"
          : `<h3>Unmatched ${e(p.actions[+removal.action])} · round ${removal.round}</h3><p>${removal.side === "L" ? "Reference" : "Replacement"} can move to <b>${e(p[removal.side === "L" ? "left" : "right"].states[+removal.target].name)}</b>.</p><p>${removal.responses.length ? "Every possible matching reply leads to an already removed pair: " + removal.responses.map((x) => `(${e(p.left.states[+x[0]].name)}, ${e(p.right.states[+x[1]].name)})`).join("; ") : "The other workflow has no reply for this action."}</p>`;
  document.querySelectorAll("[data-pair]").forEach(
    (b) =>
      (b.onclick = () => {
        pair = b.dataset.pair.split(",");
        view();
      }),
  );
  $("#adopt").disabled =
    busy || record?.state !== "EQUIVALENT" || chain.account !== record?.owner;
}
function reset() {
  record = null;
  round = 2;
  pair = ["0", "0"];
  $("#payload").value = JSON.stringify(examples[key], null, 2);
  $("#tag").value = key;
  view();
}
$("#example").onchange = () => {
  key = $("#example").value;
  reset();
};
$("#reset").onclick = reset;
$("#round").oninput = (ev) => {
  round = +ev.target.value;
  view();
};
async function run(fn) {
  if (busy) return;
  busy = true;
  document
    .querySelectorAll(".actions button,#load,#temporary,#connect,#example")
    .forEach((b) => (b.disabled = true));
  try {
    await fn();
  } catch (err) {
    status(err.message);
  } finally {
    busy = false;
    document
      .querySelectorAll(".actions button,#load,#temporary,#connect,#example")
      .forEach((b) => (b.disabled = false));
    view();
  }
}
async function load() {
  record = await chain.read($("#owner").value, $("#tag").value);
  round = record.proof?.rounds.length - 1 || 0;
  $("#payload").value = JSON.stringify(record.spec, null, 2);
  status(
    "Finalized record read. Input hash, complete relation proof and certificate independently checked.",
  );
  view();
}
$("#load").onclick = () =>
  run(async () => {
    if (key === "unclear")
      throw Error(
        "This illustration has no recorded chain run. Select one of the other examples.",
      );
    $("#owner").value = chain.deployment.owner;
    $("#tag").value = key;
    await load();
  });
$("#read").onclick = () => run(load);
$("#connect").onclick = () =>
  run(async () => {
    $("#owner").value = await chain.connect(+$("#wallet").value);
    $("#account").textContent = "Wallet account: " + chain.account;
  });
$("#temporary").onclick = () => {
  $("#owner").value = chain.temporary();
  $("#account").textContent =
    "Temporary evaluation account · real transactions · memory only: " +
    chain.account;
  status(
    "Save your record owner address to read records later. Reloading loses signing control.",
  );
  view();
};
for (const method of ["register", "compare", "adopt"])
  $("#" + method).onclick = () =>
    run(async () => {
      if (!sourceOK)
        throw Error(
          "Source verification is not complete. Wait or reload before writing.",
        );
      if (localStorage.getItem("choicekeep-pending"))
        throw Error(
          "A transaction is already saved. Resume tracking it before sending another.",
        );
      const tag = $("#tag").value,
        owner = $("#owner").value;
      const args =
        method === "register"
          ? [tag, JSON.stringify(payload())]
          : method === "compare"
            ? [owner, tag]
            : [tag, record?.certificate || ""];
      await chain.write(method, args, status);
      if (method === "register") $("#owner").value = chain.account;
      await load();
    });
$("#resume").onclick = () =>
  run(async () => {
    const h = localStorage.getItem("choicekeep-pending");
    if (!h) throw Error("No saved transaction.");
    status("Resuming saved hash", h);
    await chain.track(h, status);
    await load();
  });
$("#export").onclick = () => {
  if (!record) {
    status("Read a finalized record before exporting.");
    return;
  }
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(record, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "choicekeep-" + record.tag + ".json";
  a.click();
  URL.revokeObjectURL(url);
};
function walletList() {
  $("#wallet").innerHTML =
    chain
      .wallets()
      .map((w, i) => `<option value="${i}">${e(w.info.name)}</option>`)
      .join("") || "<option>No injected wallet detected</option>";
}
walletList();
setTimeout(walletList, 1200);
reset();
try {
  await chain.verifySource();
  sourceOK = true;
  $("#trust").textContent =
    "✓ Deployed source SHA-256 matches · protocol choicekeep-1 · chain 61999";
} catch (err) {
  $("#trust").textContent = "Verification stopped: " + err.message;
}
