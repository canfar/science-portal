/**
 * Session Logs API Route
 *
 * Handles retrieving logs for a specific session.
 * GET - Get session logs
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withErrorHandling,
  validateMethod,
  methodNotAllowed,
  errorResponse,
  fetchExternalApi,
  forwardAuthHeader,
  oidcBearerAuthMissingResponse,
} from '@/app/api/lib/api-utils';
import { HTTP_STATUS } from '@/app/api/lib/http-constants';
import { serverApiConfig } from '@/app/api/lib/server-config';
import { createLogger } from '@/app/api/lib/logger';

/**
 * GET /api/sessions/[id]/logs
 * Get logs for a specific session
 */
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id: sessionId } = await params;
    const logger = createLogger(`/api/sessions/${sessionId}/logs`, 'GET');
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
      `${serverApiConfig.skaha.baseUrl}/v1/session/${sessionId}?view=logs`,
      {
        method: 'GET',
        headers: {
          ...authHeaders,
          Accept: 'text/plain',
        },
      },
      serverApiConfig.skaha.timeout,
    );

    if (!response.ok) {
      logger.logError(response.status, `Failed to fetch logs for session: ${sessionId}`);
      return errorResponse('Failed to fetch session logs', response.status);
    }

    const logs = await response.text();
    logger.info(`Retrieved logs for session ${sessionId}`);
    logger.logSuccess(HTTP_STATUS.OK);

    return new NextResponse(logs, {
      status: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  },
);
