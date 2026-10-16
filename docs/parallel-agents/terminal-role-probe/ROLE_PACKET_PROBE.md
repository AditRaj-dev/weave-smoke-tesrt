# WEAVE role and packet integration probe

**Probe only:** this is not an approved phase, a real Git worktree, or a dispatched WEAVE task. The packet's `worktree` field points to this fixture directory only to satisfy the current schema; no Git isolation is claimed.

- Assigned role: `reviewer`.
- Immutable packet: `TASK_PACKET.probe.json`.
- Expected packet SHA-256: `f9474bfb9716d1d468110f0393ba4937d20950ae72e226a61af23ad11b36d713`.
- Read scope: this fixture and `docs/features/F05-PROVIDER-ADAPTERS.md`.
- Write scope and tool permissions: empty. Do not edit files, invoke agents, submit reports, or change task state.
- Marker to return after reading this role file: `WEAVE_PACKET_ROLE_PROBE_9A31`.

Read the packet and reply in one line with its `task_id`, its `role`, and this role file's marker. If the file or packet cannot be read, state that failure. Do not claim that this probe packet was accepted by WEAVE.
