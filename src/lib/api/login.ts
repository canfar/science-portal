/**
 * Login/Authentication API Client
 *
 * Handles user authentication and authorization with CANFAR.
 * Uses Bearer token authentication stored in sessionStorage.
 */

import { saveToken, getAuthHeader } from '@/lib/auth/token-storage';

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
}

/**
 * Login with username and password
 *
 * Stores the authentication token in sessionStorage for subsequent requests.
 */
export async function login(credentials: LoginCredentials): Promise<User> {
  const response = await fetch('/api/auth/login', {
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
 * Logout current user
 *
 * Clears the authentication token from storage and notifies the server.
 */
export async function logout(): Promise<void> {
  const { removeToken } = await import('@/lib/auth/token-storage');

  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });

  // Clear token regardless of server response
  removeToken();

  if (!response.ok) {
    throw new Error(`Logout failed: ${response.status}`);
  }
}

/**
 * Get current authentication status
 *
 * Sends Authorization header with Bearer token.
 */
export async function getAuthStatus(): Promise<AuthStatus> {
  try {
    const authHeaders = getAuthHeader();

    const response = await fetch('/api/auth/status', {
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
  } catch (error) {
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

  const response = await fetch(`/api/auth/user/${username}`, {
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
  permission: 'read' | 'write' | 'execute'
): Promise<boolean> {
  try {
    const authHeaders = getAuthHeader();
    const params = new URLSearchParams({
      username,
      resource,
      permission,
    });

    const response = await fetch(`/api/auth/permissions?${params}`, {
      credentials: 'include',
      headers: authHeaders,
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.granted === true;
  } catch (error) {
    return false;
  }
}
