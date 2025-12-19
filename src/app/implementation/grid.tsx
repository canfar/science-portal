'use client';

import React from 'react';
import MuiGrid from '@mui/material/Grid';
import { GridProps } from '@/app/types/GridProps';
import { tokens } from '@/app/design-system/tokens';

export const GridImpl = React.forwardRef<HTMLDivElement, GridProps>(
  ({ children, sx, ...props }, ref) => {
    return (
      <MuiGrid
        ref={ref}
        sx={{
          fontFamily: tokens.typography.fontFamily.primary,
          ...sx,
        }}
        {...props}
      >
        {children}
      </MuiGrid>
    );
  }
);

GridImpl.displayName = 'GridImpl';
