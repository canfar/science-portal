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
  forwardAuthHeader
} from '@/app/api/lib/api-utils';
import { serverApiConfig } from '@/app/api/lib/server-config';
import { createLogger } from '@/app/api/lib/logger';
import type { PlatformLoad, SkahaStatsResponse } from '@/lib/api/skaha';

/**
 * GET /api/sessions/platform-load
 * Get platform load statistics
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = createLogger('/api/sessions/platform-load', 'GET');
  logger.logRequest(request);

  if (!validateMethod(request, ['GET'])) {
    return methodNotAllowed(['GET']);
  }

  const authHeaders = await forwardAuthHeader(request);

  const response = await fetchExternalApi(
    `${serverApiConfig.skaha.baseUrl}/v1/session?view=stats`,
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
    logger.logError(response.status, `Failed to fetch platform load: ${response.statusText}`);
    return errorResponse(
      'Failed to fetch platform load',
      response.status
    );
  }

  const data: SkahaStatsResponse = await response.json();

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
    instances: {
      name: 'Instances',
      used: data.instances.session,     // Navy blue - session instances
      free: data.instances.desktopApp,  // Blue - desktop app instances
      headless: data.instances.headless, // Light blue - headless instances
    },
    maxValues: {
      cpu: data.cores.cpuCoresAvailable,
      ram: ramAvailable,
      instances: data.instances.total, // Use total as max since we don't have a better value
    },
    lastUpdate: lastUpdate,
  };

  logger.info(`Platform stats - Instances: ${data.instances.total}, CPU: ${data.cores.requestedCPUCores}/${data.cores.cpuCoresAvailable}, RAM: ${data.ram.requestedRAM}/${data.ram.ramAvailable}`);
  logger.logSuccess(200, platformLoad);
  return successResponse(platformLoad);
});
