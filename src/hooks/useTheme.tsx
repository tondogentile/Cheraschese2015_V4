import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';

export type ThemeColors = {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
};

export const DEFAULT_DARK_COLORS: ThemeColors = {
  primary: '#D4AF37',
  secondary: '#B8860B',
  background: '#000000',
  card: '#0a0a0a',
  text: '#fafafa',
  textMuted: '#71717a',
  border: '#D4AF37',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

export const DEFAULT_LIGHT_COLORS: ThemeColors = {
  primary: '#D4AF37',
  secondary: '#B8860B',
  background: '#f4f4f5',
  card: '#ffffff',
  text: '#18181b',
  textMuted: '#71717a',
  border: '#D4AF37',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

const STORAGE_KEY_THEME = 'cheraschese-theme-mode';
const STORAGE_KEY_COLORS = 'cheraschese-theme-colors';

function getSystemDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getStoredThemeMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_THEME);
    if (stored === 'dark' || stored === 'light' || stored === 'system') return stored;
  } catch { /* ignore */ }
  return 'dark';
}

function getStoredColors(): Partial<ThemeColors> | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_COLORS);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return null;
}

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  isDark: boolean;
  colors: ThemeColors;
  setColors: (c: Partial<ThemeColors>) => void;
  resetColors: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getStoredThemeMode);
  const [customColors, setCustomColors] = useState<Partial<ThemeColors> | null>(getStoredColors);
  const [systemDark, setSystemDark] = useState(getSystemDark);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && systemDark);

  const colors: ThemeColors = {
    ...(isDark ? DEFAULT_DARK_COLORS : DEFAULT_LIGHT_COLORS),
    ...customColors,
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-card', colors.card);
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-text-muted', colors.textMuted);
    root.style.setProperty('--color-border', colors.border);
    root.style.setProperty('--color-success', colors.success);
    root.style.setProperty('--color-warning', colors.warning);
    root.style.setProperty('--color-error', colors.error);
    root.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark, colors]);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    try { localStorage.setItem(STORAGE_KEY_THEME, m); } catch { /* ignore */ }
  }, []);

  const setColors = useCallback((c: Partial<ThemeColors>) => {
    const merged = { ...customColors, ...c };
    setCustomColors(merged);
    try { localStorage.setItem(STORAGE_KEY_COLORS, JSON.stringify(merged)); } catch { /* ignore */ }
  }, [customColors]);

  const resetColors = useCallback(() => {
    setCustomColors(null);
    try { localStorage.removeItem(STORAGE_KEY_COLORS); } catch { /* ignore */ }
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, setMode, isDark, colors, setColors, resetColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
