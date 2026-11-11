# Validation

## Local deterministic and host-mocked checks

Nine Python contract tests passed using a mocked GenLayer host/model. Five JavaScript tests passed for the independent fixed-point implementation, including equivalent state splitting, premature commitment, earlier-round witness dependencies, UNKNOWN handling and observation mismatch propagation. These tests do not prove real model agreement. GenVM lint and semantic validation passed; the pinned runner has a newer available version (informational warning retained in `evidence/lint.json`). Production Vite build passed.

## Actual Stable Studionet evidence

Chain 61999; zero transaction value; zero gas price verified before the recorded SDK sends. Full-consensus requests use `leaderOnly: false`.

| Operation | Transaction | Recorded outcome |
| --- | --- | --- |
| Deploy | `0x8b729e0dad52b0ba543bc093e16213e2708fc601293ae97caccb380578269347` | FINALIZED / SUCCESS |
| Register early fork | `0xae2f16d934e5b994165b840a78d60463144819b2acfe191ef9fa44ae57ecb76f` | FINALIZED / SUCCESS |
| Compare early fork | `0xc519afcc6003cfd6f7b1248bf9efa01a9c4da5e7ba82546f4e079477b8bcab5a` | FINALIZED / SUCCESS / MAJORITY_AGREE |

The comparison receipt has three AGREE and two IDLE votes. This is majority consensus, not unanimity. The on-chain result is DISTINGUISHABLE: the initial pair is eliminated in round 2; both possible replies lead to pairs removed in round 1. The complete accepted transition vector matches the declared example expectation.

`evidence/compare-observed.json` preserves the actual comparison receipt; `evidence/early-fork-observed.json` is a separate latest-final SDK read. Source and protocol were read from the deployed contract and matched the repository hash and `choicekeep-1`. `npm run check:evidence` verifies source, input hash, full transition vector, proof, certificate, receipt signer/target, zero value and majority without making further transactions.

## Boundaries

The preserved example and UNKNOWN example are authored local fixtures. The recorded chain evidence covers the negative comparison only; it does not establish the positive adoption flow or on-chain guard rejection behavior. Physical injected-wallet signing is not included in this evidence. Browser source/protocol verification and proof replay are separate from SDK write execution. No claim is made about real-world workflow conformance, model accuracy on arbitrary inputs, testnet uptime or a production deployment.
