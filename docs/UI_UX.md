# WEAVE Desktop Cockpit — UI/UX Specification

## Visual language
Native developer cockpit, functional not ornamental. Low-distraction dark-first palette, optional light mode, clear focus, semantic status color, avoid meaningless neon/glow. Typography: system UI for controls, monospace in terminals/code. Resizable panes, persist layout per user/project.

## Desktop regions
```
┌ Project ▾ ─ Phase 8: Build [Awaiting approval] ─ Active 3/4 ─ Pause ┐
│ TASKS / DAG        │ TERMINAL WORKSPACE         │ TASK CONTEXT       │
│ ▾ Backend          │ [Orchestrator] [BE A] [FE] │ Packet / contracts │
│  BE-014 Running    │                            │ Scoped memory      │
│  BE-015 Ready      │ Genuine xterm.js / ConPTY   │ Diff + findings    │
│ ▾ Frontend         │ with terminal controls     │ Test evidence      │
│  FE-019 Reviewing  │                            │ Approvals          │
├────────────────────┴────────────────────────────┴─────────────────────┤
│ EVENT TIMELINE: accepted reports · reviews · tests · Git operations    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Screens
1. **Project Launcher:** import local Mastermind project, detect CLI providers, choose existing repo, preview migration. No destructive auto-import.
2. **Run Dashboard:** phase/progress/gates, DAG list, current blockers, active PTYs, metrics and context.
3. **Terminal Workspace:** tabs/panels with actual PTY stream, input focus, resize, stop, attach/replay, copy/search. User can take control of session with explicit badge and input lock.
4. **Task Detail:** immutable packet, dependencies, lease scope, assigned provider/model, attempt, reports, changed files, review and tests, memory candidates.
5. **Workflow/Gate Review:** document diff, user `Approve` / `Request changes` / `Pause` actions, provenance/time, no silent next phase.
6. **Contract Viewer:** version-pinned HTTP/event schema, generated client status and drift errors.
7. **Memory Graph:** visually distinct **bidirectional** read/write/handoff arrows; labels on every edge (query, propose, validate, publish). Nodes are scopes/tasks/agents/approved truth; not all edges have the same semantics.
8. **Code Graph (P1):** symbol/reference graph with revision, jump to path:line, stale indicator.
9. **Browser QA (P1):** Playwright sessions with artifacts, screenshot gallery, console/network events; don't synthesize passed tests from screenshot existence.
10. **Git Review:** changed paths, diff, reviewer findings, tests, broker operation preview, explicit push/merge/discard confirmation.

## Component states
Every async widget includes loading, empty, error, stale/reconnecting and success states. Terminal disconnected banner distinguishes `UI disconnected`, `daemon unavailable`, `provider exited`, and `stream output gap`. If provider not installed, show a real action to select CLI path, not fake spawn.

## Interaction details
- Clicking DAG node highlights its terminal and report; user may open task-specific review without switching project.
- `Approve gate` available only when artifact validation passed. `Request changes` returns phase to authoring with note.
- Default tab switching does not send keyboard input to hidden PTYs.
- Stop agent: confirmation for termination; killing process does not implicitly fail task if handoff already submitted.
- Responsive minimum width 1100px for full cockpit; at narrower width hide secondary rails behind switchable panes; no shrinking code/terminal illegibly.
- Keyboard shortcuts configurable; maintain focus semantics and `aria-live` for task status changes, avoid announcing every PTY byte to screen reader.

## UX acceptance
User can (a) see which agents are real/live, (b) identify exact blocker in one click, (c) review a diff/test before approval, (d) understand candidate vs validated memory, (e) tell which way a memory/event arrow travels. Never use red/green as only status indicator.
