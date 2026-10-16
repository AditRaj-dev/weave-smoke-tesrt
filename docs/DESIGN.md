# WEAVE Design System (Desktop)

**Status:** Proposed starter visual contract for WEAVE itself; not a replacement for the Mastermind Phase 6–7 human approval gates for projects built *inside* WEAVE.

## Product principle
Developer cockpit must make operational truth immediately legible. Explicit **direction of information flow**, truthful agent status, visible evidence and controls. Prioritize density, contrast and keyboard reach over visual novelty.

## Layout specification (desktop ≥1280px)
Header 52px; left task rail 264px (resize 220–360); main terminal minimum 520px; right inspector 340px (resize 280–480); bottom timeline 144px expandable. Pane dividers 1px, resize handles 6px. Terminal tab height 38px; task rows 40px; activity rows 30px; inspector line height 1.45. At 1100–1279px right inspector overlays/docks; below 1100px use switchable views.

## Color system
Names (not literal role/status inference):
- Canvas `#0D1017`; surface `#151B24`; raised `#1C2431`; inset `#10151D`.
- Border `#2A3445`; muted text `#9AA8BC`; body text `#E8EEF7`; secondary text `#C4CEDC`.
- Accent `#82B7FF` (buttons/focus), selected highlight `#213952`.
- Success `#52C5A3`; warning `#F5C36A`; danger `#F07777`; running `#91A8FF`; idle `#90A0B4`.
**Don't rely on color alone.** Every task state has icon + text. Validate WCAG contrast in implementation tests.

## Typography, shape, spacing
System UI stack `Inter, ui-sans-serif, system-ui, sans-serif` with fallback; monospace `JetBrains Mono, ui-monospace, SFMono-Regular, Consolas, monospace` (fonts optional, never ship licensed fonts without permission). Body 13px/20px, headings 16px/24px, compact metadata 11px/16px, terminal user-configurable 12–18px. Spacing 4px base (4/8/12/16/24/32); radii 6px controls, 10px large panels; borders 1px. No intense blur, neon borders, gradients by default.

## Component inventory and interactions
- `ProjectSwitcher`, `WorkflowStepRail`, `GateApprovalPanel`, `TaskDAG`, `TaskRow`, `AgentAvatarStatus` (role label, not human imagery), `TerminalTabBar`, `TerminalView`, `TerminalReconnectBanner`, `TaskInspector`, `ContractPinBadge`, `MemoryItemCitation`, `MemoryFlowGraph`, `EvidenceTimeline`, `ReviewVerdictPanel`, `GitOperationPreview`, `ProviderCapabilityCard`, `ImportPreviewDialog`.
- Each component handles `loading, empty, error, stale, ready, disabled`, where applicable.
- `TerminalView` must allow raw xterm focus and keyboard ownership; fake commands/AI output animation forbidden.
- Approve/merge/push destructive flows display affected artifacts/branches/revision, warning and explicit confirmation.
- MemoryFlowGraph arrows: solid directional `agent → proposed memory` WRITE; `validated memory → agent` READ; `worker → reviewer` HANDOFF; `reviewer → memory` VALIDATE. Double arrows only if **two distinct supported relations exist**; label both directions.

## User feedback
Review outcomes show `PASS|FAIL` with diff hash, evidence link and last verified timestamp. Running agent indicators derived from daemon session live state, not model claims. Outdated/disconnected sessions labeled `STALE` with reconnect action. Loading spinners never masquerade as work progress.

## UI acceptance
Component interaction tests, keyboard navigation, focus/shortcut isolation, at least one light-theme proof, empty/provider-missing/daemon-offline mock states, long file paths truncated with full tooltip, contrast audit. Imported Mastermind design tokens for *user projects* remain separate from WEAVE cockpit tokens.
