import { ToolbarProps } from '@/app/types/ToolbarProps';
import { ToolbarImpl } from '@/app/implementation/toolbar';
import React from 'react';

export const Toolbar: React.FC<ToolbarProps> = (props) => {
  return <ToolbarImpl {...props} />;
};
