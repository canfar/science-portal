import { DrawerProps } from '@/app/types/DrawerProps';
import { DrawerImpl } from '@/app/implementation/drawer';
import React from 'react';

export const Drawer: React.FC<DrawerProps> = (props) => {
  return <DrawerImpl {...props} />;
};
