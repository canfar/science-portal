import { MenuItemProps as MuiMenuItemProps } from '@mui/material/MenuItem';
import { ReactNode } from 'react';

export interface MenuItemProps extends MuiMenuItemProps {
  icon?: ReactNode;
  variant?: 'default' | 'danger';
  href?: string;
  target?: string;
  rel?: string;
}
