'use client';

import { useEffect } from 'react';
import { SessionProvider, useSession, signOut } from 'next-auth/react';
import { usePublicRuntimeConfig } from '@/lib/providers/PublicRuntimeConfigProvider';
import { authApiBasePathFromAppBasePath } from '@/lib/config/auth-base-path';
import { clearAuth } from '@/lib/auth/token-storage';

/** Poll session below access-token lifetime so useSession picks up refreshed tokens (seconds per next-auth). */
const SESSION_REFETCH_INTERVAL_SECONDS = 5 * 60;

/**
 * When OIDC refresh fails, NextAuth sets session.error; sign out so the user can re-authenticate.
 */
function OIDCRefreshErrorRecovery() {
  const { data: session, status } = useSession();
  const { useCanfar: isCanfar, basePath } = usePublicRuntimeConfig();

  useEffect(() => {
    if (isCanfar || status !== 'authenticated') {
      return;
    }
    if (session?.error !== 'RefreshAccessTokenError') {
      return;
    }
    clearAuth();
    const callbackUrl = basePath && basePath !== '' ? basePath : '/';
    void signOut({ callbackUrl });
  }, [isCanfar, status, session?.error, basePath]);

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { basePath } = usePublicRuntimeConfig();
  const authBasePath = authApiBasePathFromAppBasePath(basePath);

  return (
    <SessionProvider
      basePath={authBasePath}
      refetchInterval={SESSION_REFETCH_INTERVAL_SECONDS}
    >
      <OIDCRefreshErrorRecovery />
      {children}
    </SessionProvider>
  );
}
