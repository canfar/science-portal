'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { SessionCheckModalProps } from '@/app/types/SessionCheckModalProps';

export const SessionCheckModalImpl = React.forwardRef<
  HTMLDivElement,
  SessionCheckModalProps
>(({ open, onClose, isChecking = true }, ref) => {
  const theme = useTheme();

  return (
    <Dialog
      ref={ref}
      open={open}
      onClose={isChecking ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="check-session-dialog-title"
      aria-describedby="check-session-dialog-description"
    >
      <DialogTitle id="check-session-dialog-title">Session Check</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing(2),
            py: theme.spacing(2),
          }}
        >
          <Typography
            id="check-session-dialog-description"
            variant="body1"
            sx={{ flex: 1 }}
          >
            Fetching session list
          </Typography>
          <CircularProgress size={24} />
        </Box>
      </DialogContent>
    </Dialog>
  );
});

SessionCheckModalImpl.displayName = 'SessionCheckModalImpl';
