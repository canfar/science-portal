/**
 * TanStack Query hook for Platform Load (legacy).
 *
 * Live Skaha platform-load fetching is disabled (CADC-15555 / opencadc/science-portal#158).
 * The dashboard uses {@link STATIC_PLATFORM_LOAD_DATA} and a disabled overlay instead.
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
 * @deprecated Query is permanently disabled; do not use for UI. Kept for cache keys / tests only.
 */
export function usePlatformLoad(
  _isAuthenticated?: boolean,
  options?: Omit<UseQueryOptions<PlatformLoad>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: platformLoadKeys.current(),
    queryFn: getPlatformLoad,
    enabled: false,
    ...options,
  });
}
