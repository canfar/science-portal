import { TypographyProps as MuiTypographyProps } from '@mui/material/Typography';
import { ReactNode } from 'react';

export interface TypographyProps extends Omit<MuiTypographyProps, 'variant'> {
  /** Typography variant */
  variant?:
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'subtitle1'
    | 'subtitle2'
    | 'body1'
    | 'body2'
    | 'caption'
    | 'overline';
  /** Text content */
  children: ReactNode;
  /** Text color */
  color?:
    | 'primary'
    | 'secondary'
    | 'inherit'
    | 'error'
    | 'warning'
    | 'info'
    | 'success';
}
