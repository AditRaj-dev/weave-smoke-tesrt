# Parallel agent execution plan (proposed)

**Current continuation (2026-10-16):** This file preserves the original planning pass. Implementation has since begun in this pack through disjoint Antigravity sessions. The current INF-001 assessment is [INF-001-round2-review.md](INF-001-round2-review.md); its narrow CI scope decision is [bootstrap-scope-decision.md](bootstrap-scope-decision.md). The [terminal role probe](terminal-role-probe/README.md) shows a real interactive prompt sent to Antigravity and Codex PTYs, with production limitations stated. Historical statements below that `apps/`, `crates/`, `.github/`, or a runnable CLI are absent describe the earlier documentation-only state. Git metadata and a successful remote CI run are still absent.

**Status:** documentation handoff for review. The WEAVE pack is a specification, not an implementation repository. Its PRD and architecture are proposed baselines; this plan does not approve a contract or mark a coding task done.

## Sessions active for this documentation pass

| Session | Task packet | Exclusive output | Read set | Purpose |
|---|---|---|---|---|
| M0 foundation | `DOC-M0-001` | `docs/parallel-agents/M0-foundation.md` | PRD, architecture, implementation plan, task DAG, F01/F05, protocols, provider runtime, dev setup, API ledger | Split foundation, IPC, PTY, and provider work into dispatchable packets. |
| M1 coordination | `DOC-M1-001` | `docs/parallel-agents/M1-coordination.md` | PRD, architecture, implementation plan, task DAG, F02/F03/F04, Mastermind workflow, memory/data model, relevant schemas | Split workflow, scheduler, memory, and dispatch work. |
| M2 verification | `DOC-M2-001` | `docs/parallel-agents/M2-verification.md` | PRD, architecture, implementation plan, task DAG, F06/F07, Git security, test plan, protocols, relevant schemas | Split contracts, review, tests, and Git integration work. |

These sessions may read common canonical documents. Their write paths do not overlap. Each packet must state dependencies, exclusive resources, acceptance and negative paths, and required evidence. Agents must flag contradictions for a decision; they must not edit approved truth to make the plan appear consistent.

## Dependency gates for coding sessions

The source of truth for task dependencies is `workflow/tasks.yaml`. Milestone order and approval gates in `docs/IMPLEMENTATION_PLAN.md` and the Mastermind workflow still apply.

| Gate | Work eligible for parallel dispatch after the gate | Scheduling note |
|---|---|---|
| Project becomes an implementation repository and `INF-001` completes | `INF-002` | Initial workspace bootstrap has broad write scope, so start it alone. |
| `INF-002` completes | `INF-003`; later `WF-001` and `MEM-001` when the M1 gate opens | M0 is proved before M1 expansion. `INF-003` writes daemon/CLI paths; M1 tasks use distinct paths. |
| `INF-003` completes | `PTY-001` | Real PTY evidence is required before terminal UI and provider launch claims. |
| `PTY-001` completes | `PTY-002` and `PROV-001` | Distinct UI and provider paths permit two writers if their packets retain separate leases. |
| M0 acceptance and M1 gate | `WF-001` and `MEM-001` | Separate workflow and memory paths; `TASK-001` waits for `WF-001`. |
| `WF-001` and `MEM-001` complete | `TASK-001` and `MIG-001` | Scheduler and importer paths differ. `MEM-002` waits for `TASK-001`. |
| M1 acceptance and M2 gate | `CON-001` and `GIT-001`; then `REV-001` and `TEST-001` after their dependencies | Reviewers and testers verify independent work; neither self-approves a patch. |
| Contract, review, test, and broker prerequisites complete | `GIT-002`, then `E2E-001` | Integration stays ordered and brokered; failures block advancement. |

The listed pairs are eligibility examples, not permission to ignore path/resource collisions or phase approval. Default writer capacity is two, with separate reviewer and tester capacity as specified in the PRD. `M3` work remains after the `E2E-001` gate.

## Decisions surfaced by the parallel packets

| Decision | Affected dispatch | Required resolution |
|---|---|---|
| M0 bootstrap paths | `INF-001` | CI and likely root manifests fall outside its declared write globs. Approve exact extra paths or a scoped alternative before editing them. |
| M0 integration seams | `PTY-001`, `PTY-002`, `PROV-001` | Identify which packet owns shared daemon/UI entrypoints and manifests, then serialize any shared edits. |
| Structured report bootstrap | M0 tasks | `AGENTS.md` requires `weave task report`, while the report validator/CLI is scheduled under `MEM-002` in M1. Approve an interim schema-valid submission path or move minimal support earlier. |
| Worktree broker order | `TASK-002`, then M2 verification | `TASK-002` needs a worktree in M1; `GIT-001` broker creation is scheduled in M2. Approve an earlier broker capability or split dispatcher acceptance from brokered launch. |
| Migration ownership | M1 workflow, scheduler, memory, importer | Confirm `INF-002` supplies their persisted tables. If not, approve a serial migration scope before parallel M1 writers. |
| Plan shorthand | `INF-003` | The plan's handoff shorthand suggests overlap with `INF-002`, while the machine DAG requires `INF-002` first. Clarify the prose; use the machine dependency until an approved change. |

Each issue is described in the corresponding M0/M1/M2 packet. The affected coding task stays unready until its specific decision is recorded. Unaffected documentation and prerequisite work can continue.

## Execution boundary

This folder records proposed packets so agents can work in parallel without modifying the same document. Coding execution requires a real repository, frozen task contracts, scoped worktrees, and the WEAVE report/evidence path. No `weave` CLI, `apps/`, `crates/`, or `.git` directory is present in this pack at the time of this pass; therefore no coding task, review verdict, test result, or broker integration is claimed here.

## Coordinator checks before dispatch

1. Confirm the current approved phase and contract pins. Proposed documents alone do not satisfy approval.
2. Validate each packet's read paths, write paths, dependencies, and exclusive resources against `workflow/tasks.yaml`.
3. Check every concurrently writable path for overlap, including parent globs and shared manifests.
4. Dispatch only ready work to separate worktrees through the Git broker when the implementation exists.
5. Require machine-validated `weave task report`, independent review and test evidence, then brokered integration before declaring a coding task done.

## Coordinator report

```text
TASK_ID: DOC-COORD-001
RESULT: handoff_submitted
FILES: docs/parallel-agents/README.md; docs/parallel-agents/M0-foundation.md; docs/parallel-agents/M1-coordination.md; docs/parallel-agents/M2-verification.md; docs/parallel-agents/validation.json
CHANGES: Dispatched three parallel, exclusive documentation packets; assembled dependency gates and decision index; checked all 18 canonical task IDs and removed unverified WEAVE CLI flags from packet drafts.
COMMAND_EVIDENCE: PowerShell documentation presence/ID/flag/hash validation; exit 0; 2026-10-16T03:34:00+05:30; docs/parallel-agents/validation.json. No implementation build or test ran.
CONTRACTS: WEAVE-PRD-001 v1.0 proposed; WEAVE-ARCH-001 v1.0 proposed; workflow/tasks.yaml schema_version 1; task-packet/report schema_version 1. No contract changed.
MEMORY_CANDIDATES: none
BLOCKERS: Decisions in this document must be resolved before affected coding dispatch; no implementation repository or runnable weave CLI is present.
KNOWN_RISKS: Proposed packet scopes and verification commands need approval and installed-API evidence; native Windows PTY behavior remains untested.
```

Machine-readable `weave task report` submission was unavailable because the `weave` CLI is absent. `validation.json` is only documentation validation evidence, not a task report or acceptance verdict.

