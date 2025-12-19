/**
 * Session Detail API Routes
 *
 * Handles individual session operations.
 * GET - Get session details
 * DELETE - Terminate a session
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
import { HTTP_STATUS } from '@/app/api/lib/http-constants';
import { serverApiConfig } from '@/app/api/lib/server-config';
import { createLogger } from '@/app/api/lib/logger';
import type { Session } from '@/lib/api/skaha';

/**
 * GET /api/sessions/[id]
 * Get details for a specific session
 */
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: sessionId } = await params;
  const logger = createLogger(`/api/sessions/${sessionId}`, 'GET');
  logger.logRequest(request);

  if (!validateMethod(request, ['GET'])) {
    return methodNotAllowed(['GET']);
  }

  const authHeaders = await forwardAuthHeader(request);

  const response = await fetchExternalApi(
    `${serverApiConfig.skaha.baseUrl}/v1/session/${sessionId}`,
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
    logger.logError(response.status, `Session not found: ${sessionId}`);
    return errorResponse(
      'Session not found',
      response.status
    );
  }

  const session: Session = await response.json();
  logger.info(`Retrieved session ${sessionId}`);
  logger.logSuccess(HTTP_STATUS.OK, session);
  return successResponse(session);
});

/**
 * DELETE /api/sessions/[id]
 * Terminate a session
 */
export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: sessionId } = await params;
  const logger = createLogger(`/api/sessions/${sessionId}`, 'DELETE');
  logger.logRequest(request);

  if (!validateMethod(request, ['DELETE'])) {
    return methodNotAllowed(['DELETE']);
  }

  const authHeaders = await forwardAuthHeader(request);

  const response = await fetchExternalApi(
    `${serverApiConfig.skaha.baseUrl}/v1/session/${sessionId}`,
    {
      method: 'DELETE',
      headers: {
        ...authHeaders,
      },
    },
    serverApiConfig.skaha.timeout
  );

  if (!response.ok) {
    logger.logError(response.status, `Failed to terminate session: ${sessionId}`);
    return errorResponse(
      'Failed to terminate session',
      response.status
    );
  }

  // DELETE operations return 204 No Content (no response body)
  logger.info(`Session ${sessionId} terminated successfully`);
  logger.logSuccess(HTTP_STATUS.NO_CONTENT, null);
  return successResponse(null, HTTP_STATUS.NO_CONTENT);
});
