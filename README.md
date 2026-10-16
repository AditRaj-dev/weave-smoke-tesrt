# WEAVE Integration Contract — Starter Kit

A ready-to-customize contract format for multi-agent frontend/backend development.

## Read first

1. [`docs/INTEGRATION_CONTRACT.md`](docs/INTEGRATION_CONTRACT.md): policy, ownership, integration handshake, and agent rules.
2. [`contracts/openapi.yaml`](contracts/openapi.yaml): authoritative REST endpoints, methods, auth, and request/response types.
3. [`contracts/integration-map.yaml`](contracts/integration-map.yaml): which frontend and backend tasks implement which operations, and when they can integrate.
4. [`contracts/CONTRACT_CHANGE_REQUEST.md`](contracts/CONTRACT_CHANGE_REQUEST.md): formal path for requesting a new or changed operation.
5. [`scripts/validate_contracts.py`](scripts/validate_contracts.py): sample structural cross-file checker.

For WEAVE agent instructions, start with [`AGENTS.md`](AGENTS.md) and the [role file map](prompts/README.md). Repository-level `CLAUDE.md` and `GEMINI.md` point their CLIs to the same rules. The example auth/profile contract applies only to tasks that explicitly pin it; the approved current memory starter and deferred CLI examples are recorded in [`docs/ADR.md`](docs/ADR.md).

## Customize to your project

- Replace the example login/profile operations with your actual product API contracts.
- Set the OpenAPI `info.version` and matching `integration-map.yaml` `contract_version`.
- Ensure all `operationId` values are globally unique and stable.
- Map each feature to actual frontend/backend task IDs and relative paths.
- Have the Orchestrator review and freeze the contract before parallel work begins.
- Generate typed API clients from the frozen spec. Never let frontend workers invent API paths.
- Add HTTP request/response conformance tests; the structural checker **does not** verify running backend behavior.

## Quick validation

```bash
python -m pip install PyYAML
python scripts/validate_contracts.py
```

## TypeScript type generation example

```bash
# In your project's JS/TS tooling setup:
npm install --save-dev openapi-typescript
npx openapi-typescript contracts/openapi.yaml -o frontend/src/generated/api.d.ts
```

`openapi-typescript` emits types; you must use a suitable typed fetch client (or generated SDK) to call actual endpoints. Type generation alone does not guarantee valid runtime responses. Enforce lint, build, runtime conformance tests, and E2E checks in CI.

## Contract-gate state machine

```text
CONTRACT_APPROVED ──┬──> FRONTEND_MOCK_READY
                    └──> BACKEND_IMPLEMENTED
                                 │
                                 v
                       BACKEND_CONTRACT_VERIFIED
                                 │
                FRONTEND_MOCK_READY + backend verified
                                 v
                          CLIENT_INTEGRATED
                                 │
                                 v
                            E2E_VERIFIED
                                 │
                                 v
                           RELEASE_APPROVED
```

This pack contains *example* auth/profile contracts; do not mistake those examples for approved endpoints in any existing product.
