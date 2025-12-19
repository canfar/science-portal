'use client';

import React from 'react';
import { Chip as MuiChip } from '@mui/material';
import { ChipProps, ChipStatus } from '../types/ChipProps';

/**
 * Maps custom status to Material-UI color variants
 */
const statusToColorMapping: Record<ChipStatus, 'success' | 'info' | 'warning'> =
  {
    running: 'success',
    pending: 'info',
    terminating: 'warning',
  } as const;

/**
 * Default status messages
 */
const statusMessages: Record<ChipStatus, string> = {
  running: 'Running',
  pending: 'Pending',
  terminating: 'Terminating',
} as const;

/**
 * Chip implementation component
 * Wraps Material-UI Chip with custom status-based styling
 */
export const ChipImpl: React.FC<ChipProps> = ({
  status = 'pending',
  label,
  variant = 'filled',
  size = 'small',
  sx,
  ...props
}) => {
  const muiColor = statusToColorMapping[status];
  const displayLabel = label || statusMessages[status];

  return (
    <MuiChip
      {...props}
      color={muiColor}
      variant={variant}
      label={displayLabel}
      size={size}
      sx={{
        fontWeight: 'medium',
        textTransform: 'capitalize',
        ...sx,
      }}
    />
  );
};
