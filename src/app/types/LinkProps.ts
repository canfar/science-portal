import { LinkProps as MuiLinkProps } from '@mui/material/Link';
import { ReactNode } from 'react';

export interface LinkProps extends Omit<MuiLinkProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'inherit';
  underline?: 'none' | 'hover' | 'always';
  children: ReactNode;
}
