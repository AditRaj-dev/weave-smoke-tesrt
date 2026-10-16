import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Badge } from './Badge.js';
const DEFAULT_SLOTS = [
    {
        slotId: 'slot-worker-1',
        label: 'Worker 1 (Coding)',
        role: 'worker',
        provider: 'claude',
        status: 'unavailable',
        unavailabilityNotice: 'Real OS ConPTY session unavailable until PTY-001 supervisor and PTY-002 xterm UI are integrated.',
    },
    {
        slotId: 'slot-worker-2',
        label: 'Worker 2 (Coding)',
        role: 'worker',
        provider: 'codex',
        status: 'unavailable',
        unavailabilityNotice: 'Real OS ConPTY session unavailable until PTY-001 supervisor and PTY-002 xterm UI are integrated.',
    },
    {
        slotId: 'slot-reviewer',
        label: 'Reviewer (Independent)',
        role: 'reviewer',
        provider: 'gemini',
        status: 'unavailable',
        unavailabilityNotice: 'Real OS ConPTY session unavailable until PTY-001 supervisor and PTY-002 xterm UI are integrated.',
    },
    {
        slotId: 'slot-tester',
        label: 'Tester (QA Sandbox)',
        role: 'tester',
        provider: 'claude',
        status: 'unavailable',
        unavailabilityNotice: 'Real OS ConPTY session unavailable until PTY-001 supervisor and PTY-002 xterm UI are integrated.',
    },
];
export function TerminalPlaceholderPanel({ slots = DEFAULT_SLOTS, }) {
    const [selectedSlotId, setSelectedSlotId] = useState(slots[0].slotId);
    const selectedSlot = slots.find((s) => s.slotId === selectedSlotId) ?? slots[0];
    const handleKeyDown = (e, index) => {
        if (e.key === 'ArrowRight' && index < slots.length - 1) {
            e.preventDefault();
            setSelectedSlotId(slots[index + 1].slotId);
        }
        else if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            setSelectedSlotId(slots[index - 1].slotId);
        }
    };
    return (_jsxs("section", { "aria-label": "Interactive Terminal Sessions", style: {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: 'var(--weave-bg-canvas)',
            overflow: 'hidden',
        }, children: [_jsxs("div", { role: "tablist", "aria-label": "Terminal Session Slots", style: {
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'var(--weave-bg-surface)',
                    borderBottom: '1px solid var(--weave-border-default)',
                    padding: '0 0.5rem',
                    gap: '0.25rem',
                    minHeight: '2.5rem',
                }, children: [_jsx("span", { style: {
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: 'var(--weave-text-muted)',
                            marginRight: '0.5rem',
                        }, children: "Terminal Slots:" }), slots.map((slot, idx) => {
                        const isSelected = slot.slotId === selectedSlotId;
                        return (_jsxs("button", { role: "tab", "aria-selected": isSelected, "aria-controls": `panel-${slot.slotId}`, id: `tab-${slot.slotId}`, tabIndex: isSelected ? 0 : -1, onClick: () => setSelectedSlotId(slot.slotId), onKeyDown: (e) => handleKeyDown(e, idx), style: {
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.4rem 0.75rem',
                                border: 'none',
                                borderBottom: isSelected ? '2px solid var(--weave-accent-primary)' : '2px solid transparent',
                                backgroundColor: isSelected ? 'var(--weave-bg-canvas)' : 'transparent',
                                color: isSelected ? 'var(--weave-text-primary)' : 'var(--weave-text-muted)',
                                fontSize: '0.8125rem',
                                fontWeight: isSelected ? 600 : 400,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                transition: 'all 0.1s ease',
                            }, children: [_jsx("span", { children: slot.label }), _jsx(Badge, { status: slot.status, children: "Unavailable" })] }, slot.slotId));
                    })] }), _jsx("div", { id: `panel-${selectedSlot.slotId}`, role: "tabpanel", "aria-labelledby": `tab-${selectedSlot.slotId}`, style: {
                    flex: 1,
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    overflowY: 'auto',
                }, children: _jsxs("div", { style: {
                        maxWidth: '42rem',
                        padding: '2rem',
                        borderRadius: '0.75rem',
                        backgroundColor: 'var(--weave-bg-surface)',
                        border: '1px solid var(--weave-border-default)',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.25rem',
                        alignItems: 'center',
                    }, children: [_jsx("div", { style: {
                                width: '3.5rem',
                                height: '3.5rem',
                                borderRadius: '9999px',
                                backgroundColor: 'var(--weave-status-unavailable-bg)',
                                color: 'var(--weave-text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.75rem',
                            }, "aria-hidden": "true", children: "\uD83D\uDCDF" }), _jsxs("div", { children: [_jsx("div", { style: { display: 'inline-block', marginBottom: '0.5rem' }, children: _jsx(Badge, { status: "unavailable", children: "PTY SUBSYSTEM PENDING (PTY-001 / PTY-002)" }) }), _jsx("h3", { style: { margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--weave-text-primary)' }, children: "Real Terminal Sessions Unavailable" }), _jsx("p", { style: { margin: 0, fontSize: '0.9375rem', color: 'var(--weave-text-secondary)', lineHeight: 1.6 }, children: selectedSlot.unavailabilityNotice })] }), _jsxs("div", { style: {
                                width: '100%',
                                padding: '1rem',
                                borderRadius: '0.5rem',
                                backgroundColor: 'var(--weave-bg-surface-elevated)',
                                border: '1px solid var(--weave-border-subtle)',
                                textAlign: 'left',
                                fontSize: '0.8125rem',
                                color: 'var(--weave-text-secondary)',
                                lineHeight: 1.5,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                            }, children: [_jsx("div", { style: { fontWeight: 600, color: 'var(--weave-text-primary)' }, children: "Architectural Invariant (WEAVE-ARCH-001 & WEAVE-PRD-001):" }), _jsxs("ul", { style: { margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }, children: [_jsxs("li", { children: [_jsx("strong", { children: "No Simulated PTYs:" }), " WEAVE does not simulate interactive terminal execution or fabricate agent activity. Real CLI workers (Claude, Codex, Gemini) run in genuine OS ConPTY/POSIX processes supervised by the daemon."] }), _jsxs("li", { children: [_jsx("strong", { children: "Independent Daemon Ownership:" }), " The daemon owns PTY lifecycles. Closing or reloading this desktop UI will not kill active background tasks."] }), _jsxs("li", { children: [_jsx("strong", { children: "Evidence vs Assertion:" }), " Worker output text does not advance task states. Completed tasks require machine-checked reports matching ", _jsx("code", { children: "contracts/schemas/task-report.schema.json" }), "."] })] })] }), _jsxs("div", { style: { fontSize: '0.75rem', color: 'var(--weave-text-muted)', fontFamily: 'var(--weave-font-mono)' }, children: ["Selected Slot: ", selectedSlot.slotId, " \u00B7 Provider Target: ", selectedSlot.provider, " \u00B7 Role: ", selectedSlot.role] })] }) })] }));
}
//# sourceMappingURL=TerminalPlaceholderPanel.js.map