'use client';

import { Toolbar as MuiToolbar } from '@mui/material';
import { ToolbarProps } from '@/app/types/ToolbarProps';
import React from 'react';

export const ToolbarImpl: React.FC<ToolbarProps> = ({ variant, ...props }) => {
  return <MuiToolbar variant={variant} {...props} />;
};
