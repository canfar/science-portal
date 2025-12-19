'use client';

import React from 'react';
import { Drawer as MuiDrawer, useTheme } from '@mui/material';
import { DrawerProps } from '@/app/types/DrawerProps';

const variantStyles = {
  temporary: {
    zIndex: 1300,
  },
  permanent: {
    zIndex: 1200,
    '& .MuiDrawer-paper': {
      position: 'relative',
    },
  },
  persistent: {
    zIndex: 1200,
  },
};

const getDrawerWidth = (
  anchor: string,
  width?: number | string,
  height?: number | string
) => {
  if (anchor === 'left' || anchor === 'right') {
    return width || 280;
  }
  if (anchor === 'top' || anchor === 'bottom') {
    return height || 240;
  }
  return 280;
};

export const DrawerImpl: React.FC<DrawerProps> = ({
  variant = 'temporary',
  anchor = 'left',
  width,
  height,
  open = false,
  onClose,
  hideBackdrop = false,
  BackdropProps,
  children,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  ...props
}) => {
  const theme = useTheme();
  const styles = variantStyles[variant];
  const drawerSize = getDrawerWidth(anchor, width, height);

  const paperStyles = {
    backgroundColor: theme.palette.background.paper,
    borderColor: theme.palette.divider,
    ...(anchor === 'left' || anchor === 'right'
      ? { width: drawerSize }
      : { height: drawerSize }),
  };

  return (
    <MuiDrawer
      variant={variant}
      anchor={anchor}
      open={open}
      onClose={onClose}
      hideBackdrop={hideBackdrop}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        ...BackdropProps,
      }}
      sx={{
        ...styles,
        '& .MuiDrawer-paper': {
          ...paperStyles,
          boxShadow: variant === 'temporary' ? theme.shadows[16] : 'none',
        },
      }}
      {...props}
    >
      {children}
    </MuiDrawer>
  );
};
