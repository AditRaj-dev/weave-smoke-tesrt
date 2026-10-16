import React from 'react';
import type { TaskItem } from '../types/index.js';
export interface TaskDagPanelProps {
    tasks?: readonly TaskItem[];
    selectedTaskId?: string;
    onSelectTask?: (taskId: string) => void;
}
export declare function TaskDagPanel({ tasks, selectedTaskId, onSelectTask, }: TaskDagPanelProps): React.JSX.Element;
//# sourceMappingURL=TaskDagPanel.d.ts.map