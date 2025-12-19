'use client';

import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { ReactNode } from 'react';

interface NuqsProviderProps {
  children: ReactNode;
}

/**
 * nuqs Provider for Next.js App Router
 *
 * Wraps the application to enable URL state management.
 * Must be placed inside a client component.
 */
export function NuqsProvider({ children }: NuqsProviderProps) {
  return <NuqsAdapter>{children}</NuqsAdapter>;
}
