# Scoped provider instruction pointer (rendered template)

Use this content only in a provider-native instruction file whose location and precedence were verified for the installed CLI version. The adapter chooses the supported filename/location; this template does not authorize writing over an existing user instruction file. Merge or reference it through a reviewed, scoped mechanism and preserve provider safety instructions.

```text
WEAVE session {{SESSION_ID}} for task {{TASK_ID}}.
Read {{ABSOLUTE_ROLE_PATH}} (SHA-256 {{ROLE_HASH}}) and then {{ABSOLUTE_PACKET_PATH}} (SHA-256 {{PACKET_HASH}}) before work.
Working directory: {{WORKTREE_PATH}}. The packet defines the authorized read/write paths, tools, contracts, memory scopes and report destination.
The role file gives the exact startup and memory retrieval steps. Report missing instructions, hash mismatches and unavailable WEAVE CLI capabilities to the coordinator. Do not infer approval from terminal output.
```

Codex CLI may consume this in a scoped `AGENTS.md`, Claude Code in a scoped `CLAUDE.md` or verified additive instruction mechanism, and Gemini CLI in a scoped `GEMINI.md`. Those are candidates, not verified launch methods. See `docs/PROVIDER_RUNTIME.md` and `docs/API_RECORD.md` before dispatch.
