/**
 * Reset Password API Route
 *
 * POST /api/auth/reset-password
 * Sends a password reset email to the user
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withErrorHandling,
  errorResponse,
  fetchExternalApi,
  validateMethod,
  methodNotAllowed,
} from '@/app/api/lib/api-utils';
import { serverApiConfig } from '@/app/api/lib/server-config';
import { createLogger } from '@/app/api/lib/logger';
import { HTTP_STATUS } from '@/app/api/lib/http-constants';

export interface ResetPasswordRequest {
  emailAddress: string;
  loginURI?: string;
  role?: string;
  pageLanguage?: string;
  reset_pass?: string;
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const logger = createLogger('/api/auth/reset-password', 'POST');

  if (!validateMethod(request, ['POST'])) {
    logger.logError(HTTP_STATUS.METHOD_NOT_ALLOWED, 'Method not allowed');
    return methodNotAllowed(['POST']);
  }

  let body: ResetPasswordRequest;

  try {
    body = await request.json();
    logger.logRequest(request, { emailAddress: body.emailAddress });
  } catch (error) {
    logger.logError(HTTP_STATUS.BAD_REQUEST, 'Invalid JSON in request body', error);
    return errorResponse('Invalid JSON in request body', HTTP_STATUS.BAD_REQUEST);
  }

  // Validate required fields
  if (!body.emailAddress) {
    logger.logError(HTTP_STATUS.BAD_REQUEST, 'Email address is required');
    return errorResponse('Email address is required', HTTP_STATUS.BAD_REQUEST);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.emailAddress)) {
    logger.logError(HTTP_STATUS.BAD_REQUEST, 'Invalid email format');
    return errorResponse('Invalid email format', HTTP_STATUS.BAD_REQUEST);
  }

  // CADC reset password API expects form-urlencoded data
  // This is a public endpoint - no authentication required
  const formData = new URLSearchParams();
  formData.append('emailAddress', body.emailAddress);
  formData.append('loginURI', body.loginURI || '/en/login.html');
  formData.append('role', body.role || 'cadc');
  formData.append('pageLanguage', body.pageLanguage || 'en');
  formData.append('reset_pass', body.reset_pass || 'Reset your password');

  const externalUrl = serverApiConfig.passwordReset.url;
  logger.logExternalCall(externalUrl, 'POST', {
    'Content-Type': 'application/x-www-form-urlencoded'
  });
  logger.info('Sending password reset request', {
    emailAddress: body.emailAddress,
    loginURI: formData.get('loginURI'),
    role: formData.get('role'),
    pageLanguage: formData.get('pageLanguage')
  });

  try {
    const response = await fetchExternalApi(
      externalUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      },
      serverApiConfig.passwordReset.timeout
    );

    if (!response.ok) {
      const statusCode = response.status;
      let errorMessage = 'Failed to send password reset email';

      try {
        const responseText = await response.text();
        logger.info('Error response body', { body: responseText });

        // Try to parse as JSON
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
          logger.logExternalResponse(statusCode, response.statusText, errorData);
        } catch {
          // Not JSON, use text as error
          errorMessage = responseText || errorMessage;
          logger.logExternalResponse(statusCode, response.statusText, { text: responseText });
        }
      } catch {
        logger.logExternalResponse(statusCode, response.statusText);

        if (statusCode === HTTP_STATUS.NOT_FOUND) {
          errorMessage = 'Email address not found';
        } else if (statusCode === HTTP_STATUS.BAD_REQUEST) {
          errorMessage = 'Invalid email address';
        }
      }

      logger.logError(statusCode, errorMessage);
      return errorResponse(errorMessage, statusCode);
    }

    // Success response
    logger.logSuccess(HTTP_STATUS.OK);
    return NextResponse.json(
      {
        success: true,
        message: 'Password reset instructions have been sent to your email address.',
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    logger.logError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to send password reset email',
      error
    );
    return errorResponse(
      'Failed to send password reset email. Please try again later.',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
});
