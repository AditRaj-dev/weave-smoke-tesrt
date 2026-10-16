Coordinator review of your CI workflow. Continue the same Antigravity conversation. Edit only `.github/workflows/**`; do not touch any other file or spawn agents.

Fix these material findings in `.github/workflows/smoke.yml`:
1. Both `apps/desktop/package-lock.json` and `packages/ui/package-lock.json` now exist. Remove the fallback to `npm install --no-package-lock`; this CI gate must require reproducible `npm ci` and fail if either lockfile is absent/incompatible. Put each `npm ci --prefix ...` in its own step (or explicitly check each exit code) so a failure of the first cannot be hidden by success of the second under PowerShell external-process behavior.
2. There is no Git repository/default branch metadata in this pack. Remove the unverified `main` branch filters from `push` and `pull_request`; preserve `workflow_dispatch`.
3. Both Cargo roots have lockfiles; use `--locked` on `cargo clippy`, `cargo test`, and native `cargo check` where supported. Verify exact Cargo syntax from installed help before editing.

Re-parse YAML and inspect the resulting steps. Report precise command/timestamp/exit/artifact evidence. Never claim GitHub CI green in this non-Git pack. Correct any prior report wording that implied `weave task report` returned `NOT_IMPLEMENTED` unless you have the exact command, output, exit code, and artifact; an unsupported command is different. Return exact changed files and remaining blockers.
