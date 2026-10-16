import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Badge } from './Badge.js';
const DEFAULT_CONTRACTS = [
    { id: 'task-report.schema.json', version: 'v1.0 proposed (draft 2020-12)', schemaPath: 'contracts/schemas/task-report.schema.json', status: 'proposed' },
    { id: 'task-packet.schema.json', version: 'v1.0 proposed (draft 2020-12)', schemaPath: 'contracts/schemas/task-packet.schema.json', status: 'proposed' },
    { id: 'event.schema.json', version: 'v1.0 proposed (draft 2020-12)', schemaPath: 'contracts/schemas/event.schema.json', status: 'proposed' },
    { id: 'handoff.schema.json', version: 'v1.0 proposed (draft 2020-12)', schemaPath: 'contracts/schemas/handoff.schema.json', status: 'proposed' },
];
export function DetailEvidencePanel({ task, evidence = [], contracts = DEFAULT_CONTRACTS, }) {
    const [activeTab, setActiveTab] = useState('packet');
    return (_jsxs("aside", { "aria-label": "Task Details, Contracts, and Evidence", style: {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: 'var(--weave-bg-surface)',
            borderLeft: '1px solid var(--weave-border-default)',
            overflow: 'hidden',
        }, children: [_jsx("div", { role: "tablist", "aria-label": "Detail Panel Tabs", style: {
                    display: 'flex',
                    backgroundColor: 'var(--weave-bg-surface-elevated)',
                    borderBottom: '1px solid var(--weave-border-default)',
                }, children: ['packet', 'evidence', 'contracts', 'git'].map((tab) => {
                    const isSelected = activeTab === tab;
                    const labels = {
                        packet: 'Packet',
                        evidence: `Evidence (${evidence.length})`,
                        contracts: 'Contracts',
                        git: 'Git Broker',
                    };
                    return (_jsx("button", { role: "tab", "aria-selected": isSelected, id: `detail-tab-${tab}`, tabIndex: isSelected ? 0 : -1, onClick: () => setActiveTab(tab), style: {
                            flex: 1,
                            padding: '0.625rem 0.5rem',
                            border: 'none',
                            borderBottom: isSelected ? '2px solid var(--weave-accent-primary)' : '2px solid transparent',
                            backgroundColor: isSelected ? 'var(--weave-bg-surface)' : 'transparent',
                            color: isSelected ? 'var(--weave-text-primary)' : 'var(--weave-text-secondary)',
                            fontSize: '0.75rem',
                            fontWeight: isSelected ? 600 : 500,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            textTransform: 'capitalize',
                            transition: 'all 0.1s ease',
                        }, children: labels[tab] }, tab));
                }) }), _jsxs("div", { style: { flex: 1, overflowY: 'auto', padding: '1rem' }, children: [activeTab === 'packet' && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '1rem' }, children: [_jsxs("div", { children: [_jsx("span", { style: { fontSize: '0.75rem', color: 'var(--weave-text-muted)', textTransform: 'uppercase', fontWeight: 600 }, children: "Selected Task" }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }, children: [_jsx("span", { style: { fontFamily: 'var(--weave-font-mono)', fontWeight: 700, fontSize: '1rem' }, children: task ? task.id : 'No Task Selected' }), task && _jsx(Badge, { status: task.status, children: task.status })] }), task && _jsx("p", { style: { margin: '0.375rem 0 0 0', fontSize: '0.875rem' }, children: task.title })] }), task && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("span", { style: { fontSize: '0.75rem', color: 'var(--weave-text-muted)', textTransform: 'uppercase', fontWeight: 600 }, children: "Allowed Write Globs (Strict Scope)" }), _jsx("div", { style: { marginTop: '0.375rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }, children: task.writePaths.map((path) => (_jsx("code", { style: {
                                                        display: 'block',
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '0.25rem',
                                                        backgroundColor: 'var(--weave-bg-surface-elevated)',
                                                        fontSize: '0.75rem',
                                                        fontFamily: 'var(--weave-font-mono)',
                                                        border: '1px solid var(--weave-border-subtle)',
                                                    }, children: path }, path))) })] }), _jsxs("div", { children: [_jsx("span", { style: { fontSize: '0.75rem', color: 'var(--weave-text-muted)', textTransform: 'uppercase', fontWeight: 600 }, children: "Exclusive Resource Leases" }), _jsx("div", { style: { marginTop: '0.375rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }, children: task.exclusiveResources.map((res) => (_jsx(Badge, { status: "info", children: res }, res))) })] }), _jsxs("div", { children: [_jsx("span", { style: { fontSize: '0.75rem', color: 'var(--weave-text-muted)', textTransform: 'uppercase', fontWeight: 600 }, children: "Dependencies" }), _jsx("div", { style: { marginTop: '0.375rem', fontSize: '0.8125rem' }, children: task.dependsOn.length > 0 ? (task.dependsOn.join(', ')) : (_jsx("span", { style: { color: 'var(--weave-text-muted)' }, children: "None (Root Task)" })) })] })] }))] })), activeTab === 'evidence' && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' }, children: [_jsx("span", { style: { fontSize: '0.75rem', color: 'var(--weave-text-muted)', textTransform: 'uppercase', fontWeight: 600 }, children: "Execution Evidence Ledger" }), evidence.length === 0 ? (_jsxs("div", { style: {
                                    padding: '1.5rem',
                                    textAlign: 'center',
                                    color: 'var(--weave-text-muted)',
                                    fontSize: '0.8125rem',
                                    backgroundColor: 'var(--weave-bg-surface-elevated)',
                                    borderRadius: '0.375rem',
                                }, children: ["No command evidence recorded yet.", _jsx("br", {}), _jsx("span", { style: { fontSize: '0.75rem' }, children: "Commands must be executed and recorded with timestamp, exit code, and artifact sha256." })] })) : (evidence.map((ev, idx) => (_jsxs("div", { style: {
                                    padding: '0.625rem',
                                    borderRadius: '0.375rem',
                                    backgroundColor: 'var(--weave-bg-surface-elevated)',
                                    border: '1px solid var(--weave-border-subtle)',
                                    fontSize: '0.75rem',
                                    fontFamily: 'var(--weave-font-mono)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.25rem',
                                }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("strong", { style: { color: 'var(--weave-text-primary)' }, children: ev.command }), _jsxs(Badge, { status: ev.exitCode === 0 ? 'done' : 'blocked', children: ["Exit ", ev.exitCode] })] }), _jsxs("div", { style: { color: 'var(--weave-text-muted)' }, children: ["Started: ", ev.startedAt] }), _jsxs("div", { style: { color: 'var(--weave-text-muted)' }, children: ["Finished: ", ev.finishedAt] }), _jsxs("div", { style: { wordBreak: 'break-all', color: 'var(--weave-text-secondary)' }, children: ["SHA-256: ", ev.artifactSha256] })] }, idx))))] })), activeTab === 'contracts' && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsx("span", { style: { fontSize: '0.75rem', color: 'var(--weave-text-muted)', textTransform: 'uppercase', fontWeight: 600 }, children: "Machine Contracts & Schemas" }), _jsx(Badge, { status: "unavailable", children: "Proposed Baseline" })] }), contracts.map((c) => (_jsxs("div", { style: {
                                    padding: '0.625rem',
                                    borderRadius: '0.375rem',
                                    backgroundColor: 'var(--weave-bg-surface-elevated)',
                                    border: '1px solid var(--weave-border-subtle)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.25rem',
                                }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("span", { style: { fontFamily: 'var(--weave-font-mono)', fontWeight: 600, fontSize: '0.8125rem' }, children: c.id }), _jsx(Badge, { status: c.status === 'approved' ? 'done' : 'proposed', children: c.status })] }), _jsx("div", { style: { fontSize: '0.75rem', color: 'var(--weave-text-secondary)' }, children: c.version }), _jsx("code", { style: { fontSize: '0.7rem', color: 'var(--weave-text-muted)', fontFamily: 'var(--weave-font-mono)' }, children: c.schemaPath })] }, c.id)))] })), activeTab === 'git' && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' }, children: [_jsx("span", { style: { fontSize: '0.75rem', color: 'var(--weave-text-muted)', textTransform: 'uppercase', fontWeight: 600 }, children: "Git Broker Status" }), _jsxs("div", { style: {
                                    padding: '0.75rem',
                                    borderRadius: '0.375rem',
                                    backgroundColor: 'var(--weave-bg-surface-elevated)',
                                    border: '1px solid var(--weave-border-subtle)',
                                    fontSize: '0.8125rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem',
                                }, children: [_jsxs("div", { children: [_jsx("strong", { children: "Isolation Mode:" }), " ", _jsx(Badge, { status: "info", children: "Cooperative" })] }), _jsx("p", { style: { margin: 0, fontSize: '0.75rem', color: 'var(--weave-text-secondary)', lineHeight: 1.4 }, children: "Per AGENTS.md: Workers are cooperatively restricted to approved worktrees. The Git Broker is the sole authority for mutations, staged integration, and commits." }), _jsx("div", { style: { fontSize: '0.75rem', color: 'var(--weave-text-muted)' }, children: "Integration Gate: Review PASS + Test PASS required before commit." })] })] }))] })] }));
}
//# sourceMappingURL=DetailEvidencePanel.js.map