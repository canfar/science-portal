import { MenuProps } from '@/app/types/MenuProps';
import { MenuImpl } from '@/app/implementation/menu';
import React from 'react';

export const Menu: React.FC<MenuProps> = (props) => {
  return <MenuImpl {...props} />;
};
