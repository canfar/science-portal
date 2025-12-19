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

// Client-side auth mode detection
function isCanfarMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // IMPORTANT: Always use environment variable as source of truth
  const envMode = process.env.NEXT_PUBLIC_USE_CANFAR === 'true';
  const storageMode = localStorage.getItem('AUTH_MODE');
  // Sync localStorage to match environment
  const correctMode = envMode ? 'CANFAR' : 'OIDC';
  if (storageMode !== correctMode) {
    localStorage.setItem('AUTH_MODE', correctMode);
  }

  return envMode;
}

/**
 * Query keys for auth
 */
export const authKeys = {
  all: ['auth'] as const,
  status: () => [...authKeys.all, 'status'] as const,
  user: (username: string) => [...authKeys.all, 'user', username] as const,
  permission: (username: string, resource: string, permission: string) =>
    [...authKeys.all, 'permission', username, resource, permission] as const,
};

/**
 * Get current authentication status
 * Works with both CANFAR and OIDC auth
 */
export function useAuthStatus(
  options?: Omit<UseQueryOptions<AuthStatus>, 'queryKey' | 'queryFn'>
) {
  const { data: session, status } = useSession();
  const isCanfar = isCanfarMode();

  console.log('🔍 useAuthStatus called:', { isCanfar, sessionStatus: status });

  // For CANFAR mode, use existing auth status check
  const canfarAuthStatus = useQuery({
    queryKey: authKeys.status(),
    queryFn: () => {
      console.log('📋 CANFAR mode - calling /api/auth/status (makes API call to /ac/whoami)');
      return canfarGetAuthStatus();
    },
    enabled: isCanfar,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
    ...options,
  });

  // For OIDC mode, use NextAuth session directly (no React Query wrapper)
  // This ensures immediate updates when session state changes
  useEffect(() => {
    if (!isCanfar && status === 'authenticated' && session?.accessToken) {
      // Store the access token in localStorage for API calls
      const { saveToken } = require('@/lib/auth/token-storage');
      saveToken(session.accessToken);
    }
  }, [isCanfar, status, session?.accessToken]);

  // In OIDC mode, directly return NextAuth session state (no React Query)
  if (!isCanfar) {
    const oidcAuthStatus: AuthStatus =
      status === 'authenticated' && session?.user
        ? {
            authenticated: true,
            user: {
              username: session.user.username || session.user.email?.split('@')[0] || 'user',
              email: session.user.email || undefined,
              displayName: session.user.name || undefined,
              firstName: session.user.firstName || undefined,
              lastName: session.user.lastName || undefined,
            },
          }
        : { authenticated: false };

    console.log('🔍 useAuthStatus returning (OIDC):', {
      isLoading: status === 'loading',
      isAuthenticated: oidcAuthStatus.authenticated,
      username: oidcAuthStatus.user?.username,
    });

    // Return in React Query format for compatibility
    return {
      data: oidcAuthStatus,
      isLoading: status === 'loading',
      isError: false,
      error: null,
      refetch: () => Promise.resolve({ data: oidcAuthStatus } as any),
    } as any;
  }

  // CANFAR mode uses React Query
  console.log('🔍 useAuthStatus returning (CANFAR):', {
    isLoading: canfarAuthStatus.isLoading,
    isAuthenticated: canfarAuthStatus.data?.authenticated,
  });

  return canfarAuthStatus;
}

/**
 * Get user details
 */
export function useUserDetails(
  username: string,
  options?: Omit<UseQueryOptions<User>, 'queryKey' | 'queryFn'>
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
  options?: Omit<UseQueryOptions<boolean>, 'queryKey' | 'queryFn'>
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
  const isCanfar = isCanfarMode();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      if (isCanfar) {
        // CANFAR auth
        return canfarLogin(credentials);
      } else {
        // OIDC auth - redirect to NextAuth signin
        // Note: OIDC doesn't use username/password, but we'll trigger the flow
        await nextAuthSignIn('oidc', { callbackUrl: '/science-portal' });
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
  const isCanfar = isCanfarMode();

  return useMutation({
    mutationFn: async () => {
      if (isCanfar) {
        // CANFAR logout
        await canfarLogout();
      } else {
        // OIDC logout - use NextAuth signOut
        await nextAuthSignOut({ callbackUrl: '/science-portal' });
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
  const isCanfar = isCanfarMode();

  return {
    login: async () => {
      if (!isCanfar) {
        try {
          await nextAuthSignIn('oidc', { callbackUrl: '/science-portal' });
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
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const envMode = process.env.NEXT_PUBLIC_USE_CANFAR === 'true' ? 'CANFAR' : 'OIDC';
      localStorage.setItem('AUTH_MODE', envMode);
    }
  }, []);
}
