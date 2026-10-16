# Mastermind Compatibility and Migration Contract

**Reference repository:** https://github.com/AditRaj-dev/masterminmd  
**Read before implementation:** `skills/mastermind/SKILL.md`, `skills/mastermind/references/agents.md`, `memory.md`, `session-handoff.md`, `api-record.md`, `git-workflow.md`, `html-to-react.md`, `memex/cli.js`, `memex/lib.js`. Fetch the current source locally before implementing; the URLs are references, not a claim that the GitHub repo is already cloned into WEAVE.

## Exact semantic preservation
| Phase | Mastermind artifact/action | WEAVE behavior | Gate |
|---|---|---|---|
| 0 Setup | Project registry, docs tree, feature branch, code graph if existing code | import/create project and Git broker branch; adopt existing docs | auto advances to 1 |
| 1 Discovery | `docs/DISCOVERY.md` detailed feature interviews | human-led/orchestrator-driven discovery, edge cases, data, permissions | human approval |
| 2 PRD | `docs/PRD.md` | approved product truth snapshot | human approval |
| 3 Feature docs | `docs/features/<nn>-<slug>.md` | independently buildable feature specs | human approval |
| 4 Plan | `docs/IMPLEMENTATION_PLAN.md`, task board | parse tasks, deps, scopes and parallel group; seed DAG | human approval |
| 5 API record | `docs/API_RECORD.md` verified signatures | validate dependency/version evidence + internal contracts | human approval |
| 6 Design | `docs/DESIGN.md`, tokens and design references | designer/reviewer flow, user selection | human approval |
| 7 Mockups | `wireframe/*.html`, tokens.css, `wireframe/INDEX.md` | visual review and click-through; freeze on approval | human approval |
| 7.5 h2r | `.h2r/manifest.md`, plan.json, TSX emitted and verified | conditional for React/Next, not skipped if applicable | automatic after approved 7; no gate |
| 8 Build | specialist tasks, diff-based reviews, fix loop, task commits | parallel PTY agents + contract/review/test/Git gate | human approval at completed build |
| 9 Wrap | acceptance evidence, branch finish choices | full test/PRD criteria + owner merge/PR/keep/discard | confirmation for destructive |

Mastermind's **one-phase-per-session** rule is preserved semantically: every gated phase ends with persisted `docs/memory/RESUME.md` and `HANDOFF.md` checkpoint; new phase starts from a fresh **provider CLI PTY**, not the previous agent transcript. The UX no longer forces human manual clipboard/paste. Users still approve gates.

## Mastermind vs WEAVE deviations (explicit)
- Original: orchestrator uses provider-native Claude `Agent` tool; WEAVE: independent OS PTYs for different provider CLIs.
- Original: orchestrator may commit/merge; WEAVE: deterministic Git broker only.
- Original: append to memory docs and mirror to `memex` DB; WEAVE: provenance-checked SQLite canonical truth and materializes compatible `MEMORY.md`/`HANDOFF.md` from approved events; no parallel writer races.
- Original: all agents read two memory docs; WEAVE: inject verified scoped snapshot and memory CLI access, while supporting legacy docs for portability.
- Original: `API_RECORD.md` rejects unlisted external APIs; WEAVE additionally enforces typed internal contracts from schemas.
- Original: h2r forbids manually rewriting approved structural markup; WEAVE retains that constraint for applicable React/Next paths.
- Original: model hierarchy Haiku/Sonnet; WEAVE: role capability tiers are configurable; review is *independent from implementer* and must not silently weaken validation.

## Import workflow
1. Scan user-provided project path only. Detect `.claude/skills`, `docs/memory/MEMORY.md`, `HANDOFF.md`, `RESUME.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/API_RECORD.md`, `wireframe/`, `.h2r/` and repo Git status.
2. Offer `import/dry-run`: show detected paths, estimated tasks, Memex DB location and conflicts. No modification.
3. Back up original DB and docs snapshot; store import record with source path, source hash, timestamp, source schema version.
4. Import old Memex `memories`, `handoffs`, and `tasks` into staging with `legacy_id` and source provenance; map old `todo/in_progress/done/blocked` to WEAVE `proposed/running/done/blocked` with **unverified legacy status** (never fabricate review/test evidence). Legacy `done` is marked `legacy_unverified` until evidence supplied.
5. Import Mastermind phase/doc metadata, preserve original docs; detect 7.5 stage if React and `.h2r/manifest.md` exists.
6. Validate and show proposed mapping; commit import transaction; backup remains available; rerun is idempotent with `(source_hash,legacy_id)` uniqueness.
7. For first resumed run, generate fresh checkpoint; avoid replaying old entire chat transcripts.

## Migration tests
- Empty old DB; populated old DB; duplicate IDs/projects; malformed handoff; rerun import twice; interrupted import; incompatible schema version; old docs but no DB; DB but no docs; no Git repo; dirty repo; newer native schema downgrade refusal.
- Verify license inventory for bundled content from Mastermind; `memex/package.json` MIT is not proof that all assets may be freely redistributed.
