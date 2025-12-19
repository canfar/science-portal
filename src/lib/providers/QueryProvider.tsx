'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';
import { apiConfig } from '@/lib/config/api';

/**
 * Default query client configuration
 *
 * These are sensible defaults that can be overridden per-query
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Queries are considered fresh for 30 seconds
        staleTime: 30 * 1000,
        // Cache data for 5 minutes
        gcTime: 5 * 60 * 1000,
        // Retry failed requests 3 times with exponential backoff
        retry: 3,
        // Don't refetch on window focus by default (can be enabled per-query)
        refetchOnWindowFocus: false,
        // Refetch on mount if data is stale
        refetchOnMount: true,
        // Don't refetch on reconnect by default
        refetchOnReconnect: false,
      },
      mutations: {
        // Retry mutations once
        retry: 1,
        // Timeout for mutations
        networkMode: 'online',
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * TanStack Query Provider
 *
 * Wraps the application with QueryClientProvider and optionally includes devtools.
 * This provider should be placed high in the component tree.
 *
 * @example
 * ```tsx
 * <QueryProvider>
 *   <YourApp />
 * </QueryProvider>
 * ```
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {apiConfig.devtools.enabled && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-right"
          position="bottom"
        />
      )}
    </QueryClientProvider>
  );
}
