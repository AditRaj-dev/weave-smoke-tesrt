# F05 — Multi-Provider Boot / Role Instruction Packets

**Priority:** P0 · **Deps:** PROV-001

## Behavior
Probe installed Claude/Codex/Gemini CLI versions/help. User selects provider per role or coordinator assigns from explicit policy. Create immutable `TASK_PACKET.json`, `ROLE.md` and provider-native instructions scoped to worktree. Spawn true interactive CLI in PTY, respecting provider startup mechanism; show vendor login where relevant. A task may resume with provider-supported resume flag and saved vendor session ID if verified; always create fresh PTY after daemon loss.

## Rules
No universal arbitrary `--system-prompt`; no full replacement of vendor safety/system prompt as default; instruction artifacts carry hash in session metadata; detect stale/rejected context. Pass only scoped WEAVE CLI capability, never daemon admin token. On unsupported feature fallback to generic interactive startup file reference or block if policy requires strong role injection.

## Acceptance
Each installed provider boot receives correct packet reference; no unsupported flags; missing provider exposed; role can query memory/report status; full auth prompt remains provider-native.
