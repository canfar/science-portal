/**
 * Session Renew API Route
 *
 * Handles extending session expiry time.
 * POST - Extend session expiry using SKAHA action API
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
  getRequestBody,
} from '@/app/api/lib/api-utils';
import { serverApiConfig } from '@/app/api/lib/server-config';
import { createLogger } from '@/app/api/lib/logger';
import type { SkahaSessionResponse } from '@/lib/api/skaha';

interface RenewSessionParams {
  hours?: number; // Optional - SKAHA uses configured expiry time if not specified
}

/**
 * POST /api/sessions/[id]/renew
 * Extend session expiry time
 *
 * According to SKAHA API docs: POST /v1/session/{sessionID}?action=renew
 * This sets the session expiry time based on the configured expiry time in skaha.sessionexpiry
 */
export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const logger = createLogger('/api/sessions/[id]/renew', 'POST');

  if (!validateMethod(request, ['POST'])) {
    return methodNotAllowed(['POST']);
  }

  const { id: sessionId } = await params;

  // Log the incoming request
  logger.logRequest(request);
  logger.info(`Renewing session: ${sessionId}`);

  const authHeaders = await forwardAuthHeader(request);

  // SKAHA API: POST /v1/session/{sessionID} with action=renew as form data
  const response = await fetchExternalApi(
    `${serverApiConfig.skaha.baseUrl}/v1/session/${sessionId}`,
    {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: 'action=renew',
    },
    serverApiConfig.skaha.timeout
  );

  if (!response.ok) {
    logger.logError(response.status, `Failed to renew session: ${response.statusText}`);
    return errorResponse(
      'Failed to renew session',
      response.status
    );
  }

  // Check if response has content
  const contentType = response.headers.get('content-type');
  logger.info(`Response content-type: ${contentType}, status: ${response.status}`);

  // SKAHA might return empty response for renew action
  const text = await response.text();
  logger.info(`Response body length: ${text.length}, preview: ${text.substring(0, 200)}`);

  if (!text || text.trim().length === 0) {
    // Empty response - renew was successful but we need to fetch the updated session
    logger.info('Empty response from renew action, fetching updated session details');

    // Fetch the updated session details
    const sessionResponse = await fetchExternalApi(
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

    if (!sessionResponse.ok) {
      logger.logError(sessionResponse.status, 'Failed to fetch updated session after renew');
      return errorResponse('Session renewed but failed to fetch updated details', sessionResponse.status);
    }

    const session: SkahaSessionResponse = await sessionResponse.json();
    logger.info(`Successfully renewed session: ${session.name}, new expiry: ${session.expiryTime}`);
    logger.logSuccess(200, { sessionId: session.id, expiryTime: session.expiryTime });
    return successResponse(session);
  }

  // Try to parse as JSON
  try {
    const session: SkahaSessionResponse = JSON.parse(text);
    logger.info(`Successfully renewed session: ${session.name}, new expiry: ${session.expiryTime}`);
    logger.logSuccess(200, { sessionId: session.id, expiryTime: session.expiryTime });
    return successResponse(session);
  } catch (e) {
    logger.logError(500, `Failed to parse renew response as JSON: ${e}`);
    return errorResponse('Invalid response from renew action', 500);
  }
});
