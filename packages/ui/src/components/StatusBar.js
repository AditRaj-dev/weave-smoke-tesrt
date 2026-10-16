import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge } from './Badge.js';
const DEFAULT_CONNECTION = {
    status: 'offline',
    lastSeq: 0,
    maxWorkers: 2,
    gitIsolationMode: 'cooperative',
};
export function StatusBar({ connection = DEFAULT_CONNECTION, }) {
    const isConnected = connection.status === 'connected';
    return (_jsxs("footer", { role: "contentinfo", "aria-label": "System and connection status", style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.375rem 1rem',
            backgroundColor: 'var(--weave-bg-surface-elevated)',
            borderTop: '1px solid var(--weave-border-default)',
            fontSize: '0.75rem',
            color: 'var(--weave-text-secondary)',
        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.375rem' }, children: [_jsx("span", { style: {
                                    width: '0.5rem',
                                    height: '0.5rem',
                                    borderRadius: '9999px',
                                    backgroundColor: isConnected ? 'var(--weave-status-done)' : 'var(--weave-status-unavailable)',
                                    display: 'inline-block',
                                }, "aria-hidden": "true" }), _jsxs("span", { children: ["Daemon: ", _jsx("strong", { children: connection.status.toUpperCase() })] }), _jsx("span", { style: { fontFamily: 'var(--weave-font-mono)', color: 'var(--weave-text-muted)' }, children: "(Pending INF-003 IPC)" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.25rem' }, children: [_jsx("span", { children: "Cursor Seq:" }), _jsx("span", { style: { fontFamily: 'var(--weave-font-mono)', fontWeight: 600 }, children: connection.lastSeq })] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.375rem' }, children: [_jsx("span", { children: "Concurrency Target:" }), _jsxs(Badge, { status: "info", children: ["Max ", connection.maxWorkers, " Workers"] }), _jsx(Badge, { status: "info", children: "1 Reviewer" }), _jsx(Badge, { status: "info", children: "1 Tester" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.375rem' }, children: [_jsx("span", { children: "Git Policy:" }), _jsx(Badge, { status: "info", children: connection.gitIsolationMode })] }), _jsxs("div", { style: { color: 'var(--weave-text-muted)', fontFamily: 'var(--weave-font-mono)' }, children: ["Press ", _jsx("kbd", { style: { padding: '0.1rem 0.3rem', backgroundColor: 'var(--weave-bg-surface)', border: '1px solid var(--weave-border-subtle)', borderRadius: '0.2rem' }, children: "?" }), " for help"] })] })] }));
}
//# sourceMappingURL=StatusBar.js.map