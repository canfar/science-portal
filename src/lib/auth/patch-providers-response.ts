import type { NextRequest } from 'next/server';

import { getProcessEnv } from '@/lib/config/safe-process-env';

function getNormalizedAppBasePath(): string {
  return (getProcessEnv('NEXT_PUBLIC_BASE_PATH') || '').replace(/\/$/, '');
}

/**
 * Auth.js redirect responses often use `Location: https://host/api/auth/...` or
 * `Location: /api/auth/...`, omitting the Next.js app `basePath`. Browsers then
 * hit the wrong URL (e.g. `/api/auth/error` instead of `/my-app/api/auth/error`).
 */
export function patchAuthRedirectLocation(request: NextRequest, response: Response): Response {
  const appBase = getNormalizedAppBasePath();
  if (!appBase) {
    return response;
  }

  const location = response.headers.get('Location');
  if (!location) {
    return response;
  }

  const origin = request.nextUrl.origin;
  let nextLocation: string | undefined;

  if (location.startsWith(`${origin}/api/auth`)) {
    if (!location.startsWith(`${origin}${appBase}/api/auth`)) {
      nextLocation = `${origin}${appBase}${location.slice(origin.length)}`;
    }
  } else if (location.startsWith('/api/auth') && !location.startsWith(`${appBase}/api/auth`)) {
    nextLocation = `${origin}${appBase}${location}`;
  }

  if (nextLocation && nextLocation !== location) {
    const headers = new Headers(response.headers);
    headers.set('Location', nextLocation);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return response;
}

/**
 * Auth.js builds provider signin/callback URLs from `origin + config.basePath`,
 * which drops the Next.js app `basePath`. Rewrite those fields on the
 * `/api/auth/providers` JSON response when the app is mounted under a path.
 */
export async function patchAuthProvidersResponse(
  request: NextRequest,
  response: Response,
): Promise<Response> {
  const appBase = getNormalizedAppBasePath();
  if (!appBase) {
    return response;
  }

  const path = request.nextUrl.pathname;
  if (!path.endsWith('/providers')) {
    return response;
  }

  const ct = response.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    return response;
  }

  const text = await response.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text) as Record<string, unknown>;
  } catch {
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    return new Response(text, { status: response.status, statusText: response.statusText, headers });
  }

  const origin = request.nextUrl.origin;
  const wrongPrefix = `${origin}/api/auth`;
  const rightPrefix = `${origin}${appBase}/api/auth`;

  for (const value of Object.values(data)) {
    if (!value || typeof value !== 'object') {
      continue;
    }
    const prov = value as Record<string, unknown>;
    if (typeof prov.signinUrl === 'string' && prov.signinUrl.startsWith(wrongPrefix)) {
      prov.signinUrl = rightPrefix + prov.signinUrl.slice(wrongPrefix.length);
    }
    if (typeof prov.callbackUrl === 'string' && prov.callbackUrl.startsWith(wrongPrefix)) {
      prov.callbackUrl = rightPrefix + prov.callbackUrl.slice(wrongPrefix.length);
    }
  }

  const headers = new Headers(response.headers);
  headers.delete('content-length');

  return new Response(JSON.stringify(data), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Apply all Auth.js response patches for apps deployed with Next.js `basePath`:
 * redirect `Location` headers, then `/api/auth/providers` JSON body.
 */
export async function patchNextAuthResponse(
  request: NextRequest,
  response: Response,
): Promise<Response> {
  const withLocation = patchAuthRedirectLocation(request, response);
  return patchAuthProvidersResponse(request, withLocation);
}
