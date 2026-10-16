# API and External Dependency Verification Ledger

**IMPORTANT:** This ledger is an initial checklist, **not an assertion that API signatures were locally verified**. The coding agent MUST verify installed versions, signatures, and behavior using local CLI help/types + authoritative docs before marking VERIFIED. In Mastermind, use of an unlisted API is a review failure.

| Package/API | Intended use | Verification status | Required evidence |
|---|---|---|---|
| Tauri 2 API | Native desktop commands/window lifecycle | TO VERIFY | actual Cargo/npm versions, API signatures, local compiling example |
| `xterm` / `@xterm/addon-fit` | Interactive terminal rendering and resize | TO VERIFY | current package types and smoke test |
| Rust PTY crate (`portable-pty` candidate) | Windows ConPTY/POSIX PTY, spawn/io/resize | PARTIAL: isolated Windows spike only | daemon-owned lifecycle, multi-session isolation, cancellation, and reconnect evidence remain required |
| `rusqlite` candidate | SQLite WAL, FTS5, migrations | TO VERIFY | crate feature flags and SQLite bundled version |
| `serde`, `serde_json` | Structured RPC/schema | TO VERIFY | installed Cargo versions and build |
| Rust async runtime (Tokio candidate) | IPC and supervisor event processing | TO VERIFY | actual async API signatures + cancellation test |
| `git` CLI | Worktree, diff, merge, commit | TO VERIFY | installed Git version, worktree behavior and path security |
| Claude Code CLI | Agent PTY process, custom project instructions | TO VERIFY | `claude --version`, `claude --help`, instruction precedence test |
| Codex CLI | Agent PTY process and AGENTS.md context | TO VERIFY | `codex --version`, `codex --help`, instruction precedence test |
| Gemini CLI | Agent PTY process and GEMINI.md context | TO VERIFY | `gemini --version`, `gemini --help`, instruction precedence test |
| Playwright (P1) | Browser QA, screenshot/network/console evidence | TO VERIFY | installed version, browser dependencies, real test |
| `code-review-graph` (optional) | Initial symbol graph | TO VERIFY | installed binary/version, actual query commands or bridge API |

Internal WEAVE methods are **PLANNED** in `docs/ARCHITECTURE.md` and frozen as names for MVP; they become `VERIFIED` only with passing integration tests. In build, add a machine-readable ledger (package name, version, method, signature, documentation URL or local file, verified_at, verifier, evidence hash) and keep this Markdown as projection. Never invent an SDK method because a code agent remembers it from older training.

Reference URLs: https://tauri.app/ ; https://xtermjs.org/ ; https://github.com/xtermjs/xterm.js ; https://code.claude.com/docs/en/cli-reference ; https://developers.openai.com/codex/cli/ ; https://geminicli.com/docs/ . Check freshness when implementing.

## Local verification for ADR-011/012 (2026-10-16 08:02 UTC)

The following entries apply only to the implementation slice, not to every API in the checklist above. Evidence: `crates/Cargo.lock`, installed crate source at `C:/Users/study/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/`, `cargo check --offline --manifest-path crates/Cargo.toml` (exit 0), `cargo test --offline --manifest-path crates/Cargo.toml` (exit 0), and local CLI `--help`/`--version` (exit 0). Test evidence is summarized in `docs/parallel-agents/MEM-MVP-001.md`.

| API | Verified installed version and signature/behavior | Evidence |
|---|---|---|
| `rusqlite` | 0.37.0; `Connection::busy_timeout(Duration) -> Result<()>`, `Connection::transaction_with_behavior(TransactionBehavior) -> Result<Transaction>`; bundled SQLite FTS5 migration and tests passed | `rusqlite-0.37.0/src/busy.rs:26`, `transaction.rs:427`, Cargo tests |
| Tokio Windows named pipe | 1.53.3; `ServerOptions::create_with_security_attributes_raw(addr, attrs) -> io::Result<NamedPipeServer>` (unsafe), `ClientOptions::open(addr) -> io::Result<NamedPipeClient>` | `tokio-1.53.3/src/net/windows/named_pipe.rs:2304,2512`, Windows smoke test |
| Windows security descriptor | `windows-sys` 0.61.2; `ConvertStringSecurityDescriptorToSecurityDescriptorW` and `SECURITY_ATTRIBUTES` compile and serve a local pipe | installed `windows-sys-0.61.2` definitions, Windows smoke test |
| Claude Code CLI | 2.1.276; `claude -p`, `--append-system-prompt-file`, stream JSON options visible in `claude --help` | local `claude --version`, `claude --help` |
| Codex CLI | 0.155.1; `codex exec`, `-c key=value`, `--json`, `-C`, `--skip-git-repo-check` visible in `codex exec --help` | local `codex --version`, `codex exec --help` |
| Gemini CLI | 0.56.0; `gemini -p`, `--output-format stream-json` visible in `gemini --help` | local `gemini --version`, `gemini --help` |

Provider flags above were inspected, not yet used in a launched provider session. Launch and instruction precedence remain unverified.

## Offline role-bundle renderer dependency (2026-10-16)

The local Python environment has `jsonschema` 4.26.0. `Draft202012Validator(schema, format_checker=FormatChecker()).validate(instance)` was exercised by `scripts/render_agent_bundle.py` and `tests/test_render_agent_bundle.py`; `FormatChecker()` is callable with optional formats. Version and callable shape were inspected with `importlib.metadata.version` and `inspect.signature`, and the renderer tests passed with stored evidence in `scripts/agent-files-validation.json`. This verifies offline packet validation only. It does not verify provider instruction precedence, task dispatch, or task report acceptance.

## Interactive terminal role probe (2026-10-16 11:51 UTC)

These observations supplement the earlier help-only rows. They cover a manual terminal session, not daemon-owned WEAVE dispatch or instruction precedence under an immutable packet. Details and limits: `docs/parallel-agents/terminal-role-probe/README.md`; role file SHA-256 `d484717eb258d678cd1d2618e102cc79a5e6e6e861500db615bc956b542aa8d5`.

| CLI | Installed version and verified local behavior | Evidence/status |
|---|---|---|
| Antigravity CLI | 1.4.0; `agy --mode=plan --sandbox` launched interactively in a PTY; text sent after startup through terminal input caused the CLI to read `ROLE.md` and return its reviewer marker. `agy --help` also lists `-i/--prompt-interactive` and `--agent`, but those flags were not used in this probe. | Manual local observation only; not a WEAVE provider in `task-packet.schema.json`. Raw terminal output was deliberately not retained because it included process-title/account data. |
| Codex CLI | 0.155.1; `codex -C <DIR> -s read-only -a never --no-alt-screen` launched in a PTY when `TERM=xterm-256color`; terminal input caused a read of `ROLE.md` and a reply containing the reviewer marker. With `TERM=dumb`, launch rejected the terminal with exit 1. | Manual local observation and `codex --help`; raw terminal output not retained. Directory trust and a supported terminal remain startup gates. |
| Gemini CLI | 0.56.0 at launch; `gemini --approval-mode plan --skip-trust --screen-reader` reached provider authentication but did not process the role prompt. It reported a client-support error. Automatic update left 0.64.0 installed after the session. | Negative manual observation. Re-probe 0.64.0 before asserting startup capability or auth status for that version. |

## INF-001 native build and CI action verification (2026-10-16)

| API/tool | Version and verified signature/behavior | Evidence and limit |
|---|---|---|
| Tauri CLI and Rust crate | Installed `tauri-cli 2.2.0` accepts `tauri build --debug` and documents `--no-bundle` in local `build --help`; Rust `tauri 2.11.5` compiles `tauri::Builder::default().invoke_handler(...).run(...)` and `#[tauri::command]` in `apps/desktop/src-tauri/src/lib.rs`. | Native debug build exit 0 and hidden-window process remained responsive for four seconds; `docs/parallel-agents/agy-runs/review-native-launch-round2.log`. This verifies process launch, not visible GUI rendering or daemon IPC. |
| GitHub Actions `actions/checkout` and `actions/setup-node` | Official release pages list major v7; `actions/setup-node@v7` accepts `node-version` per its official README. | [checkout releases](https://github.com/actions/checkout/releases), [setup-node releases](https://github.com/actions/setup-node/releases), [setup-node README](https://github.com/actions/setup-node/blob/main/README.md). `.github/workflows/smoke.yml` parses locally; GitHub runner execution remains unverified because this pack has no Git repository. |
| `dtolnay/rust-toolchain` | Official README documents `@stable` with `components: clippy, rustfmt`. | [rust-toolchain README](https://github.com/dtolnay/rust-toolchain/blob/master/README.md). The action has not been executed here; local Cargo commands with `--locked` passed. |

### Codex CLI update during packet probe

The installed Codex CLI changed from `0.155.1` to `0.163.0` through its own update flow during the 2026-10-16 terminal probe. The coordinator re-ran `codex --version` and `codex --help` and confirmed `-C/--cd`, `-s/--sandbox`, `-a/--ask-for-approval`, and `--no-alt-screen` on 0.163.0. A new read-only interactive PTY then read a schema-valid synthetic packet and role file and returned their task ID/role/marker after terminal input. Evidence and limitations: `docs/parallel-agents/terminal-role-probe/README.md` and `docs/parallel-agents/agy-runs/review-probe-validator.log`. This does not verify full task dispatch or vendor instruction precedence.

## Windows ConPTY transport verification (2026-10-16 12:28 UTC)

Installed `portable-pty` **0.9.0** in the isolated `docs/parallel-agents/terminal-role-probe/conpty-spike` crate. Its locally compiled types and [crate documentation](https://docs.rs/portable-pty/0.9.0/portable_pty/) verify `native_pty_system().openpty(PtySize) -> Result<PtyPair>`, `SlavePty::spawn_command(CommandBuilder) -> Result<Box<dyn Child + Send + Sync>>`, `CommandBuilder::cwd`, `MasterPty::{resize,get_size,try_clone_reader,take_writer}`, and `Child::try_wait`. The pinned `Cargo.lock`, [`cargo run` evidence](parallel-agents/agy-runs/review-conpty-spike-final.log), [`fmt` evidence](parallel-agents/agy-runs/review-conpty-spike-fmt.log), and [`clippy` evidence](parallel-agents/agy-runs/review-conpty-spike-clippy.log) record this version-specific probe. The run answered one ConPTY cursor-position query, observed the marker from a role file after writing a PowerShell command to the PTY, verified resize to 100×30, and saw shell exit 0 without storing raw terminal output.

The initial no-response runs stalled after the four-byte cursor query. This behavior is described in the [upstream portable-pty discussion](https://github.com/wezterm/wezterm/issues/6783). The spike's fixed row-1/column-1 response is suitable only for its known starting screen; a production terminal must answer from live screen state. This row is **not** verification of daemon ownership, control tokens, output replay, three concurrent sessions, or provider adapter behavior.
