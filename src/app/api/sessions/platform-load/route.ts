/**
 * Platform Load API Route
 *
 * Handles retrieving platform load/context information.
 * GET - Get platform load statistics
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
import type { PlatformLoad, SkahaStatsResponse } from '@/lib/api/skaha';
import { getPublicRuntimeConfigFromEnv } from '@/lib/config/public-runtime-config';

/**
 * GET /api/sessions/platform-load
 * Get platform load statistics
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { basePath } = getPublicRuntimeConfigFromEnv();
  const sessionsAPIEndpoint = `${basePath}/api/sessions`;
  const logger = createLogger(`${sessionsAPIEndpoint}/platform-load`, 'GET');
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
    `${serverApiConfig.skaha.baseUrl}/v1/session?view=stats`,
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
    logger.logError(response.status, `Failed to fetch platform load: ${response.statusText}`);
    return errorResponse('Failed to fetch platform load', response.status);
  }

  const data = await parseSuccessJsonBody<SkahaStatsResponse>(response);
  if (data === null) {
    logger.logError(HTTP_STATUS.BAD_GATEWAY, 'Invalid JSON from platform stats');
    return errorResponse('Invalid response from platform stats', HTTP_STATUS.BAD_GATEWAY);
  }

  // Transform SKAHA stats response to PlatformLoad format
  // Use ISO string for consistent serialization and to avoid hydration mismatch
  const lastUpdate = new Date().toISOString();

  // Parse RAM values by splitting on 'G' and converting to number (e.g., "5032G" -> 5032)
  const requestedRAM = +data.ram.requestedRAM.split('G')[0];
  const ramAvailable = +data.ram.ramAvailable.split('G')[0];

  const platformLoad: PlatformLoad = {
    cpu: {
      name: 'CPU',
      used: data.cores.requestedCPUCores,
      free: data.cores.cpuCoresAvailable - data.cores.requestedCPUCores,
    },
    ram: {
      name: 'RAM',
      used: requestedRAM,
      free: +(ramAvailable - requestedRAM).toFixed(2),
    },
    maxValues: {
      cpu: data.cores.cpuCoresAvailable,
      ram: ramAvailable,
    },
    lastUpdate: lastUpdate,
  };

  logger.info(
    `Platform stats - CPU: ${data.cores.requestedCPUCores}/${data.cores.cpuCoresAvailable}, RAM: ${data.ram.requestedRAM}/${data.ram.ramAvailable}`,
  );
  logger.logSuccess(200, platformLoad);
  return successResponse(platformLoad);
});
