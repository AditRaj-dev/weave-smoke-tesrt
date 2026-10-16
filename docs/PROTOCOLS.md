# Cross-Agent & IPC Protocols (normative)

## 1. IDs, versions, precedence
- Every JSON artifact validated against `contracts/schemas/*.schema.json`, with integer `schema_version: 1`.
- Use stable `project_id`, `run_id`, `task_id`, `session_id`, `contract_id`, `artifact_id`; task `task_id` is stable within a run.
- `idempotency_key` for every mutation; `expected_version` required for mutating task/gate operations.
- Events are **at-least-once** delivered with globally increasing `seq`. Consumers de-duplicate by `event_id` or `seq`.
- Agent-generated text cannot change status. Only daemon-originated validated events can.

## 2. Spawn → report → verify sequence
```
Coordinator: validate task + approved phase + contract pins
Git broker: provision worktree (lease)
Scheduler: assign task and reserve resources transactionally
Supervisor: spawn real PTY using provider adapter and role packet
Worker: read scoped memory / contracts / symbols via `weave` CLI
Worker: make changes, run checks, write report and handoff
Daemon: validate report/paths/session and store evidence -> handoff_submitted
Reviewer: diff-based verdict (independent session)
Tester: unit/integration/e2e evidence (independent session)
Git broker: verify gates, integrate and record commit
Coordinator: `done`, validate memory candidates and publish snapshot
```

## 3. Task packet
See `contracts/schemas/task-packet.schema.json` and `examples/task-packet.json`. Required: task/role/provider/cwd/worktree, project and run IDs, approved phase, allowed write paths, dependencies, contract hashes/IDs, acceptance criteria, verification commands, memory scope, tool permissions, report destination. Packet is immutable for a session; revision creates a new `packet_version` and task event.

## 4. Task report
Worker must submit `weave task report --file <absolute-or-workspace-path>`; the CLI outputs machine JSON `{ok,report_id,state}` and exits nonzero on validation failure. Report includes exact changed file paths, evidence objects (`command`, `exit_code`, `started_at`, `finished_at`, `artifact_path`, `artifact_sha256`), blockers and memory candidates.
**No stdout parsing:** CLI exit status indicates only report acceptance, not task completion; review/test/integration remain separate.

## 5. Handoff
`weave handoff create --file ...` creates structured summary, artifacts and audience role. Handoff cannot claim accepted work. Receiving agent calls `weave handoff accept <id>`; coordinator may inject approved handoff as bounded role packet context. Handoff IDs stable and source linked. See `examples/handoff.json`.

## 6. Memory
- `weave memory query "<query>" --project <id> --task <id> --scope backend --limit 8 --json`
- `weave memory propose --file candidate.json` (status candidate by default).
- `weave memory promote <id> --evidence <id>` requires validator/owner authority and explicit linked evidence. Rejects conflicts with pinned truth unless approved revision recorded.
- CLI JSON envelope: `{api_version:1,ok:true,data:{...},request_id:"..."}`; errors include `code`, `message`, `retryable`, `details` (non-secret).

## 7. Contract lifecycle
`proposed -> reviewed -> approved -> frozen_in_task -> deprecated`. Never mutate approved schema in place: create new semantic contract version and re-pin affected tasks. Breaking changes invalidate relevant tasks/clients; compatible updates still require test generation. External APIs are independently documented in `docs/API_RECORD.md` with installed version + verification source.

## 8. Review / testing verdict
Reviewer output has `verdict: PASS|FAIL`, schema version, reviewed task and diff hash, findings with severity/path/line/action. `PASS` from same session that implemented task is invalid. Test verdict has exact command, exit code, platform and logs. A reviewer opinion never substitutes for executable tests.

## 9. Error catalog and retry semantics
| Code | Retryable | Meaning/action |
|---|---|---|
| `INVALID_SCHEMA` | No | Rebuild message from referenced JSON schema |
| `VERSION_CONFLICT` | Yes | Re-read current task/gate version |
| `INCOMPATIBLE_PROTOCOL` | No | Update CLI/daemon versions |
| `ACCESS_DENIED` | No | Capability/scope denied; require owner change |
| `MISSING_PROVIDER` | No | Install or select another CLI |
| `PROVIDER_AUTH_REQUIRED` | Manual | Show live terminal and user login |
| `SESSION_INTERRUPTED` | Maybe | Reopen provider with checkpoint if supported |
| `DEPENDENCY_NOT_READY` | Yes | Wait on DAG |
| `LEASE_CONFLICT` | Yes | Queue until resource release |
| `CONTRACT_DRIFT` | No | Re-pin reviewed schema / regen clients |
| `EVIDENCE_MISSING` | No | Supply command/test artifact |
| `REVIEW_FAILED` | No | Bounded fix loop |
| `GIT_CONFLICT` | Manual | Broker emits conflict details, no force resolution |
| `OUTPUT_GAP` | Yes | Read checkpoint log artifact / UI shows gap |

## 10. Supervisor API details
`session.spawn({provider,role,task_id,packet_path,cols,rows})` returns `session_id` or error. `session.attach({session_id,since_seq})` returns session snapshot and replays events. `session.input({session_id,input_b64,control_token})` forwards exact bytes, validates ownership. `session.resize({cols,rows})` validates 1..500 cols and 1..300 rows. `session.stop({graceful_timeout_ms})` attempts termination then process tree kill after timeout, audited. Never accept arbitrary terminal command as local daemon privileged shell command.

## 11. CLI UX (stable surface)
```
weave status --json
weave project list --json
weave project create <path> --name <name> --json
weave task show BE-014 --json
weave task report --file ./report.json
weave handoff create --file ./handoff.json
weave handoff accept h_123 --json
weave memory query "JWT refresh" --project p_123 --scope backend --limit 8 --json
weave mem search "JWT refresh" --project p_123 --scope backend --json  # same v1 query, alias
weave memory propose --file ./memory.json
weave memory reject <id> --reason <text> --json
weave code find authenticateUser --project p_123 --json
weave contract show AUTH-v1 --json
```
Commands unavailable in current milestone MUST return `NOT_IMPLEMENTED` and nonzero exit—not fabricated data.
The root `IMPLEMENTATION.md` examples `weave mem add --scope agent --kind fact` and contract propose/approve are deferred under ADR-012; v1 memory-item enums and RPC names are unchanged.
