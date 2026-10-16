# WEAVE — Start Here for the Coding Agent

**Version:** 1.0 proposed specification (2026-10-13)  
**Status:** SPECIFICATION ONLY; nothing in this pack is evidence of an implemented feature.  
**Origin:** Mastermind https://github.com/AditRaj-dev/masterminmd and `WEAVE_Mastermind_Native_Integration_Blueprint.md`.

## Your mission
Build a **local-first native desktop orchestration system** that runs existing AI CLIs in **real PTYs**, converts the Mastermind skills into an executable gated workflow, coordinates independent coding/design/research/review/testing agents, stores validated shared memory and code references, and integrates reviewed output using an auditable Git broker. Do NOT create a simulated-agent chat UI or a shell-command wrapper that masquerades as a PTY.

## Read order (mandatory)
1. `AGENTS.md` — hard constraints for every coding agent.
2. `docs/PRD.md` — product behavior, scope, roles, acceptance criteria.
3. `docs/ARCHITECTURE.md` — components, source of truth, IPC, processes.
4. `docs/MASTERmind_INTEGRATION.md` — exact preserved workflow semantics.
5. `docs/IMPLEMENTATION_PLAN.md` + `workflow/tasks.yaml` — dependency-ordered work.
6. Then only the spec(s) for the task: `docs/features/F*.md`, associated schemas and protocols.
7. Before touching external libraries or CLI flags: `docs/API_RECORD.md` and locally installed official help/types.

## Fixed decisions / no improvisation
- **Platform:** Tauri 2 / React / TypeScript UI; Rust-based supervised process runtime; Windows first, macOS/Linux later. Use `xterm.js` as presentation only.
- **Supervisor:** separate long-lived local process owns sessions; GUI can disconnect/reconnect; supervisor crash does *not* imply recoverable PTY, only restart/replay with provider resume if supported.
- **Storage:** one SQLite database (WAL, migrations, FTS5), accessed through coordinator. Existing Mastermind Memex data is imported idempotently, not operated as a competing source of truth.
- **Agent interfaces:** PTY provider adapters; task packet / task report / handoff are canonical; CLI is universal tool transport. MCP is a bridge; hooks are optional signals.
- **Workflows:** preserve Mastermind phases 0–9 (including conditional 7.5) and user approval gates; WEAVE automates creation of fresh CLI sessions after approval, not gate bypass.
- **Git:** dedicated Git broker performs mutations. Until isolation is demonstrated, mark worker Git restrictions `cooperative`, NEVER `enforced`.
- **Contracts:** shared HTTP/event schemas generated to frontend/backend types. `docs/API_RECORD.md` records verified external APIs; never invent an endpoint or vendor flag.
- **Non-LLM services:** scheduler, memory store, graph indexer, Git broker, and session registry are deterministic programs; LLMs are used for judgments/research/code/design/reviews.

## Initial implementation boundary
Build M0 and M1 before attempting the full agent roster:
1. A native application can open **three real, independent PTY sessions** with correct input, resize, exit status, auth prompt visibility, and logs.
2. Supervisor survives UI close/reopen; session events resume from last sequence.
3. Persist project, run, phase, task and session metadata with a migration-tested SQLite schema.
4. `weave` CLI connects to local supervisor, returns JSON envelopes, and can read task/status/memory.
5. First vertical slice: two worker tasks (FE and BE against frozen contract), reviewer, tester, Git integration, explicit evidence.

## Suggested repository structure (create in the actual implementation repo)
```
apps/desktop/               # Tauri shell and React UI
crates/weave-daemon/         # PTY and local IPC server
crates/weave-core/           # orchestration domain, scheduler, policy
crates/weave-store/          # sqlite/migrations/fts
crates/weave-provider/       # provider adapters + capability probing
crates/weave-git/            # exclusive Git broker
crates/weave-contract/       # schema/generator validation
crates/weave-cli/            # command line client
packages/ui/                # React components, xterm rendering
packages/contracts/         # generated TS types from versioned schemas
workflow/                   # shipped Mastermind workflow definition
```
The exact workspace crate split is an implementation choice **only if** import boundaries in `docs/ARCHITECTURE.md` are maintained. Do not create a monorepo unless the actual repository is ready for it.

## Exit condition for every task
- Task report validated against `contracts/schemas/task-report.schema.json`.
- Diff limited to approved path scope (or a separate explicit scope-change event).
- Independent review PASS and required command/test evidence PASS.
- Git broker records integration hash and emits an auditable event.
- Never label a task `done` because a CLI printed "done".

## Known unknowns to verify on the developer machine
- Provider executable versions, flags, terms and instruction-file precedence.
- Windows ConPTY behavior of chosen Rust PTY library; resize/kill and Unicode handling.
- Git sandbox/ACL behavior on native Windows; OS-level isolation is NOT assumed.
- Licenses and attribution for any bundled material imported from Mastermind.

## Documents in this pack
- **Product:** `docs/PRD.md`, `docs/features/`, `docs/UI_UX.md`
- **Architecture:** `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/PROTOCOLS.md`, `docs/MEMORY_ENGINE.md`, `docs/PROVIDER_RUNTIME.md`, `docs/GIT_SECURITY.md`, `docs/CODE_GRAPH.md`
- **Workflow:** `docs/MASTERmind_INTEGRATION.md`, `workflow/mastermind.yaml`, `workflow/tasks.yaml`, `config/roles.yaml`
- **Execution:** `docs/IMPLEMENTATION_PLAN.md`, `docs/TEST_PLAN.md`, `docs/DEV_SETUP.md`, `docs/ADR.md`, `docs/API_RECORD.md`
- **Machine contracts:** `contracts/schemas/*.json`; realistic reference messages in `examples/`
- **Agent instructions:** `AGENTS.md`, `prompts/`; templates in `templates/`

## Implementation protocol
Do not implement the entire roadmap in one giant PR. Start with task `INF-001` in `workflow/tasks.yaml`; add tests before declaring it complete. Report what actually ran and what did not. In environments without a native Windows host, write the cross-platform code and mark ConPTY acceptance **unverified**.
