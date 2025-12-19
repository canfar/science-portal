import { TooltipProps } from '@/app/types/TooltipProps';
import { TooltipImpl } from '@/app/implementation/tooltip';
import React from 'react';

export const Tooltip: React.FC<TooltipProps> = (props) => {
  return <TooltipImpl {...props} />;
};
