'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Link,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { SessionRequestModalProps } from '../types/SessionRequestModalProps';

/**
 * Parse and format error messages for better user experience
 */
const parseErrorMessage = (error: string | undefined): string => {
  if (!error) return 'An unknown error occurred';

  let errorText = error;

  // Try to parse as JSON first
  try {
    const errorObj = JSON.parse(error);
    // Extract message field if it exists
    if (errorObj.message) {
      errorText = errorObj.message;
    } else if (errorObj.details) {
      errorText = errorObj.details;
    } else if (errorObj.error) {
      errorText = errorObj.error;
    }
  } catch (e) {
    // Not JSON, continue with string parsing
  }

  // Match: "User X has reached the maximum of N active sessions."
  const maxSessionsMatch = errorText.match(/reached the maximum of (\d+) active sessions/i);
  if (maxSessionsMatch) {
    const maxSessions = maxSessionsMatch[1];
    return `You have reached the maximum limit of ${maxSessions} active sessions. Please delete an existing session before creating a new one.`;
  }

  // Match: "insufficient resources" or similar
  if (errorText.match(/insufficient|not enough|unavailable/i)) {
    return 'Insufficient resources available. Please try again later or request fewer resources.';
  }

  // Match: "quota exceeded"
  if (errorText.match(/quota.*exceeded/i)) {
    return 'Resource quota exceeded. Please delete unused sessions or contact support.';
  }

  // Default: return the original error, cleaned up
  return errorText.trim();
};

/**
 * SessionRequestModal implementation component
 */
export const SessionRequestModalImpl: React.FC<SessionRequestModalProps> = ({
  open,
  sessionName,
  sessionType,
  status,
  errorMessage,
  sessionUrl,
  onClose,
  onConnect,
  onRetry,
}) => {
  const theme = useTheme();
  const parsedError = parseErrorMessage(errorMessage);

  const getStatusIcon = () => {
    switch (status) {
      case 'requesting':
      case 'provisioning':
        return (
          <CircularProgress
            size={48}
            sx={{ color: theme.palette.primary.main }}
          />
        );
      case 'success':
        return (
          <CheckCircleIcon
            sx={{ fontSize: 48, color: theme.palette.success.main }}
          />
        );
      case 'error':
        return (
          <ErrorIcon sx={{ fontSize: 48, color: theme.palette.error.main }} />
        );
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'requesting':
        return 'Requesting session...';
      case 'provisioning':
        return 'Provisioning resources...';
      case 'success':
        return 'Session ready!';
      case 'error':
        return 'Failed to create session';
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case 'requesting':
        return `Submitting request for ${sessionType} session "${sessionName}"`;
      case 'provisioning':
        return 'Allocating compute resources and preparing your environment';
      case 'success':
        return `Your ${sessionType} session "${sessionName}" is ready to use`;
      case 'error':
        return 'An error occurred while creating your session. See details below.';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={status === 'success' || status === 'error' ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={
        status === 'requesting' || status === 'provisioning'
      }
      PaperProps={{
        sx: (theme) => ({
          // Better mobile dialog handling
          [theme.breakpoints.down('sm')]: {
            margin: theme.spacing(1),
            maxHeight: 'calc(100vh - 16px)',
            borderRadius: theme.spacing(1),
          },
        }),
      }}
    >
      <DialogTitle
        sx={(theme) => ({
          // Better mobile padding
          [theme.breakpoints.down('sm')]: {
            padding: theme.spacing(2, 2, 1, 2),
          },
        })}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="h6"
            sx={(theme) => ({
              // Smaller title on mobile if needed
              [theme.breakpoints.down('sm')]: {
                fontSize: theme.typography.body1.fontSize,
                fontWeight: theme.typography.fontWeightBold,
              },
            })}
          >
            Session Request
          </Typography>
          {(status === 'success' || status === 'error') && (
            <IconButton aria-label="close" onClick={onClose} sx={{ ml: 2 }}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </DialogTitle>

      <DialogContent
        sx={(theme) => ({
          // Better mobile padding
          [theme.breakpoints.down('sm')]: {
            padding: theme.spacing(1, 2, 2, 2),
          },
        })}
      >
        <Box
          sx={(theme) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            py: 3,
            // Smaller padding on mobile
            [theme.breakpoints.down('sm')]: {
              py: 2,
            },
          })}
        >
          {getStatusIcon()}

          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            {getStatusMessage()}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {getStatusDescription()}
          </Typography>

          {status === 'success' && sessionUrl && (
            <Alert
              severity="success"
              sx={(theme) => ({
                mt: 3,
                width: '100%',
                // Better mobile text handling
                [theme.breakpoints.down('sm')]: {
                  mt: 2,
                  '& .MuiAlert-message': {
                    fontSize: theme.typography.body2.fontSize,
                  },
                },
              })}
            >
              <Typography variant="body2">
                Session URL:{' '}
                <Link
                  href={sessionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    wordBreak: 'break-all',
                    // Better mobile link wrapping
                    '@media (max-width: 600px)': {
                      display: 'block',
                      mt: 0.5,
                    },
                  }}
                >
                  {sessionUrl}
                </Link>
              </Typography>
            </Alert>
          )}

          {status === 'error' && (
            <Alert
              severity="error"
              sx={(theme) => ({
                mt: 3,
                width: '100%',
                // Better mobile text handling
                [theme.breakpoints.down('sm')]: {
                  mt: 2,
                  '& .MuiAlert-message': {
                    fontSize: theme.typography.body2.fontSize,
                  },
                },
              })}
            >
              {parsedError}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={(theme) => ({
          px: 3,
          pb: 3,
          // Better mobile button layout
          [theme.breakpoints.down('sm')]: {
            px: 2,
            pb: 2,
            flexDirection: 'column-reverse',
            gap: 1,
            '& > *': {
              width: '100%',
              margin: '0 !important',
            },
          },
        })}
      >
        {status === 'success' && (
          <>
            <Button onClick={onClose} color="inherit">
              Close
            </Button>
            {onConnect && (
              <Button variant="contained" onClick={onConnect} autoFocus>
                Connect to Session
              </Button>
            )}
          </>
        )}

        {status === 'error' && (
          <>
            <Button onClick={onClose} color="inherit">
              Cancel
            </Button>
            {onRetry && (
              <Button variant="contained" onClick={onRetry} autoFocus>
                Retry
              </Button>
            )}
          </>
        )}

        {(status === 'requesting' || status === 'provisioning') && (
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
            Please wait while we process your request...
          </Typography>
        )}
      </DialogActions>
    </Dialog>
  );
};
