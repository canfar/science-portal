import { UserMenuProps } from '@/app/types/UserMenuProps';
import { UserMenuImpl } from '@/app/implementation/userMenu';
import React from 'react';

export const UserMenu = React.forwardRef<HTMLDivElement, UserMenuProps>(
  (props, ref) => {
    return <UserMenuImpl ref={ref} {...props} />;
  }
);

UserMenu.displayName = 'UserMenu';
