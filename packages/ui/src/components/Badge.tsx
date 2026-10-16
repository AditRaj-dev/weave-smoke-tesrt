import React from 'react';
import type { TaskStatus, SessionStatus } from '../types/index.js';

export interface BadgeProps {
  status?: TaskStatus | SessionStatus | 'info' | 'warning' | 'success' | 'danger';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ status = 'info', children, className = '' }: BadgeProps): React.JSX.Element {
  const getColors = (): { bg: string; text: string; border: string } => {
    switch (status) {
      case 'ready':
      case 'info':
        return {
          bg: 'var(--weave-status-ready-bg)',
          text: 'var(--weave-status-ready)',
          border: 'var(--weave-status-ready)',
        };
      case 'running':
      case 'spawning':
      case 'warning':
        return {
          bg: 'var(--weave-status-running-bg)',
          text: 'var(--weave-status-running)',
          border: 'var(--weave-status-running)',
        };
      case 'done':
      case 'integrated':
      case 'success':
        return {
          bg: 'var(--weave-status-done-bg)',
          text: 'var(--weave-status-done)',
          border: 'var(--weave-status-done)',
        };
      case 'blocked':
      case 'failed':
      case 'danger':
        return {
          bg: 'var(--weave-status-blocked-bg)',
          text: 'var(--weave-status-blocked)',
          border: 'var(--weave-status-blocked)',
        };
      case 'unavailable':
      case 'interrupted':
      case 'exited':
      case 'proposed':
      default:
        return {
          bg: 'var(--weave-status-unavailable-bg)',
          text: 'var(--weave-text-muted)',
          border: 'var(--weave-border-default)',
        };
    }
  };

  const { bg, text, border } = getColors();

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.125rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.025em',
    textTransform: 'uppercase',
    backgroundColor: bg,
    color: text,
    border: `1px solid ${border}`,
    lineHeight: 1.2,
  };

  return (
    <span style={style} className={`weave-badge ${className}`}>
      {children}
    </span>
  );
}
