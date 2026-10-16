import React from 'react';
import { useTheme } from '../theme/useTheme.js';
import { Button } from './Button.js';
import { Badge } from './Badge.js';

export interface HeaderProps {
  projectName?: string;
  runId?: string | null;
  onOpenShortcuts?: () => void;
}

export function Header({
  projectName = 'No Project Loaded (M0 Bootstrap)',
  runId = null,
  onOpenShortcuts,
}: HeaderProps): React.JSX.Element {
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  return (
    <header
      role="banner"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.625rem 1.25rem',
        backgroundColor: 'var(--weave-bg-surface)',
        borderBottom: '1px solid var(--weave-border-default)',
        color: 'var(--weave-text-primary)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: '1.125rem',
              letterSpacing: '0.05em',
              color: 'var(--weave-accent-primary)',
            }}
          >
            WEAVE
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              padding: '0.125rem 0.375rem',
              backgroundColor: 'var(--weave-bg-surface-elevated)',
              borderRadius: '0.25rem',
              color: 'var(--weave-text-muted)',
              fontFamily: 'var(--weave-font-mono)',
            }}
          >
            v0.1.0-M0
          </span>
        </div>

        <div style={{ height: '1.25rem', width: '1px', backgroundColor: 'var(--weave-border-default)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{projectName}</span>
          {runId ? (
            <Badge status="info">{runId}</Badge>
          ) : (
            <Badge status="unavailable">No Active Run (Daemon Offline)</Badge>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          aria-label={`Toggle theme. Current theme is ${theme} (resolved: ${resolvedTheme}). Press 't' to toggle.`}
          title="Toggle Dark/Light Mode (Keyboard: 't')"
        >
          {resolvedTheme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          <span
            style={{
              fontSize: '0.7rem',
              opacity: 0.75,
              padding: '0.1rem 0.3rem',
              backgroundColor: 'var(--weave-bg-muted)',
              borderRadius: '0.2rem',
              fontFamily: 'var(--weave-font-mono)',
            }}
          >
            t
          </span>
        </Button>

        {onOpenShortcuts && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenShortcuts}
            aria-label="Open keyboard shortcuts help. Press '?'"
            title="Keyboard Shortcuts (Press '?')"
          >
            ⌨️ Shortcuts
            <span
              style={{
                fontSize: '0.7rem',
                opacity: 0.75,
                padding: '0.1rem 0.3rem',
                backgroundColor: 'var(--weave-bg-muted)',
                borderRadius: '0.2rem',
                fontFamily: 'var(--weave-font-mono)',
              }}
            >
              ?
            </span>
          </Button>
        )}
      </div>
    </header>
  );
}
