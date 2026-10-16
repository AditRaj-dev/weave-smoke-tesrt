# M2 — Contracts, verification, and Git authority: proposed parallel packets

**Status:** proposed planning aid, not approved task packets or implementation evidence. **Packet owner:** coordinator. **Source IDs:** `workflow/tasks.yaml` M2; `docs/IMPLEMENTATION_PLAN.md` M2; PRD FR-10–12 and AC-04–06, AC-09–10; F06, F07; `docs/GIT_SECURITY.md`; `docs/TEST_PLAN.md`; `docs/PROTOCOLS.md`; TaskPacket/TaskReport/ReviewVerdict/TestVerdict schema v1. `docs/API_RECORD.md` still marks external APIs **TO VERIFY**. The actual implementation checkout, installed versions, exact commands, frozen contract hashes, and approved phase are prerequisites to dispatch, not facts established by this pack.

## Coordinator dispatch rules

For every packet, instantiate TaskPacket v1 with project/run/session IDs, `packet_version`, approved `phase_id`, unique broker-created worktree and CWD, read/write scopes, exclusive resources, dependencies, approved contract IDs/versions/SHA-256, acceptance criteria, verified commands, report destination, tool permissions, timestamp, and `isolation_mode: cooperative` until prevention is demonstrated. Freeze the packet per session. Check approved phase, dependency success, contract pins, path overlap and leases transactionally. Default concurrency is two writers, one reviewer, one tester; each writable packet gets a distinct worktree. Read-only review/test sessions use snapshots and never patch the implementation they assess. No worker creates a branch, commits, merges, resets, pushes, or edits `.git`; only the Git broker performs those mutations. A worker's shell is not OS-contained by these instructions.

Every coding worker submits TaskReport v1 through the planned `weave task report` interface when implemented; its submission transport and flags must be verified against the implementation before dispatch. The daemon validates JSON, exact changed paths, pins, session, and evidence; acceptance of the report means `handoff_submitted`, not `done`. A separate reviewer submits ReviewVerdict v1 against the current diff SHA-256; a separate tester submits TestVerdict v1 against the same current diff. Capture each command's actual text, platform, start/end timestamps, exit code, stdout/stderr artifact paths and SHA-256, revision and environment/fixture identity. Store redacted output and hashes; do not infer PASS from terminal prose. `PASS` must fail closed on stale hashes, missing artifacts, nonzero required commands or wrong session. After each implementation fix, invalidate old verdicts and rerun review and testing. Broker records a `planned` audit entry before side effects and reconciles it on restart.

**Command gate:** The coordinator must inspect the implementation checkout's manifests, installed tool help/types, and official documentation, then put exact executable verification commands into each TaskPacket. No command or dependency signature in this planning document is asserted verified. Update `docs/API_RECORD.md` only through an approved documentation scope change with version/signature/evidence; this document does not authorize editing it. Run fixture Git operations only in broker-owned temporary repositories.

## Parallel waves and exclusive resources

| Wave | Ready after | Concurrent sessions / bounded resources | Exit gate |
|---|---|---|---|
| 0 | M0/M1 prerequisites accepted, phase approved | Coordinator freezes scope and pins; no writer dispatched yet | Ready packets, nonoverlapping write scopes and broker worktrees |
| 1 | `INF-002` / `TASK-001` / `TASK-002` as applicable | `CON-001` (`schema:contracts`) and `GIT-001` (`git:broker`) as the two writers; `TEST-001` (`test:runner`) can build independently, subject to actual worker capacity | Separate reports, independent review/test evidence for each |
| 2 | `TASK-002` and accepted `GIT-001` | `REV-001` (`review:verdicts`) while `TEST-001` continues if unfinished; reviewer actor for these packets must be distinct from their implementers | Review logic and test runner accepted independently |
| 3 | `GIT-001`, `REV-001`, `TEST-001`, `CON-001` accepted | `GIT-002` (`git:integration`) alone writes `crates/weave-git/**`; it follows `GIT-001`, which has the same path | Ordered integration, regression gate, crash recovery, owner finish gate |
| 4 | `PTY-002`, `MIG-001`, `GIT-002` accepted | `E2E-001` (`qa:vertical`), writing only `tests/**`; independent acceptance runner | AC-01–10 evidence ledger, each PASS/FAIL/UNTESTED/DEFERRED with reason and proof |

The wave table shows possible overlap, not permission to exceed the configured worker pool. `GIT-001` and `GIT-002` serialize by dependency and overlapping write path even though their named exclusive resources differ. M3 work starts only after the M2 exit gate and approved plan.

## Disjoint proposed coding packets

| Packet | Dependency gate; exact proposed write scope; lease | Deliverable, positive and negative acceptance |
|---|---|---|
| **CON-001** | `INF-002`; `crates/weave-contract/**`, `packages/contracts/**`; `schema:contracts` | Implement the approved contract registry, validation and generated Rust/TS binding boundary from versioned schemas. FE and BE consume the same approved AUTH-v1 hash; typed mock and backend fixture agree. An invented `/api/login-v2` fails the contract gate; in-flight schema revision yields `CONTRACT_DRIFT` and blocks integration. No schema is declared approved by this packet itself. Verify deterministic regeneration and mismatched version rejection with commands chosen at dispatch. |
| **GIT-001** | `TASK-001`; `crates/weave-git/**`; `git:broker` | Broker provisions one worktree per writable task, audits changed paths and `.git` indirection, records planned operations before side effects, and exposes scoped diff hashes to review/test. Test out-of-scope edits, unauthorized metadata/ref change, duplicate request and interrupted audit reconciliation in a temporary fixture repository. Classify worker Git attempts as `prevented`, `detected`, or `not mitigated` with evidence; keep `cooperative` unless OS prevention is actually proven. No worker owns Git mutations. |
| **REV-001** | `TASK-002`, accepted `GIT-001`; `crates/weave-core/src/review/**`; `review:verdicts` | Validate ReviewVerdict v1, contract pins, diff SHA-256, independent reviewer session and file:line findings; FAIL blocks integration. Same implementer/reviewer session, stale diff, missing contract or invalid schema are rejected. At most three review-fix cycles; fourth escalates for diagnosis/replan. The reviewer running this packet's acceptance must be another session and may not patch its implementation. |
| **TEST-001** | `TASK-002`; `crates/weave-core/src/test/**`; `test:runner` | Run required verification commands in an independent test session; persist actual command, exit code, timestamps, stdout/stderr and hashes, platform, revision and environment/fixture identity, then validate TestVerdict v1. Nonzero command, missing output, stale diff, corrupt artifact, absent command, `INCONCLUSIVE`, or missing fresh evidence cannot produce integration PASS. The tester does not patch failed implementation. |
| **GIT-002** | Accepted `GIT-001`, `REV-001`, `TEST-001`, `CON-001`; `crates/weave-git/**`; `git:integration` | Broker checks task state, scope, lease, current pins and matching fresh reviewer/tester PASS, then creates scoped per-task commits and integrates FE and BE sequentially. Post-integration checks run on the integration revision. Conflict or regression aborts safely, keeps source worktree/evidence, emits blocker and reconciles audit on restart. Push, merge into main, destructive reset and discard require owner confirmation; forced test failure, stale hash, duplicate request or unauthorized remote action must not integrate. |
| **E2E-001** | Accepted `PTY-002`, `MIG-001`, `GIT-002`; `tests/**`; `qa:vertical` | Exercise actual vertical flow: separate FE/BE workers pinned to approved auth contract, independent review/test, broker integration, PTY/session reconnect, daemon crash state, workflow gate denial, report missing evidence, memory conflict, importer rerun, and Git restriction classification. Produce AC-01–10 worksheet with command/time/exit/artifact/revision/platform proof. Real Windows ConPTY outcomes require a Windows run; mark unavailable coverage UNTESTED or DEFERRED with cause, never PASS. Deliberate contract mismatch and failing tests must block acceptance. |

All six proposed packets retain `review_required: true`, `evidence_required: true`, `max_attempts: 3` from `workflow/tasks.yaml`. Their reviewers/testers are separate verification actors; packet implementation is never self-approved. The `write_paths` above are exact planned implementation scopes from the workflow, not additional authorization to edit this documentation pack.

## Decision request before vertical acceptance

`TASK-002` is an M1 "packet dispatcher and worktrees" task that depends on `TASK-001`, `PROV-001`, and `MEM-002`; `GIT-001` is the M2 broker and depends only on `TASK-001`. Yet `docs/GIT_SECURITY.md` assigns all worktree creation to the broker, and the M2 review path depends on both. The owner/coordinator needs to decide whether `TASK-002` M1 acceptance covers only dispatcher/lease interface behavior, with real worktree creation gated on `GIT-001`, or whether the DAG and milestone boundary need an approved change. Do not implement a second worktree mutation authority or silently call the M1 vertical flow accepted without the broker.

## Planning report

`TASK_ID: DOC-M2-001`  
`RESULT: handoff_submitted` (documentation proposal only)  
`FILES: docs/parallel-agents/M2-verification.md`  
`CHANGES: M2 disjoint packets, dependency waves, verification and Git authority gates, decision request`  
`COMMAND_EVIDENCE: Get-Item -LiteralPath 'docs/parallel-agents/M2-verification.md' | Select-Object FullName,Length,LastWriteTime; 2026-10-16 03:32 IST; exit 0; output in this task's tool record; no implementation tests run or claimed`  
`CONTRACTS: TaskPacket, TaskReport, ReviewVerdict, TestVerdict schema_version 1; AUTH-v1 is the F06 example, not an approved local hash`  
`MEMORY_CANDIDATES: none`  
`BLOCKERS: TASK-002/GIT-001 worktree authority decision for vertical acceptance`  
`KNOWN_RISKS: proposed baseline not approved; implementation checkout/tool versions and native Windows evidence not examined`

The machine-readable `weave task report` submission is pending a runnable implementation and coordinator-supplied project/run/session IDs and report destination; it must not be simulated from this specification pack.
