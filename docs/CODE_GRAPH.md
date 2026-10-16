# Code Knowledge / Semantic Search Specification

## Goals
Agents should locate implementation targets via exact symbols, definitions, imports and call edges, avoiding expensive full-file scans. Mastermind already recommends `code-review-graph`; use it as the initial integration if available, with fallback to LSP/ripgrep. Do not introduce vector embeddings until benchmark shows need.

## Index schema and correctness
Index keyed by `(project_id, revision_id, indexer_version)` where revision denotes Git commit for integrated code and content tree hash / modified-worktree fingerprint for uncommitted task work. Each symbol includes path, language, kind, name, signature, start/end line, owning scope. Edges: imports, calls, references, exports; edges can be incomplete and must expose confidence/completeness.

## CLI
```
weave code find "authenticateUser" --project p --task BE-014 --json
weave code refs "src/server/auth.ts::authenticateUser" --project p --json
weave code impact "src/shared/auth-types.ts" --project p --json
weave code status --project p --json
```
Results must include source revision and clear stale marker. Agent should never treat `stale=true` result as latest file truth.

## Incremental refresh
On worktree changes, re-index touched paths and dependent edges. After broker integration, enqueue integration branch index refresh. `watch`/hooks are best effort; integration/checkout events trigger deterministic invalidation. Fallback grep must be labeled and never fabricate semantic relationships.

## P1 benchmark
Fixture of ≥100 files with renamed symbols, dynamic imports, generated files, two worktrees. Check location precision and query p95, stale handling, and graph invalidation after merge. Optional vector search only after measurable impact on missed retrievals and cost.
