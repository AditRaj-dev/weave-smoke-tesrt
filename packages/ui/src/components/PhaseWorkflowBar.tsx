import React, { useState } from 'react';
import type { MastermindPhase } from '../types/index.js';
import { Badge } from './Badge.js';
import { Button } from './Button.js';
import { Modal } from './Modal.js';

export interface PhaseWorkflowBarProps {
  phases?: readonly MastermindPhase[];
  currentPhaseId?: string;
  onSelectPhase?: (phaseId: string) => void;
  onApproveGate?: (phaseId: string) => void;
  onRequestChanges?: (phaseId: string, notes: string) => void;
}

const DEFAULT_PROPOSED_PHASES: readonly MastermindPhase[] = [
  { id: '0', numberLabel: '0', name: 'Setup', requiresHumanApproval: false, status: 'proposed' },
  { id: '1', numberLabel: '1', name: 'Discovery', requiresHumanApproval: true, status: 'proposed' },
  { id: '2', numberLabel: '2', name: 'PRD', requiresHumanApproval: true, status: 'proposed' },
  { id: '3', numberLabel: '3', name: 'Feature Specs', requiresHumanApproval: true, status: 'proposed' },
  { id: '4', numberLabel: '4', name: 'Implementation Plan', requiresHumanApproval: true, status: 'proposed' },
  { id: '5', numberLabel: '5', name: 'API Record', requiresHumanApproval: true, status: 'proposed' },
  { id: '6', numberLabel: '6', name: 'Design System', requiresHumanApproval: true, status: 'proposed' },
  { id: '7', numberLabel: '7', name: 'HTML Mockups', requiresHumanApproval: true, status: 'proposed' },
  { id: '7.5', numberLabel: '7.5', name: 'HTML-to-React', isConditional: true, requiresHumanApproval: false, status: 'proposed' },
  { id: '8', numberLabel: '8', name: 'Build and Verify', requiresHumanApproval: true, status: 'proposed' },
  { id: '9', numberLabel: '9', name: 'Wrap and Finish', requiresHumanApproval: true, status: 'proposed' },
];

export function PhaseWorkflowBar({
  phases = DEFAULT_PROPOSED_PHASES,
  currentPhaseId = '0',
  onSelectPhase,
  onApproveGate,
  onRequestChanges,
}: PhaseWorkflowBarProps): React.JSX.Element {
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(currentPhaseId);
  const [confirmGateAction, setConfirmGateAction] = useState<'approve' | 'revise' | null>(null);
  const [changeNotes, setChangeNotes] = useState<string>('');

  const selectedPhase = phases.find((p) => p.id === selectedPhaseId) ?? phases[0];
  const canPerformGateActions =
    selectedPhase.status === 'awaiting_approval' &&
    typeof onApproveGate === 'function' &&
    typeof onRequestChanges === 'function';

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight' && index < phases.length - 1) {
      e.preventDefault();
      const nextId = phases[index + 1].id;
      setSelectedPhaseId(nextId);
      onSelectPhase?.(nextId);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      const prevId = phases[index - 1].id;
      setSelectedPhaseId(prevId);
      onSelectPhase?.(prevId);
    }
  };

  return (
    <section
      aria-label="Mastermind Workflow Phases"
      style={{
        padding: '0.75rem 1.25rem',
        backgroundColor: 'var(--weave-bg-surface)',
        borderBottom: '1px solid var(--weave-border-default)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--weave-text-muted)' }}>
            Mastermind Workflow Phases (0–9 &amp; 7.5)
          </h2>
          <Badge status="unavailable">Proposed Spec Baseline</Badge>
          {selectedPhase.isConditional && (
            <Badge status="warning">Conditional Phase</Badge>
          )}
        </div>

        <div>
          {canPerformGateActions ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--weave-text-secondary)' }}>
                Gate: <strong>Human Approval Required</strong>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmGateAction('revise')}
                aria-label={`Request changes on Phase ${selectedPhase.numberLabel}`}
              >
                Request Changes
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setConfirmGateAction('approve')}
                aria-label={`Approve Gate for Phase ${selectedPhase.numberLabel}`}
              >
                Approve Gate
              </Button>
            </div>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--weave-text-muted)' }}>
              Gate Actions Disabled (Workflow Engine Pending WF-001)
            </span>
          )}
        </div>
      </div>

      <nav
        role="tablist"
        aria-label="Workflow Phase Steps"
        style={{
          display: 'flex',
          gap: '0.375rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
        }}
      >
        {phases.map((phase, idx) => {
          const isSelected = phase.id === selectedPhaseId;

          return (
            <button
              key={phase.id}
              role="tab"
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => {
                setSelectedPhaseId(phase.id);
                onSelectPhase?.(phase.id);
              }}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.375rem 0.625rem',
                borderRadius: '0.375rem',
                border: isSelected
                  ? '1px solid var(--weave-accent-primary)'
                  : '1px solid var(--weave-border-subtle)',
                backgroundColor: isSelected
                  ? 'var(--weave-bg-surface-elevated)'
                  : 'transparent',
                color: isSelected
                  ? 'var(--weave-text-primary)'
                  : 'var(--weave-text-secondary)',
                fontSize: '0.8125rem',
                fontWeight: isSelected ? 600 : 400,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '1.25rem',
                  height: '1.25rem',
                  borderRadius: '9999px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: phase.status === 'approved'
                    ? 'var(--weave-status-done-bg)'
                    : phase.status === 'in_progress'
                    ? 'var(--weave-status-running-bg)'
                    : 'var(--weave-bg-muted)',
                  color: phase.status === 'approved'
                    ? 'var(--weave-status-done)'
                    : phase.status === 'in_progress'
                    ? 'var(--weave-status-running)'
                    : 'var(--weave-text-muted)',
                }}
              >
                {phase.status === 'approved' ? '✓' : phase.numberLabel}
              </span>
              <span>{phase.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Confirmation Modal for Gate Approval */}
      {canPerformGateActions && (
        <>
          <Modal
            isOpen={confirmGateAction === 'approve'}
            onClose={() => setConfirmGateAction(null)}
            title={`Confirm Approval for Phase ${selectedPhase.numberLabel}: ${selectedPhase.name}`}
            footer={
              <>
                <Button variant="outline" size="md" onClick={() => setConfirmGateAction(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    onApproveGate?.(selectedPhase.id);
                    setConfirmGateAction(null);
                  }}
                >
                  Confirm &amp; Advance Gate
                </Button>
              </>
            }
          >
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              You are approving the gate for <strong>Phase {selectedPhase.numberLabel} ({selectedPhase.name})</strong>.
            </p>
          </Modal>

          <Modal
            isOpen={confirmGateAction === 'revise'}
            onClose={() => setConfirmGateAction(null)}
            title={`Request Changes for Phase ${selectedPhase.numberLabel}: ${selectedPhase.name}`}
            footer={
              <>
                <Button variant="outline" size="md" onClick={() => setConfirmGateAction(null)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => {
                    onRequestChanges?.(selectedPhase.id, changeNotes);
                    setConfirmGateAction(null);
                    setChangeNotes('');
                  }}
                >
                  Submit Change Request
                </Button>
              </>
            }
          >
            <label htmlFor="gate-change-notes" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Change Request Guidance:
            </label>
            <textarea
              id="gate-change-notes"
              rows={4}
              value={changeNotes}
              onChange={(e) => setChangeNotes(e.target.value)}
              placeholder="Describe required changes or missing verification evidence..."
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--weave-border-default)',
                backgroundColor: 'var(--weave-bg-canvas)',
                color: 'var(--weave-text-primary)',
                fontFamily: 'inherit',
                fontSize: '0.875rem',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </Modal>
        </>
      )}
    </section>
  );
}
