# WEAVE — Integration Contract & Agent Coordination Policy

> Status: APPROVED (example starter)  
> Contract version: `1.0.0`  
> Approval authority: Main Orchestrator + project owner  
> HTTP source of truth: [`../contracts/openapi.yaml`](../contracts/openapi.yaml)  
> Cross-agent integration map: [`../contracts/integration-map.yaml`](../contracts/integration-map.yaml)

## 1. Objective

Prevent agents from inventing paths, field names, HTTP methods, DTOs, status codes, auth behavior, or integration timing. A contract is *not* a suggestion. It is a versioned, executable interface specification.

The architecture document defines *why* an integration exists. `openapi.yaml` defines *exactly what crosses HTTP*. `integration-map.yaml` defines *who implements it and when the modules can connect*.

## 2. Immutable identifiers and naming conventions

| Property | Rule | Example |
|---|---|---|
| Stable operation identifier | Defined in OpenAPI `operationId`; never invented by an agent | `authLogin` |
| API version / path prefix | Fixed in OpenAPI paths | `/api/v1` |
| HTTP method | Fixed per operation | `POST` |
| JSON fields | `camelCase`, case sensitive | `accessToken` |
| URL resource segments | `kebab-case`, plural for collections | `/api/v1/users/me` |
| Entity IDs | UUID string unless schema says otherwise | `550e8400-e29b-41d4-a716-446655440000` |
| Success envelope | `{"data": ...}` | As defined in OpenAPI |
| Error envelope | `{"error":{"code":"...","message":"..."}}` | As defined in OpenAPI |
| Status codes | Only those documented for an operation | `200`, `401`, `422` |
| Web-facing base URL variable | `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000` in local development |
| Secret values | Must never be present in this contract | `DATABASE_URL`, JWT keys stay server-side |

**Canonical values live in `openapi.yaml`.** The examples here describe conventions; do not add a second independently maintained endpoint catalog in Markdown.

## 3. Ownership and write permissions

| Role | Read contract | Propose change | Approve interface change | Modify canonical contract | Build implementation |
|---|---|---|---|---|---|
| Main Orchestrator | Yes | Yes | Yes, with owner approval for breaking changes | Via Git Manager | Only when needed |
| Task Manager | Yes | Yes | No | No | No |
| Frontend agent | Yes | Yes | No | No | Yes, assigned UI code |
| Backend agent | Yes | Yes | No | No | Yes, assigned API code |
| Designer agent | Yes | Yes | No | No | Yes, design artifacts |
| Reviewer / Tester | Yes | Yes | Gate or reject implementation | No | Test/review only |
| Git Manager | Yes | No | No | Applies *approved* contract changes | Repository operations |

For automated environments, enforce this via path-based write permissions and Git/merge gates—not only natural-language instructions.

## 4. Contract lifecycle

`DRAFT → PROPOSED → APPROVED → FROZEN → DEPRECATED`

- **DRAFT:** Research and architecture can revise without blocking agents.
- **PROPOSED:** Reviewer validates API behavior, types, security and client compatibility.
- **APPROVED:** Main Orchestrator and required human approvers accept the contract.
- **FROZEN:** Worker agents implement against this exact revision. They cannot edit it.
- **DEPRECATED:** Old version remains supported according to an explicit migration policy.

A frozen contract can change only by a reviewed change request and a new contract revision. `FROZEN` describes permissions, not a guarantee that interfaces can never evolve.

## 5. Integration handshake (frontend and backend do not need to wait for each other)

| Gate | Required evidence | Allowed next step |
|---|---|---|
| `CONTRACT_APPROVED` | Reviewed OpenAPI revision, operation IDs and schema types | Frontend and backend agents start in parallel |
| `FRONTEND_MOCK_READY` | Generated client/type check passes against mock implementation | Frontend UI may be demoed, but is **not integrated** |
| `BACKEND_IMPLEMENTED` | Route exists and backend tests pass | Start staging API integration |
| `BACKEND_CONTRACT_VERIFIED` | Actual backend conforms to approved contract; auth/errors included | Point client to staging backend |
| `CLIENT_INTEGRATED` | Frontend successfully calls staging API using generated client | Start cross-module testing |
| `E2E_VERIFIED` | End-to-end scenarios and negative paths pass | Candidate eligible for review/merge |
| `RELEASE_APPROVED` | Reviewer, Tester, Integrator, security gates and Git Manager checks pass | Merge/deploy according to environment policy |

No agent may mark a feature `INTEGRATED` merely because both frontend and backend tasks report `done`.

## 6. Task mapping rules

Every cross-layer task must name **existing** `operationId` entries in `openapi.yaml`; see `integration-map.yaml` for the machine-readable list. The Task Manager must block a task if an operation ID is absent, unapproved, or incompatible with the task's required contract version.

Example:

```yaml
feature_id: FEAT-AUTH-LOGIN
frontend_task: FE-001
backend_task: BE-001
operation_ids: [authLogin]
start_condition: CONTRACT_APPROVED
connect_condition: BACKEND_CONTRACT_VERIFIED
finish_condition: E2E_VERIFIED
```

This snippet is explanatory. The actual scheduling dependency records live in `integration-map.yaml`.

## 7. Non-negotiable agent instructions

**Frontend agents:**
1. Resolve endpoints by `operationId` using a generated API client. Do not handwrite route strings in UI modules.
2. Use generated field and response types. Do not guess missing response fields.
3. If a backend endpoint is unavailable, use a contract-shaped mock; label work `FRONTEND_MOCK_READY`, not `CLIENT_INTEGRATED`.
4. Never expose backend-only environment variables or secrets in client bundles.

**Backend agents:**
1. Implement exactly the paths, methods, auth rules, validation constraints and response types in OpenAPI.
2. Do not rename request/response fields, introduce undocumented response envelopes or silently reinterpret status codes.
3. Ensure deployed routes include the documented prefix and API version.
4. Return explicit contract-aligned errors for negative scenarios.

**Task Manager:**
1. Allocate independent agents only after `CONTRACT_APPROVED`.
2. Freeze contract revision for in-flight tasks; store revision in task metadata.
3. Replan dependent tasks when an approved breaking change occurs.
4. Never confuse task completion with verification or integration.

**Reviewer / Tester / Integration Agent:**
1. Compare implementation against OpenAPI, not against generated prose.
2. Reject mismatched method/path/field/type/auth/status/error behavior.
3. Verify integration on a specific immutable code revision.
4. Produce actionable failures identifying `operationId`, contract version and offending files.

**Git Manager:**
1. Only commit contract changes after required approvals.
2. Require contract checks and relevant integration tests before merge.
3. Preserve change history, version tags and approval evidence.

## 8. How an agent handles missing or conflicting information

If a required operation or field is absent from the approved spec:

- **DO NOT** infer a likely endpoint, make up a property, or silently change the contract.
- Mark the task `BLOCKED_CONTRACT_GAP` and publish a structured change request.
- Include `task_id`, `operation_id` (if existing), affected consumers, proposed contract change and migration impact.
- The Orchestrator decides. Git Manager updates the contract only after approval.
- Task Manager regenerates types and unblocks/replans affected tasks.

## 9. Versioning and compatibility

- `PATCH`: typo / documentation-only correction without runtime API impact.
- `MINOR`: backward-compatible new endpoint or optional field.
- `MAJOR`: breaking change, e.g. removing/renaming a field, tightening previously valid input, changing auth semantics or required payload fields.

Version semantic changes are a project policy, not automatic guarantees. Breaking changes to `/api/v1` may require `/api/v2`, a coordinated release or compatibility adapter.

## 10. Automated verification (required for real enforcement)

1. Parse and lint `contracts/openapi.yaml` and `contracts/integration-map.yaml`.
2. Verify every integration-map operation ID refers to an OpenAPI operation.
3. Generate TypeScript client and API types **from the approved OpenAPI revision** (e.g. `openapi-typescript` plus a typed fetch client).
4. Compile frontend and backend code against contract-generated types or equivalent server-side validators.
5. Run runtime request/response conformance tests against the backend; type checking alone does not establish runtime compliance.
6. Execute cross-layer E2E tests using the staging API.
7. Block merge on unexpected contract diffs, failing checks or unapproved changes.

The included `scripts/validate_contracts.py` checks basic structural alignment of the sample files. It is **not** a full OpenAPI linter or runtime conformance test.

## 11. Definition of done

A feature is complete only when: (a) its implementation aligns with the frozen spec, (b) generated types/checks pass, (c) expected and negative cases pass against the real backend, (d) the frontend consumes the intended operation, (e) E2E tests pass, and (f) required reviewers approve the exact integrated revision.
