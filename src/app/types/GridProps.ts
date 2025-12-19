import type { GridProps as MuiGridProps } from '@mui/material';
import { ReactNode } from 'react';

export interface GridProps extends MuiGridProps {
  /** Grid item children */
  children?: ReactNode;
}
