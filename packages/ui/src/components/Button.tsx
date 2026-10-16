import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps): React.JSX.Element {
  const baseStyle: React.CSSProperties = {
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

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '0.25rem 0.625rem', fontSize: '0.8125rem' },
    md: { padding: '0.4375rem 0.875rem', fontSize: '0.875rem' },
    lg: { padding: '0.625rem 1.125rem', fontSize: '1rem' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
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

  const style: React.CSSProperties = {
    ...baseStyle,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };

  return (
    <button
      type="button"
      style={style}
      disabled={disabled}
      className={`weave-button ${className}`}
      {...props}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}
