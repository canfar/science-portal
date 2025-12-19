import { UserStorageWidgetProps } from '@/app/types/UserStorageWidgetProps';
import { UserStorageWidgetImpl } from '@/app/implementation/userStorageWidget';
import React from 'react';

export const UserStorageWidget = React.forwardRef<
  HTMLDivElement,
  UserStorageWidgetProps
>((props, ref) => {
  return <UserStorageWidgetImpl ref={ref} {...props} />;
});

UserStorageWidget.displayName = 'UserStorageWidget';
