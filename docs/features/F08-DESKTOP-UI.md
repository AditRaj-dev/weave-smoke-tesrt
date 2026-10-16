# F08 — Developer Cockpit

**Priority:** P0 · **Deps:** PTY-002, WF-001, TASK-001

## Behavior
Display project switcher, Mastermind phase and approval, task DAG, actual xterm PTY tabs, evidence/diff/contract/memory details and live event feed. Every state change is a projection of daemon event stream; UI cannot fabricate reviewer/commit success. Clicking task highlights assigned terminal, packet, blocked reason and report history. Provide project import dry-run, install-provider status, run pause, task stop, gate approve/revise, Git operation preview.

## States
Loading/empty/error/reconnecting/stale output/collapsed panels; distinct provider missing vs daemon unavailable vs exited vs task blocked. User input to selected controlled terminal only; tab switch must not leak keystrokes.

## Acceptance
Agent row ↔ terminal ↔ task ↔ evidence navigation works; approvals guarded; memory read/write arrows distinguished; no dead dummy buttons; screen reader labels and keyboard navigation.
