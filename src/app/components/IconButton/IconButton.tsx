import { IconButtonProps } from '@/app/types/IconButtonProps';
import { IconButtonImpl } from '@/app/implementation/iconButton';
import React from 'react';

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (props, ref) => {
    return <IconButtonImpl ref={ref} {...props} />;
  }
);

IconButton.displayName = 'IconButton';
