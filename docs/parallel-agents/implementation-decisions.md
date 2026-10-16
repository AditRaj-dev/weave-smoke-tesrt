# WEAVE Implementation Ordering and Scope Decisions (Proposed)

**Document ID:** DOC-DEC-001  
**Status:** PROPOSED PLANNING AID — PENDING USER / COORDINATOR APPROVAL  
**Author:** Antigravity Planning Worker (WEAVE Architecture & Scheduling)  
**Date:** 2026-10-16  
**Canonical References:** `AGENTS.md`, `START_HERE.md`, `docs/PRD.md` (WEAVE-PRD-001 v1.0 proposed), `docs/ARCHITECTURE.md` (WEAVE-ARCH-001 v1.0 proposed), `docs/IMPLEMENTATION_PLAN.md`, `workflow/tasks.yaml` (schema_version 1), `docs/parallel-agents/README.md`, `docs/parallel-agents/M0-foundation.md`, `docs/parallel-agents/M1-coordination.md`, `docs/parallel-agents/M2-verification.md`, `docs/DATA_MODEL.md`, `docs/GIT_SECURITY.md`, `docs/PROTOCOLS.md`.

---

## 1. Executive Summary & Status

This document analyzes implementation ordering, declared write scopes, cross-module wiring seams, and governance authority across Milestone M0 (Foundation), Milestone M1 (Coordination), and Milestone M2 (Verification).

**Governance Boundary:**
- This document is a **planning proposal**, not an approved specification or decision.
- All decisions remain **pending user / coordinator approval**. No task is marked complete, and no contract is declared accepted.
- In accordance with `AGENTS.md` and `docs/GIT_SECURITY.md`, the Git broker (`crates/weave-git`) retains sole authority over repository metadata mutation, branch creation, worktree lifecycles, and integration. Worker isolation remains explicitly classified as `cooperative` until OS-level kernel sandbox enforcement is proven.
- No CLI flags or protocol responses are invented; documented planned interfaces from `docs/PROTOCOLS.md` and machine schemas are strictly preserved.

---

## 2. Decision Request Matrix (Pending Approval)

| Decision Request | Domain / Issue | Primary Conflict / Missing Scope | Proposed Resolution Options | Dependent Tasks | Decision / Approval Needed |
|---|---|---|---|---|---|
| **DCR-001** | `INF-001` CI & Root Scope | Declared paths (`apps/desktop/**`, `crates/**`, `packages/**`) exclude `.github/**` (blocking promised CI). Root manifests are an optional workspace design choice. | Authorize `.github/**` for CI; decide whether to add root manifests or maintain independent sub-project roots (`crates/Cargo.toml`, `apps/desktop/package.json`). | `INF-001`, `INF-002`, `INF-003`, CI smoke | Coordinator decision on CI path scope and root manifest strategy. |
| **DCR-002** | M0 Module Wiring Seams | `PTY-001` (`crates/weave-daemon/src/pty/**`) and `PROV-001` (`crates/weave-provider/**`) cannot edit daemon `main.rs` or `Cargo.toml`. | Pre-wire module stubs and trait seams in `INF-001`/`INF-003`; handle any cross-crate manifest updates via explicit narrow scope amendments and serialized leases. | `PTY-001`, `PTY-002`, `PROV-001`, `INF-003` | Coordinator approval of trait pre-wiring and manifest modification ownership. |
| **DCR-003** | M0 Structured Report Bootstrap | `AGENTS.md` requires `weave task report`, but the CLI binary and daemon validator are scheduled in M1 (`MEM-002`). | Proposed unapproved bootstrap exception: file-based JSON report validated against `task-report.schema.json` v1 via standard tooling until `INF-003` implements documented `weave task report --file <path>`. | `INF-001` through `PROV-001`, `MEM-002` | Coordinator approval of the provisional exception to `AGENTS.md`. |
| **DCR-004** | Worktree Authority (`TASK-002` vs `GIT-001`) | `TASK-002` (M1) manages worktrees, but Git broker `GIT-001` is scheduled in M2. `weave-core` must not run Git commands directly. | Option A (Recommended): Reschedule `GIT-001` to M1 after `TASK-001`; Option B: Implement packet composition/interface in M1, but keep real worktree launch and acceptance pending until `GIT-001` in M2. | `TASK-001`, `TASK-002`, `GIT-001`, `REV-001`, `TEST-001` | Coordinator choice between promoting `GIT-001` or deferring `TASK-002` worktree acceptance. |
| **DCR-005** | M1 Migration Ownership & Schema Scope | M1 tasks require database tables, but lack write scope for `crates/weave-store/**`. Implementing all 25 tables in M0 violates MVP discipline. | `INF-002` implements only the minimal schema set for M0/M1 (18 entities); later entities (M2 verification/git, M3 code-index) use single-owner, serial migrations upon milestone dispatch. | `INF-002`, `WF-001`, `TASK-001`, `MEM-001`, `MIG-001` | Coordinator instruction on minimal initial schema boundary and serial migration steps. |
| **DCR-006** | Plan Shorthand Mismatch | `IMPLEMENTATION_PLAN.md` line 55 shorthand (`INF-002/INF-003`) implies parallel execution, but machine DAG requires `INF-002` before `INF-003`. | Reaffirm machine DAG precedence (`INF-001 → INF-002 → INF-003`); correct prose shorthand in next documentation release. | `INF-002`, `INF-003`, `PTY-001` | Coordinator reaffirmation that machine DAG governs execution order. |

---

## 3. Detailed Decision Proposals

### 3.1 DCR-001: INF-001 CI and Root Path Scope

#### Exact Source Conflict & Missing Scope
- **Machine DAG (`workflow/tasks.yaml` lines 14-17):**
  ```yaml
  - id: INF-001
    write_paths:
    - apps/desktop/**
    - crates/**
    - packages/**
    exclusive_resources:
    - workspace:bootstrap
  ```
- **Plan Specification (`docs/IMPLEMENTATION_PLAN.md` line 9):**
  Deliverables specify: "Rust workspace, Tauri+React shell, CI/typecheck/test commands, structured logs. Done when: App launches on dev machine; version output; smoke CI green."
- **Path Analysis:**
  1. **CI Blocker:** Automated GitHub Actions workflows require writing to `.github/workflows/**`. This path is outside `apps/desktop/**`, `crates/**`, and `packages/**`. Without an authorized path expansion, the promised "smoke CI green" cannot be automated within declared task bounds.
  2. **Root Manifests as Design Choice:** A Rust Cargo workspace can compile, format, clippy, and test completely self-contained with a workspace manifest at `crates/Cargo.toml` (`cargo test --manifest-path crates/Cargo.toml`). Similarly, the desktop app can build and typecheck with its package manifest at `apps/desktop/package.json`. Therefore, root manifests (`/Cargo.toml`, `/package.json`, `/pnpm-workspace.yaml`, `/.gitignore`) do **not** block compilation. They represent an architectural design choice: a single unified repository root workspace versus independent sub-project roots.

#### Immediate Unblocked INF-001 Work within Existing Declared Paths
Parallel workers can proceed immediately with minimal, complete bootstrap work within declared scopes:
1. **Rust Implementation Worker (`crates/**`):**
   - Author the minimal compilable bootstrap workspace at `crates/Cargo.toml`.
   - Scaffold the two essential M0 binary crates:
     - `crates/weave-daemon/`: Supervisor binary skeleton, logging, health/version reporting, and module entrypoints.
     - `crates/weave-cli/`: Command-line binary skeleton with basic version and help output.
   - Do **not** scaffold speculative, empty crates for future milestones (`weave-core`, `weave-git`, `weave-contract`, `weave-provider`, `weave-store`) during `INF-001`; introduce those crates when their owning tasks are dispatched, maintaining the smallest complete vertical slice.
   - Execute verification: `cargo check --manifest-path crates/Cargo.toml`, `cargo test --manifest-path crates/Cargo.toml`.
2. **Desktop Implementation Worker (`apps/desktop/**`, `packages/ui/**`):**
   - Author the Tauri 2 + React + TypeScript shell inside `apps/desktop/` (including `apps/desktop/src-tauri/`, `apps/desktop/src/`, `apps/desktop/package.json`, `apps/desktop/tsconfig.json`, `apps/desktop/vite.config.ts`).
   - Author `packages/ui/` with initial theme/layout components and placeholder slots.
   - Display clear, honest UI status: "Terminal sessions unavailable until PTY-001/PTY-002". Do not simulate terminal sessions or fabricate agent activity.
   - Execute verification: `npm run typecheck` and `npm run build` within `apps/desktop/` and `packages/ui/`.

#### Proposed Implementable Resolution
1. **Approve CI Path Scope:** Amend `workflow/tasks.yaml` for `INF-001` to add `.github/**` to `write_paths` to unblock CI workflow creation.
2. **Select Workspace Strategy:**
   - *Option A (Sub-project Roots — Zero Root Scope Expansion):* Keep Cargo workspace at `crates/Cargo.toml` and Node workspace at `apps/desktop/package.json` + `packages/ui/package.json`. CI runs commands with `--manifest-path crates/Cargo.toml` and `--prefix apps/desktop`. No root manifests required.
   - *Option B (Unified Root Workspace):* Amend `INF-001.write_paths` to include `Cargo.toml`, `package.json`, `pnpm-workspace.yaml`, `Cargo.lock`, `pnpm-lock.yaml`, and `.gitignore`. Root files are committed by the coordinator or bootstrap integrator upon merging the Rust and Desktop contributions.

---

### 3.2 DCR-002: Module Wiring Seams Across M0 Crate Boundaries

#### Exact Source Conflict & Missing Scope
- **Machine DAG (`workflow/tasks.yaml`):**
  - `PTY-001`: write scope `crates/weave-daemon/src/pty/**`
  - `INF-003`: write scope `crates/weave-daemon/**`, `crates/weave-cli/**` (narrowed to `crates/weave-daemon/src/api/**` in M0 planning)
  - `PROV-001`: write scope `crates/weave-provider/**`
  - `PTY-002`: write scope `apps/desktop/**`, `packages/ui/**`
- **Contradiction:**
  In Rust, submodules must be declared in parent modules (`mod pty;` in `crates/weave-daemon/src/lib.rs` or `main.rs`), and dependencies between crates must be declared in `Cargo.toml`.
  - `PTY-001` cannot edit `crates/weave-daemon/src/lib.rs` or `crates/weave-daemon/Cargo.toml` without violating its declared path lease `crates/weave-daemon/src/pty/**`.
  - `PROV-001` cannot add `weave-provider` as a dependency in `crates/weave-daemon/Cargo.toml` without violating its write lease `crates/weave-provider/**`.
  - In the UI, `PTY-002` could collide with `INF-001`'s app shell in `apps/desktop/src/App.tsx`.
- **Git Broker Boundary Rule:**
  The Git broker must **not** author code or edit manifests during integration. The broker integrates verified commits and worktrees; it does not write application code.

#### Proposed Implementable Resolution
1. **Pre-Wiring in INF-001 and INF-003:**
   - In `INF-001`, the Rust worker establishes module seams in `crates/weave-daemon/src/lib.rs` by declaring `pub mod pty;` and providing `crates/weave-daemon/src/pty/mod.rs` containing a clean `PtySupervisor` trait definition and stub implementation.
   - In `INF-003`, when local IPC is implemented, the daemon API router connects to the `PtySupervisor` trait boundary. `PTY-001` then implements the production ConPTY engine entirely inside `crates/weave-daemon/src/pty/**`.
2. **Narrow Scope Amendment & Serialized Lease for Manifest Updates:**
   - When a downstream task requires updating a shared manifest (e.g. adding `weave-provider` or a new dependency to `crates/weave-daemon/Cargo.toml`), that task packet must explicitly request a narrow scope amendment for that specific manifest file.
   - The coordinator serializes this update under a dedicated resource lease (e.g., `manifest:daemon-cargo`) to ensure no concurrent worker is editing the file.
3. **UI Mount Slot Boundary:**
   - In `INF-001`, the desktop worker exports a mount point `<TerminalContainer />` from `packages/ui/src/terminal/`.
   - `PTY-002` implements the xterm rendering and tab controls inside `packages/ui/src/terminal/**` and `apps/desktop/src/terminal/**`, mounting cleanly into the pre-wired slot without touching the primary layout shell in `apps/desktop/src/App.tsx`.

---

### 3.3 DCR-003: M0 Structured Report Bootstrap

#### Exact Source Conflict & Missing Scope
- **`AGENTS.md` Mandate:**
  "No terminal text is a trustworthy structured event; use `weave task report` and schema validation... Required task completion report... Also submit machine-readable `examples/task-report.json`-shaped JSON through `weave task report`."
- **`docs/PROTOCOLS.md` Section 4 (Planned Interface):**
  "Worker must submit `weave task report --file <absolute-or-workspace-path>`; the CLI outputs machine JSON `{ok,report_id,state}` and exits nonzero on validation failure."
- **Machine DAG (`workflow/tasks.yaml` line 160):**
  Task `MEM-002` ("Agent CLI and handoff protocol") is scheduled in **Milestone M1**, depends on `MEM-001`, `INF-003`, `TASK-001`, and owns `crates/weave-cli/**` and `crates/weave-daemon/src/api/**`.
- **Honest Status & Governance Constraint:**
  In Milestone M0, the `weave` binary does not exist. No CLI can be executed, and simulating a CLI response via dummy stdout is strictly forbidden. Submitting a raw JSON file is **not an approved replacement** for `weave task report` under `AGENTS.md`; it is an unresolved bootstrap conflict.

#### Proposed Implementable Resolution (Pending Coordinator Approval)
1. **Proposed Bootstrap Exception to `AGENTS.md` (Stage 1):**
   - Submit a formal, explicit exception request to the coordinator for tasks prior to CLI availability (`INF-001`, `INF-002`, `INF-003`):
     - Workers author a machine-readable JSON report file conforming strictly to `contracts/schemas/task-report.schema.json` v1 at `.weave/reports/<task-id>-report.json` (or `docs/parallel-agents/<task-id>-report.json` for planning tasks).
     - Workers validate this file using standard off-the-shelf schema validators (e.g. `ajv-cli validate -s contracts/schemas/task-report.schema.json -d <report-file>` or Python `jsonschema`).
     - Workers cite the report path, SHA-256 hash, validation command, and exit code 0 in their human report.
   - **Crucial Note:** This file-based workflow remains an **unapproved bootstrap exception** until the coordinator explicitly signs off.
2. **Documented CLI Report Delivery in `INF-003` (Stage 2):**
   - Authorize `INF-003` (which owns `crates/weave-cli/**`) to implement the canonical documented command from `docs/PROTOCOLS.md` §4:
     `weave task report --file <path>`
     returning `{ok: true, report_id: "...", state: "handoff_submitted"}`.
   - Once `INF-003` is accepted, subsequent M0 workers (`PTY-001`, `PTY-002`, `PROV-001`) use the real `weave` CLI command.
   - `MEM-002` in M1 subsequently attaches database persistence, event outbox streaming, and task state automation behind the existing CLI interface.

---

### 3.4 DCR-004: Worktree Authority — TASK-002 versus GIT-001

#### Exact Source Conflict & Missing Scope
- **Machine DAG (`workflow/tasks.yaml`):**
  - `TASK-002` (Milestone M1): "Packet dispatcher and worktrees", depends on `TASK-001`, `PROV-001`, `MEM-002`. Write scope: `crates/weave-core/src/dispatch/**`. Exclusive resource: `dispatch:worktrees`.
  - `GIT-001` (Milestone M2): "Audited Git broker", depends on `TASK-001`. Write scope: `crates/weave-git/**`. Exclusive resource: `git:broker`.
- **Architectural Invariants:**
  - `docs/ARCHITECTURE.md` Section 1, Invariant 6: "Git broker is the sole approved actor for repository metadata mutation and integration...". Section 3: `scheduler` **must not** own running `git` directly.
  - `docs/GIT_SECURITY.md` Section 1: "Only daemon `git-broker` is authorized by WEAVE policy to create/remove worktrees, switch branches, stage, commit, cherry-pick/merge, reset, push and finish branches."
- **The Genuine Ordering Conflict:**
  `TASK-002` is scheduled in M1 and claims worktree management as an acceptance deliverable. However, the Git broker (`GIT-001`) that exclusively owns worktree creation is placed in M2.
  `weave-core` cannot invoke `git worktree add` directly without violating Architectural Invariant 6.

#### Proposed Implementable Resolution Options
The coordinator must choose between two concrete options:

- **Option A (Promote `GIT-001` to Milestone M1 Wave 3 — Recommended):**
  - In `workflow/tasks.yaml`, `GIT-001` depends **only on `TASK-001`**. It has zero dependencies on other M2 tasks.
  - In Milestone M1, `TASK-001` completes in Wave 2.
  - Reschedule `GIT-001` to execute in Milestone M1 Wave 3 immediately after `TASK-001`.
  - Amend `TASK-002` dependencies in `workflow/tasks.yaml` to include `GIT-001`:
    ```yaml
    - id: TASK-002
      title: Packet dispatcher and worktrees
      milestone: M1
      depends_on:
      - TASK-001
      - PROV-001
      - MEM-002
      - GIT-001
    ```
  - `TASK-002` requests worktree provisioning via the Git broker service API (`crates/weave-git`). This satisfies all architectural constraints without creating temporary or bypass code.

- **Option B (Decouple `TASK-002` Acceptance Across Milestones):**
  - Maintain the milestone boundary as written in `workflow/tasks.yaml`.
  - In `TASK-002` (M1), implement packet composition, context assembly, and the client interface to the Git broker.
  - **Hard Boundary:** A mock or directory allocator must **never** be claimed as evidence of real worktree provisioning.
  - Real worktree launch and vertical acceptance of `TASK-002` **remains pending and incomplete** until `GIT-001` is delivered by the Git broker in Milestone M2.

---

### 3.5 DCR-005: M1 Database Migration Ownership & Schema Scope

#### Exact Source Conflict & Missing Scope
- **Machine DAG (`workflow/tasks.yaml`):**
  - `INF-002` (M0): "SQLite store and events", write paths: `crates/weave-store/**`, exclusive resource: `db:migrations`.
  - M1 Tasks: `WF-001` (workflow), `TASK-001` (scheduler), `MEM-001` (memory), `MIG-001` (importer).
- **Scope & Release Discipline Conflict:**
  `docs/DATA_MODEL.md` defines 24 logical entities in Section 1 plus `schema_migrations` in Section 3 (25 total entities). However, implementing all 25 tables in `INF-002` (including M2 verification tables and P1 code-index tables) violates the core MVP-first release discipline mandated by `AGENTS.md` and `START_HERE.md`.
  Conversely, if `INF-002` ships only the M0 tables (`projects`, `events`, `sessions`, `requests`, `schema_migrations`), M1 parallel workers (`WF-001`, `TASK-001`, `MEM-001`, `MIG-001`) will lack database tables and cannot author migrations without colliding on `crates/weave-store/**`.

#### Proposed Implementable Resolution
1. **Scoped Schema for INF-002 (Smallest Complete Set for M0 and M1):**
   Instruct `INF-002` to implement only the **18 database entities** strictly necessary for M0 foundation and M1 coordination:
   - **Core Infrastructure (7):** `schema_migrations`, `projects`, `runs`, `events`, `sessions`, `requests`, `leases`.
   - **Workflow & Scheduling (5):** `workflow_gates`, `tasks`, `task_dependencies`, `task_scopes`, `task_events`.
   - **Memory & Artifacts (4):** `memory_items`, `memory_fts` (FTS5 virtual table), `handoffs`, `artifacts`.
   - **Memex Importer (2):** `import_jobs`, `legacy_mapping`.
2. **Explicit Deferral of Later Entities:**
   - **M2 Verification & Git Tables (4):** `reviews`, `test_runs`, `contracts`, `git_operations` are explicitly deferred from M0/M1.
   - **M3 Code Index Tables (3):** `code_index_revisions`, `code_symbols`, `code_edges` (P1 code graph) are explicitly deferred.
3. **Single-Owner Serial Migration Steps for Later Milestones:**
   - When Milestone M2 begins, author a dedicated migration (e.g. `0002_verification_and_git.sql`) under a single-owner task (e.g. `CON-001` or `GIT-001`) with an authorized `db:migrations` lease, prior to dispatching review/test tasks.
   - When Milestone M3 begins, author `0003_code_index.sql` under task `GRAPH-001`.
   - M1 workers operate strictly as consumers of typed `weave-store` repository interfaces and do not author migrations or compete for `db:migrations`.

---

### 3.6 DCR-006: Plan Shorthand versus Machine-Readable Dependency DAG

#### Exact Source Conflict & Missing Scope
- **Prose Shorthand (`docs/IMPLEMENTATION_PLAN.md` line 55):**
  "Begin `INF-001` → `INF-002`/`INF-003` → `PTY-001` → `PTY-002`/`PROV-001`."
  The slash notation `INF-002/INF-003` implies concurrent execution.
- **Machine DAG (`workflow/tasks.yaml` lines 40-56):**
  `INF-002` depends on `[INF-001]`.  
  `INF-003` depends on `[INF-001, INF-002]`.
- **Plan Table (`docs/IMPLEMENTATION_PLAN.md` line 11):**
  Specifies `INF-003` depends on `INF-001, INF-002`.
- **Contradiction:**
  The prose shorthand at line 55 contradicts both the machine DAG and the plan's milestone table. `INF-003` (IPC endpoint) requires `crates/weave-store` (SQLite event outbox, requests table, session tracking) to log client requests and replay events. Dispathing `INF-003` in parallel with `INF-002` causes immediate build and runtime failures.

#### Proposed Implementable Resolution
1. **Reaffirm Machine DAG Precedence:**
   - Under `AGENTS.md` Rule 1, `workflow/tasks.yaml` is the canonical dependency authority.
   - `INF-003` strictly depends on `INF-002` and must not be dispatched until `INF-002` is accepted.
2. **Documentation Correction:**
   - Update line 55 of `docs/IMPLEMENTATION_PLAN.md` in the next documentation release pass to:
     `INF-001 → INF-002 → INF-003 → PTY-001 → {PTY-002 ∥ PROV-001}`.

---

## 4. Execution Guidance for Active Parallel Workers

### 4.1 Guidance for Rust Implementation Worker (`crates/**`)
- **Assigned Scope:** Strictly `crates/**`. Do not edit root files, `.github/**`, `apps/**`, or `packages/**`.
- **Minimal Bootstrap Deliverables for INF-001:**
  - Create `crates/Cargo.toml` as a self-contained workspace manifest containing:
    - `crates/weave-daemon/`
    - `crates/weave-cli/`
  - In `crates/weave-daemon/src/lib.rs`, declare `pub mod pty;` and `pub mod api;` to establish the M0 seams (DCR-002).
  - Implement honest version/status reporting: return clear `unavailable` or `not_implemented` errors for IPC and PTY calls until those tasks integrate.
  - Do not scaffold empty crates for future milestones (`weave-core`, `weave-git`, `weave-contract`, `weave-provider`, `weave-store`) in INF-001.

### 4.2 Guidance for Desktop Implementation Worker (`apps/desktop/**`, `packages/ui/**`)
- **Assigned Scope:** Strictly `apps/desktop/**` and `packages/ui/**`. Do not edit root files, `.github/**`, or `crates/**`.
- **Minimal Bootstrap Deliverables for INF-001:**
  - Create the Tauri 2 + React + TypeScript shell inside `apps/desktop/`.
  - In `packages/ui/`, create standard layout components and the `<TerminalContainer />` mount slot for later xterm integration.
  - Ensure UI displays honest status: "Terminal sessions unavailable until PTY-001/PTY-002". Do not simulate terminal output or fake agent progress.
  - Run validation: `npm run typecheck` and `npm run build` within `apps/desktop/` and `packages/ui/`.

---

## 5. Remaining Decisions Requiring Coordinator / Owner Approval

1. **Approval of DCR-001:** Authorize `.github/**` write path for `INF-001` CI, and select whether to keep sub-project roots (`crates/Cargo.toml`, `apps/desktop/package.json`) or add root workspace manifests.
2. **Approval of DCR-002:** Confirm module/trait pre-wiring conventions in `INF-001`/`INF-003` and narrow scope amendment protocol for shared manifests.
3. **Approval of DCR-003:** Formally approve the proposed file-based JSON schema validation exception to `AGENTS.md` for M0 task reports before `weave-cli` exists.
4. **Approval of DCR-004:** Choose between promoting `GIT-001` to Milestone M1 Wave 3 (Option A) or keeping `GIT-001` in M2 and deferring `TASK-002` real worktree acceptance to M2 (Option B).
5. **Approval of DCR-005:** Authorize `INF-002` to implement only the 18 M0/M1 entities in `crates/weave-store`, deferring M2/M3 tables to serial migrations.
6. **Approval of DCR-006:** Reaffirm strict serial dependency `INF-001 → INF-002 → INF-003`.
