/**
 * Login API Route
 *
 * POST /api/auth/login
 * Authenticates user with username and password
 */

import { NextRequest } from 'next/server';
import {
  withErrorHandling,
  errorResponse,
  successResponse,
  fetchExternalApi,
  forwardCookies,
  copyCookies,
  validateMethod,
  methodNotAllowed,
} from '@/app/api/lib/api-utils';
import { serverApiConfig } from '@/app/api/lib/server-config';
import { createLogger } from '@/app/api/lib/logger';
import { HTTP_STATUS } from '@/app/api/lib/http-constants';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  username: string;
  email?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  institute?: string;
  internalID?: string;
  numericID?: string;
  uid?: number;
  gid?: number;
  homeDirectory?: string;
  identities?: Array<{
    type: string;
    value: string | number;
  }>;
  groups?: string[];
}

export interface LoginResponse {
  user: User;
  token: string;
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const logger = createLogger('/api/auth/login', 'POST');

  if (!validateMethod(request, ['POST'])) {
    logger.logError(HTTP_STATUS.METHOD_NOT_ALLOWED, 'Method not allowed');
    return methodNotAllowed(['POST']);
  }

  const cookies = forwardCookies(request);
  let body: LoginCredentials;

  try {
    body = await request.json();
    logger.logRequest(request, body);
  } catch (error) {
    logger.logError(HTTP_STATUS.BAD_REQUEST, 'Invalid JSON in request body', error);
    return errorResponse('Invalid JSON in request body', HTTP_STATUS.BAD_REQUEST);
  }

  // Validate required fields
  if (!body.username || !body.password) {
    logger.logError(HTTP_STATUS.BAD_REQUEST, 'Username and password are required');
    return errorResponse('Username and password are required', HTTP_STATUS.BAD_REQUEST);
  }

  // CADC login API expects form-urlencoded data, not JSON
  const formData = new URLSearchParams();
  formData.append('username', body.username);
  formData.append('password', body.password);

  const externalUrl = `${serverApiConfig.login.baseUrl}/login`;
  logger.logExternalCall(externalUrl, 'POST', {
    ...cookies,
    'Content-Type': 'application/x-www-form-urlencoded'
  });
  logger.info('Sending form-urlencoded credentials', {
    username: body.username,
    password: '***REDACTED***'
  });

  const response = await fetchExternalApi(
    externalUrl,
    {
      method: 'POST',
      headers: {
        ...cookies,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    },
    serverApiConfig.login.timeout
  );

  if (!response.ok) {
    const statusCode = response.status;
    let errorMessage = 'Login failed';
    let errorData;

    try {
      const responseText = await response.text();
      logger.info('Error response body', { body: responseText });
      try {
        errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Not JSON, use text as error
        errorMessage = responseText || errorMessage;
      }
      logger.logExternalResponse(statusCode, response.statusText, errorData);
    } catch {
      logger.logExternalResponse(statusCode, response.statusText);
      // If error response is not JSON, use default message
      if (statusCode === HTTP_STATUS.UNAUTHORIZED) {
        errorMessage = 'Invalid username or password';
      } else if (statusCode === HTTP_STATUS.FORBIDDEN) {
        errorMessage = 'Access forbidden';
      }
    }

    logger.logError(statusCode, errorMessage, errorData);
    return errorResponse(errorMessage, statusCode);
  }

  // CADC login may return non-JSON response (just sets cookie)
  // Check content-type to determine how to parse
  const contentType = response.headers.get('content-type') || '';
  logger.info('Response content-type', { contentType });

  let data: User | null = null;
  const responseText = await response.text();
  logger.info('Response body', { body: responseText.substring(0, 200) });

  if (contentType.includes('application/json') && responseText) {
    try {
      data = JSON.parse(responseText);
      logger.logExternalResponse(response.status, response.statusText, data);
    } catch (e) {
      logger.warn('Failed to parse response as JSON', e);
    }
  }

  // If no user data in response, parse token to extract user info
  if (!data && responseText) {
    logger.info('No JSON user data in response, parsing token for user info');

    try {
      // Decode base64 token
      const decodedToken = Buffer.from(responseText, 'base64').toString('utf-8');
      logger.info('Decoded token', { preview: decodedToken.substring(0, 100) });

      // Parse token parameters (format: key1=value1&key2=value2&...)
      const params = new URLSearchParams(decodedToken);
      const userId = params.get('userID') || body.username;

      data = {
        username: userId,
        displayName: userId,
      };

      logger.info('Extracted user from token', { username: userId });
    } catch (error) {
      logger.warn('Failed to parse token, using credentials username', error);
      data = {
        username: body.username,
        displayName: body.username,
      };
    }
  }

  // Extract token from response body (CADC returns base64-encoded token in body)
  let token = '';

  if (responseText && responseText.length > 0) {
    // The response body IS the token (base64-encoded)
    token = responseText.trim();
    logger.info('Token extracted from response body', {
      tokenLength: token.length,
      tokenPreview: token.substring(0, 20) + '...'
    });
  }

  // Also check Set-Cookie header as fallback
  const setCookieHeaders = response.headers.get('set-cookie');
  if (setCookieHeaders && !token) {
    logger.info('Checking Set-Cookie header as fallback', {
      cookies: setCookieHeaders.substring(0, 50) + '...'
    });

    const cookieMatch = setCookieHeaders.match(/CADC_SSO=([^;]+)/);
    if (cookieMatch) {
      token = cookieMatch[1];
      logger.info('Token extracted from Set-Cookie header', {
        tokenPreview: token.substring(0, 20) + '...'
      });
    }
  }

  if (!token) {
    logger.logError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to extract authentication token from response');
    return errorResponse('Failed to extract authentication token', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  // Ensure we have user data
  if (!data) {
    data = {
      username: body.username,
      displayName: body.username,
    };
  }

  // Return user data and token to client (token will be stored client-side)
  const loginResponse: LoginResponse = {
    user: data,
    token: token,
  };

  logger.logSuccess(HTTP_STATUS.OK, { user: data, tokenLength: token.length });
  return successResponse(loginResponse);
});
