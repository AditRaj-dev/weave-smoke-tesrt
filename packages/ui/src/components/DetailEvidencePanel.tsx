import React, { useState } from 'react';
import type { TaskItem, EvidenceRecord, ContractPin } from '../types/index.js';
import { Badge } from './Badge.js';

export interface DetailEvidencePanelProps {
  task?: TaskItem;
  evidence?: readonly EvidenceRecord[];
  contracts?: readonly ContractPin[];
}

const DEFAULT_CONTRACTS: readonly ContractPin[] = [
  { id: 'task-report.schema.json', version: 'v1.0 proposed (draft 2020-12)', schemaPath: 'contracts/schemas/task-report.schema.json', status: 'proposed' },
  { id: 'task-packet.schema.json', version: 'v1.0 proposed (draft 2020-12)', schemaPath: 'contracts/schemas/task-packet.schema.json', status: 'proposed' },
  { id: 'event.schema.json', version: 'v1.0 proposed (draft 2020-12)', schemaPath: 'contracts/schemas/event.schema.json', status: 'proposed' },
  { id: 'handoff.schema.json', version: 'v1.0 proposed (draft 2020-12)', schemaPath: 'contracts/schemas/handoff.schema.json', status: 'proposed' },
];

export function DetailEvidencePanel({
  task,
  evidence = [],
  contracts = DEFAULT_CONTRACTS,
}: DetailEvidencePanelProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'packet' | 'evidence' | 'contracts' | 'git'>('packet');

  return (
    <aside
      aria-label="Task Details, Contracts, and Evidence"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--weave-bg-surface)',
        borderLeft: '1px solid var(--weave-border-default)',
        overflow: 'hidden',
      }}
    >
      {/* Tab Navigation */}
      <div
        role="tablist"
        aria-label="Detail Panel Tabs"
        style={{
          display: 'flex',
          backgroundColor: 'var(--weave-bg-surface-elevated)',
          borderBottom: '1px solid var(--weave-border-default)',
        }}
      >
        {(['packet', 'evidence', 'contracts', 'git'] as const).map((tab) => {
          const isSelected = activeTab === tab;
          const labels: Record<string, string> = {
            packet: 'Packet',
            evidence: `Evidence (${evidence.length})`,
            contracts: 'Contracts',
            git: 'Git Broker',
          };

          return (
            <button
              key={tab}
              role="tab"
              aria-selected={isSelected}
              id={`detail-tab-${tab}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '0.625rem 0.5rem',
                border: 'none',
                borderBottom: isSelected ? '2px solid var(--weave-accent-primary)' : '2px solid transparent',
                backgroundColor: isSelected ? 'var(--weave-bg-surface)' : 'transparent',
                color: isSelected ? 'var(--weave-text-primary)' : 'var(--weave-text-secondary)',
                fontSize: '0.75rem',
                fontWeight: isSelected ? 600 : 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textTransform: 'capitalize',
                transition: 'all 0.1s ease',
              }}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {activeTab === 'packet' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--weave-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Selected Task
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span style={{ fontFamily: 'var(--weave-font-mono)', fontWeight: 700, fontSize: '1rem' }}>
                  {task ? task.id : 'No Task Selected'}
                </span>
                {task && <Badge status={task.status}>{task.status}</Badge>}
              </div>
              {task && <p style={{ margin: '0.375rem 0 0 0', fontSize: '0.875rem' }}>{task.title}</p>}
            </div>

            {task && (
              <>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--weave-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Allowed Write Globs (Strict Scope)
                  </span>
                  <div style={{ marginTop: '0.375rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {task.writePaths.map((path) => (
                      <code
                        key={path}
                        style={{
                          display: 'block',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          backgroundColor: 'var(--weave-bg-surface-elevated)',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--weave-font-mono)',
                          border: '1px solid var(--weave-border-subtle)',
                        }}
                      >
                        {path}
                      </code>
                    ))}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--weave-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Exclusive Resource Leases
                  </span>
                  <div style={{ marginTop: '0.375rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {task.exclusiveResources.map((res) => (
                      <Badge key={res} status="info">{res}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--weave-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Dependencies
                  </span>
                  <div style={{ marginTop: '0.375rem', fontSize: '0.8125rem' }}>
                    {task.dependsOn.length > 0 ? (
                      task.dependsOn.join(', ')
                    ) : (
                      <span style={{ color: 'var(--weave-text-muted)' }}>None (Root Task)</span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'evidence' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--weave-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Execution Evidence Ledger
            </span>

            {evidence.length === 0 ? (
              <div
                style={{
                  padding: '1.5rem',
                  textAlign: 'center',
                  color: 'var(--weave-text-muted)',
                  fontSize: '0.8125rem',
                  backgroundColor: 'var(--weave-bg-surface-elevated)',
                  borderRadius: '0.375rem',
                }}
              >
                No command evidence recorded yet.
                <br />
                <span style={{ fontSize: '0.75rem' }}>Commands must be executed and recorded with timestamp, exit code, and artifact sha256.</span>
              </div>
            ) : (
              evidence.map((ev, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.625rem',
                    borderRadius: '0.375rem',
                    backgroundColor: 'var(--weave-bg-surface-elevated)',
                    border: '1px solid var(--weave-border-subtle)',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--weave-font-mono)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: 'var(--weave-text-primary)' }}>{ev.command}</strong>
                    <Badge status={ev.exitCode === 0 ? 'done' : 'blocked'}>
                      Exit {ev.exitCode}
                    </Badge>
                  </div>
                  <div style={{ color: 'var(--weave-text-muted)' }}>Started: {ev.startedAt}</div>
                  <div style={{ color: 'var(--weave-text-muted)' }}>Finished: {ev.finishedAt}</div>
                  <div style={{ wordBreak: 'break-all', color: 'var(--weave-text-secondary)' }}>
                    SHA-256: {ev.artifactSha256}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'contracts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--weave-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Machine Contracts &amp; Schemas
              </span>
              <Badge status="unavailable">Proposed Baseline</Badge>
            </div>

            {contracts.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: '0.625rem',
                  borderRadius: '0.375rem',
                  backgroundColor: 'var(--weave-bg-surface-elevated)',
                  border: '1px solid var(--weave-border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--weave-font-mono)', fontWeight: 600, fontSize: '0.8125rem' }}>
                    {c.id}
                  </span>
                  <Badge status={c.status === 'approved' ? 'done' : 'proposed'}>{c.status}</Badge>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--weave-text-secondary)' }}>
                  {c.version}
                </div>
                <code style={{ fontSize: '0.7rem', color: 'var(--weave-text-muted)', fontFamily: 'var(--weave-font-mono)' }}>
                  {c.schemaPath}
                </code>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'git' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--weave-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Git Broker Status
            </span>

            <div
              style={{
                padding: '0.75rem',
                borderRadius: '0.375rem',
                backgroundColor: 'var(--weave-bg-surface-elevated)',
                border: '1px solid var(--weave-border-subtle)',
                fontSize: '0.8125rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div>
                <strong>Isolation Mode:</strong> <Badge status="info">Cooperative</Badge>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--weave-text-secondary)', lineHeight: 1.4 }}>
                Per AGENTS.md: Workers are cooperatively restricted to approved worktrees. The Git Broker is the sole authority for mutations, staged integration, and commits.
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--weave-text-muted)' }}>
                Integration Gate: Review PASS + Test PASS required before commit.
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
