/**
 * Custom OIDC Client for Direct Token Management
 *
 * Handles OIDC authentication flow with PKCE independently of NextAuth.
 * This allows us to obtain and manage access tokens directly for backend API calls.
 */

import { getOIDCConfig } from '@/lib/config/auth-config';

const CODE_VERIFIER_KEY = 'oidc_code_verifier';
const STATE_KEY = 'oidc_state';

/**
 * Generate a random string for PKCE code_verifier and state
 */
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate PKCE code_challenge from code_verifier
 */
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);

  // Convert to base64url
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Initiate OIDC login flow
 * Redirects to the OIDC provider's authorization endpoint
 */
export async function initiateOIDCLogin(): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('This function can only be called in the browser');
  }

  try {
    const config = getOIDCConfig();

    // Discover OIDC endpoints
    const discoveryUrl = `${config.issuer}.well-known/openid-configuration`;
    const discoveryResponse = await fetch(discoveryUrl);

    if (!discoveryResponse.ok) {
      throw new Error('Failed to discover OIDC endpoints');
    }

    const discoveryDoc = await discoveryResponse.json();
    const authorizationEndpoint = discoveryDoc.authorization_endpoint;

    // Generate PKCE parameters
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateRandomString(32);

    // Store for later use in callback
    sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
    sessionStorage.setItem(STATE_KEY, state);

    // Build authorization URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      redirect_uri: config.redirectUrl,
      scope: config.scope,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const authUrl = `${authorizationEndpoint}?${params.toString()}`;

    // Redirect to OIDC provider
    window.location.href = authUrl;
  } catch (error) {
    console.error('Failed to initiate OIDC login:', error);
    throw error;
  }
}

/**
 * Get stored code_verifier for token exchange
 */
export function getCodeVerifier(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(CODE_VERIFIER_KEY);
}

/**
 * Get stored state for validation
 */
export function getState(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(STATE_KEY);
}

/**
 * Clear PKCE parameters after successful exchange
 */
export function clearPKCEData(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(CODE_VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
}
