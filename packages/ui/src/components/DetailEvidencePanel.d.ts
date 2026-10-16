import React from 'react';
import type { TaskItem, EvidenceRecord, ContractPin } from '../types/index.js';
export interface DetailEvidencePanelProps {
    task?: TaskItem;
    evidence?: readonly EvidenceRecord[];
    contracts?: readonly ContractPin[];
}
export declare function DetailEvidencePanel({ task, evidence, contracts, }: DetailEvidencePanelProps): React.JSX.Element;
//# sourceMappingURL=DetailEvidencePanel.d.ts.map