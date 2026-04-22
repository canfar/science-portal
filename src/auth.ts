import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import { getOIDCConfig, getOidcIssuerPathUrl, isOIDCAuth } from '@/lib/config/auth-config';
import { getProcessEnv } from '@/lib/config/safe-process-env';

/**
 * NextAuth Configuration for OIDC Authentication
 *
 * This configuration is only used when NEXT_USE_CANFAR=false
 * When NEXT_USE_CANFAR=true, the custom CANFAR auth flow is used instead
 */

// Token type for refresh token handling - extends JWT for compatibility
interface TokenWithRefresh {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
  user?: Record<string, unknown>;
  error?: string;
  [key: string]: unknown; // Index signature for JWT compatibility
}

/**
 * Default margin before OIDC access token expiry to run refresh in the JWT callback.
 * Override with server env `NEXT_OIDC_ACCESS_TOKEN_REFRESH_MARGIN_MS` (milliseconds, non-negative).
 * Documented in `.env.example` and `helm/DEPLOYMENT-MODES.md`.
 */
const DEFAULT_ACCESS_TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;

function getAccessTokenRefreshMarginMs(): number {
  const raw = getProcessEnv('NEXT_OIDC_ACCESS_TOKEN_REFRESH_MARGIN_MS');
  if (raw) {
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n) && n >= 0) {
      return n;
    }
  }
  return DEFAULT_ACCESS_TOKEN_REFRESH_MARGIN_MS;
}

function isAccessTokenStillValid(token: TokenWithRefresh): boolean {
  const expiresAt = token.accessTokenExpires as number | undefined;
  if (!expiresAt) {
    return false;
  }
  const marginMs = getAccessTokenRefreshMarginMs();
  return Date.now() < expiresAt - marginMs;
}

// OIDC profile type
interface OIDCProfile {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
}

const trustHostFromEnv =
  getProcessEnv('AUTH_TRUST_HOST') === 'true' ? ({ trustHost: true } as const) : {};

export const authConfig: NextAuthConfig = {
  ...trustHostFromEnv,
  /**
   * Must stay `/api/auth`: Next.js strips `basePath` before Auth.js sees `pathname`
   * (e.g. `/api/auth/providers`). A value like `/science-portal/api/auth` breaks action parsing.
   * The browser still calls `/science-portal/api/auth/*` via `SessionProvider` in AuthProvider.
   */
  basePath: '/api/auth',
  /**
   * When the public URL is HTTPS but the incoming Request URL is still `http` (reverse proxy),
   * Auth.js may pick non-secure cookie names on sign-in and secure names on callback (or the
   * reverse), and the state/PKCE cookie JWTs will not decrypt — InvalidCheck "state value could
   * not be parsed". Force secure cookies whenever AUTH_URL / NEXTAUTH_URL is HTTPS.
   */
  useSecureCookies:
    (getProcessEnv('AUTH_URL') ?? getProcessEnv('NEXTAUTH_URL'))?.startsWith('https:') === true
      ? true
      : undefined,
  providers: [],
  pages: {
    signIn: `/`,
  },
  callbacks: {
    authorized({ request: { nextUrl } }) {
      const isOnDashboard = nextUrl.pathname.startsWith('/');

      // Allow access if using CANFAR auth (handled separately)
      if (!isOIDCAuth()) {
        return true;
      }

      if (isOnDashboard) {
        // Dashboard pages may require authentication based on app logic
        return true;
      }

      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        console.debug('\n' + '🔐'.repeat(40));
        console.debug('🔐 JWT Callback - Initial Sign In - PURE TOKEN FROM IAM:');
        console.debug('🔐'.repeat(40));
        console.debug('📋 FULL ACCESS TOKEN:');
        console.debug(account.access_token);
        console.debug('\n📋 Token Details:');
        console.debug('  - Token length:', account.access_token?.length);
        console.debug('  - Refresh token:', account.refresh_token ? 'present' : 'missing');
        console.debug('  - Expires at:', account.expires_at);
        console.debug('  - User:', JSON.stringify(user, null, 2));
        console.debug('🔐'.repeat(40) + '\n');

        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
          user,
        };
      }

      // Return previous token if still valid (including proactive margin before expiry)
      if (isAccessTokenStillValid(token)) {
        return token;
      }

      console.log('⏰ JWT Callback - Token expired or within refresh margin, refreshing...');
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (token) {
        console.debug('📋 Session Callback:');
        console.debug(
          '  - token.accessToken:',
          token.accessToken ? token.accessToken.substring(0, 50) + '...' : 'missing',
        );
        console.debug('  - token.user:', JSON.stringify(token.user, null, 2));
        console.debug('  - token.error:', token.error);

        session.user = {
          ...session.user,
          ...(token.user as Record<string, unknown>),
        };
        session.accessToken = token.accessToken as string;
        session.error = token.error as string | undefined;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(token: TokenWithRefresh): Promise<TokenWithRefresh> {
  try {
    const oidcConfig = getOIDCConfig();
    const url = getOidcIssuerPathUrl(oidcConfig.issuer, 'token');

    if (!token.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: oidcConfig.clientId,
        client_secret: oidcConfig.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

/**
 * Initialize NextAuth with OIDC provider if in OIDC mode
 */
function initializeAuth() {
  if (isOIDCAuth()) {
    try {
      // Allow missing OIDC config during build time (will use dummy values)
      const oidcConfig = getOIDCConfig(true);

      // Configure OIDC provider
      authConfig.providers = [
        {
          id: 'oidc',
          name: 'SKA IAM',
          type: 'oidc',
          issuer: oidcConfig.issuer,
          clientId: oidcConfig.clientId,
          clientSecret: oidcConfig.clientSecret,
          authorization: {
            params: {
              scope: oidcConfig.scope,
              // Full redirect URI including Next.js basePath; must match IdP registration.
              redirect_uri: oidcConfig.redirectUrl,
            },
          },
          checks: ['state', 'pkce'],
          profile(profile: OIDCProfile) {
            return {
              id: profile.sub,
              email: profile.email,
              name: profile.name || profile.preferred_username,
              username: profile.preferred_username,
              firstName: profile.given_name,
              lastName: profile.family_name,
            };
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any, // NextAuth provider type requires any cast
      ];
    } catch (error) {
      console.error('Failed to initialize OIDC configuration:', error);
      // Don't throw during build - allow build to continue with dummy config
      if (process.env.NEXT_PHASE !== 'phase-production-build') {
        throw error;
      }
    }
  }

  return NextAuth(authConfig);
}

export const { handlers, auth, signIn, signOut } = initializeAuth();
