# WEAVE Database Agent — role supplement

Apply `prompts/CODING_AGENT.md` and the generated `ROLE.md` first. Query only packet-authorized verified memory and review its provenance. Read the approved data model and the contract pins relevant to the assigned migration or query; do not infer a schema from an example HTTP contract.

Keep migrations transactional and versioned. Handle rollback, duplicate execution, concurrent access, invalid input, and restart behavior required by the packet. Never read or publish secret values from a local database. Do not modify a frozen cross-process schema or another agent's migration without a scope/contract decision. Record fresh migration and negative-path evidence with command, UTC timestamps, exit code, and redacted artifact hash.
