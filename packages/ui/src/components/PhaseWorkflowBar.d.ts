import React from 'react';
import type { MastermindPhase } from '../types/index.js';
export interface PhaseWorkflowBarProps {
    phases?: readonly MastermindPhase[];
    currentPhaseId?: string;
    onSelectPhase?: (phaseId: string) => void;
    onApproveGate?: (phaseId: string) => void;
    onRequestChanges?: (phaseId: string, notes: string) => void;
}
export declare function PhaseWorkflowBar({ phases, currentPhaseId, onSelectPhase, onApproveGate, onRequestChanges, }: PhaseWorkflowBarProps): React.JSX.Element;
//# sourceMappingURL=PhaseWorkflowBar.d.ts.map