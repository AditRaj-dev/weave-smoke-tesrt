import React from 'react';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
}
export declare function Button({ variant, size, icon, children, className, disabled, ...props }: ButtonProps): React.JSX.Element;
//# sourceMappingURL=Button.d.ts.map