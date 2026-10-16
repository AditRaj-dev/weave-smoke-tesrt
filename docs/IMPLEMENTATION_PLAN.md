# WEAVE — Milestone-Based Implementation Plan

**Machine-readable DAG:** `workflow/tasks.yaml`; this document is human-readable and must not contradict it.  
**Rule:** implement smallest *vertical slice* and prove it using real PTYs/test evidence; don't scaffold 30 unconnected agent classes.

**Owner-approved exception (ADR-011):** `docs/parallel-agents/MEM-MVP-001.md` advances only the same-machine memory CLI slice in this non-Git pack. It does not complete or reorder the proposed M0/M1 tasks below; their remaining deliverables and acceptance gates stay open.

## M0 — Workspace, IPC, PTY foundation
| Task | Deliverable | Depends | Done when |
|---|---|---|---|
| INF-001 | Rust workspace, Tauri+React shell, CI/typecheck/test commands, structured logs | — | App launches on dev machine; version output; smoke CI green |
| INF-002 | SQLite migrations/events store, idempotency/version CAS | INF-001 | Tests show replay/idempotent writes and crash-safe migration |
| INF-003 | Authenticated private local IPC endpoint + CLI status/version | INF-001, INF-002 | UI and CLI connect; bad client/version rejected |
| PTY-001 | Real PTY supervisor: spawn/input/resize/stop/ring buffer | INF-001, INF-003 | 3 real shell/PTy sessions independent; Windows-specific verification pending/green |
| PTY-002 | GUI xterm tabs, session list/event replay/reconnection | PTY-001 | Close/open window, terminal survives if daemon still running |
| PROV-001 | Provider capability probe, role packet install, interactive launch adapters | PTY-001, INF-003 | Actual installed CLI launches or clear unavailable/unsupported error |

## M1 — Mastermind state and shared memory
| Task | Deliverable | Depends | Done when |
|---|---|---|---|
| WF-001 | Versioned Mastermind phase/gate engine with artifacts and approvals | INF-002 | Phase cannot advance before required approval; 7.5 conditional |
| TASK-001 | Persistent DAG, states, leases, 2-worker scheduler | WF-001, INF-002 | Conflicting tasks serialize; dependencies enforced |
| MEM-001 | Memory schema + FTS5 scoped query/provenance | INF-002 | Fresh session retrieves verified scoped item with citation |
| MEM-002 | CLI memory/task/handoff JSON commands, report validator | MEM-001, INF-003, TASK-001 | Structured report accepted; stdout claim ignored |
| MIG-001 | Memex + existing docs importer with dry-run/backups | MEM-001, WF-001 | Twice imported fixture identical; original untouched |
| TASK-002 | Packet dispatch, worktree lease integration, fresh-session checkpoints | TASK-001, PROV-001, MEM-002 | 2 independent workers spawned from DAG with correct packets |

## M2 — Contracts, verification, Git authority
| Task | Deliverable | Depends | Done when |
|---|---|---|---|
| CON-001 | Approved contract registry, JSON/OpenAPI validation and TS typegen | INF-002 | FE/BE types from same schema; invented endpoint caught |
| GIT-001 | Git broker worktree lifecycle, scoped diff, transaction audit | TASK-001 | Only broker integration API records Git ops; cooperative policy clearly labeled |
| REV-001 | Reviewer verdict schema, distinct reviewer enforcement, fix loops | TASK-002, GIT-001 | Fail verdict blocks task, 3 retries escalate |
| TEST-001 | Verification runner with command, exit, artifact hash | TASK-002 | Failing command blocks integration |
| GIT-002 | Ordered integration + regression gate + finish choices | GIT-001, REV-001, TEST-001, CON-001 | FE+BE reviewed/tested; failing test prevents commit/merge |
| E2E-001 | Full vertical demo and crash/reconnect recovery exercises | PTY-002, MIG-001, GIT-002 | PRD AC-01 through AC-10 evidenced or explicitly deferred |

## M3 — Code knowledge + visual tools (P1)
| Task | Deliverable | Depends | Done when |
|---|---|---|---|
| GRAPH-001 | Symbol index keyed by repo revision; CLI search | E2E-001 | source file:line matches; stale revision rejected |
| BROW-001 | Controlled Playwright browser tester and artifacts | E2E-001 | known failing UI test produces FAIL and screenshot/log |
| UI-001 | DAG graph, memory provenance flow, diff/contract views | E2E-001 | UI accurately displays read vs write arrows and evidence |
| SEC-001 | Native worker restrictions spike and protection report | E2E-001 | bypass attempts classified prevention vs detection |

## Definition of Ready
- Documented acceptance criteria, approved API/contract versions, exact read/write scopes, dependencies, and verification commands.
- Task estimated at ~1–5 primary files. Large cross-cutting tasks split; explicit infrastructure tasks may span more.
- Conflicting file scopes and shared resources serialized before dispatch.

## Definition of Done
- Implemented in isolated worktree, fresh evidence, reviewer PASS, test PASS, Git broker integrated hash and no scope/contract violations.
- Necessary documentation changed and confirmed; event/memory lineage updated.
- Integration smoke test after first walking skeleton and after contract/API changes.

## Execution handoff to coding agent
Begin `INF-001` → `INF-002`/`INF-003` → `PTY-001` → `PTY-002`/`PROV-001`. DO NOT build mock components that pretend PTY functionality exists. After M0 show a user-operable native window running real installed CLIs before expanding.
