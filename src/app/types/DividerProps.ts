import { DividerProps as MuiDividerProps } from '@mui/material/Divider';

export interface DividerProps extends Omit<MuiDividerProps, 'variant'> {
  variant?: 'default' | 'subtle';
}
