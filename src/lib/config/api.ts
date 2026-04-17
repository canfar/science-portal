/**
 * API Configuration
 *
 * Centralized configuration for API endpoints and settings.
 *
 * NOTE: Client calls should use Next.js API routes (`/api/*`). External API
 * base URLs are resolved on the server (`server-config`); browser code mainly
 * needs `basePath` for same-origin routes, supplied at runtime via
 * `PublicRuntimeConfigProvider` / `buildApiRoutes`.
 */

import { getProcessEnv } from '@/lib/config/safe-process-env';

/**
 * Legacy client config (direct external URLs). Prefer BFF routes; kept for
 * devtools timeout and deprecated helpers.
 */
export const apiConfig = {
  storage: {
    baseUrl: getProcessEnv('NEXT_PUBLIC_SERVICE_STORAGE_API') || '',
    timeout: parseInt(getProcessEnv('NEXT_PUBLIC_API_TIMEOUT') || '30000', 10),
  },
  login: {
    baseUrl: getProcessEnv('NEXT_PUBLIC_LOGIN_API') || '',
    timeout: parseInt(getProcessEnv('NEXT_PUBLIC_API_TIMEOUT') || '30000', 10),
  },
  skaha: {
    baseUrl: getProcessEnv('NEXT_PUBLIC_SKAHA_API') || '',
    timeout: parseInt(getProcessEnv('NEXT_PUBLIC_API_TIMEOUT') || '30000', 10),
  },
  devtools: {
    enabled: getProcessEnv('NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS') === 'true',
  },
} as const;

export function buildApiRoutes(basePath: string) {
  const prefix = basePath || '';
  return {
    auth: {
      login: `${prefix}/api/auth/login`,
      logout: `${prefix}/api/auth/logout`,
      status: `${prefix}/api/auth/status`,
      user: (username: string) => `${prefix}/api/auth/user/${username}`,
      permissions: `${prefix}/api/auth/permissions`,
    },
    sessions: {
      list: `${prefix}/api/sessions`,
      detail: (id: string) => `${prefix}/api/sessions/${id}`,
      launch: `${prefix}/api/sessions`,
      delete: (id: string) => `${prefix}/api/sessions/${id}`,
      renew: (id: string) => `${prefix}/api/sessions/${id}/renew`,
      logs: (id: string) => `${prefix}/api/sessions/${id}/logs`,
      events: (id: string) => `${prefix}/api/sessions/${id}/events`,
      platformLoad: `${prefix}/api/sessions/platform-load`,
      images: `${prefix}/api/sessions/images`,
    },
    storage: {
      quota: (username: string) => `${prefix}/api/storage/quota/${username}`,
      files: (username: string) => `${prefix}/api/storage/files/${username}`,
      raw: (username: string) => `${prefix}/api/storage/raw/${username}`,
    },
  } as const;
}

/** @deprecated Use `useApiRoutes()` or `buildApiRoutes(getRuntimeBasePath())` on the client */
export const apiRoutes = buildApiRoutes(getProcessEnv('NEXT_PUBLIC_BASE_PATH') || '');

// Useful for constructing API route URLs when running in a shared environment.
// This is also set in the next.config.ts file to tell NextJS where to listen.
// @see https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath
// jenkinsd 2026.01.21
//

/**
 * Base fetch configuration for all API calls
 * @deprecated Use native fetch with credentials: 'include' instead
 */
export const defaultFetchConfig: RequestInit = {
  credentials: 'include', // Include cookies for authentication
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Creates a fetch wrapper with timeout
 * @deprecated This is no longer needed for client-side API calls.
 * Client code now calls Next.js API routes which handle timeouts server-side.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = apiConfig.storage.timeout,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...defaultFetchConfig,
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}
