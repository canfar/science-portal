/**
 * Public URL path to Auth.js handlers, including Next.js `basePath`.
 * Use for **client** `SessionProvider` / `fetch` only. Server `auth.ts` must keep
 * `basePath: '/api/auth'` because Auth.js parses `pathname` without the Next prefix.
 */
export function authApiBasePathFromAppBasePath(appBasePath: string): string {
  const p = (appBasePath || '').replace(/\/$/, '');
  return p ? `${p}/api/auth` : '/api/auth';
}
