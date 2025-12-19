'use client';

import { MenuItem as MuiMenuItem, Box, useTheme } from '@mui/material';
import { MenuItemProps } from '@/app/types/MenuItemProps';
import React from 'react';
import '@/app/theme/createTheme'; // Import for theme type augmentation

const useVariantStyles = (variant: 'default' | 'danger') => {
  const theme = useTheme();

  const variantStyles = {
    default: {
      color: theme.palette.text.primary,
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
    },
    danger: {
      color: theme.palette.error.main,
      '&:hover': {
        backgroundColor: theme.palette.error.light + '20', // 20% opacity
      },
    },
  };

  return variantStyles[variant];
};

export const MenuItemImpl: React.FC<MenuItemProps> = ({
  icon,
  variant = 'default',
  children,
  ...props
}) => {
  const theme = useTheme();
  const styles = useVariantStyles(variant);

  return (
    <MuiMenuItem
      sx={{
        fontFamily: theme.typography.fontFamily,
        fontSize:
          theme.customTypography?.fontSize?.md ||
          theme.typography.body1.fontSize,
        gap: 1,
        minHeight: 40,
        ...styles,
      }}
      {...props}
    >
      {icon && (
        <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
          {icon}
        </Box>
      )}
      {children}
    </MuiMenuItem>
  );
};
