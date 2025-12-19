'use client';

import { IconButton as MuiIconButton } from '@mui/material';
import { IconButtonProps } from '@/app/types/IconButtonProps';
import React from 'react';

const sizeMapping = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
} as const;

export const IconButtonImpl = React.forwardRef<
  HTMLButtonElement,
  IconButtonProps
>(({ size = 'md', variant = 'primary', ...props }, ref) => {
  const muiSize = sizeMapping[size];

  return (
    <MuiIconButton
      ref={ref}
      size={muiSize}
      sx={(theme) => {
        const variantStyles = {
          primary: {
            color: theme.palette.primary.main,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          },
          secondary: {
            color: theme.palette.info.main,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          },
          ghost: {
            color: 'inherit',
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          },
        };

        return variantStyles[variant];
      }}
      {...props}
    />
  );
});

IconButtonImpl.displayName = 'IconButtonImpl';
