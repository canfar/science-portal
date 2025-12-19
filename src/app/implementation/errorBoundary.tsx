'use client';

import React, { Component } from 'react';
import {
  ErrorBoundaryProps,
  ErrorBoundaryState,
  ErrorInfo,
  ErrorFallbackProps,
} from '@/app/types/ErrorBoundaryProps';
import { Box } from '@/app/components/Box/Box';
import { Typography } from '@/app/components/Typography/Typography';
import { Button } from '@/app/components/Button/Button';
import { Alert, AlertTitle, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

// Default error fallback component
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  showReset = true,
  resetButtonText = 'Try Again',
}) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: 8,
        backgroundColor: 'background.default',
      }}
    >
      <Paper
        elevation={4}
        sx={{
          padding: 6,
          maxWidth: 600,
          width: '100%',
          textAlign: 'center',
          borderRadius: 3,
        }}
      >
        <Box
          sx={{
            fontSize: 80,
            color: 'error.light',
            marginBottom: 4,
            animation: 'errorPulse 2s ease-in-out infinite',
            '@keyframes errorPulse': {
              '0%': {
                transform: 'scale(1)',
                opacity: 1,
              },
              '50%': {
                transform: 'scale(1.05)',
                opacity: 0.8,
              },
              '100%': {
                transform: 'scale(1)',
                opacity: 1,
              },
            },
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 'inherit' }} />
        </Box>

        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            marginBottom: 2,
          }}
        >
          Oops! Something went wrong
        </Typography>

        <Typography
          variant="body1"
          color="secondary"
          paragraph
          sx={{
            fontSize: '1.125rem',
            lineHeight: 1.6,
            marginBottom: 4,
          }}
        >
          We&apos;re sorry, but something unexpected happened. Our team has been
          notified and is working on fixing the issue.
        </Typography>

        {showReset && (
          <Button
            variant="primary"
            color="primary"
            onClick={resetError}
            startIcon={<RefreshIcon />}
            sx={{
              marginTop: 2,
              minWidth: 160,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {resetButtonText}
          </Button>
        )}

        {isDevelopment && (
          <Box sx={{ marginTop: 6, textAlign: 'left' }}>
            <Alert
              severity="error"
              sx={{
                marginBottom: 2,
                backgroundColor: 'error.50',
                border: '1px solid',
                borderColor: 'error.200',
                '& .MuiAlert-icon': {
                  color: 'error.main',
                },
              }}
            >
              <AlertTitle sx={{ fontWeight: 600 }}>
                Error Details (Development Only)
              </AlertTitle>
              <Typography
                variant="body2"
                component="pre"
                sx={{
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                }}
              >
                {error.toString()}
              </Typography>
            </Alert>

            {errorInfo && (
              <Alert
                severity="info"
                sx={{
                  backgroundColor: 'info.50',
                  border: '1px solid',
                  borderColor: 'info.200',
                  '& .MuiAlert-icon': {
                    color: 'info.main',
                  },
                }}
              >
                <AlertTitle sx={{ fontWeight: 600 }}>
                  Component Stack
                </AlertTitle>
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: '0.75rem',
                    lineHeight: 1.4,
                    maxHeight: 200,
                    overflow: 'auto',
                  }}
                >
                  {errorInfo.componentStack}
                </Typography>
              </Alert>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export class ErrorBoundaryImplementation extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to log to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
      console.error('Production error:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const {
      children,
      fallback,
      showReset = true,
      resetButtonText,
      className,
    } = this.props;

    if (hasError && error && errorInfo) {
      // Use custom fallback if provided, otherwise use default
      if (fallback) {
        return <>{fallback}</>;
      }

      return (
        <div className={className}>
          <ErrorFallback
            error={error}
            errorInfo={errorInfo}
            resetError={this.resetError}
            showReset={showReset}
            resetButtonText={resetButtonText}
          />
        </div>
      );
    }

    return <>{children}</>;
  }
}
