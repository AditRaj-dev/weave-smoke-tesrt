import React from 'react';
import type { TaskStatus, SessionStatus } from '../types/index.js';
export interface BadgeProps {
    status?: TaskStatus | SessionStatus | 'info' | 'warning' | 'success' | 'danger';
    children: React.ReactNode;
    className?: string;
}
export declare function Badge({ status, children, className }: BadgeProps): React.JSX.Element;
//# sourceMappingURL=Badge.d.ts.map