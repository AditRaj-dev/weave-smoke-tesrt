# M1 parallel coding-agent packets — proposed

**Packet set:** DOC-M1-001 · **Status:** proposed, not approved for dispatch · **Source DAG:** `workflow/tasks.yaml` (`schema_version: 1`, `status: proposed_not_started`). This plan decomposes M1; it does not change the workflow, grant approval, or assert an implementation exists. Assign one coding session per packet. The coordinator alone dispatches sessions and review/test sessions; workers do not spawn agents.

## Dispatch prerequisites and common rules

- Start only after the listed M0 dependencies have accepted evidence. A task becomes `ready` only when its owning phase is approved, dependencies reach the required success state, contract pins are approved, writer slots and resource leases are free, and the run is not paused. Phase 8 build approval and phase 9 finish rules remain in force; this plan is no gate bypass.
- Each writer receives an isolated worktree and a `contracts/schemas/task-packet.schema.json` v1 packet with real IDs, approved contract version/hash, read/write scopes, role, acceptance criteria, verification commands and `isolation_mode`. Until native restrictions are demonstrated, label Git isolation `cooperative`. The Git broker owns Git mutations; no worker commits, merges, pushes, resets, or creates worktrees directly.
- Shared read set for every packet: `AGENTS.md`, `START_HERE.md`, `docs/PRD.md` (WEAVE-PRD-001 v1.0 proposed), `docs/ARCHITECTURE.md` (WEAVE-ARCH-001 v1.0 proposed), `docs/IMPLEMENTATION_PLAN.md`, `workflow/tasks.yaml`, the approved owning feature spec, relevant schema, approved memory and contract pins, then only impacted code. Treat proposed docs as proposed until approved by the owner. Before using an external API or provider flag, verify installed types/help or official docs and record version/signature/evidence in `docs/API_RECORD.md` through an approved scope change; `PLANNED` is not `VERIFIED`.
- These are **exclusive write scopes from the machine DAG**, not permission to modify adjacent crates or schema files. Read-only cross-module integration is allowed. If a required migration, generated binding, test file, manifest or API-record update lies outside a packet's scope, submit a scope/contract change; do not patch it silently. Exact verification commands and hashes must be filled from the implementation checkout and approved contract before real dispatch. Keep output/error artifacts redacted and record command, start/end time, exit code, revision and artifact hash. Plain terminal text is never a task report.
- Default capacity is two writers, one independent reviewer and one tester. A writer cannot review its own patch. A handoff is not `done`: schema-valid `task.report`, independent review PASS, test PASS and brokered integration are separate gates. A documentation-only exception requires explicit policy.

## Realizable waves from the existing DAG

| Wave | Concurrent coding sessions | Release condition |
|---|---|---|
| 1 | `WF-001` and `MEM-001` | `INF-002` accepted; disjoint `workflow/**`/`weave-core/src/workflow/**` and `weave-store/src/memory/**` writes. |
| 2 | `TASK-001` and `MIG-001` | `TASK-001` after `WF-001` + `INF-002`; `MIG-001` after `MEM-001` + `WF-001`. Start each as soon as its own dependencies pass. |
| 3 | `MEM-002` alongside any unfinished `MIG-001` | `MEM-002` after `MEM-001`, `INF-003`, `TASK-001`; scopes/resources are disjoint. |
| 4 | `TASK-002` alongside any unfinished `MIG-001` | `TASK-001`, `PROV-001`, `MEM-002` accepted **and DR-M1-01 resolved**. Its worktree behavior cannot be accepted before the broker dependency is resolved. |

The waves show maximum useful overlap, not barriers that delay a ready task. The scheduler still checks conservative glob overlap, resource leases and the two-writer cap at assignment. Reviewer/tester work may proceed behind accepted handoffs without taking a writer slot, subject to their own one-slot caps and independent evidence policy.

## Disjoint packets

### WF-001 — Mastermind workflow state engine

- **Depends:** `INF-002`. **Owns writes:** `crates/weave-core/src/workflow/**`, `workflow/**`. **Exclusive resource:** `workflow:phases`. Do not edit `workflow/tasks.yaml` to alter this plan without a separate approved DAG change.
- **Read additionally:** `docs/features/F02-WORKFLOW.md`, `docs/MASTERmind_INTEGRATION.md`, `workflow/mastermind.yaml`, `docs/DATA_MODEL.md`, relevant event/gate contract. **Contract:** workflow `mastermind-v1`, `workflow_version: 1`; task packet/report v1 where handoff is consumed. Pin approved artifact hashes at dispatch.
- **Deliver:** persisted phase/gate transitions, artifact/hash checks, approval/revision/pause/checkpoint behavior and the conditional 7.5 transition, preserving phase 0–9 semantics. Fresh phase context follows approved gates; never carry stale transcript as authority.
- **Acceptance/negative paths:** phase 0 auto advances; phases 1–7 and 8 require owner approval; 7.5 runs only for React/Next after approved 7, otherwise emits explicit skip reason. Declined gate keeps the phase and artifacts; missing/invalid artifact rejects; worker approval rejects; stale expected version and concurrent double approval cannot both succeed; revision invalidates stale approval/hash; pause suppresses new dispatch.
- **Evidence:** focused state-machine and persisted transition tests, including restart/replay, negative paths and gate authorization, with command/time/exit/redacted artifacts. No pass claim until run.

### MEM-001 — scoped FTS memory and provenance

- **Depends:** `INF-002`. **Owns writes:** `crates/weave-store/src/memory/**`. **Exclusive resource:** `db:memory`.
- **Read additionally:** `docs/features/F04-MEMORY.md`, `docs/MEMORY_ENGINE.md`, `docs/DATA_MODEL.md`, `contracts/schemas/memory-item.schema.json` v1. **Contract:** memory-item v1; schema migrations from `INF-002` must support the normative memory/FTS entities or DR-M1-02 must be resolved.
- **Deliver:** daemon-owned SQLite memory create/query lifecycle, exact-hash dedupe, FTS5 scoped ranking and provenance/status filtering. Candidate writes cannot overwrite pinned truth; promotion requires validator and evidence; default retrieval is bounded to eight validated/pinned results and about 4k tokens with source pointers.
- **Acceptance/negative paths:** three concurrent candidate writers have no lost canonical rows; rejected/superseded/conflicting candidates stay out of default query; stale/missing source is not shown as confirmed; secret-bearing content is withheld/redacted; FTS unavailable and SQLite busy return explicit errors without partial promotion; restart preserves retrieval and provenance.
- **Evidence:** transactional/concurrency and FTS tests with source/commit citation checks and failing-path artifacts. No pass claim until run.

### TASK-001 — persistent DAG and conservative scheduler

- **Depends:** `WF-001`, `INF-002`. **Owns writes:** `crates/weave-core/src/scheduler/**`. **Exclusive resource:** `scheduler:leases`.
- **Read additionally:** `docs/features/F03-TASK-SCHEDULER.md`, `docs/DATA_MODEL.md`, `docs/features/F02-WORKFLOW.md`, `workflow/tasks.yaml`, task packet/report v1. **Contract:** approved phase state and pinned contract hashes are inputs, not values inferred from stdout.
- **Deliver:** persistent task/dependency validation, state/CAS transitions, priority plus FIFO readiness, conservative path/resource leases, bounded two-writer assignment and cancellation/retry/recovery rules. Durable assignment and lease reservation precede spawn; spawn failure reconciles state and leases.
- **Acceptance/negative paths:** cycle cannot persist; blocked dependency, unapproved phase, stale contract, paused run or occupied lease prevents dispatch; two disjoint workers can be assigned; overlapping `package.json` resource serializes; stale/expired lease needs audited reconciliation; stale version and concurrent assignment do not double-lease; exit without report leaves task unaccepted/interrupted; retry above three escalates.
- **Evidence:** persisted DAG/CAS, lease overlap, restart/orphan and negative scheduling tests with command/time/exit/redacted artifacts. No pass claim until run.

### MIG-001 — legacy Memex and docs import

- **Depends:** `MEM-001`, `WF-001`. **Owns writes:** `crates/weave-store/src/import/**`. **Exclusive resource:** `import:memex`.
- **Read additionally:** `docs/features/F04-MEMORY.md`, `docs/MASTERmind_INTEGRATION.md`, `docs/MEMORY_ENGINE.md`, `docs/DATA_MODEL.md`, `workflow/mastermind.yaml`, inspected local Mastermind `memex` source/schema and affected import fixtures. **Contract:** native memory-item v1 and verified source schema; do not assume an undocumented Memex column.
- **Deliver:** read-only source inspection, dry-run mapping, verified backup, staging/transactional import and `(source_hash, legacy_id)` dedupe. Keep original DB/docs untouched. Historical `done` remains `legacy_unverified` until independent proof; import project docs as proposed lineage, not auto-approved current truth.
- **Acceptance/negative paths:** empty/populated DB, duplicate IDs/projects, docs-only/DB-only, corrupt/incompatible source, malformed handoff, dirty/no Git repo and interrupted import are reported safely; two identical imports yield identical native counts; rollback leaves no partial native promotion; original source and backup remain intact.
- **Evidence:** fixture dry-run/import/rerun/rollback checks with before/after counts and source/backup hashes; command/time/exit/redacted artifacts. No pass claim until run.

### MEM-002 — CLI task/memory/handoff protocol and report validation

- **Depends:** `MEM-001`, `INF-003`, `TASK-001`. **Owns writes:** `crates/weave-cli/**`, `crates/weave-daemon/src/api/**`. **Exclusive resource:** `cli:tooling`.
- **Read additionally:** `docs/features/F03-TASK-SCHEDULER.md`, `docs/features/F04-MEMORY.md`, `docs/MEMORY_ENGINE.md`, `docs/ARCHITECTURE.md`, `contracts/schemas/task-report.schema.json` v1, `contracts/schemas/handoff.schema.json` v1, `contracts/schemas/memory-item.schema.json` v1 and `examples/task-report.json`. **Contract:** use only the frozen M0/M1 RPC method names already listed in architecture; CLI syntax must be checked against implemented `--help` before recording it as verified.
- **Deliver:** authenticated JSON CLI access to task/status/memory plus structured handoff/report submission and schema validation through daemon services. Match session/task IDs and enforce idempotency/version checks; a handoff acknowledgement is not acceptance.
- **Acceptance/negative paths:** a new session retrieves verified scoped memory with citation; valid report is stored once and moves only to `handoff_submitted`; missing evidence, wrong session, malformed/oversize JSON, unauthorized promotion, duplicate idempotency key with changed payload and CLI stdout saying `done` are rejected or leave status unchanged. No secret/token in JSON/logs.
- **Evidence:** CLI-to-daemon integration tests for success and negative paths, schema validation and idempotent replay, with command/time/exit/redacted artifacts. No pass claim until run.

### TASK-002 — packet dispatch and fresh sessions

- **Depends in current DAG:** `TASK-001`, `PROV-001`, `MEM-002`. **Owns writes:** `crates/weave-core/src/dispatch/**`. **Exclusive resource:** `dispatch:worktrees`. **Additional precondition:** DR-M1-01 resolution for brokered worktree lifecycle.
- **Read additionally:** `docs/features/F03-TASK-SCHEDULER.md`, `docs/features/F02-WORKFLOW.md`, `docs/features/F04-MEMORY.md`, `docs/MASTERmind_INTEGRATION.md`, `docs/MEMORY_ENGINE.md`, `contracts/schemas/task-packet.schema.json` v1 and `examples/task-packet.json`. **Contract:** packet v1 with actual IDs, frozen contract hashes and scopes; provider launch only through verified `PROV-001` capabilities.
- **Deliver:** compose bounded fresh-session packets from approved phase, task, contracts, scoped verified memory and dependency outcomes; request brokered isolated worktree lease, then supervisor/provider launch. Checkpoint `MEMORY.md`/`HANDOFF.md`/`RESUME.md` through the approved projection path and hash/version guard. No full transcript replay.
- **Acceptance/negative paths:** two independent workers receive distinct CWD/worktree/packet IDs and only their approved scopes; missing provider/auth remains visible and does not fabricate a running task; invalid pin, changed contract, failed worktree lease, stale checkpoint, paused run and launch failure block/reconcile safely; reportless exit is interrupted and never accepted.
- **Evidence:** two-session dispatch demo with packet validation, lease/CWD checks, checkpoint/restart cases and failure artifacts. Worktree acceptance stays blocked until DR-M1-01 is settled and a broker exists.

## Decisions required before affected implementation

1. **DR-M1-01 — worktree broker ordering.** `TASK-002` promises worktree lease integration, but `workflow/tasks.yaml` places `GIT-001` in M2 with only `TASK-001` as its prerequisite. `docs/ARCHITECTURE.md` assigns worktree creation to the Git broker and forbids scheduler Git mutations. The owner must approve a DAG/contract change that makes broker capability available before `TASK-002` worktree acceptance, or explicitly split TASK-002 into packet composition now and brokered launch later. Do not invent a temporary direct-Git worker path.
2. **DR-M1-02 — M1 schema ownership if INF-002 did not ship the necessary tables.** The M1 write scopes exclude `crates/weave-store` migration files, while `WF-001`, `TASK-001`, `MEM-001` and `MIG-001` require persisted gate/task/lease/memory/import entities in `docs/DATA_MODEL.md`. Verify INF-002's accepted schema. If missing, approve a serial migration task/scope and `db:migrations` lease before dependent writers proceed. Parallel workers must not create competing migrations.

## Handoff/report rule

Each coding session submits `weave task report` JSON shaped by `contracts/schemas/task-report.schema.json` v1, plus the required human report: `TASK_ID`, `RESULT`, exact `FILES`, `CHANGES`, command/exit/time/artifact `COMMAND_EVIDENCE`, `CONTRACTS`, sourced `MEMORY_CANDIDATES`, `BLOCKERS`, `KNOWN_RISKS`. Reviewer and tester independently verify; the coordinator schedules fixes or broker integration. No packet here claims tests have run.

## Draft preparation evidence

Read-only PowerShell check of this file for all six M1 task IDs and both decision IDs: `2026-10-15T22:02:55.2156399+00:00`, exit `0`, output `bytes=14355; missing=`. `Get-Command weave` check: `2026-10-15T22:03:01.4795243+00:00`, exit `2`, output `weave CLI unavailable`; therefore a machine-readable `weave task report` could not be submitted from this specification-only pack. These are preparation checks, not implementation tests or acceptance evidence.

## DOC-M1-001 author report

```text
TASK_ID: DOC-M1-001
RESULT: handoff_submitted
FILES: docs/parallel-agents/M1-coordination.md
CHANGES: Proposed six disjoint M1 coding packets and dependency-sensitive parallel waves; recorded two decisions needed before affected dispatch.
COMMAND_EVIDENCE: PowerShell Get-Content/Contains check for six task IDs and two decision IDs; 2026-10-15T22:03:23.2830029+00:00; exit 0; stdout "missing=; length=14845"; artifact docs/parallel-agents/M1-coordination.md (Draft preparation evidence and this report). PowerShell Get-Command weave; 2026-10-15T22:03:01.4795243+00:00; exit 2; stdout "weave CLI unavailable"; same artifact. No implementation tests run.
CONTRACTS: WEAVE-PRD-001 v1.0 proposed; WEAVE-ARCH-001 v1.0 proposed; workflow/mastermind.yaml workflow_version 1; workflow/tasks.yaml schema_version 1; TaskPacket, TaskReport, Memory Item and Handoff schema_version 1. No contract changed.
MEMORY_CANDIDATES: None; no implementation fact was verified for promotion.
BLOCKERS: DR-M1-01 broker ordering for TASK-002; DR-M1-02 migration ownership if INF-002 lacks M1 tables. `weave` CLI unavailable, so machine `weave task report` submission was not possible.
KNOWN_RISKS: All documents and machine DAG are proposed; exact implementation verification commands, contract hashes, and worktree broker availability require validation before coding dispatch. Git diff/status check could not run because the pack root is not a Git repository.
```
