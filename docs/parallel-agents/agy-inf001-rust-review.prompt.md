Coordinator review of your INF-001 Rust bootstrap contribution. Edit only `crates/**`. Do not spawn agents, edit docs/apps/packages/Git, or claim task acceptance.

Please fix these findings:
1. `docs/PROTOCOLS.md` plans `weave status --json`, but the source docs do not establish `weave-daemon start`, `weave-daemon status`, or `weave-daemon status --json`. `AGENTS.md` forbids inventing CLI flags. Remove the extra daemon command surface from parser/help/tests. Keep daemon `--version` and `--help` and an explicit unavailable default if a service start is attempted by bare invocation.
2. Unsupported arguments are copied into structured stderr diagnostics. That can leak a token supplied as an argument and makes the handwritten JSON escaper incomplete for arbitrary control characters. Use a static/redacted unsupported-argument message that never includes raw input. Ensure diagnostics are valid JSON for all supported error paths.
3. Keep tests focused on meaningful positive/negative behavior rather than mirroring every trivial flag branch. Re-run format, clippy, tests, and positive/negative CLI smokes. State exact command, timestamp, exit code, and artifact paths. Do not claim `INF-001` complete; CI/desktop/review remain.

Return exact changed files, evidence, contracts, blockers, and risks. Do not invent more command syntax.
