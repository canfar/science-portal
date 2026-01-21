/**
 * API Configuration
 *
 * Centralized configuration for API endpoints and settings.
 *
 * NOTE: This file is now primarily used for client-side configuration.
 * All API calls from the client should now go through Next.js API routes (/api/*).
 *
 * For server-side API configuration, use:
 * @see /src/app/api/lib/server-config.ts
 */

/**
 * Client-side API configuration
 * These are kept for backward compatibility and development tools
 */
export const apiConfig = {
  storage: {
    baseUrl: process.env.NEXT_PUBLIC_SERVICE_STORAGE_API || '',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
  },
  login: {
    baseUrl: process.env.NEXT_PUBLIC_LOGIN_API || '',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
  },
  skaha: {
    baseUrl: process.env.NEXT_PUBLIC_SKAHA_API || '',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
  },
  devtools: {
    enabled: process.env.NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS === 'true',
  },
} as const;

// Useful for constructing API route URLs when running in a shared environment.
// This is also set in the next.config.ts file to tell NextJS where to listen.
// @see https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath
// jenkinsd 2026.01.21
//
const currentBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/**
 * Next.js API Routes (client calls these)
 * These routes proxy requests to external services server-side
 */
export const apiRoutes = {
  auth: {
    login: `${currentBasePath}/api/auth/login`,
    logout: `${currentBasePath}/api/auth/logout`,
    status: `${currentBasePath}/api/auth/status`,
    user: (username: string) => `${currentBasePath}/api/auth/user/${username}`,
    permissions: `${currentBasePath}/api/auth/permissions`,
  },
  sessions: {
    list: `${currentBasePath}/api/sessions`,
    detail: (id: string) => `${currentBasePath}/api/sessions/${id}`,
    launch: `${currentBasePath}/api/sessions`,
    delete: (id: string) => `${currentBasePath}/api/sessions/${id}`,
    renew: (id: string) => `${currentBasePath}/api/sessions/${id}/renew`,
    logs: (id: string) => `${currentBasePath}/api/sessions/${id}/logs`,
    events: (id: string) => `${currentBasePath}/api/sessions/${id}/events`,
    platformLoad: `${currentBasePath}/api/sessions/platform-load`,
    images: `${currentBasePath}/api/sessions/images`,
  },
  storage: {
    quota: (username: string) => `${currentBasePath}/api/storage/quota/${username}`,
    files: (username: string) => `${currentBasePath}/api/storage/files/${username}`,
    raw: (username: string) => `${currentBasePath}/api/storage/raw/${username}`,
  },
} as const;

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
  timeout: number = apiConfig.storage.timeout
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
