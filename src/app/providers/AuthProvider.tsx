'use client';

import { SessionProvider } from 'next-auth/react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return <SessionProvider basePath={`${basePath}/api/auth`}>{children}</SessionProvider>;
}
