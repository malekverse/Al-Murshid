import React, { createContext, useContext, useMemo } from 'react';
import { useAppStore } from '../store';
import { darkTheme, lightTheme, ThemeColors } from '../theme';

interface ThemeContextValue {
  isDark: boolean;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  colors: darkTheme,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const darkMode = useAppStore((s) => s.darkMode);
  const value = useMemo(() => ({
    isDark: darkMode,
    colors: darkMode ? darkTheme : lightTheme,
  }), [darkMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
