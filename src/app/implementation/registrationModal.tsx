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
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { TextField } from '@/app/components/TextField/TextField';
import {
  RegistrationModalProps,
  RegistrationFormData,
  RegistrationFormErrors,
} from '@/app/types/RegistrationModalProps';

export const RegistrationModalImpl = React.forwardRef<
  HTMLDivElement,
  RegistrationModalProps
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
    const [formData, setFormData] = useState<RegistrationFormData>({
      username: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      email: '',
      institute: '',
    });

    const [formErrors, setFormErrors] = useState<RegistrationFormErrors>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [internalError, setInternalError] = useState<string | null>(null);
    const [internalSuccess, setInternalSuccess] = useState<string | null>(null);

    // Reset form when modal opens
    useEffect(() => {
      if (open) {
        setFormData({
          username: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
          email: '',
          institute: '',
        });
        setFormErrors({});
        setShowPassword(false);
        setShowConfirmPassword(false);
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

    const validateForm = useCallback((): boolean => {
      const errors: RegistrationFormErrors = {};

      // Username validation
      if (!formData.username.trim()) {
        errors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        errors.username = 'Username must be at least 3 characters';
      }

      // Password validation
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }

      // Confirm password validation
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }

      // First name validation
      if (!formData.firstName.trim()) {
        errors.firstName = 'First name is required';
      }

      // Last name validation
      if (!formData.lastName.trim()) {
        errors.lastName = 'Last name is required';
      }

      // Email validation
      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          errors.email = 'Please enter a valid email address';
        }
      }

      // Institute validation
      if (!formData.institute.trim()) {
        errors.institute = 'Institute is required';
      }

      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    }, [formData]);

    const handleInputChange = useCallback(
      (field: keyof RegistrationFormData) =>
        (event: React.ChangeEvent<HTMLInputElement>) => {
          const value = event.target.value;

          setFormData((prev) => ({
            ...prev,
            [field]: value,
          }));

          // Clear error for this field when user starts typing
          if (formErrors[field]) {
            setFormErrors((prev) => ({
              ...prev,
              [field]: undefined,
            }));
          }

          // Clear any error/success messages
          setInternalError(null);
          setInternalSuccess(null);
        },
      [formErrors]
    );

    const handleTogglePasswordVisibility = useCallback(() => {
      setShowPassword((prev) => !prev);
    }, []);

    const handleToggleConfirmPasswordVisibility = useCallback(() => {
      setShowConfirmPassword((prev) => !prev);
    }, []);

    const handleSubmit = useCallback(
      async (event: React.FormEvent) => {
        event.preventDefault();

        if (!validateForm()) {
          return;
        }

        setIsSubmitting(true);
        setInternalError(null);
        setInternalSuccess(null);

        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: formData.username.trim(),
              password: formData.password,
              firstName: formData.firstName.trim(),
              lastName: formData.lastName.trim(),
              email: formData.email.trim(),
              institute: formData.institute.trim(),
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to create account');
          }

          setInternalSuccess(
            data.message ||
              'Account created successfully! You can now log in with your credentials.'
          );

          // Clear the form after successful submission
          setFormData({
            username: '',
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: '',
            email: '',
            institute: '',
          });
        } catch (error) {
          const errorMsg =
            error instanceof Error
              ? error.message
              : 'Failed to create account';
          setInternalError(errorMsg);
        } finally {
          setIsSubmitting(false);
        }
      },
      [formData, validateForm]
    );

    const handleClose = useCallback(() => {
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
        maxWidth="sm"
        fullWidth
        aria-labelledby="registration-dialog-title"
        aria-describedby={displayError ? 'registration-error-message' : undefined}
        {...dialogProps}
      >
        <DialogTitle id="registration-dialog-title">
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            Create CADC Account
            <IconButton
              aria-label="Close registration dialog"
              onClick={handleClose}
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
                id="registration-error-message"
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
                Fill in the form below to create your CADC account.
              </Typography>

              <TextField
                id="registration-username"
                name="username"
                label="Username"
                value={formData.username}
                onChange={handleInputChange('username')}
                error={!!formErrors.username}
                helperText={formErrors.username}
                disabled={showLoading}
                autoFocus
                autoComplete="username"
                required
                aria-label="Username"
                aria-required="true"
                aria-invalid={!!formErrors.username}
              />

              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  id="registration-firstname"
                  name="firstName"
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  error={!!formErrors.firstName}
                  helperText={formErrors.firstName}
                  disabled={showLoading}
                  autoComplete="given-name"
                  required
                  fullWidth
                  aria-label="First name"
                  aria-required="true"
                  aria-invalid={!!formErrors.firstName}
                />
                <TextField
                  id="registration-lastname"
                  name="lastName"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  error={!!formErrors.lastName}
                  helperText={formErrors.lastName}
                  disabled={showLoading}
                  autoComplete="family-name"
                  required
                  fullWidth
                  aria-label="Last name"
                  aria-required="true"
                  aria-invalid={!!formErrors.lastName}
                />
              </Box>

              <TextField
                id="registration-email"
                name="email"
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={!!formErrors.email}
                helperText={formErrors.email}
                disabled={showLoading}
                autoComplete="email"
                required
                aria-label="Email address"
                aria-required="true"
                aria-invalid={!!formErrors.email}
              />

              <TextField
                id="registration-institute"
                name="institute"
                label="Institute"
                value={formData.institute}
                onChange={handleInputChange('institute')}
                error={!!formErrors.institute}
                helperText={formErrors.institute}
                disabled={showLoading}
                autoComplete="organization"
                required
                aria-label="Institute"
                aria-required="true"
                aria-invalid={!!formErrors.institute}
              />

              <TextField
                id="registration-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                value={formData.password}
                onChange={handleInputChange('password')}
                error={!!formErrors.password}
                helperText={formErrors.password}
                disabled={showLoading}
                autoComplete="new-password"
                required
                aria-label="Password"
                aria-required="true"
                aria-invalid={!!formErrors.password}
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

              <TextField
                id="registration-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                label="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                error={!!formErrors.confirmPassword}
                helperText={formErrors.confirmPassword}
                disabled={showLoading}
                autoComplete="new-password"
                required
                aria-label="Confirm password"
                aria-required="true"
                aria-invalid={!!formErrors.confirmPassword}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={handleToggleConfirmPasswordVisibility}
                        edge="end"
                        disabled={showLoading}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button
              onClick={handleClose}
              disabled={showLoading}
              color="inherit"
              aria-label="Cancel registration"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={showLoading}
              aria-label="Create account"
              aria-busy={showLoading}
              startIcon={showLoading ? <CircularProgress size={20} /> : null}
            >
              {showLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }
);

RegistrationModalImpl.displayName = 'RegistrationModalImpl';
