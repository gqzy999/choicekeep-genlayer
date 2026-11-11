export const canonical = (x) =>
  JSON.stringify(x, (_, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, v[k]]),
        )
      : v,
  );
export const signature = (a) =>
  a.rows.map(({ kind, moves }) => ({ kind, moves }));
export const escape = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function derive(p, accepted) {
  const rows = accepted.rows,
    unknown = rows.flatMap((r, i) => (r.kind === "UNKNOWN" ? [String(i)] : []));
  if (unknown.length)
    return {
      outcome: "REVIEW",
      unknown_rows: unknown,
      relation: [],
      rounds: [],
      root: ["0", "0"],
    };
  const left = p.left.states,
    right = p.right.states,
    nl = left.length,
    nr = right.length,
    pairs = left.flatMap((_, i) => right.map((_, j) => [i, j])),
    has = (rel, a, b) => rel.some(([x, y]) => a === x && b === y);
  let relation = pairs.filter(
    ([i, j]) => left[i].observation === right[j].observation,
  );
  const rounds = [
    {
      round: "0",
      removed: pairs
        .filter(([i, j]) => !has(relation, i, j))
        .map(([i, j]) => ({
          pair: [String(i), String(j)],
          why: "OBSERVATION",
        })),
      remaining: relation.map((x) => x.map(String)),
    },
  ];
  let rank = 1;
  for (;;) {
    const removed = [];
    for (const [i, j] of relation) {
      let witness = null;
      outer: for (const side of ["L", "R"])
        for (let action = 0; action < p.actions.length; action++) {
          const attacks = rows[side === "L" ? i : nl + j].moves[action],
            responses = rows[side === "L" ? nl + j : i].moves[action];
          for (const target of attacks) {
            const responsePairs = responses.map((r) =>
              side === "L"
                ? [Number(target), Number(r)]
                : [Number(r), Number(target)],
            );
            if (!responsePairs.some(([a, b]) => has(relation, a, b))) {
              witness = {
                pair: [String(i), String(j)],
                why: "UNMATCHED_MOVE",
                side,
                action: String(action),
                target,
                responses: responsePairs.map((x) => x.map(String)),
              };
              break outer;
            }
          }
        }
      if (witness) removed.push(witness);
    }
    if (!removed.length) break;
    relation = relation.filter(
      ([i, j]) =>
        !removed.some(
          (r) => r.pair[0] === String(i) && r.pair[1] === String(j),
        ),
    );
    rounds.push({
      round: String(rank++),
      removed,
      remaining: relation.map((x) => x.map(String)),
    });
  }
  return {
    outcome: has(relation, 0, 0) ? "EQUIVALENT" : "DISTINGUISHABLE",
    unknown_rows: [],
    relation: relation.map((x) => x.map(String)),
    rounds,
    root: ["0", "0"],
  };
}
export function checkProof(record) {
  if (
    record.proof &&
    canonical(derive(record.spec, record.accepted)) !== canonical(record.proof)
  )
    throw Error(
      "Stored relation or elimination proof does not match the accepted transitions.",
    );
}
export const fixtures = {
  preserved: [
    [["1"], []],
    [["2"], ["0"]],
    [[], []],
    [["1", "2"], []],
    [["3"], ["0"]],
    [["3"], ["0"]],
    [[], []],
  ],
  "early-fork": [
    [["1"], []],
    [["2"], ["0"]],
    [[], []],
    [["1", "2"], []],
    [["3"], []],
    [[], ["0"]],
    [[], []],
  ],
};
export function exampleRows(p, key) {
  const moves = fixtures[key] || fixtures["early-fork"];
  return {
    rows: moves.map((m, i) => ({
      kind: key === "unclear" && i === 5 ? "UNKNOWN" : "EXACT",
      moves: key === "unclear" && i === 5 ? [[], []] : m,
      quote: [...p.left.states, ...p.right.states][i].rule,
      reason: "Authored illustration only; not a model or chain result.",
    })),
  };
}
