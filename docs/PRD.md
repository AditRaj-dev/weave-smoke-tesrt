# Product Requirements Document — WEAVE

**Document ID:** WEAVE-PRD-001  
**Version:** 1.0 · 2026-10-13 · Proposed for user approval  
**Owner:** Product / Lead Orchestrator  
**Status:** Build-ready proposed baseline, not user-sign-off  
**References:** `START_HERE.md`, `docs/ARCHITECTURE.md`, `docs/MASTERmind_INTEGRATION.md`, `workflow/mastermind.yaml`

## 1. Problem
Claude Code, Codex, and Gemini CLI are strong independent development tools, but users cannot reliably coordinate many interactive sessions into **one proven engineering outcome**. Context fragments; unverified claims spread across agents; frontend invents endpoints; file modifications conflict; human cannot see which tasks, reviews, or commits are truly accepted. Existing Mastermind offers a rigorous document-first, human-gated process, but execution depends on provider-native subagents and manual handoffs.

## 2. Vision
**WEAVE** is a native local-first engineering control plane that runs provider CLIs in visible real PTYs, divides an approved engineering workflow into safely parallelizable tasks, provides scoped provenanced memory and machine-checked contracts, and assembles verified changes under one Git authority. One orchestration brain, many independent terminal workers, one evidence trail.

## 3. Users and roles
| Persona | Main need | Access |
|---|---|---|
| Solo builder / product owner | Plan, approve, watch, interrupt, inspect | Full local project owner |
| Team lead | See DAG, design/contract status, reviews | Owner/editor later; not MVP multiuser |
| Coding worker CLI | Receive scoped task, use tools, report evidence | Assigned workspace only by policy; OS enforcement separately tracked |
| Designer / researcher CLI | Design/research within declared scope | Design/research artifacts |
| Reviewer / tester / browser QA CLI | Challenge claims, produce verdict/evidence | Read-only code + test sandbox |
| Git broker (service) | Integrate approved work safely | Git mutations, audit required |

## 4. Core user journey
1. User selects or imports local project (including Mastermind project), chooses CLI provider availability, sets limits.
2. WEAVE restores the Mastermind workflow phase/gates, existing docs and Memex history where relevant.
3. Orchestrator conducts discovery → PRD → specs → plan → verified API registry → design → mockups → conditional HTML-to-React → build → wrap, **with approval gates**.
4. Task Manager creates a DAG and identifies parallel-safe work by paths/contracts/resources.
5. Git broker creates isolated worktrees. Supervisor spawns real PTY sessions using provider-specific instruction adapter; task packet carries frozen context and allowed scope.
6. Each agent reads approved docs/memory/contracts via CLI, edits scoped files, emits report/evidence/handoff.
7. Independent reviewer/tester/browser agent verifies; Git broker integrates passing changes and runs post-integration checks.
8. UI displays progress, terminals, event timeline, memory and code graph, contract versions, approvals and cost/rate info when reliable.
9. User chooses wrap action: merge, PR, keep, discard (destructive actions require confirmation).

## 5. MVP scope: P0 (must have)
**F01 Terminal sessions** — Spawn, input, resize, stop, exit, reconnect GUI to daemon-owned PTYs; Claude/Codex/Gemini configurable adapters; preserve raw terminal behavior.

**F02 Mastermind workflow engine** — Document/gate state machine with phase 0–9 and conditional 7.5, phase artifact validation, approval/revision/pause/checkpoint, auto fresh-session handoff after gates.

**F03 Task DAG & concurrency** — Persistent tasks with dependencies, resource/file leases, bounded worker pool, per-task worktrees, report/hand-off states, bounded retries/escalation.

**F04 Memory engine** — One versioned SQLite source of truth with FTS5 search, scopes, provenance, verification status, structured handoffs, import from Memex, `weave memory` CLI.

**F05 Provider abstraction** — Detection, versions/capabilities, instruction packet, working directory/environment safety, interactive login prompts visible; no hardcoded assumptions about flags.

**F06 API/contract registry** — `API_RECORD.md` for verified external APIs; versioned OpenAPI/JSON Schema for internal interfaces; generated TS bindings and compatibility gates.

**F07 Review, tests, and Git broker** — independent diff review, required verification evidence, staged integration and rollback, per-task commit, user-confirmed push/merge/discard.

**F08 Desktop cockpit** — Project/gate summary, DAG, terminal tabs, task/detail panel, review/test evidence, activity feed; read/write actions with confirmation.

## 6. P1 / P2 later
P1: tree-sitter symbol graph with file/line range and import edges; incremental indexing; Playwright browser QA with screenshot and console evidence; design preview integration; token/cost visibility when providers expose credible data; worktree privilege hardening on supported OSes; richer audit search.

P2: embeddings and hybrid semantic search after evaluation; configurable workflow/role plugins; remote workers; multiuser access; hosted sync; team permissions; visual office/3D surfaces. Not MVP blockers.

## 7. Explicit non-goals for MVP
- Building or training foundation models or replacing Claude/Codex/Gemini CLI.
- Pretending one universal system prompt flag works with every provider.
- Invisible headless-only automation masquerading as interactive sessions.
- Using a single global chat transcript as memory.
- Allowing workers unrestricted direct Git integration.
- Auto-pushing/merging without owner approval.
- Autonomous production deployments, credential scraping or arbitrary remote administration.
- Guaranteeing PTY recreation after supervisor process crash.

## 8. Functional requirements (IDs are normative)
| ID | Requirement | Acceptance summary |
|---|---|---|
| FR-01 | Launch actual OS PTYs | 3 concurrent interactive CLIs in separate CWDs, input/resize/kill isolated |
| FR-02 | Reattach GUI to supervisor | Reload UI and replay missed events by sequence without losing a living daemon-owned process |
| FR-03 | Versioned workflow phases | All Mastermind gates mapped and phase 7.5 conditional; cannot advance without approval except explicitly non-gated transitions |
| FR-04 | Persistent typed task DAG | Dependencies/cycles validated; no running blocked tasks; optimistic versions |
| FR-05 | Safe parallel scheduler | File/resource conflict serializes; no same worktree shared by writers |
| FR-06 | Structured task report | JSON schema checked; arbitrary stdout can't complete task |
| FR-07 | Provider-specific boot | Capability detection + traceable instruction files and controlled startup |
| FR-08 | Scoped memory retrieval | Provenance and validation state included; candidates cannot overwrite pinned truth |
| FR-09 | Memex import | Dry-run, backup, import, dedupe, rollback, idempotent rerun |
| FR-10 | Freeze interface contracts | FE and BE consume same version; invented endpoint rejected |
| FR-11 | Independent review & test | Cannot integrate missing/failing verdict; evidence includes command/exit/time/artifact |
| FR-12 | Brokered Git workflow | Integration auditable; destructive actions gated |
| FR-13 | UI task transparency | Show task source, assignee, state, blockers, attempts, evidence, approval buttons |
| FR-14 | Structured recovery | Daemon restart recovers metadata and marks unrecoverable PTYs interrupted, offers provider resume where supported |
| FR-15 | Offline/local operation | Core UI/session/task/memory flows work without WEAVE cloud; provider login/network still provider-dependent |
| FR-16 | Code graph (P1) | Search symbol returns concrete location+revision; stale indexes are visibly invalidated |
| FR-17 | Browser QA (P1) | Playwright reports screen/console/network evidence, with user-approved browser policy |
| FR-18 | Audit and privacy | Redact secrets in persisted logs and evidence; retention controls and exports |

## 9. Nonfunctional requirements
- **Target:** Windows 11 x64 first; macOS/Linux parity tracked, not silently declared complete.
- **Reliability:** Transactional task transitions, durable event log, idempotent write requests, no success from plain PTY text.
- **Latency targets (local, excluding provider launch):** UI input echo <150ms p95 under normal load; task state projections <500ms; scoped FTS lookup <300ms for realistic small/medium project on reference machine. These are targets to benchmark, not claims.
- **Resource constraints:** default max 2 coding workers + 1 reviewer + 1 tester, user configurable; ring buffer of 4 MiB/session, durable terminal output opt-in bounded retention.
- **Data limits:** max 32 KiB terminal event chunks; JSON command max 1 MiB (larger artifacts use files); memory retrieval default 8 results/approx. 4k tokens.
- **Accessibility:** full keyboard tab navigation, visible focus, screen-reader labels for controls, terminal scrollback with copy and search.
- **Security:** project-local subprocesses trusted only per configured policy; known risky actions require approval; no secrets in events or generated docs.
- **Portability:** paths based on OS app data; no hardcoded user directories.
- **Observability:** event IDs, span/task/session IDs, failure reasons; metrics for accepted tasks, retries, wall time, review failures.

## 10. Acceptance scenarios (release gates)
**AC-01** After three PTYs start, each accepts input and Unicode independently, CWD differs, terminal resize works, exit codes captured; unavailable CLI is shown as unavailable rather than simulated.

**AC-02** User closes and reopens desktop window while daemon survives; streams resume using event cursor and no duplicate task transition occurs.

**AC-03** User declines a phase gate; phase does not advance, no next-phase agent spawned, previous artifacts retained.

**AC-04** Backend worker publishes verified auth contract; frontend in separate worktree receives exact route/types; attempt to call `/api/login-v2` when only `/api/auth/login` is approved fails contract gate.

**AC-05** One backend and one frontend task pass review and tests; Git broker integrates them one at a time. Forced test failure blocks integration and preserves branch state.

**AC-06** Worker report says "done" but lacks required evidence: task remains handoff/review-incomplete; UI displays missing checks.

**AC-07** Candidate memory contradicts locked decision: never promoted automatically, old decision remains pinned and conflict appears for adjudication.

**AC-08** Memex fixture import run twice yields same memory/handoff/task counts and preserves original DB backup.

**AC-09** Supervisor killed unexpectedly: orphan handling logged; task marked interrupted; UI does not falsely show PTY as live; if provider resume available, resume from checkpoint.

**AC-10** Native Git restriction test explicitly distinguishes cooperative policy from OS-enforced restriction. Product must not claim "exclusive" enforcement without OS-level evidence.

## 11. Success metrics
North-star: **accepted, integrated, regression-tested tasks per hour of human attention**, tracked alongside tokens/cost when reliable. Supporting: lead time (ready→integrated), retry rate, contract drift incidents, escaped regressions, duplicate memory rate, human approval time, agent CPU/memory load. Do not optimize raw agent spawn counts.

## 12. Dependencies, policy, open choices
Dependencies: locally installed provider CLIs, Rust/Tauri toolchain, Node for UI and Memex migration, Git executable, platform PTY support. Local agent binaries retain their own vendor authentication and model limits. Open choices requiring measurement: actual terminal library on Windows; provider instruction bootstrap precedence; sandbox mechanism; optional code-graph implementation. See `docs/ADR.md`.
