'use client';

import React from 'react';
import {
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
  DialogContentText as MuiDialogContentText,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type {
  DialogProps,
  DialogTitleProps,
  DialogContentProps,
  DialogActionsProps,
  DialogContentTextProps,
} from '../types/DialogProps';

export function DialogImplementation({
  title,
  children,
  actions,
  fullScreenMobile = false,
  open,
  onClose,
  maxWidth = 'sm',
  ...muiProps
}: DialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fullScreen = fullScreenMobile && isMobile;

  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullScreen={fullScreen}
      fullWidth
      {...muiProps}
    >
      {title}
      {children}
      {actions}
    </MuiDialog>
  );
}

export function DialogTitleImplementation({
  children,
  showCloseButton = false,
  onClose,
}: DialogTitleProps) {
  return (
    <MuiDialogTitle
      sx={{
        m: 0,
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {children}
      {showCloseButton && onClose && (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      )}
    </MuiDialogTitle>
  );
}

export function DialogContentImplementation({
  children,
  dividers = false,
}: DialogContentProps) {
  return <MuiDialogContent dividers={dividers}>{children}</MuiDialogContent>;
}

export function DialogActionsImplementation({
  children,
  disableSpacing = false,
}: DialogActionsProps) {
  return (
    <MuiDialogActions
      disableSpacing={disableSpacing}
      sx={{
        px: 3,
        pb: 2,
      }}
    >
      {children}
    </MuiDialogActions>
  );
}

export function DialogContentTextImplementation({
  children,
  ...muiProps
}: DialogContentTextProps) {
  return <MuiDialogContentText {...muiProps}>{children}</MuiDialogContentText>;
}
