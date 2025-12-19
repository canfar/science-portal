import { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import { ReactNode } from 'react';

export interface AppBarLink {
  label: string;
  href?: string;
  onClick?: () => void;
  menuItems?: AppBarMenuItem[];
}

export interface AppBarMenuItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  divider?: boolean;
}

export interface AppBarProps
  extends Omit<MuiAppBarProps, 'position' | 'variant'> {
  logo?: ReactNode;
  logoHref?: string;
  onLogoClick?: () => void;
  wordmark?: string;
  links?: AppBarLink[];
  menuItems?: AppBarMenuItem[];
  menuLabel?: ReactNode;
  accountButton?: ReactNode;
  onAccountButtonClick?: () => void;
  position?: 'fixed' | 'absolute' | 'sticky' | 'static' | 'relative';
  elevation?: number;
  variant?: 'primary' | 'transparent' | 'dark' | 'surface';
}
