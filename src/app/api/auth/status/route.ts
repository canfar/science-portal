// Updated: 1760993000
/**
 * Auth Status API Route
 *
 * GET /api/auth/status
 * Returns current authentication status and user information (whoami)
 *
 * OIDC Mode: Decodes JWT token from Authorization header
 * CANFAR Mode: Calls /ac/whoami
 */

import { NextRequest } from 'next/server';
import {
  withErrorHandling,
  errorResponse,
  successResponse,
  fetchExternalApi,
  forwardAuthHeader,
  validateMethod,
  methodNotAllowed,
} from '@/app/api/lib/api-utils';
import { serverApiConfig } from '@/app/api/lib/server-config';
import { createLogger } from '@/app/api/lib/logger';
import { HTTP_STATUS } from '@/app/api/lib/http-constants';

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

export interface AuthStatus {
  authenticated: boolean;
  user?: User;
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = createLogger('/api/auth/status', 'GET');

  if (!validateMethod(request, ['GET'])) {
    logger.logError(HTTP_STATUS.METHOD_NOT_ALLOWED, 'Method not allowed');
    return methodNotAllowed(['GET']);
  }

  logger.logRequest(request);

  // Check if using OIDC mode
  const isOIDC = process.env.NEXT_USE_CANFAR !== 'true';
  if (isOIDC) {
    // In OIDC mode, decode the JWT token to get user info
    // instead of calling external whoami endpoint

    // First, try to get token from Authorization header (for client requests)
    let token = request.headers.get('authorization')?.replace('Bearer ', '');

    // If no header, get token from NextAuth session (for server-side requests)
    if (!token) {
      logger.info('No Authorization header, checking NextAuth session');
      const { auth } = await import('@/auth');
      const session = await auth();

      if (session?.accessToken) {
        token = session.accessToken;
        logger.info('Using token from NextAuth session');
      }
    }

    if (!token) {
      logger.info('No token found - user not authenticated');
      return successResponse<AuthStatus>({ authenticated: false });
    }

    try {
      // Decode JWT to extract user info (without verification - the SRC API will verify it)
      const parts = token.split('.');
      if (parts.length !== 3) {
        logger.logError(HTTP_STATUS.BAD_REQUEST, 'Invalid JWT token format');
        return successResponse<AuthStatus>({ authenticated: false });
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

      // Extract user info from JWT claims
      const user: User = {
        username: payload.preferred_username || payload.sub || 'user',
        email: payload.email || undefined,
        displayName: payload.name || payload.preferred_username || undefined,
        firstName: payload.given_name || undefined,
        lastName: payload.family_name || undefined,
      };

      logger.info('OIDC user authenticated from JWT token', { username: user.username });

      const result: AuthStatus = {
        authenticated: true,
        user,
      };

      logger.logSuccess(HTTP_STATUS.OK, result);
      return successResponse<AuthStatus>(result);
    } catch (error) {
      logger.logError(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Failed to decode JWT token', error);
      return successResponse<AuthStatus>({ authenticated: false });
    }
  }

  // CANFAR mode: Forward Authorization header to CANFAR whoami
  const authHeaders = await forwardAuthHeader(request);
  const externalUrl = `${serverApiConfig.login.baseUrl}/whoami`;

  logger.logExternalCall(externalUrl, 'GET', { ...authHeaders, 'Accept': 'application/json' });

  const response = await fetchExternalApi(
    externalUrl,
    {
      method: 'GET',
      headers: {
        ...authHeaders,
        'Accept': 'application/json',
      },
    },
    serverApiConfig.login.timeout
  );

  logger.logExternalResponse(response.status, response.statusText);

  // If not authenticated, return unauthenticated status instead of error
  if (!response.ok) {
    if (response.status === HTTP_STATUS.UNAUTHORIZED || response.status === HTTP_STATUS.FORBIDDEN) {
      logger.info('User not authenticated', { status: response.status });
      const result: AuthStatus = { authenticated: false };
      logger.logSuccess(HTTP_STATUS.OK, result);
      return successResponse<AuthStatus>(result);
    }

    // For other errors, return error response
    const statusCode = response.status;
    let errorMessage = 'Failed to get authentication status';

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      logger.logExternalResponse(statusCode, response.statusText, errorData);
    } catch {
      // If error response is not JSON, use default message
    }

    logger.logError(statusCode, errorMessage);
    return errorResponse(errorMessage, statusCode);
  }

  const cadcResponse: any = await response.json();
  logger.logExternalResponse(response.status, response.statusText, cadcResponse);

  // Parse CADC's complex XML-based JSON structure
  const cadcUser = cadcResponse.user || cadcResponse;

  // Extract username from posixDetails or identities
  const username = cadcUser.posixDetails?.username?.$ ||
                   cadcUser.identities?.$?.find((i: any) => i.identity?.['@type'] === 'HTTP')?.identity?.$ ||
                   '';

  // Extract personal details
  const firstName = cadcUser.personalDetails?.firstName?.$ || '';
  const lastName = cadcUser.personalDetails?.lastName?.$ || '';
  const email = cadcUser.personalDetails?.email?.$ || '';
  const institute = cadcUser.personalDetails?.institute?.$ || '';

  // Extract internal IDs
  const internalID = cadcUser.internalID?.uri?.$ || '';

  // Extract numeric ID from identities
  const numericIdentity = cadcUser.identities?.$?.find((i: any) => i.identity?.['@type'] === 'CADC');
  const numericID = numericIdentity?.identity?.$ || '';

  // Extract POSIX details
  const uid = cadcUser.posixDetails?.uid?.$ || 0;
  const gid = cadcUser.posixDetails?.gid?.$ || 0;
  const homeDirectory = cadcUser.posixDetails?.homeDirectory?.$ || '';

  // Parse all identities
  const identities = cadcUser.identities?.$?.map((item: any) => ({
    type: item.identity?.['@type'] || '',
    value: item.identity?.$ || '',
  })) || [];

  // Create complete user object with all CADC data
  const user: User = {
    username,
    email,
    displayName: firstName && lastName ? `${firstName} ${lastName}` : username,
    firstName,
    lastName,
    institute,
    internalID,
    numericID,
    uid: typeof uid === 'number' ? uid : parseInt(uid, 10),
    gid: typeof gid === 'number' ? gid : parseInt(gid, 10),
    homeDirectory,
    identities,
  };

  logger.info('User authenticated', { username: user.username, uid: user.uid });

  const result: AuthStatus = {
    authenticated: true,
    user,
  };

  logger.logSuccess(HTTP_STATUS.OK, result);
  return successResponse<AuthStatus>(result);
});
