'use client';

import { TextField as MuiTextField } from '@mui/material';
import { TextFieldProps } from '@/app/types/TextFieldProps';
import React from 'react';

const sizeMapping = {
  sm: 'small',
  md: 'medium',
  lg: 'medium',
} as const;

export const TextFieldImpl = React.forwardRef<HTMLDivElement, TextFieldProps>(
  ({ size = 'md', variant = 'outlined', fullWidth = true, ...props }, ref) => {
    const muiSize = sizeMapping[size];
    const helperTextId =
      props.helperText && (props.error || props.helperText)
        ? `${props.id || 'textfield'}-helper-text`
        : undefined;

    return (
      <MuiTextField
        ref={ref}
        size={muiSize}
        variant={variant}
        fullWidth={fullWidth}
        FormHelperTextProps={{
          id: helperTextId,
        }}
        inputProps={{
          'aria-describedby':
            props.error && helperTextId
              ? helperTextId
              : props['aria-describedby'] ||
                props.inputProps?.['aria-describedby'],
          ...props.inputProps,
        }}
        sx={(theme) => ({
          fontFamily: theme.typography.fontFamily,
          '& .MuiInputLabel-root': {
            fontFamily: theme.typography.fontFamily,
            fontSize:
              size === 'sm'
                ? theme.typography.body2.fontSize
                : theme.typography.body1.fontSize,
            fontWeight: theme.typography.fontWeightMedium,
            color: theme.palette.text.secondary,
            '&.Mui-focused': {
              color: theme.palette.primary.main,
            },
            '&.Mui-error': {
              color: theme.palette.error.main,
            },
          },
          '& .MuiOutlinedInput-root': {
            borderRadius: `${theme.shape.borderRadius}px`,
            fontFamily: theme.typography.fontFamily,
            fontSize:
              size === 'sm'
                ? theme.typography.body2.fontSize
                : theme.typography.body1.fontSize,
            backgroundColor: theme.palette.background.default,
            transition: 'none', // Remove transition for cleaner interaction
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.divider,
              borderWidth: '1px',
            },
            // Hover effect removed for cleaner look
            '&.Mui-focused': {
              backgroundColor: theme.palette.background.paper,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
                borderWidth: '2px',
              },
            },
            '&.Mui-error': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.error.main,
              },
            },
            '&.Mui-disabled': {
              backgroundColor: theme.palette.action.disabledBackground,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.action.disabled,
              },
            },
          },
          '& .MuiFilledInput-root': {
            borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
            fontFamily: theme.typography.fontFamily,
            fontSize:
              size === 'sm'
                ? theme.typography.body2.fontSize
                : theme.typography.body1.fontSize,
            backgroundColor: theme.palette.action.hover,
            transition: 'none', // Remove transition for cleaner interaction
            // Hover effect removed for cleaner look
            '&.Mui-focused': {
              backgroundColor: theme.palette.action.selected,
            },
          },
          '& .MuiInput-root': {
            fontFamily: theme.typography.fontFamily,
            fontSize:
              size === 'sm'
                ? theme.typography.body2.fontSize
                : theme.typography.body1.fontSize,
            '&:before': {
              borderBottomColor: theme.palette.divider,
              transition: 'none', // Remove transition for cleaner interaction
            },
            // Hover effect removed for cleaner look
            '&.Mui-focused:after': {
              borderBottomColor: theme.palette.primary.main,
            },
          },
          '& .MuiFormHelperText-root': {
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.caption.fontSize,
            marginTop: theme.spacing(0.5),
            color: theme.palette.text.secondary,
            '&.Mui-error': {
              color: theme.palette.error.main,
            },
          },
          '& .MuiInputBase-input': {
            padding:
              size === 'sm' ? theme.spacing(1, 1.5) : theme.spacing(1.5, 2),
            color: theme.palette.text.primary,
            '&::placeholder': {
              color: theme.palette.text.secondary,
              opacity: 1,
            },
            '&.Mui-disabled': {
              color: theme.palette.text.disabled,
            },
          },
        })}
        {...props}
      />
    );
  }
);

TextFieldImpl.displayName = 'TextFieldImpl';
