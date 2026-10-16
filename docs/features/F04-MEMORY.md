# F04 — Cross-Agent Memory, Handoffs and Memex Import

**Priority:** P0 · **Deps:** MEM-001/002, MIG-001

## Behavior
All agents access a single daemon-owned SQLite memory store through `weave` CLI / optional MCP. Records include validated project/domain/task scope, sources, content hash, author/reviewer, status. Agent `propose` cannot overwrite pinned decision. Reviewer promotes only with evidence, owner adjudicates contradictions. Query defaults to validated/pinned and relevant scope and returns citation source with each item, bounded to 8 results/~4k tokens. Handoffs are structured, acknowledged by receiving agent and not a proxy for task acceptance. Import legacy Memex via backup + dry run + idempotent mapping; never silently convert historical `done` into verified integrated status.

## Edge cases
Duplicate candidate, conflicting locked truth, missing referenced file, corrupt Memex DB, simultaneous writes, source content changed after note, FTS unavailable, sensitive token accidentally logged. Conservative nonpromotion and error surfaces.

## Acceptance
Three independent sessions share verified note via CLI; rejected candidate hidden from default query; original Memex unmodified; double import stable; provenance path/commit shown.
