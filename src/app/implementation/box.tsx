'use client';

import { Box as MuiBox } from '@mui/material';
import { BoxProps } from '@/app/types/BoxProps';
import React from 'react';

export const BoxImpl: React.FC<BoxProps> = (props) => {
  return <MuiBox {...props} />;
};
