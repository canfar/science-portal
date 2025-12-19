/**
 * Session API Route
 *
 * Mode-aware session endpoint that works with both:
 * - CANFAR mode: Custom auth with CANFAR whoami
 * - OIDC mode: Delegates to NextAuth's built-in session handling
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import {
  withErrorHandling,
  successResponse,
  fetchExternalApi,
  forwardCookies,
} from '@/app/api/lib/api-utils';
import { serverApiConfig } from '@/app/api/lib/server-config';

/**
 * GET /api/auth/session
 * Returns the current session status in NextAuth format
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const isOIDC = process.env.NEXT_USE_CANFAR !== 'true';

  if (isOIDC) {
    // In OIDC mode, use NextAuth session
    const session = await auth();

    if (!session || !session.user) {
      return successResponse(null);
    }

    // Return session with access token for client
    return successResponse({
      user: session.user,
      accessToken: session.accessToken,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // CANFAR mode: Use custom auth with cookies
  try {
    const cookies = forwardCookies(request);

    // Call CANFAR whoami endpoint
    const response = await fetchExternalApi(
      `${serverApiConfig.login.baseUrl}/whoami`,
      {
        method: 'GET',
        headers: {
          ...cookies,
          'Accept': 'application/json',
        },
      },
      serverApiConfig.login.timeout
    );

    if (!response.ok) {
      // User not authenticated
      return successResponse(null);
    }

    const user = await response.json();

    // Return session in NextAuth format
    return successResponse({
      user: {
        name: user.displayName || user.username,
        email: user.email,
        image: null,
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    // Return null session on error (not authenticated)
    return successResponse(null);
  }
});
