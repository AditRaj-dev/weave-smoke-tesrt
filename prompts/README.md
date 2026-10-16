# WEAVE agent files and CLI role prompt assembly

The repository-level instruction files are `AGENTS.md` (Codex and shared WEAVE rules), `CLAUDE.md`, and `GEMINI.md`. At future managed dispatch, WEAVE validates `TASK_PACKET.json` against `contracts/schemas/task-packet.schema.json`, then renders `templates/TASK_PACKET_INSTRUCTIONS.md` and the mapped role guidance into a scoped `ROLE.md`. It records hashes and approved read-set references in the session context manifest. The initial interactive message is rendered from `templates/CLI_STARTUP_MESSAGE.md`; where a native instruction file is supported, its scoped pointer uses `templates/PROVIDER_INSTRUCTION_POINTER.md`. Both point to the role and packet. The role and packet remain immutable for that session; a revision creates a new packet version and session. `docs/PROVIDER_RUNTIME.md` governs where a probed Claude Code, Codex CLI, Gemini CLI or generic PTY receives the instructions. No provider flag is implied by these templates.

| Packet `role` | Append these prompts to the generated role file, in order |
|---|---|
| `orchestrator` | `prompts/ORCHESTRATOR.md` |
| `researcher` | `prompts/RESEARCHER.md` |
| `ui_designer` | `prompts/DESIGNER.md` |
| `frontend` | `prompts/CODING_AGENT.md`, `prompts/FRONTEND.md` |
| `backend` | `prompts/CODING_AGENT.md`, `prompts/BACKEND.md` |
| `database` | `prompts/CODING_AGENT.md`, `prompts/DATABASE.md` |
| `reviewer` | `prompts/REVIEWER.md`, `prompts/INTEGRATION_CHECKS.md` |
| `tester` | `prompts/TESTER.md`, `prompts/INTEGRATION_CHECKS.md` |
| `browser_qa` | `prompts/TESTER.md`, `prompts/BROWSER_QA.md`, `prompts/INTEGRATION_CHECKS.md` |

`config/role-prompts.json` is the machine-readable mapping behind this table. The coordinator substitutes `{{ROLE_GUIDANCE}}` with the mapped prompt content, provides only packet-authorized capabilities, and ensures the CLI can actually consume the rendered artifacts. `AGENTS.md` gives the context retrieval order; `docs/PROTOCOLS.md` defines CLI behavior. The local `weave memory` starter exists under `crates/`, but task reporting, contract show/propose, managed provider launch, and automatic role-file injection are not implemented. `weave --help` is the availability check. ADR-011/012 in `docs/ADR.md` record the approved implementation boundary.

## Roles named by the integration starter

The `docs/INTEGRATION_CONTRACT.md` and root `README.md` describe an **example application**. Its operation IDs and endpoints apply only when a task packet pins `contracts/openapi.yaml` and `contracts/integration-map.yaml`. Frontend/backend supplements above carry that contract behavior. Reviewers and testers use the approved OpenAPI and integration map when assigned to those tasks.

The starter's “Main Orchestrator” maps to `orchestrator`. “Task Manager” maps to the deterministic task scheduler, and “Git Manager” maps to the deterministic Git broker; neither is a free-running LLM role or gets an agent prompt. “Integration Agent” describes independent reviewer/tester verification followed by brokered integration; the current `config/roles.yaml` has no separate integration role. If a separate role is wanted later, it needs a role/capability decision and a task-packet contract update.

## Provider delivery

The root `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` are normal repository instructions. A managed session will also receive an immutable generated `ROLE.md`, packet, context manifest, and short startup message. The scoped provider pointer must be installed only after a version-specific instruction-precedence probe. The manual terminal probe in `docs/parallel-agents/terminal-role-probe/README.md` verified a read-only Codex file-pointer flow, not managed WEAVE dispatch. Gemini's last probe stopped at authentication; do not claim it accepted the role prompt.

For a local **preview only**, run `python scripts/render_agent_bundle.py --packet <packet.json> --output <empty-directory>`. The script validates the v1 packet, reads `config/role-prompts.json`, and writes `TASK_PACKET.json`, `ROLE.md`, `CONTEXT_MANIFEST.json`, `INITIAL_MESSAGE.txt`, and `PROVIDER_POINTER.txt`. It refuses a nonempty output directory and marks the manifest `preview_only_not_dispatched`. It does not verify a real worktree, install a native instruction file, launch a provider, grant capabilities, or accept a task report.
