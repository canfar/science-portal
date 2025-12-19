/**
 * Storage Files API Route
 *
 * GET /api/storage/files/[username]?path= - List files and directories
 * POST /api/storage/files/[username]?path= - Upload a file
 * DELETE /api/storage/files/[username]?path= - Delete a file or directory
 * PUT /api/storage/files/[username]?path= - Create a directory
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withErrorHandling,
  errorResponse,
  successResponse,
  fetchExternalApi,
  forwardAuthHeader,
  methodNotAllowed,
  validateMethod,
} from '@/app/api/lib/api-utils';
import { serverApiConfig } from '@/app/api/lib/server-config';
import { HTTP_STATUS } from '@/app/api/lib/http-constants';

export interface StorageNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  lastModified: string;
}

/**
 * GET - List files and directories in a path
 */
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { username: string } }
) => {
  const username = params.username;
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get('path') || '';

  if (!username) {
    return errorResponse('Username is required', HTTP_STATUS.BAD_REQUEST);
  }

  const authHeaders = await forwardAuthHeader(request);
  const storageUrl = serverApiConfig.storage.baseUrl;
  const endpoint = path
    ? `${storageUrl}/users/${username}/files/${path}`
    : `${storageUrl}/users/${username}/files`;

  const response = await fetchExternalApi(
    endpoint,
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
      'Failed to list storage nodes',
      response.status
    );
  }

  const data: StorageNode[] = await response.json();
  return successResponse(data);

});

/**
 * POST - Upload a file
 */
export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { username: string } }
) => {
  const username = params.username;
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get('path') || '';

  if (!username) {
    return errorResponse('Username is required', HTTP_STATUS.BAD_REQUEST);
  }

  if (!path) {
    return errorResponse('Path is required for file upload', HTTP_STATUS.BAD_REQUEST);
  }

  const formData = await request.formData();
  const authHeaders = await forwardAuthHeader(request);
  const storageUrl = serverApiConfig.storage.baseUrl;

  const response = await fetchExternalApi(
    `${storageUrl}/users/${username}/files/${path}`,
    {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    },
    serverApiConfig.storage.timeout
  );

  if (!response.ok) {
    return errorResponse('Upload failed', response.status);
  }

  return successResponse({ success: true });

});

/**
 * DELETE - Delete a file or directory
 */
export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { username: string } }
) => {
  const username = params.username;
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get('path') || '';

  if (!username) {
    return errorResponse('Username is required', HTTP_STATUS.BAD_REQUEST);
  }

  if (!path) {
    return errorResponse('Path is required for deletion', HTTP_STATUS.BAD_REQUEST);
  }

  const authHeaders = await forwardAuthHeader(request);
  const storageUrl = serverApiConfig.storage.baseUrl;

  const response = await fetchExternalApi(
    `${storageUrl}/users/${username}/files/${path}`,
    {
      method: 'DELETE',
      headers: authHeaders,
    },
    serverApiConfig.storage.timeout
  );

  if (!response.ok) {
    return errorResponse('Deletion failed', response.status);
  }

  return successResponse({ success: true });

});

/**
 * PUT - Create a directory
 */
export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: { username: string } }
) => {
  const username = params.username;
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get('path') || '';

  if (!username) {
    return errorResponse('Username is required', HTTP_STATUS.BAD_REQUEST);
  }

  if (!path) {
    return errorResponse('Path is required for directory creation', HTTP_STATUS.BAD_REQUEST);
  }

  const authHeaders = await forwardAuthHeader(request);
  const storageUrl = serverApiConfig.storage.baseUrl;

  const response = await fetchExternalApi(
    `${storageUrl}/users/${username}/files/${path}`,
    {
      method: 'PUT',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'directory' }),
    },
    serverApiConfig.storage.timeout
  );

  if (!response.ok) {
    return errorResponse('Directory creation failed', response.status);
  }

  return successResponse({ success: true });

});
