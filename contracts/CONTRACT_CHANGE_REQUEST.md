# WEAVE — Contract Change Request Template

> Copy this file per proposed contract change. An agent request does not authorize modifying a frozen contract.

- **Change ID:** `CCR-YYYY-NNN`
- **Submitted by:** `<agent ID>`
- **Related task:** `<task ID>`
- **Current contract version:** `<e.g. 1.0.0>`
- **Affected operation IDs:** `<existing IDs or NEW>`
- **Status:** `PROPOSED`

## 1. Problem / missing information
`<What cannot be implemented against the approved contract?>`

## 2. Proposed change
`<Exact new route, operationId, method, schema change, auth rule, error behavior, etc.>`

## 3. Reason this change is necessary
`<Product requirement, user story or observed incompatibility>`

## 4. Compatibility classification
- [ ] Patch / docs-only
- [ ] Backward-compatible minor change
- [ ] Breaking major change

## 5. Affected frontend and backend tasks
`<Explicit task IDs, file paths and dependencies>`

## 6. Migration and test plan
`<Client regeneration, backward compatibility, tests, rollout / rollback>`

## 7. Approval
- **Orchestrator decision:** `APPROVE | REJECT | REVISE`
- **Project owner approval required for breaking change:** `YES | NO`
- **Approved version:** `<new version>`
- **Git commit/change reference:** `<filled by Git Manager>`
- **Task Manager replan completed:** `YES | NO`
