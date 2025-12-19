'use client';

import React, { useState, useCallback } from 'react';
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  AccountCircle,
  PersonOutline,
  VpnKey,
  Verified,
  Logout,
} from '@mui/icons-material';
import { UserMenuProps } from '@/app/types/UserMenuProps';

export const UserMenuImpl = React.forwardRef<HTMLDivElement, UserMenuProps>(
  (
    {
      userName,
      isAuthenticated,
      onLogin,
      onLogout,
      onUpdateProfile,
      onResetPassword,
      onObtainCertificate,
    },
    ref
  ) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    }, []);

    const handleClose = useCallback(() => {
      setAnchorEl(null);
    }, []);

    const handleMenuItemClick = useCallback(
      (callback?: () => void) => {
        return () => {
          handleClose();
          callback?.();
        };
      },
      [handleClose]
    );

    // If not authenticated, show login button
    if (!isAuthenticated) {
      return (
        <Button
          variant="contained"
          color="primary"
          onClick={onLogin}
          startIcon={<AccountCircle />}
          sx={{ textTransform: 'none' }}
        >
          Login
        </Button>
      );
    }

    // If authenticated, show user menu
    return (
      <div ref={ref}>
        <IconButton
          onClick={handleClick}
          size="large"
          edge="end"
          aria-label="account menu"
          aria-controls={open ? 'account-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          color="inherit"
        >
          <AccountCircle />
        </IconButton>
        <Menu
          id="account-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          onClick={handleClose}
          slotProps={{
            paper: {
              elevation: 3,
              sx: {
                minWidth: 200,
                mt: 1.5,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {userName && (
            <>
              <MenuItem disabled sx={{ opacity: 1, fontWeight: 600 }}>
                {userName}
              </MenuItem>
              <Divider />
            </>
          )}
          <MenuItem onClick={handleMenuItemClick(onUpdateProfile)}>
            <ListItemIcon>
              <PersonOutline fontSize="small" />
            </ListItemIcon>
            <ListItemText>Update Profile</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMenuItemClick(onResetPassword)}>
            <ListItemIcon>
              <VpnKey fontSize="small" />
            </ListItemIcon>
            <ListItemText>Reset Password</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMenuItemClick(onObtainCertificate)}>
            <ListItemIcon>
              <Verified fontSize="small" />
            </ListItemIcon>
            <ListItemText>Obtain Certificate</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleMenuItemClick(onLogout)}>
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>
      </div>
    );
  }
);

UserMenuImpl.displayName = 'UserMenuImpl';
