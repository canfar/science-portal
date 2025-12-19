import { DrawerProps as MuiDrawerProps } from '@mui/material/Drawer';
import { ReactNode } from 'react';

export interface DrawerProps extends Omit<MuiDrawerProps, 'variant'> {
  /** Visual variant of the drawer */
  variant?: 'temporary' | 'permanent' | 'persistent';
  /** Position of the drawer */
  anchor?: 'left' | 'right' | 'top' | 'bottom';
  /** Width of the drawer when anchor is left or right */
  width?: number | string;
  /** Height of the drawer when anchor is top or bottom */
  height?: number | string;
  /** Content to be displayed in the drawer */
  children: ReactNode;
  /** Whether the drawer is open */
  open?: boolean;
  /** Callback fired when the drawer requests to be closed */
  onClose?: () => void;
  /** Whether to show backdrop */
  hideBackdrop?: boolean;
  /** Custom backdrop props */
  BackdropProps?: object;
  /** ID of the element that labels the drawer for accessibility */
  'aria-labelledby'?: string;
  /** ID of the element that describes the drawer for accessibility */
  'aria-describedby'?: string;
}
