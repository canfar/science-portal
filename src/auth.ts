import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import { getOIDCConfig, isOIDCAuth } from '@/lib/config/auth-config';

/**
 * NextAuth Configuration for OIDC Authentication
 *
 * This configuration is only used when NEXT_USE_CANFAR=false
 * When NEXT_USE_CANFAR=true, the custom CANFAR auth flow is used instead
 */

export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: '/science-portal',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/science-portal');

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
    async jwt({ token, user, account, profile }) {
      // Initial sign in
      if (account && user) {
        console.log('\n' + '🔐'.repeat(40));
        console.log('🔐 JWT Callback - Initial Sign In - PURE TOKEN FROM IAM:');
        console.log('🔐'.repeat(40));
        console.log('📋 FULL ACCESS TOKEN:');
        console.log(account.access_token);
        console.log('\n📋 Token Details:');
        console.log('  - Token length:', account.access_token?.length);
        console.log('  - Refresh token:', account.refresh_token ? 'present' : 'missing');
        console.log('  - Expires at:', account.expires_at);
        console.log('  - User:', JSON.stringify(user, null, 2));
        console.log('🔐'.repeat(40) + '\n');

        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : 0,
          user,
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      console.log('⏰ JWT Callback - Token Expired, Refreshing...');
      // Access token has expired, try to refresh it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (token) {
        console.log('📋 Session Callback:');
        console.log('  - token.accessToken:', token.accessToken ? token.accessToken.substring(0, 50) + '...' : 'missing');
        console.log('  - token.user:', JSON.stringify(token.user, null, 2));
        console.log('  - token.error:', token.error);

        session.user = {
          ...session.user,
          ...(token.user as any),
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
async function refreshAccessToken(token: any) {
  try {
    const oidcConfig = getOIDCConfig();
    const url = `${oidcConfig.issuer}token`;

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
              redirect_uri: oidcConfig.redirectUrl,
            },
          },
          checks: ['state', 'pkce'],
          profile(profile: any) {
            return {
              id: profile.sub,
              email: profile.email,
              name: profile.name || profile.preferred_username,
              username: profile.preferred_username,
              firstName: profile.given_name,
              lastName: profile.family_name,
            };
          },
        } as any,
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
