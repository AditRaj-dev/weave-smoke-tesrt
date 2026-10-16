import React, { useState } from 'react';
import type { SessionSlot } from '../types/index.js';
import { Badge } from './Badge.js';

export interface TerminalPlaceholderPanelProps {
  slots?: readonly SessionSlot[];
}

const DEFAULT_SLOTS: readonly SessionSlot[] = [
  {
    slotId: 'slot-worker-1',
    label: 'Worker 1 (Coding)',
    role: 'worker',
    provider: 'claude',
    status: 'unavailable',
    unavailabilityNotice: 'Real OS ConPTY session unavailable until PTY-001 supervisor and PTY-002 xterm UI are integrated.',
  },
  {
    slotId: 'slot-worker-2',
    label: 'Worker 2 (Coding)',
    role: 'worker',
    provider: 'codex',
    status: 'unavailable',
    unavailabilityNotice: 'Real OS ConPTY session unavailable until PTY-001 supervisor and PTY-002 xterm UI are integrated.',
  },
  {
    slotId: 'slot-reviewer',
    label: 'Reviewer (Independent)',
    role: 'reviewer',
    provider: 'gemini',
    status: 'unavailable',
    unavailabilityNotice: 'Real OS ConPTY session unavailable until PTY-001 supervisor and PTY-002 xterm UI are integrated.',
  },
  {
    slotId: 'slot-tester',
    label: 'Tester (QA Sandbox)',
    role: 'tester',
    provider: 'claude',
    status: 'unavailable',
    unavailabilityNotice: 'Real OS ConPTY session unavailable until PTY-001 supervisor and PTY-002 xterm UI are integrated.',
  },
];

export function TerminalPlaceholderPanel({
  slots = DEFAULT_SLOTS,
}: TerminalPlaceholderPanelProps): React.JSX.Element {
  const [selectedSlotId, setSelectedSlotId] = useState<string>(slots[0].slotId);

  const selectedSlot = slots.find((s) => s.slotId === selectedSlotId) ?? slots[0];

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight' && index < slots.length - 1) {
      e.preventDefault();
      setSelectedSlotId(slots[index + 1].slotId);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      setSelectedSlotId(slots[index - 1].slotId);
    }
  };

  return (
    <section
      aria-label="Interactive Terminal Sessions"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--weave-bg-canvas)',
        overflow: 'hidden',
      }}
    >
      {/* Session Tab Bar */}
      <div
        role="tablist"
        aria-label="Terminal Session Slots"
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--weave-bg-surface)',
          borderBottom: '1px solid var(--weave-border-default)',
          padding: '0 0.5rem',
          gap: '0.25rem',
          minHeight: '2.5rem',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--weave-text-muted)',
            marginRight: '0.5rem',
          }}
        >
          Terminal Slots:
        </span>

        {slots.map((slot, idx) => {
          const isSelected = slot.slotId === selectedSlotId;

          return (
            <button
              key={slot.slotId}
              role="tab"
              aria-selected={isSelected}
              aria-controls={`panel-${slot.slotId}`}
              id={`tab-${slot.slotId}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setSelectedSlotId(slot.slotId)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.75rem',
                border: 'none',
                borderBottom: isSelected ? '2px solid var(--weave-accent-primary)' : '2px solid transparent',
                backgroundColor: isSelected ? 'var(--weave-bg-canvas)' : 'transparent',
                color: isSelected ? 'var(--weave-text-primary)' : 'var(--weave-text-muted)',
                fontSize: '0.8125rem',
                fontWeight: isSelected ? 600 : 400,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.1s ease',
              }}
            >
              <span>{slot.label}</span>
              <Badge status={slot.status}>Unavailable</Badge>
            </button>
          );
        })}
      </div>

      {/* Terminal View / Invariant Notice */}
      <div
        id={`panel-${selectedSlot.slotId}`}
        role="tabpanel"
        aria-labelledby={`tab-${selectedSlot.slotId}`}
        style={{
          flex: 1,
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            maxWidth: '42rem',
            padding: '2rem',
            borderRadius: '0.75rem',
            backgroundColor: 'var(--weave-bg-surface)',
            border: '1px solid var(--weave-border-default)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '9999px',
              backgroundColor: 'var(--weave-status-unavailable-bg)',
              color: 'var(--weave-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
            }}
            aria-hidden="true"
          >
            📟
          </div>

          <div>
            <div style={{ display: 'inline-block', marginBottom: '0.5rem' }}>
              <Badge status="unavailable">PTY SUBSYSTEM PENDING (PTY-001 / PTY-002)</Badge>
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--weave-text-primary)' }}>
              Real Terminal Sessions Unavailable
            </h3>
            <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--weave-text-secondary)', lineHeight: 1.6 }}>
              {selectedSlot.unavailabilityNotice}
            </p>
          </div>

          <div
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--weave-bg-surface-elevated)',
              border: '1px solid var(--weave-border-subtle)',
              textAlign: 'left',
              fontSize: '0.8125rem',
              color: 'var(--weave-text-secondary)',
              lineHeight: 1.5,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--weave-text-primary)' }}>
              Architectural Invariant (WEAVE-ARCH-001 &amp; WEAVE-PRD-001):
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <li>
                <strong>No Simulated PTYs:</strong> WEAVE does not simulate interactive terminal execution or fabricate agent activity. Real CLI workers (Claude, Codex, Gemini) run in genuine OS ConPTY/POSIX processes supervised by the daemon.
              </li>
              <li>
                <strong>Independent Daemon Ownership:</strong> The daemon owns PTY lifecycles. Closing or reloading this desktop UI will not kill active background tasks.
              </li>
              <li>
                <strong>Evidence vs Assertion:</strong> Worker output text does not advance task states. Completed tasks require machine-checked reports matching <code>contracts/schemas/task-report.schema.json</code>.
              </li>
            </ul>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--weave-text-muted)', fontFamily: 'var(--weave-font-mono)' }}>
            Selected Slot: {selectedSlot.slotId} · Provider Target: {selectedSlot.provider} · Role: {selectedSlot.role}
          </div>
        </div>
      </div>
    </section>
  );
}
