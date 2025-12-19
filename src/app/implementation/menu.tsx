'use client';

import { Menu as MuiMenu, useTheme } from '@mui/material';
import { MenuProps } from '@/app/types/MenuProps';
import React from 'react';
import '@/app/theme/createTheme'; // Import for theme type augmentation

const useVariantStyles = (variant: 'default' | 'compact') => {
  const theme = useTheme();

  const variantStyles = {
    default: {
      '& .MuiPaper-root': {
        borderRadius: theme.customBorderRadius?.md || theme.shape.borderRadius,
        boxShadow: theme.shadows[3],
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
      },
    },
    compact: {
      '& .MuiPaper-root': {
        borderRadius: theme.customBorderRadius?.sm || theme.shape.borderRadius,
        boxShadow: theme.shadows[1],
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
      },
      '& .MuiMenuItem-root': {
        minHeight: 36,
        fontSize:
          theme.customTypography?.fontSize?.sm || theme.typography.fontSize,
      },
    },
  };

  return variantStyles[variant];
};

export const MenuImpl: React.FC<MenuProps> = ({
  variant = 'default',
  ...props
}) => {
  const theme = useTheme();
  const styles = useVariantStyles(variant);

  return (
    <MuiMenu
      sx={{
        fontFamily: theme.typography.fontFamily,
        ...styles,
      }}
      {...props}
    />
  );
};
