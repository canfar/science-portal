import { MenuProps as MuiMenuProps } from '@mui/material/Menu';

export interface MenuProps extends Omit<MuiMenuProps, 'variant'> {
  variant?: 'default' | 'compact';
}
