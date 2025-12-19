/**
 * Token Storage Utilities
 *
 * Manages authentication tokens in browser storage.
 * Uses localStorage by default for persistence across page reloads.
 *
 * Note: When using OIDC mode, tokens are managed by NextAuth via cookies.
 * This storage is only used for CANFAR mode.
 */

const TOKEN_KEY = 'canfar_auth_token';

/**
 * Check if currently using OIDC authentication mode
 */
function isOIDCMode(): boolean {
  return typeof window !== 'undefined' &&
         process.env.NEXT_PUBLIC_USE_CANFAR !== 'true';
}

/**
 * Save authentication token
 *
 * @param token - The authentication token to store
 */
export function saveToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Get authentication token
 *
 * @returns The stored token or null if not found
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Remove authentication token
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Check if token exists
 */
export function hasToken(): boolean {
  return getToken() !== null;
}

/**
 * Get Authorization header value
 *
 * Returns Bearer token from localStorage for both OIDC and CANFAR modes
 *
 * @returns Object with Authorization header or empty object if no token
 */
export function getAuthHeader(): Record<string, string> {
  const token = getToken();
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
    };
  }
  return {};
}

/**
 * Clear all auth-related storage
 */
export function clearAuth(): void {
  removeToken();
  removeCredentials();
}

// Credentials storage for certificate generation
const CREDENTIALS_KEY = 'canfar_auth_credentials';

/**
 * Save user credentials (for certificate generation with HTTP Basic Auth)
 * Uses sessionStorage for better security (cleared on browser close)
 *
 * @param username - User's username
 * @param password - User's password
 */
export function saveCredentials(username: string, password: string): void {
  if (typeof window === 'undefined') return;
  // Store in sessionStorage (cleared when browser closes) for better security
  const credentials = { username, password };
  sessionStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
}

/**
 * Get stored credentials
 *
 * @returns Credentials object with username and password, or null if not found
 */
export function getCredentials(): { username: string; password: string } | null {
  if (typeof window === 'undefined') return null;
  const stored = sessionStorage.getItem(CREDENTIALS_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Remove stored credentials
 */
export function removeCredentials(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(CREDENTIALS_KEY);
}

/**
 * Check if credentials exist
 */
export function hasCredentials(): boolean {
  return getCredentials() !== null;
}
