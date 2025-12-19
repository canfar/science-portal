import { ChipProps as MuiChipProps } from '@mui/material/Chip';

/**
 * Status variants for the Chip component
 */
export type ChipStatus = 'running' | 'pending' | 'terminating';

/**
 * Props for the Chip component
 * Extends Material-UI ChipProps with custom status variants
 */
export interface ChipProps extends Omit<MuiChipProps, 'color' | 'variant'> {
  /**
   * The status of the chip, which determines its color and message
   * @default 'pending'
   */
  status?: ChipStatus;

  /**
   * Custom label to override the default status message
   */
  label?: string;

  /**
   * The visual variant of the chip
   * @default 'filled'
   */
  variant?: 'filled' | 'outlined';
}
