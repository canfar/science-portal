import type { NextRequest } from 'next/server';

import { getProcessEnv } from '@/lib/config/safe-process-env';

/**
 * Auth.js builds provider signin/callback URLs from `origin + config.basePath`,
 * which drops the Next.js app `basePath`. Rewrite those fields on the
 * `/api/auth/providers` JSON response when the app is mounted under a path.
 */
export async function patchAuthProvidersResponse(
  request: NextRequest,
  response: Response,
): Promise<Response> {
  const appBase = (getProcessEnv('NEXT_PUBLIC_BASE_PATH') || '').replace(/\/$/, '');
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
