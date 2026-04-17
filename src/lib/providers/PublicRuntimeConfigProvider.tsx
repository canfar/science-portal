'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { PublicRuntimeConfig } from '@/lib/config/public-runtime-config';
import { setPublicRuntimeSnapshot } from '@/lib/config/runtime-public-snapshot';

const PublicRuntimeConfigContext = createContext<PublicRuntimeConfig | null>(null);

export function PublicRuntimeConfigProvider({
  value,
  children,
}: {
  value: PublicRuntimeConfig;
  children: ReactNode;
}) {
  setPublicRuntimeSnapshot(value);

  return (
    <PublicRuntimeConfigContext.Provider value={value}>
      {children}
    </PublicRuntimeConfigContext.Provider>
  );
}

export function usePublicRuntimeConfig(): PublicRuntimeConfig {
  const ctx = useContext(PublicRuntimeConfigContext);
  if (!ctx) {
    throw new Error('usePublicRuntimeConfig must be used within PublicRuntimeConfigProvider');
  }
  return ctx;
}
