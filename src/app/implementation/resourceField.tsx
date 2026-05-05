'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, FormLabel, IconButton, TextField, useTheme } from '@mui/material';
import {
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';
import { CanfarRange } from '@/app/components/CanfarRange/CanfarRange';
import { generateValuesWithPowersOfTwo } from '@/lib/utils/resource-options';
import { ResourceFieldProps } from '@/app/types/ResourceFieldProps';

/**
 * Slider + numeric input + stacked stepper buttons backed by a single local
 * "draft" value. One source of truth, one commit path.
 *
 * Performance:
 *  - dragging the slider only re-renders this component (parent form is
 *    notified once on release)
 *  - the input mirrors the draft live during drag
 *  - stepper buttons commit a single new value, no internal-state cascade
 *  - wrapped in React.memo: when one ResourceField commits, the others
 *    (with unchanged value/min/max) skip re-rendering entirely
 *
 * Stepper buttons step through powers of 2 (1 → 2 → 4 → 8 …) for fast coarse
 * selection; typing accepts any integer in [min, max] for fine control.
 */
const ResourceFieldComponent = React.forwardRef<HTMLDivElement, ResourceFieldProps>(
  ({ label, value, min, max, step = 1, onChange, disabled = false }, ref) => {
    const theme = useTheme();

    const [draft, setDraft] = useState(value);
    const [text, setText] = useState(String(value));
    // Don't let an external `value` change clobber the user's in-flight edit.
    const isInteracting = useRef(false);

    const validOptions = useMemo(() => generateValuesWithPowersOfTwo(min, max), [min, max]);

    useEffect(() => {
      if (!isInteracting.current) {
        setDraft(value);
        setText(String(value));
      }
    }, [value]);

    const commit = useCallback(
      (next: number) => {
        const clamped = Math.min(Math.max(next, min), max);
        setDraft(clamped);
        setText(String(clamped));
        if (clamped !== value) {
          onChange(clamped);
        }
      },
      [min, max, onChange, value],
    );

    const handleSliderChange = useCallback((next: number) => {
      isInteracting.current = true;
      setDraft(next);
      setText(String(next));
    }, []);

    const handleSliderCommitted = useCallback(
      (next: number) => {
        isInteracting.current = false;
        commit(next);
      },
      [commit],
    );

    const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      isInteracting.current = true;
      setText(event.target.value);
    }, []);

    const handleInputBlur = useCallback(() => {
      isInteracting.current = false;
      const parsed = Number(text);
      if (Number.isInteger(parsed) && parsed >= min && parsed <= max) {
        commit(parsed);
      } else {
        // Reject and snap back to the last known good value.
        setText(String(draft));
      }
    }, [text, draft, min, max, commit]);

    const nextOption = useMemo(
      () => validOptions.find((opt) => opt > draft),
      [validOptions, draft],
    );
    const prevOption = useMemo(() => {
      for (let i = validOptions.length - 1; i >= 0; i--) {
        if (validOptions[i] < draft) return validOptions[i];
      }
      return undefined;
    }, [validOptions, draft]);

    const handleIncrement = useCallback(() => {
      if (nextOption !== undefined) commit(nextOption);
    }, [nextOption, commit]);

    const handleDecrement = useCallback(() => {
      if (prevOption !== undefined) commit(prevOption);
    }, [prevOption, commit]);

    const isAtMax = nextOption === undefined;
    const isAtMin = prevOption === undefined;

    const stepperButtonSx = {
      width: 22,
      flex: 1,
      minHeight: 0,
      borderRadius: 0,
      padding: 0,
      color: theme.palette.text.secondary,
      '&:hover': { backgroundColor: theme.palette.action.hover },
      '&.Mui-disabled': { color: theme.palette.action.disabled },
    } as const;

    return (
      <Box ref={ref}>
        <FormLabel
          sx={{ fontSize: '0.75rem', fontWeight: 400, mb: 1, display: 'block' }}
        >
          {label}
        </FormLabel>
        <CanfarRange
          value={draft}
          min={min}
          max={max}
          step={step}
          onChange={handleSliderChange}
          onChangeCommitted={handleSliderCommitted}
          disabled={disabled}
          label={label}
        />
        <Box sx={{ mt: 1 }}>
          <TextField
            type="number"
            value={text}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            disabled={disabled}
            fullWidth
            size="small"
            inputProps={{
              'aria-label': label,
              inputMode: 'numeric',
              min,
              max,
              step: 1,
            }}
            sx={{
              '& input[type=number]': { MozAppearance: 'textfield' },
              '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
              '& .MuiOutlinedInput-root': { paddingRight: 0, alignItems: 'stretch' },
              '& .MuiOutlinedInput-input': { paddingRight: theme.spacing(0.5) },
              '& .MuiInputAdornment-root': {
                height: 'auto',
                maxHeight: 'none',
                alignSelf: 'stretch',
                marginLeft: 0,
              },
            }}
            slotProps={{
              input: {
                endAdornment: (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      borderLeft: `1px solid ${theme.palette.divider}`,
                      alignSelf: 'stretch',
                      height: '100%',
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={handleIncrement}
                      disabled={disabled || isAtMax}
                      aria-label={`Increase ${label}`}
                      sx={{
                        ...stepperButtonSx,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <ArrowUpIcon fontSize="inherit" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={handleDecrement}
                      disabled={disabled || isAtMin}
                      aria-label={`Decrease ${label}`}
                      sx={stepperButtonSx}
                    >
                      <ArrowDownIcon fontSize="inherit" />
                    </IconButton>
                  </Box>
                ),
              },
            }}
          />
        </Box>
      </Box>
    );
  },
);

ResourceFieldComponent.displayName = 'ResourceFieldImpl';

export const ResourceFieldImpl = React.memo(ResourceFieldComponent);
