import { IconButtonProps as MuiIconButtonProps } from '@mui/material/IconButton';

export interface IconButtonProps extends Omit<MuiIconButtonProps, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
}
