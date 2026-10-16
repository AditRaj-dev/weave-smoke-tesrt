# Provider Runtime & System-Instruction Injection

## 1. Nonnegotiable behavior
Spawn **the real user-installed CLI in a real OS PTY** (Windows ConPTY; Unix POSIX PTY). Preserve interactive provider login, TUIs, terminal escape codes, tool approvals, and keystroke behavior. UI is a **terminal emulator renderer** (xterm.js); do not replace the CLI interface with a fake chat transcript.

## 2. Provider adapter interface (Rust pseudotypes)
```rust
trait ProviderAdapter {
    fn id(&self) -> &'static str;
    fn probe(&self, env: &SafeEnv) -> Result<ProviderCapabilities>;
    fn prepare(&self, packet: &TaskPacket, workspace: &Path) -> Result<PreparedLaunch>;
    fn resume(&self, checkpoint: &ProviderCheckpoint) -> Result<PreparedLaunch>;
}
struct ProviderCapabilities {
    executable_path: PathBuf,
    version: String,
    supports_interactive: bool,
    supports_initial_prompt: bool,
    supports_resume: bool,
    supports_instruction_file: bool,
    supports_mcp: bool,
    supports_hooks: bool,
}
struct PreparedLaunch { executable: PathBuf, args: Vec<OsString>, cwd: PathBuf,
    env: Vec<(OsString,OsString)>, instruction_artifacts: Vec<PathBuf> }
```
Adapter must validate command/flag support on **actual installed version** before relying on it. Probe must not use the LLM as a guess engine. Capability registry cache keyed by executable path and version.

## 3. Safe instruction strategy
Generate `.weave/runtime/<session-id>/ROLE.md`, `TASK_PACKET.json`, and context manifest. Install minimal provider-specific instruction content at supported scoped location. The role document contains safety hierarchy, tool instructions, task scope, memory CLI commands, exact acceptance, read-set, reporting protocol. Only startup message points to packet; do not paste all approved docs into every terminal.

| Provider | Candidate instruction mechanism | Required verification |
|---|---|---|
| Claude Code | project-level `CLAUDE.md`; `--append-system-prompt-file` on versions supporting it | run `claude --help`, validate actual flag behavior and precedence; never override core safety text |
| Codex CLI | scoped `AGENTS.md`, context file path + initial interactive prompt | inspect `codex --help`/docs for current interactive startup; don't assume `--system-prompt` |
| Gemini CLI | scoped `GEMINI.md`; interactive initial prompt if supported by installed version | inspect `gemini --help`; avoid using `GEMINI_SYSTEM_MD` for ordinary roles as it can replace core prompt |
| Generic PTY | role packet on disk + initial terminal instruction | mark instruction file support unavailable; verify acceptance manually |

**Trust limitation:** prompt constraints do not prevent subprocesses from running Git or accessing files. Treat them as instructions only; enforce file permissions/sandbox independently if claimed.

## 4. Executable/process startup
- Prefer explicit user-selected executable path, otherwise resolve executable by platform search with validation and escape paths correctly.
- Never build a shell command string from user or model input; use OS argument vector where possible. For shell-requiring providers, shell invocation is adapter-specific and guarded.
- Start in task worktree; pass minimal environment. Avoid propagating daemon IPC auth token as a broadly readable environment variable if a worker could leak it; use per-session scoped capability restricted to task/memory/report operations.
- OAuth/vendor authentication stays vendor controlled. UI displays auth prompts; user types into actual terminal, not WEAVE's own password form.
- Record process PID and exec version; bounded stop policy: signal, grace timeout, kill process tree, reconcile child exit.
- On provider `--resume` availability, resume is not a reconstructed PTY—new PTY from checkpoint, with exact provenance and visible restart marker.

## 5. Terminal I/O
`PTY stdout/stderr` are typically merged; preserve byte order. Live output can contain secrets. Render raw byte stream in xterm.js but default to no permanent raw secrets storage. Bounded ring=4MiB/session; chunk ≤32KiB; backpressure & dropped-output event; resize uses actual PTY API. Input ownership prevents simultaneous UI typing from two controllers. Terminal logs with redaction are a separate best-effort artifact and must warn that pattern-based redaction is not perfect.

## 6. Role packets and tool permissions
Packet is JSON-schema validated and signed/hashed by coordinator; worker role does not get direct full SQLite path, cross-project secrets or Git mutations. Default role tools:
- `weave memory query`, `weave code find`, `weave contract show`, `weave task show` (scoped reads).
- `weave memory propose`, `weave handoff create`, `weave task report` (scoped writes).
- Browser/research/design tools only for authorized role; external network access provider- and sandbox-dependent.

## 7. Failure conditions and pass criteria
Check initial login, missing executable, unsupported flag, process crash, terminal resize, Ctrl-C handling, wide Unicode/ANSI colors, background vs foreground sessions, GUI reload, daemon crash. Run genuine Windows ConPTY validation on Windows; a Linux pseudo-terminal test is not substitute.
