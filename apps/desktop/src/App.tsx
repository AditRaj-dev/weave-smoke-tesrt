import React, { useState, useEffect, useRef } from 'react';
import {
  Header,
  PhaseWorkflowBar,
  TaskDagPanel,
  TerminalPlaceholderPanel,
  DetailEvidencePanel,
  StatusBar,
  KeyboardShortcutsModal,
  useTheme,
} from '@weave/ui';
import type { TaskItem } from '@weave/ui';

export function BootstrapShellApp(): React.JSX.Element {
  const { toggleTheme } = useTheme();
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('INF-001');

  const phaseBarRef = useRef<HTMLDivElement>(null);
  const taskDagRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        toggleTheme();
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === '1') {
        e.preventDefault();
        const firstTab = phaseBarRef.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
        firstTab?.focus();
      } else if (e.key === '2') {
        e.preventDefault();
        const activeTask = taskDagRef.current?.querySelector<HTMLElement>('[role="option"][aria-selected="true"]');
        activeTask?.focus();
      } else if (e.key === '3') {
        e.preventDefault();
        const activeTerminalTab = terminalRef.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
        activeTerminalTab?.focus();
      } else if (e.key === '4') {
        e.preventDefault();
        const activeDetailTab = detailsRef.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
        activeDetailTab?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme]);

  // Tasks from proposed workflow/tasks.yaml specification (all in proposed state, no live progress fabricated)
  const proposedTasks: readonly TaskItem[] = [
    {
      id: 'INF-001',
      title: 'Bootstrap native workspace and CI',
      domain: 'infrastructure',
      milestone: 'M0',
      status: 'proposed',
      dependsOn: [],
      writePaths: ['apps/desktop/**', 'crates/**', 'packages/**'],
      exclusiveResources: ['workspace:bootstrap'],
    },
    {
      id: 'INF-002',
      title: 'SQLite store and events',
      domain: 'database',
      milestone: 'M0',
      status: 'proposed',
      dependsOn: ['INF-001'],
      writePaths: ['crates/weave-store/**'],
      exclusiveResources: ['db:migrations'],
    },
    {
      id: 'INF-003',
      title: 'Local authenticated IPC and CLI',
      domain: 'api',
      milestone: 'M0',
      status: 'proposed',
      dependsOn: ['INF-001', 'INF-002'],
      writePaths: ['crates/weave-daemon/**', 'crates/weave-cli/**'],
      exclusiveResources: ['api:ipc'],
    },
    {
      id: 'PTY-001',
      title: 'Native PTY supervisor',
      domain: 'runtime',
      milestone: 'M0',
      status: 'proposed',
      dependsOn: ['INF-001', 'INF-003'],
      writePaths: ['crates/weave-daemon/src/pty/**'],
      exclusiveResources: ['daemon:pty'],
    },
    {
      id: 'PTY-002',
      title: 'xterm UI and event replay',
      domain: 'frontend',
      milestone: 'M0',
      status: 'proposed',
      dependsOn: ['PTY-001'],
      writePaths: ['apps/desktop/**', 'packages/ui/**'],
      exclusiveResources: ['ui:terminals'],
    },
    {
      id: 'PROV-001',
      title: 'Provider probes and role bootstrap',
      domain: 'runtime',
      milestone: 'M0',
      status: 'proposed',
      dependsOn: ['PTY-001', 'INF-003'],
      writePaths: ['crates/weave-provider/**'],
      exclusiveResources: ['provider:adapters'],
    },
  ];

  const currentTask = proposedTasks.find((t) => t.id === selectedTaskId);

  return (
    <div className="cockpit-container">
      <Header
        projectName="No Project Loaded (M0 Bootstrap Shell)"
        runId={null}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      <div
        role="status"
        aria-live="polite"
        style={{
          padding: '0.375rem 1.25rem',
          backgroundColor: 'var(--weave-bg-surface-elevated)',
          borderBottom: '1px solid var(--weave-border-subtle)',
          fontSize: '0.75rem',
          color: 'var(--weave-text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>
          <strong>M0 Infrastructure Shell:</strong> Daemon connection (INF-003) and PTY supervisor (PTY-001) pending. All workflow phases, tasks, and contracts reflect proposed baseline specifications.
        </span>
        <span style={{ fontFamily: 'var(--weave-font-mono)' }}>
          State: Non-Live / Unconnected
        </span>
      </div>

      <div ref={phaseBarRef}>
        <PhaseWorkflowBar />
      </div>

      <main className="cockpit-main" role="main">
        <div ref={taskDagRef} style={{ height: '100%', overflow: 'hidden' }}>
          <TaskDagPanel
            tasks={proposedTasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={(id) => setSelectedTaskId(id)}
          />
        </div>

        <div ref={terminalRef} style={{ height: '100%', overflow: 'hidden' }}>
          <TerminalPlaceholderPanel />
        </div>

        <div ref={detailsRef} className="cockpit-details-panel" style={{ height: '100%', overflow: 'hidden' }}>
          <DetailEvidencePanel task={currentTask} />
        </div>
      </main>

      <StatusBar />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}

export function App(): React.JSX.Element {
  return <BootstrapShellApp />;
}

export const CockpitApp = BootstrapShellApp;
