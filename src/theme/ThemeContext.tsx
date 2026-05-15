import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppTheme, createTheme, ThemeMode } from './theme';

const THEME_SETTINGS_KEY = '@A1_accessibility_theme_v1';

type StoredThemeSettings = {
  mode?: ThemeMode;
  highContrast?: boolean;
};

type ThemeContextValue = {
  theme: AppTheme;
  mode: ThemeMode;
  isHighContrast: boolean;
  isLoading: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  setHighContrast: (enabled: boolean) => Promise<void>;
  toggleDarkMode: () => Promise<void>;
  toggleHighContrast: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const isThemeMode = (value: unknown): value is ThemeMode => value === 'light' || value === 'dark';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [isHighContrast, setHighContrastState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(THEME_SETTINGS_KEY)
      .then((stored) => {
        if (!mounted || !stored) {
          return;
        }

        const parsed = JSON.parse(stored) as StoredThemeSettings;
        if (isThemeMode(parsed.mode)) {
          setModeState(parsed.mode);
        }
        if (typeof parsed.highContrast === 'boolean') {
          setHighContrastState(parsed.highContrast);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const persistSettings = useCallback(async (nextMode: ThemeMode, nextHighContrast: boolean) => {
    await AsyncStorage.setItem(
      THEME_SETTINGS_KEY,
      JSON.stringify({ mode: nextMode, highContrast: nextHighContrast }),
    );
  }, []);

  const setMode = useCallback(
    async (nextMode: ThemeMode) => {
      setModeState(nextMode);
      await persistSettings(nextMode, isHighContrast);
    },
    [isHighContrast, persistSettings],
  );

  const setHighContrast = useCallback(
    async (enabled: boolean) => {
      setHighContrastState(enabled);
      await persistSettings(mode, enabled);
    },
    [mode, persistSettings],
  );

  const toggleDarkMode = useCallback(async () => {
    const nextMode = mode === 'dark' ? 'light' : 'dark';
    setModeState(nextMode);
    await persistSettings(nextMode, isHighContrast);
  }, [isHighContrast, mode, persistSettings]);

  const toggleHighContrast = useCallback(async () => {
    const nextHighContrast = !isHighContrast;
    setHighContrastState(nextHighContrast);
    await persistSettings(mode, nextHighContrast);
  }, [isHighContrast, mode, persistSettings]);

  const theme = useMemo(() => createTheme(mode, isHighContrast), [isHighContrast, mode]);

  const value = useMemo(
    () => ({
      theme,
      mode,
      isHighContrast,
      isLoading,
      setMode,
      setHighContrast,
      toggleDarkMode,
      toggleHighContrast,
    }),
    [isHighContrast, isLoading, mode, setHighContrast, setMode, theme, toggleDarkMode, toggleHighContrast],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
};
