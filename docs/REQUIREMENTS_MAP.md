# Requirements Traceability

**Product FRs:** PRD §8. **Task source:** `workflow/tasks.yaml`. **Feature source:** `docs/features/`.

| Requirement | Feature spec | Implementation tasks | Verification |
|---|---|---|---|
| FR-01/02 | F01 | PTY-001/002, PROV-001 | AC-01/02; real ConPTY smoke |
| FR-03 | F02 | WF-001 | AC-03; 7.5 conditional gate |
| FR-04/05/06 | F03 | TASK-001/002, MEM-002 | DAG cycle, collisions, report schema |
| FR-07 | F05 | PROV-001 | unsupported flag/provider missing |
| FR-08/09 | F04 | MEM-001/002, MIG-001 | AC-07/08; FTS+backup |
| FR-10 | F06 | CON-001 | AC-04; contract drift CI |
| FR-11/12 | F07 | REV-001, TEST-001, GIT-001/002 | AC-05/06/10 |
| FR-13 | F08 | PTY-002, UI-001 | task ↔ terminal/evidence navigation |
| FR-14 | F01/F03 | PTY-001, INF-002, E2E-001 | AC-09 crash recovery |
| FR-15 | F01/F04 | INF-003, MEM-001 | offline local core workflow |
| FR-16 | CODE_GRAPH | GRAPH-001 | revision-scoped symbol fixture |
| FR-17 | TEST_PLAN | BROW-001 | known failing browser case |
| FR-18 | GIT_SECURITY | SEC-001, E2E-001 | policy-vs-enforced report |

Before declaring release, check **every** requirement against a fresh evidence ID and actual platform. A docs-only artifact is not proof of implementation.
