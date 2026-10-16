# WEAVE repository instructions for Gemini CLI

Read `AGENTS.md` first. For a WEAVE-dispatched session, read the generated `ROLE.md` and immutable `TASK_PACKET.json` at the paths in the startup message. The packet controls allowed paths, contract pins, memory scopes, and capabilities. Query the local WEAVE memory store only where the packet grants `memory.query`, and verify provenance before relying on a note.

The current starter's supported memory commands and deferred examples are recorded in `docs/ADR.md` and `docs/PROTOCOLS.md`; confirm availability with the installed `weave --help`. Do not use `weave mem add` or invent contract/task commands. Keep vendor authentication in Gemini's own terminal flow. This file adds repository guidance and does not replace Gemini's built-in safety instructions.

Gemini provider startup and instruction precedence require a fresh version-specific probe before WEAVE can claim a successful managed launch. Report an unavailable command or authentication block instead of inventing task or memory state.
