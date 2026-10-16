Coordinator review of your `docs/parallel-agents/implementation-decisions.md` proposal. Edit only that owned file; do not spawn agents or modify canonical docs/code/Git.

Please fix these actionable issues:
1. `weave task report --file` appears in `docs/PROTOCOLS.md`; distinguish that documented planned syntax from the invented `--validate-only` flag and fabricated `{ok,report_id,status}` response. Remove the invented flag/response, or explicitly mark them as a decision request rather than a verified interface. Keep M0 report bootstrap proposal schema-valid and honest about no CLI yet.
2. A Cargo workspace at `crates/Cargo.toml` and an npm project at `apps/desktop/package.json` can build without root manifests. Reframe DEC-001: root manifests are optional design choices, while `.github/**` is the concrete path blocker for promised CI. Do not claim root manifest scope blocks compilation.
3. Do not propose that the Git broker writes code/manifest links during integration without an approved task scope. Assign shared manifest wiring to INF-001/INF-003 or request a narrow scope amendment and serialization.
4. Verify the DATA_MODEL table count instead of asserting 22 if the enumerated tables differ. Avoid unnecessary seven-crate scaffolding in INF-001; the user requested the smallest complete bootstrap.
5. Keep the proposal's status explicitly pending user/contract approval; do not say the conflicts are resolved yet. Preserve the genuine TASK-002/GIT-001 ordering issue.

After edits, return exact file changes, read/validation commands with timestamp and exit, and remaining decisions. Do not claim tests or accepted contracts.
