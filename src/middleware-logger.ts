/**
 * Middleware logger for request/response logging
 *
 * This should be imported in middleware.ts to log all HTTP requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './app/lib/logger';

export function logRequest(request: NextRequest, response: NextResponse): void {
  const { pathname, searchParams } = request.nextUrl;
  const method = request.method;
  const statusCode = response.status;

  logger.httpRequest(method, pathname, statusCode, 0, {
    query: Object.fromEntries(searchParams.entries()),
    userAgent: request.headers.get('user-agent') || 'unknown',
  });
}

export function createRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
