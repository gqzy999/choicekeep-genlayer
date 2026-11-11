# Mechanism

## What the certificate establishes

For finite labelled transition systems L and R, start with every pair whose declared observations match. Remove a pair whenever a move on either side has no same-action reply into the current relation. Remove all such pairs simultaneously; repeat until stable. The initial pair (0,0) surviving establishes observation-preserving strong bisimulation of the accepted models.

Each removal records its round, attacking side, action, target and **every** possible defending successor pair. A negative certificate is a ranked counterstrategy: every responding pair was excluded in an earlier round. No reply is also a valid failure. The browser recomputes the complete relation and all canonical removal witnesses rather than trusting a verdict string.

## Consensus boundary

Input supplies title, context, shared action names and two machines. Each state has a name, exact observation label and natural-language rule. Rules are treated as untrusted data. The prompt requests all successors for every state/action; it explicitly distinguishes alternative destinations from sequential execution. Missing, ambiguous, contradictory or out-of-universe behavior is UNKNOWN, never an invented default. Explicit disabled actions have empty successor lists; a no-op is a self-loop.

Leader output and each validator's independent compilation are structurally checked. Each row requires a 6–500 character verbatim substring of its own rule and an 8–400 character reason. The substantive equivalence check compares the complete row-kind and successor vector across all states and actions. Different explanations are permitted, different transitions are not. Invalid output or disagreement aborts the call. Any accepted UNKNOWN row produces REVIEW, with no adoption path. Numeric indices are strings in nondeterministic results.

Quoting a rule is evidence anchoring, not proof that its interpretation is correct. Exact-vector agreement still depends on model behavior and input completeness.

## State and authority

Cases are keyed by normalized sender address plus tag. Registration is immutable. `REGISTERED → EQUIVALENT | DISTINGUISHABLE | REVIEW`; only `EQUIVALENT → ADOPTED`. Comparison can be triggered by anyone. Adoption resolves the sender's own namespace and requires the exact stored certificate. No deadline, token transfer or appeal is implemented.

The certificate is SHA-256 over canonical compact UTF-8 JSON of protocol, input hash, accepted kind/move signature and proof. Source SHA-256 is separately checked against on-chain code. Hashing binds an interpretation; it does not certify an external system.

## Guards

Malformed input, duplicate tags, missing records, repeated comparison, non-equivalent adoption and stale certificates raise user errors before committed mutation. Contract exceptions revert the transaction. The integration evidence proves selected guards by finalized ERROR receipts plus unchanged full records; receipt APIs do not reliably expose the original error text.

## Client behavior

Reads use latest-final. RPC calls are spaced at least 2.1 seconds apart and retry read-only HTML/rate-limit failures. Writes are never automatically resent. Pending hashes persist in browser local storage and can be tracked again. Completion requires FINALIZED, majority agreement and leader execution SUCCESS; an idle validator is not an agreeing vote. Source/protocol mismatches block sending. Gas price must remain zero and transaction value is zero.

Injected wallets are discovered through EIP-6963 with a generic EIP-1193 fallback. The optional browser evaluation account is explicitly a local signer, not a wallet confirmation. Its key is memory-only; saving an owner address permits reads but does not restore signing authority.
