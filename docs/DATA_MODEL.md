# Data Model and Migration Design

**Store:** daemon-owned SQLite, WAL + foreign keys, `busy_timeout` 5000ms initially; use migrations tracked in `schema_migrations` with checksum and timestamp. All writes transactional. UUIDv7-like IDs or random UUIDs; do not use source-native integer Memex IDs as globally unique canonical keys. Timestamps RFC3339 UTC with microseconds or RFC3339 millisecond precision, consistent everywhere.

## 1. Tables (normative logical entities)
| Table | Essential fields and constraints |
|---|---|
| `projects` | id PK, canonical_path UNIQUE, display_name, created_at, updated_at, version |
| `runs` | id PK, project_id FK, workflow_id/version, current_phase, state, concurrency_limit, start/end, version |
| `workflow_gates` | id, run_id, phase_id, artifact_hashes_json, state, approved_by, approved_at, notes, UNIQUE(run_id,phase_id,revision) |
| `tasks` | id PK, run_id FK, external_id, title, domain, phase_id, status, task_version, priority, assigned_session_id, worktree_id, attempt, max_attempts, contract_pins_json, created/updated, UNIQUE(run_id,external_id) |
| `task_dependencies` | run_id, task_id, prerequisite_id, required_state; UNIQUE(task_id,prerequisite_id); reject cycles |
| `task_scopes` | task_id, mode read/write/resource, pattern, UNIQUE(task_id,mode,pattern) |
| `task_events` | event_id, task_id, from/to state, reason, actor_id, evidence_id, created_at; append only |
| `sessions` | id PK, run_id, task_id nullable, provider, detected_version, adapter_version, role, cwd, pid nullable, lifecycle_state, exit_code, isolation_mode, started/ended, metadata_json |
| `leases` | id, resource_key UNIQUE when active, task_id, session_id, expires_at, state, acquired_at; expired leases audited before release |
| `events` | global seq INTEGER PRIMARY KEY AUTOINCREMENT, event_id UNIQUE, api_version, kind, project/run/task/session ids, ts, payload_json, payload_hash |
| `requests` | idempotency ledger: client_id+method+key UNIQUE, request_hash, result_json, created/expires; reject same key reused with different payload |
| `memory_items` | id PK, project_id, task_id nullable, scope, domain nullable, kind, status, content, source_kind/path/commit/line, authored_by, verified_by, supersedes_id, content_hash, created/updated, sensitivity |
| `memory_fts` | FTS5 external-content or mirrored index on memory title/content; reindex on migration; ensure rollback parity |
| `handoffs` | id PK, run_id, task_id, from_session, to_role, summary, status, artifact_manifest_json, created/accepted, schema_version |
| `artifacts` | id PK, project/run/task ids, kind, path, sha256, size_bytes, created_by, created_at, redaction_state, retention_policy |
| `reviews` | id PK, task_id, reviewer_session_id, diff_artifact_id, verdict PASS/FAIL, findings_json, policy_version, created_at |
| `test_runs` | id PK, task_id, runner_kind, command, exit_code, started/finished, stdout_artifact_id, stderr_artifact_id, environment_hash, verdict |
| `contracts` | id, project_id, kind, version, status proposed/approved/deprecated, schema_path/hash, created_by, approved_by; UNIQUE(project_id,id,version) |
| `git_operations` | id, run_id, task_id, kind, before_sha, after_sha, request_id, approval_id, outcome, audit_json, timestamp |
| `code_index_revisions` | project_id, revision, indexed_at, index_status, tool_version, source_paths_hash |
| `code_symbols` | symbol_id, project_id, revision, path, language, kind, name, start_line/end_line, container, signature, hash |
| `code_edges` | project_id, revision, from_symbol_id, to_symbol_id, kind (imports/calls/references) |
| `import_jobs` | id, source_kind, source_path_hash, source_db_hash, state, started/finished, report_json |
| `legacy_mapping` | source_kind, source_hash, source_table, legacy_id, canonical_id; composite UNIQUE for idempotency |

## 2. Minimum DDL indexes/constraints to implement first
- Foreign keys ON; UNIQUE(project canonical path); UNIQUE(run_id,task external id); UNIQUE(event_id), monotonic seq; UNIQUE active resource key via partial index; `(project_id,scope,status)` index on memory.
- CHECK task state in enum, `attempt <= max_attempts` where appropriate, `length(content)` bound for memory.
- No free-form blob of terminal output in `events`. Terminal output is a bounded chunk artifact stream; event table references artifact/chunk where useful.
- `memory_items.status = validated` requires non-null verified_by and provenance or explicit human attestation; `pinned` is a separate project-truth classification, not auto assigned by model confidence.
- Canonical doc projection uses artifact content hashes, not silently mutable file reads.

## 3. Example SQL migration skeleton
```sql
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  checksum TEXT NOT NULL,
  applied_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  canonical_path TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS events (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  api_version INTEGER NOT NULL,
  kind TEXT NOT NULL,
  project_id TEXT,
  run_id TEXT,
  task_id TEXT,
  session_id TEXT,
  ts TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  payload_hash TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_run_seq ON events(run_id, seq);
```
The rest of DDL should be authored as reviewed numbered migrations—not dynamically invented by migration runner.

## 4. Transaction boundaries
- **Schedule:** acquire task row with expected version, reserve resource leases, assign session, append task event, commit. Spawn provider only *after* durable assignment; on spawn failure release leases and set failed/ready via transaction.
- **Task report:** validate report schema; verify matching session/task; persist report artifact/hash and `handoff_submitted` transition together; request can retry safely.
- **Promotion:** update candidate status + verification provenance, append `memory.promoted`, invalidate cached retrieval views in same logical operation.
- **Integration:** git operation executes outside SQLite transaction (external side effect). Use journal states `planned -> executing -> committed|failed`; on reboot reconcile actual Git hashes before updating task state. NEVER hold long SQLite write lock while running Git commands.

## 5. Memex import strategy
Source historical `memex/lib.js` uses `node:sqlite` and tables for memories/handoffs/tasks; inspect actual local schema before migration; do not assume an undocumented column always exists. Open source DB read-only, make backup, parse rows into new entities in staging. Set `source_kind=legacy_memex`, `legacy_unverified=true` for accepted statuses without proof. Use `legacy_mapping` to preserve identities and skip duplicates. Run dry-run diff + copy DB verification; do not delete source. Export existing `MEMORY.md`/`HANDOFF.md` alongside imported entries.

## 6. Security and retention
Local logs/evidence/artifacts stay under per-user app data with restrictive permissions. Secrets redacted where known; raw PTY stream shown live must not automatically be retained forever. Default artifacts 14-day retention for terminal chunks, user-configurable; auditable verification artifacts retained with run unless manually purged. Clear, explicit export/deletion controls; never store vendor login cookies or API tokens in memory items.
