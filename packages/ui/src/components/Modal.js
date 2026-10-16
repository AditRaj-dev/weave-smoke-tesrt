import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { Button } from './Button.js';
export function Modal({ isOpen, onClose, title, children, footer }) {
    const dialogRef = useRef(null);
    const previouslyFocusedElement = useRef(null);
    useEffect(() => {
        if (isOpen) {
            previouslyFocusedElement.current = document.activeElement;
            // Focus the dialog
            if (dialogRef.current) {
                dialogRef.current.focus();
            }
            const handleKeyDown = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    onClose();
                }
            };
            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
                if (previouslyFocusedElement.current) {
                    previouslyFocusedElement.current.focus();
                }
            };
        }
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    return (_jsx("div", { style: {
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(2px)',
            padding: '1rem',
        }, onClick: (e) => {
            if (e.target === e.currentTarget) {
                onClose();
            }
        }, role: "presentation", children: _jsxs("div", { ref: dialogRef, role: "dialog", "aria-modal": "true", "aria-labelledby": "modal-title", tabIndex: -1, style: {
                backgroundColor: 'var(--weave-bg-surface)',
                color: 'var(--weave-text-primary)',
                borderRadius: '0.5rem',
                border: '1px solid var(--weave-border-default)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
                maxWidth: '36rem',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                outline: 'none',
            }, children: [_jsxs("div", { style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem 1.25rem',
                        borderBottom: '1px solid var(--weave-border-subtle)',
                    }, children: [_jsx("h2", { id: "modal-title", style: { margin: 0, fontSize: '1.125rem', fontWeight: 600 }, children: title }), _jsx(Button, { variant: "ghost", size: "sm", onClick: onClose, "aria-label": "Close dialog", style: { padding: '0.25rem 0.5rem', minWidth: '2rem' }, children: "\u2715" })] }), _jsx("div", { style: { padding: '1.25rem', overflowY: 'auto' }, children: children }), footer && (_jsx("div", { style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '0.75rem',
                        padding: '0.875rem 1.25rem',
                        borderTop: '1px solid var(--weave-border-subtle)',
                        backgroundColor: 'var(--weave-bg-surface-elevated)',
                        borderBottomLeftRadius: '0.5rem',
                        borderBottomRightRadius: '0.5rem',
                    }, children: footer }))] }) }));
}
//# sourceMappingURL=Modal.js.map