import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { Badge } from './Badge.js';
const DEFAULT_TASKS = [
    {
        id: 'INF-001',
        title: 'Bootstrap native workspace and CI',
        domain: 'infrastructure',
        milestone: 'M0',
        status: 'proposed',
        dependsOn: [],
        writePaths: ['apps/desktop/**', 'crates/**', 'packages/**'],
        exclusiveResources: ['workspace:bootstrap'],
    },
    {
        id: 'INF-002',
        title: 'SQLite store and events',
        domain: 'database',
        milestone: 'M0',
        status: 'proposed',
        dependsOn: ['INF-001'],
        writePaths: ['crates/weave-store/**'],
        exclusiveResources: ['db:migrations'],
    },
    {
        id: 'INF-003',
        title: 'Local authenticated IPC and CLI',
        domain: 'api',
        milestone: 'M0',
        status: 'proposed',
        dependsOn: ['INF-001', 'INF-002'],
        writePaths: ['crates/weave-daemon/**', 'crates/weave-cli/**'],
        exclusiveResources: ['api:ipc'],
    },
    {
        id: 'PTY-001',
        title: 'Native PTY supervisor',
        domain: 'runtime',
        milestone: 'M0',
        status: 'proposed',
        dependsOn: ['INF-001', 'INF-003'],
        writePaths: ['crates/weave-daemon/src/pty/**'],
        exclusiveResources: ['daemon:pty'],
    },
    {
        id: 'PTY-002',
        title: 'xterm UI and event replay',
        domain: 'frontend',
        milestone: 'M0',
        status: 'proposed',
        dependsOn: ['PTY-001'],
        writePaths: ['apps/desktop/**', 'packages/ui/**'],
        exclusiveResources: ['ui:terminals'],
    },
    {
        id: 'PROV-001',
        title: 'Provider probes and role bootstrap',
        domain: 'runtime',
        milestone: 'M0',
        status: 'proposed',
        dependsOn: ['PTY-001', 'INF-003'],
        writePaths: ['crates/weave-provider/**'],
        exclusiveResources: ['provider:adapters'],
    },
];
export function TaskDagPanel({ tasks = DEFAULT_TASKS, selectedTaskId = 'INF-001', onSelectTask, }) {
    const [filter, setFilter] = useState('all');
    const [activeTaskId, setActiveTaskId] = useState(selectedTaskId);
    const filteredTasks = tasks.filter((t) => {
        if (filter === 'all')
            return true;
        return t.status === filter;
    });
    const handleSelect = (taskId) => {
        setActiveTaskId(taskId);
        onSelectTask?.(taskId);
    };
    const handleKeyDown = (e, index) => {
        if (e.key === 'ArrowDown' && index < filteredTasks.length - 1) {
            e.preventDefault();
            handleSelect(filteredTasks[index + 1].id);
        }
        else if (e.key === 'ArrowUp' && index > 0) {
            e.preventDefault();
            handleSelect(filteredTasks[index - 1].id);
        }
    };
    return (_jsxs("section", { "aria-label": "Task DAG & Concurrency Status", style: {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: 'var(--weave-bg-surface)',
            borderRight: '1px solid var(--weave-border-default)',
            overflow: 'hidden',
        }, children: [_jsxs("div", { style: {
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--weave-border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [_jsxs("h2", { style: { fontSize: '0.875rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--weave-text-muted)' }, children: ["Tasks (", tasks.length, ")"] }), _jsx(Badge, { status: "unavailable", children: "Non-Live" }), _jsx("span", { style: {
                                    fontSize: '0.7rem',
                                    padding: '0.1rem 0.35rem',
                                    backgroundColor: 'var(--weave-bg-muted)',
                                    borderRadius: '0.2rem',
                                    color: 'var(--weave-text-muted)',
                                    fontFamily: 'var(--weave-font-mono)',
                                }, children: "Key: 2" })] }), _jsxs("select", { "aria-label": "Filter tasks by status", value: filter, onChange: (e) => setFilter(e.target.value), style: {
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.4rem',
                            borderRadius: '0.25rem',
                            border: '1px solid var(--weave-border-default)',
                            backgroundColor: 'var(--weave-bg-canvas)',
                            color: 'var(--weave-text-primary)',
                        }, children: [_jsx("option", { value: "all", children: "All States" }), _jsx("option", { value: "running", children: "Running" }), _jsx("option", { value: "ready", children: "Ready" }), _jsx("option", { value: "proposed", children: "Proposed" }), _jsx("option", { value: "blocked", children: "Blocked" }), _jsx("option", { value: "done", children: "Done" })] })] }), _jsx("div", { role: "listbox", "aria-label": "Tasks list", style: {
                    flex: 1,
                    overflowY: 'auto',
                    padding: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.375rem',
                }, children: filteredTasks.map((task, idx) => {
                    const isSelected = task.id === activeTaskId;
                    return (_jsxs("div", { role: "option", "aria-selected": isSelected, tabIndex: isSelected ? 0 : -1, onClick: () => handleSelect(task.id), onKeyDown: (e) => handleKeyDown(e, idx), style: {
                            padding: '0.625rem 0.75rem',
                            borderRadius: '0.375rem',
                            border: isSelected
                                ? '1px solid var(--weave-accent-primary)'
                                : '1px solid var(--weave-border-subtle)',
                            backgroundColor: isSelected
                                ? 'var(--weave-bg-surface-elevated)'
                                : 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.375rem',
                            transition: 'background-color 0.1s ease',
                        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsx("span", { style: { fontFamily: 'var(--weave-font-mono)', fontWeight: 700, fontSize: '0.8125rem', color: isSelected ? 'var(--weave-accent-primary)' : 'var(--weave-text-primary)' }, children: task.id }), _jsx(Badge, { status: task.status, children: task.status })] }), _jsx("div", { style: { fontSize: '0.8125rem', fontWeight: 500, color: 'var(--weave-text-secondary)', lineHeight: 1.3 }, children: task.title }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--weave-text-muted)' }, children: [_jsxs("span", { children: ["Domain: ", _jsx("strong", { children: task.domain })] }), task.dependsOn.length > 0 && (_jsxs("span", { children: ["Deps: ", task.dependsOn.join(', ')] }))] })] }, task.id));
                }) })] }));
}
//# sourceMappingURL=TaskDagPanel.js.map