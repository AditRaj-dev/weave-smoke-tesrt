import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Badge } from './Badge.js';
import { Button } from './Button.js';
import { Modal } from './Modal.js';
const DEFAULT_PROPOSED_PHASES = [
    { id: '0', numberLabel: '0', name: 'Setup', requiresHumanApproval: false, status: 'proposed' },
    { id: '1', numberLabel: '1', name: 'Discovery', requiresHumanApproval: true, status: 'proposed' },
    { id: '2', numberLabel: '2', name: 'PRD', requiresHumanApproval: true, status: 'proposed' },
    { id: '3', numberLabel: '3', name: 'Feature Specs', requiresHumanApproval: true, status: 'proposed' },
    { id: '4', numberLabel: '4', name: 'Implementation Plan', requiresHumanApproval: true, status: 'proposed' },
    { id: '5', numberLabel: '5', name: 'API Record', requiresHumanApproval: true, status: 'proposed' },
    { id: '6', numberLabel: '6', name: 'Design System', requiresHumanApproval: true, status: 'proposed' },
    { id: '7', numberLabel: '7', name: 'HTML Mockups', requiresHumanApproval: true, status: 'proposed' },
    { id: '7.5', numberLabel: '7.5', name: 'HTML-to-React', isConditional: true, requiresHumanApproval: false, status: 'proposed' },
    { id: '8', numberLabel: '8', name: 'Build and Verify', requiresHumanApproval: true, status: 'proposed' },
    { id: '9', numberLabel: '9', name: 'Wrap and Finish', requiresHumanApproval: true, status: 'proposed' },
];
export function PhaseWorkflowBar({ phases = DEFAULT_PROPOSED_PHASES, currentPhaseId = '0', onSelectPhase, onApproveGate, onRequestChanges, }) {
    const [selectedPhaseId, setSelectedPhaseId] = useState(currentPhaseId);
    const [confirmGateAction, setConfirmGateAction] = useState(null);
    const [changeNotes, setChangeNotes] = useState('');
    const selectedPhase = phases.find((p) => p.id === selectedPhaseId) ?? phases[0];
    const canPerformGateActions = selectedPhase.status === 'awaiting_approval' &&
        typeof onApproveGate === 'function' &&
        typeof onRequestChanges === 'function';
    const handleKeyDown = (e, index) => {
        if (e.key === 'ArrowRight' && index < phases.length - 1) {
            e.preventDefault();
            const nextId = phases[index + 1].id;
            setSelectedPhaseId(nextId);
            onSelectPhase?.(nextId);
        }
        else if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            const prevId = phases[index - 1].id;
            setSelectedPhaseId(prevId);
            onSelectPhase?.(prevId);
        }
    };
    return (_jsxs("section", { "aria-label": "Mastermind Workflow Phases", style: {
            padding: '0.75rem 1.25rem',
            backgroundColor: 'var(--weave-bg-surface)',
            borderBottom: '1px solid var(--weave-border-default)',
        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.75rem' }, children: [_jsx("h2", { style: { fontSize: '0.875rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--weave-text-muted)' }, children: "Mastermind Workflow Phases (0\u20139 & 7.5)" }), _jsx(Badge, { status: "unavailable", children: "Proposed Spec Baseline" }), selectedPhase.isConditional && (_jsx(Badge, { status: "warning", children: "Conditional Phase" }))] }), _jsx("div", { children: canPerformGateActions ? (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [_jsxs("span", { style: { fontSize: '0.8125rem', color: 'var(--weave-text-secondary)' }, children: ["Gate: ", _jsx("strong", { children: "Human Approval Required" })] }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setConfirmGateAction('revise'), "aria-label": `Request changes on Phase ${selectedPhase.numberLabel}`, children: "Request Changes" }), _jsx(Button, { variant: "primary", size: "sm", onClick: () => setConfirmGateAction('approve'), "aria-label": `Approve Gate for Phase ${selectedPhase.numberLabel}`, children: "Approve Gate" })] })) : (_jsx("span", { style: { fontSize: '0.75rem', color: 'var(--weave-text-muted)' }, children: "Gate Actions Disabled (Workflow Engine Pending WF-001)" })) })] }), _jsx("nav", { role: "tablist", "aria-label": "Workflow Phase Steps", style: {
                    display: 'flex',
                    gap: '0.375rem',
                    overflowX: 'auto',
                    paddingBottom: '0.25rem',
                }, children: phases.map((phase, idx) => {
                    const isSelected = phase.id === selectedPhaseId;
                    return (_jsxs("button", { role: "tab", "aria-selected": isSelected, tabIndex: isSelected ? 0 : -1, onClick: () => {
                            setSelectedPhaseId(phase.id);
                            onSelectPhase?.(phase.id);
                        }, onKeyDown: (e) => handleKeyDown(e, idx), style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.375rem 0.625rem',
                            borderRadius: '0.375rem',
                            border: isSelected
                                ? '1px solid var(--weave-accent-primary)'
                                : '1px solid var(--weave-border-subtle)',
                            backgroundColor: isSelected
                                ? 'var(--weave-bg-surface-elevated)'
                                : 'transparent',
                            color: isSelected
                                ? 'var(--weave-text-primary)'
                                : 'var(--weave-text-secondary)',
                            fontSize: '0.8125rem',
                            fontWeight: isSelected ? 600 : 400,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s ease',
                        }, children: [_jsx("span", { style: {
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '1.25rem',
                                    height: '1.25rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    backgroundColor: phase.status === 'approved'
                                        ? 'var(--weave-status-done-bg)'
                                        : phase.status === 'in_progress'
                                            ? 'var(--weave-status-running-bg)'
                                            : 'var(--weave-bg-muted)',
                                    color: phase.status === 'approved'
                                        ? 'var(--weave-status-done)'
                                        : phase.status === 'in_progress'
                                            ? 'var(--weave-status-running)'
                                            : 'var(--weave-text-muted)',
                                }, children: phase.status === 'approved' ? '✓' : phase.numberLabel }), _jsx("span", { children: phase.name })] }, phase.id));
                }) }), canPerformGateActions && (_jsxs(_Fragment, { children: [_jsx(Modal, { isOpen: confirmGateAction === 'approve', onClose: () => setConfirmGateAction(null), title: `Confirm Approval for Phase ${selectedPhase.numberLabel}: ${selectedPhase.name}`, footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", size: "md", onClick: () => setConfirmGateAction(null), children: "Cancel" }), _jsx(Button, { variant: "primary", size: "md", onClick: () => {
                                        onApproveGate?.(selectedPhase.id);
                                        setConfirmGateAction(null);
                                    }, children: "Confirm & Advance Gate" })] }), children: _jsxs("p", { style: { margin: 0, lineHeight: 1.5 }, children: ["You are approving the gate for ", _jsxs("strong", { children: ["Phase ", selectedPhase.numberLabel, " (", selectedPhase.name, ")"] }), "."] }) }), _jsxs(Modal, { isOpen: confirmGateAction === 'revise', onClose: () => setConfirmGateAction(null), title: `Request Changes for Phase ${selectedPhase.numberLabel}: ${selectedPhase.name}`, footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", size: "md", onClick: () => setConfirmGateAction(null), children: "Cancel" }), _jsx(Button, { variant: "danger", size: "md", onClick: () => {
                                        onRequestChanges?.(selectedPhase.id, changeNotes);
                                        setConfirmGateAction(null);
                                        setChangeNotes('');
                                    }, children: "Submit Change Request" })] }), children: [_jsx("label", { htmlFor: "gate-change-notes", style: { display: 'block', marginBottom: '0.5rem', fontWeight: 500 }, children: "Change Request Guidance:" }), _jsx("textarea", { id: "gate-change-notes", rows: 4, value: changeNotes, onChange: (e) => setChangeNotes(e.target.value), placeholder: "Describe required changes or missing verification evidence...", style: {
                                    width: '100%',
                                    padding: '0.5rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid var(--weave-border-default)',
                                    backgroundColor: 'var(--weave-bg-canvas)',
                                    color: 'var(--weave-text-primary)',
                                    fontFamily: 'inherit',
                                    fontSize: '0.875rem',
                                    resize: 'vertical',
                                    boxSizing: 'border-box',
                                } })] })] }))] }));
}
//# sourceMappingURL=PhaseWorkflowBar.js.map