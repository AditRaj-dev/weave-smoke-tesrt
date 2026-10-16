# INF-001 bootstrap scope decision

**Date:** 2026-10-16  
**Decision:** The user's “go ahead” after the INF-001 review authorizes continuing the bootstrap and resolving its stated CI path blocker. The coordinator added `.github/workflows/**` to `INF-001.write_paths` in `workflow/tasks.yaml` so the CI worker can create the promised smoke workflow. No root manifest path was added: `crates/Cargo.toml`, `apps/desktop/package.json`, and `packages/ui/package.json` are the current subproject roots.

This decision is limited to INF-001 CI source scope. It does not accept INF-001, approve the proposed PRD/Architecture, change downstream DAG dependencies, or authorize Git metadata mutation. The report transport, native launch, and API record scope issues remain separately tracked in `INF-001-coordinator-review.md` and `implementation-decisions.md`.
