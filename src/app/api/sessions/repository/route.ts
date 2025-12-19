/**
 * Image Repository API Route
 *
 * Handles retrieving Image Repository hosts configured in SKAHA.
 * GET - Get image repository hosts
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
import { createLogger } from '@/app/api/lib/logger';
import { HTTP_STATUS } from '@/app/api/lib/http-constants';
import type { ImageRepository } from '@/lib/api/skaha';

/**
 * GET /api/sessions/repository
 * List the Image Repository hosts configured as a JSON Array
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = createLogger('/api/sessions/repository', 'GET');
  logger.logRequest(request);

  if (!validateMethod(request, ['GET'])) {
    return methodNotAllowed(['GET']);
  }

  const authHeaders = await forwardAuthHeader(request);

  logger.info(`Fetching image repositories from ${serverApiConfig.skaha.baseUrl}/v1/repository`);

  const response = await fetchExternalApi(
    `${serverApiConfig.skaha.baseUrl}/v1/repository`,
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
    const errorText = await response.text();
    logger.logError(response.status, `Failed to fetch image repositories: ${response.statusText}`, errorText);
    return errorResponse(
      'Failed to fetch image repositories',
      response.status
    );
  }

  const rawResponse = await response.json();

  // Transform response: SKAHA API returns array of strings ["images.canfar.net"]
  // but we need array of objects [{ host: "images.canfar.net" }]
  const repositories: ImageRepository[] = Array.isArray(rawResponse)
    ? rawResponse.map((host: string) => ({ host }))
    : [];

  logger.info(`Retrieved ${repositories.length} image repository host(s)`);
  logger.logSuccess(HTTP_STATUS.OK, { count: repositories.length, repositories });
  return successResponse(repositories);
});
