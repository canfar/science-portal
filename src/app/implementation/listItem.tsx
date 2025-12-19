'use client';

import React from 'react';
import MuiListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Divider from '@mui/material/Divider';
import { ListItemProps } from '@/app/types/ListItemProps';

export interface ExtendedListItemProps extends ListItemProps {
  /** Whether the item should be clickable */
  clickable?: boolean;
  /** Icon to display at the start of the item */
  icon?: React.ReactNode;
  /** Avatar to display at the start of the item */
  avatar?: React.ReactNode;
  /** Primary text content */
  primary?: React.ReactNode;
  /** Secondary text content */
  secondary?: React.ReactNode;
  /** Action element to display at the end */
  action?: React.ReactNode;
  /** Click handler for the item */
  onClick?: () => void;
  /** Whether to align items when there's an icon/avatar */
  alignItems?: 'flex-start' | 'center';
}

export const ListItemImplementation: React.FC<ExtendedListItemProps> = ({
  selected = false,
  divider = false,
  variant = 'default',
  clickable = false,
  icon,
  avatar,
  primary,
  secondary,
  action,
  onClick,
  alignItems = 'center',
  children,
  sx,
  ...props
}) => {
  // Custom styles based on variant
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
      borderRadius: 1,
      mb: 0.5,
      '&:hover': {
        bgcolor: 'action.hover',
      },
      '&.Mui-selected': {
        bgcolor: 'primary.light',
        color: 'primary.contrastText',
        '&:hover': {
          bgcolor: 'primary.light',
        },
      },
    },
    session: {
      borderRadius: 1,
      mb: 0.5,
      '&:hover': {
        boxShadow: 1,
      },
      '&.Mui-selected': {
        bgcolor: 'secondary.light',
        '&:hover': {
          bgcolor: 'secondary.light',
        },
      },
    },
  };

  const content = (
    <>
      {avatar && <ListItemAvatar>{avatar}</ListItemAvatar>}
      {icon && <ListItemIcon>{icon}</ListItemIcon>}
      {primary || secondary ? (
        <ListItemText
          primary={primary}
          secondary={secondary}
          primaryTypographyProps={{
            variant: variant === 'file' ? 'body2' : 'body1',
          }}
          secondaryTypographyProps={{
            variant: 'caption',
          }}
        />
      ) : (
        children
      )}
      {action && <ListItemSecondaryAction>{action}</ListItemSecondaryAction>}
    </>
  );

  const listItemSx = {
    ...variantStyles[variant],
    ...sx,
  };

  if (clickable || onClick) {
    return (
      <>
        <MuiListItem disablePadding sx={listItemSx} {...props}>
          <ListItemButton
            onClick={onClick}
            selected={selected}
            alignItems={alignItems}
          >
            {content}
          </ListItemButton>
        </MuiListItem>
        {divider && <Divider component="li" />}
      </>
    );
  }

  return (
    <>
      <MuiListItem alignItems={alignItems} sx={listItemSx} {...props}>
        {content}
      </MuiListItem>
      {divider && <Divider component="li" />}
    </>
  );
};
