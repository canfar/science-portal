'use client';

import React from 'react';
import { Slider, Box, useTheme } from '@mui/material';
import { CanfarRangeProps } from '@/app/types/CanfarRangeProps';

/**
 * Dumb controlled slider over [min, max] with step=1 by default.
 *
 * Performance note: this component is intentionally controlled. To avoid the
 * parent form re-rendering on every drag tick, host this in a wrapper that
 * keeps a local "draft" value during drag and only propagates upward on
 * `onChangeCommitted`. See `ResourceField` for the pattern.
 */
export const CanfarRangeImpl = React.forwardRef<HTMLDivElement, CanfarRangeProps>(
  ({ value, min, max, step = 1, onChange, onChangeCommitted, disabled = false, label }, ref) => {
    const theme = useTheme();

    const [lo, hi] = min > max ? [max, min] : [min, max];
    const clamped = Math.min(Math.max(value, lo), hi);

    const handleChange = (_event: Event, newValue: number | number[]) => {
      const next = Array.isArray(newValue) ? newValue[0] : newValue;
      onChange(next);
    };

    const handleCommitted = (
      _event: Event | React.SyntheticEvent,
      newValue: number | number[],
    ) => {
      if (!onChangeCommitted) return;
      const next = Array.isArray(newValue) ? newValue[0] : newValue;
      onChangeCommitted(next);
    };

    return (
      <Box ref={ref} sx={{ width: '100%', px: 1 }}>
        <Slider
          value={clamped}
          min={lo}
          max={hi}
          step={step}
          onChange={handleChange}
          onChangeCommitted={handleCommitted}
          disabled={disabled || lo === hi}
          aria-label={label}
          aria-valuemin={lo}
          aria-valuemax={hi}
          aria-valuenow={clamped}
          aria-valuetext={`${clamped} out of ${hi}`}
          sx={{
            color: theme.palette.primary.main,
            height: 8,
            '& .MuiSlider-track': { border: 'none' },
            '& .MuiSlider-thumb': {
              height: 20,
              width: 20,
              backgroundColor: theme.palette.primary.main,
              border: '2px solid #fff',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                boxShadow: '0 3px 8px rgba(0, 0, 0, 0.3)',
              },
              '&:before': { display: 'none' },
            },
            '& .MuiSlider-rail': {
              color: theme.palette.mode === 'dark' ? '#bfbfbf' : '#dee2e6',
              opacity: 1,
              height: 8,
            },
          }}
        />
      </Box>
    );
  },
);

CanfarRangeImpl.displayName = 'CanfarRangeImpl';
