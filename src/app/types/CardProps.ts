import {
  CardProps as MuiCardProps,
  CardContentProps as MuiCardContentProps,
  CardActionsProps as MuiCardActionsProps,
  CardHeaderProps as MuiCardHeaderProps,
  CardMediaProps as MuiCardMediaProps,
} from '@mui/material';
import { ReactNode } from 'react';

// Card Component Props
export interface CardProps extends Omit<MuiCardProps, 'variant'> {
  variant?: 'elevated' | 'outlined';
  loading?: boolean;
  children: ReactNode;
  className?: string;
}

// CardContent Component Props
export interface CardContentProps extends MuiCardContentProps {
  loading?: boolean;
  children: ReactNode;
  className?: string;
}

// CardActions Component Props
export interface CardActionsProps extends MuiCardActionsProps {
  align?: 'left' | 'right' | 'center' | 'space-between';
  loading?: boolean;
  children: ReactNode;
  className?: string;
}

// CardHeader Component Props
export interface CardHeaderProps
  extends Omit<MuiCardHeaderProps, 'title' | 'subheader'> {
  title: ReactNode;
  subheader?: ReactNode;
  loading?: boolean;
  className?: string;
}

// CardMedia Component Props
export interface CardMediaProps extends Omit<MuiCardMediaProps, 'component'> {
  component?: 'img' | 'video' | 'picture' | 'div';
  height?: number | string;
  loading?: boolean;
  alt?: string;
  className?: string;
  // Video-specific props
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  playsInline?: boolean;
}
