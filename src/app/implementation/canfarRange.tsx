'use client';

import React, { useState, useEffect } from 'react';
import { Slider, Box, useTheme } from '@mui/material';
import { CanfarRangeProps } from '@/app/types/CanfarRangeProps';

export const CanfarRangeImpl = React.forwardRef<HTMLDivElement, CanfarRangeProps>(
  ({ value, range, onChange, disabled = false, label }, ref) => {
    const theme = useTheme();

    const initialValue = range.findIndex((el) => parseInt(String(el)) === parseInt(String(value))) || 0;
    const [rangePos, setRangePos] = useState(initialValue);

    const handleChange = (_event: Event, newValue: number | number[]) => {
      const position = Array.isArray(newValue) ? newValue[0] : newValue;
      onChange(parseInt(String(range[position])));
      setRangePos(position);
    };

    useEffect(() => {
      if (value !== undefined && value !== null) {
        const newRangePos = range.findIndex((el) => parseInt(String(el)) === parseInt(String(value)));
        if (newRangePos !== -1) {
          setRangePos(newRangePos);
        }
      }
    }, [value, range]);

    // Calculate percentage for gradient visualization
    const percentage = ((rangePos) / (range.length - 1)) * 100;

    return (
      <Box ref={ref} sx={{ width: '100%', px: 1 }}>
        <Slider
          value={rangePos}
          min={0}
          max={range.length - 1}
          step={1}
          onChange={handleChange}
          disabled={disabled}
          aria-label={label}
          sx={{
            color: theme.palette.primary.main,
            height: 8,
            '& .MuiSlider-track': {
              border: 'none',
            },
            '& .MuiSlider-thumb': {
              height: 20,
              width: 20,
              backgroundColor: theme.palette.primary.main,
              border: '2px solid #fff',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                boxShadow: '0 3px 8px rgba(0, 0, 0, 0.3)',
              },
              '&:before': {
                display: 'none',
              },
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
  }
);

CanfarRangeImpl.displayName = 'CanfarRangeImpl';
