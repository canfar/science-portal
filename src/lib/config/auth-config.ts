/**
 * Authentication Configuration
 *
 * Handles dual authentication modes:
 * - CANFAR: Custom authentication with CANFAR API
 * - OIDC: OpenID Connect authentication via NextAuth
 */

export type AuthMode = 'CANFAR' | 'OIDC';

export interface OIDCConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  redirectUrl: string;
  scope: string;
}

export interface AuthConfig {
  mode: AuthMode;
  oidc?: OIDCConfig;
}

/**
 * Get the current authentication mode from environment variables
 */
export function getAuthMode(): AuthMode {
  const useCanfar = process.env.NEXT_USE_CANFAR === 'true' ||
                    process.env.NEXT_PUBLIC_USE_CANFAR === 'true';
  return useCanfar ? 'CANFAR' : 'OIDC';
}

/**
 * Check if currently using CANFAR authentication
 */
export function isCanfarAuth(): boolean {
  return getAuthMode() === 'CANFAR';
}

/**
 * Check if currently using OIDC authentication
 */
export function isOIDCAuth(): boolean {
  return getAuthMode() === 'OIDC';
}

/**
 * Get OIDC configuration from environment variables
 * @param allowMissing - If true, returns dummy config when vars are missing (for build time)
 */
export function getOIDCConfig(allowMissing = false): OIDCConfig {
  const issuer = process.env.NEXT_OIDC_URI || process.env.NEXT_PUBLIC_OIDC_URI;
  const clientId = process.env.NEXT_OIDC_CLIENT_ID || process.env.NEXT_PUBLIC_OIDC_CLIENT_ID;
  const clientSecret = process.env.NEXT_OIDC_CLIENT_SECRET || '';
  const callbackUrl = process.env.NEXT_OIDC_CALLBACK_URI || process.env.NEXT_PUBLIC_OIDC_CALLBACK_URI;
  const redirectUrl = process.env.NEXT_OIDC_REDIRECT_URI || process.env.NEXT_PUBLIC_OIDC_REDIRECT_URI;
  const scope = process.env.NEXT_OIDC_SCOPE || process.env.NEXT_PUBLIC_OIDC_SCOPE || 'openid profile email';

  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

  if (!issuer || !clientId || !callbackUrl || !redirectUrl) {
    // During build time or when explicitly allowed, return dummy config
    if (isBuildTime || allowMissing) {
      console.warn('⚠️ OIDC config missing - using dummy values (build time)');
      return {
        issuer: issuer || 'https://example.com/',
        clientId: clientId || 'dummy-client-id',
        clientSecret: clientSecret || 'dummy-secret',
        callbackUrl: callbackUrl || 'http://localhost:3000/science-portal',
        redirectUrl: redirectUrl || 'http://localhost:3000/api/auth/callback/oidc',
        scope,
      };
    }

    throw new Error(
      'Missing required OIDC configuration. Please check your environment variables:\n' +
      `- NEXT_OIDC_URI: ${issuer ? '✓' : '✗'}\n` +
      `- NEXT_OIDC_CLIENT_ID: ${clientId ? '✓' : '✗'}\n` +
      `- NEXT_OIDC_CLIENT_SECRET: ${clientSecret ? '✓' : '✗'}\n` +
      `- NEXT_OIDC_CALLBACK_URI: ${callbackUrl ? '✓' : '✗'}\n` +
      `- NEXT_OIDC_REDIRECT_URI: ${redirectUrl ? '✓' : '✗'}`
    );
  }

  return {
    issuer,
    clientId,
    clientSecret,
    callbackUrl,
    redirectUrl,
    scope,
  };
}

/**
 * Get complete authentication configuration
 */
export function getAuthConfig(): AuthConfig {
  const mode = getAuthMode();

  if (mode === 'OIDC') {
    return {
      mode,
      oidc: getOIDCConfig(),
    };
  }

  return { mode };
}

/**
 * Validate authentication configuration
 */
export function validateAuthConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const mode = getAuthMode();

  if (mode === 'OIDC') {
    try {
      getOIDCConfig();
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Invalid OIDC configuration');
    }
  } else if (mode === 'CANFAR') {
    const loginApi = process.env.LOGIN_API || process.env.NEXT_PUBLIC_LOGIN_API;
    if (!loginApi) {
      errors.push('Missing LOGIN_API or NEXT_PUBLIC_LOGIN_API for CANFAR authentication');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
