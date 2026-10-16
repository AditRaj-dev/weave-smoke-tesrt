# Windows ConPTY transport spike

This isolated Rust program tests the OS transport needed before a WEAVE PTY supervisor can launch an agent. It is **not** a daemon session, provider adapter, task dispatch, or PTY-001 acceptance implementation.

Run on Windows from the pack root:

```powershell
cargo run --manifest-path docs/parallel-agents/terminal-role-probe/conpty-spike/Cargo.toml --locked
```

The program opens a native PTY through `portable-pty` 0.9.0, starts a no-profile PowerShell process in the role fixture directory, resizes the PTY from 80×24 to 100×30, writes a command to read `ROLE_PACKET_PROBE.md`, answers the cursor-position query emitted by ConPTY, verifies that the role marker came back, then sends `exit`. It prints only status fields. Raw terminal bytes are neither printed nor saved.

On 2026-10-16, the initial run without a cursor response timed out after receiving only four bytes (`docs/parallel-agents/agy-runs/review-conpty-spike-run.log`, exit 1). The same occurred with PowerShell before the response (`review-conpty-spike-powershell.log`, exit 1). The four-byte startup sequence matches the `ESC[6n` cursor query discussed in the [portable-pty upstream issue](https://github.com/wezterm/wezterm/issues/6783). A fixed cursor response made the probe pass (`review-conpty-spike-cursor.log`, exit 0). The final version detects that query and responds when observed: [`review-conpty-spike-final.log`](../../agy-runs/review-conpty-spike-final.log), exit 0 at 2026-10-16T12:27:56Z, `marker_seen=true`, one cursor query answered, 100×30 resize confirmed, shell exit 0. [`cargo fmt --check`](../../agy-runs/review-conpty-spike-fmt.log) and [`cargo clippy --locked --all-targets -- -D warnings`](../../agy-runs/review-conpty-spike-clippy.log) also returned exit 0.

This probe answers a cursor query with the known fixed starting position (row 1, column 1). A production terminal must parse output and answer from its actual screen state; it must also handle output retention, session ownership, process cancellation, input authorization, reconnect, and provider authentication. The manual Antigravity and Codex role probes in the parent directory cover CLI role interpretation separately. None of these experiments satisfy the three-session and isolation checks in `docs/features/F01-PTY-SESSIONS.md`.
