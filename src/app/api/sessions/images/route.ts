/**
 * Container Images API Route
 *
 * Handles retrieving available container images.
 * GET - Get available container images grouped by type and project
 */

import { NextRequest } from 'next/server';
import {
  withErrorHandling,
  validateMethod,
  methodNotAllowed,
  errorResponse,
  successResponse,
  fetchExternalApi,
  forwardAuthHeader
} from '@/app/api/lib/api-utils';
import { serverApiConfig } from '@/app/api/lib/server-config';
import { groupImagesByTypeAndProject, type RawImage } from '@/lib/utils/image-parser';

/**
 * GET /api/sessions/images
 * Get available container images grouped by type and project
 *
 * Returns images in the format:
 * {
 *   [sessionType]: {
 *     [projectName]: [
 *       {
 *         id: string,
 *         registry: string,
 *         project: string,
 *         name: string,
 *         imageName: string,
 *         version: string,
 *         label: string
 *       }
 *     ]
 *   }
 * }
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  if (!validateMethod(request, ['GET'])) {
    return methodNotAllowed(['GET']);
  }

  const authHeaders = await forwardAuthHeader(request);

  const response = await fetchExternalApi(
    `${serverApiConfig.skaha.baseUrl}/v1/image`,
    {
      method: 'GET',
      headers: {
        ...authHeaders,
        'Accept': 'application/json',
      },
    },
    serverApiConfig.skaha.timeout
  );

  if (!response.ok) {
    return errorResponse(
      'Failed to fetch container images',
      response.status
    );
  }

  const rawImages: RawImage[] = await response.json();

  // Transform the raw images into grouped structure
  const groupedImages = groupImagesByTypeAndProject(rawImages);

  return successResponse(groupedImages);
});
