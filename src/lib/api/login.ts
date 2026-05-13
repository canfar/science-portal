/**
 * Login/Authentication API Client
 *
 * Handles user authentication and authorization with CANFAR.
 * Uses Bearer token authentication stored in sessionStorage.
 */

import { saveToken, getAuthHeader } from '@/lib/auth/token-storage';
import { getRuntimeBasePath } from '@/lib/config/runtime-public-snapshot';
import {
  ACCESS_LOGOUT_PATH,
  CANFAR_ACCESS_HOST_FALLBACK,
  CANFAR_DOMAIN_SUFFIX,
} from '@/lib/config/site-config';

function authApiRoot(): string {
  return `${getRuntimeBasePath()}/api/auth`;
}

export interface User {
  username: string;
  email?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  institute?: string;
  internalID?: string;
  numericID?: string;
  uid?: number;
  gid?: number;
  homeDirectory?: string;
  identities?: Array<{
    type: string;
    value: string | number;
  }>;
  groups?: string[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface AuthStatus {
  authenticated: boolean;
  user?: User;
  /** When true, Skaha BFF calls may proceed (OIDC: server session has access token). */
  sessionReady?: boolean;
}

/**
 * Login with username and password
 *
 * Stores the authentication token in sessionStorage for subsequent requests.
 */
export async function login(credentials: LoginCredentials): Promise<User> {
  const response = await fetch(`${authApiRoot()}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const data: LoginResponse = await response.json();

  // Store token in sessionStorage
  saveToken(data.token);

  return data.user;
}

/**
 * Logout current user via the CANFAR access service.
 *
 * Navigates the browser to `https://<canfar-host>/access/logout?target=<return-url>`.
 * The access service:
 *   1. invalidates the server-side session token,
 *   2. issues `Set-Cookie: CADC_SSO=…; Domain=.canfar.net; Max-Age=0` to clear
 *      the `.canfar.net`-scoped SSO cookie (so other CANFAR apps see the user
 *      as logged out too),
 *   3. redirects to `target`.
 *
 * `sessionStorage` Bearer token is cleared client-side first as the dev
 * fallback path; the page navigates away so the function never returns.
 */
export async function logout(): Promise<void> {
  const { removeToken } = await import('@/lib/auth/token-storage');
  removeToken();

  // Return target: current portal URL (path includes basePath; strip query string).
  const { origin, pathname } = window.location;
  const target = `${origin}${pathname}`;

  // The access service lives at the host root (NOT under our basePath). On
  // production canfar.net hosts we use the portal's own origin; locally we
  // bounce off the canonical fallback so the service can clear the
  // `.canfar.net` cookie and then redirect back to localhost.
  const accessHost = origin.includes(CANFAR_DOMAIN_SUFFIX) ? origin : CANFAR_ACCESS_HOST_FALLBACK;
  window.location.href = `${accessHost}${ACCESS_LOGOUT_PATH}?target=${encodeURIComponent(target)}`;
}

/**
 * Get current authentication status
 *
 * Sends Authorization header with Bearer token.
 */
export async function getAuthStatus(): Promise<AuthStatus> {
  try {
    const authHeaders = getAuthHeader();

    const response = await fetch(`${authApiRoot()}/status`, {
      credentials: 'include',
      headers: authHeaders,
    });

    if (!response.ok) {
      return {
        authenticated: false,
      };
    }

    const data: AuthStatus = await response.json();
    return data;
  } catch {
    return {
      authenticated: false,
    };
  }
}

/**
 * Get user details by username
 */
export async function getUserDetails(username: string): Promise<User> {
  const authHeaders = getAuthHeader();

  const response = await fetch(`${authApiRoot()}/user/${username}`, {
    credentials: 'include',
    headers: authHeaders,
  });

  if (!response.ok) {
    throw new Error(`Failed to get user details: ${response.status}`);
  }

  return response.json();
}

/**
 * Verify if user has specific permission
 */
export async function checkPermission(
  username: string,
  resource: string,
  permission: 'read' | 'write' | 'execute',
): Promise<boolean> {
  try {
    const authHeaders = getAuthHeader();
    const params = new URLSearchParams({
      username,
      resource,
      permission,
    });

    const response = await fetch(`${authApiRoot()}/permissions?${params}`, {
      credentials: 'include',
      headers: authHeaders,
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.granted === true;
  } catch {
    return false;
  }
}
