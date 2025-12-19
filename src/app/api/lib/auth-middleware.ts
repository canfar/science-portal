/**
 * Authentication Middleware for API Routes
 *
 * Provides authentication checks and user session validation
 * for protected API routes.
 */

import { NextRequest } from 'next/server';
import { serverApiConfig } from './server-config';
import { fetchExternalApi, forwardCookies } from './api-utils';

export interface AuthSession {
  authenticated: boolean;
  username?: string;
  displayName?: string;
}

/**
 * Checks if the user is authenticated by calling the auth status endpoint
 */
export async function checkAuthentication(
  request: NextRequest
): Promise<AuthSession> {
  try {
    const authUrl = `${serverApiConfig.login.baseUrl}/whoami`;
    const cookies = forwardCookies(request);

    const response = await fetchExternalApi(
      authUrl,
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
      return { authenticated: false };
    }

    const data = await response.json();

    return {
      authenticated: true,
      username: data.username,
      displayName: data.displayName,
    };
  } catch (error) {
    console.error('Authentication check failed:', error);
    return { authenticated: false };
  }
}

/**
 * Requires authentication for an API route
 * Returns the auth session if authenticated, or null if not
 */
export async function requireAuth(
  request: NextRequest
): Promise<AuthSession | null> {
  const session = await checkAuthentication(request);

  if (!session.authenticated) {
    return null;
  }

  return session;
}

/**
 * Gets the username from the authenticated session
 */
export function getUsername(session: AuthSession): string {
  if (!session.authenticated || !session.username) {
    throw new Error('User not authenticated');
  }
  return session.username;
}
