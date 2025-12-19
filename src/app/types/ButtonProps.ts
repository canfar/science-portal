import { ButtonProps as MuiButtonProps } from '@mui/material/Button';
import { ReactNode } from 'react';

export interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'size'> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'ghost'
    | 'error'
    | 'warning'
    | 'info'
    | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingPosition?: 'start' | 'end' | 'center';
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  children: ReactNode;
  label?: string;
}
