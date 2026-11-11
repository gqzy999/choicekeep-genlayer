# ChoiceKeep — preserve future choices when replacing a workflow

Primary category: Developer tools

## Summary

Compare workflow replacements using consensus-compiled transition models and an auditable bisimulation certificate.

## Description

ChoiceKeep detects when a replacement reaches the same endings but loses choices along the way. GenLayer independently compiles declared workflow rules into complete transition tables; validators must agree on every transition. Deterministic contract code computes observation-preserving strong bisimulation and records a ranked counterstrategy when choices differ. The app replays relation-elimination rounds, verifies source and certificate hashes, and supports wallet or explicitly labelled temporary-account interactions. Stable Studionet evidence covers negative and positive comparisons, exact-certificate adoption, and two rejected adoptions with unchanged state. Eight finalized transactions and two independent final-record reads are archived.

## Review steps

1. Open the app and inspect the authored premature-fork illustration.
2. Click Read verified chain example. Confirm DISTINGUISHABLE, round 2, and both failed defending replies.
3. Inspect VALIDATION.md and the receipt and finalized record in evidence/.
4. Select the preserved example and click Read verified chain example. Confirm ADOPTED and its surviving relation. The unspecified-action example remains a separately labelled local fixture.

## Links

- App: https://gqzy999.github.io/choicekeep-genlayer/
- Repository: https://github.com/gqzy999/choicekeep-genlayer
- Contract: https://explorer-studio.genlayer.com/address/0x86181ced681f7832b0475780a96493e389c84cf5
- Validation: https://github.com/gqzy999/choicekeep-genlayer/blob/main/VALIDATION.md
