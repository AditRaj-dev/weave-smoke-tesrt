# F03 — DAG Scheduler and Parallel Workers

**Priority:** P0 · **Deps:** TASK-001/002

## Inputs
Task `id,phase,domain,dependencies,allowed_paths,read_paths,resources,contract_pins,verification,priority,max_attempts,provider_policy`; approved phase state, worker slot caps, current worktree leases.

## Behavior
Tasks progress through proposed→ready→assigned→running→handoff_submitted→reviewing→testing→integration_ready→integrated→done. DAG rejects cycles. Scheduler only assigns when deps accepted, contract pinned, phase approved and resources/slots free. For parallel coding tasks allocate isolated Git worktrees, never same directory, and conservative overlap leases. On agent output `done` with no report, state stays running/interrupted. On valid report, independent review and test tasks spawn with read-only evidence. Failed review sends exact findings to bounded fix loop (≤3), then root-cause/replan.

## Edge cases
Task cancellation while dependency waits; orphan session; stale `lease`; retry after process crash; changed contract invalidates planned tasks; priority inversion; status/version race. Start deterministic FIFO+priority scheduling; advanced optimizer P1.

## Acceptance
Conflict resource `package.json` serializes; independent FE/BE run concurrently; a cycle cannot persist; failed tests block integration; 2 workers+1 reviewer+1 tester cap enforced; session exit without report never advances.
