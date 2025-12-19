import { DividerProps } from '@/app/types/DividerProps';
import { DividerImpl } from '@/app/implementation/divider';
import React from 'react';

export const Divider: React.FC<DividerProps> = (props) => {
  return <DividerImpl {...props} />;
};
