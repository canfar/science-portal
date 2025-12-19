/**
 * Permissions Check API Route
 *
 * GET /api/auth/permissions?username=X&resource=Y&permission=Z
 * Checks if a user has a specific permission on a resource
 */

import { NextRequest } from 'next/server';
import {
  withErrorHandling,
  errorResponse,
  successResponse,
  fetchExternalApi,
  forwardCookies,
  validateMethod,
  methodNotAllowed,
} from '@/app/api/lib/api-utils';
import { serverApiConfig } from '@/app/api/lib/server-config';
import { HTTP_STATUS } from '@/app/api/lib/http-constants';

export interface PermissionCheck {
  granted: boolean;
  username: string;
  resource: string;
  permission: string;
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  if (!validateMethod(request, ['GET'])) {
    return methodNotAllowed(['GET']);
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  const resource = searchParams.get('resource');
  const permission = searchParams.get('permission');

  // Validate required query parameters
  if (!username) {
    return errorResponse('Username query parameter is required', HTTP_STATUS.BAD_REQUEST);
  }

  if (!resource) {
    return errorResponse('Resource query parameter is required', HTTP_STATUS.BAD_REQUEST);
  }

  if (!permission) {
    return errorResponse('Permission query parameter is required', HTTP_STATUS.BAD_REQUEST);
  }

  // Validate permission value
  if (!['read', 'write', 'execute'].includes(permission)) {
    return errorResponse(
      'Permission must be one of: read, write, execute',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const cookies = forwardCookies(request);

  const response = await fetchExternalApi(
    `${serverApiConfig.login.baseUrl}/permissions/${encodeURIComponent(username)}?resource=${encodeURIComponent(resource)}&permission=${permission}`,
    {
      method: 'GET',
      headers: {
        ...cookies,
        'Accept': 'application/json',
      },
    },
    serverApiConfig.login.timeout
  );

  // Handle permission check failures gracefully
  if (!response.ok) {
    const statusCode = response.status;

    // For permission checks, a 403 or 404 might mean permission denied
    if (statusCode === HTTP_STATUS.FORBIDDEN || statusCode === HTTP_STATUS.NOT_FOUND) {
      return successResponse<PermissionCheck>({
        granted: false,
        username,
        resource,
        permission,
      });
    }

    // For other errors, return error response
    let errorMessage = 'Failed to check permissions';

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If error response is not JSON, use default message
      if (statusCode === HTTP_STATUS.UNAUTHORIZED) {
        errorMessage = 'Authentication required';
      }
    }

    return errorResponse(errorMessage, statusCode);
  }

  const result = await response.json();

  // Ensure the response includes the granted field
  const permissionCheck: PermissionCheck = {
    granted: result.granted === true,
    username,
    resource,
    permission,
  };

  return successResponse(permissionCheck);
});
