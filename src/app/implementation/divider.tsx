'use client';

import { Divider as MuiDivider } from '@mui/material';
import { DividerProps } from '@/app/types/DividerProps';
import React from 'react';

export const DividerImpl: React.FC<DividerProps> = ({
  variant = 'default',
  ...props
}) => {
  return (
    <MuiDivider
      sx={(theme) => {
        const variantStyles = {
          default: {
            borderColor: theme.palette.divider,
          },
          subtle: {
            borderColor: theme.palette.action.disabledBackground,
          },
        };

        return variantStyles[variant];
      }}
      {...props}
    />
  );
};
