/**
 * Authentication Configuration
 *
 * Handles dual authentication modes:
 * - CANFAR: Custom authentication with CANFAR API
 * - OIDC: OpenID Connect authentication via NextAuth
 */

/** Runtime env reads; avoids Next.js inlining `process.env.NEXT_PUBLIC_*` at build time. */
const env = process.env;

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
  const useCanfar = env.NEXT_USE_CANFAR === 'true' ||
                    env.NEXT_PUBLIC_USE_CANFAR === 'true';
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
  const issuer = env.NEXT_OIDC_URI || env.NEXT_PUBLIC_OIDC_URI;
  const clientId = env.NEXT_OIDC_CLIENT_ID || env.NEXT_PUBLIC_OIDC_CLIENT_ID;
  const clientSecret = env.NEXT_OIDC_CLIENT_SECRET || '';
  const callbackUrl = env.NEXT_OIDC_CALLBACK_URI || env.NEXT_PUBLIC_OIDC_CALLBACK_URI;
  const redirectUrl = env.NEXT_OIDC_REDIRECT_URI || env.NEXT_PUBLIC_OIDC_REDIRECT_URI;
  const scope = env.NEXT_OIDC_SCOPE || env.NEXT_PUBLIC_OIDC_SCOPE || 'openid profile email';
  const isBuildTime = env.NEXT_PHASE === 'phase-production-build';

  if (!issuer || !clientId || !callbackUrl || !redirectUrl) {
    // During build time or when explicitly allowed, return dummy config
    if (isBuildTime || allowMissing) {
      console.warn('⚠️ OIDC config missing - using dummy values (build time)');
      return {
        issuer: issuer || 'https://example.com/',
        clientId: clientId || 'dummy-client-id',
        clientSecret: clientSecret || 'dummy-secret',
        callbackUrl: callbackUrl || 'http://localhost:3000/',
        redirectUrl: redirectUrl || 'http://localhost:3000/oidc-callback',
        scope,
      };
    }

    throw new Error(
      'Missing required OIDC configuration. Please check your environment variables:\n' +
        `- NEXT_OIDC_URI: ${issuer ? '✓' : '✗'}\n` +
        `- NEXT_OIDC_CLIENT_ID: ${clientId ? '✓' : '✗'}\n` +
        `- NEXT_OIDC_CLIENT_SECRET: ${clientSecret ? '✓' : '✗'}\n` +
        `- NEXT_OIDC_CALLBACK_URI: ${callbackUrl ? '✓' : '✗'}\n` +
        `- NEXT_OIDC_REDIRECT_URI: ${redirectUrl ? '✓' : '✗'}`,
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
    const loginApi = env.LOGIN_API || env.NEXT_PUBLIC_LOGIN_API;
    if (!loginApi) {
      errors.push('Missing LOGIN_API or NEXT_PUBLIC_LOGIN_API for CANFAR authentication');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
