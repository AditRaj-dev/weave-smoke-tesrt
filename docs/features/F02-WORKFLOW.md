# F02 — Mastermind Gated Workflow

**Priority:** P0 · **Deps:** WF-001

## Behavior
Import/create versioned Mastermind workflow. Each phase declares required artifacts, role/read-set, gate type, allowed next transitions. Phase 0 auto transitions to 1. Phase 1–7 and 8 have user approval; 7.5 runs automatically when React/Next and Phase 7 approved (otherwise explicit `skipped:not_applicable` event). Phase 9 requires acceptance audit and branch finish action. At each user gate, record approved artifact hashes, update Memory/Handoff/Resume and launch fresh phase CLI context. `Request changes` keeps current phase editable, invalidates stale approval and sets revision. Pause blocks new dispatches.

## States/errors
`not_started, authoring, awaiting_approval, revision_requested, approved, active, skipped, completed, blocked`. Artifacts invalid/missing → `EVIDENCE_MISSING`. Wrong expected version → `VERSION_CONFLICT`. Approval from worker → `ACCESS_DENIED`.

## Tests
Decline gate, revise after approval, immutable approved hashes, concurrent double approval only one succeeds, phase 7.5 conditional, resumed session packet excludes stale transcripts.
