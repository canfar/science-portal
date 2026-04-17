'use client';

import { SessionProvider } from 'next-auth/react';
import { usePublicRuntimeConfig } from '@/lib/providers/PublicRuntimeConfigProvider';
import { authApiBasePathFromAppBasePath } from '@/lib/config/auth-base-path';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { basePath } = usePublicRuntimeConfig();
  const authBasePath = authApiBasePathFromAppBasePath(basePath);

  return <SessionProvider basePath={authBasePath}>{children}</SessionProvider>;
}
