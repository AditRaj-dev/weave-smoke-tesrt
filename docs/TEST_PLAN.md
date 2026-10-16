# WEAVE — Test and Verification Plan

## Testing policy
Automated tests cannot claim native Windows ConPTY behavior without running on Windows. Each acceptance entry stores platform, actual command, exit code, started/finished timestamps, stdout/stderr artifact hash, commit/revision and test fixture identity. Human visual checks separate from automated proof.

## Test pyramid
**Unit:** state transitions, DAG cycles, glob collision conservatism, memory status promotion/conflict, schema validation, event dedupe, request idempotency, contract version compatibility, output-buffer bounds, provider argument construction and safe environment.

**Component:** SQLite migration/import rollback, session supervisor against a known local shell test executable, provider capability negotiation with fake versions, Git broker against temporary fixture repo, TS frontend event projection/terminal ownership, generated binding compile test.

**Integration:** local socket client/daemon with event replay, CLI memory propose→validate→query, task packet spawn→handoff→review→test→commit, contract-generated FE/BE mock/full flow, failed merge/test rollback.

**E2E:** actual installed Claude/Codex/Gemini CLIs in ConPTY, login prompt flow, multiple sessions + UI reload, simulated supervisor crash, plan gate approvals, browser QA on a local fixture (P1).

## Required scenarios
| Test | Expected result | Priority |
|---|---|---|
| No CLI executable found | visible unavailable + no fake session | P0 |
| 3 PTYs, unique CWD/input, Unicode and colors | independent, correct output and resize | P0 |
| UI closes but daemon survives | PTYs remain and event cursor reconnects | P0 |
| Daemon killed | metadata restored, sessions interrupted, no false live flag | P0 |
| Approve gate with missing artifact | rejected `EVIDENCE_MISSING` | P0 |
| Phase 7.5 on non-React project | marked skipped with reason, not omitted silently | P0 |
| Dependency DAG cycle | reject graph change | P0 |
| Two workers write same file glob | cannot run simultaneously | P0 |
| Report omitted evidence | `handoff_submitted` rejected or not progressed | P0 |
| Reviewer from same implementer | rejected | P0 |
| Test failure | broker cannot integrate | P0 |
| API mismatch `/api/login-v2` | contract CI gate fails | P0 |
| Memex import twice | same canonical row counts | P0 |
| Candidate contradicts pinned truth | no promotion absent owner approval | P0 |
| IPC outdated api version | incompatible error, not silent drift | P0 |
| Event replay duplicate | stable UI state via seq dedupe | P0 |
| Worktree outside-scope edit | reject integration; record attempted violation | P0 |
| Worker `git` command | classify policy vs OS enforcement accurately | P0 security report |
| Post-integration test regression | revert/abort integration and preserve evidence | P0 |
| 100-file symbol navigation | exact source location / stale status | P1 |
| Browser screenshot with console failure | FAIL, not PASS | P1 |

## Concurrency/fault injection
- 10 task transitions racing on same `task_version`; only one CAS succeeds per version.
- 100 event consumers disconnect/reconnect with cursor replay and no lost task status.
- 3 workers propose same memory hash; one canonical item or deduped linked candidates.
- Kill daemon between broker `planned` and `committed` and reconcile actual Git state.
- Force delayed provider `exit`, timeout on child tree kill, and output burst >4MiB to test gap event/backpressure.
- Simulate disk full during artifact persist, import migration error, corrupt source Memex DB.

## Performance and regression targets
Mark target rather than claimed result. Measure local status RPC <500ms p95 on representative project, UI terminal input echo <150ms p95 under 3 active terminals, scoped FTS5 query <300ms p95 for 50k memory items on reference machine (machine spec recorded), no unbounded RAM growth after one-hour PTY output burst. Track exact results.

## Artifact manifest format
Evidence JSON includes `task_id,runner,command,platform,exit_code,started_at,finished_at,stdout_path,stderr_path,stdout_sha256,stderr_sha256,revision,environment_hash`. Each report/approval references artifact hash, not merely free-text `passed`.

## Sign-off worksheet
PRD AC-01..AC-10: status `PASS|FAIL|UNTESTED|DEFERRED`, platform, proof path/sha and owner approval. Release cannot say "complete" if any P0 remains untested/deferred without written exception.
