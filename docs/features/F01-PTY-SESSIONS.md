# F01 — Interactive PTY Sessions

**Priority:** P0 · **Deps:** INF-001/002/003, PTY-001/002 · **Owner:** Runtime engineer

## Behavior
User starts a selected installed CLI from Project dashboard. Daemon probes adapter, creates `session_id`, validates resolved worktree CWD, creates actual ConPTY/POSIX PTY with supplied terminal cols/rows, starts process, emits `session.started`. Terminal renders raw ANSI/UTF-8 in xterm.js. Input goes to **selected controlled session only**; resize sends actual PTY resize. User can stop with grace+kill; daemon records exit code and stream end. Closing UI does not terminate daemon-owned processes. UI reopens and requests session snapshot+events after cursor.

## States
`requested`, `spawning`, `running`, `auth_required` (human-labeled, not blindly scraped), `stopping`, `exited`, `failed`, `interrupted`, `unavailable`. `auth_required` may coexist with `running` in UI state; no synthetic provider auth handling. Concurrent sessions separate output buffers and cwd.

## Rules/errors
Missing executable → `MISSING_PROVIDER`; invalid CWD → `ACCESS_DENIED`; PTY spawn error → `SESSION_SPAWN_FAILED`; unsupported terminal size → `INVALID_SCHEMA`; daemon crash → new `interrupted` metadata on restart. Terminal gap event for bounded log overflow. User input requires control token. Cannot mark task done from process exit/terminal output.

## Data
`session`, `session_events`, `terminal_chunk_artifact` with retention. No password capture into telemetry. Stream live raw, persisted redacted version separate.

## Tests
3 real OS PTYs (unique CWD+Unicode), input isolation, resizing, exit handling, provider auth prompt, GUI reattach, daemon kill, output >4 MiB gap reporting; Windows ConPTY required for release.
