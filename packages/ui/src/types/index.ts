/**
 * Core domain types for WEAVE UI Cockpit.
 * In accordance with WEAVE-PRD-001, WEAVE-ARCH-001, and schema specifications.
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export type MastermindPhaseId =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '7.5'
  | '8'
  | '9';

export interface MastermindPhase {
  readonly id: MastermindPhaseId;
  readonly numberLabel: string;
  readonly name: string;
  readonly isConditional?: boolean;
  readonly requiresHumanApproval: boolean;
  readonly status: 'proposed' | 'pending' | 'in_progress' | 'awaiting_approval' | 'approved' | 'rejected';
  readonly artifactPath?: string;
}

export type TaskStatus =
  | 'proposed'
  | 'ready'
  | 'assigned'
  | 'running'
  | 'handoff_submitted'
  | 'reviewing'
  | 'testing'
  | 'integration_ready'
  | 'integrated'
  | 'done'
  | 'blocked'
  | 'failed'
  | 'interrupted';

export interface TaskItem {
  readonly id: string;
  readonly title: string;
  readonly domain: string;
  readonly milestone: string;
  readonly status: TaskStatus;
  readonly dependsOn: readonly string[];
  readonly writePaths: readonly string[];
  readonly exclusiveResources: readonly string[];
  readonly assignedSessionId?: string;
  readonly blockerReason?: string;
}

export type SessionProvider = 'claude' | 'codex' | 'gemini';

export type SessionStatus =
  | 'unavailable'
  | 'requested'
  | 'spawning'
  | 'running'
  | 'auth_required'
  | 'stopping'
  | 'exited'
  | 'failed'
  | 'interrupted';

export interface SessionSlot {
  readonly slotId: string;
  readonly label: string;
  readonly role: 'worker' | 'reviewer' | 'tester' | 'git_broker';
  readonly provider: SessionProvider;
  readonly status: SessionStatus;
  readonly sessionId?: string;
  readonly unavailabilityNotice: string;
}

export interface EvidenceRecord {
  readonly command: string;
  readonly exitCode: number;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly artifactPath: string;
  readonly artifactSha256: string;
}

export interface ContractPin {
  readonly id: string;
  readonly version: string;
  readonly schemaPath: string;
  readonly status: 'proposed' | 'approved' | 'candidate' | 'rejected';
  readonly verifiedAt?: string;
}

export interface DaemonConnectionState {
  readonly status: 'offline' | 'connected' | 'disconnected' | 'reconnecting';
  readonly lastSeq: number;
  readonly maxWorkers: number;
  readonly gitIsolationMode: 'cooperative' | 'enforced';
}

