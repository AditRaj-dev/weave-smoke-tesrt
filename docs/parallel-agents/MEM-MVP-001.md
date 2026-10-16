# MEM-MVP-001 — owner-approved memory-first slice

**Decision:** ADR-011, subsequently extended by ADR-012 for the root `IMPLEMENTATION.md` current starter. **Status:** approved for local memory implementation on 2026-10-16. This packet is a scoped exception to proposed `workflow/tasks.yaml` ordering; it does not mark `INF-002`, `INF-003`, `MEM-001`, `MEM-002`, or `TASK-001` accepted.

**Read set:** `AGENTS.md`, `START_HERE.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/features/F04-MEMORY.md`, `docs/MEMORY_ENGINE.md`, `docs/DATA_MODEL.md`, `docs/PROTOCOLS.md`, `docs/API_RECORD.md`, `contracts/ipc-v1.yaml`, `contracts/schemas/memory-item.schema.json`, and the impacted bootstrap Rust code.

**Allowed writes:** `crates/Cargo.toml`, `crates/Cargo.lock`, `crates/weave-store/**`, `crates/weave-daemon/Cargo.toml`, `crates/weave-daemon/src/api/**`, `crates/weave-daemon/src/main.rs`, `crates/weave-cli/**`, generated `crates/target/**` build/test evidence, `docs/ADR.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/PROTOCOLS.md`, `docs/API_RECORD.md`, and this packet. No Git metadata or secrets.

**Contract pins:** memory-item schema v1; IPC API v1 and frozen method names `project.create`, `project.list`, `memory.query`, `memory.propose`, `memory.promote`, `memory.reject`. CLI additions are recorded in ADR-011 and `docs/PROTOCOLS.md`.

**Acceptance:** Three independent same-machine terminals retrieve the same owner-promoted note with source provenance; default query excludes candidates and rejected items. Versioned migration/restart, concurrent writes, exact-hash dedupe, stale source, malformed/oversize IPC, idempotency, and failure paths have command evidence. Owner promotion requires linked evidence. No task or handoff acceptance claim.

**Verification:** `cargo fmt --all -- --check`, `cargo test --workspace`, and a three-process CLI/daemon smoke test on Windows. Record command, timestamp, exit code, and redacted stdout/stderr artifact. Require independent review before acceptance.

## Implementation handoff (2026-10-16)

```text
TASK_ID: MEM-MVP-001
RESULT: blocked
FILES: crates/Cargo.toml; crates/Cargo.lock; crates/weave-store/Cargo.toml; crates/weave-store/src/lib.rs; crates/weave-store/tests/memory.rs; crates/weave-daemon/Cargo.toml; crates/weave-daemon/src/api/mod.rs; crates/weave-daemon/src/main.rs; crates/weave-cli/Cargo.toml; crates/weave-cli/src/client.rs; crates/weave-cli/src/main.rs; docs/ADR.md; docs/IMPLEMENTATION_PLAN.md; docs/PROTOCOLS.md; docs/API_RECORD.md; docs/parallel-agents/MEM-MVP-001.md
CHANGES: Added daemon-owned SQLite memory store with migration checksum, FTS5, provenance snapshots, scoped query, candidate/review lifecycle, dedupe/idempotency/history, private local JSON-RPC, and WEAVE CLI commands. `weave mem search` aliases the v1 query. Later IMPLEMENTATION.md features that conflict with v1 are deferred by owner decision.
COMMAND_EVIDENCE: cargo fmt --manifest-path crates/Cargo.toml --all -- --check, exit 0, 2026-10-16T11:40:13.3226100Z; cargo test --offline --manifest-path crates/Cargo.toml, exit 0, 2026-10-16T11:40:22.3286667Z (11 tests); cargo clippy --offline --manifest-path crates/Cargo.toml --workspace --all-targets -- -D warnings, exit 0, 2026-10-16T11:40:23.6372435Z. Artifact index crates/target/mem-mvp-evidence/results.json (SHA-256 700f8af2ade49d3bfa1d6ef2e1e6861e63e7216b18bb341155e57801eeff17b0); stdout/stderr paths therein. Three independent PowerShell jobs queried the same promoted note, 2026-10-16T08:07:15.7926326Z, exit 0; artifact crates/target/mem-mvp-evidence/three-shells.stdout.log (SHA-256 044b3f113be738718dd4cb4463214df226bbe85442dcfa60ddbfeb75b52ef4e9).
CONTRACTS: memory-item schema v1; IPC API v1 and frozen project/memory method names; CLI additions and deferrals in ADR-011/012. No machine schema changed.
MEMORY_CANDIDATES: none; local dependency/API facts recorded in docs/API_RECORD.md with evidence, not promoted into shared memory.
BLOCKERS: Independent review remains pending. `weave task report --file examples/task-report.json` exited 2 with NOT_IMPLEMENTED; artifact crates/target/mem-mvp-evidence/task-report.stderr.log. There is no run/task/session registry to accept a truthful machine task report. No Git checkout exists for broker integration.
KNOWN_RISKS: Same-user token and owner identity are cooperative, not an OS worker boundary; private agent memory, contract approval, provider launch, and prompt injection are deferred under the v1 decision.
```
