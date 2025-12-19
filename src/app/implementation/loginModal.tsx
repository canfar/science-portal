'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  CircularProgress,
  Alert,
  Box,
  IconButton,
  InputAdornment,
  Link,
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { TextField } from '@/app/components/TextField/TextField';
import { Checkbox } from '@/app/components/Checkbox/Checkbox';
import {
  LoginModalProps,
  LoginFormData,
  LoginFormErrors,
} from '@/app/types/LoginModalProps';

const FORGOT_ACCOUNT_URL =
  'https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/en/auth/resetPassword.html';
const REQUEST_ACCOUNT_URL =
  'https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/en/auth/request.html';

export const LoginModalImpl = React.forwardRef<HTMLDivElement, LoginModalProps>(
  (
    {
      open,
      onClose,
      onLoginSuccess,
      onLoginError,
      onSubmit,
      onForgotPassword,
      onRequestAccount,
      initialUsername = '',
      initialRememberMe = false,
      isLoading = false,
      errorMessage,
      maxWidth = 'xs',
      fullWidth = true,
      title,
      ...dialogProps
    },
    ref
  ) => {
    const [formData, setFormData] = useState<LoginFormData>({
      username: initialUsername,
      password: '',
      rememberMe: initialRememberMe,
    });

    const [formErrors, setFormErrors] = useState<LoginFormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [internalError, setInternalError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
      if (open) {
        setFormData({
          username: initialUsername,
          password: '',
          rememberMe: initialRememberMe,
        });
        setFormErrors({});
        setInternalError(null);
        setShowPassword(false);
      }
    }, [open, initialUsername, initialRememberMe]);

    // Clear internal error when external error changes
    useEffect(() => {
      if (errorMessage) {
        setInternalError(null);
      }
    }, [errorMessage]);

    const validateForm = useCallback((): boolean => {
      const errors: LoginFormErrors = {};

      if (!formData.username.trim()) {
        errors.username = 'Username is required';
      }

      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }

      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    }, [formData]);

    const handleInputChange = useCallback(
      (field: keyof LoginFormData) =>
        (event: React.ChangeEvent<HTMLInputElement>) => {
          const value =
            field === 'rememberMe' ? event.target.checked : event.target.value;

          setFormData((prev) => ({
            ...prev,
            [field]: value,
          }));

          // Clear error for this field when user starts typing
          if (formErrors[field as keyof LoginFormErrors]) {
            setFormErrors((prev) => ({
              ...prev,
              [field]: undefined,
            }));
          }

          // Clear any error messages
          setInternalError(null);
        },
      [formErrors]
    );

    const handleSubmit = useCallback(
      async (event: React.FormEvent) => {
        event.preventDefault();

        if (!validateForm()) {
          return;
        }

        setIsSubmitting(true);
        setInternalError(null);

        try {
          if (onSubmit) {
            await onSubmit({
              username: formData.username.trim(),
              password: formData.password,
              rememberMe: formData.rememberMe,
            });
          }

          // If no error was thrown, consider it a success
          if (onLoginSuccess) {
            onLoginSuccess(formData.username.trim());
          }
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : 'Login failed';
          setInternalError(errorMsg);
          if (onLoginError) {
            onLoginError(errorMsg);
          }
        } finally {
          setIsSubmitting(false);
        }
      },
      [formData, validateForm, onSubmit, onLoginSuccess, onLoginError]
    );

    const handleClose = useCallback(
      (
        event: React.SyntheticEvent | Event,
        reason: 'backdropClick' | 'escapeKeyDown'
      ) => {
        if (!isSubmitting && !isLoading && onClose) {
          onClose(event, reason);
        }
      },
      [isSubmitting, isLoading, onClose]
    );

    const handleCancelClick = useCallback(() => {
      if (!isSubmitting && !isLoading && onClose) {
        // Create a synthetic event for consistency
        const syntheticEvent = new Event('click');
        onClose(syntheticEvent, 'escapeKeyDown');
      }
    }, [isSubmitting, isLoading, onClose]);

    const displayError = errorMessage || internalError;
    const showLoading = isLoading || isSubmitting;

    const handleTogglePasswordVisibility = useCallback(() => {
      setShowPassword((prev) => !prev);
    }, []);

    return (
      <Dialog
        ref={ref}
        open={open}
        onClose={handleClose}
        maxWidth={maxWidth}
        fullWidth={fullWidth}
        aria-labelledby="login-dialog-title"
        aria-describedby={displayError ? 'login-error-message' : undefined}
        {...dialogProps}
      >
        <DialogTitle id="login-dialog-title">
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            {title || 'Login'}
            <IconButton
              aria-label="Close login dialog"
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
                id="login-error-message"
                severity="error"
                sx={{ mb: 2 }}
                onClose={() => setInternalError(null)}
              >
                {displayError}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                id="login-username"
                name="username"
                label="Username"
                value={formData.username}
                onChange={handleInputChange('username')}
                error={!!formErrors.username}
                helperText={formErrors.username}
                disabled={showLoading}
                autoFocus
                autoComplete="username"
                aria-label="Username"
                aria-required="true"
                aria-invalid={!!formErrors.username}
                aria-describedby={
                  formErrors.username ? 'login-username-error' : undefined
                }
                FormHelperTextProps={{
                  id: formErrors.username ? 'login-username-error' : undefined,
                }}
              />

              <TextField
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                value={formData.password}
                onChange={handleInputChange('password')}
                error={!!formErrors.password}
                helperText={formErrors.password}
                disabled={showLoading}
                autoComplete="current-password"
                aria-label="Password"
                aria-required="true"
                aria-invalid={!!formErrors.password}
                aria-describedby={
                  formErrors.password ? 'login-password-error' : undefined
                }
                FormHelperTextProps={{
                  id: formErrors.password ? 'login-password-error' : undefined,
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                        disabled={showLoading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    id="login-remember-me"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange('rememberMe')}
                    disabled={showLoading}
                    aria-label="Remember me"
                  />
                }
                label="Remember me"
              />

              <Box
                sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}
              >
                {onForgotPassword ? (
                  <Link
                    component="button"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onForgotPassword();
                    }}
                    underline="hover"
                    disabled={showLoading}
                    sx={(theme) => ({
                      fontSize: '0.875rem',
                      fontFamily: theme.typography.fontFamily,
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: 'none',
                      background: 'none',
                      padding: 0,
                    })}
                  >
                    Forgot your Account information?
                  </Link>
                ) : (
                  <Link
                    href={FORGOT_ACCOUNT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    sx={(theme) => ({
                      fontSize: '0.875rem',
                      fontFamily: theme.typography.fontFamily,
                    })}
                  >
                    Forgot your Account information?
                  </Link>
                )}
                {onRequestAccount ? (
                  <Link
                    component="button"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onRequestAccount();
                    }}
                    underline="hover"
                    disabled={showLoading}
                    sx={(theme) => ({
                      fontSize: '0.875rem',
                      fontFamily: theme.typography.fontFamily,
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: 'none',
                      background: 'none',
                      padding: 0,
                    })}
                  >
                    Request a CADC Account
                  </Link>
                ) : (
                  <Link
                    href={REQUEST_ACCOUNT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    sx={(theme) => ({
                      fontSize: '0.875rem',
                      fontFamily: theme.typography.fontFamily,
                    })}
                  >
                    Request a CADC Account
                  </Link>
                )}
              </Box>
            </Box>
          </DialogContent>

          <DialogActions>
            <Button
              onClick={handleCancelClick}
              disabled={showLoading}
              color="inherit"
              aria-label="Cancel login"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={showLoading}
              aria-label="Submit login"
              aria-busy={showLoading}
              startIcon={showLoading ? <CircularProgress size={20} /> : null}
            >
              {showLoading ? 'Logging in...' : 'Login'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }
);

LoginModalImpl.displayName = 'LoginModalImpl';
