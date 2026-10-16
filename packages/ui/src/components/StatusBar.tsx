import React from 'react';
import type { DaemonConnectionState } from '../types/index.js';
import { Badge } from './Badge.js';

export interface StatusBarProps {
  connection?: DaemonConnectionState;
}

const DEFAULT_CONNECTION: DaemonConnectionState = {
  status: 'offline',
  lastSeq: 0,
  maxWorkers: 2,
  gitIsolationMode: 'cooperative',
};

export function StatusBar({
  connection = DEFAULT_CONNECTION,
}: StatusBarProps): React.JSX.Element {
  const isConnected = connection.status === 'connected';

  return (
    <footer
      role="contentinfo"
      aria-label="System and connection status"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.375rem 1rem',
        backgroundColor: 'var(--weave-bg-surface-elevated)',
        borderTop: '1px solid var(--weave-border-default)',
        fontSize: '0.75rem',
        color: 'var(--weave-text-secondary)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span
            style={{
              width: '0.5rem',
              height: '0.5rem',
              borderRadius: '9999px',
              backgroundColor: isConnected ? 'var(--weave-status-done)' : 'var(--weave-status-unavailable)',
              display: 'inline-block',
            }}
            aria-hidden="true"
          />
          <span>
            Daemon: <strong>{connection.status.toUpperCase()}</strong>
          </span>
          <span style={{ fontFamily: 'var(--weave-font-mono)', color: 'var(--weave-text-muted)' }}>
            (Pending INF-003 IPC)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span>Cursor Seq:</span>
          <span style={{ fontFamily: 'var(--weave-font-mono)', fontWeight: 600 }}>
            {connection.lastSeq}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span>Concurrency Target:</span>
          <Badge status="info">Max {connection.maxWorkers} Workers</Badge>
          <Badge status="info">1 Reviewer</Badge>
          <Badge status="info">1 Tester</Badge>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span>Git Policy:</span>
          <Badge status="info">{connection.gitIsolationMode}</Badge>
        </div>

        <div style={{ color: 'var(--weave-text-muted)', fontFamily: 'var(--weave-font-mono)' }}>
          Press <kbd style={{ padding: '0.1rem 0.3rem', backgroundColor: 'var(--weave-bg-surface)', border: '1px solid var(--weave-border-subtle)', borderRadius: '0.2rem' }}>?</kbd> for help
        </div>
      </div>
    </footer>
  );
}
