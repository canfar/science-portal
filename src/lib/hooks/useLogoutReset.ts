'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Detect a true→false transition of `isAuthenticated` and reset the app.
 *
 * Tracks the previous value via `useRef` (transient — doesn't trigger a render)
 * instead of `useState`, avoiding the React anti-pattern of useState+useEffect
 * solely to mirror a prop. See Vercel rule `rerender-derived-state-no-effect`.
 *
 * On logout transition: invalidates and removes all non-auth queries, clears
 * nuqs URL state, and triggers a full page reload to drop in-memory state.
 */
export function useLogoutReset(isAuthenticated: boolean): void {
  const queryClient = useQueryClient();
  const prevAuthenticatedRef = useRef(isAuthenticated);

  useEffect(() => {
    const wasAuthenticated = prevAuthenticatedRef.current;
    prevAuthenticatedRef.current = isAuthenticated;

    if (!wasAuthenticated || isAuthenticated) {
      // Either no transition, or logged in — nothing to do.
      return;
    }

    // True logout transition: drop everything.
    queryClient.invalidateQueries({
      predicate: (query) => !query.queryKey.includes('auth'),
    });
    queryClient.removeQueries({
      predicate: (query) => !query.queryKey.includes('auth'),
    });

    const url = new URL(window.location.href);
    url.search = '';
    window.location.href = url.toString();
  }, [isAuthenticated, queryClient]);
}
