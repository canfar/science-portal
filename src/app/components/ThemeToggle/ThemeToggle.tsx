import { ThemeToggleProps } from '@/app/types/ThemeToggleProps';
import { ThemeToggleImpl } from '@/app/implementation/themeToggle';
import React from 'react';

export const ThemeToggle: React.FC<ThemeToggleProps> = (props) => {
  return <ThemeToggleImpl {...props} />;
};
