import { getProcessEnv } from '@/lib/config/safe-process-env';

/**
 * Full URL path to Auth.js handlers (`[...nextauth]`).
 * Must include Next.js `basePath` when the app is not served from `/`.
 */
export function authApiBasePathFromAppBasePath(appBasePath: string): string {
  const p = (appBasePath || '').replace(/\/$/, '');
  return p ? `${p}/api/auth` : '/api/auth';
}

/** Server / build-time: uses `NEXT_PUBLIC_BASE_PATH` from the environment. */
export function getAuthApiBasePathFromEnv(): string {
  return authApiBasePathFromAppBasePath(getProcessEnv('NEXT_PUBLIC_BASE_PATH') || '');
}
