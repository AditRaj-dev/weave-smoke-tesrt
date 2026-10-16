# WEAVE Implementation Specification

## Problem
Independent AI coding CLIs do not share working memory, deterministic task ownership, contracts, or version-control rights. Simply allowing agents to talk to one another produces duplicated work, stale context, and inconsistent endpoint naming.

## Assumptions to test
- CLIs are processes controlled by our app, not APIs whose internal prompts we can arbitrarily rewrite.
- PTY rendering is presentation, not the trusted automation/event interface.
- Memory retrieval should happen at defined points, not by injecting growing summaries every turn.
- A system prompt or hook is NOT a security boundary.
- More parallel workers only improve latency if tasks have independent resources and contracts.

## First principles
1. **Canonical state** belongs to a daemon/database, not to a single agent chat.
2. **Provider adapters** translate a WEAVE role into that CLI's supported instruction interface.
3. **Versioned contracts** and explicit dependencies define backend/frontend interfaces.
4. **Event-sourced task lifecycle** supports recovery and observability.
5. **Isolated worktrees** prevent concurrent coding agents from modifying the same checked-out files.
6. **Least privilege** ensures only Git Manager can integrate changes; application-enforced roles are not OS isolation.

## Session creation flow

1. Orchestrator decomposes work into dependency-aware task DAG.
2. Scheduler checks dependencies, file/path leases, memory policies, budget, max concurrency.
3. Git Manager creates an isolated worktree + branch (future phase).
4. Prompt Builder renders: platform rules + agent role + project AGENTS.md + task spec + approved contracts + relevant retrieved memories.
5. Daemon registers agent ID and a short-lived scoped token.
6. Adapter calls `spawn` with fixed argv array, selected cwd and scoped environment.
7. Structured JSONL parser converts provider output into normalized WEAVE events.
8. Hooks record relevant actions; CLI supports explicit memory queries and proposals.
9. Reviewer and tester verify artifacts; only then Git Manager integrates.

### Provider differences (verified from official docs, October 2026)

| Provider | Recommended automation | Role instruction channel | Context files | Output |
|---|---|---|---|---|
| Claude Code | `claude -p` | `--append-system-prompt-file` | `CLAUDE.md` | `--output-format stream-json --verbose` |
| Codex CLI | `codex exec` | `-c developer_instructions=<TOML-string>` | `AGENTS.md` | `--json` |
| Gemini CLI | `gemini -p` | prompt + scoped `GEMINI.md` | `GEMINI.md` | `--output-format stream-json` |

Gemini's `GEMINI_SYSTEM_MD` **replaces** the default built-in system prompt; avoid using it automatically. Native CLI context files are not all at the same instruction priority. Treat role text as task instruction, not the actual operating system permission boundary.

Source documentation:
- https://code.claude.com/docs/en/headless
- https://developers.openai.com/codex/non-interactive-mode
- https://developers.openai.com/codex/agent-configuration/agents-md
- https://developers.openai.com/codex/config-reference
- https://geminicli.com/docs/cli/headless/
- https://geminicli.com/docs/cli/gemini-md/
- https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/system-prompt.md

## Planned memory interfaces

Agent CLI (typed API over same backend):

```bash
weave mem search "JWT auth middleware" --project demo
weave mem add --scope agent --kind fact --text "Auth middleware located at src/auth/middleware.ts"
weave mem add --scope project --kind decision --text "Proposal: refresh tokens rotate on every use"
weave contract get auth-api --project demo
weave contract propose auth-api --file changed-contract.json --project demo
weave events --since 120 --project demo
```

Agents do not directly write approved contract versions. Proposals are reviewed and promoted by an authorized controller. Each memory fact should eventually carry provenance: file references, git commit, task ID, confidence, author, expiry or staleness conditions.

### Memory visibility

- Session scratch: ephemeral to agent, not persisted as canonical truth.
- Agent private: agent ID; available to same session/resume only.
- Team domain: backend or UI collaborators share **unverified** notes immediately, tagged as team-sourced information.
- Project shared: approved cross-agent decisions, architecture, API contracts.
- Global: reusable norms and preferences, never project secrets.

### Context assembly

At *session start*, compile a small package (rough target 1-3k tokens):
- Task goal/acceptance, file ownership, approved dependency IDs.
- Current contract versions and essential paths (authoritative snapshots).
- 5-12 retrieved verified memories with citations.
- `weave` CLI usage and handoff format.

At *boundaries* (task complete, contract approved, new task assigned, resume), refresh context. During an active model turn, WEAVE cannot magically edit that model's past context; emit events and let the agent retrieve them via CLI on next tool use or orchestrator follow-up turn.

## Hooks vs CLI vs MCP

CLI is deliberate pull/write; hooks are passive telemetry and policy checks; optional MCP wraps the same backend in discoverable tools. Do not maintain three memory databases or three authorization policies.

Hooks to connect when ready:
- `SessionStart`: attach task and revision metadata.
- `PreToolUse`: advisory block/approval for commands and files outside scope; do not assume full coverage.
- `PostToolUse`: log relevant changed-file or build/test events, with debounce/deduplication.
- `PreCompact` / `Stop`: checkpoint summarized decisions and task progress.
- `SessionEnd`: mark process closed, preserve resumption info.

Use hooks primarily to capture **events**, not every token or tool output. Keep metadata, not raw API keys, terminal dumps or sensitive source excerpts. Some providers emit different schemas; normalize before ingestion.

## Contract design

Each approved contract should be immutable and versioned. Suggested fields:
- contract_id, version, owner, consumer_task_ids
- method, path, request schema, response schema, error status codes
- auth scopes, validation, timeout, idempotency expectation
- compatibility assessment, review state, change reason
- source file, commit hash, test fixtures

Changes use propose -> validate -> dependency-impact-check -> approve -> notify consumers. Consumers must pin approved contract version. An open agent whose contract becomes stale should pause before a conflicting write.

## Proposed task-state graph

`queued -> ready -> leased -> running -> review -> test -> merge_ready -> integrated -> done`

Failure paths: `blocked`, `needs_changes`, `cancelled`, `expired`; terminal task may retry with new attempt ID, not rewrite history.

Leases: exclusive writable file paths / components, TTL + heartbeat, optimistic contract version checking. Never start two writers against overlapping owned resources. Independent backend agents should use isolated worktrees, branches, and ideally independent modules.

## PTY design (future)

Use `node-pty` to spawn interactive command-line programs and xterm.js to render them. For automation, prefer child-process pipe streams and JSONL. Keep UI PTY output separate from structured agent events. Node-pty supports Linux/macOS/Windows via ConPTY, but initial starter targets WSL2 to simplify the launch path.

## Git Manager (future)

Git Manager exclusively creates worktrees, commits, rebases, merges, resolves integration conflicts with review gates, and pushes with explicit approval. Agents should not hold Git credentials. Agent patch output is validated for allowed paths; only a privileged merge runner gets `.git` write permissions. Git command restrictions written only in prompts are insufficient.

## Opportunities and leverage

- Once normalized, the same daemon can serve Claude, Codex, Gemini, and future models without rewriting retrieval.
- A real code graph and contract index let an agent locate stable symbols instead of reading entire repositories.
- A single validation pipeline lets task concurrency increase without multiplying merge conflicts.
- Event and cost telemetry supports dynamic model choice by task risk/complexity.

## Milestones

1. **Current starter:** SQLite daemon, explicit memory CLI, prompt injection, headless CLI spawning, contract approvals.
2. **Next:** provider adapter tests, hook wiring, event normalization, session resume, cost/cancellation handling.
3. **Then:** central task DAG, automatic scheduler, file leases, worktrees, Git-only integration.
4. **After correctness:** PTY desktop, memory inspection UI, semantic index, code graph, MCP shim.
5. **Production hardening:** brokered IPC, OS containment, auth isolation, deduplication, failure recovery, and budget enforcement.

## Immediate test criteria

- Private memory from agent A cannot be queried by agent B.
- Shared proposal cannot be read as approved until authorized review.
- Frontend agent retrieves approved contract v1 and does not invent a missing endpoint.
- If backend proposes v2, frontend receives an event, but v1 remains canonical until approval.
- Two workers on disjoint files do not collide; overlapping writers cannot launch simultaneously (scheduler milestone).
- Restart daemon and ensure accepted memory, contracts, events persist.
- Reviewer cannot bypass physical Git boundary (security milestone).
