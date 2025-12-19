/**
 * TanStack Query hooks for Skaha Sessions
 *
 * Provides hooks for fetching, creating, and managing Skaha sessions.
 */

import { useEffect, useRef, useCallback } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import {
  getSessions,
  getSession,
  launchSession,
  deleteSession,
  renewSession,
  getSessionLogs,
  getSessionEvents,
  type Session,
  type SessionLaunchParams,
} from '@/lib/api/skaha';

/**
 * Query keys for sessions
 */
export const sessionKeys = {
  all: ['sessions'] as const,
  lists: () => [...sessionKeys.all, 'list'] as const,
  list: () => [...sessionKeys.lists()] as const,
  details: () => [...sessionKeys.all, 'detail'] as const,
  detail: (id: string) => [...sessionKeys.details(), id] as const,
  logs: (id: string) => [...sessionKeys.all, 'logs', id] as const,
  events: (id: string) => [...sessionKeys.all, 'events', id] as const,
};

/**
 * Get all active sessions
 *
 * @param isAuthenticated - Whether the user is authenticated (optional, defaults to true for backward compatibility)
 * @example
 * ```tsx
 * const { data: authStatus } = useAuthStatus();
 * const { data: sessions, isLoading, refetch } = useSessions(authStatus?.authenticated);
 * ```
 */
export function useSessions(
  isAuthenticated?: boolean,
  options?: Omit<UseQueryOptions<Session[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: sessionKeys.list(),
    queryFn: getSessions,
    // Only fetch if authenticated (default to true for backward compatibility)
    enabled: isAuthenticated !== false,
    // No auto-refresh - only manual refresh and on user actions (delete, launch, extend)
    ...options,
  });
}

/**
 * Get a specific session by ID
 *
 * @example
 * ```tsx
 * const { data: session } = useSession('session-123');
 * ```
 */
export function useSession(
  sessionId: string,
  options?: Omit<UseQueryOptions<Session>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: sessionKeys.detail(sessionId),
    queryFn: () => getSession(sessionId),
    enabled: !!sessionId,
    ...options,
  });
}

/**
 * Get session logs
 *
 * @example
 * ```tsx
 * const { data: logs } = useSessionLogs('session-123');
 * ```
 */
export function useSessionLogs(
  sessionId: string,
  options?: Omit<UseQueryOptions<string>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: sessionKeys.logs(sessionId),
    queryFn: () => getSessionLogs(sessionId),
    enabled: !!sessionId,
    ...options,
  });
}

/**
 * Get session events
 *
 * @example
 * ```tsx
 * const { data: events } = useSessionEvents('session-123');
 * ```
 */
export function useSessionEvents(
  sessionId: string,
  options?: Omit<UseQueryOptions<any[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: sessionKeys.events(sessionId),
    queryFn: () => getSessionEvents(sessionId),
    enabled: !!sessionId,
    ...options,
  });
}

/**
 * Launch a new session
 *
 * @example
 * ```tsx
 * const { mutate: launch, isPending } = useLaunchSession();
 *
 * launch({
 *   sessionType: 'notebook',
 *   sessionName: 'my-analysis',
 *   containerImage: 'images.canfar.net/ml:latest',
 *   cores: 2,
 *   ram: 8,
 * });
 * ```
 */
export function useLaunchSession(
  options?: UseMutationOptions<Session, Error, SessionLaunchParams>
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, ...restOptions } = options || {};

  return useMutation({
    ...restOptions,
    mutationFn: launchSession,
    onSuccess: (newSession, variables, ...rest) => {
      // Optimistically add the new pending session to the list
      const currentSessions = queryClient.getQueryData<Session[]>(sessionKeys.list()) || [];
      const updatedSessions = [...currentSessions, newSession];
      queryClient.setQueryData(sessionKeys.list(), updatedSessions);

      // Call user's onSuccess callback with the new session
      // The callback will handle starting the polling
      userOnSuccess?.(newSession, variables, ...rest);
    },
  });
}

/**
 * Delete/terminate a session
 *
 * @example
 * ```tsx
 * const { mutate: remove } = useDeleteSession();
 *
 * remove('session-123');
 * ```
 */
export function useDeleteSession(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, ...restOptions } = options || {};

  return useMutation({
    ...restOptions,
    mutationFn: deleteSession,
    onSuccess: async (data, sessionId, ...rest) => {
      // Call user's onSuccess callback if provided
      userOnSuccess?.(data, sessionId, ...rest);

      // Wait 3 seconds before verifying deletion
      setTimeout(async () => {
        try {
          // Try to fetch the session to verify it's deleted
          await getSession(sessionId);

          // If we get here, session still exists - invalidate to refetch all
          queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
        } catch (error) {
          // Session not found (404) - it's been deleted successfully
          // Remove the session from the list
          const currentSessions = queryClient.getQueryData<Session[]>(sessionKeys.list()) || [];
          const updatedSessions = currentSessions.filter((s) => s.id !== sessionId);
          queryClient.setQueryData(sessionKeys.list(), updatedSessions);

          // Remove the specific session from cache
          queryClient.removeQueries({ queryKey: sessionKeys.detail(sessionId) });
        }
      }, 3000);
    },
  });
}

/**
 * Renew/extend a session
 *
 * @example
 * ```tsx
 * const { mutate: renew } = useRenewSession();
 *
 * renew({ sessionId: 'session-123', hours: 2 });
 * ```
 */
export function useRenewSession(
  options?: UseMutationOptions<Session, Error, { sessionId: string; hours: number }>
) {
  const queryClient = useQueryClient();
  const { onSuccess: userOnSuccess, ...restOptions } = options || {};

  return useMutation({
    ...restOptions,
    mutationFn: ({ sessionId, hours }) => renewSession(sessionId, hours),
    onSuccess: (updatedSession, variables, ...rest) => {
      // Immediately update the session in the list with the new expiry time
      const currentSessions = queryClient.getQueryData<Session[]>(sessionKeys.list()) || [];
      const updatedSessions = currentSessions.map((session) =>
        session.id === updatedSession.id
          ? { ...session, expiresTime: updatedSession.expiresTime }
          : session
      );
      queryClient.setQueryData(sessionKeys.list(), updatedSessions);

      // Update the specific session in cache
      queryClient.setQueryData(sessionKeys.detail(updatedSession.id), updatedSession);

      // Call user's onSuccess callback if provided
      userOnSuccess?.(updatedSession, variables, ...rest);
    },
  });
}

/**
 * Poll a specific session until its status changes to Running or Failed
 * Used after launching a new session
 *
 * @example
 * ```tsx
 * const { startPolling, stopPolling } = useSessionPolling('session-123', {
 *   onStatusChange: (session) => console.log('Status changed:', session.status),
 *   onComplete: () => console.log('Polling complete'),
 * });
 *
 * startPolling();
 * ```
 */
export function useSessionPolling(
  sessionId: string | null,
  options?: {
    interval?: number;
    onStatusChange?: (session: Session) => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
  }
) {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { interval = 30000, onStatusChange, onComplete, onError } = options || {};

  // Memoize callbacks to prevent recreating on every render
  const onStatusChangeRef = useRef(onStatusChange);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  }, [onStatusChange, onComplete, onError]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const pollSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      const session = await getSession(sessionId);

      // Update the session in the list
      const currentSessions = queryClient.getQueryData<Session[]>(sessionKeys.list()) || [];
      const updatedSessions = currentSessions.map((s) =>
        s.id === sessionId ? session : s
      );
      queryClient.setQueryData(sessionKeys.list(), updatedSessions);

      // Notify callback
      onStatusChangeRef.current?.(session);

      // Stop polling if status is Running or Failed
      if (session.status === 'Running' || session.status === 'Failed') {
        stopPolling();
        onCompleteRef.current?.();
      }
    } catch (error) {
      console.error('Error polling session:', error);
      onErrorRef.current?.(error as Error);

      // On error, fall back to full sessions refetch
      queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
      stopPolling();
    }
  }, [sessionId, queryClient, stopPolling]);

  const startPolling = useCallback(() => {
    if (!sessionId) return;

    // Wait 30 seconds before first poll (session needs time to start)
    // Then poll at regular intervals
    intervalRef.current = setInterval(pollSession, interval);
  }, [sessionId, pollSession, interval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return { startPolling, stopPolling };
}
