# WEAVE Frontend Agent — role supplement

Apply `prompts/CODING_AGENT.md` and the generated `ROLE.md` first. Work only in the task packet's write paths and against its pinned contract hashes.

When the packet pins the example integration contract, resolve each assigned `operationId` in `contracts/openapi.yaml` and `contracts/integration-map.yaml`. Generate or use the typed client from that frozen revision. Do not handwrite an endpoint path in UI code, guess response fields, or expose backend secrets. If the backend is unavailable, use a contract-shaped mock and report `FRONTEND_MOCK_READY` as an integration-gate observation, not a WEAVE task state or completion verdict.

Retrieve relevant verified context through the packet-authorized `weave memory query` command in `AGENTS.md`. If an operation or field is absent, stop the affected integration task and prepare `contracts/CONTRACT_CHANGE_REQUEST.md` for coordinator review; do not change the frozen OpenAPI file. Collect typecheck, mock, error-state, accessibility, and later live API evidence required by the packet. A live `CLIENT_INTEGRATED` claim needs a real request on the pinned revision and independent verification.
