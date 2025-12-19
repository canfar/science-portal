'use client';

import React from 'react';
import { ErrorBoundary } from '@/app/components/ErrorBoundary/ErrorBoundary';

export function ClientErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary
      showReset={true}
      onError={(error: Error, errorInfo: React.ErrorInfo) => {
        // Log errors to console in development
        if (process.env.NODE_ENV === 'development') {
          console.error('App Error:', error, errorInfo);
        }
        // In production, you would send this to an error tracking service
        // Example: logToErrorReportingService(error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
