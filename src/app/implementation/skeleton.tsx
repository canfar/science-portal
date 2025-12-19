'use client';

import React from 'react';
import { Skeleton as MuiSkeleton, alpha } from '@mui/material';
import { SkeletonProps } from '@/app/types/SkeletonProps';
import { useTheme } from '@mui/material/styles';

export const SkeletonImpl: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  sx,
  ...props
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const skeletonColors = {
    base: isDarkMode
      ? alpha(theme.palette.grey[800], 0.5)
      : alpha(theme.palette.grey[300], 0.5),
    highlight: isDarkMode
      ? alpha(theme.palette.grey[700], 0.5)
      : alpha(theme.palette.grey[100], 0.5),
  };

  return (
    <MuiSkeleton
      variant={variant}
      width={width}
      height={height}
      animation={animation}
      sx={{
        backgroundColor: skeletonColors.base,
        '&::after': {
          background: `linear-gradient(90deg, transparent, ${skeletonColors.highlight}, transparent)`,
        },
        ...sx,
      }}
      {...props}
    />
  );
};
