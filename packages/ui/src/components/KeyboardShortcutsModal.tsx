import React from 'react';
import { Modal } from './Modal.js';
import { Button } from './Button.js';

export interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  readonly key: string;
  readonly description: string;
  readonly context: string;
}

const SHORTCUTS: readonly ShortcutItem[] = [
  { key: 't', description: 'Toggle between Dark and Light mode', context: 'Global' },
  { key: '?', description: 'Open this Keyboard Shortcuts dialog', context: 'Global' },
  { key: '1', description: 'Focus Mastermind Workflow Phases', context: 'Navigation' },
  { key: '2', description: 'Focus Task DAG list', context: 'Navigation' },
  { key: '3', description: 'Focus Terminal panel', context: 'Navigation' },
  { key: '4', description: 'Focus Evidence and Contract Details', context: 'Navigation' },
  { key: 'ArrowLeft / ArrowRight', description: 'Cycle through phases or terminal slots', context: 'Panels' },
  { key: 'ArrowUp / ArrowDown', description: 'Navigate task list', context: 'Task List' },
  { key: 'Esc', description: 'Close any active modal dialog', context: 'Dialogs' },
];

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps): React.JSX.Element | null {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="WEAVE Cockpit Keyboard Navigation"
      footer={
        <Button variant="primary" size="md" onClick={onClose}>
          Got it (Esc)
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--weave-text-secondary)', lineHeight: 1.5 }}>
          WEAVE Cockpit is built to be 100% accessible via keyboard. All buttons, lists, and tabs have visible focus rings.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {SHORTCUTS.map((sc, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                backgroundColor: 'var(--weave-bg-surface-elevated)',
                border: '1px solid var(--weave-border-subtle)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--weave-text-primary)' }}>
                  {sc.description}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--weave-text-muted)' }}>
                  {sc.context}
                </span>
              </div>
              <kbd
                style={{
                  padding: '0.2rem 0.5rem',
                  borderRadius: '0.25rem',
                  backgroundColor: 'var(--weave-bg-surface)',
                  border: '1px solid var(--weave-border-default)',
                  fontFamily: 'var(--weave-font-mono)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--weave-accent-primary)',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  whiteSpace: 'nowrap',
                }}
              >
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
