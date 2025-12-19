'use client';

import React from 'react';
import MuiAlert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { AlertProps } from '@/app/types/AlertProps';

export const AlertImplementation: React.FC<AlertProps> = ({
  severity,
  children,
  onClose,
  action,
  ...props
}) => {
  return (
    <MuiAlert
      severity={severity}
      onClose={onClose}
      action={
        action ||
        (onClose && (
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={onClose}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        ))
      }
      {...props}
    >
      {children}
    </MuiAlert>
  );
};
