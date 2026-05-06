/**
 * API Route Builder
 *
 * Client calls go through Next.js API routes (`/api/*`). External API base
 * URLs are resolved on the server (`server-config`); browser code only needs
 * `basePath` for same-origin routes, supplied at runtime via
 * `PublicRuntimeConfigProvider` / `useApiRoutes()`.
 */

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
