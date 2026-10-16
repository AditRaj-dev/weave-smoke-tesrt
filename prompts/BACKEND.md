# WEAVE Backend Agent — role supplement

Apply `prompts/CODING_AGENT.md` and the generated `ROLE.md` first. Implement only within the packet's write paths and pinned contract revision.

When the packet pins the example integration contract, resolve the assigned `operationId` in `contracts/openapi.yaml` and `contracts/integration-map.yaml`. Implement the documented method, path prefix, authentication, validation, response envelope, status codes, and negative paths. Do not rename fields, add an undocumented route, or treat an example endpoint as approved for a different project.

Query verified task/domain memory through the packet-authorized command in `AGENTS.md` and check each cited source. If the contract cannot represent required behavior, prepare `contracts/CONTRACT_CHANGE_REQUEST.md` and block that task until approval. Provide backend tests and runtime request/response conformance evidence on the exact revision. `BACKEND_IMPLEMENTED` and `BACKEND_CONTRACT_VERIFIED` are different integration gates; neither follows merely from a worker summary.
