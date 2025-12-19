'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { createTheme, ThemeMode } from './createTheme';
import type { Theme } from '@mui/material/styles';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Safe version that returns default values when outside ThemeProvider
export const useSafeTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return default theme context when not within provider
    return {
      mode: 'light',
      toggleTheme: () => {
        console.warn('ThemeProvider not found, theme toggle disabled');
      },
      setTheme: () => {
        console.warn('ThemeProvider not found, theme change disabled');
      },
    };
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
  storageKey?: string;
  theme?: Theme; // Allow custom theme override
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = 'light',
  storageKey = 'canfar-ui-theme',
  theme: customTheme,
}) => {
  const [mode, setMode] = useState<ThemeMode>(defaultMode);

  // Update mode when defaultMode changes
  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  // Load theme from localStorage on mount
  useEffect(() => {
    // Skip localStorage in Storybook environment
    if (storageKey.startsWith('storybook-')) return;

    try {
      const savedTheme = localStorage.getItem(storageKey) as ThemeMode;
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setMode(savedTheme);
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    }
  }, [storageKey]);

  // Save theme to localStorage when it changes
  useEffect(() => {
    // Skip localStorage in Storybook environment
    if (storageKey.startsWith('storybook-')) return;

    try {
      localStorage.setItem(storageKey, mode);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, [mode, storageKey]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  const theme = customTheme || createTheme(mode);

  const contextValue: ThemeContextType = {
    mode,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
