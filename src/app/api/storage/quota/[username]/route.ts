/**
 * Storage Quota API Route
 *
 * GET /api/storage/quota/[username] - Get user storage quota information
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withErrorHandling,
  errorResponse,
  successResponse,
  fetchExternalApi,
  forwardAuthHeader
} from '@/app/api/lib/api-utils';
import { serverApiConfig } from '@/app/api/lib/server-config';
import { HTTP_STATUS } from '@/app/api/lib/http-constants';

export interface UserStorageQuota {
  name: string;
  quota: number;
  used: number;
  available: number;
  unit: 'bytes' | 'GB';
}

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { username: string } }
) => {
  const username = params.username;

  if (!username) {
    return errorResponse('Username is required', HTTP_STATUS.BAD_REQUEST);
  }

  const authHeaders = await forwardAuthHeader(request);
  const storageUrl = serverApiConfig.storage.baseUrl;

  const response = await fetchExternalApi(
    `${storageUrl}/users/${username}/quota`,
    {
      method: 'GET',
      headers: {
        ...authHeaders,
        'Accept': 'application/json',
      },
    },
    serverApiConfig.storage.timeout
  );

  if (!response.ok) {
    return errorResponse(
      'Failed to fetch storage quota',
      response.status
    );
  }

  const data: UserStorageQuota = await response.json();
  return successResponse(data);

});
