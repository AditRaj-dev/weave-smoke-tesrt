import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Button({ variant = 'secondary', size = 'md', icon, children, className = '', disabled, ...props }) {
    const baseStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        borderRadius: '0.375rem',
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
        border: '1px solid transparent',
        fontFamily: 'inherit',
        lineHeight: 1.25,
    };
    const sizeStyles = {
        sm: { padding: '0.25rem 0.625rem', fontSize: '0.8125rem' },
        md: { padding: '0.4375rem 0.875rem', fontSize: '0.875rem' },
        lg: { padding: '0.625rem 1.125rem', fontSize: '1rem' },
    };
    const variantStyles = {
        primary: {
            backgroundColor: 'var(--weave-accent-primary)',
            color: 'var(--weave-accent-text)',
            borderColor: 'var(--weave-accent-primary)',
        },
        secondary: {
            backgroundColor: 'var(--weave-bg-surface-elevated)',
            color: 'var(--weave-text-primary)',
            borderColor: 'var(--weave-border-default)',
        },
        danger: {
            backgroundColor: '#dc2626',
            color: '#ffffff',
            borderColor: '#b91c1c',
        },
        outline: {
            backgroundColor: 'transparent',
            color: 'var(--weave-text-primary)',
            borderColor: 'var(--weave-border-default)',
        },
        ghost: {
            backgroundColor: 'transparent',
            color: 'var(--weave-text-secondary)',
            borderColor: 'transparent',
        },
    };
    const style = {
        ...baseStyle,
        ...sizeStyles[size],
        ...variantStyles[variant],
    };
    return (_jsxs("button", { type: "button", style: style, disabled: disabled, className: `weave-button ${className}`, ...props, children: [icon && _jsx("span", { "aria-hidden": "true", children: icon }), children] }));
}
//# sourceMappingURL=Button.js.map