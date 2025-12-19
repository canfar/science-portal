/**
 * Session Events API Route
 *
 * Handles retrieving events for a specific session.
 * GET - Get session events
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withErrorHandling,
  validateMethod,
  methodNotAllowed,
  errorResponse,
  fetchExternalApi,
  forwardAuthHeader
} from '@/app/api/lib/api-utils';
import { HTTP_STATUS } from '@/app/api/lib/http-constants';
import { serverApiConfig } from '@/app/api/lib/server-config';
import { createLogger } from '@/app/api/lib/logger';

/**
 * GET /api/sessions/[id]/events
 * Get events for a specific session
 */
export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: sessionId } = await params;
  const logger = createLogger(`/api/sessions/${sessionId}/events`, 'GET');
  logger.logRequest(request);

  if (!validateMethod(request, ['GET'])) {
    return methodNotAllowed(['GET']);
  }

  const authHeaders = await forwardAuthHeader(request);

  const response = await fetchExternalApi(
    `${serverApiConfig.skaha.baseUrl}/v1/session/${sessionId}?view=events`,
    {
      method: 'GET',
      headers: {
        ...authHeaders,
        'Accept': 'text/plain',
      },
    },
    serverApiConfig.skaha.timeout
  );

  if (!response.ok) {
    logger.logError(response.status, `Failed to fetch events for session: ${sessionId}`);
    return errorResponse(
      'Failed to fetch session events',
      response.status
    );
  }

  const events = await response.text();
  logger.info(`Retrieved events for session ${sessionId}`);
  logger.logSuccess(HTTP_STATUS.OK);

  // Return text response for parsing by EventsModal
  return new NextResponse(events, {
    status: HTTP_STATUS.OK,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
});
