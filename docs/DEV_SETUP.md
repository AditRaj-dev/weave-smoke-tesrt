# Developer Setup, Local Configuration, Runbook

## Expected platform
Windows 11 x64 for primary ConPTY acceptance; Rust stable, Cargo, Node LTS, npm/pnpm per implementation lock file, Git, Tauri 2 Windows prerequisites (WebView2 and C++ build tooling), at least one locally installed provider CLI. On macOS/Linux use supported system dependencies but label Windows-only tests pending.

## Repository preparation (instructions, not commands claimed as executed)
1. Clone/copy the Mastermind reference and review its active `SKILL.md`/references; inspect license notices.
2. Create WEAVE implementation repository and place this pack under `spec/` or `docs/requirements/`, keeping versioned schema files readable by CI.
3. Bootstrap Rust workspace, React/Tauri shell, daemon and CLI binaries; pin all versions in lockfiles. Do not indiscriminately install the latest pre-release versions.
4. Test local service start and `weave status --json`; only after this implement PTY session spawn.
5. Prove `session.spawn` with a local shell fixture before enabling provider-specific adapters; then exercise real installed providers.

## Example non-secret configuration
```yaml
schema_version: 1
runtime:
  max_coding_workers: 2
  max_reviewers: 1
  max_testers: 1
  terminal_ring_buffer_bytes: 4194304
  terminal_chunk_bytes: 32768
  git_isolation_mode: cooperative
workflow:
  id: mastermind-v1
  gates_require_human: true
memory:
  retrieval_limit: 8
  retrieval_token_budget: 4000
  imported_memex_db: null
providers:
  claude: { executable: null, enabled: true }
  codex: { executable: null, enabled: true }
  gemini: { executable: null, enabled: true }
```
`executable: null` means auto-detect and verify, not assume installed. Keep secrets out of checked-in YAML. Paths resolved from OS app-data/project configuration (no hardcoded usernames).

## Developer commands (targets; adjust to actual workspace scripts)
```
cargo test --workspace
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
npm run typecheck
npm run test
npm run build
```
Only advertise commands after package manifests actually define them. Provide scripts or Makefile equivalents for `dev`, `test`, `integration`, `windows-pty-smoke`, `package`, `schema-validate`, `memex-import-fixture`.

## Recovery runbook
- **UI frozen:** confirm daemon health; reattach with event cursor, do not kill live sessions by default.
- **Daemon crashed:** run migrations/read-only audit; mark old sessions interrupted; resume from checkpoint in new PTYs when provider supports.
- **Git transaction incomplete:** inspect `git_operations` journal, compare actual repo `HEAD`/branches before retrying; never blindly replay merge.
- **Memory conflict:** keep candidate and canonical decision; request validation, do not overwrite.
- **Contract drift:** regenerate types, alert affected tasks and invalidate incorrect evidence.
- **SQLite corruption:** stop daemon, backup DB, recover from last verified backup and event/artifact projections; never run auto-destructive repair without owner confirmation.

## Packaging
Install a per-user daemon and CLI with Tauri app, install/start daemon on first launch with opt-in persistent behavior and clear stop control; cleanup ownership records on uninstall but **do not silently delete project repos or memory archives**. Platform signing, update channel, auto-update and remote telemetry are later release tasks, not hidden defaults.
