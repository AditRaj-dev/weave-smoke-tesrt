# Architecture Decision Record (ADR) Log

All items are *proposed implementation defaults*, not proof of user sign-off or production verification.

## ADR-001 — Native GUI vs terminal-only
**Decision:** Tauri 2 + React + TypeScript + xterm.js. **Why:** lightweight native cockpit with real terminal rendering and Rust backend. **Alternative:** Electron/Node PTY; reconsider if Windows ConPTY stability or packaging proves poor. **Validation:** M0 performance and Windows acceptance.

## ADR-002 — Daemon owns PTYs
**Decision:** companion long-lived supervisor, not Tauri window. **Why:** GUI reload/reconnect without losing child sessions. **Caveat:** daemon crash loses PTY master; only provider resume and checkpoint can recover workflow.

## ADR-003 — One SQLite canonical database
**Decision:** native daemon-owned SQLite WAL; import legacy Memex idempotently. **Why:** no dual-writer disagreement; structured transactions/provenance; FTS5 is cheap. **Alternative:** preserve Node Memex as separate process (rejected as a second source of truth). **Risk:** Rust migration complexity.

## ADR-004 — CLI first, MCP second, hooks third
**Decision:** CLI for all shell-capable models with structured JSON; MCP optional adapter to same API; hooks opportunistic. **Why:** provider-neutral protocol and lower coupling.

## ADR-005 — Deterministic control services
**Decision:** scheduler, Git broker, memory validator policy, artifact store are deterministic; agents supply judgment with evidence. **Why:** prevent LLM nondeterminism in critical states.

## ADR-006 — Preserve Mastermind gates and h2r
**Decision:** all phases and approval semantics retained, including conditional 7.5; fresh CLI automatically started after gate rather than manual paste. **Why:** quality discipline without context bloat.

## ADR-007 — Contract-first FE/BE
**Decision:** versioned approved internal schemas, generated types and mocked frontend clients. **Why:** eliminate invented endpoint/field drift.

## ADR-008 — Cooperative Git controls first
**Decision:** restrict by policy + worktree + validation in MVP, label `cooperative`, conduct hardening spike; never call policy enforcement an OS sandbox. **Why:** Windows .git metadata and shell bypasses require separate proof.

## ADR-009 — FTS5 before embeddings
**Decision:** start lexical/provenance + symbol graph; evaluate embeddings on failures in P2. **Why:** lower complexity, cost and risk of stale semantic facts.

## ADR-010 — Windows-first testing
**Decision:** real ConPTY and installed CLI acceptance on Windows; other platforms follow. **Why:** target development environment; cross-platform abstraction alone cannot prove platform behavior.

## ADR-011 — Owner-approved memory-first implementation slice (2026-10-16)
**Decision:** Build a same-machine `weave memory` vertical slice in this pack before the proposed `INF-002`/`INF-003`/`TASK-001` dependency chain. This is the owner's explicit exception for this slice, not approval of the rest of the proposed DAG. The slice includes daemon-owned SQLite, private local IPC, project registration, and memory query/propose/promote/reject. Task report, handoff, managed PTY session identity, Memex import, and remote sync remain outside it. **Authority:** user request and approved implementation plan in this chat. **Security limit:** same-user terminal attribution and owner promotion are cooperative until managed session/role isolation exists; never present them as enforced worker separation. **Location:** the existing pack directory, which is not currently a Git checkout. **Contract change:** add `weave project create <path> --name <name> --json` and `weave memory reject <id> --reason <text>` to the CLI surface; use existing v1 RPC method names. **Validation:** file-level scope audit, recorded command evidence, and independent review; no Git integration claim.

## ADR-012 — Current starter from IMPLEMENTATION.md (2026-10-16)
**Decision:** The owner redirected implementation to the `Current starter` milestone in root `IMPLEMENTATION.md`. Continue the already-built memory foundation. Its `weave mem search` example is an alias for v1 `memory.query`. Its `mem add --scope agent --kind fact` example conflicts with memory-item schema v1 (`agent` and `fact` are not valid enum members). Contract propose/approve endpoints and a headless launch method are absent from frozen M0/M1 RPC names. The owner explicitly chose to keep v1 and defer these conflicting features; do not silently map values or expand the schema in place. The document's Node/WSL2 PTY path is a future alternative to the pack's Windows-first Rust PTY design, not part of this starter slice. The current local memory CLI remains usable while those contract decisions are deferred.
