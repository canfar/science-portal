'use client';

import {
  Select as MuiSelect,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@mui/material';
import { SelectProps } from '@/app/types/SelectProps';
import React from 'react';

const sizeMapping = {
  sm: 'small',
  md: 'medium',
  lg: 'medium',
} as const;

export const SelectImpl = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      size = 'md',
      label,
      helperText,
      error = false,
      fullWidth = true,
      formControlProps,
      required,
      ...props
    },
    ref
  ) => {
    const muiSize = sizeMapping[size];
    const labelId = label ? `${props.id || 'select'}-label` : undefined;
    const helperTextId = helperText
      ? `${props.id || 'select'}-helper-text`
      : undefined;

    return (
      <FormControl
        ref={ref}
        fullWidth={fullWidth}
        error={error}
        size={muiSize}
        required={required}
        sx={(theme) => ({
          '& .MuiFormLabel-root': {
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
          '& .MuiFormHelperText-root': {
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.caption.fontSize,
            marginTop: theme.spacing(0.5),
            '&.Mui-error': {
              color: theme.palette.error.main,
            },
          },
        })}
        {...formControlProps}
      >
        {label && (
          <InputLabel
            id={labelId}
            sx={(theme) => ({
              fontFamily: theme.typography.fontFamily,
              fontSize:
                size === 'sm'
                  ? theme.typography.body2.fontSize
                  : theme.typography.body1.fontSize,
              fontWeight: theme.typography.fontWeightMedium,
            })}
          >
            {label}
          </InputLabel>
        )}
        <MuiSelect
          labelId={labelId}
          label={label}
          required={required}
          aria-describedby={error && helperTextId ? helperTextId : undefined}
          sx={(theme) => ({
            fontFamily: theme.typography.fontFamily,
            fontSize:
              size === 'sm'
                ? theme.typography.body2.fontSize
                : theme.typography.body1.fontSize,
            borderRadius: `${theme.shape.borderRadius}px`,
            backgroundColor: theme.palette.background.default,
            transition: 'none', // Remove transition for cleaner interaction
            '& .MuiOutlinedInput-notchedOutline': {
              borderRadius: `${theme.shape.borderRadius}px`,
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
            '& .MuiSelect-select': {
              padding:
                size === 'sm' ? theme.spacing(1, 1.5) : theme.spacing(1.5, 2),
              paddingRight: `${theme.spacing(4)} !important`,
              fontFamily: theme.typography.fontFamily,
              fontSize: 'inherit',
              color: theme.palette.text.primary,
              '&.Mui-disabled': {
                color: theme.palette.text.disabled,
              },
            },
            '& .MuiSelect-icon': {
              color: theme.palette.action.active,
              transition: 'none', // Remove transition for cleaner interaction
              '&.MuiSelect-iconOpen': {
                transform: 'rotate(180deg)',
                color: theme.palette.primary.main,
              },
              '&.Mui-disabled': {
                color: theme.palette.action.disabled,
              },
            },
          })}
          MenuProps={{
            PaperProps: {
              sx: (theme) => ({
                borderRadius: `${theme.shape.borderRadius}px`,
                backgroundColor: theme.palette.background.paper,
                boxShadow: theme.shadows[8],
                border: `1px solid ${theme.palette.divider}`,
                marginTop: theme.spacing(0.5),
                maxHeight: '300px',
                '& .MuiList-root': {
                  padding: theme.spacing(0.5),
                },
                '& .MuiMenuItem-root': {
                  fontFamily: theme.typography.fontFamily,
                  fontSize:
                    size === 'sm'
                      ? theme.typography.body2.fontSize
                      : theme.typography.body1.fontSize,
                  padding: theme.spacing(1, 2),
                  margin: theme.spacing(0.25, 0.5),
                  borderRadius: `${Math.max(0, (theme.shape.borderRadius as number) - 2)}px`,
                  color: theme.palette.text.primary,
                  minHeight: 'auto',
                  transition: 'none', // Remove transition for cleaner interaction
                  // Hover effect removed for cleaner look
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    // Hover effect removed for cleaner look
                  },
                  '&.Mui-focusVisible': {
                    backgroundColor: theme.palette.action.focus,
                  },
                  '&.Mui-disabled': {
                    color: theme.palette.text.disabled,
                  },
                },
              }),
            },
            transformOrigin: {
              vertical: 'top',
              horizontal: 'left',
            },
            anchorOrigin: {
              vertical: 'bottom',
              horizontal: 'left',
            },
          }}
          {...props}
        />
        {helperText && (
          <FormHelperText
            id={helperTextId}
            sx={(theme) => ({
              fontFamily: theme.typography.fontFamily,
              fontSize: theme.typography.caption.fontSize,
              marginTop: theme.spacing(0.5),
            })}
          >
            {helperText}
          </FormHelperText>
        )}
      </FormControl>
    );
  }
);

SelectImpl.displayName = 'SelectImpl';
