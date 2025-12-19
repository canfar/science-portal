'use client';

import React, { useMemo } from 'react';
import { IconButton, Tooltip, Box } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { ThemeToggleProps } from '@/app/types/ThemeToggleProps';
import { useSafeTheme } from '@/app/theme/ThemeContext';
import { TypographyImpl } from './typography';

// Memoized to prevent re-renders when parent re-renders
// ThemeToggle only needs to re-render when its props or theme mode change
export const ThemeToggleImpl: React.FC<ThemeToggleProps> = React.memo(
  ({
    size = 'md',
    showLabel = false,
    lightLabel = 'Light',
    darkLabel = 'Dark',
  }) => {
    const { mode, toggleTheme } = useSafeTheme();

    // Memoized constant values to prevent recreation on each render
    const sizeMap = useMemo(
      () =>
        ({
          sm: 'small',
          md: 'medium',
          lg: 'large',
        }) as const,
      []
    );

    const iconSize = useMemo(
      () => ({
        sm: '1rem',
        md: '1.25rem',
        lg: '1.5rem',
      }),
      []
    );

    // Memoized computed values that depend on mode
    const { Icon, label, tooltip } = useMemo(() => {
      const dark = mode === 'dark';
      return {
        Icon: dark ? LightModeIcon : DarkModeIcon,
        label: dark ? lightLabel : darkLabel,
        tooltip: `Switch to ${dark ? 'light' : 'dark'} mode`,
      };
    }, [mode, lightLabel, darkLabel]);

    if (showLabel) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={tooltip}>
            <IconButton
              onClick={toggleTheme}
              size={sizeMap[size]}
              aria-label={tooltip}
              sx={{
                borderRadius: 1,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
            >
              <Icon sx={{ fontSize: iconSize[size] }} />
            </IconButton>
          </Tooltip>
          <TypographyImpl
            variant="body2"
            sx={{
              fontSize:
                size === 'sm' ? '0.75rem' : size === 'lg' ? '1rem' : '0.875rem',
              fontWeight: 'medium',
              userSelect: 'none',
            }}
          >
            {label}
          </TypographyImpl>
        </Box>
      );
    }

    return (
      <Tooltip title={tooltip}>
        <IconButton
          onClick={toggleTheme}
          size={sizeMap[size]}
          aria-label={tooltip}
          sx={{
            borderRadius: 1,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          }}
        >
          <Icon sx={{ fontSize: iconSize[size] }} />
        </IconButton>
      </Tooltip>
    );
  }
);

ThemeToggleImpl.displayName = 'ThemeToggleImpl';
