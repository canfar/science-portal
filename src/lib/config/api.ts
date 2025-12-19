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

/**
 * Next.js API Routes (client calls these)
 * These routes proxy requests to external services server-side
 */
export const apiRoutes = {
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    status: '/api/auth/status',
    user: (username: string) => `/api/auth/user/${username}`,
    permissions: '/api/auth/permissions',
  },
  sessions: {
    list: '/api/sessions',
    detail: (id: string) => `/api/sessions/${id}`,
    launch: '/api/sessions',
    delete: (id: string) => `/api/sessions/${id}`,
    renew: (id: string) => `/api/sessions/${id}/renew`,
    logs: (id: string) => `/api/sessions/${id}/logs`,
    events: (id: string) => `/api/sessions/${id}/events`,
    platformLoad: '/api/sessions/platform-load',
    images: '/api/sessions/images',
  },
  storage: {
    quota: (username: string) => `/api/storage/quota/${username}`,
    files: (username: string) => `/api/storage/files/${username}`,
    raw: (username: string) => `/api/storage/raw/${username}`,
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
