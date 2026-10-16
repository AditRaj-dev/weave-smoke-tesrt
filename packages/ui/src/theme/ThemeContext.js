import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
const ThemeContext = createContext(undefined);
const STORAGE_KEY = 'weave_theme_mode';
export function ThemeProvider({ defaultTheme = 'system', children }) {
    const [theme, setThemeState] = useState(() => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const stored = window.localStorage.getItem(STORAGE_KEY);
                if (stored === 'light' || stored === 'dark' || stored === 'system') {
                    return stored;
                }
            }
        }
        catch {
            // LocalStorage access might be restricted
        }
        return defaultTheme;
    });
    const [systemDark, setSystemDark] = useState(() => {
        if (typeof window !== 'undefined' && window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return true; // Default dark for developer cockpit
    });
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia)
            return;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e) => {
            setSystemDark(e.matches);
        };
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);
    const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
    useEffect(() => {
        if (typeof document === 'undefined')
            return;
        const root = document.documentElement;
        root.setAttribute('data-theme', resolvedTheme);
        if (resolvedTheme === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
        }
        else {
            root.classList.add('light');
            root.classList.remove('dark');
        }
    }, [resolvedTheme]);
    const setTheme = (newTheme) => {
        setThemeState(newTheme);
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(STORAGE_KEY, newTheme);
            }
        }
        catch {
            // Ignore storage errors
        }
    };
    const toggleTheme = () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    };
    return (_jsx(ThemeContext.Provider, { value: { theme, resolvedTheme, setTheme, toggleTheme }, children: children }));
}
export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
//# sourceMappingURL=ThemeContext.js.map