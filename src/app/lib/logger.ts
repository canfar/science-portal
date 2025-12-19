/**
 * Structured logging utility for production
 *
 * Provides consistent JSON logging format for:
 * - Application logs
 * - Error tracking
 * - Performance metrics
 * - Audit trails
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  error?: Error | unknown;
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
      // Add error details if present
      ...(context?.error ? {
        error: {
          message: context.error instanceof Error ? context.error.message : String(context.error),
          stack: context.error instanceof Error ? context.error.stack : undefined,
          name: context.error instanceof Error ? context.error.name : 'Error',
        },
      } : {}),
      // Environment info
      env: process.env.NODE_ENV,
      // Service name
      service: 'science-portal',
    };

    // In development, use pretty printing
    if (this.isDevelopment) {
      return `[${level.toUpperCase()}] ${message} ${
        context ? JSON.stringify(context, null, 2) : ''
      }`;
    }

    // In production, use JSON for easy parsing by log aggregators
    return JSON.stringify(logEntry);
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.info(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, context?: LogContext): void {
    console.error(this.formatMessage('error', message, context));
  }

  // HTTP request logging
  httpRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    this.info('HTTP Request', {
      method,
      path,
      statusCode,
      duration,
      ...context,
    });
  }

  // Authentication logging (for audit trail)
  authEvent(
    event: 'login' | 'logout' | 'token_refresh' | 'auth_failure',
    userId?: string,
    context?: LogContext
  ): void {
    this.info(`Auth: ${event}`, {
      event,
      userId,
      ...context,
    });
  }

  // Performance monitoring
  performance(operation: string, duration: number, context?: LogContext): void {
    const level = duration > 1000 ? 'warn' : 'info';
    this[level](`Performance: ${operation}`, {
      operation,
      duration,
      ...context,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types
export type { LogLevel, LogContext };
