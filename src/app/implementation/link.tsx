'use client';

import { Link as MuiLink } from '@mui/material';
import { LinkProps } from '@/app/types/LinkProps';
import React from 'react';

export const LinkImpl = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ variant = 'primary', underline = 'hover', ...props }, ref) => {
    return (
      <MuiLink
        ref={ref}
        underline={underline}
        sx={(theme) => {
          const variantStyles = {
            primary: {
              color: theme.palette.primary.main,
              '&:hover': {
                color: theme.palette.primary.dark,
              },
            },
            secondary: {
              color: theme.palette.info.main,
              '&:hover': {
                color: theme.palette.info.dark,
              },
            },
            inherit: {
              color: 'inherit',
              '&:hover': {
                opacity: 0.8,
              },
            },
          };

          return {
            fontWeight: theme.typography.fontWeightMedium,
            ...variantStyles[variant],
          };
        }}
        {...props}
      />
    );
  }
);

LinkImpl.displayName = 'LinkImpl';
