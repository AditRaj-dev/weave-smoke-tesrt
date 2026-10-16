import React from 'react';
export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}
export declare function Modal({ isOpen, onClose, title, children, footer }: ModalProps): React.JSX.Element | null;
//# sourceMappingURL=Modal.d.ts.map