'use client';

import React from 'react';
import { Typography as MuiTypography } from '@mui/material';
import { TypographyProps } from '@/app/types/TypographyProps';

export const TypographyImpl: React.FC<TypographyProps> = ({
  variant = 'body1',
  color = 'inherit',
  sx,
  ...props
}) => {
  return <MuiTypography variant={variant} color={color} sx={sx} {...props} />;
};
