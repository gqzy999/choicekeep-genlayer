# Validation

## Local deterministic and host-mocked checks

Nine Python contract tests passed using a mocked GenLayer host/model. Five JavaScript tests passed for the independent fixed-point implementation, including equivalent state splitting, premature commitment, earlier-round witness dependencies, UNKNOWN handling and observation mismatch propagation. These tests do not prove real model agreement. GenVM lint and semantic validation passed; the pinned runner has a newer available version (informational warning retained in `evidence/lint.json`). Production Vite build passed.

## Actual Stable Studionet evidence

Chain 61999; zero transaction value and zero gas price verified before the recorded SDK sends. Full-consensus requests use `leaderOnly: false`. Eight unique transactions: six successful executions and two expected guard errors. No appeal was made.

| Operation | Transaction | Recorded outcome | Validator votes |
| --- | --- | --- | --- |
| Deploy | [0x8b729e0dad…](https://explorer-studio.genlayer.com/tx/0x8b729e0dad52b0ba543bc093e16213e2708fc601293ae97caccb380578269347) | FINALIZED / SUCCESS | 4 agree / 1 idle |
| Register early fork | [0xae2f16d934…](https://explorer-studio.genlayer.com/tx/0xae2f16d934e5b994165b840a78d60463144819b2acfe191ef9fa44ae57ecb76f) | FINALIZED / SUCCESS | 3 agree / 2 idle |
| Compare early fork | [0xc519afcc60…](https://explorer-studio.genlayer.com/tx/0xc519afcc6003cfd6f7b1248bf9efa01a9c4da5e7ba82546f4e079477b8bcab5a) | FINALIZED / SUCCESS | 3 agree / 2 idle |
| Register preserved choices | [0x54c94bba41…](https://explorer-studio.genlayer.com/tx/0x54c94bba41c92510331f138e16eb65a9cfb663da582051cccd86775f4ec5c02f) | FINALIZED / SUCCESS | 4 agree / 1 idle |
| Compare preserved choices | [0x727f85d993…](https://explorer-studio.genlayer.com/tx/0x727f85d99301aa0353d05b0cd92a18c7ed67e4196a221c37d6fe11d23c8d0e9b) | FINALIZED / SUCCESS | 3 agree / 2 idle |
| Reject non-equivalent adoption | [0x135514777e…](https://explorer-studio.genlayer.com/tx/0x135514777ef8f3f0750e823aa71accb7c0e5213d6826248cfcd7142c3ab7d541) | FINALIZED / ERROR | 3 agree / 2 idle |
| Reject stale certificate | [0xa6715190a4…](https://explorer-studio.genlayer.com/tx/0xa6715190a49338f3f9405b59d5958fe87e8f248a8736817646d11fd3266e08a9) | FINALIZED / ERROR | 3 agree / 2 idle |
| Adopt preserved choices | [0xf3eb8f0e0e…](https://explorer-studio.genlayer.com/tx/0xf3eb8f0e0e47c01ea8677c7e11d53352cdfb3778c9750979e14e4de69346bd62) | FINALIZED / SUCCESS | 5 agree / 0 idle |

These receipts show majority agreement, not unanimity. IDLE is not an agreeing vote. ERROR in the two guard cases is the intended rejection, not a successful adoption. The receipt API does not expose reliable guard error strings; guard names identify the exercised source precondition, corroborated by decoded method/arguments, valid starting records, finalized ERROR, and equality of the complete before/after record.

### Choices lost

`early-fork` ends DISTINGUISHABLE. The initial pair is removed in round 2; both possible replies lead to pairs removed in round 1. Its complete accepted transition vector matches the declared expectation. Attempting adoption preserves the entire record unchanged.

### Choices preserved and adopted

`preserved` compares EQUIVALENT despite having four replacement states against three reference states. Its fixed-point relation is `(0,0), (1,1), (1,2), (2,3)`. Submitting an incorrect certificate leaves the complete EQUIVALENT record unchanged. Submitting the exact certificate ends ADOPTED; the adoption binds the owner, certificate, reference name and replacement name.

### Independent readback and offline reproduction

A second unauthenticated SDK client reads both records using latest-final. Both full records equal their captured final snapshots: one DISTINGUISHABLE and one ADOPTED. This is a separate client against the same Studio RPC, not an independent infrastructure provider.

Source and protocol were read from the deployed contract and matched the repository SHA-256 and `choicekeep-1`. The deployed contract source is byte-for-byte unchanged throughout these flows.

- `evidence/live.json`: arguments, preflight checks, receipt summaries, guard snapshots, final records and two independent readbacks.
- `evidence/receipts.json.gz`: full original SDK receipts for all eight transactions, including both errors.
- `evidence/flow.json`: compact transaction index, final states and archive checksum.
- `evidence/compare-observed.json` and `evidence/early-fork-observed.json`: the earlier separate negative receipt and finalized read, preserved unchanged.

Run `npm run check:evidence` to verify source, input hashes, full expected transition vectors, every proof and certificate, unique receipts, signer/target, decoded calldata, zero value, zero gas-price preflight, both unchanged guard snapshots, adoption fields and independent readback equality. This check makes no chain transactions.

## Boundaries

The unspecified-action UNKNOWN example has local fixture coverage only. The two documented adoption guards have real chain coverage; other input/authority guards have local coverage. Physical injected-wallet signing and a completed browser temporary-account write are outside this recorded evidence; the eight writes use the SDK test signer. Browser source/protocol verification and proof replay are separate from SDK write execution. These are synthetic declared workflow specifications, not observations of an external running system. No claim is made about model accuracy on arbitrary inputs, testnet uptime or a mainnet deployment.
