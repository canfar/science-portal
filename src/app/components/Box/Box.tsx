import { BoxProps } from '@/app/types/BoxProps';
import { BoxImpl } from '@/app/implementation/box';
import React from 'react';

export const Box: React.FC<BoxProps> = (props) => {
  return <BoxImpl {...props} />;
};
