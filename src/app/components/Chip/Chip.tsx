import React from 'react';
import { ChipProps } from '../../types/ChipProps';
import { ChipImpl } from '../../implementation/chip';

/**
 * Chip component for displaying status information
 *
 * Features:
 * - Three predefined status variants: running, pending, terminating
 * - Maps to theme colors: success (running), info (pending), warning (terminating)
 * - Customizable labels while maintaining status-based coloring
 * - Consistent with Material-UI design patterns
 *
 * @example
 * ```tsx
 * <Chip status="running" />
 * <Chip status="pending" label="Waiting" />
 * <Chip status="terminating" variant="outlined" />
 * ```
 */
export const Chip: React.FC<ChipProps> = (props) => {
  return <ChipImpl {...props} />;
};
