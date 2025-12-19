import { ReactNode } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  /**
   * Custom fallback component to display when an error occurs
   */
  fallback?: ReactNode;
  /**
   * Callback function called when an error is caught
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /**
   * Whether to show the reset button in the default fallback UI
   */
  showReset?: boolean;
  /**
   * Custom reset button text
   */
  resetButtonText?: string;
  /**
   * Additional CSS classes for the error boundary container
   */
  className?: string;
}

export interface ErrorInfo {
  componentStack: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  resetError: () => void;
  showReset?: boolean;
  resetButtonText?: string;
}
