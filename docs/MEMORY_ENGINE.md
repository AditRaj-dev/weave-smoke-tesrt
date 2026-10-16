# Memory Engine v2 — Cross-Session Knowledge with Provenance

## 1. Core rule
**Memory is selected, provenanced shared knowledge, not a group chat log.** Three stores have distinct semantics:
- **Canonical project truth:** user-approved PRD, architecture, locked design/contracts and explicit decisions.
- **Memory notes:** scoped observations/lessons/handoffs with sources, verification state and possible supersession.
- **Derived code index:** symbols/edges tied to repo revision, rebuilt from source; never authoritative business decisions.

## 2. Write lifecycle
```
agent observation -> candidate (untrusted)
  -> reviewer/owner checks artifact + contradiction search
      -> validated (queryable as verified)
      -> rejected (retained for audit, excluded by default)
      -> superseded (linked to newer item)
  -> pinned (only via approved project decision)
```
Memory candidates require source kind/path or artifact ID, task/session, project ID, and content hash. `confidence` may prioritize review but never skips it. Agents cannot update `docs/memory/MEMORY.md` concurrently; approved events drive compatible projections with deduplication.

## 3. Required memory fields
`id,project_id,scope(kind=global|project|domain|task),domain?,task_id?,type(decision|observation|lesson|api|handoff|gotcha|review),status(candidate|validated|pinned|rejected|superseded),content,source:{kind,path?,line?,commit?,artifact_id?},author_session,validator?,supersedes_id?,created_at,content_hash,sensitivity`.

## 4. Retrieval policy
**Start context** (hard budget default ~4k tokens):
1. Pinned project constraints (must include exact version/approval stamp).
2. Task acceptance, allowed paths, dependency outcomes, contract IDs/hashes.
3. Up to 8 relevant validated domain/project lessons/handoffs via SQLite FTS5, deduped by content hash, with pointers.
4. Top relevant code symbol file:line references (revision-specific).
Never inject all past conversations. In `weave memory query` default exclude candidates/rejected/superseded; reviewers may request candidates explicitly. FTS5 ranking then task/domain boosts, pinned boost, date tiebreak; leave configurable. Semantic/vector search is P2 after FTS failure benchmark, not precondition.

## 5. Cross-agent example
Backend task changes validation rule and passes tests. Backend posts `memory.propose` linked to diff and unit test evidence. Reviewer validates it; memory is published as `domain=backend`, tagged `AUTH-v1`. Frontend's subsequent memory query returns summary, contract ID and exact source location. If backend observation contradicts approved AUTH contract, it remains candidate and triggers `CONTRACT_DRIFT`, not silent propagation.

## 6. CLI vs MCP vs hooks
- **CLI:** primary universal path for Claude/Codex/Gemini shell-capable CLIs; stable structured JSON and strict errors.
- **MCP:** optional adapter to the same coordinator API; no separate DB or alternative validation.
- **Hooks:** optional useful triggers (e.g., index dirty files); not required for correctness as hook APIs differ by provider.

## 7. Concurrency, dedupe, data hygiene
Use single writer service or short SQLite transactions with busy timeout; FTS index updates in same transaction; exact hash dedupe plus possible semantic review duplicates. Version memory items rather than overwriting provenance. Source pointers must be checked for validity (commit/file path) before showing them as confirmed. Secrets / personal data in agent outputs should be redacted or withheld; sensitivity tags and retention rules apply.

## 8. Compatibility projection for Mastermind
Materialize:
- `docs/memory/MEMORY.md`: append or regenerate from validated decisions/lessons with original provenance, safe merge policy.
- `docs/memory/HANDOFF.md`: current phase/task snapshot with `Frozen facts`, current contracts, next action.
- `docs/memory/RESUME.md`: small fresh-session bootstrap prompt at each gate; no full transcript.
Use atomic write temp+rename and version conflict check so external edits are not silently lost. If user edits canonical document, import changes as a proposed doc revision requiring approval.

## 9. Memory quality acceptance
- Write concurrent candidates to same project from 3 workers; no lost/duplicated canonical rows.
- Rejected or unresolved contradiction never appears as verified in another agent's default query.
- New PTY session recalls validated note + exact task and source, without opening previous transcript.
- Restart daemon and verify stable search results/import lineage.
