'use client';

import { Button as MuiButton, CircularProgress, useTheme } from '@mui/material';
import { ButtonProps } from '@/app/types/ButtonProps';
import React from 'react';

const variantMapping = {
  primary: 'contained',
  secondary: 'outlined',
  ghost: 'text',
  error: 'contained',
  warning: 'contained',
  info: 'contained',
  success: 'contained',
} as const;

const colorMapping = {
  primary: 'primary',
  secondary: 'secondary',
  ghost: 'primary',
  error: 'error',
  warning: 'warning',
  info: 'info',
  success: 'success',
} as const;

const sizeMapping = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
} as const;

export const ButtonImpl = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      loadingPosition = 'center',
      label,
      children,
      disabled,
      startIcon,
      endIcon,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();
    const muiVariant = variantMapping[variant] || 'contained';
    const muiColor = colorMapping[variant] || 'primary';
    const muiSize = sizeMapping[size];
    const isDisabled = disabled || loading;

    const getLoadingIcon = () => {
      if (!loading) return null;
      const spinnerSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
      return (
        <CircularProgress size={spinnerSize} color="inherit" thickness={4.5} />
      );
    };

    const renderStartIcon = () => {
      if (loading && loadingPosition === 'start') return getLoadingIcon();
      return startIcon;
    };

    const renderEndIcon = () => {
      if (loading && loadingPosition === 'end') return getLoadingIcon();
      return endIcon;
    };

    const renderChildren = () => {
      if (loading && loadingPosition === 'center') {
        return getLoadingIcon();
      }
      return label || children;
    };

    return (
      <MuiButton
        ref={ref}
        variant={muiVariant}
        size={muiSize}
        disabled={isDisabled}
        startIcon={renderStartIcon()}
        endIcon={renderEndIcon()}
        color={
          muiColor as
            | 'inherit'
            | 'primary'
            | 'secondary'
            | 'success'
            | 'error'
            | 'info'
            | 'warning'
        }
        aria-busy={loading}
        sx={{
          textTransform: 'none',
          borderRadius: theme.shape.borderRadius,
          transition: 'none', // Remove transition for cleaner interaction
          position: 'relative',
          ...(variant === 'ghost' &&
            {
              // Hover effect removed for cleaner look
            }),
          ...(loading && {
            cursor: 'default',
            ...(loadingPosition === 'center' && {
              color: 'transparent',
            }),
          }),
        }}
        {...props}
      >
        {renderChildren()}
      </MuiButton>
    );
  }
);

ButtonImpl.displayName = 'ButtonImpl';
