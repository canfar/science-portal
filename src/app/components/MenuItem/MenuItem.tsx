import { MenuItemProps } from '@/app/types/MenuItemProps';
import { MenuItemImpl } from '@/app/implementation/menuItem';
import React from 'react';

export const MenuItem: React.FC<MenuItemProps> = (props) => {
  return <MenuItemImpl {...props} />;
};
