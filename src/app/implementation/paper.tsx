'use client';

import React from 'react';
import MuiPaper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';
import { PaperProps } from '@/app/types/PaperProps';

export const PaperImplementation = React.forwardRef<HTMLDivElement, PaperProps>(
  (
    {
      children,
      elevation = 1,
      variant = 'elevation',
      square = false,
      sx,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();

    // Validate elevation range (0-24)
    const validatedElevation = Math.min(Math.max(0, elevation), 24);

    return (
      <MuiPaper
        ref={ref}
        elevation={variant === 'elevation' ? validatedElevation : 0}
        variant={variant}
        square={square}
        sx={{
          // Apply theme-based styling
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          transition: theme.transitions.create(['box-shadow', 'transform'], {
            duration: theme.transitions.duration.short,
          }),
          // Allow custom sx props to override
          ...sx,
        }}
        {...props}
      >
        {children}
      </MuiPaper>
    );
  }
);

PaperImplementation.displayName = 'Paper';
