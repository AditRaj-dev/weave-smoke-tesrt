import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTheme } from '../theme/useTheme.js';
import { Button } from './Button.js';
import { Badge } from './Badge.js';
export function Header({ projectName = 'No Project Loaded (M0 Bootstrap)', runId = null, onOpenShortcuts, }) {
    const { theme, resolvedTheme, toggleTheme } = useTheme();
    return (_jsxs("header", { role: "banner", style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.625rem 1.25rem',
            backgroundColor: 'var(--weave-bg-surface)',
            borderBottom: '1px solid var(--weave-border-default)',
            color: 'var(--weave-text-primary)',
        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [_jsx("span", { style: {
                                    fontWeight: 800,
                                    fontSize: '1.125rem',
                                    letterSpacing: '0.05em',
                                    color: 'var(--weave-accent-primary)',
                                }, children: "WEAVE" }), _jsx("span", { style: {
                                    fontSize: '0.75rem',
                                    padding: '0.125rem 0.375rem',
                                    backgroundColor: 'var(--weave-bg-surface-elevated)',
                                    borderRadius: '0.25rem',
                                    color: 'var(--weave-text-muted)',
                                    fontFamily: 'var(--weave-font-mono)',
                                }, children: "v0.1.0-M0" })] }), _jsx("div", { style: { height: '1.25rem', width: '1px', backgroundColor: 'var(--weave-border-default)' } }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.625rem' }, children: [_jsx("span", { style: { fontSize: '0.875rem', fontWeight: 600 }, children: projectName }), runId ? (_jsx(Badge, { status: "info", children: runId })) : (_jsx(Badge, { status: "unavailable", children: "No Active Run (Daemon Offline)" }))] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.625rem' }, children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: toggleTheme, "aria-label": `Toggle theme. Current theme is ${theme} (resolved: ${resolvedTheme}). Press 't' to toggle.`, title: "Toggle Dark/Light Mode (Keyboard: 't')", children: [resolvedTheme === 'dark' ? '☀️ Light' : '🌙 Dark', _jsx("span", { style: {
                                    fontSize: '0.7rem',
                                    opacity: 0.75,
                                    padding: '0.1rem 0.3rem',
                                    backgroundColor: 'var(--weave-bg-muted)',
                                    borderRadius: '0.2rem',
                                    fontFamily: 'var(--weave-font-mono)',
                                }, children: "t" })] }), onOpenShortcuts && (_jsxs(Button, { variant: "ghost", size: "sm", onClick: onOpenShortcuts, "aria-label": "Open keyboard shortcuts help. Press '?'", title: "Keyboard Shortcuts (Press '?')", children: ["\u2328\uFE0F Shortcuts", _jsx("span", { style: {
                                    fontSize: '0.7rem',
                                    opacity: 0.75,
                                    padding: '0.1rem 0.3rem',
                                    backgroundColor: 'var(--weave-bg-muted)',
                                    borderRadius: '0.2rem',
                                    fontFamily: 'var(--weave-font-mono)',
                                }, children: "?" })] }))] })] }));
}
//# sourceMappingURL=Header.js.map