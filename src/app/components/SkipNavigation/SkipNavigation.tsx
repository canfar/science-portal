import React from 'react';
import { SkipNavigationProps } from '@/app/types/SkipNavigationProps';
import { SkipNavigationImpl } from '@/app/implementation/skipNavigation';

export const SkipNavigation: React.FC<SkipNavigationProps> = (props) => {
  return <SkipNavigationImpl {...props} />;
};
