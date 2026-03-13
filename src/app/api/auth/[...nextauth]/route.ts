import { handlers } from '@/auth';
import { NextRequest } from 'next/server';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/**
 * NextAuth API Route Handler
 *
 * This handles all NextAuth routes: /api/auth/signin, /api/auth/callback, etc.
 * Only active when NEXT_USE_CANFAR=false (OIDC mode)
 */

function rewriteRequest(req: NextRequest) {
  const {
    headers,
    nextUrl: { protocol, host, pathname, search },
  } = req;

  const detectedHost = headers.get("x-forwarded-host") ?? host;
  const detectedProtocol = headers.get("x-forwarded-proto") ?? protocol;
  const _protocol = `${detectedProtocol.replace(/:$/, "")}:`;
  const url = new URL(_protocol + "//" + detectedHost + basePath + pathname + search);

  return new NextRequest(url, req);
}

export const GET = async (req: NextRequest) => await handlers.GET(rewriteRequest(req));
export const POST = async (req: NextRequest) => await handlers.POST(rewriteRequest(req));

// export const { GET, POST } = handlers;
