'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { DeleteSessionModalProps } from '@/app/types/DeleteSessionModalProps';

export const DeleteSessionModalImpl = React.forwardRef<
  HTMLDivElement,
  DeleteSessionModalProps
>(
  (
    { open, sessionName, sessionId, onClose, onConfirm, isDeleting = false },
    ref
  ) => {
    const theme = useTheme();

    const handleConfirm = async () => {
      await onConfirm();
    };

    return (
      <Dialog
        ref={ref}
        open={open}
        onClose={isDeleting ? undefined : onClose}
        maxWidth="sm"
        fullWidth
        aria-labelledby="delete-session-dialog-title"
        aria-describedby="delete-session-dialog-description"
      >
        <DialogTitle id="delete-session-dialog-title">
          Are you sure?
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-session-dialog-description" gutterBottom>
            Do you really want to delete this session? This process cannot be
            undone.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Session name {sessionName}, id {sessionId}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: theme.spacing(2), pt: 0 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            disabled={isDeleting}
            sx={{
              bgcolor: theme.palette.grey[600],
              color: theme.palette.common.white,
              borderColor: theme.palette.grey[600],
              '&:hover': {
                bgcolor: theme.palette.grey[700],
                borderColor: theme.palette.grey[700],
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="error"
            disabled={isDeleting}
            startIcon={
              isDeleting ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

DeleteSessionModalImpl.displayName = 'DeleteSessionModalImpl';
