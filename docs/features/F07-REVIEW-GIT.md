# F07 — Independent Verification and Brokered Git

**Priority:** P0 · **Deps:** REV-001, TEST-001, GIT-001/002

## Behavior
Task report submits exact changed files+evidence. Reviewer (different agent/session) checks diff, feature spec, API registry/contract and security; returns PASS/FAIL findings with file:line and matching diff hash. Tester independently runs commands and records fresh output, exit code, environment and hash. Broker checks scope, hashes, verdicts, leases and approval, then creates per-task commit and integrates sequentially. Post-integration test regression aborts/rolls back integration via recorded safe strategy, preserving worktree/evidence. Finish offers merge/PR/keep/discard; destructive requires typed confirmation.

## Security limitation
Worker shell may still mutate Git without OS sandbox; log `cooperative` until prevention is proven. Attempted violation must be surfaced, not hidden. Broker authorization is not equivalent to universal filesystem protection.

## Acceptance
Different reviewer required; FAIL prevents integration; stale test evidence rejected; conflict leaves source intact; no remote push without owner confirmation; journal recovers after crash.
