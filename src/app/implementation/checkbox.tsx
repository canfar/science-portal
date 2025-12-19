'use client';

import {
  Checkbox as MuiCheckbox,
  FormControlLabel,
  FormHelperText,
  Box,
} from '@mui/material';
import { CheckboxProps } from '@/app/types/CheckboxProps';
import { tokens } from '@/app/design-system/tokens';
import React from 'react';

const sizeMapping = {
  sm: 'small',
  md: 'medium',
  lg: 'medium', // MUI doesn't have large, we'll handle with sx
} as const;

export const CheckboxImpl = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  (
    {
      label,
      size = 'md',
      error = false,
      helperText,
      formControlLabelProps,
      sx,
      ...props
    },
    ref
  ) => {
    const muiSize = sizeMapping[size];

    const checkboxSx = {
      ...(size === 'lg' && {
        '& .MuiSvgIcon-root': {
          fontSize: 28,
        },
      }),
      ...(error && {
        color: 'error.main',
        '&.Mui-checked': {
          color: 'error.main',
        },
      }),
      ...sx,
    };

    const checkbox = (
      <MuiCheckbox ref={ref} size={muiSize} sx={checkboxSx} {...props} />
    );

    if (!label && !helperText) {
      return checkbox;
    }

    return (
      <Box>
        {label ? (
          <FormControlLabel
            control={checkbox}
            label={label}
            sx={{
              margin: 0,
              '& .MuiFormControlLabel-label': {
                fontSize: tokens.typography.fontSize.base,
                color: error ? 'error.main' : 'text.primary',
              },
            }}
            {...formControlLabelProps}
          />
        ) : (
          checkbox
        )}
        {helperText && (
          <FormHelperText
            error={error}
            sx={{
              marginLeft: label ? 4 : 0,
              fontSize: tokens.typography.fontSize.sm,
            }}
          >
            {helperText}
          </FormHelperText>
        )}
      </Box>
    );
  }
);

CheckboxImpl.displayName = 'CheckboxImpl';
