# ChoiceKeep

A workflow replacement desk that checks whether a new implementation preserves every future choice, rather than merely reaching the same endings.

[Open the app](https://gqzy999.github.io/choicekeep-genlayer/) · [Contract](https://explorer-studio.genlayer.com/address/0x86181ced681f7832b0475780a96493e389c84cf5) · [Mechanism](MECHANISM.md) · [Validation](VALIDATION.md)

## Use case

A review process is split into two lanes. One lane allows approval; the other permits returning to draft. The replacement still permits the same complete action sequences, yet it commits to a lane before the reviewer chooses the next action. ChoiceKeep exposes that loss of choice with an observation-preserving strong bisimulation check.

GenLayer is central: a leader and validators independently compile the declared natural-language rules into complete finite transition tables. Their entire transition vectors must agree. Deterministic contract code computes the greatest fixed point, stores an auditable elimination certificate, and allows the owner to adopt only an equivalent replacement with the exact certificate.

## Try it

1. Replay the authored illustration. Its label explicitly distinguishes it from chain evidence.
2. Select **Read verified chain example** to fetch the finalized record. The browser independently checks input hash, relation proof and certificate; source and protocol are checked against the deployment metadata.
3. For your own comparison, connect an injected wallet or use the explicitly labelled browser temporary evaluation account. The latter signs real transactions with an in-memory key; reloading loses signing control.
4. Edit the finite workflow JSON, choose a fresh case ID, register, compare, and adopt only if equivalent. Save transaction hashes and export the record.

All rules are public. Do not submit confidential operational data. Owners retain case authority; anyone may pay the computational cost of comparing a registered case. Adoption records a declaration, not execution of an external migration.

## Run locally

```sh
npm ci
npm run dev
```

```sh
python -m unittest discover -s contract-tests
npm test
npm run build
npm run check:evidence
```

Python tests mock the GenLayer host and model. JavaScript tests check the independent proof implementation. Neither is real consensus evidence. `npm run live` is a checkpointed integration harness that sends real Studio transactions; it refuses to repeat a completed run and retains hashes before polling. Keep `.private/` private. A send with an uncertain outcome must be investigated before any new submission.

## Deployment

Stable Studionet only: chain **61999**, RPC `https://studio.genlayer.com/api`, protocol **choicekeep-1**. Source SHA-256: `6ca74f6179d85077257f1cbec8bbcb3f52ac5b6970b42c645322b9cb9e7b0347`. Metadata and transaction records are in [evidence](evidence/).

## Verified flows

Stable Studionet records cover a negative comparison, a positive comparison followed by adoption, and two rejected adoptions with unchanged complete records. Eight unique finalized transactions contain six SUCCESS executions and two expected ERROR executions. A second client independently read back both final cases. See [validation](VALIDATION.md) for exact receipts, vote counts and scope.

## Scope and limitations

Two to four states per side; one to three shared actions; at most 16 state pairs. First listed states are initial. Observations are exact declared labels, not independently discovered facts. Multiple destinations denote nondeterministic alternatives. No silent actions, clocks, probabilities, fairness or runtime instrumentation. Strong bisimulation is an established formal method, not a new mathematical invention. Consensus reduces interpretation inconsistency; it does not establish the truth or completeness of supplied rules. UNKNOWN blocks adoption; validator disagreement aborts comparison. Physical wallet signing and behavior of external workflow systems are outside the recorded validation scope.

## License

MIT. Maintained by gqzy999. Built with GenLayer JS SDK, viem and Vite; the contract uses the pinned GenVM runner. Third-party dependencies retain their respective licenses.
