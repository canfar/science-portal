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
  forwardAuthHeader,
  oidcBearerAuthMissingResponse,
  parseSuccessJsonBody,
} from '@/app/api/lib/api-utils';
import { serverApiConfig } from '@/app/api/lib/server-config';
import { createLogger } from '@/app/api/lib/logger';
import { HTTP_STATUS } from '@/app/api/lib/http-constants';
import type { ImageRepository } from '@/lib/api/skaha';
import { getPublicRuntimeConfigFromEnv } from '@/lib/config/public-runtime-config';

/**
 * GET /api/sessions/repository
 * List the Image Repository hosts configured as a JSON Array
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { basePath } = getPublicRuntimeConfigFromEnv();
  const sessionsAPIEndpoint = `${basePath}/api/sessions`;
  const logger = createLogger(`${sessionsAPIEndpoint}/repository`, 'GET');
  logger.logRequest(request);

  if (!validateMethod(request, ['GET'])) {
    return methodNotAllowed(['GET']);
  }

  const authHeaders = await forwardAuthHeader(request);
  const authDenied = oidcBearerAuthMissingResponse(authHeaders);
  if (authDenied) {
    return authDenied;
  }

  logger.info(`Fetching image repositories from ${serverApiConfig.skaha.baseUrl}/v1/repository`);

  const response = await fetchExternalApi(
    `${serverApiConfig.skaha.baseUrl}/v1/repository`,
    {
      method: 'GET',
      headers: {
        ...authHeaders,
        Accept: 'application/json',
      },
    },
    serverApiConfig.skaha.timeout,
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.logError(
      response.status,
      `Failed to fetch image repositories: ${response.statusText}`,
      errorText,
    );
    return errorResponse('Failed to fetch image repositories', response.status);
  }

  const rawResponse = await parseSuccessJsonBody<unknown>(response);
  if (rawResponse === null) {
    logger.logError(HTTP_STATUS.BAD_GATEWAY, 'Invalid JSON from repository service');
    return errorResponse('Invalid response from repository service', HTTP_STATUS.BAD_GATEWAY);
  }

  // Transform response: SKAHA API returns array of strings ["images.canfar.net"]
  // but we need array of objects [{ host: "images.canfar.net" }]
  const repositories: ImageRepository[] = Array.isArray(rawResponse)
    ? rawResponse.map((host: string) => ({ host }))
    : [];

  logger.info(`Retrieved ${repositories.length} image repository host(s)`);
  logger.logSuccess(HTTP_STATUS.OK, { count: repositories.length, repositories });
  return successResponse(repositories);
});
