'use client';

import React from 'react';
import MuiList from '@mui/material/List';
import MuiListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Divider from '@mui/material/Divider';
import { ListProps } from '@/app/types/ListProps';
import { ListItemProps } from '@/app/types/ListItemProps';

export const ListImplementation: React.FC<ListProps> = ({
  children,
  dense = false,
  disablePadding = false,
  variant = 'default',
  sx,
  ...props
}) => {
  const variantStyles = {
    default: {},
    'file-browser': {
      bgcolor: 'background.paper',
      border: 1,
      borderColor: 'divider',
      borderRadius: 1,
    },
    doi: {
      bgcolor: 'background.paper',
      boxShadow: 1,
      borderRadius: 1,
    },
    sessions: {
      bgcolor: 'background.default',
      '& .MuiListItem-root': {
        borderRadius: 1,
        mb: 0.5,
        '&:last-child': {
          mb: 0,
        },
      },
    },
  };

  return (
    <MuiList
      dense={dense}
      disablePadding={disablePadding}
      sx={{
        ...variantStyles[variant],
        ...sx,
      }}
      {...props}
    >
      {children}
    </MuiList>
  );
};

export const ListItemImplementation: React.FC<ListItemProps> = ({
  children,
  selected = false,
  divider = false,
  variant = 'default',
  onClick,
  disabled,
  disableGutters,
  disablePadding,
  button,
  secondaryAction,
  sx,
  ...props
}) => {
  const variantStyles = {
    default: {},
    file: {
      '&:hover': {
        bgcolor: 'action.hover',
      },
      '&.Mui-selected': {
        bgcolor: 'action.selected',
        '&:hover': {
          bgcolor: 'action.selected',
        },
      },
    },
    doi: {
      borderLeft: 3,
      borderColor: 'transparent',
      '&.Mui-selected': {
        borderColor: 'primary.main',
        bgcolor: 'primary.lighter',
      },
    },
    session: {
      bgcolor: 'background.paper',
      boxShadow: 1,
      '&:hover': {
        boxShadow: 2,
      },
      '&.Mui-selected': {
        boxShadow: 3,
        bgcolor: 'primary.lighter',
      },
    },
  };

  const content = (
    <>
      {children}
      {divider && <Divider component="li" />}
    </>
  );

  // If the item is clickable, wrap in ListItemButton
  if (onClick || button) {
    return (
      <MuiListItem
        disableGutters={disableGutters}
        disablePadding={disablePadding}
        secondaryAction={secondaryAction}
        sx={{
          ...variantStyles[variant],
          ...sx,
        }}
        {...props}
      >
        <ListItemButton
          selected={selected}
          onClick={onClick}
          disabled={disabled}
          sx={{ flexGrow: 1 }}
        >
          {children}
        </ListItemButton>
      </MuiListItem>
    );
  }

  return (
    <MuiListItem
      disableGutters={disableGutters}
      disablePadding={disablePadding}
      secondaryAction={secondaryAction}
      sx={{
        ...variantStyles[variant],
        ...(selected && {
          bgcolor: 'action.selected',
        }),
        ...(disabled && {
          opacity: 0.5,
          pointerEvents: 'none',
        }),
        ...sx,
      }}
      {...props}
    >
      {content}
    </MuiListItem>
  );
};

// Export helper components for convenience
export {
  ListItemIcon,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  ListItemButton,
  Divider,
};
