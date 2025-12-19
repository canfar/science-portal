/**
 * Logout API Route
 *
 * POST /api/auth/logout
 * Logs out the current user by clearing authentication cookies
 *
 * This is a client-side logout that clears the CADC_SSO cookie.
 * No external API call is made - we simply expire the auth cookies.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withErrorHandling,
  successResponse,
  validateMethod,
  methodNotAllowed,
} from '@/app/api/lib/api-utils';
import { createLogger } from '@/app/api/lib/logger';
import { HTTP_STATUS } from '@/app/api/lib/http-constants';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const logger = createLogger('/api/auth/logout', 'POST');
  logger.logRequest(request);

  if (!validateMethod(request, ['POST'])) {
    logger.logError(HTTP_STATUS.METHOD_NOT_ALLOWED, 'Method not allowed');
    return methodNotAllowed(['POST']);
  }

  logger.info('Clearing authentication cookies');

  // Create response with success message
  const response = successResponse({
    success: true,
    message: 'Logged out successfully'
  });

  // Clear the CADC_SSO cookie by setting it with expired date
  // This works for any cookie that might have been set during login
  const cookiesToClear = ['CADC_SSO', 'JSESSIONID'];

  cookiesToClear.forEach(cookieName => {
    response.cookies.set(cookieName, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(0), // Expire immediately
    });
    logger.info(`Cleared cookie: ${cookieName}`);
  });

  logger.logSuccess(HTTP_STATUS.OK, { success: true, message: 'Logged out successfully' });
  return response;
});
