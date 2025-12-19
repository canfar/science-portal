/**
 * TanStack Query hook for Platform Load
 *
 * Provides a hook for fetching Skaha platform load statistics.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { getPlatformLoad, type PlatformLoad } from '@/lib/api/skaha';

/**
 * Query keys for platform load
 */
export const platformLoadKeys = {
  all: ['platformLoad'] as const,
  current: () => [...platformLoadKeys.all, 'current'] as const,
};

/**
 * Get current platform load statistics
 *
 * @param isAuthenticated - Whether the user is authenticated (optional, defaults to true for backward compatibility)
 * @example
 * ```tsx
 * const { data: authStatus } = useAuthStatus();
 * const { data: platformLoad, isLoading, refetch } = usePlatformLoad(authStatus?.authenticated);
 * ```
 */
export function usePlatformLoad(
  isAuthenticated?: boolean,
  options?: Omit<UseQueryOptions<PlatformLoad>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: platformLoadKeys.current(),
    queryFn: getPlatformLoad,
    // Only fetch if authenticated (default to true for backward compatibility)
    enabled: isAuthenticated !== false,
    // No auto-refresh - only manual refresh via refresh button
    ...options,
  });
}
