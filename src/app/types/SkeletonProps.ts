import { SkeletonProps as MuiSkeletonProps } from '@mui/material/Skeleton';

export interface SkeletonProps extends Omit<MuiSkeletonProps, 'variant'> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | false;
}
