'use client';

import { Radio as MuiRadio, FormControlLabel } from '@mui/material';
import { RadioProps } from '@/app/types/RadioProps';
import { tokens } from '@/app/design-system/tokens';
import React from 'react';

const sizeMapping = {
  sm: 'small',
  md: 'medium',
  lg: 'medium', // MUI doesn't have large, we'll handle with sx
} as const;

export const RadioImpl = React.forwardRef<HTMLButtonElement, RadioProps>(
  (
    { label, size = 'md', error = false, formControlLabelProps, sx, ...props },
    ref
  ) => {
    const muiSize = sizeMapping[size];

    const radioSx = {
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

    const radio = <MuiRadio ref={ref} size={muiSize} sx={radioSx} {...props} />;

    if (!label) {
      return radio;
    }

    return (
      <FormControlLabel
        control={radio}
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
    );
  }
);

RadioImpl.displayName = 'RadioImpl';
