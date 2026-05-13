/**
 * Context API Route
 *
 * Handles retrieving available CPU cores and RAM for the calling user.
 * GET - Get context information (available resources)
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
import { HTTP_STATUS } from '@/app/api/lib/http-constants';
import { serverApiConfig } from '@/app/api/lib/server-config';
import { createLogger } from '@/app/api/lib/logger';
import type { ContextResponse } from '@/lib/api/skaha';
import { getPublicRuntimeConfigFromEnv } from '@/lib/config/public-runtime-config';

/**
 * GET /api/sessions/context
 * Get available CPU cores and RAM for the calling user
 *
 * Returns:
 * - Available CPU cores
 * - Available RAM
 * - Default values for cores and RAM
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { basePath } = getPublicRuntimeConfigFromEnv();
  const sessionsAPIEndpoint = `${basePath}/api/sessions`;
  const logger = createLogger(`${sessionsAPIEndpoint}/context`, 'GET');
  logger.logRequest(request);

  if (!validateMethod(request, ['GET'])) {
    return methodNotAllowed(['GET']);
  }

  const authHeaders = await forwardAuthHeader(request);
  const authDenied = oidcBearerAuthMissingResponse(authHeaders);
  if (authDenied) {
    return authDenied;
  }

  const response = await fetchExternalApi(
    `${serverApiConfig.skaha.baseUrl}/v1/context`,
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
    logger.logError(response.status, `Failed to fetch context: ${response.statusText}`);
    return errorResponse('Failed to fetch context', response.status);
  }

  const context = await parseSuccessJsonBody<ContextResponse>(response);
  if (context === null) {
    logger.logError(HTTP_STATUS.BAD_GATEWAY, 'Invalid JSON from context service');
    return errorResponse('Invalid response from context service', HTTP_STATUS.BAD_GATEWAY);
  }
  logger.info('Successfully retrieved context information');
  logger.logSuccess(HTTP_STATUS.OK, context);
  // Log the fetched GPU options
  console.log('🎮 Fetched GPU options from API:', context?.gpus);

  // Temporarily override GPU options to [0, 1] for testing
  if (context && context.gpus) {
    context.gpus.options = [0, 1];
    console.log('🎮 Override GPU options to:', context.gpus.options);
  }
  return successResponse(context);
});
