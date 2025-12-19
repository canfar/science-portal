import { AppBarProps } from '@/app/types/AppBarProps';
import { AppBarImpl } from '@/app/implementation/appBar';
import React from 'react';

export const AppBar = React.forwardRef<HTMLDivElement, AppBarProps>(
  (props, ref) => {
    return <AppBarImpl ref={ref} {...props} />;
  }
);

AppBar.displayName = 'AppBar';
