'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Box,
  IconButton,
  Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { TextField } from '@/app/components/TextField/TextField';
import { ResetPasswordModalProps } from '@/app/types/ResetPasswordModalProps';

export const ResetPasswordModalImpl = React.forwardRef<
  HTMLDivElement,
  ResetPasswordModalProps
>(
  (
    {
      open,
      onClose,
      isLoading = false,
      errorMessage,
      successMessage,
      ...dialogProps
    },
    ref
  ) => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState<string | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [internalError, setInternalError] = useState<string | null>(null);
    const [internalSuccess, setInternalSuccess] = useState<string | null>(null);

    // Reset form when modal opens
    useEffect(() => {
      if (open) {
        setEmail('');
        setEmailError(undefined);
        setInternalError(null);
        setInternalSuccess(null);
      }
    }, [open]);

    // Clear internal error when external error changes
    useEffect(() => {
      if (errorMessage) {
        setInternalError(null);
      }
    }, [errorMessage]);

    // Clear internal success when external success changes
    useEffect(() => {
      if (successMessage) {
        setInternalSuccess(null);
      }
    }, [successMessage]);

    const validateEmail = useCallback((email: string): boolean => {
      if (!email.trim()) {
        setEmailError('Email is required');
        return false;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError('Please enter a valid email address');
        return false;
      }

      setEmailError(undefined);
      return true;
    }, []);

    const handleEmailChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setEmail(value);

        // Clear error when user starts typing
        if (emailError) {
          setEmailError(undefined);
        }

        // Clear any error/success messages
        setInternalError(null);
        setInternalSuccess(null);
      },
      [emailError]
    );

    const handleSubmit = useCallback(
      async (event: React.FormEvent) => {
        event.preventDefault();

        if (!validateEmail(email)) {
          return;
        }

        setIsSubmitting(true);
        setInternalError(null);
        setInternalSuccess(null);

        try {
          const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              emailAddress: email.trim(),
              pageLanguage: 'en',
              role: 'CADC',
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to send password reset email');
          }

          setInternalSuccess(
            data.message ||
              'Password reset instructions have been sent to your email address.'
          );

          // Clear the email field after successful submission
          setEmail('');
        } catch (error) {
          const errorMsg =
            error instanceof Error
              ? error.message
              : 'Failed to send password reset email';
          setInternalError(errorMsg);
        } finally {
          setIsSubmitting(false);
        }
      },
      [email, validateEmail]
    );

    const handleClose = useCallback(
      (
        event: React.SyntheticEvent | Event,
        reason: 'backdropClick' | 'escapeKeyDown'
      ) => {
        if (!isSubmitting && !isLoading) {
          onClose();
        }
      },
      [isSubmitting, isLoading, onClose]
    );

    const handleCancelClick = useCallback(() => {
      if (!isSubmitting && !isLoading) {
        onClose();
      }
    }, [isSubmitting, isLoading, onClose]);

    const displayError = errorMessage || internalError;
    const displaySuccess = successMessage || internalSuccess;
    const showLoading = isLoading || isSubmitting;

    return (
      <Dialog
        ref={ref}
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        aria-labelledby="reset-password-dialog-title"
        aria-describedby={displayError ? 'reset-password-error-message' : undefined}
        {...dialogProps}
      >
        <DialogTitle id="reset-password-dialog-title">
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            Reset Password
            <IconButton
              aria-label="Close reset password dialog"
              onClick={handleCancelClick}
              disabled={showLoading}
              size="small"
              sx={{ marginRight: -1 }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <form onSubmit={handleSubmit} noValidate>
          <DialogContent>
            {displayError && (
              <Alert
                id="reset-password-error-message"
                severity="error"
                sx={{ mb: 2 }}
                onClose={() => setInternalError(null)}
              >
                {displayError}
              </Alert>
            )}

            {displaySuccess && (
              <Alert
                severity="success"
                sx={{ mb: 2 }}
                onClose={() => setInternalSuccess(null)}
              >
                {displaySuccess}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Enter your email address and we will send you instructions to
                reset your password.
              </Typography>

              <TextField
                id="reset-password-email"
                name="email"
                type="email"
                label="Email Address"
                value={email}
                onChange={handleEmailChange}
                error={!!emailError}
                helperText={emailError}
                disabled={showLoading}
                autoFocus
                autoComplete="email"
                aria-label="Email address"
                aria-required="true"
                aria-invalid={!!emailError}
                aria-describedby={
                  emailError ? 'reset-password-email-error' : undefined
                }
                FormHelperTextProps={{
                  id: emailError ? 'reset-password-email-error' : undefined,
                }}
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button
              onClick={handleCancelClick}
              disabled={showLoading}
              color="inherit"
              aria-label="Cancel reset password"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={showLoading}
              aria-label="Submit reset password request"
              aria-busy={showLoading}
              startIcon={showLoading ? <CircularProgress size={20} /> : null}
            >
              {showLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }
);

ResetPasswordModalImpl.displayName = 'ResetPasswordModalImpl';
