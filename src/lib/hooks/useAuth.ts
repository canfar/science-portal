'use client';

/**
 * Unified Authentication Hooks
 *
 * Provides a consistent API for authentication that works with both:
 * - CANFAR custom auth (when NEXT_USE_CANFAR=true)
 * - OIDC via NextAuth (when NEXT_USE_CANFAR=false)
 */

import { useEffect } from 'react';
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import {
  login as canfarLogin,
  logout as canfarLogout,
  getAuthStatus as canfarGetAuthStatus,
  getUserDetails,
  checkPermission,
  type User,
  type LoginCredentials,
  type AuthStatus,
} from '@/lib/api/login';
import { usePublicRuntimeConfig } from '@/lib/providers/PublicRuntimeConfigProvider';

function useAuthBasePath(): string {
  const { basePath } = usePublicRuntimeConfig();
  return basePath || '/';
}

/**
 * Query keys for auth
 */
export const authKeys = {
  all: ['auth'] as const,
  status: () => [...authKeys.all, 'status'] as const,
  oidcBootstrap: () => [...authKeys.all, 'oidc-bootstrap'] as const,
  user: (username: string) => [...authKeys.all, 'user', username] as const,
  permission: (username: string, resource: string, permission: string) =>
    [...authKeys.all, 'permission', username, resource, permission] as const,
};

/**
 * Get current authentication status
 * Works with both CANFAR and OIDC auth
 */
export function useAuthStatus(options?: Omit<UseQueryOptions<AuthStatus>, 'queryKey' | 'queryFn'>) {
  const { data: session, status } = useSession();
  const { useCanfar: isCanfar, basePath } = usePublicRuntimeConfig();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const correctMode = isCanfar ? 'CANFAR' : 'OIDC';
    const storageMode = localStorage.getItem('AUTH_MODE');
    if (storageMode !== correctMode) {
      localStorage.setItem('AUTH_MODE', correctMode);
    }
  }, [isCanfar]);

  // For CANFAR mode, use existing auth status check
  const canfarAuthStatus = useQuery({
    queryKey: authKeys.status(),
    queryFn: () => canfarGetAuthStatus(),
    enabled: isCanfar,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
    ...options,
  });

  type SessionPayload = { user?: unknown; accessToken?: string; expires?: string } | null;

  const sessionBootstrap = useQuery({
    queryKey: authKeys.oidcBootstrap(),
    queryFn: async (): Promise<SessionPayload> => {
      const url = `${basePath || ''}/api/auth/session`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`Session bootstrap failed: ${res.status}`);
      }
      return res.json();
    },
    enabled: !isCanfar && status === 'authenticated',
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  // For OIDC mode, use NextAuth session directly (no React Query wrapper)
  // This ensures immediate updates when session state changes
  useEffect(() => {
    if (isCanfar) {
      return;
    }
    const token = sessionBootstrap.data?.accessToken ?? session?.accessToken;
    if (status === 'authenticated' && token) {
      import('@/lib/auth/token-storage').then(({ saveToken }) => {
        saveToken(token);
      });
    }
  }, [isCanfar, status, sessionBootstrap.data?.accessToken, session?.accessToken]);

  useEffect(() => {
    if (!isCanfar && status === 'unauthenticated') {
      import('@/lib/auth/token-storage').then(({ clearAuth }) => {
        clearAuth();
      });
    }
  }, [isCanfar, status]);

  // In OIDC mode, directly return NextAuth session state (no React Query)
  if (!isCanfar) {
    const oidcSessionReady =
      status === 'authenticated' &&
      sessionBootstrap.isSuccess &&
      typeof sessionBootstrap.data?.accessToken === 'string' &&
      sessionBootstrap.data.accessToken.length > 0 &&
      session?.error !== 'RefreshAccessTokenError';

    let oidcAuthStatus: AuthStatus;
    if (status === 'authenticated' && session?.user) {
      oidcAuthStatus = {
        authenticated: true,
        sessionReady: oidcSessionReady,
        user: {
          username: session.user.username || session.user.email?.split('@')[0] || 'user',
          email: session.user.email || undefined,
          displayName: session.user.name || undefined,
          firstName: session.user.firstName || undefined,
          lastName: session.user.lastName || undefined,
        },
      };
    } else {
      oidcAuthStatus = { authenticated: false, sessionReady: false };
    }

    const isLoading =
      status === 'loading' ||
      (status === 'authenticated' && (sessionBootstrap.isPending || sessionBootstrap.isFetching));

    return {
      data: oidcAuthStatus,
      isLoading,
      isError: sessionBootstrap.isError,
      error: sessionBootstrap.error ?? null,
      refetch: () => Promise.resolve({ data: oidcAuthStatus }),
    } as ReturnType<typeof useQuery<AuthStatus>>;
  }

  return {
    ...canfarAuthStatus,
    data: canfarAuthStatus.data
      ? { ...canfarAuthStatus.data, sessionReady: canfarAuthStatus.data.authenticated }
      : undefined,
  } as ReturnType<typeof useQuery<AuthStatus>>;
}

/**
 * Get user details
 */
export function useUserDetails(
  username: string,
  options?: Omit<UseQueryOptions<User>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: authKeys.user(username),
    queryFn: () => getUserDetails(username),
    enabled: !!username,
    ...options,
  });
}

/**
 * Check user permission
 */
export function usePermission(
  username: string,
  resource: string,
  permission: 'read' | 'write' | 'execute',
  options?: Omit<UseQueryOptions<boolean>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: authKeys.permission(username, resource, permission),
    queryFn: () => checkPermission(username, resource, permission),
    enabled: !!username && !!resource,
    ...options,
  });
}

/**
 * Login mutation
 * Automatically uses the correct auth method based on environment
 */
export function useLogin(options?: UseMutationOptions<User, Error, LoginCredentials>) {
  const queryClient = useQueryClient();
  const { useCanfar: isCanfar } = usePublicRuntimeConfig();
  const callbackBase = useAuthBasePath();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      if (isCanfar) {
        // CANFAR auth
        return canfarLogin(credentials);
      } else {
        // OIDC auth - redirect to NextAuth signin
        // Note: OIDC doesn't use username/password, but we'll trigger the flow
        await nextAuthSignIn('oidc', { callbackUrl: callbackBase });
        // Return a placeholder user as the actual auth happens via redirect
        return {
          username: credentials.username,
        } as User;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.status() });
    },
    ...options,
  });
}

/**
 * Logout mutation
 * Automatically uses the correct auth method based on environment
 */
export function useLogout(options?: UseMutationOptions<void, Error, void>) {
  const queryClient = useQueryClient();
  const { useCanfar: isCanfar } = usePublicRuntimeConfig();
  const callbackBase = useAuthBasePath();

  return useMutation({
    mutationFn: async () => {
      if (isCanfar) {
        // CANFAR logout
        await canfarLogout();
      } else {
        const { clearAuth } = await import('@/lib/auth/token-storage');
        clearAuth();
        await nextAuthSignOut({ callbackUrl: callbackBase });
      }
    },
    onSuccess: () => {
      queryClient.clear();
    },
    ...options,
  });
}

/**
 * Hook to trigger OIDC login
 * Only works in OIDC mode
 */
export function useOIDCLogin() {
  const { useCanfar: isCanfar } = usePublicRuntimeConfig();
  const callbackBase = useAuthBasePath();

  return {
    login: async () => {
      if (!isCanfar) {
        try {
          await nextAuthSignIn('oidc', { callbackUrl: callbackBase });
        } catch (error) {
          console.error('Failed to initiate OIDC login:', error);
          throw error;
        }
      }
    },
    isOIDCMode: !isCanfar,
  };
}

/**
 * Sync auth mode from environment to localStorage on mount
 */
export function useAuthModeSync() {
  const { useCanfar } = usePublicRuntimeConfig();
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('AUTH_MODE', useCanfar ? 'CANFAR' : 'OIDC');
    }
  }, [useCanfar]);
}
