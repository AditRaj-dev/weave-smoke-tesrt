import React from 'react';
import type { ThemeMode } from '../types/index.js';
interface ThemeContextValue {
    theme: ThemeMode;
    resolvedTheme: 'light' | 'dark';
    setTheme: (theme: ThemeMode) => void;
    toggleTheme: () => void;
}
export interface ThemeProviderProps {
    defaultTheme?: ThemeMode;
    children: React.ReactNode;
}
export declare function ThemeProvider({ defaultTheme, children }: ThemeProviderProps): React.JSX.Element;
export declare function useTheme(): ThemeContextValue;
export {};
//# sourceMappingURL=ThemeContext.d.ts.map